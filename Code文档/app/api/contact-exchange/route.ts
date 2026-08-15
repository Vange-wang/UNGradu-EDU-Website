import { CONTACT_PROFILES_COLLECTION } from "@/server/contact-profiles";
import { createContactExchangeApiHandlers } from "@/server/contact-exchange-api";
import {
  CONTACT_EXCHANGE_REQUESTS_COLLECTION,
  CONVERSATIONS_COLLECTION
} from "@/server/contact-exchange";
import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { createRuntimeEnvWithSessionRevocation } from "@/server/api-utils";

type RouteHandlers = ReturnType<typeof createContactExchangeApiHandlers>;

let handlers: RouteHandlers | undefined;

function getHandlers() {
  if (!handlers) {
    const database = createCloudBaseServerApp().database();
    handlers = createContactExchangeApiHandlers({
      contactProfilesCollection: database.collection(CONTACT_PROFILES_COLLECTION),
      conversationsCollection: database.collection(CONVERSATIONS_COLLECTION),
      parentNeedsCollection: database.collection("parent_needs"),
      requestsCollection: database.collection(CONTACT_EXCHANGE_REQUESTS_COLLECTION),
      tutorProfilesCollection: database.collection("tutor_profiles"),
      env: createRuntimeEnvWithSessionRevocation(database)
    });
  }
  return handlers;
}

export const GET: RouteHandlers["GET"] = (...args) => getHandlers().GET(...args);
export const POST: RouteHandlers["POST"] = (...args) => getHandlers().POST(...args);
