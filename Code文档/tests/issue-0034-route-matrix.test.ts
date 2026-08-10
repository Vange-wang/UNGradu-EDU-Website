import { afterEach, describe, expect, it, vi } from "vitest";

type Document = Record<string, unknown>;

const state = vi.hoisted(() => ({
  documents: new Map<string, Document>(),
  gets: [] as Array<{ collection: string; id: string }>,
  sets: [] as Array<{ collection: string; id: string }>,
  revokedAt: undefined as string | undefined
}));

const database = vi.hoisted(() => {
  const makeCollection = (name: string) => ({
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
        async set(data: Document) {
          state.sets.push({ collection: name, id });
          state.documents.set(`${name}:${id}`, { ...data });
          return { updated: 1 };
        }
      };
    },
    where(query: Record<string, unknown>) {
      const queryApi = {
        orderBy() {
          return queryApi;
        },
        skip() {
          return queryApi;
        },
        limit() {
          return queryApi;
        },
        async get() {
          const data = Array.from(state.documents.entries())
            .filter(([key]) => key.startsWith(`${name}:`))
            .filter(([, document]) =>
              Object.entries(query).every(([field, value]) => document[field] === value)
            )
            .map(([key, document]) => ({
              ...document,
              id: key.slice(name.length + 1)
            }));
          return { data };
        }
      };
      return queryApi;
    }
  });

  return {
    collection(name: string) {
      return makeCollection(name);
    },
    runTransaction: undefined as
      | ((operation: (transaction: { collection: (name: string) => ReturnType<typeof makeCollection> }) => Promise<unknown>) => Promise<unknown>)
      | undefined
  };
});

vi.mock("@/server/cloudbase-server", () => ({
  createCloudBaseServerApp: () => ({ database: () => database })
}));

import { createAuthSessionCookie } from "@/server/auth-session";

const originalEnv = { ...process.env };

afterEach(() => {
  state.documents.clear();
  state.gets.length = 0;
  state.sets.length = 0;
  state.revokedAt = undefined;
  database.runTransaction = undefined;
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
  vi.resetModules();
});

function headers(userId: string) {
  return {
    "content-type": "application/json",
    "x-ungradu-test-user-phone": userId
  };
}

function request(path: string, userId: string, body?: Document, method = "POST") {
  return new Request(`https://ungraduedu.eu.cc${path}`, {
    body: body ? JSON.stringify(body) : undefined,
    headers: headers(userId),
    method
  });
}

async function json(response: Response) {
  return (await response.json()) as {
    ok?: boolean;
    value?: unknown;
    code?: string;
    errors?: { request?: string };
  };
}

function transactionRunner() {
  database.runTransaction = async (operation) =>
    operation({ collection: (name: string) => database.collection(name) });
}

