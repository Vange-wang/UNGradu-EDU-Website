import { validateParentNeedInput, type ParentNeedInput } from "@/features/parent-needs/parent-need";
import { validateTutorProfileInput, type TutorProfileInput } from "@/features/tutor-profiles/tutor-profile";
import { createContactReviewService, type ContactReviewEntityType } from "./contact-review-production";

type ContactReviewService = ReturnType<typeof createContactReviewService>;
type IntegrationFailure = {
  code: string;
  errors: { request: string };
  ok: false;
  status: number;
  value: null;
};
type IntegrationSuccess = { errors: Record<string, never>; ok: true; value: Record<string, unknown> };
export type ContactReviewIntegrationResult = IntegrationFailure | IntegrationSuccess;

function opaqueId(prefix: string) {
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
}

function failure(code: string, status: number): IntegrationFailure {
  return {
    code,
    errors: { request: status === 503 ? "联系方式审核服务暂不可用" : "无法完成联系方式审核操作" },
    ok: false,
    status,
    value: null
  };
}

function mapServiceResult(result: Awaited<ReturnType<ContactReviewService["submit"]>>): ContactReviewIntegrationResult {
  if (!result.ok) return failure(result.code, result.status);
  return {
    errors: {},
    ok: true,
    value: {
      ...(result.value.pendingSnapshot ?? result.value.activeSnapshot ?? {}),
      activePublishedVersion: result.value.activePublishedVersion,
      id: result.value.entityId,
      pendingReviewVersion: result.value.pendingReviewVersion,
      publicVisibility: result.value.publicVisibility,
      reviewStatus: result.value.aggregateStatus,
      version: result.value.entityRevision
    }
  };
}

function cleanOwnerSnapshot(value: Record<string, unknown>) {
  const copy = { ...value };
  for (const key of [
    "activePublishedVersion",
    "currentVersion",
    "entityId",
    "entityRevision",
    "pendingReviewVersion",
    "publicVisibility",
    "reviewStatus"
  ]) delete copy[key];
  return copy;
}

