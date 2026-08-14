import type { ContactProfileInput } from "@/features/profile/contact-profile";
import { fetchWithCsrf, parseApiResponse, type ApiResult } from "@/features/api/api-client";

type ContactProfileApiResult = ApiResult<ContactProfileInput>;

type ContactProfileApiClientInput = {
  currentUserPhone: string;
  fetcher?: typeof fetch;
};

function createCookieBackedHeaders() {
  return {
    "content-type": "application/json"
  };
}

export async function readContactProfileFromApi({
  fetcher = fetch
}: ContactProfileApiClientInput) {
  const response = await fetcher("/api/contact-profile", {
    credentials: "same-origin",
    headers: createCookieBackedHeaders(),
    method: "GET"
  });

  return parseApiResponse<ContactProfileInput>(response) as Promise<ContactProfileApiResult>;
}

export async function saveContactProfileToApi({
  fetcher = fetch,
  input
}: ContactProfileApiClientInput & { input: ContactProfileInput }) {
  const response = await fetchWithCsrf(fetcher, "/api/contact-profile", {
    body: JSON.stringify(input),
    credentials: "same-origin",
    headers: createCookieBackedHeaders(),
    method: "PUT"
  });

  return parseApiResponse<ContactProfileInput>(response) as Promise<ContactProfileApiResult>;
}
