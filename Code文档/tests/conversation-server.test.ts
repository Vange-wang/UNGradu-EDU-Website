import { describe, expect, it } from "vitest";

import {
  createOrReadServerConversationFromSource,
  listServerConversationMessages,
  listServerConversationsForUser,
  readServerConversationForUser,
  sendServerConversationMessage
} from "@/server/conversations";

type StoredDocument = Record<string, unknown>;

function createFakeCollection(initialValues: Record<string, StoredDocument> = {}) {
  const documents = new Map(Object.entries(initialValues));

  return {
    documents,
    collection: {
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
                  Object.entries(query).every(
                    ([key, value]) => document[key] === value
                  )
                )
                .map(([id, document]) => ({ ...document, id }))
            };
          }
        };
      }
    }
  };
}

function createDependencies() {
  const conversations = createFakeCollection();
  const messages = createFakeCollection();
  const parentNeeds = createFakeCollection({
    "parent-need-a": {
      ownerUserId: "parent-a",
      subjects: ["数学"],
      grade: "小学",
      status: "published",
      createdAt: "2026-06-22T00:00:00.000Z"
    }
  });
  const tutorProfiles = createFakeCollection({
    "tutor-profile-a": {
      ownerUserId: "tutor-a",
      subjects: ["数学"],
      grades: ["小学"],
      status: "published",
      createdAt: "2026-06-22T00:00:00.000Z"
    }
  });

  return {
    conversations,
    conversationsCollection: conversations.collection,
    messages,
    messagesCollection: messages.collection,
    parentNeedsCollection: parentNeeds.collection,
    tutorProfilesCollection: tutorProfiles.collection
  };
}

describe("server conversations interface", () => {
  it("creates or reuses a source-based conversation without exposing participant user ids", async () => {
    const dependencies = createDependencies();

    const first = await createOrReadServerConversationFromSource({
      ...dependencies,
      authenticatedUserId: "tutor-a",
      sourceId: "parent-need-a",
      sourceType: "parent-need",
      now: "2026-06-22T00:00:00.000Z"
    });
    const second = await createOrReadServerConversationFromSource({
      ...dependencies,
      authenticatedUserId: "tutor-a",
      sourceId: "parent-need-a",
      sourceType: "parent-need",
      now: "2026-06-22T00:01:00.000Z"
    });

    expect(first).toMatchObject({
      ok: true,
      value: {
        sourceId: "parent-need-a",
        sourceType: "parent-need",
        createdAt: "2026-06-22T00:00:00.000Z"
      }
    });
    expect(second.ok && first.ok && second.value.id).toBe(
      first.ok ? first.value.id : ""
    );
    expect(JSON.stringify(first)).not.toContain("parent-a");
    expect(JSON.stringify(first)).not.toContain("tutor-a");
  });

  it("denies creating a conversation with your own source", async () => {
    const dependencies = createDependencies();

    await expect(
      createOrReadServerConversationFromSource({
        ...dependencies,
        authenticatedUserId: "parent-a",
        sourceId: "parent-need-a",
        sourceType: "parent-need"
      })
    ).resolves.toMatchObject({
      ok: false,
      errors: { request: "不能和自己发布的信息创建会话" }
    });
  });

  it("allows only participants to read conversations and messages", async () => {
    const dependencies = createDependencies();
    const created = await createOrReadServerConversationFromSource({
      ...dependencies,
      authenticatedUserId: "tutor-a",
      sourceId: "parent-need-a",
      sourceType: "parent-need"
    });
    const conversationId = created.ok ? created.value.id : "";

    await expect(
      readServerConversationForUser({
        ...dependencies,
        authenticatedUserId: "stranger",
        conversationId
      })
    ).resolves.toEqual({ ok: true, value: null, errors: {} });

    const message = await sendServerConversationMessage({
      ...dependencies,
      authenticatedUserId: "tutor-a",
      conversationId,
      now: "2026-06-22T00:02:00.000Z",
      text: "  你好，可以聊一下补课安排吗？ "
    });

    expect(message).toMatchObject({
      ok: true,
      value: {
        conversationId,
        direction: "sent",
        text: "你好，可以聊一下补课安排吗？"
      }
    });

    await expect(
      sendServerConversationMessage({
        ...dependencies,
        authenticatedUserId: "stranger",
        conversationId,
        text: "越权消息"
      })
    ).resolves.toMatchObject({
      ok: false,
      errors: { request: "只有会话参与者可以发送消息" }
    });

    await expect(
      listServerConversationMessages({
        ...dependencies,
        authenticatedUserId: "parent-a",
        conversationId
      })
    ).resolves.toMatchObject({
      ok: true,
      value: [
        {
          conversationId,
          direction: "received",
          text: "你好，可以聊一下补课安排吗？"
        }
      ]
    });

    await expect(
      listServerConversationMessages({
        ...dependencies,
        authenticatedUserId: "stranger",
        conversationId
      })
    ).resolves.toEqual({ ok: true, value: [], errors: {} });
  });

  it("lists only conversations that include the current user", async () => {
    const dependencies = createDependencies();
    await createOrReadServerConversationFromSource({
      ...dependencies,
      authenticatedUserId: "tutor-a",
      sourceId: "parent-need-a",
      sourceType: "parent-need",
      now: "2026-06-22T00:00:00.000Z"
    });

    await expect(
      listServerConversationsForUser({
        ...dependencies,
        authenticatedUserId: "parent-a"
      })
    ).resolves.toMatchObject({
      ok: true,
      value: [
        {
          sourceId: "parent-need-a",
          sourceType: "parent-need"
        }
      ]
    });

    await expect(
      listServerConversationsForUser({
        ...dependencies,
        authenticatedUserId: "stranger"
      })
    ).resolves.toEqual({ ok: true, value: [], errors: {} });
  });
});
