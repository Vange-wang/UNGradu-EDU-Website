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

function createCookieBackedHeaders() {
  return {
    "content-type": "application/json"
  };
}

async function parseContactProfileResponse(response: Response) {
  return await response.json() as ContactProfileApiResult;
}

export async function readContactProfileFromApi({
  fetcher = fetch
}: ContactProfileApiClientInput) {
  const response = await fetcher("/api/contact-profile", {
    credentials: "same-origin",
    headers: createCookieBackedHeaders(),
    method: "GET"
  });

  return parseContactProfileResponse(response);
}

export async function saveContactProfileToApi({
  fetcher = fetch,
  input
}: ContactProfileApiClientInput & { input: ContactProfileInput }) {
  const response = await fetcher("/api/contact-profile", {
    body: JSON.stringify(input),
    credentials: "same-origin",
    headers: createCookieBackedHeaders(),
    method: "PUT"
  });

  return parseContactProfileResponse(response);
}
