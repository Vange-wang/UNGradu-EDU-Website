import { createConversationApiHandlers } from "@/server/conversation-api";
import {
  CONVERSATION_MESSAGES_COLLECTION,
  CONVERSATIONS_COLLECTION
} from "@/server/conversations";
import { createCloudBaseServerApp } from "@/server/cloudbase-server";

const database = createCloudBaseServerApp().database();

const handlers = createConversationApiHandlers({
  conversationsCollection: database.collection(CONVERSATIONS_COLLECTION),
  messagesCollection: database.collection(CONVERSATION_MESSAGES_COLLECTION),
  parentNeedsCollection: database.collection("parent_needs"),
  tutorProfilesCollection: database.collection("tutor_profiles")
});

export const GET = handlers.GET_COLLECTION;
export const POST = handlers.POST_COLLECTION;
