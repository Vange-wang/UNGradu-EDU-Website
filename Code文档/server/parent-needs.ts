import {
  type ParentNeed,
  type ParentNeedInput,
  validateParentNeedInput
} from "@/features/parent-needs/parent-need";
export const PARENT_NEEDS_COLLECTION = "parent_needs";

export type ServerParentNeed = ParentNeed & {
  id: string;
  ownerUserId: string;
  status: "deleted" | "published";
  createdAt: string;
  updatedAt: string;
  version: number;
  managementState: "managed" | "legacy-readonly";
  deletedAt: string | null;
  deletedByUserId: string | null;
};

export type PublicServerParentNeed = Pick<
  ServerParentNeed,
  | "budgetMax"
  | "budgetMin"
  | "createdAt"
  | "grade"
  | "id"
  | "status"
  | "subjects"
  | "teacherGenderPreference"
  | "timeSlots"
> & {
  childIntroSummary: string;
  publicSafetyNote: string;
  regionLabel: string;
  status: "published";
};

export type ServerParentNeedFilters = {
  subject?: string;
  grade?: string;
  budgetMin?: string;
  budgetMax?: string;
  teacherGenderPreference?: string;
};

type LifecycleMutationHistoryEntry = {
  action: "delete" | "restore";
  deletedAt: string | null;
  deletedByUserId: string | null;
  idempotencyKey: string;
  status: "deleted" | "published";
  updatedAt: string;
  version: number;
};

type ParentNeedDocument = Partial<Omit<ServerParentNeed, "managementState">> & {
  lastMutationAction?: "delete" | "restore";
  lastMutationKey?: string;
  mutationHistory?: LifecycleMutationHistoryEntry[];
};

type ParentNeedCollection = {
  doc: (docId: string) => {
    get: () => Promise<{ data?: Record<string, unknown> | unknown[] }>;
    set: (data: ParentNeedDocument) => Promise<unknown>;
  };
  where: (query: Record<string, unknown>) => ParentNeedQuery;
};

type ParentNeedQuery = {
  get: () => Promise<{ data?: unknown[] }>;
  limit?: (value: number) => ParentNeedQuery;
  orderBy?: (field: string, direction: "asc" | "desc") => ParentNeedQuery;
  skip?: (value: number) => ParentNeedQuery;
};

type Failure = {
  ok: false;
  value: null;
  errors: Record<string, string>;
  code?: string;
  status?: number;
};

type Success<T> = {
  ok: true;
  value: T;
  errors: Record<string, never>;
};

function normalizeUserId(userId: string) {
  return userId.trim();
}

function createOpaqueId(prefix: string) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function createFailure(message: string, status?: number, code?: string): Failure {
  return {
    ok: false,
    value: null,
    errors: { request: message },
    ...(status ? { status } : {}),
    ...(code ? { code } : {})
  };
}

function requireAuthenticatedUser(authenticatedUserId: string) {
  const currentUserId = normalizeUserId(authenticatedUserId);
  return currentUserId || null;
}

function readSingleDocument<T>(result: {
  data?: Record<string, unknown> | unknown[];
}) {
  const data = result.data;
  return (Array.isArray(data) ? data[0] : data) as T | undefined;
}

function withoutCloudBaseDocumentId(document: Record<string, unknown>) {
  const writableDocument = { ...document };
  delete writableDocument._id;
  return writableDocument;
}

function normalizeParentNeed(document: ParentNeedDocument): ServerParentNeed | null {
  if (
    !document.id ||
    !document.ownerUserId ||
    (document.status !== "published" && document.status !== "deleted") ||
    !document.createdAt ||
    !document.teacherGenderPreference ||
    !Array.isArray(document.subjects) ||
    !document.grade ||
    typeof document.budgetMin !== "number" ||
    typeof document.budgetMax !== "number" ||
    !Array.isArray(document.timeSlots) ||
    !document.region ||
    !document.community ||
    !document.childIntro
  ) {
    return null;
  }

  return {
    id: document.id,
    ownerUserId: document.ownerUserId,
    teacherGenderPreference: document.teacherGenderPreference,
    subjects: document.subjects,
    grade: document.grade,
    budgetMin: document.budgetMin,
    budgetMax: document.budgetMax,
    timeSlots: document.timeSlots,
    region: document.region,
    community: document.community,
    childIntro: document.childIntro,
    status: document.status,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt ?? "",
    version: document.version ?? 0,
    managementState:
      document.updatedAt &&
        typeof document.version === "number" &&
        Number.isInteger(document.version) &&
        document.version > 0
        ? "managed"
        : "legacy-readonly",
    deletedAt: document.deletedAt ?? null,
    deletedByUserId: document.deletedByUserId ?? null
  };
}

