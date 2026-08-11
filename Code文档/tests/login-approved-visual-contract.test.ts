import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { completePasswordLogin } from "@/features/auth/login-form";

const root = process.cwd();
const loginPage = fs.readFileSync(path.join(root, "app", "login", "page.tsx"), "utf8");
const loginForm = fs.readFileSync(
  path.join(root, "features", "auth", "login-form.tsx"),
  "utf8"
);
const turnstileWidgetPath = path.join(
  root,
  "features",
  "auth",
  "turnstile-widget.tsx"
);
const globalCss = fs.readFileSync(path.join(root, "app", "globals.css"), "utf8");
const browserPath = [
  process.env.CHROME_BIN,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
].find((candidate): candidate is string => Boolean(candidate && fs.existsSync(candidate)));
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

class CdpClient {
  private nextId = 1;
  private readonly pending = new Map<
    number,
    { reject: (error: Error) => void; resolve: (value: unknown) => void }
  >();
  private readonly listeners = new Map<string, Set<(params: Record<string, unknown>) => void>>();

  constructor(private readonly socket: WebSocketClient) {
    socket.on("message", (data) => {
      const message = JSON.parse(data.toString()) as {
        error?: { message: string };
        id?: number;
        method?: string;
        params?: Record<string, unknown>;
        result?: unknown;
      };

      if (!message.id) {
        if (message.method) {
          for (const listener of this.listeners.get(message.method) ?? []) {
            listener(message.params ?? {});
          }
        }
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

  on(method: string, listener: (params: Record<string, unknown>) => void) {
    const listeners = this.listeners.get(method) ?? new Set();
    listeners.add(listener);
    this.listeners.set(method, listeners);
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

async function readDevToolsPort(profileDirectory: string) {
  const portFile = path.join(profileDirectory, "DevToolsActivePort");
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const [port] = fs.readFileSync(portFile, "utf8").trim().split(/\r?\n/);
      if (port) {
        return Number(port);
      }
    } catch {
      await delay(50);
    }
  }
  throw new Error("Chrome DevTools 端口未就绪。");
}

async function connectCdp(url: string) {
  const socket = new WebSocketClient(url);
  await new Promise<void>((resolve, reject) => {
    socket.on("open", resolve);
    socket.on("error", reject);
  });
  return new CdpClient(socket);
}

function runtimeValue<T>(result: unknown) {
  return (result as { result?: { value?: T } }).result?.value;
}

async function waitForRuntime<T>(cdp: CdpClient, expression: string) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const value = runtimeValue<T>(await cdp.send("Runtime.evaluate", {
      expression,
      returnByValue: true
    }));
    if (value) {
      return value;
    }
    await delay(50);
  }
  throw new Error(`浏览器条件未满足：${expression}`);
}

async function reservePort() {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("无法分配登录行为测试端口。");
  }
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  return address.port;
}

async function stopProcessTree(child: ChildProcess | undefined) {
  if (!child?.pid || child.exitCode !== null) {
    return;
  }
  if (process.platform === "win32") {
    const taskkill = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true
    });
    await new Promise<void>((resolve) => taskkill.once("exit", () => resolve()));
    return;
  }
  child.kill();
}

