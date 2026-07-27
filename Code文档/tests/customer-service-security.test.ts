import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { buildCustomerServiceHistory } from "@/features/customer-service/customer-service-api-client";
import {
  createConfiguredDifyAdapter,
  createCustomerServiceOrchestrator,
  createJsonlAuditStore,
  createJsonlIntakeStore,
  createModelSafeContext,
  type CustomerServiceAdapter,
  type CustomerServiceAuditRecord,
  type CustomerServiceConversationState,
  type CustomerServiceIntakeRecord
} from "@/server/customer-service";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true })
    )
  );
});

function createMemoryStateStore() {
  let state: CustomerServiceConversationState | null = null;
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
      const next = existing
        ? {
            ...existing,
            occurrenceCount: existing.occurrenceCount + 1,
            updatedAt: record.updatedAt
          }
        : record;
      records.set(record.fingerprint, next);
      return next;
    }
  };
}

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    headers: { "Content-Type": "application/json" },
    status
  });
}

describe("customer service privacy boundary", () => {
  it("redacts explicit contact, identity, address, and minor data before adapters and intake", async () => {
    const seenInputs: unknown[] = [];
    const rawValues = [
      "13800138000",
      "student@example.com",
      "张小明",
      "北京市海淀区中关村大街1号",
      "育才小学三年级2班",
      "110105201001011234"
    ];
    const intakeStore = createMemoryIntakeStore();
    const adapter: CustomerServiceAdapter = {
      async answerFromKnowledge(input) {
        seenInputs.push(input);
        return {
          candidate: null,
          citations: [],
          kbStatus: "miss",
          retrievalEvidence: {
            evidenceCount: 0,
            retrievalStatus: "miss",
            top1Score: 0,
            top2Score: 0
          }
        };
      },
      async generateFallback(input) {
        seenInputs.push(input);
        return {
          candidate: null,
          failureReason: "offline",
          ok: false
        };
      },
      async reviewAnswer() {
        throw new Error("review must not run");
      }
    };
    const orchestrator = createCustomerServiceOrchestrator({
      adapter,
      auditStore: createMemoryAuditStore(),
      criticalEventSink: { emit: vi.fn() },
      intakeStore,
      stateStore: createMemoryStateStore()
    });

    const result = await orchestrator.handleMessage({
      conversationId: "privacy-case",
      history: [
        {
          role: "user",
          text: "学生姓名张小明，邮箱student@example.com"
        }
      ],
      messageId: "privacy-message",
      pageContext: { entry: "customer-service-page", page: "/customer-service" },
      text: "学生姓名张小明，手机号13800138000，邮箱student@example.com，住址北京市海淀区中关村大街1号，就读育才小学三年级2班，身份证110105201001011234"
    });

    const serializedInputs = JSON.stringify(seenInputs);
    const serializedIntake = JSON.stringify([...intakeStore.records.values()]);
    for (const rawValue of rawValues) {
      expect(serializedInputs).not.toContain(rawValue);
      expect(serializedIntake).not.toContain(rawValue);
    }
    expect(serializedInputs).toContain("[学生姓名_1]");
    expect(serializedInputs).toContain("[手机号_1]");
    expect(serializedInputs).toContain("[邮箱_1]");
    expect(serializedInputs).toContain("[详细地址_1]");
    expect(serializedInputs).toContain("[学校班级_1]");
    expect(result.value.audit.piiPrecheckPass).toBe(true);
    expect(result.value.audit.piiRedactionSummary.redactionCount).toBeGreaterThanOrEqual(6);
    expect(result.value.audit.modelPayloadHash).toMatch(/^sha256:[A-F0-9]{64}$/);
    expect(result.value.audit.deterministicGuardResult).toBe("pass");
    expect(result.value.audit.historyWindowCount).toBe(1);
    expect(result.value.audit.conversationSafetyState.piiPlaceholderTypes).toEqual(
      expect.arrayContaining(["phone", "email", "minor_name", "address", "minor_school_class"])
    );
    expect(result.value.audit.terminalSafetyExit).toBe(false);
    expect(result.value.audit.criticalAlertEvent).toBeNull();
    expect(result.value.audit.fallbackStatus).toBe("failed");
    expect(result.value.audit.selfReviewStatus).toBe("not_called");
  });

  it("limits sanitized history to 12 messages and 4000 Unicode characters", () => {
    const history = Array.from({ length: 16 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      text: `${index}-${"中".repeat(450)}`
    }));

    const context = createModelSafeContext("当前问题", history);

    expect(context.sanitizedHistory.length).toBeLessThanOrEqual(12);
    expect(
      context.sanitizedHistory.reduce((total, item) => total + item.text.length, 0)
    ).toBeLessThanOrEqual(4000);
    expect(context.sanitizedHistory.at(-1)?.text.startsWith("15-")).toBe(true);
    expect(context.sanitizedHistory.some((item) => item.text === "当前问题")).toBe(false);
  });

  it("keeps the current user message separate from the clipped frontend history", () => {
    const previousMessages = Array.from({ length: 14 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      text: `previous-${index}`
    }));
    const currentMessage = "current-user-message";

    const history = buildCustomerServiceHistory(previousMessages);

    expect(history).toHaveLength(12);
    expect(history[0]?.text).toBe("previous-2");
    expect(history.some((message) => message.text === currentMessage)).toBe(false);
  });
});

