import {
  guardWriteRequest,
  jsonResponse,
  readAuthenticatedUserIdWithRevocation,
  readJsonBody,
  createSecurityRuntimeEnv,
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
  type EmailAuthAtomicTransactionRunner,
  type EmailDelivery
} from "@/server/email-auth";
import { createAuthSessionCookie } from "@/server/auth-session";
import {
  verifyEmailChallenge,
  type EmailChallengeVerifier
} from "@/server/security/email-challenge";
import { createLayeredRateLimiter } from "@/server/security/rate-limit";
import { resolveTrustedRequestKeys } from "@/server/security/request-guard";

type EmailAuthApiDependencies = {
  codeGenerator?: () => string;
  challengeVerifier?: EmailChallengeVerifier;
  emailCodeCollection: EmailAuthCollection;
  emailDelivery: EmailDelivery;
  env?: RuntimeEnv & { EMAIL_CODE_SECRET?: string };
  now?: () => Date;
  rateLimiter?: ReturnType<typeof createLayeredRateLimiter>;
  requireAtomicCodeConsume?: boolean;
  requireChallenge?: boolean;
  runTransaction?: EmailAuthAtomicTransactionRunner;
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

  if (
    errors.request?.includes("发送失败") ||
    errors.request?.includes("未配置") ||
    errors.request?.includes("原子消费暂不可用")
  ) {
    return 503;
  }

  if (errors.request?.includes("账号暂不可用")) {
    return 403;
  }

  return 400;
}

function challengeFailure(reason: string) {
  const unavailable = reason === "secret-missing" || reason === "timeout" || reason === "unreachable";
  return {
    status: unavailable ? 503 : 403,
    result: {
      errors: { request: "人机验证未通过，请稍后重试" },
      ok: false as const,
      value: null
    }
  };
}

