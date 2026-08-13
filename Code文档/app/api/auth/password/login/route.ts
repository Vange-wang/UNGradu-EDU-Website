import { randomUUID } from "node:crypto";

import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { createEmailAuthApiHandlers } from "@/server/email-auth-api";
import {
  EMAIL_LOGIN_CODES_COLLECTION,
  EMAIL_LOGIN_USERS_COLLECTION
} from "@/server/email-auth";
import { createEmailDelivery } from "@/server/email-delivery";
import { createRuntimeEnvWithSessionRevocation } from "@/server/api-utils";
import {
  createCloudBasePersistentEmailChallengeReplayGuard,
  createTurnstileEmailChallengeVerifier,
  type PersistentChallengeReplayDatabase
} from "@/server/security/email-challenge";
import { createRouteRateLimiter } from "@/server/security/rate-limit";

function createHandlers() {
  const database = createCloudBaseServerApp().database();
  const env = createRuntimeEnvWithSessionRevocation(database);

  return createEmailAuthApiHandlers({
    challengeReplayGuard: createCloudBasePersistentEmailChallengeReplayGuard({
      collectionName: env.AUTH_CHALLENGE_REPLAY_COLLECTION,
      database: database as PersistentChallengeReplayDatabase,
      keySecret: env.AUTH_CHALLENGE_REPLAY_KEY_SECRET
    }),
    challengeVerifier: createTurnstileEmailChallengeVerifier({
      expectedHostnames: (env.TURNSTILE_EXPECTED_HOSTNAMES ?? "")
        .split(",")
        .map((hostname) => hostname.trim().toLowerCase())
        .filter(Boolean),
      secretKey: env.TURNSTILE_SECRET_KEY
    }),
    emailCodeCollection: database.collection(EMAIL_LOGIN_CODES_COLLECTION),
    emailDelivery: createEmailDelivery(),
    env,
    rateLimiter: createRouteRateLimiter(env),
    requireChallenge: env.APP_ENV === "production" || env.NODE_ENV === "production",
    userCollection: database.collection(EMAIL_LOGIN_USERS_COLLECTION)
  });
}

function logPasswordLoginFailure(
  correlationId: string,
  errorCode: "AUTH_PASSWORD_LOGIN_HANDLER_FAILED" | "AUTH_PASSWORD_LOGIN_ROUTE_SETUP_FAILED",
  stage: "handler" | "setup"
) {
  console.error(JSON.stringify({
    correlationId,
    errorCode,
    event: "auth_password_login_unavailable",
    stage
  }));
}

function passwordLoginUnavailable(correlationId: string) {
  return Response.json({
    errors: { request: "登录服务暂时不可用，请稍后重试" },
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

export async function POST(request: Request) {
  const correlationId = randomUUID();
  let handlers: ReturnType<typeof createEmailAuthApiHandlers>;
  try {
    handlers = createHandlers();
  } catch {
    logPasswordLoginFailure(
      correlationId,
      "AUTH_PASSWORD_LOGIN_ROUTE_SETUP_FAILED",
      "setup"
    );
    return passwordLoginUnavailable(correlationId);
  }

  try {
    const response = await handlers.POST_PASSWORD_LOGIN(request);
    response.headers.set("x-correlation-id", correlationId);
    return response;
  } catch {
    logPasswordLoginFailure(
      correlationId,
      "AUTH_PASSWORD_LOGIN_HANDLER_FAILED",
      "handler"
    );
    return passwordLoginUnavailable(correlationId);
  }
}
