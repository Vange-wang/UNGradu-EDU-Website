export const CONTACT_REVIEW_REQUIRED_FIELDS = {
  parent_need: ["childIntro"],
  tutor_profile: ["abilityDescription"]
} as const;

export type ContactReviewEntityType = keyof typeof CONTACT_REVIEW_REQUIRED_FIELDS;
export type ContactReviewField =
  typeof CONTACT_REVIEW_REQUIRED_FIELDS[ContactReviewEntityType][number];
export type ContactReviewTaskStatus =
  | "appeal_pending"
  | "deleted"
  | "draft"
  | "needs_manual_review"
  | "pending_review"
  | "published"
  | "rejected";

export type ContactReviewFieldReview = {
  field: ContactReviewField;
  fieldStatus: ContactReviewTaskStatus;
  reviewKey: string;
  taskId: string;
};

export type ContactReviewAggregateStatus = ContactReviewTaskStatus;

export type ContactReviewPublicVisibility = "deleted" | "hidden" | "published";
export type ContactReviewReviewerRole = "backup" | "primary" | "second-review";

export type ContactReviewTaskRecord = {
  appealMode: boolean;
  classification: string;
  claimAt: string | null;
  contentHash: string;
  createdAt: string;
  decidedAt: string | null;
  decision: "published" | "rejected" | null;
  deletedAt: string | null;
  dueAt: string;
  entityId: string;
  entityType: ContactReviewEntityType;
  entityVersion: number;
  field: ContactReviewField;
  idempotencyKeyHash: string | null;
  lastAuditEventId: string;
  ownerId: string;
  reasonCode: string | null;
  restoredAt: string | null;
  reviewKey: string;
  ruleVersion: string;
  schemaVersion: 1;
  secondReviewerRef: string | null;
  secondReviewerRole: "second-review" | null;
  status: ContactReviewTaskStatus;
  taskId: string;
  taskRevision: number;
  triageReviewerRef: string | null;
  triageReviewerRole: "backup" | "primary" | null;
  updatedAt: string;
};

export type ContactReviewAggregateRecord = {
  aggregateId: string;
  aggregateRevision: number;
  aggregateStatus: ContactReviewAggregateStatus;
  appealRequestId: string | null;
  appealUsedAt: string | null;
  basePublishedVersion: number | null;
  createdAt: string;
  deletedAt: string | null;
  entityId: string;
  entityType: ContactReviewEntityType;
  entityVersion: number;
  fieldReviews: Record<string, ContactReviewFieldReview>;
  lastAuditEventId: string;
  ownerId: string;
  requiredFields: ContactReviewField[];
  requiredFieldsDigest: string;
  restoredAt: string | null;
  schemaVersion: 1;
  supersedesVersion: number | null;
  updatedAt: string;
};

export type ContactReviewEntityRecord = {
  activePublishedVersion: number | null;
  activeSnapshot: Record<string, unknown> | null;
  currentVersion: number;
  deletedAt: string | null;
  entityId: string;
  entityRevision: number;
  entityType: ContactReviewEntityType;
  lastAuditEventId: string;
  ownerId: string;
  pendingReviewVersion: number | null;
  pendingSnapshot: Record<string, unknown> | null;
  publicVisibility: ContactReviewPublicVisibility;
  updatedAt: string;
};

export type ContactReviewIdempotencyRecord = {
  completedAt: string;
  createdAt: string;
  entityId: string;
  entityType: ContactReviewEntityType;
  entityVersion: number;
  idempotencyKeyHash: string;
  operation:
    | "appeal"
    | "claimAppeal"
    | "claimField"
    | "create"
    | "decideAppeal"
    | "decideField"
    | "delete"
    | "edit"
    | "restore"
    | "resumeAppealReview";
  ownerId: string;
  receiptId: string;
  requestHash: string;
  resultCode: string;
  resultDigest: string;
  resultRef: string;
  scopeKey: string;
};

export type ContactReviewAuditRecord = {
  aggregateId: string;
  aggregateRevision: number;
  aggregateStatusAfter: ContactReviewAggregateStatus;
  aggregateStatusBefore: ContactReviewAggregateStatus | null;
  appealMode: boolean;
  appealRequestId: string | null;
  appealedFieldSetDigest: string | null;
  claimAt: string | null;
  cleanupResult: {
    auditCutoffAt: string;
    holdAction: "created" | "extended" | "released" | null;
    holdApplied: boolean;
    holdEntityRefsDigest: string;
    removedAuditCount: number;
    removedTaskCount: number;
    requestHash: string;
    status: "completed" | "failed";
    taskCutoffAt: string;
  } | null;
  contentHash: string | null;
  decidedAt: string | null;
  decision: "published" | "rejected" | null;
  dependencyRecoveryRef: string | null;
  entityId: string;
  entityType: ContactReviewEntityType;
  entityVersion: number;
  eventDigest: string;
  eventId: string;
  eventType: string;
  field: ContactReviewField | null;
  fieldDecisionMap: Record<string, {
    decision: "published" | "rejected";
    reasonCode: string;
    secondReviewerRef: string;
    taskId: string;
    triageReviewerRef: string;
  }> | null;
  fromStatus: ContactReviewTaskStatus | null;
  idempotencyKeyHash: string | null;
  occurredAt: string;
  operation: string;
  operatorRef: string;
  operatorRole: ContactReviewReviewerRole | "content-owner" | "system";
  ownerId: string;
  previousEventDigest: string | null;
  previousPublishedVersion: number | null;
  previousPublicVisibility: ContactReviewPublicVisibility;
  previousTriageReviewerRef: string | null;
  previousTriageReviewerRole: "backup" | "primary" | null;
  nextPublishedVersion: number | null;
  nextPublicVisibility: ContactReviewPublicVisibility;
  reasonCode: string | null;
  requiredFieldsDigest: string;
  resumedAt: string | null;
  resumeReasonCode: string | null;
  ruleVersion: string;
  schemaVersion: 1;
  secondReviewerRef: string | null;
  secondReviewerRole: "second-review" | null;
  taskId: string | null;
  toStatus: ContactReviewTaskStatus | null;
  triageReviewerRef: string | null;
  triageReviewerRole: "backup" | "primary" | null;
};

export type ContactReviewRepositoryState = {
  aggregates: ContactReviewAggregateRecord[];
  audits: ContactReviewAuditRecord[];
  entities: ContactReviewEntityRecord[];
  idempotency: ContactReviewIdempotencyRecord[];
  tasks: ContactReviewTaskRecord[];
};

export type ContactReviewRepositoryScope =
  | { appealRequestId: string; kind: "appeal" }
  | { entityId: string; entityType: ContactReviewEntityType; kind: "entity" }
  | { kind: "maintenance" }
  | { entityType: ContactReviewEntityType; kind: "owner"; ownerId: string }
  | { entityType: ContactReviewEntityType; kind: "public" }
  | {
    entityId: string;
    entityType: ContactReviewEntityType;
    idempotencyKeyHash: string;
    kind: "submit";
    scopeKey: string;
  }
  | { kind: "task"; taskId: string };

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

const CONTACT_REVIEW_PUBLIC_SNAPSHOT_FIELDS: Record<ContactReviewEntityType, readonly string[]> = {
  parent_need: [
    "budgetMax",
    "budgetMin",
    "childIntro",
    "createdAt",
    "grade",
    "id",
    "subjects",
    "teacherGenderPreference",
    "timeSlots"
  ],
  tutor_profile: [
    "abilityDescription",
    "createdAt",
    "feeRanges",
    "gender",
    "grades",
    "id",
    "subjects",
    "timeSlots"
  ]
};

function projectContactReviewPublicSnapshot(
  entityType: ContactReviewEntityType,
  snapshot: Record<string, unknown>
) {
  return Object.fromEntries(
    CONTACT_REVIEW_PUBLIC_SNAPSHOT_FIELDS[entityType]
      .filter((field) => Object.hasOwn(snapshot, field))
      .map((field) => [field, cloneValue(snapshot[field])])
  );
}

export class InMemoryContactReviewRepository {
  private state: ContactReviewRepositoryState = {
    aggregates: [],
    audits: [],
    entities: [],
    idempotency: [],
    tasks: []
  };
  private failTransaction = false;

  async runTransaction<T>(
    operation: (state: ContactReviewRepositoryState) => Promise<T>
  ): Promise<T> {
    const candidate = cloneValue(this.state);
    const result = await operation(candidate);
    if (this.failTransaction) {
      this.failTransaction = false;
      throw new Error("contact review repository unavailable");
    }
    this.state = candidate;
    return cloneValue(result);
  }

  failNextTransaction(): void {
    this.failTransaction = true;
  }

  async readState(): Promise<ContactReviewRepositoryState> {
    return this.snapshot();
  }

  snapshot(): ContactReviewRepositoryState {
    return cloneValue(this.state);
  }
}

export type ContactReviewRepository = {
  readState: (scope: ContactReviewRepositoryScope) => Promise<ContactReviewRepositoryState>;
  runTransaction: <T>(
    operation: (state: ContactReviewRepositoryState) => Promise<T>,
    scope: ContactReviewRepositoryScope
  ) => Promise<T>;
};

type ReviewSuccess = {
  ok: true;
  replayed: boolean;
  value: ContactReviewEntityRecord & { aggregateStatus: ContactReviewAggregateStatus };
};

type ReviewFailure = {
  code:
    | "APPEAL_ALREADY_USED"
    | "APPEAL_NOT_READY"
    | "IDEMPOTENCY_KEY_REUSED"
    | "NOT_FOUND"
    | "REVIEW_INPUT_INVALID"
    | "REVIEW_ROLE_FORBIDDEN"
    | "REVIEW_UNAVAILABLE"
    | "REVIEW_VERSION_CONFLICT";
  ok: false;
  status: 403 | 404 | 409 | 422 | 503;
};

export type ContactReviewServiceResult = ReviewSuccess | ReviewFailure;

function keyedDigest(secret: string, label: string, value: unknown): string {
  return createHmac("sha256", secret)
    .update(`${label}\u0000${JSON.stringify(value)}`, "utf8")
    .digest("hex");
}

function toFieldReviews(tasks: ContactReviewTaskRecord[]): Record<string, ContactReviewFieldReview> {
  return Object.fromEntries(tasks.map((task) => [task.field, {
    field: task.field,
    fieldStatus: task.status,
    reviewKey: task.reviewKey,
    taskId: task.taskId
  }]));
}

function withAggregate(
  entity: ContactReviewEntityRecord,
  aggregate: ContactReviewAggregateRecord,
  replayed = false
): ReviewSuccess {
  return { ok: true, replayed, value: { ...cloneValue(entity), aggregateStatus: aggregate.aggregateStatus } };
}

