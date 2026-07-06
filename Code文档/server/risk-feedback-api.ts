import { isTestLoginAllowed } from "@/features/auth/test-auth";
import type { RiskFeedbackInput } from "@/features/feedback/risk-feedback";
import {
  apiError,
  jsonResponse,
  readJsonBody,
  statusForResult,
  type RuntimeEnv
} from "@/server/api-utils";
import { readAuthSessionFromRequest } from "@/server/auth-session";
import { saveServerRiskFeedback } from "@/server/risk-feedback";

type RiskFeedbackCollection = Parameters<typeof saveServerRiskFeedback>[0]["collection"];

function readOptionalAuthenticatedUserId(request: Request, env: RuntimeEnv) {
  const session = readAuthSessionFromRequest(request, env);

  if (session) {
    return {
      ok: true as const,
      authenticatedUserId: session.userId ?? session.phone ?? null
    };
  }

  const testUserPhone = request.headers.get("x-ungradu-test-user-phone")?.trim();

  if (!testUserPhone) {
    return {
      ok: true as const,
      authenticatedUserId: null
    };
  }

  if (
    !isTestLoginAllowed({
      allowTestLogin: env.NEXT_PUBLIC_ALLOW_TEST_LOGIN,
      allowHostedTestLogin: env.M5_ENABLE_HOSTED_TEST_LOGIN,
      appEnv: env.APP_ENV,
      nodeEnv: env.NODE_ENV
    })
  ) {
    return {
      ok: false as const,
      response: apiError(
        401,
        "Production does not accept temporary test login identity."
      )
    };
  }

  return {
    ok: true as const,
    authenticatedUserId: testUserPhone
  };
}

export function createRiskFeedbackApiHandlers({
  collection,
  env = process.env
}: {
  collection: RiskFeedbackCollection;
  env?: RuntimeEnv;
}) {
  return {
    async POST(request: Request) {
      const auth = readOptionalAuthenticatedUserId(request, env);

      if (!auth.ok) {
        return auth.response;
      }

      const body = await readJsonBody<RiskFeedbackInput>(request);

      if (!body.ok) {
        return body.response;
      }

      const result = await saveServerRiskFeedback({
        collection,
        input: body.value,
        submittedByUserId: auth.authenticatedUserId
      }).catch(() => ({
        ok: false as const,
        value: null,
        errors: { request: "反馈提交失败，请稍后重试。" }
      }));

      return jsonResponse(result, result.errors.request ? 500 : statusForResult(result, 400));
    }
  };
}
