import { describe, expect, it } from "vitest";

import { reviewContactContent } from "../server/security/contact-content-review";
import { InMemorySyntheticContactReviewQueue } from "../server/security/contact-review-queue";
import { transitionContactReviewState } from "../server/security/contact-review-workflow";

const queueItem = {
  contentHash: "sha256:synthetic-content-a",
  enqueuedAt: "2026-08-23T10:00:00.000Z",
  entityId: "entity-synthetic-a",
  entityType: "parent_need",
  field: "description",
  ownerId: "owner-synthetic-a",
  reviewKey: "review-synthetic-a",
  ruleVersion: "contact-review-rules-v1",
  version: 1,
  workflowState: "pending_review"
} as const;

const reviewerA = {
  authorized: true,
  environment: "synthetic",
  id: "reviewer-synthetic-a",
  kind: "synthetic_reviewer"
} as const;

describe("ISSUE-0036 bounded synthetic review queue", () => {
  it("enqueues metadata without a real owner and allows an authorized synthetic fixture to claim it", () => {
    const queue = new InMemorySyntheticContactReviewQueue();

    const enqueued = queue.enqueue(queueItem, "enqueue-synthetic-a");
    expect(enqueued).toMatchObject({
      ok: true,
      replayed: false,
      task: {
        assigneeId: null,
        status: "unassigned"
      }
    });
    expect(queue.list()).toHaveLength(1);
    expect(queue.enqueue(queueItem, "enqueue-synthetic-a")).toMatchObject({
      ok: true,
      replayed: true
    });
    expect(queue.list()).toHaveLength(1);

    const claimed = queue.claim(queueItem.reviewKey, reviewerA, "2026-08-23T10:01:00.000Z");
    expect(claimed).toMatchObject({
      ok: true,
      task: {
        assigneeId: reviewerA.id,
        status: "claimed"
      }
    });
    expect(JSON.stringify(claimed)).not.toContain("contactText");
  });

  it("fails closed when an idempotency key is reused across a payload or review-chain boundary", () => {
    const variants = [
      { ...queueItem, contentHash: "sha256:synthetic-content-b" },
      { ...queueItem, ownerId: "owner-synthetic-b", reviewKey: "review-owner-b" },
      { ...queueItem, entityId: "entity-synthetic-b", reviewKey: "review-entity-b" },
      { ...queueItem, reviewKey: "review-version-b", version: 2 },
      { ...queueItem, contentHash: "sha256:synthetic-content-b", reviewKey: "review-content-b" },
      { ...queueItem, reviewKey: "review-chain-b" }
    ] as const;

    for (const variant of variants) {
      const queue = new InMemorySyntheticContactReviewQueue();
      expect(queue.enqueue(queueItem, "shared-command-key")).toMatchObject({
        ok: true,
        replayed: false
      });

      expect(queue.enqueue(variant, "shared-command-key")).toEqual({
        code: "idempotency_conflict",
        ok: false
      });
      expect(queue.list()).toEqual([
        expect.objectContaining({
          contentHash: queueItem.contentHash,
          entityId: queueItem.entityId,
          ownerId: queueItem.ownerId,
          reviewKey: queueItem.reviewKey,
          status: "unassigned",
          version: queueItem.version
        })
      ]);
      expect(queue.enqueue(queueItem, "shared-command-key")).toMatchObject({
        ok: true,
        replayed: true,
        task: { reviewKey: queueItem.reviewKey }
      });
    }
  });

  it("keeps second review unassigned until a different authorized synthetic reviewer claims it", () => {
    const queue = new InMemorySyntheticContactReviewQueue();
    queue.enqueue(queueItem, "enqueue-synthetic-a");
    queue.claim(queueItem.reviewKey, reviewerA, "2026-08-23T10:01:00.000Z");

    const pending = queue.requestSecondReview(
      queueItem.reviewKey,
      reviewerA,
      "2026-08-23T10:02:00.000Z"
    );
    expect(pending).toMatchObject({
      ok: true,
      task: {
        assigneeId: null,
        firstReviewerId: reviewerA.id,
        secondReviewerId: null,
        status: "second_review_pending"
      }
    });
    expect(queue.claimSecondReview(
      queueItem.reviewKey,
      reviewerA,
      "2026-08-23T10:03:00.000Z"
    )).toEqual({ code: "reviewer_separation_required", ok: false });

    const reviewerB = { ...reviewerA, id: "reviewer-synthetic-b" } as const;
    expect(queue.claimSecondReview(
      queueItem.reviewKey,
      reviewerB,
      "2026-08-23T10:03:00.000Z"
    )).toMatchObject({
      ok: true,
      task: {
        assigneeId: reviewerB.id,
        secondReviewerId: reviewerB.id,
        status: "second_review_claimed"
      }
    });
  });

  it("times out unattended work and fails closed without partial mutation on a queue fault", () => {
    const queue = new InMemorySyntheticContactReviewQueue();
    queue.enqueue(queueItem, "enqueue-synthetic-a");

    queue.failNext("claim");
    expect(queue.claim(
      queueItem.reviewKey,
      reviewerA,
      "2026-08-23T10:01:00.000Z"
    )).toEqual({ code: "queue_unavailable", ok: false });
    expect(queue.list()[0]).toMatchObject({ assigneeId: null, status: "unassigned" });

    queue.failNext("expire");
    expect(queue.expireUnattended("2026-08-23T10:05:00.000Z", 60_000)).toEqual({
      code: "queue_unavailable",
      ok: false
    });
    expect(queue.list()[0]).toMatchObject({ assigneeId: null, status: "unassigned" });

    const expired = queue.expireUnattended("2026-08-23T10:05:00.000Z", 60_000);
    expect(expired).toEqual({
      ok: true,
      tasks: [expect.objectContaining({ reviewKey: queueItem.reviewKey, status: "timed_out" })]
    });
    if (!expired.ok) {
      throw new Error("synthetic queue timeout was not observable");
    }
    expect(transitionContactReviewState(expired.tasks[0].workflowState, {
      operator: { kind: "deterministic_rule", ruleVersion: queueItem.ruleVersion },
      reason: "timeout",
      type: "route_to_manual"
    })).toEqual({
      fromState: "pending_review",
      ok: true,
      state: "needs_manual_review"
    });
    expect(queue.claim(
      queueItem.reviewKey,
      reviewerA,
      "2026-08-23T10:06:00.000Z"
    )).toEqual({ code: "invalid_state", ok: false });
  });

  it("carries only the S1 classification metadata into the synthetic manual queue", () => {
    const reviewed = reviewContactContent({
      entityId: "entity-synthetic-b",
      entityType: "parent_need",
      field: "childIntro",
      ownerId: "owner-synthetic-b",
      text: "synthetic reference 123456789012",
      version: 1
    });
    expect(reviewed.classification).toBe("ambiguous");
    expect(reviewed.state).toBe("needs_manual_review");
    if (
      reviewed.audit.entityId === null ||
      reviewed.audit.ownerId === null ||
      reviewed.audit.reviewKey === null ||
      reviewed.audit.version === null ||
      reviewed.state === "draft"
    ) {
      throw new Error("synthetic S1 fixture did not produce queue-safe metadata");
    }

    const queue = new InMemorySyntheticContactReviewQueue();
    expect(queue.enqueue({
      contentHash: reviewed.audit.contentHash,
      enqueuedAt: "2026-08-23T10:10:00.000Z",
      entityId: reviewed.audit.entityId,
      entityType: reviewed.audit.entityType,
      field: reviewed.audit.field,
      ownerId: reviewed.audit.ownerId,
      reviewKey: reviewed.audit.reviewKey,
      ruleVersion: reviewed.audit.ruleVersion,
      version: reviewed.audit.version,
      workflowState: reviewed.state
    }, "enqueue-synthetic-b")).toMatchObject({
      ok: true,
      task: { status: "unassigned", workflowState: "needs_manual_review" }
    });
    const snapshot = JSON.stringify(queue.list());
    expect(snapshot).not.toContain("synthetic reference");
    expect(snapshot).not.toContain("123456789012");
  });
});
