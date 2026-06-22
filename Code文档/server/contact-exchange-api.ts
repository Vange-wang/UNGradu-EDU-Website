import { isTestLoginAllowed } from "@/features/auth/test-auth";
import {
  approveServerContactExchangeRequest,
  createServerContactExchangeRequest,
  listServerContactExchangeRequests,
  readServerAuthorizedContactProfiles,
  rejectServerContactExchangeRequest,
  withdrawServerContactExchangeRequest
} from "@/server/contact-exchange";

type ContactExchangeDependencies = Parameters<typeof createServerContactExchangeRequest>[0];

type RuntimeEnv = {
  NODE_ENV?: string;
  NEXT_PUBLIC_ALLOW_TEST_LOGIN?: string;
};

type ContactExchangeApiDependencies = Omit<
  ContactExchangeDependencies,
  "authenticatedUserId" | "conversationId"
> & {
  env?: RuntimeEnv;
};

type ContactExchangeActionBody =
  | {
      action: "create";
      conversationId: string;
      now?: string;
    }
  | {
      action: "approve";
      now?: string;
      requestId: string;
      secondConfirmation: boolean;
    }
  | {
      action: "reject" | "withdraw";
      now?: string;
      requestId: string;
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
      response: authFailure("必须登录后才能访问联系方式交换请求")
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

export function createContactExchangeApiHandlers({
  contactProfilesCollection,
  conversationsCollection,
  env = process.env,
  requestsCollection
}: ContactExchangeApiDependencies) {
  return {
    async GET(request: Request) {
      const auth = readTemporaryAuthenticatedUserId(request, env);

      if (!auth.ok) {
        return auth.response;
      }

      const url = new URL(request.url);
      const conversationId = url.searchParams.get("conversationId")?.trim();

      if (!conversationId) {
        return badRequest("缺少会话 ID");
      }

      if (url.searchParams.get("view") === "authorized-profiles") {
        const result = await readServerAuthorizedContactProfiles({
          authenticatedUserId: auth.authenticatedUserId,
          contactProfilesCollection,
          conversationId,
          conversationsCollection,
          requestsCollection
        });

        return jsonResponse(result, statusForResult(result));
      }

      const result = await listServerContactExchangeRequests({
        authenticatedUserId: auth.authenticatedUserId,
        contactProfilesCollection,
        conversationId,
        conversationsCollection,
        requestsCollection
      });

      return jsonResponse(result, statusForResult(result));
    },

    async POST(request: Request) {
      const auth = readTemporaryAuthenticatedUserId(request, env);

      if (!auth.ok) {
        return auth.response;
      }

      const body = await request.json() as Partial<ContactExchangeActionBody>;

      if (body.action === "create" && body.conversationId) {
        const result = await createServerContactExchangeRequest({
          authenticatedUserId: auth.authenticatedUserId,
          contactProfilesCollection,
          conversationId: body.conversationId,
          conversationsCollection,
          now: body.now,
          requestsCollection
        });

        return jsonResponse(result, statusForResult(result));
      }

      if (body.action === "approve" && body.requestId) {
        const result = await approveServerContactExchangeRequest({
          authenticatedUserId: auth.authenticatedUserId,
          contactProfilesCollection,
          conversationsCollection,
          now: body.now,
          requestId: body.requestId,
          requestsCollection,
          secondConfirmation: Boolean(body.secondConfirmation)
        });

        return jsonResponse(result, statusForResult(result));
      }

      if (body.action === "reject" && body.requestId) {
        const result = await rejectServerContactExchangeRequest({
          authenticatedUserId: auth.authenticatedUserId,
          contactProfilesCollection,
          conversationsCollection,
          now: body.now,
          requestId: body.requestId,
          requestsCollection
        });

        return jsonResponse(result, statusForResult(result));
      }

      if (body.action === "withdraw" && body.requestId) {
        const result = await withdrawServerContactExchangeRequest({
          authenticatedUserId: auth.authenticatedUserId,
          contactProfilesCollection,
          conversationsCollection,
          now: body.now,
          requestId: body.requestId,
          requestsCollection
        });

        return jsonResponse(result, statusForResult(result));
      }

      return badRequest("不支持的联系方式交换操作");
    }
  };
}
