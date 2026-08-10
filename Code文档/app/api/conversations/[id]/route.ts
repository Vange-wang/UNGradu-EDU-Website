import { createConversationApiHandlers } from "@/server/conversation-api";
import {
  CONVERSATION_MESSAGES_COLLECTION,
  CONVERSATIONS_COLLECTION
} from "@/server/conversations";
import { createCloudBaseServerApp } from "@/server/cloudbase-server";
import { createRuntimeEnvWithSessionRevocation } from "@/server/api-utils";

const database = createCloudBaseServerApp().database();
const env = createRuntimeEnvWithSessionRevocation(database);

const handlers = createConversationApiHandlers({
  conversationsCollection: database.collection(CONVERSATIONS_COLLECTION),
  messagesCollection: database.collection(CONVERSATION_MESSAGES_COLLECTION),
  parentNeedsCollection: database.collection("parent_needs"),
  tutorProfilesCollection: database.collection("tutor_profiles"),
  env
});

export const GET = handlers.GET_ITEM;
