import { describe, expect, it } from "vitest";

import { createConversationApiHandlers } from "@/server/conversation-api";

type StoredDocument = Record<string, unknown>;

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
  return createConversationApiHandlers({
    conversationsCollection: createFakeCollection(),
    env,
    messagesCollection: createFakeCollection(),
    parentNeedsCollection: createFakeCollection({
      "parent-need-a": {
        ownerUserId: "parent-a",
        status: "published"
      }
    }),
    tutorProfilesCollection: createFakeCollection({
      "tutor-profile-a": {
        ownerUserId: "tutor-a",
        status: "published"
      }
    })
  });
}

describe("conversation API handlers", () => {
  it("creates a source conversation, reads it, sends a message, and lists messages", async () => {
    const handlers = createHandlers();

    const created = await handlers.POST_COLLECTION(
      new Request("http://localhost/api/conversations", {
        body: JSON.stringify({
          sourceId: "parent-need-a",
          sourceType: "parent-need"
        }),
        headers: { "x-ungradu-test-user-phone": "tutor-a" },
        method: "POST"
      })
    );
    const createdBody = await created.json();

    const read = await handlers.GET_ITEM(
      new Request(`http://localhost/api/conversations/${createdBody.value.id}`, {
        headers: { "x-ungradu-test-user-phone": "parent-a" }
      }),
      { params: Promise.resolve({ id: createdBody.value.id }) }
    );

    const sent = await handlers.POST_MESSAGES(
      new Request(
        `http://localhost/api/conversations/${createdBody.value.id}/messages`,
        {
          body: JSON.stringify({ text: "  你好  " }),
          headers: { "x-ungradu-test-user-phone": "parent-a" },
          method: "POST"
        }
      ),
      { params: Promise.resolve({ id: createdBody.value.id }) }
    );

    const messages = await handlers.GET_MESSAGES(
      new Request(
        `http://localhost/api/conversations/${createdBody.value.id}/messages`,
        { headers: { "x-ungradu-test-user-phone": "tutor-a" } }
      ),
      { params: Promise.resolve({ id: createdBody.value.id }) }
    );

    expect(created.status).toBe(200);
    expect(read.status).toBe(200);
    await expect(read.json()).resolves.toMatchObject({
      ok: true,
      value: {
        id: createdBody.value.id,
        sourceId: "parent-need-a",
        sourceType: "parent-need"
      }
    });
    expect(sent.status).toBe(200);
    await expect(messages.json()).resolves.toMatchObject({
      ok: true,
      value: [
        {
          conversationId: createdBody.value.id,
          direction: "received",
          text: "你好"
        }
      ]
    });
  });

  it("rejects production temporary identity", async () => {
    const handlers = createHandlers({
      NODE_ENV: "production",
      NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true"
    });

    const response = await handlers.GET_COLLECTION(
      new Request("http://localhost/api/conversations", {
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

  it("denies non-participant message send", async () => {
    const handlers = createHandlers();
    const created = await handlers.POST_COLLECTION(
      new Request("http://localhost/api/conversations", {
        body: JSON.stringify({
          sourceId: "parent-need-a",
          sourceType: "parent-need"
        }),
        headers: { "x-ungradu-test-user-phone": "tutor-a" },
        method: "POST"
      })
    );
    const createdBody = await created.json();

    const response = await handlers.POST_MESSAGES(
      new Request(
        `http://localhost/api/conversations/${createdBody.value.id}/messages`,
        {
          body: JSON.stringify({ text: "越权消息" }),
          headers: { "x-ungradu-test-user-phone": "stranger" },
          method: "POST"
        }
      ),
      { params: Promise.resolve({ id: createdBody.value.id }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      errors: { request: "只有会话参与者可以发送消息" }
    });
  });
});
