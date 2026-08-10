import { describe, expect, it, vi } from "vitest";

import { createAuthApiHandlers } from "@/server/auth-api";
import { createConversationApiHandlers } from "@/server/conversation-api";
import { listPublicServerParentNeeds } from "@/server/parent-needs";
import { listPublicServerTutorProfiles } from "@/server/tutor-profiles";
import { guardWriteRequest, readJsonBody } from "@/server/api-utils";
import { normalizeOriginVerificationMode } from "@/server/origin-request-verification";
import {
  createAuthSessionCookie,
  type AuthSessionRevocationGuard
} from "@/server/auth-session";
import {
  createCsrfProof,
  evaluateWriteRequest,
  resolveTrustedRequestKeys
} from "@/server/security/request-guard";
import {
  createRedactedSecurityAudit,
  createMemoryAlertSink
} from "@/server/security/security-observability";
import {
  projectPublicFields,
  PUBLIC_PARENT_NEED_FIELDS
} from "@/server/security/public-field-policy";
import { evaluateScopedAccess } from "@/server/security/access-policy";
import { createLayeredRateLimiter } from "@/server/security/rate-limit";
import { hashEmail, type EmailAuthCollection, type EmailAuthAtomicTransactionRunner } from "@/server/email-auth";

function authorizedWriteRequest(
  path: string,
  userId = "synthetic-user"
) {
  const origin = "https://ungraduedu.eu.cc";
  const csrfSecret = "synthetic-csrf-secret";
  return new Request(`${origin}${path}`, {
    headers: {
      origin,
      "x-ungrade-csrf": createCsrfProof({
        method: "POST",
        origin,
        secret: csrfSecret,
        subjectId: userId
      }),
      "x-ungrade-session-user": userId
    },
    method: "POST"
  });
}

