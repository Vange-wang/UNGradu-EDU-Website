import {
  transitionContactReviewState,
  type ContactReviewAction,
  type ContactReviewOperator,
  type ContactReviewWorkflowState
} from "./contact-review-workflow";

export type ContactReviewPersistenceRecord = {
  contentHash: string;
  entityId: string;
  entityType: string;
  field: string;
  ownerId: string;
  reviewKey: string;
  ruleVersion: string;
  state: ContactReviewWorkflowState;
  version: number;
};

export type ContactReviewAuditEvent = Omit<ContactReviewPersistenceRecord, "state"> & {
  eventId: string;
  fromState: ContactReviewWorkflowState;
  idempotencyKey: string;
  occurredAt: string;
  operator: { id?: string; kind: ContactReviewOperator["kind"] };
  result: "transition_applied";
  toState: ContactReviewWorkflowState;
};

type ApplyTransitionCommand = {
  action: ContactReviewAction;
  idempotencyKey: string;
  occurredAt: string;
  reviewKey: string;
};

type PersistenceSuccess = {
  ok: true;
  replayed: boolean;
  state: ContactReviewWorkflowState;
};

type PersistenceFailure = {
  code:
    | "chain_exists"
    | "chain_not_found"
    | "owner_mismatch"
    | "persistence_unavailable"
    | "transition_rejected";
  ok: false;
};

export type ContactReviewPersistenceResult = PersistenceSuccess | PersistenceFailure;

function cloneRecord(record: ContactReviewPersistenceRecord): ContactReviewPersistenceRecord {
  return { ...record };
}

function operatorMetadata(operator: ContactReviewOperator): ContactReviewAuditEvent["operator"] {
  if (operator.kind === "content_owner" || operator.kind === "synthetic_reviewer") {
    return { id: operator.id, kind: operator.kind };
  }
  return { kind: operator.kind };
}

export class InMemoryContactReviewPersistence {
  private readonly audits: ContactReviewAuditEvent[] = [];
  private readonly chains = new Map<string, ContactReviewPersistenceRecord>();
  private readonly idempotency = new Map<string, PersistenceSuccess>();
  private failBeforeCommit = false;

  createChain(record: ContactReviewPersistenceRecord): { code: "chain_exists"; ok: false } | { ok: true } {
    if (this.chains.has(record.reviewKey)) {
      return { code: "chain_exists", ok: false };
    }
    this.chains.set(record.reviewKey, cloneRecord(record));
    return { ok: true };
  }

  applyTransition(command: ApplyTransitionCommand): ContactReviewPersistenceResult {
    const current = this.chains.get(command.reviewKey);
    if (!current) {
      return { code: "chain_not_found", ok: false };
    }
    if (
      command.action.operator.kind === "content_owner" &&
      command.action.operator.id !== current.ownerId
    ) {
      return { code: "owner_mismatch", ok: false };
    }

    const idempotencyScope = `${command.reviewKey}\u0000${command.idempotencyKey}`;
    const replay = this.idempotency.get(idempotencyScope);
    if (replay) {
      return { ...replay, replayed: true };
    }
    const transition = transitionContactReviewState(current.state, command.action);
    if (!transition.ok) {
      return { code: "transition_rejected", ok: false };
    }
    if (this.failBeforeCommit) {
      this.failBeforeCommit = false;
      return { code: "persistence_unavailable", ok: false };
    }

    const next = { ...current, state: transition.state };
    const success: PersistenceSuccess = { ok: true, replayed: false, state: transition.state };
    const audit: ContactReviewAuditEvent = {
      contentHash: current.contentHash,
      entityId: current.entityId,
      entityType: current.entityType,
      eventId: `synthetic-audit-${this.audits.length + 1}`,
      field: current.field,
      fromState: transition.fromState,
      idempotencyKey: command.idempotencyKey,
      occurredAt: command.occurredAt,
      operator: operatorMetadata(command.action.operator),
      ownerId: current.ownerId,
      result: "transition_applied",
      reviewKey: current.reviewKey,
      ruleVersion: current.ruleVersion,
      toState: transition.state,
      version: current.version
    };

    this.chains.set(command.reviewKey, next);
    this.audits.push(audit);
    this.idempotency.set(idempotencyScope, success);
    return success;
  }

  auditEvents(): ContactReviewAuditEvent[] {
    return this.audits.map((event) => ({ ...event, operator: { ...event.operator } }));
  }

  failNextBeforeCommit(): void {
    this.failBeforeCommit = true;
  }

  get(reviewKey: string): ContactReviewPersistenceRecord | null {
    const record = this.chains.get(reviewKey);
    return record ? cloneRecord(record) : null;
  }
}
