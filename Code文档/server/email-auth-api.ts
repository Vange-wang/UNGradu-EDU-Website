import {
  jsonResponse,
  readAuthenticatedUserId,
  readJsonBody,
  type RuntimeEnv
} from "@/server/api-utils";
import {
  hashEmail,
  loginWithEmailPassword,
  markEmailLoginCodeUsed,
  resetEmailPasswordWithCode,
  sendEmailLoginCode,
  setEmailUserPassword,
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

type EmailAuthErrors = {
  code?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  request?: string;
};

function statusForEmailFailure(errors: EmailAuthErrors) {
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
        return jsonResponse(
          createEmailAuthFailure({ request: "登录服务暂时不可用，请稍后重试" }),
          503
        );
      }

      const consumed = await markEmailLoginCodeUsed({
        email: body.value.email ?? "",
        emailCodeCollection,
        now: now()
      });

      if (!consumed.ok) {
        return jsonResponse(consumed, statusForEmailFailure(consumed.errors));
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
    },

    async POST_PASSWORD_LOGIN(request: Request) {
      const body = await readJsonBody<{ email?: string; password?: string }>(request);

      if (!body.ok) {
        return body.response;
      }

      const result = await loginWithEmailPassword({
        email: body.value.email ?? "",
        now: now(),
        password: body.value.password ?? "",
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
        return jsonResponse(
          createEmailAuthFailure({ request: "登录服务暂时不可用，请稍后重试" }),
          503
        );
      }

      return Response.json(
        {
          ok: true,
          value: result.value,
          errors: {}
        },
        {
          headers: { "set-cookie": cookie },
          status: 200
        }
      );
    },

    async POST_SET_PASSWORD(request: Request) {
      const body = await readJsonBody<{
        email?: string;
        password?: string;
        passwordConfirm?: string;
      }>(request);

      if (!body.ok) {
        return body.response;
      }

      const auth = readAuthenticatedUserId(request, env);

      if (!auth.ok) {
        return auth.response;
      }

      const email = body.value.email ?? "";
      const expectedUserId = `email_${hashEmail(email.trim().toLowerCase()).slice(0, 24)}`;

      if (auth.authenticatedUserId !== expectedUserId) {
        return jsonResponse(
          createEmailAuthFailure({ request: "只能为当前登录邮箱设置密码" }),
          403
        );
      }

      const result = await setEmailUserPassword({
        email,
        now: now(),
        password: body.value.password ?? "",
        passwordConfirm: body.value.passwordConfirm ?? "",
        userCollection
      });

      return jsonResponse(
        result,
        result.ok ? 200 : statusForEmailFailure(result.errors)
      );
    },

    async POST_RESET_PASSWORD(request: Request) {
      const body = await readJsonBody<{
        code?: string;
        email?: string;
        password?: string;
        passwordConfirm?: string;
      }>(request);

      if (!body.ok) {
        return body.response;
      }

      const result = await resetEmailPasswordWithCode({
        code: body.value.code ?? "",
        email: body.value.email ?? "",
        emailCodeCollection,
        env,
        now: now(),
        password: body.value.password ?? "",
        passwordConfirm: body.value.passwordConfirm ?? "",
        userCollection
      });

      return jsonResponse(
        result,
        result.ok ? 200 : statusForEmailFailure(result.errors)
      );
    }
  };
}

function createEmailAuthFailure(errors: EmailAuthErrors) {
  return {
    ok: false as const,
    value: null,
    errors
  };
}
