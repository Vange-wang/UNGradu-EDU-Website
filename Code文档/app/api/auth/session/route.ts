import { randomUUID } from "node:crypto";

import { createAuthApiHandlers } from "@/server/auth-api";
import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import {
  createCloudBaseSessionRevocationStore,
  createSessionRevocationGuard
} from "@/server/security/session-revocation";
import { createRuntimeEnvWithSessionRevocation } from "@/server/api-utils";

type SessionRouteFailureStage = "revocation_read" | "route" | "setup";

function logSessionRouteFailure(
  correlationId: string,
  errorCode: string,
  stage: SessionRouteFailureStage
) {
  console.error(JSON.stringify({
    correlationId,
    errorCode,
    event: "auth_session_unavailable",
    stage
  }));
}

function sessionUnavailable(correlationId: string) {
  return Response.json({
    errors: { request: "Session security is temporarily unavailable." },
    ok: false,
    value: null
  }, {
    headers: {
      "Cache-Control": "no-store",
      "x-correlation-id": correlationId
    },
    status: 503
  });
}

function allowsLocalTestSessionFallback() {
  return process.env.APP_ENV === "test" &&
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_ALLOW_TEST_LOGIN === "true" &&
    process.env.AUTH_SESSION_REVOCATION_REQUIRED !== "true";
}

function createHandlers(correlationId: string) {
  const database = createCloudBaseServerApp().database();
  const store = createCloudBaseSessionRevocationStore(
    database.collection("auth_session_revocations"),
    {
      onError(operation) {
        logSessionRouteFailure(
          correlationId,
          operation === "read"
            ? "AUTH_SESSION_REVOCATION_READ_FAILED"
            : "AUTH_SESSION_REVOCATION_WRITE_FAILED",
          operation === "read" ? "revocation_read" : "route"
        );
      }
    }
  );
  return createAuthApiHandlers({
    env: createRuntimeEnvWithSessionRevocation(database),
    sessionRevocationGuard: createSessionRevocationGuard({
      activeKeyVersion: process.env.AUTH_SESSION_KEY_VERSION ?? "",
      store
    })
  });
}

export async function GET(request: Request) {
  const correlationId = randomUUID();
  let handlers: ReturnType<typeof createAuthApiHandlers>;
  try {
    handlers = createHandlers(correlationId);
  } catch {
    if (allowsLocalTestSessionFallback()) {
      handlers = createAuthApiHandlers();
    } else {
      logSessionRouteFailure(
        correlationId,
        "AUTH_SESSION_ROUTE_SETUP_FAILED",
        "setup"
      );
      return sessionUnavailable(correlationId);
    }
  }

  try {
    const response = await handlers.GET_SESSION(request);
    response.headers.set("x-correlation-id", correlationId);
    return response;
  } catch {
    logSessionRouteFailure(
      correlationId,
      "AUTH_SESSION_ROUTE_FAILED",
      "route"
    );
    return sessionUnavailable(correlationId);
  }
}
