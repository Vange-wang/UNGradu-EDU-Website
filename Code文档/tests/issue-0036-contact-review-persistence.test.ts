import { describe, expect, it } from "vitest";

import { InMemoryContactReviewPersistence } from "../server/security/contact-review-persistence";

const record = {
  contentHash: "sha256:synthetic-content-a",
  entityId: "entity-synthetic-a",
  entityType: "parent_need",
  field: "description",
  ownerId: "owner-synthetic-a",
  reviewKey: "review-synthetic-a",
  ruleVersion: "contact-review-rules-v1",
  state: "pending_review",
  version: 1
} as const;

const reviewer = {
  authorized: true,
  id: "reviewer-synthetic-a",
  kind: "synthetic_reviewer"
} as const;

describe("ISSUE-0036 bounded in-memory persistence contract", () => {
  it("applies one transition and one minimal audit event for repeated idempotent requests", () => {
    const persistence = new InMemoryContactReviewPersistence();
    expect(persistence.createChain(record)).toEqual({ ok: true });

    const command = {
      action: { decision: "published", operator: reviewer, type: "review_decision" },
      idempotencyKey: "command-synthetic-a",
      occurredAt: "2026-08-23T11:00:00.000Z",
      reviewKey: record.reviewKey
    } as const;
    expect(persistence.applyTransition(command)).toMatchObject({
      ok: true,
      replayed: false,
      state: "published"
    });
    expect(persistence.applyTransition(command)).toMatchObject({
      ok: true,
      replayed: true,
      state: "published"
    });

    expect(persistence.get(record.reviewKey)?.state).toBe("published");
    expect(persistence.auditEvents()).toEqual([
      expect.objectContaining({
        contentHash: record.contentHash,
        entityId: record.entityId,
        field: record.field,
        fromState: "pending_review",
        idempotencyKey: command.idempotencyKey,
        occurredAt: command.occurredAt,
        operator: { id: reviewer.id, kind: reviewer.kind },
        ownerId: record.ownerId,
        result: "transition_applied",
        reviewKey: record.reviewKey,
        ruleVersion: record.ruleVersion,
        toState: "published",
        version: record.version
      })
    ]);
  });

  it("isolates changed version or content as a new chain even when command keys repeat", () => {
    const persistence = new InMemoryContactReviewPersistence();
    const changed = {
      ...record,
      contentHash: "sha256:synthetic-content-b",
      reviewKey: "review-synthetic-b",
      version: 2
    } as const;
    persistence.createChain(record);
    persistence.createChain(changed);

    const action = { decision: "rejected", operator: reviewer, type: "review_decision" } as const;
    expect(persistence.applyTransition({
      action,
      idempotencyKey: "same-command-key",
      occurredAt: "2026-08-23T11:00:00.000Z",
      reviewKey: record.reviewKey
    })).toMatchObject({ ok: true, replayed: false, state: "rejected" });
    expect(persistence.applyTransition({
      action,
      idempotencyKey: "same-command-key",
      occurredAt: "2026-08-23T11:00:01.000Z",
      reviewKey: changed.reviewKey
    })).toMatchObject({ ok: true, replayed: false, state: "rejected" });

    expect(persistence.auditEvents()).toHaveLength(2);
    expect(persistence.auditEvents().map((event) => [
      event.reviewKey,
      event.version,
      event.contentHash
    ])).toEqual([
      [record.reviewKey, 1, record.contentHash],
      [changed.reviewKey, 2, changed.contentHash]
    ]);
  });

  it("keeps state, audit, and idempotency unchanged when the atomic commit fails", () => {
    const persistence = new InMemoryContactReviewPersistence();
    persistence.createChain(record);
    persistence.failNextBeforeCommit();
    const command = {
      action: { decision: "published", operator: reviewer, type: "review_decision" },
      idempotencyKey: "faulted-command",
      occurredAt: "2026-08-23T11:00:00.000Z",
      reviewKey: record.reviewKey
    } as const;

    expect(persistence.applyTransition(command)).toEqual({
      code: "persistence_unavailable",
      ok: false
    });
    expect(persistence.get(record.reviewKey)?.state).toBe("pending_review");
    expect(persistence.auditEvents()).toEqual([]);
    expect(persistence.applyTransition(command)).toMatchObject({
      ok: true,
      replayed: false,
      state: "published"
    });
    expect(persistence.auditEvents()).toHaveLength(1);
  });

  it("persists delete and restore as separate audited transitions without raw content fields", () => {
    const persistence = new InMemoryContactReviewPersistence();
    persistence.createChain(record);
    const owner = {
      authorized: true,
      id: record.ownerId,
      kind: "content_owner"
    } as const;

    expect(persistence.applyTransition({
      action: { operator: owner, type: "delete" },
      idempotencyKey: "delete-command",
      occurredAt: "2026-08-23T11:01:00.000Z",
      reviewKey: record.reviewKey
    })).toMatchObject({ ok: true, state: "deleted" });
    expect(persistence.applyTransition({
      action: { operator: owner, type: "restore" },
      idempotencyKey: "restore-command",
      occurredAt: "2026-08-23T11:02:00.000Z",
      reviewKey: record.reviewKey
    })).toMatchObject({ ok: true, state: "pending_review" });

    expect(persistence.auditEvents()).toHaveLength(2);
    expect(Object.keys(persistence.auditEvents()[0]).sort()).toEqual([
      "contentHash",
      "entityId",
      "entityType",
      "eventId",
      "field",
      "fromState",
      "idempotencyKey",
      "occurredAt",
      "operator",
      "ownerId",
      "result",
      "reviewKey",
      "ruleVersion",
      "toState",
      "version"
    ]);
    expect(JSON.stringify(persistence.auditEvents())).not.toMatch(/rawText|matchedText|prompt|secret|token/i);
  });

  it("rejects cross-owner mutations before state, audit, or idempotency can change", () => {
    const ownerA = {
      authorized: true,
      id: record.ownerId,
      kind: "content_owner"
    } as const;
    const ownerB = {
      authorized: true,
      id: "owner-synthetic-b",
      kind: "content_owner"
    } as const;
    const cases = [
      {
        actionA: { operator: ownerA, type: "delete" },
        actionB: { operator: ownerB, type: "delete" },
        initialState: "pending_review",
        successState: "deleted"
      },
      {
        actionA: { operator: ownerA, type: "appeal_unchanged" },
        actionB: { operator: ownerB, type: "appeal_unchanged" },
        initialState: "rejected",
        successState: "appeal_pending"
      },
      {
        actionA: { operator: ownerA, type: "restore" },
        actionB: { operator: ownerB, type: "restore" },
        initialState: "deleted",
        successState: "pending_review"
      }
    ] as const;

    for (const testCase of cases) {
      const persistence = new InMemoryContactReviewPersistence();
      persistence.createChain({ ...record, state: testCase.initialState });
      const command = {
        action: testCase.actionB,
        idempotencyKey: `cross-owner-${testCase.initialState}`,
        occurredAt: "2026-08-23T11:10:00.000Z",
        reviewKey: record.reviewKey
      } as const;

      expect(persistence.applyTransition(command)).toEqual({
        code: "owner_mismatch",
        ok: false
      });
      expect(persistence.get(record.reviewKey)?.state).toBe(testCase.initialState);
      expect(persistence.auditEvents()).toEqual([]);

      expect(persistence.applyTransition({ ...command, action: testCase.actionA })).toMatchObject({
        ok: true,
        replayed: false,
        state: testCase.successState
      });
      expect(persistence.auditEvents()).toHaveLength(1);
    }
  });
});
