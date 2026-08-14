import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const browserPath = [
  process.env.CHROME_BIN,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
].find((candidate): candidate is string => Boolean(candidate && existsSync(candidate)));
const describeWithBrowser = browserPath ? describe : describe.skip;

function attachDiagnosticNextLogs(nextProcess: ChildProcess, label: string) {
  const directory = process.env.ISSUE_0034_DIAGNOSTIC_LOG_DIR;
  if (!directory) return;

  const stdoutPath = path.join(directory, `${label}.next.stdout.log`);
  const stderrPath = path.join(directory, `${label}.next.stderr.log`);
  try {
    writeFileSync(stdoutPath, "", { encoding: "utf8" });
    writeFileSync(stderrPath, "", { encoding: "utf8" });
    nextProcess.stdout?.on("data", (chunk) => appendFileSync(stdoutPath, chunk));
    nextProcess.stderr?.on("data", (chunk) => appendFileSync(stderrPath, chunk));
  } catch {
    // The diagnostic harness records the failure separately if the directory is unavailable.
  }
}
const require = createRequire(import.meta.url);

type WebSocketClient = {
  close: () => void;
  on: {
    (event: "open", listener: () => void): void;
    (event: "message", listener: (data: { toString: () => string }) => void): void;
    (event: "error", listener: (error: Error) => void): void;
  };
  send: (data: string) => void;
};

type WebSocketConstructor = new (url: string) => WebSocketClient;
const WebSocketClient = require("ws") as WebSocketConstructor;

type CdpMessage = {
  error?: { message: string };
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
};

class CdpClient {
  private nextId = 1;
  private readonly listeners = new Map<
    string,
    Array<(params: Record<string, unknown>) => void>
  >();
  private readonly pending = new Map<
    number,
    { reject: (error: Error) => void; resolve: (value: unknown) => void }
  >();

  constructor(private readonly socket: WebSocketClient) {
    socket.on("message", (data) => {
      const message = JSON.parse(data.toString()) as CdpMessage;

      if (message.id) {
        const request = this.pending.get(message.id);
        if (!request) return;
        this.pending.delete(message.id);
        if (message.error) {
          request.reject(new Error(message.error.message));
        } else {
          request.resolve(message.result);
        }
        return;
      }

      if (message.method && message.params) {
        this.listeners.get(message.method)?.forEach((listener) => listener(message.params!));
      }
    });
  }

  close() {
    this.socket.close();
  }

  on(method: string, listener: (params: Record<string, unknown>) => void) {
    const listeners = this.listeners.get(method) ?? [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  send(method: string, params: Record<string, unknown> = {}) {
    const id = this.nextId++;
    return new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { reject, resolve });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
}

async function connectCdp(url: string) {
  const socket = new WebSocketClient(url);
  await new Promise<void>((resolve, reject) => {
    socket.on("open", resolve);
    socket.on("error", reject);
  });
  return new CdpClient(socket);
}

async function reservePort() {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("无法预留测试端口");
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
  return address.port;
}

async function readDevToolsPort(profileDirectory: string) {
  const portFile = path.join(profileDirectory, "DevToolsActivePort");
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const [port] = (await readFile(portFile, "utf8")).trim().split(/\r?\n/);
      if (port) return Number(port);
    } catch {
      await delay(50);
    }
  }
  throw new Error("浏览器调试端口未就绪");
}

function terminateProcessTree(processId: number | undefined) {
  if (!processId) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(processId), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true
    });
    return;
  }
  try {
    process.kill(processId, "SIGTERM");
  } catch {
    // Process already exited.
  }
}

