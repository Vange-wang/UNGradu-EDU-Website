import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { createEmailAuthApiHandlers } from "@/server/email-auth-api";
import {
  EMAIL_LOGIN_CODES_COLLECTION,
  EMAIL_LOGIN_USERS_COLLECTION
} from "@/server/email-auth";
import { createEmailDelivery } from "@/server/email-delivery";
import { createRuntimeEnvWithSessionRevocation } from "@/server/api-utils";
import { createRouteRateLimiter } from "@/server/security/rate-limit";

function createHandlers() {
  const database = createCloudBaseServerApp().database();
  const env = createRuntimeEnvWithSessionRevocation(database);

  return createEmailAuthApiHandlers({
    emailCodeCollection: database.collection(EMAIL_LOGIN_CODES_COLLECTION),
    emailDelivery: createEmailDelivery(),
    env,
    rateLimiter: createRouteRateLimiter(env),
    userCollection: database.collection(EMAIL_LOGIN_USERS_COLLECTION)
  });
}

export async function POST(request: Request) {
  return createHandlers().POST_SET_PASSWORD(request);
}
