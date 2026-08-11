import { afterEach, describe, expect, it, vi } from "vitest";
import { scryptSync } from "node:crypto";

const state = vi.hoisted(() => ({
  documents: new Map<string, Record<string, unknown>>(),
  revokedAt: undefined as string | undefined,
  sets: [] as Array<{ collection: string; id: string }>,
  gets: [] as Array<{ collection: string; id: string }>
}));

const database = vi.hoisted(() => ({
  collection(name: string) {
    return {
      doc(id: string) {
        return {
          async get() {
            state.gets.push({ collection: name, id });
            if (name === "auth_session_revocations" && state.revokedAt) {
              return { data: [{ id, userId: id, revokedAt: state.revokedAt }] };
            }
            const document = state.documents.get(`${name}:${id}`);
            return { data: document ? [{ ...document, id }] : [] };
          },
          async set(data: Record<string, unknown>) {
            state.sets.push({ collection: name, id });
            state.documents.set(`${name}:${id}`, { ...data });
            return { updated: 1 };
          }
        };
      },
      where(query: Record<string, unknown>) {
        return {
          orderBy() {
            return this;
          },
          async get() {
            const data = Array.from(state.documents.entries())
              .filter(([key]) => key.startsWith(`${name}:`))
              .filter(([, document]) => Object.entries(query).every(([field, value]) => document[field] === value))
              .map(([key, document]) => ({
                ...document,
                id: key.slice(name.length + 1)
              }));
            return { data };
          }
        };
      }
    };
  },
  async runTransaction<T>(operation: (transaction: {
    collection: typeof database.collection;
  }) => Promise<T>) {
    return operation({ collection: database.collection.bind(database) });
  }
}));

vi.mock("@/server/cloudbase-server", () => ({
  createCloudBaseServerApp: () => ({ database: () => database })
}));

import { createAuthSessionCookie } from "@/server/auth-session";
import { createCsrfProof } from "@/server/security/request-guard";

const originalEnv = { ...process.env };

afterEach(() => {
  state.revokedAt = undefined;
  state.documents.clear();
  state.sets.length = 0;
  state.gets.length = 0;
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
});