describe("configured Dify adapter", () => {
  const env = {
    DIFY_APP_API_KEY: "server-only-app-key",
    DIFY_BASE_URL: "https://dify.example.test/v1",
    DIFY_FALLBACK_MODEL: "fallback-model",
    DIFY_SELF_REVIEW_MODEL: "review-model"
  };

  it.each([
    ["miss", "miss"],
    ["low_confidence_miss", "low_confidence_miss"],
    ["retrieval_error", "retrieval_error"],
    ["conflict", "conflict"]
  ] as const)("preserves KB status %s instead of treating answer text as a hit", async (status, expected) => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        answer: JSON.stringify({
          answer: status === "conflict" ? "互相冲突的回答" : "",
          citations: [],
          status
        })
      })
    );
    const adapter = createConfiguredDifyAdapter(env, fetchImpl);
    const safeContext = createModelSafeContext("老师实名认证吗？", []);

    const result = await adapter.answerFromKnowledge({
      conversationId: "kb-status",
      ...safeContext,
      normalizedText: "老师实名认证吗？",
      text: safeContext.sanitizedCurrentMessage
    });

    expect(result.kbStatus).toBe(expected);
    expect(result.candidate).toBeNull();
  });

  it("accepts a KB hit only with stable citation evidence", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        answer: JSON.stringify({
          answer: "老师资料需要经过平台审核。",
          citations: [
            {
              chunk_id: "chunk-verified-1",
              score: 0.91,
              snippet: "老师资料提交后进入平台审核流程。",
              title: "老师审核规则"
            }
          ],
          status: "hit"
        })
      })
    );
    const adapter = createConfiguredDifyAdapter(env, fetchImpl);
    const safeContext = createModelSafeContext("老师实名认证吗？", []);

    const result = await adapter.answerFromKnowledge({
      conversationId: "kb-hit",
      ...safeContext,
      normalizedText: "老师实名认证吗？",
      text: safeContext.sanitizedCurrentMessage
    });

    expect(result.kbStatus).toBe("hit");
    expect(result.candidate?.answerText).toContain("审核");
    expect(result.citations[0]?.chunkId).toBe("chunk-verified-1");
    expect(result.retrievalEvidence.top1Score).toBe(0.91);
  });

  it("accepts Dify JSON wrapped in a reasoning block", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        answer: [
          "<think>",
          "The retrieval context is empty, so this is a miss.",
          "</think>",
          JSON.stringify({ answer: "", citations: [], status: "miss" })
        ].join("\n")
      })
    );
    const adapter = createConfiguredDifyAdapter(env, fetchImpl);
    const safeContext = createModelSafeContext("老师实名认证吗？", []);

    const result = await adapter.answerFromKnowledge({
      conversationId: "local-conversation-id",
      ...safeContext,
      normalizedText: "老师实名认证吗？",
      text: safeContext.sanitizedCurrentMessage
    });

    expect(result.kbStatus).toBe("miss");
    expect(result.failureReason).toBeNull();
  });

  it("starts each Dify operation without forwarding the local conversation id", async () => {
    const conversationIds: unknown[] = [];
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        conversation_id?: unknown;
        inputs: { operation: string };
      };
      conversationIds.push(body.conversation_id);

      if (body.inputs.operation === "knowledge") {
        return jsonResponse({
          answer: JSON.stringify({ answer: "", citations: [], status: "miss" })
        });
      }
      return jsonResponse({
        answer: JSON.stringify({
          answer_text: "请说明需要咨询的家教服务环节。",
          answer_type: "clarify",
          uncertainty: "uncertain"
        })
      });
    });
    const adapter = createConfiguredDifyAdapter(env, fetchImpl);
    const safeContext = createModelSafeContext("还有哪些服务？", []);
    const request = {
      conversationId: "local-conversation-id",
      ...safeContext,
      normalizedText: "还有哪些服务？",
      text: safeContext.sanitizedCurrentMessage
    };

    await adapter.answerFromKnowledge(request);
    await adapter.generateFallback(request);

    expect(conversationIds).toEqual(["", ""]);
  });

  it("calls configured fallback and independent review operations and audits their success", async () => {
    const operations: string[] = [];
    let selfReviewQuery: Record<string, unknown> | null = null;
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        inputs: { operation: string };
        query: string;
      };
      operations.push(body.inputs.operation);

      if (body.inputs.operation === "knowledge") {
        return jsonResponse({
          answer: JSON.stringify({ answer: "", citations: [], status: "miss" })
        });
      }
      if (body.inputs.operation === "fallback") {
        return jsonResponse({
          answer: JSON.stringify({
            answer_text: "请说明需要咨询的家教服务环节。",
            answer_type: "clarify",
            uncertainty: "uncertain"
          })
        });
      }
      selfReviewQuery = JSON.parse(body.query) as Record<string, unknown>;
      return jsonResponse({
        answer: JSON.stringify({
          reason: "未发现高风险内容",
          recommended_action: "allow",
          review_pass: true,
          risk_categories: [],
          risk_level: "none",
          safe_answer: ""
        })
      });
    });
    const auditStore = createMemoryAuditStore();
    const orchestrator = createCustomerServiceOrchestrator({
      adapter: createConfiguredDifyAdapter(env, fetchImpl),
      auditStore,
      criticalEventSink: { emit: vi.fn() },
      intakeStore: createMemoryIntakeStore(),
      runtimeMode: "dify",
      stateStore: createMemoryStateStore()
    });

    const result = await orchestrator.handleMessage({
      conversationId: "dify-flow",
      messageId: "dify-message",
      pageContext: { entry: "customer-service-page", page: "/customer-service" },
      text: "还有哪些服务？"
    });

    expect(operations).toEqual(["knowledge", "fallback", "self_review"]);
    expect(selfReviewQuery).toMatchObject({
      candidate: {
        answerText: "请说明需要咨询的家教服务环节。",
        answerType: "clarify",
        uncertainty: "uncertain"
      },
      citations: []
    });
    expect(result.value.answer.source).toBe("fallback");
    expect(result.value.audit.fallbackStatus).toBe("success");
    expect(result.value.audit.selfReviewStatus).toBe("success");
    expect(result.value.audit.reviewIndependenceMode).toBe("different_model");
    expect(result.value.audit.fallbackContractValid).toBe(true);
  });

  it("fails closed and records the reason when the independent review call fails", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        inputs: { operation: string };
      };
      if (body.inputs.operation === "knowledge") {
        return jsonResponse({
          answer: JSON.stringify({ answer: "", citations: [], status: "miss" })
        });
      }
      if (body.inputs.operation === "fallback") {
        return jsonResponse({
          answer: JSON.stringify({
            answer_text: "候选内容",
            answer_type: "clarify",
            uncertainty: "uncertain"
          })
        });
      }
      return jsonResponse({ message: "review unavailable" }, 503);
    });
    const orchestrator = createCustomerServiceOrchestrator({
      adapter: createConfiguredDifyAdapter(env, fetchImpl),
      auditStore: createMemoryAuditStore(),
      criticalEventSink: { emit: vi.fn() },
      intakeStore: createMemoryIntakeStore(),
      runtimeMode: "dify",
      stateStore: createMemoryStateStore()
    });

    const result = await orchestrator.handleMessage({
      conversationId: "review-failure",
      messageId: "review-failure-message",
      pageContext: { entry: "customer-service-page", page: "/customer-service" },
      text: "未知问题"
    });

    expect(result.value.answer.source).toBe("template");
    expect(result.value.audit.selfReviewStatus).toBe("failed");
    expect(result.value.audit.reviewIndependenceMode).toBe("not_run");
    expect(result.value.audit.selfReviewFailureReason).toContain("503");
  });

  it("does not call fallback when retrieval fails or returns conflicting evidence", async () => {
    const generateFallback = vi.fn();
    const adapter: CustomerServiceAdapter = {
      async answerFromKnowledge() {
        return {
          candidate: null,
          citations: [],
          failureReason: "kb_conflict",
          kbStatus: "conflict",
          retrievalEvidence: {
            evidenceCount: 0,
            retrievalStatus: "conflict",
            top1Score: 0,
            top2Score: 0
          }
        };
      },
      generateFallback,
      async reviewAnswer() {
        throw new Error("review must not run");
      }
    };
    const orchestrator = createCustomerServiceOrchestrator({
      adapter,
      auditStore: createMemoryAuditStore(),
      criticalEventSink: { emit: vi.fn() },
      intakeStore: createMemoryIntakeStore(),
      runtimeMode: "dify",
      stateStore: createMemoryStateStore()
    });

    const result = await orchestrator.handleMessage({
      conversationId: "kb-conflict",
      messageId: "kb-conflict-message",
      pageContext: { entry: "customer-service-page", page: "/customer-service" },
      text: "老师是否都认证？"
    });

    expect(generateFallback).not.toHaveBeenCalled();
    expect(result.value.answer.templateId).toBe("SERVICE_ERROR");
    expect(result.value.audit.kbFailureReason).toBe("kb_conflict");
    expect(result.value.audit.fallbackStatus).toBe("not_called");
  });
});

