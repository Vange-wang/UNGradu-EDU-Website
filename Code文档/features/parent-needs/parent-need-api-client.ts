import type { ParentNeedInput } from "@/features/parent-needs/parent-need";
import { parseApiResponse } from "@/features/api/api-client";
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

export async function saveParentNeedToApi({
  fetcher = fetch,
  input
}: {
  currentUserPhone: string;
  fetcher?: typeof fetch;
  input: ParentNeedInput;
}) {
  const response = await fetcher("/api/parent-needs", {
    body: JSON.stringify(input),
    credentials: "same-origin",
    headers: createCookieBackedHeaders(),
    method: "POST"
  });

  return parseApiResponse<ServerParentNeed>(response);
}