describe("ISSUE-0034 actual Next route exports", () => {
  it("keeps feedback POST anonymous while GET is non-enumerable and authenticated", async () => {
    process.env.APP_ENV = "test";
    const { GET, POST } = await import("@/app/api/feedback/route");
    const payload = {
      category: "safety",
      targetType: "page",
      targetReference: "synthetic-route",
      description: "synthetic feedback",
      evidenceNote: "synthetic evidence",
      contactMethod: "",
      sourcePage: "/feedback"
    };

    const post = await POST(new Request("https://ungraduedu.eu.cc/api/feedback", {
      body: JSON.stringify(payload),
      headers: { "content-type": "application/json" },
      method: "POST"
    }));
    expect(post.status).toBe(200);
    expect(state.sets.some((entry) => entry.collection === "risk_feedback_records")).toBe(true);

    const anonymousGet = await GET(new Request("https://ungraduedu.eu.cc/api/feedback"));
    expect(anonymousGet.status).toBe(401);
  });

  it("maps an authenticated revoked feedback GET to 401 without enumerating records", async () => {
    process.env.APP_ENV = "test";
    process.env.AUTH_SESSION_SECRET = "synthetic-route-session-secret";
    process.env.AUTH_SESSION_KEY_VERSION = "v1";
    state.revokedAt = "2026-08-10T00:00:00.000Z";
    const cookie = createAuthSessionCookie({
      createdAt: "2026-08-09T00:00:00.000Z",
      env: process.env,
      userId: "synthetic-owner"
    });
    const { GET } = await import("@/app/api/feedback/route");
    const response = await GET(new Request("https://ungraduedu.eu.cc/api/feedback", {
      headers: { cookie: cookie ?? "" }
    }));
    expect(response.status).toBe(401);
    expect(state.gets.some((entry) => entry.collection === "risk_feedback_records")).toBe(false);
  });

  it("routes password login through the production limiter seam and fails closed when unavailable", async () => {
    process.env.APP_ENV = "production";
    process.env.AUTH_SESSION_SECRET = "synthetic-route-session-secret";
    const origin = "https://ungraduedu.eu.cc";
    const secret = "synthetic-csrf-secret";
    process.env.ALLOWED_ORIGINS = origin;
    process.env.CSRF_SECRET = secret;
    const { POST } = await import("@/app/api/auth/password/login/route");
    const response = await POST(new Request(`${origin}/api/auth/password/login`, {
      body: JSON.stringify({ challengeToken: "synthetic-token", email: "synthetic@example.test", password: "not-a-real-password" }),
      headers: {
        "content-type": "application/json",
        origin,
        "x-ungrade-csrf": createCsrfProof({
          method: "POST",
          origin,
          secret,
          subjectId: "synthetic@example.test"
        })
      },
      method: "POST"
    }));
    expect(response.status).toBe(503);
    expect(state.gets.some((entry) => entry.collection === "email_login_users")).toBe(false);
  });

  it("completes the production password-login protection chain before issuing a session cookie", async () => {
    vi.resetModules();
    process.env.APP_ENV = "production";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.AUTH_CHALLENGE_REPLAY_COLLECTION = "auth_challenge_replays";
    process.env.AUTH_CHALLENGE_REPLAY_KEY_SECRET = "synthetic-route-replay-hmac-secret";
    process.env.AUTH_SESSION_SECRET = "synthetic-route-session-secret";
    process.env.AUTH_RATE_LIMIT_COLLECTION = "auth_rate_limits";
    process.env.AUTH_RATE_LIMIT_KEY_SECRET = "synthetic-route-rate-limit-hmac-secret";
    process.env.TURNSTILE_EXPECTED_HOSTNAMES = "ungraduedu.eu.cc";
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
    const origin = "https://ungraduedu.eu.cc";
    process.env.ALLOWED_ORIGINS = origin;
    process.env.CSRF_SECRET = "synthetic-csrf-secret";
    const email = "synthetic@example.test";
    const password = "Synthetic123";
    const { hashEmail } = await import("@/server/email-auth");
    const emailHash = hashEmail(email);
    const salt = "0123456789abcdef0123456789abcdef";
    const passwordHash = `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
    state.documents.set(`email_login_users:${emailHash}`, {
      createdAt: "2026-08-10T11:00:00.000Z",
      emailHash,
      emailMasked: "s***@example.test",
      lastLoginAt: "2026-08-10T11:00:00.000Z",
      passwordHash,
      status: "active",
      userId: `email_${emailHash.slice(0, 24)}`
    });
    const siteverify = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({
        action: "password_login",
        challenge_ts: new Date(Date.now() - 60_000).toISOString(),
        hostname: "ungraduedu.eu.cc",
        success: true
      })
    );

    const { POST } = await import("@/app/api/auth/password/login/route");
    const request = () => new Request(`${origin}/api/auth/password/login`, {
      body: JSON.stringify({
        challengeToken: "XXXX.DUMMY.TOKEN.XXXX",
        email,
        password
      }),
      headers: {
        "content-type": "application/json",
        origin
      },
      method: "POST"
    });
    const response = await POST(request());
    const responseBody = await response.clone().json();

    expect(responseBody).toMatchObject({ ok: true });
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("ungradu_auth_session=");
    expect(siteverify).toHaveBeenCalledOnce();
    const rateLimitReadIndex = state.gets.findIndex(
      (entry) => entry.collection === "auth_rate_limits"
    );
    const accountReadIndex = state.gets.findIndex(
      (entry) => entry.collection === "email_login_users"
    );
    expect(rateLimitReadIndex).toBeGreaterThanOrEqual(0);
    expect(accountReadIndex).toBeGreaterThan(rateLimitReadIndex);

    const replay = await POST(request());
    const replayBody = await replay.clone().json();
    expect(replayBody).toMatchObject({
      errors: { request: "人机验证未通过，请稍后重试" },
      ok: false
    });
    expect(replay.status).toBe(403);
    expect(
      state.gets.filter((entry) => entry.collection === "email_login_users")
    ).toHaveLength(1);
    const replayWrites = state.sets.filter(
      (entry) => entry.collection === "auth_challenge_replays"
    );
    expect(replayWrites).toHaveLength(1);
    expect(replayWrites[0]?.id).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(replayWrites[0]?.id).not.toContain("XXXX.DUMMY.TOKEN.XXXX");
    const replayDocument = state.documents.get(
      `auth_challenge_replays:${replayWrites[0]?.id}`
    );
    expect(replayDocument?.expiresAt).toBeInstanceOf(Date);
    expect(JSON.stringify(replayDocument)).not.toContain("XXXX.DUMMY.TOKEN.XXXX");
    siteverify.mockRestore();
  });

  it("exposes the real conversation item route with anonymous access denied before enumeration", async () => {
    process.env.APP_ENV = "test";
    const { GET } = await import("@/app/api/conversations/[id]/route");
    const response = await GET(
      new Request("https://ungraduedu.eu.cc/api/conversations/synthetic-conversation"),
      { params: Promise.resolve({ id: "synthetic-conversation" }) }
    );
    expect(response.status).toBe(401);
    expect(state.gets.some((entry) => entry.collection === "conversations")).toBe(false);
  });

  it("routes every production write seam through the shared fail-closed alert runtime", async () => {
    vi.resetModules();
    process.env.APP_ENV = "test";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.M5_ENABLE_HOSTED_TEST_LOGIN = "true";
    process.env.NEXT_PUBLIC_ALLOW_TEST_LOGIN = "true";
    process.env.ALLOWED_ORIGINS = "https://ungraduedu.eu.cc";
    process.env.CSRF_SECRET = "synthetic-route-csrf";

    const postBody = JSON.stringify({});
    const request = (path: string, method = "POST") => new Request(`https://ungraduedu.eu.cc${path}`, {
      body: postBody,
      headers: {
        "content-type": "application/json",
        "x-ungradu-test-user-phone": "synthetic-owner"
      },
      method
    });

    const parent = await import("@/app/api/parent-needs/route");
    const tutor = await import("@/app/api/tutor-profiles/route");
    const conversations = await import("@/app/api/conversations/route");
    const contactExchange = await import("@/app/api/contact-exchange/route");
    const contactProfile = await import("@/app/api/contact-profile/route");
    const feedback = await import("@/app/api/feedback/route");

    const responses = await Promise.all([
      parent.POST(request("/api/parent-needs")),
      tutor.POST(request("/api/tutor-profiles")),
      conversations.POST(request("/api/conversations")),
      contactExchange.POST(request("/api/contact-exchange")),
      contactProfile.PUT(request("/api/contact-profile", "PUT")),
      feedback.POST(request("/api/feedback"))
    ]);

    expect(responses.map((response) => response.status)).toEqual([503, 503, 503, 503, 503, 503]);
    expect(state.sets).toHaveLength(0);
  });

  it("keeps every actual auth write export fail closed without an external alert sink", async () => {
    vi.resetModules();
    process.env.APP_ENV = "test";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.M5_ENABLE_HOSTED_TEST_LOGIN = "true";
    process.env.NEXT_PUBLIC_ALLOW_TEST_LOGIN = "true";
    process.env.ALLOWED_ORIGINS = "https://ungraduedu.eu.cc";
    process.env.CSRF_SECRET = "synthetic-route-csrf";

    const authHeaders = {
      "content-type": "application/json",
      "x-ungradu-test-user-phone": "synthetic-auth-user"
    };
    const request = (path: string, body: Record<string, unknown> = {}, method = "POST") =>
      new Request(`https://ungraduedu.eu.cc${path}`, {
        body: JSON.stringify(body),
        headers: authHeaders,
        method
      });

    const emailSend = await import("@/app/api/auth/email/send-code/route");
    const emailLogin = await import("@/app/api/auth/email/login/route");
    const passwordLogin = await import("@/app/api/auth/password/login/route");
    const passwordReset = await import("@/app/api/auth/password/reset/route");
    const passwordSet = await import("@/app/api/auth/password/set/route");
    const logout = await import("@/app/api/auth/logout/route");

    const responses = await Promise.all([
      emailSend.POST(request("/api/auth/email/send-code", { email: "synthetic@example.test" })),
      emailLogin.POST(request("/api/auth/email/login", { code: "000000", email: "synthetic@example.test" })),
      passwordLogin.POST(request("/api/auth/password/login", { email: "synthetic@example.test", password: "Synthetic123" })),
      passwordReset.POST(request("/api/auth/password/reset", { code: "000000", email: "synthetic@example.test", password: "Synthetic123" })),
      passwordSet.POST(request("/api/auth/password/set", { email: "synthetic@example.test", password: "Synthetic123", passwordConfirm: "Synthetic123" })),
      logout.POST(request("/api/auth/logout", {}, "POST"))
    ]);

    expect(responses.map((response) => response.status)).toEqual([503, 503, 503, 503, 503, 503]);
    expect(state.sets).toHaveLength(0);
  });

  it("keeps parent and tutor owner reads separated from non-owner reads at the real route exports", async () => {
    vi.resetModules();
    process.env.APP_ENV = "test";
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    process.env.M5_ENABLE_HOSTED_TEST_LOGIN = "true";
    process.env.NEXT_PUBLIC_ALLOW_TEST_LOGIN = "true";
    state.documents.set("parent_needs:parent-route-synthetic", {
      budgetMax: 120,
      budgetMin: 80,
      childIntro: "synthetic child detail",
      community: "synthetic community",
      createdAt: "2026-08-10T00:00:00.000Z",
      grade: "初一",
      managementState: "managed",
      ownerUserId: "parent-owner",
      region: { city: "东莞市", district: "松山湖", province: "广东省" },
      status: "published",
      subjects: ["数学"],
      teacherGenderPreference: "不限",
      timeSlots: ["周六下午"],
      updatedAt: "2026-08-10T00:00:00.000Z",
      version: 1
    });
    state.documents.set("tutor_profiles:tutor-route-synthetic", {
      abilityDescription: "synthetic ability",
      createdAt: "2026-08-10T00:00:00.000Z",
      feeRanges: [{ grade: "初一", max: 120, min: 80, subject: "数学" }],
      gender: "女",
      grades: ["初一"],
      managementState: "managed",
      major: "数学",
      ownerUserId: "tutor-owner",
      proofImages: [],
      school: "合成大学",
      status: "published",
      subjects: ["数学"],
      timeSlots: ["周六下午"],
      updatedAt: "2026-08-10T00:00:00.000Z",
      version: 1
    });

    const parentRoute = await import("@/app/api/parent-needs/[id]/route");
    const tutorRoute = await import("@/app/api/tutor-profiles/[id]/route");
    const ownerHeaders = { "x-ungradu-test-user-phone": "parent-owner" };
    const foreignHeaders = { "x-ungradu-test-user-phone": "foreign-owner" };
    const tutorOwnerHeaders = { "x-ungradu-test-user-phone": "tutor-owner" };

    const parentOwner = await parentRoute.GET(
      new Request("https://ungraduedu.eu.cc/api/parent-needs/parent-route-synthetic?scope=mine", { headers: ownerHeaders }),
      { params: Promise.resolve({ id: "parent-route-synthetic" }) }
    );
    const parentForeign = await parentRoute.GET(
      new Request("https://ungraduedu.eu.cc/api/parent-needs/parent-route-synthetic?scope=mine", { headers: foreignHeaders }),
      { params: Promise.resolve({ id: "parent-route-synthetic" }) }
    );
    const tutorOwner = await tutorRoute.GET(
      new Request("https://ungraduedu.eu.cc/api/tutor-profiles/tutor-route-synthetic?scope=mine", { headers: tutorOwnerHeaders }),
      { params: Promise.resolve({ id: "tutor-route-synthetic" }) }
    );
    const tutorForeign = await tutorRoute.GET(
      new Request("https://ungraduedu.eu.cc/api/tutor-profiles/tutor-route-synthetic?scope=mine", { headers: foreignHeaders }),
      { params: Promise.resolve({ id: "tutor-route-synthetic" }) }
    );

    expect(parentOwner.status).toBe(200);
    expect(parentForeign.status).toBe(404);
    expect(tutorOwner.status).toBe(200);
    expect(tutorForeign.status).toBe(404);
  });

  it("covers participant, nonparticipant, revoked, deleted, legacy, version-mismatch and contact IDOR at real exports", async () => {
    vi.resetModules();
    process.env.APP_ENV = "test";
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    process.env.M5_ENABLE_HOSTED_TEST_LOGIN = "true";
    process.env.NEXT_PUBLIC_ALLOW_TEST_LOGIN = "true";
    process.env.AUTH_SESSION_SECRET = "synthetic-route-session-secret";
    process.env.AUTH_SESSION_KEY_VERSION = "v1";

    state.documents.set("parent_needs:route-source", {
      ownerUserId: "parent-owner",
      status: "published",
      version: 2
    });
    state.documents.set("conversations:route-conversation", {
      createdAt: "2026-08-10T00:00:00.000Z",
      participantKeys: ["parent-owner", "tutor-participant"],
      participantUserIds: ["parent-owner", "tutor-participant"],
      sourceId: "route-source",
      sourceType: "parent-need",
      sourceVersion: 2
    });
    state.documents.set("messages:route-message", {
      conversationId: "route-conversation",
      createdAt: "2026-08-10T00:01:00.000Z",
      senderUserId: "tutor-participant",
      text: "synthetic message"
    });
    state.documents.set("contact_exchange_requests:route-request", {
      conversationId: "route-conversation",
      createdAt: "2026-08-10T00:01:00.000Z",
      receiverUserId: "parent-owner",
      requesterUserId: "tutor-participant",
      secondConfirmedAt: null,
      status: "pending",
      updatedAt: "2026-08-10T00:01:00.000Z"
    });
    state.documents.set("contact_profiles:parent-owner", {
      ownerUserId: "parent-owner",
      phone: "13800000000",
      wechat: "synthetic-wechat",
      updatedAt: "2026-08-10T00:00:00.000Z"
    });

    const conversationRoute = await import("@/app/api/conversations/[id]/route");
    const messagesRoute = await import("@/app/api/conversations/[id]/messages/route");
    const contactExchangeRoute = await import("@/app/api/contact-exchange/route");
    const contactProfileRoute = await import("@/app/api/contact-profile/route");
    const participantHeaders = { "x-ungradu-test-user-phone": "tutor-participant" };
    const strangerHeaders = { "x-ungradu-test-user-phone": "stranger" };
    const context = { params: Promise.resolve({ id: "route-conversation" }) };

    const participant = await conversationRoute.GET(
      new Request("https://ungraduedu.eu.cc/api/conversations/route-conversation", { headers: participantHeaders }),
      context
    );
    const nonparticipant = await conversationRoute.GET(
      new Request("https://ungraduedu.eu.cc/api/conversations/route-conversation", { headers: strangerHeaders }),
      context
    );
    const messages = await messagesRoute.GET(
      new Request("https://ungraduedu.eu.cc/api/conversations/route-conversation/messages", { headers: participantHeaders }),
      context
    );
    const exchangeParticipant = await contactExchangeRoute.GET(
      new Request("https://ungraduedu.eu.cc/api/contact-exchange?conversationId=route-conversation", { headers: participantHeaders })
    );
    const exchangeStranger = await contactExchangeRoute.GET(
      new Request("https://ungraduedu.eu.cc/api/contact-exchange?conversationId=route-conversation", { headers: strangerHeaders })
    );
    const contactOwner = await contactProfileRoute.GET(
      new Request("https://ungraduedu.eu.cc/api/contact-profile", { headers: { "x-ungradu-test-user-phone": "parent-owner" } })
    );
    const contactOther = await contactProfileRoute.GET(
      new Request("https://ungraduedu.eu.cc/api/contact-profile", { headers: strangerHeaders })
    );

    expect(participant.status).toBe(200);
    await expect(participant.json()).resolves.toMatchObject({ value: { readOnly: false, sourceStatus: "published" } });
    expect(nonparticipant.status).toBe(200);
    await expect(nonparticipant.json()).resolves.toMatchObject({ value: null });
    expect(messages.status).toBe(200);
    await expect(messages.json()).resolves.toMatchObject({ value: [expect.objectContaining({ id: "route-message" })] });
    expect(exchangeParticipant.status).toBe(200);
    await expect(exchangeParticipant.json()).resolves.toMatchObject({ value: [expect.objectContaining({ id: "route-request" })] });
    expect(exchangeStranger.status).toBe(200);
    await expect(exchangeStranger.json()).resolves.toMatchObject({ value: [] });
    expect(contactOwner.status).toBe(200);
    await expect(contactOther.status).toBe(200);
    await expect(contactOwner.json()).resolves.toMatchObject({ value: { phone: "13800000000" } });
    await expect(contactOther.json()).resolves.toMatchObject({ value: { phone: "" } });

    state.documents.set("parent_needs:route-source", {
      managementState: "legacy-readonly",
      ownerUserId: "parent-owner",
      status: "published",
      version: 2
    });
    const legacy = await conversationRoute.GET(
      new Request("https://ungraduedu.eu.cc/api/conversations/route-conversation", { headers: participantHeaders }),
      context
    );
    await expect(legacy.json()).resolves.toMatchObject({ value: { readOnly: true, sourceStatus: "deleted" } });
    const legacyMessagePost = await messagesRoute.POST(
      new Request("https://ungraduedu.eu.cc/api/conversations/route-conversation/messages", {
        body: JSON.stringify({ text: "synthetic legacy blocked" }),
        headers: { ...participantHeaders, "content-type": "application/json" },
        method: "POST"
      }),
      context
    );
    const legacyContactPost = await contactExchangeRoute.POST(new Request(
      "https://ungraduedu.eu.cc/api/contact-exchange",
      {
        body: JSON.stringify({ action: "create", conversationId: "route-conversation" }),
        headers: { ...participantHeaders, "content-type": "application/json" },
        method: "POST"
      }
    ));
    expect(legacyMessagePost.status).toBe(403);
    expect(legacyContactPost.status).toBe(403);
    expect(state.sets).toHaveLength(0);

    state.documents.set("parent_needs:route-source", {
      ownerUserId: "parent-owner",
      status: "published",
      version: 3
    });
    const staleVersion = await conversationRoute.GET(
      new Request("https://ungraduedu.eu.cc/api/conversations/route-conversation", { headers: participantHeaders }),
      context
    );
    await expect(staleVersion.json()).resolves.toMatchObject({ value: { readOnly: true, sourceStatus: "deleted" } });

    state.revokedAt = "2026-08-09T00:00:00.000Z";
    const revokedCookie = createAuthSessionCookie({
      createdAt: "2026-08-08T00:00:00.000Z",
      env: process.env,
      userId: "tutor-participant"
    });
    const revoked = await conversationRoute.GET(
      new Request("https://ungraduedu.eu.cc/api/conversations/route-conversation", {
        headers: { cookie: revokedCookie ?? "" }
      }),
      context
    );
    expect(revoked.status).toBe(401);
  });
});
