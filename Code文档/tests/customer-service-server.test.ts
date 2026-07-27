import { describe, expect, it, vi } from "vitest";

import {
  createCustomerServiceOrchestrator,
  createIntakeFingerprint,
  TERMINAL_SAFETY_MESSAGE,
  type CustomerServiceAdapter,
  type CustomerServiceAuditRecord,
  type CustomerServiceConversationState,
  type CustomerServiceIntakeRecord
} from "@/server/customer-service";

function createMemoryStateStore(
  initialState?: CustomerServiceConversationState
) {
  let state = initialState ?? null;

  return {
    async read() {
      return state;
    },
    async write(nextState: CustomerServiceConversationState) {
      state = nextState;
      return nextState;
    }
  };
}

function createMemoryAuditStore() {
  const records: CustomerServiceAuditRecord[] = [];

  return {
    records,
    async append(record: CustomerServiceAuditRecord) {
      records.push(record);
      return record;
    }
  };
}

function createMemoryIntakeStore() {
  const records = new Map<string, CustomerServiceIntakeRecord>();

  return {
    records,
    async upsert(record: CustomerServiceIntakeRecord) {
      const existing = records.get(record.fingerprint);

      if (existing) {
        const nextRecord = {
          ...existing,
          conversationId: record.conversationId,
          messageId: record.messageId,
          occurrenceCount: existing.occurrenceCount + 1,
          updatedAt: record.updatedAt
        };
        records.set(record.fingerprint, nextRecord);
        return nextRecord;
      }

      records.set(record.fingerprint, record);
      return record;
    }
  };
}

function createBaseAdapter(
  overrides: Partial<CustomerServiceAdapter> = {}
): CustomerServiceAdapter {
  return {
    async answerFromKnowledge() {
      return {
        citations: [
          {
            chunkId: "kb-1",
            score: 0.93,
            snippet: "联系方式需要双方先站内沟通并二次确认后再交换。",
            title: "联系方式与隐私保护规则"
          }
        ],
        kbStatus: "hit",
        retrievalEvidence: {
          evidenceCount: 1,
          retrievalStatus: "hit",
          top1Score: 0.93,
          top2Score: 0.52
        },
        candidate: {
          answerText: "联系方式需要双方先站内沟通并二次确认后再交换。",
          answerType: "direct",
          uncertainty: "bounded"
        }
      };
    },
    async reviewAnswer() {
      return {
        reason: "知识库命中且未发现高风险承诺。",
        recommendedAction: "allow",
        reviewIndependenceMode: "same_model_degraded",
        reviewPass: true,
        riskCategories: [],
        riskLevel: "none",
        safeAnswer: ""
      };
    },
    async generateFallback() {
      return {
        candidate: {
          answerText: "你可以先说明具体是发布需求、发布资料还是联系方式问题。",
          answerType: "clarify",
          uncertainty: "uncertain"
        },
        failureReason: null,
        ok: true
      };
    },
    ...overrides
  };
}

