import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

describe("业务方确认预览的范围保护", () => {
  it("只追加获批的 CTA、标题行、padding 与响应式高度声明", async () => {
    const css = await readFile(path.join(process.cwd(), "app", "globals.css"), "utf8");
    const marker =
      "/* Business-confirmed preview: shared intro geometry and four-row home CTAs. */";
    const scopedCss = css.slice(css.indexOf(marker));

    expect(scopedCss).toContain("grid-template-rows: 18px 48px 32px 64px;");
    expect(scopedCss).toContain("white-space: nowrap;");
    expect(scopedCss).toContain("height: 164.16px;");
    expect(scopedCss).toContain("height: 132.41px;");
    expect(scopedCss).toContain("height: 135.69px;");
    expect(scopedCss).toContain("height: auto;");
    expect(scopedCss).toContain("grid-template-columns: max-content minmax(0, 1fr);");
    expect(scopedCss).toContain("column-gap: 16px;");
    expect(scopedCss).toContain("padding-block: 15px;");
    expect(scopedCss).toContain("padding-block: 5px;");
    expect(scopedCss).toContain("padding-block: 4px 5px;");
    expect(scopedCss).not.toMatch(/font-size\s*:/);
    expect(scopedCss).not.toMatch(/font-family\s*:/);
    expect(scopedCss).not.toMatch(/font-weight\s*:/);
    expect(scopedCss).not.toMatch(/(?:^|[;\s{])color\s*:/m);
    expect(scopedCss).not.toMatch(/background(?:-color|-image)?\s*:/);
    expect(scopedCss).not.toMatch(/border(?:-color|-radius|-width)?\s*:/);
    expect(scopedCss).not.toMatch(/box-shadow\s*:/);
  });
});

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
      } else {
        request.resolve(message.result);
      }
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

function renderFixture(css: string) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>${css}</style>
  </head>
  <body>
    <main>
      <div class="page sitewide-refresh-page home-refresh-page">
        <div class="home-refresh-main">
          <div class="home-title-block">
            <span class="home-kicker">大学生家教 · 先聊清楚</span>
            <h1>大学生家教平台</h1>
            <div class="home-benefits"><strong>更安心</strong><strong>更便捷</strong><strong>选择多</strong></div>
          </div>
          <div class="home-entry-grid">
            <article class="home-entry-card home-entry-parent">
              <span>家长 / 学生</span><h2>发布找老师需求</h2><p>填写科目、预算和上课偏好。</p>
              <button class="button home-entry-button">我要找家教</button>
            </article>
            <article class="home-entry-card home-entry-tutor">
              <span>大学生家教</span><h2>发布老师信息</h2><p>填写可教科目、时间和课时费。</p>
              <button class="button home-entry-button">我要做家教</button>
            </article>
          </div>
        </div>
      </div>

      <div class="page feedback-page feedback-contract-page">
        <section class="notice-layout">
          <aside class="notice-aside">
            <span class="eyebrow">风险与功能反馈</span>
            <h1>发现问题，先记录下来。</h1>
            <p>可反馈联系方式滥用、虚假信息、骚扰或功能异常。</p>
            <p>反馈仅用于记录排查，不承诺客服介入、仲裁、退款或担保。</p>
            <p>推荐通过项目方提供的 HTTPS 入口访问。</p>
            <p>Cloudflare Worker 如被使用，仅作为临时访问与基础安全加固方案。</p>
          </aside>
          <div class="notice-panel"></div>
        </section>
      </div>

      <div class="page customer-service-page">
        <section class="customer-service-info-strip">
          <div class="customer-service-info-title"><span class="eyebrow">智能客服</span><h1>先问清规则 再开始找家教</h1></div>
          <div class="customer-service-info-copy"><p>回答发布、沟通和联系方式交换。</p><p>投诉、退款、合同或纠纷不由智能客服裁决。</p></div>
          <div class="customer-service-info-orb"></div>
          <div class="action-row"><button class="button secondary">查看规则</button><button class="button secondary">风险反馈</button></div>
        </section>
      </div>

      <div class="page dplus-business-page intro-contracts">
        <section class="publish-hero" data-intro="publish-parent"><div class="publish-copy"><span class="eyebrow">发布需求</span><h1 class="section-title">发布家教需求</h1><p>填写孩子情况、科目、预算和时间；公开说明不要写联系方式。</p></div></section>
        <section class="publish-hero" data-intro="publish-tutor"><div class="publish-copy"><span class="eyebrow">发布资料</span><h1 class="section-title">发布家教信息</h1><p>填写学校专业、可教范围和课时费；公开说明不要写联系方式。</p></div></section>
        <section class="detail-hero" data-intro="detail-parent"><div class="market-copy"><span class="eyebrow">需求详情</span><h1 class="section-title">结构化需求信息</h1><p>详情页仅展示学习需求、区域和预算等公开信息，不展示家长联系方式。</p><p class="dplus-panel-note">下一步是站内沟通，不是支付、担保或平台仲裁。</p></div><button class="button secondary">返回需求广场</button></section>
        <section class="detail-hero" data-intro="detail-tutor"><div class="market-copy"><span class="eyebrow">家教详情</span><h1 class="section-title">结构化老师资料</h1><p>详情页仅展示可公开的授课信息，不展示存档联系方式。</p><p class="dplus-panel-note">下一步是站内沟通，不是认证、担保或自动推荐。</p></div><button class="button secondary">返回家教信息广场</button></section>
      </div>

      <div class="page dplus-chat-page">
        <section class="wide-panel">
          <div class="workspace-header" data-intro="chat">
            <div><span class="eyebrow">站内沟通</span><h1 class="section-title">站内聊天</h1><p>先站内沟通；双方确认前不展示联系方式。</p></div>
            <span class="chat-header-decoration"></span>
            <button class="button secondary">返回我的聊天</button>
          </div>
          <section class="conversation-main">
            <div class="conversation-main-header">
              <div><h2>消息区</h2><p>不直接发送手机号、微信号或详细地址。</p></div>
              <span class="status-pill">联系方式未授权</span>
            </div>
          </section>
        </section>
      </div>
    </main>
  </body>
