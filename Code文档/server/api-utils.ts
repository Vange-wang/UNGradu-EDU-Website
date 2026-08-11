import { isTestLoginAllowed } from "@/features/auth/test-auth";
import {
  readAuthSessionFromRequestWithRevocation,
  type AuthSessionRevocationGuard
} from "@/server/auth-session";
import {
  validateJsonValue,
  type JsonSafetyLimits
} from "@/server/security/schema-limits";
import { evaluateWriteRequest } from "@/server/security/request-guard";
import {
  createRedactedSecurityAudit,
  createFailClosedSecurityAlertSink,
  type SecurityAlertSink
} from "@/server/security/security-observability";
import {
  createCloudBaseSessionRevocationStore,
  createSessionRevocationGuard
} from "@/server/security/session-revocation";
import type { PersistentRateLimitDatabase } from "@/server/security/rate-limit";

export type AnonymousAntiAbuseAdapter = {
  available: boolean;
  verify: (request: Request) => boolean;
};

export type RuntimeEnv = {
  ALLOWED_ORIGINS?: string;
  APP_ENV?: string;
  AUTH_CHALLENGE_REPLAY_COLLECTION?: string;
  AUTH_CHALLENGE_REPLAY_KEY_SECRET?: string;
  AUTH_SESSION_SECRET?: string;
  AUTH_SESSION_KEY_VERSION?: string;
  AUTH_SESSION_REVOKED_AT?: string;
  AUTH_SESSION_REVOCATION_REQUIRED?: string;
  AUTH_RATE_LIMIT_COLLECTION?: string;
  AUTH_RATE_LIMIT_KEY_SECRET?: string;
  CSRF_SECRET?: string;
  M5_ENABLE_HOSTED_TEST_LOGIN?: string;
  NODE_ENV?: string;
  NEXT_PUBLIC_ALLOW_TEST_LOGIN?: string;
  ORIGIN_VERIFY_MODE?: "off" | "observe" | "enforce" | string;
  rateLimitDatabase?: PersistentRateLimitDatabase;
  anonymousAntiAbuse?: AnonymousAntiAbuseAdapter;
  securityAlertSink?: SecurityAlertSink;
  sessionRevocationGuard?: AuthSessionRevocationGuard;
  TRUSTED_PROXY_IP?: string;
  TURNSTILE_EXPECTED_HOSTNAMES?: string;
  TURNSTILE_SECRET_KEY?: string;
};

export type ApiResult = {
  errors?: { request?: string };
  ok: boolean;
};

export function isProductionRuntime(env: Pick<RuntimeEnv, "APP_ENV" | "NODE_ENV">) {
  return env.APP_ENV === "production" || env.NODE_ENV === "production";
}

/**
 * Every server route receives the same alert boundary. A real external sink
 * can be injected by a configured runtime; otherwise production remains
 * explicitly unavailable instead of silently using process memory/console.
 */
export function createSecurityRuntimeEnv(env: RuntimeEnv = process.env): RuntimeEnv {
  return {
    ...env,
    securityAlertSink: env.securityAlertSink ?? createFailClosedSecurityAlertSink()
  };
}

type RevocationDatabase = {
  collection: (name: string) => Parameters<typeof createCloudBaseSessionRevocationStore>[0];
  runTransaction?: PersistentRateLimitDatabase["runTransaction"];
};

/** Build the fixed production revocation dependency for a route. */
export function createRuntimeEnvWithSessionRevocation(
  database: RevocationDatabase,
  env: RuntimeEnv = process.env
): RuntimeEnv {
  const rateLimitDatabase = typeof database.runTransaction === "function"
    ? database as PersistentRateLimitDatabase
    : undefined;
  try {
    const collection = database.collection("auth_session_revocations");
    return createSecurityRuntimeEnv({
      ...env,
      rateLimitDatabase,
      sessionRevocationGuard: createSessionRevocationGuard({
        activeKeyVersion: env.AUTH_SESSION_KEY_VERSION?.trim() ?? "",
        store: createCloudBaseSessionRevocationStore(collection)
      })
    });
  } catch {
    return createSecurityRuntimeEnv({ ...env, rateLimitDatabase });
  }
}

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
  // Kept only as a synchronous test-identity shim. All authenticated route
  // paths must use readAuthenticatedUserIdWithRevocation below.
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

/**
 * Authorization path for authenticated reads and writes. In production a
 * durable revocation guard is mandatory; the legacy synchronous helper above
 * remains only for middleware/temporary test compatibility.
 */
export async function readAuthenticatedUserIdWithRevocation(
  request: Request,
  env: RuntimeEnv
) {
  const session = await readAuthSessionFromRequestWithRevocation(
    request,
    env,
    env.sessionRevocationGuard
  );

  if (session.ok) {
    return {
      ok: true as const,
      authenticatedUserId: session.session.userId ?? session.session.phone ?? ""
    };
  }

  if (session.reason === "unavailable") {
    return {
      ok: false as const,
      response: apiError(503, "Session revocation service is unavailable.")
    };
  }

  const testUserPhone = request.headers.get("x-ungradu-test-user-phone")?.trim();
  if (!testUserPhone) {
    return {
      ok: false as const,
      response: apiError(401, "Login is required for this API.")
    };
  }

  if (!isTestLoginAllowed({
    allowTestLogin: env.NEXT_PUBLIC_ALLOW_TEST_LOGIN,
    allowHostedTestLogin: env.M5_ENABLE_HOSTED_TEST_LOGIN,
    appEnv: env.APP_ENV,
    nodeEnv: env.NODE_ENV
  })) {
    return {
      ok: false as const,
      response: apiError(401, "Production does not accept temporary test login identity.")
    };
  }

  return { ok: true as const, authenticatedUserId: testUserPhone };
}

