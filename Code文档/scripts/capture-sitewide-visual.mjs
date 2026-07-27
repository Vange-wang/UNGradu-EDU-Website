import { execFile, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer, get, request } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";

import WebSocket from "ws";

const pageSelectors = {
  home: {
    benefits: ".home-benefits",
    entryGrid: ".home-entry-grid",
    header: ".site-header",
    kicker: ".home-kicker",
    linkGrid: ".home-link-grid",
    main: ".home-refresh-main",
    principles: ".home-principles-card",
    root: ".home-refresh-page",
    title: "#home-title"
  },
  login: {
    form: ".auth-form-shell .form",
    header: ".site-header",
    intro: ".sitewide-auth-intro",
    panel: ".auth-shell",
    root: ".auth-page",
    title: "h1"
  },
  rules: {
    header: ".site-header",
    intro: ".notice-aside",
    list: ".rules-card-list",
    root: ".rules-refresh-page",
    title: "h1"
  },
  "customer-service": {
    chat: ".customer-service-chat",
    header: ".site-header",
    hero: ".customer-service-info-strip",
    messages: ".customer-service-messages",
    quickQuestions: ".customer-service-quick-list",
    root: ".customer-service-shell",
    side: ".customer-service-side"
  },
  "tutor-profiles": {
    filters: ".filter-panel",
    header: ".site-header",
    intro: ".market-header",
    results: ".result-panel",
    root: ".marketplace-refresh-shell"
  },
  "parent-needs": {
    filters: ".filter-panel",
    header: ".site-header",
    intro: ".market-header",
    results: ".result-panel",
    root: ".marketplace-refresh-shell"
  }
};

const publicDataOrigin = "https://ungradeedu.eu.cc";
const execFileAsync = promisify(execFile);

const approvedTutorVisualFixture = [{
  abilityDescription: "善于梳理物理知识结构，重视基础与解题思路。",
  feeRanges: [
    { grade: "初中", max: 180, min: 120, subject: "数学" },
    { grade: "高中", max: 180, min: 120, subject: "物理" }
  ],
  gender: "女",
  grades: ["初中", "高中"],
  id: "approved-tutor-visual-fixture",
  major: "物理学",
  school: "北京大学",
  subjects: ["数学", "物理"]
}];

const approvedParentNeedVisualFixture = [{
  budgetMax: 150,
  budgetMin: 100,
  childIntro: "希望周末进行数学辅导",
  community: "",
  createdAt: "2026-07-27T00:00:00.000Z",
  grade: "初二",
  id: "approved-parent-needs-visual-fixture",
  region: {
    city: "东莞",
    district: "松山湖",
    province: "广东省"
  },
  status: "published",
  subjects: ["数学"],
  teacherGenderPreference: "不限",
  timeSlots: ["周末"]
}];

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]?.replace(/^--/, "");
    const value = argv[index + 1];
    if (!key || value === undefined) {
      throw new Error(`invalid argument near ${argv[index] ?? "<end>"}`);
    }
    values[key] = value;
  }

  const required = ["base-url", "page", "route", "width", "height", "output-dir"];
  for (const key of required) {
    if (!values[key]) {
      throw new Error(`--${key} is required`);
    }
  }

  const page = values.page;
  if (!pageSelectors[page]) {
    throw new Error(`unsupported page: ${page}`);
  }

  const dataSource = values["data-source"] ?? "fixture";
  if (!["fixture", "public-real-data"].includes(dataSource)) {
    throw new Error(`unsupported data source: ${dataSource}`);
  }

  return {
    baseUrl: values["base-url"].replace(/\/$/, ""),
    dataSource: values["data-source"] ?? "fixture",
    height: Number(values.height),
    interaction: values.interaction ?? "none",
    outputDir: values["output-dir"],
    page,
    route: values.route,
    width: Number(values.width)
  };
}

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ];
  const browserPath = candidates.find(
    (candidate) => candidate && existsSync(candidate)
  );
  if (!browserPath) {
    throw new Error("Chrome or Edge executable was not found");
  }
  return browserPath;
}

