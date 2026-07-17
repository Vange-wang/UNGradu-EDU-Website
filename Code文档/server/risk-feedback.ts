import {
  type RiskFeedbackStatus,
  type RiskFeedbackInput,
  validateRiskFeedbackInput
} from "@/features/feedback/risk-feedback";

export const RISK_FEEDBACK_COLLECTION = "risk_feedback_records";

export type ServerRiskFeedback = RiskFeedbackInput & {
  id: string;
  submittedByUserId: string | null;
  status: RiskFeedbackStatus;
  createdAt: string;
  updatedAt: string;
};

export type PublicRiskFeedbackRecord = Pick<
  ServerRiskFeedback,
  | "category"
  | "createdAt"
  | "description"
  | "id"
  | "status"
  | "targetReference"
  | "targetType"
  | "updatedAt"
>;

type RiskFeedbackDocument = Partial<ServerRiskFeedback>;

type RiskFeedbackQuery = {
  get: () => Promise<{ data?: unknown[] }>;
  orderBy?: (field: string, direction: "asc" | "desc") => RiskFeedbackQuery;
};

type RiskFeedbackWriteCollection = {
  doc: (docId: string) => {
    set: (data: ServerRiskFeedback) => Promise<unknown>;
  };
};

type RiskFeedbackCollection = RiskFeedbackWriteCollection & {
  where: (query: Record<string, unknown>) => RiskFeedbackQuery;
};

type Failure = {
  ok: false;
  value: null;
  errors: Record<string, string>;
};

type Success<T> = {
  ok: true;
  value: T;
  errors: Record<string, never>;
};

function createOpaqueId(prefix: string) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function createFailure(message: string): Failure {
  return {
    ok: false,
    value: null,
    errors: { request: message }
  };
}

function normalizeUserId(userId: string) {
  return userId.trim();
}

function normalizeStatus(status: unknown): RiskFeedbackStatus {
  if (
    status === "reviewing" ||
    status === "closed" ||
    status === "unable_to_process"
  ) {
    return status;
  }

  return "recorded";
}

function normalizeServerRiskFeedback(
  document: RiskFeedbackDocument
): ServerRiskFeedback | null {
  if (
    !document.id ||
    !document.category ||
    !document.targetType ||
    !document.description ||
    !document.sourcePage ||
    !document.createdAt
  ) {
    return null;
  }

  return {
    category: document.category,
    contactMethod: document.contactMethod ?? "",
    createdAt: document.createdAt,
    description: document.description,
    evidenceNote: document.evidenceNote ?? "",
    id: document.id,
    sourcePage: document.sourcePage,
    status: normalizeStatus(document.status),
    submittedByUserId: document.submittedByUserId?.trim() || null,
    targetReference: document.targetReference ?? "",
    targetType: document.targetType,
    updatedAt: document.updatedAt ?? document.createdAt
  };
}

function toPublicRiskFeedbackRecord(
  feedback: ServerRiskFeedback
): PublicRiskFeedbackRecord {
  return {
    category: feedback.category,
    createdAt: feedback.createdAt,
    description: feedback.description,
    id: feedback.id,
    status: feedback.status,
    targetReference: feedback.targetReference,
    targetType: feedback.targetType,
    updatedAt: feedback.updatedAt
  };
}

export async function saveServerRiskFeedback({
  collection,
  input,
  now = new Date().toISOString(),
  submittedByUserId = null
}: {
  collection: RiskFeedbackWriteCollection;
  input: RiskFeedbackInput;
  now?: string;
  submittedByUserId?: string | null;
}): Promise<Success<ServerRiskFeedback> | Failure> {
  const validation = validateRiskFeedbackInput(input);

  if (!validation.ok) {
    return validation;
  }

  const feedback: ServerRiskFeedback = {
    ...validation.value,
    id: createOpaqueId("risk-feedback"),
    submittedByUserId: submittedByUserId?.trim() || null,
    status: "recorded",
    createdAt: now,
    updatedAt: now
  };

  await collection.doc(feedback.id).set(feedback);

  return {
    ok: true,
    value: feedback,
    errors: {}
  };
}

export async function listServerRiskFeedbackForOwner({
  authenticatedUserId,
  collection
}: {
  authenticatedUserId: string;
  collection: RiskFeedbackCollection;
}): Promise<Success<PublicRiskFeedbackRecord[]> | Failure> {
  const currentUserId = normalizeUserId(authenticatedUserId);

  if (!currentUserId) {
    return createFailure("必须登录后才能查看反馈记录");
  }

  let query = collection.where({ submittedByUserId: currentUserId });
  query = query.orderBy?.("createdAt", "desc") ?? query;

  const result = await query.get();
  const records = (result.data ?? [])
    .map((document) => normalizeServerRiskFeedback(document as RiskFeedbackDocument))
    .filter((feedback): feedback is ServerRiskFeedback => Boolean(feedback))
    .filter((feedback) => feedback.submittedByUserId === currentUserId)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
    .map(toPublicRiskFeedbackRecord);

  return {
    ok: true,
    value: records,
    errors: {}
  };
}
