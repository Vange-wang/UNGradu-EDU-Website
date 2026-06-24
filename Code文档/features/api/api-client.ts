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
