import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { CustomerServiceChat } from "@/features/customer-service/customer-service-chat";

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
(globalThis as typeof globalThis & { React: typeof React }).React = React;

type LayoutMetrics = {
  chatClientHeight: number;
  composeContained: boolean;
  documentScrollWidth: number;
  listCanScroll: boolean;
  listClientHeight: number;
  listScrollHeight: number;
  messagesBeforeQuickQuestions: boolean;
  overflowY: string;
  pageClientWidth: number;
  pageScrollWidth: number;
  quickQuestionsBeforeCompose: boolean;
  viewportHeight: number;
  viewportWidth: number;
};

function renderFixture(css: string, messageCount: number) {
  const chat = renderToStaticMarkup(React.createElement(CustomerServiceChat));

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>${css}</style>
  </head>
  <body>
    <main>
      <div class="page dplus-chat-page">
        <section class="wide-panel customer-service-page">
          <div class="workspace-header">
            <div><span class="eyebrow">智能客服</span><h1>先问清规则</h1></div>
          </div>
          <div class="customer-service-layout">
            <aside class="customer-service-side"><h2>平台客服助手</h2></aside>
            <div class="customer-service-main">${chat}</div>
          </div>
        </section>
      </div>
    </main>
    <script>
      (() => {
        const list = document.querySelector(".customer-service-messages");
        const template = list.firstElementChild;
        for (let index = 1; index < ${messageCount}; index += 1) {
          const message = template.cloneNode(true);
          message.className =
            index % 2 === 0
              ? "customer-service-message"
              : "customer-service-message customer-service-message-user";
          message.querySelector("p").textContent =
            index % 7 === 0
              ? "第 " + (index + 1) + " 条较长客服消息：" +
                "用于验证长消息不会撑破智能客服布局。".repeat(10)
              : "第 " + (index + 1) + " 条智能客服布局回归消息";
          list.appendChild(message);
        }
      })();
    </script>
  </body>
</html>`;
}

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

describeWithBrowser("真实智能客服消息区域布局", () => {
  let baseUrl = "";
  let css = "";
  let server: ReturnType<typeof createServer>;

  beforeAll(async () => {
    css = await readFile(path.join(process.cwd(), "app", "globals.css"), "utf8");
    server = createServer((request, response) => {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      const messageCount = Number(requestUrl.searchParams.get("messages") ?? "3");
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(renderFixture(css, messageCount));
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("无法启动智能客服布局回归测试服务。");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  async function measure(messageCount: number, width: number, height: number) {
    if (!browserPath) {
      throw new Error("未找到 Chrome/Edge，无法执行智能客服布局回归。");
    }

    const profileDirectory = await mkdtemp(
      path.join(tmpdir(), "customer-service-layout-chrome-")
    );
    const browserProcess = spawn(
      browserPath,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-first-run",
        "--remote-debugging-port=0",
        `--user-data-dir=${profileDirectory}`,
        "about:blank"
      ],
      { stdio: "ignore", windowsHide: true }
    );
    const browserExited = new Promise<void>((resolve, reject) => {
      browserProcess.once("error", reject);
      browserProcess.once("exit", (code) => {
        if (code === 0 || code === null) {
          resolve();
          return;
        }
        reject(new Error(`Chrome 异常退出，code=${code}`));
      });
    });
    let cdp: CdpClient | undefined;

    try {
      const port = await readDevToolsPort(profileDirectory);
      const targetResponse = await fetch(
        `http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`,
        { method: "PUT" }
      );
      if (!targetResponse.ok) {
        throw new Error(`无法创建 Chrome 调试页，status=${targetResponse.status}`);
      }

      const target = (await targetResponse.json()) as {
        webSocketDebuggerUrl?: string;
      };
      if (!target.webSocketDebuggerUrl) {
        throw new Error("Chrome 调试页未返回 WebSocket 地址。");
      }

      cdp = await connectCdp(target.webSocketDebuggerUrl);
      await cdp.send("Page.enable");
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        deviceScaleFactor: 1,
        height,
        mobile: width <= 720,
        screenHeight: height,
        screenWidth: width,
        width
      });
      await cdp.send("Page.navigate", {
        url: `${baseUrl}/?messages=${messageCount}`
      });

      for (let attempt = 0; attempt < 100; attempt += 1) {
        const readyState = readRuntimeValue<string>(
          await cdp.send("Runtime.evaluate", {
            expression: "document.readyState",
            returnByValue: true
          })
        );
        if (readyState === "complete") {
          break;
        }
        await delay(50);
      }

      const evaluation = await cdp.send("Runtime.evaluate", {
        expression: `(() => {
          const chat = document.querySelector(".customer-service-chat");
          const list = document.querySelector(".customer-service-messages");
          const quickQuestions = document.querySelector(".customer-service-quick-list");
          const compose = document.querySelector(".customer-service-compose");
          const page = document.querySelector(".customer-service-page");
          const chatRect = chat.getBoundingClientRect();
          const listRect = list.getBoundingClientRect();
          const quickQuestionsRect = quickQuestions.getBoundingClientRect();
          const composeRect = compose.getBoundingClientRect();
          list.scrollTop = 50;
          return {
            chatClientHeight: chat.clientHeight,
            composeContained: composeRect.bottom <= chatRect.bottom + 1,
            documentScrollWidth: document.documentElement.scrollWidth,
            listCanScroll: list.scrollTop > 0,
            listClientHeight: list.clientHeight,
            listScrollHeight: list.scrollHeight,
            messagesBeforeQuickQuestions: listRect.bottom <= quickQuestionsRect.top + 1,
            overflowY: getComputedStyle(list).overflowY,
            pageClientWidth: page.clientWidth,
            pageScrollWidth: page.scrollWidth,
            quickQuestionsBeforeCompose: quickQuestionsRect.bottom <= composeRect.top + 1,
            viewportHeight: window.innerHeight,
            viewportWidth: window.innerWidth
          };
        })()`,
        returnByValue: true
      });
      const metrics = readRuntimeValue<LayoutMetrics>(evaluation);
      if (!metrics) {
        throw new Error("Chrome 未返回智能客服布局测量结果。");
      }
      return metrics;
    } finally {
      if (cdp) {
        void cdp.send("Browser.close").catch(() => undefined);
        await delay(100);
        cdp.close();
      }
      await Promise.race([browserExited, delay(2_000)]);
      if (browserProcess.exitCode === null) {
        browserProcess.kill();
        await Promise.race([browserExited, delay(3_000)]);
      }
      await rm(profileDirectory, {
        force: true,
        maxRetries: 10,
        recursive: true,
        retryDelay: 100
      });
    }
  }

  it.each([
    { name: "桌面", width: 1280, viewportHeight: 800, minListHeight: 280 },
    { name: "390px 移动端", width: 390, viewportHeight: 844, minListHeight: 180 }
  ])(
    "$name 消息增多时仅增加智能客服消息区 scrollHeight",
    async ({ width, viewportHeight, minListHeight }) => {
      const shortConversation = await measure(3, width, viewportHeight);
      const longConversation = await measure(80, width, viewportHeight);

      console.info({ shortConversation, longConversation });

      expect(longConversation.viewportHeight).toBe(viewportHeight);
      expect(longConversation.viewportWidth).toBe(width);
      expect(longConversation.chatClientHeight).toBe(shortConversation.chatClientHeight);
      expect(longConversation.listClientHeight).toBe(shortConversation.listClientHeight);
      expect(longConversation.listClientHeight).toBeGreaterThanOrEqual(minListHeight);
      expect(longConversation.listScrollHeight).toBeGreaterThan(
        longConversation.listClientHeight
      );
      expect(longConversation.listCanScroll).toBe(true);
      expect(longConversation.overflowY).toBe("auto");
      expect(longConversation.messagesBeforeQuickQuestions).toBe(true);
      expect(longConversation.quickQuestionsBeforeCompose).toBe(true);
      expect(longConversation.composeContained).toBe(true);
      expect(longConversation.documentScrollWidth).toBeLessThanOrEqual(
        longConversation.viewportWidth
      );
      expect(longConversation.pageScrollWidth).toBeLessThanOrEqual(
        longConversation.pageClientWidth
      );
    },
    30_000
  );
});
