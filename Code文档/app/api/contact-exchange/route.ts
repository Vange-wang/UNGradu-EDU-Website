import { CONTACT_PROFILES_COLLECTION } from "@/server/contact-profiles";
import { createContactExchangeApiHandlers } from "@/server/contact-exchange-api";
import {
  CONTACT_EXCHANGE_REQUESTS_COLLECTION,
  CONVERSATIONS_COLLECTION
} from "@/server/contact-exchange";
import { createCloudBaseServerApp } from "@/server/cloudbase-server";

const database = createCloudBaseServerApp().database();

const handlers = createContactExchangeApiHandlers({
  contactProfilesCollection: database.collection(CONTACT_PROFILES_COLLECTION),
  conversationsCollection: database.collection(CONVERSATIONS_COLLECTION),
  parentNeedsCollection: database.collection("parent_needs"),
  requestsCollection: database.collection(CONTACT_EXCHANGE_REQUESTS_COLLECTION),
  tutorProfilesCollection: database.collection("tutor_profiles")
});

export const GET = handlers.GET;
export const POST = handlers.POST;