function toParentNeedDocument(record: ServerParentNeed): ParentNeedDocument {
  const document: ParentNeedDocument & { managementState?: string } = { ...record };
  delete document.managementState;
  return document;
}

type RelatedDocumentCollection = {
  doc: (docId: string) => {
    get: () => Promise<{ data?: unknown[] }>;
    set: (data: Record<string, unknown>) => Promise<unknown>;
  };
  where: (query: Record<string, unknown>) => {
    get: () => Promise<{ data?: unknown[] }>;
  };
};

type AuditCollection = Pick<RelatedDocumentCollection, "doc">;

export type ParentNeedLifecycleTransaction = {
  auditCollection: AuditCollection;
  contactExchangeRequestsCollection: RelatedDocumentCollection;
  conversationsCollection: RelatedDocumentCollection;
  sourceCollection: ParentNeedCollection;
};

export type ParentNeedLifecycleTransactionRunner = <T>(
  operation: (transaction: ParentNeedLifecycleTransaction) => Promise<T>
) => Promise<T>;

const RECOVERY_WINDOW_MS = 48 * 60 * 60 * 1000;
const MUTATION_HISTORY_LIMIT = 16;
export const PARENT_NEED_NOT_FOUND_MESSAGE = "未找到该发布记录";

function isValidIdempotencyKey(value: string) {
  return /^[A-Za-z0-9._:-]{8,128}$/.test(value);
}

function recoveryDeadline(deletedAt: string) {
  return new Date(new Date(deletedAt).getTime() + RECOVERY_WINDOW_MS).toISOString();
}

function readMutationHistory(document: ParentNeedDocument) {
  if (!Array.isArray(document.mutationHistory)) return [];

  return document.mutationHistory.filter((entry): entry is LifecycleMutationHistoryEntry =>
    Boolean(
      entry &&
      (entry.action === "delete" || entry.action === "restore") &&
      typeof entry.idempotencyKey === "string" &&
      (entry.status === "deleted" || entry.status === "published") &&
      typeof entry.updatedAt === "string" &&
      Number.isInteger(entry.version)
    )
  );
}

function replayMutationResult(
  existing: ServerParentNeed,
  history: LifecycleMutationHistoryEntry[],
  action: "delete" | "restore",
  idempotencyKey: string
) {
  const replay = [...history]
    .reverse()
    .find((entry) => entry.action === action && entry.idempotencyKey === idempotencyKey);

  return replay
    ? {
        ...existing,
        status: replay.status,
        updatedAt: replay.updatedAt,
        version: replay.version,
        deletedAt: replay.deletedAt,
        deletedByUserId: replay.deletedByUserId
      }
    : null;
}

async function updateRelatedSourceState({
  contactExchangeRequestsCollection,
  conversationsCollection,
  sourceId,
  sourceStatus,
  sourceVersion,
  updatedAt
}: Pick<
  ParentNeedLifecycleTransaction,
  "contactExchangeRequestsCollection" | "conversationsCollection"
> & {
  sourceId: string;
  sourceStatus: "deleted" | "published";
  sourceVersion: number;
  updatedAt: string;
}) {
  const indexedRows = (
    await conversationsCollection.where({ sourceKey: `parent-need:${sourceId}` }).get()
  ).data ?? [];
  const legacyRows = (
    await conversationsCollection.where({ sourceId }).get()
  ).data ?? [];
  const conversationRows = Array.from(
    new Map(
      [...indexedRows, ...legacyRows]
        .map((row) => row as Record<string, unknown>)
        .filter((row) => row.sourceType === "parent-need")
        .map((row) => [String(row.id ?? ""), row])
    ).values()
  );

  for (const row of conversationRows) {
    const conversation = row;
    const conversationId = String(conversation.id ?? "");

    if (!conversationId) {
      continue;
    }

    await conversationsCollection.doc(conversationId).set({
      ...withoutCloudBaseDocumentId(conversation),
      sourceStatus,
      sourceVersion,
      sourceUpdatedAt: updatedAt
    });

    const requests = (
      await contactExchangeRequestsCollection.where({ conversationId }).get()
    ).data ?? [];

    for (const rowRequest of requests) {
      const request = rowRequest as Record<string, unknown>;
      const requestId = String(request.id ?? "");

      if (!requestId) {
        continue;
      }

      await contactExchangeRequestsCollection.doc(requestId).set({
        ...withoutCloudBaseDocumentId(request),
        sourceStatus,
        sourceVersion,
        sourceUpdatedAt: updatedAt
      });
    }
  }
}

