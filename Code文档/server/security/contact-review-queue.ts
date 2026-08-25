export type SyntheticReviewerFixture = {
  authorized: boolean;
  environment: "synthetic";
  id: string;
  kind: "synthetic_reviewer";
};

export type SyntheticContactReviewQueueItem = {
  contentHash: string;
  enqueuedAt: string;
  entityId: string;
  entityType: string;
  field: string;
  ownerId: string;
  reviewKey: string;
  ruleVersion: string;
  version: number;
  workflowState: "needs_manual_review" | "pending_review";
};

export type SyntheticContactReviewQueueTask = SyntheticContactReviewQueueItem & {
  assigneeId: string | null;
  claimedAt: string | null;
  firstReviewerId: string | null;
  secondReviewerId: string | null;
  status:
    | "unassigned"
    | "claimed"
    | "second_review_pending"
    | "second_review_claimed"
    | "timed_out";
};

type QueueSuccess = {
  ok: true;
  replayed: boolean;
  task: SyntheticContactReviewQueueTask;
};

type QueueFailure = {
  code:
    | "idempotency_conflict"
    | "invalid_state"
    | "queue_unavailable"
    | "reviewer_separation_required"
    | "task_not_found"
    | "unauthorized_reviewer";
  ok: false;
};

export type SyntheticQueueResult = QueueSuccess | QueueFailure;

export type SyntheticQueueExpirationResult =
  | { ok: true; tasks: SyntheticContactReviewQueueTask[] }
  | { code: "invalid_time" | "queue_unavailable"; ok: false };

type QueueOperation = "claim" | "claim_second_review" | "enqueue" | "expire" | "request_second_review";

function cloneTask(task: SyntheticContactReviewQueueTask): SyntheticContactReviewQueueTask {
  return { ...task };
}

function matchesEnqueuePayload(
  task: SyntheticContactReviewQueueTask,
  item: SyntheticContactReviewQueueItem
): boolean {
  return task.contentHash === item.contentHash &&
    task.entityId === item.entityId &&
    task.entityType === item.entityType &&
    task.field === item.field &&
    task.ownerId === item.ownerId &&
    task.reviewKey === item.reviewKey &&
    task.ruleVersion === item.ruleVersion &&
    task.version === item.version &&
    task.workflowState === item.workflowState;
}

export class InMemorySyntheticContactReviewQueue {
  private readonly enqueueIdempotency = new Map<string, string>();
  private pendingFault: QueueOperation | null = null;
  private readonly tasks = new Map<string, SyntheticContactReviewQueueTask>();

  private consumeFault(operation: QueueOperation): boolean {
    if (this.pendingFault !== operation) {
      return false;
    }
    this.pendingFault = null;
    return true;
  }

  failNext(operation: QueueOperation): void {
    this.pendingFault = operation;
  }

  enqueue(item: SyntheticContactReviewQueueItem, idempotencyKey: string): SyntheticQueueResult {
    if (this.consumeFault("enqueue")) {
      return { code: "queue_unavailable", ok: false };
    }
    const existingReviewKey = this.enqueueIdempotency.get(idempotencyKey);
    if (existingReviewKey) {
      if (existingReviewKey !== item.reviewKey) {
        return { code: "idempotency_conflict", ok: false };
      }
      const existing = this.tasks.get(existingReviewKey);
      if (!existing) {
        return { code: "queue_unavailable", ok: false };
      }
      if (!matchesEnqueuePayload(existing, item)) {
        return { code: "idempotency_conflict", ok: false };
      }
      return { ok: true, replayed: true, task: cloneTask(existing) };
    }

    if (
      this.tasks.has(item.reviewKey) ||
      (item.workflowState !== "pending_review" && item.workflowState !== "needs_manual_review")
    ) {
      return { code: "invalid_state", ok: false };
    }

    const task: SyntheticContactReviewQueueTask = {
      ...item,
      assigneeId: null,
      claimedAt: null,
      firstReviewerId: null,
      secondReviewerId: null,
      status: "unassigned"
    };
    this.tasks.set(item.reviewKey, task);
    this.enqueueIdempotency.set(idempotencyKey, item.reviewKey);
    return { ok: true, replayed: false, task: cloneTask(task) };
  }

