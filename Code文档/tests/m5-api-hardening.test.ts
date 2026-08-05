import { describe, expect, it } from "vitest";

import { createContactProfileApiHandlers } from "@/server/contact-profile-api";
import { createContactExchangeApiHandlers } from "@/server/contact-exchange-api";
import { createConversationApiHandlers } from "@/server/conversation-api";
import { createParentNeedApiHandlers } from "@/server/parent-need-api";
import { createTutorProfileApiHandlers } from "@/server/tutor-profile-api";

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

function invalidJsonRequest(path: string) {
  return new Request(`http://localhost${path}`, {
    body: "{",
    headers: { "x-ungradu-test-user-phone": "user-a" },
    method: "POST"
  });
}

describe("M5 API hardening", () => {
  it("returns 400 for malformed JSON bodies on migrated write APIs", async () => {
    const env = { NODE_ENV: "test", NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true" };
    const contactProfile = createContactProfileApiHandlers({
      collection: createFakeCollection(),
      env
    });
    const contactExchange = createContactExchangeApiHandlers({
      contactProfilesCollection: createFakeCollection(),
      conversationsCollection: createFakeCollection(),
      env,
      parentNeedsCollection: createFakeCollection(),
      requestsCollection: createFakeCollection(),
      tutorProfilesCollection: createFakeCollection()
    });
    const parentNeeds = createParentNeedApiHandlers({
      collection: createFakeCollection(),
      env
    });
    const tutorProfiles = createTutorProfileApiHandlers({
      collection: createFakeCollection(),
      env
    });
    const conversations = createConversationApiHandlers({
      conversationsCollection: createFakeCollection(),
      env,
      messagesCollection: createFakeCollection(),
      parentNeedsCollection: createFakeCollection(),
      tutorProfilesCollection: createFakeCollection()
    });

    const responses = await Promise.all([
      contactProfile.PUT(
        new Request("http://localhost/api/contact-profile", {
          body: "{",
          headers: { "x-ungradu-test-user-phone": "user-a" },
          method: "PUT"
        })
      ),
      contactExchange.POST(invalidJsonRequest("/api/contact-exchange")),
      parentNeeds.POST_COLLECTION(invalidJsonRequest("/api/parent-needs")),
      tutorProfiles.POST_COLLECTION(invalidJsonRequest("/api/tutor-profiles")),
      conversations.POST_COLLECTION(invalidJsonRequest("/api/conversations")),
      conversations.POST_MESSAGES(invalidJsonRequest("/api/conversations/c-a/messages"), {
        params: Promise.resolve({ id: "c-a" })
      })
    ]);

    for (const response of responses) {
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        ok: false,
        value: null,
        errors: { request: "Invalid JSON body." }
      });
    }
  });
});