describeWithBrowser("ISSUE-0033 publishing submit browser contract", () => {
  let baseUrl = "";
  let browserProcess: ChildProcess | undefined;
  let cdp: CdpClient;
  let nextProcess: ChildProcess | undefined;
  let profileDirectory = "";
  let apiMode: "failure" | "success" = "success";
  let apiDelayMs = 0;
  let sessionDelayMs = 0;
  const requests: Array<{ method: string; type: string; url: string }> = [];

  const jsonBody = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64");

  async function evaluate<T>(expression: string) {
    const result = (await cdp.send("Runtime.evaluate", {
      awaitPromise: true,
      expression,
      returnByValue: true
    })) as { result?: { value?: T } };
    return result.result?.value;
  }

  async function waitFor(expression: string, message: string, timeoutMs = 10_000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await evaluate<boolean>(expression)) return;
      await delay(50);
    }
    throw new Error(message);
  }

  async function navigate(pathname: string) {
    await cdp.send("Page.navigate", { url: `${baseUrl}${pathname}` });
    await waitFor(
      `document.querySelector(".step-form") && document.readyState === "complete"`,
      `发布表单未就绪：${pathname}`
    );
    await waitFor(
      `!document.querySelector("[data-submit-action]").disabled`,
      `发布按钮未启用：${pathname}`
    );
  }

  async function fillParentForm() {
    await evaluate(`(() => {
      const setValue = (selector, value) => {
        const element = document.querySelector(selector);
        const descriptor = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(element),
          "value"
        );
        descriptor.set.call(element, value);
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      };
      const choose = (legend, text) => {
        const fieldset = Array.from(document.querySelectorAll("fieldset"))
          .find((node) => node.querySelector("legend")?.textContent?.includes(legend));
        const label = Array.from(fieldset.querySelectorAll("label"))
          .find((node) => node.textContent.trim() === text);
        if (!label.querySelector("input").checked) label.querySelector("input").click();
      };
      setValue("#grade", "初一");
      setValue("#budget-min", "88");
      setValue("#budget-max", "108");
      setValue("#community", "合成测试位置-browser-contract");
      setValue("#child-intro", "合成测试需求，仅用于浏览器提交契约。所有内容均为虚构。");
      choose("所需科目", "数学");
      choose("可上课时间段", "周六上午");
    })()`);
  }

  async function fillTutorForm() {
    await evaluate(`(() => {
      const setValue = (selector, value) => {
        const element = document.querySelector(selector);
        const descriptor = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(element),
          "value"
        );
        descriptor.set.call(element, value);
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      };
      const choose = (legend, text) => {
        const fieldset = Array.from(document.querySelectorAll("fieldset"))
          .find((node) => node.querySelector("legend")?.textContent?.includes(legend));
        const label = Array.from(fieldset.querySelectorAll("label"))
          .find((node) => node.textContent.trim() === text);
        if (!label.querySelector("input").checked) label.querySelector("input").click();
      };
      setValue("#school", "合成测试大学");
      setValue("#major", "数学教育");
      setValue("#fee-grade-0", "初中");
      setValue("#fee-subject-0", "数学");
      setValue("#fee-min-0", "88");
      setValue("#fee-max-0", "108");
      setValue("#ability-description", "合成教学能力说明，仅用于浏览器提交契约。");
      choose("可教科目", "数学");
      choose("可教学段", "初中");
      choose("可上课时间段", "周六上午");
    })()`);
  }

  async function clickSubmitWithPointer() {
    const point = await evaluate<{ x: number; y: number }>(`(() => {
      const button = document.querySelector("[data-submit-action]");
      button.scrollIntoView({ block: "center" });
      const rect = button.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    if (!point) throw new Error("未取得发布按钮坐标");
    await cdp.send("Input.dispatchMouseEvent", {
      button: "left",
      clickCount: 1,
      type: "mousePressed",
      x: point.x,
      y: point.y
    });
    await cdp.send("Input.dispatchMouseEvent", {
      button: "left",
      clickCount: 1,
      type: "mouseReleased",
      x: point.x,
      y: point.y
    });
  }

  async function pressEnterIn(selector: string) {
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
    await cdp.send("Input.dispatchKeyEvent", {
      code: "Enter",
      key: "Enter",
      nativeVirtualKeyCode: 13,
      type: "rawKeyDown",
      windowsVirtualKeyCode: 13
    });
    await cdp.send("Input.dispatchKeyEvent", {
      code: "Enter",
      key: "Enter",
      text: "\r",
      type: "char",
      unmodifiedText: "\r"
    });
    await cdp.send("Input.dispatchKeyEvent", {
      code: "Enter",
      key: "Enter",
      type: "keyUp",
      windowsVirtualKeyCode: 13
    });
  }

  function resetRequestEvidence() {
    requests.length = 0;
  }

  beforeAll(async () => {
    if (!browserPath) throw new Error("未找到 Chrome/Edge");
    const port = await reservePort();
    baseUrl = `http://127.0.0.1:${port}`;
    const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
    nextProcess = spawn(
      process.execPath,
      [nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(port)],
      {
        cwd: process.cwd(),
        env: { ...process.env, APP_ENV: "test" },
        stdio: process.env.ISSUE_0034_DIAGNOSTIC_LOG_DIR
          ? ["ignore", "pipe", "pipe"]
          : "ignore",
        windowsHide: true
      }
    );
    attachDiagnosticNextLogs(nextProcess, "submit-hydration");
    for (let attempt = 0; attempt < 400; attempt += 1) {
      try {
        if ((await fetch(baseUrl)).ok) break;
      } catch {
        // Keep polling.
      }
      if (attempt === 399) throw new Error("Next.js 服务未就绪");
      await delay(100);
    }

    profileDirectory = await mkdtemp(path.join(tmpdir(), "issue0033-submit-browser-"));
    browserProcess = spawn(
      browserPath,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--remote-debugging-port=0",
        `--user-data-dir=${profileDirectory}`,
        "about:blank"
      ],
      { stdio: "ignore", windowsHide: true }
    );
    const devToolsPort = await readDevToolsPort(profileDirectory);
    const target = (await (
      await fetch(`http://127.0.0.1:${devToolsPort}/json/new?about:blank`, {
        method: "PUT"
      })
    ).json()) as { webSocketDebuggerUrl?: string };
    if (!target.webSocketDebuggerUrl) throw new Error("未取得浏览器 WebSocket");
    cdp = await connectCdp(target.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Network.enable");
    await cdp.send("Fetch.enable", {
      patterns: [
        { urlPattern: "*/api/auth/session*", requestStage: "Request" },
        { urlPattern: "*/api/auth/csrf*", requestStage: "Request" },
        { urlPattern: "*/api/parent-needs*", requestStage: "Request" },
        { urlPattern: "*/api/tutor-profiles*", requestStage: "Request" }
      ]
    });
    cdp.on("Network.requestWillBeSent", (params) => {
      const request = params.request as { method: string; url: string };
      requests.push({ method: request.method, type: String(params.type), url: request.url });
    });
    cdp.on("Fetch.requestPaused", (params) => {
      void (async () => {
        const requestId = String(params.requestId);
        const request = params.request as { method: string; url: string };
        const url = new URL(request.url);
        if (url.pathname === "/api/auth/csrf") {
          await cdp.send("Fetch.fulfillRequest", {
            body: jsonBody({
              errors: {},
              ok: true,
              value: { proof: "synthetic-browser-csrf-proof" }
            }),
            responseCode: 200,
            responseHeaders: [{ name: "content-type", value: "application/json" }],
            requestId
          });
          return;
        }
        if (url.pathname === "/api/auth/session") {
          await delay(sessionDelayMs);
          await cdp.send("Fetch.fulfillRequest", {
            body: jsonBody({
              errors: {},
              ok: true,
              value: { createdAt: "2026-08-04T00:00:00.000Z", userId: "synthetic-owner" }
            }),
            responseCode: 200,
            responseHeaders: [{ name: "content-type", value: "application/json" }],
            requestId
          });
          return;
        }
        if (
          request.method === "POST" &&
          (url.pathname === "/api/parent-needs" || url.pathname === "/api/tutor-profiles")
        ) {
          await delay(apiDelayMs);
          const failed = apiMode === "failure";
          await cdp.send("Fetch.fulfillRequest", {
            body: jsonBody(
              failed
                ? { errors: { request: "合成 API 失败" }, ok: false, value: null }
                : { errors: {}, ok: true, value: { id: "synthetic-created", version: 1 } }
            ),
            responseCode: failed ? 503 : 200,
            responseHeaders: [{ name: "content-type", value: "application/json" }],
            requestId
          });
          return;
        }
        await cdp.send("Fetch.continueRequest", { requestId });
      })();
    });
  }, 120_000);

  afterAll(async () => {
    if (cdp) {
      void cdp.send("Browser.close").catch(() => undefined);
      cdp.close();
    }
    if (browserProcess?.exitCode === null) browserProcess.kill();
    terminateProcessTree(nextProcess?.pid);
    await delay(250);
    if (profileDirectory) {
      await rm(profileDirectory, {
        force: true,
        maxRetries: 10,
        recursive: true,
        retryDelay: 100
      });
    }
  });

  it("sends exactly one parent POST without document navigation", async () => {
    apiMode = "success";
    apiDelayMs = 0;
    sessionDelayMs = 0;
    await navigate("/parent-needs/new");
    await fillParentForm();
    resetRequestEvidence();
    await clickSubmitWithPointer();
    await waitFor(
      `Boolean(document.querySelector(".submit-section [role=status]"))`,
      "发布成功状态未显示"
    );
    const posts = requests.filter(
      (request) => request.method === "POST" && new URL(request.url).pathname === "/api/parent-needs"
    );
    const documents = requests.filter(
      (request) => request.method === "GET" && request.type === "Document"
    );
    expect(posts).toHaveLength(1);
    expect(documents).toHaveLength(0);
  });

  it("submits the parent form exactly once with Enter and never performs document GET", async () => {
    apiMode = "success";
    apiDelayMs = 0;
    sessionDelayMs = 0;
    await navigate("/parent-needs/new");
    await fillParentForm();
    resetRequestEvidence();
    await pressEnterIn("#community");
    await waitFor(
      `Boolean(document.querySelector(".submit-section [role=status]"))`,
      "家长表单按 Enter 后未显示发布成功状态"
    );
    const posts = requests.filter(
      (request) => request.method === "POST" && new URL(request.url).pathname === "/api/parent-needs"
    );
    const documents = requests.filter(
      (request) => request.method === "GET" && request.type === "Document"
    );
    expect(posts).toHaveLength(1);
    expect(documents).toHaveLength(0);
  });

  it("fails closed before the parent form client runtime hydrates", async () => {
    await cdp.send("Emulation.setScriptExecutionDisabled", { value: true });
    try {
      await cdp.send("Page.navigate", { url: `${baseUrl}/parent-needs/new` });
      await waitFor(
        `location.pathname === "/parent-needs/new" && document.readyState === "complete"`,
        "家长发布页的未 hydration 文档未加载"
      );
      expect(
        await evaluate<boolean>(`(() => {
          const button = document.querySelector("[data-submit-action]");
          return !button || button.disabled;
        })()`)
      ).toBe(true);
      resetRequestEvidence();
      await delay(500);
    } finally {
      await cdp.send("Emulation.setScriptExecutionDisabled", { value: false });
    }
    const posts = requests.filter(
      (request) => request.method === "POST" && new URL(request.url).pathname === "/api/parent-needs"
    );
    const documents = requests.filter(
      (request) => request.method === "GET" && request.type === "Document"
    );
    expect(posts).toHaveLength(0);
    expect(documents).toHaveLength(0);
  });

  it("sends exactly one tutor POST without document navigation", async () => {
    apiMode = "success";
    apiDelayMs = 0;
    sessionDelayMs = 0;
    await navigate("/tutor-profiles/new");
    await fillTutorForm();
    resetRequestEvidence();
    await clickSubmitWithPointer();
    await waitFor(
      `Boolean(document.querySelector(".submit-section [role=status]"))`,
      "家教信息发布成功状态未显示"
    );
    const posts = requests.filter(
      (request) => request.method === "POST" && new URL(request.url).pathname === "/api/tutor-profiles"
    );
    const documents = requests.filter(
      (request) => request.method === "GET" && request.type === "Document"
    );
    expect(posts).toHaveLength(1);
    expect(documents).toHaveLength(0);
  });

  it("submits the tutor form exactly once with Enter and never performs document GET", async () => {
    apiMode = "success";
    apiDelayMs = 0;
    sessionDelayMs = 0;
    await navigate("/tutor-profiles/new");
    await fillTutorForm();
    resetRequestEvidence();
    await pressEnterIn("#school");
    await waitFor(
      `Boolean(document.querySelector(".submit-section [role=status]"))`,
      "老师表单按 Enter 后未显示发布成功状态"
    );
    const posts = requests.filter(
      (request) => request.method === "POST" && new URL(request.url).pathname === "/api/tutor-profiles"
    );
    const documents = requests.filter(
      (request) => request.method === "GET" && request.type === "Document"
    );
    expect(posts).toHaveLength(1);
    expect(documents).toHaveLength(0);
  });

  it("fails closed before the tutor form client runtime hydrates", async () => {
    await cdp.send("Emulation.setScriptExecutionDisabled", { value: true });
    try {
      await cdp.send("Page.navigate", { url: `${baseUrl}/tutor-profiles/new` });
      await waitFor(
        `location.pathname === "/tutor-profiles/new" && document.readyState === "complete"`,
        "老师发布页的未 hydration 文档未加载"
      );
      expect(
        await evaluate<boolean>(`(() => {
          const button = document.querySelector("[data-submit-action]");
          return !button || button.disabled;
        })()`)
      ).toBe(true);
      resetRequestEvidence();
      await delay(500);
    } finally {
      await cdp.send("Emulation.setScriptExecutionDisabled", { value: false });
    }
    const posts = requests.filter(
      (request) => request.method === "POST" && new URL(request.url).pathname === "/api/tutor-profiles"
    );
    const documents = requests.filter(
      (request) => request.method === "GET" && request.type === "Document"
    );
    expect(posts).toHaveLength(0);
    expect(documents).toHaveLength(0);
  });

  it("keeps publishing unavailable while the session is still loading", async () => {
    for (const pathname of ["/parent-needs/new", "/tutor-profiles/new"]) {
      sessionDelayMs = 1500;
      await cdp.send("Page.navigate", { url: `${baseUrl}${pathname}` });
      await waitFor(
        `location.pathname === ${JSON.stringify(pathname)} && document.readyState === "complete"`,
        `慢会话页面未加载：${pathname}`
      );
      const unavailable = await evaluate<boolean>(`(() => {
        const button = document.querySelector("[data-submit-action]");
        return !button || button.disabled;
      })()`);
      expect(unavailable).toBe(true);
      await waitFor(
        `document.querySelector("[data-submit-action]") && !document.querySelector("[data-submit-action]").disabled`,
        `会话完成后按钮未启用：${pathname}`,
        5000
      );
      sessionDelayMs = 0;
    }
  });

  it("shows a persistent nearby error and suppresses duplicate failed submissions", async () => {
    const cases = [
      { fill: fillParentForm, pathname: "/parent-needs/new", postPath: "/api/parent-needs" },
      { fill: fillTutorForm, pathname: "/tutor-profiles/new", postPath: "/api/tutor-profiles" }
    ];

    for (const testCase of cases) {
      apiMode = "failure";
      apiDelayMs = 500;
      sessionDelayMs = 0;
      await navigate(testCase.pathname);
      await testCase.fill();
      resetRequestEvidence();
      await evaluate(`document.querySelector("[data-submit-action]").click()`);
      await delay(30);
      expect(await evaluate<boolean>(`document.querySelector("[data-submit-action]").disabled`)).toBe(true);
      await evaluate(`document.querySelector("[data-submit-action]").click()`);
      await waitFor(
        `document.querySelector(".submit-section [role=alert]")?.textContent?.includes("合成 API 失败")`,
        `按钮附近未显示 API 错误：${testCase.pathname}`
      );
      await delay(200);
      const posts = requests.filter(
        (request) => request.method === "POST" && new URL(request.url).pathname === testCase.postPath
      );
      const documents = requests.filter(
        (request) => request.method === "GET" && request.type === "Document"
      );
      const errorState = await evaluate<{ live: string | null; role: string | null; text: string }>(`(() => {
        const error = document.querySelector(".submit-section [role=alert]");
        return {
          live: error?.getAttribute("aria-live") || null,
          role: error?.getAttribute("role") || null,
          text: error?.textContent?.trim() || ""
        };
      })()`);
      expect(posts).toHaveLength(1);
      expect(documents).toHaveLength(0);
      expect(errorState).toMatchObject({
        live: "assertive",
        role: "alert",
        text: "合成 API 失败"
      });
      apiMode = "success";
      apiDelayMs = 0;
    }
  });
});
