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
  type EmailChallengeReplayGuard,
  type EmailChallengeVerifier
} from "@/server/security/email-challenge";
import {
  createEmailSendRateLimitKeys,
  createLayeredRateLimiter
} from "@/server/security/rate-limit";
import { resolveTrustedRequestKeys } from "@/server/security/request-guard";
import { normalizeOriginVerificationMode } from "@/server/origin-request-verification";

type EmailAuthApiDependencies = {
  codeGenerator?: () => string;
  challengeReplayGuard?: EmailChallengeReplayGuard;
  challengeVerifier?: EmailChallengeVerifier;
  emailCodeCollection: EmailAuthCollection;
  emailDelivery: EmailDelivery;
  env?: RuntimeEnv & {
    EMAIL_CODE_SECRET?: string;
    ORIGIN_VERIFY_SECRET?: string;
  };
  now?: () => Date;
  rateLimiter?: ReturnType<typeof createLayeredRateLimiter>;
  resolveTrustedClientIp?: (request: Request) => string | undefined;
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

const EMAIL_CHALLENGE_VERIFY_TIMEOUT_MS = 5_000;

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
  const unavailable = reason === "config-missing" || reason === "secret-missing" || reason === "timeout" || reason === "unavailable" || reason === "unreachable";
  return {
    status: unavailable ? 503 : 403,
    result: {
      errors: { request: "人机验证未通过，请稍后重试" },
      ok: false as const,
      value: null
    }
  };
}

function passwordLoginGuardFailure(response: Response) {
  if (response.headers.get("content-type")?.includes("application/json")) {
    return response;
  }
  const headers = new Headers({ "Cache-Control": "no-store" });
  const correlationId = response.headers.get("x-correlation-id");
  if (correlationId) headers.set("x-correlation-id", correlationId);
  return Response.json(
    {
      errors: { request: "请求来源校验失败，请重试" },
      ok: false as const,
      value: null
    },
    { headers, status: response.status }
  );
}

