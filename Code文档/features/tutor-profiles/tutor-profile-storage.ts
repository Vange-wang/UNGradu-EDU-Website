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

type TutorProfileStorageResult =
  | {
      ok: true;
      value: SavedTutorProfile;
      errors: Record<string, never>;
    }
  | ReturnType<typeof validateTutorProfileInput>;

const TUTOR_PROFILES_KEY = "ungradu.tutorProfiles";

function getTutorProfilesKey(ownerPhone: string) {
  return `${TUTOR_PROFILES_KEY}.${ownerPhone.trim()}`;
}

function createTutorProfileId(ownerPhone: string, count: number) {
  return `${ownerPhone.trim()}-${Date.now()}-${count + 1}`;
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
    id: createTutorProfileId(ownerPhone, currentProfiles.length),
    ownerPhone: ownerPhone.trim(),
    status: "published",
    createdAt: new Date().toISOString()
  };

  storage.setItem(
    getTutorProfilesKey(ownerPhone),
    JSON.stringify([savedProfile, ...currentProfiles])
  );

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
