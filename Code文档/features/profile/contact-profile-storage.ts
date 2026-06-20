import type { KeyValueStorage } from "@/lib/storage";

import {
  type ContactProfileInput,
  type ContactProfileValidation,
  validateContactProfileInput
} from "./contact-profile";

const CONTACT_PROFILE_KEY = "ungradu.contactProfile";

export function saveContactProfile(
  input: ContactProfileInput,
  storage: KeyValueStorage
): ContactProfileValidation {
  const result = validateContactProfileInput(input);

  if (!result.ok) {
    return result;
  }

  storage.setItem(CONTACT_PROFILE_KEY, JSON.stringify(result.value));
  return result;
}

export function readContactProfile(
  storage: KeyValueStorage
): ContactProfileInput | null {
  const rawProfile = storage.getItem(CONTACT_PROFILE_KEY);

  if (!rawProfile) {
    return null;
  }

  try {
    const profile = JSON.parse(rawProfile) as ContactProfileInput;
    const result = validateContactProfileInput(profile);

    return result.ok ? result.value : null;
  } catch {
    return null;
  }
}