/** Optional authentication for endpoints that intentionally accept anonymous writes. */
export async function readOptionalAuthenticatedUserIdWithRevocation(
  request: Request,
  env: RuntimeEnv
) {
  const session = await readAuthSessionFromRequestWithRevocation(
    request,
    env,
    env.sessionRevocationGuard
  );

  if (session.ok) {
    return {
      ok: true as const,
      authenticatedUserId: session.session.userId ?? session.session.phone ?? undefined
    };
  }

  if (session.reason === "unavailable") {
    return {
      ok: false as const,
      response: apiError(503, "Session revocation service is unavailable.")
    };
  }

  if (session.reason === "revoked") {
    return {
      ok: false as const,
      response: apiError(401, "Login is required for this API.")
    };
  }

  const testUserPhone = request.headers.get("x-ungradu-test-user-phone")?.trim();
  if (!testUserPhone) {
    return { ok: true as const, authenticatedUserId: undefined };
  }

  if (!isTestLoginAllowed({
    allowTestLogin: env.NEXT_PUBLIC_ALLOW_TEST_LOGIN,
    allowHostedTestLogin: env.M5_ENABLE_HOSTED_TEST_LOGIN,
    appEnv: env.APP_ENV,
    nodeEnv: env.NODE_ENV
  })) {
    return {
      ok: false as const,
      response: apiError(401, "Production does not accept temporary test login identity.")
    };
  }

  return { ok: true as const, authenticatedUserId: testUserPhone };
}

export const readTemporaryAuthenticatedUserId = readAuthenticatedUserId;

export function guardWriteRequest(
  request: Request,
  env: RuntimeEnv,
  subjectId?: string,
  options: { allowAnonymous?: boolean } = {}
) {
  const production = isProductionRuntime(env);
  const result = evaluateWriteRequest({
    env: {
      allowedOrigins: env.ALLOWED_ORIGINS,
      appEnv: env.APP_ENV,
      csrfSecret: env.CSRF_SECRET,
      mode: production
        ? "enforce"
        : env.ORIGIN_VERIFY_MODE === "observe" || env.ORIGIN_VERIFY_MODE === "off"
        ? env.ORIGIN_VERIFY_MODE
        : env.ORIGIN_VERIFY_MODE === "enforce" || env.NODE_ENV === "production" || env.APP_ENV === "production"
          ? "enforce"
          : "off",
      nodeEnv: env.NODE_ENV,
      subjectId,
      allowAnonymous: options.allowAnonymous
    },
    request
  });

  if (result.ok) {
    if (options.allowAnonymous && !subjectId?.trim()) {
      if (!env.anonymousAntiAbuse?.available) {
        return production
          ? apiError(503, "Anonymous abuse-prevention service is unavailable.")
          : null;
      }
      try {
        if (!env.anonymousAntiAbuse.verify(request)) {
          return new Response("Forbidden.", { status: 403 });
        }
      } catch {
        return production
          ? apiError(503, "Anonymous abuse-prevention service is unavailable.")
          : new Response("Forbidden.", { status: 403 });
      }
    }
    return null;
  }

  const audit = createRedactedSecurityAudit({
    correlationId: result.correlationId,
    event: "write_request_rejected",
    metadata: {
      method: request.method,
      pathname: new URL(request.url).pathname,
      reason: result.reason
    }
  });
  if (production) {
    if (!env.securityAlertSink?.available) {
      return apiError(503, "Security observability service is unavailable.");
    }
    try {
      env.securityAlertSink.emit(audit);
    } catch {
      return apiError(503, "Security observability service is unavailable.");
    }
  } else {
    try {
      env.securityAlertSink?.emit(audit);
    } catch {
      // Local rejection remains a 403; an optional local sink must not mask it.
    }
    if (!env.securityAlertSink?.available) {
      console.warn(JSON.stringify(audit));
    }
  }

  return new Response("Forbidden.", {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "x-correlation-id": result.correlationId
    },
    status: 403
  });
}

async function readRequestBodyText(request: Request, maxBytes: number) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false as const, reason: "body-too-large" as const };
  }

  if (request.body?.getReader) {
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        const chunk = next.value instanceof Uint8Array ? next.value : new Uint8Array(next.value);
        total += chunk.byteLength;
        if (total > maxBytes) {
          await reader.cancel("body-too-large");
          return { ok: false as const, reason: "body-too-large" as const };
        }
        chunks.push(chunk);
      }
      const bytes = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return { ok: true as const, text: new TextDecoder().decode(bytes) };
    } finally {
      reader.releaseLock();
    }
  }

  const text = await request.text();
  return new TextEncoder().encode(text).byteLength > maxBytes
    ? { ok: false as const, reason: "body-too-large" as const }
    : { ok: true as const, text };
}

export async function readJsonBody<T>(
  request: Request,
  limits: JsonSafetyLimits = {}
) {
  try {
    const body = await readRequestBodyText(request, limits.maxBodyBytes ?? 1_000_000);
    if (!body.ok) {
      return {
        ok: false as const,
        response: apiError(413, "Request body exceeds safety limits.")
      };
    }

    const parsed = JSON.parse(body.text) as T;
    const safety = validateJsonValue(parsed, limits);
    if (!safety.ok) {
      const sizeFailure = safety.reason === "body-too-large" || safety.reason === "array-too-long" || safety.reason === "object-too-deep" || safety.reason === "string-too-long";
      return {
        ok: false as const,
        response: apiError(sizeFailure ? 413 : 400, sizeFailure
          ? "Request body exceeds safety limits."
          : "Request body does not match the allowed schema.")
      };
    }

    return {
      ok: true as const,
      value: parsed
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
