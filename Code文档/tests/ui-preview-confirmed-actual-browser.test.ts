import { spawn, spawnSync } from "node:child_process";
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

type PageMetrics = {
  clientHeight: number;
  clientWidth: number;
  documentClientWidth: number;
  documentScrollWidth: number;
  height: number;
  overflowY: number;
  scrollHeight: number;
  scrollWidth: number;
};

type IntroMetrics = PageMetrics & {
  descriptionGap: number;
  descriptionOverlapsTitleRow: boolean;
  paddingBottom: number;
  paddingTop: number;
  titleGap: number;
  titleRowVerticalOverlap: boolean;
};

type HomeMetrics = PageMetrics & {
  cardOverflowXs: number[];
  rowTopDeltas: number[];
  titleFontSizes: number[];
  titleLineCounts: number[];
};

type RouteContract = {
  filename: string;
  pathname: string;
  selector: string;
};

const routeContracts: RouteContract[] = [
  {
    filename: "parent-needs-new",
    pathname: "/parent-needs/new",
    selector: ".publish-hero"
  },
  {
    filename: "tutor-profiles-new",
    pathname: "/tutor-profiles/new",
    selector: ".publish-hero"
  },
  {
    filename: "parent-needs-detail",
    pathname: "/parent-needs/preview-parent",
    selector: ".detail-hero"
  },
  {
    filename: "tutor-profiles-detail",
    pathname: "/tutor-profiles/preview-tutor",
    selector: ".detail-hero"
  },
  {
    filename: "chat-detail",
    pathname: "/chats/preview-chat",
    selector: ".workspace-header"
  }
];

const viewports = [
  { height: 800, key: "1280x800", targetHeight: 164.16, width: 1280 },
  { height: 900, key: "1440x900", targetHeight: 132.41, width: 1440 },
  { height: 1080, key: "1920x1080", targetHeight: 135.69, width: 1920 },
  { height: 844, key: "390x844", targetHeight: null, width: 390 }
] as const;

function readRuntimeValue<T>(result: unknown) {
  return (result as { result?: { value?: T } }).result?.value;
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

async function reservePort() {
  const server = createServer();

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("无法预留真实页面测试端口。");
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  return address.port;
}

function terminateProcessTree(processId: number | undefined) {
  if (!processId) {
    return;
  }

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
    // The process may already have exited.
  }
}

const mockApiScript = String.raw`
(() => {
  const originalFetch = window.fetch.bind(window);
  const success = (value) =>
    new Response(JSON.stringify({ ok: true, value, errors: {} }), {
      headers: { "content-type": "application/json" },
      status: 200
    });
  const parentNeed = {
    id: "preview-parent",
    teacherGenderPreference: "不限",
    subjects: ["数学"],
    grade: "初二",
    budgetMin: 80,
    budgetMax: 120,
    timeSlots: ["周六下午"],
    region: {
      province: "广东省",
      city: "东莞市",
      district: "松山湖"
    },
    community: "匿名测试区域",
    childIntro: "本地匿名视觉验收数据",
    status: "published",
    createdAt: "2026-07-30T00:00:00.000Z",
    updatedAt: "2026-07-30T00:00:00.000Z"
  };
  const tutorProfile = {
    id: "preview-tutor",
    gender: "女",
    school: "匿名测试大学",
    major: "数学",
    subjects: ["数学"],
    grades: ["初中"],
    timeSlots: ["周六下午"],
    feeRanges: [{ grade: "初中", subject: "数学", min: 80, max: 120 }],
    abilityDescription: "本地匿名视觉验收数据",
    proofImages: [],
    status: "published",
    createdAt: "2026-07-30T00:00:00.000Z",
    updatedAt: "2026-07-30T00:00:00.000Z"
  };
  const conversation = {
    id: "preview-chat",
    sourceId: "preview-parent",
    sourceType: "parent-need",
    createdAt: "2026-07-30T00:00:00.000Z"
  };

  window.fetch = (input, init) => {
    const rawUrl = typeof input === "string" ? input : input.url;
    const url = new URL(rawUrl, location.origin);

    if (url.pathname === "/api/parent-needs/preview-parent") {
      return Promise.resolve(success(parentNeed));
    }

    if (url.pathname === "/api/tutor-profiles/preview-tutor") {
      return Promise.resolve(success(tutorProfile));
    }

    if (url.pathname === "/api/conversations/preview-chat") {
      return Promise.resolve(success(conversation));
    }

    if (url.pathname === "/api/conversations/preview-chat/messages") {
      return Promise.resolve(success([]));
    }

    if (
      url.pathname === "/api/contact-exchange" &&
      url.searchParams.get("conversationId") === "preview-chat"
    ) {
      return Promise.resolve(
        success(url.searchParams.get("view") === "authorized-profiles" ? null : [])
      );
    }

    return originalFetch(input, init);
  };
})();
`;

