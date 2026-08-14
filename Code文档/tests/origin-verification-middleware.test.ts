import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { parseApiResponse } from "@/features/api/api-client";
import { submitRiskFeedbackToApi } from "@/features/feedback/risk-feedback-api-client";
import { createAuthApiHandlers } from "@/server/auth-api";
import { createAuthSessionCookie } from "@/server/auth-session";
import { createEmailAuthApiHandlers } from "@/server/email-auth-api";

const here = dirname(fileURLToPath(import.meta.url));
const middlewarePath = join(here, "..", "middleware.ts");

type MiddlewareModule = {
  middleware(request: NextRequest): Response | Promise<Response>;
};

async function loadMiddleware() {
  expect(existsSync(middlewarePath)).toBe(true);
  if (!existsSync(middlewarePath)) {
    return null;
  }

  return (await import(pathToFileURL(middlewarePath).href)) as MiddlewareModule;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("origin verification middleware", () => {
  it("lets the authenticated feedback browser client obtain a CSRF proof and reach the handler", async () => {
    const origin = "https://ungraduedu.eu.cc";
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ORIGIN_VERIFY_MODE", "enforce");
    vi.stubEnv("ORIGIN_VERIFY_SECRET", "expected-test-secret");
    vi.stubEnv("CSRF_SECRET", "expected-csrf-secret");
    vi.stubEnv("ALLOWED_ORIGINS", origin);
    vi.stubEnv("AUTH_SESSION_SECRET", "synthetic-session-secret");
    vi.stubEnv("AUTH_SESSION_KEY_VERSION", "v1");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const middlewareModule = await loadMiddleware();
    if (!middlewareModule) return;

    const cookie = createAuthSessionCookie({
      env: process.env,
      userId: "synthetic-user"
    });
    const sessionHandlers = createAuthApiHandlers({
      env: process.env,
      sessionRevocationGuard: {
        async check() { return { ok: true as const }; },
        async revoke() { return; }
      }
    });
    const middlewareRejections: Array<{
      body: string;
      contentType: string | null;
      status: number;
    }> = [];
    let feedbackHandlerCalls = 0;
    const fetcher: typeof fetch = async (input, init) => {
      const url = new URL(input.toString(), origin);
      const method = init?.method ?? "GET";

      if (url.pathname === "/api/auth/csrf" && method === "GET") {
        return sessionHandlers.GET_CSRF_PROOF(new Request(url, {
          headers: { cookie: cookie ?? "" },
          method
        }));
      }

      const headers = new Headers(init?.headers);
      headers.set("cookie", cookie ?? "");
      headers.set("origin", origin);
      headers.set("x-ungrade-origin-verify", "expected-test-secret");
      const request = new Request(url, { ...init, headers, method });
      const middlewareResponse = await middlewareModule.middleware(
        new NextRequest(request.clone())
      );

      if (middlewareResponse.headers.get("x-middleware-next") !== "1") {
        middlewareRejections.push({
          body: await middlewareResponse.clone().text(),
          contentType: middlewareResponse.headers.get("content-type"),
          status: middlewareResponse.status
        });
        return middlewareResponse;
      }

      feedbackHandlerCalls += 1;
      return Response.json({
        errors: {},
        ok: true,
        value: { id: "feedback-synthetic", status: "recorded" }
      });
    };

    const result = await submitRiskFeedbackToApi({
      fetcher,
      input: {
        category: "功能异常",
        contactMethod: "",
        description: "登录后反馈提交应穿过生产写保护。",
        evidenceNote: "",
        sourcePage: "/feedback",
        targetReference: "",
        targetType: "其他 / 不确定"
      }
    });

    expect({
      feedbackHandlerCalls,
      middlewareRejections,
      result
    }).toEqual({
      feedbackHandlerCalls: 1,
      middlewareRejections: [],
      result: {
        errors: {},
        ok: true,
        value: { id: "feedback-synthetic", status: "recorded" }
      }
    });
  });

  it("keeps the anonymous feedback policy while requiring JSON and an allowed Origin", async () => {
    const origin = "https://ungraduedu.eu.cc";
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ORIGIN_VERIFY_MODE", "enforce");
    vi.stubEnv("ORIGIN_VERIFY_SECRET", "expected-test-secret");
    vi.stubEnv("CSRF_SECRET", "expected-csrf-secret");
    vi.stubEnv("ALLOWED_ORIGINS", origin);
    vi.stubEnv("AUTH_SESSION_SECRET", "synthetic-session-secret");
    vi.stubEnv("AUTH_SESSION_KEY_VERSION", "v1");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const middlewareModule = await loadMiddleware();
    if (!middlewareModule) return;

    const sessionHandlers = createAuthApiHandlers({ env: process.env });
    let feedbackHandlerCalls = 0;
    const fetcher: typeof fetch = async (input, init) => {
      const url = new URL(input.toString(), origin);
      const method = init?.method ?? "GET";

      if (url.pathname === "/api/auth/csrf" && method === "GET") {
        return sessionHandlers.GET_CSRF_PROOF(new Request(url, { method }));
      }

      const headers = new Headers(init?.headers);
      headers.set("origin", origin);
      headers.set("x-ungrade-origin-verify", "expected-test-secret");
      const request = new Request(url, { ...init, headers, method });
      const middlewareResponse = await middlewareModule.middleware(
        new NextRequest(request.clone())
      );
      if (middlewareResponse.headers.get("x-middleware-next") !== "1") {
        return middlewareResponse;
      }

      feedbackHandlerCalls += 1;
      return Response.json({
        errors: {},
        ok: true,
        value: { id: "anonymous-feedback", status: "recorded" }
      });
    };

    const result = await submitRiskFeedbackToApi({
      fetcher,
      input: {
        category: "功能异常",
        contactMethod: "",
        description: "匿名反馈策略保持不变。",
        evidenceNote: "",
        sourcePage: "/feedback",
        targetReference: "",
        targetType: "其他 / 不确定"
      }
    });

    expect(feedbackHandlerCalls).toBe(1);
    expect(result).toMatchObject({
      errors: {},
      ok: true,
      value: { id: "anonymous-feedback", status: "recorded" }
    });

    const rejected = await Promise.all([
      {
        headers: {
          "content-type": "application/json",
          origin: "https://attacker.example",
          "x-ungrade-origin-verify": "expected-test-secret"
        }
      },
      {
        headers: {
          "content-type": "text/plain",
          origin,
          "x-ungrade-origin-verify": "expected-test-secret"
        }
      }
    ].map(({ headers }) => middlewareModule.middleware(
      new NextRequest(`${origin}/api/feedback`, {
        body: "{}",
        headers,
        method: "POST"
      })
    )));
    expect(rejected.map((response) => ({
      correlationId: Boolean(response.headers.get("x-correlation-id")),
      middlewarePassed: response.headers.get("x-middleware-next") === "1",
      status: response.status
    }))).toEqual([
      { correlationId: true, middlewarePassed: false, status: 403 },
      { correlationId: true, middlewarePassed: false, status: 403 }
    ]);
  });

  it("lets an anonymous production password login reach structured challenge validation", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ORIGIN_VERIFY_MODE", "enforce");
    vi.stubEnv("ORIGIN_VERIFY_SECRET", "expected-test-secret");
    vi.stubEnv("CSRF_SECRET", "expected-csrf-secret");
    vi.stubEnv("ALLOWED_ORIGINS", "https://ungraduedu.eu.cc");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const middlewareModule = await loadMiddleware();
    if (!middlewareModule) return;

    const userCollection = {
      doc: vi.fn(() => ({
        get: vi.fn(async () => ({ data: [] })),
        set: vi.fn(async () => ({ updated: 1 }))
      }))
    };
    const challengeReplayConsume = vi.fn(async () => ({ ok: true as const }));
    const handlers = createEmailAuthApiHandlers({
      challengeReplayGuard: { consume: challengeReplayConsume },
      challengeVerifier: {
        verify: vi.fn(async () => ({ ok: false as const, reason: "invalid" as const }))
      },
      emailCodeCollection: userCollection,
      emailDelivery: { async send() { return { ok: true as const }; } },
      env: {
        ALLOWED_ORIGINS: "https://ungraduedu.eu.cc",
        APP_ENV: "production",
        AUTH_SESSION_SECRET: "synthetic-session-secret",
        CSRF_SECRET: "expected-csrf-secret",
        NODE_ENV: "production",
        securityAlertSink: { available: true, emit() {} }
      },
      requireChallenge: true,
      userCollection
    });
    const request = new Request(
      "https://ungraduedu.eu.cc/api/auth/password/login",
      {
        body: JSON.stringify({
          challengeToken: "invalid-synthetic-token",
          email: "nobody@example.test",
          password: "Synthetic123"
        }),
        headers: {
          "content-type": "application/json",
          origin: "https://ungraduedu.eu.cc",
          "x-ungrade-origin-verify": "expected-test-secret"
        },
        method: "POST"
      }
    );
    const middlewareResponse = await middlewareModule.middleware(
      new NextRequest(request.clone())
    );
    const response = middlewareResponse.headers.get("x-middleware-next") === "1"
      ? await handlers.POST_PASSWORD_LOGIN(request)
      : middlewareResponse;
    const rawBody = await response.clone().text();
    const parsed = await parseApiResponse(response);

    expect({
      contentType: response.headers.get("content-type"),
      middlewarePassed: middlewareResponse.headers.get("x-middleware-next") === "1",
      rawBody,
      requestError: parsed.ok ? null : parsed.errors.request,
      status: response.status,
      persistentWriteCalls: challengeReplayConsume.mock.calls.length,
      userCollectionCalls: userCollection.doc.mock.calls.length
    }).toEqual({
      contentType: "application/json",
      middlewarePassed: true,
      rawBody:
        '{"errors":{"request":"人机验证未通过，请稍后重试"},"ok":false,"value":null}',
      requestError: "人机验证未通过，请稍后重试",
      status: 403,
      persistentWriteCalls: 0,
      userCollectionCalls: 0
    });
  });

  it("allows only the existing anonymous authentication write routes through middleware", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ORIGIN_VERIFY_MODE", "enforce");
    vi.stubEnv("ORIGIN_VERIFY_SECRET", "expected-test-secret");
    vi.stubEnv("CSRF_SECRET", "expected-csrf-secret");
    vi.stubEnv("ALLOWED_ORIGINS", "https://ungraduedu.eu.cc");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const middlewareModule = await loadMiddleware();
    if (!middlewareModule) return;

    const publicAuthRoutes = [
      "/api/auth/email/send-code",
      "/api/auth/email/login",
      "/api/auth/password/login",
      "/api/auth/password/reset"
    ];
    const results = await Promise.all(publicAuthRoutes.map(async (pathname) => {
      const response = await middlewareModule.middleware(
        new NextRequest(`https://ungraduedu.eu.cc${pathname}`, {
          body: "{}",
          headers: {
            "content-type": "application/json",
            origin: "https://ungraduedu.eu.cc",
            "x-ungrade-origin-verify": "expected-test-secret"
          },
          method: "POST"
        })
      );
      return {
        middlewarePassed: response.headers.get("x-middleware-next") === "1",
        pathname,
        status: response.status
      };
    }));

    expect(results).toEqual(publicAuthRoutes.map((pathname) => ({
      middlewarePassed: true,
      pathname,
      status: 200
    })));
  });

  it("keeps public authentication POST routes anonymous when a valid session cookie is already present", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ORIGIN_VERIFY_MODE", "enforce");
    vi.stubEnv("ORIGIN_VERIFY_SECRET", "expected-test-secret");
    vi.stubEnv("CSRF_SECRET", "expected-csrf-secret");
    vi.stubEnv("ALLOWED_ORIGINS", "https://ungraduedu.eu.cc");
    vi.stubEnv("AUTH_SESSION_SECRET", "synthetic-session-secret");
    vi.stubEnv("AUTH_SESSION_KEY_VERSION", "v1");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const middlewareModule = await loadMiddleware();
    if (!middlewareModule) return;
    const cookie = createAuthSessionCookie({
      env: process.env,
      userId: "synthetic-user"
    });
    const publicAuthRoutes = [
      "/api/auth/email/send-code",
      "/api/auth/email/login",
      "/api/auth/password/login",
      "/api/auth/password/reset"
    ];

    const results = await Promise.all(publicAuthRoutes.map(async (pathname) => {
      const response = await middlewareModule.middleware(
        new NextRequest(`https://ungraduedu.eu.cc${pathname}`, {
          body: "{}",
          headers: {
            cookie: cookie ?? "",
            "content-type": "application/json",
            origin: "https://ungraduedu.eu.cc",
            "x-ungrade-origin-verify": "expected-test-secret"
          },
          method: "POST"
        })
      );
      return {
        middlewarePassed: response.headers.get("x-middleware-next") === "1",
        pathname,
        status: response.status
      };
    }));

    expect(results).toEqual(publicAuthRoutes.map((pathname) => ({
      middlewarePassed: true,
      pathname,
      status: 200
    })));
  });

  it("still rejects cross-origin, non-JSON, and non-public writes when a session cookie is present", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ORIGIN_VERIFY_MODE", "enforce");
    vi.stubEnv("ORIGIN_VERIFY_SECRET", "expected-test-secret");
    vi.stubEnv("CSRF_SECRET", "expected-csrf-secret");
    vi.stubEnv("ALLOWED_ORIGINS", "https://ungraduedu.eu.cc");
    vi.stubEnv("AUTH_SESSION_SECRET", "synthetic-session-secret");
    vi.stubEnv("AUTH_SESSION_KEY_VERSION", "v1");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const middlewareModule = await loadMiddleware();
    if (!middlewareModule) return;
    const cookie = createAuthSessionCookie({
      env: process.env,
      userId: "synthetic-user"
    });
    const cases = [
      {
        contentType: "application/json",
        origin: "https://attacker.example",
        pathname: "/api/auth/password/login"
      },
      {
        contentType: "text/plain",
        origin: "https://ungraduedu.eu.cc",
        pathname: "/api/auth/password/login"
      },
      {
        contentType: "application/json",
        origin: "https://ungraduedu.eu.cc",
        pathname: "/api/auth/logout"
      }
    ];

    const responses = await Promise.all(cases.map((testCase) =>
      middlewareModule.middleware(
        new NextRequest(`https://ungraduedu.eu.cc${testCase.pathname}`, {
          body: "{}",
          headers: {
            cookie: cookie ?? "",
            "content-type": testCase.contentType,
            origin: testCase.origin,
            "x-ungrade-origin-verify": "expected-test-secret"
          },
          method: "POST"
        })
      )
    ));

    expect(responses.map((response) => ({
      middlewarePassed: response.headers.get("x-middleware-next") === "1",
      status: response.status
    }))).toEqual(cases.map(() => ({ middlewarePassed: false, status: 403 })));
  });

  it("keeps non-public, cross-origin, and non-JSON anonymous writes fail-closed", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ORIGIN_VERIFY_MODE", "enforce");
    vi.stubEnv("ORIGIN_VERIFY_SECRET", "expected-test-secret");
    vi.stubEnv("CSRF_SECRET", "expected-csrf-secret");
    vi.stubEnv("ALLOWED_ORIGINS", "https://ungraduedu.eu.cc");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const middlewareModule = await loadMiddleware();
    if (!middlewareModule) return;

    const cases = [
      ...[
        "/api/parent-needs",
        "/api/auth/logout",
        "/api/auth/password/set",
        "/api/auth/test-login"
      ].map((pathname) => ({
        contentType: "application/json",
        label: `non-public:${pathname}`,
        method: "POST",
        origin: "https://ungraduedu.eu.cc",
        pathname
      })),
      {
        contentType: "application/json",
        label: "cross-origin:password-login",
        method: "POST",
        origin: "https://attacker.example",
        pathname: "/api/auth/password/login"
      },
      {
        contentType: "text/plain",
        label: "non-json:password-login",
        method: "POST",
        origin: "https://ungraduedu.eu.cc",
        pathname: "/api/auth/password/login"
      },
      {
        contentType: "application/json",
        label: "non-post:password-login",
        method: "PUT",
        origin: "https://ungraduedu.eu.cc",
        pathname: "/api/auth/password/login"
      }
    ];
    const results = await Promise.all(cases.map(async (testCase) => {
      const response = await middlewareModule.middleware(
        new NextRequest(`https://ungraduedu.eu.cc${testCase.pathname}`, {
          body: "{}",
          headers: {
            "content-type": testCase.contentType,
            origin: testCase.origin,
            "x-ungrade-origin-verify": "expected-test-secret"
          },
          method: testCase.method
        })
      );
      return {
        correlationId: Boolean(response.headers.get("x-correlation-id")),
        label: testCase.label,
        middlewarePassed: response.headers.get("x-middleware-next") === "1",
        status: response.status
      };
    }));

    expect(results).toEqual(cases.map((testCase) => ({
      correlationId: true,
      label: testCase.label,
      middlewarePassed: false,
      status: 403
    })));
  });

  it("logs a missing header in observe mode without rejecting the request", async () => {
    vi.stubEnv("ORIGIN_VERIFY_MODE", "observe");
    vi.stubEnv("ORIGIN_VERIFY_SECRET", "expected-test-secret");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const middlewareModule = await loadMiddleware();
    if (!middlewareModule) return;

    const response = await middlewareModule.middleware(
      new NextRequest("https://origin.example.com/feedback")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(warn).toHaveBeenCalledTimes(1);
    const log = String(warn.mock.calls[0][0]);
    expect(log).toContain('"mode":"observe"');
    expect(log).toContain('"status":"missing"');
    expect(log).not.toContain("expected-test-secret");
  });

  it("returns 403 for an invalid header only after enforce mode is enabled", async () => {
    vi.stubEnv("ORIGIN_VERIFY_MODE", "enforce");
    vi.stubEnv("ORIGIN_VERIFY_SECRET", "expected-test-secret");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const middlewareModule = await loadMiddleware();
    if (!middlewareModule) return;

    const response = await middlewareModule.middleware(
      new NextRequest("https://origin.example.com/api/feedback", {
        headers: { "x-ungrade-origin-verify": "wrong-test-secret" }
      })
    );

    expect(response.status).toBe(403);
    expect(await response.text()).toBe("Forbidden.");
    expect(response.headers.get("x-ungrade-origin-verify")).toBeNull();
  });

  it("accepts the previous origin secret during a server-side rotation", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ORIGIN_VERIFY_MODE", "enforce");
    vi.stubEnv("ORIGIN_VERIFY_SECRET", "new-primary-secret");
    vi.stubEnv("ORIGIN_VERIFY_SECRET_PREVIOUS", "old-primary-secret");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const middlewareModule = await loadMiddleware();
    if (!middlewareModule) return;

    const response = await middlewareModule.middleware(
      new NextRequest("https://origin.example.com/feedback", {
        headers: { "x-ungrade-origin-verify": "old-primary-secret" }
      })
    );

    expect(response.status).toBe(200);
  });

  it("accepts the primary and rejects the old value immediately after previous is removed in production", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ORIGIN_VERIFY_MODE", "enforce");
    vi.stubEnv("ORIGIN_VERIFY_SECRET", "new-primary-secret");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const middlewareModule = await loadMiddleware();
    if (!middlewareModule) return;

    const primaryResponse = await middlewareModule.middleware(
      new NextRequest("https://origin.example.com/feedback", {
        headers: { "x-ungrade-origin-verify": "new-primary-secret" }
      })
    );
    const oldResponse = await middlewareModule.middleware(
      new NextRequest("https://origin.example.com/feedback", {
        headers: { "x-ungrade-origin-verify": "old-primary-secret" }
      })
    );

    expect(primaryResponse.status).toBe(200);
    expect(oldResponse.status).toBe(403);
  });

  it("rejects an enforced write with no Origin even when the legacy verification header is valid", async () => {
    vi.stubEnv("ORIGIN_VERIFY_MODE", "enforce");
    vi.stubEnv("ORIGIN_VERIFY_SECRET", "expected-test-secret");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const middlewareModule = await loadMiddleware();
    if (!middlewareModule) return;

    const response = await middlewareModule.middleware(
      new NextRequest("https://origin.example.com/api/feedback", {
        method: "POST",
        headers: { "x-ungrade-origin-verify": "expected-test-secret" }
      })
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("x-correlation-id")).toBeTruthy();
  });

  it("adds a correlation id to an allowed enforced write", async () => {
    vi.stubEnv("ORIGIN_VERIFY_MODE", "enforce");
    vi.stubEnv("ORIGIN_VERIFY_SECRET", "expected-test-secret");
    vi.stubEnv("CSRF_SECRET", "expected-csrf-secret");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const middlewareModule = await loadMiddleware();
    if (!middlewareModule) return;

    const response = await middlewareModule.middleware(
      new NextRequest("https://origin.example.com/api/feedback", {
        headers: {
          origin: "https://origin.example.com",
          "x-ungrade-csrf": "expected-csrf-secret",
          "x-ungrade-origin-verify": "expected-test-secret"
        },
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-correlation-id")).toBeTruthy();
  });

  it("fails closed when an enforced write has no configured CSRF secret", async () => {
    vi.stubEnv("ORIGIN_VERIFY_MODE", "enforce");
    vi.stubEnv("ORIGIN_VERIFY_SECRET", "expected-test-secret");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const middlewareModule = await loadMiddleware();
    if (!middlewareModule) return;

    const response = await middlewareModule.middleware(
      new NextRequest("https://origin.example.com/api/feedback", {
        headers: {
          origin: "https://origin.example.com",
          "x-ungrade-origin-verify": "expected-test-secret"
        },
        method: "POST"
      })
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("x-correlation-id")).toBeTruthy();
  });
});
