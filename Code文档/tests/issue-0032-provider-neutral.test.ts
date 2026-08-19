import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createEmailAuthApiHandlers } from "@/server/email-auth-api";
import {
  createCloudBasePersistentEmailChallengeReplayGuard,
  createTurnstileEmailChallengeVerifier,
  verifyEmailChallenge
} from "@/server/security/email-challenge";
import {
  createCloudBasePersistentRateLimiter,
  createEmailSendRateLimitKeys
} from "@/server/security/rate-limit";

const here = dirname(fileURLToPath(import.meta.url));
const middlewarePath = join(here, "..", "middleware.ts");

function createNoopCollection() {
  return {
    doc() {
      return {
        async get() { return { data: undefined }; },
        async set() { return { updated: 1 }; },
        async update() { return { updated: 1 }; }
      };
    }
  };
}

function createTransactionalDocumentDatabase() {
  const documents = new Map<string, Record<string, unknown>>();
  let transactionQueue: Promise<void> = Promise.resolve();
  let failAtSet: number | undefined;
  const database = {
    runTransaction<T>(operation: (transaction: {
      collection(name: string): {
        doc(id: string): {
          get(): Promise<{ data?: Record<string, unknown> }>;
          set(value: Record<string, unknown>): Promise<unknown>;
        };
      };
    }) => Promise<T>) {
      const run = transactionQueue.then(async () => {
        const staged = new Map(
          [...documents].map(([id, value]) => [id, { ...value }])
        );
        const transactionFailureAtSet = failAtSet;
        failAtSet = undefined;
        let setCount = 0;
        const result = await operation({
          collection() {
            return {
              doc(id) {
                return {
                  async get() {
                    return { data: staged.get(id) };
                  },
                  async set(value) {
                    setCount += 1;
                    if (setCount === transactionFailureAtSet) {
                      throw new Error("synthetic transaction write failure");
                    }
                    staged.set(id, { ...value });
                    return { updated: 1 };
                  }
                };
              }
            };
          }
        });
        documents.clear();
        for (const [id, value] of staged) documents.set(id, value);
        return result;
      });
      transactionQueue = run.then(() => undefined, () => undefined);
      return run;
    }
  };

  return {
    database,
    documents,
    failNextTransactionAtSet(setNumber: number) {
      failAtSet = setNumber;
    }
  };
}

type MiddlewareModule = {
  middleware(request: NextRequest): Response | Promise<Response>;
};

