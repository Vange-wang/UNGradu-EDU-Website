import {
  apiError,
  jsonResponse,
  readJsonBody,
  readTemporaryAuthenticatedUserId,
  statusForResult,
  type RuntimeEnv
} from "@/server/api-utils";
import {
  createOrReadServerConversationFromSource,
  listServerConversationMessages,
  listServerConversationsForUser,
  readServerConversationForUser,
  sendServerConversationMessage,
  type ServerConversationSourceType
} from "@/server/conversations";

type ConversationDependencies =
  Parameters<typeof createOrReadServerConversationFromSource>[0];

type ConversationApiDependencies = Omit<
  ConversationDependencies,
  "authenticatedUserId" | "sourceId" | "sourceType"
> & {
  env?: RuntimeEnv;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isSourceType(value: unknown): value is ServerConversationSourceType {
  return value === "parent-need" || value === "tutor-profile";
}

export function createConversationApiHandlers({
  conversationsCollection,
  env = process.env,
  messagesCollection,
  parentNeedsCollection,
  tutorProfilesCollection
}: ConversationApiDependencies) {
  const dependencies = {
    conversationsCollection,
    messagesCollection,
    parentNeedsCollection,
    tutorProfilesCollection
  };

  return {
    async GET_COLLECTION(request: Request) {
      const auth = readTemporaryAuthenticatedUserId(request, env);

      if (!auth.ok) {
        return auth.response;
      }

      const result = await listServerConversationsForUser({
        ...dependencies,
        authenticatedUserId: auth.authenticatedUserId
      });

      return jsonResponse(result, statusForResult(result, 403));
    },

    async POST_COLLECTION(request: Request) {
      const auth = readTemporaryAuthenticatedUserId(request, env);

      if (!auth.ok) {
        return auth.response;
      }

      const body = await readJsonBody<{
        now?: string;
        sourceId?: string;
        sourceType?: unknown;
      }>(request);

      if (!body.ok) {
        return body.response;
      }

      if (!body.value.sourceId || !isSourceType(body.value.sourceType)) {
        return apiError(400, "Missing conversation source.");
      }

      const result = await createOrReadServerConversationFromSource({
        ...dependencies,
        authenticatedUserId: auth.authenticatedUserId,
        now: body.value.now,
        sourceId: body.value.sourceId,
        sourceType: body.value.sourceType
      });

      return jsonResponse(result, statusForResult(result, 403));
    },

    async GET_ITEM(request: Request, context: RouteContext) {
      const auth = readTemporaryAuthenticatedUserId(request, env);

      if (!auth.ok) {
        return auth.response;
      }

      const { id } = await context.params;
      const result = await readServerConversationForUser({
        ...dependencies,
        authenticatedUserId: auth.authenticatedUserId,
        conversationId: id
      });

      return jsonResponse(result, statusForResult(result, 403));
    },

    async GET_MESSAGES(request: Request, context: RouteContext) {
      const auth = readTemporaryAuthenticatedUserId(request, env);

      if (!auth.ok) {
        return auth.response;
      }

      const { id } = await context.params;
      const result = await listServerConversationMessages({
        ...dependencies,
        authenticatedUserId: auth.authenticatedUserId,
        conversationId: id
      });

      return jsonResponse(result, statusForResult(result, 403));
    },

    async POST_MESSAGES(request: Request, context: RouteContext) {
      const auth = readTemporaryAuthenticatedUserId(request, env);

      if (!auth.ok) {
        return auth.response;
      }

      const { id } = await context.params;
      const body = await readJsonBody<{ now?: string; text?: string }>(request);

      if (!body.ok) {
        return body.response;
      }

      const result = await sendServerConversationMessage({
        ...dependencies,
        authenticatedUserId: auth.authenticatedUserId,
        conversationId: id,
        now: body.value.now,
        text: body.value.text ?? ""
      });

      return jsonResponse(result, statusForResult(result, 403));
    }
  };
}
