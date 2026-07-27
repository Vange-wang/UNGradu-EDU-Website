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
  chatWidthRatio: number;
  composeContained: boolean;
  documentScrollWidth: number;
  inputUsable: boolean;
  layoutClientWidth: number;
  layoutBottomAligned: boolean;
  layoutTopAligned: boolean;
  listCanScroll: boolean;
  listClientHeight: number;
  listScrollHeight: number;
  messageFontSize: number;
  messagesBeforeQuickQuestions: boolean;
  overflowY: string;
  pageClientWidth: number;
  pageScrollWidth: number;
  quickButtonCount: number;
  quickButtonsSingleRow: boolean;
  quickCanScrollHorizontally: boolean;
  quickClientWidth: number;
  quickOverflowX: string;
  quickScrollWidth: number;
  quickQuestionsBeforeCompose: boolean;
  sideWidthRatio: number;
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
      <div class="page dplus-chat-page customer-service-shell">
        <section class="wide-panel customer-service-page">
          <div class="workspace-header">
            <div>
              <span class="eyebrow">智能客服</span>
              <h1>先问清规则<span>再开始找家教</span></h1>
              <p>
                <span>回答发布、沟通和联系方式交换。</span>
                <span>投诉、退款、合同或纠纷不由智能客服裁决。</span>
              </p>
            </div>
            <div class="action-row compact-actions">
              <a class="button secondary" href="/rules">查看规则</a>
              <a class="button secondary" href="/feedback">风险反馈</a>
            </div>
          </div>
        </section>
        <div class="customer-service-layout">
          <aside class="customer-service-side">
            <span class="eyebrow">可咨询内容</span>
            <h2>平台客服助手</h2>
            <ul>
              <li>家长 / 学生如何发布找老师需求。</li>
              <li>大学生如何发布可教资料。</li>
              <li>什么时候可以交换联系方式。</li>
              <li>课时费、付款和平台边界说明。</li>
              <li>风险反馈、虚假信息和骚扰记录。</li>
            </ul>
            <p>
              <span>当前使用站内离线客服。</span>
              <span>Dify WebApp 仅作为延后入口。</span>
            </p>
          </aside>
          <div class="customer-service-main">${chat}</div>
        </div>
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
          const input = compose.querySelector("input");
          const layout = document.querySelector(".customer-service-layout");
          const side = document.querySelector(".customer-service-side");
          const main = document.querySelector(".customer-service-main");
          const page = document.querySelector(".customer-service-page");
          const chatRect = chat.getBoundingClientRect();
          const listRect = list.getBoundingClientRect();
          const quickQuestionsRect = quickQuestions.getBoundingClientRect();
          const composeRect = compose.getBoundingClientRect();
          const layoutRect = layout.getBoundingClientRect();
          const sideRect = side.getBoundingClientRect();
          const mainRect = main.getBoundingClientRect();
          const quickButtons = Array.from(quickQuestions.querySelectorAll("button"));
          const quickButtonTops = quickButtons.map((button) =>
            button.getBoundingClientRect().top
          );
          list.scrollTop = 50;
          quickQuestions.scrollLeft = 50;
          return {
            chatClientHeight: chat.clientHeight,
            chatWidthRatio: mainRect.width / layoutRect.width,
            composeContained: composeRect.bottom <= chatRect.bottom + 1,
            documentScrollWidth: document.documentElement.scrollWidth,
            inputUsable:
              input.getBoundingClientRect().width > 120 &&
              input.getBoundingClientRect().height >= 44,
            layoutClientWidth: layout.clientWidth,
            layoutBottomAligned: Math.abs(sideRect.bottom - mainRect.bottom) <= 1,
            layoutTopAligned: Math.abs(sideRect.top - mainRect.top) <= 1,
            listCanScroll: list.scrollTop > 0,
            listClientHeight: list.clientHeight,
            listScrollHeight: list.scrollHeight,
            messageFontSize: Number.parseFloat(
              getComputedStyle(list.querySelector(".customer-service-message p")).fontSize
            ),
            messagesBeforeQuickQuestions: listRect.bottom <= quickQuestionsRect.top + 1,
            overflowY: getComputedStyle(list).overflowY,
            pageClientWidth: page.clientWidth,
            pageScrollWidth: page.scrollWidth,
            quickButtonCount: quickButtons.length,
            quickButtonsSingleRow:
              Math.max(...quickButtonTops) - Math.min(...quickButtonTops) <= 1,
            quickCanScrollHorizontally: quickQuestions.scrollLeft > 0,
            quickClientWidth: quickQuestions.clientWidth,
            quickOverflowX: getComputedStyle(quickQuestions).overflowX,
            quickScrollWidth: quickQuestions.scrollWidth,
            quickQuestionsBeforeCompose: quickQuestionsRect.bottom <= composeRect.top + 1,
            sideWidthRatio: sideRect.width / layoutRect.width,
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
    {
      maxMessageFontSize: 14,
      minListHeight: 380,
      minLayoutWidth: 1160,
      name: "桌面",
      preservedPageWidth: 980,
      quickQuestionsShouldScroll: false,
      width: 1280,
      viewportHeight: 800
    },
    {
      maxMessageFontSize: 14,
      minListHeight: 300,
      minLayoutWidth: 350,
      name: "390px 移动端",
      preservedPageWidth: 310,
      quickQuestionsShouldScroll: true,
      width: 390,
      viewportHeight: 844
    }
  ])(
    "$name 下方工作区保持受限消息区与高密度单行快捷问题",
    async ({
      maxMessageFontSize,
      minListHeight,
      minLayoutWidth,
      preservedPageWidth,
      quickQuestionsShouldScroll,
      width,
      viewportHeight
    }) => {
      const shortConversation = await measure(3, width, viewportHeight);
      const longConversation = await measure(80, width, viewportHeight);

      console.info({ shortConversation, longConversation });

      expect(longConversation.viewportHeight).toBe(viewportHeight);
      expect(longConversation.viewportWidth).toBe(width);
      expect(longConversation.pageClientWidth).toBe(preservedPageWidth);
      expect(longConversation.layoutClientWidth).toBeGreaterThanOrEqual(minLayoutWidth);
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
      expect(longConversation.inputUsable).toBe(true);
      expect(longConversation.messageFontSize).toBeLessThanOrEqual(maxMessageFontSize);
      expect(longConversation.quickButtonCount).toBe(5);
      expect(longConversation.quickButtonsSingleRow).toBe(true);
      expect(longConversation.quickOverflowX).toBe("auto");
      expect(longConversation.quickCanScrollHorizontally).toBe(
        quickQuestionsShouldScroll
      );
      if (quickQuestionsShouldScroll) {
        expect(longConversation.quickScrollWidth).toBeGreaterThan(
          longConversation.quickClientWidth
        );
      } else {
        expect(longConversation.quickScrollWidth).toBeLessThanOrEqual(
          longConversation.quickClientWidth
        );
      }
      expect(longConversation.documentScrollWidth).toBeLessThanOrEqual(
        longConversation.viewportWidth
      );
      if (width > 860) {
        expect(longConversation.layoutTopAligned).toBe(true);
        expect(longConversation.layoutBottomAligned).toBe(true);
        expect(longConversation.sideWidthRatio).toBeGreaterThanOrEqual(0.22);
        expect(longConversation.sideWidthRatio).toBeLessThanOrEqual(0.26);
        expect(longConversation.chatWidthRatio).toBeGreaterThanOrEqual(0.7);
        expect(longConversation.chatWidthRatio).toBeLessThanOrEqual(0.76);
      }
    },
    30_000
  );
});
