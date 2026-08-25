import {
  apiError,
  createSecurityRuntimeEnv,
  guardWriteRequest,
  jsonResponse,
  readAuthenticatedUserIdWithRevocation,
  readJsonBody,
  type RuntimeEnv
} from "./api-utils";
import type { ContactReviewRuntimeGate } from "./security/contact-review-cloudbase";
import { createContactReviewService, type ContactReviewEntityType, type ContactReviewReviewerRole } from "./security/contact-review-production";

type ContactReviewService = ReturnType<typeof createContactReviewService>;
type ReviewActionBody = {
  action?: "appeal" | "claim_appeal" | "claim_field" | "decide_appeal" | "decide_field" | "resume_appeal";
  appealRequestId?: string;
  decisions?: Array<{ decision?: "published" | "rejected"; reasonCode?: string; taskId?: string }>;
  dependencyRecoveryRef?: string;
  entityId?: string;
  entityType?: ContactReviewEntityType;
  expectedAggregateRevision?: number;
  expectedEntityRevision?: number;
  expectedTaskRevision?: number;
  expectedTaskRevisions?: Record<string, number>;
  handoffReasonCode?: string;
  idempotencyKey?: string;
  resumeReasonCode?: string;
  taskId?: string;
};

const bodyLimits = {
  allowedKeys: [
    "action", "appealRequestId", "decisions", "dependencyRecoveryRef", "entityId", "entityType",
    "expectedAggregateRevision", "expectedEntityRevision", "expectedTaskRevision", "expectedTaskRevisions",
    "handoffReasonCode", "idempotencyKey", "resumeReasonCode", "taskId"
  ],
  maxArrayLength: 16,
  maxBodyBytes: 32_768,
  maxDepth: 5,
  maxStringLength: 256
};

function resultResponse(result: { ok: boolean; status?: number }) {
  return jsonResponse(result, result.ok ? 200 : (result.status ?? 422));
}