describe("approved login visual contract", () => {
  it("uses the approved people, decoration, and note icon assets", () => {
    expect(loginPage).toContain('from "next/image"');
    expect(loginPage).toContain("/assets/sitewide-ui/login-boy.png");
    expect(loginPage).toContain("/assets/sitewide-ui/login-girl.png");
    expect(loginPage).toContain("/assets/sitewide-ui/login-decor.png");
    expect(loginPage).toContain("/assets/sitewide-ui/login-note-account.png");
    expect(loginPage).not.toContain("dplus-person");
  });

  it("shows the approved verification-code state without removing password/reset access", () => {
    expect(loginForm).toContain("邮箱验证码登录 / 注册");
    expect(globalCss).toContain("/assets/sitewide-ui/login-email-icon.png");
    expect(globalCss).toContain("/assets/sitewide-ui/login-code-icon.png");
    expect(loginForm).toContain("auth-mode-link");
    expect(loginForm).toContain('switchMode("password")');
    expect(loginForm).toContain('switchMode("reset")');
  });

  it("keeps the password-login switch exact and underlined at rest", () => {
    expect(loginForm).toContain('className="auth-mode-link auth-mode-link-password"');
    expect(loginForm).toContain("账号密码登录");
    expect(loginForm).not.toContain("设置密码后，也可以使用邮箱和密码登录");
    expect(globalCss).toMatch(
      /\.auth-mode-link-password\s*\{[^}]*text-decoration:\s*underline;/s
    );
  });

  it("keeps password login blocked and invalidates Turnstile tokens across every lifecycle", () => {
    expect(fs.existsSync(turnstileWidgetPath)).toBe(true);
    const turnstileWidget = fs.readFileSync(turnstileWidgetPath, "utf8");

    expect(loginForm).toContain("challengeToken: turnstileToken");
    expect(loginForm).toContain("disabled={isLoggingIn || !turnstileToken}");
    expect(loginForm).toContain("<TurnstileWidget");
    expect(turnstileWidget).toContain('action: "password_login"');
    expect(turnstileWidget).toContain('"expired-callback"');
    expect(turnstileWidget).toContain('"error-callback"');
    expect(turnstileWidget).toContain("onTokenChange(\"\")");
    expect(turnstileWidget).toContain("重新进行人机验证");
    expect(turnstileWidget).toMatch(
      /return \(\) => \{[\s\S]*onTokenChange\(""\)[\s\S]*turnstile\?\.remove/s
    );
    expect(loginForm).toMatch(
      /const switchMode = useCallback\([\s\S]*resetTurnstile\(\);[\s\S]*setMode\(nextMode\)/s
    );
    expect(loginForm).toContain('switchMode("code")');
    expect(loginForm).toContain('switchMode("password")');
    expect(loginForm).toContain('switchMode("reset")');
    expect(turnstileWidget).toContain(
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
    );
  });

  it("keeps the approved default form visual while revealing live controls for interaction", () => {
    expect(globalCss).toContain("login-static-form.png");
    expect(globalCss).toContain(".auth-card:hover > .auth-form-shell");
    expect(globalCss).toContain(".auth-card:focus-within > .auth-form-shell");
  });

  it("keeps the live mobile intro copy readable on the warm card", () => {
    expect(globalCss).toMatch(
      /\.sitewide-auth-shell \.auth-intro\s*\{[^}]*color:\s*var\(--dplus-ink\)/s
    );
  });

  it("invalidates the consumed Turnstile token before navigation and busy-state release", () => {
    const events: string[] = [];

    completePasswordLogin({
      invalidateTurnstile: () => events.push("invalidate-token"),
      navigate: () => events.push("navigate"),
      notifyAuthenticated: () => events.push("notify-authenticated"),
      refresh: () => events.push("refresh")
    });
    events.push("release-is-logging-in");

    expect(events).toEqual([
      "invalidate-token",
      "notify-authenticated",
      "navigate",
      "refresh",
      "release-is-logging-in"
    ]);
  });
});

describeWithBrowser("password login Turnstile lifecycle", () => {
  let appProcess: ChildProcess | undefined;
  let baseUrl = "";

  beforeAll(async () => {
    const port = await reservePort();
    baseUrl = `http://127.0.0.1:${port}`;
    appProcess = spawn(
      process.execPath,
      [path.join(root, "node_modules", "next", "dist", "bin", "next"), "dev", "--hostname", "127.0.0.1", "--port", String(port)],
      {
        cwd: root,
        env: {
          ...process.env,
          NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA"
        },
        stdio: "ignore",
        windowsHide: true
      }
    );

    for (let attempt = 0; attempt < 600; attempt += 1) {
      try {
        const response = await fetch(`${baseUrl}/login`);
        if (response.ok) {
          return;
        }
      } catch {
        // The development server is still starting.
      }
      await delay(100);
    }
    throw new Error("登录行为测试服务未就绪。");
  }, 90_000);

  afterAll(async () => {
    await stopProcessTree(appProcess);
  });

  it("reinitializes the script and widget after Script onError and user retry", async () => {
    if (!browserPath) {
      throw new Error("未找到 Chrome/Edge。");
    }
    const profileDirectory = await mkdtemp(path.join(tmpdir(), "login-turnstile-"));
    const browserProcess = spawn(browserPath, [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--remote-debugging-port=0",
      `--user-data-dir=${profileDirectory}`,
      "about:blank"
    ], { stdio: "ignore", windowsHide: true });
    let cdp: CdpClient | undefined;
    let scriptRequestCount = 0;

    try {
      const port = await readDevToolsPort(profileDirectory);
      const targetResponse = await fetch(
        `http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`,
        { method: "PUT" }
      );
      const target = await targetResponse.json() as { webSocketDebuggerUrl?: string };
      if (!target.webSocketDebuggerUrl) {
        throw new Error("Chrome 调试页未返回 WebSocket 地址。");
      }
      cdp = await connectCdp(target.webSocketDebuggerUrl);
      await cdp.send("Page.enable");
      await cdp.send("Fetch.enable", {
        patterns: [{ requestStage: "Request", urlPattern: "*challenges.cloudflare.com/turnstile/v0/api.js*" }]
      });
      cdp.on("Fetch.requestPaused", (params) => {
        const requestId = String(params.requestId);
        scriptRequestCount += 1;
        if (scriptRequestCount === 1) {
          void cdp?.send("Fetch.failRequest", { errorReason: "Failed", requestId });
          return;
        }
        const body = Buffer.from(`window.__turnstileEvents=[];window.turnstile={render:function(container,options){window.__turnstileEvents.push("render");window.__turnstileOptions=options;queueMicrotask(function(){options.callback("official-test-token");});return "widget-test";},remove:function(id){window.__turnstileEvents.push("remove:"+id);},reset:function(id){window.__turnstileEvents.push("reset:"+id);}};`).toString("base64");
        void cdp?.send("Fetch.fulfillRequest", {
          body,
          requestId,
          responseCode: 200,
          responseHeaders: [{ name: "content-type", value: "application/javascript; charset=utf-8" }]
        });
      });
      await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
        source: `{
          const originalFetch = window.fetch.bind(window);
          window.fetch = (input, init) => {
            const url = typeof input === "string" ? input : input.url;
            if (url.includes("/api/auth/session")) {
              return Promise.resolve(new Response(JSON.stringify({ok:false,value:null,errors:{request:"anonymous"}}), {status:401,headers:{"content-type":"application/json"}}));
            }
            return originalFetch(input, init);
          };
        }`
      });
      await cdp.send("Page.navigate", { url: `${baseUrl}/login` });
      await waitForRuntime(cdp, `Array.from(document.querySelectorAll("button")).some((button) => button.textContent?.includes("账号密码登录"))`);
      await cdp.send("Runtime.evaluate", {
        expression: `Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.includes("账号密码登录"))?.click()`
      });
      await waitForRuntime(cdp, `Array.from(document.querySelectorAll("button")).some((button) => button.textContent?.includes("重新进行人机验证"))`);
      const alertState = runtimeValue<{ ariaLive: string | null; role: string | null }>(
        await cdp.send("Runtime.evaluate", {
          expression: `(() => {
            const retry = Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.includes("重新进行人机验证"));
            const alert = retry?.closest(".error");
            return { ariaLive: alert?.getAttribute("aria-live") ?? null, role: alert?.getAttribute("role") ?? null };
          })()`,
          returnByValue: true
        })
      );
      await cdp.send("Runtime.evaluate", {
        expression: `Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.includes("重新进行人机验证"))?.click()`
      });
      const rendered = await waitForRuntime<boolean>(
        cdp,
        `window.__turnstileEvents?.includes("render") === true`
      );
      await cdp.send("Runtime.evaluate", {
        expression: `window.__turnstileOptions?.["error-callback"]?.()`
      });
      const challengeErrorAlert = await waitForRuntime<boolean>(
        cdp,
        `document.querySelector('[role="alert"][aria-live="assertive"]')?.textContent?.includes("人机验证已失效") === true`
      );
      await cdp.send("Runtime.evaluate", {
        expression: `Array.from(document.querySelectorAll("button")).find((button) => button.textContent?.includes("重新进行人机验证"))?.click()`
      });
      await waitForRuntime(cdp, `window.__turnstileEvents?.includes("reset:widget-test") === true`);
      await cdp.send("Runtime.evaluate", {
        expression: `window.__turnstileOptions?.["expired-callback"]?.()`
      });
      const expiredAlert = await waitForRuntime<boolean>(
        cdp,
        `document.querySelector('[role="alert"][aria-live="assertive"]')?.textContent?.includes("人机验证已失效") === true`
      );

      expect(rendered).toBe(true);
      expect(scriptRequestCount).toBe(2);
      expect(alertState).toEqual({ ariaLive: "assertive", role: "alert" });
      expect(challengeErrorAlert).toBe(true);
      expect(expiredAlert).toBe(true);
    } finally {
      cdp?.close();
      await stopProcessTree(browserProcess);
      await rm(profileDirectory, { force: true, maxRetries: 10, recursive: true, retryDelay: 100 });
    }
  }, 30_000);
});