async function writeLifecycleAudit({
  action,
  actorUserId,
  auditCollection,
  fromStatus,
  fromVersion,
  idempotencyKey,
  now,
  targetId,
  toStatus,
  toVersion
}: {
  action: "delete" | "restore";
  actorUserId: string;
  auditCollection: AuditCollection;
  fromStatus: "deleted" | "published";
  fromVersion: number;
  idempotencyKey: string;
  now: string;
  targetId: string;
  toStatus: "deleted" | "published";
  toVersion: number;
}) {
  const eventId = `parent-need-${targetId}-${action}-v${toVersion}`;

  await auditCollection.doc(eventId).set({
    id: eventId,
    action,
    actorUserId,
    occurredAt: now,
    requestId: idempotencyKey,
    result: "success",
    targetId,
    targetType: "parent-need",
    from: { status: fromStatus, version: fromVersion },
    to: { status: toStatus, version: toVersion }
  });
}

async function writeUpdateAudit({
  actorUserId,
  auditCollection,
  fromVersion,
  now,
  targetId,
  toVersion
}: {
  actorUserId: string;
  auditCollection: AuditCollection;
  fromVersion: number;
  now: string;
  targetId: string;
  toVersion: number;
}) {
  const eventId = `parent-need-${targetId}-update-v${toVersion}`;

  await auditCollection.doc(eventId).set({
    id: eventId,
    action: "update",
    actorUserId,
    occurredAt: now,
    requestId: eventId,
    result: "success",
    targetId,
    targetType: "parent-need",
    from: { status: "published", version: fromVersion },
    to: { status: "published", version: toVersion }
  });
}

async function writeCreateAudit({
  actorUserId,
  auditCollection,
  now,
  targetId
}: {
  actorUserId: string;
  auditCollection: AuditCollection;
  now: string;
  targetId: string;
}) {
  const eventId = `parent-need-${targetId}-create-v1`;

  await auditCollection.doc(eventId).set({
    id: eventId,
    action: "create",
    actorUserId,
    occurredAt: now,
    requestId: eventId,
    result: "success",
    targetId,
    targetType: "parent-need",
    from: null,
    to: { status: "published", version: 1 }
  });
}