export function createContactReviewManagementIntegration({
  entityType,
  service
}: {
  entityType: ContactReviewEntityType;
  service: ContactReviewService;
}) {
  return {
    async create({
      authenticatedUserId,
      idempotencyKey,
      input,
      now,
      requestId
    }: {
      authenticatedUserId: string;
      idempotencyKey: string;
      input: ParentNeedInput | TutorProfileInput;
      now: string;
      requestId: string;
    }): Promise<ContactReviewIntegrationResult> {
      const validated = entityType === "parent_need"
        ? validateParentNeedInput(input as ParentNeedInput)
        : validateTutorProfileInput(input as TutorProfileInput);
      if (!validated.ok) return failure("VALIDATION_FAILED", 422);
      const normalized = validated.value as unknown as Record<string, unknown>;
      const entityId = opaqueId(entityType === "parent_need" ? "parent-need" : "tutor-profile");
      const reviewText = entityType === "parent_need"
        ? String(normalized.childIntro ?? "")
        : String(normalized.abilityDescription ?? "");
      const candidate = {
        ...normalized,
        createdAt: now,
        deletedAt: null,
        deletedByUserId: null,
        id: entityId,
        managementState: "managed",
        ownerUserId: authenticatedUserId,
        status: "pending_review",
        updatedAt: now,
        version: 1
      };
      return mapServiceResult(await service.submit({
        candidate,
        entityId,
        entityType,
        idempotencyKey,
        now,
        operation: "create",
        ownerId: authenticatedUserId,
        requestId,
        reviewFields: entityType === "parent_need"
          ? { childIntro: reviewText }
          : { abilityDescription: reviewText }
      }));
    },

    async edit({
      authenticatedUserId,
      entityId,
      expectedEntityRevision,
      idempotencyKey,
      input,
      now,
      requestId
    }: {
      authenticatedUserId: string;
      entityId: string;
      expectedEntityRevision: number;
      idempotencyKey: string;
      input: ParentNeedInput | TutorProfileInput;
      now: string;
      requestId: string;
    }): Promise<ContactReviewIntegrationResult> {
      const existing = await service.readOwner(entityType, entityId, authenticatedUserId);
      if (!existing.ok) return failure(existing.code, existing.status);
      const existingValue = existing.value as Record<string, unknown>;
      const validated = entityType === "parent_need"
        ? validateParentNeedInput(input as ParentNeedInput)
        : validateTutorProfileInput(input as TutorProfileInput);
      if (!validated.ok) return failure("VALIDATION_FAILED", 422);
      const reviewText = entityType === "parent_need"
        ? (validated.value as { childIntro: string }).childIntro
        : (validated.value as { abilityDescription: string }).abilityDescription;
      return mapServiceResult(await service.submit({
        candidate: {
          ...validated.value,
          createdAt: existingValue.createdAt,
          deletedAt: null,
          deletedByUserId: null,
          id: entityId,
          ownerUserId: authenticatedUserId,
          status: "pending_review",
          updatedAt: now,
          version: expectedEntityRevision + 1
        },
        entityId,
        entityType,
        expectedEntityRevision,
        idempotencyKey,
        now,
        operation: "edit",
        ownerId: authenticatedUserId,
        requestId,
        reviewFields: entityType === "parent_need"
          ? { childIntro: reviewText }
          : { abilityDescription: reviewText }
      }));
    },

    async delete(input: {
      authenticatedUserId: string;
      entityId: string;
      expectedEntityRevision: number;
      idempotencyKey: string;
      now: string;
      requestId: string;
    }) {
      return mapServiceResult(await service.deleteEntity({
        entityId: input.entityId,
        entityType,
        expectedEntityRevision: input.expectedEntityRevision,
        idempotencyKey: input.idempotencyKey,
        now: input.now,
        operatorId: input.authenticatedUserId,
        requestId: input.requestId
      }));
    },

    async restore(input: {
      authenticatedUserId: string;
      entityId: string;
      expectedEntityRevision: number;
      idempotencyKey: string;
      now: string;
      requestId: string;
    }): Promise<ContactReviewIntegrationResult> {
      const existing = await service.readOwner(entityType, input.entityId, input.authenticatedUserId);
      if (!existing.ok) return failure(existing.code, existing.status);
      const candidate = cleanOwnerSnapshot(existing.value);
      const reviewText = entityType === "parent_need"
        ? String(candidate.childIntro ?? "")
        : String(candidate.abilityDescription ?? "");
      return mapServiceResult(await service.submit({
        candidate: { ...candidate, status: "pending_review", updatedAt: input.now },
        entityId: input.entityId,
        entityType,
        expectedEntityRevision: input.expectedEntityRevision,
        idempotencyKey: input.idempotencyKey,
        now: input.now,
        operation: "restore",
        ownerId: input.authenticatedUserId,
        requestId: input.requestId,
        reviewFields: entityType === "parent_need"
          ? { childIntro: reviewText }
          : { abilityDescription: reviewText }
      }));
    },

    async readOwner(authenticatedUserId: string, entityId: string): Promise<ContactReviewIntegrationResult> {
      const result = await service.readOwner(entityType, entityId, authenticatedUserId);
      if (!result.ok) return failure(result.code, result.status);
      return { errors: {}, ok: true, value: { ...result.value, id: entityId, version: result.value.entityRevision } };
    },

    async listOwner(authenticatedUserId: string) {
      const result = await service.listOwner(entityType, authenticatedUserId);
      if (!result.ok) return failure(result.code, result.status);
      return { errors: {} as Record<string, never>, ok: true as const, value: result.value };
    },

    async readPublic(entityId: string) {
      const result = await service.readPublic(entityType, entityId);
      if (!result.ok) return failure(result.code, result.status);
      return { errors: {} as Record<string, never>, ok: true as const, value: result.value };
    },

    async listPublic() {
      const result = await service.listPublic(entityType);
      if (!result.ok) return failure(result.code, result.status);
      return { errors: {} as Record<string, never>, ok: true as const, value: result.value };
    }
  };
}

export type ContactReviewManagementIntegration = ReturnType<typeof createContactReviewManagementIntegration>;
