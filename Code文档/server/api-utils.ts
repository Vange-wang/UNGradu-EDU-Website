import { isTestLoginAllowed } from "@/features/auth/test-auth";
import { readAuthSessionFromRequest } from "@/server/auth-session";

export type RuntimeEnv = {
  APP_ENV?: string;
  AUTH_SESSION_SECRET?: string;
  M5_ENABLE_HOSTED_TEST_LOGIN?: string;
  NODE_ENV?: string;
  NEXT_PUBLIC_ALLOW_TEST_LOGIN?: string;
};

export type ApiResult = {
  errors?: { request?: string };
  ok: boolean;
};

export function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export function apiError(status: number, message: string) {
  return jsonResponse(
    {
      ok: false,
      value: null,
      errors: { request: message }
    },
    status
  );
}

export function readAuthenticatedUserId(
  request: Request,
  env: RuntimeEnv
) {
  const session = readAuthSessionFromRequest(request, env);

  if (session) {
    return {
      ok: true as const,
      authenticatedUserId: session.phone
    };
  }

  const testUserPhone = request.headers.get("x-ungradu-test-user-phone")?.trim();

  if (!testUserPhone) {
    return {
      ok: false as const,
      response: apiError(401, "Login is required for this API.")
    };
  }

  if (
    !isTestLoginAllowed({
      allowTestLogin: env.NEXT_PUBLIC_ALLOW_TEST_LOGIN,
      allowHostedTestLogin: env.M5_ENABLE_HOSTED_TEST_LOGIN,
      appEnv: env.APP_ENV,
      nodeEnv: env.NODE_ENV
    })
  ) {
    return {
      ok: false as const,
      response: apiError(
        401,
        "Production does not accept temporary test login identity."
      )
    };
  }

  return {
    ok: true as const,
    authenticatedUserId: testUserPhone
  };
}

export const readTemporaryAuthenticatedUserId = readAuthenticatedUserId;

export async function readJsonBody<T>(request: Request) {
  try {
    return {
      ok: true as const,
      value: (await request.json()) as T
    };
  } catch {
    return {
      ok: false as const,
      response: apiError(400, "Invalid JSON body.")
    };
  }
}

export function statusForResult(result: ApiResult, failureStatus: 400 | 403) {
  return result.ok ? 200 : failureStatus;
}
