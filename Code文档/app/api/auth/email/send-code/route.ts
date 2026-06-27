import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { createEmailAuthApiHandlers } from "@/server/email-auth-api";
import {
  EMAIL_LOGIN_CODES_COLLECTION,
  EMAIL_LOGIN_USERS_COLLECTION
} from "@/server/email-auth";
import { createEmailDelivery } from "@/server/email-delivery";

function createHandlers() {
  const database = createCloudBaseServerApp().database();

  return createEmailAuthApiHandlers({
    emailCodeCollection: database.collection(EMAIL_LOGIN_CODES_COLLECTION),
    emailDelivery: createEmailDelivery(),
    userCollection: database.collection(EMAIL_LOGIN_USERS_COLLECTION)
  });
}

export async function POST(request: Request) {
  return createHandlers().POST_SEND_CODE(request);
}
