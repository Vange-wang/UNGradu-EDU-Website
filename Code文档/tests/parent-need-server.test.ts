import { describe, expect, it } from "vitest";

import { createServerContactExchangeRequest } from "@/server/contact-exchange";
import { readServerConversationForUser } from "@/server/conversations";

import {
  deleteServerParentNeed,
  filterServerParentNeeds,
  findPublicServerParentNeedById,
  listPublicServerParentNeeds,
  listServerParentNeedsForOwner,
  restoreServerParentNeed,
  saveServerParentNeed,
  updateServerParentNeed
} from "@/server/parent-needs";

type StoredDocument = Record<string, unknown>;

const validInput = {
  teacherGenderPreference: "不限",
  subjects: ["数学"],
  grade: "初一",
  budgetMin: "80",
  budgetMax: "120",
  timeSlots: ["周六下午"],
  region: {
    province: "广东省",
    city: "东莞市",
    district: "松山湖"
  },
  community: "松山湖大学城",
  childIntro: "基础中等，需要巩固计算习惯。"
};

function createFakeCollection(
  initialValues: Record<string, StoredDocument> = {},
  documentReadShape: "array" | "object" = "array",
  rejectImmutableIdWrites = false
) {
  const documents = new Map(Object.entries(initialValues));

  return {
    documents,
    collection: {
      doc(docId: string) {
        return {
          async get() {
            const data = documents.get(docId);
            const document = data ? { ...data, id: docId } : undefined;
            const returnedData = documentReadShape === "object"
              ? document
              : document
                ? [document]
                : [];
            return { data: returnedData as StoredDocument[] };
          },
          async set(data: StoredDocument) {
            if (rejectImmutableIdWrites && "_id" in data) {
              throw new Error("CLOUDBASE_IMMUTABLE_ID_WRITE");
            }
            documents.set(docId, data);
            return { updated: 1 };
          }
        };
      },
      where(query: Record<string, unknown>) {
        const state = {
          limit: undefined as number | undefined,
          orderBy: undefined as { direction: "asc" | "desc"; field: string } | undefined,
          skip: 0
        };
        const chain = {
          orderBy(field: string, direction: "asc" | "desc") {
            state.orderBy = { direction, field };
            return chain;
          },
          skip(value: number) {
            state.skip = value;
            return chain;
          },
          limit(value: number) {
            state.limit = value;
            return chain;
          },
          async get() {
            let rows = Array.from(documents.entries())
              .filter(([, document]) =>
                Object.entries(query).every(([key, value]) => document[key] === value)
              )
              .map(([id, document]) => ({ ...document, id }));

            if (state.orderBy) {
              rows = rows.sort((left, right) => {
                const leftDocument = left as Record<string, unknown>;
                const rightDocument = right as Record<string, unknown>;
                const leftValue = String(leftDocument[state.orderBy?.field ?? ""] ?? "");
                const rightValue = String(rightDocument[state.orderBy?.field ?? ""] ?? "");
                const direction = state.orderBy?.direction === "asc" ? 1 : -1;
                return leftValue.localeCompare(rightValue) * direction;
              });
            }

            return {
              data: rows.slice(
                state.skip,
                state.skip + (state.limit ?? 100)
              )
            };
          }
        };

        return chain;
      }
    }
  };
}

function createLifecycleTransaction(
  sourceValues: Record<string, StoredDocument>,
  conversationValues: Record<string, StoredDocument> = {},
  requestValues: Record<string, StoredDocument> = {},
  sourceDocumentReadShape: "array" | "object" = "array",
  rejectRelatedImmutableIdWrites = false
) {
  const source = createFakeCollection(sourceValues, sourceDocumentReadShape);
  const conversations = createFakeCollection(
    conversationValues,
    "array",
    rejectRelatedImmutableIdWrites
  );
  const requests = createFakeCollection(
    requestValues,
    "array",
    rejectRelatedImmutableIdWrites
  );
  const audit = createFakeCollection();

  return {
    audit,
    conversations,
    requests,
    runTransaction: async <T,>(callback: (collections: {
      auditCollection: typeof audit.collection;
      contactExchangeRequestsCollection: typeof requests.collection;
      conversationsCollection: typeof conversations.collection;
      sourceCollection: typeof source.collection;
    }) => Promise<T>) => callback({
      auditCollection: audit.collection,
      contactExchangeRequestsCollection: requests.collection,
      conversationsCollection: conversations.collection,
      sourceCollection: source.collection
    }),
    source
  };
}