export function createContactReviewService({
  idFactory,
  keySecret,
  repository
}: {
  idFactory: (prefix: string) => string;
  keySecret: string;
  repository: ContactReviewRepository;
}) {
  const ruleVersion = "contact-review-rules-v1";

  function resultReference(
    entity: ContactReviewEntityRecord,
    aggregate: ContactReviewAggregateRecord
  ): string {
    const { activeSnapshot: _activeSnapshot, pendingSnapshot: _pendingSnapshot, ...stableEntity } = entity;
    void _activeSnapshot;
    void _pendingSnapshot;
    return `contact-review-result-v1:${JSON.stringify({
      ...stableEntity,
      aggregateStatus: aggregate.aggregateStatus
    })}`;
  }

  function resultDigest(resultRef: string): string {
    return keyedDigest(keySecret, "result-snapshot", resultRef);
  }

  function replayReceipt(receipt: ContactReviewIdempotencyRecord): ContactReviewServiceResult {
    const prefix = "contact-review-result-v1:";
    if (!receipt.resultRef.startsWith(prefix) || receipt.resultDigest !== resultDigest(receipt.resultRef)) {
      return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 };
    }
    try {
      const value = JSON.parse(receipt.resultRef.slice(prefix.length)) as ReviewSuccess["value"];
      if (
        value.entityId !== receipt.entityId ||
        value.entityType !== receipt.entityType ||
        value.currentVersion !== receipt.entityVersion
      ) return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 };
      return {
        ok: true,
        replayed: true,
        value: { ...value, activeSnapshot: null, pendingSnapshot: null }
      };
    } catch {
      return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 };
    }
  }

  function authoritativePublishedAggregate(
    state: ContactReviewRepositoryState,
    entity: ContactReviewEntityRecord
  ): ContactReviewAggregateRecord | null {
    if (
      entity.publicVisibility !== "published" ||
      entity.activePublishedVersion === null ||
      !entity.activeSnapshot
    ) return null;
    const aggregates = state.aggregates.filter((record) =>
      record.entityId === entity.entityId &&
      record.entityType === entity.entityType &&
      record.entityVersion === entity.activePublishedVersion
    );
    if (aggregates.length !== 1) return null;
    const aggregate = aggregates[0];
    const requiredFields = [...CONTACT_REVIEW_REQUIRED_FIELDS[entity.entityType]] as ContactReviewField[];
    if (
      aggregate.aggregateStatus !== "published" ||
      aggregate.ownerId !== entity.ownerId ||
      aggregate.requiredFields.length !== requiredFields.length ||
      aggregate.requiredFields.some((field, index) => field !== requiredFields[index]) ||
      aggregate.requiredFieldsDigest !== keyedDigest(keySecret, "required-fields", requiredFields)
    ) return null;
    const tasks = state.tasks.filter((task) =>
      task.entityId === entity.entityId &&
      task.entityType === entity.entityType &&
      task.entityVersion === aggregate.entityVersion
    );
    if (
      tasks.length !== requiredFields.length ||
      new Set(tasks.map((task) => task.taskId)).size !== tasks.length ||
      new Set(tasks.map((task) => task.reviewKey)).size !== tasks.length
    ) return null;
    for (const field of requiredFields) {
      const review = aggregate.fieldReviews[field];
      const matchingTasks = tasks.filter((task) => task.taskId === review?.taskId);
      if (!review || review.field !== field || review.fieldStatus !== "published" || matchingTasks.length !== 1) {
        return null;
      }
      const task = matchingTasks[0];
      const reviewText = entity.activeSnapshot[field];
      const expectedContentHash = typeof reviewText === "string"
        ? keyedDigest(keySecret, "content", reviewText)
        : null;
      const expectedReviewKey = expectedContentHash
        ? keyedDigest(keySecret, "review", [
          entity.ownerId,
          entity.entityType,
          entity.entityId,
          aggregate.entityVersion,
          field,
          expectedContentHash,
          task.ruleVersion
        ])
        : null;
      const reviewerIntegrity = task.appealMode
        ? Boolean(
          task.claimAt &&
          task.triageReviewerRef &&
          task.triageReviewerRef !== entity.ownerId &&
          task.secondReviewerRef &&
          task.secondReviewerRef !== entity.ownerId &&
          task.secondReviewerRef !== task.triageReviewerRef &&
          (task.triageReviewerRole === "primary" || task.triageReviewerRole === "backup") &&
          task.secondReviewerRole === "second-review"
        )
        : Boolean(
          task.triageReviewerRef &&
          task.triageReviewerRef !== entity.ownerId &&
          (task.triageReviewerRole === "primary" || task.triageReviewerRole === "backup") &&
          task.secondReviewerRef === null &&
          task.secondReviewerRole === null
        );
      if (
        task.ownerId !== entity.ownerId ||
        task.field !== field ||
        task.status !== "published" ||
        task.decision !== "published" ||
        !task.decidedAt ||
        task.contentHash !== expectedContentHash ||
        task.reviewKey !== expectedReviewKey ||
        review.reviewKey !== task.reviewKey ||
        task.taskId !== keyedDigest(keySecret, "task", task.reviewKey) ||
        !reviewerIntegrity
      ) return null;
    }
    const recomputed = recomputeContactReviewAggregate({
      fieldReviews: aggregate.fieldReviews,
      requiredFields: aggregate.requiredFields
    });
    return recomputed.ok && recomputed.status === "published" ? aggregate : null;
  }

  function appealState(state: ContactReviewRepositoryState, appealRequestId: string) {
    const aggregate = state.aggregates.find((record) => record.appealRequestId === appealRequestId);
    const entity = aggregate
      ? state.entities.find((record) =>
        record.entityId === aggregate.entityId && record.entityType === aggregate.entityType
      )
      : undefined;
    const tasks = aggregate
      ? state.tasks.filter((record) =>
        record.entityId === aggregate.entityId &&
        record.entityType === aggregate.entityType &&
        record.entityVersion === aggregate.entityVersion &&
        record.appealMode
      )
      : [];
    return { aggregate, entity, tasks };
  }

  function appendAudit(
    state: ContactReviewRepositoryState,
    input: {
      aggregate: ContactReviewAggregateRecord;
      aggregateStatusBefore: ContactReviewAggregateStatus;
      appealedFieldSetDigest?: string | null;
      cleanupResult?: ContactReviewAuditRecord["cleanupResult"];
      dependencyRecoveryRef?: string | null;
      eventType: string;
      field?: ContactReviewField | null;
      fieldDecisionMap?: ContactReviewAuditRecord["fieldDecisionMap"];
      fromStatus?: ContactReviewTaskStatus | null;
      idempotencyKeyHash?: string | null;
      now: string;
      operation?: string;
      operatorRef: string;
      operatorRole: ContactReviewAuditRecord["operatorRole"];
      previousEntity?: ContactReviewEntityRecord | null;
      previousTriageReviewerRef?: string | null;
      previousTriageReviewerRole?: "backup" | "primary" | null;
      reasonCode?: string | null;
      resumedAt?: string | null;
      resumeReasonCode?: string | null;
      task?: ContactReviewTaskRecord | null;
      toStatus?: ContactReviewTaskStatus | null;
    }
  ) {
    const eventId = idFactory("contact-review-audit");
    const entity = state.entities.find((record) =>
      record.entityId === input.aggregate.entityId && record.entityType === input.aggregate.entityType
    );
    const event: ContactReviewAuditRecord = {
      aggregateId: input.aggregate.aggregateId,
      aggregateRevision: input.aggregate.aggregateRevision,
      aggregateStatusAfter: input.aggregate.aggregateStatus,
      aggregateStatusBefore: input.aggregateStatusBefore,
      appealMode: input.task?.appealMode ?? Boolean(input.aggregate.appealRequestId),
      appealRequestId: input.aggregate.appealRequestId,
      appealedFieldSetDigest: input.appealedFieldSetDigest ?? null,
      claimAt: input.task?.claimAt ?? null,
      cleanupResult: input.cleanupResult ?? null,
      contentHash: input.task?.contentHash ?? null,
      decidedAt: input.task?.decidedAt ?? null,
      decision: input.task?.decision ?? null,
      dependencyRecoveryRef: input.dependencyRecoveryRef ?? null,
      entityId: input.aggregate.entityId,
      entityType: input.aggregate.entityType,
      entityVersion: input.aggregate.entityVersion,
      eventDigest: keyedDigest(keySecret, "audit", [eventId, input.eventType, input.aggregate.aggregateRevision]),
      eventId,
      eventType: input.eventType,
      field: input.field ?? input.task?.field ?? null,
      fieldDecisionMap: input.fieldDecisionMap ?? null,
      fromStatus: input.fromStatus ?? null,
      idempotencyKeyHash: input.idempotencyKeyHash ?? null,
      occurredAt: input.now,
      operation: input.operation ?? input.eventType,
      operatorRef: input.operatorRef,
      operatorRole: input.operatorRole,
      ownerId: input.aggregate.ownerId,
      previousEventDigest: state.audits.at(-1)?.eventDigest ?? null,
      previousPublishedVersion: input.previousEntity
        ? input.previousEntity.activePublishedVersion
        : entity?.activePublishedVersion ?? null,
      previousPublicVisibility: input.previousEntity
        ? input.previousEntity.publicVisibility
        : entity?.publicVisibility ?? "hidden",
      previousTriageReviewerRef: input.previousTriageReviewerRef ?? null,
      previousTriageReviewerRole: input.previousTriageReviewerRole ?? null,
      nextPublishedVersion: entity?.activePublishedVersion ?? null,
      nextPublicVisibility: entity?.publicVisibility ?? "hidden",
      reasonCode: input.reasonCode ?? input.task?.reasonCode ?? null,
      requiredFieldsDigest: input.aggregate.requiredFieldsDigest,
      resumedAt: input.resumedAt ?? null,
      resumeReasonCode: input.resumeReasonCode ?? null,
      ruleVersion: input.task?.ruleVersion ?? ruleVersion,
      schemaVersion: 1,
      secondReviewerRef: input.task?.secondReviewerRef ?? null,
      secondReviewerRole: input.task?.secondReviewerRole ?? null,
      taskId: input.task?.taskId ?? null,
      toStatus: input.toStatus ?? null,
      triageReviewerRef: input.task?.triageReviewerRef ?? null,
      triageReviewerRole: input.task?.triageReviewerRole ?? null
    };
    state.audits.push(event);
    input.aggregate.lastAuditEventId = eventId;
    if (entity) entity.lastAuditEventId = eventId;
    if (input.task) input.task.lastAuditEventId = eventId;
    return event;
  }

  function auditContractMetadata({
    nextEntity,
    operation,
    previousEntity,
    task = null
  }: {
    nextEntity: ContactReviewEntityRecord;
    operation: string;
    previousEntity: ContactReviewEntityRecord | null;
    task?: ContactReviewTaskRecord | null;
  }) {
    return {
      appealedFieldSetDigest: null,
      claimAt: task?.claimAt ?? null,
      cleanupResult: null,
      decidedAt: task?.decidedAt ?? null,
      decision: task?.decision ?? null,
      dependencyRecoveryRef: null,
      fieldDecisionMap: null,
      nextPublishedVersion: nextEntity.activePublishedVersion,
      nextPublicVisibility: nextEntity.publicVisibility,
      operation,
      previousPublishedVersion: previousEntity?.activePublishedVersion ?? null,
      previousTriageReviewerRef: null,
      previousTriageReviewerRole: null,
      reasonCode: task?.reasonCode ?? null,
      resumedAt: null,
      resumeReasonCode: null,
      secondReviewerRef: task?.secondReviewerRef ?? null,
      secondReviewerRole: task?.secondReviewerRole ?? null,
      triageReviewerRef: task?.triageReviewerRef ?? null,
      triageReviewerRole: task?.triageReviewerRole ?? null
    } satisfies Pick<ContactReviewAuditRecord,
      | "appealedFieldSetDigest"
      | "claimAt"
      | "cleanupResult"
      | "decidedAt"
      | "decision"
      | "dependencyRecoveryRef"
      | "fieldDecisionMap"
      | "nextPublishedVersion"
      | "nextPublicVisibility"
      | "operation"
      | "previousPublishedVersion"
      | "previousTriageReviewerRef"
      | "previousTriageReviewerRole"
      | "reasonCode"
      | "resumedAt"
      | "resumeReasonCode"
      | "secondReviewerRef"
      | "secondReviewerRole"
      | "triageReviewerRef"
      | "triageReviewerRole"
    >;
  }

  return {
    async submit({
      candidate,
      entityId,
      entityType,
      expectedEntityRevision,
      idempotencyKey,
      now,
      operation,
      ownerId,
      requestId,
      reviewFields
    }: {
      candidate: Record<string, unknown>;
      entityId?: string;
      entityType: ContactReviewEntityType;
      expectedEntityRevision?: number;
      idempotencyKey: string;
      now: string;
      operation: "create" | "edit" | "restore";
      ownerId: string;
      requestId: string;
      reviewFields: Partial<Record<ContactReviewField, string>>;
    }): Promise<ContactReviewServiceResult> {
      if (!ownerId.trim() || !idempotencyKey.trim() || !keySecret.trim()) {
        return { code: "REVIEW_INPUT_INVALID", ok: false, status: 422 };
      }
      const actualEntityId = entityId ?? idFactory("contact-review-entity");
      const scopeKey = operation === "create"
        ? `${ownerId}|${entityType}|create`
        : `${ownerId}|${entityType}|${actualEntityId}|${operation}`;
      const keyHash = keyedDigest(keySecret, "idempotency-key", idempotencyKey);
      const canonicalCandidate = cloneValue(candidate);
      for (const field of [
        "createdAt",
        "deletedAt",
        "deletedByUserId",
        "id",
        "managementState",
        "ownerUserId",
        "status",
        "updatedAt",
        "version"
      ]) delete canonicalCandidate[field];
      const requestHash = keyedDigest(keySecret, "review-request", {
        candidate: canonicalCandidate,
        entityId: operation === "create" ? null : actualEntityId,
        entityType,
        operation,
        ownerId,
        reviewFields
      });
      try {
        return await repository.runTransaction(async (state) => {
          const existingReceipt = state.idempotency.find((record) =>
            record.scopeKey === scopeKey && record.idempotencyKeyHash === keyHash
          );
          if (existingReceipt) {
            if (existingReceipt.requestHash !== requestHash) {
              return { code: "IDEMPOTENCY_KEY_REUSED", ok: false, status: 409 } as const;
            }
            return replayReceipt(existingReceipt);
          }

          const existing = state.entities.find((record) =>
            record.entityId === actualEntityId && record.entityType === entityType
          );
          if (operation === "create" ? Boolean(existing) : !existing || existing.ownerId !== ownerId) {
            return { code: "NOT_FOUND", ok: false, status: 404 } as const;
          }
          if (existing && existing.entityRevision !== expectedEntityRevision) {
            return { code: "REVIEW_VERSION_CONFLICT", ok: false, status: 409 } as const;
          }
          if (
            existing &&
            ((operation === "restore" && (existing.publicVisibility !== "deleted" || !existing.deletedAt)) ||
              (operation === "edit" && existing.publicVisibility === "deleted"))
          ) {
            return { code: "REVIEW_VERSION_CONFLICT", ok: false, status: 409 } as const;
          }
          if (
            existing?.pendingReviewVersion !== null &&
            existing?.pendingReviewVersion !== undefined
          ) {
            const pending = state.aggregates.find((record) =>
              record.entityId === actualEntityId &&
              record.entityType === entityType &&
              record.entityVersion === existing.pendingReviewVersion
            );
            if (pending && pending.aggregateStatus !== "rejected") {
              return { code: "REVIEW_VERSION_CONFLICT", ok: false, status: 409 } as const;
            }
          }

          const requiredFields = [...CONTACT_REVIEW_REQUIRED_FIELDS[entityType]] as ContactReviewField[];
          if (requiredFields.some((field) => typeof reviewFields[field] !== "string")) {
            return { code: "REVIEW_INPUT_INVALID", ok: false, status: 422 } as const;
          }
          const version = existing ? existing.currentVersion + 1 : 1;
          const aggregateId = keyedDigest(keySecret, "aggregate", [ownerId, entityType, actualEntityId, version]);
          const tasks = requiredFields.map((field) => {
            const contentHash = keyedDigest(keySecret, "content", reviewFields[field]);
            const reviewKey = keyedDigest(keySecret, "review", [ownerId, entityType, actualEntityId, version, field, contentHash, ruleVersion]);
            return {
              appealMode: false,
              classification: "allow_candidate",
              claimAt: null,
              contentHash,
              createdAt: now,
              decidedAt: null,
              decision: null,
              deletedAt: null,
              dueAt: new Date(Date.parse(now) + 24 * 60 * 60 * 1000).toISOString(),
              entityId: actualEntityId,
              entityType,
              entityVersion: version,
              field,
              idempotencyKeyHash: null,
              lastAuditEventId: "",
              ownerId,
              reasonCode: null,
              restoredAt: operation === "restore" ? now : null,
              reviewKey,
              ruleVersion,
              schemaVersion: 1 as const,
              secondReviewerRef: null,
              secondReviewerRole: null,
              status: "pending_review" as const,
              taskId: keyedDigest(keySecret, "task", reviewKey),
              taskRevision: 1,
              triageReviewerRef: null,
              triageReviewerRole: null,
              updatedAt: now
            };
          });
          const requiredFieldsDigest = keyedDigest(keySecret, "required-fields", requiredFields);
          const aggregate: ContactReviewAggregateRecord = {
            aggregateId,
            aggregateRevision: 1,
            aggregateStatus: "pending_review",
            appealRequestId: null,
            appealUsedAt: null,
            basePublishedVersion: existing?.activePublishedVersion ?? null,
            createdAt: now,
            deletedAt: null,
            entityId: actualEntityId,
            entityType,
            entityVersion: version,
            fieldReviews: toFieldReviews(tasks),
            lastAuditEventId: "",
            ownerId,
            requiredFields,
            requiredFieldsDigest,
            restoredAt: operation === "restore" ? now : null,
            schemaVersion: 1,
            supersedesVersion: existing?.pendingReviewVersion ?? null,
            updatedAt: now
          };
          const entity: ContactReviewEntityRecord = existing
            ? {
              ...existing,
              currentVersion: version,
              entityRevision: existing.entityRevision + 1,
              pendingReviewVersion: version,
              pendingSnapshot: cloneValue(candidate),
              publicVisibility: operation === "restore" ? "hidden" : existing.publicVisibility,
              updatedAt: now
            }
            : {
              activePublishedVersion: null,
              activeSnapshot: null,
              currentVersion: 1,
              deletedAt: null,
              entityId: actualEntityId,
              entityRevision: 1,
              entityType,
              lastAuditEventId: "",
              ownerId,
              pendingReviewVersion: 1,
              pendingSnapshot: cloneValue(candidate),
              publicVisibility: "hidden",
              updatedAt: now
            };
          const eventId = idFactory("contact-review-audit");
          const audit: ContactReviewAuditRecord = {
            ...auditContractMetadata({
              nextEntity: entity,
              operation,
              previousEntity: existing ?? null
            }),
            aggregateId,
            aggregateRevision: 1,
            aggregateStatusAfter: "pending_review",
            aggregateStatusBefore: null,
            appealMode: false,
            appealRequestId: null,
            contentHash: null,
            entityId: actualEntityId,
            entityType,
            entityVersion: version,
            eventDigest: keyedDigest(keySecret, "audit", [requestId, eventId]),
            eventId,
            eventType: `${operation}_submitted`,
            field: null,
            fromStatus: null,
            idempotencyKeyHash: keyHash,
            occurredAt: now,
            operatorRef: ownerId,
            operatorRole: "content-owner",
            ownerId,
            previousEventDigest: state.audits.at(-1)?.eventDigest ?? null,
            previousPublicVisibility: existing?.publicVisibility ?? "hidden",
            requiredFieldsDigest,
            ruleVersion,
            schemaVersion: 1,
            taskId: null,
            toStatus: "pending_review"
          };
          entity.lastAuditEventId = eventId;
          aggregate.lastAuditEventId = eventId;
          for (const task of tasks) task.lastAuditEventId = eventId;
          const receipt: ContactReviewIdempotencyRecord = {
            completedAt: now,
            createdAt: now,
            entityId: actualEntityId,
            entityType,
            entityVersion: version,
            idempotencyKeyHash: keyHash,
            operation,
            ownerId,
            receiptId: keyedDigest(keySecret, "receipt", [scopeKey, keyHash]),
            requestHash,
            resultCode: "REVIEW_SUBMITTED",
            resultDigest: resultDigest(resultReference(entity, aggregate)),
            resultRef: resultReference(entity, aggregate),
            scopeKey
          };

          if (existing) {
            state.entities[state.entities.indexOf(existing)] = entity;
          } else {
            state.entities.push(entity);
          }
          state.tasks.push(...tasks);
          state.aggregates.push(aggregate);
          state.idempotency.push(receipt);
          state.audits.push(audit);
          return withAggregate(entity, aggregate);
        }, {
          entityId: actualEntityId,
          entityType,
          idempotencyKeyHash: keyHash,
          kind: "submit",
          scopeKey
        });
      } catch {
        return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 };
      }
    },

    async decideField({
      decision,
      expectedAggregateRevision,
      expectedTaskRevision,
      idempotencyKey,
      now,
      operator,
      taskId
    }: {
      decision: "published" | "rejected";
      expectedAggregateRevision: number;
      expectedTaskRevision: number;
      idempotencyKey: string;
      now: string;
      operator: { id: string; role: ContactReviewReviewerRole };
      taskId: string;
    }): Promise<ContactReviewServiceResult> {
      if (!idempotencyKey.trim()) return { code: "REVIEW_INPUT_INVALID", ok: false, status: 422 };
      try {
        return await repository.runTransaction(async (state) => {
          const task = state.tasks.find((record) => record.taskId === taskId);
          if (!task) return { code: "NOT_FOUND", ok: false, status: 404 } as const;
          if (operator.role === "second-review" || operator.id === task.ownerId) {
            return { code: "REVIEW_ROLE_FORBIDDEN", ok: false, status: 403 } as const;
          }
          const aggregate = state.aggregates.find((record) =>
            record.entityId === task.entityId &&
            record.entityType === task.entityType &&
            record.entityVersion === task.entityVersion
          );
          const entity = state.entities.find((record) =>
            record.entityId === task.entityId && record.entityType === task.entityType
          );
          if (!aggregate || !entity) {
            return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 } as const;
          }
          const scopeKey = `${task.ownerId}|${task.entityType}|${task.entityId}|decideField|${taskId}`;
          const keyHash = keyedDigest(keySecret, "field-decision", [taskId, idempotencyKey]);
          const requestHash = keyedDigest(keySecret, "review-request", {
            decision,
            expectedAggregateRevision,
            expectedTaskRevision,
            operation: "decideField",
            taskId
          });
          const receipt = state.idempotency.find((record) =>
            record.scopeKey === scopeKey && record.idempotencyKeyHash === keyHash
          );
          if (receipt) {
            return receipt.requestHash === requestHash
              ? replayReceipt(receipt)
              : { code: "IDEMPOTENCY_KEY_REUSED", ok: false, status: 409 } as const;
          }
          if (
            task.appealMode ||
            task.taskRevision !== expectedTaskRevision ||
            aggregate.aggregateRevision !== expectedAggregateRevision ||
            (task.status !== "pending_review" && task.status !== "needs_manual_review")
          ) {
            return { code: "REVIEW_VERSION_CONFLICT", ok: false, status: 409 } as const;
          }
          const previousStatus = task.status;
          const previousEntity = cloneValue(entity);
          const previousAggregateStatus = aggregate.aggregateStatus;
          task.status = decision;
          task.decision = decision;
          task.reasonCode = decision === "published" ? "review_approved" : "contact_policy_rejected";
          task.decidedAt = now;
          task.updatedAt = now;
          task.taskRevision += 1;
          task.triageReviewerRef = operator.id;
          task.triageReviewerRole = operator.role;
          task.idempotencyKeyHash = keyHash;
          aggregate.fieldReviews = toFieldReviews(state.tasks.filter((record) =>
            record.entityId === task.entityId &&
            record.entityType === task.entityType &&
            record.entityVersion === task.entityVersion
          ));
          const recomputed = recomputeContactReviewAggregate({
            fieldReviews: aggregate.fieldReviews,
            requiredFields: aggregate.requiredFields
          });
          aggregate.aggregateStatus = recomputed.status;
          aggregate.aggregateRevision += 1;
          aggregate.updatedAt = now;
          if (recomputed.ok && recomputed.status === "published") {
            entity.activePublishedVersion = aggregate.entityVersion;
            entity.activeSnapshot = cloneValue(entity.pendingSnapshot);
            entity.pendingReviewVersion = null;
            entity.pendingSnapshot = null;
            entity.publicVisibility = "published";
            entity.entityRevision += 1;
            entity.updatedAt = now;
          }
          const eventId = idFactory("contact-review-audit");
          state.audits.push({
            ...auditContractMetadata({
              nextEntity: entity,
              operation: "decideField",
              previousEntity,
              task
            }),
            aggregateId: aggregate.aggregateId,
            aggregateRevision: aggregate.aggregateRevision,
            aggregateStatusAfter: aggregate.aggregateStatus,
            aggregateStatusBefore: previousAggregateStatus,
            appealMode: false,
            appealRequestId: null,
            contentHash: task.contentHash,
            entityId: task.entityId,
            entityType: task.entityType,
            entityVersion: task.entityVersion,
            eventDigest: keyedDigest(keySecret, "audit", [eventId, taskId, decision]),
            eventId,
            eventType: "field_decided",
            field: task.field,
            fromStatus: previousStatus,
            idempotencyKeyHash: keyHash,
            occurredAt: now,
            operatorRef: operator.id,
            operatorRole: operator.role,
            ownerId: task.ownerId,
            previousEventDigest: state.audits.at(-1)?.eventDigest ?? null,
            previousPublicVisibility: previousEntity.publicVisibility,
            requiredFieldsDigest: aggregate.requiredFieldsDigest,
            ruleVersion: task.ruleVersion,
            schemaVersion: 1,
            taskId,
            toStatus: decision
          });
          task.lastAuditEventId = eventId;
          aggregate.lastAuditEventId = eventId;
          entity.lastAuditEventId = eventId;
          state.idempotency.push({
            completedAt: now,
            createdAt: now,
            entityId: task.entityId,
            entityType: task.entityType,
            entityVersion: task.entityVersion,
            idempotencyKeyHash: keyHash,
            operation: "decideField",
            ownerId: task.ownerId,
            receiptId: keyedDigest(keySecret, "receipt", [scopeKey, keyHash]),
            requestHash,
            resultCode: "FIELD_DECIDED",
            resultDigest: resultDigest(resultReference(entity, aggregate)),
            resultRef: resultReference(entity, aggregate),
            scopeKey
          });
          return withAggregate(entity, aggregate);
        }, { kind: "task", taskId });
      } catch {
        return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 };
      }
    },

    async claimField({
      expectedAggregateRevision,
      expectedTaskRevision,
      idempotencyKey,
      now,
      operator,
      taskId
    }: {
      expectedAggregateRevision: number;
      expectedTaskRevision: number;
      idempotencyKey: string;
      now: string;
      operator: { id: string; role: "backup" | "primary" };
      taskId: string;
    }): Promise<ContactReviewServiceResult> {
      if (!idempotencyKey.trim()) return { code: "REVIEW_INPUT_INVALID", ok: false, status: 422 };
      try {
        return await repository.runTransaction(async (state) => {
          const task = state.tasks.find((record) => record.taskId === taskId);
          if (!task) return { code: "NOT_FOUND", ok: false, status: 404 } as const;
          if (task.ownerId === operator.id || task.appealMode) {
            return { code: "REVIEW_ROLE_FORBIDDEN", ok: false, status: 403 } as const;
          }
          const scopeKey = `${task.ownerId}|${task.entityType}|${task.entityId}|claimField|${taskId}`;
          const keyHash = keyedDigest(keySecret, "idempotency-key", idempotencyKey);
          const requestHash = keyedDigest(keySecret, "review-request", {
            expectedAggregateRevision,
            expectedTaskRevision,
            operation: "claimField",
            taskId
          });
          const aggregate = state.aggregates.find((record) =>
            record.entityId === task.entityId &&
            record.entityType === task.entityType &&
            record.entityVersion === task.entityVersion
          );
          const entity = state.entities.find((record) =>
            record.entityId === task.entityId && record.entityType === task.entityType
          );
          if (!aggregate || !entity) {
            return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 } as const;
          }
          const receipt = state.idempotency.find((record) =>
            record.scopeKey === scopeKey && record.idempotencyKeyHash === keyHash
          );
          if (receipt) {
            return receipt.requestHash === requestHash
              ? replayReceipt(receipt)
              : { code: "IDEMPOTENCY_KEY_REUSED", ok: false, status: 409 } as const;
          }
          if (
            aggregate.aggregateRevision !== expectedAggregateRevision ||
            task.taskRevision !== expectedTaskRevision ||
            (task.status !== "pending_review" && task.status !== "needs_manual_review")
          ) {
            return { code: "REVIEW_VERSION_CONFLICT", ok: false, status: 409 } as const;
          }
          const previousStatus = task.status;
          task.triageReviewerRef = operator.id;
          task.triageReviewerRole = operator.role;
          task.claimAt = now;
          task.taskRevision += 1;
          task.updatedAt = now;
          aggregate.aggregateRevision += 1;
          aggregate.updatedAt = now;
          appendAudit(state, {
            aggregate,
            aggregateStatusBefore: aggregate.aggregateStatus,
            eventType: "field_claimed",
            fromStatus: previousStatus,
            idempotencyKeyHash: keyHash,
            now,
            operation: "claimField",
            operatorRef: operator.id,
            operatorRole: operator.role,
            task,
            toStatus: previousStatus
          });
          state.idempotency.push({
            completedAt: now,
            createdAt: now,
            entityId: task.entityId,
            entityType: task.entityType,
            entityVersion: task.entityVersion,
            idempotencyKeyHash: keyHash,
            operation: "claimField",
            ownerId: task.ownerId,
            receiptId: keyedDigest(keySecret, "receipt", [scopeKey, keyHash]),
            requestHash,
            resultCode: "FIELD_CLAIMED",
            resultDigest: resultDigest(resultReference(entity, aggregate)),
            resultRef: resultReference(entity, aggregate),
            scopeKey
          });
          return withAggregate(entity, aggregate);
        }, { kind: "task", taskId });
      } catch {
        return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 };
      }
    },

    async createAppeal({
      entityId,
      entityType,
      expectedEntityRevision,
      idempotencyKey,
      now,
      operatorId,
      requestId
    }: {
      entityId: string;
      entityType: ContactReviewEntityType;
      expectedEntityRevision: number;
      idempotencyKey: string;
      now: string;
      operatorId: string;
      requestId: string;
    }): Promise<ContactReviewServiceResult> {
      if (!idempotencyKey.trim()) return { code: "REVIEW_INPUT_INVALID", ok: false, status: 422 };
      try {
        return await repository.runTransaction(async (state) => {
          const entity = state.entities.find((record) =>
            record.entityId === entityId && record.entityType === entityType
          );
          if (!entity || entity.ownerId !== operatorId) {
            return { code: "NOT_FOUND", ok: false, status: 404 } as const;
          }
          const scopeKey = `${operatorId}|${entityType}|${entityId}|appeal`;
          const keyHash = keyedDigest(keySecret, "idempotency-key", idempotencyKey);
          const requestHash = keyedDigest(keySecret, "review-request", {
            entityId,
            entityType,
            expectedEntityRevision,
            operation: "appeal",
            operatorId
          });
          const receipt = state.idempotency.find((record) =>
            record.scopeKey === scopeKey && record.idempotencyKeyHash === keyHash
          );
          if (receipt) {
            if (receipt.requestHash !== requestHash) {
              return { code: "IDEMPOTENCY_KEY_REUSED", ok: false, status: 409 } as const;
            }
            return replayReceipt(receipt);
          }
          if (entity.entityRevision !== expectedEntityRevision) {
            return { code: "REVIEW_VERSION_CONFLICT", ok: false, status: 409 } as const;
          }
          const aggregate = state.aggregates.find((record) =>
            record.entityId === entityId &&
            record.entityType === entityType &&
            record.entityVersion === entity.pendingReviewVersion
          );
          if (!aggregate) return { code: "APPEAL_NOT_READY", ok: false, status: 409 } as const;
          if (aggregate.appealUsedAt || aggregate.appealRequestId) {
            return { code: "APPEAL_ALREADY_USED", ok: false, status: 409 } as const;
          }
          const versionTasks = state.tasks.filter((record) =>
            record.entityId === entityId &&
            record.entityType === entityType &&
            record.entityVersion === aggregate.entityVersion
          );
          const recalculated = recomputeContactReviewAggregate({
            fieldReviews: toFieldReviews(versionTasks),
            requiredFields: aggregate.requiredFields
          });
          const rejectedTasks = versionTasks.filter((task) => task.status === "rejected");
          if (!recalculated.ok || recalculated.status !== "rejected" || rejectedTasks.length === 0) {
            return { code: "APPEAL_NOT_READY", ok: false, status: 409 } as const;
          }
          const appealRequestId = idFactory("contact-review-appeal");
          const appealedFieldSetDigest = keyedDigest(
            keySecret,
            "appealed-fields",
            rejectedTasks.map((task) => task.field).sort()
          );
          for (const task of rejectedTasks) {
            task.status = "appeal_pending";
            task.appealMode = true;
            task.decision = null;
            task.reasonCode = null;
            task.decidedAt = null;
            task.dueAt = new Date(Date.parse(now) + 48 * 60 * 60 * 1000).toISOString();
            task.secondReviewerRef = null;
            task.secondReviewerRole = null;
            task.taskRevision += 1;
            task.updatedAt = now;
          }
          const before = aggregate.aggregateStatus;
          aggregate.aggregateStatus = "appeal_pending";
          aggregate.aggregateRevision += 1;
          aggregate.appealUsedAt = now;
          aggregate.appealRequestId = appealRequestId;
          aggregate.fieldReviews = toFieldReviews(versionTasks);
          aggregate.updatedAt = now;
          appendAudit(state, {
            aggregate,
            aggregateStatusBefore: before,
            appealedFieldSetDigest,
            eventType: "appeal_created",
            idempotencyKeyHash: keyHash,
            now,
            operation: "appeal",
            operatorRef: operatorId,
            operatorRole: "content-owner",
            toStatus: "appeal_pending"
          });
          state.idempotency.push({
            completedAt: now,
            createdAt: now,
            entityId,
            entityType,
            entityVersion: aggregate.entityVersion,
            idempotencyKeyHash: keyHash,
            operation: "appeal",
            ownerId: operatorId,
            receiptId: keyedDigest(keySecret, "receipt", [scopeKey, keyHash]),
            requestHash,
            resultCode: "APPEAL_CREATED",
            resultDigest: resultDigest(resultReference(entity, aggregate)),
            resultRef: resultReference(entity, aggregate),
            scopeKey
          });
          void requestId;
          return withAggregate(entity, aggregate);
        }, { entityId, entityType, kind: "entity" });
      } catch {
        return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 };
      }
    },

    async claimAppeal({
      appealRequestId,
      expectedAggregateRevision,
      expectedTaskRevisions,
      handoffReasonCode,
      idempotencyKey,
      now,
      operator
    }: {
      appealRequestId: string;
      expectedAggregateRevision: number;
      expectedTaskRevisions: Record<string, number>;
      handoffReasonCode?: string;
      idempotencyKey: string;
      now: string;
      operator: { id: string; role: "backup" | "primary" };
    }): Promise<ContactReviewServiceResult> {
      if (!idempotencyKey.trim()) return { code: "REVIEW_INPUT_INVALID", ok: false, status: 422 };
      try {
        return await repository.runTransaction(async (state) => {
          const current = appealState(state, appealRequestId);
          if (!current.aggregate || !current.entity || current.tasks.length === 0) {
            return { code: "NOT_FOUND", ok: false, status: 404 } as const;
          }
          if (operator.id === current.aggregate.ownerId) {
            return { code: "REVIEW_ROLE_FORBIDDEN", ok: false, status: 403 } as const;
          }
          const scopeKey = `${current.aggregate.ownerId}|${current.aggregate.entityType}|${current.aggregate.entityId}|claimAppeal|${appealRequestId}`;
          const keyHash = keyedDigest(keySecret, "idempotency-key", idempotencyKey);
          const requestHash = keyedDigest(keySecret, "review-request", {
            appealRequestId,
            expectedAggregateRevision,
            expectedTaskRevisions: Object.entries(expectedTaskRevisions).sort(([left], [right]) => left.localeCompare(right)),
            handoffReasonCode: handoffReasonCode ?? "",
            operation: "claimAppeal"
          });
          const receipt = state.idempotency.find((record) =>
            record.scopeKey === scopeKey && record.idempotencyKeyHash === keyHash
          );
          if (receipt) {
            return receipt.requestHash === requestHash
              ? replayReceipt(receipt)
              : { code: "IDEMPOTENCY_KEY_REUSED", ok: false, status: 409 } as const;
          }
          if (
            current.aggregate.aggregateStatus !== "appeal_pending" ||
            current.aggregate.aggregateRevision !== expectedAggregateRevision ||
            current.tasks.some((task) =>
              task.status !== "appeal_pending" || expectedTaskRevisions[task.taskId] !== task.taskRevision
            )
          ) {
            return { code: "REVIEW_VERSION_CONFLICT", ok: false, status: 409 } as const;
          }
          const previousTriageRefs = new Set(current.tasks.map((task) => task.triageReviewerRef));
          const previousTriageRoles = new Set(current.tasks.map((task) => task.triageReviewerRole));
          if (previousTriageRefs.size > 1 || previousTriageRoles.size > 1) {
            return { code: "REVIEW_VERSION_CONFLICT", ok: false, status: 409 } as const;
          }
          const previousTriageReviewerRef = current.tasks[0].triageReviewerRef;
          const previousTriageReviewerRole = current.tasks[0].triageReviewerRole;
          if (
            previousTriageReviewerRef &&
            previousTriageReviewerRef !== operator.id &&
            !handoffReasonCode?.trim()
          ) {
            return { code: "REVIEW_INPUT_INVALID", ok: false, status: 422 } as const;
          }
          for (const task of current.tasks) {
            task.triageReviewerRef = operator.id;
            task.triageReviewerRole = operator.role;
            task.claimAt = now;
            task.taskRevision += 1;
            task.updatedAt = now;
          }
          current.aggregate.aggregateRevision += 1;
          current.aggregate.updatedAt = now;
          appendAudit(state, {
            aggregate: current.aggregate,
            aggregateStatusBefore: "appeal_pending",
            appealedFieldSetDigest: keyedDigest(
              keySecret,
              "appealed-fields",
              current.tasks.map((task) => task.field).sort()
            ),
            eventType: "appeal_claimed",
            idempotencyKeyHash: keyHash,
            now,
            operation: "claimAppeal",
            operatorRef: operator.id,
            operatorRole: operator.role,
            previousTriageReviewerRef,
            previousTriageReviewerRole,
            reasonCode: previousTriageReviewerRef === null ? "appeal_claim" : handoffReasonCode ?? null,
            task: current.tasks[0],
            toStatus: "appeal_pending"
          });
          state.idempotency.push({
            completedAt: now,
            createdAt: now,
            entityId: current.aggregate.entityId,
            entityType: current.aggregate.entityType,
            entityVersion: current.aggregate.entityVersion,
            idempotencyKeyHash: keyHash,
            operation: "claimAppeal",
            ownerId: current.aggregate.ownerId,
            receiptId: keyedDigest(keySecret, "receipt", [scopeKey, keyHash]),
            requestHash,
            resultCode: "APPEAL_CLAIMED",
            resultDigest: resultDigest(resultReference(current.entity, current.aggregate)),
            resultRef: resultReference(current.entity, current.aggregate),
            scopeKey
          });
          return withAggregate(current.entity, current.aggregate);
        }, { appealRequestId, kind: "appeal" });
      } catch {
        return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 };
      }
    },

    async resumeAppealReview({
      appealRequestId,
      dependencyRecoveryRef,
      expectedAggregateRevision,
      expectedTaskRevisions,
      idempotencyKey,
      now,
      operator,
      resumeReasonCode
    }: {
      appealRequestId: string;
      dependencyRecoveryRef: string;
      expectedAggregateRevision: number;
      expectedTaskRevisions: Record<string, number>;
      idempotencyKey: string;
      now: string;
      operator: { id: string; role: "backup" | "primary" };
      resumeReasonCode: string;
    }): Promise<ContactReviewServiceResult> {
      if (!dependencyRecoveryRef.trim() || !resumeReasonCode.trim()) {
        return { code: "REVIEW_INPUT_INVALID", ok: false, status: 422 };
      }
      try {
        return await repository.runTransaction(async (state) => {
          const current = appealState(state, appealRequestId);
          if (!current.aggregate || !current.entity || current.tasks.length === 0) {
            return { code: "NOT_FOUND", ok: false, status: 404 } as const;
          }
          if (operator.id === current.aggregate.ownerId) {
            return { code: "REVIEW_ROLE_FORBIDDEN", ok: false, status: 403 } as const;
          }
          const scopeKey = `${current.aggregate.ownerId}|${current.aggregate.entityType}|${current.aggregate.entityId}|resumeAppealReview|${appealRequestId}`;
          const keyHash = keyedDigest(keySecret, "idempotency-key", idempotencyKey);
          const requestHash = keyedDigest(keySecret, "review-request", {
            appealRequestId,
            dependencyRecoveryRef,
            operator,
            resumeReasonCode
          });
          const receipt = state.idempotency.find((record) =>
            record.scopeKey === scopeKey && record.idempotencyKeyHash === keyHash
          );
          if (receipt) {
            return receipt.requestHash === requestHash
              ? replayReceipt(receipt)
              : { code: "IDEMPOTENCY_KEY_REUSED", ok: false, status: 409 } as const;
          }
          if (
            current.aggregate.aggregateStatus !== "needs_manual_review" ||
            current.aggregate.aggregateRevision !== expectedAggregateRevision ||
            current.tasks.some((task) =>
              task.status !== "needs_manual_review" || expectedTaskRevisions[task.taskId] !== task.taskRevision
            )
          ) {
            return { code: "REVIEW_VERSION_CONFLICT", ok: false, status: 409 } as const;
          }
          const previousTriageReviewerRef = current.tasks[0].triageReviewerRef;
          const previousTriageReviewerRole = current.tasks[0].triageReviewerRole;
          for (const task of current.tasks) {
            task.status = "appeal_pending";
            task.triageReviewerRef = operator.id;
            task.triageReviewerRole = operator.role;
            task.claimAt = now;
            task.taskRevision += 1;
            task.updatedAt = now;
          }
          current.aggregate.aggregateStatus = "appeal_pending";
          current.aggregate.aggregateRevision += 1;
          current.aggregate.fieldReviews = toFieldReviews(current.tasks);
          current.aggregate.updatedAt = now;
          appendAudit(state, {
            aggregate: current.aggregate,
            aggregateStatusBefore: "needs_manual_review",
            appealedFieldSetDigest: keyedDigest(
              keySecret,
              "appealed-fields",
              current.tasks.map((task) => task.field).sort()
            ),
            dependencyRecoveryRef,
            eventType: "appeal_resumed",
            idempotencyKeyHash: keyHash,
            now,
            operation: "resumeAppealReview",
            operatorRef: operator.id,
            operatorRole: operator.role,
            previousTriageReviewerRef,
            previousTriageReviewerRole,
            reasonCode: resumeReasonCode,
            resumedAt: now,
            resumeReasonCode,
            task: current.tasks[0],
            toStatus: "appeal_pending"
          });
          state.idempotency.push({
            completedAt: now,
            createdAt: now,
            entityId: current.aggregate.entityId,
            entityType: current.aggregate.entityType,
            entityVersion: current.aggregate.entityVersion,
            idempotencyKeyHash: keyHash,
            operation: "resumeAppealReview",
            ownerId: current.aggregate.ownerId,
            receiptId: keyedDigest(keySecret, "receipt", [scopeKey, keyHash]),
            requestHash,
            resultCode: "APPEAL_RESUMED",
            resultDigest: resultDigest(resultReference(current.entity, current.aggregate)),
            resultRef: resultReference(current.entity, current.aggregate),
            scopeKey
          });
          return withAggregate(current.entity, current.aggregate);
        }, { appealRequestId, kind: "appeal" });
      } catch {
        return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 };
      }
    },

    async decideAppeal({
      appealRequestId,
      decisions,
      expectedAggregateRevision,
      expectedTaskRevisions,
      idempotencyKey,
      now,
      operator
    }: {
      appealRequestId: string;
      decisions: Array<{ decision: "published" | "rejected"; reasonCode: string; taskId: string }>;
      expectedAggregateRevision: number;
      expectedTaskRevisions: Record<string, number>;
      idempotencyKey: string;
      now: string;
      operator: { id: string; role: ContactReviewReviewerRole };
    }): Promise<ContactReviewServiceResult> {
      if (!idempotencyKey.trim()) return { code: "REVIEW_INPUT_INVALID", ok: false, status: 422 };
      try {
        return await repository.runTransaction(async (state) => {
          const current = appealState(state, appealRequestId);
          if (!current.aggregate || !current.entity || current.tasks.length === 0) {
            return { code: "NOT_FOUND", ok: false, status: 404 } as const;
          }
          const actorAuthorizedForReplay = operator.role === "second-review" &&
            operator.id !== current.aggregate.ownerId &&
            current.tasks.every((task) => task.triageReviewerRef !== operator.id);
          const scopeKey = `${current.aggregate.ownerId}|${current.aggregate.entityType}|${current.aggregate.entityId}|decideAppeal|${appealRequestId}`;
          const keyHash = keyedDigest(keySecret, "field-decision", [appealRequestId, idempotencyKey]);
          const requestHash = keyedDigest(keySecret, "review-request", {
            appealRequestId,
            decisions: [...decisions].sort((left, right) => left.taskId.localeCompare(right.taskId)),
            expectedAggregateRevision,
            expectedTaskRevisions: Object.entries(expectedTaskRevisions).sort(([left], [right]) => left.localeCompare(right)),
            operation: "decideAppeal"
          });
          const receipt = state.idempotency.find((record) =>
            record.scopeKey === scopeKey && record.idempotencyKeyHash === keyHash
          );
          if (receipt) {
            if (!actorAuthorizedForReplay) {
              return { code: "REVIEW_ROLE_FORBIDDEN", ok: false, status: 403 } as const;
            }
            return receipt.requestHash === requestHash
              ? replayReceipt(receipt)
              : { code: "IDEMPOTENCY_KEY_REUSED", ok: false, status: 409 } as const;
          }
          const decisionIds = new Set(decisions.map((decision) => decision.taskId));
          const exactVector = decisionIds.size === current.tasks.length &&
            decisions.length === current.tasks.length &&
            current.tasks.every((task) => decisionIds.has(task.taskId));
          const validRole = operator.role === "second-review" &&
            operator.id !== current.aggregate.ownerId &&
            current.tasks.every((task) =>
              task.ownerId === current.aggregate!.ownerId &&
              task.triageReviewerRef &&
              task.triageReviewerRef !== current.aggregate!.ownerId &&
              task.triageReviewerRef !== operator.id &&
              task.claimAt &&
              Number.isFinite(Date.parse(task.claimAt)) &&
              (task.triageReviewerRole === "primary" || task.triageReviewerRole === "backup")
            );
          const validPayload = exactVector && decisions.every((decision) => decision.reasonCode.trim());
          const validRevision = current.aggregate.aggregateStatus === "appeal_pending" &&
            current.aggregate.aggregateRevision === expectedAggregateRevision &&
            current.tasks.every((task) =>
              task.status === "appeal_pending" && expectedTaskRevisions[task.taskId] === task.taskRevision
            );
          if (!validRevision) {
            return { code: "REVIEW_VERSION_CONFLICT", ok: false, status: 409 } as const;
          }
          if (!validRole || !validPayload) {
            const before = current.aggregate.aggregateStatus;
            const previousEntity = cloneValue(current.entity);
            for (const task of current.tasks) {
              task.status = "needs_manual_review";
              task.decision = null;
              task.reasonCode = "appeal_decision_validation_failed";
              task.secondReviewerRef = null;
              task.secondReviewerRole = null;
              task.taskRevision += 1;
              task.updatedAt = now;
            }
            current.aggregate.aggregateStatus = "needs_manual_review";
            current.aggregate.aggregateRevision += 1;
            current.aggregate.fieldReviews = toFieldReviews(current.tasks);
            current.aggregate.updatedAt = now;
            appendAudit(state, {
              aggregate: current.aggregate,
              aggregateStatusBefore: before,
              appealedFieldSetDigest: keyedDigest(
                keySecret,
                "appealed-fields",
                current.tasks.map((task) => task.field).sort()
              ),
              eventType: "appeal_decision_rejected",
              idempotencyKeyHash: keyHash,
              now,
              operation: "decideAppeal",
              operatorRef: operator.id,
              operatorRole: operator.role,
              previousEntity,
              reasonCode: validRole ? "appeal_decision_payload_invalid" : "appeal_reviewer_separation_invalid",
              task: current.tasks[0],
              toStatus: "needs_manual_review"
            });
            return {
              code: validRole ? "REVIEW_INPUT_INVALID" : "REVIEW_ROLE_FORBIDDEN",
              ok: false,
              status: validRole ? 422 : 403
            } as const;
          }
          const byId = new Map(decisions.map((decision) => [decision.taskId, decision]));
          const previousEntity = cloneValue(current.entity);
          for (const task of current.tasks) {
            const decision = byId.get(task.taskId)!;
            task.status = decision.decision;
            task.decision = decision.decision;
            task.reasonCode = decision.reasonCode;
            task.decidedAt = now;
            task.secondReviewerRef = operator.id;
            task.secondReviewerRole = "second-review";
            task.idempotencyKeyHash = keyHash;
            task.taskRevision += 1;
            task.updatedAt = now;
          }
          const versionTasks = state.tasks.filter((task) =>
            task.entityId === current.aggregate!.entityId &&
            task.entityType === current.aggregate!.entityType &&
            task.entityVersion === current.aggregate!.entityVersion
          );
          const before = current.aggregate.aggregateStatus;
          current.aggregate.fieldReviews = toFieldReviews(versionTasks);
          current.aggregate.aggregateStatus = recomputeContactReviewAggregate({
            fieldReviews: current.aggregate.fieldReviews,
            requiredFields: current.aggregate.requiredFields
          }).status;
          current.aggregate.aggregateRevision += 1;
          current.aggregate.updatedAt = now;
          if (current.aggregate.aggregateStatus === "published") {
            current.entity.activePublishedVersion = current.aggregate.entityVersion;
            current.entity.activeSnapshot = cloneValue(current.entity.pendingSnapshot);
            current.entity.pendingReviewVersion = null;
            current.entity.pendingSnapshot = null;
            current.entity.publicVisibility = "published";
            current.entity.entityRevision += 1;
            current.entity.updatedAt = now;
          }
          appendAudit(state, {
            aggregate: current.aggregate,
            aggregateStatusBefore: before,
            appealedFieldSetDigest: keyedDigest(
              keySecret,
              "appealed-fields",
              current.tasks.map((task) => task.field).sort()
            ),
            eventType: "appeal_decided",
            fieldDecisionMap: Object.fromEntries(current.tasks.map((task) => [task.field, {
              decision: task.decision!,
              reasonCode: task.reasonCode!,
              secondReviewerRef: task.secondReviewerRef!,
              taskId: task.taskId,
              triageReviewerRef: task.triageReviewerRef!
            }])),
            idempotencyKeyHash: keyHash,
            now,
            operation: "decideAppeal",
            operatorRef: operator.id,
            operatorRole: "second-review",
            previousEntity,
            reasonCode: "appeal_decision_vector_completed",
            task: current.tasks[0],
            toStatus: current.aggregate.aggregateStatus
          });
          state.idempotency.push({
            completedAt: now,
            createdAt: now,
            entityId: current.aggregate.entityId,
            entityType: current.aggregate.entityType,
            entityVersion: current.aggregate.entityVersion,
            idempotencyKeyHash: keyHash,
            operation: "decideAppeal",
            ownerId: current.aggregate.ownerId,
            receiptId: keyedDigest(keySecret, "receipt", [scopeKey, keyHash]),
            requestHash,
            resultCode: "APPEAL_DECIDED",
            resultDigest: resultDigest(resultReference(current.entity, current.aggregate)),
            resultRef: resultReference(current.entity, current.aggregate),
            scopeKey
          });
          return withAggregate(current.entity, current.aggregate);
        }, { appealRequestId, kind: "appeal" });
      } catch {
        return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 };
      }
    },

    async deleteEntity({
      entityId,
      entityType,
      expectedEntityRevision,
      idempotencyKey,
      now,
      operatorId,
      requestId
    }: {
      entityId: string;
      entityType: ContactReviewEntityType;
      expectedEntityRevision: number;
      idempotencyKey: string;
      now: string;
      operatorId: string;
      requestId: string;
    }): Promise<ContactReviewServiceResult> {
      try {
        return await repository.runTransaction(async (state) => {
          const entity = state.entities.find((record) =>
            record.entityId === entityId && record.entityType === entityType
          );
          if (!entity || entity.ownerId !== operatorId) {
            return { code: "NOT_FOUND", ok: false, status: 404 } as const;
          }
          const scopeKey = `${operatorId}|${entityType}|${entityId}|delete`;
          const keyHash = keyedDigest(keySecret, "idempotency-key", idempotencyKey);
          const requestHash = keyedDigest(keySecret, "review-request", {
            entityId,
            entityType,
            expectedEntityRevision,
            operation: "delete",
            operatorId
          });
          const existingReceipt = state.idempotency.find((record) =>
            record.scopeKey === scopeKey && record.idempotencyKeyHash === keyHash
          );
          if (existingReceipt) {
            return existingReceipt.requestHash === requestHash
              ? replayReceipt(existingReceipt)
              : { code: "IDEMPOTENCY_KEY_REUSED", ok: false, status: 409 } as const;
          }
          if (entity.entityRevision !== expectedEntityRevision) {
            return { code: "REVIEW_VERSION_CONFLICT", ok: false, status: 409 } as const;
          }
          const pendingVersion = entity.pendingReviewVersion;
          const pendingAggregate = pendingVersion === null
            ? null
            : state.aggregates.find((record) =>
              record.entityId === entityId &&
              record.entityType === entityType &&
              record.entityVersion === pendingVersion
            ) ?? null;
          if (pendingAggregate) {
            pendingAggregate.aggregateStatus = "deleted";
            pendingAggregate.aggregateRevision += 1;
            pendingAggregate.deletedAt = now;
            pendingAggregate.updatedAt = now;
            for (const task of state.tasks.filter((record) =>
              record.entityId === entityId &&
              record.entityType === entityType &&
              record.entityVersion === pendingVersion &&
              record.status !== "published" &&
              record.status !== "rejected"
            )) {
              task.status = "deleted";
              task.deletedAt = now;
              task.taskRevision += 1;
              task.updatedAt = now;
            }
          }
          const previousVisibility = entity.publicVisibility;
          const previousEntity = cloneValue(entity);
          entity.pendingReviewVersion = null;
          entity.pendingSnapshot = null;
          entity.publicVisibility = "deleted";
          entity.deletedAt = now;
          entity.entityRevision += 1;
          entity.updatedAt = now;
          const eventId = idFactory("contact-review-audit");
          const aggregateStatus = pendingAggregate?.aggregateStatus ?? "deleted";
          const aggregateId = pendingAggregate?.aggregateId ?? keyedDigest(
            keySecret,
            "aggregate",
            [operatorId, entityType, entityId, entity.currentVersion]
          );
          state.audits.push({
            ...auditContractMetadata({
              nextEntity: entity,
              operation: "delete",
              previousEntity
            }),
            aggregateId,
            aggregateRevision: pendingAggregate?.aggregateRevision ?? 1,
            aggregateStatusAfter: aggregateStatus,
            aggregateStatusBefore: pendingAggregate ? "pending_review" : null,
            appealMode: false,
            appealRequestId: pendingAggregate?.appealRequestId ?? null,
            contentHash: null,
            entityId,
            entityType,
            entityVersion: entity.currentVersion,
            eventDigest: keyedDigest(keySecret, "audit", [requestId, eventId, "delete"]),
            eventId,
            eventType: "entity_deleted",
            field: null,
            fromStatus: null,
            idempotencyKeyHash: keyHash,
            occurredAt: now,
            operatorRef: operatorId,
            operatorRole: "content-owner",
            ownerId: operatorId,
            previousEventDigest: state.audits.at(-1)?.eventDigest ?? null,
            previousPublicVisibility: previousVisibility,
            requiredFieldsDigest: pendingAggregate?.requiredFieldsDigest ?? "",
            ruleVersion,
            schemaVersion: 1,
            taskId: null,
            toStatus: "deleted"
          });
          entity.lastAuditEventId = eventId;
          const resultAggregate = pendingAggregate ?? {
            aggregateId,
            aggregateRevision: 1,
            aggregateStatus: "deleted" as const,
            appealRequestId: null,
            appealUsedAt: null,
            basePublishedVersion: entity.activePublishedVersion,
            createdAt: now,
            deletedAt: now,
            entityId,
            entityType,
            entityVersion: entity.currentVersion,
            fieldReviews: {},
            lastAuditEventId: eventId,
            ownerId: operatorId,
            requiredFields: [],
            requiredFieldsDigest: "",
            restoredAt: null,
            schemaVersion: 1 as const,
            supersedesVersion: null,
            updatedAt: now
          };
          state.idempotency.push({
            completedAt: now,
            createdAt: now,
            entityId,
            entityType,
            entityVersion: entity.currentVersion,
            idempotencyKeyHash: keyHash,
            operation: "delete",
            ownerId: operatorId,
            receiptId: keyedDigest(keySecret, "receipt", [scopeKey, keyHash]),
            requestHash,
            resultCode: "REVIEW_DELETED",
            resultDigest: resultDigest(resultReference(entity, resultAggregate)),
            resultRef: resultReference(entity, resultAggregate),
            scopeKey
          });
          return withAggregate(entity, resultAggregate);
        }, { entityId, entityType, kind: "entity" });
      } catch {
        return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 };
      }
    },

    async scanOverdue({ now, operatorRef }: { now: string; operatorRef: string }) {
      const nowMs = Date.parse(now);
      if (!Number.isFinite(nowMs) || !operatorRef.trim()) {
        return { code: "REVIEW_INPUT_INVALID", ok: false, status: 422 } as const;
      }
      try {
        return await repository.runTransaction(async (state) => {
          const overdue = state.tasks.filter((task) =>
            (task.status === "pending_review" || task.status === "appeal_pending") &&
            Number.isFinite(Date.parse(task.dueAt)) &&
            Date.parse(task.dueAt) <= nowMs
          );
          const grouped = new Map<string, ContactReviewTaskRecord[]>();
          for (const task of overdue) {
            const key = `${task.entityType}:${task.entityId}:${task.entityVersion}`;
            const tasks = grouped.get(key) ?? [];
            tasks.push(task);
            grouped.set(key, tasks);
          }
          for (const tasks of grouped.values()) {
            const first = tasks[0];
            const aggregate = state.aggregates.find((record) =>
              record.entityId === first.entityId &&
              record.entityType === first.entityType &&
              record.entityVersion === first.entityVersion
            );
            if (!aggregate) throw new Error("contact review aggregate unavailable");
            const before = aggregate.aggregateStatus;
            const previousStatuses = new Map(tasks.map((task) => [task.taskId, task.status]));
            for (const task of tasks) {
              task.status = "needs_manual_review";
              task.reasonCode = "review_sla_overdue";
              task.taskRevision += 1;
              task.updatedAt = now;
            }
            const versionTasks = state.tasks.filter((task) =>
              task.entityId === aggregate.entityId &&
              task.entityType === aggregate.entityType &&
              task.entityVersion === aggregate.entityVersion
            );
            aggregate.aggregateRevision += 1;
            aggregate.aggregateStatus = "needs_manual_review";
            aggregate.fieldReviews = toFieldReviews(versionTasks);
            aggregate.updatedAt = now;
            for (const task of tasks) {
              appendAudit(state, {
                aggregate,
                aggregateStatusBefore: before,
                eventType: "review_sla_overdue",
                fromStatus: previousStatuses.get(task.taskId) ?? null,
                now,
                operatorRef,
                operatorRole: "system",
                task,
                toStatus: "needs_manual_review"
              });
            }
          }
          return { ok: true as const, overdueTaskIds: overdue.map((task) => task.taskId) };
        }, { kind: "maintenance" });
      } catch {
        return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 } as const;
      }
    },

    async cleanupRetention({
      holdEntityRefs,
      idempotencyKey,
      operatorRef,
      now
    }: {
      holdEntityRefs: string[];
      idempotencyKey: string;
      operatorRef: string;
      now: string;
    }) {
      const nowMs = Date.parse(now);
      if (!Number.isFinite(nowMs) || !idempotencyKey.trim() || !operatorRef.trim()) {
        return { code: "REVIEW_INPUT_INVALID", ok: false, status: 422 } as const;
      }
      const sortedHoldRefs = [...new Set(holdEntityRefs)].sort();
      const holds = new Set(sortedHoldRefs);
      const keyHash = keyedDigest(keySecret, "idempotency-key", idempotencyKey);
      const requestHash = keyedDigest(keySecret, "review-request", {
        holdEntityRefs: sortedHoldRefs,
        operation: "cleanupRetention",
        operatorRef
      });
      try {
        return await repository.runTransaction(async (state) => {
          const priorReceipt = state.audits.find((audit) =>
            audit.eventType === "retention_cleanup" && audit.idempotencyKeyHash === keyHash
          );
          if (priorReceipt) {
            if (priorReceipt.cleanupResult?.requestHash !== requestHash) {
              return { code: "IDEMPOTENCY_KEY_REUSED", ok: false, status: 409 } as const;
            }
            return {
              ok: true as const,
              removedAuditCount: priorReceipt.cleanupResult.removedAuditCount,
              removedTaskCount: priorReceipt.cleanupResult.removedTaskCount,
              replayed: true as const
            };
          }
          const previousCleanupByEntity = new Map<string, ContactReviewAuditRecord>();
          for (const audit of state.audits) {
            if (audit.eventType !== "retention_cleanup" || !audit.cleanupResult) continue;
            const ref = `${audit.entityType}:${audit.entityId}`;
            const previous = previousCleanupByEntity.get(ref);
            if (!previous || Date.parse(previous.occurredAt) <= Date.parse(audit.occurredAt)) {
              previousCleanupByEntity.set(ref, audit);
            }
          }
          const beforeTaskCount = state.tasks.length;
          const beforeAuditCount = state.audits.length;
          const removedEntityRefs = new Set<string>();
          state.tasks = state.tasks.filter((task) => {
            const ref = `${task.entityType}:${task.entityId}`;
            if (holds.has(ref)) return true;
            if (!new Set<ContactReviewTaskStatus>(["deleted", "published", "rejected"]).has(task.status)) return true;
            const completedAt = task.decidedAt ?? task.deletedAt;
            if (!completedAt || nowMs < Date.parse(completedAt) + 30 * 24 * 60 * 60 * 1000) return true;
            removedEntityRefs.add(ref);
            return false;
          });
          state.audits = state.audits.filter((audit) => {
            const ref = `${audit.entityType}:${audit.entityId}`;
            if (holds.has(ref)) return true;
            if (nowMs < Date.parse(audit.occurredAt) + 180 * 24 * 60 * 60 * 1000) return true;
            removedEntityRefs.add(ref);
            return false;
          });
          const removedAuditCount = beforeAuditCount - state.audits.length;
          const removedTaskCount = beforeTaskCount - state.tasks.length;
          const targetEntityRefs = new Set([
            ...holds,
            ...removedEntityRefs,
            ...[...previousCleanupByEntity.entries()]
              .filter(([, audit]) => audit.cleanupResult?.holdApplied)
              .map(([ref]) => ref)
          ]);
          if (targetEntityRefs.size === 0) {
            const fallback = state.entities[0];
            if (fallback) targetEntityRefs.add(`${fallback.entityType}:${fallback.entityId}`);
          }
          const holdEntityRefsDigest = keyedDigest(keySecret, "retention-holds", sortedHoldRefs);
          for (const ref of targetEntityRefs) {
            const separator = ref.indexOf(":");
            const entityType = ref.slice(0, separator) as ContactReviewEntityType;
            const entityId = ref.slice(separator + 1);
            const entity = state.entities.find((record) =>
              record.entityType === entityType && record.entityId === entityId
            );
            if (!entity) continue;
            const aggregate = state.aggregates
              .filter((record) => record.entityType === entityType && record.entityId === entityId)
              .sort((left, right) => right.entityVersion - left.entityVersion)[0];
            if (!aggregate) continue;
            const previousHeld = previousCleanupByEntity.get(ref)?.cleanupResult?.holdApplied ?? false;
            const holdApplied = holds.has(ref);
            const holdAction = holdApplied
              ? previousHeld ? "extended" as const : "created" as const
              : previousHeld ? "released" as const : null;
            appendAudit(state, {
              aggregate,
              aggregateStatusBefore: aggregate.aggregateStatus,
              cleanupResult: {
                auditCutoffAt: new Date(nowMs - 180 * 24 * 60 * 60 * 1000).toISOString(),
                holdAction,
                holdApplied,
                holdEntityRefsDigest,
                removedAuditCount,
                removedTaskCount,
                requestHash,
                status: "completed",
                taskCutoffAt: new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString()
              },
              eventType: "retention_cleanup",
              idempotencyKeyHash: keyHash,
              now,
              operation: "cleanupRetention",
              operatorRef,
              operatorRole: "system",
              previousEntity: cloneValue(entity),
              reasonCode: "retention_cleanup_completed",
              toStatus: aggregate.aggregateStatus
            });
          }
          return {
            ok: true as const,
            removedAuditCount,
            removedTaskCount,
            replayed: false as const
          };
        }, { kind: "maintenance" });
      } catch {
        try {
          await repository.runTransaction(async (state) => {
            const entity = state.entities[0];
            if (!entity) return;
            const aggregate = state.aggregates
              .filter((record) =>
                record.entityId === entity.entityId && record.entityType === entity.entityType
              )
              .sort((left, right) => right.entityVersion - left.entityVersion)[0];
            if (!aggregate) return;
            appendAudit(state, {
              aggregate,
              aggregateStatusBefore: aggregate.aggregateStatus,
              cleanupResult: {
                auditCutoffAt: new Date(nowMs - 180 * 24 * 60 * 60 * 1000).toISOString(),
                holdAction: null,
                holdApplied: holds.has(`${entity.entityType}:${entity.entityId}`),
                holdEntityRefsDigest: keyedDigest(keySecret, "retention-holds", sortedHoldRefs),
                removedAuditCount: 0,
                removedTaskCount: 0,
                requestHash,
                status: "failed",
                taskCutoffAt: new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString()
              },
              eventType: "retention_cleanup_failed",
              idempotencyKeyHash: keyHash,
              now,
              operation: "cleanupRetention",
              operatorRef,
              operatorRole: "system",
              previousEntity: cloneValue(entity),
              reasonCode: "retention_cleanup_transaction_failed",
              toStatus: aggregate.aggregateStatus
            });
          }, { kind: "maintenance" });
        } catch {
          // The caller must emit the 503/correlation id to the external operations audit sink.
        }
        return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 } as const;
      }
    },

    async readPublic(entityType: ContactReviewEntityType, entityId: string) {
      let state: ContactReviewRepositoryState;
      try {
        state = await repository.readState({ entityId, entityType, kind: "entity" });
      } catch {
        return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 } as const;
      }
      const entity = state.entities.find((record) =>
        record.entityId === entityId && record.entityType === entityType
      );
      if (
        !entity ||
        entity.publicVisibility !== "published" ||
        entity.activePublishedVersion === null ||
        !entity.activeSnapshot
      ) {
        return { ok: true as const, value: null };
      }
      return authoritativePublishedAggregate(state, entity)
        ? {
          ok: true as const,
          value: projectContactReviewPublicSnapshot(entityType, entity.activeSnapshot)
        }
        : { ok: true as const, value: null };
    },

    async listPublic(entityType: ContactReviewEntityType) {
      let state: ContactReviewRepositoryState;
      try {
        state = await repository.readState({ entityType, kind: "public" });
      } catch {
        return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 } as const;
      }
      return {
        ok: true as const,
        value: state.entities
          .filter((entity) => entity.entityType === entityType)
          .flatMap((entity) => {
            if (!entity.activeSnapshot || !authoritativePublishedAggregate(state, entity)) return [];
            return [projectContactReviewPublicSnapshot(entityType, entity.activeSnapshot)];
          })
          .sort((left, right) => {
            const createdOrder = String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? ""));
            return createdOrder || String(left.id ?? "").localeCompare(String(right.id ?? ""));
          })
      };
    },

    async readOwner(entityType: ContactReviewEntityType, entityId: string, ownerId: string) {
      let state: ContactReviewRepositoryState;
      try {
        state = await repository.readState({ entityId, entityType, kind: "entity" });
      } catch {
        return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 } as const;
      }
      const entity = state.entities.find((record) =>
        record.entityId === entityId && record.entityType === entityType && record.ownerId === ownerId
      );
      if (!entity) return { code: "NOT_FOUND", ok: false, status: 404 } as const;
      const aggregate = state.aggregates.find((record) =>
        record.entityId === entityId &&
        record.entityType === entityType &&
        record.entityVersion === (entity.pendingReviewVersion ?? entity.activePublishedVersion)
      );
      return {
        ok: true as const,
        value: {
          ...cloneValue(entity.pendingSnapshot ?? entity.activeSnapshot ?? {}),
          activePublishedVersion: entity.activePublishedVersion,
          canAppeal: aggregate?.aggregateStatus === "rejected" && aggregate.appealUsedAt === null,
          canEdit: aggregate?.aggregateStatus === "published" || aggregate?.aggregateStatus === "rejected",
          currentVersion: entity.currentVersion,
          entityId: entity.entityId,
          entityRevision: entity.entityRevision,
          pendingReviewVersion: entity.pendingReviewVersion,
          publicVisibility: entity.publicVisibility,
          reviewStatus: aggregate?.aggregateStatus ?? "needs_manual_review"
        }
      };
    },

    async listOwner(entityType: ContactReviewEntityType, ownerId: string) {
      let state: ContactReviewRepositoryState;
      try {
        state = await repository.readState({ entityType, kind: "owner", ownerId });
      } catch {
        return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 } as const;
      }
      return {
        ok: true as const,
        value: state.entities
          .filter((entity) => entity.entityType === entityType && entity.ownerId === ownerId)
          .map((entity) => {
            const aggregate = state.aggregates.find((record) =>
              record.entityId === entity.entityId &&
              record.entityType === entity.entityType &&
              record.entityVersion === (entity.pendingReviewVersion ?? entity.activePublishedVersion)
            );
            return {
              ...cloneValue(entity.pendingSnapshot ?? entity.activeSnapshot ?? {}),
              activePublishedVersion: entity.activePublishedVersion,
              canAppeal: aggregate?.aggregateStatus === "rejected" && aggregate.appealUsedAt === null,
              canEdit: aggregate?.aggregateStatus === "published" || aggregate?.aggregateStatus === "rejected",
              id: entity.entityId,
              pendingReviewVersion: entity.pendingReviewVersion,
              publicVisibility: entity.publicVisibility,
              reviewStatus: aggregate?.aggregateStatus ?? "needs_manual_review",
              version: entity.entityRevision
            };
          })
      };
    },

    async listReviewerQueue(operator: { id: string; role: ContactReviewReviewerRole }) {
      let state: ContactReviewRepositoryState;
      try {
        state = await repository.readState({ kind: "maintenance" });
      } catch {
        return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 } as const;
      }
      const tasks = state.tasks.filter((task) => {
        if (task.ownerId === operator.id || task.status === "deleted") return false;
        if (operator.role === "second-review") {
          return task.appealMode && task.status === "appeal_pending" && Boolean(task.triageReviewerRef);
        }
        return task.appealMode
          ? task.status === "appeal_pending" || task.status === "needs_manual_review"
          : task.status === "pending_review" || task.status === "needs_manual_review";
      });
      return {
        ok: true as const,
        value: tasks.map((task) => {
          const aggregate = state.aggregates.find((record) =>
            record.entityId === task.entityId &&
            record.entityType === task.entityType &&
            record.entityVersion === task.entityVersion
          );
          const entity = state.entities.find((record) =>
            record.entityId === task.entityId && record.entityType === task.entityType
          );
          return {
            aggregateRevision: aggregate?.aggregateRevision ?? 0,
            aggregateStatus: aggregate?.aggregateStatus ?? "needs_manual_review",
            appealMode: task.appealMode,
            appealRequestId: aggregate?.appealRequestId ?? null,
            claimAt: task.claimAt,
            dueAt: task.dueAt,
            entityId: task.entityId,
            entityType: task.entityType,
            entityVersion: task.entityVersion,
            field: task.field,
            reviewText: String(entity?.pendingSnapshot?.[task.field] ?? ""),
            status: task.status,
            taskId: task.taskId,
            taskRevision: task.taskRevision,
            triageReviewerRef: task.triageReviewerRef,
            triageReviewerRole: task.triageReviewerRole
          };
        })
      };
    },

    async readOperationalHealth({ now }: { now: string }) {
      const nowMs = Date.parse(now);
      if (!Number.isFinite(nowMs)) {
        return { code: "REVIEW_INPUT_INVALID", ok: false, status: 422 } as const;
      }
      let state: ContactReviewRepositoryState;
      try {
        state = await repository.readState({ kind: "maintenance" });
      } catch {
        return { code: "REVIEW_UNAVAILABLE", ok: false, status: 503 } as const;
      }
      const aggregateIntegrityFailures = state.aggregates.filter((aggregate) => {
        if (aggregate.aggregateStatus === "deleted") return false;
        const recomputed = recomputeContactReviewAggregate({
          fieldReviews: aggregate.fieldReviews,
          requiredFields: aggregate.requiredFields
        });
        return !recomputed.ok || recomputed.status !== aggregate.aggregateStatus;
      }).length;
      const publicPointerFailures = state.entities.filter((entity) =>
        entity.publicVisibility === "published" && !authoritativePublishedAggregate(state, entity)
      ).length;
      const activeStatuses = new Set<ContactReviewTaskStatus>([
        "appeal_pending",
        "needs_manual_review",
        "pending_review"
      ]);
      const pendingTasks = state.tasks.filter((task) => activeStatuses.has(task.status));
      return {
        ok: true as const,
        value: {
          aggregateIntegrityFailures,
          auditEventCount: state.audits.length,
          manualReviewTaskCount: state.tasks.filter((task) => task.status === "needs_manual_review").length,
          overdueTaskCount: pendingTasks.filter((task) => Date.parse(task.dueAt) <= nowMs).length,
          pendingTaskCount: pendingTasks.length,
          publicPointerFailures,
          repositoryReachable: true,
          rollbackControl: "disable_feature_flag_then_verify_hidden_or_previous_approved_snapshot"
        }
      };
    }
  };
}