async function mutateParentNeedLifecycle({
  action,
  authenticatedUserId,
  expectedVersion,
  id,
  idempotencyKey,
  now,
  runTransaction
}: {
  action: "delete" | "restore";
  authenticatedUserId: string;
  expectedVersion: number;
  id: string;
  idempotencyKey: string;
  now: string;
  runTransaction: ParentNeedLifecycleTransactionRunner;
}): Promise<Success<ServerParentNeed> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createFailure("必须登录后才能管理发布记录", 401, "AUTH_REQUIRED");
  }

  if (!isValidIdempotencyKey(idempotencyKey)) {
    return createFailure("缺少有效的幂等键", 400, "INVALID_IDEMPOTENCY_KEY");
  }

  return runTransaction(async (transaction) => {
    const result = await transaction.sourceCollection.doc(id).get();
    const raw = {
      ...readSingleDocument<ParentNeedDocument>(result),
      id
    };
    const existing = normalizeParentNeed(raw);

    if (!existing || existing.ownerUserId !== currentUserId) {
      return createFailure(PARENT_NEED_NOT_FOUND_MESSAGE, 404, "NOT_FOUND");
    }

    if (existing.managementState === "legacy-readonly") {
      return createFailure(
        "该旧记录暂不可管理，请重新发布以启用管理能力",
        409,
        "LEGACY_READ_ONLY"
      );
    }

    const mutationHistory = readMutationHistory(raw);
    const replayedResult = replayMutationResult(
      existing,
      mutationHistory,
      action,
      idempotencyKey
    );

    if (replayedResult) {
      return { ok: true, value: replayedResult, errors: {} };
    }

    if (
      raw.lastMutationAction === action &&
      raw.lastMutationKey === idempotencyKey
    ) {
      return { ok: true, value: existing, errors: {} };
    }

    if (existing.version !== expectedVersion) {
      return createFailure("记录已更新，请刷新后重试", 409, "VERSION_CONFLICT");
    }

    if (action === "delete" && existing.status !== "published") {
      return createFailure(PARENT_NEED_NOT_FOUND_MESSAGE, 404, "NOT_FOUND");
    }

    if (action === "restore") {
      if (existing.status !== "deleted" || !existing.deletedAt) {
        return createFailure(PARENT_NEED_NOT_FOUND_MESSAGE, 404, "NOT_FOUND");
      }

      if (new Date(now).getTime() >= new Date(recoveryDeadline(existing.deletedAt)).getTime()) {
        return createFailure("48 小时恢复期限已过", 409, "RECOVERY_EXPIRED");
      }
    }

    const nextStatus = action === "delete" ? "deleted" : "published";
    const nextVersion = existing.version + 1;
    const next: ServerParentNeed = {
      ...existing,
      status: nextStatus,
      updatedAt: now,
      version: nextVersion,
      deletedAt: action === "delete" ? now : null,
      deletedByUserId: action === "delete" ? currentUserId : null
    };
    const document = toParentNeedDocument(next);

    await transaction.sourceCollection.doc(id).set({
      ...document,
      lastMutationAction: action,
      lastMutationKey: idempotencyKey,
      mutationHistory: [
        ...mutationHistory,
        {
          action,
          deletedAt: next.deletedAt,
          deletedByUserId: next.deletedByUserId,
          idempotencyKey,
          status: next.status,
          updatedAt: next.updatedAt,
          version: next.version
        }
      ].slice(-MUTATION_HISTORY_LIMIT)
    });
    await updateRelatedSourceState({
      contactExchangeRequestsCollection:
        transaction.contactExchangeRequestsCollection,
      conversationsCollection: transaction.conversationsCollection,
      sourceId: id,
      sourceStatus: nextStatus,
      sourceVersion: nextVersion,
      updatedAt: now
    });
    await writeLifecycleAudit({
      action,
      actorUserId: currentUserId,
      auditCollection: transaction.auditCollection,
      fromStatus: existing.status,
      fromVersion: existing.version,
      idempotencyKey,
      now,
      targetId: id,
      toStatus: nextStatus,
      toVersion: nextVersion
    });

    return { ok: true, value: next, errors: {} };
  });
}

export function deleteServerParentNeed(
  input: Omit<Parameters<typeof mutateParentNeedLifecycle>[0], "action" | "now"> & {
    now?: string;
  }
) {
  return mutateParentNeedLifecycle({
    ...input,
    action: "delete",
    now: input.now ?? new Date().toISOString()
  });
}

export function restoreServerParentNeed(
  input: Omit<Parameters<typeof mutateParentNeedLifecycle>[0], "action" | "now"> & {
    now?: string;
  }
) {
  return mutateParentNeedLifecycle({
    ...input,
    action: "restore",
    now: input.now ?? new Date().toISOString()
  });
}

const RECENT_PUBLIC_QUERY_LIMIT = 100;
const RECENT_PUBLIC_QUERY_MAX_PAGES = 10;

function toPublicRegionLabel(region: ServerParentNeed["region"]) {
  const city = region.city.trim();
  const district = region.district.trim();
  const label = city && district ? `${city} · ${district}` : city;
  return Array.from(label || "区域信息暂未公开").slice(0, 24).join("");
}

function toPublicParentNeed(need: ServerParentNeed): PublicServerParentNeed {
  return {
    id: need.id,
    teacherGenderPreference: need.teacherGenderPreference,
    subjects: need.subjects,
    grade: need.grade,
    budgetMin: need.budgetMin,
    budgetMax: need.budgetMax,
    timeSlots: need.timeSlots,
    regionLabel: toPublicRegionLabel(need.region),
    childIntroSummary: "孩子情况暂未公开",
    publicSafetyNote: "联系方式未公开，先通过站内沟通",
    status: "published",
    createdAt: need.createdAt
  };
}

async function listRecentPublishedParentNeeds(collection: ParentNeedCollection) {
  const documents: unknown[] = [];

  for (let page = 0; page < RECENT_PUBLIC_QUERY_MAX_PAGES; page += 1) {
    let query = collection.where({ status: "published" });

    query = query.orderBy?.("createdAt", "desc") ?? query;
    query = query.skip?.(page * RECENT_PUBLIC_QUERY_LIMIT) ?? query;
    query = query.limit?.(RECENT_PUBLIC_QUERY_LIMIT) ?? query;

    const result = await query.get();
    const pageDocuments = result.data ?? [];
    documents.push(...pageDocuments);

    if (
      pageDocuments.length < RECENT_PUBLIC_QUERY_LIMIT ||
      !query.skip ||
      !query.limit
    ) {
      break;
    }
  }

  return documents
    .map((document) => normalizeParentNeed(document as ParentNeedDocument))
    .filter((need): need is ServerParentNeed => Boolean(need))
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
}

