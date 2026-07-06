export type RiskFeedbackInput = {
  category: string;
  targetType: string;
  targetReference: string;
  description: string;
  evidenceNote: string;
  contactMethod: string;
  sourcePage: string;
};

export type RiskFeedback = RiskFeedbackInput;

type Failure = {
  ok: false;
  value: null;
  errors: Record<string, string>;
};

type Success = {
  ok: true;
  value: RiskFeedback;
  errors: Record<string, never>;
};

const TEXT_LIMITS = {
  contactMethod: 120,
  description: 1000,
  evidenceNote: 500,
  targetReference: 200
};

function trimText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeRiskFeedbackInput(input: RiskFeedbackInput): RiskFeedback {
  return {
    category: trimText(input.category),
    targetType: trimText(input.targetType),
    targetReference: trimText(input.targetReference),
    description: trimText(input.description),
    evidenceNote: trimText(input.evidenceNote),
    contactMethod: trimText(input.contactMethod),
    sourcePage: trimText(input.sourcePage)
  };
}

export function validateRiskFeedbackInput(input: RiskFeedbackInput): Success | Failure {
  const normalized = normalizeRiskFeedbackInput(input);
  const errors: Record<string, string> = {};

  if (!normalized.category) {
    errors.category = "请选择反馈类型";
  }

  if (!normalized.targetType) {
    errors.targetType = "请选择反馈对象";
  }

  if (!normalized.description) {
    errors.description = "请填写问题描述";
  } else if (normalized.description.length > TEXT_LIMITS.description) {
    errors.description = "问题描述最多 1000 字";
  }

  if (!normalized.sourcePage) {
    errors.sourcePage = "缺少提交来源";
  }

  if (normalized.targetReference.length > TEXT_LIMITS.targetReference) {
    errors.targetReference = "对象标识最多 200 字";
  }

  if (normalized.evidenceNote.length > TEXT_LIMITS.evidenceNote) {
    errors.evidenceNote = "证据说明最多 500 字";
  }

  if (normalized.contactMethod.length > TEXT_LIMITS.contactMethod) {
    errors.contactMethod = "联系方式最多 120 字";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      value: null,
      errors
    };
  }

  return {
    ok: true,
    value: normalized,
    errors: {}
  };
}
