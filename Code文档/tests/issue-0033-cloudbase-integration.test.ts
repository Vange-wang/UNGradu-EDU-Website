import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import tcb from "@cloudbase/node-sdk";
import { describe, expect, it } from "vitest";

import {
  approveServerContactExchangeRequest,
  CONTACT_EXCHANGE_REQUESTS_COLLECTION,
  createServerContactExchangeRequest,
  readServerAuthorizedContactProfiles,
  rejectServerContactExchangeRequest,
  withdrawServerContactExchangeRequest
} from "@/server/contact-exchange";
import {
  CONTACT_PROFILES_COLLECTION,
  saveServerContactProfile
} from "@/server/contact-profiles";
import {
  CONVERSATIONS_COLLECTION,
  CONVERSATION_MESSAGES_COLLECTION,
  createOrReadServerConversationFromSource,
  listServerConversationMessages,
  readServerConversationForUser,
  sendServerConversationMessage
} from "@/server/conversations";
import {
  deleteServerParentNeed,
  findPublicServerParentNeedById,
  PARENT_NEEDS_COLLECTION,
  readServerParentNeedForOwner,
  restoreServerParentNeed,
  saveServerParentNeed,
  updateServerParentNeed,
  type ParentNeedLifecycleTransactionRunner
} from "@/server/parent-needs";
import {
  deleteServerTutorProfile,
  findPublicServerTutorProfileById,
  readServerTutorProfileForOwner,
  restoreServerTutorProfile,
  saveServerTutorProfile,
  TUTOR_PROFILES_COLLECTION,
  updateServerTutorProfile,
  type TutorProfileLifecycleTransactionRunner
} from "@/server/tutor-profiles";

const integrationEnabled =
  process.env.RUN_ISSUE0033_CLOUDBASE_INTEGRATION === "1";
const describeCloudBase = integrationEnabled ? describe : describe.skip;
const AUDIT_COLLECTION = "audit_events";

function parseEnvFile() {
  const contents = readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8");
  const values: Record<string, string> = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 0) continue;
    values[trimmed.slice(0, separator).trim()] = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
  }

  return values;
}

function requireEnv(values: Record<string, string>, key: string) {
  const value = values[key]?.trim();
  if (!value) throw new Error(`ISSUE0033_INTEGRATION_MISSING_${key}`);
  return value;
}

function redactSensitiveMessage(
  message: string,
  values: Array<{ replacement: string; value?: string }>
) {
  return values.reduce((redacted, entry) => {
    const value = entry.value?.trim();
    return value ? redacted.replaceAll(value, entry.replacement) : redacted;
  }, message);
}

function isoAfter(base: Date, milliseconds: number) {
  return new Date(base.getTime() + milliseconds).toISOString();
}

function hasReturnedDocument(result: { data?: unknown }) {
  const data = result.data;
  return Array.isArray(data) ? data.length > 0 : Boolean(data);
}

function firstReturnedDocument(result: { data?: unknown }) {
  const data = result.data;
  return (Array.isArray(data) ? data[0] : data) as
    | Record<string, unknown>
    | undefined;
}

describe("ISSUE-0033 CloudBase cleanup evidence", () => {
  it("counts both object and array document response shapes", () => {
    expect(hasReturnedDocument({ data: { id: "object-shape" } })).toBe(true);
    expect(hasReturnedDocument({ data: [{ id: "array-shape" }] })).toBe(true);
    expect(hasReturnedDocument({ data: [] })).toBe(false);
    expect(hasReturnedDocument({})).toBe(false);
    expect(firstReturnedDocument({ data: { id: "object-shape" } })).toEqual({
      id: "object-shape"
    });
    expect(firstReturnedDocument({ data: [{ id: "array-shape" }] })).toEqual({
      id: "array-shape"
    });
    expect(firstReturnedDocument({ data: [] })).toBeUndefined();
    expect(firstReturnedDocument({})).toBeUndefined();
  });
});

