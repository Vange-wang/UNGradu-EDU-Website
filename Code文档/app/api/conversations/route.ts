import { createConversationApiHandlers } from "@/server/conversation-api";
import {
  CONVERSATION_MESSAGES_COLLECTION,
  CONVERSATIONS_COLLECTION
} from "@/server/conversations";
import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { createRuntimeEnvWithSessionRevocation } from "@/server/api-utils";

type RouteHandlers = ReturnType<typeof createConversationApiHandlers>;

let handlers: RouteHandlers | undefined;

function getHandlers() {
  if (!handlers) {
    const database = createCloudBaseServerApp().database();
    handlers = createConversationApiHandlers({
      conversationsCollection: database.collection(CONVERSATIONS_COLLECTION),
      messagesCollection: database.collection(CONVERSATION_MESSAGES_COLLECTION),
      parentNeedsCollection: database.collection("parent_needs"),
      tutorProfilesCollection: database.collection("tutor_profiles"),
      env: createRuntimeEnvWithSessionRevocation(database)
    });
  }
  return handlers;
}

export const GET: RouteHandlers["GET_COLLECTION"] = (...args) =>
  getHandlers().GET_COLLECTION(...args);
export const POST: RouteHandlers["POST_COLLECTION"] = (...args) =>
  getHandlers().POST_COLLECTION(...args);
