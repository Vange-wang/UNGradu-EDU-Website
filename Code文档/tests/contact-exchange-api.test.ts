import { describe, expect, it, vi } from "vitest";

import { createContactExchangeApiHandlers } from "@/server/contact-exchange-api";
import { createAuthSessionCookie, type AuthSessionRevocationGuard } from "@/server/auth-session";

type StoredDocument = Record<string, unknown>;

function activeExchangeTimes() {
  const createdAt = new Date();
  const approvedAt = new Date(createdAt.getTime() + 5 * 60 * 1000);

  return {
    approvedAt: approvedAt.toISOString(),
    createdAt: createdAt.toISOString()
  };
}

function createFakeCollection(initialValues: Record<string, StoredDocument> = {}) {
  const documents = new Map(Object.entries(initialValues));

  return {
    doc(docId: string) {
      return {
        async get() {
          const data = documents.get(docId);
          return { data: data ? [{ ...data, id: docId }] : [] };
        },
        async set(data: StoredDocument) {
          documents.set(docId, data);
          return { updated: 1 };
        }
      };
    },
    where(query: Record<string, unknown>) {
      return {
        async get() {
          return {
            data: Array.from(documents.entries())
              .filter(([, document]) =>
                Object.entries(query).every(([key, value]) => document[key] === value)
              )
              .map(([id, document]) => ({ ...document, id }))
          };
        }
      };
    }
  };
}

function createHandlers(env = { NODE_ENV: "test", NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true" }) {
  return createContactExchangeApiHandlers({
    contactProfilesCollection: createFakeCollection({
      "parent-a": {
        ownerUserId: "parent-a",
        phone: "13800138000",
        wechat: "parent_contact",
        updatedAt: "2026-06-22T00:00:00.000Z"
      },
      "tutor-a": {
        ownerUserId: "tutor-a",
        phone: "13900139000",
        wechat: "tutor_contact",
        updatedAt: "2026-06-22T00:00:00.000Z"
      }
    }),
    conversationsCollection: createFakeCollection({
      "conversation-a": {
        participantUserIds: ["parent-a", "tutor-a"],
        sourceId: "parent-need-a",
        sourceType: "parent-need",
        createdAt: "2026-06-22T00:00:00.000Z"
      }
    }),
    env,
    parentNeedsCollection: createFakeCollection({
      "parent-need-a": { ownerUserId: "parent-a", status: "published", version: 1 }
    }),
    requestsCollection: createFakeCollection(),
    tutorProfilesCollection: createFakeCollection()
  });
}

describe("contact exchange API handlers", () => {
  it("creates, approves, and then returns authorized contact profiles", async () => {
    const handlers = createHandlers();
    const activeTimes = activeExchangeTimes();

    const created = await handlers.POST(
      new Request("http://localhost/api/contact-exchange", {
        body: JSON.stringify({
          action: "create",
          conversationId: "conversation-a",
          now: activeTimes.createdAt
        }),
        headers: { "x-ungradu-test-user-phone": "parent-a" },
        method: "POST"
      })
    );
    const createdBody = await created.json();

    const beforeApproval = await handlers.GET(
      new Request(
        "http://localhost/api/contact-exchange?conversationId=conversation-a&view=authorized-profiles",
        { headers: { "x-ungradu-test-user-phone": "parent-a" } }
      )
    );

    const approved = await handlers.POST(
      new Request("http://localhost/api/contact-exchange", {
        body: JSON.stringify({
          action: "approve",
          now: activeTimes.approvedAt,
          requestId: createdBody.value.id,
          secondConfirmation: true
        }),
        headers: { "x-ungradu-test-user-phone": "tutor-a" },
        method: "POST"
      })
    );

    const afterApproval = await handlers.GET(
      new Request(
        "http://localhost/api/contact-exchange?conversationId=conversation-a&view=authorized-profiles",
        { headers: { "x-ungradu-test-user-phone": "parent-a" } }
      )
    );

    expect(created.status).toBe(200);
    expect(beforeApproval.status).toBe(200);
    await expect(beforeApproval.json()).resolves.toEqual({
      ok: true,
      value: null,
      errors: {}
    });
    expect(approved.status).toBe(200);
    await expect(afterApproval.json()).resolves.toMatchObject({
      ok: true,
      value: {
        currentUser: { phone: "13800138000", wechat: "parent_contact" },
        otherUser: { phone: "13900139000", wechat: "tutor_contact" }
      }
    });
  });

  it("rejects production temporary identity", async () => {
    const handlers = createHandlers({
      NODE_ENV: "production",
      NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true"
    });

    const response = await handlers.GET(
      new Request("http://localhost/api/contact-exchange?conversationId=conversation-a", {
        headers: { "x-ungradu-test-user-phone": "parent-a" }
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      errors: {
        request: "Production does not accept temporary test login identity."
      }
    });
  });

  it("denies non-participant exchange creation", async () => {
    const handlers = createHandlers();

    const response = await handlers.POST(
      new Request("http://localhost/api/contact-exchange", {
        body: JSON.stringify({
          action: "create",
          conversationId: "conversation-a"
        }),
        headers: { "x-ungradu-test-user-phone": "stranger" },
        method: "POST"
      })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      errors: { request: "无法找到请求的资源" },
      ok: false,
      value: null
    });
  });

  it("rejects a revoked session before the contact exchange handler can read or mutate data", async () => {
    const collection = {
      doc: vi.fn(() => ({
        get: vi.fn(async () => ({ data: [] })),
        set: vi.fn()
      })),
      where: vi.fn(() => ({ get: vi.fn(async () => ({ data: [] })) }))
    };
    const sessionRevocationGuard: AuthSessionRevocationGuard = {
      async check() {
        return { ok: false as const, reason: "revoked" as const };
      },
      async revoke() {}
    };
    const env = {
      AUTH_SESSION_SECRET: "synthetic-contact-session-secret",
      NODE_ENV: "test"
    };
    const cookie = createAuthSessionCookie({ env, userId: "participant-a" });
    const handlers = createContactExchangeApiHandlers({
      contactProfilesCollection: collection,
      conversationsCollection: collection,
      env,
      parentNeedsCollection: collection,
      requestsCollection: collection,
      sessionRevocationGuard,
      tutorProfilesCollection: collection
    });

    const response = await handlers.POST(
      new Request("http://localhost/api/contact-exchange", {
        body: JSON.stringify({ action: "create", conversationId: "conversation-a" }),
        headers: { cookie: cookie ?? "" },
        method: "POST"
      })
    );

    expect(response.status).toBe(401);
    expect(collection.doc).not.toHaveBeenCalled();
    expect(collection.where).not.toHaveBeenCalled();
  });
});
