import type { TutorProfileInput } from "@/features/tutor-profiles/tutor-profile";
import {
  apiError,
  guardWriteRequest,
  jsonResponse,
  readAuthenticatedUserIdWithRevocation,
  readJsonBody,
  createSecurityRuntimeEnv,
  type RuntimeEnv
} from "@/server/api-utils";
import {
  deleteServerTutorProfile,
  findPublicServerTutorProfileById,
  readServerTutorProfileForOwner,
  restoreServerTutorProfile,
  saveServerTutorProfile,
  TUTOR_PROFILE_NOT_FOUND_MESSAGE,
  updateServerTutorProfile,
  type TutorProfileLifecycleTransactionRunner
} from "@/server/tutor-profiles";

type TutorProfileCollection = Parameters<typeof saveServerTutorProfile>[0]["collection"];
type RouteContext = { params: Promise<{ id: string }> };
type VersionedBody = { version?: number };
type RestoreBody = VersionedBody & { action?: string };

const tutorProfileBodyLimits = {
  allowedKeys: ["gender", "school", "major", "subjects", "grades", "timeSlots", "feeRanges", "abilityDescription", "proofImages", "version", "action"],
  maxArrayLength: 64,
  maxStringLength: 10000,
  schema: {
    gender: { type: "string" as const }, school: { type: "string" as const }, major: { type: "string" as const },
    subjects: { type: "array" as const, items: { type: "string" as const } },
    grades: { type: "array" as const, items: { type: "string" as const } },
    timeSlots: { type: "array" as const, items: { type: "string" as const } },
    feeRanges: { type: "array" as const, items: { object: { allowedKeys: ["grade", "subject", "min", "max"], fields: { grade: { type: "string" as const }, subject: { type: "string" as const }, min: { type: "string" as const }, max: { type: "string" as const } } } } },
    abilityDescription: { type: "string" as const },
    proofImages: { type: "array" as const, items: { object: { allowedKeys: ["name", "type", "size"], fields: { name: { type: "string" as const }, type: { type: "string" as const }, size: { type: "number" as const } } } } },
    version: { type: "number" as const },
    action: { type: "string" as const }
  }
} as const;

function responseForResult(result: { ok: boolean; status?: number }) {
  return jsonResponse(result, result.ok ? 200 : (result.status ?? 400));
}

function readVersion(body: VersionedBody) {
  return Number.isInteger(body.version) && (body.version ?? 0) > 0
    ? body.version
    : null;
}

function transactionUnavailableResponse() {
  return jsonResponse(
    {
      code: "TRANSACTION_UNAVAILABLE",
      errors: { request: "内容管理事务暂不可用" },
      ok: false,
      value: null
    },
    503
  );
}

export function createTutorProfileManagementHandlers({
  collection,
  env = process.env,
  sessionRevocationGuard,
  runTransaction
}: {
  collection: TutorProfileCollection;
  env?: RuntimeEnv;
  sessionRevocationGuard?: RuntimeEnv["sessionRevocationGuard"];
  runTransaction?: TutorProfileLifecycleTransactionRunner;
}) {
  const securedEnv: RuntimeEnv = createSecurityRuntimeEnv({
    ...env,
    sessionRevocationGuard: sessionRevocationGuard ?? env.sessionRevocationGuard
  });
  return {
    async POST_COLLECTION(request: Request) {
      const auth = await readAuthenticatedUserIdWithRevocation(request, securedEnv);
      if (!auth.ok) return auth.response;
      const securityResponse = guardWriteRequest(request, securedEnv, auth.authenticatedUserId);
      if (securityResponse) return securityResponse;
      const body = await readJsonBody<TutorProfileInput>(request, tutorProfileBodyLimits);
      if (!body.ok) return body.response;
      return responseForResult(
        await saveServerTutorProfile({
          authenticatedUserId: auth.authenticatedUserId,
          collection,
          input: body.value,
          runTransaction
        })
      );
    },

    async GET_ITEM(request: Request, context: RouteContext) {
      const { id } = await context.params;
      if (new URL(request.url).searchParams.get("scope") === "mine") {
        const auth = await readAuthenticatedUserIdWithRevocation(request, securedEnv);
        if (!auth.ok) return auth.response;
        return responseForResult(
          await readServerTutorProfileForOwner({
            authenticatedUserId: auth.authenticatedUserId,
            collection,
            id
          })
        );
      }

      const result = await findPublicServerTutorProfileById({ collection, id });
      return result.ok && result.value
        ? jsonResponse(result)
        : apiError(404, TUTOR_PROFILE_NOT_FOUND_MESSAGE);
    },

    async PATCH_ITEM(request: Request, context: RouteContext) {
        const auth = await readAuthenticatedUserIdWithRevocation(request, securedEnv);
      if (!auth.ok) return auth.response;
      const securityResponse = guardWriteRequest(request, securedEnv, auth.authenticatedUserId);
      if (securityResponse) return securityResponse;
      const body = await readJsonBody<TutorProfileInput & VersionedBody>(request, tutorProfileBodyLimits);
      if (!body.ok) return body.response;
      const expectedVersion = readVersion(body.value);
      if (!expectedVersion) return apiError(400, "缺少有效的 version");

      const { id } = await context.params;
      return responseForResult(
        await updateServerTutorProfile({
          authenticatedUserId: auth.authenticatedUserId,
          expectedVersion,
          id,
          input: body.value,
          runTransaction
        })
      );
    },

    async DELETE_ITEM(request: Request, context: RouteContext) {
      const auth = await readAuthenticatedUserIdWithRevocation(request, securedEnv);
      if (!auth.ok) return auth.response;
      const securityResponse = guardWriteRequest(request, securedEnv, auth.authenticatedUserId);
      if (securityResponse) return securityResponse;
      const body = await readJsonBody<VersionedBody>(request, tutorProfileBodyLimits);
      if (!body.ok) return body.response;
      const expectedVersion = readVersion(body.value);
      if (!expectedVersion) return apiError(400, "缺少有效的 version");
      if (!runTransaction) return transactionUnavailableResponse();

      const { id } = await context.params;
      return responseForResult(
        await deleteServerTutorProfile({
          authenticatedUserId: auth.authenticatedUserId,
          expectedVersion,
          id,
          idempotencyKey: request.headers.get("idempotency-key") ?? "",
          runTransaction
        })
      );
    },

    async POST_ITEM(request: Request, context: RouteContext) {
      const auth = await readAuthenticatedUserIdWithRevocation(request, securedEnv);
      if (!auth.ok) return auth.response;
      const securityResponse = guardWriteRequest(request, securedEnv, auth.authenticatedUserId);
      if (securityResponse) return securityResponse;
      const body = await readJsonBody<RestoreBody>(request, tutorProfileBodyLimits);
      if (!body.ok) return body.response;
      if (body.value.action !== "restore") return apiError(400, "不支持的管理操作");
      const expectedVersion = readVersion(body.value);
      if (!expectedVersion) return apiError(400, "缺少有效的 version");
      if (!runTransaction) return transactionUnavailableResponse();

      const { id } = await context.params;
      return responseForResult(
        await restoreServerTutorProfile({
          authenticatedUserId: auth.authenticatedUserId,
          expectedVersion,
          id,
          idempotencyKey: request.headers.get("idempotency-key") ?? "",
          runTransaction
        })
      );
    }
  };
}
