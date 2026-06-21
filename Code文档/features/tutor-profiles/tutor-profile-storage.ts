import type { KeyValueStorage } from "@/lib/storage";

import {
  type TutorProfile,
  type TutorProfileInput,
  validateTutorProfileInput
} from "./tutor-profile";

export type SavedTutorProfile = TutorProfile & {
  id: string;
  ownerPhone: string;
  status: "published";
  createdAt: string;
};

type TutorProfileStorageInput = {
  ownerPhone: string;
  storage: KeyValueStorage;
};

type TutorProfileStorageFailure = Extract<
  ReturnType<typeof validateTutorProfileInput>,
  { ok: false }
>;

type TutorProfileStorageResult =
  | {
      ok: true;
      value: SavedTutorProfile;
      errors: Record<string, never>;
    }
  | TutorProfileStorageFailure;

const TUTOR_PROFILES_KEY = "ungradu.tutorProfiles";
const TUTOR_PROFILE_OWNERS_KEY = "ungradu.tutorProfileOwners";

function getTutorProfilesKey(ownerPhone: string) {
  return `${TUTOR_PROFILES_KEY}.${ownerPhone.trim()}`;
}

function createOpaqueId(prefix: string) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function createTutorProfileId() {
  return createOpaqueId("tutor-profile");
}

function readOwnerPhones(storage: KeyValueStorage) {
  const rawOwners = storage.getItem(TUTOR_PROFILE_OWNERS_KEY);

  if (!rawOwners) {
    return [];
  }

  try {
    const owners = JSON.parse(rawOwners) as string[];
    return owners.map((owner) => owner.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function saveOwnerPhone(ownerPhone: string, storage: KeyValueStorage) {
  const normalizedOwnerPhone = ownerPhone.trim();
  const owners = readOwnerPhones(storage);

  if (owners.includes(normalizedOwnerPhone)) {
    return;
  }

  storage.setItem(
    TUTOR_PROFILE_OWNERS_KEY,
    JSON.stringify([...owners, normalizedOwnerPhone])
  );
}

function readLegacyOwnerPhonesFromKeys(storage: KeyValueStorage) {
  if (typeof storage.key !== "function" || typeof storage.length !== "number") {
    return [];
  }

  const ownerPhones = new Set<string>();
  const legacyKeyPrefix = `${TUTOR_PROFILES_KEY}.`;

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (!key?.startsWith(legacyKeyPrefix)) {
      continue;
    }

    const ownerPhone = key.slice(legacyKeyPrefix.length).trim();

    if (ownerPhone) {
      ownerPhones.add(ownerPhone);
    }
  }

  return Array.from(ownerPhones);
}

function readAllOwnerPhones(storage: KeyValueStorage) {
  const ownerPhones = new Set([
    ...readOwnerPhones(storage),
    ...readLegacyOwnerPhonesFromKeys(storage)
  ]);

  return Array.from(ownerPhones);
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

export function saveTutorProfile({
  input,
  ownerPhone,
  storage
}: TutorProfileStorageInput & {
  input: TutorProfileInput;
}): TutorProfileStorageResult {
  const result = validateTutorProfileInput(input);

  if (!result.ok) {
    return result;
  }

  const currentProfiles = readTutorProfiles({ ownerPhone, storage });
  const savedProfile: SavedTutorProfile = {
    ...result.value,
    id: createTutorProfileId(),
    ownerPhone: ownerPhone.trim(),
    status: "published",
    createdAt: new Date().toISOString()
  };

  storage.setItem(
    getTutorProfilesKey(ownerPhone),
    JSON.stringify([savedProfile, ...currentProfiles])
  );
  saveOwnerPhone(ownerPhone, storage);

  return {
    ok: true,
    value: savedProfile,
    errors: {}
  };
}

export function readTutorProfiles({
  ownerPhone,
  storage
}: TutorProfileStorageInput): SavedTutorProfile[] {
  const rawProfiles = storage.getItem(getTutorProfilesKey(ownerPhone));

  if (!rawProfiles) {
    return [];
  }

  try {
    const profiles = JSON.parse(rawProfiles) as SavedTutorProfile[];

    return profiles.filter((profile) => {
      const validation = validateTutorProfileInput({
        gender: profile.gender,
        school: profile.school,
        major: profile.major,
        subjects: profile.subjects,
        grades: profile.grades,
        timeSlots: profile.timeSlots,
        feeRanges: profile.feeRanges.map((range) => ({
          grade: range.grade,
          subject: range.subject,
          min: String(range.min),
          max: String(range.max)
        })),
        abilityDescription: profile.abilityDescription,
        proofImages: profile.proofImages
      });

      return validation.ok && profile.ownerPhone === ownerPhone.trim();
    });
  } catch {
    return [];
  }
}

export type TutorProfileFilters = {
  subject?: string;
  grade?: string;
  feeMin?: string;
  feeMax?: string;
  gender?: string;
};

export function readAllTutorProfiles({
  storage
}: {
  storage: KeyValueStorage;
}): SavedTutorProfile[] {
  const ownerPhones = readAllOwnerPhones(storage);

  ownerPhones.forEach((ownerPhone) => saveOwnerPhone(ownerPhone, storage));

  return ownerPhones.flatMap((ownerPhone) =>
    readTutorProfiles({ ownerPhone, storage })
  );
}

export function filterTutorProfiles(
  profiles: SavedTutorProfile[],
  filters: TutorProfileFilters
) {
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

export function findTutorProfileById({
  id,
  storage
}: {
  id: string;
  storage: KeyValueStorage;
}) {
  return readAllTutorProfiles({ storage }).find((profile) => profile.id === id) ?? null;
}
