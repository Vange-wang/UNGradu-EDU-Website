import { describe, expect, it } from "vitest";

import { createParentNeedManagementHandlers } from "@/app/api/parent-needs/management-handlers";
import { createTutorProfileManagementHandlers } from "@/app/api/tutor-profiles/management-handlers";
import { createContactReviewApiHandlers } from "@/server/contact-review-api";
import { createParentNeedApiHandlers } from "@/server/parent-need-api";
import { createTutorProfileApiHandlers } from "@/server/tutor-profile-api";
import {
  createContactReviewService,
  InMemoryContactReviewRepository,
  recomputeContactReviewAggregate,
  type ContactReviewFieldReview
} from "@/server/security/contact-review-production";
import {
  CONTACT_REVIEW_COLLECTIONS,
  createCloudBaseContactReviewRepository,
  readContactReviewRuntimeGate
} from "@/server/security/contact-review-cloudbase";
import { createContactReviewManagementIntegration } from "@/server/security/contact-review-integration";

type StoredDocument = Record<string, unknown> & { _id: string };

class SyntheticCloudBaseDatabase {
  readonly stores = new Map<string, Map<string, StoredDocument>>();
  transactionCount = 0;

  constructor(private readonly maximumQueryPageSize = Number.POSITIVE_INFINITY) {}

  private store(name: string) {
    const existing = this.stores.get(name);
    if (existing) return existing;
    const created = new Map<string, StoredDocument>();
    this.stores.set(name, created);
    return created;
  }

  collection(name: string) {
    const store = this.store(name);
    return {
      doc: (id: string) => ({
        get: async () => ({ data: store.has(id) ? store.get(id) : undefined }),
        remove: async () => void store.delete(id),
        set: async (value: Record<string, unknown>) => {
          if ("_id" in value) throw new Error("CloudBase system field write rejected");
          store.set(id, { ...structuredClone(value), _id: id });
        },
        update: async (value: Record<string, unknown>) => {
          if ("_id" in value) throw new Error("CloudBase system field write rejected");
          const current = store.get(id);
          if (!current) throw new Error("document not found");
          store.set(id, { ...current, ...structuredClone(value), _id: id });
        }
      }),
      queryPageSize: Number.isFinite(this.maximumQueryPageSize) ? this.maximumQueryPageSize : undefined,
      where: (query: Record<string, unknown>) => {
        const createQuery = ({
          direction = "asc",
          limit = this.maximumQueryPageSize,
          orderField = "_id",
          skip = 0
        }: {
          direction?: "asc" | "desc";
          limit?: number;
          orderField?: string;
          skip?: number;
        } = {}) => ({
          get: async () => ({
            data: [...store.values()]
              .filter((document) => Object.entries(query).every(([key, value]) => document[key] === value))
              .sort((left, right) => String(left[orderField] ?? "").localeCompare(String(right[orderField] ?? "")) * (direction === "asc" ? 1 : -1))
              .slice(skip, skip + Math.min(limit, this.maximumQueryPageSize))
          }),
          limit: (value: number) => createQuery({ direction, limit: value, orderField, skip }),
          orderBy: (field: string, nextDirection: "asc" | "desc") => createQuery({
            direction: nextDirection,
            limit,
            orderField: field,
            skip
          }),
          skip: (value: number) => createQuery({ direction, limit, orderField, skip: value })
        });
        return createQuery();
      }
    };
  }

  async runTransaction<T>(operation: (transaction: {
    collection: (name: string) => ReturnType<SyntheticCloudBaseDatabase["collection"]>;
  }) => Promise<T>) {
    const candidate: Array<[string, Array<[string, StoredDocument]>]> = structuredClone(
      [...this.stores.entries()].map(([name, records]) => [name, [...records.entries()]])
    );
    const transactional = new SyntheticCloudBaseDatabase(this.maximumQueryPageSize);
    for (const [name, records] of candidate) {
      transactional.stores.set(name, new Map(records));
    }
    const result = await operation({ collection: (name: string) => transactional.collection(name) });
    this.stores.clear();
    for (const [name, records] of transactional.stores) this.stores.set(name, records);
    this.transactionCount += 1;
    return result;
  }
}

function fieldReview(
  field: "abilityDescription" | "childIntro",
  fieldStatus: ContactReviewFieldReview["fieldStatus"]
): ContactReviewFieldReview {
  return {
    field,
    fieldStatus,
    reviewKey: `review-${field}`,
    taskId: `task-${field}`
  };
}

describe("ISSUE-0036 production review aggregate", () => {
  it("publishes only an exact N/N field set and keeps mixed rejected plus pending fail-closed", () => {
    expect(recomputeContactReviewAggregate({
      fieldReviews: {
        abilityDescription: fieldReview("abilityDescription", "published"),
        childIntro: fieldReview("childIntro", "published")
      },
      requiredFields: ["abilityDescription", "childIntro"]
    })).toEqual({ ok: true, status: "published" });

    expect(recomputeContactReviewAggregate({
      fieldReviews: {
        abilityDescription: fieldReview("abilityDescription", "rejected"),
        childIntro: fieldReview("childIntro", "pending_review")
      },
      requiredFields: ["abilityDescription", "childIntro"]
    })).toEqual({ ok: true, status: "pending_review" });

    expect(recomputeContactReviewAggregate({
      fieldReviews: {
        childIntro: fieldReview("childIntro", "published")
      },
      requiredFields: ["abilityDescription", "childIntro"]
    })).toEqual({ code: "field_set_invalid", ok: false, status: "pending_review" });
  });
});

