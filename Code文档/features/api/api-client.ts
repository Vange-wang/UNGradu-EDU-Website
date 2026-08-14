export type ApiResult<T> =
  | {
      ok: true;
      value: T;
      errors: Record<string, never>;
    }
  | {
      ok: false;
      value: null;
      errors: Record<string, string | undefined>;
    };

const DEFAULT_REQUEST_ERROR = "服务暂时不可用，请稍后重试。";
const CSRF_PROTECTED_METHODS = new Set(["DELETE", "PATCH", "POST", "PUT"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function parseApiResponse<T>(response: Response): Promise<ApiResult<T>> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      ok: false,
      value: null,
      errors: { request: DEFAULT_REQUEST_ERROR }
    };
  }

  try {
    const body = await response.json() as unknown;

    if (isRecord(body) && body.ok === true) {
      return body as ApiResult<T>;
    }

    if (isRecord(body) && body.ok === false && isRecord(body.errors)) {
      return body as ApiResult<T>;
    }

    return {
      ok: false,
      value: null,
      errors: { request: DEFAULT_REQUEST_ERROR }
    };
  } catch {
    return {
      ok: false,
      value: null,
      errors: { request: DEFAULT_REQUEST_ERROR }
    };
  }
}

export async function fetchWithCsrf(
  fetcher: typeof fetch,
  input: RequestInfo | URL,
  init: RequestInit,
  options: { allowAnonymous?: boolean } = {}
) {
  const method = (init.method ?? "GET").toUpperCase();

  if (!CSRF_PROTECTED_METHODS.has(method)) {
    return fetcher(input, init);
  }

  const browserOrigin = typeof window === "undefined" ? "" : window.location.origin;
  const proofResponse = await fetcher(
    `/api/auth/csrf?method=${encodeURIComponent(method)}`,
    {
      credentials: "same-origin",
      headers: browserOrigin
        ? { "x-ungrade-csrf-origin": browserOrigin }
        : undefined,
      method: "GET"
    }
  );

  if (options.allowAnonymous && proofResponse.status === 401) {
    return fetcher(input, init);
  }

  const proofResult = await parseApiResponse<{ proof: string }>(
    proofResponse.clone()
  );
  const rawProof = proofResult.ok ? proofResult.value.proof : undefined;
  const proof = typeof rawProof === "string" ? rawProof.trim() : "";

  if (!proofResponse.ok) {
    return proofResponse;
  }

  if (!proof) {
    const correlationId = proofResponse.headers.get("x-correlation-id");
    return Response.json({
      errors: { request: DEFAULT_REQUEST_ERROR },
      ok: false,
      value: null
    }, {
      headers: {
        "Cache-Control": "no-store",
        ...(correlationId ? { "x-correlation-id": correlationId } : {})
      },
      status: 503
    });
  }

  const headers = new Headers(init.headers);
  headers.set("x-ungrade-csrf", proof);
  return fetcher(input, { ...init, headers });
}