function seedSourceFixture({
  sourceId,
  sourceType
}: {
  sourceId: string;
  sourceType: "parent-need" | "tutor-profile";
}) {
  const ownerUserId = sourceType === "parent-need" ? "parent-owner" : "tutor-owner";
  const participantUserId = sourceType === "parent-need" ? "tutor-participant" : "parent-participant";
  const conversationId = `${sourceType}-conversation`;
  const requestId = `${sourceType}-request`;

  const sourceDocument: Document = sourceType === "parent-need"
    ? {
        budgetMax: 120,
        budgetMin: 80,
        childIntro: `synthetic-${sourceType}-intro`,
        community: "synthetic-community",
        createdAt: "2026-08-10T00:00:00.000Z",
        grade: "初一",
        managementState: "managed",
        ownerUserId,
        region: { city: "合成市", district: "合成区", province: "合成省" },
        status: "published",
        subjects: ["数学"],
        teacherGenderPreference: "不限",
        timeSlots: ["周六上午"],
        updatedAt: "2026-08-10T00:00:00.000Z",
        version: 2
      }
    : {
        abilityDescription: `synthetic-${sourceType}-ability`,
        createdAt: "2026-08-10T00:00:00.000Z",
        feeRanges: [{ grade: "初一", max: 120, min: 80, subject: "数学" }],
        gender: "不限",
        grades: ["初一"],
        managementState: "managed",
        major: "数学",
        ownerUserId,
        proofImages: [],
        school: "合成学校",
        status: "published",
        subjects: ["数学"],
        timeSlots: ["周六上午"],
        updatedAt: "2026-08-10T00:00:00.000Z",
        version: 2
      };
  state.documents.set(`${sourceType === "parent-need" ? "parent_needs" : "tutor_profiles"}:${sourceId}`, sourceDocument);
  state.documents.set(`conversations:${conversationId}`, {
    createdAt: "2026-08-10T00:00:00.000Z",
    participantKeys: [ownerUserId, participantUserId],
    participantUserIds: [ownerUserId, participantUserId],
    sourceId,
    sourceType,
    sourceVersion: 2
  });
  state.documents.set(`messages:${sourceType}-history`, {
    conversationId,
    createdAt: "2026-08-10T00:01:00.000Z",
    senderUserId: participantUserId,
    text: `synthetic-${sourceType}-history`
  });
  state.documents.set(`contact_exchange_requests:${requestId}`, {
    conversationId,
    createdAt: "2026-08-10T00:01:00.000Z",
    receiverUserId: ownerUserId,
    requesterUserId: participantUserId,
    secondConfirmedAt: null,
    status: "pending",
    updatedAt: "2026-08-10T00:01:00.000Z"
  });
  for (const userId of [ownerUserId, participantUserId]) {
    state.documents.set(`contact_profiles:${userId}`, {
      ownerUserId: userId,
      phone: userId === ownerUserId
        ? "13800000001"
        : "13800000002",
      updatedAt: "2026-08-10T00:00:00.000Z",
      wechat: userId === ownerUserId
        ? `${sourceType}-owner-wechat`
        : `${sourceType}-participant-wechat`
    });
  }

  return { conversationId, ownerUserId, participantUserId, requestId };
}