function parseOptionalNumber(value?: string) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function rangesOverlap(
  itemMin: number,
  itemMax: number,
  filterMin: number | null,
  filterMax: number | null
) {
  return (filterMin === null || itemMax >= filterMin) &&
    (filterMax === null || itemMin <= filterMax);
}

export function filterServerParentNeeds<T extends Pick<
  ParentNeed,
  "budgetMax" | "budgetMin" | "grade" | "subjects" | "teacherGenderPreference"
>>(needs: T[], filters: ServerParentNeedFilters) {
  const subject = filters.subject?.trim();
  const grade = filters.grade?.trim();
  const teacherGenderPreference = filters.teacherGenderPreference?.trim();
  const budgetMin = parseOptionalNumber(filters.budgetMin);
  const budgetMax = parseOptionalNumber(filters.budgetMax);

  return needs.filter((need) => {
    const matchesSubject = !subject || need.subjects.includes(subject);
    const matchesGrade = !grade || need.grade === grade;
    const matchesGender =
      !teacherGenderPreference ||
      teacherGenderPreference === "不限" ||
      need.teacherGenderPreference === teacherGenderPreference ||
      need.teacherGenderPreference === "不限";
    const matchesBudget = rangesOverlap(
      need.budgetMin,
      need.budgetMax,
      budgetMin,
      budgetMax
    );

    return matchesSubject && matchesGrade && matchesGender && matchesBudget;
  });
}

export async function saveServerParentNeed({
  authenticatedUserId,
  collection,
  input,
  now = new Date().toISOString(),
  runTransaction
}: {
  authenticatedUserId: string;
  collection: ParentNeedCollection;
  input: ParentNeedInput;
  now?: string;
  runTransaction?: ParentNeedLifecycleTransactionRunner;
}): Promise<Success<ServerParentNeed> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createFailure("必须登录后才能发布家长需求", 401, "AUTH_REQUIRED");
  }

  if (!collection || !runTransaction) {
    return createFailure("内容管理事务暂不可用", 503, "TRANSACTION_UNAVAILABLE");
  }

  const validation = validateParentNeedInput(input);

  if (!validation.ok) {
    return validation;
  }

  const parentNeed: ServerParentNeed = {
    ...validation.value,
    id: createOpaqueId("parent-need"),
    ownerUserId: currentUserId,
    status: "published",
    createdAt: now,
    updatedAt: now,
    version: 1,
    managementState: "managed",
    deletedAt: null,
    deletedByUserId: null
  };

  const document = toParentNeedDocument(parentNeed);

  await runTransaction(async (transaction) => {
    await transaction.sourceCollection.doc(parentNeed.id).set(document);
    await writeCreateAudit({
      actorUserId: currentUserId,
      auditCollection: transaction.auditCollection,
      now,
      targetId: parentNeed.id
    });
  });

  return {
    ok: true,
    value: parentNeed,
    errors: {}
  };
}

