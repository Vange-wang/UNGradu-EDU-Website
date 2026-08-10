import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { CONTACT_EXCHANGE_REQUESTS_COLLECTION } from "@/server/contact-exchange";
import { CONVERSATIONS_COLLECTION } from "@/server/conversations";
import {
  TUTOR_PROFILES_COLLECTION,
  type TutorProfileLifecycleTransactionRunner
} from "@/server/tutor-profiles";
import { createTutorProfileManagementHandlers } from "../management-handlers";
import { createRuntimeEnvWithSessionRevocation } from "@/server/api-utils";

const database = createCloudBaseServerApp().database();
type TransactionLike = {
  collection: (name: string) => ReturnType<typeof database.collection>;
};

const collection = database.collection(TUTOR_PROFILES_COLLECTION);
const env = createRuntimeEnvWithSessionRevocation(database);
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
const handlers = createTutorProfileManagementHandlers({
  collection,
  env,
  runTransaction
});

export const DELETE = handlers.DELETE_ITEM;
export const GET = handlers.GET_ITEM;
export const PATCH = handlers.PATCH_ITEM;
export const POST = handlers.POST_ITEM;
