import { isTestLoginAllowed } from "@/features/auth/test-auth";
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

type RuntimeEnv = {
  NODE_ENV?: string;
  NEXT_PUBLIC_ALLOW_TEST_LOGIN?: string;
};

type ConversationApiDependencies = Omit<
  ConversationDependencies,
  "authenticatedUserId" | "sourceId" | "sourceType"
> & {
  env?: RuntimeEnv;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function authFailure(message: string) {
  return jsonResponse(
    {
      ok: false,
      value: null,
      errors: { request: message }
    },
    401
  );
}

function readTemporaryAuthenticatedUserId(request: Request, env: RuntimeEnv) {
  const testUserPhone = request.headers.get("x-ungradu-test-user-phone")?.trim();

  if (!testUserPhone) {
    return {
      ok: false as const,
      response: authFailure("必须登录后才能访问会话")
    };
  }

  if (
    !isTestLoginAllowed({
      allowTestLogin: env.NEXT_PUBLIC_ALLOW_TEST_LOGIN,
      nodeEnv: env.NODE_ENV
    })
  ) {
    return {
      ok: false as const,
      response: authFailure("生产环境不接受临时测试登录身份")
    };
  }

  return {
    ok: true as const,
    authenticatedUserId: testUserPhone
  };
}

function statusForResult(result: { ok: boolean; errors?: { request?: string } }) {
  if (result.ok) {
    return 200;
  }

  return result.errors?.request?.includes("登录") ? 401 : 403;
}

function badRequest(message: string) {
  return jsonResponse(
    {
      ok: false,
      value: null,
      errors: { request: message }
    },
    400
  );
}

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

      return jsonResponse(result, statusForResult(result));
    },

    async POST_COLLECTION(request: Request) {
      const auth = readTemporaryAuthenticatedUserId(request, env);

      if (!auth.ok) {
        return auth.response;
      }

      const body = await request.json() as {
        now?: string;
        sourceId?: string;
        sourceType?: unknown;
      };

      if (!body.sourceId || !isSourceType(body.sourceType)) {
        return badRequest("缺少会话来源");
      }

      const result = await createOrReadServerConversationFromSource({
        ...dependencies,
        authenticatedUserId: auth.authenticatedUserId,
        now: body.now,
        sourceId: body.sourceId,
        sourceType: body.sourceType
      });

      return jsonResponse(result, statusForResult(result));
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

      return jsonResponse(result, statusForResult(result));
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

      return jsonResponse(result, statusForResult(result));
    },

    async POST_MESSAGES(request: Request, context: RouteContext) {
      const auth = readTemporaryAuthenticatedUserId(request, env);

      if (!auth.ok) {
        return auth.response;
      }

      const { id } = await context.params;
      const body = await request.json() as { now?: string; text?: string };
      const result = await sendServerConversationMessage({
        ...dependencies,
        authenticatedUserId: auth.authenticatedUserId,
        conversationId: id,
        now: body.now,
        text: body.text ?? ""
      });

      return jsonResponse(result, statusForResult(result));
    }
  };
}
