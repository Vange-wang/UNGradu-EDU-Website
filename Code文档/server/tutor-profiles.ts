import {
  type TutorProfile,
  type TutorProfileInput,
  validateTutorProfileInput
} from "@/features/tutor-profiles/tutor-profile";
export const TUTOR_PROFILES_COLLECTION = "tutor_profiles";

export type ServerTutorProfile = TutorProfile & {
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

export type PublicServerTutorProfile = Pick<
  ServerTutorProfile,
  | "createdAt"
  | "feeRanges"
  | "gender"
  | "grades"
  | "id"
  | "status"
  | "subjects"
  | "timeSlots"
> & {
  abilityDescriptionSummary: string;
  majorSummary: string;
  publicSafetyNote: string;
  schoolSummary: string;
  status: "published";
};

export type ServerTutorProfileFilters = {
  subject?: string;
  grade?: string;
  feeMin?: string;
  feeMax?: string;
  gender?: string;
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

type TutorProfileDocument = Partial<Omit<ServerTutorProfile, "managementState">> & {
  lastMutationAction?: "delete" | "restore";
  lastMutationKey?: string;
  mutationHistory?: LifecycleMutationHistoryEntry[];
};

type TutorProfileCollection = {
  doc: (docId: string) => {
    get: () => Promise<{ data?: Record<string, unknown> | unknown[] }>;
    set: (data: TutorProfileDocument) => Promise<unknown>;
  };
  where: (query: Record<string, unknown>) => TutorProfileQuery;
};

type TutorProfileQuery = {
  get: () => Promise<{ data?: unknown[] }>;
  limit?: (value: number) => TutorProfileQuery;
  orderBy?: (field: string, direction: "asc" | "desc") => TutorProfileQuery;
  skip?: (value: number) => TutorProfileQuery;
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

function normalizeTutorProfile(
  document: TutorProfileDocument
): ServerTutorProfile | null {
  if (
    !document.id ||
    !document.ownerUserId ||
    (document.status !== "published" && document.status !== "deleted") ||
    !document.createdAt ||
    !document.gender ||
    !document.school ||
    !document.major ||
    !Array.isArray(document.subjects) ||
    !Array.isArray(document.grades) ||
    !Array.isArray(document.timeSlots) ||
    !Array.isArray(document.feeRanges) ||
    !document.abilityDescription ||
    !Array.isArray(document.proofImages)
  ) {
    return null;
  }

  return {
    id: document.id,
    ownerUserId: document.ownerUserId,
    gender: document.gender,
    school: document.school,
    major: document.major,
    subjects: document.subjects,
    grades: document.grades,
    timeSlots: document.timeSlots,
    feeRanges: document.feeRanges,
    abilityDescription: document.abilityDescription,
    proofImages: document.proofImages,
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

function toTutorProfileDocument(record: ServerTutorProfile): TutorProfileDocument {
  const document: TutorProfileDocument & { managementState?: string } = { ...record };
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

export type TutorProfileLifecycleTransaction = {
  auditCollection: AuditCollection;
  contactExchangeRequestsCollection: RelatedDocumentCollection;
  conversationsCollection: RelatedDocumentCollection;
  sourceCollection: TutorProfileCollection;
};

export type TutorProfileLifecycleTransactionRunner = <T>(
  operation: (transaction: TutorProfileLifecycleTransaction) => Promise<T>
) => Promise<T>;

const RECOVERY_WINDOW_MS = 48 * 60 * 60 * 1000;
const MUTATION_HISTORY_LIMIT = 16;
export const TUTOR_PROFILE_NOT_FOUND_MESSAGE = "未找到该发布记录";

function isValidIdempotencyKey(value: string) {
  return /^[A-Za-z0-9._:-]{8,128}$/.test(value);
}

function readMutationHistory(document: TutorProfileDocument) {
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
  existing: ServerTutorProfile,
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
  TutorProfileLifecycleTransaction,
  "contactExchangeRequestsCollection" | "conversationsCollection"
> & {
  sourceId: string;
  sourceStatus: "deleted" | "published";
  sourceVersion: number;
  updatedAt: string;
}) {
  const indexedRows = (
    await conversationsCollection.where({ sourceKey: `tutor-profile:${sourceId}` }).get()
  ).data ?? [];
  const legacyRows = (
    await conversationsCollection.where({ sourceId }).get()
  ).data ?? [];
  const conversationRows = Array.from(
    new Map(
      [...indexedRows, ...legacyRows]
        .map((row) => row as Record<string, unknown>)
        .filter((row) => row.sourceType === "tutor-profile")
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
  const eventId = `tutor-profile-${targetId}-${action}-v${toVersion}`;

  await auditCollection.doc(eventId).set({
    id: eventId,
    action,
    actorUserId,
    occurredAt: now,
    requestId: idempotencyKey,
    result: "success",
    targetId,
    targetType: "tutor-profile",
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
  const eventId = `tutor-profile-${targetId}-update-v${toVersion}`;

  await auditCollection.doc(eventId).set({
    id: eventId,
    action: "update",
    actorUserId,
    occurredAt: now,
    requestId: eventId,
    result: "success",
    targetId,
    targetType: "tutor-profile",
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
  const eventId = `tutor-profile-${targetId}-create-v1`;

  await auditCollection.doc(eventId).set({
    id: eventId,
    action: "create",
    actorUserId,
    occurredAt: now,
    requestId: eventId,
    result: "success",
    targetId,
    targetType: "tutor-profile",
    from: null,
    to: { status: "published", version: 1 }
  });
}

async function mutateTutorProfileLifecycle({
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
  runTransaction: TutorProfileLifecycleTransactionRunner;
}): Promise<Success<ServerTutorProfile> | Failure> {
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
      ...readSingleDocument<TutorProfileDocument>(result),
      id
    };
    const existing = normalizeTutorProfile(raw);

    if (!existing || existing.ownerUserId !== currentUserId) {
      return createFailure(TUTOR_PROFILE_NOT_FOUND_MESSAGE, 404, "NOT_FOUND");
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

    if (raw.lastMutationAction === action && raw.lastMutationKey === idempotencyKey) {
      return { ok: true, value: existing, errors: {} };
    }

    if (existing.version !== expectedVersion) {
      return createFailure("记录已更新，请刷新后重试", 409, "VERSION_CONFLICT");
    }

    if (action === "delete" && existing.status !== "published") {
      return createFailure(TUTOR_PROFILE_NOT_FOUND_MESSAGE, 404, "NOT_FOUND");
    }

    if (action === "restore") {
      if (existing.status !== "deleted" || !existing.deletedAt) {
        return createFailure(TUTOR_PROFILE_NOT_FOUND_MESSAGE, 404, "NOT_FOUND");
      }

      const deadline = new Date(existing.deletedAt).getTime() + RECOVERY_WINDOW_MS;

      if (new Date(now).getTime() >= deadline) {
        return createFailure("48 小时恢复期限已过", 409, "RECOVERY_EXPIRED");
      }
    }

    const nextStatus = action === "delete" ? "deleted" : "published";
    const nextVersion = existing.version + 1;
    const next: ServerTutorProfile = {
      ...existing,
      status: nextStatus,
      updatedAt: now,
      version: nextVersion,
      deletedAt: action === "delete" ? now : null,
      deletedByUserId: action === "delete" ? currentUserId : null
    };
    const document = toTutorProfileDocument(next);

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

export function deleteServerTutorProfile(
  input: Omit<Parameters<typeof mutateTutorProfileLifecycle>[0], "action" | "now"> & {
    now?: string;
  }
) {
  return mutateTutorProfileLifecycle({
    ...input,
    action: "delete",
    now: input.now ?? new Date().toISOString()
  });
}

export function restoreServerTutorProfile(
  input: Omit<Parameters<typeof mutateTutorProfileLifecycle>[0], "action" | "now"> & {
    now?: string;
  }
) {
  return mutateTutorProfileLifecycle({
    ...input,
    action: "restore",
    now: input.now ?? new Date().toISOString()
  });
}

const RECENT_PUBLIC_QUERY_LIMIT = 100;
const RECENT_PUBLIC_QUERY_MAX_PAGES = 10;

function toPublicTutorProfile(profile: ServerTutorProfile): PublicServerTutorProfile {
  return {
    id: profile.id,
    gender: profile.gender,
    subjects: profile.subjects,
    grades: profile.grades,
    timeSlots: profile.timeSlots,
    feeRanges: profile.feeRanges,
    schoolSummary: "学校信息暂未公开",
    majorSummary: "专业信息暂未公开",
    abilityDescriptionSummary: "能力说明暂未公开",
    publicSafetyNote: "联系方式未公开，先通过站内沟通",
    status: "published",
    createdAt: profile.createdAt
  };
}

async function listRecentPublishedTutorProfiles(collection: TutorProfileCollection) {
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
    .map((document) => normalizeTutorProfile(document as TutorProfileDocument))
    .filter((profile): profile is ServerTutorProfile => Boolean(profile))
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

export function filterServerTutorProfiles<T extends Pick<
  TutorProfile,
  "feeRanges" | "gender" | "grades" | "subjects"
>>(profiles: T[], filters: ServerTutorProfileFilters) {
  const subject = filters.subject?.trim();
  const grade = filters.grade?.trim();
  const gender = filters.gender?.trim();
  const feeMin = parseOptionalNumber(filters.feeMin);
  const feeMax = parseOptionalNumber(filters.feeMax);

  return profiles.filter((profile) => {
    const matchesSubject = !subject || profile.subjects.includes(subject);
    const matchesGrade = !grade || profile.grades.includes(grade);
    const matchesGender = !gender || profile.gender === gender;
    const matchesFee = profile.feeRanges.some((range) => {
      const rangeMatchesSubject = !subject || range.subject === subject;
      const rangeMatchesGrade = !grade || range.grade === grade;

      return rangeMatchesSubject &&
        rangeMatchesGrade &&
        rangesOverlap(range.min, range.max, feeMin, feeMax);
    });

    return matchesSubject && matchesGrade && matchesGender && matchesFee;
  });
}

export async function saveServerTutorProfile({
  authenticatedUserId,
  collection,
  input,
  now = new Date().toISOString(),
  runTransaction
}: {
  authenticatedUserId: string;
  collection: TutorProfileCollection;
  input: TutorProfileInput;
  now?: string;
  runTransaction?: TutorProfileLifecycleTransactionRunner;
}): Promise<Success<ServerTutorProfile> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createFailure("必须登录后才能发布家教信息", 401, "AUTH_REQUIRED");
  }

  if (!collection || !runTransaction) {
    return createFailure("内容管理事务暂不可用", 503, "TRANSACTION_UNAVAILABLE");
  }

  const validation = validateTutorProfileInput(input);

  if (!validation.ok) {
    return validation;
  }

  const profile: ServerTutorProfile = {
    ...validation.value,
    id: createOpaqueId("tutor-profile"),
    ownerUserId: currentUserId,
    status: "published",
    createdAt: now,
    updatedAt: now,
    version: 1,
    managementState: "managed",
    deletedAt: null,
    deletedByUserId: null
  };

  const document = toTutorProfileDocument(profile);

  await runTransaction(async (transaction) => {
    await transaction.sourceCollection.doc(profile.id).set(document);
    await writeCreateAudit({
      actorUserId: currentUserId,
      auditCollection: transaction.auditCollection,
      now,
      targetId: profile.id
    });
  });

  return {
    ok: true,
    value: profile,
    errors: {}
  };
}

export async function updateServerTutorProfile({
  authenticatedUserId,
  expectedVersion,
  id,
  input,
  now = new Date().toISOString(),
  runTransaction
}: {
  authenticatedUserId: string;
  collection?: TutorProfileCollection;
  expectedVersion?: number;
  id: string;
  input: TutorProfileInput;
  now?: string;
  runTransaction?: TutorProfileLifecycleTransactionRunner;
}): Promise<Success<ServerTutorProfile> | Failure> {
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
      ...readSingleDocument<TutorProfileDocument>(existingResult),
      id
    };
    const existing = normalizeTutorProfile(existingDocument);

    if (
      !existing ||
      existing.ownerUserId !== currentUserId ||
      existing.status !== "published"
    ) {
      return createFailure(TUTOR_PROFILE_NOT_FOUND_MESSAGE, 404, "NOT_FOUND");
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

    const validation = validateTutorProfileInput(input);

    if (!validation.ok) {
      return { ...validation, status: 400, code: "VALIDATION_FAILED" };
    }

    const profile: ServerTutorProfile = {
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
    const document = toTutorProfileDocument(profile);
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
      sourceVersion: profile.version,
      updatedAt: now
    });
    await writeUpdateAudit({
      actorUserId: currentUserId,
      auditCollection: transaction.auditCollection,
      fromVersion: existing.version,
      now,
      targetId: existing.id,
      toVersion: profile.version
    });

    return { ok: true, value: profile, errors: {} };
  });
}

export async function readServerTutorProfileForOwner({
  authenticatedUserId,
  collection,
  id
}: {
  authenticatedUserId: string;
  collection: TutorProfileCollection;
  id: string;
}): Promise<Success<ServerTutorProfile> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createFailure("必须登录后才能管理发布记录", 401, "AUTH_REQUIRED");
  }

  const result = await collection.doc(id).get();
  const record = normalizeTutorProfile({
    ...readSingleDocument<TutorProfileDocument>(result),
    id
  });

  if (!record || record.ownerUserId !== currentUserId) {
    return createFailure(TUTOR_PROFILE_NOT_FOUND_MESSAGE, 404, "NOT_FOUND");
  }

  return { ok: true, value: record, errors: {} };
}

export async function listServerTutorProfilesForOwner({
  authenticatedUserId,
  collection
}: {
  authenticatedUserId: string;
  collection: TutorProfileCollection;
}): Promise<Success<ServerTutorProfile[]> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createFailure("必须登录后才能查看我的家教信息", 401, "AUTH_REQUIRED");
  }

  const result = await collection.where({ ownerUserId: currentUserId }).get();
  const profiles = (result.data ?? [])
    .map((document) => normalizeTutorProfile(document as TutorProfileDocument))
    .filter((profile): profile is ServerTutorProfile => Boolean(profile));

  return {
    ok: true,
    value: profiles,
    errors: {}
  };
}

export async function listPublicServerTutorProfiles({
  collection,
  filters = {}
}: {
  collection: TutorProfileCollection;
  filters?: ServerTutorProfileFilters;
}): Promise<Success<PublicServerTutorProfile[]> | Failure> {
  const profiles = await listRecentPublishedTutorProfiles(collection);

  return {
    ok: true,
    value: filterServerTutorProfiles(profiles.map(toPublicTutorProfile), filters),
    errors: {}
  };
}

export async function findPublicServerTutorProfileById({
  collection,
  id
}: {
  collection: TutorProfileCollection;
  id: string;
}): Promise<Success<PublicServerTutorProfile | null> | Failure> {
  const result = await collection.doc(id).get();
  const profile = normalizeTutorProfile({
    ...readSingleDocument<TutorProfileDocument>(result),
    id
  });

  return {
    ok: true,
    value: profile?.status === "published" ? toPublicTutorProfile(profile) : null,
    errors: {}
  };
}
