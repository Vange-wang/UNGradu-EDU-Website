import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
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
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
].find((candidate): candidate is string => Boolean(candidate && existsSync(candidate)));
const describeWithBrowser = browserPath ? describe : describe.skip;
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

type CdpResponse = {
  error?: { message: string };
  id?: number;
  result?: unknown;
};

class CdpClient {
  private nextId = 1;
  private readonly pending = new Map<
    number,
    { reject: (error: Error) => void; resolve: (value: unknown) => void }
  >();

  constructor(private readonly socket: WebSocketClient) {
    socket.on("message", (data) => {
      const message = JSON.parse(data.toString()) as CdpResponse;

      if (!message.id) {
        return;
      }

      const request = this.pending.get(message.id);

      if (!request) {
        return;
      }

      this.pending.delete(message.id);

      if (message.error) {
        request.reject(new Error(message.error.message));
        return;
      }

      request.resolve(message.result);
    });
  }

  close() {
    this.socket.close();
  }

  send(method: string, params: Record<string, unknown> = {}) {
    const id = this.nextId;
    this.nextId += 1;

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

async function readDevToolsPort(profileDirectory: string) {
  const portFile = path.join(profileDirectory, "DevToolsActivePort");

  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const [port] = (await readFile(portFile, "utf8")).trim().split(/\r?\n/);

      if (port) {
        return Number(port);
      }
    } catch {
      await delay(50);
    }
  }

  throw new Error("Chrome DevTools 端口未在预期时间内就绪。");
}

function readRuntimeValue<T>(result: unknown) {
  return (result as { result?: { value?: T } }).result?.value;
}

async function reservePort() {
  const server = createServer();

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("无法预留 Next.js 测试端口。");
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  return address.port;
}

