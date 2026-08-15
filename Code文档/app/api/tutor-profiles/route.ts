import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { CONTACT_EXCHANGE_REQUESTS_COLLECTION } from "@/server/contact-exchange";
import { CONVERSATIONS_COLLECTION } from "@/server/conversations";
import { createTutorProfileApiHandlers } from "@/server/tutor-profile-api";
import {
  TUTOR_PROFILES_COLLECTION,
  type TutorProfileLifecycleTransactionRunner
} from "@/server/tutor-profiles";
import { createTutorProfileManagementHandlers } from "./management-handlers";
import { createRuntimeEnvWithSessionRevocation } from "@/server/api-utils";

type GetHandler = ReturnType<typeof createTutorProfileApiHandlers>["GET_COLLECTION"];
type PostHandler = ReturnType<
  typeof createTutorProfileManagementHandlers
>["POST_COLLECTION"];

let routeHandlers: { GET: GetHandler; POST: PostHandler } | undefined;

function getRouteHandlers() {
  if (!routeHandlers) {
    const database = createCloudBaseServerApp().database();
    type TransactionLike = {
      collection: (name: string) => ReturnType<typeof database.collection>;
    };
    const collection = database.collection(TUTOR_PROFILES_COLLECTION);
    const env = createRuntimeEnvWithSessionRevocation(database);
    const handlers = createTutorProfileApiHandlers({ collection, env });
    const runTransaction: TutorProfileLifecycleTransactionRunner | undefined =
      typeof database.runTransaction === "function"
        ? (operation) =>
            database.runTransaction((transaction: TransactionLike) =>
              operation({
                auditCollection: transaction.collection("audit_events"),
                contactExchangeRequestsCollection: transaction.collection(
                  CONTACT_EXCHANGE_REQUESTS_COLLECTION
                ),
                conversationsCollection: transaction.collection(CONVERSATIONS_COLLECTION),
                sourceCollection: transaction.collection(TUTOR_PROFILES_COLLECTION)
              })
            )
        : undefined;
    const managementHandlers = createTutorProfileManagementHandlers({
      collection,
      env,
      runTransaction
    });
    routeHandlers = {
      GET: handlers.GET_COLLECTION,
      POST: managementHandlers.POST_COLLECTION
    };
  }
  return routeHandlers;
}

export const GET: GetHandler = (...args) => getRouteHandlers().GET(...args);
export const POST: PostHandler = (...args) => getRouteHandlers().POST(...args);
