import type { ParentNeedInput } from "@/features/parent-needs/parent-need";
import {
  apiError,
  jsonResponse,
  readAuthenticatedUserId,
  readJsonBody,
  type RuntimeEnv
} from "@/server/api-utils";
import {
  deleteServerParentNeed,
  findPublicServerParentNeedById,
  PARENT_NEED_NOT_FOUND_MESSAGE,
  readServerParentNeedForOwner,
  restoreServerParentNeed,
  saveServerParentNeed,
  updateServerParentNeed,
  type ParentNeedLifecycleTransactionRunner
} from "@/server/parent-needs";

type ParentNeedCollection = Parameters<typeof saveServerParentNeed>[0]["collection"];
type RouteContext = { params: Promise<{ id: string }> };
type VersionedBody = { version?: number };
type RestoreBody = VersionedBody & { action?: string };

function responseForResult(result: {
  ok: boolean;
  status?: number;
  errors?: { request?: string };
}) {
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

export function createParentNeedManagementHandlers({
  collection,
  env = process.env,
  runTransaction
}: {
  collection: ParentNeedCollection;
  env?: RuntimeEnv;
  runTransaction?: ParentNeedLifecycleTransactionRunner;
}) {
  return {
    async POST_COLLECTION(request: Request) {
      const auth = readAuthenticatedUserId(request, env);
      if (!auth.ok) return auth.response;

      const body = await readJsonBody<ParentNeedInput>(request);
      if (!body.ok) return body.response;

      return responseForResult(
        await saveServerParentNeed({
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
        const auth = readAuthenticatedUserId(request, env);
        if (!auth.ok) return auth.response;
        return responseForResult(
          await readServerParentNeedForOwner({
            authenticatedUserId: auth.authenticatedUserId,
            collection,
            id
          })
        );
      }

      const result = await findPublicServerParentNeedById({ collection, id });
      return result.ok && result.value
        ? jsonResponse(result)
        : apiError(404, PARENT_NEED_NOT_FOUND_MESSAGE);
    },

    async PATCH_ITEM(request: Request, context: RouteContext) {
      const auth = readAuthenticatedUserId(request, env);
      if (!auth.ok) return auth.response;

      const body = await readJsonBody<ParentNeedInput & VersionedBody>(request);
      if (!body.ok) return body.response;
      const expectedVersion = readVersion(body.value);
      if (!expectedVersion) return apiError(400, "缺少有效的 version");

      const { id } = await context.params;
      return responseForResult(
        await updateServerParentNeed({
          authenticatedUserId: auth.authenticatedUserId,
          expectedVersion,
          id,
          input: body.value,
          runTransaction
        })
      );
    },

    async DELETE_ITEM(request: Request, context: RouteContext) {
      const auth = readAuthenticatedUserId(request, env);
      if (!auth.ok) return auth.response;

      const body = await readJsonBody<VersionedBody>(request);
      if (!body.ok) return body.response;
      const expectedVersion = readVersion(body.value);
      if (!expectedVersion) return apiError(400, "缺少有效的 version");
      if (!runTransaction) return transactionUnavailableResponse();

      const { id } = await context.params;
      return responseForResult(
        await deleteServerParentNeed({
          authenticatedUserId: auth.authenticatedUserId,
          expectedVersion,
          id,
          idempotencyKey: request.headers.get("idempotency-key") ?? "",
          runTransaction
        })
      );
    },

    async POST_ITEM(request: Request, context: RouteContext) {
      const auth = readAuthenticatedUserId(request, env);
      if (!auth.ok) return auth.response;

      const body = await readJsonBody<RestoreBody>(request);
      if (!body.ok) return body.response;
      if (body.value.action !== "restore") return apiError(400, "不支持的管理操作");
      const expectedVersion = readVersion(body.value);
      if (!expectedVersion) return apiError(400, "缺少有效的 version");
      if (!runTransaction) return transactionUnavailableResponse();

      const { id } = await context.params;
      return responseForResult(
        await restoreServerParentNeed({
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
