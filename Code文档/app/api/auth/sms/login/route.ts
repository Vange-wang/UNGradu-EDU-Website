import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { createSmsAuthApiHandlers } from "@/server/sms-auth-api";
import {
  SMS_LOGIN_CODES_COLLECTION,
  SMS_LOGIN_USERS_COLLECTION
} from "@/server/sms-auth";
import { createSmsDelivery } from "@/server/sms-delivery";

function createHandlers() {
  const database = createCloudBaseServerApp().database();

  return createSmsAuthApiHandlers({
    smsCodeCollection: database.collection(SMS_LOGIN_CODES_COLLECTION),
    smsDelivery: createSmsDelivery(),
    userCollection: database.collection(SMS_LOGIN_USERS_COLLECTION)
  });
}

export async function POST(request: Request) {
  return createHandlers().POST_LOGIN(request);
}
