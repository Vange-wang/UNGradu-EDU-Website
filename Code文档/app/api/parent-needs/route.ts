import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { CONTACT_EXCHANGE_REQUESTS_COLLECTION } from "@/server/contact-exchange";
import { CONVERSATIONS_COLLECTION } from "@/server/conversations";
import { createParentNeedApiHandlers } from "@/server/parent-need-api";
import {
  PARENT_NEEDS_COLLECTION,
  type ParentNeedLifecycleTransactionRunner
} from "@/server/parent-needs";
import { createParentNeedManagementHandlers } from "./management-handlers";
import { createRuntimeEnvWithSessionRevocation } from "@/server/api-utils";

type GetHandler = ReturnType<typeof createParentNeedApiHandlers>["GET_COLLECTION"];
type PostHandler = ReturnType<
  typeof createParentNeedManagementHandlers
>["POST_COLLECTION"];

let routeHandlers: { GET: GetHandler; POST: PostHandler } | undefined;

function getRouteHandlers() {
  if (!routeHandlers) {
    const database = createCloudBaseServerApp().database();
    type TransactionLike = {
      collection: (name: string) => ReturnType<typeof database.collection>;
    };
    const collection = database.collection(PARENT_NEEDS_COLLECTION);
    const env = createRuntimeEnvWithSessionRevocation(database);
    const handlers = createParentNeedApiHandlers({ collection, env });
    const runTransaction: ParentNeedLifecycleTransactionRunner | undefined =
      typeof database.runTransaction === "function"
        ? (operation) =>
            database.runTransaction((transaction: TransactionLike) =>
              operation({
                auditCollection: transaction.collection("audit_events"),
                contactExchangeRequestsCollection: transaction.collection(
                  CONTACT_EXCHANGE_REQUESTS_COLLECTION
                ),
                conversationsCollection: transaction.collection(CONVERSATIONS_COLLECTION),
                sourceCollection: transaction.collection(PARENT_NEEDS_COLLECTION)
              })
            )
        : undefined;
    const managementHandlers = createParentNeedManagementHandlers({
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