async function getFreePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function waitForJson(url, attempts = 100) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await new Promise((resolve, reject) => {
        const request = get(url, (response) => {
          let payload = "";
          response.setEncoding("utf8");
          response.on("data", (chunk) => {
            payload += chunk;
          });
          response.on("end", () => {
            if (
              response.statusCode &&
              response.statusCode >= 200 &&
              response.statusCode < 300
            ) {
              try {
                resolve(JSON.parse(payload));
              } catch (error) {
                reject(error);
              }
              return;
            }
            reject(
              new Error(`unexpected DevTools status ${response.statusCode}`)
            );
          });
        });
        request.once("error", reject);
      });
    } catch (error) {
      lastError = error;
    }
    await delay(50);
  }
  throw lastError ?? new Error(`timed out waiting for ${url}`);
}

async function requestJson(url, method = "GET") {
  return await new Promise((resolve, reject) => {
    const clientRequest = request(url, { method }, (response) => {
      let payload = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        payload += chunk;
      });
      response.on("end", () => {
        if (
          response.statusCode &&
          response.statusCode >= 200 &&
          response.statusCode < 300
        ) {
          try {
            resolve(JSON.parse(payload));
          } catch (error) {
            reject(error);
          }
          return;
        }
        reject(new Error(`unexpected DevTools status ${response.statusCode}`));
      });
    });
    clientRequest.once("error", reject);
    clientRequest.end();
  });
}

async function readPublicJson(url) {
  const { stdout } = await execFileAsync(
    "curl.exe",
    [
      "--fail",
      "--silent",
      "--show-error",
      "--location",
      "--max-time",
      "20",
      "--proto",
      "=https",
      "--tlsv1.2",
      url
    ],
    {
      encoding: "utf8",
      maxBuffer: 5 * 1024 * 1024,
      windowsHide: true
    }
  );
  return JSON.parse(stdout);
}

function connectCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  let nextId = 1;
  const pending = new Map();
  const listeners = new Map();

  socket.on("message", (payload) => {
    const message = JSON.parse(payload.toString());
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) {
        return;
      }
      pending.delete(message.id);
      if (message.error) {
        request.reject(new Error(message.error.message));
      } else {
        request.resolve(message.result);
      }
      return;
    }

    const callbacks = listeners.get(message.method) ?? [];
    for (const callback of callbacks) {
      callback(message.params);
    }
  });

  const opened = new Promise((resolve, reject) => {
    socket.once("open", resolve);
    socket.once("error", reject);
  });

  return {
    async close() {
      socket.close();
    },
    on(method, callback) {
      const callbacks = listeners.get(method) ?? [];
      callbacks.push(callback);
      listeners.set(method, callbacks);
    },
    async ready() {
      await opened;
    },
    send(method, params = {}) {
      const id = nextId;
      nextId += 1;
      return new Promise((resolve, reject) => {
        pending.set(id, { reject, resolve });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    waitFor(method) {
      return new Promise((resolve) => {
        const callback = (params) => {
          const callbacks = listeners.get(method) ?? [];
          listeners.set(
            method,
            callbacks.filter((candidate) => candidate !== callback)
          );
          resolve(params);
        };
        const callbacks = listeners.get(method) ?? [];
        callbacks.push(callback);
        listeners.set(method, callbacks);
      });
    }
  };
}

async function evaluate(cdp, expression) {
  const response = await cdp.send("Runtime.evaluate", {
    awaitPromise: true,
    expression,
    returnByValue: true
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text);
  }
  return response.result.value;
}

async function dispatchKeyboardKey(cdp, {
  code,
  key,
  nativeVirtualKeyCode,
  text = "",
  windowsVirtualKeyCode
}) {
  await cdp.send("Input.dispatchKeyEvent", {
    code,
    key,
    nativeVirtualKeyCode,
    type: "rawKeyDown",
    unmodifiedText: text,
    windowsVirtualKeyCode
  });
  if (text) {
    await cdp.send("Input.dispatchKeyEvent", {
      code,
      key,
      nativeVirtualKeyCode,
      text,
      type: "char",
      unmodifiedText: text,
      windowsVirtualKeyCode
    });
  }
  await cdp.send("Input.dispatchKeyEvent", {
    code,
    key,
    type: "keyUp",
    windowsVirtualKeyCode
  });
}

async function focusByTab(cdp, selector, maximumTabs = 24) {
  await evaluate(
    cdp,
    `document.activeElement instanceof HTMLElement &&
      document.activeElement.blur()`
  );
  for (let tabIndex = 1; tabIndex <= maximumTabs; tabIndex += 1) {
    await dispatchKeyboardKey(cdp, {
      code: "Tab",
      key: "Tab",
      nativeVirtualKeyCode: 9,
      windowsVirtualKeyCode: 9
    });
    const matched = await evaluate(
      cdp,
      `document.activeElement?.matches(${JSON.stringify(selector)}) ?? false`
    );
    if (matched) {
      return tabIndex;
    }
  }
  throw new Error(
    `keyboard Tab traversal did not reach ${selector} within ${maximumTabs} steps`
  );
}

async function auditTabOrder(cdp, maximumTabs = 64) {
  await evaluate(
    cdp,
    `document.activeElement instanceof HTMLElement &&
      document.activeElement.blur()`
  );
  const entries = [];
  const visitedIndexes = new Set();
  for (let tabIndex = 1; tabIndex <= maximumTabs; tabIndex += 1) {
    await dispatchKeyboardKey(cdp, {
      code: "Tab",
      key: "Tab",
      nativeVirtualKeyCode: 9,
      windowsVirtualKeyCode: 9
    });
    const entry = await evaluate(
      cdp,
      `(() => {
        const element = document.activeElement;
        if (!(element instanceof HTMLElement) || element === document.body) {
          return null;
        }
        const focusable = Array.from(document.querySelectorAll(
          'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
        ));
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          ariaLabel: element.getAttribute("aria-label"),
          boxShadow: style.boxShadow,
          className: element.className,
          color: style.color,
          disabled:
            "disabled" in element ? Boolean(element.disabled) : false,
          height: rect.height,
          href:
            element instanceof HTMLAnchorElement
              ? element.getAttribute("href")
              : null,
          index: focusable.indexOf(element),
          opacity: style.opacity,
          outlineColor: style.outlineColor,
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          tagName: element.tagName,
          text: (element.innerText || element.getAttribute("placeholder") || "")
            .trim()
            .slice(0, 80),
          type:
            element instanceof HTMLButtonElement ||
            element instanceof HTMLInputElement
              ? element.type
              : null,
          width: rect.width
        };
      })()`
    );
    if (!entry || entry.index < 0 || visitedIndexes.has(entry.index)) {
      break;
    }
    visitedIndexes.add(entry.index);
    entries.push({ ...entry, tabIndex });
  }
  await evaluate(
    cdp,
    `window.__visualKeyboardAudit = ${JSON.stringify(entries)}`
  );
  return entries;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const profileDirectory = await mkdtemp(
    path.join(tmpdir(), "sitewide-visual-chrome-")
  );
  const port = await getFreePort();
  const browserPath = findChrome();
  const browser = spawn(
    browserPath,
    [
      "--headless=new",
      "--disable-extensions",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--force-device-scale-factor=1",
      "--hide-scrollbars",
      "--no-default-browser-check",
      "--no-first-run",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profileDirectory}`,
      `--window-size=${options.width},${options.height}`,
      "about:blank"
    ],
    { stdio: "ignore", windowsHide: true }
  );

  let cdp;
  try {
    await waitForJson(`http://127.0.0.1:${port}/json/version`);
    const targetUrl = `${options.baseUrl}${options.route}`;
    const target = await requestJson(
      `http://127.0.0.1:${port}/json/new?${encodeURIComponent(targetUrl)}`,
      "PUT"
    );
    cdp = connectCdp(target.webSocketDebuggerUrl);
    await cdp.ready();

    const consoleEntries = [];
    const networkEntries = [];
    cdp.on("Log.entryAdded", ({ entry }) => {
      if (entry.level === "error" || entry.level === "warning") {
        consoleEntries.push({
          level: entry.level,
          networkRequestId: entry.networkRequestId ?? null,
          source: entry.source ?? null,
          text: entry.text,
          url: entry.url ?? null
        });
      }
    });
    cdp.on("Network.responseReceived", ({ requestId, response, type }) => {
      if (response.status >= 400) {
        networkEntries.push({
          mimeType: response.mimeType,
          requestId,
          status: response.status,
          type,
          url: response.url
        });
      }
    });
    cdp.on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
      consoleEntries.push({
        level: "error",
        text: exceptionDetails.exception?.description ?? exceptionDetails.text
      });
    });

    await Promise.all([
      cdp.send("Page.enable"),
      cdp.send("Runtime.enable"),
      cdp.send("Log.enable"),
      cdp.send("Network.enable")
    ]);
    let captureDataProvenance = {
      count: null,
      mode: options.dataSource,
      origin: null,
      status: null
    };
    let tutorCaptureData = approvedTutorVisualFixture;
    let parentNeedCaptureData = approvedParentNeedVisualFixture;

    if (
      options.dataSource === "public-real-data" &&
      ["tutor-profiles", "parent-needs"].includes(options.page)
    ) {
      const endpoint =
        options.page === "tutor-profiles"
          ? "/api/tutor-profiles"
          : "/api/parent-needs";
      const publicPayload = await readPublicJson(
        `${publicDataOrigin}${endpoint}`
      );
      if (
        publicPayload?.ok !== true ||
        !Array.isArray(publicPayload.value)
      ) {
        throw new Error(
          `public real-data capture failed: ${endpoint}`
        );
      }
      captureDataProvenance = {
        count: publicPayload.value.length,
        mode: "public-real-data",
        origin: publicDataOrigin,
        status: 200
      };
      if (options.page === "tutor-profiles") {
        tutorCaptureData = publicPayload.value;
      } else {
        parentNeedCaptureData = publicPayload.value;
      }
    }

    if (options.page === "tutor-profiles") {
      await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
        source: `(() => {
          const originalFetch = window.fetch.bind(window);
          const approvedTutorVisualFixture = ${JSON.stringify(tutorCaptureData)};
          window.fetch = async (input, init = {}) => {
            const requestUrl =
              input instanceof Request ? input.url : String(input);
            const url = new URL(requestUrl, location.origin);
            const method = (
              init.method ||
              (input instanceof Request ? input.method : "GET")
            ).toUpperCase();
            if (url.pathname === "/api/tutor-profiles" && method === "GET") {
              const subject = url.searchParams.get("subject");
              const grade = url.searchParams.get("grade");
              const gender = url.searchParams.get("gender");
              const feeMin = Number(url.searchParams.get("feeMin") || 0);
              const feeMax = Number(url.searchParams.get("feeMax") || 0);
              const value = approvedTutorVisualFixture.filter((profile) => {
                const rangeMatches = profile.feeRanges.some((range) =>
                  (!feeMin || range.max >= feeMin) &&
                  (!feeMax || range.min <= feeMax)
                );
                return (
                  (!subject || profile.subjects.includes(subject)) &&
                  (!grade || profile.grades.includes(grade)) &&
                  (!gender || profile.gender === gender) &&
                  rangeMatches
                );
              });
              return new Response(
                JSON.stringify({ errors: {}, ok: true, value }),
                {
                  headers: { "content-type": "application/json" },
                  status: 200
                }
              );
            }
            return originalFetch(input, init);
          };
        })();`
      });
    }
    if (options.page === "parent-needs") {
      await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
        source: `(() => {
          const originalFetch = window.fetch.bind(window);
          const approvedParentNeedVisualFixture = ${JSON.stringify(parentNeedCaptureData)};
          window.fetch = async (input, init = {}) => {
            const requestUrl =
              input instanceof Request ? input.url : String(input);
            const url = new URL(requestUrl, location.origin);
            const method = (
              init.method ||
              (input instanceof Request ? input.method : "GET")
            ).toUpperCase();
            if (url.pathname === "/api/parent-needs" && method === "GET") {
              const subject = url.searchParams.get("subject");
              const grade = url.searchParams.get("grade");
              const teacherGenderPreference = url.searchParams.get(
                "teacherGenderPreference"
              );
              const budgetMin = Number(url.searchParams.get("budgetMin") || 0);
              const budgetMax = Number(url.searchParams.get("budgetMax") || 0);
              const value = approvedParentNeedVisualFixture.filter((need) =>
                (!subject || need.subjects.includes(subject)) &&
                (!grade || need.grade === grade) &&
                (
                  !teacherGenderPreference ||
                  teacherGenderPreference === "不限" ||
                  need.teacherGenderPreference === teacherGenderPreference ||
                  need.teacherGenderPreference === "不限"
                ) &&
                (!budgetMin || need.budgetMax >= budgetMin) &&
                (!budgetMax || need.budgetMin <= budgetMax)
              );
              return new Response(
                JSON.stringify({ errors: {}, ok: true, value }),
                {
                  headers: { "content-type": "application/json" },
                  status: 200
                }
              );
            }
            return originalFetch(input, init);
          };
        })();`
      });
    }
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      deviceScaleFactor: 1,
      height: options.height,
      mobile: false,
      screenHeight: options.height,
      screenWidth: options.width,
      width: options.width
    });

    const loaded = cdp.waitFor("Page.loadEventFired");
    await cdp.send("Page.navigate", { url: targetUrl });
    await loaded;

    await evaluate(
      cdp,
      `Promise.all([
        document.fonts?.ready ?? Promise.resolve(),
        new Promise((resolve) => setTimeout(resolve, 500))
      ]).then(async () => {
        const deadline = Date.now() + 8000;
        while (Date.now() < deadline) {
          const navigationReady =
            document.querySelector(".top-nav")?.textContent?.includes("登录 / 注册");
          const imagesReady = [...document.images].every(
            (image) =>
              getComputedStyle(image).display === "none" ||
              (image.complete && image.naturalWidth > 0)
          );
          const pageReady =
            ${JSON.stringify(options.page)} !== "login" ||
            document.querySelector(".auth-form-shell");
          if (navigationReady && imagesReady && pageReady) {
            return true;
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        throw new Error(
          "visual capture readiness gate timed out: " +
          JSON.stringify({
            imageStates: Array.from(document.images).map((image) => ({
              complete: image.complete,
              display: getComputedStyle(image).display,
              naturalWidth: image.naturalWidth,
              src: image.currentSrc || image.src
            })),
            navigationReady: document.body.innerText.includes("登录 / 注册"),
            pageReady:
              ${JSON.stringify(options.page)} !== "login" ||
              Boolean(document.querySelector(".auth-form-shell"))
          })
        );
      })`
    );

    await evaluate(
      cdp,
      `(() => {
        const style = document.createElement("style");
        style.dataset.visualCapture = "hide-development-overlays";
        style.textContent =
          "nextjs-portal,[data-nextjs-toast],[data-next-badge-root]{display:none!important}";
        document.head.append(style);
      })()`
    );

    if (options.interaction === "home-focus-parent-entry") {
      await focusByTab(cdp, ".home-entry-parent button");
    } else if (options.interaction === "login-toggle-password") {
      await evaluate(
        cdp,
        `(() => {
          const button = [...document.querySelectorAll(".auth-mode-link")].find(
            (candidate) =>
              candidate.textContent?.includes("邮箱和密码登录")
          );
          if (!(button instanceof HTMLButtonElement)) {
            throw new Error("login password mode button was not found");
          }
          button.focus();
          button.click();
        })()`
      );
      await evaluate(
        cdp,
        `new Promise((resolve) => requestAnimationFrame(() => resolve()))`
      );
      await evaluate(
        cdp,
        `document.querySelector("#password-email")?.focus()`
      );
    } else if (options.interaction === "rules-focus-home") {
      await focusByTab(cdp, 'a[aria-label="返回首页"]');
    } else if (options.interaction === "focus-first-question") {
      await evaluate(
        cdp,
        `document.querySelector(".customer-service-quick-list button")?.focus()`
      );
    } else if (options.interaction === "activate-first-question") {
      await evaluate(
        cdp,
        `document.querySelector(".customer-service-quick-list button")?.focus()`
      );
      await cdp.send("Input.dispatchKeyEvent", {
        code: "Enter",
        key: "Enter",
        nativeVirtualKeyCode: 13,
        type: "rawKeyDown",
        unmodifiedText: "\r",
        windowsVirtualKeyCode: 13
      });
      await cdp.send("Input.dispatchKeyEvent", {
        code: "Enter",
        key: "Enter",
        nativeVirtualKeyCode: 13,
        text: "\r",
        type: "char",
        unmodifiedText: "\r",
        windowsVirtualKeyCode: 13
      });
      await cdp.send("Input.dispatchKeyEvent", {
        code: "Enter",
        key: "Enter",
        type: "keyUp",
        windowsVirtualKeyCode: 13
      });
      await evaluate(
        cdp,
        `new Promise((resolve) => setTimeout(resolve, 300))`
      );
    } else if (options.interaction === "activate-first-question-space") {
      await focusByTab(cdp, ".customer-service-quick-list button");
      await dispatchKeyboardKey(cdp, {
        code: "Space",
        key: " ",
        nativeVirtualKeyCode: 32,
        text: " ",
        windowsVirtualKeyCode: 32
      });
      await evaluate(
        cdp,
        `new Promise((resolve) => setTimeout(resolve, 300))`
      );
    } else if (options.interaction === "type-input") {
      await evaluate(
        cdp,
        `document.querySelector("#customer-service-question")?.focus()`
      );
      await cdp.send("Input.insertText", {
        text: "怎么联系老师？"
      });
      await evaluate(
        cdp,
        `new Promise((resolve) => setTimeout(resolve, 150))`
      );
    } else if (options.interaction === "customer-manual-send") {
      await evaluate(
        cdp,
        `document.querySelector("#customer-service-question")?.focus()`
      );
      await cdp.send("Input.insertText", {
        text: "怎么联系老师？"
      });
      await evaluate(
        cdp,
        `new Promise((resolve) => setTimeout(resolve, 100))`
      );
      await evaluate(
        cdp,
        `(() => {
          const form = document.querySelector(".customer-service-compose");
          if (!(form instanceof HTMLFormElement)) {
            throw new Error("customer-service compose form was not found");
          }
          form.requestSubmit();
        })()`
      );
      await evaluate(
        cdp,
        `new Promise((resolve) => setTimeout(resolve, 300))`
      );
    } else if (options.interaction === "customer-scroll-history") {
      await evaluate(
        cdp,
        `(() => {
          const button = document.querySelector(
            ".customer-service-quick-list button"
          );
          if (!(button instanceof HTMLButtonElement)) {
            throw new Error("customer-service quick question was not found");
          }
          for (let index = 0; index < 10; index += 1) {
            button.click();
          }
        })()`
      );
      await evaluate(
        cdp,
        `new Promise((resolve) => setTimeout(resolve, 350))`
      );
      await evaluate(
        cdp,
        `(() => {
          const messages = document.querySelector(".customer-service-messages");
          if (!(messages instanceof HTMLElement)) {
            throw new Error("customer-service message history was not found");
          }
          messages.scrollTop = Math.min(
            160,
            Math.max(1, messages.scrollHeight - messages.clientHeight - 1)
          );
        })()`
      );
    } else if (options.interaction === "tutor-apply-subject-filter") {
      await evaluate(
        cdp,
        `(() => {
          const select = document.querySelector("#tutor-subject");
          if (!(select instanceof HTMLSelectElement)) {
            throw new Error("tutor subject filter was not found");
          }
          select.value = "数学";
          select.dispatchEvent(new Event("change", { bubbles: true }));
          const form = select.closest("form");
          if (!(form instanceof HTMLFormElement)) {
            throw new Error("tutor filter form was not found");
          }
          form.requestSubmit();
        })()`
      );
      await evaluate(
        cdp,
        `new Promise(async (resolve, reject) => {
          const deadline = Date.now() + 3000;
          while (Date.now() < deadline) {
            if (
              document.querySelector(".result-panel")?.dataset.resultState ===
                "live" &&
              new URL(location.href).searchParams.get("subject") === "数学"
            ) {
              resolve();
              return;
            }
            await new Promise((wait) => setTimeout(wait, 50));
          }
          reject(new Error("tutor subject filter did not switch to live state"));
        })`
      );
    } else if (options.interaction === "tutor-focus-detail") {
      await evaluate(
        cdp,
        `document.querySelector(
          '.result-panel a[href^="/tutor-profiles/"]'
        )?.focus()`
      );
    } else if (options.interaction === "tutor-focus-publish") {
      await evaluate(
        cdp,
        `document.querySelector(
          '.market-header a[href="/tutor-profiles/new"]'
        )?.focus()`
      );
    } else if (options.interaction === "parent-apply-subject-filter") {
      await evaluate(
        cdp,
        `(() => {
          const select = document.querySelector("#need-subject");
          if (!(select instanceof HTMLSelectElement)) {
            throw new Error("parent need subject filter was not found");
          }
          select.value = "数学";
          select.dispatchEvent(new Event("change", { bubbles: true }));
          const form = select.closest("form");
          if (!(form instanceof HTMLFormElement)) {
            throw new Error("parent need filter form was not found");
          }
          form.requestSubmit();
        })()`
      );
      await evaluate(
        cdp,
        `new Promise(async (resolve, reject) => {
          const deadline = Date.now() + 3000;
          while (Date.now() < deadline) {
            if (
              document.querySelector(".result-panel")?.dataset.resultState ===
                "live" &&
              new URL(location.href).searchParams.get("subject") === "数学"
            ) {
              resolve();
              return;
            }
            await new Promise((wait) => setTimeout(wait, 50));
          }
          reject(new Error("parent need filter did not switch to live state"));
        })`
      );
    } else if (options.interaction === "parent-focus-detail") {
      await evaluate(
        cdp,
        `document.querySelector(
          '.result-panel a[href^="/parent-needs/"]'
        )?.focus()`
      );
    } else if (options.interaction === "parent-focus-publish") {
      await evaluate(
        cdp,
        `document.querySelector(
          '.market-header a[href="/parent-needs/new"]'
        )?.focus()`
      );
    } else if (options.interaction === "keyboard-audit") {
      await auditTabOrder(cdp);
    } else if (options.interaction !== "none") {
      throw new Error(`unsupported interaction: ${options.interaction}`);
    }

    const selectors = pageSelectors[options.page];
    const metrics = await evaluate(
      cdp,
      `(() => {
        const selectors = ${JSON.stringify(selectors)};
        const rects = Object.fromEntries(
          Object.entries(selectors).map(([name, selector]) => {
            const element = document.querySelector(selector);
            if (!element) {
              return [name, null];
            }
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return [name, {
              bottom: rect.bottom,
              color: style.color,
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              height: rect.height,
              left: rect.left,
              lineHeight: style.lineHeight,
              top: rect.top,
              width: rect.width
            }];
          })
        );
        return {
          captureDataProvenance: ${JSON.stringify(captureDataProvenance)},
          devicePixelRatio: window.devicePixelRatio,
          documentElement: {
            clientHeight: document.documentElement.clientHeight,
            clientWidth: document.documentElement.clientWidth,
            scrollHeight: document.documentElement.scrollHeight,
            scrollWidth: document.documentElement.scrollWidth
          },
          innerHeight: window.innerHeight,
          innerWidth: window.innerWidth,
          keyboardAudit: window.__visualKeyboardAudit ?? [],
          interaction: {
            activeElement:
              document.activeElement?.id ||
              document.activeElement?.textContent?.trim() ||
              document.activeElement?.tagName ||
              null,
            chatState:
              document.querySelector(".customer-service-chat")?.dataset.chatState ??
              null,
            inputHasValue:
              Boolean(document.querySelector("#customer-service-question")?.value),
            homeParentEntryHref:
              document.querySelector(".home-entry-parent button")?.textContent?.trim() ??
              null,
            homeParentEntryDisabled:
              document.querySelector(".home-entry-parent button")?.disabled ??
              null,
            loginMode:
              document.querySelector("#password-login")
                ? "password"
                : document.querySelector("#email")
                  ? "code"
                  : null,
            messageCount:
              document.querySelectorAll(".customer-service-message").length,
            messageScroll: (() => {
              const element = document.querySelector(
                ".customer-service-messages"
              );
              return element
                ? {
                    clientHeight: element.clientHeight,
                    scrollHeight: element.scrollHeight,
                    scrollTop: element.scrollTop
                  }
                : null;
            })(),
            focusedStyle: (() => {
              const element = document.activeElement;
              if (!(element instanceof HTMLElement)) {
                return null;
              }
              const style = getComputedStyle(element);
              return {
                backgroundColor: style.backgroundColor,
                color: style.color,
                opacity: style.opacity,
                outlineColor: style.outlineColor,
                outlineStyle: style.outlineStyle,
                outlineWidth: style.outlineWidth
              };
            })(),
            rulesHomeHref:
              document
                .querySelector('a[aria-label="返回首页"]')
                ?.getAttribute("href") ?? null,
            tutorDetailHref:
              document
                .querySelector('.result-panel a[href^="/tutor-profiles/"]')
                ?.getAttribute("href") ?? null,
            tutorPublishHref:
              document
                .querySelector('.market-header a[href="/tutor-profiles/new"]')
                ?.getAttribute("href") ?? null,
            tutorResultState:
              document.querySelector(".result-panel")?.dataset.resultState ??
              null,
            tutorSearch: location.search,
            parentDetailHref:
              document
                .querySelector('.result-panel a[href^="/parent-needs/"]')
                ?.getAttribute("href") ?? null,
            parentPublishHref:
              document
                .querySelector('.market-header a[href="/parent-needs/new"]')
                ?.getAttribute("href") ?? null,
            parentResultState:
              document.querySelector(".result-panel")?.dataset.resultState ??
              null,
            parentSearch: location.search
          },
          mainCount: document.querySelectorAll("body > main").length,
          rects,
          route: location.pathname
        };
      })()`
    );

    const viewportCapture = await cdp.send("Page.captureScreenshot", {
      captureBeyondViewport: false,
      format: "png",
      fromSurface: true
    });
    const layout = await cdp.send("Page.getLayoutMetrics");
    const contentSize = layout.cssContentSize ?? layout.contentSize;
    const fullPageCapture = await cdp.send("Page.captureScreenshot", {
      captureBeyondViewport: true,
      clip: {
        height: Math.ceil(contentSize.height),
        scale: 1,
        width: Math.ceil(contentSize.width),
        x: 0,
        y: 0
      },
      format: "png",
      fromSurface: true
    });

    await mkdir(options.outputDir, { recursive: true });
    const prefix = `${options.page}-${options.width}x${options.height}`;
    await Promise.all([
      writeFile(
        path.join(options.outputDir, `${prefix}-viewport.png`),
        Buffer.from(viewportCapture.data, "base64")
      ),
      writeFile(
        path.join(options.outputDir, `${prefix}-fullpage.png`),
        Buffer.from(fullPageCapture.data, "base64")
      ),
      writeFile(
        path.join(options.outputDir, `${prefix}-geometry.json`),
        `${JSON.stringify(
          {
            ...metrics,
            consoleEntries,
            networkEntries,
            requestedViewport: {
              deviceScaleFactor: 1,
              height: options.height,
              width: options.width
            }
          },
          null,
          2
        )}\n`,
        "utf8"
      )
    ]);

    console.log(
      JSON.stringify({
        consoleEntryCount: consoleEntries.length,
        metrics,
        outputDir: options.outputDir
      })
    );
  } finally {
    if (cdp) {
      await cdp.close();
    }
    browser.kill();
    await rm(profileDirectory, {
      force: true,
      maxRetries: 10,
      recursive: true,
      retryDelay: 100
    });
  }
}

await main();
