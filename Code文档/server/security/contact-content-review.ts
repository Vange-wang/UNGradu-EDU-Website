import { createHash } from "node:crypto";

export const CONTACT_REVIEW_RULE_VERSION = "issue-0036-deterministic-v1";

export type ContactReviewField = "abilityDescription" | "childIntro";
export type ContactReviewEntityType = "parent_need" | "tutor_profile";

export type ContactReviewClassification =
  | "allow_candidate"
  | "contact_confirmed"
  | "contact_likely"
  | "ambiguous"
  | "normalization_failure"
  | "input_error"
  | "policy_error";

export type ContactReviewState = "draft" | "needs_manual_review" | "pending_review";

export type ContactReviewSignal = {
  kind: "contact_handle" | "numeric_sequence" | "phone";
  originalRange: { start: number; end: number };
};

export type ContactReviewInput = {
  entityId: string;
  entityType: ContactReviewEntityType;
  field: string;
  ownerId: string;
  text: string;
  version: number;
};

export type ContactReviewResult = {
  classification: ContactReviewClassification;
  state: ContactReviewState;
  signals: ContactReviewSignal[];
  audit: {
    contentHash: string;
    entityId: string | null;
    entityType: ContactReviewEntityType;
    field: ContactReviewField | "unsupported";
    ownerId: string | null;
    reviewKey: string | null;
    ruleVersion: typeof CONTACT_REVIEW_RULE_VERSION;
    version: number | null;
  };
};

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function lengthPrefixed(parts: Array<string | number>) {
  return parts.map((part) => `${String(part).length}:${String(part)}`).join("|");
}

function approvedField(input: ContactReviewInput): ContactReviewField | null {
  if (input.entityType === "parent_need" && input.field === "childIntro") {
    return "childIntro";
  }
  if (input.entityType === "tutor_profile" && input.field === "abilityDescription") {
    return "abilityDescription";
  }
  return null;
}

function validIdentifier(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value === value.trim();
}

function validVersion(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
}

function hasValidAuditIdentity(input: ContactReviewInput) {
  return validIdentifier(input.ownerId) && validIdentifier(input.entityId) && validVersion(input.version);
}

function normalizeWithOffsetMap(text: string) {
  let normalizedText = "";
  const offsetMap: Array<{ start: number; end: number }> = [];

  for (let start = 0; start < text.length;) {
    const codePoint = text.codePointAt(start);
    if (codePoint === undefined || (codePoint >= 0xd800 && codePoint <= 0xdfff)) {
      return null;
    }
    const width = codePoint > 0xffff ? 2 : 1;
    const end = start + width;
    const normalizedPart = text.slice(start, end).normalize("NFKC");
    normalizedText += normalizedPart;
    for (let index = 0; index < normalizedPart.length; index += 1) {
      offsetMap.push({ start, end });
    }
    start = end;
  }

  if (normalizedText !== text.normalize("NFKC")) {
    return null;
  }

  return { normalizedText, offsetMap };
}

function stateForClassification(classification: ContactReviewClassification): ContactReviewState {
  if (classification === "allow_candidate") {
    return "pending_review";
  }
  if (classification === "input_error") {
    return "draft";
  }
  return "needs_manual_review";
}

function createResult(
  input: ContactReviewInput,
  classification: ContactReviewClassification,
  signals: ContactReviewSignal[] = []
): ContactReviewResult {
  const field = approvedField(input) ?? "unsupported";
  const contentHash = sha256(input.text);
  const ownerId = validIdentifier(input.ownerId) ? input.ownerId : null;
  const entityId = validIdentifier(input.entityId) ? input.entityId : null;
  const version = validVersion(input.version) ? input.version : null;
  const reviewKey = ownerId !== null && entityId !== null && version !== null
    ? sha256(lengthPrefixed([
      ownerId,
      input.entityType,
      entityId,
      field,
      version,
      contentHash,
      CONTACT_REVIEW_RULE_VERSION
    ]))
    : null;

  return {
    classification,
    state: stateForClassification(classification),
    signals,
    audit: {
      contentHash,
      entityId,
      entityType: input.entityType,
      field,
      ownerId,
      reviewKey,
      ruleVersion: CONTACT_REVIEW_RULE_VERSION,
      version
    }
  };
}

function signalForNormalizedRange(
  normalized: NonNullable<ReturnType<typeof normalizeWithOffsetMap>>,
  kind: ContactReviewSignal["kind"],
  start: number,
  length: number
): ContactReviewSignal | null {
  const first = normalized.offsetMap[start];
  const last = normalized.offsetMap[start + length - 1];
  if (!first || !last) {
    return null;
  }
  return { kind, originalRange: { start: first.start, end: last.end } };
}

export function reviewContactContent(input: ContactReviewInput): ContactReviewResult {
  if (!hasValidAuditIdentity(input)) {
    return createResult(input, "policy_error");
  }

  if (!approvedField(input)) {
    return createResult(input, "policy_error");
  }

  if (!input.text.trim()) {
    return createResult(input, "input_error");
  }

  const normalized = normalizeWithOffsetMap(input.text);
  if (!normalized) {
    return createResult(input, "normalization_failure");
  }

  const phoneMatch = /(?:\+?86[\s-]?)?1[3-9](?:[\s-]?\d){9}/.exec(normalized.normalizedText);
  if (phoneMatch) {
    const signal = signalForNormalizedRange(normalized, "phone", phoneMatch.index, phoneMatch[0].length);
    if (!signal) {
      return createResult(input, "normalization_failure");
    }
    return createResult(input, "contact_confirmed", [signal]);
  }

  const handleMatch = /(?:微\s*信|wechat|weixin|v\s*x|w\s*x)\s*[:：]?\s*([a-z][a-z0-9_-]{5,19})/i.exec(
    normalized.normalizedText
  );
  if (handleMatch?.[1]) {
    const handleStart = handleMatch.index + handleMatch[0].lastIndexOf(handleMatch[1]);
    const signal = signalForNormalizedRange(
      normalized,
      "contact_handle",
      handleStart,
      handleMatch[1].length
    );
    if (!signal) {
      return createResult(input, "normalization_failure");
    }
    return createResult(input, "contact_likely", [signal]);
  }

  const numericMatch = /(?<!\d)\d(?:[\s-]?\d){6,}(?!\d)/.exec(normalized.normalizedText);
  if (numericMatch) {
    const signal = signalForNormalizedRange(
      normalized,
      "numeric_sequence",
      numericMatch.index,
      numericMatch[0].length
    );
    if (!signal) {
      return createResult(input, "normalization_failure");
    }
    return createResult(input, "ambiguous", [signal]);
  }

  return createResult(input, "allow_candidate");
}