describe("local MVP file intake store", () => {
  it("serializes concurrent writes across fingerprints and preserves idempotent counts", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "customer-service-intake-"));
    temporaryDirectories.push(directory);
    const filePath = path.join(directory, "intake.json");
    const store = createJsonlIntakeStore(filePath);
    const now = new Date().toISOString();
    const record = (fingerprint: string, messageId: string): CustomerServiceIntakeRecord => ({
      conversationId: "concurrent",
      createdAt: now,
      fingerprint,
      intakeRecordId: `intake-${fingerprint}`,
      intentLabel: "fallback",
      messageId,
      normalizationVersion: "kb-intake-norm-v1",
      occurrenceCount: 1,
      sanitizedQuestion: `问题${fingerprint}`,
      siteSection: "/customer-service",
      source: "kb_miss",
      status: "new",
      updatedAt: now
    });

    await Promise.all([
      store.upsert(record("a", "1")),
      store.upsert(record("b", "2")),
      store.upsert(record("a", "3"))
    ]);

    const stored = JSON.parse(await readFile(filePath, "utf8")) as CustomerServiceIntakeRecord[];
    expect(stored).toHaveLength(2);
    expect(stored.find((item) => item.fingerprint === "a")?.occurrenceCount).toBe(2);
  });

  it("serializes concurrent local audit appends without dropping records", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "customer-service-audit-"));
    temporaryDirectories.push(directory);
    const filePath = path.join(directory, "audit.jsonl");
    const store = createJsonlAuditStore(filePath);
    const baseRecord: CustomerServiceAuditRecord = {
      auditRecordId: "audit-1",
      conversationId: "conversation",
      conversationSafetyState: {
        conversationId: "conversation",
        handoffLocked: false,
        humanResolved: false,
        lastSafeAction: "allow",
        piiPlaceholderTypes: [],
        priorBlockCount: 0,
        priorRiskCategories: [],
        ruleVersion: "customer-service-guard-v1"
      },
      criticalAlertEvent: null,
      deterministicGuardResult: "pass",
      fallbackContractValid: false,
      fallbackFailureReason: null,
      fallbackStatus: "not_called",
      fallbackUsed: false,
      finalAction: "answered",
      finalGuardResult: "pass",
      guardNormalizationVersion: "customer-service-guard-v1",
      historyWindowCount: 0,
      intakeRecordId: null,
      kbFailureReason: null,
      kbStatus: "hit",
      messageId: "message-1",
      modelPayloadHash: `sha256:${"A".repeat(64)}`,
      piiPrecheckPass: true,
      piiRedactionSummary: {
        categories: [],
        policyVersion: "customer-service-pii-v1",
        redactionCount: 0
      },
      requestReceivedAt: new Date().toISOString(),
      responseLatencyMs: 1,
      retrievalEvidence: {
        evidenceCount: 1,
        retrievalStatus: "hit",
        top1Score: 1,
        top2Score: 0
      },
      reviewIndependenceMode: "same_model_degraded",
      reviewResult: "pass",
      runtimeConfigStatus: "ready",
      runtimeMode: "local_mvp",
      selfReviewFailureReason: null,
      selfReviewStatus: "success",
      terminalSafetyExit: false
    };

    await Promise.all(
      ["1", "2", "3"].map((suffix) =>
        store.append({
          ...baseRecord,
          auditRecordId: `audit-${suffix}`,
          messageId: `message-${suffix}`
        })
      )
    );

    const lines = (await readFile(filePath, "utf8")).trim().split(/\r?\n/);
    expect(lines).toHaveLength(3);
    expect(lines.map((line) => JSON.parse(line).auditRecordId).sort()).toEqual([
      "audit-1",
      "audit-2",
      "audit-3"
    ]);
  });
});
