import type { RiskFeedbackInput } from "@/features/feedback/risk-feedback";
import {
  guardWriteRequest,
  apiError,
  jsonResponse,
  readJsonBody,
  readAuthenticatedUserIdWithRevocation,
  readOptionalAuthenticatedUserIdWithRevocation,
  statusForResult,
  createSecurityRuntimeEnv,
  type RuntimeEnv
} from "@/server/api-utils";
import {
  listServerRiskFeedbackForOwner,
  saveServerRiskFeedback
} from "@/server/risk-feedback";

type RiskFeedbackCollection =
  Parameters<typeof saveServerRiskFeedback>[0]["collection"] &
  Parameters<typeof listServerRiskFeedbackForOwner>[0]["collection"];

export function createRiskFeedbackApiHandlers({
  collection,
  env = process.env
}: {
  collection: RiskFeedbackCollection;
  env?: RuntimeEnv;
}) {
  const securedEnv = createSecurityRuntimeEnv(env);
  return {
    async GET(request: Request) {
      // Listing is never anonymous: use the same revocation-aware guard as
      // other authenticated reads and scope the query to that subject only.
      const auth = await readAuthenticatedUserIdWithRevocation(request, securedEnv);

      if (!auth.ok) {
        // Keep the feedback product contract's explicit copy for anonymous
        // reads while preserving the shared 503 revocation-unavailable path.
        if (auth.response.status === 401) {
          return apiError(401, "登录后才能查看自己的反馈记录。");
        }
        return auth.response;
      }

      const result = await listServerRiskFeedbackForOwner({
        authenticatedUserId: auth.authenticatedUserId,
        collection
      }).catch(() => ({
        ok: false as const,
        value: null,
        errors: { request: "反馈记录读取失败，请稍后重试。" }
      }));

      return jsonResponse(result, result.errors.request ? 500 : statusForResult(result, 400));
    },

    async POST(request: Request) {
      const auth = await readOptionalAuthenticatedUserIdWithRevocation(request, securedEnv);

      if (!auth.ok) {
        return auth.response;
      }

      const securityResponse = guardWriteRequest(request, securedEnv, auth.authenticatedUserId, {
        allowAnonymous: true
      });
      if (securityResponse) return securityResponse;

      const body = await readJsonBody<RiskFeedbackInput>(request, {
        allowedKeys: ["category", "targetType", "targetReference", "description", "evidenceNote", "contactMethod", "sourcePage"],
        maxStringLength: 2000,
        schema: {
          category: { type: "string" },
          targetType: { type: "string" },
          targetReference: { type: "string" },
          description: { type: "string" },
          evidenceNote: { type: "string" },
          contactMethod: { type: "string" },
          sourcePage: { type: "string" }
        }
      });

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
