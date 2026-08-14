import { validateTestLoginInput } from "@/features/auth/test-auth";
import { apiError, createSecurityRuntimeEnv, guardWriteRequest, isProductionRuntime, jsonResponse, readJsonBody, type RuntimeEnv } from "@/server/api-utils";
import {
  clearAuthSessionCookie,
  createAuthSessionCookie,
  readAuthSessionFromRequestWithRevocation,
  type AuthSessionRevocationGuard
} from "@/server/auth-session";
import { isTestLoginAllowed } from "@/features/auth/test-auth";
import { createCsrfProof } from "@/server/security/request-guard";

type AuthApiDependencies = {
  env?: RuntimeEnv & { AUTH_SESSION_SECRET?: string };
  sessionRevocationGuard?: AuthSessionRevocationGuard;
};

const CSRF_PROTECTED_METHODS = new Set(["DELETE", "PATCH", "POST", "PUT"]);

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/$/u, "");
}

function resolveCsrfOrigin(request: Request, env: RuntimeEnv) {
  const requestedOrigin = request.headers.get("x-ungrade-csrf-origin")?.trim();
  const requestOrigin = normalizeOrigin(
    requestedOrigin || new URL(request.url).origin
  );
  const allowedOrigins = new Set(
    env.ALLOWED_ORIGINS?.split(",")
      .map(normalizeOrigin)
      .filter(Boolean) ?? []
  );

  if (allowedOrigins.size > 0 && !allowedOrigins.has(requestOrigin)) {
    return null;
  }

  if (isProductionRuntime(env) && allowedOrigins.size === 0) {
    return null;
  }

  return requestOrigin;
}

function jsonWithCookie(body: unknown, cookie: string) {
  return Response.json(body, {
    headers: { "set-cookie": cookie },
    status: 200
  });
}

export function createAuthApiHandlers({ env = process.env, sessionRevocationGuard }: AuthApiDependencies = {}) {
  const securedEnv: RuntimeEnv = createSecurityRuntimeEnv({
    ...env,
    sessionRevocationGuard: sessionRevocationGuard ?? env.sessionRevocationGuard
  });
  return {
    async GET_CSRF_PROOF(request: Request) {
      const result = await readAuthSessionFromRequestWithRevocation(
        request,
        securedEnv,
        securedEnv.sessionRevocationGuard
      );

      if (!result.ok) {
        return apiError(
          result.reason === "unavailable" ? 503 : 401,
          result.reason === "unavailable"
            ? "Session security is temporarily unavailable."
            : "Login is required for this API."
        );
      }

      const method = new URL(request.url).searchParams.get("method")?.toUpperCase() ?? "";
      if (!CSRF_PROTECTED_METHODS.has(method)) {
        return apiError(400, "Unsupported CSRF request method.");
      }

      const secret = securedEnv.CSRF_SECRET?.trim();
      const origin = resolveCsrfOrigin(request, securedEnv);
      const subjectId = result.session.userId ?? result.session.phone;
      if (!secret || !origin || !subjectId?.trim()) {
        return apiError(503, "Request security is temporarily unavailable.");
      }

      return jsonResponse({
        errors: {},
        ok: true,
        value: {
          proof: createCsrfProof({ method, origin, secret, subjectId })
        }
      });
    },

    async GET_SESSION(request: Request) {
      const result = await readAuthSessionFromRequestWithRevocation(
        request,
        securedEnv,
        securedEnv.sessionRevocationGuard
      );

      if (!result.ok) {
        return jsonResponse({
          ok: false,
          value: null,
          errors: {
            request: result.reason === "unavailable"
              ? "Session security is temporarily unavailable."
              : "Login is required for this API."
          }
        }, result.reason === "unavailable" ? 503 : 401);
      }

      return jsonResponse({
        ok: true,
        value: result.session,
        errors: {}
      });
    },

    async POST_TEST_LOGIN(request: Request) {
      if (
        !isTestLoginAllowed({
          allowTestLogin: env.NEXT_PUBLIC_ALLOW_TEST_LOGIN,
          allowHostedTestLogin: env.M5_ENABLE_HOSTED_TEST_LOGIN,
          appEnv: env.APP_ENV,
          nodeEnv: env.NODE_ENV
        })
      ) {
        return apiError(
          401,
          "Production does not accept temporary test login identity."
        );
      }

      const body = await readJsonBody<{ code?: string; phone?: string }>(request, {
        allowedKeys: ["code", "phone"],
        schema: {
          code: { type: "string" },
          phone: { type: "string" }
        }
      });

      if (!body.ok) {
        return body.response;
      }

      const securityResponse = guardWriteRequest(request, securedEnv, body.value.phone?.trim());
      if (securityResponse) return securityResponse;

      const result = validateTestLoginInput({
        code: body.value.code ?? "",
        phone: body.value.phone ?? ""
      });

      if (!result.ok) {
        return jsonResponse(result, 400);
      }

      const cookie = createAuthSessionCookie({
        env: securedEnv,
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

    async POST_LOGOUT(request: Request) {
      const result = await readAuthSessionFromRequestWithRevocation(
        request,
        securedEnv,
        securedEnv.sessionRevocationGuard
      );

      if (!result.ok && result.reason === "unavailable") {
        return apiError(503, "Session security is temporarily unavailable.");
      }

      const securityResponse = guardWriteRequest(
        request,
        securedEnv,
        result.ok ? result.session.userId ?? result.session.phone : undefined
      );
      if (securityResponse) return securityResponse;

      if (result.ok && securedEnv.sessionRevocationGuard) {
        try {
          await securedEnv.sessionRevocationGuard.revoke(result.session.userId ?? result.session.phone ?? "");
        } catch {
          return apiError(503, "Session security is temporarily unavailable.");
        }
      }

      return jsonWithCookie(
        {
          ok: true,
          value: null,
          errors: {}
        },
        clearAuthSessionCookie(securedEnv)
      );
    }
  };
}
