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

type ParentNeedStorageResult =
  | {
      ok: true;
      value: SavedParentNeed;
      errors: Record<string, never>;
    }
  | ReturnType<typeof validateParentNeedInput>;

const PARENT_NEEDS_KEY = "ungradu.parentNeeds";

function getParentNeedsKey(ownerPhone: string) {
  return `${PARENT_NEEDS_KEY}.${ownerPhone.trim()}`;
}

function createParentNeedId(ownerPhone: string, count: number) {
  return `${ownerPhone.trim()}-${Date.now()}-${count + 1}`;
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