describeCloudBase("ISSUE-0033 real CloudBase transaction integration", () => {
  it("runs the gated lifecycle, source gates, audit, and rollback contract", async () => {
    const env = parseEnvFile();
    if (env.APP_ENV !== "test") throw new Error("ISSUE0033_APP_ENV_NOT_TEST");

    const cloudbaseEnvId = requireEnv(env, "CLOUDBASE_ENV_ID");
    const secretId = requireEnv(env, "TENCENTCLOUD_SECRETID");
    const secretKey = requireEnv(env, "TENCENTCLOUD_SECRETKEY");
    const sessionToken = env.TENCENTCLOUD_SESSIONTOKEN?.trim();
    const sensitiveValues = [
      { replacement: "[REDACTED_ENV]", value: cloudbaseEnvId },
      { replacement: "[REDACTED_SECRET]", value: secretId },
      { replacement: "[REDACTED_SECRET]", value: secretKey },
      { replacement: "[REDACTED_TOKEN]", value: sessionToken }
    ];
    let app: ReturnType<typeof tcb.init>;
    try {
      app = tcb.init({
        env: cloudbaseEnvId,
        secretId,
        secretKey,
        ...(sessionToken ? { sessionToken } : {})
      });
    } catch (error) {
      const rawMessage = error instanceof Error
        ? error.message
        : "UNKNOWN_CLOUDBASE_INIT_FAILURE";
      throw new Error(
        `ISSUE0033_CLOUDBASE_INIT_FAILED:${redactSensitiveMessage(rawMessage, sensitiveValues)}`
      );
    }
    const database = app.database();
    type TransactionLike = {
      collection: (name: string) => ReturnType<typeof database.collection>;
    };
    const collections = {
      audit: database.collection(AUDIT_COLLECTION),
      contactProfiles: database.collection(CONTACT_PROFILES_COLLECTION),
      conversations: database.collection(CONVERSATIONS_COLLECTION),
      messages: database.collection(CONVERSATION_MESSAGES_COLLECTION),
      parentNeeds: database.collection(PARENT_NEEDS_COLLECTION),
      requests: database.collection(CONTACT_EXCHANGE_REQUESTS_COLLECTION),
      tutorProfiles: database.collection(TUTOR_PROFILES_COLLECTION)
    };
    const parentTransaction: ParentNeedLifecycleTransactionRunner = (operation) =>
      database.runTransaction((transaction: TransactionLike) =>
        operation({
          auditCollection: transaction.collection(AUDIT_COLLECTION),
          contactExchangeRequestsCollection: transaction.collection(
            CONTACT_EXCHANGE_REQUESTS_COLLECTION
          ),
          conversationsCollection: transaction.collection(CONVERSATIONS_COLLECTION),
          sourceCollection: transaction.collection(PARENT_NEEDS_COLLECTION)
        })
      );
    const tutorTransaction: TutorProfileLifecycleTransactionRunner = (operation) =>
      database.runTransaction((transaction: TransactionLike) =>
        operation({
          auditCollection: transaction.collection(AUDIT_COLLECTION),
          contactExchangeRequestsCollection: transaction.collection(
            CONTACT_EXCHANGE_REQUESTS_COLLECTION
          ),
          conversationsCollection: transaction.collection(CONVERSATIONS_COLLECTION),
          sourceCollection: transaction.collection(TUTOR_PROFILES_COLLECTION)
        })
      );
    const runId = `issue0033-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
    const parentOwner = `${runId}-parent`;
    const tutorParticipant = `${runId}-participant`;
    const tutorOwner = `${runId}-tutor-owner`;
    const outsider = `${runId}-outsider`;
    const legacyParentId = `${runId}-legacy-parent`;
    const legacyTutorId = `${runId}-legacy-tutor`;
    const tracked = {
      audit: [] as string[],
      contactProfiles: [parentOwner, tutorParticipant, tutorOwner],
      conversations: [] as string[],
      messages: [] as string[],
      parentNeeds: [legacyParentId],
      requests: [] as string[],
      tutorProfiles: [legacyTutorId] as string[]
    };
    const collectionTargets = () => [
      { collection: collections.messages, ids: tracked.messages, name: CONVERSATION_MESSAGES_COLLECTION },
      { collection: collections.requests, ids: tracked.requests, name: CONTACT_EXCHANGE_REQUESTS_COLLECTION },
      { collection: collections.conversations, ids: tracked.conversations, name: CONVERSATIONS_COLLECTION },
      { collection: collections.contactProfiles, ids: tracked.contactProfiles, name: CONTACT_PROFILES_COLLECTION },
      { collection: collections.parentNeeds, ids: tracked.parentNeeds, name: PARENT_NEEDS_COLLECTION },
      { collection: collections.tutorProfiles, ids: tracked.tutorProfiles, name: TUTOR_PROFILES_COLLECTION },
      { collection: collections.audit, ids: tracked.audit, name: AUDIT_COLLECTION }
    ];
    const countExactDocuments = async () => {
      const counts: Record<string, number> = {};
      for (const target of collectionTargets()) {
        let count = 0;
        for (const id of new Set(target.ids)) {
          const result = await target.collection.doc(id).get();
          if (hasReturnedDocument(result)) count += 1;
        }
        counts[target.name] = count;
      }
      return counts;
    };
    const cleanup = async () => {
      const failures: string[] = [];
      for (const target of collectionTargets()) {
        for (const id of new Set(target.ids)) {
          try {
            await target.collection.doc(id).remove();
          } catch {
            failures.push(target.name);
          }
        }
      }
      if (failures.length > 0) {
        throw new Error(
          `ISSUE0033_CLEANUP_FAILED collection=${[...new Set(failures)].join(",")} testId=${runId}`
        );
      }
    };
    const parentInput = {
      teacherGenderPreference: "不限",
      subjects: ["数学"],
      grade: "初一",
      budgetMin: "80",
      budgetMax: "120",
      timeSlots: ["周六下午"],
      region: { province: "广东省", city: "东莞市", district: "松山湖" },
      community: `integration-${runId}`,
      childIntro: `integration-${runId}`
    };
    const tutorInput = {
      gender: "女",
      school: `integration-${runId}`,
      major: "数学与应用数学",
      subjects: ["数学"],
      grades: ["初中"],
      timeSlots: ["周六下午"],
      feeRanges: [{ grade: "初中", subject: "数学", min: "90", max: "130" }],
      abilityDescription: `integration-${runId}`,
      proofImages: []
    };
    const startedAt = new Date();
    let authenticationPreflightPassed = false;
    let primaryError: unknown;

    console.log(`ISSUE0033_CLOUDBASE_RUN testId=${runId} appEnv=test`);

    try {
      await collections.parentNeeds.doc(`${runId}-auth-preflight`).get();
      authenticationPreflightPassed = true;

      const savedParent = await saveServerParentNeed({
        authenticatedUserId: parentOwner,
        collection: collections.parentNeeds,
        input: parentInput,
        now: isoAfter(startedAt, 0),
        runTransaction: parentTransaction
      });
      if (!savedParent.ok) throw new Error("PARENT_CREATE_FAILED");
      const parentId = savedParent.value.id;
      tracked.parentNeeds.push(parentId);
      tracked.audit.push(`parent-need-${parentId}-create-v1`);
      expect(savedParent.value.version).toBe(1);
      expect(
        (await findPublicServerParentNeedById({ collection: collections.parentNeeds, id: parentId })).value
      ).not.toBeNull();

      const savedTutor = await saveServerTutorProfile({
        authenticatedUserId: tutorOwner,
        collection: collections.tutorProfiles,
        input: tutorInput,
        now: isoAfter(startedAt, 1_000),
        runTransaction: tutorTransaction
      });
      if (!savedTutor.ok) throw new Error("TUTOR_CREATE_FAILED");
      const tutorId = savedTutor.value.id;
      tracked.tutorProfiles.push(tutorId);
      tracked.audit.push(`tutor-profile-${tutorId}-create-v1`);

      await saveServerContactProfile({
        authenticatedUserId: parentOwner,
        collection: collections.contactProfiles,
        input: { phone: "13800138000", wechat: `${runId}-a` }
      });
      await saveServerContactProfile({
        authenticatedUserId: tutorParticipant,
        collection: collections.contactProfiles,
        input: { phone: "13900139000", wechat: `${runId}-b` }
      });
      await saveServerContactProfile({
        authenticatedUserId: tutorOwner,
        collection: collections.contactProfiles,
        input: { phone: "13700137000", wechat: `${runId}-c` }
      });

      const conversationResult = await createOrReadServerConversationFromSource({
        authenticatedUserId: tutorParticipant,
        conversationsCollection: collections.conversations,
        messagesCollection: collections.messages,
        now: isoAfter(startedAt, 2_000),
        parentNeedsCollection: collections.parentNeeds,
        sourceId: parentId,
        sourceType: "parent-need",
        tutorProfilesCollection: collections.tutorProfiles
      });
      if (!conversationResult.ok) throw new Error("CONVERSATION_CREATE_FAILED");
      const conversationId = conversationResult.value.id;
      tracked.conversations.push(conversationId);

      const firstRequest = await createServerContactExchangeRequest({
        authenticatedUserId: tutorParticipant,
        contactProfilesCollection: collections.contactProfiles,
        conversationId,
        conversationsCollection: collections.conversations,
        now: isoAfter(startedAt, 3_000),
        parentNeedsCollection: collections.parentNeeds,
        requestsCollection: collections.requests,
        tutorProfilesCollection: collections.tutorProfiles
      });
      if (!firstRequest.ok) throw new Error("CONTACT_REQUEST_CREATE_FAILED");
      tracked.requests.push(firstRequest.value.id);

      tracked.audit.push(`parent-need-${parentId}-update-v2`);
      const updatedParent = await updateServerParentNeed({
        authenticatedUserId: parentOwner,
        expectedVersion: 1,
        id: parentId,
        input: { ...parentInput, childIntro: `updated-${runId}` },
        now: isoAfter(startedAt, 4_000),
        runTransaction: parentTransaction
      });
      if (!updatedParent.ok) {
        throw new Error(
          `PARENT_UPDATE_FAILED code=${updatedParent.code ?? "NONE"} status=${updatedParent.status ?? "NONE"} errorFields=${Object.keys(updatedParent.errors).sort().join(",") || "NONE"}`
        );
      }

      const conversationAfterEdit = firstReturnedDocument(
        await collections.conversations.doc(conversationId).get()
      );
      const requestAfterEdit = firstReturnedDocument(
        await collections.requests.doc(firstRequest.value.id).get()
      );
      expect(conversationAfterEdit?.sourceStatus).toBe("published");
      expect(conversationAfterEdit?.sourceVersion).toBe(2);
      expect(requestAfterEdit?.sourceStatus).toBe("published");
      expect(requestAfterEdit?.sourceVersion).toBe(2);

      const conversationView = await readServerConversationForUser({
        authenticatedUserId: tutorParticipant,
        conversationId,
        conversationsCollection: collections.conversations,
        messagesCollection: collections.messages,
        parentNeedsCollection: collections.parentNeeds,
        tutorProfilesCollection: collections.tutorProfiles
      });
      expect(conversationView.ok && conversationView.value?.readOnly === false).toBe(true);

      const firstMessage = await sendServerConversationMessage({
        authenticatedUserId: tutorParticipant,
        conversationId,
        conversationsCollection: collections.conversations,
        messagesCollection: collections.messages,
        now: isoAfter(startedAt, 5_000),
        parentNeedsCollection: collections.parentNeeds,
        text: `integration-message-${runId}`,
        tutorProfilesCollection: collections.tutorProfiles
      });
      if (!firstMessage.ok) throw new Error("MESSAGE_AFTER_EDIT_FAILED");
      tracked.messages.push(firstMessage.value.id);

      const approved = await approveServerContactExchangeRequest({
        authenticatedUserId: parentOwner,
        contactProfilesCollection: collections.contactProfiles,
        conversationsCollection: collections.conversations,
        now: isoAfter(startedAt, 6_000),
        parentNeedsCollection: collections.parentNeeds,
        requestId: firstRequest.value.id,
        requestsCollection: collections.requests,
        secondConfirmation: true,
        tutorProfilesCollection: collections.tutorProfiles
      });
      expect(approved.ok).toBe(true);
      const parentParticipantContactsBeforeDelete = await readServerAuthorizedContactProfiles({
        authenticatedUserId: tutorParticipant,
        contactProfilesCollection: collections.contactProfiles,
        conversationId,
        conversationsCollection: collections.conversations,
        parentNeedsCollection: collections.parentNeeds,
        requestsCollection: collections.requests,
        tutorProfilesCollection: collections.tutorProfiles
      });
      expect(parentParticipantContactsBeforeDelete).toMatchObject({
        ok: true,
        value: {
          currentUser: { phone: "13900139000" },
          otherUser: { phone: "13800138000" }
        }
      });

      const pendingRequest = await createServerContactExchangeRequest({
        authenticatedUserId: parentOwner,
        contactProfilesCollection: collections.contactProfiles,
        conversationId,
        conversationsCollection: collections.conversations,
        now: isoAfter(startedAt, 7_000),
        parentNeedsCollection: collections.parentNeeds,
        requestsCollection: collections.requests,
        tutorProfilesCollection: collections.tutorProfiles
      });
      if (!pendingRequest.ok) throw new Error("PENDING_REQUEST_CREATE_FAILED");
      tracked.requests.push(pendingRequest.value.id);

      const parentDeleteKey = `${runId}-delete`;
      const parentDeleteAuditId = `parent-need-${parentId}-delete-v3`;
      const deleted = await deleteServerParentNeed({
        authenticatedUserId: parentOwner,
        expectedVersion: 2,
        id: parentId,
        idempotencyKey: parentDeleteKey,
        now: isoAfter(startedAt, 8_000),
        runTransaction: parentTransaction
      });
      if (!deleted.ok) throw new Error("PARENT_DELETE_FAILED");
      tracked.audit.push(parentDeleteAuditId);
      expect(
        (await findPublicServerParentNeedById({ collection: collections.parentNeeds, id: parentId })).value
      ).toBeNull();

      const historicalMessages = await listServerConversationMessages({
        authenticatedUserId: parentOwner,
        conversationId,
        conversationsCollection: collections.conversations,
        messagesCollection: collections.messages,
        parentNeedsCollection: collections.parentNeeds,
        tutorProfilesCollection: collections.tutorProfiles
      });
      expect(historicalMessages.ok && historicalMessages.value.length === 1).toBe(true);
      expect((await sendServerConversationMessage({
        authenticatedUserId: parentOwner,
        conversationId,
        conversationsCollection: collections.conversations,
        messagesCollection: collections.messages,
        parentNeedsCollection: collections.parentNeeds,
        text: `blocked-${runId}`,
        tutorProfilesCollection: collections.tutorProfiles
      })).ok).toBe(false);
      expect((await createServerContactExchangeRequest({
        authenticatedUserId: parentOwner,
        contactProfilesCollection: collections.contactProfiles,
        conversationId,
        conversationsCollection: collections.conversations,
        parentNeedsCollection: collections.parentNeeds,
        requestsCollection: collections.requests,
        tutorProfilesCollection: collections.tutorProfiles
      })).ok).toBe(false);
      expect((await approveServerContactExchangeRequest({
        authenticatedUserId: tutorParticipant,
        contactProfilesCollection: collections.contactProfiles,
        conversationsCollection: collections.conversations,
        parentNeedsCollection: collections.parentNeeds,
        requestId: pendingRequest.value.id,
        requestsCollection: collections.requests,
        secondConfirmation: true,
        tutorProfilesCollection: collections.tutorProfiles
      })).ok).toBe(false);
      expect((await rejectServerContactExchangeRequest({
        authenticatedUserId: tutorParticipant,
        contactProfilesCollection: collections.contactProfiles,
        conversationsCollection: collections.conversations,
        parentNeedsCollection: collections.parentNeeds,
        requestId: pendingRequest.value.id,
        requestsCollection: collections.requests,
        tutorProfilesCollection: collections.tutorProfiles
      })).ok).toBe(false);
      expect((await withdrawServerContactExchangeRequest({
        authenticatedUserId: parentOwner,
        contactProfilesCollection: collections.contactProfiles,
        conversationsCollection: collections.conversations,
        parentNeedsCollection: collections.parentNeeds,
        requestId: pendingRequest.value.id,
        requestsCollection: collections.requests,
        tutorProfilesCollection: collections.tutorProfiles
      })).ok).toBe(false);
      const parentParticipantContactsWhileDeleted = await readServerAuthorizedContactProfiles({
        authenticatedUserId: tutorParticipant,
        contactProfilesCollection: collections.contactProfiles,
        conversationId,
        conversationsCollection: collections.conversations,
        parentNeedsCollection: collections.parentNeeds,
        requestsCollection: collections.requests,
        tutorProfilesCollection: collections.tutorProfiles
      });
      expect(parentParticipantContactsWhileDeleted).toEqual({
        ok: true,
        value: null,
        errors: {}
      });

      const restored = await restoreServerParentNeed({
        authenticatedUserId: parentOwner,
        expectedVersion: 3,
        id: parentId,
        idempotencyKey: `${runId}-restore`,
        now: isoAfter(startedAt, 9_000),
        runTransaction: parentTransaction
      });
      if (!restored.ok) throw new Error("PARENT_RESTORE_FAILED");
      tracked.audit.push(`parent-need-${parentId}-restore-v4`);
      expect(restored.value.version).toBe(4);
      const afterRestore = await readServerConversationForUser({
        authenticatedUserId: parentOwner,
        conversationId,
        conversationsCollection: collections.conversations,
        messagesCollection: collections.messages,
        parentNeedsCollection: collections.parentNeeds,
        tutorProfilesCollection: collections.tutorProfiles
      });
      expect(afterRestore.ok && afterRestore.value?.readOnly === false).toBe(true);
      const parentParticipantContactsAfterRestore = await readServerAuthorizedContactProfiles({
        authenticatedUserId: tutorParticipant,
        contactProfilesCollection: collections.contactProfiles,
        conversationId,
        conversationsCollection: collections.conversations,
        parentNeedsCollection: collections.parentNeeds,
        requestsCollection: collections.requests,
        tutorProfilesCollection: collections.tutorProfiles
      });
      expect(parentParticipantContactsAfterRestore).toMatchObject({
        ok: true,
        value: {
          currentUser: { phone: "13900139000" },
          otherUser: { phone: "13800138000" }
        }
      });
      const secondMessage = await sendServerConversationMessage({
        authenticatedUserId: parentOwner,
        conversationId,
        conversationsCollection: collections.conversations,
        messagesCollection: collections.messages,
        now: isoAfter(startedAt, 10_000),
        parentNeedsCollection: collections.parentNeeds,
        text: `restored-message-${runId}`,
        tutorProfilesCollection: collections.tutorProfiles
      });
      if (!secondMessage.ok) throw new Error("MESSAGE_AFTER_RESTORE_FAILED");
      tracked.messages.push(secondMessage.value.id);

      tracked.audit.push(`parent-need-${parentId}-update-v5`);
      const parentEditedAfterRestore = await updateServerParentNeed({
        authenticatedUserId: parentOwner,
        expectedVersion: 4,
        id: parentId,
        input: { ...parentInput, childIntro: `post-restore-edit-${runId}` },
        now: isoAfter(startedAt, 10_500),
        runTransaction: parentTransaction
      });
      if (!parentEditedAfterRestore.ok) {
        throw new Error("PARENT_POST_RESTORE_UPDATE_FAILED");
      }
      const parentDeleteAuditBeforeReplay = firstReturnedDocument(
        await collections.audit.doc(parentDeleteAuditId).get()
      );
      const replayedParentDelete = await deleteServerParentNeed({
        authenticatedUserId: parentOwner,
        expectedVersion: 2,
        id: parentId,
        idempotencyKey: parentDeleteKey,
        now: isoAfter(startedAt, 10_750),
        runTransaction: parentTransaction
      });
      expect(replayedParentDelete).toMatchObject({
        ok: true,
        value: { status: "deleted", version: 3 }
      });
      const parentAfterReplay = await readServerParentNeedForOwner({
        authenticatedUserId: parentOwner,
        collection: collections.parentNeeds,
        id: parentId
      });
      expect(parentAfterReplay).toMatchObject({
        ok: true,
        value: { status: "published", version: 5 }
      });
      expect(firstReturnedDocument(
        await collections.audit.doc(parentDeleteAuditId).get()
      )).toEqual(parentDeleteAuditBeforeReplay);

      const missing = await readServerParentNeedForOwner({
        authenticatedUserId: parentOwner,
        collection: collections.parentNeeds,
        id: `${runId}-missing`
      });
      const nonOwner = await readServerParentNeedForOwner({
        authenticatedUserId: outsider,
        collection: collections.parentNeeds,
        id: parentId
      });
      expect(missing.ok).toBe(false);
      expect(nonOwner.ok).toBe(false);
      if (!missing.ok && !nonOwner.ok) {
        expect(nonOwner.status).toBe(404);
        expect(nonOwner.errors.request).toBe(missing.errors.request);
      }
      const versionConflict = await updateServerParentNeed({
        authenticatedUserId: parentOwner,
        expectedVersion: 3,
        id: parentId,
        input: parentInput,
        runTransaction: parentTransaction
      });
      expect(!versionConflict.ok && versionConflict.status === 409).toBe(true);

      await collections.parentNeeds.doc(legacyParentId).set({
        ...parentInput,
        budgetMin: 80,
        budgetMax: 120,
        id: legacyParentId,
        ownerUserId: parentOwner,
        status: "published",
        createdAt: isoAfter(startedAt, 11_000)
      });
      const legacy = await readServerParentNeedForOwner({
        authenticatedUserId: parentOwner,
        collection: collections.parentNeeds,
        id: legacyParentId
      });
      expect(legacy.ok && legacy.value.managementState === "legacy-readonly").toBe(true);
      const legacyDelete = await deleteServerParentNeed({
        authenticatedUserId: parentOwner,
        expectedVersion: 0,
        id: legacyParentId,
        idempotencyKey: `${runId}-legacy-delete`,
        runTransaction: parentTransaction
      });
      expect(!legacyDelete.ok && legacyDelete.status === 409).toBe(true);

      const tutorConversationResult = await createOrReadServerConversationFromSource({
        authenticatedUserId: parentOwner,
        conversationsCollection: collections.conversations,
        messagesCollection: collections.messages,
        now: isoAfter(startedAt, 12_000),
        parentNeedsCollection: collections.parentNeeds,
        sourceId: tutorId,
        sourceType: "tutor-profile",
        tutorProfilesCollection: collections.tutorProfiles
      });
      if (!tutorConversationResult.ok) throw new Error("TUTOR_CONVERSATION_CREATE_FAILED");
      const tutorConversationId = tutorConversationResult.value.id;
      tracked.conversations.push(tutorConversationId);

      const tutorRequest = await createServerContactExchangeRequest({
        authenticatedUserId: parentOwner,
        contactProfilesCollection: collections.contactProfiles,
        conversationId: tutorConversationId,
        conversationsCollection: collections.conversations,
        now: isoAfter(startedAt, 13_000),
        parentNeedsCollection: collections.parentNeeds,
        requestsCollection: collections.requests,
        tutorProfilesCollection: collections.tutorProfiles
      });
      if (!tutorRequest.ok) throw new Error("TUTOR_CONTACT_REQUEST_CREATE_FAILED");
      tracked.requests.push(tutorRequest.value.id);

      tracked.audit.push(`tutor-profile-${tutorId}-update-v2`);
      const tutorUpdated = await updateServerTutorProfile({
        authenticatedUserId: tutorOwner,
        expectedVersion: 1,
        id: tutorId,
        input: { ...tutorInput, abilityDescription: `updated-${runId}` },
        now: isoAfter(startedAt, 14_000),
        runTransaction: tutorTransaction
      });
      if (!tutorUpdated.ok) throw new Error("TUTOR_UPDATE_FAILED");
      const tutorConversationAfterEdit = firstReturnedDocument(
        await collections.conversations.doc(tutorConversationId).get()
      );
      const tutorRequestAfterEdit = firstReturnedDocument(
        await collections.requests.doc(tutorRequest.value.id).get()
      );
      expect(tutorConversationAfterEdit?.sourceStatus).toBe("published");
      expect(tutorConversationAfterEdit?.sourceVersion).toBe(2);
      expect(tutorRequestAfterEdit?.sourceStatus).toBe("published");
      expect(tutorRequestAfterEdit?.sourceVersion).toBe(2);

      const tutorMessage = await sendServerConversationMessage({
        authenticatedUserId: parentOwner,
        conversationId: tutorConversationId,
        conversationsCollection: collections.conversations,
        messagesCollection: collections.messages,
        now: isoAfter(startedAt, 15_000),
        parentNeedsCollection: collections.parentNeeds,
        text: `tutor-integration-message-${runId}`,
        tutorProfilesCollection: collections.tutorProfiles
      });
      if (!tutorMessage.ok) throw new Error("TUTOR_MESSAGE_AFTER_EDIT_FAILED");
      tracked.messages.push(tutorMessage.value.id);

      const tutorApproved = await approveServerContactExchangeRequest({
        authenticatedUserId: tutorOwner,
        contactProfilesCollection: collections.contactProfiles,
        conversationsCollection: collections.conversations,
        now: isoAfter(startedAt, 16_000),
        parentNeedsCollection: collections.parentNeeds,
        requestId: tutorRequest.value.id,
        requestsCollection: collections.requests,
        secondConfirmation: true,
        tutorProfilesCollection: collections.tutorProfiles
      });
      expect(tutorApproved.ok).toBe(true);
      const tutorParticipantContactsBeforeDelete = await readServerAuthorizedContactProfiles({
        authenticatedUserId: parentOwner,
        contactProfilesCollection: collections.contactProfiles,
        conversationId: tutorConversationId,
        conversationsCollection: collections.conversations,
        parentNeedsCollection: collections.parentNeeds,
        requestsCollection: collections.requests,
        tutorProfilesCollection: collections.tutorProfiles
      });
      expect(tutorParticipantContactsBeforeDelete).toMatchObject({
        ok: true,
        value: {
          currentUser: { phone: "13800138000" },
          otherUser: { phone: "13700137000" }
        }
      });

      const tutorPendingRequest = await createServerContactExchangeRequest({
        authenticatedUserId: tutorOwner,
        contactProfilesCollection: collections.contactProfiles,
        conversationId: tutorConversationId,
        conversationsCollection: collections.conversations,
        now: isoAfter(startedAt, 17_000),
        parentNeedsCollection: collections.parentNeeds,
        requestsCollection: collections.requests,
        tutorProfilesCollection: collections.tutorProfiles
      });
      if (!tutorPendingRequest.ok) throw new Error("TUTOR_PENDING_REQUEST_CREATE_FAILED");
      tracked.requests.push(tutorPendingRequest.value.id);

      const tutorDeleteKey = `${runId}-tutor-delete`;
      const tutorDeleteAuditId = `tutor-profile-${tutorId}-delete-v3`;
      tracked.audit.push(tutorDeleteAuditId);
      const tutorDeleted = await deleteServerTutorProfile({
        authenticatedUserId: tutorOwner,
        expectedVersion: 2,
        id: tutorId,
        idempotencyKey: tutorDeleteKey,
        now: isoAfter(startedAt, 18_000),
        runTransaction: tutorTransaction
      });
      if (!tutorDeleted.ok) throw new Error("TUTOR_DELETE_FAILED");
      expect(
        (await findPublicServerTutorProfileById({
          collection: collections.tutorProfiles,
          id: tutorId
        })).value
      ).toBeNull();
      const tutorHistoricalMessages = await listServerConversationMessages({
        authenticatedUserId: tutorOwner,
        conversationId: tutorConversationId,
        conversationsCollection: collections.conversations,
        messagesCollection: collections.messages,
        parentNeedsCollection: collections.parentNeeds,
        tutorProfilesCollection: collections.tutorProfiles
      });
      expect(tutorHistoricalMessages.ok && tutorHistoricalMessages.value.length === 1).toBe(true);
      expect((await sendServerConversationMessage({
        authenticatedUserId: tutorOwner,
        conversationId: tutorConversationId,
        conversationsCollection: collections.conversations,
        messagesCollection: collections.messages,
        parentNeedsCollection: collections.parentNeeds,
        text: `tutor-blocked-${runId}`,
        tutorProfilesCollection: collections.tutorProfiles
      })).ok).toBe(false);
      expect((await createServerContactExchangeRequest({
        authenticatedUserId: tutorOwner,
        contactProfilesCollection: collections.contactProfiles,
        conversationId: tutorConversationId,
        conversationsCollection: collections.conversations,
        parentNeedsCollection: collections.parentNeeds,
        requestsCollection: collections.requests,
        tutorProfilesCollection: collections.tutorProfiles
      })).ok).toBe(false);
      expect((await approveServerContactExchangeRequest({
        authenticatedUserId: parentOwner,
        contactProfilesCollection: collections.contactProfiles,
        conversationsCollection: collections.conversations,
        parentNeedsCollection: collections.parentNeeds,
        requestId: tutorPendingRequest.value.id,
        requestsCollection: collections.requests,
        secondConfirmation: true,
        tutorProfilesCollection: collections.tutorProfiles
      })).ok).toBe(false);
      expect((await rejectServerContactExchangeRequest({
        authenticatedUserId: parentOwner,
        contactProfilesCollection: collections.contactProfiles,
        conversationsCollection: collections.conversations,
        parentNeedsCollection: collections.parentNeeds,
        requestId: tutorPendingRequest.value.id,
        requestsCollection: collections.requests,
        tutorProfilesCollection: collections.tutorProfiles
      })).ok).toBe(false);
      expect((await withdrawServerContactExchangeRequest({
        authenticatedUserId: tutorOwner,
        contactProfilesCollection: collections.contactProfiles,
        conversationsCollection: collections.conversations,
        parentNeedsCollection: collections.parentNeeds,
        requestId: tutorPendingRequest.value.id,
        requestsCollection: collections.requests,
        tutorProfilesCollection: collections.tutorProfiles
      })).ok).toBe(false);
      const tutorParticipantContactsWhileDeleted = await readServerAuthorizedContactProfiles({
        authenticatedUserId: parentOwner,
        contactProfilesCollection: collections.contactProfiles,
        conversationId: tutorConversationId,
        conversationsCollection: collections.conversations,
        parentNeedsCollection: collections.parentNeeds,
        requestsCollection: collections.requests,
        tutorProfilesCollection: collections.tutorProfiles
      });
      expect(tutorParticipantContactsWhileDeleted).toEqual({
        ok: true,
        value: null,
        errors: {}
      });

      tracked.audit.push(`tutor-profile-${tutorId}-restore-v4`);
      const tutorRestored = await restoreServerTutorProfile({
        authenticatedUserId: tutorOwner,
        expectedVersion: 3,
        id: tutorId,
        idempotencyKey: `${runId}-tutor-restore`,
        now: isoAfter(startedAt, 19_000),
        runTransaction: tutorTransaction
      });
      if (!tutorRestored.ok) throw new Error("TUTOR_RESTORE_FAILED");
      const tutorAfterRestore = await readServerConversationForUser({
        authenticatedUserId: tutorOwner,
        conversationId: tutorConversationId,
        conversationsCollection: collections.conversations,
        messagesCollection: collections.messages,
        parentNeedsCollection: collections.parentNeeds,
        tutorProfilesCollection: collections.tutorProfiles
      });
      expect(tutorAfterRestore.ok && tutorAfterRestore.value?.readOnly === false).toBe(true);
      const tutorParticipantContactsAfterRestore = await readServerAuthorizedContactProfiles({
        authenticatedUserId: parentOwner,
        contactProfilesCollection: collections.contactProfiles,
        conversationId: tutorConversationId,
        conversationsCollection: collections.conversations,
        parentNeedsCollection: collections.parentNeeds,
        requestsCollection: collections.requests,
        tutorProfilesCollection: collections.tutorProfiles
      });
      expect(tutorParticipantContactsAfterRestore).toMatchObject({
        ok: true,
        value: {
          currentUser: { phone: "13800138000" },
          otherUser: { phone: "13700137000" }
        }
      });
      const tutorRestoredMessage = await sendServerConversationMessage({
        authenticatedUserId: tutorOwner,
        conversationId: tutorConversationId,
        conversationsCollection: collections.conversations,
        messagesCollection: collections.messages,
        now: isoAfter(startedAt, 20_000),
        parentNeedsCollection: collections.parentNeeds,
        text: `tutor-restored-message-${runId}`,
        tutorProfilesCollection: collections.tutorProfiles
      });
      if (!tutorRestoredMessage.ok) throw new Error("TUTOR_MESSAGE_AFTER_RESTORE_FAILED");
      tracked.messages.push(tutorRestoredMessage.value.id);

      tracked.audit.push(`tutor-profile-${tutorId}-update-v5`);
      const tutorEditedAfterRestore = await updateServerTutorProfile({
        authenticatedUserId: tutorOwner,
        expectedVersion: 4,
        id: tutorId,
        input: { ...tutorInput, abilityDescription: `post-restore-edit-${runId}` },
        now: isoAfter(startedAt, 20_500),
        runTransaction: tutorTransaction
      });
      if (!tutorEditedAfterRestore.ok) {
        throw new Error("TUTOR_POST_RESTORE_UPDATE_FAILED");
      }

      const tutorDeleteAuditBeforeReplay = firstReturnedDocument(
        await collections.audit.doc(tutorDeleteAuditId).get()
      );
      const replayedTutorDelete = await deleteServerTutorProfile({
        authenticatedUserId: tutorOwner,
        expectedVersion: 2,
        id: tutorId,
        idempotencyKey: tutorDeleteKey,
        now: isoAfter(startedAt, 21_000),
        runTransaction: tutorTransaction
      });
      expect(replayedTutorDelete).toMatchObject({
        ok: true,
        value: { status: "deleted", version: 3 }
      });
      const tutorAfterReplay = await readServerTutorProfileForOwner({
        authenticatedUserId: tutorOwner,
        collection: collections.tutorProfiles,
        id: tutorId
      });
      expect(tutorAfterReplay).toMatchObject({
        ok: true,
        value: { status: "published", version: 5 }
      });
      expect(firstReturnedDocument(
        await collections.audit.doc(tutorDeleteAuditId).get()
      )).toEqual(tutorDeleteAuditBeforeReplay);

      const tutorMissing = await readServerTutorProfileForOwner({
        authenticatedUserId: tutorOwner,
        collection: collections.tutorProfiles,
        id: `${runId}-missing-tutor`
      });
      const tutorNonOwner = await readServerTutorProfileForOwner({
        authenticatedUserId: outsider,
        collection: collections.tutorProfiles,
        id: tutorId
      });
      const tutorUnauthenticated = await readServerTutorProfileForOwner({
        authenticatedUserId: "",
        collection: collections.tutorProfiles,
        id: tutorId
      });
      expect(tutorMissing.ok).toBe(false);
      expect(tutorNonOwner.ok).toBe(false);
      if (!tutorMissing.ok && !tutorNonOwner.ok) {
        expect(tutorMissing.status).toBe(404);
        expect(tutorMissing.code).toBe("NOT_FOUND");
        expect(tutorNonOwner.status).toBe(404);
        expect(tutorNonOwner.code).toBe("NOT_FOUND");
        expect(tutorNonOwner.errors.request).toBe(tutorMissing.errors.request);
      }
      expect(!tutorUnauthenticated.ok && tutorUnauthenticated.status === 401).toBe(true);
      const tutorVersionConflict = await updateServerTutorProfile({
        authenticatedUserId: tutorOwner,
        expectedVersion: 4,
        id: tutorId,
        input: tutorInput,
        runTransaction: tutorTransaction
      });
      expect(!tutorVersionConflict.ok && tutorVersionConflict.status === 409).toBe(true);

      const legacyTutorFixtureTime = isoAfter(startedAt, 22_000);
      await collections.tutorProfiles.doc(legacyTutorId).set({
        ...tutorInput,
        feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
        id: legacyTutorId,
        ownerUserId: tutorOwner,
        status: "published",
        createdAt: legacyTutorFixtureTime,
        updatedAt: legacyTutorFixtureTime,
        version: 1,
        deletedAt: null,
        deletedByUserId: null
      });
      const legacyTutorConversationResult = await createOrReadServerConversationFromSource({
        authenticatedUserId: parentOwner,
        conversationsCollection: collections.conversations,
        messagesCollection: collections.messages,
        now: isoAfter(startedAt, 22_100),
        parentNeedsCollection: collections.parentNeeds,
        sourceId: legacyTutorId,
        sourceType: "tutor-profile",
        tutorProfilesCollection: collections.tutorProfiles
      });
      if (!legacyTutorConversationResult.ok) {
        throw new Error("LEGACY_TUTOR_CONVERSATION_CREATE_FAILED");
      }
      const legacyTutorConversationId = legacyTutorConversationResult.value.id;
      tracked.conversations.push(legacyTutorConversationId);
      const legacyTutorRequest = await createServerContactExchangeRequest({
        authenticatedUserId: parentOwner,
        contactProfilesCollection: collections.contactProfiles,
        conversationId: legacyTutorConversationId,
        conversationsCollection: collections.conversations,
        now: isoAfter(startedAt, 22_200),
        parentNeedsCollection: collections.parentNeeds,
        requestsCollection: collections.requests,
        tutorProfilesCollection: collections.tutorProfiles
      });
      if (!legacyTutorRequest.ok) {
        throw new Error("LEGACY_TUTOR_CONTACT_REQUEST_CREATE_FAILED");
      }
      tracked.requests.push(legacyTutorRequest.value.id);
      const legacyTutorApproved = await approveServerContactExchangeRequest({
        authenticatedUserId: tutorOwner,
        contactProfilesCollection: collections.contactProfiles,
        conversationsCollection: collections.conversations,
        now: isoAfter(startedAt, 22_300),
        parentNeedsCollection: collections.parentNeeds,
        requestId: legacyTutorRequest.value.id,
        requestsCollection: collections.requests,
        secondConfirmation: true,
        tutorProfilesCollection: collections.tutorProfiles
      });
      if (!legacyTutorApproved.ok) {
        throw new Error("LEGACY_TUTOR_CONTACT_REQUEST_APPROVE_FAILED");
      }
      const legacyTutorMessage = await sendServerConversationMessage({
        authenticatedUserId: parentOwner,
        conversationId: legacyTutorConversationId,
        conversationsCollection: collections.conversations,
        messagesCollection: collections.messages,
        now: isoAfter(startedAt, 22_400),
        parentNeedsCollection: collections.parentNeeds,
        text: `legacy-tutor-message-${runId}`,
        tutorProfilesCollection: collections.tutorProfiles
      });
      if (!legacyTutorMessage.ok) {
        throw new Error("LEGACY_TUTOR_MESSAGE_CREATE_FAILED");
      }
      tracked.messages.push(legacyTutorMessage.value.id);
      const legacyConversationBeforeIsolation = firstReturnedDocument(
        await collections.conversations.doc(legacyTutorConversationId).get()
      );
      const legacyRequestBeforeIsolation = firstReturnedDocument(
        await collections.requests.doc(legacyTutorRequest.value.id).get()
      );

      await collections.tutorProfiles.doc(legacyTutorId).set({
        ...tutorInput,
        feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
        id: legacyTutorId,
        ownerUserId: tutorOwner,
        status: "published",
        createdAt: legacyTutorFixtureTime
      });
      const legacyTutor = await readServerTutorProfileForOwner({
        authenticatedUserId: tutorOwner,
        collection: collections.tutorProfiles,
        id: legacyTutorId
      });
      expect(
        legacyTutor.ok && legacyTutor.value.managementState === "legacy-readonly"
      ).toBe(true);
      const legacyTutorMessages = await listServerConversationMessages({
        authenticatedUserId: tutorOwner,
        conversationId: legacyTutorConversationId,
        conversationsCollection: collections.conversations,
        messagesCollection: collections.messages,
        parentNeedsCollection: collections.parentNeeds,
        tutorProfilesCollection: collections.tutorProfiles
      });
      expect(legacyTutorMessages).toMatchObject({
        ok: true,
        value: [{ id: legacyTutorMessage.value.id }]
      });
      const legacyTutorAuthorizedProfiles = await readServerAuthorizedContactProfiles({
        authenticatedUserId: parentOwner,
        contactProfilesCollection: collections.contactProfiles,
        conversationId: legacyTutorConversationId,
        conversationsCollection: collections.conversations,
        parentNeedsCollection: collections.parentNeeds,
        requestsCollection: collections.requests,
        tutorProfilesCollection: collections.tutorProfiles
      });
      expect(
        legacyTutorAuthorizedProfiles.ok &&
        legacyTutorAuthorizedProfiles.value !== null
      ).toBe(true);
      const legacyConversationAfterIsolation = firstReturnedDocument(
        await collections.conversations.doc(legacyTutorConversationId).get()
      );
      const legacyRequestAfterIsolation = firstReturnedDocument(
        await collections.requests.doc(legacyTutorRequest.value.id).get()
      );
      expect(legacyConversationAfterIsolation?.id).toBe(legacyTutorConversationId);
      expect(legacyConversationAfterIsolation?.participantUserIds).toEqual(
        expect.arrayContaining([parentOwner, tutorOwner])
      );
      expect(legacyConversationAfterIsolation?.sourceId).toBe(legacyTutorId);
      expect(legacyConversationAfterIsolation?.sourceType).toBe("tutor-profile");
      expect(legacyRequestAfterIsolation?.conversationId).toBe(
        legacyTutorConversationId
      );
      expect(legacyRequestAfterIsolation?.id).toBe(legacyTutorRequest.value.id);
      expect(legacyRequestAfterIsolation?.receiverUserId).toBe(tutorOwner);
      expect(legacyRequestAfterIsolation?.requesterUserId).toBe(parentOwner);
      expect(legacyRequestAfterIsolation?.status).toBe("approved");
      expect(legacyConversationAfterIsolation).toEqual(legacyConversationBeforeIsolation);
      expect(legacyRequestAfterIsolation).toEqual(legacyRequestBeforeIsolation);
      const legacyTutorUpdate = await updateServerTutorProfile({
        authenticatedUserId: tutorOwner,
        expectedVersion: 0,
        id: legacyTutorId,
        input: tutorInput,
        runTransaction: tutorTransaction
      });
      expect(legacyTutorUpdate).toMatchObject({
        ok: false,
        status: 409,
        code: "LEGACY_READ_ONLY"
      });
      const legacyTutorDelete = await deleteServerTutorProfile({
        authenticatedUserId: tutorOwner,
        expectedVersion: 0,
        id: legacyTutorId,
        idempotencyKey: `${runId}-legacy-tutor-delete`,
        runTransaction: tutorTransaction
      });
      expect(legacyTutorDelete).toMatchObject({
        ok: false,
        status: 409,
        code: "LEGACY_READ_ONLY"
      });
      const legacyTutorRestore = await restoreServerTutorProfile({
        authenticatedUserId: tutorOwner,
        expectedVersion: 0,
        id: legacyTutorId,
        idempotencyKey: `${runId}-legacy-tutor-restore`,
        runTransaction: tutorTransaction
      });
      expect(legacyTutorRestore).toMatchObject({
        ok: false,
        status: 409,
        code: "LEGACY_READ_ONLY"
      });

      const expiredTutorOwner = `${runId}-expired-tutor-owner`;
      const expiredTutor = await saveServerTutorProfile({
        authenticatedUserId: expiredTutorOwner,
        collection: collections.tutorProfiles,
        input: { ...tutorInput, school: `expired-${runId}` },
        now: isoAfter(startedAt, 23_000),
        runTransaction: tutorTransaction
      });
      if (!expiredTutor.ok) throw new Error("EXPIRED_TUTOR_CREATE_FAILED");
      tracked.tutorProfiles.push(expiredTutor.value.id);
      tracked.audit.push(`tutor-profile-${expiredTutor.value.id}-create-v1`);
      const expiredTutorDeleteTime = new Date(startedAt.getTime() + 24_000);
      const expiredTutorDelete = await deleteServerTutorProfile({
        authenticatedUserId: expiredTutorOwner,
        expectedVersion: 1,
        id: expiredTutor.value.id,
        idempotencyKey: `${runId}-expired-tutor-delete`,
        now: expiredTutorDeleteTime.toISOString(),
        runTransaction: tutorTransaction
      });
      if (!expiredTutorDelete.ok) throw new Error("EXPIRED_TUTOR_DELETE_FAILED");
      tracked.audit.push(`tutor-profile-${expiredTutor.value.id}-delete-v2`);
      const expiredTutorRestore = await restoreServerTutorProfile({
        authenticatedUserId: expiredTutorOwner,
        expectedVersion: 2,
        id: expiredTutor.value.id,
        idempotencyKey: `${runId}-expired-tutor-restore`,
        now: new Date(expiredTutorDeleteTime.getTime() + 48 * 60 * 60 * 1000).toISOString(),
        runTransaction: tutorTransaction
      });
      expect(
        !expiredTutorRestore.ok &&
        expiredTutorRestore.status === 409 &&
        expiredTutorRestore.code === "RECOVERY_EXPIRED"
      ).toBe(true);

      const auditResults = await Promise.all(
        tracked.audit.map((id) => collections.audit.doc(id).get())
      );
      expect(auditResults.every(hasReturnedDocument)).toBe(true);
      const auditText = JSON.stringify(auditResults.map(firstReturnedDocument));
      expect(auditText.includes("childIntro")).toBe(false);
      expect(auditText.includes("phone")).toBe(false);
      expect(auditText.includes("wechat")).toBe(false);
      expect(auditText.includes(parentInput.childIntro)).toBe(false);

      const rollbackAuditId = `parent-need-${parentId}-update-v6`;
      tracked.audit.push(rollbackAuditId);
      let injectedFailureObserved = false;
      try {
        await updateServerParentNeed({
          authenticatedUserId: parentOwner,
          expectedVersion: 5,
          id: parentId,
          input: { ...parentInput, childIntro: `rollback-${runId}` },
          now: isoAfter(startedAt, 15_000),
          runTransaction: (operation) =>
            database.runTransaction((transaction: TransactionLike) => {
              const transactionAudit = transaction.collection(AUDIT_COLLECTION);
              return operation({
                auditCollection: {
                  doc: (id: string) => ({
                    get: () => transactionAudit.doc(id).get(),
                    set: async (data: Record<string, unknown>) => {
                      await transactionAudit.doc(id).set(data);
                      throw new Error("ISSUE0033_INJECTED_TRANSACTION_FAILURE");
                    }
                  })
                },
                contactExchangeRequestsCollection: transaction.collection(
                  CONTACT_EXCHANGE_REQUESTS_COLLECTION
                ),
                conversationsCollection: transaction.collection(CONVERSATIONS_COLLECTION),
                sourceCollection: transaction.collection(PARENT_NEEDS_COLLECTION)
              });
            })
        });
      } catch {
        injectedFailureObserved = true;
      }
      expect(injectedFailureObserved).toBe(true);
      const parentAfterRollback = await readServerParentNeedForOwner({
        authenticatedUserId: parentOwner,
        collection: collections.parentNeeds,
        id: parentId
      });
      expect(parentAfterRollback.ok && parentAfterRollback.value.version === 5).toBe(true);
      const conversationAfterRollback = firstReturnedDocument(
        await collections.conversations.doc(conversationId).get()
      );
      const requestAfterRollback = firstReturnedDocument(
        await collections.requests.doc(pendingRequest.value.id).get()
      );
      expect(conversationAfterRollback?.sourceVersion).toBe(5);
      expect(requestAfterRollback?.sourceVersion).toBe(5);
      expect(hasReturnedDocument(await collections.audit.doc(rollbackAuditId).get())).toBe(false);

      const tutorRollbackAuditId = `tutor-profile-${tutorId}-update-v6`;
      tracked.audit.push(tutorRollbackAuditId);
      let tutorInjectedFailureObserved = false;
      try {
        await updateServerTutorProfile({
          authenticatedUserId: tutorOwner,
          expectedVersion: 5,
          id: tutorId,
          input: {
            ...tutorInput,
            abilityDescription: `tutor-rollback-${runId}`
          },
          now: isoAfter(startedAt, 26_000),
          runTransaction: (operation) =>
            database.runTransaction((transaction: TransactionLike) => {
              const transactionAudit = transaction.collection(AUDIT_COLLECTION);
              return operation({
                auditCollection: {
                  doc: (id: string) => ({
                    get: () => transactionAudit.doc(id).get(),
                    set: async (data: Record<string, unknown>) => {
                      await transactionAudit.doc(id).set(data);
                      throw new Error("ISSUE0033_INJECTED_TUTOR_TRANSACTION_FAILURE");
                    }
                  })
                },
                contactExchangeRequestsCollection: transaction.collection(
                  CONTACT_EXCHANGE_REQUESTS_COLLECTION
                ),
                conversationsCollection: transaction.collection(CONVERSATIONS_COLLECTION),
                sourceCollection: transaction.collection(TUTOR_PROFILES_COLLECTION)
              });
            })
        });
      } catch {
        tutorInjectedFailureObserved = true;
      }
      expect(tutorInjectedFailureObserved).toBe(true);
      const tutorAfterRollback = await readServerTutorProfileForOwner({
        authenticatedUserId: tutorOwner,
        collection: collections.tutorProfiles,
        id: tutorId
      });
      expect(tutorAfterRollback.ok && tutorAfterRollback.value.version === 5).toBe(true);
      const tutorConversationAfterRollback = firstReturnedDocument(
        await collections.conversations.doc(tutorConversationId).get()
      );
      const tutorRequestAfterRollback = firstReturnedDocument(
        await collections.requests.doc(tutorPendingRequest.value.id).get()
      );
      expect(tutorConversationAfterRollback?.sourceVersion).toBe(5);
      expect(tutorRequestAfterRollback?.sourceVersion).toBe(5);
      expect(
        hasReturnedDocument(await collections.audit.doc(tutorRollbackAuditId).get())
      ).toBe(false);

      console.log("ISSUE0033_CLOUDBASE_ASSERTIONS=PASS");
    } catch (error) {
      primaryError = error;
    } finally {
      if (!authenticationPreflightPassed) {
        console.log("ISSUE0033_CLOUDBASE_CLEANUP_SKIPPED reason=AUTH_PRECHECK_FAILED writesAttempted=0");
      } else {
        try {
          const beforeCleanup = await countExactDocuments();
          console.log(`ISSUE0033_CLOUDBASE_BEFORE_CLEANUP ${JSON.stringify(beforeCleanup)}`);
          await cleanup();
          const afterCleanup = await countExactDocuments();
          console.log(`ISSUE0033_CLOUDBASE_AFTER_CLEANUP ${JSON.stringify(afterCleanup)}`);
          expect(Object.values(afterCleanup).every((count) => count === 0)).toBe(true);
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.startsWith("ISSUE0033_CLEANUP_FAILED")
          ) {
            throw error;
          }
          throw new Error(`ISSUE0033_CLEANUP_EVIDENCE_FAILED testId=${runId}`);
        }
      }
    }

    if (primaryError) {
      const rawMessage = primaryError instanceof Error
        ? primaryError.message
        : "UNKNOWN_INTEGRATION_FAILURE";
      const redactedMessage = redactSensitiveMessage(rawMessage, sensitiveValues);
      throw new Error(`ISSUE0033_CLOUDBASE_INTEGRATION_FAILED:${redactedMessage}`);
    }
  }, 180_000);
});
