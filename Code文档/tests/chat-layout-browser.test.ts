import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ChatMessagePanel } from "@/features/chat/chat-message-panel";
import type { ServerConversationMessageView } from "@/server/conversations";

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

type LayoutMetrics = {
  composeButtonContained: boolean;
  composeButtonBottom: number;
  composeButtonLeft: number;
  composeButtonRight: number;
  composeButtonTop: number;
  composeContained: boolean;
  composeBottom: number;
  composeClientHeight: number;
  composeLeft: number;
  composeRight: number;
  composeTop: number;
  contactBackgroundColor: string;
  conversationColumnCount: number;
  conversationWidth: number;
  mainWidth: number;
  documentScrollWidth: number;
  inputFocused: boolean;
  contextBackgroundColor: string;
  contextStatBackgroundColors: string[];
  decorationActionGap: number;
  decorationContained: boolean;
  decorationOverlapsHeaderAction: boolean;
  headerActionContained: boolean;
  listCanScroll: boolean;
  listBottom: number;
  listComesBeforeCompose: boolean;
  listClientHeight: number;
  listScrollHeight: number;
  listTabIndex: number;
  listTop: number;
  mainBottom: number;
  mainClientHeight: number;
  mainContentInset: number;
  mainGridRows: string;
  mainRowGap: string;
  listMarginTop: string;
  mainTop: number;
  pageClientWidth: number;
  pageScrollWidth: number;
  siteHeaderHeight: number;
  viewportHeight: number;
  viewportWidth: number;
  visualViewportHeight: number;
  visualViewportWidth: number;
};

function buildMessages(count: number): ServerConversationMessageView[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `message-${index}`,
    conversationId: "browser-regression",
    direction: index % 2 === 0 ? "received" : "sent",
    text:
      index % 7 === 0
        ? `第 ${index + 1} 条较长消息：${"用于验证长消息不会撑破聊天布局。".repeat(10)}`
        : `第 ${index + 1} 条布局回归消息`,
    createdAt: "2026-07-23T00:00:00.000Z"
  }));
}