export function createEmailAuthApiHandlers({
  codeGenerator,
  challengeReplayGuard,
  challengeVerifier,
  emailCodeCollection,
  emailDelivery,
  env = process.env,
  now = () => new Date(),
  rateLimiter,
  resolveTrustedClientIp,
  requireAtomicCodeConsume = false,
  requireChallenge = false,
  runTransaction,
  userCollection
}: EmailAuthApiDependencies) {
  env = createSecurityRuntimeEnv(env);
  const consumedChallengeTokens = new Set<string>();

  async function checkRateLimit(
    request: Request,
    email: string,
    actionKey: string,
    sessionUserId?: string
  ) {
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
      const serverDeviceKey = [
        request.headers.get("user-agent")?.trim().slice(0, 256),
        request.headers.get("accept-language")?.trim().slice(0, 128)
      ].filter(Boolean).join("|") || "unknown-device";
      let limited: Awaited<ReturnType<typeof rateLimiter.check>>;
      try {
        const production = env.APP_ENV === "production" || env.NODE_ENV === "production";
        const trustedProxyIp = actionKey === "email-send-code"
          ? resolveTrustedClientIp?.(request)?.trim().slice(0, 64)
          : request.headers.get("cf-connecting-ip")?.trim().slice(0, 64) ||
            env.TRUSTED_PROXY_IP;
        const trustedKeys = resolveTrustedRequestKeys({
          serverProxyIp: trustedProxyIp,
          sessionUserId
        });
        const keys = actionKey === "email-send-code"
          ? createEmailSendRateLimitKeys({
              email,
              environmentRef: env.APP_ENV ?? env.NODE_ENV ?? "local",
              keySecret: env.AUTH_RATE_LIMIT_KEY_SECRET?.trim() ||
                (production ? "" : "local-synthetic-rate-limit-key"),
              keyVersion: "v1",
              trustedProxyIp,
              userAgent: serverDeviceKey
            })
          : {
              accountKey: hashEmail(email.trim().toLowerCase()),
              actionKey,
              deviceKey: sessionUserId
                ? trustedKeys.deviceKey
                : `device:${serverDeviceKey}`,
              ipKey: trustedKeys.ipKey,
              sessionKey: sessionUserId ? trustedKeys.sessionKey : undefined
            };
        limited = await rateLimiter.check(keys);
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

    const configuredHostnames = (challengeVerifier.expectedHostnames ?? [])
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean);
    if (
      expectedAction === "email_send_code" &&
      (configuredHostnames.length === 0 || configuredHostnames.includes("*"))
    ) {
      const failure = challengeFailure("config-missing");
      return jsonResponse(failure.result, failure.status);
    }
    const hostname = expectedAction === "email_send_code"
      ? configuredHostnames[0] ?? ""
      : (() => {
          try {
            return new URL(request.url).hostname;
          } catch {
            return "";
          }
        })();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const timedOut = new Promise<Awaited<ReturnType<typeof verifyEmailChallenge>>>((resolve) => {
      timeout = setTimeout(
        () => resolve({ ok: false, reason: "timeout" }),
        EMAIL_CHALLENGE_VERIFY_TIMEOUT_MS
      );
    });
    const verification = verifyEmailChallenge({
      expectedAction,
      expectedHostname: hostname,
      now: now(),
      token,
      verifier: challengeVerifier
    });
    const challenge = await Promise.race([timedOut, verification]);
    if (timeout) clearTimeout(timeout);

    if (!challenge.ok) {
      const failure = challengeFailure(challenge.reason);
      return jsonResponse(failure.result, failure.status);
    }

    const production = env.APP_ENV === "production" || env.NODE_ENV === "production";
    if (production) {
      if (!challengeReplayGuard || !challenge.expiresAt) {
        return jsonResponse(challengeFailure("unreachable").result, 503);
      }
      let consumed: Awaited<ReturnType<EmailChallengeReplayGuard["consume"]>>;
      try {
        consumed = await challengeReplayGuard.consume({
          action: expectedAction,
          expiresAt: new Date(challenge.expiresAt),
          token: token?.trim() ?? ""
        });
      } catch {
        consumed = { ok: false, reason: "unavailable" };
      }
      if (!consumed.ok) {
        const failure = challengeFailure(consumed.reason);
        return jsonResponse(failure.result, failure.status);
      }
    } else if (!challenge.providerEnforcesSingleUse) {
      const tokenId = challenge.tokenId || token?.trim() || "";
      if (!tokenId || consumedChallengeTokens.has(tokenId)) {
        const failure = challengeFailure("replay");
        return jsonResponse(failure.result, failure.status);
      }
      consumedChallengeTokens.add(tokenId);
    }
    return null;
  }

  return {
    async POST_SEND_CODE(request: Request) {
      const production = env.APP_ENV === "production" || env.NODE_ENV === "production";
      const originVerificationMode = normalizeOriginVerificationMode(env.ORIGIN_VERIFY_MODE, {
        appEnv: env.APP_ENV,
        nodeEnv: env.NODE_ENV
      });
      if (
        production &&
        (
          !env.ALLOWED_ORIGINS?.trim() ||
          !env.ORIGIN_VERIFY_SECRET?.trim() ||
          !env.CSRF_SECRET?.trim() ||
          originVerificationMode !== "enforce"
        )
      ) {
        return Response.json(
          {
            errors: { request: "请求保护配置暂不可用，请稍后重试" },
            ok: false,
            value: null
          },
          {
            headers: { "Cache-Control": "no-store" },
            status: 503
          }
        );
      }
      const securityResponse = guardWriteRequest(
        request,
        {
          ...env,
          anonymousAntiAbuse: requireChallenge
            ? {
                available: Boolean(challengeVerifier),
                verify: () => true
              }
            : env.anonymousAntiAbuse
        },
        undefined,
        { allowAnonymous: true }
      );
      if (securityResponse) return passwordLoginGuardFailure(securityResponse);

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

      const challengeResponse = await verifyChallengeForRequest(
        request,
        body.value.challengeToken,
        "email_send_code"
      );
      if (challengeResponse) return challengeResponse;

      const rateLimitResponse = await checkRateLimit(
        request,
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

      const securityResponse = guardWriteRequest(
        request,
        {
          ...env,
          anonymousAntiAbuse: {
            available: Boolean(rateLimiter),
            verify: () => Boolean(rateLimiter)
          }
        },
        undefined,
        { allowAnonymous: true }
      );
      if (securityResponse) return securityResponse;

      const rateLimitResponse = await checkRateLimit(
        request,
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

      const securityResponse = guardWriteRequest(
        request,
        {
          ...env,
          anonymousAntiAbuse: requireChallenge
            ? {
                available: Boolean(challengeVerifier),
                verify: () => true
              }
            : env.anonymousAntiAbuse
        },
        undefined,
        { allowAnonymous: true }
      );
      if (securityResponse) return passwordLoginGuardFailure(securityResponse);

      const challengeResponse = await verifyChallengeForRequest(
        request,
        body.value.challengeToken,
        "password_login"
      );
      if (challengeResponse) return challengeResponse;

      const rateLimitResponse = await checkRateLimit(
        request,
        body.value.email ?? "",
        "password-login"
      );
      if (rateLimitResponse) return rateLimitResponse;

      if (
        (env.APP_ENV === "production" || env.NODE_ENV === "production") &&
        !env.AUTH_SESSION_SECRET?.trim()
      ) {
        return jsonResponse(
          createEmailAuthFailure({ request: "登录服务暂时不可用，请稍后重试" }),
          503
        );
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
      const rateLimitResponse = await checkRateLimit(
        request,
        email,
        "password-set",
        auth.authenticatedUserId
      );
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

      const rateLimitResponse = await checkRateLimit(
        request,
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
