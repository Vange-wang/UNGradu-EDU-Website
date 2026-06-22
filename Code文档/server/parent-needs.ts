import {
  type ParentNeed,
  type ParentNeedInput,
  validateParentNeedInput
} from "@/features/parent-needs/parent-need";

export const PARENT_NEEDS_COLLECTION = "parent_needs";

export type ServerParentNeed = ParentNeed & {
  id: string;
  ownerUserId: string;
  status: "published";
  createdAt: string;
};

export type PublicServerParentNeed = Omit<ServerParentNeed, "ownerUserId">;

export type ServerParentNeedFilters = {
  subject?: string;
  grade?: string;
  budgetMin?: string;
  budgetMax?: string;
  teacherGenderPreference?: string;
};

type ParentNeedDocument = Partial<ServerParentNeed>;

type ParentNeedCollection = {
  doc: (docId: string) => {
    get: () => Promise<{ data?: unknown[] }>;
    set: (data: ServerParentNeed) => Promise<unknown>;
  };
  where: (query: Record<string, unknown>) => {
    get: () => Promise<{ data?: unknown[] }>;
  };
};

type Failure = {
  ok: false;
  value: null;
  errors: Record<string, string>;
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

function createFailure(message: string): Failure {
  return {
    ok: false,
    value: null,
    errors: { request: message }
  };
}

function requireAuthenticatedUser(authenticatedUserId: string) {
  const currentUserId = normalizeUserId(authenticatedUserId);
  return currentUserId || null;
}

function normalizeParentNeed(document: ParentNeedDocument): ServerParentNeed | null {
  if (
    !document.id ||
    !document.ownerUserId ||
    document.status !== "published" ||
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
    status: "published",
    createdAt: document.createdAt
  };
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
    region: need.region,
    community: need.community,
    childIntro: need.childIntro,
    status: need.status,
    createdAt: need.createdAt
  };
}

async function listAllParentNeeds(collection: ParentNeedCollection) {
  const result = await collection.where({}).get();

  return (result.data ?? [])
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
  now = new Date().toISOString()
}: {
  authenticatedUserId: string;
  collection: ParentNeedCollection;
  input: ParentNeedInput;
  now?: string;
}): Promise<Success<ServerParentNeed> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createFailure("必须登录后才能发布家长需求");
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
    createdAt: now
  };

  await collection.doc(parentNeed.id).set(parentNeed);

  return {
    ok: true,
    value: parentNeed,
    errors: {}
  };
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
    return createFailure("必须登录后才能查看我的家长需求");
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
  const needs = await listAllParentNeeds(collection);

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
    ...(result.data?.[0] as ParentNeedDocument | undefined),
    id
  });

  return {
    ok: true,
    value: need ? toPublicParentNeed(need) : null,
    errors: {}
  };
}