function renderFixture(css: string, messageCount: number, contentWidth?: number) {
  const panel = renderToStaticMarkup(
    createElement(ChatMessagePanel, {
      authorizedProfiles: false,
      messages: buildMessages(messageCount),
      messageText: "",
      onMessageTextChange: () => undefined,
      onSubmit: () => undefined
    })
  );

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>${css}</style>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="/">UNGradu EDU</a>
      <nav class="top-nav" aria-label="主导航">
        <a href="/parent-needs">家长需求</a>
        <a href="/tutor-profiles">老师资料</a>
        <a href="/profile">我的账号</a>
      </nav>
    </header>
    <main>
      <div class="page dplus-chat-page"${
        contentWidth
          ? ` style="max-width:${contentWidth}px;width:${contentWidth}px"`
          : ""
      }>
        <section class="wide-panel">
          <div class="workspace-header">
            <div><span class="eyebrow">站内沟通</span><h1 class="section-title">站内聊天</h1></div>
            <span aria-hidden="true" class="chat-header-decoration"></span>
            <a class="button secondary chat-header-back" href="/profile/chats">返回我的聊天</a>
          </div>
          <div class="conversation-workspace">
            <aside class="conversation-context">
              <span class="eyebrow">会话状态</span>
              <h2>需求沟通</h2>
              <p>确认意向后，可请求交换联系方式。</p>
              <div class="context-stat"><strong>80</strong><span>条消息</span></div>
              <div class="context-stat"><strong>2</strong><span>次交换请求</span></div>
            </aside>
            ${panel}
            <aside class="chat-side contact-status-panel"><h2>联系方式交换</h2></aside>
          </div>
        </section>
      </div>
    </main>
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

describeWithBrowser("真实聊天消息面板布局", () => {
  let baseUrl = "";
  let css = "";
  let server: ReturnType<typeof createServer>;

  beforeAll(async () => {
    css = await readFile(path.join(process.cwd(), "app", "globals.css"), "utf8");
    server = createServer((request, response) => {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      const messageCount = Number(requestUrl.searchParams.get("messages") ?? "3");
      const contentWidthValue = requestUrl.searchParams.get("contentWidth");
      const contentWidth = contentWidthValue ? Number(contentWidthValue) : undefined;
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(renderFixture(css, messageCount, contentWidth));
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("无法启动聊天布局回归测试服务。");
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  async function measure(
    messageCount: number,
    width: number,
    height: number,
    screenshotName?: string
  ) {
    if (!browserPath) {
      throw new Error("未找到 Chrome/Edge，无法执行真实聊天布局回归。");
    }

    const profileDirectory = await mkdtemp(path.join(tmpdir(), "chat-layout-chrome-"));
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
        awaitPromise: true,
        expression: `(() => new Promise((resolve) => {
          const main = document.querySelector(".conversation-main");
          const list = document.querySelector(".message-list");
          const compose = document.querySelector(".chat-compose");
          const composeButton = compose.querySelector("button");
          const conversation = document.querySelector(".conversation-workspace");
          const context = document.querySelector(".conversation-context");
          const contact = document.querySelector(".contact-status-panel");
          const page = document.querySelector(".dplus-chat-page");
          const siteHeader = document.querySelector(".site-header");
          const workspaceHeader = document.querySelector(".workspace-header");
          const decoration = document.querySelector(".chat-header-decoration");
          const headerAction = document.querySelector(".chat-header-back");
          const textarea = document.querySelector("#message-text");
          textarea.focus();
          requestAnimationFrame(() => requestAnimationFrame(() => {
            const mainRect = main.getBoundingClientRect();
            const listRect = list.getBoundingClientRect();
            const composeRect = compose.getBoundingClientRect();
            const composeButtonRect = composeButton.getBoundingClientRect();
            const composeStyle = getComputedStyle(compose);
            const mainStyle = getComputedStyle(main);
            const conversationRect = conversation.getBoundingClientRect();
            const contextStyle = getComputedStyle(context);
            const contactStyle = getComputedStyle(contact);
            const contextStatBackgroundColors = Array.from(
              context.querySelectorAll(".context-stat"),
              (stat) => getComputedStyle(stat).backgroundColor
            );
            const workspaceHeaderRect = workspaceHeader.getBoundingClientRect();
            const decorationRect = decoration.getBoundingClientRect();
            const headerActionRect = headerAction.getBoundingClientRect();
            const composeContentRight =
              composeRect.right -
              Number.parseFloat(composeStyle.borderRightWidth) -
              Number.parseFloat(composeStyle.paddingRight);
            const composeContentBottom =
              composeRect.bottom -
              Number.parseFloat(composeStyle.borderBottomWidth) -
              Number.parseFloat(composeStyle.paddingBottom);
            const mainContentRight =
              mainRect.right -
              Number.parseFloat(mainStyle.borderRightWidth) -
              Number.parseFloat(mainStyle.paddingRight);
            const mainContentBottom =
              mainRect.bottom -
              Number.parseFloat(mainStyle.borderBottomWidth) -
              Number.parseFloat(mainStyle.paddingBottom);
            const visualViewportHeight = window.visualViewport
              ? window.visualViewport.height
              : window.innerHeight;
            const visualViewportWidth = window.visualViewport
              ? window.visualViewport.width
              : window.innerWidth;
            list.scrollTop = 50;
            resolve({
              composeButtonContained:
                composeButtonRect.left >= composeRect.left &&
                composeButtonRect.right + 4 <= composeContentRight &&
                composeButtonRect.top >= composeRect.top &&
                composeButtonRect.bottom + 4 <= composeContentBottom &&
                composeButtonRect.bottom + 4 <= mainContentBottom,
              composeButtonBottom: composeButtonRect.bottom,
              composeButtonLeft: composeButtonRect.left,
              composeButtonRight: composeButtonRect.right,
              composeButtonTop: composeButtonRect.top,
              composeContained:
                composeRect.right <= mainContentRight + 1 &&
                composeRect.bottom <= mainContentBottom + 1,
              composeBottom: composeRect.bottom,
              composeClientHeight: compose.clientHeight,
              composeLeft: composeRect.left,
              composeRight: composeRect.right,
              composeTop: composeRect.top,
              contactBackgroundColor: contactStyle.backgroundColor,
              conversationColumnCount: getComputedStyle(conversation).gridTemplateColumns.split(" ").length,
              conversationWidth: conversationRect.width,
              mainWidth: mainRect.width,
              documentScrollWidth: document.documentElement.scrollWidth,
              contextBackgroundColor: contextStyle.backgroundColor,
              contextStatBackgroundColors,
              decorationActionGap:
                window.innerWidth <= 720
                  ? headerActionRect.top - decorationRect.bottom
                  : headerActionRect.left - decorationRect.right,
              decorationContained:
                decorationRect.left >= workspaceHeaderRect.left &&
                decorationRect.right <= workspaceHeaderRect.right &&
                decorationRect.top >= workspaceHeaderRect.top &&
                decorationRect.bottom <= workspaceHeaderRect.bottom,
              decorationOverlapsHeaderAction:
                decorationRect.left < headerActionRect.right &&
                decorationRect.right > headerActionRect.left &&
                decorationRect.top < headerActionRect.bottom &&
                decorationRect.bottom > headerActionRect.top,
              headerActionContained:
                headerActionRect.left >= workspaceHeaderRect.left &&
                headerActionRect.right <= workspaceHeaderRect.right &&
                headerActionRect.top >= workspaceHeaderRect.top &&
                headerActionRect.bottom <= workspaceHeaderRect.bottom,
              inputFocused: document.activeElement === textarea,
              listCanScroll: list.scrollTop > 0,
              listBottom: listRect.bottom,
              listComesBeforeCompose: listRect.bottom <= composeRect.top + 1,
              listClientHeight: list.clientHeight,
              listScrollHeight: list.scrollHeight,
              listTabIndex: list.tabIndex,
              listTop: listRect.top,
              mainBottom: mainRect.bottom,
              mainClientHeight: main.clientHeight,
              mainContentInset: Math.min(
                listRect.left - mainRect.left,
                composeRect.left - mainRect.left
              ),
              mainGridRows: getComputedStyle(main).gridTemplateRows,
              mainRowGap: getComputedStyle(main).rowGap,
              listMarginTop: getComputedStyle(list).marginTop,
              mainTop: mainRect.top,
              pageClientWidth: page.clientWidth,
              pageScrollWidth: page.scrollWidth,
              siteHeaderHeight: siteHeader.getBoundingClientRect().height,
              viewportHeight: window.innerHeight,
              visualViewportHeight,
              visualViewportWidth,
              viewportWidth: window.innerWidth
            });
          }));
        }))()`,
        returnByValue: true
      });
      const metrics = readRuntimeValue<LayoutMetrics>(evaluation);

      if (!metrics) {
        throw new Error("Chrome 未返回聊天布局测量结果。");
      }

      const screenshotDirectory = process.env.CHAT_LAYOUT_SCREENSHOT_DIR;

      if (screenshotDirectory && screenshotName) {
        const screenshotCdp = cdp;

        if (!screenshotCdp) {
          throw new Error("Chrome 调试连接已关闭，无法截图。");
        }

        await mkdir(screenshotDirectory, { recursive: true });

        const captureScreenshot = async (fileName: string) => {
          const screenshot = (await screenshotCdp.send("Page.captureScreenshot", {
            captureBeyondViewport: false,
            format: "png"
          })) as { data?: string };

          if (!screenshot.data) {
            throw new Error("Chrome 未返回聊天布局截图。");
          }

          await writeFile(
            path.join(screenshotDirectory, fileName),
            Buffer.from(screenshot.data, "base64")
          );
        };

        await screenshotCdp.send("Runtime.evaluate", {
          expression: "window.scrollTo(0, 0)"
        });
        await delay(50);
        await captureScreenshot(screenshotName);

        await screenshotCdp.send("Runtime.evaluate", {
          expression:
            'document.querySelector(".conversation-main").scrollIntoView({ block: "center" })'
        });
        await delay(50);
        await captureScreenshot(
          screenshotName.replace(/\.png$/i, "-composer.png")
        );
        await writeFile(
          path.join(
            screenshotDirectory,
            screenshotName.replace(/\.png$/i, "-metrics.json")
          ),
          `${JSON.stringify(metrics, null, 2)}\n`,
          "utf8"
        );
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
      name: "1280 桌面",
      width: 1280,
      viewportHeight: 800,
      minComposeHeight: 116,
      targetMainHeight: 728,
      targetComposeHeight: 116,
      minConversationWidth: 620,
      minListHeight: 500,
      mustFitViewport: false,
      expectedColumnCount: 3
    },
    {
      name: "1440 桌面",
      width: 1440,
      viewportHeight: 900,
      minComposeHeight: 124,
      targetMainHeight: 772,
      targetComposeHeight: 124,
      minConversationWidth: 620,
      minListHeight: 540,
      mustFitViewport: false,
      expectedColumnCount: 3
    },
    {
      name: "1920 桌面",
      width: 1920,
      viewportHeight: 1080,
      minComposeHeight: 132,
      targetMainHeight: 860,
      targetComposeHeight: 132,
      minConversationWidth: 620,
      minListHeight: 620,
      mustFitViewport: false,
      expectedColumnCount: 3
    },
    {
      name: "移动端",
      width: 390,
      viewportHeight: 844,
      minComposeHeight: 112,
      minListHeight: 320,
      mustFitViewport: false,
      expectedColumnCount: 1,
      maxListHeight: 520
    },
    {
      name: "390×600 移动端键盘压缩视口",
      width: 390,
      viewportHeight: 600,
      minComposeHeight: 112,
      minListHeight: 320,
      mustFitViewport: true,
      expectedColumnCount: 1,
      maxListHeight: 520
    }
  ])(
    "$name 消息增多时只增加内部 scrollHeight",
    async ({
      name,
      width,
      viewportHeight,
      minComposeHeight,
      targetMainHeight,
      targetComposeHeight,
      minConversationWidth,
      minListHeight,
      mustFitViewport,
      expectedColumnCount,
      maxListHeight
    }) => {
      const shortConversation = await measure(3, width, viewportHeight);
      const longConversation = await measure(
        80,
        width,
        viewportHeight,
        `${width}x${viewportHeight}-${name.replace(/[^\p{L}\p{N}-]+/gu, "-")}.png`
      );

      console.info({ shortConversation, longConversation });

      expect(longConversation.viewportHeight).toBe(viewportHeight);
      expect(Math.round(longConversation.visualViewportHeight)).toBe(viewportHeight);
      expect(Math.round(longConversation.visualViewportWidth)).toBe(width);
      expect(longConversation.inputFocused).toBe(true);
      expect(longConversation.mainClientHeight).toBe(shortConversation.mainClientHeight);
      if (targetMainHeight) {
        expect(longConversation.mainClientHeight).toBeGreaterThanOrEqual(targetMainHeight - 2);
        expect(longConversation.mainClientHeight).toBeLessThanOrEqual(targetMainHeight + 2);
        expect(longConversation.composeClientHeight).toBeGreaterThanOrEqual(targetComposeHeight - 2);
        expect(longConversation.composeClientHeight).toBeLessThanOrEqual(targetComposeHeight + 8);
      }
      expect(longConversation.listClientHeight).toBe(shortConversation.listClientHeight);
      expect(longConversation.listClientHeight).toBeGreaterThanOrEqual(minListHeight);
      expect(longConversation.composeClientHeight).toBeGreaterThanOrEqual(minComposeHeight);
      expect(longConversation.conversationColumnCount).toBe(expectedColumnCount);
      expect(longConversation.conversationWidth).toBeLessThanOrEqual(
        longConversation.pageClientWidth
      );
      if (minConversationWidth) {
        expect(longConversation.mainWidth).toBeGreaterThanOrEqual(
          minConversationWidth
        );
      }
      if (maxListHeight) {
        expect(longConversation.listClientHeight).toBeLessThanOrEqual(maxListHeight);
      }
      expect(longConversation.listScrollHeight).toBeGreaterThan(
        longConversation.listClientHeight
      );
      expect(longConversation.listCanScroll).toBe(true);
      expect(longConversation.listTabIndex).toBe(0);
      expect(longConversation.listComesBeforeCompose).toBe(true);
      expect(longConversation.composeContained).toBe(true);
      expect(longConversation.documentScrollWidth).toBeLessThanOrEqual(
        longConversation.viewportWidth
      );
      expect(longConversation.pageScrollWidth).toBeLessThanOrEqual(
        longConversation.pageClientWidth
      );

      if (mustFitViewport) {
        expect(longConversation.siteHeaderHeight).toBeGreaterThan(0);
        expect(longConversation.mainTop).toBeGreaterThanOrEqual(0);
        expect(longConversation.mainBottom).toBeLessThanOrEqual(
          longConversation.visualViewportHeight
        );
        expect(longConversation.composeTop).toBeGreaterThanOrEqual(0);
        expect(longConversation.composeBottom).toBeLessThanOrEqual(
          longConversation.visualViewportHeight
        );
      }
    },
    30_000
  );

  it(
    "keeps composer, inner inset, status color, and decoration action geometry valid",
    async () => {
      const pendingUiMetrics: LayoutMetrics[] = [];

      for (const viewport of [
        { height: 800, width: 1280 },
        { height: 900, width: 1440 },
        { height: 1080, width: 1920 },
        { height: 844, width: 390 }
      ]) {
        pendingUiMetrics.push(await measure(3, viewport.width, viewport.height));
      }

      console.info({ pendingUiMetrics });

      expect(
        pendingUiMetrics.every(
          (metrics) =>
            metrics.composeButtonContained &&
            metrics.composeContained &&
            metrics.mainContentInset >= 12 &&
            metrics.contextBackgroundColor === "rgb(255, 249, 232)" &&
            metrics.contextStatBackgroundColors.join("|") ===
              "rgb(223, 231, 218)|rgb(243, 231, 197)" &&
            metrics.contactBackgroundColor === "rgb(223, 231, 218)" &&
            metrics.mainRowGap === "10px" &&
            metrics.decorationContained &&
            metrics.headerActionContained &&
            !metrics.decorationOverlapsHeaderAction &&
            metrics.decorationActionGap >= (metrics.viewportWidth <= 720 ? 12 : 20)
        )
      ).toBe(true);
    }
  );
});