describe("ISSUE-0036 CloudBase production boundary", () => {
  it("keeps the feature disabled by default and blocks incomplete production configuration", () => {
    expect(readContactReviewRuntimeGate({})).toEqual({ enabled: false, ok: true });
    expect(readContactReviewRuntimeGate({ CONTACT_REVIEW_ENABLED: "true" })).toMatchObject({
      code: "CONTACT_REVIEW_CONFIGURATION_UNAVAILABLE",
      ok: false,
      status: 503
    });
    expect(readContactReviewRuntimeGate({
      CONTACT_REVIEW_BACKUP_REVIEWER_REFS: "backup-ref",
      CONTACT_REVIEW_ENABLED: "true",
      CONTACT_REVIEW_KEY_SECRET: "synthetic-runtime-secret",
      CONTACT_REVIEW_PRIMARY_REVIEWER_REFS: "primary-ref",
      CONTACT_REVIEW_SCHEMA_READY: "true",
      CONTACT_REVIEW_SECOND_REVIEWER_REFS: "second-ref"
    })).toMatchObject({ enabled: true, ok: true });
  });

  it("persists a hidden create and an atomic publish without copying raw contact text into task or audit records", async () => {
    const database = new SyntheticCloudBaseDatabase(1);
    const repository = createCloudBaseContactReviewRepository({ database });
    const service = createContactReviewService({
      idFactory: (prefix) => `${prefix}-cloudbase`,
      keySecret: "synthetic-runtime-secret",
      repository
    });
    const entityId = "parent-need-cloudbase";
    const created = await service.submit({
      candidate: {
        childIntro: "合成待审简介",
        contact: "synthetic-private-contact",
        createdAt: "2026-08-23T00:00:00.000Z",
        id: entityId,
        ownerUserId: "owner-cloudbase",
        status: "pending_review",
        updatedAt: "2026-08-23T00:00:00.000Z",
        version: 1
      },
      entityId,
      entityType: "parent_need",
      idempotencyKey: "cloudbase-create",
      operation: "create",
      ownerId: "owner-cloudbase",
      reviewFields: { childIntro: "合成待审简介" },
      now: "2026-08-23T00:00:00.000Z",
      requestId: "cloudbase-create-request"
    });
    expect(created).toMatchObject({ ok: true, value: { publicVisibility: "hidden" } });
    const source = database.stores.get("parent_needs")?.get(entityId);
    expect(source).toMatchObject({ publicVisibility: "hidden", status: "pending_review" });

    const taskStore = database.stores.get(CONTACT_REVIEW_COLLECTIONS.tasks);
    const auditStore = database.stores.get(CONTACT_REVIEW_COLLECTIONS.auditEvents);
    expect(JSON.stringify([...taskStore!.values(), ...auditStore!.values()])).not.toContain("synthetic-private-contact");
    const task = [...taskStore!.values()][0];
    expect(task).not.toHaveProperty("contact");

    const published = await service.decideField({
      decision: "published",
      expectedAggregateRevision: 1,
      expectedTaskRevision: 1,
      idempotencyKey: "cloudbase-publish",
      now: "2026-08-23T00:05:00.000Z",
      operator: { id: "primary-reviewer", role: "primary" },
      taskId: String(task.taskId)
    });
    expect(published).toMatchObject({ ok: true, value: { publicVisibility: "published" } });
    expect(database.stores.get("parent_needs")?.get(entityId)).toMatchObject({
      childIntro: "合成待审简介",
      publicVisibility: "published",
      status: "published"
    });
    expect(database.transactionCount).toBe(2);
  });

  it("fails the real public list and detail closed when an approved task is missing", async () => {
    const database = new SyntheticCloudBaseDatabase(1);
    const repository = createCloudBaseContactReviewRepository({ database });
    const service = createContactReviewService({
      idFactory: (prefix) => `${prefix}-${crypto.randomUUID()}`,
      keySecret: "synthetic-runtime-secret",
      repository
    });
    const entityId = "parent-need-public-integrity";
    await service.submit({
      candidate: {
        budgetMax: 120,
        budgetMin: 80,
        childIntro: "合成批准简介",
        community: "合成小区",
        createdAt: "2026-08-23T00:00:00.000Z",
        deletedAt: null,
        deletedByUserId: null,
        grade: "初一",
        id: entityId,
        managementState: "managed",
        ownerUserId: "owner-public-integrity",
        region: { city: "合成市", district: "合成区", province: "合成省" },
        status: "pending_review",
        subjects: ["数学"],
        teacherGenderPreference: "不限",
        timeSlots: ["周末"],
        updatedAt: "2026-08-23T00:00:00.000Z",
        version: 1
      },
      entityId,
      entityType: "parent_need",
      idempotencyKey: "public-integrity-create",
      operation: "create",
      ownerId: "owner-public-integrity",
      reviewFields: { childIntro: "合成批准简介" },
      now: "2026-08-23T00:00:00.000Z",
      requestId: "public-integrity-create-request"
    });
    const task = [...database.stores.get(CONTACT_REVIEW_COLLECTIONS.tasks)!.values()][0];
    await service.decideField({
      decision: "published",
      expectedAggregateRevision: 1,
      expectedTaskRevision: 1,
      idempotencyKey: "public-integrity-publish",
      now: "2026-08-23T00:05:00.000Z",
      operator: { id: "primary-public-integrity", role: "primary" },
      taskId: String(task.taskId)
    });
    const secondEntityId = "parent-need-public-authority-page-2";
    await service.submit({
      candidate: {
        budgetMax: 400,
        budgetMin: 300,
        childIntro: "第二条批准简介",
        createdAt: "2026-08-23T02:00:00.000Z",
        grade: "高一",
        id: secondEntityId,
        ownerUserId: "owner-public-page-2",
        status: "pending_review",
        subjects: ["物理"],
        teacherGenderPreference: "男",
        timeSlots: ["工作日"],
        updatedAt: "2026-08-23T02:00:00.000Z",
        version: 1
      },
      entityId: secondEntityId,
      entityType: "parent_need",
      idempotencyKey: "public-page-2-create",
      operation: "create",
      ownerId: "owner-public-page-2",
      reviewFields: { childIntro: "第二条批准简介" },
      now: "2026-08-23T02:00:00.000Z",
      requestId: "public-page-2-create-request"
    });
    const secondTask = [...database.stores.get(CONTACT_REVIEW_COLLECTIONS.tasks)!.values()]
      .find((record) => record.entityId === secondEntityId)!;
    await service.decideField({
      decision: "published",
      expectedAggregateRevision: 1,
      expectedTaskRevision: 1,
      idempotencyKey: "public-page-2-publish",
      now: "2026-08-23T02:05:00.000Z",
      operator: { id: "primary-public-page-2", role: "primary" },
      taskId: String(secondTask.taskId)
    });
    const integration = createContactReviewManagementIntegration({ entityType: "parent_need", service });
    const handlers = createParentNeedApiHandlers({
      collection: database.collection("parent_needs"),
      contactReview: integration,
      contactReviewGate: {
        enabled: true,
        ok: true,
        reviewerRefs: { backup: ["backup"], primary: ["primary"], secondReview: ["second"] }
      }
    });
    const detailHandlers = createParentNeedManagementHandlers({
      collection: database.collection("parent_needs"),
      contactReview: integration,
      contactReviewGate: {
        enabled: true,
        ok: true,
        reviewerRefs: { backup: ["backup"], primary: ["primary"], secondReview: ["second"] }
      }
    });

    const visibleList = await handlers.GET_COLLECTION(new Request("http://localhost/api/parent-needs"));
    const visibleDetail = await detailHandlers.GET_ITEM(
      new Request(`http://localhost/api/parent-needs/${entityId}`),
      { params: Promise.resolve({ id: entityId }) }
    );
    await expect(visibleList.json()).resolves.toMatchObject({
      ok: true,
      value: [{ id: secondEntityId }, { id: entityId }]
    });
    await expect(visibleDetail.json()).resolves.toMatchObject({ ok: true, value: { id: entityId } });

    const sourceStore = database.stores.get("parent_needs")!;
    sourceStore.set(entityId, {
      ...sourceStore.get(entityId)!,
      budgetMax: 400,
      budgetMin: 300,
      childIntro: "未批准的顶层漂移简介",
      contact: "private-contact-must-not-leak",
      createdAt: "2026-08-23T03:00:00.000Z",
      grade: "高一",
      subjects: ["物理"],
      teacherGenderPreference: "男"
    });
    sourceStore.set(secondEntityId, {
      ...sourceStore.get(secondEntityId)!,
      budgetMax: 120,
      budgetMin: 80,
      createdAt: "2026-08-22T00:00:00.000Z",
      grade: "初一",
      subjects: ["数学"],
      teacherGenderPreference: "不限"
    });
    const approvedProjection = {
      budgetMax: 120,
      budgetMin: 80,
      childIntro: "合成批准简介",
      createdAt: "2026-08-23T00:00:00.000Z",
      grade: "初一",
      id: entityId,
      subjects: ["数学"],
      teacherGenderPreference: "不限",
      timeSlots: ["周末"]
    };
    const secondApprovedProjection = {
      budgetMax: 400,
      budgetMin: 300,
      childIntro: "第二条批准简介",
      createdAt: "2026-08-23T02:00:00.000Z",
      grade: "高一",
      id: secondEntityId,
      subjects: ["物理"],
      teacherGenderPreference: "男",
      timeSlots: ["工作日"]
    };
    const driftedList = await handlers.GET_COLLECTION(new Request("http://localhost/api/parent-needs"));
    const driftedGenericDetail = await handlers.GET_ITEM(
      new Request(`http://localhost/api/parent-needs/${entityId}`),
      { params: Promise.resolve({ id: entityId }) }
    );
    const driftedActualDetail = await detailHandlers.GET_ITEM(
      new Request(`http://localhost/api/parent-needs/${entityId}`),
      { params: Promise.resolve({ id: entityId }) }
    );
    await expect(driftedList.json()).resolves.toEqual({
      errors: {},
      ok: true,
      value: [secondApprovedProjection, approvedProjection]
    });
    await expect(driftedGenericDetail.json()).resolves.toEqual({ errors: {}, ok: true, value: approvedProjection });
    await expect(driftedActualDetail.json()).resolves.toEqual({ errors: {}, ok: true, value: approvedProjection });
    const approvedFilter = await handlers.GET_COLLECTION(new Request(
      "http://localhost/api/parent-needs?subject=数学&grade=初一&teacherGenderPreference=不限&budgetMin=80&budgetMax=120"
    ));
    const secondApprovedFilter = await handlers.GET_COLLECTION(new Request(
      "http://localhost/api/parent-needs?subject=物理&grade=高一&teacherGenderPreference=男&budgetMin=300&budgetMax=400"
    ));
    await expect(approvedFilter.json()).resolves.toEqual({ errors: {}, ok: true, value: [approvedProjection] });
    await expect(secondApprovedFilter.json()).resolves.toEqual({ errors: {}, ok: true, value: [secondApprovedProjection] });

    const taskStore = database.stores.get(CONTACT_REVIEW_COLLECTIONS.tasks)!;
    const aggregateStore = database.stores.get(CONTACT_REVIEW_COLLECTIONS.aggregates)!;
    sourceStore.delete(secondEntityId);
    for (const [id, record] of taskStore) if (record.entityId === secondEntityId) taskStore.delete(id);
    for (const [id, record] of aggregateStore) if (record.entityId === secondEntityId) aggregateStore.delete(id);
    const approvedTask = structuredClone([...taskStore.values()][0]);
    const approvedAggregate = structuredClone([...aggregateStore.values()][0]);
    const assertHidden = async () => {
      const hiddenList = await handlers.GET_COLLECTION(new Request("http://localhost/api/parent-needs"));
      const hiddenDetail = await detailHandlers.GET_ITEM(
        new Request(`http://localhost/api/parent-needs/${entityId}`),
        { params: Promise.resolve({ id: entityId }) }
      );
      await expect(hiddenList.json()).resolves.toEqual({ errors: {}, ok: true, value: [] });
      expect(hiddenDetail.status).toBe(404);
      await expect(service.readOperationalHealth({ now: "2026-08-23T00:06:00.000Z" }))
        .resolves.toMatchObject({ ok: true, value: { publicPointerFailures: 1 } });
    };
    const resetAuthority = () => {
      taskStore.clear();
      taskStore.set(String(approvedTask.taskId), structuredClone(approvedTask));
      aggregateStore.clear();
      aggregateStore.set(String(approvedAggregate.aggregateId), structuredClone(approvedAggregate));
    };

    taskStore.clear();
    await assertHidden();
    resetAuthority();
    taskStore.set("duplicate-approved-task", { ...structuredClone(approvedTask), _id: "duplicate-approved-task" });
    await assertHidden();
    for (const patch of [
      { ownerId: "wrong-owner" },
      { entityVersion: Number(approvedTask.entityVersion) + 1 },
      { field: "abilityDescription" },
      { reviewKey: "wrong-review-key" }
    ]) {
      resetAuthority();
      taskStore.set(String(approvedTask.taskId), { ...structuredClone(approvedTask), ...patch });
      await assertHidden();
    }
    resetAuthority();
    aggregateStore.set(String(approvedAggregate.aggregateId), {
      ...structuredClone(approvedAggregate),
      fieldReviews: {
        childIntro: {
          ...(approvedAggregate.fieldReviews as Record<string, Record<string, unknown>>).childIntro,
          taskId: "wrong-task-back-reference"
        }
      }
    });
    await assertHidden();
    resetAuthority();
    aggregateStore.set(String(approvedAggregate.aggregateId), {
      ...structuredClone(approvedAggregate),
      requiredFieldsDigest: "drifted-required-fields-digest"
    });
    await assertHidden();
  });

  it("returns the approved tutor snapshot from real list and detail routes when the legacy top level drifts", async () => {
    const database = new SyntheticCloudBaseDatabase(1);
    const repository = createCloudBaseContactReviewRepository({ database });
    const service = createContactReviewService({
      idFactory: (prefix) => `${prefix}-${crypto.randomUUID()}`,
      keySecret: "synthetic-runtime-secret",
      repository
    });
    const entityId = "tutor-profile-public-snapshot";
    await service.submit({
      candidate: {
        abilityDescription: "已批准能力说明",
        contact: "private-contact-in-snapshot-must-not-leak",
        createdAt: "2026-08-23T01:00:00.000Z",
        feeRanges: [{ grade: "初中", max: 130, min: 90, subject: "数学" }],
        gender: "女",
        grades: ["初中"],
        id: entityId,
        major: "数学",
        ownerUserId: "owner-tutor-snapshot",
        proofImages: [{ name: "proof.png", size: 1, type: "image/png" }],
        school: "合成大学",
        status: "pending_review",
        subjects: ["数学"],
        timeSlots: ["周日"],
        updatedAt: "2026-08-23T01:00:00.000Z",
        version: 1
      },
      entityId,
      entityType: "tutor_profile",
      idempotencyKey: "tutor-snapshot-create",
      operation: "create",
      ownerId: "owner-tutor-snapshot",
      reviewFields: { abilityDescription: "已批准能力说明" },
      now: "2026-08-23T01:00:00.000Z",
      requestId: "tutor-snapshot-create-request"
    });
    const task = [...database.stores.get(CONTACT_REVIEW_COLLECTIONS.tasks)!.values()][0];
    await service.decideField({
      decision: "published",
      expectedAggregateRevision: 1,
      expectedTaskRevision: 1,
      idempotencyKey: "tutor-snapshot-publish",
      now: "2026-08-23T01:05:00.000Z",
      operator: { id: "primary-tutor-snapshot", role: "primary" },
      taskId: String(task.taskId)
    });
    const secondEntityId = "tutor-profile-public-authority-page-2";
    await service.submit({
      candidate: {
        abilityDescription: "第二条批准能力说明",
        createdAt: "2026-08-23T03:00:00.000Z",
        feeRanges: [{ grade: "高中", max: 260, min: 200, subject: "物理" }],
        gender: "男",
        grades: ["高中"],
        id: secondEntityId,
        ownerUserId: "owner-tutor-page-2",
        status: "pending_review",
        subjects: ["物理"],
        timeSlots: ["周六"],
        updatedAt: "2026-08-23T03:00:00.000Z",
        version: 1
      },
      entityId: secondEntityId,
      entityType: "tutor_profile",
      idempotencyKey: "tutor-page-2-create",
      operation: "create",
      ownerId: "owner-tutor-page-2",
      reviewFields: { abilityDescription: "第二条批准能力说明" },
      now: "2026-08-23T03:00:00.000Z",
      requestId: "tutor-page-2-create-request"
    });
    const secondTask = [...database.stores.get(CONTACT_REVIEW_COLLECTIONS.tasks)!.values()]
      .find((record) => record.entityId === secondEntityId)!;
    await service.decideField({
      decision: "published",
      expectedAggregateRevision: 1,
      expectedTaskRevision: 1,
      idempotencyKey: "tutor-page-2-publish",
      now: "2026-08-23T03:05:00.000Z",
      operator: { id: "primary-tutor-page-2", role: "primary" },
      taskId: String(secondTask.taskId)
    });
    const integration = createContactReviewManagementIntegration({ entityType: "tutor_profile", service });
    const gate = {
      enabled: true as const,
      ok: true as const,
      reviewerRefs: { backup: ["backup"], primary: ["primary"], secondReview: ["second"] }
    };
    const listHandlers = createTutorProfileApiHandlers({
      collection: database.collection("tutor_profiles"),
      contactReview: integration,
      contactReviewGate: gate
    });
    const detailHandlers = createTutorProfileManagementHandlers({
      collection: database.collection("tutor_profiles"),
      contactReview: integration,
      contactReviewGate: gate
    });
    const sourceStore = database.stores.get("tutor_profiles")!;
    sourceStore.set(entityId, {
      ...sourceStore.get(entityId)!,
      abilityDescription: "未批准的顶层漂移能力说明",
      contact: "drifted-private-contact",
      createdAt: "2026-08-23T04:00:00.000Z",
      feeRanges: [{ grade: "高中", max: 260, min: 200, subject: "物理" }],
      gender: "男",
      grades: ["高中"],
      subjects: ["物理"]
    });
    sourceStore.set(secondEntityId, {
      ...sourceStore.get(secondEntityId)!,
      createdAt: "2026-08-22T00:00:00.000Z",
      feeRanges: [{ grade: "初中", max: 130, min: 90, subject: "数学" }],
      gender: "女",
      grades: ["初中"],
      subjects: ["数学"]
    });
    const approvedProjection = {
      abilityDescription: "已批准能力说明",
      createdAt: "2026-08-23T01:00:00.000Z",
      feeRanges: [{ grade: "初中", max: 130, min: 90, subject: "数学" }],
      gender: "女",
      grades: ["初中"],
      id: entityId,
      subjects: ["数学"],
      timeSlots: ["周日"]
    };
    const secondApprovedProjection = {
      abilityDescription: "第二条批准能力说明",
      createdAt: "2026-08-23T03:00:00.000Z",
      feeRanges: [{ grade: "高中", max: 260, min: 200, subject: "物理" }],
      gender: "男",
      grades: ["高中"],
      id: secondEntityId,
      subjects: ["物理"],
      timeSlots: ["周六"]
    };
    const list = await listHandlers.GET_COLLECTION(new Request("http://localhost/api/tutor-profiles"));
    const genericDetail = await listHandlers.GET_ITEM(
      new Request(`http://localhost/api/tutor-profiles/${entityId}`),
      { params: Promise.resolve({ id: entityId }) }
    );
    const actualDetail = await detailHandlers.GET_ITEM(
      new Request(`http://localhost/api/tutor-profiles/${entityId}`),
      { params: Promise.resolve({ id: entityId }) }
    );
    await expect(list.json()).resolves.toEqual({
      errors: {},
      ok: true,
      value: [secondApprovedProjection, approvedProjection]
    });
    await expect(genericDetail.json()).resolves.toEqual({ errors: {}, ok: true, value: approvedProjection });
    await expect(actualDetail.json()).resolves.toEqual({ errors: {}, ok: true, value: approvedProjection });
    const approvedFilter = await listHandlers.GET_COLLECTION(new Request(
      "http://localhost/api/tutor-profiles?subject=数学&grade=初中&gender=女&feeMin=90&feeMax=130"
    ));
    const secondApprovedFilter = await listHandlers.GET_COLLECTION(new Request(
      "http://localhost/api/tutor-profiles?subject=物理&grade=高中&gender=男&feeMin=200&feeMax=260"
    ));
    await expect(approvedFilter.json()).resolves.toEqual({ errors: {}, ok: true, value: [approvedProjection] });
    await expect(secondApprovedFilter.json()).resolves.toEqual({ errors: {}, ok: true, value: [secondApprovedProjection] });
  });

  it("routes an authenticated parent create through the review integration and blocks an incomplete enabled gate", async () => {
    const repository = new InMemoryContactReviewRepository();
    const integration = createContactReviewManagementIntegration({
      entityType: "parent_need",
      service: createContactReviewService({
        idFactory: (prefix) => `${prefix}-handler`,
        keySecret: "synthetic-runtime-secret",
        repository
      })
    });
    const collection = {
      doc: () => ({ get: async () => ({ data: [] }), set: async () => ({}) }),
      where: () => ({ get: async () => ({ data: [] }) })
    };
    const enabled = createParentNeedManagementHandlers({
      collection,
      contactReview: integration,
      contactReviewGate: {
        enabled: true,
        ok: true,
        reviewerRefs: { backup: ["backup"], primary: ["primary"], secondReview: ["second"] }
      },
      env: { NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true", NODE_ENV: "test" }
    });
    const payload = {
      budgetMax: "120",
      budgetMin: "80",
      childIntro: "合成简介",
      community: "合成小区",
      grade: "初一",
      region: { city: "合成市", district: "合成区", province: "合成省" },
      subjects: ["数学"],
      teacherGenderPreference: "不限",
      timeSlots: ["周末"]
    };
    const response = await enabled.POST_COLLECTION(new Request("http://localhost/api/parent-needs", {
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json",
        "idempotency-key": "synthetic-parent-create",
        "x-ungradu-test-user-phone": "owner-parent"
      },
      method: "POST"
    }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      value: { publicVisibility: "hidden", reviewStatus: "pending_review" }
    });

    const blocked = createParentNeedManagementHandlers({
      collection,
      contactReviewGate: { code: "CONTACT_REVIEW_CONFIGURATION_UNAVAILABLE", ok: false, status: 503 },
      env: { NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true", NODE_ENV: "test" }
    });
    const blockedResponse = await blocked.POST_COLLECTION(new Request("http://localhost/api/parent-needs", {
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json",
        "x-ungradu-test-user-phone": "owner-parent"
      },
      method: "POST"
    }));
    expect(blockedResponse.status).toBe(503);
    expect(repository.snapshot().entities).toHaveLength(1);
  });

  it("replays real HTTP create, claim, decision and appeal commands without duplicate side effects", async () => {
    const repository = new InMemoryContactReviewRepository();
    const service = createContactReviewService({
      idFactory: (prefix) => `${prefix}-${crypto.randomUUID()}`,
      keySecret: "synthetic-http-idempotency-secret",
      repository
    });
    const integration = createContactReviewManagementIntegration({ entityType: "parent_need", service });
    const gate = {
      enabled: true as const,
      ok: true as const,
      reviewerRefs: {
        backup: ["backup-http", "backup-http-alt"],
        primary: ["primary-http", "primary-http-alt"],
        secondReview: ["second-http", "second-http-alt"]
      }
    };
    const collection = {
      doc: () => ({ get: async () => ({ data: [] }), set: async () => ({}) }),
      where: () => ({ get: async () => ({ data: [] }) })
    };
    const ownerHandlers = createParentNeedManagementHandlers({
      collection,
      contactReview: integration,
      contactReviewGate: gate,
      env: { NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true", NODE_ENV: "test" }
    });
    const actionHandlers = createContactReviewApiHandlers({
      env: { NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true", NODE_ENV: "test" },
      gate,
      service
    });
    const payload = {
      budgetMax: "120",
      budgetMin: "80",
      childIntro: "合成 HTTP 幂等简介",
      community: "合成小区",
      grade: "初一",
      region: { city: "合成市", district: "合成区", province: "合成省" },
      subjects: ["数学"],
      teacherGenderPreference: "不限",
      timeSlots: ["周六下午"]
    };
    const createRequest = (body = payload) => new Request("http://localhost/api/parent-needs", {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        "idempotency-key": "http-create-key",
        "x-ungradu-test-user-phone": "owner-http"
      },
      method: "POST"
    });
    const firstCreate = await ownerHandlers.POST_COLLECTION(createRequest());
    expect(firstCreate.status).toBe(200);
    const firstCreateBody = await firstCreate.json() as { value: { id: string; version: number } };
    const afterCreate = repository.snapshot();
    const replayCreate = await ownerHandlers.POST_COLLECTION(createRequest());
    expect(replayCreate.status).toBe(200);
    await expect(replayCreate.json()).resolves.toMatchObject({
      ok: true,
      value: { id: firstCreateBody.value.id, version: firstCreateBody.value.version }
    });
    expect(repository.snapshot()).toEqual(afterCreate);
    const conflictingCreate = await ownerHandlers.POST_COLLECTION(createRequest({
      ...payload,
      childIntro: "同 key 不同正文"
    }));
    expect(conflictingCreate.status).toBe(409);
    expect(repository.snapshot()).toEqual(afterCreate);

    const actionRequest = (userId: string, idempotencyKey: string, body: Record<string, unknown>) =>
      new Request("http://localhost/api/contact-review", {
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
          "idempotency-key": idempotencyKey,
          "x-ungradu-test-user-phone": userId
        },
        method: "POST"
      });
    let snapshot = repository.snapshot();
    let task = snapshot.tasks[0];
    let aggregate = snapshot.aggregates[0];
    const claimBody = {
      action: "claim_field",
      expectedAggregateRevision: aggregate.aggregateRevision,
      expectedTaskRevision: task.taskRevision,
      taskId: task.taskId
    };
    const firstClaimResponse = await actionHandlers.POST_ACTION(actionRequest("primary-http", "http-claim-field", claimBody));
    expect(firstClaimResponse.status).toBe(200);
    const firstClaimBody = await firstClaimResponse.json() as { value: Record<string, unknown> };
    const afterClaim = repository.snapshot();
    expect((await actionHandlers.POST_ACTION(actionRequest("primary-http", "http-claim-field", claimBody))).status).toBe(200);
    expect(repository.snapshot()).toEqual(afterClaim);
    expect((await actionHandlers.POST_ACTION(actionRequest("primary-http-alt", "http-claim-field", claimBody))).status).toBe(200);
    expect(repository.snapshot()).toEqual(afterClaim);
    expect((await actionHandlers.POST_ACTION(actionRequest("backup-http", "http-claim-field", {
      ...claimBody,
      expectedTaskRevision: Number(claimBody.expectedTaskRevision) + 1
    }))).status).toBe(409);
    expect(repository.snapshot()).toEqual(afterClaim);
    expect((await actionHandlers.POST_ACTION(actionRequest("not-a-reviewer", "http-claim-field", claimBody))).status).toBe(403);
    expect(repository.snapshot()).toEqual(afterClaim);

    snapshot = repository.snapshot();
    task = snapshot.tasks[0];
    aggregate = snapshot.aggregates[0];
    const decisionBody = {
      action: "decide_field",
      decisions: [{ decision: "rejected" }],
      expectedAggregateRevision: aggregate.aggregateRevision,
      expectedTaskRevision: task.taskRevision,
      taskId: task.taskId
    };
    const firstDecisionResponse = await actionHandlers.POST_ACTION(actionRequest("primary-http", "http-decide-field", decisionBody));
    expect(firstDecisionResponse.status).toBe(200);
    const firstDecisionBody = await firstDecisionResponse.json() as { value: Record<string, unknown> };
    const afterDecision = repository.snapshot();
    expect((await actionHandlers.POST_ACTION(actionRequest("primary-http", "http-decide-field", decisionBody))).status).toBe(200);
    expect(repository.snapshot()).toEqual(afterDecision);
    expect((await actionHandlers.POST_ACTION(actionRequest("primary-http-alt", "http-decide-field", decisionBody))).status).toBe(200);
    expect(repository.snapshot()).toEqual(afterDecision);
    expect((await actionHandlers.POST_ACTION(actionRequest("backup-http", "http-decide-field", {
      ...decisionBody,
      decisions: [{ decision: "published" }]
    }))).status).toBe(409);
    expect(repository.snapshot()).toEqual(afterDecision);
    const delayedClaim = await actionHandlers.POST_ACTION(actionRequest("primary-http-alt", "http-claim-field", claimBody));
    expect(delayedClaim.status).toBe(200);
    await expect(delayedClaim.json()).resolves.toMatchObject({ replayed: true, value: firstClaimBody.value });
    expect(repository.snapshot()).toEqual(afterDecision);

    const appealBody = {
      action: "appeal",
      entityId: firstCreateBody.value.id,
      entityType: "parent_need",
      expectedEntityRevision: firstCreateBody.value.version
    };
    const firstAppealResponse = await actionHandlers.POST_ACTION(actionRequest("owner-http", "http-appeal", appealBody));
    expect(firstAppealResponse.status).toBe(200);
    const firstAppealBody = await firstAppealResponse.json() as { value: Record<string, unknown> };
    const afterAppeal = repository.snapshot();
    expect((await actionHandlers.POST_ACTION(actionRequest("owner-http", "http-appeal", appealBody))).status).toBe(200);
    expect(repository.snapshot()).toEqual(afterAppeal);
    expect((await actionHandlers.POST_ACTION(actionRequest("owner-http", "http-appeal", {
      ...appealBody,
      expectedEntityRevision: Number(appealBody.expectedEntityRevision) + 1
    }))).status).toBe(409);

    snapshot = repository.snapshot();
    task = snapshot.tasks[0];
    aggregate = snapshot.aggregates[0];
    const appealRequestId = aggregate.appealRequestId!;
    const claimAppealBody = {
      action: "claim_appeal",
      appealRequestId,
      expectedAggregateRevision: aggregate.aggregateRevision,
      expectedTaskRevisions: { [task.taskId]: task.taskRevision },
      handoffReasonCode: "appeal_triage_handoff"
    };
    const firstAppealClaimResponse = await actionHandlers.POST_ACTION(actionRequest("backup-http", "http-claim-appeal", claimAppealBody));
    expect(firstAppealClaimResponse.status).toBe(200);
    const firstAppealClaimBody = await firstAppealClaimResponse.json() as { value: Record<string, unknown> };
    const afterAppealClaim = repository.snapshot();
    expect((await actionHandlers.POST_ACTION(actionRequest("backup-http", "http-claim-appeal", claimAppealBody))).status).toBe(200);
    expect(repository.snapshot()).toEqual(afterAppealClaim);
    expect((await actionHandlers.POST_ACTION(actionRequest("backup-http-alt", "http-claim-appeal", claimAppealBody))).status).toBe(200);
    expect(repository.snapshot()).toEqual(afterAppealClaim);
    expect((await actionHandlers.POST_ACTION(actionRequest("primary-http-alt", "http-claim-appeal", {
      ...claimAppealBody,
      expectedAggregateRevision: Number(claimAppealBody.expectedAggregateRevision) + 1
    }))).status).toBe(409);
    expect(repository.snapshot()).toEqual(afterAppealClaim);
    const delayedDecision = await actionHandlers.POST_ACTION(actionRequest("primary-http-alt", "http-decide-field", decisionBody));
    expect(delayedDecision.status).toBe(200);
    await expect(delayedDecision.json()).resolves.toMatchObject({ replayed: true, value: firstDecisionBody.value });
    const delayedAppeal = await actionHandlers.POST_ACTION(actionRequest("owner-http", "http-appeal", appealBody));
    expect(delayedAppeal.status).toBe(200);
    await expect(delayedAppeal.json()).resolves.toMatchObject({ replayed: true, value: firstAppealBody.value });
    expect(repository.snapshot()).toEqual(afterAppealClaim);

    snapshot = repository.snapshot();
    task = snapshot.tasks[0];
    aggregate = snapshot.aggregates[0];
    const appealDecisionBody = {
      action: "decide_appeal",
      appealRequestId,
      decisions: [{ decision: "rejected", reasonCode: "appeal_rejected", taskId: task.taskId }],
      expectedAggregateRevision: aggregate.aggregateRevision,
      expectedTaskRevisions: { [task.taskId]: task.taskRevision }
    };
    expect((await actionHandlers.POST_ACTION(actionRequest("second-http", "http-decide-appeal", appealDecisionBody))).status).toBe(200);
    const afterAppealDecision = repository.snapshot();
    expect((await actionHandlers.POST_ACTION(actionRequest("second-http", "http-decide-appeal", appealDecisionBody))).status).toBe(200);
    expect(repository.snapshot()).toEqual(afterAppealDecision);
    expect((await actionHandlers.POST_ACTION(actionRequest("second-http-alt", "http-decide-appeal", appealDecisionBody))).status).toBe(200);
    expect(repository.snapshot()).toEqual(afterAppealDecision);
    expect((await actionHandlers.POST_ACTION(actionRequest("primary-http-alt", "http-decide-appeal", appealDecisionBody))).status).toBe(403);
    expect(repository.snapshot()).toEqual(afterAppealDecision);
    expect((await actionHandlers.POST_ACTION(actionRequest("second-http-alt", "http-decide-appeal", {
      ...appealDecisionBody,
      decisions: [{ decision: "rejected", reasonCode: "different_reason", taskId: task.taskId }]
    }))).status).toBe(409);
    expect(repository.snapshot()).toEqual(afterAppealDecision);
    const delayedAppealClaim = await actionHandlers.POST_ACTION(actionRequest(
      "backup-http-alt",
      "http-claim-appeal",
      claimAppealBody
    ));
    expect(delayedAppealClaim.status).toBe(200);
    await expect(delayedAppealClaim.json()).resolves.toMatchObject({
      replayed: true,
      value: firstAppealClaimBody.value
    });
    expect(repository.snapshot()).toEqual(afterAppealDecision);
  });

  it("fails an appeal decision closed when persisted triage ownership is polluted to the content owner", async () => {
    const database = new SyntheticCloudBaseDatabase();
    const repository = createCloudBaseContactReviewRepository({ database });
    const service = createContactReviewService({
      idFactory: (prefix) => `${prefix}-${crypto.randomUUID()}`,
      keySecret: "synthetic-pollution-secret",
      repository
    });
    const created = await service.submit({
      candidate: { abilityDescription: "合成污染状态说明" },
      entityId: "tutor-polluted-triage",
      entityType: "tutor_profile",
      idempotencyKey: "pollution-create",
      operation: "create",
      ownerId: "owner-polluted-triage",
      reviewFields: { abilityDescription: "合成污染状态说明" },
      now: "2026-08-23T00:00:00.000Z",
      requestId: "pollution-create-request"
    });
    expect(created.ok).toBe(true);
    let task = [...database.stores.get(CONTACT_REVIEW_COLLECTIONS.tasks)!.values()][0];
    await service.decideField({
      decision: "rejected",
      expectedAggregateRevision: 1,
      expectedTaskRevision: 1,
      idempotencyKey: "pollution-reject",
      now: "2026-08-23T00:05:00.000Z",
      operator: { id: "primary-pollution", role: "primary" },
      taskId: String(task.taskId)
    });
    await service.createAppeal({
      entityId: "tutor-polluted-triage",
      entityType: "tutor_profile",
      expectedEntityRevision: 1,
      idempotencyKey: "pollution-appeal",
      now: "2026-08-23T00:10:00.000Z",
      operatorId: "owner-polluted-triage",
      requestId: "pollution-appeal-request"
    });
    let aggregate = [...database.stores.get(CONTACT_REVIEW_COLLECTIONS.aggregates)!.values()][0];
    task = [...database.stores.get(CONTACT_REVIEW_COLLECTIONS.tasks)!.values()][0];
    await service.claimAppeal({
      appealRequestId: String(aggregate.appealRequestId),
      expectedAggregateRevision: Number(aggregate.aggregateRevision),
      expectedTaskRevisions: { [String(task.taskId)]: Number(task.taskRevision) },
      handoffReasonCode: "pollution_fixture_handoff",
      idempotencyKey: "pollution-claim",
      now: "2026-08-23T00:15:00.000Z",
      operator: { id: "backup-pollution", role: "backup" }
    });
    task = [...database.stores.get(CONTACT_REVIEW_COLLECTIONS.tasks)!.values()][0];
    database.stores.get(CONTACT_REVIEW_COLLECTIONS.tasks)!.set(String(task.taskId), {
      ...task,
      triageReviewerRef: "owner-polluted-triage"
    });
    aggregate = [...database.stores.get(CONTACT_REVIEW_COLLECTIONS.aggregates)!.values()][0];
    task = [...database.stores.get(CONTACT_REVIEW_COLLECTIONS.tasks)!.values()][0];

    const decided = await service.decideAppeal({
      appealRequestId: String(aggregate.appealRequestId),
      decisions: [{
        decision: "published",
        reasonCode: "polluted_state_must_not_publish",
        taskId: String(task.taskId)
      }],
      expectedAggregateRevision: Number(aggregate.aggregateRevision),
      expectedTaskRevisions: { [String(task.taskId)]: Number(task.taskRevision) },
      idempotencyKey: "pollution-second-decision",
      now: "2026-08-23T00:20:00.000Z",
      operator: { id: "second-pollution", role: "second-review" }
    });

    expect(decided).toMatchObject({ code: "REVIEW_ROLE_FORBIDDEN", ok: false, status: 403 });
    expect([...database.stores.get(CONTACT_REVIEW_COLLECTIONS.tasks)!.values()][0]).toMatchObject({
      decision: null,
      secondReviewerRef: null,
      status: "needs_manual_review"
    });
    expect([...database.stores.get(CONTACT_REVIEW_COLLECTIONS.aggregates)!.values()][0])
      .toMatchObject({ aggregateStatus: "needs_manual_review" });
    expect([...database.stores.get(CONTACT_REVIEW_COLLECTIONS.auditEvents)!.values()].at(-1))
      .toMatchObject({ eventType: "appeal_decision_rejected", operatorRef: "second-pollution" });
    expect(await service.readPublic("tutor_profile", "tutor-polluted-triage"))
      .toEqual({ ok: true, value: null });
  });

  it("exposes a reviewer-only queue, CAS field claim, and non-sensitive operational health", async () => {
    const repository = new InMemoryContactReviewRepository();
    const service = createContactReviewService({
      idFactory: (prefix) => `${prefix}-reviewer-route`,
      keySecret: "synthetic-runtime-secret",
      repository
    });
    await service.submit({
      candidate: { childIntro: "仅审核员可见的合成待审内容" },
      entityType: "parent_need",
      idempotencyKey: "reviewer-route-create",
      operation: "create",
      ownerId: "owner-route",
      reviewFields: { childIntro: "仅审核员可见的合成待审内容" },
      now: "2026-08-23T00:00:00.000Z",
      requestId: "reviewer-route-request"
    });
    const gate = {
      enabled: true as const,
      ok: true as const,
      reviewerRefs: {
        backup: ["backup-route"],
        primary: ["primary-route"],
        secondReview: ["second-route"]
      }
    };
    const handlers = createContactReviewApiHandlers({
      env: { NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true", NODE_ENV: "test" },
      gate,
      service
    });

    const ownerQueue = await handlers.GET_STATUS(new Request(
      "http://localhost/api/contact-review?scope=queue",
      { headers: { "x-ungradu-test-user-phone": "owner-route" } }
    ));
    expect(ownerQueue.status).toBe(403);

    const queueResponse = await handlers.GET_STATUS(new Request(
      "http://localhost/api/contact-review?scope=queue",
      { headers: { "x-ungradu-test-user-phone": "primary-route" } }
    ));
    expect(queueResponse.status).toBe(200);
    const queueBody = await queueResponse.json();
    expect(queueBody).toMatchObject({
      ok: true,
      value: [{
        aggregateRevision: 1,
        field: "childIntro",
        reviewText: "仅审核员可见的合成待审内容",
        status: "pending_review",
        taskRevision: 1
      }]
    });
    expect(JSON.stringify(queueBody)).not.toContain("synthetic-runtime-secret");

    const task = queueBody.value[0] as { aggregateRevision: number; taskId: string; taskRevision: number };
    const malformedClaim = await handlers.POST_ACTION(new Request("http://localhost/api/contact-review", {
      body: JSON.stringify({ action: "claim_field", taskId: task.taskId }),
      headers: {
        "content-type": "application/json",
        "idempotency-key": "reviewer-route-claim",
        "x-ungradu-test-user-phone": "primary-route"
      },
      method: "POST"
    }));
    expect(malformedClaim.status).toBe(422);

    const secondReviewerClaim = await handlers.POST_ACTION(new Request("http://localhost/api/contact-review", {
      body: JSON.stringify({
        action: "claim_field",
        expectedAggregateRevision: task.aggregateRevision,
        expectedTaskRevision: task.taskRevision,
        taskId: task.taskId
      }),
      headers: {
        "content-type": "application/json",
        "x-ungradu-test-user-phone": "second-route"
      },
      method: "POST"
    }));
    expect(secondReviewerClaim.status).toBe(403);

    const claimResponse = await handlers.POST_ACTION(new Request("http://localhost/api/contact-review", {
      body: JSON.stringify({
        action: "claim_field",
        expectedAggregateRevision: task.aggregateRevision,
        expectedTaskRevision: task.taskRevision,
        taskId: task.taskId
      }),
      headers: {
        "content-type": "application/json",
        "idempotency-key": "reviewer-route-valid-claim",
        "x-ungradu-test-user-phone": "primary-route"
      },
      method: "POST"
    }));
    expect(claimResponse.status).toBe(200);
    expect(repository.snapshot().tasks[0]).toMatchObject({
      status: "pending_review",
      triageReviewerRef: "primary-route",
      triageReviewerRole: "primary"
    });

    const healthResponse = await handlers.GET_STATUS(new Request(
      "http://localhost/api/contact-review?scope=health",
      { headers: { "x-ungradu-test-user-phone": "primary-route" } }
    ));
    expect(healthResponse.status).toBe(200);
    await expect(healthResponse.json()).resolves.toMatchObject({
      ok: true,
      value: {
        aggregateIntegrityFailures: 0,
        enabled: true,
        pendingTaskCount: 1,
        repositoryReachable: true
      }
    });
  });
});

describe("ISSUE-0036 production review transaction", () => {
  it("keeps a create hidden until every required field is approved in one transaction", async () => {
    const repository = new InMemoryContactReviewRepository();
    const service = createContactReviewService({
      idFactory: (prefix) => `${prefix}-fixed`,
      keySecret: "synthetic-review-key-secret",
      repository
    });

    const created = await service.submit({
      candidate: { childIntro: "合成孩子简介", contact: "synthetic-private-contact" },
      entityType: "parent_need",
      idempotencyKey: "create-parent-fixed",
      operation: "create",
      ownerId: "owner-a",
      reviewFields: { childIntro: "合成孩子简介" },
      now: "2026-08-23T12:00:00.000Z",
      requestId: "request-create-fixed"
    });

    expect(created).toMatchObject({
      ok: true,
      value: {
        activePublishedVersion: null,
        aggregateStatus: "pending_review",
        currentVersion: 1,
        pendingReviewVersion: 1,
        publicVisibility: "hidden"
      }
    });
    expect(await service.readPublic("parent_need", "contact-review-entity-fixed"))
      .toEqual({ ok: true, value: null });

    const task = repository.snapshot().tasks[0];
    const decision = await service.decideField({
      decision: "published",
      expectedAggregateRevision: 1,
      expectedTaskRevision: 1,
      idempotencyKey: "decision-parent-fixed",
      now: "2026-08-23T12:05:00.000Z",
      operator: { id: "reviewer-primary", role: "primary" },
      taskId: task.taskId
    });

    expect(decision).toMatchObject({
      ok: true,
      value: {
        activePublishedVersion: 1,
        aggregateStatus: "published",
        pendingReviewVersion: null,
        publicVisibility: "published"
      }
    });
    expect(await service.readPublic("parent_need", "contact-review-entity-fixed"))
      .toEqual({
        ok: true,
        value: { childIntro: "合成孩子简介" }
      });
  });

  it("keeps the approved snapshot during edit, hides immediately on delete, and restores through review", async () => {
    const repository = new InMemoryContactReviewRepository();
    const service = createContactReviewService({
      idFactory: (prefix) => `${prefix}-${repository.snapshot().audits.length + 1}`,
      keySecret: "synthetic-review-key-secret",
      repository
    });
    const created = await service.submit({
      candidate: { childIntro: "旧批准内容" },
      entityType: "parent_need",
      idempotencyKey: "create-old-snapshot",
      operation: "create",
      ownerId: "owner-a",
      reviewFields: { childIntro: "旧批准内容" },
      now: "2026-08-23T12:00:00.000Z",
      requestId: "request-create-old"
    });
    expect(created.ok).toBe(true);
    const firstTask = repository.snapshot().tasks[0];
    await service.decideField({
      decision: "published",
      expectedAggregateRevision: 1,
      expectedTaskRevision: 1,
      idempotencyKey: "approve-old",
      now: "2026-08-23T12:05:00.000Z",
      operator: { id: "reviewer-primary", role: "primary" },
      taskId: firstTask.taskId
    });

    const edited = await service.submit({
      candidate: { childIntro: "新待审内容" },
      entityId: created.ok ? created.value.entityId : "",
      entityType: "parent_need",
      expectedEntityRevision: 2,
      idempotencyKey: "edit-new-snapshot",
      operation: "edit",
      ownerId: "owner-a",
      reviewFields: { childIntro: "新待审内容" },
      now: "2026-08-23T13:00:00.000Z",
      requestId: "request-edit-new"
    });
    expect(edited).toMatchObject({
      ok: true,
      value: { activePublishedVersion: 1, pendingReviewVersion: 2, publicVisibility: "published" }
    });
    expect(await service.readPublic("parent_need", created.ok ? created.value.entityId : ""))
      .toEqual({ ok: true, value: { childIntro: "旧批准内容" } });

    const deleted = await service.deleteEntity({
      entityId: created.ok ? created.value.entityId : "",
      entityType: "parent_need",
      expectedEntityRevision: 3,
      idempotencyKey: "delete-parent-fixed",
      now: "2026-08-23T14:00:00.000Z",
      operatorId: "owner-a",
      requestId: "request-delete-fixed"
    });
    expect(deleted).toMatchObject({
      ok: true,
      value: { pendingReviewVersion: null, publicVisibility: "deleted" }
    });
    expect(await service.readPublic("parent_need", created.ok ? created.value.entityId : ""))
      .toEqual({ ok: true, value: null });

    const restored = await service.submit({
      candidate: { childIntro: "恢复后重新审核" },
      entityId: created.ok ? created.value.entityId : "",
      entityType: "parent_need",
      expectedEntityRevision: 4,
      idempotencyKey: "restore-parent-fixed",
      operation: "restore",
      ownerId: "owner-a",
      reviewFields: { childIntro: "恢复后重新审核" },
      now: "2026-08-23T15:00:00.000Z",
      requestId: "request-restore-fixed"
    });
    expect(restored).toMatchObject({
      ok: true,
      value: { activePublishedVersion: 1, currentVersion: 3, pendingReviewVersion: 3, publicVisibility: "hidden" }
    });
  });

  it("rejects published restore and deleted edit with zero lifecycle side effects", async () => {
    const repository = new InMemoryContactReviewRepository();
    const service = createContactReviewService({
      idFactory: (prefix) => `${prefix}-${crypto.randomUUID()}`,
      keySecret: "synthetic-lifecycle-secret",
      repository
    });
    const created = await service.submit({
      candidate: { childIntro: "合成生命周期内容" },
      entityId: "parent-lifecycle-matrix",
      entityType: "parent_need",
      idempotencyKey: "lifecycle-create",
      operation: "create",
      ownerId: "owner-lifecycle",
      reviewFields: { childIntro: "合成生命周期内容" },
      now: "2026-08-23T00:00:00.000Z",
      requestId: "lifecycle-create-request"
    });
    expect(created.ok).toBe(true);
    const task = repository.snapshot().tasks[0];
    await service.decideField({
      decision: "published",
      expectedAggregateRevision: 1,
      expectedTaskRevision: 1,
      idempotencyKey: "lifecycle-publish",
      now: "2026-08-23T00:05:00.000Z",
      operator: { id: "primary-lifecycle", role: "primary" },
      taskId: task.taskId
    });
    const published = repository.snapshot();

    expect(await service.submit({
      candidate: { childIntro: "不应执行的 published restore" },
      entityId: "parent-lifecycle-matrix",
      entityType: "parent_need",
      expectedEntityRevision: published.entities[0].entityRevision,
      idempotencyKey: "lifecycle-invalid-published-restore",
      operation: "restore",
      ownerId: "owner-lifecycle",
      reviewFields: { childIntro: "不应执行的 published restore" },
      now: "2026-08-23T00:10:00.000Z",
      requestId: "lifecycle-invalid-published-restore-request"
    })).toMatchObject({ code: "REVIEW_VERSION_CONFLICT", ok: false, status: 409 });
    expect(repository.snapshot()).toEqual(published);

    const deleted = await service.deleteEntity({
      entityId: "parent-lifecycle-matrix",
      entityType: "parent_need",
      expectedEntityRevision: published.entities[0].entityRevision,
      idempotencyKey: "lifecycle-delete",
      now: "2026-08-23T00:15:00.000Z",
      operatorId: "owner-lifecycle",
      requestId: "lifecycle-delete-request"
    });
    expect(deleted.ok).toBe(true);
    const deletedState = repository.snapshot();

    expect(await service.submit({
      candidate: { childIntro: "不应执行的 deleted edit" },
      entityId: "parent-lifecycle-matrix",
      entityType: "parent_need",
      expectedEntityRevision: deletedState.entities[0].entityRevision,
      idempotencyKey: "lifecycle-invalid-deleted-edit",
      operation: "edit",
      ownerId: "owner-lifecycle",
      reviewFields: { childIntro: "不应执行的 deleted edit" },
      now: "2026-08-23T00:20:00.000Z",
      requestId: "lifecycle-invalid-deleted-edit-request"
    })).toMatchObject({ code: "REVIEW_VERSION_CONFLICT", ok: false, status: 409 });
    expect(repository.snapshot()).toEqual(deletedState);
  });

  it("requires a version-level one-time appeal, separate triage and second reviewers, and controlled resume", async () => {
    const repository = new InMemoryContactReviewRepository();
    const service = createContactReviewService({
      idFactory: (prefix) => `${prefix}-${repository.snapshot().audits.length + 1}`,
      keySecret: "synthetic-review-key-secret",
      repository
    });
    const created = await service.submit({
      candidate: { abilityDescription: "合成能力说明" },
      entityType: "tutor_profile",
      idempotencyKey: "create-tutor-appeal",
      operation: "create",
      ownerId: "owner-tutor",
      reviewFields: { abilityDescription: "合成能力说明" },
      now: "2026-08-23T10:00:00.000Z",
      requestId: "request-create-tutor"
    });
    expect(created.ok).toBe(true);
    const task = repository.snapshot().tasks[0];
    await service.decideField({
      decision: "rejected",
      expectedAggregateRevision: 1,
      expectedTaskRevision: 1,
      idempotencyKey: "reject-tutor",
      now: "2026-08-23T10:05:00.000Z",
      operator: { id: "reviewer-primary", role: "primary" },
      taskId: task.taskId
    });

    const appealed = await service.createAppeal({
      entityId: created.ok ? created.value.entityId : "",
      entityType: "tutor_profile",
      expectedEntityRevision: 1,
      idempotencyKey: "appeal-tutor-once",
      now: "2026-08-23T10:10:00.000Z",
      operatorId: "owner-tutor",
      requestId: "request-appeal-tutor"
    });
    expect(appealed).toMatchObject({ ok: true, value: { aggregateStatus: "appeal_pending" } });
    const appealRequestId = repository.snapshot().aggregates[0].appealRequestId;
    expect(appealRequestId).toBeTruthy();
    expect(await service.createAppeal({
      entityId: created.ok ? created.value.entityId : "",
      entityType: "tutor_profile",
      expectedEntityRevision: 1,
      idempotencyKey: "appeal-tutor-twice",
      now: "2026-08-23T10:11:00.000Z",
      operatorId: "owner-tutor",
      requestId: "request-appeal-tutor-twice"
    })).toMatchObject({ code: "APPEAL_ALREADY_USED", ok: false, status: 409 });

    const beforeHandoff = repository.snapshot();
    expect(await service.claimAppeal({
      appealRequestId: appealRequestId ?? "",
      expectedAggregateRevision: 3,
      expectedTaskRevisions: { [task.taskId]: 3 },
      idempotencyKey: "claim-appeal-without-handoff-reason",
      now: "2026-08-23T10:15:00.000Z",
      operator: { id: "reviewer-backup", role: "backup" }
    })).toMatchObject({ code: "REVIEW_INPUT_INVALID", ok: false, status: 422 });
    expect(repository.snapshot()).toEqual(beforeHandoff);

    const claimed = await service.claimAppeal({
      appealRequestId: appealRequestId ?? "",
      expectedAggregateRevision: 3,
      expectedTaskRevisions: { [task.taskId]: 3 },
      handoffReasonCode: "appeal_triage_handoff",
      idempotencyKey: "claim-appeal-tutor",
      now: "2026-08-23T10:15:00.000Z",
      operator: { id: "reviewer-backup", role: "backup" }
    });
    expect(claimed).toMatchObject({ ok: true, value: { aggregateStatus: "appeal_pending" } });

    const invalidSecond = await service.decideAppeal({
      appealRequestId: appealRequestId ?? "",
      decisions: [{ decision: "published", reasonCode: "appeal_approved", taskId: task.taskId }],
      expectedAggregateRevision: 4,
      expectedTaskRevisions: { [task.taskId]: 4 },
      idempotencyKey: "invalid-second",
      now: "2026-08-23T10:20:00.000Z",
      operator: { id: "reviewer-backup", role: "second-review" }
    });
    expect(invalidSecond).toMatchObject({ code: "REVIEW_ROLE_FORBIDDEN", ok: false, status: 403 });
    expect(repository.snapshot().aggregates[0].aggregateStatus).toBe("needs_manual_review");

    const resumed = await service.resumeAppealReview({
      appealRequestId: appealRequestId ?? "",
      dependencyRecoveryRef: "synthetic-recovery-evidence",
      expectedAggregateRevision: 5,
      expectedTaskRevisions: { [task.taskId]: 5 },
      idempotencyKey: "resume-appeal",
      now: "2026-08-23T10:25:00.000Z",
      operator: { id: "reviewer-primary", role: "primary" },
      resumeReasonCode: "reviewer_separation_restored"
    });
    expect(resumed).toMatchObject({ ok: true, value: { aggregateStatus: "appeal_pending" } });

    const final = await service.decideAppeal({
      appealRequestId: appealRequestId ?? "",
      decisions: [{ decision: "published", reasonCode: "appeal_approved", taskId: task.taskId }],
      expectedAggregateRevision: 6,
      expectedTaskRevisions: { [task.taskId]: 6 },
      idempotencyKey: "valid-second",
      now: "2026-08-23T10:30:00.000Z",
      operator: { id: "reviewer-second", role: "second-review" }
    });
    expect(final).toMatchObject({
      ok: true,
      value: { activePublishedVersion: 1, aggregateStatus: "published", pendingReviewVersion: null }
    });
    const audits = repository.snapshot().audits;
    expect(audits.find((audit) => audit.eventType === "appeal_created")).toMatchObject({
      aggregateStatusAfter: "appeal_pending",
      aggregateStatusBefore: "rejected",
      appealedFieldSetDigest: expect.any(String),
      entityVersion: 1,
      idempotencyKeyHash: expect.any(String),
      occurredAt: "2026-08-23T10:10:00.000Z",
      operation: "appeal",
      operatorRef: "owner-tutor",
      operatorRole: "content-owner",
      toStatus: "appeal_pending"
    });
    expect(audits.find((audit) => audit.eventType === "appeal_claimed")).toMatchObject({
      aggregateStatusAfter: "appeal_pending",
      aggregateStatusBefore: "appeal_pending",
      claimAt: "2026-08-23T10:15:00.000Z",
      idempotencyKeyHash: expect.any(String),
      occurredAt: "2026-08-23T10:15:00.000Z",
      operation: "claimAppeal",
      previousTriageReviewerRef: "reviewer-primary",
      reasonCode: "appeal_triage_handoff",
      triageReviewerRef: "reviewer-backup",
      triageReviewerRole: "backup"
    });
    expect(audits.find((audit) => audit.eventType === "appeal_resumed")).toMatchObject({
      aggregateStatusAfter: "appeal_pending",
      aggregateStatusBefore: "needs_manual_review",
      dependencyRecoveryRef: "synthetic-recovery-evidence",
      idempotencyKeyHash: expect.any(String),
      occurredAt: "2026-08-23T10:25:00.000Z",
      operation: "resumeAppealReview",
      previousTriageReviewerRef: "reviewer-backup",
      resumeReasonCode: "reviewer_separation_restored",
      resumedAt: "2026-08-23T10:25:00.000Z",
      triageReviewerRef: "reviewer-primary"
    });
    expect(audits.find((audit) => audit.eventType === "appeal_decided")).toMatchObject({
      aggregateStatusAfter: "published",
      aggregateStatusBefore: "appeal_pending",
      appealedFieldSetDigest: expect.any(String),
      decidedAt: "2026-08-23T10:30:00.000Z",
      fieldDecisionMap: {
        abilityDescription: {
          decision: "published",
          reasonCode: "appeal_approved",
          secondReviewerRef: "reviewer-second",
          taskId: task.taskId,
          triageReviewerRef: "reviewer-primary"
        }
      },
      nextPublishedVersion: 1,
      nextPublicVisibility: "published",
      idempotencyKeyHash: expect.any(String),
      occurredAt: "2026-08-23T10:30:00.000Z",
      operation: "decideAppeal",
      previousPublishedVersion: null,
      previousPublicVisibility: "hidden"
    });
  });

  it("keeps idempotency, owner separation, CAS, and repository failures free of partial side effects", async () => {
    const repository = new InMemoryContactReviewRepository();
    const service = createContactReviewService({
      idFactory: (prefix) => `${prefix}-${repository.snapshot().audits.length + 1}`,
      keySecret: "synthetic-review-key-secret",
      repository
    });
    const request = {
      candidate: { childIntro: "合成待审简介" },
      entityType: "parent_need" as const,
      idempotencyKey: "create-idempotent",
      operation: "create" as const,
      ownerId: "owner-a",
      reviewFields: { childIntro: "合成待审简介" },
      now: "2026-08-23T08:00:00.000Z",
      requestId: "request-idempotent"
    };

    const created = await service.submit(request);
    expect(created).toMatchObject({ ok: true, replayed: false });
    const committed = repository.snapshot();
    expect(await service.submit(request)).toMatchObject({ ok: true, replayed: true });
    expect(repository.snapshot()).toEqual(committed);

    expect(await service.submit({
      ...request,
      candidate: { childIntro: "相同命令键但不同内容" },
      reviewFields: { childIntro: "相同命令键但不同内容" }
    })).toMatchObject({ code: "IDEMPOTENCY_KEY_REUSED", ok: false, status: 409 });
    expect(repository.snapshot()).toEqual(committed);

    const task = committed.tasks[0];
    expect(await service.decideField({
      decision: "published",
      expectedAggregateRevision: 1,
      expectedTaskRevision: 1,
      idempotencyKey: "owner-self-review",
      now: "2026-08-23T08:05:00.000Z",
      operator: { id: "owner-a", role: "primary" },
      taskId: task.taskId
    })).toMatchObject({ code: "REVIEW_ROLE_FORBIDDEN", ok: false, status: 403 });
    expect(repository.snapshot()).toEqual(committed);

    repository.failNextTransaction();
    expect(await service.decideField({
      decision: "published",
      expectedAggregateRevision: 1,
      expectedTaskRevision: 1,
      idempotencyKey: "repository-fault",
      now: "2026-08-23T08:06:00.000Z",
      operator: { id: "reviewer-primary", role: "primary" },
      taskId: task.taskId
    })).toMatchObject({ code: "REVIEW_UNAVAILABLE", ok: false, status: 503 });
    expect(repository.snapshot()).toEqual(committed);

    expect(await service.decideField({
      decision: "published",
      expectedAggregateRevision: 99,
      expectedTaskRevision: 1,
      idempotencyKey: "stale-cas",
      now: "2026-08-23T08:07:00.000Z",
      operator: { id: "reviewer-primary", role: "primary" },
      taskId: task.taskId
    })).toMatchObject({ code: "REVIEW_VERSION_CONFLICT", ok: false, status: 409 });
    expect(repository.snapshot()).toEqual(committed);
  });

  it("routes SLA expiry to manual review and enforces idempotent 30/180-day cleanup boundaries", async () => {
    const repository = new InMemoryContactReviewRepository();
    const service = createContactReviewService({
      idFactory: (prefix) => `${prefix}-${repository.snapshot().audits.length + 1}`,
      keySecret: "synthetic-review-key-secret",
      repository
    });
    const created = await service.submit({
      candidate: { childIntro: "合成超时内容" },
      entityType: "parent_need",
      idempotencyKey: "create-overdue",
      operation: "create",
      ownerId: "owner-overdue",
      reviewFields: { childIntro: "合成超时内容" },
      now: "2026-08-23T00:00:00.000Z",
      requestId: "request-overdue"
    });
    expect(created.ok).toBe(true);
    const before = repository.snapshot();

    expect(await service.scanOverdue({
      now: "2026-08-23T23:59:59.999Z",
      operatorRef: "synthetic-sla-scanner"
    })).toEqual({ ok: true, overdueTaskIds: [] });
    expect(repository.snapshot()).toEqual(before);

    const expired = await service.scanOverdue({
      now: "2026-08-24T00:00:00.000Z",
      operatorRef: "synthetic-sla-scanner"
    });
    expect(expired).toMatchObject({ ok: true, overdueTaskIds: [before.tasks[0].taskId] });
    expect(repository.snapshot()).toMatchObject({
      aggregates: [{ aggregateStatus: "needs_manual_review" }],
      tasks: [{ reasonCode: "review_sla_overdue", status: "needs_manual_review" }]
    });

    const approved = await service.decideField({
      decision: "published",
      expectedAggregateRevision: 2,
      expectedTaskRevision: 2,
      idempotencyKey: "approve-after-overdue",
      now: "2026-08-24T00:05:00.000Z",
      operator: { id: "reviewer-primary", role: "primary" },
      taskId: before.tasks[0].taskId
    });
    expect(approved.ok).toBe(true);
    const retained = repository.snapshot();
    repository.failNextTransaction();
    expect(await service.cleanupRetention({
      holdEntityRefs: [],
      idempotencyKey: "cleanup-storage-failure",
      now: "2026-09-23T00:04:59.999Z",
      operatorRef: "synthetic-retention-job"
    })).toMatchObject({ code: "REVIEW_UNAVAILABLE", ok: false, status: 503 });
    const afterFailedCleanup = repository.snapshot();
    expect(afterFailedCleanup.tasks).toEqual(retained.tasks);
    expect(afterFailedCleanup.idempotency).toEqual(retained.idempotency);
    expect(afterFailedCleanup.entities[0]).toMatchObject({
      activePublishedVersion: retained.entities[0].activePublishedVersion,
      entityRevision: retained.entities[0].entityRevision,
      publicVisibility: retained.entities[0].publicVisibility
    });
    expect(afterFailedCleanup.aggregates[0]).toMatchObject({
      aggregateRevision: retained.aggregates[0].aggregateRevision,
      aggregateStatus: retained.aggregates[0].aggregateStatus
    });
    expect(afterFailedCleanup.audits).toHaveLength(retained.audits.length + 1);
    expect(afterFailedCleanup.audits.at(-1)).toMatchObject({
      cleanupResult: {
        holdApplied: false,
        removedAuditCount: 0,
        removedTaskCount: 0,
        status: "failed"
      },
      eventType: "retention_cleanup_failed",
      idempotencyKeyHash: expect.any(String),
      operation: "cleanupRetention",
      operatorRef: "synthetic-retention-job",
      reasonCode: "retention_cleanup_transaction_failed"
    });

    expect(await service.cleanupRetention({
      holdEntityRefs: [],
      idempotencyKey: "cleanup-before-task-boundary",
      now: "2026-09-23T00:04:59.999Z",
      operatorRef: "synthetic-retention-job"
    })).toMatchObject({ ok: true, removedTaskCount: 0 });
    expect(repository.snapshot().tasks).toHaveLength(1);

    const taskBoundary = await service.cleanupRetention({
      holdEntityRefs: [],
      idempotencyKey: "cleanup-at-task-boundary",
      now: "2026-09-23T00:05:00.000Z",
      operatorRef: "synthetic-retention-job"
    });
    expect(taskBoundary).toMatchObject({ ok: true, removedTaskCount: 1 });
    expect(repository.snapshot().tasks).toEqual([]);
    const afterTaskBoundary = repository.snapshot();
    expect(await service.cleanupRetention({
      holdEntityRefs: [],
      idempotencyKey: "cleanup-at-task-boundary",
      now: "2026-09-23T00:06:00.000Z",
      operatorRef: "synthetic-retention-job"
    })).toMatchObject({ ok: true, replayed: true, removedTaskCount: 1 });
    expect(repository.snapshot()).toEqual(afterTaskBoundary);
    expect(await service.cleanupRetention({
      holdEntityRefs: ["parent_need:different-payload"],
      idempotencyKey: "cleanup-at-task-boundary",
      now: "2026-09-23T00:06:00.000Z",
      operatorRef: "synthetic-retention-job"
    })).toMatchObject({ code: "IDEMPOTENCY_KEY_REUSED", ok: false, status: 409 });

    const createAudit = repository.snapshot().audits.find((audit) => audit.eventType === "create_submitted")!;
    const auditBoundaryMs = Date.parse(createAudit.occurredAt) + 180 * 24 * 60 * 60 * 1000;
    expect(await service.cleanupRetention({
      holdEntityRefs: [],
      idempotencyKey: "cleanup-before-audit-boundary",
      now: new Date(auditBoundaryMs - 1).toISOString(),
      operatorRef: "synthetic-retention-job"
    })).toMatchObject({ ok: true, removedAuditCount: 0 });
    expect(repository.snapshot().audits.some((audit) => audit.eventId === createAudit.eventId)).toBe(true);
    expect(await service.cleanupRetention({
      holdEntityRefs: [],
      idempotencyKey: "cleanup-at-audit-boundary",
      now: new Date(auditBoundaryMs).toISOString(),
      operatorRef: "synthetic-retention-job"
    })).toMatchObject({ ok: true, removedAuditCount: 1 });
    expect(repository.snapshot().audits.some((audit) => audit.eventId === createAudit.eventId)).toBe(false);
    expect(repository.snapshot().audits.at(-1)).toMatchObject({
      cleanupResult: {
        auditCutoffAt: expect.any(String),
        holdApplied: false,
        removedAuditCount: 1,
        removedTaskCount: expect.any(Number),
        status: "completed",
        taskCutoffAt: expect.any(String)
      },
      eventType: "retention_cleanup",
      idempotencyKeyHash: expect.any(String),
      occurredAt: new Date(auditBoundaryMs).toISOString(),
      operation: "cleanupRetention",
      operatorRef: "synthetic-retention-job",
      operatorRole: "system"
    });
  });

  it("audits legal-hold create, extension and release and never resurrects a cleaned deleted task", async () => {
    const repository = new InMemoryContactReviewRepository();
    const service = createContactReviewService({
      idFactory: (prefix) => `${prefix}-${crypto.randomUUID()}`,
      keySecret: "synthetic-retention-hold-secret",
      repository
    });
    const created = await service.submit({
      candidate: { childIntro: "合成保留内容" },
      entityId: "parent-retention-hold",
      entityType: "parent_need",
      idempotencyKey: "retention-hold-create",
      operation: "create",
      ownerId: "owner-retention-hold",
      reviewFields: { childIntro: "合成保留内容" },
      now: "2026-08-23T00:00:00.000Z",
      requestId: "retention-hold-create-request"
    });
    expect(created.ok).toBe(true);
    const originalTask = repository.snapshot().tasks[0];
    await service.deleteEntity({
      entityId: "parent-retention-hold",
      entityType: "parent_need",
      expectedEntityRevision: 1,
      idempotencyKey: "retention-hold-delete",
      now: "2026-08-23T00:05:00.000Z",
      operatorId: "owner-retention-hold",
      requestId: "retention-hold-delete-request"
    });
    const holdRef = "parent_need:parent-retention-hold";
    expect(await service.cleanupRetention({
      holdEntityRefs: [holdRef],
      idempotencyKey: "retention-hold-create-event",
      now: "2027-03-01T00:00:00.000Z",
      operatorRef: "synthetic-retention-job"
    })).toMatchObject({ ok: true, removedAuditCount: 0, removedTaskCount: 0 });
    expect(repository.snapshot()).toMatchObject({
      audits: expect.arrayContaining([expect.objectContaining({
        cleanupResult: expect.objectContaining({ holdAction: "created", holdApplied: true })
      })]),
      tasks: [expect.objectContaining({ taskId: originalTask.taskId })]
    });

    expect(await service.cleanupRetention({
      holdEntityRefs: [holdRef],
      idempotencyKey: "retention-hold-extend-event",
      now: "2027-03-02T00:00:00.000Z",
      operatorRef: "synthetic-retention-job"
    })).toMatchObject({ ok: true, removedAuditCount: 0, removedTaskCount: 0 });
    expect(repository.snapshot().audits.at(-1)).toMatchObject({
      cleanupResult: { holdAction: "extended", holdApplied: true }
    });

    expect(await service.cleanupRetention({
      holdEntityRefs: [],
      idempotencyKey: "retention-hold-release-event",
      now: "2027-03-03T00:00:00.000Z",
      operatorRef: "synthetic-retention-job"
    })).toMatchObject({ ok: true, removedTaskCount: 1 });
    const released = repository.snapshot();
    expect(released.tasks).toEqual([]);
    expect(released.audits.at(-1)).toMatchObject({
      cleanupResult: { holdAction: "released", holdApplied: false }
    });

    const restored = await service.submit({
      candidate: { childIntro: "清理后恢复的新版本" },
      entityId: "parent-retention-hold",
      entityType: "parent_need",
      expectedEntityRevision: released.entities[0].entityRevision,
      idempotencyKey: "retention-hold-restore-new-version",
      operation: "restore",
      ownerId: "owner-retention-hold",
      reviewFields: { childIntro: "清理后恢复的新版本" },
      now: "2027-03-03T00:05:00.000Z",
      requestId: "retention-hold-restore-request"
    });
    expect(restored).toMatchObject({ ok: true, value: { currentVersion: 2, pendingReviewVersion: 2 } });
    expect(repository.snapshot().tasks[0]).toMatchObject({ entityVersion: 2, status: "pending_review" });
    expect(repository.snapshot().tasks[0].taskId).not.toBe(originalTask.taskId);
    expect(repository.snapshot().tasks[0].reviewKey).not.toBe(originalTask.reviewKey);
  });
});
