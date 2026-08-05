import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import {
  PARENT_NEEDS_COLLECTION,
  type ParentNeedLifecycleTransactionRunner
} from "@/server/parent-needs";
import { CONTACT_EXCHANGE_REQUESTS_COLLECTION } from "@/server/contact-exchange";
import { CONVERSATIONS_COLLECTION } from "@/server/conversations";
import { createParentNeedManagementHandlers } from "../management-handlers";

const database = createCloudBaseServerApp().database();
type TransactionLike = {
  collection: (name: string) => ReturnType<typeof database.collection>;
};

const collection = database.collection(PARENT_NEEDS_COLLECTION);
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
const handlers = createParentNeedManagementHandlers({
  collection,
  runTransaction
});

export const DELETE = handlers.DELETE_ITEM;
export const GET = handlers.GET_ITEM;
export const PATCH = handlers.PATCH_ITEM;
export const POST = handlers.POST_ITEM;
