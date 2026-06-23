import {
  type TutorProfile,
  type TutorProfileInput,
  validateTutorProfileInput
} from "@/features/tutor-profiles/tutor-profile";

export const TUTOR_PROFILES_COLLECTION = "tutor_profiles";

export type ServerTutorProfile = TutorProfile & {
  id: string;
  ownerUserId: string;
  status: "published";
  createdAt: string;
};

export type PublicServerTutorProfile = Omit<ServerTutorProfile, "ownerUserId">;

export type ServerTutorProfileFilters = {
  subject?: string;
  grade?: string;
  feeMin?: string;
  feeMax?: string;
  gender?: string;
};

type TutorProfileDocument = Partial<ServerTutorProfile>;

type TutorProfileCollection = {
  doc: (docId: string) => {
    get: () => Promise<{ data?: unknown[] }>;
    set: (data: ServerTutorProfile) => Promise<unknown>;
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

function normalizeTutorProfile(
  document: TutorProfileDocument
): ServerTutorProfile | null {
  if (
    !document.id ||
    !document.ownerUserId ||
    document.status !== "published" ||
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
    status: "published",
    createdAt: document.createdAt
  };
}

const RECENT_PUBLIC_QUERY_LIMIT = 100;
const RECENT_PUBLIC_QUERY_MAX_PAGES = 10;

function toPublicTutorProfile(profile: ServerTutorProfile): PublicServerTutorProfile {
  return {
    id: profile.id,
    gender: profile.gender,
    school: profile.school,
    major: profile.major,
    subjects: profile.subjects,
    grades: profile.grades,
    timeSlots: profile.timeSlots,
    feeRanges: profile.feeRanges,
    abilityDescription: profile.abilityDescription,
    proofImages: profile.proofImages,
    status: profile.status,
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
  now = new Date().toISOString()
}: {
  authenticatedUserId: string;
  collection: TutorProfileCollection;
  input: TutorProfileInput;
  now?: string;
}): Promise<Success<ServerTutorProfile> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createFailure("必须登录后才能发布家教信息");
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
    createdAt: now
  };

  await collection.doc(profile.id).set(profile);

  return {
    ok: true,
    value: profile,
    errors: {}
  };
}

export async function updateServerTutorProfile({
  authenticatedUserId,
  collection,
  id,
  input
}: {
  authenticatedUserId: string;
  collection: TutorProfileCollection;
  id: string;
  input: TutorProfileInput;
}): Promise<Success<ServerTutorProfile> | Failure> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createFailure("Login is required to update tutor profiles.");
  }

  const existingResult = await collection.doc(id).get();
  const existing = normalizeTutorProfile({
    ...(existingResult.data?.[0] as TutorProfileDocument | undefined),
    id
  });

  if (!existing || existing.ownerUserId !== currentUserId) {
    return createFailure("Only the owner can update this tutor profile.");
  }

  const validation = validateTutorProfileInput(input);

  if (!validation.ok) {
    return validation;
  }

  const profile: ServerTutorProfile = {
    ...validation.value,
    id: existing.id,
    ownerUserId: existing.ownerUserId,
    status: existing.status,
    createdAt: existing.createdAt
  };

  await collection.doc(existing.id).set(profile);

  return {
    ok: true,
    value: profile,
    errors: {}
  };
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
    return createFailure("必须登录后才能查看我的家教信息");
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
    ...(result.data?.[0] as TutorProfileDocument | undefined),
    id
  });

  return {
    ok: true,
    value: profile ? toPublicTutorProfile(profile) : null,
    errors: {}
  };
}
