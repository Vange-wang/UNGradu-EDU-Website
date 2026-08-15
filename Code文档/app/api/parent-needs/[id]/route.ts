import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import {
  PARENT_NEEDS_COLLECTION,
  type ParentNeedLifecycleTransactionRunner
} from "@/server/parent-needs";
import { CONTACT_EXCHANGE_REQUESTS_COLLECTION } from "@/server/contact-exchange";
import { CONVERSATIONS_COLLECTION } from "@/server/conversations";
import { createParentNeedManagementHandlers } from "../management-handlers";
import { createRuntimeEnvWithSessionRevocation } from "@/server/api-utils";

type RouteHandlers = ReturnType<typeof createParentNeedManagementHandlers>;

let handlers: RouteHandlers | undefined;

function getHandlers() {
  if (!handlers) {
    const database = createCloudBaseServerApp().database();
    type TransactionLike = {
      collection: (name: string) => ReturnType<typeof database.collection>;
    };
    const collection = database.collection(PARENT_NEEDS_COLLECTION);
    const env = createRuntimeEnvWithSessionRevocation(database);
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
    handlers = createParentNeedManagementHandlers({ collection, env, runTransaction });
  }
  return handlers;
}

export const DELETE: RouteHandlers["DELETE_ITEM"] = (...args) =>
  getHandlers().DELETE_ITEM(...args);
export const GET: RouteHandlers["GET_ITEM"] = (...args) =>
  getHandlers().GET_ITEM(...args);
export const PATCH: RouteHandlers["PATCH_ITEM"] = (...args) =>
  getHandlers().PATCH_ITEM(...args);
export const POST: RouteHandlers["POST_ITEM"] = (...args) =>
  getHandlers().POST_ITEM(...args);
