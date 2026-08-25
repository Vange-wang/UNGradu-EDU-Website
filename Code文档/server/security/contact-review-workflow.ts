export const CONTACT_REVIEW_STATES = [
  "draft",
  "pending_review",
  "needs_manual_review",
  "published",
  "rejected",
  "appeal_pending",
  "deleted"
] as const;

export type ContactReviewWorkflowState = typeof CONTACT_REVIEW_STATES[number];

export type ContactReviewOperator =
  | { authorized: boolean; id: string; kind: "content_owner" }
  | { authorized: boolean; id: string; kind: "synthetic_reviewer" }
  | { kind: "deterministic_rule"; ruleVersion: string }
  | { environment: "synthetic"; kind: "workflow_system" };

export type ContactReviewAction =
  | { operator: Extract<ContactReviewOperator, { kind: "content_owner" }>; type: "submit" }
  | {
    decision: "published" | "rejected";
    operator: ContactReviewOperator;
    type: "review_decision";
  }
  | {
    operator: Extract<ContactReviewOperator, { kind: "deterministic_rule" | "workflow_system" }>;
    reason:
      | "ambiguous"
      | "appeal_unchanged"
      | "normalization_failure"
      | "policy_error"
      | "queue_failure"
      | "timeout";
    type: "route_to_manual";
  }
  | {
    operator: Extract<ContactReviewOperator, { kind: "content_owner" }>;
    type: "appeal_edited" | "appeal_unchanged" | "delete" | "restore";
  };

export type ContactReviewTransitionResult =
  | { fromState: ContactReviewWorkflowState; ok: true; state: ContactReviewWorkflowState }
  | {
    code: "invalid_transition" | "unauthorized_operator";
    fromState: ContactReviewWorkflowState;
    ok: false;
    state: ContactReviewWorkflowState;
  };

export function transitionContactReviewState(
  state: ContactReviewWorkflowState,
  action: ContactReviewAction
): ContactReviewTransitionResult {
  if (action.type === "submit") {
    if (!action.operator.authorized) {
      return { code: "unauthorized_operator", fromState: state, ok: false, state };
    }
    if (state === "draft") {
      return { fromState: state, ok: true, state: "pending_review" };
    }
  }

  if (action.type === "route_to_manual") {
    if (state === "pending_review") {
      return { fromState: state, ok: true, state: "needs_manual_review" };
    }
    if (
      state === "appeal_pending" &&
      action.operator.kind === "workflow_system" &&
      action.reason === "appeal_unchanged"
    ) {
      return { fromState: state, ok: true, state: "needs_manual_review" };
    }
  }

  if (action.type === "review_decision") {
    if (action.operator.kind !== "synthetic_reviewer" || !action.operator.authorized) {
      return { code: "unauthorized_operator", fromState: state, ok: false, state };
    }
    if (state === "pending_review" || state === "needs_manual_review") {
      return { fromState: state, ok: true, state: action.decision };
    }
  }

  if (
    action.type === "appeal_edited" ||
    action.type === "appeal_unchanged" ||
    action.type === "delete" ||
    action.type === "restore"
  ) {
    if (!action.operator.authorized) {
      return { code: "unauthorized_operator", fromState: state, ok: false, state };
    }
    if (action.type === "appeal_unchanged" && state === "rejected") {
      return { fromState: state, ok: true, state: "appeal_pending" };
    }
    if (action.type === "appeal_edited" && state === "rejected") {
      return { fromState: state, ok: true, state: "draft" };
    }
    if (action.type === "delete" && state !== "deleted") {
      return { fromState: state, ok: true, state: "deleted" };
    }
    if (action.type === "restore" && state === "deleted") {
      return { fromState: state, ok: true, state: "pending_review" };
    }
  }

  return { code: "invalid_transition", fromState: state, ok: false, state };
}