describe("ISSUE-0034 real route source-type and deletion matrix", () => {
  it("covers parent-need and tutor-profile live bidirectional writes, stranger denial, and deleted fail-closed gates", async () => {
    process.env.APP_ENV = "test";
    Object.assign(process.env, { NODE_ENV: "test" });
    process.env.M5_ENABLE_HOSTED_TEST_LOGIN = "true";
    process.env.NEXT_PUBLIC_ALLOW_TEST_LOGIN = "true";
    process.env.AUTH_SESSION_SECRET = "synthetic-route-matrix-secret";
    process.env.AUTH_SESSION_KEY_VERSION = "v1";
    transactionRunner();

    const conversationsRoute = await import("@/app/api/conversations/[id]/route");
    const messagesRoute = await import("@/app/api/conversations/[id]/messages/route");
    const contactExchangeRoute = await import("@/app/api/contact-exchange/route");
    const contactProfileRoute = await import("@/app/api/contact-profile/route");
    const parentRoute = await import("@/app/api/parent-needs/[id]/route");
    const tutorRoute = await import("@/app/api/tutor-profiles/[id]/route");

    for (const sourceType of ["parent-need", "tutor-profile"] as const) {
      const sourceId = `${sourceType}-source`;
      const fixture = seedSourceFixture({ sourceId, sourceType });
      const context = { params: Promise.resolve({ id: fixture.conversationId }) };
      const participantPath = `/api/conversations/${fixture.conversationId}/messages`;
      const exchangePath = "/api/contact-exchange";

      const sourcePath = sourceType === "parent-need"
        ? `/api/parent-needs/${sourceId}`
        : `/api/tutor-profiles/${sourceId}`;
      const sourceBody = sourceType === "parent-need"
        ? {
            budgetMax: "125",
            budgetMin: "85",
            childIntro: `synthetic-${sourceType}-edited`,
            community: "synthetic-community",
            grade: "初一",
            region: { city: "合成市", district: "合成区", province: "合成省" },
            subjects: ["数学"],
            teacherGenderPreference: "不限",
            timeSlots: ["周六上午"]
          }
        : {
            abilityDescription: `synthetic-${sourceType}-edited`,
            feeRanges: [{ grade: "初一", max: "125", min: "85", subject: "数学" }],
            gender: "不限",
            grades: ["初一"],
            major: "数学",
            proofImages: [],
            school: "合成学校",
            subjects: ["数学"],
            timeSlots: ["周六上午"]
          };
      const sourceRoute = sourceType === "parent-need" ? parentRoute : tutorRoute;
      const ownerEdit = await sourceRoute.PATCH(
        request(sourcePath, fixture.ownerUserId, { ...sourceBody, version: 2 }),
        { params: Promise.resolve({ id: sourceId }) }
      );
      expect(ownerEdit.status).toBe(200);
      const writesAfterOwnerEdit = state.sets.length;
      const foreignEdit = await sourceRoute.PATCH(
        request(sourcePath, "stranger", { ...sourceBody, version: 3 }),
        { params: Promise.resolve({ id: sourceId }) }
      );
      expect(foreignEdit.status).toBe(404);
      await expect(foreignEdit.json()).resolves.toMatchObject({
        ok: false,
        value: null,
        errors: { request: expect.any(String) }
      });
      expect(state.sets.length).toBe(writesAfterOwnerEdit);

      const ownerView = await conversationsRoute.GET(
        request(`/api/conversations/${fixture.conversationId}`, fixture.ownerUserId, undefined, "GET"),
        context
      );
      const participantView = await conversationsRoute.GET(
        request(`/api/conversations/${fixture.conversationId}`, fixture.participantUserId, undefined, "GET"),
        context
      );
      const strangerView = await conversationsRoute.GET(
        request(`/api/conversations/${fixture.conversationId}`, "stranger", undefined, "GET"),
        context
      );
      expect(ownerView.status).toBe(200);
      expect(participantView.status).toBe(200);
      expect(strangerView.status).toBe(200);
      await expect(ownerView.json()).resolves.toMatchObject({ value: { sourceStatus: "published", readOnly: false } });
      await expect(participantView.json()).resolves.toMatchObject({ value: { sourceStatus: "published", readOnly: false } });
      await expect(strangerView.json()).resolves.toMatchObject({ value: null });

      const writeCountBeforeLive = state.sets.length;
      const ownerMessage = await messagesRoute.POST(
        request(participantPath, fixture.ownerUserId, { text: `synthetic-${sourceType}-owner` }),
        context
      );
      const participantMessage = await messagesRoute.POST(
        request(participantPath, fixture.participantUserId, { text: `synthetic-${sourceType}-participant` }),
        context
      );
      expect(ownerMessage.status).toBe(200);
      expect(participantMessage.status).toBe(200);
      expect(state.sets.length).toBe(writeCountBeforeLive + 2);

      const strangerMessage = await messagesRoute.POST(
        request(participantPath, "stranger", { text: `synthetic-${sourceType}-stranger` }),
        context
      );
      expect(strangerMessage.status).toBe(403);
      await expect(strangerMessage.json()).resolves.toMatchObject({
        ok: false,
        value: null,
        errors: { request: "只有会话参与者可以发送消息" }
      });
      expect(state.sets.length).toBe(writeCountBeforeLive + 2);

      const exchangeWritesBefore = state.sets.filter(
        (entry) => entry.collection === "contact_exchange_requests"
      ).length;
      const ownerExchange = await contactExchangeRoute.POST(
        request(exchangePath, fixture.ownerUserId, { action: "create", conversationId: fixture.conversationId })
      );
      const participantExchange = await contactExchangeRoute.POST(
        request(exchangePath, fixture.participantUserId, { action: "create", conversationId: fixture.conversationId })
      );
      const strangerExchange = await contactExchangeRoute.POST(
        request(exchangePath, "stranger", { action: "create", conversationId: fixture.conversationId })
      );
      expect(ownerExchange.status).toBe(200);
      expect(participantExchange.status).toBe(200);
      expect(strangerExchange.status).toBe(403);
      await expect(strangerExchange.json()).resolves.toMatchObject({
        ok: false,
        value: null,
        errors: { request: "只有会话参与者可以请求交换联系方式" }
      });
      expect(state.sets.filter((entry) => entry.collection === "contact_exchange_requests").length).toBe(
        exchangeWritesBefore + 2
      );

      const ownerProfile = await contactProfileRoute.GET(
        request("/api/contact-profile", fixture.ownerUserId, undefined, "GET")
      );
      const participantProfile = await contactProfileRoute.GET(
        request("/api/contact-profile", fixture.participantUserId, undefined, "GET")
      );
      const strangerProfile = await contactProfileRoute.GET(
        request("/api/contact-profile", "stranger", undefined, "GET")
      );
      expect(ownerProfile.status).toBe(200);
      expect(participantProfile.status).toBe(200);
      expect(strangerProfile.status).toBe(200);
      await expect(ownerProfile.json()).resolves.toMatchObject({ value: { phone: "13800000001" } });
      await expect(participantProfile.json()).resolves.toMatchObject({ value: { phone: "13800000002" } });
      const strangerProfileBody = await json(strangerProfile);
      expect(strangerProfileBody.value).toEqual({ phone: "", wechat: "" });
      expect(JSON.stringify(strangerProfileBody)).not.toContain("13800000001");
      expect(JSON.stringify(strangerProfileBody)).not.toContain("13800000002");

      const liveWriteCount = state.sets.length;
      const sourceCollection = sourceType === "parent-need" ? "parent_needs" : "tutor_profiles";
      const source = state.documents.get(`${sourceCollection}:${sourceId}`);
      state.documents.set(`${sourceCollection}:${sourceId}`, {
        ...source,
        status: "deleted",
        updatedAt: "2026-08-10T00:02:00.000Z",
        version: 3
      });

      for (const userId of [fixture.ownerUserId, fixture.participantUserId]) {
        const deletedView = await conversationsRoute.GET(
          request(`/api/conversations/${fixture.conversationId}`, userId, undefined, "GET"),
          context
        );
        expect(deletedView.status).toBe(200);
        await expect(deletedView.json()).resolves.toMatchObject({
          value: { sourceStatus: "deleted", readOnly: true }
        });

        const deletedMessage = await messagesRoute.POST(
          request(participantPath, userId, { text: `synthetic-${sourceType}-deleted` }),
          context
        );
        expect(deletedMessage.status).toBe(403);
        await expect(deletedMessage.json()).resolves.toMatchObject({
          ok: false,
          value: null,
          errors: { request: "关联发布已删除，会话当前只读" }
        });

        const deletedExchange = await contactExchangeRoute.POST(
          request(exchangePath, userId, { action: "create", conversationId: fixture.conversationId })
        );
        expect(deletedExchange.status).toBe(403);
        await expect(deletedExchange.json()).resolves.toMatchObject({
          ok: false,
          value: null,
          errors: { request: "关联发布已删除，暂不可交换联系方式" }
        });

        const authorizedProfiles = await contactExchangeRoute.GET(
          request(`${exchangePath}?conversationId=${fixture.conversationId}&view=authorized-profiles`, userId, undefined, "GET")
        );
        expect(authorizedProfiles.status).toBe(200);
        const authorizedBody = await json(authorizedProfiles);
        expect(authorizedBody.value).toBeNull();
        expect(JSON.stringify(authorizedBody)).not.toContain("13800000001");
        expect(JSON.stringify(authorizedBody)).not.toContain("13800000002");
      }

      expect(state.sets.length).toBe(liveWriteCount);
    }
  });

  it("composes bilateral contact approval and authorized-profile reads through the real route export", async () => {
    process.env.APP_ENV = "test";
    Object.assign(process.env, { NODE_ENV: "test" });
    process.env.M5_ENABLE_HOSTED_TEST_LOGIN = "true";
    process.env.NEXT_PUBLIC_ALLOW_TEST_LOGIN = "true";
    process.env.AUTH_SESSION_SECRET = "synthetic-route-matrix-secret";
    process.env.AUTH_SESSION_KEY_VERSION = "v1";
    transactionRunner();

    const contactExchangeRoute = await import("@/app/api/contact-exchange/route");

    for (const sourceType of ["parent-need", "tutor-profile"] as const) {
      const sourceId = `${sourceType}-contact-lifecycle`;
      const fixture = seedSourceFixture({ sourceId, sourceType });
      const exchangePath = "/api/contact-exchange";
      const create = await contactExchangeRoute.POST(
        request(exchangePath, fixture.participantUserId, {
          action: "create",
          conversationId: fixture.conversationId,
          now: "2026-08-10T00:02:00.000Z"
        })
      );
      expect(create.status).toBe(200);
      const createBody = await json(create);
      const requestId = (createBody.value as { id?: string } | null)?.id;
      expect(requestId).toMatch(/^contact-exchange-/);

      const pending = await contactExchangeRoute.GET(
        request(`${exchangePath}?conversationId=${fixture.conversationId}&view=authorized-profiles`, fixture.ownerUserId, undefined, "GET")
      );
      expect(pending.status).toBe(200);
      await expect(pending.json()).resolves.toMatchObject({ ok: true, value: null });

      const stranger = await contactExchangeRoute.GET(
        request(`${exchangePath}?conversationId=${fixture.conversationId}&view=authorized-profiles`, "stranger", undefined, "GET")
      );
      expect(stranger.status).toBe(200);
      await expect(stranger.json()).resolves.toMatchObject({ ok: true, value: null });

      const approve = await contactExchangeRoute.POST(
        request(exchangePath, fixture.ownerUserId, {
          action: "approve",
          requestId,
          secondConfirmation: true,
          now: "2026-08-10T00:03:00.000Z"
        })
      );
      expect(approve.status).toBe(200);
      await expect(approve.json()).resolves.toMatchObject({
        ok: true,
        value: { status: "approved" }
      });

      for (const [currentUserId, expectedCurrentPhone, expectedOtherPhone] of [
        [fixture.ownerUserId, "13800000001", "13800000002"],
        [fixture.participantUserId, "13800000002", "13800000001"]
      ] as const) {
        const authorized = await contactExchangeRoute.GET(
          request(`${exchangePath}?conversationId=${fixture.conversationId}&view=authorized-profiles`, currentUserId, undefined, "GET")
        );
        expect(authorized.status).toBe(200);
        await expect(authorized.json()).resolves.toMatchObject({
          ok: true,
          value: {
            currentUser: { phone: expectedCurrentPhone },
            otherUser: { phone: expectedOtherPhone }
          }
        });
      }

      const beforeBlockedChecks = state.sets.length;
      state.documents.set(`${sourceType === "parent-need" ? "parent_needs" : "tutor_profiles"}:${sourceId}`, {
        ...state.documents.get(`${sourceType === "parent-need" ? "parent_needs" : "tutor_profiles"}:${sourceId}`),
        version: 3
      });
      const versionMismatch = await contactExchangeRoute.GET(
        request(`${exchangePath}?conversationId=${fixture.conversationId}&view=authorized-profiles`, fixture.ownerUserId, undefined, "GET")
      );
      expect(versionMismatch.status).toBe(200);
      await expect(versionMismatch.json()).resolves.toMatchObject({ ok: true, value: null });
      expect(state.sets.length).toBe(beforeBlockedChecks);

      state.documents.set(`${sourceType === "parent-need" ? "parent_needs" : "tutor_profiles"}:${sourceId}`, {
        ...state.documents.get(`${sourceType === "parent-need" ? "parent_needs" : "tutor_profiles"}:${sourceId}`),
        status: "deleted"
      });
      const deleted = await contactExchangeRoute.GET(
        request(`${exchangePath}?conversationId=${fixture.conversationId}&view=authorized-profiles`, fixture.participantUserId, undefined, "GET")
      );
      expect(deleted.status).toBe(200);
      const deletedBody = await json(deleted);
      expect(deletedBody.value).toBeNull();
      expect(JSON.stringify(deletedBody)).not.toMatch(/1380000000[12]|wechat/);
      expect(state.sets.length).toBe(beforeBlockedChecks);
    }
  });

  it("keeps legacy, source-version mismatch, and revoked sessions fail-closed for both source types", async () => {
    process.env.APP_ENV = "test";
    Object.assign(process.env, { NODE_ENV: "test" });
    process.env.M5_ENABLE_HOSTED_TEST_LOGIN = "true";
    process.env.NEXT_PUBLIC_ALLOW_TEST_LOGIN = "true";
    process.env.AUTH_SESSION_SECRET = "synthetic-route-matrix-secret";
    process.env.AUTH_SESSION_KEY_VERSION = "v1";

    const conversationsRoute = await import("@/app/api/conversations/[id]/route");
    const messagesRoute = await import("@/app/api/conversations/[id]/messages/route");
    const contactExchangeRoute = await import("@/app/api/contact-exchange/route");

    for (const sourceType of ["parent-need", "tutor-profile"] as const) {
      const sourceId = `${sourceType}-negative-source`;
      const fixture = seedSourceFixture({ sourceId, sourceType });
      const context = { params: Promise.resolve({ id: fixture.conversationId }) };
      const sourceCollection = sourceType === "parent-need" ? "parent_needs" : "tutor_profiles";
      const sourceKey = `${sourceCollection}:${sourceId}`;

      for (const negativeState of [
        { managementState: "legacy-readonly", version: 2 },
        { managementState: "managed", version: 3 }
      ]) {
        state.documents.set(sourceKey, {
          ...state.documents.get(sourceKey),
          managementState: negativeState.managementState,
          status: "published",
          version: negativeState.version
        });
        const read = await conversationsRoute.GET(
          request(`/api/conversations/${fixture.conversationId}`, fixture.participantUserId, undefined, "GET"),
          context
        );
        expect(read.status).toBe(200);
        await expect(read.json()).resolves.toMatchObject({ value: { sourceStatus: "deleted", readOnly: true } });

        const before = state.sets.length;
        for (const userId of [fixture.ownerUserId, fixture.participantUserId, "stranger"]) {
          const message = await messagesRoute.POST(
            request(`/api/conversations/${fixture.conversationId}/messages`, userId, { text: `synthetic-${sourceType}-blocked` }),
            context
          );
          expect(message.status).toBe(403);
          await expect(message.json()).resolves.toMatchObject({
            ok: false,
            value: null,
            errors: {
              request: userId === "stranger"
                ? "只有会话参与者可以发送消息"
                : "关联发布已删除，会话当前只读"
            }
          });
          const exchange = await contactExchangeRoute.POST(
            request("/api/contact-exchange", userId, { action: "create", conversationId: fixture.conversationId })
          );
          expect(exchange.status).toBe(403);
          await expect(exchange.json()).resolves.toMatchObject({
            ok: false,
            value: null,
            errors: {
              request: userId === "stranger"
                ? "只有会话参与者可以请求交换联系方式"
                : "关联发布已删除，暂不可交换联系方式"
            }
          });
          expect(state.sets.length).toBe(before);
        }
      }

      state.revokedAt = "2026-08-10T00:03:00.000Z";
      const cookie = createAuthSessionCookie({
        createdAt: "2026-08-09T00:00:00.000Z",
        env: process.env,
        userId: fixture.participantUserId
      });
      const revoked = await conversationsRoute.GET(
        new Request(`https://ungraduedu.eu.cc/api/conversations/${fixture.conversationId}`, {
          headers: { cookie: cookie ?? "" }
        }),
        context
      );
      expect(revoked.status).toBe(401);
      expect(state.sets).toHaveLength(0);
    }
  });
});
