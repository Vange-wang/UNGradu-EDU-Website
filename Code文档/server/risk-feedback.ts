import {
  type RiskFeedbackInput,
  validateRiskFeedbackInput
} from "@/features/feedback/risk-feedback";

export const RISK_FEEDBACK_COLLECTION = "risk_feedback_records";

export type ServerRiskFeedback = RiskFeedbackInput & {
  id: string;
  submittedByUserId: string | null;
  status: "recorded";
  createdAt: string;
};

type RiskFeedbackCollection = {
  doc: (docId: string) => {
    set: (data: ServerRiskFeedback) => Promise<unknown>;
  };
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

export async function saveServerRiskFeedback({
  collection,
  input,
  now = new Date().toISOString(),
  submittedByUserId = null
}: {
  collection: RiskFeedbackCollection;
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
    createdAt: now
  };

  await collection.doc(feedback.id).set(feedback);

  return {
    ok: true,
    value: feedback,
    errors: {}
  };
}