  claim(reviewKey: string, reviewer: SyntheticReviewerFixture, claimedAt: string): SyntheticQueueResult {
    if (this.consumeFault("claim")) {
      return { code: "queue_unavailable", ok: false };
    }
    if (!reviewer.authorized || reviewer.environment !== "synthetic") {
      return { code: "unauthorized_reviewer", ok: false };
    }
    const current = this.tasks.get(reviewKey);
    if (!current) {
      return { code: "task_not_found", ok: false };
    }
    if (current.status !== "unassigned") {
      return { code: "invalid_state", ok: false };
    }
    const next: SyntheticContactReviewQueueTask = {
      ...current,
      assigneeId: reviewer.id,
      claimedAt,
      firstReviewerId: reviewer.id,
      status: "claimed"
    };
    this.tasks.set(reviewKey, next);
    return { ok: true, replayed: false, task: cloneTask(next) };
  }

  requestSecondReview(
    reviewKey: string,
    reviewer: SyntheticReviewerFixture,
    requestedAt: string
  ): SyntheticQueueResult {
    if (this.consumeFault("request_second_review")) {
      return { code: "queue_unavailable", ok: false };
    }
    const current = this.tasks.get(reviewKey);
    if (!current) {
      return { code: "task_not_found", ok: false };
    }
    if (
      !reviewer.authorized ||
      reviewer.environment !== "synthetic" ||
      current.status !== "claimed" ||
      current.firstReviewerId !== reviewer.id
    ) {
      return { code: "unauthorized_reviewer", ok: false };
    }
    const next: SyntheticContactReviewQueueTask = {
      ...current,
      assigneeId: null,
      claimedAt: requestedAt,
      status: "second_review_pending"
    };
    this.tasks.set(reviewKey, next);
    return { ok: true, replayed: false, task: cloneTask(next) };
  }

  claimSecondReview(
    reviewKey: string,
    reviewer: SyntheticReviewerFixture,
    claimedAt: string
  ): SyntheticQueueResult {
    if (this.consumeFault("claim_second_review")) {
      return { code: "queue_unavailable", ok: false };
    }
    if (!reviewer.authorized || reviewer.environment !== "synthetic") {
      return { code: "unauthorized_reviewer", ok: false };
    }
    const current = this.tasks.get(reviewKey);
    if (!current) {
      return { code: "task_not_found", ok: false };
    }
    if (current.status !== "second_review_pending") {
      return { code: "invalid_state", ok: false };
    }
    if (current.firstReviewerId === reviewer.id) {
      return { code: "reviewer_separation_required", ok: false };
    }
    const next: SyntheticContactReviewQueueTask = {
      ...current,
      assigneeId: reviewer.id,
      claimedAt,
      secondReviewerId: reviewer.id,
      status: "second_review_claimed"
    };
    this.tasks.set(reviewKey, next);
    return { ok: true, replayed: false, task: cloneTask(next) };
  }

  expireUnattended(now: string, timeoutMs: number): SyntheticQueueExpirationResult {
    if (this.consumeFault("expire")) {
      return { code: "queue_unavailable", ok: false };
    }
    const nowMs = Date.parse(now);
    if (!Number.isFinite(nowMs) || !Number.isFinite(timeoutMs) || timeoutMs < 0) {
      return { code: "invalid_time", ok: false };
    }
    const expired: SyntheticContactReviewQueueTask[] = [];
    for (const [reviewKey, current] of this.tasks) {
      if (current.status !== "unassigned" && current.status !== "second_review_pending") {
        continue;
      }
      const waitingSince = current.status === "unassigned" ? current.enqueuedAt : current.claimedAt;
      const waitingSinceMs = waitingSince ? Date.parse(waitingSince) : Number.NaN;
      if (!Number.isFinite(waitingSinceMs) || nowMs - waitingSinceMs < timeoutMs) {
        continue;
      }
      const next = { ...current, assigneeId: null, status: "timed_out" as const };
      this.tasks.set(reviewKey, next);
      expired.push(cloneTask(next));
    }
    return { ok: true, tasks: expired };
  }

  list(): SyntheticContactReviewQueueTask[] {
    return [...this.tasks.values()].map(cloneTask);
  }
}
