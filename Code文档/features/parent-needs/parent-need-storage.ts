import type { KeyValueStorage } from "@/lib/storage";

import {
  type ParentNeed,
  type ParentNeedInput,
  validateParentNeedInput
} from "./parent-need";

export type SavedParentNeed = ParentNeed & {
  id: string;
  ownerPhone: string;
  status: "published";
  createdAt: string;
};

type ParentNeedStorageInput = {
  ownerPhone: string;
  storage: KeyValueStorage;
};

type ParentNeedStorageFailure = Extract<
  ReturnType<typeof validateParentNeedInput>,
  { ok: false }
>;

type ParentNeedStorageResult =
  | {
      ok: true;
      value: SavedParentNeed;
      errors: Record<string, never>;
    }
  | ParentNeedStorageFailure;

const PARENT_NEEDS_KEY = "ungradu.parentNeeds";
const PARENT_NEED_OWNERS_KEY = "ungradu.parentNeedOwners";

function getParentNeedsKey(ownerPhone: string) {
  return `${PARENT_NEEDS_KEY}.${ownerPhone.trim()}`;
}

function createParentNeedId(ownerPhone: string, count: number) {
  return `${ownerPhone.trim()}-${Date.now()}-${count + 1}`;
}

function readOwnerPhones(storage: KeyValueStorage) {
  const rawOwners = storage.getItem(PARENT_NEED_OWNERS_KEY);

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
    PARENT_NEED_OWNERS_KEY,
    JSON.stringify([...owners, normalizedOwnerPhone])
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

export function saveParentNeed({
  input,
  ownerPhone,
  storage
}: ParentNeedStorageInput & {
  input: ParentNeedInput;
}): ParentNeedStorageResult {
  const result = validateParentNeedInput(input);

  if (!result.ok) {
    return result;
  }

  const currentNeeds = readParentNeeds({ ownerPhone, storage });
  const savedNeed: SavedParentNeed = {
    ...result.value,
    id: createParentNeedId(ownerPhone, currentNeeds.length),
    ownerPhone: ownerPhone.trim(),
    status: "published",
    createdAt: new Date().toISOString()
  };

  storage.setItem(
    getParentNeedsKey(ownerPhone),
    JSON.stringify([savedNeed, ...currentNeeds])
  );
  saveOwnerPhone(ownerPhone, storage);

  return {
    ok: true,
    value: savedNeed,
    errors: {}
  };
}

export function readParentNeeds({
  ownerPhone,
  storage
}: ParentNeedStorageInput): SavedParentNeed[] {
  const rawNeeds = storage.getItem(getParentNeedsKey(ownerPhone));

  if (!rawNeeds) {
    return [];
  }

  try {
    const needs = JSON.parse(rawNeeds) as SavedParentNeed[];

    return needs.filter((need) => {
      const validation = validateParentNeedInput({
        teacherGenderPreference: need.teacherGenderPreference,
        subjects: need.subjects,
        grade: need.grade,
        budgetMin: String(need.budgetMin),
        budgetMax: String(need.budgetMax),
        timeSlots: need.timeSlots,
        region: need.region,
        community: need.community,
        childIntro: need.childIntro
      });

      return validation.ok && need.ownerPhone === ownerPhone.trim();
    });
  } catch {
    return [];
  }
}

export type ParentNeedFilters = {
  subject?: string;
  grade?: string;
  budgetMin?: string;
  budgetMax?: string;
  teacherGenderPreference?: string;
};

export function readAllParentNeeds({
  storage
}: {
  storage: KeyValueStorage;
}): SavedParentNeed[] {
  return readOwnerPhones(storage).flatMap((ownerPhone) =>
    readParentNeeds({ ownerPhone, storage })
  );
}

export function filterParentNeeds(
  needs: SavedParentNeed[],
  filters: ParentNeedFilters
) {
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

export function findParentNeedById({
  id,
  storage
}: {
  id: string;
  storage: KeyValueStorage;
}) {
  return readAllParentNeeds({ storage }).find((need) => need.id === id) ?? null;
}