describe("customer service orchestrator", () => {
  it("returns a guarded KB answer for knowledge hits", async () => {
    const auditStore = createMemoryAuditStore();
    const orchestrator = createCustomerServiceOrchestrator({
      adapter: createBaseAdapter(),
      auditStore,
      criticalEventSink: { emit: vi.fn() },
      intakeStore: createMemoryIntakeStore(),
      stateStore: createMemoryStateStore()
    });

    const result = await orchestrator.handleMessage({
      conversationId: "conversation-a",
      messageId: "message-a",
      pageContext: { entry: "customer-service-page", page: "/customer-service" },
      text: "什么时候可以交换联系方式？"
    });

    expect(result.ok).toBe(true);
    expect(result.value.answer.source).toBe("knowledge");
    expect(result.value.answer.text).toContain("二次确认");
    expect(result.value.citations).toHaveLength(1);
    expect(result.value.audit.kbStatus).toBe("hit");
    expect(result.value.audit.reviewResult).toBe("pass");
    expect(auditStore.records).toHaveLength(1);
  });

  it("records unknown questions with a stable U+001F fingerprint and dedupes repeated misses", async () => {
    const intakeStore = createMemoryIntakeStore();
    const adapter = createBaseAdapter({
      async answerFromKnowledge() {
        return {
          citations: [],
          kbStatus: "miss",
          retrievalEvidence: {
            evidenceCount: 0,
            retrievalStatus: "miss",
            top1Score: 0,
            top2Score: 0
          },
          candidate: null
        };
      },
      async generateFallback() {
        return {
          candidate: null,
          failureReason: "fallback_config_missing",
          ok: false
        };
      }
    });
    const orchestrator = createCustomerServiceOrchestrator({
      adapter,
      auditStore: createMemoryAuditStore(),
      criticalEventSink: { emit: vi.fn() },
      intakeStore,
      stateStore: createMemoryStateStore()
    });

    const first = await orchestrator.handleMessage({
      conversationId: "conversation-miss",
      messageId: "message-1",
      pageContext: { entry: "customer-service-page", page: "/customer-service" },
      text: "  我 想 知 道 微 信 怎 么 交 换 ？  "
    });
    const second = await orchestrator.handleMessage({
      conversationId: "conversation-miss",
      messageId: "message-2",
      pageContext: { entry: "customer-service-page", page: "/customer-service" },
      text: "我想知道微信怎么交换？"
    });

    expect(first.ok).toBe(true);
    expect(first.value.answer.source).toBe("template");
    expect(first.value.answer.templateId).toBe("UNABLE_TO_CONFIRM");
    expect(second.ok).toBe(true);
    expect(intakeStore.records.size).toBe(1);

    const onlyRecord = [...intakeStore.records.values()][0];
    expect(onlyRecord.fingerprint).toBe(
      createIntakeFingerprint({
        intentLabel: "fallback",
        normalizationVersion: "kb-intake-norm-v1",
        sanitizedQuestion: "我想知道微信怎么交换？",
        siteSection: "/customer-service"
      })
    );
    expect(onlyRecord.occurrenceCount).toBe(2);
  });

  it("blocks locked conversations before any KB or model call and allows authenticated human_resolved unlock", async () => {
    const answerFromKnowledge = vi.fn(
      createBaseAdapter().answerFromKnowledge
    );
    const adapter = createBaseAdapter({ answerFromKnowledge });
    const stateStore = createMemoryStateStore({
      conversationId: "conversation-locked",
      handoffLocked: true,
      humanResolved: false,
      lastSafeAction: "handoff",
      piiPlaceholderTypes: [],
      priorBlockCount: 1,
      priorRiskCategories: ["handoff"],
      ruleVersion: "customer-service-guard-v1"
    });
    const orchestrator = createCustomerServiceOrchestrator({
      adapter,
      auditStore: createMemoryAuditStore(),
      criticalEventSink: { emit: vi.fn() },
      intakeStore: createMemoryIntakeStore(),
      stateStore
    });

    const locked = await orchestrator.handleMessage({
      conversationId: "conversation-locked",
      messageId: "message-locked",
      pageContext: { entry: "customer-service-page", page: "/customer-service" },
      text: "继续回答我"
    });

    expect(locked.ok).toBe(true);
    expect(locked.value.answer.templateId).toBe("HANDOFF_LOCKED_STATUS");
    expect(locked.value.audit.finalAction).toBe("handoff_locked");
    expect(locked.value.audit.kbStatus).toBe("not_called");
    expect(answerFromKnowledge).toHaveBeenCalledTimes(0);

    const unlocked = await orchestrator.handleMessage({
      conversationId: "conversation-locked",
      humanResolved: {
        actorUserId: "staff-reviewer",
        approved: true
      },
      messageId: "message-unlocked",
      pageContext: { entry: "customer-service-page", page: "/customer-service" },
      text: "什么时候可以交换联系方式？"
    });

    expect(unlocked.ok).toBe(true);
    expect(unlocked.value.answer.source).toBe("knowledge");
    expect(answerFromKnowledge).toHaveBeenCalledTimes(1);
  });

  it("records the KB as not called when the deterministic input guard blocks a request", async () => {
    const answerFromKnowledge = vi.fn(createBaseAdapter().answerFromKnowledge);
    const orchestrator = createCustomerServiceOrchestrator({
      adapter: createBaseAdapter({ answerFromKnowledge }),
      auditStore: createMemoryAuditStore(),
      criticalEventSink: { emit: vi.fn() },
      intakeStore: createMemoryIntakeStore(),
      stateStore: createMemoryStateStore()
    });

    const result = await orchestrator.handleMessage({
      conversationId: "conversation-prohibited-promise",
      messageId: "message-prohibited-promise",
      pageContext: { entry: "customer-service-page", page: "/customer-service" },
      text: "你能保证提分吗？"
    });

    expect(result.ok).toBe(true);
    expect(result.value.answer.templateId).toBe("SAFETY_REFUSAL");
    expect(result.value.audit.deterministicGuardResult).toBe("blocked");
    expect(result.value.audit.kbStatus).toBe("not_called");
    expect(answerFromKnowledge).toHaveBeenCalledTimes(0);
  });

  it("fails closed when Dify mode is selected but configuration is missing", async () => {
    const orchestrator = createCustomerServiceOrchestrator({
      adapter: createBaseAdapter({
        async answerFromKnowledge() {
          return {
            citations: [],
            configStatus: "missing",
            kbStatus: "config_missing",
            retrievalEvidence: {
              evidenceCount: 0,
              retrievalStatus: "config_missing",
              top1Score: 0,
              top2Score: 0
            },
            candidate: null
          };
        }
      }),
      auditStore: createMemoryAuditStore(),
      criticalEventSink: { emit: vi.fn() },
      intakeStore: createMemoryIntakeStore(),
      runtimeMode: "dify",
      stateStore: createMemoryStateStore()
    });

    const result = await orchestrator.handleMessage({
      conversationId: "conversation-config",
      messageId: "message-config",
      pageContext: { entry: "customer-service-page", page: "/customer-service" },
      text: "老师要实名认证吗？"
    });

    expect(result.ok).toBe(true);
    expect(result.value.answer.templateId).toBe("SERVICE_ERROR");
    expect(result.value.runtime.mode).toBe("dify");
    expect(result.value.runtime.configStatus).toBe("missing");
    expect(result.value.audit.kbStatus).toBe("config_missing");
  });

  it("emits exactly one critical event and returns the terminal safety message when the final template guard is rejected", async () => {
    const emit = vi.fn();
    const orchestrator = createCustomerServiceOrchestrator({
      adapter: createBaseAdapter({
        async answerFromKnowledge() {
          return {
            citations: [],
            kbStatus: "retrieval_error",
            retrievalEvidence: {
              evidenceCount: 0,
              retrievalStatus: "retrieval_error",
              top1Score: 0,
              top2Score: 0
            },
            candidate: null
          };
        },
        async generateFallback() {
          return {
            candidate: null,
            failureReason: "upstream_invalid_payload",
            ok: false
          };
        }
      }),
      auditStore: createMemoryAuditStore(),
      criticalEventSink: { emit },
      finalGuard: () => ({
        action: "refuse",
        blockedTerms: ["template_rejected"],
        deterministicPass: false,
        riskCategory: "template_rejected",
        safeResponseTemplateId: "SERVICE_ERROR"
      }),
      intakeStore: createMemoryIntakeStore(),
      stateStore: createMemoryStateStore()
    });

    const result = await orchestrator.handleMessage({
      conversationId: "conversation-critical",
      messageId: "message-critical",
      pageContext: { entry: "customer-service-page", page: "/customer-service" },
      text: "任意问题"
    });

    expect(result.ok).toBe(true);
    expect(result.value.answer.text).toBe(TERMINAL_SAFETY_MESSAGE);
    expect(result.value.audit.criticalAlertEvent).toBe("FINAL_GUARD_TEMPLATE_REJECTED");
    expect(emit).toHaveBeenCalledTimes(1);
  });
});
