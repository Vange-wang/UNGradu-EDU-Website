import type { TutorProfileInput } from "@/features/tutor-profiles/tutor-profile";
import type {
  PublicServerTutorProfile,
  ServerTutorProfile,
  ServerTutorProfileFilters
} from "@/server/tutor-profiles";

type ApiResult<T> =
  | {
      ok: true;
      value: T;
      errors: Record<string, never>;
    }
  | {
      ok: false;
      value: null;
      errors: Record<string, string>;
    };

function createTemporaryIdentityHeaders(currentUserPhone: string) {
  return {
    "content-type": "application/json",
    "x-ungradu-test-user-phone": currentUserPhone.trim()
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

async function parseApiResponse<T>(response: Response) {
  return await response.json() as ApiResult<T>;
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
  currentUserPhone,
  fetcher = fetch
}: {
  currentUserPhone: string;
  fetcher?: typeof fetch;
}) {
  const response = await fetcher("/api/tutor-profiles?scope=mine", {
    headers: createTemporaryIdentityHeaders(currentUserPhone),
    method: "GET"
  });

  return parseApiResponse<ServerTutorProfile[]>(response);
}

export async function saveTutorProfileToApi({
  currentUserPhone,
  fetcher = fetch,
  input
}: {
  currentUserPhone: string;
  fetcher?: typeof fetch;
  input: TutorProfileInput;
}) {
  const response = await fetcher("/api/tutor-profiles", {
    body: JSON.stringify(input),
    headers: createTemporaryIdentityHeaders(currentUserPhone),
    method: "POST"
  });

  return parseApiResponse<ServerTutorProfile>(response);
}