export async function updateServerParentNeed({
  authenticatedUserId,
  expectedVersion,
  id,
  input,
  now = new Date().toISOString(),
  runTransaction
}: {
  authenticatedUserId: string;
  collection?: ParentNeedCollection;
  expectedVersion?: number;
  id: string;
  input: ParentNeedInput;
  now?: string;
  runTransaction?: ParentNeedLifecycleTransactionRunner;
}): Promise<Success<ServerParentNeed> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createFailure("必须登录后才能管理发布记录", 401, "AUTH_REQUIRED");
  }

  if (!runTransaction) {
    return createFailure("内容管理事务暂不可用", 503, "TRANSACTION_UNAVAILABLE");
  }

  return runTransaction(async (transaction) => {
    const existingResult = await transaction.sourceCollection.doc(id).get();
    const existingDocument = {
      ...readSingleDocument<ParentNeedDocument>(existingResult),
      id
    };
    const existing = normalizeParentNeed(existingDocument);

    if (
      !existing ||
      existing.ownerUserId !== currentUserId ||
      existing.status !== "published"
    ) {
      return createFailure(PARENT_NEED_NOT_FOUND_MESSAGE, 404, "NOT_FOUND");
    }

    if (existing.managementState === "legacy-readonly") {
      return createFailure(
        "该旧记录暂不可管理，请重新发布以启用管理能力",
        409,
        "LEGACY_READ_ONLY"
      );
    }

    if (existing.version !== expectedVersion) {
      return createFailure("记录已更新，请刷新后重试", 409, "VERSION_CONFLICT");
    }

    const validation = validateParentNeedInput(input);

    if (!validation.ok) {
      return { ...validation, status: 400, code: "VALIDATION_FAILED" };
    }

    const parentNeed: ServerParentNeed = {
      ...validation.value,
      id: existing.id,
      ownerUserId: existing.ownerUserId,
      status: "published",
      createdAt: existing.createdAt,
      updatedAt: now,
      version: existing.version + 1,
      managementState: "managed",
      deletedAt: null,
      deletedByUserId: null
    };
    const document = toParentNeedDocument(parentNeed);
    const mutationHistory = readMutationHistory(existingDocument)
      .slice(-MUTATION_HISTORY_LIMIT);

    await transaction.sourceCollection.doc(existing.id).set({
      ...document,
      ...(existingDocument.lastMutationAction
        ? { lastMutationAction: existingDocument.lastMutationAction }
        : {}),
      ...(existingDocument.lastMutationKey
        ? { lastMutationKey: existingDocument.lastMutationKey }
        : {}),
      ...(Array.isArray(existingDocument.mutationHistory)
        ? { mutationHistory }
        : {})
    });
    await updateRelatedSourceState({
      contactExchangeRequestsCollection:
        transaction.contactExchangeRequestsCollection,
      conversationsCollection: transaction.conversationsCollection,
      sourceId: existing.id,
      sourceStatus: "published",
      sourceVersion: parentNeed.version,
      updatedAt: now
    });
    await writeUpdateAudit({
      actorUserId: currentUserId,
      auditCollection: transaction.auditCollection,
      fromVersion: existing.version,
      now,
      targetId: existing.id,
      toVersion: parentNeed.version
    });

    return { ok: true, value: parentNeed, errors: {} };
  });
}

export async function readServerParentNeedForOwner({
  authenticatedUserId,
  collection,
  id
}: {
  authenticatedUserId: string;
  collection: ParentNeedCollection;
  id: string;
}): Promise<Success<ServerParentNeed> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createFailure("必须登录后才能管理发布记录", 401, "AUTH_REQUIRED");
  }

  const result = await collection.doc(id).get();
  const record = normalizeParentNeed({
    ...readSingleDocument<ParentNeedDocument>(result),
    id
  });

  if (!record || record.ownerUserId !== currentUserId) {
    return createFailure(PARENT_NEED_NOT_FOUND_MESSAGE, 404, "NOT_FOUND");
  }

  return { ok: true, value: record, errors: {} };
}

export async function listServerParentNeedsForOwner({
  authenticatedUserId,
  collection
}: {
  authenticatedUserId: string;
  collection: ParentNeedCollection;
}): Promise<Success<ServerParentNeed[]> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createFailure("必须登录后才能查看我的家长需求", 401, "AUTH_REQUIRED");
  }

  const result = await collection.where({ ownerUserId: currentUserId }).get();
  const needs = (result.data ?? [])
    .map((document) => normalizeParentNeed(document as ParentNeedDocument))
    .filter((need): need is ServerParentNeed => Boolean(need));

  return {
    ok: true,
    value: needs,
    errors: {}
  };
}

export async function listPublicServerParentNeeds({
  collection,
  filters = {}
}: {
  collection: ParentNeedCollection;
  filters?: ServerParentNeedFilters;
}): Promise<Success<PublicServerParentNeed[]> | Failure> {
  const needs = await listRecentPublishedParentNeeds(collection);

  return {
    ok: true,
    value: filterServerParentNeeds(needs.map(toPublicParentNeed), filters),
    errors: {}
  };
}

export async function findPublicServerParentNeedById({
  collection,
  id
}: {
  collection: ParentNeedCollection;
  id: string;
}): Promise<Success<PublicServerParentNeed | null> | Failure> {
  const result = await collection.doc(id).get();
  const need = normalizeParentNeed({
    ...readSingleDocument<ParentNeedDocument>(result),
    id
  });

  return {
    ok: true,
    value: need?.status === "published" ? toPublicParentNeed(need) : null,
    errors: {}
  };
}
