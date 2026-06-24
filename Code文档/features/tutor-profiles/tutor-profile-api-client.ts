import type { TutorProfileInput } from "@/features/tutor-profiles/tutor-profile";
import { parseApiResponse } from "@/features/api/api-client";
import type {
  PublicServerTutorProfile,
  ServerTutorProfile,
  ServerTutorProfileFilters
} from "@/server/tutor-profiles";

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

export async function listPublicTutorProfilesFromApi({
  fetcher = fetch,
  filters = {}
}: {
  fetcher?: typeof fetch;
  filters?: ServerTutorProfileFilters;
}) {
  const response = await fetcher(`/api/tutor-profiles${buildQuery(filters)}`, {
    method: "GET"
  });

  return parseApiResponse<PublicServerTutorProfile[]>(response);
}

export async function readPublicTutorProfileFromApi({
  fetcher = fetch,
  id
}: {
  fetcher?: typeof fetch;
  id: string;
}) {
  const response = await fetcher(`/api/tutor-profiles/${encodeURIComponent(id)}`, {
    method: "GET"
  });

  return parseApiResponse<PublicServerTutorProfile | null>(response);
}

export async function listMyTutorProfilesFromApi({
  fetcher = fetch
}: {
  currentUserPhone: string;
  fetcher?: typeof fetch;
}) {
  const response = await fetcher("/api/tutor-profiles?scope=mine", {
    credentials: "same-origin",
    headers: createCookieBackedHeaders(),
    method: "GET"
  });

  return parseApiResponse<ServerTutorProfile[]>(response);
}

export async function saveTutorProfileToApi({
  fetcher = fetch,
  input
}: {
  currentUserPhone: string;
  fetcher?: typeof fetch;
  input: TutorProfileInput;
}) {
  const response = await fetcher("/api/tutor-profiles", {
    body: JSON.stringify(input),
    credentials: "same-origin",
    headers: createCookieBackedHeaders(),
    method: "POST"
  });

  return parseApiResponse<ServerTutorProfile>(response);
}
