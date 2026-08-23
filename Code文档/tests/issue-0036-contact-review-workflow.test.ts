import { describe, expect, it } from "vitest";

import {
  CONTACT_REVIEW_STATES,
  transitionContactReviewState
} from "../server/security/contact-review-workflow";

const syntheticOwner = {
  authorized: true,
  id: "owner-synthetic-a",
  kind: "content_owner"
} as const;

describe("ISSUE-0036 bounded contact review state workflow", () => {
  it("submits a draft for review and routes an uncertain result to manual review", () => {
    const submitted = transitionContactReviewState("draft", {
      operator: syntheticOwner,
      type: "submit"
    });
    expect(submitted).toEqual({
      fromState: "draft",
      ok: true,
      state: "pending_review"
    });

    const uncertain = transitionContactReviewState(submitted.state, {
      operator: { kind: "deterministic_rule", ruleVersion: "issue-0036-deterministic-v1" },
      reason: "ambiguous",
      type: "route_to_manual"
    });
    expect(uncertain).toEqual({
      fromState: "pending_review",
      ok: true,
      state: "needs_manual_review"
    });
  });

  it("allows only an authorized synthetic reviewer fixture to publish or reject", () => {
    const reviewer = {
      authorized: true,
      id: "reviewer-synthetic-a",
      kind: "synthetic_reviewer"
    } as const;

    expect(transitionContactReviewState("pending_review", {
      decision: "published",
      operator: reviewer,
      type: "review_decision"
    })).toEqual({ fromState: "pending_review", ok: true, state: "published" });
    expect(transitionContactReviewState("needs_manual_review", {
      decision: "rejected",
      operator: reviewer,
      type: "review_decision"
    })).toEqual({ fromState: "needs_manual_review", ok: true, state: "rejected" });

    expect(transitionContactReviewState("pending_review", {
      decision: "published",
      operator: { kind: "deterministic_rule", ruleVersion: "issue-0036-deterministic-v1" },
      type: "review_decision"
    })).toEqual({
      code: "unauthorized_operator",
      fromState: "pending_review",
      ok: false,
      state: "pending_review"
    });
    expect(transitionContactReviewState("needs_manual_review", {
      decision: "rejected",
      operator: { ...reviewer, authorized: false },
      type: "review_decision"
    })).toEqual({
      code: "unauthorized_operator",
      fromState: "needs_manual_review",
      ok: false,
      state: "needs_manual_review"
    });
  });

  it("keeps unchanged appeals, edited appeals, deletion, and restoration on their frozen paths", () => {
    const reviewer = {
      authorized: true,
      id: "reviewer-synthetic-a",
      kind: "synthetic_reviewer"
    } as const;
    const system = {
      environment: "synthetic",
      kind: "workflow_system"
    } as const;

    const unchangedAppeal = transitionContactReviewState("rejected", {
      operator: syntheticOwner,
      type: "appeal_unchanged"
    });
    expect(unchangedAppeal).toEqual({ fromState: "rejected", ok: true, state: "appeal_pending" });
    const queuedAppeal = transitionContactReviewState(unchangedAppeal.state, {
      operator: system,
      reason: "appeal_unchanged",
      type: "route_to_manual"
    });
    expect(queuedAppeal).toEqual({ fromState: "appeal_pending", ok: true, state: "needs_manual_review" });
    expect(transitionContactReviewState(queuedAppeal.state, {
      decision: "published",
      operator: reviewer,
      type: "review_decision"
    })).toEqual({ fromState: "needs_manual_review", ok: true, state: "published" });

    const editedAppeal = transitionContactReviewState("rejected", {
      operator: syntheticOwner,
      type: "appeal_edited"
    });
    expect(editedAppeal).toEqual({ fromState: "rejected", ok: true, state: "draft" });
    expect(transitionContactReviewState(editedAppeal.state, {
      operator: syntheticOwner,
      type: "submit"
    })).toEqual({ fromState: "draft", ok: true, state: "pending_review" });

    const deleted = transitionContactReviewState("published", {
      operator: syntheticOwner,
      type: "delete"
    });
    expect(deleted).toEqual({ fromState: "published", ok: true, state: "deleted" });
    expect(transitionContactReviewState(deleted.state, {
      operator: syntheticOwner,
      type: "restore"
    })).toEqual({ fromState: "deleted", ok: true, state: "pending_review" });
  });

  it("enumerates seven states and rejects direct or skipped transitions", () => {
    expect(CONTACT_REVIEW_STATES).toEqual([
      "draft",
      "pending_review",
      "needs_manual_review",
      "published",
      "rejected",
      "appeal_pending",
      "deleted"
    ]);
    const reviewer = {
      authorized: true,
      id: "reviewer-synthetic-a",
      kind: "synthetic_reviewer"
    } as const;
    const forbidden = [
      transitionContactReviewState("draft", {
        decision: "published",
        operator: reviewer,
        type: "review_decision"
      }),
      transitionContactReviewState("appeal_pending", {
        decision: "published",
        operator: reviewer,
        type: "review_decision"
      }),
      transitionContactReviewState("deleted", {
        decision: "published",
        operator: reviewer,
        type: "review_decision"
      }),
      transitionContactReviewState("published", {
        operator: syntheticOwner,
        type: "submit"
      }),
      transitionContactReviewState("deleted", {
        operator: syntheticOwner,
        type: "appeal_edited"
      })
    ];

    expect(forbidden).toHaveLength(5);
    expect(forbidden.every((result) => !result.ok && result.code === "invalid_transition")).toBe(true);
    expect(forbidden.map((result) => result.state)).toEqual([
      "draft",
      "appeal_pending",
      "deleted",
      "published",
      "deleted"
    ]);
  });

  it("routes every bounded uncertainty or failure reason to manual review", () => {
    const reasons = [
      "ambiguous",
      "normalization_failure",
      "policy_error",
      "queue_failure",
      "timeout"
    ] as const;

    expect(reasons.map((reason) => transitionContactReviewState("pending_review", {
      operator: { kind: "deterministic_rule", ruleVersion: "issue-0036-deterministic-v1" },
      reason,
      type: "route_to_manual"
    }))).toEqual(reasons.map(() => ({
      fromState: "pending_review",
      ok: true,
      state: "needs_manual_review"
    })));
  });
});