async function loadMiddleware() {
  expect(existsSync(middlewarePath)).toBe(true);
  return (await import(pathToFileURL(middlewarePath).href)) as MiddlewareModule;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("ISSUE-0032 provider-neutral email challenge", () => {
  it("distinguishes unavailable production Origin configuration from rejected requests before the handler", async () => {
    const origin = "https://synthetic-origin.example.test";
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ORIGIN_VERIFY_MODE", "enforce");
    vi.stubEnv("ORIGIN_VERIFY_SECRET", "synthetic-origin-proof");
    vi.stubEnv("CSRF_SECRET", "synthetic-csrf-secret");
    vi.stubEnv("ALLOWED_ORIGINS", "");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const middlewareModule = await loadMiddleware();

    const request = (headers: HeadersInit) => middlewareModule.middleware(
      new NextRequest(`${origin}/api/auth/email/send-code`, {
        body: JSON.stringify({
          challengeToken: "synthetic-token",
          email: "synthetic@example.test"
        }),
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-ungrade-origin-verify": "synthetic-origin-proof",
          ...headers
        },
        method: "POST"
      })
    );

    const unavailable = await request({ origin });
    expect({
      body: await unavailable.clone().json(),
      contentType: unavailable.headers.get("content-type"),
      passed: unavailable.headers.get("x-middleware-next") === "1",
      status: unavailable.status
    }).toEqual({
      body: {
        errors: { request: "请求保护配置暂不可用，请稍后重试" },
        ok: false,
        value: null
      },
      contentType: "application/json",
      passed: false,
      status: 503
    });

    vi.stubEnv("ALLOWED_ORIGINS", origin);
    const [missingOrigin, wrongOrigin, nonJson, allowed] = await Promise.all([
      request({}),
      request({ origin: "https://attacker.example.test" }),
      middlewareModule.middleware(new NextRequest(`${origin}/api/auth/email/send-code`, {
        body: "synthetic",
        headers: {
          "content-type": "text/plain",
          origin,
          "x-ungrade-origin-verify": "synthetic-origin-proof"
        },
        method: "POST"
      })),
      request({ origin })
    ]);

    expect([missingOrigin.status, wrongOrigin.status, nonJson.status]).toEqual([403, 403, 403]);
    expect(allowed.headers.get("x-middleware-next")).toBe("1");
  });

  it("traces complete production email guard configuration through middleware before the handler", async () => {
    const origin = "https://synthetic-origin.example.test";
    const middlewareModule = await loadMiddleware();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const dispatch = async ({
      allowedOrigins = origin,
      contentType = "application/json",
      csrfSecret = "synthetic-csrf-secret",
      originHeader = origin,
      originVerifySecret = "synthetic-origin-proof",
      proof = "synthetic-origin-proof"
    }: {
      allowedOrigins?: string;
      contentType?: string;
      csrfSecret?: string;
      originHeader?: string;
      originVerifySecret?: string;
      proof?: string;
    }) => {
      vi.stubEnv("APP_ENV", "production");
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ORIGIN_VERIFY_MODE", "enforce");
      vi.stubEnv("ORIGIN_VERIFY_SECRET", originVerifySecret);
      vi.stubEnv("CSRF_SECRET", csrfSecret);
      vi.stubEnv("ALLOWED_ORIGINS", allowedOrigins);

      const verify = vi.fn(async () => ({
        ok: false as const,
        reason: "invalid" as const
      }));
      const consume = vi.fn();
      const limit = vi.fn();
      const send = vi.fn();
      const handlerEntry = vi.fn();
      const handlers = createEmailAuthApiHandlers({
        challengeReplayGuard: { consume },
        challengeVerifier: {
          expectedHostnames: ["synthetic-host.example.test"],
          verify
        },
        emailCodeCollection: createNoopCollection(),
        emailDelivery: { send },
        env: {
          ALLOWED_ORIGINS: allowedOrigins,
          APP_ENV: "production",
          AUTH_RATE_LIMIT_KEY_SECRET: "synthetic-rate-key",
          CSRF_SECRET: csrfSecret,
          EMAIL_CODE_SECRET: "synthetic-code-secret",
          NODE_ENV: "production",
          ORIGIN_VERIFY_MODE: "enforce",
          ORIGIN_VERIFY_SECRET: originVerifySecret,
          securityAlertSink: { available: true, emit() {} }
        },
        rateLimiter: {
          check: limit,
          external: true,
          mode: "production",
          reset() {}
        },
        requireChallenge: true,
        userCollection: createNoopCollection()
      });
      const requestInit = {
        body: JSON.stringify({
          challengeToken: "synthetic-token",
          email: "synthetic@example.test"
        }),
        headers: {
          "content-type": contentType,
          origin: originHeader,
          "x-ungrade-origin-verify": proof
        },
        method: "POST"
      } satisfies RequestInit;
      const middlewareResponse = await middlewareModule.middleware(
        new NextRequest(`${origin}/api/auth/email/send-code`, requestInit)
      );
      const response = middlewareResponse.headers.get("x-middleware-next") === "1"
        ? await (async () => {
            handlerEntry();
            return handlers.POST_SEND_CODE(new Request(
              `${origin}/api/auth/email/send-code`,
              requestInit
            ));
          })()
        : middlewareResponse;

      return {
        calls: {
          consume: consume.mock.calls.length,
          handler: handlerEntry.mock.calls.length,
          limit: limit.mock.calls.length,
          send: send.mock.calls.length,
          verify: verify.mock.calls.length
        },
        contentType: response.headers.get("content-type"),
        response,
        status: response.status
      };
    };

    for (const unavailable of [
      { allowedOrigins: "" },
      { originVerifySecret: "" },
      { csrfSecret: "" }
    ]) {
      const result = await dispatch(unavailable);
      expect(result.status).toBe(503);
      expect(result.contentType).toContain("application/json");
      expect(await result.response.json()).toEqual({
        errors: { request: "请求保护配置暂不可用，请稍后重试" },
        ok: false,
        value: null
      });
      expect(result.calls).toEqual({ consume: 0, handler: 0, limit: 0, send: 0, verify: 0 });
    }

    for (const rejected of [
      { originHeader: "https://attacker.example.test" },
      { contentType: "text/plain" }
    ]) {
      const result = await dispatch(rejected);
      expect(result.status).toBe(403);
      expect(result.calls).toEqual({ consume: 0, handler: 0, limit: 0, send: 0, verify: 0 });
    }

    const allowed = await dispatch({});
    expect(allowed.status).toBe(403);
    expect(allowed.contentType).toContain("application/json");
    expect(allowed.calls).toEqual({ consume: 0, handler: 1, limit: 0, send: 0, verify: 1 });
  });

  it("short-circuits the direct send-code handler before challenge dependencies when request guard configuration is unavailable", async () => {
    for (const unavailableEnv of [
      { ALLOWED_ORIGINS: "" },
      { ORIGIN_VERIFY_SECRET: "" },
      { CSRF_SECRET: "" }
    ]) {
      const verify = vi.fn();
      const consume = vi.fn();
      const limit = vi.fn();
      const send = vi.fn();
      const handlers = createEmailAuthApiHandlers({
        challengeReplayGuard: { consume },
        challengeVerifier: { verify },
        emailCodeCollection: createNoopCollection(),
        emailDelivery: { send },
        env: {
          ALLOWED_ORIGINS: "https://synthetic-origin.example.test",
          APP_ENV: "production",
          CSRF_SECRET: "synthetic-csrf-secret",
          EMAIL_CODE_SECRET: "synthetic-code-secret",
          NODE_ENV: "production",
          ORIGIN_VERIFY_SECRET: "synthetic-origin-proof",
          securityAlertSink: { available: true, emit() {} },
          ...unavailableEnv
        },
        rateLimiter: {
          check: limit,
          external: true,
          mode: "production",
          reset() {}
        },
        requireChallenge: true,
        userCollection: createNoopCollection()
      });
      const response = await handlers.POST_SEND_CODE(new Request(
        "https://synthetic-origin.example.test/api/auth/email/send-code",
        {
          body: JSON.stringify({
            challengeToken: "synthetic-token",
            email: "synthetic@example.test"
          }),
          headers: {
            "content-type": "application/json",
            origin: "https://synthetic-origin.example.test"
          },
          method: "POST"
        }
      ));

      expect(response.status).toBe(503);
      expect(response.headers.get("cache-control")).toBe("no-store");
      await expect(response.json()).resolves.toEqual({
        errors: { request: "请求保护配置暂不可用，请稍后重试" },
        ok: false,
        value: null
      });
      expect({ consume: consume.mock.calls.length, limit: limit.mock.calls.length,
        send: send.mock.calls.length, verify: verify.mock.calls.length }).toEqual({
        consume: 0,
        limit: 0,
        send: 0,
        verify: 0
      });
    }
  });

  it("runs verify, persistent consume, layered limit, existing cooldown, and delivery exactly once in order", async () => {
    const order: string[] = [];
    const now = new Date("2026-08-19T00:01:00.000Z");
    const limit = vi.fn(async (input: Record<string, string>) => {
      order.push("limit");
      expect(JSON.stringify(input)).not.toMatch(/synthetic@example|192\.0\.2\.50|SyntheticBrowser/);
      expect(input.actionKey).toMatch(/^v1_[A-Za-z0-9_-]{43}$/);
      return { ok: true as const };
    });
    const send = vi.fn(async () => {
      order.push("send");
      return { ok: true as const };
    });
    const emailCodeCollection = {
      doc() {
        return {
          async get() {
            order.push("cooldown");
            return { data: undefined };
          },
          async set() { return { updated: 1 }; }
        };
      }
    };
    const handlers = createEmailAuthApiHandlers({
      challengeReplayGuard: {
        async consume() {
          order.push("consume");
          return { ok: true as const };
        }
      },
      challengeVerifier: {
        expectedHostnames: ["synthetic-host.example.test"],
        async verify(input) {
          order.push("verify");
          expect(input).toMatchObject({
            action: "email_send_code",
            hostname: "synthetic-host.example.test",
            token: "synthetic-token"
          });
          return {
            action: "email_send_code",
            hostname: "synthetic-host.example.test",
            issuedAt: new Date(now.getTime() - 1_000).toISOString(),
            ok: true as const
          };
        }
      },
      codeGenerator: () => "123456",
      emailCodeCollection,
      emailDelivery: { send },
      env: {
        ALLOWED_ORIGINS: "https://synthetic-origin.example.test",
        APP_ENV: "production",
        AUTH_RATE_LIMIT_KEY_SECRET: "synthetic-rate-key",
        CSRF_SECRET: "synthetic-csrf-secret",
        EMAIL_CODE_SECRET: "synthetic-code-secret",
        NODE_ENV: "production",
        ORIGIN_VERIFY_SECRET: "synthetic-origin-proof",
        securityAlertSink: { available: true, emit() {} }
      },
      now: () => now,
      rateLimiter: {
        check: limit,
        external: true,
        mode: "production",
        reset() {}
      },
      requireChallenge: true,
      userCollection: createNoopCollection()
    });

    const response = await handlers.POST_SEND_CODE(new Request(
      "https://request-host-must-not-bootstrap.example.test/api/auth/email/send-code",
      {
        body: JSON.stringify({
          challengeToken: "synthetic-token",
          email: "synthetic@example.test"
        }),
        headers: {
          "cf-connecting-ip": "192.0.2.50",
          "content-type": "Application/JSON; charset=utf-8",
          origin: "https://synthetic-origin.example.test",
          "user-agent": "SyntheticBrowser/1.0"
        },
        method: "POST"
      }
    ));

    expect(response.status).toBe(200);
    expect(order).toEqual(["verify", "consume", "limit", "cooldown", "send"]);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("ignores client-declared proxy headers unless a trusted client IP resolver is injected", async () => {
    const now = new Date("2026-08-19T00:01:00.000Z");
    const createHandler = (
      capturedKeys: Array<Record<string, string>>,
      resolveTrustedClientIp?: (request: Request) => string | undefined
    ) => createEmailAuthApiHandlers({
      challengeReplayGuard: {
        async consume() { return { ok: true as const }; }
      },
      challengeVerifier: {
        expectedHostnames: ["synthetic-host.example.test"],
        async verify() {
          return {
            action: "email_send_code",
            hostname: "synthetic-host.example.test",
            issuedAt: new Date(now.getTime() - 1_000).toISOString(),
            ok: true as const
          };
        }
      },
      codeGenerator: () => "123456",
      emailCodeCollection: createNoopCollection(),
      emailDelivery: { async send() { return { ok: true as const }; } },
      env: {
        ALLOWED_ORIGINS: "https://synthetic-origin.example.test",
        APP_ENV: "production",
        AUTH_RATE_LIMIT_KEY_SECRET: "synthetic-rate-key",
        CSRF_SECRET: "synthetic-csrf-secret",
        EMAIL_CODE_SECRET: "synthetic-code-secret",
        NODE_ENV: "production",
        ORIGIN_VERIFY_SECRET: "synthetic-origin-proof",
        securityAlertSink: { available: true, emit() {} }
      },
      now: () => now,
      rateLimiter: {
        async check(input) {
          capturedKeys.push(input);
          return { ok: true as const };
        },
        external: true,
        mode: "production",
        reset() {}
      },
      requireChallenge: true,
      resolveTrustedClientIp,
      userCollection: createNoopCollection()
    });
    const request = (claimedIp: string, token: string) => new Request(
      "https://synthetic-origin.example.test/api/auth/email/send-code",
      {
        body: JSON.stringify({
          challengeToken: token,
          email: "synthetic@example.test"
        }),
        headers: {
          "cf-connecting-ip": claimedIp,
          "content-type": "application/json",
          origin: "https://synthetic-origin.example.test",
          "user-agent": "SyntheticBrowser/1.0"
        },
        method: "POST"
      }
    );

    const untrustedKeys: Array<Record<string, string>> = [];
    const untrustedHandler = createHandler(untrustedKeys);
    await expect(untrustedHandler.POST_SEND_CODE(request("192.0.2.10", "token-a")))
      .resolves.toMatchObject({ status: 200 });
    await expect(untrustedHandler.POST_SEND_CODE(request("192.0.2.11", "token-b")))
      .resolves.toMatchObject({ status: 200 });
    expect(untrustedKeys).toHaveLength(2);
    expect(untrustedKeys[1]?.ipKey).toBe(untrustedKeys[0]?.ipKey);
    expect(untrustedKeys[1]?.actionKey).toBe(untrustedKeys[0]?.actionKey);

    const trustedKeys: Array<Record<string, string>> = [];
    const trustedNetworkA = createHandler(trustedKeys, () => "192.0.2.10");
    const trustedNetworkB = createHandler(trustedKeys, () => "192.0.2.11");
    await expect(trustedNetworkA.POST_SEND_CODE(request("198.51.100.1", "token-c")))
      .resolves.toMatchObject({ status: 200 });
    await expect(trustedNetworkB.POST_SEND_CODE(request("198.51.100.1", "token-d")))
      .resolves.toMatchObject({ status: 200 });
    expect(trustedKeys).toHaveLength(2);
    expect(trustedKeys[1]?.ipKey).not.toBe(trustedKeys[0]?.ipKey);
    expect(trustedKeys[1]?.actionKey).not.toBe(trustedKeys[0]?.actionKey);
    expect(JSON.stringify({ trustedKeys, untrustedKeys })).not.toMatch(/192\.0\.2\.|198\.51\.100\./);
  });

  it("allows verification at 4999ms but fails closed at 5000ms and later without retrying or sending", async () => {
    vi.useFakeTimers();
    try {
      const now = new Date("2026-08-19T00:01:00.000Z");
      for (const testCase of [
        { delayMs: 4_999, expectedSend: 1, expectedStatus: 200 },
        { delayMs: 5_000, expectedSend: 0, expectedStatus: 503 },
        { delayMs: 5_001, expectedSend: 0, expectedStatus: 503 }
      ]) {
        const verify = vi.fn(() => new Promise<{
          action: string;
          hostname: string;
          issuedAt: string;
          ok: true;
        }>((resolve) => {
          setTimeout(() => resolve({
            action: "email_send_code",
            hostname: "synthetic-host.example.test",
            issuedAt: new Date(now.getTime() - 1_000).toISOString(),
            ok: true
          }), testCase.delayMs);
        }));
        const send = vi.fn(async () => ({ ok: true as const }));
        const handlers = createEmailAuthApiHandlers({
          challengeReplayGuard: { async consume() { return { ok: true as const }; } },
          challengeVerifier: {
            expectedHostnames: ["synthetic-host.example.test"],
            verify
          },
          codeGenerator: () => "123456",
          emailCodeCollection: createNoopCollection(),
          emailDelivery: { send },
          env: {
            ALLOWED_ORIGINS: "https://synthetic-origin.example.test",
            APP_ENV: "production",
            AUTH_RATE_LIMIT_KEY_SECRET: "synthetic-rate-key",
            CSRF_SECRET: "synthetic-csrf-secret",
            EMAIL_CODE_SECRET: "synthetic-code-secret",
            NODE_ENV: "production",
            ORIGIN_VERIFY_SECRET: "synthetic-origin-proof",
            securityAlertSink: { available: true, emit() {} }
          },
          now: () => now,
          rateLimiter: {
            async check() { return { ok: true as const }; },
            external: true,
            mode: "production",
            reset() {}
          },
          requireChallenge: true,
          userCollection: createNoopCollection()
        });
        const responsePromise = handlers.POST_SEND_CODE(new Request(
          "https://request-host-must-not-bootstrap.example.test/api/auth/email/send-code",
          {
            body: JSON.stringify({
              challengeToken: `synthetic-token-${testCase.delayMs}`,
              email: "synthetic@example.test"
            }),
            headers: {
              "content-type": "application/json",
              origin: "https://synthetic-origin.example.test"
            },
            method: "POST"
          }
        ));

        await vi.advanceTimersByTimeAsync(testCase.delayMs);
        const response = await responsePromise;
        expect(response.status).toBe(testCase.expectedStatus);
        expect(send).toHaveBeenCalledTimes(testCase.expectedSend);
        expect(verify).toHaveBeenCalledTimes(1);
        vi.clearAllTimers();
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it("maps a throwing persistent consume adapter to JSON 503 before limiting or sending", async () => {
    const limit = vi.fn();
    const send = vi.fn();
    const now = new Date("2026-08-19T00:01:00.000Z");
    const handlers = createEmailAuthApiHandlers({
      challengeReplayGuard: {
        async consume() { throw new Error("synthetic store unavailable"); }
      },
      challengeVerifier: {
        expectedHostnames: ["synthetic-host.example.test"],
        async verify() {
          return {
            action: "email_send_code",
            hostname: "synthetic-host.example.test",
            issuedAt: new Date(now.getTime() - 1_000).toISOString(),
            ok: true as const
          };
        }
      },
      emailCodeCollection: createNoopCollection(),
      emailDelivery: { send },
      env: {
        ALLOWED_ORIGINS: "https://synthetic-origin.example.test",
        APP_ENV: "production",
        AUTH_RATE_LIMIT_KEY_SECRET: "synthetic-rate-key",
        CSRF_SECRET: "synthetic-csrf-secret",
        EMAIL_CODE_SECRET: "synthetic-code-secret",
        NODE_ENV: "production",
        ORIGIN_VERIFY_SECRET: "synthetic-origin-proof",
        securityAlertSink: { available: true, emit() {} }
      },
      now: () => now,
      rateLimiter: {
        check: limit,
        external: true,
        mode: "production",
        reset() {}
      },
      requireChallenge: true,
      userCollection: createNoopCollection()
    });
    const response = await handlers.POST_SEND_CODE(new Request(
      "https://request-host-must-not-bootstrap.example.test/api/auth/email/send-code",
      {
        body: JSON.stringify({
          challengeToken: "synthetic-token",
          email: "synthetic@example.test"
        }),
        headers: {
          "content-type": "application/json",
          origin: "https://synthetic-origin.example.test"
        },
        method: "POST"
      }
    ));

    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(limit).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("accepts a challenge at TTL minus one millisecond and rejects it at or after 300 seconds", async () => {
    const issuedAt = new Date("2026-08-19T00:00:00.000Z");
    const verifier = {
      expectedHostnames: ["synthetic-host.example.test"],
      async verify() {
        return {
          action: "email_send_code",
          hostname: "synthetic-host.example.test",
          issuedAt: issuedAt.toISOString(),
          ok: true as const
        };
      }
    };
    const verifyAtAge = (ageMs: number) => verifyEmailChallenge({
      expectedAction: "email_send_code",
      expectedHostname: "synthetic-host.example.test",
      now: new Date(issuedAt.getTime() + ageMs),
      token: "synthetic-token",
      verifier
    });

    await expect(verifyAtAge(299_999)).resolves.toMatchObject({ ok: true });
    await expect(verifyAtAge(300_000)).resolves.toEqual({ ok: false, reason: "expired" });
    await expect(verifyAtAge(300_001)).resolves.toEqual({ ok: false, reason: "expired" });
  });

  it("rejects wildcard or non-exact hostname configuration before calling the provider", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const verifyWith = (expectedHostnames: string[]) => verifyEmailChallenge({
      expectedAction: "email_send_code",
      expectedHostname: "synthetic-host.example.test",
      now: new Date("2026-08-19T00:01:00.000Z"),
      token: "synthetic-token",
      verifier: createTurnstileEmailChallengeVerifier({
        expectedHostnames,
        fetchImpl,
        secretKey: "synthetic-secret"
      })
    });

    for (const invalidHostnames of [
      [],
      ["*"],
      ["*.example.test"],
      ["login.*"],
      ["https://synthetic-host.example.test"],
      ["synthetic-host.example.test:443"],
      ["synthetic host.example.test"]
    ]) {
      await expect(verifyWith(invalidHostnames)).resolves.toEqual({
        ok: false,
        reason: "config-missing"
      });
    }
    expect(fetchImpl).not.toHaveBeenCalled();

    const exactFetch = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({
      action: "email_send_code",
      challenge_ts: "2026-08-19T00:00:59.000Z",
      hostname: "synthetic-host.example.test",
      success: true
    }), {
      headers: { "content-type": "application/json" },
      status: 200
    }));
    await expect(verifyEmailChallenge({
      expectedAction: "email_send_code",
      expectedHostname: "synthetic-host.example.test",
      now: new Date("2026-08-19T00:01:00.000Z"),
      token: "synthetic-token",
      verifier: createTurnstileEmailChallengeVerifier({
        expectedHostnames: ["SyNtHeTiC-HoSt.ExAmPlE.TeSt"],
        fetchImpl: exactFetch,
        secretKey: "synthetic-secret"
      })
    })).resolves.toMatchObject({
      hostname: "synthetic-host.example.test",
      ok: true
    });
    expect(exactFetch).toHaveBeenCalledTimes(1);
  });

  it("persists a versioned environment-scoped one-time marker until cleanup actually removes it", async () => {
    let current = Date.parse("2026-08-19T00:00:00.000Z");
    const documents = new Map<string, Record<string, unknown>>();
    const writes: Array<{ id: string; value: Record<string, unknown> }> = [];
    const database = {
      async runTransaction<T>(operation: (transaction: {
        collection(name: string): {
          doc(id: string): {
            get(): Promise<{ data?: Record<string, unknown> }>;
            set(value: Record<string, unknown>): Promise<unknown>;
          };
        };
      }) => Promise<T>) {
        return operation({
          collection(name) {
            expect(name).toBe("synthetic_challenge_replays");
            return {
              doc(id) {
                return {
                  async get() {
                    return { data: documents.get(id) };
                  },
                  async set(value) {
                    documents.set(id, { ...value });
                    writes.push({ id, value: { ...value } });
                    return { updated: 1 };
                  }
                };
              }
            };
          }
        });
      }
    };
    const guard = createCloudBasePersistentEmailChallengeReplayGuard({
      collectionName: "synthetic_challenge_replays",
      database,
      environmentRef: "LOCAL_SYNTHETIC_HOST_REF",
      keySecret: "synthetic-replay-key",
      keyVersion: "kv2",
      now: () => current
    });
    const input = {
      action: "email_send_code" as const,
      expiresAt: new Date(current + 300_000),
      token: "synthetic-challenge-token"
    };

    await expect(guard.consume(input)).resolves.toEqual({ ok: true });
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({
      id: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      value: {
        action: "email_send_code",
        cleanupAfter: new Date(current + 3_900_000),
        consumedAt: new Date(current),
        environmentRef: "LOCAL_SYNTHETIC_HOST_REF",
        expiresAt: new Date(current + 300_000),
        keyVersion: "kv2",
        schemaVersion: 1
      }
    });
    expect(JSON.stringify(writes)).not.toContain("synthetic-challenge-token");

    const firstDocumentId = writes[0]?.id;
    const rotatedGuard = createCloudBasePersistentEmailChallengeReplayGuard({
      collectionName: "synthetic_challenge_replays",
      database,
      environmentRef: "LOCAL_SYNTHETIC_HOST_REF",
      keySecret: "synthetic-replay-key",
      keyVersion: "kv3",
      now: () => current
    });
    await expect(rotatedGuard.consume(input)).resolves.toEqual({ ok: true });
    expect(writes).toHaveLength(2);
    expect(writes[1]?.id).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(writes[1]?.id).not.toBe(firstDocumentId);
    expect(writes[1]?.value.keyVersion).toBe("kv3");

    current += 3_900_001;
    await expect(guard.consume({
      ...input,
      expiresAt: new Date(current + 300_000)
    })).resolves.toEqual({ ok: false, reason: "replay" });
    expect(writes).toHaveLength(2);
  });

  it("atomically consumes one concurrent email challenge token exactly once", async () => {
    const { database, documents } = createTransactionalDocumentDatabase();
    const guard = createCloudBasePersistentEmailChallengeReplayGuard({
      collectionName: "synthetic_challenge_replays",
      database,
      environmentRef: "LOCAL_SYNTHETIC_HOST_REF",
      keySecret: "synthetic-replay-key",
      keyVersion: "kv3",
      now: () => Date.parse("2026-08-19T00:01:00.000Z")
    });
    const input = {
      action: "email_send_code" as const,
      expiresAt: new Date("2026-08-19T00:06:00.000Z"),
      token: "synthetic-concurrent-token"
    };

    const results = await Promise.all([guard.consume(input), guard.consume(input)]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok && result.reason === "replay")).toHaveLength(1);
    expect(documents.size).toBe(1);
  });

  it("creates independent keyed account, IP, device, and per-network action pseudonyms", () => {
    const base = {
      email: "Synthetic.User@Example.Test",
      environmentRef: "LOCAL_SYNTHETIC_HOST_REF",
      keySecret: "synthetic-rate-limit-key",
      keyVersion: "kv3",
      userAgent: "SyntheticBrowser/1.0"
    };
    const networkA = createEmailSendRateLimitKeys({
      ...base,
      trustedProxyIp: "192.0.2.10"
    });
    const networkB = createEmailSendRateLimitKeys({
      ...base,
      trustedProxyIp: "192.0.2.11"
    });
    const unknownProxy = createEmailSendRateLimitKeys(base);

    expect(networkA).toEqual({
      accountKey: expect.stringMatching(/^kv3_[A-Za-z0-9_-]{43}$/),
      actionKey: expect.stringMatching(/^kv3_[A-Za-z0-9_-]{43}$/),
      deviceKey: expect.stringMatching(/^kv3_[A-Za-z0-9_-]{43}$/),
      ipKey: expect.stringMatching(/^kv3_[A-Za-z0-9_-]{43}$/)
    });
    expect(networkB.actionKey).not.toBe(networkA.actionKey);
    expect(networkB.ipKey).not.toBe(networkA.ipKey);
    expect(networkB.accountKey).toBe(networkA.accountKey);
    expect(unknownProxy.ipKey).not.toBe(networkA.ipKey);
    expect(JSON.stringify({ networkA, networkB, unknownProxy })).not.toMatch(
      /Synthetic\.User|Example\.Test|192\.0\.2\.|SyntheticBrowser/
    );
  });

  it("atomically admits only one concurrent request at the remaining hard-limit capacity", async () => {
    let nowMs = Date.parse("2026-08-19T00:00:00.000Z");
    const documents = new Map<string, Record<string, unknown>>();
    const writes: Array<Record<string, unknown>> = [];
    let transactionQueue = Promise.resolve();
    const database = {
      runTransaction<T>(operation: (transaction: {
        collection(name: string): {
          doc(id: string): {
            get(): Promise<{ data?: Record<string, unknown> }>;
            set(value: Record<string, unknown>): Promise<unknown>;
          };
        };
      }) => Promise<T>) {
        const run = transactionQueue.then(() => operation({
          collection(name) {
            expect(name).toBe("synthetic_rate_limits");
            return {
              doc(id) {
                return {
                  async get() {
                    return { data: documents.get(id) };
                  },
                  async set(value) {
                    documents.set(id, { ...value });
                    writes.push({ id, ...value });
                    return { updated: 1 };
                  }
                };
              }
            };
          }
        }));
        transactionQueue = run.then(() => undefined, () => undefined);
        return run;
      }
    };
    const limiter = createCloudBasePersistentRateLimiter({
      collectionName: "synthetic_rate_limits",
      config: {
        account: { limit: 10, windowMs: 900_000 },
        action: { limit: 1, windowMs: 900_000 },
        device: { limit: 10, windowMs: 900_000 },
        ip: { limit: 10, windowMs: 900_000 },
        session: undefined
      },
      database,
      keySecret: "synthetic-storage-key",
      now: () => nowMs
    });
    const input = createEmailSendRateLimitKeys({
      email: "synthetic@example.test",
      environmentRef: "LOCAL_SYNTHETIC_HOST_REF",
      keySecret: "synthetic-rate-limit-key",
      keyVersion: "kv3",
      trustedProxyIp: "192.0.2.10",
      userAgent: "SyntheticBrowser/1.0"
    });

    const results = await Promise.all([limiter.check(input), limiter.check(input)]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.find((result) => !result.ok)).toEqual({ ok: false, reason: "action" });
    expect(writes).toHaveLength(4);
    expect(writes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        cleanupAfter: new Date(nowMs + 4_500_000),
        count: 1,
        layer: "action"
      })
    ]));
    expect([...documents.values()].find((value) => value.layer === "action")?.count).toBe(1);

    nowMs += 899_999;
    await expect(limiter.check(input)).resolves.toEqual({ ok: false, reason: "action" });
    expect(writes).toHaveLength(4);

    nowMs += 1;
    await expect(limiter.check(input)).resolves.toEqual({ ok: true });
    expect(writes).toHaveLength(8);

    nowMs += 1;
    await expect(limiter.check(input)).resolves.toEqual({ ok: false, reason: "action" });
    expect(writes).toHaveLength(8);
  });

  it("enforces each active rate layer atomically and rolls back a mid-transaction failure", async () => {
    const input = createEmailSendRateLimitKeys({
      email: "synthetic@example.test",
      environmentRef: "LOCAL_SYNTHETIC_HOST_REF",
      keySecret: "synthetic-rate-limit-key",
      keyVersion: "kv3",
      trustedProxyIp: "192.0.2.10",
      userAgent: "SyntheticBrowser/1.0"
    });

    for (const targetLayer of ["account", "ip", "device", "action"] as const) {
      const { database, documents } = createTransactionalDocumentDatabase();
      const limiter = createCloudBasePersistentRateLimiter({
        collectionName: "synthetic_rate_limits",
        config: {
          account: { limit: targetLayer === "account" ? 2 : 100, windowMs: 900_000 },
          action: { limit: targetLayer === "action" ? 2 : 100, windowMs: 900_000 },
          device: { limit: targetLayer === "device" ? 2 : 100, windowMs: 900_000 },
          ip: { limit: targetLayer === "ip" ? 2 : 100, windowMs: 900_000 },
          session: undefined
        },
        database,
        keySecret: "synthetic-storage-key",
        now: () => Date.parse("2026-08-19T00:01:00.000Z")
      });

      await expect(limiter.check(input)).resolves.toEqual({ ok: true });
      const concurrent = await Promise.all([limiter.check(input), limiter.check(input)]);
      expect(concurrent.filter((result) => result.ok)).toHaveLength(1);
      expect(concurrent.filter(
        (result) => !result.ok && result.reason === targetLayer
      )).toHaveLength(1);
      expect(
        [...documents.values()].find((document) => document.layer === targetLayer)?.count
      ).toBe(2);
      expect([...documents.values()].every((document) => document.count === 2)).toBe(true);
    }

    const failing = createTransactionalDocumentDatabase();
    const limiter = createCloudBasePersistentRateLimiter({
      collectionName: "synthetic_rate_limits",
      database: failing.database,
      keySecret: "synthetic-storage-key",
      now: () => Date.parse("2026-08-19T00:01:00.000Z")
    });
    failing.failNextTransactionAtSet(2);
    await expect(limiter.check(input)).resolves.toEqual({ ok: false, reason: "unavailable" });
    expect(failing.documents.size).toBe(0);
  });

  it("shares the action limit across identities on one trusted network but not another", async () => {
    const { database, documents } = createTransactionalDocumentDatabase();
    const limiter = createCloudBasePersistentRateLimiter({
      collectionName: "synthetic_rate_limits",
      config: {
        account: { limit: 100, windowMs: 900_000 },
        action: { limit: 5, windowMs: 900_000 },
        device: { limit: 100, windowMs: 900_000 },
        ip: { limit: 100, windowMs: 900_000 },
        session: undefined
      },
      database,
      keySecret: "synthetic-storage-key",
      now: () => Date.parse("2026-08-19T00:01:00.000Z")
    });
    const keysFor = (identity: number, trustedProxyIp: string) =>
      createEmailSendRateLimitKeys({
        email: `synthetic-${identity}@example.test`,
        environmentRef: "LOCAL_SYNTHETIC_HOST_REF",
        keySecret: "synthetic-rate-limit-key",
        keyVersion: "kv3",
        trustedProxyIp,
        userAgent: `SyntheticBrowser/${identity}`
      });

    for (let identity = 1; identity <= 5; identity += 1) {
      await expect(limiter.check(keysFor(identity, "192.0.2.10"))).resolves.toEqual({ ok: true });
    }
    await expect(limiter.check(keysFor(6, "192.0.2.10"))).resolves.toEqual({
      ok: false,
      reason: "action"
    });
    await expect(limiter.check(keysFor(7, "192.0.2.11"))).resolves.toEqual({ ok: true });

    const actionCounts = [...documents.values()]
      .filter((document) => document.layer === "action")
      .map((document) => document.count)
      .sort((left, right) => Number(left) - Number(right));
    expect(actionCounts).toEqual([1, 5]);
  });
});
