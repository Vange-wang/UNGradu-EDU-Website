import type {
  ContactReviewAggregateRecord,
  ContactReviewAuditRecord,
  ContactReviewEntityRecord,
  ContactReviewIdempotencyRecord,
  ContactReviewRepository,
  ContactReviewRepositoryScope,
  ContactReviewRepositoryState,
  ContactReviewTaskRecord
} from "./contact-review-production";

export const CONTACT_REVIEW_COLLECTIONS = {
  aggregates: "contact_review_entity_versions",
  auditEvents: "contact_review_audit_events",
  idempotency: "contact_review_idempotency",
  tasks: "contact_review_tasks"
} as const;

type QueryResult = { data?: Record<string, unknown> | Record<string, unknown>[] };
type DocumentReference = {
  get: () => Promise<QueryResult>;
  remove: () => Promise<unknown>;
  set: (value: Record<string, unknown>) => Promise<unknown>;
  update: (value: Record<string, unknown>) => Promise<unknown>;
};
type CollectionReference = {
  doc: (id: string) => DocumentReference;
  queryPageSize?: number;
  where: (query: Record<string, unknown>) => QueryReference;
};
type QueryReference = {
  get: () => Promise<QueryResult>;
  limit?: (value: number) => QueryReference;
  orderBy?: (field: string, direction: "asc" | "desc") => QueryReference;
  skip?: (value: number) => QueryReference;
};
type TransactionReference = { collection: (name: string) => CollectionReference };
export type CloudBaseContactReviewDatabase = TransactionReference & {
  runTransaction: <T>(operation: (transaction: TransactionReference) => Promise<T>) => Promise<T>;
};

type RuntimeEnvironment = Record<string, unknown>;

export type ContactReviewRuntimeGate =
  | { enabled: false; ok: true }
  | {
    enabled: true;
    ok: true;
    reviewerRefs: { backup: string[]; primary: string[]; secondReview: string[] };
  }
  | {
    code: "CONTACT_REVIEW_CONFIGURATION_UNAVAILABLE";
    ok: false;
    status: 503;
  };

function parseRefs(value: unknown): string[] {
  return [...new Set((typeof value === "string" ? value : "").split(",").map((item) => item.trim()).filter(Boolean))];
}

export function readContactReviewRuntimeGate(env: RuntimeEnvironment): ContactReviewRuntimeGate {
  if (env.CONTACT_REVIEW_ENABLED !== "true") return { enabled: false, ok: true };
  const primary = parseRefs(env.CONTACT_REVIEW_PRIMARY_REVIEWER_REFS);
  const backup = parseRefs(env.CONTACT_REVIEW_BACKUP_REVIEWER_REFS);
  const secondReview = parseRefs(env.CONTACT_REVIEW_SECOND_REVIEWER_REFS);
  const roleRefs = [...primary, ...backup, ...secondReview];
  const rolesAreSeparated = roleRefs.length === new Set(roleRefs).size;
  if (
    env.CONTACT_REVIEW_SCHEMA_READY !== "true" ||
    typeof env.CONTACT_REVIEW_KEY_SECRET !== "string" ||
    !env.CONTACT_REVIEW_KEY_SECRET.trim() ||
    primary.length === 0 ||
    backup.length === 0 ||
    secondReview.length === 0 ||
    !rolesAreSeparated
  ) {
    return { code: "CONTACT_REVIEW_CONFIGURATION_UNAVAILABLE", ok: false, status: 503 };
  }
  return {
    enabled: true,
    ok: true,
    reviewerRefs: { backup, primary, secondReview }
  };
}

function records(result: QueryResult): Record<string, unknown>[] {
  if (!result.data) return [];
  return Array.isArray(result.data) ? result.data : [result.data];
}

