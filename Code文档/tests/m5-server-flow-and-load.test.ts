import { describe, expect, it } from "vitest";

import {
  approveServerContactExchangeRequest,
  createServerContactExchangeRequest,
  readServerAuthorizedContactProfiles
} from "@/server/contact-exchange";
import { saveServerContactProfile } from "@/server/contact-profiles";
import {
  createOrReadServerConversationFromSource,
  listServerConversationMessages,
  sendServerConversationMessage
} from "@/server/conversations";
import {
  listPublicServerParentNeeds,
  saveServerParentNeed
} from "@/server/parent-needs";
import {
  listPublicServerTutorProfiles,
  saveServerTutorProfile
} from "@/server/tutor-profiles";

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
                  Object.entries(query).every(([key, value]) => document[key] === value)
                )
                .map(([id, document]) => ({ ...document, id }))
            };
          }
        };
      }
    }
  };
}

function createParentNeedInput(index: number) {
  return {
    teacherGenderPreference: "any",
    subjects: ["math"],
    grade: "grade-7",
    budgetMin: "80",
    budgetMax: "120",
    timeSlots: ["sat-pm"],
    region: {
      province: "guangdong",
      city: "dongguan",
      district: "songshan"
    },
    community: `community-${index}`,
    childIntro: `Needs stable math support ${index}`
  };
}

function createTutorProfileInput(index: number) {
  return {
    gender: index % 2 === 0 ? "female" : "male",
    school: "dgut",
    major: `math-${index}`,
    subjects: ["math"],
    grades: ["grade-7"],
    timeSlots: ["sat-pm"],
    feeRanges: [{ grade: "grade-7", subject: "math", min: "90", max: "130" }],
    abilityDescription: `Good at math tutoring ${index}`,
    proofImages: []
  };
}

function createPhone(prefix: "138" | "139", index: number) {
  return `${prefix}${String(index).padStart(8, "0")}`;
}

function createDependencies() {
  const contactProfiles = createFakeCollection();
  const conversations = createFakeCollection();
  const messages = createFakeCollection();
  const parentNeeds = createFakeCollection();
  const tutorProfiles = createFakeCollection();
  const exchangeRequests = createFakeCollection();

  return {
    contactProfilesCollection: contactProfiles.collection,
    conversationsCollection: conversations.collection,
    exchangeRequestsCollection: exchangeRequests.collection,
    messagesCollection: messages.collection,
    parentNeedsCollection: parentNeeds.collection,
    tutorProfilesCollection: tutorProfiles.collection
  };
}

