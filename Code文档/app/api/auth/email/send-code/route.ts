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
      environmentRef: env.APP_ENV ?? env.NODE_ENV ?? "local",
      keySecret: env.AUTH_CHALLENGE_REPLAY_KEY_SECRET,
      keyVersion: "v1"
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

export async function POST(request: Request) {
  return createHandlers().POST_SEND_CODE(request);
}