function withoutSystemId<T extends Record<string, unknown>>(record: T): T {
  const copy = { ...record };
  delete copy._id;
  return copy;
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sourceCollectionName(entityType: ContactReviewEntityRecord["entityType"]): string {
  return entityType === "parent_need" ? "parent_needs" : "tutor_profiles";
}

async function readDocument(collection: CollectionReference, id: string) {
  const [value] = records(await collection.doc(id).get());
  return value;
}

async function queryDocuments(collection: CollectionReference, query: Record<string, unknown>) {
  const pageSize = Number.isSafeInteger(collection.queryPageSize) && Number(collection.queryPageSize) > 0
    ? Number(collection.queryPageSize)
    : 100;
  const result: Record<string, unknown>[] = [];
  const seenIds = new Set<string>();
  for (let offset = 0; ; offset += pageSize) {
    let reference = collection.where(query);
    const supportsPaging = Boolean(reference.skip && reference.limit);
    if (reference.orderBy) reference = reference.orderBy("_id", "asc");
    if (reference.skip) reference = reference.skip(offset);
    if (reference.limit) reference = reference.limit(pageSize);
    const page = records(await reference.get());
    for (const document of page) {
      const id = typeof document._id === "string" ? document._id : null;
      if (id && seenIds.has(id)) throw new Error("CloudBase query pagination did not advance");
      if (id) seenIds.add(id);
      result.push(document);
    }
    if (!supportsPaging || page.length < pageSize) return result;
    if (!Number.isSafeInteger(offset + pageSize)) throw new Error("CloudBase query pagination overflow");
  }
}

function emptyState(): ContactReviewRepositoryState {
  return { aggregates: [], audits: [], entities: [], idempotency: [], tasks: [] };
}

function asEntity(document: Record<string, unknown> | undefined): ContactReviewEntityRecord | null {
  const value = document?.contactReviewState;
  return value && typeof value === "object" ? value as ContactReviewEntityRecord : null;
}

async function loadEntityScope(
  database: TransactionReference,
  entityType: ContactReviewEntityRecord["entityType"],
  entityId: string,
  state: ContactReviewRepositoryState
) {
  const source = await readDocument(database.collection(sourceCollectionName(entityType)), entityId);
  const entity = asEntity(source);
  if (entity) state.entities.push(entity);
  const query = { entityId, entityType };
  state.aggregates.push(...await queryDocuments(database.collection(CONTACT_REVIEW_COLLECTIONS.aggregates), query) as ContactReviewAggregateRecord[]);
  state.tasks.push(...await queryDocuments(database.collection(CONTACT_REVIEW_COLLECTIONS.tasks), query) as ContactReviewTaskRecord[]);
  state.idempotency.push(...await queryDocuments(database.collection(CONTACT_REVIEW_COLLECTIONS.idempotency), query) as ContactReviewIdempotencyRecord[]);
  state.audits.push(...await queryDocuments(database.collection(CONTACT_REVIEW_COLLECTIONS.auditEvents), query) as ContactReviewAuditRecord[]);
}

async function loadState(database: TransactionReference, scope: ContactReviewRepositoryScope) {
  const state = emptyState();
  if (scope.kind === "maintenance") {
    for (const entityType of ["parent_need", "tutor_profile"] as const) {
      const sources = await queryDocuments(database.collection(sourceCollectionName(entityType)), {});
      state.entities.push(...sources.map(asEntity).filter((value): value is ContactReviewEntityRecord => Boolean(value)));
    }
    state.aggregates.push(...await queryDocuments(database.collection(CONTACT_REVIEW_COLLECTIONS.aggregates), {}) as ContactReviewAggregateRecord[]);
    state.tasks.push(...await queryDocuments(database.collection(CONTACT_REVIEW_COLLECTIONS.tasks), {}) as ContactReviewTaskRecord[]);
    state.idempotency.push(...await queryDocuments(database.collection(CONTACT_REVIEW_COLLECTIONS.idempotency), {}) as ContactReviewIdempotencyRecord[]);
    state.audits.push(...await queryDocuments(database.collection(CONTACT_REVIEW_COLLECTIONS.auditEvents), {}) as ContactReviewAuditRecord[]);
    return state;
  }
  if (scope.kind === "public") {
    const sources = await queryDocuments(database.collection(sourceCollectionName(scope.entityType)), {});
    state.entities.push(...sources.map(asEntity).filter((value): value is ContactReviewEntityRecord => Boolean(value)));
    state.aggregates.push(...await queryDocuments(database.collection(CONTACT_REVIEW_COLLECTIONS.aggregates), {
      entityType: scope.entityType
    }) as ContactReviewAggregateRecord[]);
    state.tasks.push(...await queryDocuments(database.collection(CONTACT_REVIEW_COLLECTIONS.tasks), {
      entityType: scope.entityType
    }) as ContactReviewTaskRecord[]);
    return state;
  }
  if (scope.kind === "owner") {
    const sources = await queryDocuments(database.collection(sourceCollectionName(scope.entityType)), {
      ownerUserId: scope.ownerId
    });
    const entities = sources.map(asEntity).filter((value): value is ContactReviewEntityRecord => Boolean(value));
    for (const entity of entities) await loadEntityScope(database, entity.entityType, entity.entityId, state);
    return state;
  }
  if (scope.kind === "task") {
    const task = await readDocument(database.collection(CONTACT_REVIEW_COLLECTIONS.tasks), scope.taskId) as ContactReviewTaskRecord | undefined;
    if (!task) return state;
    await loadEntityScope(database, task.entityType, task.entityId, state);
    return state;
  }
  if (scope.kind === "appeal") {
    const [aggregate] = await queryDocuments(database.collection(CONTACT_REVIEW_COLLECTIONS.aggregates), {
      appealRequestId: scope.appealRequestId
    }) as ContactReviewAggregateRecord[];
    if (!aggregate) return state;
    await loadEntityScope(database, aggregate.entityType, aggregate.entityId, state);
    return state;
  }
  if (scope.kind === "submit") {
    const [receipt] = await queryDocuments(database.collection(CONTACT_REVIEW_COLLECTIONS.idempotency), {
      idempotencyKeyHash: scope.idempotencyKeyHash,
      scopeKey: scope.scopeKey
    }) as ContactReviewIdempotencyRecord[];
    if (receipt) {
      await loadEntityScope(database, receipt.entityType, receipt.entityId, state);
      return state;
    }
  }
  await loadEntityScope(database, scope.entityType, scope.entityId, state);
  return state;
}

function recordId(record: ContactReviewAggregateRecord | ContactReviewAuditRecord | ContactReviewIdempotencyRecord | ContactReviewTaskRecord) {
  if ("aggregateId" in record && !("eventId" in record)) return record.aggregateId;
  if ("eventId" in record) return record.eventId;
  if ("receiptId" in record) return record.receiptId;
  return record.taskId;
}

async function persistCollection<T extends ContactReviewAggregateRecord | ContactReviewAuditRecord | ContactReviewIdempotencyRecord | ContactReviewTaskRecord>(
  collection: CollectionReference,
  before: T[],
  after: T[]
) {
  const oldRecords = new Map(before.map((record) => [recordId(record), record]));
  const newRecords = new Map(after.map((record) => [recordId(record), record]));
  for (const [id, record] of newRecords) {
    if (!sameValue(oldRecords.get(id), record)) {
      await collection.doc(id).set(withoutSystemId(record as unknown as Record<string, unknown>));
    }
  }
  for (const id of oldRecords.keys()) {
    if (!newRecords.has(id)) await collection.doc(id).remove();
  }
}

function sourceProjection(entity: ContactReviewEntityRecord): Record<string, unknown> {
  const visibleSnapshot = entity.publicVisibility === "published"
    ? entity.activeSnapshot
    : entity.pendingSnapshot ?? entity.activeSnapshot;
  return {
    ...(visibleSnapshot ?? {}),
    activePublishedVersion: entity.activePublishedVersion,
    contactReviewState: entity,
    currentVersion: entity.currentVersion,
    deletedAt: entity.deletedAt,
    entityRevision: entity.entityRevision,
    pendingReviewVersion: entity.pendingReviewVersion,
    publicVisibility: entity.publicVisibility,
    status: entity.publicVisibility === "published"
      ? "published"
      : entity.publicVisibility === "deleted" ? "deleted" : "pending_review",
    updatedAt: entity.updatedAt,
    version: entity.entityRevision
  };
}

async function persistState(
  database: TransactionReference,
  before: ContactReviewRepositoryState,
  after: ContactReviewRepositoryState
) {
  const beforeEntities = new Map(before.entities.map((entity) => [`${entity.entityType}:${entity.entityId}`, entity]));
  for (const entity of after.entities) {
    const id = `${entity.entityType}:${entity.entityId}`;
    if (sameValue(beforeEntities.get(id), entity)) continue;
    const collection = database.collection(sourceCollectionName(entity.entityType));
    const existing = await readDocument(collection, entity.entityId);
    const projection = withoutSystemId(sourceProjection(entity));
    if (existing) await collection.doc(entity.entityId).update(projection);
    else await collection.doc(entity.entityId).set(projection);
  }
  await persistCollection(database.collection(CONTACT_REVIEW_COLLECTIONS.aggregates), before.aggregates, after.aggregates);
  await persistCollection(database.collection(CONTACT_REVIEW_COLLECTIONS.tasks), before.tasks, after.tasks);
  await persistCollection(database.collection(CONTACT_REVIEW_COLLECTIONS.idempotency), before.idempotency, after.idempotency);
  await persistCollection(database.collection(CONTACT_REVIEW_COLLECTIONS.auditEvents), before.audits, after.audits);
}

export function createCloudBaseContactReviewRepository({
  database
}: {
  database: CloudBaseContactReviewDatabase;
}): ContactReviewRepository {
  return {
    async readState(scope) {
      return loadState(database, scope);
    },
    async runTransaction(operation, scope) {
      return database.runTransaction(async (transaction) => {
        const before = await loadState(transaction, scope);
        const candidate = structuredClone(before);
        const result = await operation(candidate);
        await persistState(transaction, before, candidate);
        return result;
      });
    }
  };
}