describe("M5 server flow and load baseline", () => {
  it("runs the core server flow for 50 concurrent users without leaking unauthorized contacts", async () => {
    const dependencies = createDependencies();
    const startedAt = performance.now();
    const pairCount = 25;

    await Promise.all(Array.from({ length: pairCount }, async (_, index) => {
      const parentUserId = createPhone("138", index);
      const tutorUserId = createPhone("139", index);

      const [parentContact, tutorContact, parentNeed, tutorProfile] = await Promise.all([
        saveServerContactProfile({
          authenticatedUserId: parentUserId,
          collection: dependencies.contactProfilesCollection,
          input: { phone: parentUserId, wechat: `parent_${index}` }
        }),
        saveServerContactProfile({
          authenticatedUserId: tutorUserId,
          collection: dependencies.contactProfilesCollection,
          input: { phone: tutorUserId, wechat: `tutor_${index}` }
        }),
        saveServerParentNeed({
          authenticatedUserId: parentUserId,
          collection: dependencies.parentNeedsCollection,
          input: createParentNeedInput(index)
        }),
        saveServerTutorProfile({
          authenticatedUserId: tutorUserId,
          collection: dependencies.tutorProfilesCollection,
          input: createTutorProfileInput(index)
        })
      ]);

      expect(parentContact.ok).toBe(true);
      expect(tutorContact.ok).toBe(true);
      expect(parentNeed.ok).toBe(true);
      expect(tutorProfile.ok).toBe(true);

      if (!parentNeed.ok || !tutorProfile.ok) {
        return;
      }

      const [needs, profiles] = await Promise.all([
        listPublicServerParentNeeds({
          collection: dependencies.parentNeedsCollection,
          filters: { subject: "math" }
        }),
        listPublicServerTutorProfiles({
          collection: dependencies.tutorProfilesCollection,
          filters: { subject: "math" }
        })
      ]);

      expect(needs.ok && needs.value.length).toBeGreaterThan(0);
      expect(profiles.ok && profiles.value.length).toBeGreaterThan(0);
      expect(JSON.stringify(needs)).not.toContain(parentUserId);
      expect(JSON.stringify(profiles)).not.toContain(tutorUserId);

      const conversation = await createOrReadServerConversationFromSource({
        authenticatedUserId: tutorUserId,
        conversationsCollection: dependencies.conversationsCollection,
        messagesCollection: dependencies.messagesCollection,
        parentNeedsCollection: dependencies.parentNeedsCollection,
        sourceId: parentNeed.value.id,
        sourceType: "parent-need",
        tutorProfilesCollection: dependencies.tutorProfilesCollection
      });

      expect(conversation.ok).toBe(true);

      if (!conversation.ok) {
        return;
      }

      await expect(sendServerConversationMessage({
        authenticatedUserId: parentUserId,
        conversationId: conversation.value.id,
        conversationsCollection: dependencies.conversationsCollection,
        messagesCollection: dependencies.messagesCollection,
        parentNeedsCollection: dependencies.parentNeedsCollection,
        text: "Hello",
        tutorProfilesCollection: dependencies.tutorProfilesCollection
      })).resolves.toMatchObject({ ok: true });
      await expect(sendServerConversationMessage({
        authenticatedUserId: tutorUserId,
        conversationId: conversation.value.id,
        conversationsCollection: dependencies.conversationsCollection,
        messagesCollection: dependencies.messagesCollection,
        parentNeedsCollection: dependencies.parentNeedsCollection,
        text: "Available",
        tutorProfilesCollection: dependencies.tutorProfilesCollection
      })).resolves.toMatchObject({ ok: true });
      await expect(sendServerConversationMessage({
        authenticatedUserId: "stranger",
        conversationId: conversation.value.id,
        conversationsCollection: dependencies.conversationsCollection,
        messagesCollection: dependencies.messagesCollection,
        parentNeedsCollection: dependencies.parentNeedsCollection,
        text: "Forbidden",
        tutorProfilesCollection: dependencies.tutorProfilesCollection
      })).resolves.toMatchObject({ ok: false });

      const beforeApproval = await readServerAuthorizedContactProfiles({
        authenticatedUserId: parentUserId,
        contactProfilesCollection: dependencies.contactProfilesCollection,
        conversationId: conversation.value.id,
        conversationsCollection: dependencies.conversationsCollection,
        requestsCollection: dependencies.exchangeRequestsCollection
      });
      expect(beforeApproval).toEqual({ ok: true, value: null, errors: {} });

      const request = await createServerContactExchangeRequest({
        authenticatedUserId: parentUserId,
        contactProfilesCollection: dependencies.contactProfilesCollection,
        conversationId: conversation.value.id,
        conversationsCollection: dependencies.conversationsCollection,
        requestsCollection: dependencies.exchangeRequestsCollection
      });
      expect(request.ok).toBe(true);

      if (!request.ok) {
        return;
      }

      await expect(approveServerContactExchangeRequest({
        authenticatedUserId: tutorUserId,
        contactProfilesCollection: dependencies.contactProfilesCollection,
        conversationsCollection: dependencies.conversationsCollection,
        requestId: request.value.id,
        requestsCollection: dependencies.exchangeRequestsCollection,
        secondConfirmation: true
      })).resolves.toMatchObject({ ok: true });

      await expect(readServerAuthorizedContactProfiles({
        authenticatedUserId: parentUserId,
        contactProfilesCollection: dependencies.contactProfilesCollection,
        conversationId: conversation.value.id,
        conversationsCollection: dependencies.conversationsCollection,
        requestsCollection: dependencies.exchangeRequestsCollection
      })).resolves.toMatchObject({
        ok: true,
        value: {
          currentUser: { phone: parentUserId },
          otherUser: { phone: tutorUserId }
        }
      });
      await expect(readServerAuthorizedContactProfiles({
        authenticatedUserId: "stranger",
        contactProfilesCollection: dependencies.contactProfilesCollection,
        conversationId: conversation.value.id,
        conversationsCollection: dependencies.conversationsCollection,
        requestsCollection: dependencies.exchangeRequestsCollection
      })).resolves.toEqual({ ok: true, value: null, errors: {} });
      await expect(listServerConversationMessages({
        authenticatedUserId: parentUserId,
        conversationId: conversation.value.id,
        conversationsCollection: dependencies.conversationsCollection,
        messagesCollection: dependencies.messagesCollection,
        parentNeedsCollection: dependencies.parentNeedsCollection,
        tutorProfilesCollection: dependencies.tutorProfilesCollection
      })).resolves.toMatchObject({ ok: true, value: [{}, {}] });
    }));

    expect(performance.now() - startedAt).toBeLessThan(5000);
  });
});