export function createEmailAuthApiHandlers({
  codeGenerator,
  challengeVerifier,
  emailCodeCollection,
  emailDelivery,
  env = process.env,
  now = () => new Date(),
  rateLimiter,
  requireAtomicCodeConsume = false,
  requireChallenge = false,
  runTransaction,
  userCollection
}: EmailAuthApiDependencies) {
  env = createSecurityRuntimeEnv(env);
  const consumedChallengeTokens = new Set<string>();

  function checkRateLimit(email: string, actionKey: string) {
    if (rateLimiter) {
      if (
        (env.APP_ENV === "production" || env.NODE_ENV === "production") &&
        rateLimiter.mode !== "production"
      ) {
        return jsonResponse(
          { errors: { request: "限流服务暂不可用，请稍后再试" }, ok: false, value: null },
          503
        );
      }
      const trustedKeys = resolveTrustedRequestKeys({
        serverProxyIp: env.TRUSTED_PROXY_IP,
        sessionUserId: undefined
      });
      let limited: ReturnType<typeof rateLimiter.check>;
      try {
        limited = rateLimiter.check({
          accountKey: hashEmail(email.trim().toLowerCase()),
          actionKey,
          deviceKey: trustedKeys.deviceKey,
          ipKey: trustedKeys.ipKey,
          sessionKey: trustedKeys.sessionKey
        });
      } catch {
        return jsonResponse(
          { errors: { request: "限流服务暂不可用，请稍后再试" }, ok: false, value: null },
          503
        );
      }
      if (!limited.ok && limited.reason === "unavailable") {
        return jsonResponse(
          { errors: { request: "限流服务暂不可用，请稍后再试" }, ok: false, value: null },
          503
        );
      }
      if (!limited.ok) {
        return jsonResponse(
          { errors: { request: "请求过于频繁，请稍后再试" }, ok: false, value: null },
          429
        );
      }
      return null;
    }

    if (env.APP_ENV === "production" || env.NODE_ENV === "production") {
      return jsonResponse(
        { errors: { request: "限流服务暂不可用，请稍后再试" }, ok: false, value: null },
        503
      );
    }

    return null;
  }

  async function verifyChallengeForRequest(
    request: Request,
    token: string | undefined,
    expectedAction: "email_send_code" | "password_login"
  ) {
    if (!requireChallenge) return null;
    if (!challengeVerifier) {
      return jsonResponse(challengeFailure("secret-missing").result, 503);
    }

    const hostname = (() => {
      try {
        return new URL(request.url).hostname;
      } catch {
        return "";
      }
    })();
    const challenge = await verifyEmailChallenge({
      expectedAction,
      expectedHostname: hostname,
      now: now(),
      token,
      verifier: challengeVerifier
    });

    if (!challenge.ok) {
      const failure = challengeFailure(challenge.reason);
      return jsonResponse(failure.result, failure.status);
    }

    const tokenId = challenge.tokenId || token?.trim() || "";
    if (!tokenId || consumedChallengeTokens.has(tokenId)) {
      const failure = challengeFailure("replay");
      return jsonResponse(failure.result, failure.status);
    }
    consumedChallengeTokens.add(tokenId);
    return null;
  }

  return {
    async POST_SEND_CODE(request: Request) {
      const body = await readJsonBody<{ challengeToken?: string; email?: string }>(request, {
        allowedKeys: ["challengeToken", "email"],
        schema: {
          challengeToken: { type: "string" },
          email: { type: "string" }
        }
      });

      if (!body.ok) {
        return body.response;
      }

      const securityResponse = guardWriteRequest(request, env, body.value.email?.trim().toLowerCase());
      if (securityResponse) return securityResponse;

      const challengeResponse = await verifyChallengeForRequest(
        request,
        body.value.challengeToken,
        "email_send_code"
      );
      if (challengeResponse) return challengeResponse;

      const rateLimitResponse = checkRateLimit(
        body.value.email ?? "",
        "email-send-code"
      );
      if (rateLimitResponse) return rateLimitResponse;

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
      const body = await readJsonBody<{ challengeToken?: string; code?: string; email?: string }>(request, {
        allowedKeys: ["challengeToken", "code", "email"],
        schema: {
          challengeToken: { type: "string" },
          code: { type: "string" },
          email: { type: "string" }
        }
      });

      if (!body.ok) {
        return body.response;
      }

      const securityResponse = guardWriteRequest(request, env, body.value.email?.trim().toLowerCase());
      if (securityResponse) return securityResponse;

      const rateLimitResponse = checkRateLimit(
        body.value.email ?? "",
        "email-login-code"
      );
      if (rateLimitResponse) return rateLimitResponse;

      if (requireAtomicCodeConsume && !runTransaction) {
        return jsonResponse(
          { errors: { request: "验证码原子消费暂不可用，请稍后再试" }, ok: false, value: null },
          503
        );
      }

      const result = await verifyEmailLoginCode({
        code: body.value.code ?? "",
        email: body.value.email ?? "",
        emailCodeCollection,
        env,
        now: now(),
        userCollection,
        consumeCode: requireAtomicCodeConsume,
        requireTransaction: requireAtomicCodeConsume,
        runTransaction
      });

      if (!result.ok) {
        return jsonResponse(result, statusForEmailFailure(result.errors));
      }

      const cookie = createAuthSessionCookie({
        emailMasked:
          typeof result.value.emailMasked === "string"
            ? result.value.emailMasked
            : undefined,
        env,
        userId:
          typeof result.value.userId === "string" ? result.value.userId : undefined
      });

      if (!cookie) {
        return jsonResponse(
          createEmailAuthFailure({ request: "登录服务暂时不可用，请稍后重试" }),
          503
        );
      }

      if (!requireAtomicCodeConsume) {
        const consumed = await markEmailLoginCodeUsed({
          email: body.value.email ?? "",
          emailCodeCollection,
          now: now()
        });
        if (!consumed.ok) {
          return jsonResponse(consumed, statusForEmailFailure(consumed.errors));
        }
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
      const body = await readJsonBody<{ challengeToken?: string; email?: string; password?: string }>(request, {
        allowedKeys: ["challengeToken", "email", "password"],
        schema: {
          challengeToken: { type: "string" },
          email: { type: "string" },
          password: { type: "string" }
        }
      });

      if (!body.ok) {
        return body.response;
      }

      const securityResponse = guardWriteRequest(request, env, body.value.email?.trim().toLowerCase());
      if (securityResponse) return securityResponse;

      const challengeResponse = await verifyChallengeForRequest(
        request,
        body.value.challengeToken,
        "password_login"
      );
      if (challengeResponse) return challengeResponse;

      const rateLimitResponse = checkRateLimit(
        body.value.email ?? "",
        "password-login"
      );
      if (rateLimitResponse) return rateLimitResponse;

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
      }>(request, {
        allowedKeys: ["email", "password", "passwordConfirm"],
        schema: {
          email: { type: "string" },
          password: { type: "string" },
          passwordConfirm: { type: "string" }
        }
      });

      if (!body.ok) {
        return body.response;
      }

      const auth = await readAuthenticatedUserIdWithRevocation(request, env);

      if (!auth.ok) {
        return auth.response;
      }

      const securityResponse = guardWriteRequest(request, env, auth.authenticatedUserId);
      if (securityResponse) return securityResponse;

      const email = body.value.email ?? "";
      const rateLimitResponse = checkRateLimit(email, "password-set");
      if (rateLimitResponse) return rateLimitResponse;

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
      }>(request, {
        allowedKeys: ["code", "email", "password", "passwordConfirm"],
        schema: {
          code: { type: "string" },
          email: { type: "string" },
          password: { type: "string" },
          passwordConfirm: { type: "string" }
        }
      });

      if (!body.ok) {
        return body.response;
      }

      const securityResponse = guardWriteRequest(request, env, body.value.email?.trim().toLowerCase());
      if (securityResponse) return securityResponse;

      const rateLimitResponse = checkRateLimit(
        body.value.email ?? "",
        "password-reset"
      );
      if (rateLimitResponse) return rateLimitResponse;

      const result = await resetEmailPasswordWithCode({
        code: body.value.code ?? "",
        email: body.value.email ?? "",
        emailCodeCollection,
        env,
        now: now(),
        password: body.value.password ?? "",
        passwordConfirm: body.value.passwordConfirm ?? "",
        userCollection,
        requireTransaction: requireAtomicCodeConsume,
        runTransaction
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
