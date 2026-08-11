import { describe, expect, it, vi } from "vitest";

import nextConfig from "@/next.config";
import { createContentSecurityPolicy } from "@/server/security/content-security-policy";
import { readJsonBody } from "@/server/api-utils";
import {
  clearAuthSessionCookie,
  createAuthSessionCookie,
  readAuthSessionFromRequest
} from "@/server/auth-session";
import { createEmailAuthApiHandlers } from "@/server/email-auth-api";
import { type EmailAuthCollection } from "@/server/email-auth";
import {
  createSessionRevocationGuard,
  type SessionRevocationStore
} from "@/server/security/session-revocation";
import {
  createTurnstileEmailChallengeVerifier,
  verifyEmailChallenge,
  type EmailChallengeVerifier
} from "@/server/security/email-challenge";
import {
  evaluateWriteRequest,
  createCsrfProof,
  type WriteRequestSecurityEnv
} from "@/server/security/request-guard";
import {
  validateJsonValue,
  type JsonSafetyLimits
} from "@/server/security/schema-limits";
import {
  createMemoryAlertSink,
  createRedactedSecurityAudit
} from "@/server/security/security-observability";
import {
  createLayeredRateLimiter,
  type LayeredRateLimitConfig
} from "@/server/security/rate-limit";
import {
  projectPublicFields,
  PUBLIC_PARENT_NEED_FIELDS
} from "@/server/security/public-field-policy";
import { evaluateScopedAccess } from "@/server/security/access-policy";

type StoredDocument = Record<string, unknown>;

function createFakeCollection(initial: Record<string, StoredDocument> = {}) {
  const documents = new Map(Object.entries(initial));
  return {
    documents,
    doc(id: string) {
      return {
        async get() {
          const value = documents.get(id);
          return { data: value ? [{ ...value, id }] : [] };
        },
        async set(value: StoredDocument) {
          documents.set(id, { ...value });
          return { updated: 1 };
        },
        async update(value: StoredDocument) {
          documents.set(id, { ...(documents.get(id) ?? {}), ...value });
          return { updated: 1 };
        }
      };
    }
  } satisfies EmailAuthCollection & {
    documents: Map<string, StoredDocument>;
  };
}

function createEmailHandlers(options: {
  challengeVerifier?: EmailChallengeVerifier;
  requireChallenge?: boolean;
  sentCodes?: string[];
  codeCollection?: ReturnType<typeof createFakeCollection>;
  userCollection?: ReturnType<typeof createFakeCollection>;
}) {
  const codeCollection = options.codeCollection ?? createFakeCollection();
  const userCollection = options.userCollection ?? createFakeCollection();
  const sentCodes = options.sentCodes ?? [];

  return {
    handlers: createEmailAuthApiHandlers({
      challengeVerifier: options.challengeVerifier,
      codeGenerator: () => "123456",
      emailCodeCollection: codeCollection,
      emailDelivery: {
        async send({ code }) {
          sentCodes.push(code);
          return { ok: true };
        }
      },
      env: {
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "security-test-secret",
        EMAIL_CODE_SECRET: "security-code-secret",
        NODE_ENV: "test"
      },
      now: () => new Date("2026-08-10T12:00:00.000Z"),
      requireChallenge: options.requireChallenge,
      userCollection
    }),
    codeCollection,
    sentCodes,
    userCollection
  };
}

function sendCodeRequest(token?: string) {
  return new Request("https://ungraduedu.eu.cc/api/auth/email/send-code", {
    body: JSON.stringify({
      challengeToken: token,
      email: "synthetic@example.test"
    }),
    headers: {
      "content-type": "application/json",
      origin: "https://ungraduedu.eu.cc"
    },
    method: "POST"
  });
}