</html>`;
}

type PendingUiMetrics = {
  chatHeaderChildGap: number;
  chatHeaderHeight: number;
  chatHeaderMinClearance: number;
  chatHeaderOverlaps: boolean;
  chatHeaderUsesTwoRows: boolean;
  customerServiceIntroHeight: number;
  documentClientWidth: number;
  documentScrollWidth: number;
  feedbackBackgroundColor: string;
  feedbackHintBackgroundColors: string[];
  homeCtaHeightDelta: number;
  homeCtaHeights: number[];
  homeCtaTextCenterDelta: number;
  homeCtaWidthDelta: number;
  homeCardOverflowXs: number[];
  homeGridClientWidth: number;
  homeGridScrollWidth: number;
  homeHeroGridGap: number;
  homeRowTopDeltas: number[];
  homeTitleFontSizes: number[];
  homeTitleLineCounts: number[];
  introHeights: Record<string, number>;
  introLayouts: Record<
    string,
    {
      descriptionGap: number;
      descriptionOverlapsTitleRow: boolean;
      paddingBottom: number;
      paddingTop: number;
      titleGap: number;
      titleRowVerticalOverlap: boolean;
    }
  >;
  introOverflows: Record<string, number>;
};

describeWithBrowser("UI 方案 A 问题 2–6 四视口几何", () => {
  let baseUrl = "";
  let server: ReturnType<typeof createServer>;

  beforeAll(async () => {
    const css = await readFile(path.join(process.cwd(), "app", "globals.css"), "utf8");
    server = createServer((_request, response) => {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(renderFixture(css));
    });
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("无法启动 UI 返工契约服务。");
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  async function measure(width: number, height: number, screenshotName?: string) {
    if (!browserPath) {
      throw new Error("未找到 Chrome/Edge，无法执行 UI 返工几何契约。");
    }

    const profileDirectory = await mkdtemp(path.join(tmpdir(), "ui-rework-chrome-"));
    const browserProcess = spawn(
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
    let cdp: CdpClient | undefined;

    try {
      const port = await readDevToolsPort(profileDirectory);
      const targetResponse = await fetch(
        `http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`,
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
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        deviceScaleFactor: 1,
        height,
        mobile: width <= 720,
        screenHeight: height,
        screenWidth: width,
        width
      });
      await cdp.send("Page.navigate", { url: baseUrl });

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

      const result = await cdp.send("Runtime.evaluate", {
        expression: `(() => {
          const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
          const chatHeader = rect(".conversation-main-header");
          const chatCopy = rect(".conversation-main-header > div");
          const chatBadge = rect(".conversation-main-header > .status-pill");
          const buttons = Array.from(document.querySelectorAll(".home-entry-button"), (node) => node.getBoundingClientRect());
          const textCenterOffsets = Array.from(
            document.querySelectorAll(".home-entry-button"),
            (button) => {
              const range = document.createRange();
              range.selectNodeContents(button);
              const textRect = range.getBoundingClientRect();
              const buttonRect = button.getBoundingClientRect();
              return {
                x: (textRect.left + textRect.right) / 2 - (buttonRect.left + buttonRect.right) / 2,
                y: (textRect.top + textRect.bottom) / 2 - (buttonRect.top + buttonRect.bottom) / 2
              };
            }
          );
          const benefits = rect(".home-benefits");
          const grid = rect(".home-entry-grid");
          const cards = Array.from(document.querySelectorAll(".home-entry-card"));
          const homeCardOverflowXs = cards.map((card) =>
            Math.max(0, card.scrollWidth - card.clientWidth)
          );
          const homeRowTopDeltas = [":scope > span", ":scope > h2", ":scope > p", ":scope > .home-entry-button"].map(
            (selector) => {
              const rowOffsets = cards.map((card) => {
                const cardRect = card.getBoundingClientRect();
                return card.querySelector(selector).getBoundingClientRect().top - cardRect.top;
              });
              return Math.abs(rowOffsets[0] - rowOffsets[1]);
            }
          );
          const homeTitleLineCounts = cards.map((card) => {
            const title = card.querySelector("h2");
            const titleRect = title.getBoundingClientRect();
            const lineHeight = Number.parseFloat(getComputedStyle(title).lineHeight);
            return Math.round(titleRect.height / lineHeight);
          });
          const homeTitleFontSizes = cards.map((card) =>
            Number.parseFloat(getComputedStyle(card.querySelector("h2")).fontSize)
          );
          const introHeights = Object.fromEntries(
            Array.from(document.querySelectorAll("[data-intro]"), (node) => [
              node.getAttribute("data-intro"),
              node.getBoundingClientRect().height
            ])
          );
          const introOverflows = Object.fromEntries(
            Array.from(document.querySelectorAll("[data-intro]"), (node) => [
              node.getAttribute("data-intro"),
              Math.max(0, node.scrollHeight - node.clientHeight)
            ])
          );
          const introLayouts = Object.fromEntries(
            Array.from(document.querySelectorAll("[data-intro]"), (node) => {
              const copy = node.matches(".workspace-header")
                ? node.querySelector(":scope > div")
                : node.querySelector(".publish-copy, .market-copy");
              const eyebrow = copy.querySelector(".eyebrow").getBoundingClientRect();
              const title = copy.querySelector(".section-title").getBoundingClientRect();
              const description = copy.querySelector(":scope > p").getBoundingClientRect();
              const style = getComputedStyle(node);
              const titleRowBottom = Math.max(eyebrow.bottom, title.bottom);
              return [
                node.getAttribute("data-intro"),
                {
                  descriptionGap: description.top - titleRowBottom,
                  descriptionOverlapsTitleRow: description.top < titleRowBottom,
                  paddingBottom: Number.parseFloat(style.paddingBottom),
                  paddingTop: Number.parseFloat(style.paddingTop),
                  titleGap: title.left - eyebrow.right,
                  titleRowVerticalOverlap:
                    eyebrow.top < title.bottom && eyebrow.bottom > title.top
                }
              ];
            })
          );
          const horizontalGap = Math.max(
            chatBadge.left - chatCopy.right,
            chatCopy.left - chatBadge.right
          );
          const verticalGap = Math.max(
            chatBadge.top - chatCopy.bottom,
            chatCopy.top - chatBadge.bottom
          );
          return {
            chatHeaderChildGap: Math.max(horizontalGap, verticalGap),
            chatHeaderHeight: chatHeader.height,
            chatHeaderMinClearance: Math.min(
              chatCopy.top - chatHeader.top,
              chatHeader.bottom - chatCopy.bottom,
              chatBadge.top - chatHeader.top,
              chatHeader.bottom - chatBadge.bottom
            ),
            chatHeaderOverlaps:
              chatCopy.left < chatBadge.right &&
              chatCopy.right > chatBadge.left &&
              chatCopy.top < chatBadge.bottom &&
              chatCopy.bottom > chatBadge.top,
            chatHeaderUsesTwoRows: chatBadge.top >= chatCopy.bottom,
            customerServiceIntroHeight: rect(".customer-service-info-strip").height,
            documentClientWidth: document.documentElement.clientWidth,
            documentScrollWidth: document.documentElement.scrollWidth,
            feedbackBackgroundColor: getComputedStyle(document.querySelector(".notice-aside")).backgroundColor,
            feedbackHintBackgroundColors: Array.from(
              document.querySelectorAll(".notice-aside > p"),
              (node) => getComputedStyle(node).backgroundColor
            ),
            homeCtaHeightDelta: Math.abs(buttons[0].height - buttons[1].height),
            homeCtaHeights: buttons.map((button) => button.height),
            homeCtaTextCenterDelta: Math.max(
              Math.abs(textCenterOffsets[0].x - textCenterOffsets[1].x),
              Math.abs(textCenterOffsets[0].y - textCenterOffsets[1].y)
            ),
            homeCtaWidthDelta: Math.abs(buttons[0].width - buttons[1].width),
            homeCardOverflowXs,
            homeGridClientWidth: grid.width,
            homeGridScrollWidth: document.querySelector(".home-entry-grid").scrollWidth,
            homeHeroGridGap: grid.top - benefits.bottom,
            homeRowTopDeltas,
            homeTitleFontSizes,
            homeTitleLineCounts,
            introHeights,
            introLayouts,
            introOverflows
          };
        })()`,
        returnByValue: true
      });
      const metrics = readRuntimeValue<PendingUiMetrics>(result);

      if (!metrics) {
        throw new Error("Chrome 未返回 UI 返工几何数据。");
      }

      const screenshotDirectory = process.env.UI_REWORK_SCREENSHOT_DIR;

      if (screenshotDirectory && screenshotName) {
        const layoutMetrics = (await cdp.send("Page.getLayoutMetrics")) as {
          cssContentSize?: { height: number; width: number; x: number; y: number };
        };
        const contentSize = layoutMetrics.cssContentSize;

        if (!contentSize) {
          throw new Error("Chrome 未返回 UI 返工页面尺寸。");
        }

        const screenshot = (await cdp.send("Page.captureScreenshot", {
          captureBeyondViewport: true,
          clip: {
            height: contentSize.height,
            scale: 1,
            width: contentSize.width,
            x: 0,
            y: 0
          },
          format: "png"
        })) as { data?: string };

        if (!screenshot.data) {
          throw new Error("Chrome 未返回 UI 返工截图。");
        }

        await mkdir(screenshotDirectory, { recursive: true });
        await writeFile(
          path.join(screenshotDirectory, screenshotName),
          Buffer.from(screenshot.data, "base64")
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
        cdp.close();
      }

      await delay(100);

      if (browserProcess.exitCode === null) {
        browserProcess.kill();
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
    { height: 800, name: "1280×800", width: 1280 },
    { height: 900, name: "1440×900", width: 1440 },
    { height: 1080, name: "1920×1080", width: 1920 },
    { height: 844, name: "390×844", width: 390 }
  ])("$name 满足冻结的问题 2–6 几何", async ({ height, width }) => {
    const metrics = await measure(
      width,
      height,
      `${width}x${height}-ui-scheme-a.png`
    );
    const expected =
      width === 390
        ? {
            chatHeaderHeight: 92,
            ctaHeight: 56,
            desktopHero: null,
            homeGap: 16,
          }
        : width === 1920
          ? {
              chatHeaderHeight: 60,
              chatHeaderGap: 24,
              ctaHeight: 64,
              desktopHero: 135.69,
              homeGap: 24,
            }
          : width === 1440
            ? {
                chatHeaderHeight: 60,
                chatHeaderGap: 20,
                ctaHeight: 64,
                desktopHero: 132.41,
                homeGap: 20,
              }
            : {
                chatHeaderHeight: 56,
                chatHeaderGap: 16,
                ctaHeight: 60,
                desktopHero: 164.16,
                homeGap: 20,
              };
    const detailHeights = [
      metrics.introHeights["detail-parent"],
      metrics.introHeights["detail-tutor"]
    ];
    const regularHeights = [
      metrics.introHeights["publish-parent"],
      metrics.introHeights["publish-tutor"]
    ];

    console.info({ height, metrics, width });

    expect.soft(metrics.chatHeaderOverlaps, JSON.stringify(metrics)).toBe(false);
    expect
      .soft(metrics.chatHeaderHeight, JSON.stringify(metrics))
      .toBeCloseTo(expected.chatHeaderHeight, 0);
    expect
      .soft(metrics.homeCtaWidthDelta, JSON.stringify(metrics))
      .toBeLessThanOrEqual(1);
    expect
      .soft(metrics.homeCtaHeightDelta, JSON.stringify(metrics))
      .toBeLessThanOrEqual(1);
    expect
      .soft(metrics.homeCtaTextCenterDelta, JSON.stringify(metrics))
      .toBeLessThanOrEqual(1);
    expect
      .soft(Math.max(...metrics.homeRowTopDeltas), JSON.stringify(metrics))
      .toBeLessThanOrEqual(1);
    expect.soft(metrics.homeTitleFontSizes, JSON.stringify(metrics)).toEqual(
      width === 390 ? [32, 32] : [44, 44]
    );
    expect.soft(metrics.homeTitleLineCounts, JSON.stringify(metrics)).toEqual([1, 1]);
    expect
      .soft(Math.max(...metrics.homeCardOverflowXs), JSON.stringify(metrics))
      .toBe(0);
    expect
      .soft(metrics.homeGridScrollWidth, JSON.stringify(metrics))
      .toBeLessThanOrEqual(metrics.homeGridClientWidth);

    for (const ctaHeight of metrics.homeCtaHeights) {
      expect.soft(ctaHeight, JSON.stringify(metrics)).toBeCloseTo(expected.ctaHeight, 0);
    }

    expect
      .soft(metrics.homeHeroGridGap, JSON.stringify(metrics))
      .toBeCloseTo(expected.homeGap, 0);
    expect.soft(metrics.feedbackBackgroundColor, JSON.stringify(metrics)).toBe(
      "rgb(255, 249, 232)"
    );
    expect
      .soft(metrics.feedbackHintBackgroundColors, JSON.stringify(metrics))
      .toEqual([
        "rgb(223, 231, 218)",
        "rgb(243, 231, 197)",
        "rgb(201, 211, 197)",
        "rgb(255, 241, 168)"
      ]);
    expect
      .soft(metrics.documentScrollWidth, JSON.stringify(metrics))
      .toBeLessThanOrEqual(metrics.documentClientWidth);

    if (width === 390) {
      for (const heightValue of [
        ...regularHeights,
        ...detailHeights,
        metrics.introHeights.chat
      ]) {
        expect.soft(heightValue, JSON.stringify(metrics)).toBeGreaterThan(0);
      }
      expect
        .soft(metrics.chatHeaderUsesTwoRows, JSON.stringify(metrics))
        .toBe(true);
    } else {
      for (const heightValue of [
        ...regularHeights,
        ...detailHeights,
        metrics.introHeights.chat
      ]) {
        expect
          .soft(heightValue, JSON.stringify(metrics))
          .toBeCloseTo(expected.desktopHero ?? 0, 1);
      }
      expect
        .soft(metrics.chatHeaderChildGap, JSON.stringify(metrics))
        .toBeGreaterThanOrEqual(expected.chatHeaderGap ?? 0);

      for (const layout of Object.values(metrics.introLayouts)) {
        expect.soft(layout.titleGap, JSON.stringify(metrics)).toBeCloseTo(16, 0);
        expect
          .soft(layout.titleRowVerticalOverlap, JSON.stringify(metrics))
          .toBe(true);
        expect
          .soft(layout.descriptionOverlapsTitleRow, JSON.stringify(metrics))
          .toBe(false);
      }

      for (const key of ["publish-parent", "publish-tutor"]) {
        expect
          .soft(metrics.introLayouts[key].descriptionGap, JSON.stringify(metrics))
          .toBeGreaterThanOrEqual(6);
        expect.soft(metrics.introLayouts[key].paddingTop).toBeCloseTo(15, 0);
        expect.soft(metrics.introLayouts[key].paddingBottom).toBeCloseTo(15, 0);
      }

      for (const key of ["detail-parent", "detail-tutor"]) {
        expect.soft(metrics.introLayouts[key].paddingTop).toBeCloseTo(5, 0);
        expect.soft(metrics.introLayouts[key].paddingBottom).toBeCloseTo(5, 0);
      }

      expect.soft(metrics.introLayouts.chat.paddingTop).toBeCloseTo(4, 0);
      expect.soft(metrics.introLayouts.chat.paddingBottom).toBeCloseTo(5, 0);
    }
    expect
      .soft(Math.max(...Object.values(metrics.introOverflows)), JSON.stringify(metrics))
      .toBe(0);
  });
});
