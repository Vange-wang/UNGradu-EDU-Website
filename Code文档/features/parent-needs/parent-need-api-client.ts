import type { ParentNeedInput } from "@/features/parent-needs/parent-need";
import { fetchWithCsrf, parseApiResponse } from "@/features/api/api-client";
import type {
  PublicServerParentNeed,
  ServerParentNeed,
  ServerParentNeedFilters
} from "@/server/parent-needs";

function createCookieBackedHeaders() {
  return {
    "content-type": "application/json"
  };
}

function createIdempotencyKey(action: string, id: string, version: number) {
  const nonce = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
  return `${action}:${id}:v${version}:${nonce}`;
}

function buildQuery(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value?.trim()) {
      searchParams.set(key, value.trim());
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function listPublicParentNeedsFromApi({
  fetcher = fetch,
  filters = {}
}: {
  fetcher?: typeof fetch;
  filters?: ServerParentNeedFilters;
}) {
  const response = await fetcher(`/api/parent-needs${buildQuery(filters)}`, {
    method: "GET"
  });

  return parseApiResponse<PublicServerParentNeed[]>(response);
}

export async function readPublicParentNeedFromApi({
  fetcher = fetch,
  id
}: {
  fetcher?: typeof fetch;
  id: string;
}) {
  const response = await fetcher(`/api/parent-needs/${encodeURIComponent(id)}`, {
    method: "GET"
  });

  return parseApiResponse<PublicServerParentNeed | null>(response);
}

export async function listMyParentNeedsFromApi({
  fetcher = fetch
}: {
  currentUserPhone: string;
  fetcher?: typeof fetch;
}) {
  const response = await fetcher("/api/parent-needs?scope=mine", {
    credentials: "same-origin",
    headers: createCookieBackedHeaders(),
    method: "GET"
  });

  return parseApiResponse<ServerParentNeed[]>(response);
}

export async function readMyParentNeedFromApi({
  fetcher = fetch,
  id
}: {
  currentUserPhone: string;
  fetcher?: typeof fetch;
  id: string;
}) {
  const response = await fetcher(
    `/api/parent-needs/${encodeURIComponent(id)}?scope=mine`,
    {
      credentials: "same-origin",
      headers: createCookieBackedHeaders(),
      method: "GET"
    }
  );

  return parseApiResponse<ServerParentNeed>(response);
}

export async function updateParentNeedToApi({
  fetcher = fetch,
  id,
  input,
  version
}: {
  currentUserPhone: string;
  fetcher?: typeof fetch;
  id: string;
  input: ParentNeedInput;
  version: number;
}) {
  const response = await fetchWithCsrf(fetcher, `/api/parent-needs/${encodeURIComponent(id)}`, {
    body: JSON.stringify({ ...input, version }),
    credentials: "same-origin",
    headers: createCookieBackedHeaders(),
    method: "PATCH"
  });

  return parseApiResponse<ServerParentNeed>(response);
}

export async function deleteParentNeedFromApi({
  fetcher = fetch,
  id,
  version
}: {
  currentUserPhone: string;
  fetcher?: typeof fetch;
  id: string;
  version: number;
}) {
  const response = await fetchWithCsrf(fetcher, `/api/parent-needs/${encodeURIComponent(id)}`, {
    body: JSON.stringify({ version }),
    credentials: "same-origin",
    headers: {
      ...createCookieBackedHeaders(),
      "idempotency-key": createIdempotencyKey("delete", id, version)
    },
    method: "DELETE"
  });

  return parseApiResponse<ServerParentNeed>(response);
}

export async function restoreParentNeedFromApi({
  fetcher = fetch,
  id,
  version
}: {
  currentUserPhone: string;
  fetcher?: typeof fetch;
  id: string;
  version: number;
}) {
  const response = await fetchWithCsrf(fetcher, `/api/parent-needs/${encodeURIComponent(id)}`, {
    body: JSON.stringify({ action: "restore", version }),
    credentials: "same-origin",
    headers: {
      ...createCookieBackedHeaders(),
      "idempotency-key": createIdempotencyKey("restore", id, version)
    },
    method: "POST"
  });

  return parseApiResponse<ServerParentNeed>(response);
}

export async function saveParentNeedToApi({
  fetcher = fetch,
  input
}: {
  currentUserPhone: string;
  fetcher?: typeof fetch;
  input: ParentNeedInput;
}) {
  const response = await fetchWithCsrf(fetcher, "/api/parent-needs", {
    body: JSON.stringify(input),
    credentials: "same-origin",
    headers: createCookieBackedHeaders(),
    method: "POST"
  });

  return parseApiResponse<ServerParentNeed>(response);
}
