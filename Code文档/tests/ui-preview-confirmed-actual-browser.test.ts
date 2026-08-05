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
  backgroundColor: string;
  borderRadius: string;
  borderTopWidth: number;
  boxShadow: string;
  chatDecorationContained: boolean;
  chatMainHeaderBackgroundColor: string;
  chatWorkspaceGap: number;
  contactActionBackgroundColor: string;
  contactBackgroundColor: string;
  descriptionGap: number;
  descriptionOverlapsTitleRow: boolean;
  mobilePanelOrder: string;
  paddingBottom: number;
  paddingTop: number;
  titleGap: number;
  titleRowVerticalOverlap: boolean;
};

type HomeMetrics = PageMetrics & {
  cardOverflowXs: number[];
  ctaCards: Array<{
    buttonBottomToBorder: number;
    buttonHeight: number;
    buttonLeftToCardInner: number;
    buttonRightToCardInner: number;
    buttonTop: number;
    cardHeight: number;
  }>;
  rowTopDeltas: number[];
  titleFontSizes: number[];
  titleLineCounts: number[];
};

type ProfileMetrics = {
  backgroundColor: string;
  borderTopWidth: number;
  borderRadius: string;
  boxShadow: string;
  contentBottom: number;
  contentHeight: number;
  contentTop: number;
  decorationBottom: number;
  decorationLeft: number;
  decorationTop: number;
  documentClientWidth: number;
  documentScrollWidth: number;
  height: number;
  overflowY: number;
  paddingBottom: number;
  paddingTop: number;
  nextBlockGap: number;
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

const profileHeroMaximumHeights = {
  "1280x800": 164.16,
  "1440x900": 132.41,
  "1920x1080": 135.69,
  "390x844": 148
} as const;

const chatHeroTargetHeights = {
  "1280x800": 112,
  "1440x900": 112,
  "1920x1080": 112,
  "390x844": 142
} as const;

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
  const failure = (message, status = 400) =>
    new Response(JSON.stringify({
      ok: false,
      value: null,
      errors: { request: message }
    }), {
      headers: { "content-type": "application/json" },
      status
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
    updatedAt: "2026-07-30T00:00:00.000Z",
    version: 1,
    managementState: "managed",
    deletedAt: null,
    deletedByUserId: null
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
    updatedAt: "2026-07-30T00:00:00.000Z",
    version: 1,
    managementState: "managed",
    deletedAt: null,
    deletedByUserId: null
  };
  const conversation = {
    id: "preview-chat",
    sourceId: "preview-parent",
    sourceType: "parent-need",
    createdAt: "2026-07-30T00:00:00.000Z",
    sourceStatus: "published",
    readOnly: false
  };
  let chatRaceConversationReads = 0;
  let chatRaceOldChildResponsesRemaining = 0;
  window.issue0033RaceOldPublishedReleased = false;

  window.fetch = (input, init) => {
    const rawUrl = typeof input === "string" ? input : input.url;
    const url = new URL(rawUrl, location.origin);
    const method = (init && init.method ? init.method : "GET").toUpperCase();
    const mode = localStorage.getItem("issue0033-mode") || "normal";

    if (
      url.pathname === "/api/parent-needs" &&
      url.searchParams.get("scope") === "mine"
    ) {
      if (mode === "parent-list-failure") {
        return Promise.resolve(failure("需求列表加载失败", 503));
      }
      const now = Date.now();
      return Promise.resolve(success([
        { ...parentNeed, id: "active-parent", grade: "有效年级" },
        {
          ...parentNeed,
          id: "deleted-parent",
          grade: "待恢复年级",
          status: "deleted",
          deletedAt: new Date(now - 60 * 60 * 1000).toISOString(),
          version: 2
        },
        {
          ...parentNeed,
          id: "expired-parent",
          grade: "过期年级",
          status: "deleted",
          deletedAt: new Date(now - 49 * 60 * 60 * 1000).toISOString(),
          version: 2
        },
        {
          ...parentNeed,
          id: "legacy-parent",
          grade: "旧记录年级",
          managementState: "legacy-readonly",
          updatedAt: "",
          version: 0
        }
      ]));
    }

    if (
      url.pathname === "/api/tutor-profiles" &&
      url.searchParams.get("scope") === "mine"
    ) {
      if (mode === "tutor-list-failure") {
        return Promise.resolve(failure("家教信息列表加载失败", 503));
      }
      const now = Date.now();
      return Promise.resolve(success([
        { ...tutorProfile, id: "active-tutor", school: "有效大学" },
        {
          ...tutorProfile,
          id: "deleted-tutor",
          school: "待恢复大学",
          status: "deleted",
          deletedAt: new Date(now - 60 * 60 * 1000).toISOString(),
          version: 2
        },
        {
          ...tutorProfile,
          id: "expired-tutor",
          school: "过期大学",
          status: "deleted",
          deletedAt: new Date(now - 49 * 60 * 60 * 1000).toISOString(),
          version: 2
        },
        {
          ...tutorProfile,
          id: "legacy-tutor",
          school: "旧记录大学",
          managementState: "legacy-readonly",
          updatedAt: "",
          version: 0
        }
      ]));
    }

    if (url.pathname === "/api/parent-needs" && method === "GET") {
      return Promise.resolve(success([parentNeed]));
    }

    if (url.pathname === "/api/tutor-profiles" && method === "GET") {
      return Promise.resolve(success([tutorProfile]));
    }

    if (url.searchParams.get("scope") === "mine") {
      const id = url.pathname.split("/").pop();
      const record = url.pathname.startsWith("/api/parent-needs/")
        ? { ...parentNeed, id }
        : { ...tutorProfile, id };

      if (id === "edit-slow") {
        return new Promise((resolve) => setTimeout(() => resolve(success(record)), 1500));
      }
      if (id === "edit-reject") {
        return Promise.reject(new Error("synthetic owner edit GET rejection"));
      }
      if (id === "edit-missing") {
        return Promise.resolve(failure("编辑记录加载失败", 404));
      }
      if (id === "edit-legacy") {
        return Promise.resolve(success({
          ...record,
          managementState: "legacy-readonly",
          updatedAt: "",
          version: 0
        }));
      }
      if (id === "edit-deleted") {
        return Promise.resolve(success({
          ...record,
          status: "deleted",
          deletedAt: new Date().toISOString(),
          version: 2
        }));
      }

      return Promise.resolve(success(record));
    }

    if (
      method === "DELETE" &&
      (url.pathname.startsWith("/api/parent-needs/") ||
        url.pathname.startsWith("/api/tutor-profiles/"))
    ) {
      return Promise.resolve(
        mode === "delete-failure"
          ? failure("删除操作失败", 409)
          : success({ status: "deleted", version: 2 })
      );
    }

    if (url.pathname === "/api/parent-needs/preview-parent") {
      return Promise.resolve(success(parentNeed));
    }

    if (url.pathname === "/api/tutor-profiles/preview-tutor") {
      return Promise.resolve(success(tutorProfile));
    }

    if (url.pathname === "/api/conversations/preview-chat") {
      if (mode === "chat-refresh-race") {
        chatRaceConversationReads += 1;

        if (chatRaceConversationReads === 1) {
          return new Promise((resolve) => setTimeout(() => {
            chatRaceOldChildResponsesRemaining = 3;
            window.issue0033RaceOldPublishedReleased = true;
            resolve(success(conversation));
          }, 3500));
        }

        return Promise.resolve(success({
          ...conversation,
          sourceStatus: "deleted",
          readOnly: true
        }));
      }

      return Promise.resolve(success(mode === "chat-deleted"
        ? { ...conversation, sourceStatus: "deleted", readOnly: true }
        : conversation));
    }

    if (url.pathname === "/api/conversations/preview-chat/messages") {
      if (
        mode === "chat-refresh-race" &&
        chatRaceOldChildResponsesRemaining > 0
      ) {
        chatRaceOldChildResponsesRemaining -= 1;
      }
      return Promise.resolve(success([]));
    }

    if (
      url.pathname === "/api/contact-exchange" &&
      url.searchParams.get("conversationId") === "preview-chat"
    ) {
      const isOldRaceResponse =
        mode === "chat-refresh-race" &&
        chatRaceOldChildResponsesRemaining > 0;

      if (isOldRaceResponse) {
        chatRaceOldChildResponsesRemaining -= 1;
      }

      if (url.searchParams.get("view") === "authorized-profiles") {
        const profiles = {
          currentUser: {
            ownerUserId: "preview-parent",
            phone: "00000000000",
            wechat: "issue0033_current",
            updatedAt: "2026-07-30T00:00:00.000Z"
          },
          otherUser: {
            ownerUserId: "preview-tutor",
            phone: "11111111111",
            wechat: "issue0033_other",
            updatedAt: "2026-07-30T00:00:00.000Z"
          }
        };

        return mode === "chat-deleted"
          ? new Promise((resolve) => setTimeout(() => resolve(success(null)), 1500))
          : Promise.resolve(success(
              mode === "chat-refresh-race" && !isOldRaceResponse
                ? null
                : profiles
            ));
      }

      return Promise.resolve(
        success(mode === "chat-deleted" ||
          (mode === "chat-refresh-race" && !isOldRaceResponse)
          ? [
              {
                id: "received-pending",
                conversationId: "preview-chat",
                direction: "received",
                status: "pending",
                secondConfirmedAt: null,
                createdAt: "2026-07-30T00:00:00.000Z",
                updatedAt: "2026-07-30T00:00:00.000Z"
              },
              {
                id: "sent-pending",
                conversationId: "preview-chat",
                direction: "sent",
                status: "pending",
                secondConfirmedAt: null,
                createdAt: "2026-07-30T00:00:00.000Z",
                updatedAt: "2026-07-30T00:00:00.000Z"
              }
            ]
          : [])
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
  const measurements: Record<
    string,
    Record<string, HomeMetrics | IntroMetrics | ProfileMetrics>
  > = {};
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
    const expectedPathname = new URL(pathname, baseUrl).pathname;
    await waitFor(
      `document.readyState === "complete" && location.pathname === ${JSON.stringify(
        expectedPathname
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
      const decoration = node.querySelector(".chat-header-decoration");
      const decorationRect = decoration ? decoration.getBoundingClientRect() : null;
      const workspace = node.matches(".workspace-header")
        ? node.nextElementSibling
        : null;
      const workspaceRect = workspace ? workspace.getBoundingClientRect() : null;
      const main = workspace?.querySelector(".conversation-main");
      const context = workspace?.querySelector(".conversation-context");
      const contact = workspace?.querySelector(".contact-status-panel");
      const contactAction = contact?.querySelector("button");
      const mainHeader = main?.querySelector(".conversation-main-header");
      const titleRowBottom = Math.max(eyebrow.bottom, title.bottom);
      return {
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        borderTopWidth: Number.parseFloat(style.borderTopWidth),
        boxShadow: style.boxShadow,
        chatDecorationContained: !decorationRect || (
          decorationRect.left >= rect.left &&
          decorationRect.right <= rect.right &&
          decorationRect.top >= rect.top &&
          decorationRect.bottom <= rect.bottom
        ),
        chatMainHeaderBackgroundColor: mainHeader
          ? getComputedStyle(mainHeader).backgroundColor
          : "",
        chatWorkspaceGap: workspaceRect ? workspaceRect.top - rect.bottom : 0,
        contactActionBackgroundColor: contactAction
          ? getComputedStyle(contactAction).backgroundColor
          : "",
        contactBackgroundColor: contact ? getComputedStyle(contact).backgroundColor : "",
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
        mobilePanelOrder: main && context && contact
          ? [main, context, contact]
              .sort((left, right) => left.getBoundingClientRect().top - right.getBoundingClientRect().top)
              .map((panel) => panel === main ? "main" : panel === context ? "context" : "contact")
              .join(">")
          : "",
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
      const ctaCards = cards.map((card) => {
        const cardRect = card.getBoundingClientRect();
        const buttonRect = card
          .querySelector(".home-entry-button")
          .getBoundingClientRect();
        const cardStyle = getComputedStyle(card);
        const cardBorderLeft = Number.parseFloat(cardStyle.borderLeftWidth);
        const cardBorderRight = Number.parseFloat(cardStyle.borderRightWidth);

        return {
          buttonBottomToBorder: cardRect.bottom - buttonRect.bottom,
          buttonHeight: buttonRect.height,
          buttonLeftToCardInner:
            buttonRect.left - cardRect.left - cardBorderLeft,
          buttonRightToCardInner:
            cardRect.right - cardBorderRight - buttonRect.right,
          buttonTop: buttonRect.top - cardRect.top,
          cardHeight: cardRect.height
        };
      });
      return {
        cardOverflowXs: cards.map((card) =>
          Math.max(0, card.scrollWidth - card.clientWidth)
        ),
        ctaCards,
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

  async function measureProfile() {
    const metrics = await evaluate<ProfileMetrics>(`(() => {
      const hero = document.querySelector(".dplus-profile-page .workspace-header");
      const panel = document.querySelector(".dplus-profile-page .wide-panel");
      const copy = hero.querySelector(":scope > div");
      const nextBlock = panel.querySelector(".account-dashboard");
      const heroRect = hero.getBoundingClientRect();
      const copyRect = copy.getBoundingClientRect();
      const heroStyle = getComputedStyle(hero);
      const decorationStyle = getComputedStyle(hero, "::before");
      const decorationHeight = Number.parseFloat(decorationStyle.height);
      const decorationRight = Number.parseFloat(decorationStyle.right);
      const decorationTop = Number.parseFloat(decorationStyle.top);
      const decorationWidth = Number.parseFloat(decorationStyle.width);

      return {
        backgroundColor: heroStyle.backgroundColor,
        borderRadius: heroStyle.borderRadius,
        borderTopWidth: Number.parseFloat(heroStyle.borderTopWidth),
        boxShadow: heroStyle.boxShadow,
        contentBottom: heroRect.bottom - copyRect.bottom,
        contentHeight: copyRect.height,
        contentTop: copyRect.top - heroRect.top,
        decorationBottom:
          hero.clientHeight - decorationTop - decorationHeight,
        decorationLeft: hero.clientWidth - decorationRight - decorationWidth,
        decorationTop,
        documentClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        height: heroRect.height,
        overflowY: Math.max(0, hero.scrollHeight - hero.clientHeight),
        paddingBottom: Number.parseFloat(heroStyle.paddingBottom),
        paddingTop: Number.parseFloat(heroStyle.paddingTop),
        nextBlockGap: nextBlock.getBoundingClientRect().top - heroRect.bottom
      };
    })()`);

    if (!metrics) {
      throw new Error("未返回个人中心 Hero 几何。");
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

      const ctaBottomMinimum = viewport.width === 390 ? 16 : 20;
      const ctaBottomMaximum = viewport.width === 390 ? 20 : 24;
      const [leftCta, rightCta] = home.ctaCards;
      const ctaSideInset = viewport.width === 390 ? 20 : 32;

      for (const cta of home.ctaCards) {
        expect
          .soft(cta.buttonLeftToCardInner, JSON.stringify(home))
          .toBeCloseTo(ctaSideInset, 1);
        expect
          .soft(cta.buttonRightToCardInner, JSON.stringify(home))
          .toBeCloseTo(ctaSideInset, 1);
      }

      for (const cta of home.ctaCards) {
        expect
          .soft(cta.buttonBottomToBorder, JSON.stringify(home))
          .toBeGreaterThanOrEqual(ctaBottomMinimum);
        expect
          .soft(cta.buttonBottomToBorder, JSON.stringify(home))
          .toBeLessThanOrEqual(ctaBottomMaximum);
      }

      expect
        .soft(Math.abs(leftCta.buttonTop - rightCta.buttonTop), JSON.stringify(home))
        .toBeLessThanOrEqual(1);
      expect
        .soft(
          Math.abs(leftCta.buttonHeight - rightCta.buttonHeight),
          JSON.stringify(home)
        )
        .toBeLessThanOrEqual(1);
      expect
        .soft(
          Math.abs(leftCta.buttonBottomToBorder - rightCta.buttonBottomToBorder),
          JSON.stringify(home)
        )
        .toBeLessThanOrEqual(1);
      expect
        .soft(
          Math.abs(leftCta.buttonLeftToCardInner - rightCta.buttonLeftToCardInner),
          JSON.stringify(home)
        )
        .toBeLessThanOrEqual(0.1);
      expect
        .soft(
          Math.abs(leftCta.buttonRightToCardInner - rightCta.buttonRightToCardInner),
          JSON.stringify(home)
        )
        .toBeLessThanOrEqual(0.1);
      expect
        .soft(Math.abs(leftCta.cardHeight - rightCta.cardHeight), JSON.stringify(home))
        .toBeLessThanOrEqual(1);

      await captureViewport(`${viewport.key}-home-cta.png`);

      if (viewport.width === 390) {
        mobileCrops.push({
          buffer: await captureElement(".home-entry-grid"),
          label: "首页发布入口"
        });
      }

      await navigate("/profile", ".dplus-profile-page .workspace-header");
      const profile = await measureProfile();
      measurements[viewport.key].profile = profile;

      expect
        .soft(profile.documentScrollWidth, JSON.stringify(profile))
        .toBeLessThanOrEqual(profile.documentClientWidth);
      expect.soft(profile.overflowY, JSON.stringify(profile)).toBe(0);
      expect
        .soft(profile.backgroundColor, JSON.stringify(profile))
        .toBe("rgb(255, 249, 232)");
      expect.soft(profile.borderTopWidth, JSON.stringify(profile)).toBe(3);
      expect.soft(profile.borderRadius, JSON.stringify(profile)).toBe("22px");
      expect
        .soft(profile.boxShadow, JSON.stringify(profile))
        .toContain("6px 6px 0px");
      expect
        .soft(profile.height, JSON.stringify(profile))
        .toBeLessThanOrEqual(profileHeroMaximumHeights[viewport.key]);
      expect.soft(profile.contentTop, JSON.stringify(profile)).toBeGreaterThanOrEqual(0);
      expect
        .soft(profile.contentBottom, JSON.stringify(profile))
        .toBeGreaterThanOrEqual(0);
      expect
        .soft(profile.decorationLeft, JSON.stringify(profile))
        .toBeGreaterThanOrEqual(0);
      expect
        .soft(profile.decorationTop, JSON.stringify(profile))
        .toBeGreaterThanOrEqual(0);
      expect
        .soft(profile.decorationBottom, JSON.stringify(profile))
        .toBeGreaterThanOrEqual(0);
      expect
        .soft(profile.nextBlockGap, JSON.stringify(profile))
        .toBeCloseTo(viewport.width === 390 ? 12 : 16, 0);

      await captureViewport(`${viewport.key}-profile-hero.png`);

      if (viewport.width === 390) {
        mobileCrops.push({
          buffer: await captureElement(".dplus-profile-page .workspace-header"),
          label: "/profile"
        });
      }

      await navigate("/profile/chats", ".dplus-profile-page .workspace-header");
      const childHeroFrame = await evaluate<{
        backgroundColor: string;
        borderTopWidth: number;
      }>(`(() => {
        const style = getComputedStyle(document.querySelector(".workspace-header"));
        return {
          backgroundColor: style.backgroundColor,
          borderTopWidth: Number.parseFloat(style.borderTopWidth)
        };
      })()`);
      if (!childHeroFrame) {
        throw new Error("个人中心子页未返回 Header 样式");
      }
      expect
        .soft(childHeroFrame.backgroundColor, JSON.stringify(childHeroFrame))
        .not.toBe("rgb(255, 249, 232)");
      expect.soft(childHeroFrame.borderTopWidth, JSON.stringify(childHeroFrame)).toBe(0);

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

        const targetHeight = contract.filename === "chat-detail"
          ? chatHeroTargetHeights[viewport.key]
          : viewport.targetHeight;

        if (targetHeight === null) {
          expect.soft(metrics.height, JSON.stringify(metrics)).toBeGreaterThan(0);
        } else {
          expect
            .soft(metrics.height, JSON.stringify(metrics))
            .toBeCloseTo(targetHeight, 1);
          expect
            .soft(metrics.descriptionOverlapsTitleRow, JSON.stringify(metrics))
            .toBe(false);

          if (contract.filename === "chat-detail") {
            expect.soft(metrics.backgroundColor, JSON.stringify(metrics)).toBe("rgb(255, 253, 247)");
            expect.soft(metrics.borderTopWidth, JSON.stringify(metrics)).toBe(3);
            expect.soft(metrics.borderRadius, JSON.stringify(metrics)).toBe("22px");
            expect.soft(metrics.boxShadow, JSON.stringify(metrics)).toContain("6px 6px 0px");
            expect.soft(metrics.chatDecorationContained, JSON.stringify(metrics)).toBe(true);
            expect
              .soft(metrics.chatWorkspaceGap, JSON.stringify(metrics))
              .toBeCloseTo(viewport.width === 390 ? 12 : 14, 0);
            expect
              .soft(metrics.chatMainHeaderBackgroundColor, JSON.stringify(metrics))
              .toBe("rgb(255, 253, 247)");
            expect.soft(metrics.contactBackgroundColor, JSON.stringify(metrics)).toBe("rgb(245, 230, 207)");
            expect
              .soft(metrics.contactActionBackgroundColor, JSON.stringify(metrics))
              .toBe("rgb(255, 253, 247)");
            expect
              .soft(metrics.paddingTop, JSON.stringify(metrics))
              .toBeCloseTo(viewport.width === 390 ? 12 : 8, 0);
            expect
              .soft(metrics.paddingBottom, JSON.stringify(metrics))
              .toBeCloseTo(viewport.width === 390 ? 12 : 8, 0);
            if (viewport.width === 390) {
              expect.soft(metrics.mobilePanelOrder, JSON.stringify(metrics)).toBe("main>context>contact");
            }
          } else if (contract.filename.endsWith("-new")) {
            expect.soft(metrics.titleGap, JSON.stringify(metrics)).toBeCloseTo(16, 0);
            expect
              .soft(metrics.titleRowVerticalOverlap, JSON.stringify(metrics))
              .toBe(true);
            expect
              .soft(metrics.descriptionGap, JSON.stringify(metrics))
              .toBeGreaterThanOrEqual(6);
            expect.soft(metrics.paddingTop, JSON.stringify(metrics)).toBeCloseTo(15, 0);
            expect
              .soft(metrics.paddingBottom, JSON.stringify(metrics))
              .toBeCloseTo(15, 0);
          } else {
            expect.soft(metrics.titleGap, JSON.stringify(metrics)).toBeCloseTo(16, 0);
            expect
              .soft(metrics.titleRowVerticalOverlap, JSON.stringify(metrics))
              .toBe(true);
            expect.soft(metrics.paddingTop, JSON.stringify(metrics)).toBeCloseTo(5, 0);
            expect
              .soft(metrics.paddingBottom, JSON.stringify(metrics))
              .toBeCloseTo(5, 0);
          }
        }

        if (contract.filename === "chat-detail") {
          await captureViewport(`${viewport.key}-${contract.filename}.png`);
        } else if (viewport.width === 1440) {
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
  }, 240_000);

  it("shows management actions only for active owner records", async () => {
    await setViewport(1280, 800);

    for (const contract of [
      {
        active: "有效年级",
        deleted: "待恢复年级",
        legacy: "旧记录年级",
        pathname: "/profile/parent-needs",
        publicPathname: "/parent-needs"
      },
      {
        active: "有效大学",
        deleted: "待恢复大学",
        legacy: "旧记录大学",
        pathname: "/profile/tutor-profiles",
        publicPathname: "/tutor-profiles"
      }
    ]) {
      await evaluate(`localStorage.removeItem("issue0033-mode")`);
      await navigate(contract.pathname, ".profile-record-list");
      const activeState = (await evaluate<{ actions: string[]; records: string[] }>(`(() => ({
        actions: Array.from(document.querySelectorAll(".profile-record-card a, .profile-record-card button"))
          .map((node) => node.textContent.trim()),
        records: Array.from(document.querySelectorAll(".profile-record-card h2"))
          .map((node) => node.textContent.trim())
      }))()`))!;
      expect.soft(activeState.records).toHaveLength(1);
      expect.soft(activeState.records[0]).toContain(contract.active);
      expect.soft(activeState.actions).toEqual(expect.arrayContaining(["编辑", "删除"]));

      await evaluate(`Array.from(document.querySelectorAll(".management-view-tabs button"))
        .find((button) => button.textContent.includes("已删除"))?.click()`);
      await waitFor(
        `document.body.textContent.includes(${JSON.stringify(contract.deleted)})`,
        `已删除视图未渲染：${contract.pathname}`
      );
      const deletedActions = (await evaluate<string[]>(`Array.from(
        document.querySelectorAll(".profile-record-card a, .profile-record-card button")
      ).map((node) => node.textContent.trim())`))!;
      expect.soft(deletedActions).not.toContain("编辑");
      expect.soft(deletedActions).not.toContain("删除");

      await evaluate(`Array.from(document.querySelectorAll(".management-view-tabs button"))
        .find((button) => button.textContent.includes("旧记录"))?.click()`);
      await waitFor(
        `document.body.textContent.includes(${JSON.stringify(contract.legacy)})`,
        `旧记录视图未渲染：${contract.pathname}`
      );
      const legacyState = (await evaluate<{ actions: string[]; text: string }>(`(() => ({
        actions: Array.from(document.querySelectorAll(".profile-record-card a, .profile-record-card button"))
          .map((node) => node.textContent.trim()),
        text: document.querySelector(".profile-record-list")?.textContent || ""
      }))()`))!;
      expect.soft(legacyState.text).toContain("重新发布以启用管理能力");
      expect.soft(legacyState.actions).not.toContain("编辑");
      expect.soft(legacyState.actions).not.toContain("删除");
      expect.soft(legacyState.actions).not.toContain("恢复");

      await navigate(contract.publicPathname, ".listing-card");
      const publicActions = (await evaluate<string[]>(`Array.from(
        document.querySelectorAll(".listing-card a, .listing-card button")
      ).map((node) => node.textContent.trim())`))!;
      expect.soft(publicActions).not.toContain("编辑");
      expect.soft(publicActions).not.toContain("删除");
    }
  }, 120_000);

  it("prefills managed owner edit forms without exposing blank inputs", async () => {
    await setViewport(1280, 800);

    for (const contract of [
      {
        pathname: "/parent-needs/new?edit=edit-slow",
        title: "编辑家教需求",
        expected: {
          values: {
            "#teacher-gender": "不限",
            "#grade": "初二",
            "#budget-min": "80",
            "#budget-max": "120",
            "#district": "松山湖",
            "#community": "匿名测试区域",
            "#child-intro": "本地匿名视觉验收数据"
          },
          checkedLabels: ["数学", "周六下午"]
        }
      },
      {
        pathname: "/tutor-profiles/new?edit=edit-slow",
        title: "编辑家教信息",
        expected: {
          values: {
            "#tutor-gender": "女",
            "#school": "匿名测试大学",
            "#major": "数学",
            "#fee-grade-0": "初中",
            "#fee-subject-0": "数学",
            "#fee-min-0": "80",
            "#fee-max-0": "120",
            "#ability-description": "本地匿名视觉验收数据"
          },
          checkedLabels: ["数学", "初中", "周六下午"]
        }
      }
    ]) {
      await cdp.send("Page.navigate", { url: `${baseUrl}${contract.pathname}` });
      await waitFor(
        `document.readyState === "complete" && document.body.textContent.includes(${JSON.stringify(
          contract.title
        )})`,
        `编辑页未进入加载态：${contract.pathname}`
      );

      const loadingState = (await evaluate<{ formVisible: boolean; statusText: string }>(`(() => ({
        formVisible: Boolean(document.querySelector(".step-form")),
        statusText: document.querySelector('[role="status"]')?.textContent?.trim() || ""
      }))()`))!;
      expect.soft(loadingState.formVisible).toBe(false);
      expect.soft(loadingState.statusText).toContain("正在加载");

      await waitFor(
        `document.querySelector(".step-form") && !document.querySelector("[data-submit-action]").disabled`,
        `managed owner 编辑表单未安全回填：${contract.pathname}`
      );
      const populated = (await evaluate<{
        checkedLabels: string[];
        values: Record<string, string>;
      }>(`(() => {
        const selectors = ${JSON.stringify(Object.keys(contract.expected.values))};
        return {
          checkedLabels: Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
            .map((input) => input.closest("label")?.textContent?.trim() || ""),
          values: Object.fromEntries(selectors.map((selector) => [
            selector,
            document.querySelector(selector)?.value || ""
          ]))
        };
      })()`))!;
      expect.soft(populated.values).toEqual(contract.expected.values);
      expect.soft(populated.checkedLabels).toEqual(
        expect.arrayContaining(contract.expected.checkedLabels)
      );
      await delay(250);
      const stableValues = (await evaluate<Record<string, string>>(`(() => {
        const selectors = ${JSON.stringify(Object.keys(contract.expected.values))};
        return Object.fromEntries(selectors.map((selector) => [
          selector,
          document.querySelector(selector)?.value || ""
        ]));
      })()`))!;
      expect.soft(stableValues).toEqual(contract.expected.values);
    }

    for (const contract of [
      {
        editHref: "/parent-needs/new?edit=active-parent",
        field: "#child-intro",
        listPathname: "/profile/parent-needs",
        value: "本地匿名视觉验收数据"
      },
      {
        editHref: "/tutor-profiles/new?edit=active-tutor",
        field: "#ability-description",
        listPathname: "/profile/tutor-profiles",
        value: "本地匿名视觉验收数据"
      }
    ]) {
      await navigate(contract.listPathname, ".profile-record-list");
      await evaluate(`document.querySelector(${JSON.stringify(
        `a[href="${contract.editHref}"]`
      )}).click()`);
      await waitFor(
        `location.pathname + location.search === ${JSON.stringify(contract.editHref)} && document.querySelector(${JSON.stringify(contract.field)})?.value === ${JSON.stringify(contract.value)}`,
        `管理页编辑入口未保留 id 或未回填：${contract.editHref}`
      );
    }
  }, 120_000);

  it("fails closed when managed owner edit GET rejects", async () => {
    await setViewport(1280, 800);

    for (const contract of [
      { pathname: "/parent-needs/new?edit=edit-reject", title: "编辑家教需求" },
      { pathname: "/tutor-profiles/new?edit=edit-reject", title: "编辑家教信息" }
    ]) {
      await cdp.send("Page.navigate", { url: `${baseUrl}${contract.pathname}` });
      await waitFor(
        `document.readyState === "complete" && document.body.textContent.includes(${JSON.stringify(
          contract.title
        )})`,
        `编辑页未进入请求态：${contract.pathname}`
      );
      await delay(500);
      const state = (await evaluate<{
        alertText: string;
        formVisible: boolean;
        statusText: string;
      }>(`(() => ({
        alertText: document.querySelector('[role="alert"]')?.textContent?.trim() || "",
        formVisible: Boolean(document.querySelector(".step-form")),
        statusText: document.querySelector('[role="status"]')?.textContent?.trim() || ""
      }))()`))!;
      expect.soft(state.formVisible).toBe(false);
      expect.soft(state.alertText).toContain("加载失败");
      expect.soft(state.statusText).not.toContain("正在加载");
    }
  }, 120_000);

  it("resets managed edit state when the same page returns to publish mode", async () => {
    await setViewport(1280, 800);

    for (const contract of [
      {
        editPathname: "/parent-needs/new?edit=edit-slow",
        loadedSelector: "#child-intro",
        publishPathname: "/parent-needs/new",
        publishTitle: "发布家教需求",
        expected: {
          checkedCount: 0,
          submitText: "发布家教需求",
          values: {
            "#teacher-gender": "不限",
            "#grade": "",
            "#budget-min": "",
            "#budget-max": "",
            "#district": "松山湖",
            "#community": "",
            "#child-intro": ""
          }
        }
      },
      {
        editPathname: "/tutor-profiles/new?edit=edit-slow",
        loadedSelector: "#ability-description",
        publishPathname: "/tutor-profiles/new",
        publishTitle: "发布家教信息",
        expected: {
          checkedCount: 0,
          submitText: "发布家教信息",
          values: {
            "#tutor-gender": "女",
            "#school": "",
            "#major": "",
            "#fee-grade-0": "",
            "#fee-subject-0": "",
            "#fee-min-0": "",
            "#fee-max-0": "",
            "#ability-description": ""
          }
        }
      }
    ]) {
      await cdp.send("Page.navigate", { url: `${baseUrl}${contract.editPathname}` });
      await waitFor(
        `document.querySelector(${JSON.stringify(contract.loadedSelector)})?.value === "本地匿名视觉验收数据"`,
        `编辑记录未先完成回填：${contract.editPathname}`
      );
      await evaluate(`history.pushState(null, "", ${JSON.stringify(contract.publishPathname)})`);
      await waitFor(
        `location.pathname + location.search === ${JSON.stringify(contract.publishPathname)} && document.body.textContent.includes(${JSON.stringify(contract.publishTitle)})`,
        `同组件未切换到发布模式：${contract.publishPathname}`
      );

      const state = (await evaluate<{
        checkedCount: number;
        submitText: string;
        values: Record<string, string>;
      }>(`(() => {
        const selectors = ${JSON.stringify(Object.keys(contract.expected.values))};
        return {
          checkedCount: document.querySelectorAll('input[type="checkbox"]:checked').length,
          submitText: document.querySelector('[data-submit-action]')?.textContent?.trim() || "",
          values: Object.fromEntries(selectors.map((selector) => [
            selector,
            document.querySelector(selector)?.value || ""
          ]))
        };
      })()`))!;
      expect.soft(state).toEqual(contract.expected);
    }
  }, 120_000);

  it("keeps ISSUE-0033 management states explicit and fail-closed", async () => {
    await setViewport(1280, 800);
    await evaluate(`localStorage.removeItem("issue0033-mode")`);

    for (const contract of [
      {
        active: "有效年级",
        deleted: "待恢复年级",
        expired: "过期年级",
        failureMode: "parent-list-failure",
        failureText: "需求列表加载失败",
        legacy: "旧记录年级",
        pathname: "/profile/parent-needs"
      },
      {
        active: "有效大学",
        deleted: "待恢复大学",
        expired: "过期大学",
        failureMode: "tutor-list-failure",
        failureText: "家教信息列表加载失败",
        legacy: "旧记录大学",
        pathname: "/profile/tutor-profiles"
      }
    ]) {
      await evaluate(`localStorage.removeItem("issue0033-mode")`);
      await navigate(contract.pathname, ".profile-list-toolbar");
      await waitFor(
        `document.querySelector(".profile-record-list")`,
        `默认有效列表未渲染：${contract.pathname}`
      );

      const defaultState = (await evaluate<{
        buttons: string[];
        records: string[];
      }>(`(() => ({
        buttons: Array.from(document.querySelectorAll(".management-view-tabs button"))
          .map((node) => node.textContent.trim()),
        records: Array.from(document.querySelectorAll(".profile-record-card h2"))
          .map((node) => node.textContent.trim())
      }))()`))!;
      expect.soft(defaultState.records).toHaveLength(1);
      expect.soft(defaultState.records[0]).toContain(contract.active);
      expect.soft(defaultState.buttons).toHaveLength(3);

      const clickedDeleted = await evaluate<boolean>(`(() => {
        const button = Array.from(document.querySelectorAll(".management-view-tabs button"))
          .find((node) => node.textContent.includes("已删除"));
        if (!button) return false;
        button.click();
        return true;
      })()`);
      expect.soft(clickedDeleted).toBe(true);
      if (clickedDeleted) {
        await waitFor(
          `document.body.textContent.includes(${JSON.stringify(contract.deleted)})`,
          `已删除视图未渲染：${contract.pathname}`
        );
        const deletedState = (await evaluate<{
          expiredHasRestore: boolean;
          text: string;
        }>(`(() => {
          const cards = Array.from(document.querySelectorAll(".profile-record-card"));
          const expired = cards.find((card) => card.textContent.includes(${JSON.stringify(
            contract.expired
          )}));
          return {
            expiredHasRestore: Boolean(expired && Array.from(expired.querySelectorAll("button"))
              .some((button) => button.textContent.trim() === "恢复")),
            text: document.querySelector(".profile-record-list").textContent
          };
        })()`))!;
        expect.soft(deletedState.text).toContain(contract.deleted);
        expect.soft(deletedState.text).toContain(contract.expired);
        expect.soft(deletedState.text).toContain("恢复期已过");
        expect.soft(deletedState.expiredHasRestore).toBe(false);
      }

      const clickedLegacy = await evaluate<boolean>(`(() => {
        const button = Array.from(document.querySelectorAll(".management-view-tabs button"))
          .find((node) => node.textContent.includes("旧记录"));
        if (!button) return false;
        button.click();
        return true;
      })()`);
      expect.soft(clickedLegacy).toBe(true);
      if (clickedLegacy) {
        await waitFor(
          `document.body.textContent.includes(${JSON.stringify(contract.legacy)})`,
          `旧记录视图未渲染：${contract.pathname}`
        );
      }

      await evaluate(`localStorage.setItem("issue0033-mode", ${JSON.stringify(
        contract.failureMode
      )})`);
      await navigate(contract.pathname, ".profile-list-toolbar");
      await waitFor(
        `document.querySelector('[role="alert"]') &&
          Array.from(document.querySelectorAll("button"))
            .some((button) => button.textContent.includes("重试"))`,
        `列表失败态未渲染：${contract.pathname}`
      );
      const failureState = (await evaluate<{
        alertText: string;
        hasRetry: boolean;
      }>(`(() => ({
        alertText: document.querySelector('[role="alert"]')?.textContent?.trim() || "",
        hasRetry: Array.from(document.querySelectorAll("button"))
          .some((button) => button.textContent.includes("重试"))
      }))()`))!;
      expect.soft(failureState.alertText).toContain(contract.failureText);
      expect.soft(failureState.hasRetry).toBe(true);

      await evaluate(`localStorage.removeItem("issue0033-mode")`);
      const clickedRetry = await evaluate<boolean>(`(() => {
        const button = Array.from(document.querySelectorAll("button"))
          .find((node) => node.textContent.includes("重试"));
        if (!button) return false;
        button.click();
        return true;
      })()`);
      expect.soft(clickedRetry).toBe(true);
      if (clickedRetry) {
        await waitFor(
          `document.body.textContent.includes(${JSON.stringify(contract.active)})`,
          `重试后列表未恢复：${contract.pathname}`
        );
      }
    }

    await navigate("/profile/parent-needs", ".profile-record-list");
    await evaluate(`window.confirm = () => true;
      localStorage.setItem("issue0033-mode", "delete-failure")`);
    await evaluate(`Array.from(document.querySelectorAll(".profile-record-card button"))
      .find((button) => button.textContent.trim() === "删除")?.click()`);
    await waitFor(
      `document.body.textContent.includes("删除操作失败")`,
      "删除失败提示未渲染"
    );
    const deleteFailureNotice = (await evaluate<{
      className: string;
      live: string | null;
      role: string | null;
    }>(`(() => {
      const notice = Array.from(document.querySelectorAll("p"))
        .find((node) => node.textContent.includes("删除操作失败"));
      return {
        className: notice?.className || "",
        live: notice?.getAttribute("aria-live") || null,
        role: notice?.getAttribute("role") || null
      };
    })()`))!;
    expect.soft(deleteFailureNotice.className).toContain("error");
    expect.soft(deleteFailureNotice.className).not.toContain("success");
    expect.soft(deleteFailureNotice.live).toBe("assertive");
    expect.soft(deleteFailureNotice.role).toBe("alert");

    for (const pathname of ["/parent-needs/new", "/tutor-profiles/new"]) {
      for (const editId of ["edit-missing", "edit-legacy", "edit-deleted"]) {
        await navigate(`${pathname}?edit=${editId}`, ".wide-panel");
        await waitFor(
          `document.querySelector('[role="alert"]')`,
          `编辑失败未显示：${pathname}?edit=${editId}`
        );
        const editState = (await evaluate<{
          alertText: string;
          formVisible: boolean;
        }>(`(() => {
          return {
            alertText: document.querySelector('[role="alert"]')?.textContent?.trim() || "",
            formVisible: Boolean(document.querySelector('.step-form'))
          };
        })()`))!;
        expect.soft(editState.formVisible).toBe(false);
        expect.soft(editState.alertText.length).toBeGreaterThan(0);
      }
    }

    await evaluate(`localStorage.removeItem("issue0033-mode")`);
    await navigate("/chats/preview-chat", ".conversation-workspace");
    await waitFor(
      `document.querySelector(".contact-panel")?.textContent.includes("00000000000")`,
      "已授权联系方式未渲染"
    );
    await evaluate(`localStorage.setItem("issue0033-mode", "chat-deleted")`);
    await waitFor(
      `Boolean(Array.from(document.querySelectorAll("button"))
        .find((button) => button.textContent.includes("请求交换联系方式"))?.disabled)`,
      "删除态未通过轮询进入只读"
    );
    const readOnlyTransition = (await evaluate<{
      contactPanelVisible: boolean;
      contactText: string;
      deletedNotice: string;
    }>(`(() => ({
      contactPanelVisible: Boolean(document.querySelector(".contact-panel")),
      contactText: document.querySelector(".contact-status-panel")?.textContent || "",
      deletedNotice: document.querySelector(".contact-status-panel .privacy-note")?.textContent || ""
    }))()`))!;
    expect.soft(readOnlyTransition.contactPanelVisible).toBe(false);
    expect.soft(readOnlyTransition.contactText).not.toContain("00000000000");
    expect.soft(readOnlyTransition.contactText).not.toContain("11111111111");
    expect.soft(readOnlyTransition.deletedNotice).toContain("关联发布已删除");

    await waitFor(
      `document.querySelectorAll(".exchange-card").length === 2`,
      "删除态交换请求未渲染"
    );
    const readOnlyActions = (await evaluate<{
      actionTexts: string[];
      requestDisabled: boolean;
    }>(`(() => ({
      actionTexts: Array.from(document.querySelectorAll(".exchange-card button"))
        .map((button) => button.textContent.trim()),
      requestDisabled: Boolean(Array.from(document.querySelectorAll("button"))
        .find((button) => button.textContent.includes("请求交换联系方式"))?.disabled)
    }))()`))!;
    expect.soft(readOnlyActions.requestDisabled).toBe(true);
    expect.soft(readOnlyActions.actionTexts).toEqual([]);
    await evaluate(`localStorage.removeItem("issue0033-mode")`);
  }, 180_000);

  it("keeps a newer deleted refresh authoritative when an older published refresh resolves late", async () => {
    await setViewport(1280, 800);
    await evaluate(`localStorage.removeItem("issue0033-mode");
      window.issue0033RaceOldPublishedReleased = false`);
    await navigate("/chats/preview-chat", ".conversation-workspace");
    await waitFor(
      `document.querySelector(".contact-panel")?.textContent.includes("00000000000")`,
      "乱序刷新前已授权联系方式未渲染"
    );

    await evaluate(`localStorage.setItem("issue0033-mode", "chat-refresh-race")`);
    await waitFor(
      `Boolean(document.querySelector("#message-text")?.disabled)`,
      "较新的删除态刷新未先完成"
    );
    await waitFor(
      `window.issue0033RaceOldPublishedReleased === true`,
      "较旧的 published 刷新未按契约延迟完成"
    );
    await delay(200);

    const stateAfterLatePublished = (await evaluate<{
      composeDisabled: boolean;
      contactPanelVisible: boolean;
      contactText: string;
      deletedNotice: string;
      exchangeActions: string[];
      requestDisabled: boolean;
    }>(`(() => ({
      composeDisabled: Boolean(document.querySelector("#message-text")?.disabled),
      contactPanelVisible: Boolean(document.querySelector(".contact-panel")),
      contactText: document.querySelector(".contact-status-panel")?.textContent || "",
      deletedNotice: document.querySelector(".contact-status-panel .privacy-note")?.textContent || "",
      exchangeActions: Array.from(document.querySelectorAll(".exchange-card button"))
        .map((button) => button.textContent.trim()),
      requestDisabled: Boolean(Array.from(document.querySelectorAll("button"))
        .find((button) => button.textContent.includes("请求交换联系方式"))?.disabled)
    }))()`))!;

    expect.soft(stateAfterLatePublished.composeDisabled).toBe(true);
    expect.soft(stateAfterLatePublished.requestDisabled).toBe(true);
    expect.soft(stateAfterLatePublished.exchangeActions).toEqual([]);
    expect.soft(stateAfterLatePublished.contactPanelVisible).toBe(false);
    expect.soft(stateAfterLatePublished.contactText).not.toContain("00000000000");
    expect.soft(stateAfterLatePublished.contactText).not.toContain("11111111111");
    expect.soft(stateAfterLatePublished.deletedNotice).toContain("关联发布已删除");

    await evaluate(`localStorage.removeItem("issue0033-mode")`);
  }, 180_000);
});