type AggregateResult =
  | { ok: true; status: ContactReviewAggregateStatus }
  | {
    code: "field_set_invalid";
    ok: false;
    status: "pending_review";
  };

export function recomputeContactReviewAggregate({
  fieldReviews,
  requiredFields
}: {
  fieldReviews: Partial<Record<ContactReviewField, ContactReviewFieldReview>>;
  requiredFields: readonly ContactReviewField[];
}): AggregateResult {
  const uniqueFields = new Set(requiredFields);
  const actualFields = Object.keys(fieldReviews) as ContactReviewField[];
  if (
    requiredFields.length === 0 ||
    uniqueFields.size !== requiredFields.length ||
    actualFields.length !== requiredFields.length ||
    actualFields.some((field) => !uniqueFields.has(field)) ||
    requiredFields.some((field) => {
      const review = fieldReviews[field];
      return !review || review.field !== field || !review.taskId || !review.reviewKey;
    })
  ) {
    return { code: "field_set_invalid", ok: false, status: "pending_review" };
  }

  const statuses = requiredFields.map((field) => fieldReviews[field]!.fieldStatus);
  if (statuses.every((status) => status === "published")) {
    return { ok: true, status: "published" };
  }
  if (statuses.some((status) => status === "appeal_pending")) {
    return { ok: true, status: "appeal_pending" };
  }
  if (statuses.some((status) => status === "needs_manual_review")) {
    return { ok: true, status: "needs_manual_review" };
  }
  if (
    statuses.every((status) => status === "published" || status === "rejected") &&
    statuses.some((status) => status === "rejected")
  ) {
    return { ok: true, status: "rejected" };
  }
  if (statuses.every((status) => status === "deleted")) {
    return { ok: true, status: "deleted" };
  }
  return { ok: true, status: "pending_review" };
}
import { createHmac } from "node:crypto";
