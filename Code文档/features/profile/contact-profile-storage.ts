import type { KeyValueStorage } from "@/lib/storage";

import {
  type ContactProfileInput,
  type ContactProfileValidation,
  validateContactProfileInput
} from "./contact-profile";

const CONTACT_PROFILE_KEY = "ungradu.contactProfile";

type ContactProfileStorageInput = {
  ownerPhone: string;
  storage: KeyValueStorage;
};

function getContactProfileKey(ownerPhone: string) {
  return `${CONTACT_PROFILE_KEY}.${ownerPhone.trim()}`;
}

export function saveContactProfile(
  {
    input,
    ownerPhone,
    storage
  }: ContactProfileStorageInput & { input: ContactProfileInput }
): ContactProfileValidation {
  const result = validateContactProfileInput(input);

  if (!result.ok) {
    return result;
  }

  storage.setItem(getContactProfileKey(ownerPhone), JSON.stringify(result.value));
  return result;
}

export function readContactProfile(
  { ownerPhone, storage }: ContactProfileStorageInput
): ContactProfileInput | null {
  const rawProfile = storage.getItem(getContactProfileKey(ownerPhone));

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