function loginRequest(token?: string) {
  return new Request("https://ungraduedu.eu.cc/api/auth/email/login", {
    body: JSON.stringify({
      challengeToken: token,
      code: "123456",
      email: "synthetic@example.test"
    }),
    headers: {
      "content-type": "application/json",
      origin: "https://ungraduedu.eu.cc",
      "x-ungrade-csrf": createCsrfProof({
        method: "POST",
        origin: "https://ungraduedu.eu.cc",
        secret: "synthetic-csrf-secret",
        subjectId: "synthetic@example.test"
      })
    },
    method: "POST"
  });
}

describe("ISSUE-0034 non-database security baseline", () => {
  it("rejects a session signed with an inactive key version or revoked epoch", async () => {
    const revokedAt = new Map<string, string>();
    const store: SessionRevocationStore = {
      readRevokedAt: async (userId) => revokedAt.get(userId),
      revoke: async (userId, at) => {
        revokedAt.set(userId, at);
        return at;
      }
    };
    const guard = createSessionRevocationGuard({
      activeKeyVersion: "v2",
      store
    });

    expect(
      await guard.check({
        createdAt: "2026-08-10T12:00:00.000Z",
        keyVersion: "v1",
        now: new Date("2026-08-10T12:01:00.000Z"),
        userId: "synthetic-owner"
      })
    ).toMatchObject({ ok: false, reason: "key-version-stale" });

    await guard.revoke("synthetic-owner", new Date("2026-08-10T12:02:00.000Z"));
    expect(
      await guard.check({
        createdAt: "2026-08-10T12:00:00.000Z",
        keyVersion: "v2",
        now: new Date("2026-08-10T12:03:00.000Z"),
        userId: "synthetic-owner"
      })
    ).toMatchObject({ ok: false, reason: "revoked" });
  });

  it("binds signed cookies to the active key version and server revocation epoch", () => {
    const oldEnv = {
      AUTH_SESSION_KEY_VERSION: "v1",
      AUTH_SESSION_SECRET: "synthetic-secret",
      NODE_ENV: "production"
    };
    const cookie = createAuthSessionCookie({
      createdAt: "2026-08-10T12:00:00.000Z",
      env: oldEnv,
      now: new Date("2026-08-10T12:00:00.000Z"),
      userId: "synthetic-owner"
    }) ?? "";
    const request = new Request("https://ungraduedu.eu.cc/api/session", {
      headers: { cookie }
    });

    expect(
      readAuthSessionFromRequest(request, {
        AUTH_SESSION_KEY_VERSION: "v2",
        AUTH_SESSION_SECRET: "synthetic-secret",
        NODE_ENV: "production"
      }, { now: new Date("2026-08-10T12:01:00.000Z") })
    ).toBeNull();
    expect(
      readAuthSessionFromRequest(request, {
        AUTH_SESSION_KEY_VERSION: "v1",
        AUTH_SESSION_REVOKED_AT: "2026-08-10T12:00:30.000Z",
        AUTH_SESSION_SECRET: "synthetic-secret",
        NODE_ENV: "production"
      }, { now: new Date("2026-08-10T12:01:00.000Z") })
    ).toBeNull();
    expect(
      readAuthSessionFromRequest(request, {
        AUTH_SESSION_KEY_VERSION: "v1",
        AUTH_SESSION_REVOKED_AT: "not-a-date",
        AUTH_SESSION_SECRET: "synthetic-secret",
        NODE_ENV: "production"
      }, { now: new Date("2026-08-10T12:01:00.000Z") })
    ).toBeNull();
    expect(clearAuthSessionCookie({ NODE_ENV: "production" })).toContain("Secure");
  });

  it("fails closed for missing or foreign write Origin and CSRF proof", () => {
    const env: WriteRequestSecurityEnv = {
      allowedOrigins: ["https://ungraduedu.eu.cc"],
      csrfSecret: "synthetic-csrf",
      mode: "enforce"
    };
    const missingOrigin = evaluateWriteRequest({
      env,
      request: new Request("https://ungraduedu.eu.cc/api/profile", {
        method: "POST"
      })
    });
    const foreignOrigin = evaluateWriteRequest({
      env,
      request: new Request("https://ungraduedu.eu.cc/api/profile", {
        headers: {
          origin: "https://evil.example",
          "x-ungrade-csrf": "synthetic-csrf"
        },
        method: "POST"
      })
    });
    const valid = evaluateWriteRequest({
      env,
      request: new Request("https://ungraduedu.eu.cc/api/profile", {
        headers: {
          origin: "https://ungraduedu.eu.cc",
          "x-ungrade-csrf": "synthetic-csrf"
        },
        method: "POST"
      })
    });

    expect(missingOrigin).toMatchObject({ ok: false, reason: "origin-missing" });
    expect(foreignOrigin).toMatchObject({ ok: false, reason: "origin-not-allowed" });
    expect(valid.ok).toBe(true);
  });

  it("rejects oversized bodies, deep objects, long strings, and arrays before handlers", async () => {
    const limits: JsonSafetyLimits = {
      maxArrayLength: 2,
      maxBodyBytes: 80,
      maxDepth: 2,
      maxStringLength: 12
    };
    expect(validateJsonValue({ a: "1234567890123" }, limits)).toMatchObject({
      ok: false,
      reason: "string-too-long"
    });
    expect(validateJsonValue({ a: [1, 2, 3] }, limits)).toMatchObject({
      ok: false,
      reason: "array-too-long"
    });
    expect(validateJsonValue({ a: { b: { c: true } } }, limits)).toMatchObject({
      ok: false,
      reason: "object-too-deep"
    });
    const body = await readJsonBody<{ value: string }>(
      new Request("https://example.test", {
        body: JSON.stringify({ value: "x".repeat(100) }),
        method: "POST"
      }),
      limits
    );
    expect(body).toMatchObject({ ok: false });
    const unknownField = await readJsonBody<{ value?: string }>(
      new Request("https://example.test", {
        body: JSON.stringify({ unexpected: true, value: "ok" }),
        method: "POST"
      }),
      { allowedKeys: ["value"] }
    );
    expect(unknownField).toMatchObject({
      ok: false,
      response: expect.objectContaining({ status: 400 })
    });
  });

  it("consumes a valid email code only once under concurrent login", async () => {
    const sentCodes: string[] = [];
    const challengeVerifier = {
      async verify(input: { token: string; hostname: string; action: string }) {
        return input.token === "synthetic-token" &&
          input.hostname === "ungraduedu.eu.cc" &&
          input.action === "email_send_code"
          ? {
              action: input.action,
              hostname: input.hostname,
              issuedAt: "2026-08-10T11:59:00.000Z",
              ok: true as const
            }
          : { ok: false as const, reason: "invalid" as const };
      }
    };
    const { handlers } = createEmailHandlers({
      challengeVerifier,
      requireChallenge: true,
      sentCodes
    });

    expect((await handlers.POST_SEND_CODE(sendCodeRequest("synthetic-token"))).status).toBe(200);
    const [first, second] = await Promise.all([
      handlers.POST_LOGIN(loginRequest("synthetic-token")),
      handlers.POST_LOGIN(loginRequest("synthetic-token"))
    ]);
    expect([first.status, second.status].filter((status) => status === 200)).toHaveLength(1);
    expect(sentCodes).toHaveLength(1);
  });

  it("fails closed instead of falling back to a non-atomic production consume", async () => {
    const fixture = createEmailHandlers({});
    const sent = await fixture.handlers.POST_SEND_CODE(
      new Request("https://ungraduedu.eu.cc/api/auth/email/send-code", {
        body: JSON.stringify({ email: "synthetic@example.test" }),
        method: "POST"
      })
    );
    expect(sent.status).toBe(200);

    const response = await createEmailAuthApiHandlers({
      codeGenerator: () => "123456",
      emailCodeCollection: fixture.codeCollection,
      emailDelivery: { async send() { return { ok: true }; } },
      env: {
        APP_ENV: "production",
        ALLOWED_ORIGINS: "https://ungraduedu.eu.cc",
        AUTH_SESSION_SECRET: "synthetic-secret",
        CSRF_SECRET: "synthetic-csrf-secret",
        EMAIL_CODE_SECRET: "synthetic-code-secret",
        NODE_ENV: "production"
      },
      now: () => new Date("2026-08-10T12:00:00.000Z"),
      requireAtomicCodeConsume: true,
      userCollection: fixture.userCollection
    }).POST_LOGIN(loginRequest());

    expect(response.status).toBe(503);
  });

  it("blocks missing, replayed, mismatched, or unavailable challenge before delivery", async () => {
    const sentCodes: string[] = [];
    const verifier = {
      verify: vi.fn(async ({ token, hostname, action }: { token: string; hostname: string; action: string }) =>
        token === "good"
          ? { action, hostname, issuedAt: "2026-08-10T11:59:00.000Z", ok: true as const }
          : { ok: false as const, reason: "invalid" as const })
    };
    const { handlers } = createEmailHandlers({
      challengeVerifier: verifier,
      requireChallenge: true,
      sentCodes
    });

    expect((await handlers.POST_SEND_CODE(sendCodeRequest())).status).toBe(403);
    expect((await handlers.POST_SEND_CODE(sendCodeRequest("bad"))).status).toBe(403);
    expect((await handlers.POST_SEND_CODE(sendCodeRequest("good"))).status).toBe(200);
    expect(sentCodes).toHaveLength(1);
    expect(verifier.verify).toHaveBeenCalledTimes(2);
  });

  it("rejects a provider success without a verifiable issue time", async () => {
    const result = await verifyEmailChallenge({
      expectedAction: "email_send_code",
      expectedHostname: "ungraduedu.eu.cc",
      now: new Date("2026-08-10T12:00:00.000Z"),
      token: "synthetic-token",
      verifier: {
        async verify() {
          return {
            action: "email_send_code",
            hostname: "ungraduedu.eu.cc",
            ok: true as const
          };
        }
      }
    });

    expect(result).toMatchObject({ ok: false, reason: "expired" });
  });

  it("validates a password-login Turnstile token through the official Siteverify seam", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = init?.body as FormData;
      expect(body.get("secret")).toBe("1x0000000000000000000000000000000AA");
      expect(body.get("response")).toBe("XXXX.DUMMY.TOKEN.XXXX");
      return Response.json({
        action: "password_login",
        challenge_ts: "2026-08-10T11:59:00.000Z",
        hostname: "ungraduedu.eu.cc",
        success: true
      });
    });
    const verifier = createTurnstileEmailChallengeVerifier({
      expectedHostnames: ["ungraduedu.eu.cc"],
      fetchImpl,
      secretKey: "1x0000000000000000000000000000000AA"
    });

    const result = await verifyEmailChallenge({
      expectedAction: "password_login",
      expectedHostname: "ungraduedu.eu.cc",
      now: new Date("2026-08-10T12:00:00.000Z"),
      token: "XXXX.DUMMY.TOKEN.XXXX",
      verifier
    });

    expect(result).toMatchObject({
      action: "password_login",
      hostname: "ungraduedu.eu.cc",
      ok: true,
      providerEnforcesSingleUse: true
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("fails closed for every Turnstile provider and token failure without logging credentials", async () => {
    const verifyWith = async (
      fetchImpl: typeof fetch,
      options: { secretKey?: string; token?: string; timeoutMs?: number } = {}
    ) => verifyEmailChallenge({
      expectedAction: "password_login",
      expectedHostname: "ungraduedu.eu.cc",
      now: new Date("2026-08-10T12:00:00.000Z"),
      token: options.token ?? "XXXX.DUMMY.TOKEN.XXXX",
      verifier: createTurnstileEmailChallengeVerifier({
        expectedHostnames: ["ungraduedu.eu.cc"],
        fetchImpl,
        secretKey: options.secretKey === undefined
          ? "1x0000000000000000000000000000000AA"
          : options.secretKey,
        timeoutMs: options.timeoutMs
      })
    });
    const response = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), {
        headers: { "content-type": "application/json" },
        status
      });
    const success = (overrides: Record<string, unknown> = {}, status = 200) => response({
      action: "password_login",
      challenge_ts: "2026-08-10T11:59:00.000Z",
      hostname: "ungraduedu.eu.cc",
      success: true,
      ...overrides
    }, status);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const missingSecretFetch = vi.fn<typeof fetch>();
    await expect(verifyWith(missingSecretFetch, { secretKey: "" }))
      .resolves.toEqual({ ok: false, reason: "secret-missing" });
    expect(missingSecretFetch).not.toHaveBeenCalled();

    await expect(verifyWith(vi.fn(async (_url, init) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      throw new DOMException("timed out", "AbortError");
    }), { timeoutMs: 1 })).resolves.toEqual({ ok: false, reason: "timeout" });
    await expect(verifyWith(vi.fn(async () => new Response("not-json"))))
      .resolves.toEqual({ ok: false, reason: "unreachable" });
    await expect(verifyWith(vi.fn(async () => success({}, 503))))
      .resolves.toEqual({ ok: false, reason: "unreachable" });
    await expect(verifyWith(vi.fn(async () => response({
      "error-codes": ["invalid-input-response"],
      success: false
    })))).resolves.toEqual({ ok: false, reason: "invalid" });
    await expect(verifyWith(vi.fn(async () => response({
      "error-codes": ["timeout-or-duplicate"],
      success: false
    })))).resolves.toEqual({ ok: false, reason: "replay" });
    await expect(verifyWith(vi.fn(async () => response({
      "error-codes": ["internal-error"],
      success: false
    })))).resolves.toEqual({ ok: false, reason: "unreachable" });
    await expect(verifyWith(vi.fn(async () => response({
      "error-codes": ["invalid-input-secret"],
      success: false
    })))).resolves.toEqual({ ok: false, reason: "secret-missing" });
    await expect(verifyWith(vi.fn(async () => success({ action: "email_send_code" }))))
      .resolves.toEqual({ ok: false, reason: "action-mismatch" });
    await expect(verifyWith(vi.fn(async () => success({ hostname: "evil.example" }))))
      .resolves.toEqual({ ok: false, reason: "hostname-mismatch" });
    await expect(verifyWith(vi.fn(async () => success({
      challenge_ts: "2026-08-10T11:50:00.000Z"
    })))).resolves.toEqual({ ok: false, reason: "expired" });
    const oversizedFetch = vi.fn<typeof fetch>();
    await expect(verifyWith(oversizedFetch, { token: "x".repeat(2049) }))
      .resolves.toEqual({ ok: false, reason: "invalid" });
    expect(oversizedFetch).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();

    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  it("emits correlation and redacted audit/alert data without sensitive values", () => {
    const audit = createRedactedSecurityAudit({
      actorId: "synthetic-owner",
      correlationId: "corr-synthetic-1",
      event: "idor_rejected",
      metadata: {
        authorization: "Bearer synthetic-secret",
        email: "synthetic@example.test",
        phone: "13800000000",
        reason: "foreign-owner",
        token: "challenge-secret"
      }
    });
    const sink = createMemoryAlertSink();
    sink.emit(audit);

    expect(audit).toMatchObject({
      actorId: "synthetic-owner",
      correlationId: "corr-synthetic-1",
      event: "idor_rejected",
      metadata: { reason: "foreign-owner" }
    });
    expect(JSON.stringify(audit)).not.toContain("synthetic@example.test");
    expect(JSON.stringify(audit)).not.toContain("13800000000");
    expect(JSON.stringify(audit)).not.toContain("synthetic-secret");
    expect(sink.events).toHaveLength(1);
  });

  it("enforces account, IP, device, and action rate limits independently", async () => {
    const config: LayeredRateLimitConfig = {
      account: { limit: 2, windowMs: 60_000 },
      action: { limit: 2, windowMs: 60_000 },
      device: { limit: 2, windowMs: 60_000 },
      ip: { limit: 2, windowMs: 60_000 }
    };
    const limiter = createLayeredRateLimiter({ config, now: () => 1000 });
    const input = {
      accountKey: "account-a",
      actionKey: "email-send",
      deviceKey: "device-a",
      ipKey: "ip-a"
    };
    expect((await limiter.check(input)).ok).toBe(true);
    expect((await limiter.check(input)).ok).toBe(true);
    expect((await limiter.check(input)).ok).toBe(false);
    expect((await limiter.check({
      ...input,
      accountKey: "account-b",
      actionKey: "email-login",
      deviceKey: "device-b",
      ipKey: "ip-b"
    })).ok).toBe(true);
  });

  it("projects public fields and rejects foreign/deleted/source/contact access", () => {
    const projected = projectPublicFields(
      {
        childIntro: "synthetic intro",
        id: "parent-need-synthetic",
        ownerUserId: "owner-a",
        phone: "13800000000",
        secret: "synthetic-secret",
        status: "published",
        subjects: ["数学"]
      },
      PUBLIC_PARENT_NEED_FIELDS
    );
    expect(projected).toEqual({
      id: "parent-need-synthetic",
      status: "published",
      subjects: ["数学"]
    });
    expect(
      evaluateScopedAccess({
        actorId: "participant",
        ownerId: "owner-a",
        sourceStatus: "deleted",
        contactAuthorized: true
      })
    ).toMatchObject({ ok: false, reason: "source-unavailable" });
    expect(
      evaluateScopedAccess({
        actorId: "other",
        ownerId: "owner-a",
        sourceStatus: "published",
        contactAuthorized: false
      })
    ).toMatchObject({ ok: false, reason: "owner-mismatch" });
  });

  it("allows only the Turnstile script and frame origins without weakening the hardened CSP", async () => {
    const headersConfig = await nextConfig.headers?.();
    const allHeaders = headersConfig?.flatMap((entry) => entry.headers) ?? [];
    const csp = createContentSecurityPolicy("synthetic-request-nonce");
    const hsts = String(allHeaders.find((header) => header.key === "Strict-Transport-Security")?.value ?? "");

    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("script-src 'self' 'nonce-synthetic-request-nonce' https://challenges.cloudflare.com");
    expect(csp).toContain("frame-src https://challenges.cloudflare.com");
    expect(csp).not.toMatch(/script-src[^;]*(?:\shttps:(?=\s|;|$)|\s\*)/);
    expect(csp).not.toMatch(/frame-src[^;]*(?:\shttps:(?=\s|;|$)|\s\*)/);
    expect(csp).not.toContain("'unsafe-inline'");
    expect(hsts).toContain("max-age=31536000");
    expect(hsts).toContain("includeSubDomains");
  });

  it("keeps dependency and SQL/SSRF inventory output deterministic and non-sensitive", async () => {
    const { createSecurityInventoryReport } = await import("@/server/security/inventory");
    const report = createSecurityInventoryReport({
      dependencies: ["next@15", "react@19"],
      sqlSinks: [],
      ssrfSinks: []
    });
    expect(report).toMatchObject({
      dependencies: ["next@15", "react@19"],
      sqlSinks: [],
      ssrfSinks: []
    });
    expect(JSON.stringify(report)).not.toMatch(/secret|token|password/i);
  });

  it("does not use real email delivery when challenge verification is unavailable", async () => {
    const sentCodes: string[] = [];
    const { handlers } = createEmailHandlers({
      challengeVerifier: {
        async verify() {
          return { ok: false, reason: "unreachable" };
        }
      },
      requireChallenge: true,
      sentCodes
    });

    const response = await handlers.POST_SEND_CODE(sendCodeRequest("synthetic-token"));
    expect(response.status).toBe(503);
    expect(sentCodes).toHaveLength(0);
  });
});
