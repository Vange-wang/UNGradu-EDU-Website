import { apiError, jsonResponse, readJsonBody, type RuntimeEnv } from "@/server/api-utils";
import {
  sendSmsLoginCode,
  verifySmsLoginCode,
  type SmsAuthCollection,
  type SmsDelivery
} from "@/server/sms-auth";
import { createAuthSessionCookie } from "@/server/auth-session";

type SmsAuthApiDependencies = {
  codeGenerator?: () => string;
  env?: RuntimeEnv & { SMS_CODE_SECRET?: string };
  now?: () => Date;
  smsCodeCollection: SmsAuthCollection;
  smsDelivery: SmsDelivery;
  userCollection: SmsAuthCollection;
};

function statusForSmsFailure(errors: { code?: string; phone?: string; request?: string }) {
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

export function createSmsAuthApiHandlers({
  codeGenerator,
  env = process.env,
  now = () => new Date(),
  smsCodeCollection,
  smsDelivery,
  userCollection
}: SmsAuthApiDependencies) {
  return {
    async POST_SEND_CODE(request: Request) {
      const body = await readJsonBody<{ phone?: string }>(request);

      if (!body.ok) {
        return body.response;
      }

      const result = await sendSmsLoginCode({
        codeGenerator,
        env,
        now: now(),
        phone: body.value.phone ?? "",
        smsCodeCollection,
        smsDelivery
      });

      return jsonResponse(
        result,
        result.ok ? 200 : statusForSmsFailure(result.errors)
      );
    },

    async POST_LOGIN(request: Request) {
      const body = await readJsonBody<{ code?: string; phone?: string }>(request);

      if (!body.ok) {
        return body.response;
      }

      const result = await verifySmsLoginCode({
        code: body.value.code ?? "",
        env,
        now: now(),
        phone: body.value.phone ?? "",
        smsCodeCollection,
        userCollection
      });

      if (!result.ok) {
        return jsonResponse(result, statusForSmsFailure(result.errors));
      }

      const cookie = createAuthSessionCookie({
        env,
        phone: result.value.phone
      });

      if (!cookie) {
        return apiError(500, "Auth session secret is not configured.");
      }

      return Response.json(
        {
          ok: true,
          value: {
            createdAt: result.value.createdAt,
            lastLoginAt: result.value.lastLoginAt,
            phoneMasked: result.value.phoneMasked,
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
