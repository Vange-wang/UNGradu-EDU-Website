import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { CONTACT_EXCHANGE_REQUESTS_COLLECTION } from "@/server/contact-exchange";
import { CONVERSATIONS_COLLECTION } from "@/server/conversations";
import {
  TUTOR_PROFILES_COLLECTION,
  type TutorProfileLifecycleTransactionRunner
} from "@/server/tutor-profiles";
import { createTutorProfileManagementHandlers } from "../management-handlers";
import { createRuntimeEnvWithSessionRevocation } from "@/server/api-utils";
import { createContactReviewRuntime } from "@/server/security/contact-review-runtime";
import type { CloudBaseContactReviewDatabase } from "@/server/security/contact-review-cloudbase";

type RouteHandlers = ReturnType<typeof createTutorProfileManagementHandlers>;

let handlers: RouteHandlers | undefined;

function getHandlers() {
  if (!handlers) {
    const database = createCloudBaseServerApp().database();
    type TransactionLike = {
      collection: (name: string) => ReturnType<typeof database.collection>;
    };
    const collection = database.collection(TUTOR_PROFILES_COLLECTION);
    const env = createRuntimeEnvWithSessionRevocation(database);
    const contactReviewRuntime = createContactReviewRuntime({
      database: database as unknown as CloudBaseContactReviewDatabase,
      entityType: "tutor_profile",
      env
    });
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
    handlers = createTutorProfileManagementHandlers({
      collection,
      contactReview: contactReviewRuntime.integration,
      contactReviewGate: contactReviewRuntime.gate,
      env,
      runTransaction
    });
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