describe("server parent_needs interface", () => {
  it("saves a parent need to the current user's ownership", async () => {
    const lifecycle = createLifecycleTransaction({});

    const result = await saveServerParentNeed({
      authenticatedUserId: "parent-a",
      collection: lifecycle.source.collection,
      input: validInput,
      now: "2026-06-22T00:00:00.000Z",
      runTransaction: lifecycle.runTransaction
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ownerUserId: "parent-a",
        status: "published",
        budgetMin: 80,
        budgetMax: 120,
        createdAt: "2026-06-22T00:00:00.000Z",
        updatedAt: "2026-06-22T00:00:00.000Z",
        version: 1,
        managementState: "managed"
      }
    });
    expect(lifecycle.audit.documents.size).toBe(1);
    expect(JSON.stringify(Array.from(lifecycle.source.documents.values()))).toContain("parent-a");
  });

  it("lists only the current user's own parent needs", async () => {
    const fake = createFakeCollection({
      "need-a": {
        ...validInput,
        ownerUserId: "parent-a",
        budgetMin: 80,
        budgetMax: 120,
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      },
      "need-b": {
        ...validInput,
        ownerUserId: "parent-b",
        budgetMin: 80,
        budgetMax: 120,
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      }
    });

    await expect(
      listServerParentNeedsForOwner({
        authenticatedUserId: "parent-a",
        collection: fake.collection
      })
    ).resolves.toMatchObject({
      ok: true,
      value: [{ id: "need-a", ownerUserId: "parent-a" }]
    });
  });

  it("separates managed, deleted, and legacy records in the owner's list", async () => {
    const fake = createFakeCollection({
      "need-managed": {
        ...validInput,
        ownerUserId: "parent-a",
        budgetMin: 80,
        budgetMax: 120,
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z",
        updatedAt: "2026-06-22T01:00:00.000Z",
        version: 2
      },
      "need-deleted": {
        ...validInput,
        ownerUserId: "parent-a",
        budgetMin: 80,
        budgetMax: 120,
        status: "deleted",
        createdAt: "2026-06-21T00:00:00.000Z",
        updatedAt: "2026-06-22T02:00:00.000Z",
        deletedAt: "2026-06-22T02:00:00.000Z",
        deletedByUserId: "parent-a",
        version: 3
      },
      "need-legacy": {
        ...validInput,
        ownerUserId: "parent-a",
        budgetMin: 80,
        budgetMax: 120,
        status: "published",
        createdAt: "2026-06-20T00:00:00.000Z"
      }
    });

    const result = await listServerParentNeedsForOwner({
      authenticatedUserId: "parent-a",
      collection: fake.collection
    });

    expect(result).toMatchObject({
      ok: true,
      value: expect.arrayContaining([
        expect.objectContaining({
          id: "need-managed",
          managementState: "managed",
          status: "published",
          version: 2
        }),
        expect.objectContaining({
          id: "need-deleted",
          managementState: "managed",
          status: "deleted",
          version: 3
        }),
        expect.objectContaining({
          id: "need-legacy",
          managementState: "legacy-readonly",
          status: "published",
          version: 0
        })
      ])
    });
  });

  it("soft deletes and restores within 48 hours while updating related gates atomically", async () => {
    const lifecycle = createLifecycleTransaction(
      {
        "need-a": {
          ...validInput,
          ownerUserId: "parent-a",
          budgetMin: 80,
          budgetMax: 120,
          status: "published",
          createdAt: "2026-06-22T00:00:00.000Z",
          updatedAt: "2026-06-22T00:00:00.000Z",
          version: 1
        }
      },
      {
        "conversation-a": {
          id: "conversation-a",
          participantUserIds: ["parent-a", "tutor-a"],
          sourceId: "need-a",
          sourceKey: "parent-need:need-a",
          sourceType: "parent-need"
        }
      },
      {
        "exchange-a": {
          id: "exchange-a",
          conversationId: "conversation-a",
          status: "approved"
        }
      }
    );

    const deleted = await deleteServerParentNeed({
      authenticatedUserId: "parent-a",
      expectedVersion: 1,
      id: "need-a",
      idempotencyKey: "delete-need-a-1",
      now: "2026-06-22T01:00:00.000Z",
      runTransaction: lifecycle.runTransaction
    });

    expect(deleted).toMatchObject({
      ok: true,
      value: {
        deletedAt: "2026-06-22T01:00:00.000Z",
        managementState: "managed",
        status: "deleted",
        version: 2
      }
    });
    expect(lifecycle.conversations.documents.get("conversation-a")).toMatchObject({
      sourceStatus: "deleted",
      sourceVersion: 2
    });
    expect(lifecycle.requests.documents.get("exchange-a")).toMatchObject({
      sourceStatus: "deleted",
      sourceVersion: 2
    });
    expect(lifecycle.audit.documents.size).toBe(1);

    const restored = await restoreServerParentNeed({
      authenticatedUserId: "parent-a",
      expectedVersion: 2,
      id: "need-a",
      idempotencyKey: "restore-need-a-2",
      now: "2026-06-24T00:59:59.999Z",
      runTransaction: lifecycle.runTransaction
    });

    expect(restored).toMatchObject({
      ok: true,
      value: { deletedAt: null, status: "published", version: 3 }
    });
    expect(lifecycle.conversations.documents.get("conversation-a")).toMatchObject({
      sourceStatus: "published",
      sourceVersion: 3
    });
    expect(lifecycle.requests.documents.get("exchange-a")).toMatchObject({
      sourceStatus: "published",
      sourceVersion: 3
    });
    expect(lifecycle.audit.documents.size).toBe(2);

    const edited = await updateServerParentNeed({
      authenticatedUserId: "parent-a",
      expectedVersion: 3,
      id: "need-a",
      input: { ...validInput, childIntro: "恢复后的普通编辑仍保留幂等历史" },
      now: "2026-06-24T01:00:00.000Z",
      runTransaction: lifecycle.runTransaction
    });

    expect(edited).toMatchObject({ ok: true, value: { version: 4 } });
    expect(lifecycle.source.documents.get("need-a")).toMatchObject({
      lastMutationAction: "restore",
      lastMutationKey: "restore-need-a-2",
      mutationHistory: [
        { idempotencyKey: "delete-need-a-1", status: "deleted", version: 2 },
        { idempotencyKey: "restore-need-a-2", status: "published", version: 3 }
      ],
      status: "published",
      version: 4
    });
    expect(lifecycle.audit.documents.size).toBe(3);

    const replayedDelete = await deleteServerParentNeed({
      authenticatedUserId: "parent-a",
      expectedVersion: 1,
      id: "need-a",
      idempotencyKey: "delete-need-a-1",
      now: "2026-06-24T01:00:01.000Z",
      runTransaction: lifecycle.runTransaction
    });

    expect(replayedDelete).toMatchObject({
      ok: true,
      value: { status: "deleted", version: 2 }
    });
    expect(lifecycle.source.documents.get("need-a")).toMatchObject({
      status: "published",
      version: 4
    });
    expect(lifecycle.audit.documents.size).toBe(3);
  });

  it("keeps existing chat and contact exchange available after a versioned edit", async () => {
    const lifecycle = createLifecycleTransaction(
      {
        "need-a": {
          ...validInput,
          ownerUserId: "parent-a",
          budgetMin: 80,
          budgetMax: 120,
          status: "published",
          createdAt: "2026-06-22T00:00:00.000Z",
          updatedAt: "2026-06-22T00:00:00.000Z",
          version: 1
        }
      },
      {
        "conversation-a": {
          id: "conversation-a",
          participantUserIds: ["parent-a", "tutor-a"],
          sourceId: "need-a",
          sourceKey: "parent-need:need-a",
          sourceType: "parent-need",
          sourceStatus: "published",
          sourceVersion: 1,
          sourceUpdatedAt: "2026-06-22T00:00:00.000Z",
          createdAt: "2026-06-22T00:00:00.000Z"
        }
      },
      {
        "exchange-a": {
          id: "exchange-a",
          conversationId: "conversation-a",
          requesterUserId: "parent-a",
          receiverUserId: "tutor-a",
          status: "pending",
          secondConfirmedAt: null,
          sourceStatus: "published",
          sourceVersion: 1,
          sourceUpdatedAt: "2026-06-22T00:00:00.000Z",
          createdAt: "2026-06-22T00:00:00.000Z",
          updatedAt: "2026-06-22T00:00:00.000Z"
        }
      }
    );
    const emptyTutorProfiles = createFakeCollection();
    const contactProfiles = createFakeCollection();

    const updated = await updateServerParentNeed({
      authenticatedUserId: "parent-a",
      expectedVersion: 1,
      id: "need-a",
      input: { ...validInput, childIntro: "编辑后的孩子简介" },
      now: "2026-06-22T01:00:00.000Z",
      runTransaction: lifecycle.runTransaction
    });
    const conversation = await readServerConversationForUser({
      authenticatedUserId: "parent-a",
      conversationId: "conversation-a",
      conversationsCollection: lifecycle.conversations.collection,
      messagesCollection: createFakeCollection().collection,
      parentNeedsCollection: lifecycle.source.collection,
      tutorProfilesCollection: emptyTutorProfiles.collection
    });
    const exchange = await createServerContactExchangeRequest({
      authenticatedUserId: "parent-a",
      contactProfilesCollection: contactProfiles.collection,
      conversationId: "conversation-a",
      conversationsCollection: lifecycle.conversations.collection,
      parentNeedsCollection: lifecycle.source.collection,
      requestsCollection: lifecycle.requests.collection,
      tutorProfilesCollection: emptyTutorProfiles.collection
    });

    expect(updated).toMatchObject({ ok: true, value: { version: 2 } });
    expect(lifecycle.conversations.documents.get("conversation-a")).toMatchObject({
      sourceStatus: "published",
      sourceUpdatedAt: "2026-06-22T01:00:00.000Z",
      sourceVersion: 2
    });
    expect(lifecycle.requests.documents.get("exchange-a")).toMatchObject({
      sourceStatus: "published",
      sourceUpdatedAt: "2026-06-22T01:00:00.000Z",
      sourceVersion: 2
    });
    expect(conversation).toMatchObject({
      ok: true,
      value: { readOnly: false, sourceStatus: "published" }
    });
    expect(exchange).toMatchObject({ ok: true, value: { status: "pending" } });
  });

  it("bounds lifecycle idempotency history to the latest 16 results", async () => {
    const lifecycle = createLifecycleTransaction({
      "need-a": {
        ...validInput,
        ownerUserId: "parent-a",
        budgetMin: 80,
        budgetMax: 120,
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z",
        updatedAt: "2026-06-22T00:00:00.000Z",
        version: 1
      }
    });
    const startedAt = new Date("2026-06-22T01:00:00.000Z");

    for (let index = 0; index < 16; index += 1) {
      const common = {
        authenticatedUserId: "parent-a",
        expectedVersion: index + 1,
        id: "need-a",
        idempotencyKey: `mutation-${String(index).padStart(2, "0")}-${index % 2 === 0 ? "delete" : "restore"}`,
        now: new Date(startedAt.getTime() + index * 60 * 60 * 1000).toISOString(),
        runTransaction: lifecycle.runTransaction
      };
      const result = index % 2 === 0
        ? await deleteServerParentNeed(common)
        : await restoreServerParentNeed(common);
      expect(result.ok).toBe(true);
    }

    const boundaryHistory = lifecycle.source.documents.get("need-a")?.mutationHistory as
      | Array<Record<string, unknown>>
      | undefined;
    expect(boundaryHistory).toHaveLength(16);
    expect(boundaryHistory?.[0]).toMatchObject({ idempotencyKey: "mutation-00-delete" });
    expect(boundaryHistory?.at(-1)).toMatchObject({ idempotencyKey: "mutation-15-restore" });

    const seventeenth = await deleteServerParentNeed({
      authenticatedUserId: "parent-a",
      expectedVersion: 17,
      id: "need-a",
      idempotencyKey: "mutation-16-delete",
      now: new Date(startedAt.getTime() + 16 * 60 * 60 * 1000).toISOString(),
      runTransaction: lifecycle.runTransaction
    });
    expect(seventeenth.ok).toBe(true);

    const evictedHistory = lifecycle.source.documents.get("need-a")?.mutationHistory as
      | Array<Record<string, unknown>>
      | undefined;
    expect(evictedHistory).toHaveLength(16);
    expect(evictedHistory?.some((entry) => entry.idempotencyKey === "mutation-00-delete")).toBe(false);
    expect(evictedHistory?.[0]).toMatchObject({ idempotencyKey: "mutation-01-restore" });
    expect(evictedHistory?.at(-1)).toMatchObject({ idempotencyKey: "mutation-16-delete" });

    await expect(deleteServerParentNeed({
      authenticatedUserId: "parent-a",
      expectedVersion: 1,
      id: "need-a",
      idempotencyKey: "mutation-00-delete",
      now: new Date(startedAt.getTime() + 17 * 60 * 60 * 1000).toISOString(),
      runTransaction: lifecycle.runTransaction
    })).resolves.toMatchObject({ ok: false, status: 409, code: "VERSION_CONFLICT" });
  });

  it("updates through the CloudBase transaction object document shape", async () => {
    const lifecycle = createLifecycleTransaction(
      {
        "need-a": {
          ...validInput,
          ownerUserId: "parent-a",
          budgetMin: 80,
          budgetMax: 120,
          status: "published",
          createdAt: "2026-06-22T00:00:00.000Z",
          updatedAt: "2026-06-22T00:00:00.000Z",
          version: 1
        }
      },
      {},
      {},
      "object"
    );

    const result = await updateServerParentNeed({
      authenticatedUserId: "parent-a",
      expectedVersion: 1,
      id: "need-a",
      input: { ...validInput, childIntro: "真实事务对象读取形状下的编辑" },
      now: "2026-06-22T01:00:00.000Z",
      runTransaction: lifecycle.runTransaction
    });

    expect(result).toMatchObject({ ok: true, value: { version: 2 } });
  });

  it("does not write CloudBase immutable ids while syncing related gates", async () => {
    const lifecycle = createLifecycleTransaction(
      {
        "need-a": {
          ...validInput,
          ownerUserId: "parent-a",
          budgetMin: 80,
          budgetMax: 120,
          status: "published",
          createdAt: "2026-06-22T00:00:00.000Z",
          updatedAt: "2026-06-22T00:00:00.000Z",
          version: 1
        }
      },
      {
        "conversation-a": {
          _id: "cloudbase-conversation-a",
          id: "conversation-a",
          participantUserIds: ["parent-a", "tutor-a"],
          sourceId: "need-a",
          sourceKey: "parent-need:need-a",
          sourceType: "parent-need"
        }
      },
      {
        "request-a": {
          _id: "cloudbase-request-a",
          id: "request-a",
          conversationId: "conversation-a",
          requesterUserId: "parent-a",
          status: "pending"
        }
      },
      "array",
      true
    );

    const result = await updateServerParentNeed({
      authenticatedUserId: "parent-a",
      expectedVersion: 1,
      id: "need-a",
      input: { ...validInput, childIntro: "同步关联状态时不回写不可变标识" },
      now: "2026-06-22T01:00:00.000Z",
      runTransaction: lifecycle.runTransaction
    });

    expect(result).toMatchObject({ ok: true, value: { version: 2 } });
    expect(lifecycle.conversations.documents.get("conversation-a")).toMatchObject({
      id: "conversation-a",
      participantUserIds: ["parent-a", "tutor-a"],
      sourceId: "need-a",
      sourceStatus: "published",
      sourceType: "parent-need",
      sourceVersion: 2
    });
    expect(lifecycle.requests.documents.get("request-a")).toMatchObject({
      id: "request-a",
      conversationId: "conversation-a",
      requesterUserId: "parent-a",
      sourceStatus: "published",
      sourceVersion: 2,
      status: "pending"
    });
  });

  it("rejects legacy, non-owner, version conflict, and expired recovery without duplicate audit", async () => {
    const lifecycle = createLifecycleTransaction({
      "need-a": {
        ...validInput,
        ownerUserId: "parent-a",
        budgetMin: 80,
        budgetMax: 120,
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z",
        updatedAt: "2026-06-22T00:00:00.000Z",
        version: 1
      },
      "legacy-a": {
        ...validInput,
        ownerUserId: "parent-a",
        budgetMin: 80,
        budgetMax: 120,
        status: "published",
        createdAt: "2026-06-20T00:00:00.000Z"
      }
    });

    await expect(deleteServerParentNeed({
      authenticatedUserId: "parent-a",
      expectedVersion: 0,
      id: "legacy-a",
      idempotencyKey: "delete-legacy-a",
      runTransaction: lifecycle.runTransaction
    })).resolves.toMatchObject({ ok: false, code: "LEGACY_READ_ONLY", status: 409 });

    const nonOwner = await deleteServerParentNeed({
      authenticatedUserId: "parent-b",
      expectedVersion: 1,
      id: "need-a",
      idempotencyKey: "delete-by-other",
      runTransaction: lifecycle.runTransaction
    });
    const missing = await deleteServerParentNeed({
      authenticatedUserId: "parent-b",
      expectedVersion: 1,
      id: "missing",
      idempotencyKey: "delete-missing-x",
      runTransaction: lifecycle.runTransaction
    });
    expect(nonOwner).toMatchObject({ ok: false, status: 404 });
    expect(missing).toMatchObject({ ok: false, status: 404 });
    expect(nonOwner.errors.request).toBe(missing.errors.request);

    const firstDelete = await deleteServerParentNeed({
      authenticatedUserId: "parent-a",
      expectedVersion: 1,
      id: "need-a",
      idempotencyKey: "delete-repeat-a",
      now: "2026-06-22T01:00:00.000Z",
      runTransaction: lifecycle.runTransaction
    });
    const repeatedDelete = await deleteServerParentNeed({
      authenticatedUserId: "parent-a",
      expectedVersion: 1,
      id: "need-a",
      idempotencyKey: "delete-repeat-a",
      now: "2026-06-22T01:01:00.000Z",
      runTransaction: lifecycle.runTransaction
    });
    expect(repeatedDelete).toEqual(firstDelete);
    expect(lifecycle.audit.documents.size).toBe(1);

    await expect(restoreServerParentNeed({
      authenticatedUserId: "parent-a",
      expectedVersion: 2,
      id: "need-a",
      idempotencyKey: "restore-expired-a",
      now: "2026-06-24T01:00:00.000Z",
      runTransaction: lifecycle.runTransaction
    })).resolves.toMatchObject({ ok: false, code: "RECOVERY_EXPIRED", status: 409 });
  });

  it("returns public list and detail without owner identifiers", async () => {
    const fake = createFakeCollection({
      "need-a": {
        ...validInput,
        ownerUserId: "parent-a",
        budgetMin: 80,
        budgetMax: 120,
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      }
    });

    const publicList = await listPublicServerParentNeeds({
      collection: fake.collection
    });
    const publicDetail = await findPublicServerParentNeedById({
      collection: fake.collection,
      id: "need-a"
    });

    expect(publicList).toMatchObject({
      ok: true,
      value: [{ id: "need-a", grade: "初一" }]
    });
    expect(publicDetail).toMatchObject({
      ok: true,
      value: { id: "need-a", grade: "初一" }
    });
    expect(JSON.stringify(publicList)).not.toContain("parent-a");
    expect(JSON.stringify(publicDetail)).not.toContain("parent-a");
    expect(publicDetail.ok && publicDetail.value).not.toHaveProperty("ownerUserId");
  });

  it("filters public parent needs by subject, grade, budget, and gender preference", async () => {
    const fake = createFakeCollection({
      "need-a": {
        ...validInput,
        ownerUserId: "parent-a",
        budgetMin: 80,
        budgetMax: 120,
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      },
      "need-b": {
        ...validInput,
        teacherGenderPreference: "女老师",
        subjects: ["英语"],
        grade: "高一",
        ownerUserId: "parent-b",
        budgetMin: 160,
        budgetMax: 220,
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      }
    });
    const publicList = await listPublicServerParentNeeds({
      collection: fake.collection
    });

    if (!publicList.ok) {
      throw new Error("expected public list");
    }

    const matched = filterServerParentNeeds(publicList.value, {
      budgetMax: "100",
      budgetMin: "90",
      grade: "初一",
      subject: "数学",
      teacherGenderPreference: "不限"
    });

    expect(matched).toHaveLength(1);
    expect(matched[0].id).toBe("need-a");
  });

  it("lists newly created public parent needs when the collection has many older documents", async () => {
    const oldNeeds = Object.fromEntries(
      Array.from({ length: 120 }, (_, index) => [
        `old-need-${index}`,
        {
          ...validInput,
          ownerUserId: `old-parent-${index}`,
          budgetMin: 80,
          budgetMax: 120,
          status: "published",
          createdAt: `2026-06-20T00:${String(index).padStart(2, "0")}:00.000Z`
        }
      ])
    );
    const fake = createFakeCollection({
      ...oldNeeds,
      "fresh-need": {
        ...validInput,
        ownerUserId: "fresh-parent",
        budgetMin: 80,
        budgetMax: 120,
        status: "published",
        createdAt: "2026-06-23T00:00:00.000Z"
      }
    });

    const publicList = await listPublicServerParentNeeds({
      collection: fake.collection,
      filters: { subject: "数学" }
    });

    expect(publicList).toMatchObject({
      ok: true,
      value: expect.arrayContaining([
        expect.objectContaining({ id: "fresh-need" })
      ])
    });
  });

  it("rejects missing authentication and invalid input", async () => {
    const fake = createFakeCollection();
    const lifecycle = createLifecycleTransaction({});

    await expect(
      saveServerParentNeed({
        authenticatedUserId: "",
        collection: fake.collection,
        input: validInput
      })
    ).resolves.toMatchObject({
      ok: false,
      code: "AUTH_REQUIRED",
      status: 401,
      errors: { request: "必须登录后才能发布家长需求" }
    });

    await expect(
      listServerParentNeedsForOwner({
        authenticatedUserId: "",
        collection: fake.collection
      })
    ).resolves.toMatchObject({
      ok: false,
      code: "AUTH_REQUIRED",
      status: 401
    });

    await expect(
      saveServerParentNeed({
        authenticatedUserId: "parent-a",
        collection: fake.collection,
        input: { ...validInput, childIntro: "请加微信 parent_edu" },
        runTransaction: lifecycle.runTransaction
      })
    ).resolves.toMatchObject({
      ok: false,
      errors: { childIntro: expect.any(String) }
    });
  });

  it("fails closed without a create transaction and audit", async () => {
    const fake = createFakeCollection();

    const result = await saveServerParentNeed({
      authenticatedUserId: "parent-a",
      collection: fake.collection,
      input: validInput
    });

    expect(result).toMatchObject({
      ok: false,
      code: "TRANSACTION_UNAVAILABLE",
      status: 503
    });
    expect(fake.documents.size).toBe(0);
  });

  it("checks ownership and published state before validating update input", async () => {
    const invalidInput = { ...validInput, childIntro: "请加微信 parent_edu" };
    const nonOwner = createLifecycleTransaction({
      "need-a": {
        ...validInput,
        ownerUserId: "parent-b",
        budgetMin: 80,
        budgetMax: 120,
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z",
        updatedAt: "2026-06-22T00:00:00.000Z",
        version: 1
      }
    });
    const deleted = createLifecycleTransaction({
      "need-a": {
        ...validInput,
        ownerUserId: "parent-a",
        budgetMin: 80,
        budgetMax: 120,
        status: "deleted",
        createdAt: "2026-06-22T00:00:00.000Z",
        updatedAt: "2026-06-22T00:00:00.000Z",
        version: 2,
        deletedAt: "2026-06-22T00:00:00.000Z"
      }
    });
    const owner = createLifecycleTransaction({
      "need-a": {
        ...validInput,
        ownerUserId: "parent-a",
        budgetMin: 80,
        budgetMax: 120,
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z",
        updatedAt: "2026-06-22T00:00:00.000Z",
        version: 1
      }
    });

    for (const lifecycle of [nonOwner, deleted]) {
      await expect(
        updateServerParentNeed({
          authenticatedUserId: "parent-a",
          expectedVersion: 1,
          id: "need-a",
          input: invalidInput,
          runTransaction: lifecycle.runTransaction
        })
      ).resolves.toMatchObject({ ok: false, code: "NOT_FOUND", status: 404 });
    }

    await expect(
      updateServerParentNeed({
        authenticatedUserId: "parent-a",
        expectedVersion: 1,
        id: "need-a",
        input: invalidInput,
        runTransaction: owner.runTransaction
      })
    ).resolves.toMatchObject({ ok: false, status: 400 });
  });
});
