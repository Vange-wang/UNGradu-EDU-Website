import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ChatMessagePanel } from "@/features/chat/chat-message-panel";
import type { ServerConversationMessageView } from "@/server/conversations";

const execFileAsync = promisify(execFile);
const browserPath = [
  process.env.CHROME_BIN,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
].find((candidate): candidate is string => Boolean(candidate && existsSync(candidate)));
const describeWithBrowser = browserPath ? describe : describe.skip;

type LayoutMetrics = {
  composeContained: boolean;
  documentScrollWidth: number;
  listCanScroll: boolean;
  listComesBeforeCompose: boolean;
  listClientHeight: number;
  listScrollHeight: number;
  listTabIndex: number;
  mainClientHeight: number;
  pageClientWidth: number;
  pageScrollWidth: number;
  viewportWidth: number;
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
    <main class="page dplus-chat-page"${
      contentWidth
        ? ` style="max-width:${contentWidth}px;width:${contentWidth}px"`
        : ""
    }>
      <section class="wide-panel">
        <div class="workspace-header">
          <div><span class="eyebrow">站内沟通</span><h1 class="section-title">站内聊天</h1></div>
        </div>
        <div class="conversation-workspace">
          <aside class="conversation-context"><h2>需求沟通</h2><p>会话状态</p></aside>
          ${panel}
          <aside class="chat-side contact-status-panel"><h2>联系方式交换</h2></aside>
        </div>
      </section>
    </main>
    <pre id="layout-result"></pre>
    <script>
      const main = document.querySelector(".conversation-main");
      const list = document.querySelector(".message-list");
      const compose = document.querySelector(".chat-compose");
      const page = document.querySelector(".dplus-chat-page");
      const mainRect = main.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      const composeRect = compose.getBoundingClientRect();
      list.scrollTop = 50;
      const result = {
        composeContained: composeRect.bottom <= mainRect.bottom + 1,
        documentScrollWidth: document.documentElement.scrollWidth,
        listCanScroll: list.scrollTop > 0,
        listComesBeforeCompose: listRect.bottom <= composeRect.top + 1,
        listClientHeight: list.clientHeight,
        listScrollHeight: list.scrollHeight,
        listTabIndex: list.tabIndex,
        mainClientHeight: main.clientHeight,
        pageClientWidth: page.clientWidth,
        pageScrollWidth: page.scrollWidth,
        viewportWidth: window.innerWidth
      };
      document.querySelector("#layout-result").textContent =
        "LAYOUT_METRICS:" + JSON.stringify(result);
    </script>
  </body>
</html>`;
}

function parseMetrics(html: string): LayoutMetrics {
  const match = html.match(/LAYOUT_METRICS:(\{[^<]+\})/);

  if (!match) {
    throw new Error("Chrome 未返回聊天布局测量结果。");
  }

  return JSON.parse(match[1]) as LayoutMetrics;
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

  async function measure(messageCount: number, width: number, height: number) {
    if (!browserPath) {
      throw new Error("未找到 Chrome/Edge，无法执行真实聊天布局回归。");
    }

    const profileDirectory = await mkdtemp(path.join(tmpdir(), "chat-layout-chrome-"));

    try {
      const { stdout } = await execFileAsync(
        browserPath,
        [
          "--headless=new",
          "--disable-gpu",
          "--hide-scrollbars",
          "--no-first-run",
          `--user-data-dir=${profileDirectory}`,
          `--window-size=${width},${height}`,
          "--virtual-time-budget=1000",
          "--dump-dom",
          `${baseUrl}/?messages=${messageCount}${
            width <= 390 ? `&contentWidth=${width}` : ""
          }`
        ],
        { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 }
      );

      return parseMetrics(stdout);
    } finally {
      await rm(profileDirectory, { force: true, recursive: true });
    }
  }

  it.each([
    { name: "桌面", width: 1280, height: 900, minListHeight: 200 },
    { name: "移动端", width: 390, height: 844, minListHeight: 150 },
    {
      name: "移动端键盘压缩视口",
      width: 390,
      height: 600,
      minListHeight: 120
    }
  ])(
    "$name 消息增多时只增加内部 scrollHeight",
    async ({ width, height, minListHeight }) => {
      const shortConversation = await measure(3, width, height);
      const longConversation = await measure(80, width, height);

      console.info({ shortConversation, longConversation });

      expect(longConversation.mainClientHeight).toBe(shortConversation.mainClientHeight);
      expect(longConversation.listClientHeight).toBe(shortConversation.listClientHeight);
      expect(longConversation.listClientHeight).toBeGreaterThanOrEqual(minListHeight);
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
    },
    30_000
  );
});
