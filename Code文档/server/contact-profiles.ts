import {
  type ContactProfileInput,
  validateContactProfileInput
} from "@/features/profile/contact-profile";

export const CONTACT_PROFILES_COLLECTION = "contact_profiles";

type ContactProfileDocument = ContactProfileInput & {
  ownerUserId: string;
  updatedAt: string;
};

type ContactProfileCollection = {
  doc: (docId: string) => {
    get: () => Promise<{ data?: unknown[] }>;
    set: (data: ContactProfileDocument) => Promise<unknown>;
  };
};

type ServerContactProfileFailure = {
  ok: false;
  value: null;
  errors: {
    request?: string;
    phone?: string;
  };
};

type ServerContactProfileSuccess = {
  ok: true;
  value: ContactProfileInput;
  errors: Record<string, never>;
};

type ServerContactProfileResult =
  | ServerContactProfileSuccess
  | ServerContactProfileFailure;

function normalizeAuthenticatedUserId(authenticatedUserId: string) {
  return authenticatedUserId.trim();
}

function requireAuthenticatedUser(authenticatedUserId: string) {
  const currentUserId = normalizeAuthenticatedUserId(authenticatedUserId);

  if (!currentUserId) {
    return null;
  }

  return currentUserId;
}

function createAuthFailure(): ServerContactProfileFailure {
  return {
    ok: false,
    value: null,
    errors: { request: "必须登录后才能访问联系方式存档" }
  };
}

export async function saveServerContactProfile({
  authenticatedUserId,
  collection,
  input
}: {
  authenticatedUserId: string;
  collection: ContactProfileCollection;
  input: ContactProfileInput;
}): Promise<ServerContactProfileResult> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createAuthFailure();
  }

  const validation = validateContactProfileInput(input);

  if (!validation.ok) {
    return validation;
  }

  await collection.doc(currentUserId).set({
    ownerUserId: currentUserId,
    phone: validation.value.phone,
    wechat: validation.value.wechat,
    updatedAt: new Date().toISOString()
  });

  return {
    ok: true,
    value: validation.value,
    errors: {}
  };
}

export async function readServerContactProfile({
  authenticatedUserId,
  collection
}: {
  authenticatedUserId: string;
  collection: ContactProfileCollection;
}): Promise<ServerContactProfileResult> {
  const currentUserId = requireAuthenticatedUser(authenticatedUserId);

  if (!currentUserId) {
    return createAuthFailure();
  }

  const result = await collection.doc(currentUserId).get();
  const profile = result.data?.[0] as Partial<ContactProfileDocument> | undefined;

  if (!profile || profile.ownerUserId !== currentUserId) {
    return {
      ok: true,
      value: { phone: "", wechat: "" },
      errors: {}
    };
  }

  const validation = validateContactProfileInput({
    phone: String(profile.phone ?? ""),
    wechat: String(profile.wechat ?? "")
  });

  if (!validation.ok) {
    return {
      ok: true,
      value: { phone: "", wechat: "" },
      errors: {}
    };
  }

  return {
    ok: true,
    value: validation.value,
    errors: {}
  };
}