describeWithBrowser("真实共享 Header 访问轨迹返回", () => {
  let baseUrl = "";
  let browserProcess: ReturnType<typeof spawn>;
  let cdp: CdpClient;
  let nextProcess: ReturnType<typeof spawn>;
  let profileDirectory = "";

  async function evaluate<T>(expression: string) {
    return readRuntimeValue<T>(
      await cdp.send("Runtime.evaluate", {
        awaitPromise: true,
        expression,
        returnByValue: true
      })
    );
  }

  async function waitFor(expression: string, message: string) {
    for (let attempt = 0; attempt < 400; attempt += 1) {
      if (await evaluate<boolean>(`Boolean(${expression})`)) {
        return;
      }

      await delay(50);
    }

    const state = await evaluate<string>(`JSON.stringify({
      href: document.querySelector(".site-back-link")?.getAttribute("href") ?? null,
      pathname: location.pathname,
      trail: JSON.parse(
        sessionStorage.getItem("ungradu:navigation-trail:v1") || "{\\"paths\\":[]}"
      ).paths
    })`);

    throw new Error(`${message}；state=${state}`);
  }

  async function navigate(pathname: string) {
    await cdp.send("Page.navigate", { url: `${baseUrl}${pathname}` });
    await waitFor(
      `document.readyState === "complete" && location.pathname === ${JSON.stringify(
        pathname
      )}`,
      `页面未完成导航：${pathname}`
    );
    await waitFor(
      `document.querySelector(".site-header")`,
      `共享 Header 未渲染：${pathname}`
    );
    await waitFor(
      `history.state?.__ungraduNavigationTabId &&
        sessionStorage.getItem("ungradu:navigation-trail:v1")`,
      `访问轨迹 Hook 未完成初始化：${pathname}`
    );
  }

  async function readTrailPaths() {
    return evaluate<string[]>(
      `JSON.parse(sessionStorage.getItem("ungradu:navigation-trail:v1") || "{\\"paths\\":[]}").paths`
    );
  }

  beforeAll(async () => {
    if (!browserPath) {
      throw new Error("未找到 Chrome/Edge，无法执行真实 Header 交互回归。");
    }

    const port = await reservePort();
    baseUrl = `http://127.0.0.1:${port}`;
    const nextBin = path.join(
      process.cwd(),
      "node_modules",
      "next",
      "dist",
      "bin",
      "next"
    );
    nextProcess = spawn(
      process.execPath,
      [nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(port)],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          APP_ENV: "test",
          AUTH_SESSION_SECRET: "navigation-browser-test-secret",
          NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true"
        },
        stdio: "ignore",
        windowsHide: true
      }
    );

    for (let attempt = 0; attempt < 300; attempt += 1) {
      try {
        const response = await fetch(baseUrl);

        if (response.ok) {
          break;
        }
      } catch {
        await delay(100);
      }

      if (attempt === 299) {
        throw new Error("Next.js 测试服务未在预期时间内就绪。");
      }
    }

    await Promise.all(
      ["/profile", "/profile/parent-needs", "/parent-needs/new"].map(
        async (pathname) => {
          const response = await fetch(`${baseUrl}${pathname}`);

          if (!response.ok) {
            throw new Error(`无法预热导航测试页面：${pathname}`);
          }
        }
      )
    );

    profileDirectory = await mkdtemp(
      path.join(tmpdir(), "navigation-trail-chrome-")
    );
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
    const targetResponse = await fetch(
      `http://127.0.0.1:${devToolsPort}/json/new?${encodeURIComponent(
        "about:blank"
      )}`,
      { method: "PUT" }
    );
    const target = (await targetResponse.json()) as {
      webSocketDebuggerUrl?: string;
    };

    if (!target.webSocketDebuggerUrl) {
      throw new Error("Chrome 调试页未返回 WebSocket 地址。");
    }

    cdp = await connectCdp(target.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
  }, 60_000);

  afterAll(async () => {
    if (cdp) {
      void cdp.send("Browser.close").catch(() => undefined);
      cdp.close();
    }

    if (browserProcess && browserProcess.exitCode === null) {
      browserProcess.kill();
    }

    if (nextProcess && nextProcess.exitCode === null) {
      nextProcess.kill();
    }

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

  it("returns a home CTA directly to home without re-adding the publishing page", async () => {
    await navigate("/");
    const loginOk = await evaluate<boolean>(`fetch("/api/auth/test-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: "13800138000", code: "000000" })
    }).then((response) => response.ok)`);

    expect(loginOk).toBe(true);
    await navigate("/");
    await waitFor(
      `Array.from(document.querySelectorAll("button")).some(
        (button) => button.textContent?.trim() === "我要找家教" && !button.disabled
      )`,
      "首页“我要找家教”按钮未进入可点击状态。"
    );
    await evaluate(`Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "我要找家教"
    ).click()`);
    await waitFor(
      `location.pathname === "/parent-needs/new"`,
      "首页发布入口未进入发布需求页。"
    );
    await waitFor(
      `document.querySelector(".site-back-link")?.getAttribute("href") === "/"`,
      "发布需求页未计算出真实来源首页。"
    );
    await evaluate(`document.querySelector(".site-back-link").click()`);
    await waitFor(`location.pathname === "/"`, "Header 未直接返回首页。");

    expect(await readTrailPaths()).toEqual(["/"]);
  }, 30_000);

  it("monotonically consumes A to B to C to D through real Header clicks", async () => {
    await navigate("/");
    const loginOk = await evaluate<boolean>(`fetch("/api/auth/test-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: "13800138000", code: "000000" })
    }).then((response) => response.ok)`);

    expect(loginOk).toBe(true);
    await navigate("/");
    await waitFor(
      `document.querySelector('.top-nav a[href="/profile"]')`,
      "首页未渲染个人页入口。"
    );
    await evaluate(`document.querySelector('.top-nav a[href="/profile"]').click()`);
    await waitFor(`location.pathname === "/profile"`, "未进入个人页。");
    await waitFor(
      `document.querySelector(".site-back-link")?.getAttribute("href") === "/"`,
      "B 页未记录 A。"
    );
    await waitFor(
      `document.querySelector('a[href="/profile/parent-needs"]')`,
      "个人页未渲染“我发布的需求”入口。"
    );
    await evaluate(
      `document.querySelector('a[href="/profile/parent-needs"]').click()`
    );
    await waitFor(
      `location.pathname === "/profile/parent-needs"`,
      "未进入我发布的需求。"
    );
    await waitFor(
      `document.querySelector(".site-back-link")?.getAttribute("href") === "/profile"`,
      "C 页未记录 B。"
    );
    await waitFor(
      `document.querySelector('a[href="/parent-needs/new"]')`,
      "我的需求页未渲染发布新需求入口。"
    );
    await evaluate(`document.querySelector('a[href="/parent-needs/new"]').click()`);
    await waitFor(
      `location.pathname === "/parent-needs/new"`,
      "未进入发布家教需求。"
    );
    await waitFor(
      `document.querySelector(".site-back-link")?.getAttribute("href") === "/profile/parent-needs"`,
      "D 页未记录 C。"
    );

    const expectedSteps = [
      {
        nextHref: "/profile",
        path: "/profile/parent-needs",
        paths: ["/", "/profile", "/profile/parent-needs"]
      },
      { nextHref: "/", path: "/profile", paths: ["/", "/profile"] },
      { nextHref: null, path: "/", paths: ["/"] }
    ];

    for (const expected of expectedSteps) {
      await evaluate(`document.querySelector(".site-back-link").click()`);
      await waitFor(
        `location.pathname === ${JSON.stringify(expected.path)}`,
        `Header 未返回：${expected.path}`
      );
      expect(await readTrailPaths()).toEqual(expected.paths);

      if (expected.nextHref) {
        await waitFor(
          `document.querySelector(".site-back-link")?.getAttribute("href") === ${JSON.stringify(
            expected.nextHref
          )}`,
          `Header 未准备好下一层返回：${expected.nextHref}`
        );
      }
    }
  }, 90_000);
});