describeWithBrowser("业务方确认预览的真实 Next 页面几何", () => {
  let baseUrl = "";
  let browserProcess: ReturnType<typeof spawn>;
  let cdp: CdpClient;
  let nextProcess: ReturnType<typeof spawn>;
  let profileDirectory = "";
  const screenshotDirectory =
    process.env.UI_PREVIEW_ACTUAL_DIR ??
    path.join(tmpdir(), "site-ux-preview-confirmed-actual");
  const measurements: Record<string, Record<string, HomeMetrics | IntroMetrics>> = {};
  const mobileCrops: Array<{ buffer: Buffer; label: string }> = [];

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
    for (let attempt = 0; attempt < 500; attempt += 1) {
      if (await evaluate<boolean>(`Boolean(${expression})`)) {
        return;
      }

      await delay(50);
    }

    throw new Error(`${message}；pathname=${await evaluate<string>("location.pathname")}`);
  }

  async function setViewport(width: number, height: number) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      deviceScaleFactor: 1,
      height,
      mobile: width <= 720,
      screenHeight: height,
      screenWidth: width,
      width
    });
  }

  async function navigate(pathname: string, selector: string) {
    await cdp.send("Page.navigate", { url: `${baseUrl}${pathname}` });
    await waitFor(
      `document.readyState === "complete" && location.pathname === ${JSON.stringify(
        pathname
      )}`,
      `页面未完成导航：${pathname}`
    );
    await waitFor(
      `document.querySelector(${JSON.stringify(selector)})`,
      `目标区域未渲染：${pathname}`
    );
  }

  async function measure(selector: string) {
    const metrics = await evaluate<IntroMetrics>(`(() => {
      const node = document.querySelector(${JSON.stringify(selector)});
      const rect = node.getBoundingClientRect();
      const copy = node.matches(".workspace-header")
        ? node.querySelector(":scope > div")
        : node.querySelector(".publish-copy, .market-copy");
      const eyebrow = copy.querySelector(".eyebrow").getBoundingClientRect();
      const title = copy.querySelector(".section-title").getBoundingClientRect();
      const description = copy.querySelector(":scope > p").getBoundingClientRect();
      const style = getComputedStyle(node);
      const titleRowBottom = Math.max(eyebrow.bottom, title.bottom);
      return {
        clientHeight: node.clientHeight,
        clientWidth: node.clientWidth,
        descriptionGap: description.top - titleRowBottom,
        descriptionOverlapsTitleRow: description.top < titleRowBottom,
        documentClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        height: rect.height,
        overflowY: Math.max(0, node.scrollHeight - node.clientHeight),
        paddingBottom: Number.parseFloat(style.paddingBottom),
        paddingTop: Number.parseFloat(style.paddingTop),
        scrollHeight: node.scrollHeight,
        scrollWidth: node.scrollWidth,
        titleGap: title.left - eyebrow.right,
        titleRowVerticalOverlap:
          eyebrow.top < title.bottom && eyebrow.bottom > title.top
      };
    })()`);

    if (!metrics) {
      throw new Error(`未返回目标区域几何：${selector}`);
    }

    return metrics;
  }

  async function measureHome() {
    const metrics = await evaluate<HomeMetrics>(`(() => {
      const node = document.querySelector(".home-entry-grid");
      const rect = node.getBoundingClientRect();
      const cards = Array.from(node.querySelectorAll(".home-entry-card"));
      const rowTopDeltas = [":scope > span", ":scope > h2", ":scope > p", ":scope > .home-entry-button"].map(
        (selector) => {
          const offsets = cards.map((card) => {
            const cardRect = card.getBoundingClientRect();
            return card.querySelector(selector).getBoundingClientRect().top - cardRect.top;
          });
          return Math.abs(offsets[0] - offsets[1]);
        }
      );
      const titleFontSizes = cards.map((card) =>
        Number.parseFloat(getComputedStyle(card.querySelector("h2")).fontSize)
      );
      const titleLineCounts = cards.map((card) => {
        const title = card.querySelector("h2");
        const titleRect = title.getBoundingClientRect();
        const lineHeight = Number.parseFloat(getComputedStyle(title).lineHeight);
        return Math.round(titleRect.height / lineHeight);
      });
      return {
        cardOverflowXs: cards.map((card) =>
          Math.max(0, card.scrollWidth - card.clientWidth)
        ),
        clientHeight: node.clientHeight,
        clientWidth: node.clientWidth,
        documentClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        height: rect.height,
        overflowY: Math.max(0, node.scrollHeight - node.clientHeight),
        rowTopDeltas,
        scrollHeight: node.scrollHeight,
        scrollWidth: node.scrollWidth,
        titleFontSizes,
        titleLineCounts
      };
    })()`);

    if (!metrics) {
      throw new Error("未返回首页发布入口几何。");
    }

    return metrics;
  }

  async function captureViewport(filename: string) {
    const screenshot = (await cdp.send("Page.captureScreenshot", {
      captureBeyondViewport: false,
      format: "png",
      fromSurface: true
    })) as { data?: string };

    if (!screenshot.data) {
      throw new Error(`Chrome 未返回截图：${filename}`);
    }

    await writeFile(
      path.join(screenshotDirectory, filename),
      Buffer.from(screenshot.data, "base64")
    );
  }

  async function captureElement(selector: string) {
    const clip = await evaluate<{
      height: number;
      width: number;
      x: number;
      y: number;
    }>(`(() => {
      const rect = document.querySelector(${JSON.stringify(
        selector
      )}).getBoundingClientRect();
      return {
        height: rect.height,
        width: rect.width,
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY
      };
    })()`);

    if (!clip) {
      throw new Error(`未返回截图区域：${selector}`);
    }

    const screenshot = (await cdp.send("Page.captureScreenshot", {
      captureBeyondViewport: true,
      clip: { ...clip, scale: 1 },
      format: "png",
      fromSurface: true
    })) as { data?: string };

    if (!screenshot.data) {
      throw new Error(`Chrome 未返回移动裁切图：${selector}`);
    }

    return Buffer.from(screenshot.data, "base64");
  }

  async function writeMobileContactSheet() {
    const imageMap = new Map(
      mobileCrops.map(({ buffer }, index) => [`/${index}.png`, buffer])
    );
    const contactSheetServer = createServer((request, response) => {
      const image = imageMap.get(request.url ?? "");

      if (image) {
        response.writeHead(200, { "content-type": "image/png" });
        response.end(image);
        return;
      }

      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      * { box-sizing: border-box; }
      body { background: #f4f1e8; margin: 0; padding: 12px; width: 390px; }
      section { background: #fff; border: 2px solid #111; margin-bottom: 12px; padding: 6px; }
      h2 { font: 700 13px/1.3 system-ui, sans-serif; margin: 0 0 6px; }
      img { display: block; height: auto; width: 100%; }
    </style>
  </head>
  <body>
    ${mobileCrops
      .map(
        ({ label }, index) =>
          `<section><h2>${label}</h2><img alt="" src="/${index}.png"></section>`
      )
      .join("")}
  </body>
</html>`);
    });

    await new Promise<void>((resolve) => {
      contactSheetServer.listen(0, "127.0.0.1", resolve);
    });
    const address = contactSheetServer.address();

    if (!address || typeof address === "string") {
      throw new Error("无法启动移动合并图服务。");
    }

    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${address.port}` });
    await waitFor('document.readyState === "complete"', "移动合并图未完成渲染");
    const layoutMetrics = (await cdp.send("Page.getLayoutMetrics")) as {
      cssContentSize?: { height: number; width: number; x: number; y: number };
    };
    const contentSize = layoutMetrics.cssContentSize;

    if (!contentSize) {
      throw new Error("Chrome 未返回移动合并图尺寸。");
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
      format: "png",
      fromSurface: true
    })) as { data?: string };

    if (!screenshot.data) {
      throw new Error("Chrome 未返回移动合并图。");
    }

    await writeFile(
      path.join(screenshotDirectory, "390-combined.png"),
      Buffer.from(screenshot.data, "base64")
    );
    await new Promise<void>((resolve, reject) => {
      contactSheetServer.close((error) => (error ? reject(error) : resolve()));
    });
  }

  beforeAll(async () => {
    if (!browserPath) {
      throw new Error("未找到 Chrome/Edge，无法执行真实页面视觉契约。");
    }

    await mkdir(screenshotDirectory, { recursive: true });
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
          AUTH_SESSION_SECRET: "ui-preview-confirmed-browser-secret",
          NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true"
        },
        stdio: "ignore",
        windowsHide: true
      }
    );

    for (let attempt = 0; attempt < 400; attempt += 1) {
      try {
        const response = await fetch(baseUrl);

        if (response.ok) {
          break;
        }
      } catch {
        await delay(100);
      }

      if (attempt === 399) {
        throw new Error("真实页面 Next.js 服务未在预期时间内就绪。");
      }
    }

    profileDirectory = await mkdtemp(
      path.join(tmpdir(), "ui-preview-confirmed-chrome-")
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
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
      source: mockApiScript
    });
    await setViewport(1440, 900);
    await navigate("/", ".home-entry-grid");
    const loginOk = await evaluate<boolean>(`fetch("/api/auth/test-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: "13800138000", code: "000000" })
    }).then((response) => response.ok)`);

    if (!loginOk) {
      throw new Error("本地匿名测试登录未成功。");
    }
  }, 120_000);

  afterAll(async () => {
    if (cdp) {
      void cdp.send("Browser.close").catch(() => undefined);
      cdp.close();
    }

    if (browserProcess?.exitCode === null) {
      browserProcess.kill();
    }

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

  it("matches the five real page intros and the home four-row CTA contract", async () => {
    for (const viewport of viewports) {
      await setViewport(viewport.width, viewport.height);
      measurements[viewport.key] = {};

      await navigate("/", ".home-entry-grid");
      const home = await measureHome();
      measurements[viewport.key].home = home;

      expect
        .soft(Math.max(...home.rowTopDeltas), JSON.stringify(home))
        .toBeLessThanOrEqual(1);
      expect.soft(home.titleLineCounts, JSON.stringify(home)).toEqual([1, 1]);
      expect.soft(home.titleFontSizes, JSON.stringify(home)).toEqual(
        viewport.width === 390 ? [32, 32] : [44, 44]
      );
      expect
        .soft(Math.max(...home.cardOverflowXs), JSON.stringify(home))
        .toBe(0);
      expect
        .soft(home.scrollWidth, JSON.stringify(home))
        .toBeLessThanOrEqual(home.clientWidth);
      expect
        .soft(home.documentScrollWidth, JSON.stringify(home))
        .toBeLessThanOrEqual(home.documentClientWidth);

      if (viewport.width === 1440) {
        await captureViewport("1440-home-cta.png");
      }

      if (viewport.width === 390) {
        mobileCrops.push({
          buffer: await captureElement(".home-entry-grid"),
          label: "首页发布入口"
        });
      }

      for (const contract of routeContracts) {
        await navigate(contract.pathname, contract.selector);
        const metrics = await measure(contract.selector);
        measurements[viewport.key][contract.filename] = metrics;

        expect
          .soft(metrics.documentScrollWidth, JSON.stringify(metrics))
          .toBeLessThanOrEqual(metrics.documentClientWidth);
        expect
          .soft(metrics.scrollWidth, JSON.stringify(metrics))
          .toBeLessThanOrEqual(metrics.clientWidth);
        expect.soft(metrics.overflowY, JSON.stringify(metrics)).toBe(0);

        if (viewport.targetHeight === null) {
          expect.soft(metrics.height, JSON.stringify(metrics)).toBeGreaterThan(0);
        } else {
          expect
            .soft(metrics.height, JSON.stringify(metrics))
            .toBeCloseTo(viewport.targetHeight, 1);
          expect.soft(metrics.titleGap, JSON.stringify(metrics)).toBeCloseTo(16, 0);
          expect
            .soft(metrics.titleRowVerticalOverlap, JSON.stringify(metrics))
            .toBe(true);
          expect
            .soft(metrics.descriptionOverlapsTitleRow, JSON.stringify(metrics))
            .toBe(false);

          if (contract.filename.endsWith("-new")) {
            expect
              .soft(metrics.descriptionGap, JSON.stringify(metrics))
              .toBeGreaterThanOrEqual(6);
            expect.soft(metrics.paddingTop, JSON.stringify(metrics)).toBeCloseTo(15, 0);
            expect
              .soft(metrics.paddingBottom, JSON.stringify(metrics))
              .toBeCloseTo(15, 0);
          } else if (contract.filename === "chat-detail") {
            expect.soft(metrics.paddingTop, JSON.stringify(metrics)).toBeCloseTo(4, 0);
            expect
              .soft(metrics.paddingBottom, JSON.stringify(metrics))
              .toBeCloseTo(5, 0);
          } else {
            expect.soft(metrics.paddingTop, JSON.stringify(metrics)).toBeCloseTo(5, 0);
            expect
              .soft(metrics.paddingBottom, JSON.stringify(metrics))
              .toBeCloseTo(5, 0);
          }
        }

        if (viewport.width === 1440) {
          await captureViewport(`1440-${contract.filename}.png`);
        }

        if (viewport.width === 390) {
          mobileCrops.push({
            buffer: await captureElement(contract.selector),
            label: contract.pathname
          });
        }
      }
    }

    await writeMobileContactSheet();
    await writeFile(
      path.join(screenshotDirectory, "dom-measurements.json"),
      `${JSON.stringify(measurements, null, 2)}\n`,
      "utf8"
    );
  }, 180_000);
});
