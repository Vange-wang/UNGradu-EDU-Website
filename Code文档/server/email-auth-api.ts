import { apiError, jsonResponse, readJsonBody, type RuntimeEnv } from "@/server/api-utils";
import {
  sendEmailLoginCode,
  verifyEmailLoginCode,
  type EmailAuthCollection,
  type EmailDelivery
} from "@/server/email-auth";
import { createAuthSessionCookie } from "@/server/auth-session";

type EmailAuthApiDependencies = {
  codeGenerator?: () => string;
  emailCodeCollection: EmailAuthCollection;
  emailDelivery: EmailDelivery;
  env?: RuntimeEnv & { EMAIL_CODE_SECRET?: string };
  now?: () => Date;
  userCollection: EmailAuthCollection;
};

function statusForEmailFailure(errors: { code?: string; email?: string; request?: string }) {
  if (errors.request?.includes("频繁") || errors.request?.includes("次数过多")) {
    return 429;
  }

  if (errors.request?.includes("发送失败") || errors.request?.includes("未配置")) {
    return 503;
  }

  if (errors.request?.includes("账号暂不可用")) {
    return 403;
  }

  return 400;
}

export function createEmailAuthApiHandlers({
  codeGenerator,
  emailCodeCollection,
  emailDelivery,
  env = process.env,
  now = () => new Date(),
  userCollection
}: EmailAuthApiDependencies) {
  return {
    async POST_SEND_CODE(request: Request) {
      const body = await readJsonBody<{ email?: string }>(request);

      if (!body.ok) {
        return body.response;
      }

      const result = await sendEmailLoginCode({
        codeGenerator,
        email: body.value.email ?? "",
        emailCodeCollection,
        emailDelivery,
        env,
        now: now()
      });

      return jsonResponse(
        result,
        result.ok ? 200 : statusForEmailFailure(result.errors)
      );
    },

    async POST_LOGIN(request: Request) {
      const body = await readJsonBody<{ code?: string; email?: string }>(request);

      if (!body.ok) {
        return body.response;
      }

      const result = await verifyEmailLoginCode({
        code: body.value.code ?? "",
        email: body.value.email ?? "",
        emailCodeCollection,
        env,
        now: now(),
        userCollection
      });

      if (!result.ok) {
        return jsonResponse(result, statusForEmailFailure(result.errors));
      }

      const cookie = createAuthSessionCookie({
        emailMasked: result.value.emailMasked,
        env,
        userId: result.value.userId
      });

      if (!cookie) {
        return apiError(500, "Auth session secret is not configured.");
      }

      return Response.json(
        {
          ok: true,
          value: {
            createdAt: result.value.createdAt,
            emailMasked: result.value.emailMasked,
            lastLoginAt: result.value.lastLoginAt,
            userId: result.value.userId
          },
          errors: {}
        },
        {
          headers: { "set-cookie": cookie },
          status: 200
        }
      );
    }
  };
}
