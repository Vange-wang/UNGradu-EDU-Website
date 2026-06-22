import type { ContactProfileInput } from "@/features/profile/contact-profile";

type ContactProfileApiResult =
  | {
      ok: true;
      value: ContactProfileInput;
      errors: Record<string, never>;
    }
  | {
      ok: false;
      value: null;
      errors: {
        request?: string;
        phone?: string;
      };
    };

type ContactProfileApiClientInput = {
  currentUserPhone: string;
  fetcher?: typeof fetch;
};

function createTemporaryIdentityHeaders(currentUserPhone: string) {
  return {
    "content-type": "application/json",
    "x-ungradu-test-user-phone": currentUserPhone.trim()
  };
}

async function parseContactProfileResponse(response: Response) {
  return await response.json() as ContactProfileApiResult;
}

export async function readContactProfileFromApi({
  currentUserPhone,
  fetcher = fetch
}: ContactProfileApiClientInput) {
  const response = await fetcher("/api/contact-profile", {
    headers: createTemporaryIdentityHeaders(currentUserPhone),
    method: "GET"
  });

  return parseContactProfileResponse(response);
}

export async function saveContactProfileToApi({
  currentUserPhone,
  fetcher = fetch,
  input
}: ContactProfileApiClientInput & { input: ContactProfileInput }) {
  const response = await fetcher("/api/contact-profile", {
    body: JSON.stringify(input),
    headers: createTemporaryIdentityHeaders(currentUserPhone),
    method: "PUT"
  });

  return parseContactProfileResponse(response);
}
