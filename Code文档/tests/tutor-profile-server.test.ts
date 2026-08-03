import { describe, expect, it } from "vitest";

import { createServerContactExchangeRequest } from "@/server/contact-exchange";
import { readServerConversationForUser } from "@/server/conversations";

import {
  deleteServerTutorProfile,
  filterServerTutorProfiles,
  findPublicServerTutorProfileById,
  listPublicServerTutorProfiles,
  listServerTutorProfilesForOwner,
  restoreServerTutorProfile,
  saveServerTutorProfile,
  updateServerTutorProfile
} from "@/server/tutor-profiles";

type StoredDocument = Record<string, unknown>;

const validInput = {
  gender: "女",
  school: "东莞理工学院",
  major: "数学与应用数学",
  subjects: ["数学"],
  grades: ["初中"],
  timeSlots: ["周六下午"],
  feeRanges: [{ grade: "初中", subject: "数学", min: "90", max: "130" }],
  abilityDescription: "擅长拆题和基础巩固，有同伴辅导经验。",
  proofImages: [{ name: "score.webp", type: "image/webp", size: 1024 }]
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

describe("server tutor_profiles interface", () => {
  it("saves a tutor profile to the current user's ownership", async () => {
    const lifecycle = createLifecycleTransaction({});

    const result = await saveServerTutorProfile({
      authenticatedUserId: "tutor-a",
      collection: lifecycle.source.collection,
      input: validInput,
      now: "2026-06-22T00:00:00.000Z",
      runTransaction: lifecycle.runTransaction
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ownerUserId: "tutor-a",
        status: "published",
        feeRanges: [{ min: 90, max: 130 }],
        proofImages: [{ name: "score.webp", type: "image/webp", size: 1024 }],
        updatedAt: "2026-06-22T00:00:00.000Z",
        version: 1,
        managementState: "managed"
      }
    });
    expect(lifecycle.audit.documents.size).toBe(1);
  });

  it("soft deletes and restores a tutor profile with related gates in one transaction", async () => {
    const lifecycle = createLifecycleTransaction(
      {
        "profile-a": {
          ...validInput,
          ownerUserId: "tutor-a",
          feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
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
          sourceId: "profile-a",
          sourceKey: "tutor-profile:profile-a",
          sourceType: "tutor-profile"
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

    const deleted = await deleteServerTutorProfile({
      authenticatedUserId: "tutor-a",
      expectedVersion: 1,
      id: "profile-a",
      idempotencyKey: "delete-profile-a-1",
      now: "2026-06-22T01:00:00.000Z",
      runTransaction: lifecycle.runTransaction
    });
    const restored = await restoreServerTutorProfile({
      authenticatedUserId: "tutor-a",
      expectedVersion: 2,
      id: "profile-a",
      idempotencyKey: "restore-profile-a-2",
      now: "2026-06-24T00:59:59.999Z",
      runTransaction: lifecycle.runTransaction
    });

    expect(deleted).toMatchObject({
      ok: true,
      value: { status: "deleted", version: 2 }
    });
    expect(restored).toMatchObject({
      ok: true,
      value: { status: "published", version: 3 }
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

    const edited = await updateServerTutorProfile({
      authenticatedUserId: "tutor-a",
      expectedVersion: 3,
      id: "profile-a",
      input: { ...validInput, abilityDescription: "恢复后的普通编辑仍保留幂等历史" },
      now: "2026-06-24T01:00:00.000Z",
      runTransaction: lifecycle.runTransaction
    });

    expect(edited).toMatchObject({ ok: true, value: { version: 4 } });
    expect(lifecycle.source.documents.get("profile-a")).toMatchObject({
      lastMutationAction: "restore",
      lastMutationKey: "restore-profile-a-2",
      mutationHistory: [
        { idempotencyKey: "delete-profile-a-1", status: "deleted", version: 2 },
        { idempotencyKey: "restore-profile-a-2", status: "published", version: 3 }
      ],
      status: "published",
      version: 4
    });
    expect(lifecycle.audit.documents.size).toBe(3);

    const replayedDelete = await deleteServerTutorProfile({
      authenticatedUserId: "tutor-a",
      expectedVersion: 1,
      id: "profile-a",
      idempotencyKey: "delete-profile-a-1",
      now: "2026-06-24T01:00:01.000Z",
      runTransaction: lifecycle.runTransaction
    });

    expect(replayedDelete).toMatchObject({
      ok: true,
      value: { status: "deleted", version: 2 }
    });
    expect(lifecycle.source.documents.get("profile-a")).toMatchObject({
      status: "published",
      version: 4
    });
    expect(lifecycle.audit.documents.size).toBe(3);
  });

  it("keeps existing chat and contact exchange available after a versioned edit", async () => {
    const lifecycle = createLifecycleTransaction(
      {
        "profile-a": {
          ...validInput,
          ownerUserId: "tutor-a",
          feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
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
          sourceId: "profile-a",
          sourceKey: "tutor-profile:profile-a",
          sourceType: "tutor-profile",
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
          requesterUserId: "tutor-a",
          receiverUserId: "parent-a",
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
    const emptyParentNeeds = createFakeCollection();
    const contactProfiles = createFakeCollection();

    const updated = await updateServerTutorProfile({
      authenticatedUserId: "tutor-a",
      expectedVersion: 1,
      id: "profile-a",
      input: { ...validInput, abilityDescription: "编辑后的能力说明" },
      now: "2026-06-22T01:00:00.000Z",
      runTransaction: lifecycle.runTransaction
    });
    const conversation = await readServerConversationForUser({
      authenticatedUserId: "tutor-a",
      conversationId: "conversation-a",
      conversationsCollection: lifecycle.conversations.collection,
      messagesCollection: createFakeCollection().collection,
      parentNeedsCollection: emptyParentNeeds.collection,
      tutorProfilesCollection: lifecycle.source.collection
    });
    const exchange = await createServerContactExchangeRequest({
      authenticatedUserId: "tutor-a",
      contactProfilesCollection: contactProfiles.collection,
      conversationId: "conversation-a",
      conversationsCollection: lifecycle.conversations.collection,
      parentNeedsCollection: emptyParentNeeds.collection,
      requestsCollection: lifecycle.requests.collection,
      tutorProfilesCollection: lifecycle.source.collection
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
      "profile-a": {
        ...validInput,
        ownerUserId: "tutor-a",
        feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z",
        updatedAt: "2026-06-22T00:00:00.000Z",
        version: 1
      }
    });
    const startedAt = new Date("2026-06-22T01:00:00.000Z");

    for (let index = 0; index < 16; index += 1) {
      const common = {
        authenticatedUserId: "tutor-a",
        expectedVersion: index + 1,
        id: "profile-a",
        idempotencyKey: `mutation-${String(index).padStart(2, "0")}-${index % 2 === 0 ? "delete" : "restore"}`,
        now: new Date(startedAt.getTime() + index * 60 * 60 * 1000).toISOString(),
        runTransaction: lifecycle.runTransaction
      };
      const result = index % 2 === 0
        ? await deleteServerTutorProfile(common)
        : await restoreServerTutorProfile(common);
      expect(result.ok).toBe(true);
    }

    const boundaryHistory = lifecycle.source.documents.get("profile-a")?.mutationHistory as
      | Array<Record<string, unknown>>
      | undefined;
    expect(boundaryHistory).toHaveLength(16);
    expect(boundaryHistory?.[0]).toMatchObject({ idempotencyKey: "mutation-00-delete" });
    expect(boundaryHistory?.at(-1)).toMatchObject({ idempotencyKey: "mutation-15-restore" });

    const seventeenth = await deleteServerTutorProfile({
      authenticatedUserId: "tutor-a",
      expectedVersion: 17,
      id: "profile-a",
      idempotencyKey: "mutation-16-delete",
      now: new Date(startedAt.getTime() + 16 * 60 * 60 * 1000).toISOString(),
      runTransaction: lifecycle.runTransaction
    });
    expect(seventeenth.ok).toBe(true);

    const evictedHistory = lifecycle.source.documents.get("profile-a")?.mutationHistory as
      | Array<Record<string, unknown>>
      | undefined;
    expect(evictedHistory).toHaveLength(16);
    expect(evictedHistory?.some((entry) => entry.idempotencyKey === "mutation-00-delete")).toBe(false);
    expect(evictedHistory?.[0]).toMatchObject({ idempotencyKey: "mutation-01-restore" });
    expect(evictedHistory?.at(-1)).toMatchObject({ idempotencyKey: "mutation-16-delete" });

    await expect(deleteServerTutorProfile({
      authenticatedUserId: "tutor-a",
      expectedVersion: 1,
      id: "profile-a",
      idempotencyKey: "mutation-00-delete",
      now: new Date(startedAt.getTime() + 17 * 60 * 60 * 1000).toISOString(),
      runTransaction: lifecycle.runTransaction
    })).resolves.toMatchObject({ ok: false, status: 409, code: "VERSION_CONFLICT" });
  });

  it("updates through the CloudBase transaction object document shape", async () => {
    const lifecycle = createLifecycleTransaction(
      {
        "profile-a": {
          ...validInput,
          ownerUserId: "tutor-a",
          feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
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

    const result = await updateServerTutorProfile({
      authenticatedUserId: "tutor-a",
      expectedVersion: 1,
      id: "profile-a",
      input: { ...validInput, abilityDescription: "真实事务对象读取形状下的编辑" },
      now: "2026-06-22T01:00:00.000Z",
      runTransaction: lifecycle.runTransaction
    });

    expect(result).toMatchObject({ ok: true, value: { version: 2 } });
  });

  it("does not write CloudBase immutable ids while syncing related gates", async () => {
    const lifecycle = createLifecycleTransaction(
      {
        "profile-a": {
          ...validInput,
          ownerUserId: "tutor-a",
          feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
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
          sourceId: "profile-a",
          sourceKey: "tutor-profile:profile-a",
          sourceType: "tutor-profile"
        }
      },
      {
        "request-a": {
          _id: "cloudbase-request-a",
          id: "request-a",
          conversationId: "conversation-a",
          requesterUserId: "tutor-a",
          status: "pending"
        }
      },
      "array",
      true
    );

    const result = await updateServerTutorProfile({
      authenticatedUserId: "tutor-a",
      expectedVersion: 1,
      id: "profile-a",
      input: { ...validInput, abilityDescription: "同步关联状态时不回写不可变标识" },
      now: "2026-06-22T01:00:00.000Z",
      runTransaction: lifecycle.runTransaction
    });

    expect(result).toMatchObject({ ok: true, value: { version: 2 } });
    expect(lifecycle.conversations.documents.get("conversation-a")).toMatchObject({
      id: "conversation-a",
      participantUserIds: ["parent-a", "tutor-a"],
      sourceId: "profile-a",
      sourceStatus: "published",
      sourceType: "tutor-profile",
      sourceVersion: 2
    });
    expect(lifecycle.requests.documents.get("request-a")).toMatchObject({
      id: "request-a",
      conversationId: "conversation-a",
      requesterUserId: "tutor-a",
      sourceStatus: "published",
      sourceVersion: 2,
      status: "pending"
    });
  });

  it("lists only the current user's own tutor profiles", async () => {
    const fake = createFakeCollection({
      "profile-a": {
        ...validInput,
        ownerUserId: "tutor-a",
        feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      },
      "profile-b": {
        ...validInput,
        ownerUserId: "tutor-b",
        feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      }
    });

    await expect(
      listServerTutorProfilesForOwner({
        authenticatedUserId: "tutor-a",
        collection: fake.collection
      })
    ).resolves.toMatchObject({
      ok: true,
      value: [{ id: "profile-a", ownerUserId: "tutor-a" }]
    });
  });

  it("returns public list and detail without owner identifiers", async () => {
    const fake = createFakeCollection({
      "profile-a": {
        ...validInput,
        ownerUserId: "tutor-a",
        feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      }
    });

    const publicList = await listPublicServerTutorProfiles({
      collection: fake.collection
    });
    const publicDetail = await findPublicServerTutorProfileById({
      collection: fake.collection,
      id: "profile-a"
    });

    expect(publicList).toMatchObject({
      ok: true,
      value: [{ id: "profile-a", school: "东莞理工学院" }]
    });
    expect(publicDetail).toMatchObject({
      ok: true,
      value: { id: "profile-a", school: "东莞理工学院" }
    });
    expect(JSON.stringify(publicList)).not.toContain("tutor-a");
    expect(JSON.stringify(publicDetail)).not.toContain("tutor-a");
    expect(publicDetail.ok && publicDetail.value).not.toHaveProperty("ownerUserId");
  });

  it("filters public tutor profiles by subject, grade, fee, and gender", async () => {
    const fake = createFakeCollection({
      "profile-a": {
        ...validInput,
        ownerUserId: "tutor-a",
        feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      },
      "profile-b": {
        ...validInput,
        gender: "男",
        subjects: ["生物"],
        grades: ["高中"],
        ownerUserId: "tutor-b",
        feeRanges: [{ grade: "高中", subject: "生物", min: 160, max: 220 }],
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      }
    });
    const publicList = await listPublicServerTutorProfiles({
      collection: fake.collection
    });

    if (!publicList.ok) {
      throw new Error("expected public list");
    }

    const matched = filterServerTutorProfiles(publicList.value, {
      feeMax: "120",
      feeMin: "100",
      gender: "女",
      grade: "初中",
      subject: "数学"
    });

    expect(matched).toHaveLength(1);
    expect(matched[0].id).toBe("profile-a");
  });

  it("lists newly created public tutor profiles when the collection has many older documents", async () => {
    const oldProfiles = Object.fromEntries(
      Array.from({ length: 120 }, (_, index) => [
        `old-profile-${index}`,
        {
          ...validInput,
          ownerUserId: `old-tutor-${index}`,
          feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
          status: "published",
          createdAt: `2026-06-20T00:${String(index).padStart(2, "0")}:00.000Z`
        }
      ])
    );
    const fake = createFakeCollection({
      ...oldProfiles,
      "fresh-profile": {
        ...validInput,
        ownerUserId: "fresh-tutor",
        feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
        status: "published",
        createdAt: "2026-06-23T00:00:00.000Z"
      }
    });

    const publicList = await listPublicServerTutorProfiles({
      collection: fake.collection,
      filters: { subject: "数学" }
    });

    expect(publicList).toMatchObject({
      ok: true,
      value: expect.arrayContaining([
        expect.objectContaining({ id: "fresh-profile" })
      ])
    });
  });

  it("rejects missing authentication and invalid input", async () => {
    const fake = createFakeCollection();
    const lifecycle = createLifecycleTransaction({});

    await expect(
      saveServerTutorProfile({
        authenticatedUserId: "",
        collection: fake.collection,
        input: validInput
      })
    ).resolves.toMatchObject({
      ok: false,
      code: "AUTH_REQUIRED",
      status: 401,
      errors: { request: "必须登录后才能发布家教信息" }
    });

    await expect(
      listServerTutorProfilesForOwner({
        authenticatedUserId: "",
        collection: fake.collection
      })
    ).resolves.toMatchObject({
      ok: false,
      code: "AUTH_REQUIRED",
      status: 401
    });

    await expect(
      saveServerTutorProfile({
        authenticatedUserId: "tutor-a",
        collection: fake.collection,
        input: { ...validInput, abilityDescription: "请加微信 tutor_edu" },
        runTransaction: lifecycle.runTransaction
      })
    ).resolves.toMatchObject({
      ok: false,
      errors: { abilityDescription: expect.any(String) }
    });
  });

  it("fails closed without a create transaction and audit", async () => {
    const fake = createFakeCollection();

    const result = await saveServerTutorProfile({
      authenticatedUserId: "tutor-a",
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
    const invalidInput = { ...validInput, abilityDescription: "请加微信 tutor_edu" };
    const base = {
      ...validInput,
      feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
      createdAt: "2026-06-22T00:00:00.000Z",
      updatedAt: "2026-06-22T00:00:00.000Z"
    };
    const nonOwner = createLifecycleTransaction({
      "profile-a": { ...base, ownerUserId: "tutor-b", status: "published", version: 1 }
    });
    const deleted = createLifecycleTransaction({
      "profile-a": {
        ...base,
        ownerUserId: "tutor-a",
        status: "deleted",
        version: 2,
        deletedAt: "2026-06-22T00:00:00.000Z"
      }
    });
    const owner = createLifecycleTransaction({
      "profile-a": { ...base, ownerUserId: "tutor-a", status: "published", version: 1 }
    });

    for (const lifecycle of [nonOwner, deleted]) {
      await expect(
        updateServerTutorProfile({
          authenticatedUserId: "tutor-a",
          expectedVersion: 1,
          id: "profile-a",
          input: invalidInput,
          runTransaction: lifecycle.runTransaction
        })
      ).resolves.toMatchObject({ ok: false, code: "NOT_FOUND", status: 404 });
    }

    await expect(
      updateServerTutorProfile({
        authenticatedUserId: "tutor-a",
        expectedVersion: 1,
        id: "profile-a",
        input: invalidInput,
        runTransaction: owner.runTransaction
      })
    ).resolves.toMatchObject({ ok: false, status: 400 });
  });
});