function actionResultResponse(result: {
  ok: boolean;
  replayed?: boolean;
  status?: number;
  value?: Record<string, unknown>;
}) {
  if (!result.ok || !result.value) return resultResponse(result);
  const value = result.value;
  return jsonResponse({
    ok: true,
    replayed: result.replayed ?? false,
    value: {
      activePublishedVersion: value.activePublishedVersion,
      aggregateStatus: value.aggregateStatus,
      currentVersion: value.currentVersion,
      deletedAt: value.deletedAt,
      entityId: value.entityId,
      entityRevision: value.entityRevision,
      entityType: value.entityType,
      pendingReviewVersion: value.pendingReviewVersion,
      publicVisibility: value.publicVisibility,
      updatedAt: value.updatedAt
    }
  }, 200);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function reviewerRole(gate: ContactReviewRuntimeGate, userId: string): ContactReviewReviewerRole | null {
  if (!gate.ok || !gate.enabled) return null;
  if (gate.reviewerRefs.primary.includes(userId)) return "primary";
  if (gate.reviewerRefs.backup.includes(userId)) return "backup";
  if (gate.reviewerRefs.secondReview.includes(userId)) return "second-review";
  return null;
}

export function createContactReviewApiHandlers({
  env = process.env,
  gate,
  service
}: {
  env?: RuntimeEnv;
  gate: ContactReviewRuntimeGate;
  service?: ContactReviewService;
}) {
  const securedEnv = createSecurityRuntimeEnv(env);
  const unavailable = () => apiError(503, "联系方式审核服务暂不可用");
  return {
    async GET_STATUS(request: Request) {
      const auth = await readAuthenticatedUserIdWithRevocation(request, securedEnv);
      if (!auth.ok) return auth.response;
      const url = new URL(request.url);
      const scope = url.searchParams.get("scope");
      if (scope === "health") {
        if (!gate.ok) return jsonResponse({ ...gate, enabled: true, ready: false }, 503);
        if (!gate.enabled || !service) {
          return jsonResponse({
            ok: true,
            value: { enabled: false, ready: false, repositoryReachable: false, rollbackControl: "feature_flag_off" }
          }, 200);
        }
        const role = reviewerRole(gate, auth.authenticatedUserId);
        if (!role) return apiError(403, "审核权限不足");
        const result = await service.readOperationalHealth({ now: new Date().toISOString() });
        return result.ok
          ? jsonResponse({ ...result, value: { ...result.value, enabled: true, ready: true } }, 200)
          : resultResponse(result);
      }
      if (!gate.ok || !gate.enabled || !service) return unavailable();
      if (scope === "queue") {
        const role = reviewerRole(gate, auth.authenticatedUserId);
        if (!role) return apiError(403, "审核权限不足");
        return resultResponse(await service.listReviewerQueue({ id: auth.authenticatedUserId, role }));
      }
      const entityId = url.searchParams.get("entityId")?.trim() ?? "";
      const entityType = url.searchParams.get("entityType");
      if (!entityId || (entityType !== "parent_need" && entityType !== "tutor_profile")) {
        return apiError(422, "审核状态查询参数无效");
      }
      return resultResponse(await service.readOwner(entityType, entityId, auth.authenticatedUserId));
    },

    async POST_ACTION(request: Request) {
      const auth = await readAuthenticatedUserIdWithRevocation(request, securedEnv);
      if (!auth.ok) return auth.response;
      const securityResponse = guardWriteRequest(request, securedEnv, auth.authenticatedUserId);
      if (securityResponse) return securityResponse;
      if (!gate.ok || !gate.enabled || !service) return unavailable();
      const parsed = await readJsonBody<ReviewActionBody>(request, bodyLimits);
      if (!parsed.ok) return parsed.response;
      const body = parsed.value;
      const now = new Date().toISOString();
      const idempotencyKey = request.headers.get("idempotency-key") ?? body.idempotencyKey ?? "";

      if (body.action === "appeal") {
        if (
          !body.entityId ||
          (body.entityType !== "parent_need" && body.entityType !== "tutor_profile") ||
          !isPositiveInteger(body.expectedEntityRevision)
        ) return apiError(422, "申诉请求无效");
        return actionResultResponse(await service.createAppeal({
          entityId: body.entityId,
          entityType: body.entityType,
          expectedEntityRevision: body.expectedEntityRevision,
          idempotencyKey,
          now,
          operatorId: auth.authenticatedUserId,
          requestId: request.headers.get("x-correlation-id") ?? crypto.randomUUID()
        }));
      }

      const role = reviewerRole(gate, auth.authenticatedUserId);
      if (!role) return apiError(403, "审核权限不足");
      if (body.action === "claim_field") {
        if (role === "second-review") return apiError(403, "复核角色不能领取初审任务");
        if (!body.taskId || !isPositiveInteger(body.expectedAggregateRevision) || !isPositiveInteger(body.expectedTaskRevision)) {
          return apiError(422, "审核领取请求无效");
        }
        return actionResultResponse(await service.claimField({
          expectedAggregateRevision: body.expectedAggregateRevision,
          expectedTaskRevision: body.expectedTaskRevision,
          idempotencyKey,
          now,
          operator: { id: auth.authenticatedUserId, role },
          taskId: body.taskId
        }));
      }
      if (body.action === "decide_field") {
        if (
          !body.taskId ||
          !isPositiveInteger(body.expectedAggregateRevision) ||
          !isPositiveInteger(body.expectedTaskRevision) ||
          (body.decisions?.[0]?.decision !== "published" && body.decisions?.[0]?.decision !== "rejected")
        ) return apiError(422, "审核决定无效");
        return actionResultResponse(await service.decideField({
          decision: body.decisions[0].decision,
          expectedAggregateRevision: body.expectedAggregateRevision,
          expectedTaskRevision: body.expectedTaskRevision,
          idempotencyKey,
          now,
          operator: { id: auth.authenticatedUserId, role },
          taskId: body.taskId
        }));
      }
      if (!body.appealRequestId || !isPositiveInteger(body.expectedAggregateRevision)) {
        return apiError(422, "申诉审核请求无效");
      }
      if (body.action === "claim_appeal") {
        if (role === "second-review") return apiError(403, "审核权限不足");
        return actionResultResponse(await service.claimAppeal({
          appealRequestId: body.appealRequestId,
          expectedAggregateRevision: body.expectedAggregateRevision,
          expectedTaskRevisions: body.expectedTaskRevisions ?? {},
          handoffReasonCode: body.handoffReasonCode ?? "",
          idempotencyKey,
          now,
          operator: { id: auth.authenticatedUserId, role }
        }));
      }
      if (body.action === "resume_appeal") {
        if (role === "second-review") return apiError(403, "审核权限不足");
        return actionResultResponse(await service.resumeAppealReview({
          appealRequestId: body.appealRequestId,
          dependencyRecoveryRef: body.dependencyRecoveryRef ?? "",
          expectedAggregateRevision: body.expectedAggregateRevision,
          expectedTaskRevisions: body.expectedTaskRevisions ?? {},
          idempotencyKey,
          now,
          operator: { id: auth.authenticatedUserId, role },
          resumeReasonCode: body.resumeReasonCode ?? ""
        }));
      }
      if (body.action === "decide_appeal") {
        const decisions = (body.decisions ?? []).map((decision) => ({
          decision: decision.decision,
          reasonCode: decision.reasonCode ?? "",
          taskId: decision.taskId ?? ""
        }));
        if (decisions.some((decision) => decision.decision !== "published" && decision.decision !== "rejected")) {
          return apiError(422, "申诉审核决定无效");
        }
        return actionResultResponse(await service.decideAppeal({
          appealRequestId: body.appealRequestId,
          decisions: decisions as Array<{ decision: "published" | "rejected"; reasonCode: string; taskId: string }>,
          expectedAggregateRevision: body.expectedAggregateRevision,
          expectedTaskRevisions: body.expectedTaskRevisions ?? {},
          idempotencyKey,
          now,
          operator: { id: auth.authenticatedUserId, role }
        }));
      }
      return apiError(422, "不支持的审核操作");
    }
  };
}
