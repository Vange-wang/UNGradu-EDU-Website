import { validateTestLoginInput } from "@/features/auth/test-auth";
import { apiError, jsonResponse, readJsonBody, type RuntimeEnv } from "@/server/api-utils";
import {
  clearAuthSessionCookie,
  createAuthSessionCookie,
  readAuthSessionFromRequest
} from "@/server/auth-session";
import { isTestLoginAllowed } from "@/features/auth/test-auth";

type AuthApiDependencies = {
  env?: RuntimeEnv & { AUTH_SESSION_SECRET?: string };
};

function jsonWithCookie(body: unknown, cookie: string) {
  return Response.json(body, {
    headers: { "set-cookie": cookie },
    status: 200
  });
}

export function createAuthApiHandlers({ env = process.env }: AuthApiDependencies = {}) {
  return {
    async GET_SESSION(request: Request) {
      const session = readAuthSessionFromRequest(request, env);

      if (!session) {
        return jsonResponse({
          ok: false,
          value: null,
          errors: { request: "Login is required for this API." }
        }, 401);
      }

      return jsonResponse({
        ok: true,
        value: session,
        errors: {}
      });
    },

    async POST_TEST_LOGIN(request: Request) {
      if (
        !isTestLoginAllowed({
          allowTestLogin: env.NEXT_PUBLIC_ALLOW_TEST_LOGIN,
          nodeEnv: env.NODE_ENV
        })
      ) {
        return apiError(
          401,
          "Production does not accept temporary test login identity."
        );
      }

      const body = await readJsonBody<{ code?: string; phone?: string }>(request);

      if (!body.ok) {
        return body.response;
      }

      const result = validateTestLoginInput({
        code: body.value.code ?? "",
        phone: body.value.phone ?? ""
      });

      if (!result.ok) {
        return jsonResponse(result, 400);
      }

      const cookie = createAuthSessionCookie({
        env,
        phone: result.value.phone
      });

      if (!cookie) {
        return apiError(500, "Auth session secret is not configured.");
      }

      return jsonWithCookie(
        {
          ok: true,
          value: {
            phone: result.value.phone,
            createdAt: new Date().toISOString()
          },
          errors: {}
        },
        cookie
      );
    },

    async POST_LOGOUT() {
      return jsonWithCookie(
        {
          ok: true,
          value: null,
          errors: {}
        },
        clearAuthSessionCookie()
      );
    }
  };
}