describe("ISSUE-0034 S1 independent rework contract", () => {
  const PUBLIC_DTO_DECISION_SHA = "3E15EC5AC2D8BC5D8CDA3FB370F16064BAD7265D764BDE1CC153E719BA708D32";

  it("fails closed when enforce mode has no configured allowed origins", () => {
    const result = evaluateWriteRequest({
      env: {
        csrfSecret: "secret",
        mode: "enforce"
      },
      request: new Request("https://ungraduedu.eu.cc/api/write", {
        headers: { origin: "https://ungraduedu.eu.cc" },
        method: "POST"
      })
    });

    expect(result).toMatchObject({ ok: false, reason: "origin-not-allowed" });
  });

  it("defaults production direct guards to enforce when mode is absent", async () => {
    const collection = {
      doc: vi.fn(() => ({ get: vi.fn(async () => ({ data: [] })), set: vi.fn() })),
      where: vi.fn(() => ({ get: vi.fn(async () => ({ data: [] })) }))
    };
    const handlers = createConversationApiHandlers({
      conversationsCollection: collection,
      env: {
        ALLOWED_ORIGINS: "https://ungraduedu.eu.cc",
        APP_ENV: "test",
        CSRF_SECRET: "synthetic-csrf-secret",
        M5_ENABLE_HOSTED_TEST_LOGIN: "true",
        NODE_ENV: "production"
      },
      messagesCollection: collection,
      parentNeedsCollection: collection,
      tutorProfilesCollection: collection
    });

    const response = await handlers.POST_MESSAGES(
      new Request("https://ungraduedu.eu.cc/api/conversations/synthetic/messages", {
        headers: { "x-ungradu-test-user-phone": "synthetic-user" },
        method: "POST",
        body: JSON.stringify({ text: "synthetic" })
      }),
      { params: Promise.resolve({ id: "synthetic-conversation" }) }
    );

    expect(response.status).toBe(503);
    expect(collection.doc).not.toHaveBeenCalled();
  });

  it("defaults the middleware origin mode to enforce in production when unset", () => {
    expect(normalizeOriginVerificationMode(undefined, { appEnv: "production", nodeEnv: "production" })).toBe("enforce");
  });

  it("does not allow off or observe origin rollout modes in a production candidate", () => {
    expect(normalizeOriginVerificationMode("off", { appEnv: "production", nodeEnv: "production" })).toBe("enforce");
    expect(normalizeOriginVerificationMode("observe", { appEnv: "production", nodeEnv: "production" })).toBe("enforce");
    expect(normalizeOriginVerificationMode("off", { appEnv: "test", nodeEnv: "test" })).toBe("off");
    expect(normalizeOriginVerificationMode("observe", { appEnv: "test", nodeEnv: "test" })).toBe("observe");
  });

  it("forces direct production write guards to enforce even when rollout mode is off", () => {
    const response = guardWriteRequest(new Request("https://ungraduedu.eu.cc/api/write", {
      method: "POST"
    }), {
      ALLOWED_ORIGINS: "https://ungraduedu.eu.cc",
      APP_ENV: "test",
      CSRF_SECRET: "synthetic-csrf-secret",
      NODE_ENV: "production",
      ORIGIN_VERIFY_MODE: "off"
    });
    expect(response?.status).toBe(503);
  });

  it("binds CSRF proof to the authenticated subject and rejects a foreign subject", () => {
    const origin = "https://ungraduedu.eu.cc";
    const secret = "synthetic-csrf-secret";
    const proof = createCsrfProof({
      method: "POST",
      origin,
      secret,
      subjectId: "owner-a"
    });

    expect(
      evaluateWriteRequest({
        env: {
          allowedOrigins: [origin],
          csrfSecret: secret,
          mode: "enforce",
          subjectId: "owner-b"
        },
        request: new Request(`${origin}/api/write`, {
          headers: { origin, "x-ungrade-csrf": proof },
          method: "POST"
        })
      })
    ).toMatchObject({ ok: false, reason: "csrf-invalid" });
  });

  it("rejects a JSON null, primitive, array, and wrong field type at the body seam", async () => {
    const limits = {
      allowedKeys: ["sourceId", "sourceType"],
      schema: {
        sourceId: { type: "string" as const },
        sourceType: { enum: ["parent-need", "tutor-profile"] }
      }
    };

    for (const value of [null, 1, [], { sourceId: 123, sourceType: "parent-need" }]) {
      const result = await readJsonBody(
        new Request("https://ungraduedu.eu.cc/api/write", {
          body: JSON.stringify(value),
          headers: { "content-type": "application/json" },
          method: "POST"
        }),
        limits
      );

      expect(result.ok).toBe(false);
    }
  });

  it("rejects deep unknown fields instead of validating only top-level keys", async () => {
    const result = await readJsonBody(
      new Request("https://ungraduedu.eu.cc/api/write", {
        body: JSON.stringify({
          sourceId: "synthetic-source",
          sourceType: "parent-need",
          nested: { unexpected: "value" }
        }),
        headers: { "content-type": "application/json" },
        method: "POST"
      }),
      {
        allowedKeys: ["sourceId", "sourceType", "nested"],
        schema: {
          sourceId: { type: "string" as const },
          sourceType: { enum: ["parent-need", "tutor-profile"] },
          nested: { object: { allowedKeys: [] } }
        }
      }
    );

    expect(result.ok).toBe(false);
  });

  it("uses server-side revocation in the actual session and logout handlers", async () => {
    const revoked = new Set<string>();
    const sessionRevocationGuard: AuthSessionRevocationGuard = {
      async check(session) {
        return revoked.has(session.userId)
          ? { ok: false as const, reason: "revoked" as const }
          : { ok: true as const };
      },
      async revoke(userId) {
        revoked.add(userId);
      }
    };
    const env = {
      AUTH_SESSION_KEY_VERSION: "v2",
      AUTH_SESSION_SECRET: "synthetic-session-secret",
      ALLOWED_ORIGINS: "https://ungraduedu.eu.cc",
      CSRF_SECRET: "synthetic-csrf-secret",
      NODE_ENV: "production"
    };
    const cookie = createAuthSessionCookie({ env, userId: "synthetic-user" });
    const handlers = createAuthApiHandlers({ env, sessionRevocationGuard });

    const logout = await handlers.POST_LOGOUT(
      new Request("https://ungraduedu.eu.cc/api/auth/logout", {
        headers: {
          cookie: cookie ?? "",
          origin: "https://ungraduedu.eu.cc",
          "x-ungrade-csrf": createCsrfProof({
            method: "POST",
            origin: "https://ungraduedu.eu.cc",
            secret: "synthetic-csrf-secret",
            subjectId: "synthetic-user"
          })
        },
        method: "POST"
      })
    );
    expect(logout.status).toBe(200);

    const session = await handlers.GET_SESSION(
      new Request("https://ungraduedu.eu.cc/api/auth/session", {
        headers: { cookie: cookie ?? "" }
      })
    );
    expect(session.status).toBe(401);
    expect(revoked.has("synthetic-user")).toBe(true);
  });

  it("rejects a revoked session before a direct write handler can mutate", async () => {
    const collection = {
      doc: vi.fn(() => ({ get: vi.fn(async () => ({ data: [] })), set: vi.fn() })),
      where: vi.fn(() => ({ get: vi.fn(async () => ({ data: [] })) }))
    };
    const createdAt = "2026-08-10T10:00:00.000Z";
    const env = {
      ALLOWED_ORIGINS: "https://ungraduedu.eu.cc",
      APP_ENV: "test",
      AUTH_SESSION_KEY_VERSION: "v1",
      AUTH_SESSION_REVOKED_AT: "2026-08-10T10:01:00.000Z",
      AUTH_SESSION_SECRET: "synthetic-session-secret",
      CSRF_SECRET: "synthetic-csrf-secret",
      M5_ENABLE_HOSTED_TEST_LOGIN: "true",
      NODE_ENV: "development",
      ORIGIN_VERIFY_MODE: "enforce" as const
    };
    const cookie = createAuthSessionCookie({ createdAt, env, userId: "synthetic-user" });
    const handlers = createConversationApiHandlers({
      conversationsCollection: collection,
      env,
      messagesCollection: collection,
      parentNeedsCollection: collection,
      tutorProfilesCollection: collection
    });

    const response = await handlers.POST_MESSAGES(
      new Request("https://ungraduedu.eu.cc/api/conversations/synthetic/messages", {
        headers: { cookie: cookie ?? "" },
        method: "POST",
        body: JSON.stringify({ text: "synthetic" })
      }),
      { params: Promise.resolve({ id: "synthetic-conversation" }) }
    );

    expect(response.status).toBe(401);
    expect(collection.doc).not.toHaveBeenCalled();
  });

  it("uses the injected revocation guard in a real conversation write handler", async () => {
    const collection = {
      doc: vi.fn(() => ({ get: vi.fn(async () => ({ data: [] })), set: vi.fn() })),
      where: vi.fn(() => ({ get: vi.fn(async () => ({ data: [] })) }))
    };
    const env = {
      ALLOWED_ORIGINS: "https://ungraduedu.eu.cc",
      AUTH_SESSION_KEY_VERSION: "v1",
      AUTH_SESSION_SECRET: "synthetic-session-secret",
      CSRF_SECRET: "synthetic-csrf-secret",
      NODE_ENV: "production" as const,
      ORIGIN_VERIFY_MODE: "enforce" as const
    };
    const cookie = createAuthSessionCookie({ env, userId: "synthetic-user" });
    const guard: AuthSessionRevocationGuard = {
      async check() { return { ok: false as const, reason: "revoked" as const }; },
      async revoke() { return undefined; }
    };
    const handlers = createConversationApiHandlers({
      conversationsCollection: collection,
      env,
      messagesCollection: collection,
      parentNeedsCollection: collection,
      sessionRevocationGuard: guard,
      tutorProfilesCollection: collection
    } as never);

    const origin = "https://ungraduedu.eu.cc";
    const response = await handlers.POST_MESSAGES(
      new Request(`${origin}/api/conversations/synthetic/messages`, {
        headers: {
          cookie: cookie ?? "",
          origin,
          "x-ungrade-csrf": createCsrfProof({ method: "POST", origin, secret: env.CSRF_SECRET, subjectId: "synthetic-user" })
        },
        method: "POST",
        body: JSON.stringify({ text: "synthetic" })
      }),
      { params: Promise.resolve({ id: "synthetic-conversation" }) }
    );

    expect(response.status).toBe(401);
    expect(collection.doc).not.toHaveBeenCalled();
  });

  it("maps revocation-store exceptions to 503 before a session route can proceed", async () => {
    const env = {
      APP_ENV: "production",
      AUTH_SESSION_KEY_VERSION: "v1",
      AUTH_SESSION_SECRET: "synthetic-session-secret"
    };
    const cookie = createAuthSessionCookie({ env, userId: "synthetic-user" });
    const guard: AuthSessionRevocationGuard = {
      async check() {
        throw new Error("synthetic-revocation-store-down");
      },
      async revoke() {}
    };
    const response = await createAuthApiHandlers({ env, sessionRevocationGuard: guard }).GET_SESSION(
      new Request("https://ungraduedu.eu.cc/api/auth/session", {
        headers: { cookie: cookie ?? "" }
      })
    );
    expect(response.status).toBe(503);
  });

  it("preserves an env-provided revocation guard when a factory override is omitted", async () => {
    const check = vi.fn(async () => ({ ok: true as const }));
    const env = {
      APP_ENV: "test",
      AUTH_SESSION_KEY_VERSION: "v1",
      AUTH_SESSION_SECRET: "synthetic-session-secret",
      sessionRevocationGuard: { check, async revoke() {} }
    } satisfies Parameters<typeof createConversationApiHandlers>[0]["env"];
    const cookie = createAuthSessionCookie({ env, userId: "synthetic-user" });
    const collection = {
      doc: vi.fn(() => ({ get: vi.fn(async () => ({ data: [] })), set: vi.fn() })),
      where: vi.fn(() => ({ get: vi.fn(async () => ({ data: [] })) }))
    };
    const response = await createConversationApiHandlers({
      conversationsCollection: collection,
      env,
      messagesCollection: collection,
      parentNeedsCollection: collection,
      tutorProfilesCollection: collection
    }).GET_COLLECTION(new Request("https://ungraduedu.eu.cc/api/conversations", {
      headers: { cookie: cookie ?? "" }
    }));
    expect(response.status).toBe(200);
    expect(check).toHaveBeenCalledOnce();
  });

  it("rejects unknown password fields before touching the user collection", async () => {
    const collection = {
      doc: vi.fn(() => ({ get: vi.fn(async () => ({ data: [] })), set: vi.fn() }))
    };
    const { createEmailAuthApiHandlers } = await import("@/server/email-auth-api");
    const handlers = createEmailAuthApiHandlers({
      emailCodeCollection: collection,
      emailDelivery: { async send() { return { ok: true }; } },
      env: { APP_ENV: "test", NODE_ENV: "test" },
      userCollection: collection
    });

    const response = await handlers.POST_PASSWORD_LOGIN(new Request("https://ungraduedu.eu.cc/api/auth/password/login", {
      body: JSON.stringify({ email: "synthetic@example.test", password: "Synthetic123", unexpected: "reject" }),
      headers: { "content-type": "application/json" },
      method: "POST"
    }));

    expect(response.status).toBe(400);
    expect(collection.doc).not.toHaveBeenCalled();
  });

  it("fails closed before password lookup when a production rate limiter is unavailable", async () => {
    const collection = {
      doc: vi.fn(() => ({
        get: vi.fn(async () => ({ data: [] })),
        set: vi.fn()
      }))
    };
    const email = "synthetic@example.test";
    const origin = "https://ungraduedu.eu.cc";
    const secret = "synthetic-csrf-secret";
    const { createEmailAuthApiHandlers } = await import("@/server/email-auth-api");
    const handlers = createEmailAuthApiHandlers({
      emailCodeCollection: collection,
      emailDelivery: { async send() { return { ok: true }; } },
      env: {
        ALLOWED_ORIGINS: origin,
        APP_ENV: "production",
        AUTH_SESSION_SECRET: "synthetic-auth-secret",
        CSRF_SECRET: secret,
        NODE_ENV: "production"
      },
      userCollection: collection
    });

    const response = await handlers.POST_PASSWORD_LOGIN(new Request(`${origin}/api/auth/password/login`, {
      body: JSON.stringify({ email, password: "Synthetic123" }),
      headers: {
        origin,
        "x-ungrade-csrf": createCsrfProof({
          method: "POST",
          origin,
          secret,
          subjectId: email
        })
      },
      method: "POST"
    }));

    expect(response.status).toBe(503);
    expect(collection.doc).not.toHaveBeenCalled();
  });

  it("consumes the provider-neutral challenge seam on production password login", async () => {
    const collection = {
      doc: vi.fn(() => ({
        get: vi.fn(async () => ({ data: [] })),
        set: vi.fn()
      }))
    };
    const challengeVerifier = {
      verify: vi.fn(async () => ({ ok: false as const, reason: "invalid" as const }))
    };
    const origin = "https://ungraduedu.eu.cc";
    const secret = "synthetic-csrf-secret";
    const email = "synthetic@example.test";
    const { createEmailAuthApiHandlers } = await import("@/server/email-auth-api");
    const handlers = createEmailAuthApiHandlers({
      challengeVerifier,
      emailCodeCollection: collection,
      emailDelivery: { async send() { return { ok: true }; } },
      env: {
        ALLOWED_ORIGINS: origin,
        APP_ENV: "production",
        CSRF_SECRET: secret,
        NODE_ENV: "production"
      },
      rateLimiter: createLayeredRateLimiter({
        mode: "production",
        external: { check: () => ({ ok: true as const }) }
      }),
      requireChallenge: true,
      userCollection: collection
    });

    const response = await handlers.POST_PASSWORD_LOGIN(new Request(`${origin}/api/auth/password/login`, {
      body: JSON.stringify({ challengeToken: "synthetic-token", email, password: "Synthetic123" }),
      headers: {
        "content-type": "application/json",
        origin,
        "x-ungrade-csrf": createCsrfProof({
          method: "POST",
          origin,
          secret,
          subjectId: email
        })
      },
      method: "POST"
    }));

    expect(response.status).toBe(403);
    expect(challengeVerifier.verify).toHaveBeenCalledOnce();
    expect(collection.doc).not.toHaveBeenCalled();
  });

  it("fails closed in production when the session revocation adapter is absent", async () => {
    const env = {
      AUTH_SESSION_KEY_VERSION: "v2",
      AUTH_SESSION_SECRET: "synthetic-session-secret",
      NODE_ENV: "production"
    };
    const cookie = createAuthSessionCookie({ env, userId: "synthetic-user" });
    const handlers = createAuthApiHandlers({ env });

    const response = await handlers.GET_SESSION(
      new Request("https://ungraduedu.eu.cc/api/auth/session", {
        headers: { cookie: cookie ?? "" }
      })
    );

    expect(response.status).toBe(503);
  });

  it("rejects direct write handlers before domain mutation when Origin/CSRF is missing", async () => {
    const collection = {
      doc: vi.fn(() => ({ get: vi.fn(async () => ({ data: [] })), set: vi.fn() })),
      where: vi.fn(() => ({ get: vi.fn(async () => ({ data: [] })) }))
    };
    const handlers = createConversationApiHandlers({
      conversationsCollection: collection,
      env: {
        ALLOWED_ORIGINS: "https://ungraduedu.eu.cc",
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "",
        CSRF_SECRET: "synthetic-csrf-secret",
        M5_ENABLE_HOSTED_TEST_LOGIN: "true",
        NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true",
        NODE_ENV: "production",
        ORIGIN_VERIFY_MODE: "enforce"
      },
      messagesCollection: collection,
      parentNeedsCollection: collection,
      tutorProfilesCollection: collection
    });

    const response = await handlers.POST_MESSAGES(
      new Request("https://ungraduedu.eu.cc/api/conversations/synthetic/messages", {
        headers: { "x-ungradu-test-user-phone": "synthetic-user" },
        method: "POST",
        body: JSON.stringify({ text: "synthetic" })
      }),
      { params: Promise.resolve({ id: "synthetic-conversation" }) }
    );

    expect(response.status).toBe(503);
    expect(collection.doc).not.toHaveBeenCalled();
  });

  it("rejects same-origin writes when the server cannot resolve a trusted subject", () => {
    const request = authorizedWriteRequest("/api/write");
    expect(
      evaluateWriteRequest({
        env: {
          allowedOrigins: ["https://ungraduedu.eu.cc"],
          csrfSecret: "synthetic-csrf-secret",
          mode: "enforce"
        },
        request
      })
    ).toMatchObject({ ok: false, reason: "csrf-subject-missing" });
  });

  it("uses only trusted proxy headers and server session keys for rate limiting", () => {
    expect(
      resolveTrustedRequestKeys({
        forwardedFor: "203.0.113.10, 10.0.0.2",
        serverProxyIp: "198.51.100.10",
        sessionUserId: "synthetic-user",
        suppliedDeviceKey: "attacker-controlled"
      })
    ).toEqual({
      deviceKey: "session:synthetic-user",
      ipKey: "proxy:198.51.100.10",
      sessionKey: "synthetic-user"
    });
  });

  it("recursively redacts nested sensitive values and bounds audit metadata", () => {
    const audit = createRedactedSecurityAudit({
      correlationId: "corr-synthetic",
      event: "synthetic",
      metadata: {
        nested: { text: "secret body", safe: "ok" },
        safe: "ok",
        token: "secret-token"
      }
    });
    expect(audit.metadata).toEqual({ safe: "ok" });

    const sink = createMemoryAlertSink({ mode: "production" });
    expect(sink.available).toBe(false);
    expect(() => sink.emit(audit)).toThrow("SECURITY_ALERT_SINK_UNAVAILABLE");
    expect(sink.events).toHaveLength(0);

    const shortValues = createRedactedSecurityAudit({
      correlationId: "corr-short-values",
      event: "synthetic",
      metadata: {
        note: "synthetic@example.test",
        reason: "孩子在初一就读",
        status: "ok"
      }
    });
    expect(shortValues.metadata).toEqual({ status: "ok" });
  });

  it("returns one stable denial reason for missing contact authorization", () => {
    expect(evaluateScopedAccess({
      actorId: "owner-a",
      contactAuthorized: false,
      ownerId: "owner-a",
      sourceStatus: "published"
    })).toEqual({ ok: false, reason: "contact-not-authorized" });
  });

  it("requires an alert sink for production write rejection instead of silently using console/memory", async () => {
    const response = guardWriteRequest(new Request("https://ungraduedu.eu.cc/api/write", {
      method: "POST"
    }), {
      ALLOWED_ORIGINS: "https://ungraduedu.eu.cc",
      APP_ENV: "production",
      CSRF_SECRET: "synthetic-csrf-secret",
      ORIGIN_VERIFY_MODE: "enforce"
    });
    expect(response?.status).toBe(503);
  });

  it("keeps anonymous JSON feedback writes on an explicit anti-abuse seam", () => {
    const origin = "https://ungraduedu.eu.cc";
    const request = new Request(`${origin}/api/feedback`, {
      headers: {
        "content-type": "application/json",
        origin
      },
      method: "POST"
    });
    const response = guardWriteRequest(request, {
      ALLOWED_ORIGINS: origin,
      APP_ENV: "production",
      CSRF_SECRET: "synthetic-csrf-secret",
      ORIGIN_VERIFY_MODE: "enforce",
      anonymousAntiAbuse: { available: true, verify: () => true }
    }, undefined, { allowAnonymous: true });
    expect(response).toBeNull();

    const unavailable = guardWriteRequest(request, {
      ALLOWED_ORIGINS: origin,
      APP_ENV: "production",
      CSRF_SECRET: "synthetic-csrf-secret",
      ORIGIN_VERIFY_MODE: "enforce"
    }, undefined, { allowAnonymous: true });
    expect(unavailable?.status).toBe(503);

  });

  it("treats NODE_ENV-only production as production for anti-abuse and alert fail-closed paths", () => {
    const origin = "https://ungraduedu.eu.cc";
    const anonymousRequest = new Request(`${origin}/api/feedback`, {
      headers: {
        "content-type": "application/json",
        origin
      },
      method: "POST"
    });

    const anonymousUnavailable = guardWriteRequest(anonymousRequest, {
      ALLOWED_ORIGINS: origin,
      APP_ENV: "test",
      CSRF_SECRET: "synthetic-csrf-secret",
      NODE_ENV: "production",
      ORIGIN_VERIFY_MODE: "enforce"
    }, undefined, { allowAnonymous: true });
    expect(anonymousUnavailable?.status).toBe(503);

    const rejected = guardWriteRequest(new Request(`${origin}/api/write`, {
      method: "POST"
    }), {
      ALLOWED_ORIGINS: origin,
      APP_ENV: "test",
      CSRF_SECRET: "synthetic-csrf-secret",
      NODE_ENV: "production",
      ORIGIN_VERIFY_MODE: "enforce"
    });
    expect(rejected?.status).toBe(503);
  });

  it("rejects a production memory alert sink even when requireExternal is explicitly false", () => {
    const sink = createMemoryAlertSink({ mode: "production", requireExternal: false });
    expect(sink.available).toBe(false);
    expect(() => sink.emit(createRedactedSecurityAudit({
      correlationId: "corr-production-memory",
      event: "synthetic",
      metadata: { status: "ok" }
    }))).toThrow("SECURITY_ALERT_SINK_UNAVAILABLE");
  });

  it("consumes the password-set limiter before the user mutation", async () => {
    const email = "synthetic@example.test";
    const userCollection = {
      doc: vi.fn(() => ({
        get: vi.fn(async () => ({ data: [] })),
        set: vi.fn(async () => ({ updated: 1 })),
        update: vi.fn(async () => ({ updated: 1 }))
      }))
    };
    const emailCodeCollection = {
      doc: vi.fn(() => ({
        get: vi.fn(async () => ({ data: [] })),
        set: vi.fn(async () => ({ updated: 1 }))
      }))
    };
    const limiterCheck = vi.fn(() => ({ ok: false as const, reason: "unavailable" }));
    const { createEmailAuthApiHandlers } = await import("@/server/email-auth-api");
    const handlers = createEmailAuthApiHandlers({
      emailCodeCollection,
      emailDelivery: { async send() { return { ok: true }; } },
      env: {
        APP_ENV: "test",
        M5_ENABLE_HOSTED_TEST_LOGIN: "true",
        NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true",
        NODE_ENV: "test"
      },
      rateLimiter: {
        mode: "local",
        check: limiterCheck
      } as never,
      userCollection
    });

    const response = await handlers.POST_SET_PASSWORD(new Request("http://localhost/api/auth/password/set", {
      body: JSON.stringify({
        email,
        password: "Synthetic123",
        passwordConfirm: "Synthetic123"
      }),
      headers: {
        "content-type": "application/json",
        "x-ungradu-test-user-phone": `email_${hashEmail(email).slice(0, 24)}`
      },
      method: "POST"
    }));

    expect(response.status).toBe(503);
    expect(limiterCheck).toHaveBeenCalledOnce();
    expect(userCollection.doc).not.toHaveBeenCalled();
  });

  it("checks the limiter after a successful password challenge", async () => {
    const userCollection = {
      doc: vi.fn(() => ({
        get: vi.fn(async () => ({ data: [] })),
        set: vi.fn(async () => ({ updated: 1 })),
        update: vi.fn(async () => ({ updated: 1 }))
      }))
    };
    const emailCodeCollection = {
      doc: vi.fn(() => ({
        get: vi.fn(async () => ({ data: [] })),
        set: vi.fn(async () => ({ updated: 1 }))
      }))
    };
    const challengeVerify = vi.fn(async () => ({
      action: "password_login",
      hostname: "ungraduedu.eu.cc",
      issuedAt: new Date().toISOString(),
      ok: true as const,
      tokenId: "challenge-synthetic"
    }));
    const limiterCheck = vi.fn(() => ({ ok: false as const, reason: "unavailable" }));
    const { createEmailAuthApiHandlers } = await import("@/server/email-auth-api");
    const origin = "https://ungraduedu.eu.cc";
    const csrfSecret = "synthetic-csrf-secret";
    const email = "synthetic@example.test";
    const handlers = createEmailAuthApiHandlers({
      challengeVerifier: { verify: challengeVerify },
      emailCodeCollection,
      emailDelivery: { async send() { return { ok: true }; } },
      env: {
        ALLOWED_ORIGINS: origin,
        APP_ENV: "production",
        CSRF_SECRET: csrfSecret,
        NODE_ENV: "production"
      },
      rateLimiter: {
        mode: "production",
        check: limiterCheck
      } as never,
      requireChallenge: true,
      userCollection
    });

    const response = await handlers.POST_PASSWORD_LOGIN(new Request(`${origin}/api/auth/password/login`, {
      body: JSON.stringify({
        challengeToken: "challenge-synthetic",
        email,
        password: "Synthetic123"
      }),
      headers: {
        "content-type": "application/json",
        origin,
        "x-ungrade-csrf": createCsrfProof({
          method: "POST",
          origin,
          secret: csrfSecret,
          subjectId: email
        })
      },
      method: "POST"
    }));

    expect(response.status).toBe(503);
    expect(challengeVerify).toHaveBeenCalledOnce();
    expect(limiterCheck).toHaveBeenCalledOnce();
    expect(userCollection.doc).not.toHaveBeenCalled();
  });

  it("defaults public projections to a narrow safe summary", () => {
    const projected = projectPublicFields(
      {
        budgetMax: 100,
        childIntro: "synthetic child detail",
        community: "synthetic exact location",
        id: "parent-need-synthetic",
        region: { province: "synthetic", city: "synthetic" },
        status: "published",
        subjects: ["数学"]
      },
      PUBLIC_PARENT_NEED_FIELDS
    );

    expect(projected).toEqual({
      budgetMax: 100,
      id: "parent-need-synthetic",
      status: "published",
      subjects: ["数学"]
    });
  });

  it("keeps parent and tutor public DTOs explicit and excludes raw minor/location/proof fields", async () => {
    expect(PUBLIC_DTO_DECISION_SHA).toBe(
      "3E15EC5AC2D8BC5D8CDA3FB370F16064BAD7265D764BDE1CC153E719BA708D32"
    );

    const parentDocument = {
      budgetMax: 240,
      budgetMin: 180,
      childIntro: "synthetic child detail that must not be public",
      community: "synthetic exact community",
      createdAt: "2026-08-10T10:00:00.000Z",
      deletedAt: null,
      deletedByUserId: null,
      grade: "初一",
      id: "parent-public-synthetic",
      managementState: "managed",
      ownerUserId: "owner-synthetic",
      region: { city: "东莞市", district: "松山湖", province: "广东省" },
      status: "published",
      subjects: ["数学"],
      teacherGenderPreference: "不限",
      timeSlots: ["周六上午"],
      updatedAt: "2026-08-10T10:00:00.000Z",
      version: 5
    };
    const tutorDocument = {
      abilityDescription: "synthetic ability detail that must not be public",
      createdAt: "2026-08-10T10:00:00.000Z",
      deletedAt: null,
      deletedByUserId: null,
      feeRanges: [{ grade: "初一", max: 240, min: 180, subject: "数学" }],
      gender: "不限",
      grades: ["初一"],
      id: "tutor-public-synthetic",
      major: "synthetic major",
      managementState: "managed",
      ownerUserId: "tutor-owner-synthetic",
      proofImages: [{ name: "synthetic-proof.png", size: 12, type: "image/png" }],
      school: "synthetic school",
      status: "published",
      subjects: ["数学"],
      timeSlots: ["周六上午"],
      updatedAt: "2026-08-10T10:00:00.000Z",
      version: 5
    };
    const collectionFor = (document: Record<string, unknown>) => ({
      where() {
        const query: {
          get: () => Promise<{ data: unknown[] }>;
          limit: () => typeof query;
          orderBy: () => typeof query;
          skip: () => typeof query;
        } = {
          get: async () => ({ data: [document] }),
          limit: () => query,
          orderBy: () => query,
          skip: () => query
        };
        return query;
      }
    });

    const parentResult = await listPublicServerParentNeeds({
      collection: collectionFor(parentDocument) as never
    });
    const tutorResult = await listPublicServerTutorProfiles({
      collection: collectionFor(tutorDocument) as never
    });
    expect(parentResult.ok && parentResult.value[0]).toMatchObject({
      budgetMax: 240,
      childIntroSummary: "孩子情况暂未公开",
      publicSafetyNote: "联系方式未公开，先通过站内沟通",
      regionLabel: "东莞市 · 松山湖"
    });
    expect(tutorResult.ok && tutorResult.value[0]).toMatchObject({
      abilityDescriptionSummary: "能力说明暂未公开",
      majorSummary: "专业信息暂未公开",
      publicSafetyNote: "联系方式未公开，先通过站内沟通",
      schoolSummary: "学校信息暂未公开"
    });
    expect(parentResult.ok && parentResult.value[0]).not.toHaveProperty("childIntro");
    expect(parentResult.ok && parentResult.value[0]).not.toHaveProperty("community");
    expect(parentResult.ok && parentResult.value[0]).not.toHaveProperty("region");
    expect(tutorResult.ok && tutorResult.value[0]).not.toHaveProperty("abilityDescription");
    expect(tutorResult.ok && tutorResult.value[0]).not.toHaveProperty("proofImages");
    expect(tutorResult.ok && tutorResult.value[0]).not.toHaveProperty("school");
    expect(tutorResult.ok && tutorResult.value[0]).not.toHaveProperty("major");
  });

  it("authorizes a participant only when source status/version and request state agree", () => {
    expect(
      evaluateScopedAccess({
        actorId: "participant-a",
        ownerId: "owner-a",
        participantIds: ["owner-a", "participant-a"],
        requestState: "approved",
        sourceStatus: "published",
        sourceVersion: 4,
        conversationSourceVersion: 4,
        contactAuthorized: true
      })
    ).toMatchObject({ ok: true, contactVisible: true });

    expect(
      evaluateScopedAccess({
        actorId: "participant-a",
        ownerId: "owner-a",
        participantIds: ["owner-a", "participant-a"],
        requestState: "approved",
        sourceStatus: "deleted",
        sourceVersion: 4,
        conversationSourceVersion: 4,
        contactAuthorized: true
      })
    ).toMatchObject({ ok: false, reason: "source-unavailable" });

    expect(
      evaluateScopedAccess({
        actorId: "participant-a",
        ownerId: "owner-a",
        participantIds: ["owner-a", "participant-a"],
        requestState: "approved",
        sourceStatus: "published",
        sourceVersion: 5,
        conversationSourceVersion: 4,
        contactAuthorized: true
      })
    ).toMatchObject({ ok: false, reason: "source-version-mismatch" });
  });

  it("consumes email code and user mutation in one actual transaction seam", async () => {
    const codeDocuments = new Map<string, Record<string, unknown>>();
    const userDocuments = new Map<string, Record<string, unknown>>();
    let userWrites = 0;
    const collectionFor = (documents: Map<string, Record<string, unknown>>): EmailAuthCollection => ({
      doc(id) {
        return {
          async get() {
            const value = documents.get(id);
            return { data: value ? [{ ...value }] : [] };
          },
          async set(value) {
            documents.set(id, { ...value });
            if (documents === userDocuments) userWrites += 1;
          }
        };
      }
    });
    const codeCollection = collectionFor(codeDocuments);
    const userCollection = collectionFor(userDocuments);
    const transactionCollections = {
      ["email_login_codes"]: codeCollection,
      ["email_login_users"]: userCollection
    } as const;
    let queue = Promise.resolve();
    const runTransaction: EmailAuthAtomicTransactionRunner = async (operation) => {
      const previous = queue;
      let release!: () => void;
      queue = new Promise<void>((resolve) => { release = resolve; });
      await previous;
      try {
        return await operation({ collection(name) { return transactionCollections[name as keyof typeof transactionCollections]; } });
      } finally {
        release();
      }
    };
    const { createEmailAuthApiHandlers } = await import("@/server/email-auth-api");
    const handlers = createEmailAuthApiHandlers({
      codeGenerator: () => "123456",
      emailCodeCollection: codeCollection,
      emailDelivery: { async send() { return { ok: true }; } },
      env: {
        APP_ENV: "production",
        ALLOWED_ORIGINS: "https://ungraduedu.eu.cc",
        AUTH_SESSION_SECRET: "synthetic-auth-secret",
        CSRF_SECRET: "synthetic-csrf-secret",
        EMAIL_CODE_SECRET: "synthetic-code-secret",
        NODE_ENV: "production"
      },
      now: () => new Date("2026-08-10T12:00:00.000Z"),
      requireAtomicCodeConsume: true,
      runTransaction,
      userCollection
    });
    const send = await handlers.POST_SEND_CODE(new Request("https://ungraduedu.eu.cc/api/auth/email/send-code", {
      body: JSON.stringify({ email: "synthetic@example.test" }),
      headers: {
        origin: "https://ungraduedu.eu.cc",
        "x-ungrade-csrf": createCsrfProof({
          method: "POST",
          origin: "https://ungraduedu.eu.cc",
          secret: "synthetic-csrf-secret",
          subjectId: "synthetic@example.test"
        })
      },
      method: "POST"
    }));
    expect(send.status).toBe(503);

    const localHandlers = createEmailAuthApiHandlers({
      codeGenerator: () => "123456",
      emailCodeCollection: codeCollection,
      emailDelivery: { async send() { return { ok: true }; } },
      env: {
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "synthetic-auth-secret",
        EMAIL_CODE_SECRET: "synthetic-code-secret",
        NODE_ENV: "test"
      },
      now: () => new Date("2026-08-10T12:00:00.000Z"),
      requireAtomicCodeConsume: true,
      runTransaction,
      userCollection
    });
    expect((await localHandlers.POST_SEND_CODE(new Request("https://ungraduedu.eu.cc/api/auth/email/send-code", {
      body: JSON.stringify({ email: "synthetic@example.test" }), method: "POST"
    }))).status).toBe(200);
    const request = () => new Request("https://ungraduedu.eu.cc/api/auth/email/login", {
      body: JSON.stringify({ code: "123456", email: "synthetic@example.test" }), method: "POST"
    });
    const [first, second] = await Promise.all([localHandlers.POST_LOGIN(request()), localHandlers.POST_LOGIN(request())]);
    expect([first.status, second.status].filter((status) => status === 200)).toHaveLength(1);
    expect(userWrites).toBe(1);
  });
});
