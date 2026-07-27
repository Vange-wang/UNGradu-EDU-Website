import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getTutorCustomerServiceReply } from "@/features/customer-service/tutor-customer-service-agent";
import {
  createCloudBaseCustomerServiceStores,
  type CustomerServiceCloudBaseDatabase
} from "@/server/customer-service-cloudbase";
import { createCloudBaseServerApp } from "@/server/cloudbase-server";

export const TERMINAL_SAFETY_MESSAGE = "抱歉，当前无法处理您的请求，请稍后再试。";
export const CUSTOMER_SERVICE_GUARD_VERSION = "customer-service-guard-v1";
export const KB_INTAKE_NORMALIZATION_VERSION = "kb-intake-norm-v1";
export const PII_REDACTION_POLICY_VERSION = "customer-service-pii-v1";
const UNIT_SEPARATOR = "\u001F";
const HISTORY_MESSAGE_LIMIT = 12;
const HISTORY_CHARACTER_LIMIT = 4000;

export type CustomerServiceAnswerType =
  | "direct"
  | "clarify"
  | "guidance"
  | "handoff_suggestion";

export type CustomerServiceRuntimeMode = "local_mvp" | "dify";
export type CustomerServiceRuntimeConfigStatus = "ready" | "missing";
export type CustomerServiceKbStatus =
  | "not_called"
  | "hit"
  | "miss"
  | "low_confidence_miss"
  | "conflict"
  | "retrieval_error"
  | "config_missing";
export type CustomerServiceReviewMode =
  | "different_model"
  | "same_model_degraded"
  | "not_run";
export type CustomerServiceFinalAction =
  | "answered"
  | "template"
  | "terminal_safety_exit"
  | "handoff_locked";

export type CustomerServiceCitation = {
  chunkId: string;
  score: number;
  snippet: string;
  title: string;
};

export type CustomerServiceRetrievalEvidence = {
  evidenceCount: number;
  retrievalStatus: CustomerServiceKbStatus;
  top1Score: number;
  top2Score: number;
  top1ChunkId?: string;
};

export type CustomerServiceCandidate = {
  answerText: string;
  answerType: CustomerServiceAnswerType;
  uncertainty: "bounded" | "uncertain";
};

export type CustomerServiceReviewResult = {
  callStatus?: "success" | "failed" | "not_called";
  failureReason?: string | null;
  reason: string;
  recommendedAction: "allow" | "refuse" | "handoff" | "rewrite";
  reviewIndependenceMode: CustomerServiceReviewMode;
  reviewPass: boolean;
  riskCategories: string[];
  riskLevel: "none" | "low" | "medium" | "high";
  safeAnswer: string;
};

export type CustomerServiceAdapterKnowledgeResult = {
  candidate: CustomerServiceCandidate | null;
  citations: CustomerServiceCitation[];
  configStatus?: CustomerServiceRuntimeConfigStatus;
  kbStatus: CustomerServiceKbStatus;
  failureReason?: string | null;
  retrievalEvidence: CustomerServiceRetrievalEvidence;
};

export type CustomerServiceAdapterFallbackResult = {
  candidate: CustomerServiceCandidate | null;
  contractValid?: boolean;
  failureReason: string | null;
  ok: boolean;
};

export type CustomerServiceModelSafeContext = {
  historyWindowCount: number;
  modelPayloadHash: string;
  piiCategories: string[];
  piiPrecheckPass: boolean;
  redactionCount: number;
  redactionPolicyVersion: string;
  sanitizedCurrentMessage: string;
  sanitizedHistory: Array<{ role: "user" | "assistant"; text: string }>;
};

export type CustomerServiceAdapter = {
  answerFromKnowledge: (input: {
    conversationId: string;
    historyWindowCount: number;
    modelPayloadHash: string;
    normalizedText: string;
    piiCategories: string[];
    piiPrecheckPass: boolean;
    redactionCount: number;
    redactionPolicyVersion: string;
    sanitizedCurrentMessage: string;
    sanitizedHistory: Array<{ role: "user" | "assistant"; text: string }>;
    text: string;
  }) => Promise<CustomerServiceAdapterKnowledgeResult>;
  generateFallback: (input: {
    conversationId: string;
    historyWindowCount: number;
    modelPayloadHash: string;
    normalizedText: string;
    piiCategories: string[];
    piiPrecheckPass: boolean;
    redactionCount: number;
    redactionPolicyVersion: string;
    sanitizedCurrentMessage: string;
    sanitizedHistory: Array<{ role: "user" | "assistant"; text: string }>;
    text: string;
  }) => Promise<CustomerServiceAdapterFallbackResult>;
  reviewAnswer: (input: {
    candidate: CustomerServiceCandidate;
    citations: CustomerServiceCitation[];
    conversationSafetyState: CustomerServiceConversationState;
    historyWindowCount?: number;
    modelPayloadHash?: string;
    normalizedText: string;
    piiCategories?: string[];
    piiPrecheckPass?: boolean;
    redactionCount?: number;
    redactionPolicyVersion?: string;
    sanitizedCurrentMessage?: string;
    sanitizedHistory?: Array<{ role: "user" | "assistant"; text: string }>;
    text: string;
  }) => Promise<CustomerServiceReviewResult>;
};

export type CustomerServiceConversationState = {
  conversationId: string;
  handoffLocked: boolean;
  humanResolved: boolean;
  lastSafeAction: "allow" | "refuse" | "handoff" | "terminal";
  piiPlaceholderTypes: string[];
  priorBlockCount: number;
  priorRiskCategories: string[];
  ruleVersion: string;
};

export type CustomerServiceAuditRecord = {
  auditRecordId: string;
  conversationId: string;
  messageId: string;
  criticalAlertEvent: string | null;
  deterministicGuardResult: "pass" | "blocked";
  fallbackContractValid: boolean;
  fallbackFailureReason: string | null;
  fallbackStatus: "not_called" | "success" | "failed";
  fallbackUsed: boolean;
  finalAction: CustomerServiceFinalAction;
  finalGuardResult: "pass" | "blocked";
  guardNormalizationVersion: string;
  historyWindowCount: number;
  intakeRecordId: string | null;
  kbFailureReason: string | null;
  kbStatus: CustomerServiceKbStatus;
  modelPayloadHash: string;
  piiPrecheckPass: boolean;
  piiRedactionSummary: {
    categories: string[];
    policyVersion: string;
    redactionCount: number;
  };
  requestReceivedAt: string;
  responseLatencyMs: number;
  retrievalEvidence: CustomerServiceRetrievalEvidence;
  reviewIndependenceMode: CustomerServiceReviewMode;
  reviewResult: "pass" | "rewrite" | "refuse" | "handoff" | "not_run";
  runtimeConfigStatus: CustomerServiceRuntimeConfigStatus;
  runtimeMode: CustomerServiceRuntimeMode;
  selfReviewFailureReason: string | null;
  selfReviewStatus: "not_called" | "success" | "failed";
  terminalSafetyExit: boolean;
  conversationSafetyState: CustomerServiceConversationState;
};

export type CustomerServiceIntakeRecord = {
  conversationId: string;
  createdAt: string;
  fingerprint: string;
  intakeRecordId: string;
  intentLabel: string;
  messageId: string;
  normalizationVersion: string;
  occurrenceCount: number;
  sanitizedQuestion: string;
  siteSection: string;
  source: "kb_miss" | "low_confidence_miss" | "review_handoff";
  status: string;
  updatedAt: string;
};

export type CustomerServiceStateStore = {
  read: (conversationId: string) => Promise<CustomerServiceConversationState | null>;
  write: (state: CustomerServiceConversationState) => Promise<CustomerServiceConversationState>;
};

export type CustomerServiceAuditStore = {
  append: (record: CustomerServiceAuditRecord) => Promise<CustomerServiceAuditRecord>;
};

export type CustomerServiceIntakeStore = {
  readByFingerprint?: (
    fingerprint: string
  ) => Promise<CustomerServiceIntakeRecord | null>;
  removeByFingerprint?: (fingerprint: string) => Promise<boolean>;
  upsert: (record: CustomerServiceIntakeRecord) => Promise<CustomerServiceIntakeRecord>;
};

export type CustomerServiceCriticalEventSink = {
  emit: (event: {
    code: "FINAL_GUARD_TEMPLATE_REJECTED";
    conversationIdHash: string;
    messageId: string;
    templateId: string;
    timestamp: string;
  }) => Promise<void> | void;
};

type CustomerServiceAuditTelemetry = Pick<
  CustomerServiceAuditRecord,
  | "conversationSafetyState"
  | "deterministicGuardResult"
  | "fallbackContractValid"
  | "fallbackFailureReason"
  | "fallbackStatus"
  | "guardNormalizationVersion"
  | "historyWindowCount"
  | "kbFailureReason"
  | "modelPayloadHash"
  | "piiPrecheckPass"
  | "piiRedactionSummary"
  | "retrievalEvidence"
  | "reviewIndependenceMode"
  | "selfReviewFailureReason"
  | "selfReviewStatus"
  | "terminalSafetyExit"
>;

type CustomerServiceGuardResult = {
  action: "allow" | "refuse" | "handoff";
  blockedTerms: string[];
  deterministicPass: boolean;
  riskCategory: string;
  safeResponseTemplateId?: CustomerServiceTemplateId;
};

type CustomerServiceHandleRequest = {
  conversationId?: string;
  history?: Array<{ role: "user" | "assistant"; text: string }>;
  humanResolved?: {
    actorUserId: string;
    approved: boolean;
  };
  messageId?: string;
  pageContext: { entry: string; page: string };
  text: string;
};

type CustomerServiceResponse = {
  ok: true;
  value: {
    answer: {
      handoffRequired: boolean;
      source: "knowledge" | "fallback" | "template" | "terminal_guard";
      templateId?: CustomerServiceTemplateId;
      text: string;
      type: CustomerServiceAnswerType;
      uncertainty: "bounded" | "uncertain";
    };
    audit: CustomerServiceAuditRecord;
    citations: CustomerServiceCitation[];
    conversationId: string;
    conversationSafetyState: CustomerServiceConversationState;
    messageId: string;
    runtime: {
      configStatus: CustomerServiceRuntimeConfigStatus;
      mode: CustomerServiceRuntimeMode;
    };
  };
};

type CustomerServiceTemplateId =
  | "SAFETY_REFUSAL"
  | "HANDOFF_REQUIRED"
  | "HANDOFF_LOCKED_STATUS"
  | "SERVICE_BUSY"
  | "SERVICE_ERROR"
  | "UNABLE_TO_CONFIRM";

type CustomerServiceTemplate = {
  id: CustomerServiceTemplateId;
  text: string;
  type: CustomerServiceAnswerType;
};

const CUSTOMER_SERVICE_TEMPLATES: Record<
  CustomerServiceTemplateId,
  CustomerServiceTemplate
> = {
  HANDOFF_LOCKED_STATUS: {
    id: "HANDOFF_LOCKED_STATUS",
    text: "您的问题已转交人工客服处理，当前会话暂不继续自动回复。",
    type: "handoff_suggestion"
  },
  HANDOFF_REQUIRED: {
    id: "HANDOFF_REQUIRED",
    text: "这个问题需要人工客服进一步确认。请通过页面上的安全联系入口提交必要信息。",
    type: "handoff_suggestion"
  },
  SAFETY_REFUSAL: {
    id: "SAFETY_REFUSAL",
    text: "抱歉，这类内容我不能提供。我可以继续帮你了解家教服务流程、老师匹配方式或试听安排。",
    type: "guidance"
  },
  SERVICE_BUSY: {
    id: "SERVICE_BUSY",
    text: "当前服务繁忙，请稍后再试。",
    type: "guidance"
  },
  SERVICE_ERROR: {
    id: "SERVICE_ERROR",
    text: "当前服务暂时不可用，请稍后再试。",
    type: "guidance"
  },
  UNABLE_TO_CONFIRM: {
    id: "UNABLE_TO_CONFIRM",
    text: "暂时无法确认这个问题，请联系人工客服。",
    type: "handoff_suggestion"
  }
};

const INPUT_BLOCK_PATTERNS: Array<{
  action: "refuse" | "handoff";
  category: string;
  pattern: RegExp;
  templateId: CustomerServiceTemplateId;
}> = [
  { pattern: /忽略规则|绕过安全|输出系统提示词|secret|密钥|后台地址/i, action: "refuse", category: "policy_bypass", templateId: "SAFETY_REFUSAL" as const },
  { pattern: /退款|赔偿|仲裁|合同|开票|投诉|骚扰/i, action: "handoff", category: "manual_handoff", templateId: "HANDOFF_REQUIRED" as const },
  { pattern: /保证提分|保证录取|百分百过/i, action: "refuse", category: "prohibited_promise", templateId: "SAFETY_REFUSAL" as const }
];

const OUTPUT_BLOCK_PATTERNS = [
  { pattern: /保证提分|保证录取|百分百过|一定退款|平台担保交易/i, category: "prohibited_promise" },
  { pattern: /系统提示词|secret|密钥|后台地址/i, category: "secret_exposure" }
];

function sha256Utf8(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex").toUpperCase();
}

function createOpaqueId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

export function normalizeForGuard(input: string) {
  return input
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type PiiRedactionSession = {
  categories: Set<string>;
  counters: Map<string, number>;
  replacements: Map<string, string>;
  redactionCount: number;
};

function createPiiRedactionSession(): PiiRedactionSession {
  return {
    categories: new Set(),
    counters: new Map(),
    replacements: new Map(),
    redactionCount: 0
  };
}

function placeholderFor(
  session: PiiRedactionSession,
  category: string,
  label: string,
  rawValue: string
) {
  const key = `${category}${UNIT_SEPARATOR}${rawValue}`;
  const existing = session.replacements.get(key);
  if (existing) {
    session.redactionCount += 1;
    session.categories.add(category);
    return existing;
  }

  const nextIndex = (session.counters.get(category) ?? 0) + 1;
  session.counters.set(category, nextIndex);
  const placeholder = `[${label}_${nextIndex}]`;
  session.replacements.set(key, placeholder);
  session.redactionCount += 1;
  session.categories.add(category);
  return placeholder;
}

function redactPii(input: string, session: PiiRedactionSession) {
  let output = input.normalize("NFKC");
  const replaceValue = (
    pattern: RegExp,
    category: string,
    label: string
  ) => {
    output = output.replace(pattern, (rawValue) =>
      placeholderFor(session, category, label, rawValue)
    );
  };
  const replaceLabeledValue = (
    pattern: RegExp,
    category: string,
    label: string
  ) => {
    output = output.replace(pattern, (fullValue, prefix: string, rawValue: string) =>
      `${prefix}${placeholderFor(session, category, label, rawValue)}`
    );
  };

  replaceValue(
    /(?<!\d)(?:\d{17}[\dXx]|\d{15})(?!\d)/g,
    "id_card",
    "身份证"
  );
  replaceValue(
    /(?<!\d)1[3-9]\d{9}(?!\d)/g,
    "phone",
    "手机号"
  );
  replaceValue(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    "email",
    "邮箱"
  );
  replaceLabeledValue(
    /((?:微信号?|WeChat)[：:\s]*)([A-Za-z][-_A-Za-z0-9]{5,19})/gi,
    "wechat",
    "微信号"
  );
  replaceLabeledValue(
    /((?:QQ|扣扣)[号：:\s]*)([1-9]\d{4,11})/gi,
    "qq",
    "QQ"
  );
  replaceLabeledValue(
    /((?:学生姓名|孩子姓名|孩子叫)[：:\s]*)([\p{Script=Han}]{2,4})/gu,
    "minor_name",
    "学生姓名"
  );
  replaceLabeledValue(
    /((?:老师姓名|教师姓名|老师叫)[：:\s]*)([\p{Script=Han}]{2,4})/gu,
    "teacher_name",
    "教师姓名"
  );
  replaceLabeledValue(
    /((?:姓名|我叫|联系人)[：:\s]*)([\p{Script=Han}]{2,4})/gu,
    "person_name",
    "姓名"
  );
  replaceLabeledValue(
    /((?:住址|家庭住址|详细地址|地址)[：:\s]*)([^,，.。；;\n]{4,80})/gu,
    "address",
    "详细地址"
  );
  replaceLabeledValue(
    /((?:就读|学校|班级)[：:\s]*)([^,，.。；;\n]{2,50}(?:学校|小学|中学|年级|班)[^,，.。；;\n]{0,20})/gu,
    "minor_school_class",
    "学校班级"
  );
  replaceLabeledValue(
    /((?:银行卡|银行卡号|支付账号|支付宝账号)[：:\s]*)([A-Za-z0-9@._-]{6,32})/gu,
    "payment_account",
    "支付账号"
  );
  replaceValue(
    /(?<!\d)(?:\d[ -]?){15,18}\d(?!\d)/g,
    "bank_card",
    "银行卡"
  );

  return output.trim();
}

function sanitizeForIntake(input: string) {
  const session = createPiiRedactionSession();
  return redactPii(input, session).replace(
    /\[([^\]_\d]+)_\d+\]/g,
    "[$1]"
  );
}

export function createModelSafeContext(
  currentMessage: string,
  history: Array<{ role: "user" | "assistant"; text: string }>
): CustomerServiceModelSafeContext {
  const session = createPiiRedactionSession();
  const sanitizedCurrentMessage = redactPii(currentMessage, session);
  const sanitizedHistoryAll = history.map((message) => ({
    role: message.role,
    text: redactPii(message.text, session)
  }));
  const recentHistory = sanitizedHistoryAll.slice(-HISTORY_MESSAGE_LIMIT);
  const sanitizedHistory: typeof recentHistory = [];
  let remainingCharacters = HISTORY_CHARACTER_LIMIT;

  for (let index = recentHistory.length - 1; index >= 0; index -= 1) {
    const message = recentHistory[index];
    if (message.text.length > remainingCharacters) {
      if (remainingCharacters > 0) {
        sanitizedHistory.unshift({
          ...message,
          text: message.text.slice(-remainingCharacters)
        });
      }
      break;
    }
    sanitizedHistory.unshift(message);
    remainingCharacters -= message.text.length;
  }

  const piiPrecheckPass =
    !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(
      `${sanitizedCurrentMessage}${sanitizedHistory
        .map((message) => message.text)
        .join("")}`
    );
  const hashPayload = {
    pii_categories: [...session.categories].sort(),
    redaction_count: session.redactionCount,
    redaction_policy_version: PII_REDACTION_POLICY_VERSION,
    sanitized_current_message: sanitizedCurrentMessage,
    sanitized_history: sanitizedHistory
  };

  return {
    historyWindowCount: sanitizedHistory.length,
    modelPayloadHash: `sha256:${sha256Utf8(JSON.stringify(hashPayload))}`,
    piiCategories: [...session.categories].sort(),
    piiPrecheckPass,
    redactionCount: session.redactionCount,
    redactionPolicyVersion: PII_REDACTION_POLICY_VERSION,
    sanitizedCurrentMessage,
    sanitizedHistory
  };
}

export function createIntakeFingerprint({
  intentLabel,
  normalizationVersion,
  sanitizedQuestion,
  siteSection
}: {
  intentLabel: string;
  normalizationVersion: string;
  sanitizedQuestion: string;
  siteSection: string;
}) {
  const normalized = sanitizeForIntake(sanitizedQuestion)
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g, "")
    .replace(/[，。！？、,.!?/\\:;()[\]{}<>《》"'`~@#$%^&*_+=|-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/(?<=[\p{Script=Han}])\s+(?=[\p{Script=Han}])/gu, "")
    .trim()
    .toLowerCase();

  const fingerprintInput = [
    normalizationVersion,
    normalized,
    intentLabel,
    siteSection
  ].join(UNIT_SEPARATOR);

  return `sha256:${sha256Utf8(fingerprintInput)}`;
}

function createDefaultConversationSafetyState(
  conversationId: string
): CustomerServiceConversationState {
  return {
    conversationId,
    handoffLocked: false,
    humanResolved: false,
    lastSafeAction: "allow",
    piiPlaceholderTypes: [],
    priorBlockCount: 0,
    priorRiskCategories: [],
    ruleVersion: CUSTOMER_SERVICE_GUARD_VERSION
  };
}

function guardInput(text: string): CustomerServiceGuardResult {
  const normalized = normalizeForGuard(text);
  for (const rule of INPUT_BLOCK_PATTERNS) {
    if (rule.pattern.test(normalized)) {
      return {
        action: rule.action,
        blockedTerms: [rule.category],
        deterministicPass: false,
        riskCategory: rule.category,
        safeResponseTemplateId: rule.templateId
      };
    }
  }

  return {
    action: "allow",
    blockedTerms: [],
    deterministicPass: true,
    riskCategory: "none"
  };
}

function guardOutput(text: string): CustomerServiceGuardResult {
  const normalized = normalizeForGuard(text);
  for (const rule of OUTPUT_BLOCK_PATTERNS) {
    if (rule.pattern.test(normalized)) {
      return {
        action: "refuse",
        blockedTerms: [rule.category],
        deterministicPass: false,
        riskCategory: rule.category,
        safeResponseTemplateId: "SAFETY_REFUSAL"
      };
    }
  }

  return {
    action: "allow",
    blockedTerms: [],
    deterministicPass: true,
    riskCategory: "none"
  };
}

async function ensureParentDirectory(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFileAtomic(filePath: string, value: unknown) {
  await ensureParentDirectory(filePath);
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

const localFileLocks = new Map<string, Promise<void>>();

async function withLocalFileLock<T>(filePath: string, operation: () => Promise<T>) {
  const currentLock = localFileLocks.get(filePath) ?? Promise.resolve();
  let release!: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  const queuedLock = currentLock.then(() => nextLock);
  localFileLocks.set(filePath, queuedLock);
  await currentLock;

  try {
    return await operation();
  } finally {
    release();
    if (localFileLocks.get(filePath) === queuedLock) {
      localFileLocks.delete(filePath);
    }
  }
}

export function createFileConversationStateStore(filePath: string): CustomerServiceStateStore {
  return {
    async read(conversationId) {
      const stateMap = await readJsonFile<Record<string, CustomerServiceConversationState>>(
        filePath,
        {}
      );
      return stateMap[conversationId] ?? null;
    },
    async write(state) {
      return withLocalFileLock(filePath, async () => {
        const stateMap = await readJsonFile<Record<string, CustomerServiceConversationState>>(
          filePath,
          {}
        );
        stateMap[state.conversationId] = state;
        await writeJsonFileAtomic(filePath, stateMap);
        return state;
      });
    }
  };
}

export function createJsonlAuditStore(filePath: string): CustomerServiceAuditStore {
  return {
    async append(record) {
      return withLocalFileLock(filePath, async () => {
        await ensureParentDirectory(filePath);
        let current = "";
        try {
          current = await readFile(filePath, "utf8");
        } catch {}
        await writeFile(
          filePath,
          `${current}${current ? "\n" : ""}${JSON.stringify(record)}`,
          "utf8"
        );
        return record;
      });
    }
  };
}

export function createJsonlIntakeStore(filePath: string): CustomerServiceIntakeStore {
  return {
    async readByFingerprint(fingerprint) {
      const records = await readJsonFile<CustomerServiceIntakeRecord[]>(filePath, []);
      return records.find((item) => item.fingerprint === fingerprint) ?? null;
    },
    async removeByFingerprint(fingerprint) {
      return withLocalFileLock(filePath, async () => {
        const records = await readJsonFile<CustomerServiceIntakeRecord[]>(filePath, []);
        const nextRecords = records.filter((item) => item.fingerprint !== fingerprint);

        if (nextRecords.length === records.length) {
          return false;
        }

        await writeJsonFileAtomic(filePath, nextRecords);
        return true;
      });
    },
    async upsert(record) {
      return withLocalFileLock(filePath, async () => {
        const records = await readJsonFile<CustomerServiceIntakeRecord[]>(filePath, []);
        const existingIndex = records.findIndex(
          (item) => item.fingerprint === record.fingerprint
        );
        let nextRecord = record;

        if (existingIndex >= 0) {
          nextRecord = {
            ...records[existingIndex],
            conversationId: record.conversationId,
            messageId: record.messageId,
            occurrenceCount: records[existingIndex].occurrenceCount + 1,
            updatedAt: record.updatedAt
          };
          records[existingIndex] = nextRecord;
        } else {
          records.push(record);
        }

        await writeJsonFileAtomic(filePath, records);
        return nextRecord;
      });
    }
  };
}

export function createLocalCustomerServiceAdapter(): CustomerServiceAdapter {
  return {
    async answerFromKnowledge({ text }) {
      const reply = getTutorCustomerServiceReply(text);

      if (reply.intent === "fallback") {
        return {
          candidate: null,
          citations: [],
          configStatus: "ready",
          kbStatus: "miss",
          retrievalEvidence: {
            evidenceCount: 0,
            retrievalStatus: "miss",
            top1Score: 0,
            top2Score: 0
          }
        };
      }

      return {
        candidate: {
          answerText: reply.answer,
          answerType:
            reply.intent === "risk_handoff" ? "handoff_suggestion" : "direct",
          uncertainty: reply.intent === "risk_handoff" ? "uncertain" : "bounded"
        },
        citations: [
          {
            chunkId: `local-kb-${reply.intent}`,
            score: 1,
            snippet: reply.answer,
            title: "本地 MVP 客服规则库"
          }
        ],
        configStatus: "ready",
        kbStatus: "hit",
        retrievalEvidence: {
          evidenceCount: 1,
          retrievalStatus: "hit",
          top1Score: 1,
          top2Score: 0
        }
      };
    },
    async generateFallback() {
      return {
        candidate: null,
        failureReason: "local_mvp_no_fallback_model",
        ok: false
      };
    },
    async reviewAnswer({ candidate }) {
      const outputGuard = guardOutput(candidate.answerText);
      if (!outputGuard.deterministicPass) {
        return {
          reason: "本地规则复核认为候选回答包含高风险内容。",
          recommendedAction: "refuse",
          reviewIndependenceMode: "same_model_degraded",
          reviewPass: false,
          riskCategories: [outputGuard.riskCategory],
          riskLevel: "high",
          safeAnswer: ""
        };
      }

      return {
        reason: "本地 MVP 规则复核通过。",
        recommendedAction: "allow",
        reviewIndependenceMode: "same_model_degraded",
        reviewPass: true,
        riskCategories: [],
        riskLevel: "none",
        safeAnswer: ""
      };
    }
  };
}

export function createConfiguredDifyAdapter(
  env: Readonly<Record<string, string | undefined>>,
  fetchImpl: typeof fetch = fetch
): CustomerServiceAdapter {
  const baseUrl = env.DIFY_BASE_URL?.trim() ?? "";
  const appKey = env.DIFY_APP_API_KEY?.trim() ?? "";
  const fallbackModel = env.DIFY_FALLBACK_MODEL?.trim() ?? "";
  const reviewModel = env.DIFY_SELF_REVIEW_MODEL?.trim() ?? "";
  const timeoutMs = Math.max(
    1000,
    Number(env.DIFY_REQUEST_TIMEOUT_MS?.trim() || "15000")
  );

  if (!baseUrl || !appKey || !fallbackModel || !reviewModel) {
    return {
      async answerFromKnowledge() {
        return {
          candidate: null,
          citations: [],
          configStatus: "missing",
          failureReason: "dify_config_missing",
          kbStatus: "config_missing",
          retrievalEvidence: {
            evidenceCount: 0,
            retrievalStatus: "config_missing",
            top1Score: 0,
            top2Score: 0
          }
        };
      },
      async generateFallback() {
        return {
          candidate: null,
          contractValid: false,
          failureReason: "dify_config_missing",
          ok: false
        };
      },
      async reviewAnswer() {
        return {
          callStatus: "not_called",
          failureReason: "dify_config_missing",
          reason: "Dify 配置缺失，无法执行自审。",
          recommendedAction: "handoff",
          reviewIndependenceMode: "not_run",
          reviewPass: false,
          riskCategories: ["config_missing"],
          riskLevel: "high",
          safeAnswer: ""
        };
      }
    };
  }

  async function postJson(payload: Record<string, unknown>) {
    const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/chat-messages`, {
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${appKey}`,
        "Content-Type": "application/json"
      },
      method: "POST",
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (!response.ok) {
      throw new Error(`Dify request failed with status ${response.status}`);
    }

    return (await response.json()) as Record<string, unknown>;
  }

  function parseAnswerJson(payload: Record<string, unknown>) {
    let answer = typeof payload.answer === "string" ? payload.answer.trim() : "";
    if (!answer) {
      throw new Error("dify_answer_missing");
    }
    const reasoningWrapped = answer.match(
      /^<think>[\s\S]*?<\/think>\s*([\s\S]+)$/i
    );
    if (reasoningWrapped) {
      answer = reasoningWrapped[1].trim();
    }
    const parsed = JSON.parse(answer) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("dify_answer_not_object");
    }
    return parsed as Record<string, unknown>;
  }

  function hasOnlyKeys(value: Record<string, unknown>, allowed: string[]) {
    return Object.keys(value).every((key) => allowed.includes(key));
  }

  function createDifyInputs(
    operation: "knowledge" | "fallback" | "self_review",
    input: {
      conversationSafetyState?: CustomerServiceConversationState;
      historyWindowCount?: number;
      modelPayloadHash?: string;
      piiCategories?: string[];
      piiPrecheckPass?: boolean;
      redactionCount?: number;
      redactionPolicyVersion?: string;
      sanitizedCurrentMessage?: string;
      sanitizedHistory?: Array<{ role: "user" | "assistant"; text: string }>;
    },
    extra: Record<string, unknown> = {}
  ) {
    return {
      conversation_safety_state: input.conversationSafetyState,
      history_window_count: input.historyWindowCount ?? 0,
      model_payload_hash: input.modelPayloadHash ?? "",
      operation,
      pii_categories: input.piiCategories ?? [],
      pii_precheck_pass: input.piiPrecheckPass ?? false,
      redaction_count: input.redactionCount ?? 0,
      redaction_policy_version: input.redactionPolicyVersion ?? "",
      sanitized_current_message: input.sanitizedCurrentMessage ?? "",
      sanitized_history: input.sanitizedHistory ?? [],
      ...extra
    };
  }

  return {
    async answerFromKnowledge(input) {
      try {
        const payload = await postJson({
          conversation_id: "",
          inputs: createDifyInputs("knowledge", input, {
            normalized_user_text: input.normalizedText
          }),
          query: input.text,
          response_mode: "blocking",
          user: `conversation:${sha256Utf8(input.conversationId)}`
        });
        const parsed = parseAnswerJson(payload);
        const rawStatus = parsed.status;
        const supportedStatuses: CustomerServiceKbStatus[] = [
          "hit",
          "miss",
          "low_confidence_miss",
          "conflict",
          "retrieval_error"
        ];
        const kbStatus = supportedStatuses.includes(
          rawStatus as CustomerServiceKbStatus
        )
          ? (rawStatus as CustomerServiceKbStatus)
          : "retrieval_error";
        const citations = Array.isArray(parsed.citations)
          ? parsed.citations.flatMap((item) => {
              if (!item || typeof item !== "object" || Array.isArray(item)) {
                return [];
              }
              const citation = item as Record<string, unknown>;
              if (
                typeof citation.chunk_id !== "string" ||
                !citation.chunk_id.trim() ||
                typeof citation.score !== "number" ||
                !Number.isFinite(citation.score) ||
                typeof citation.snippet !== "string" ||
                typeof citation.title !== "string"
              ) {
                return [];
              }
              return [{
                chunkId: citation.chunk_id,
                score: citation.score,
                snippet: citation.snippet,
                title: citation.title
              }];
            })
          : [];
        citations.sort((left, right) => right.score - left.score);
        const answerText =
          typeof parsed.answer === "string" ? parsed.answer.trim() : "";
        const explainableHit =
          kbStatus === "hit" && Boolean(answerText) && citations.length > 0;
        const effectiveStatus =
          kbStatus === "hit" && !explainableHit ? "retrieval_error" : kbStatus;

        return {
          candidate: explainableHit
            ? {
                answerText,
                answerType: "direct",
                uncertainty: "bounded"
              }
            : null,
          citations: explainableHit ? citations : [],
          configStatus: "ready",
          failureReason:
            kbStatus === "hit" && !explainableHit
              ? "kb_evidence_invalid"
              : effectiveStatus === "retrieval_error"
                ? "kb_retrieval_failed"
                : effectiveStatus === "conflict"
                  ? "kb_conflict"
                  : null,
          kbStatus: effectiveStatus,
          retrievalEvidence: {
            evidenceCount: explainableHit ? citations.length : 0,
            retrievalStatus: effectiveStatus,
            top1ChunkId: explainableHit ? citations[0]?.chunkId : undefined,
            top1Score: explainableHit ? citations[0]?.score ?? 0 : 0,
            top2Score: explainableHit ? citations[1]?.score ?? 0 : 0
          }
        };
      } catch (error) {
        return {
          candidate: null,
          citations: [],
          configStatus: "ready",
          failureReason:
            error instanceof Error ? error.message : "kb_retrieval_failed",
          kbStatus: "retrieval_error",
          retrievalEvidence: {
            evidenceCount: 0,
            retrievalStatus: "retrieval_error",
            top1Score: 0,
            top2Score: 0
          }
        };
      }
    },
    async generateFallback(input) {
      try {
        const payload = await postJson({
          conversation_id: "",
          inputs: createDifyInputs("fallback", input, {
            model: fallbackModel,
            normalized_user_text: input.normalizedText
          }),
          query: input.text,
          response_mode: "blocking",
          user: `conversation:${sha256Utf8(input.conversationId)}`
        });
        const parsed = parseAnswerJson(payload);
        const allowedKeys = ["answer_text", "answer_type", "uncertainty"];
        const answerText =
          typeof parsed.answer_text === "string" ? parsed.answer_text : "";
        const answerType = String(parsed.answer_type);
        const uncertainty = String(parsed.uncertainty);
        const contractValid =
          hasOnlyKeys(parsed, allowedKeys) &&
          answerText.trim().length > 0 &&
          answerText.length <= 2000 &&
          ["direct", "clarify", "guidance", "handoff_suggestion"].includes(
            answerType
          ) &&
          ["bounded", "uncertain"].includes(uncertainty) &&
          !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F<>]/.test(
            answerText
          );
        if (!contractValid) {
          return {
            candidate: null,
            contractValid: false,
            failureReason: "fallback_contract_invalid",
            ok: false
          };
        }
        return {
          candidate: {
            answerText: answerText.trim(),
            answerType: answerType as CustomerServiceAnswerType,
            uncertainty: uncertainty as "bounded" | "uncertain"
          },
          contractValid: true,
          failureReason: null,
          ok: true
        };
      } catch (error) {
        return {
          candidate: null,
          contractValid: false,
          failureReason:
            error instanceof Error ? error.message : "fallback_call_failed",
          ok: false
        };
      }
    },
    async reviewAnswer(input) {
      if (fallbackModel === reviewModel) {
        return {
          callStatus: "not_called",
          failureReason: "self_review_model_not_independent",
          reason: "fallback 与 self-review 配置为同一模型。",
          recommendedAction: "handoff",
          reviewIndependenceMode: "same_model_degraded",
          reviewPass: false,
          riskCategories: ["review_not_independent"],
          riskLevel: "high",
          safeAnswer: ""
        };
      }

      try {
        const reviewQuery = JSON.stringify({
          candidate: input.candidate,
          citations: input.citations,
          conversation_safety_state: input.conversationSafetyState,
          history_window_count: input.historyWindowCount ?? 0,
          model_payload_hash: input.modelPayloadHash ?? "",
          normalized_text: input.normalizedText,
          pii_categories: input.piiCategories ?? [],
          pii_precheck_pass: input.piiPrecheckPass ?? false,
          redaction_count: input.redactionCount ?? 0,
          redaction_policy_version: input.redactionPolicyVersion ?? ""
        });
        const payload = await postJson({
          conversation_id: "",
          inputs: createDifyInputs("self_review", input, {
            candidate: input.candidate,
            citations: input.citations,
            model: reviewModel
          }),
          query: reviewQuery,
          response_mode: "blocking",
          user: "customer-service-self-review"
        });
        const parsed = parseAnswerJson(payload);
        const reason = typeof parsed.reason === "string" ? parsed.reason : "";
        const recommendedAction = String(parsed.recommended_action);
        const reviewPass =
          typeof parsed.review_pass === "boolean" ? parsed.review_pass : null;
        const riskCategories = Array.isArray(parsed.risk_categories)
          ? parsed.risk_categories
          : [];
        const riskLevel = String(parsed.risk_level);
        const safeAnswer =
          typeof parsed.safe_answer === "string" ? parsed.safe_answer : "";
        const contractValid =
          hasOnlyKeys(parsed, [
            "reason",
            "recommended_action",
            "review_pass",
            "risk_categories",
            "risk_level",
            "safe_answer"
          ]) &&
          Boolean(reason) &&
          ["allow", "refuse", "handoff", "rewrite"].includes(
            recommendedAction
          ) &&
          reviewPass !== null &&
          riskCategories.every((item) => typeof item === "string") &&
          ["none", "low", "medium", "high"].includes(riskLevel);
        if (!contractValid) {
          throw new Error("self_review_contract_invalid");
        }

        return {
          callStatus: "success",
          failureReason: null,
          reason,
          recommendedAction: recommendedAction as CustomerServiceReviewResult["recommendedAction"],
          reviewIndependenceMode: "different_model",
          reviewPass: reviewPass as boolean,
          riskCategories: riskCategories as string[],
          riskLevel: riskLevel as CustomerServiceReviewResult["riskLevel"],
          safeAnswer
        };
      } catch (error) {
        return {
          callStatus: "failed",
          failureReason:
            error instanceof Error ? error.message : "self_review_call_failed",
          reason: "self-review 调用失败，已关闭输出。",
          recommendedAction: "handoff",
          reviewIndependenceMode: "not_run",
          reviewPass: false,
          riskCategories: ["self_review_failed"],
          riskLevel: "high",
          safeAnswer: ""
        };
      }
    }
  };
}

export function createCustomerServiceOrchestrator({
  adapter,
  auditStore,
  criticalEventSink,
  finalGuard = guardOutput,
  intakeStore,
  runtimeMode = "local_mvp",
  stateStore
}: {
  adapter: CustomerServiceAdapter;
  auditStore: CustomerServiceAuditStore;
  criticalEventSink: CustomerServiceCriticalEventSink;
  finalGuard?: (text: string) => CustomerServiceGuardResult;
  intakeStore: CustomerServiceIntakeStore;
  runtimeMode?: CustomerServiceRuntimeMode;
  stateStore: CustomerServiceStateStore;
}) {
  const auditTelemetryByMessage = new Map<string, CustomerServiceAuditTelemetry>();

  function updateAuditTelemetry(
    messageId: string,
    values: Partial<CustomerServiceAuditTelemetry>
  ) {
    const current = auditTelemetryByMessage.get(messageId);
    if (current) {
      auditTelemetryByMessage.set(messageId, { ...current, ...values });
    }
  }

  async function persistState(state: CustomerServiceConversationState) {
    await stateStore.write(state);
    return state;
  }

  async function emitTerminalCriticalEvent(
    conversationId: string,
    messageId: string,
    templateId: string
  ) {
    await criticalEventSink.emit({
      code: "FINAL_GUARD_TEMPLATE_REJECTED",
      conversationIdHash: sha256Utf8(conversationId),
      messageId,
      templateId,
      timestamp: new Date().toISOString()
    });
  }

  async function createAuditRecord(
    values: Omit<
      CustomerServiceAuditRecord,
      "auditRecordId" | keyof CustomerServiceAuditTelemetry
    >
  ) {
    const telemetry = auditTelemetryByMessage.get(values.messageId);
    if (!telemetry) {
      throw new Error("customer_service_audit_telemetry_missing");
    }
    const record = {
      auditRecordId: createOpaqueId("customer-service-audit"),
      ...telemetry,
      ...values
    };
    await auditStore.append(record);
    auditTelemetryByMessage.delete(values.messageId);
    return record;
  }

  async function finalizeTemplateResponse(args: {
    conversationId: string;
    messageId: string;
    requestReceivedAt: string;
    runtimeConfigStatus: CustomerServiceRuntimeConfigStatus;
    state: CustomerServiceConversationState;
    templateId: CustomerServiceTemplateId;
    kbStatus: CustomerServiceKbStatus;
    fallbackUsed: boolean;
    reviewResult: CustomerServiceAuditRecord["reviewResult"];
    finalAction: CustomerServiceFinalAction;
    intakeRecordId?: string | null;
  }): Promise<CustomerServiceResponse> {
    const template = CUSTOMER_SERVICE_TEMPLATES[args.templateId];
    const guard = finalGuard(template.text);
    const latency = Date.now() - new Date(args.requestReceivedAt).getTime();

    if (!guard.deterministicPass) {
      await emitTerminalCriticalEvent(
        args.conversationId,
        args.messageId,
        args.templateId
      );
      const terminalState = await persistState({
        ...args.state,
        handoffLocked: args.state.handoffLocked || args.templateId === "HANDOFF_REQUIRED",
        humanResolved: false,
        lastSafeAction: "terminal",
        priorBlockCount: args.state.priorBlockCount + 1,
        priorRiskCategories: [
          ...new Set([...args.state.priorRiskCategories, guard.riskCategory])
        ]
      });
      updateAuditTelemetry(args.messageId, {
        conversationSafetyState: terminalState,
        deterministicGuardResult: "blocked",
        terminalSafetyExit: true
      });
      const audit = await createAuditRecord({
        conversationId: args.conversationId,
        criticalAlertEvent: "FINAL_GUARD_TEMPLATE_REJECTED",
        fallbackUsed: args.fallbackUsed,
        finalAction: "terminal_safety_exit",
        finalGuardResult: "blocked",
        intakeRecordId: args.intakeRecordId ?? null,
        kbStatus: args.kbStatus,
        messageId: args.messageId,
        requestReceivedAt: args.requestReceivedAt,
        responseLatencyMs: latency,
        reviewResult: args.reviewResult,
        runtimeConfigStatus: args.runtimeConfigStatus,
        runtimeMode
      });

      return {
        ok: true,
        value: {
          answer: {
            handoffRequired: true,
            source: "terminal_guard",
            text: TERMINAL_SAFETY_MESSAGE,
            type: "handoff_suggestion",
            uncertainty: "uncertain"
          },
          audit,
          citations: [],
          conversationId: args.conversationId,
          conversationSafetyState: terminalState,
          messageId: args.messageId,
          runtime: {
            configStatus: args.runtimeConfigStatus,
            mode: runtimeMode
          }
        }
      };
    }

    const nextState = await persistState({
      ...args.state,
      handoffLocked:
        args.state.handoffLocked ||
        args.templateId === "HANDOFF_REQUIRED" ||
        args.templateId === "HANDOFF_LOCKED_STATUS",
      humanResolved: false,
      lastSafeAction:
        args.templateId === "HANDOFF_REQUIRED" ||
        args.templateId === "HANDOFF_LOCKED_STATUS"
          ? "handoff"
          : "refuse",
      priorBlockCount:
        args.templateId === "HANDOFF_REQUIRED" ||
        args.templateId === "HANDOFF_LOCKED_STATUS"
          ? args.state.priorBlockCount + 1
          : args.state.priorBlockCount,
      priorRiskCategories:
        args.templateId === "HANDOFF_REQUIRED" ||
        args.templateId === "HANDOFF_LOCKED_STATUS"
          ? [...new Set([...args.state.priorRiskCategories, "handoff"])]
          : args.state.priorRiskCategories
    });
    updateAuditTelemetry(args.messageId, {
      conversationSafetyState: nextState,
      terminalSafetyExit: false
    });
    const audit = await createAuditRecord({
      conversationId: args.conversationId,
      criticalAlertEvent: null,
      fallbackUsed: args.fallbackUsed,
      finalAction: args.finalAction,
      finalGuardResult: "pass",
      intakeRecordId: args.intakeRecordId ?? null,
      kbStatus: args.kbStatus,
      messageId: args.messageId,
      requestReceivedAt: args.requestReceivedAt,
      responseLatencyMs: latency,
      reviewResult: args.reviewResult,
      runtimeConfigStatus: args.runtimeConfigStatus,
      runtimeMode
    });

    return {
      ok: true,
      value: {
        answer: {
          handoffRequired:
            args.templateId === "HANDOFF_REQUIRED" ||
            args.templateId === "HANDOFF_LOCKED_STATUS" ||
            args.templateId === "UNABLE_TO_CONFIRM",
          source: "template",
          templateId: args.templateId,
          text: template.text,
          type: template.type,
          uncertainty: "uncertain"
        },
        audit,
        citations: [],
        conversationId: args.conversationId,
        conversationSafetyState: nextState,
        messageId: args.messageId,
        runtime: {
          configStatus: args.runtimeConfigStatus,
          mode: runtimeMode
        }
      }
    };
  }

  return {
    async handleMessage(request: CustomerServiceHandleRequest): Promise<CustomerServiceResponse> {
      const requestReceivedAt = new Date().toISOString();
      const conversationId =
        request.conversationId?.trim() || createOpaqueId("customer-service-conversation");
      const messageId = request.messageId?.trim() || createOpaqueId("customer-service-message");
      let state =
        (await stateStore.read(conversationId)) ??
        createDefaultConversationSafetyState(conversationId);

      if (request.humanResolved?.approved && request.humanResolved.actorUserId.trim()) {
        state = await persistState({
          ...state,
          handoffLocked: false,
          humanResolved: true,
          lastSafeAction: "allow"
        });
      }

      const modelSafeContext = createModelSafeContext(
        request.text,
        request.history ?? []
      );
      state = {
        ...state,
        piiPlaceholderTypes: [
          ...new Set([
            ...state.piiPlaceholderTypes,
            ...modelSafeContext.piiCategories
          ])
        ]
      };
      auditTelemetryByMessage.set(messageId, {
        conversationSafetyState: state,
        deterministicGuardResult: "pass",
        fallbackContractValid: false,
        fallbackFailureReason: null,
        fallbackStatus: "not_called",
        guardNormalizationVersion: CUSTOMER_SERVICE_GUARD_VERSION,
        historyWindowCount: modelSafeContext.historyWindowCount,
        kbFailureReason: null,
        modelPayloadHash: modelSafeContext.modelPayloadHash,
        piiPrecheckPass: modelSafeContext.piiPrecheckPass,
        piiRedactionSummary: {
          categories: modelSafeContext.piiCategories,
          policyVersion: modelSafeContext.redactionPolicyVersion,
          redactionCount: modelSafeContext.redactionCount
        },
        retrievalEvidence: {
          evidenceCount: 0,
          retrievalStatus: "not_called",
          top1Score: 0,
          top2Score: 0
        },
        reviewIndependenceMode: "not_run",
        selfReviewFailureReason: null,
        selfReviewStatus: "not_called",
        terminalSafetyExit: false
      });

      if (state.handoffLocked) {
        return finalizeTemplateResponse({
          conversationId,
          fallbackUsed: false,
          finalAction: "handoff_locked",
          intakeRecordId: null,
          kbStatus: "not_called",
          messageId,
          requestReceivedAt,
          reviewResult: "not_run",
          runtimeConfigStatus: "ready",
          state,
          templateId: "HANDOFF_LOCKED_STATUS"
        });
      }

      const normalizedText = normalizeForGuard(request.text);
      const inputGuard = guardInput(normalizedText);

      if (!inputGuard.deterministicPass) {
        updateAuditTelemetry(messageId, {
          deterministicGuardResult: "blocked"
        });
        return finalizeTemplateResponse({
          conversationId,
          fallbackUsed: false,
          finalAction: "template",
          intakeRecordId: null,
          kbStatus: "not_called",
          messageId,
          requestReceivedAt,
          reviewResult: "not_run",
          runtimeConfigStatus: "ready",
          state,
          templateId: inputGuard.safeResponseTemplateId ?? "SAFETY_REFUSAL"
        });
      }

      if (!modelSafeContext.piiPrecheckPass) {
        updateAuditTelemetry(messageId, {
          deterministicGuardResult: "blocked"
        });
        return finalizeTemplateResponse({
          conversationId,
          fallbackUsed: false,
          finalAction: "template",
          intakeRecordId: null,
          kbStatus: "not_called",
          messageId,
          requestReceivedAt,
          reviewResult: "not_run",
          runtimeConfigStatus: "ready",
          state,
          templateId: "SERVICE_ERROR"
        });
      }

      const knowledgeResult = await adapter.answerFromKnowledge({
        conversationId,
        ...modelSafeContext,
        normalizedText: normalizeForGuard(
          modelSafeContext.sanitizedCurrentMessage
        ),
        text: modelSafeContext.sanitizedCurrentMessage
      });
      updateAuditTelemetry(messageId, {
        kbFailureReason: knowledgeResult.failureReason ?? null,
        retrievalEvidence: knowledgeResult.retrievalEvidence
      });
      const runtimeConfigStatus = knowledgeResult.configStatus ?? "ready";

      if (
        runtimeConfigStatus === "missing" ||
        knowledgeResult.kbStatus === "config_missing"
      ) {
        updateAuditTelemetry(messageId, {
          fallbackFailureReason: "dify_config_missing",
          selfReviewFailureReason: "dify_config_missing"
        });
        return finalizeTemplateResponse({
          conversationId,
          fallbackUsed: false,
          finalAction: "template",
          intakeRecordId: null,
          kbStatus: knowledgeResult.kbStatus,
          messageId,
          requestReceivedAt,
          reviewResult: "not_run",
          runtimeConfigStatus,
          state,
          templateId: "SERVICE_ERROR"
        });
      }

      if (
        knowledgeResult.kbStatus === "retrieval_error" ||
        knowledgeResult.kbStatus === "conflict"
      ) {
        return finalizeTemplateResponse({
          conversationId,
          fallbackUsed: false,
          finalAction: "template",
          intakeRecordId: null,
          kbStatus: knowledgeResult.kbStatus,
          messageId,
          requestReceivedAt,
          reviewResult: "not_run",
          runtimeConfigStatus,
          state,
          templateId: "SERVICE_ERROR"
        });
      }

      if (knowledgeResult.candidate) {
        const candidateGuard = finalGuard(knowledgeResult.candidate.answerText);
        if (!candidateGuard.deterministicPass) {
          return finalizeTemplateResponse({
            conversationId,
            fallbackUsed: false,
            finalAction: "template",
            intakeRecordId: null,
            kbStatus: knowledgeResult.kbStatus,
            messageId,
            requestReceivedAt,
            reviewResult: "not_run",
            runtimeConfigStatus,
            state,
            templateId: candidateGuard.safeResponseTemplateId ?? "SAFETY_REFUSAL"
          });
        }

        const review = await adapter.reviewAnswer({
          candidate: knowledgeResult.candidate,
          citations: knowledgeResult.citations,
          conversationSafetyState: state,
          ...modelSafeContext,
          normalizedText: normalizeForGuard(
            modelSafeContext.sanitizedCurrentMessage
          ),
          text: modelSafeContext.sanitizedCurrentMessage
        });
        updateAuditTelemetry(messageId, {
          reviewIndependenceMode: review.reviewIndependenceMode,
          selfReviewFailureReason: review.failureReason ?? null,
          selfReviewStatus:
            review.callStatus ??
            (review.reviewPass ? "success" : "failed")
        });

        if (review.recommendedAction === "refuse") {
          return finalizeTemplateResponse({
            conversationId,
            fallbackUsed: false,
            finalAction: "template",
            intakeRecordId: null,
            kbStatus: knowledgeResult.kbStatus,
            messageId,
            requestReceivedAt,
            reviewResult: "refuse",
            runtimeConfigStatus,
            state,
            templateId: "SAFETY_REFUSAL"
          });
        }

        if (review.recommendedAction === "handoff") {
          return finalizeTemplateResponse({
            conversationId,
            fallbackUsed: false,
            finalAction: "template",
            intakeRecordId: null,
            kbStatus: knowledgeResult.kbStatus,
            messageId,
            requestReceivedAt,
            reviewResult: "handoff",
            runtimeConfigStatus,
            state,
            templateId: "HANDOFF_REQUIRED"
          });
        }

        const finalText =
          review.recommendedAction === "rewrite" && review.safeAnswer.trim()
            ? review.safeAnswer.trim()
            : knowledgeResult.candidate.answerText;
        const finalGuardResult = finalGuard(finalText);
        if (!finalGuardResult.deterministicPass) {
          return finalizeTemplateResponse({
            conversationId,
            fallbackUsed: false,
            finalAction: "template",
            intakeRecordId: null,
            kbStatus: knowledgeResult.kbStatus,
            messageId,
            requestReceivedAt,
            reviewResult: review.recommendedAction === "rewrite" ? "rewrite" : "pass",
            runtimeConfigStatus,
            state,
            templateId: finalGuardResult.safeResponseTemplateId ?? "SAFETY_REFUSAL"
          });
        }

        const nextState = await persistState({
          ...state,
          handoffLocked: false,
          humanResolved: false,
          lastSafeAction: "allow"
        });
        updateAuditTelemetry(messageId, {
          conversationSafetyState: nextState
        });
        const audit = await createAuditRecord({
          conversationId,
          criticalAlertEvent: null,
          fallbackUsed: false,
          finalAction: "answered",
          finalGuardResult: "pass",
          intakeRecordId: null,
          kbStatus: knowledgeResult.kbStatus,
          messageId,
          requestReceivedAt,
          responseLatencyMs: Date.now() - new Date(requestReceivedAt).getTime(),
          reviewResult: review.recommendedAction === "rewrite" ? "rewrite" : "pass",
          runtimeConfigStatus,
          runtimeMode
        });

        return {
          ok: true,
          value: {
            answer: {
              handoffRequired: false,
              source: knowledgeResult.kbStatus === "hit" ? "knowledge" : "fallback",
              text: finalText,
              type: knowledgeResult.candidate.answerType,
              uncertainty: knowledgeResult.candidate.uncertainty
            },
            audit,
            citations: knowledgeResult.citations,
            conversationId,
            conversationSafetyState: nextState,
            messageId,
            runtime: {
              configStatus: runtimeConfigStatus,
              mode: runtimeMode
            }
          }
        };
      }

      const intakeRecord =
        knowledgeResult.kbStatus === "miss" || knowledgeResult.kbStatus === "low_confidence_miss"
          ? await intakeStore.upsert({
              conversationId,
              createdAt: requestReceivedAt,
              fingerprint: createIntakeFingerprint({
                intentLabel: "fallback",
                normalizationVersion: KB_INTAKE_NORMALIZATION_VERSION,
                sanitizedQuestion: request.text,
                siteSection: request.pageContext.page
              }),
              intakeRecordId: createOpaqueId("customer-service-intake"),
              intentLabel: "fallback",
              messageId,
              normalizationVersion: KB_INTAKE_NORMALIZATION_VERSION,
              occurrenceCount: 1,
              sanitizedQuestion: sanitizeForIntake(request.text),
              siteSection: request.pageContext.page,
              source:
                knowledgeResult.kbStatus === "low_confidence_miss"
                  ? "low_confidence_miss"
                  : "kb_miss",
              status: "new",
              updatedAt: requestReceivedAt
            })
          : null;

      const fallbackResult = await adapter.generateFallback({
        conversationId,
        ...modelSafeContext,
        normalizedText: normalizeForGuard(
          modelSafeContext.sanitizedCurrentMessage
        ),
        text: modelSafeContext.sanitizedCurrentMessage
      });
      updateAuditTelemetry(messageId, {
        fallbackContractValid: fallbackResult.contractValid ?? fallbackResult.ok,
        fallbackFailureReason: fallbackResult.failureReason,
        fallbackStatus: fallbackResult.ok ? "success" : "failed"
      });

      if (fallbackResult.ok && fallbackResult.candidate) {
        const review = await adapter.reviewAnswer({
          candidate: fallbackResult.candidate,
          citations: [],
          conversationSafetyState: state,
          ...modelSafeContext,
          normalizedText: normalizeForGuard(
            modelSafeContext.sanitizedCurrentMessage
          ),
          text: modelSafeContext.sanitizedCurrentMessage
        });
        updateAuditTelemetry(messageId, {
          reviewIndependenceMode: review.reviewIndependenceMode,
          selfReviewFailureReason: review.failureReason ?? null,
          selfReviewStatus:
            review.callStatus ??
            (review.reviewPass ? "success" : "failed")
        });
        if (review.recommendedAction === "allow") {
          const finalFallbackGuard = finalGuard(fallbackResult.candidate.answerText);
          if (finalFallbackGuard.deterministicPass) {
            const nextState = await persistState({
              ...state,
              lastSafeAction: "allow"
            });
            updateAuditTelemetry(messageId, {
              conversationSafetyState: nextState
            });
            const audit = await createAuditRecord({
              conversationId,
              criticalAlertEvent: null,
              fallbackUsed: true,
              finalAction: "answered",
              finalGuardResult: "pass",
              intakeRecordId: intakeRecord?.intakeRecordId ?? null,
              kbStatus: knowledgeResult.kbStatus,
              messageId,
              requestReceivedAt,
              responseLatencyMs: Date.now() - new Date(requestReceivedAt).getTime(),
              reviewResult: "pass",
              runtimeConfigStatus,
              runtimeMode
            });

            return {
              ok: true,
              value: {
                answer: {
                  handoffRequired: false,
                  source: "fallback",
                  text: fallbackResult.candidate.answerText,
                  type: fallbackResult.candidate.answerType,
                  uncertainty: fallbackResult.candidate.uncertainty
                },
                audit,
                citations: [],
                conversationId,
                conversationSafetyState: nextState,
                messageId,
                runtime: {
                  configStatus: runtimeConfigStatus,
                  mode: runtimeMode
                }
              }
            };
          }
        }
      }

      return finalizeTemplateResponse({
        conversationId,
        fallbackUsed: true,
        finalAction: "template",
        intakeRecordId: intakeRecord?.intakeRecordId ?? null,
        kbStatus: knowledgeResult.kbStatus,
        messageId,
        requestReceivedAt,
        reviewResult: "not_run",
        runtimeConfigStatus,
        state,
        templateId: "UNABLE_TO_CONFIRM"
      });
    }
  };
}

export function createConfiguredCustomerServiceOrchestrator({
  cloudBaseDatabase,
  env = process.env,
  rootDir = process.cwd()
}: {
  cloudBaseDatabase?: CustomerServiceCloudBaseDatabase;
  env?: NodeJS.ProcessEnv;
  rootDir?: string;
}) {
  const runtimeMode =
    env.CUSTOMER_SERVICE_RUNTIME_MODE?.trim() === "dify" ? "dify" : "local_mvp";
  const persistenceMode = env.CUSTOMER_SERVICE_PERSISTENCE_MODE?.trim();
  const useCloudBasePersistence =
    persistenceMode === "cloudbase" ||
    (persistenceMode !== "file" && env.APP_ENV?.trim() === "production");
  const dataRoot =
    env.CUSTOMER_SERVICE_DATA_DIR?.trim() ||
    path.join(rootDir, "data", "customer-service");
  const cloudBaseStores = useCloudBasePersistence
    ? createCloudBaseCustomerServiceStores(
        cloudBaseDatabase ??
          (createCloudBaseServerApp().database() as unknown as CustomerServiceCloudBaseDatabase)
      )
    : null;

  return createCustomerServiceOrchestrator({
    adapter:
      runtimeMode === "dify"
        ? createConfiguredDifyAdapter(env)
        : createLocalCustomerServiceAdapter(),
    auditStore:
      cloudBaseStores?.auditStore ??
      createJsonlAuditStore(
        env.CUSTOMER_SERVICE_AUDIT_JSONL_PATH?.trim() ||
          path.join(dataRoot, "audit-records.jsonl")
      ),
    criticalEventSink:
      cloudBaseStores?.criticalEventSink ??
      {
        async emit(event) {
          const criticalLogPath = path.join(dataRoot, "critical-events.jsonl");
          await ensureParentDirectory(criticalLogPath);
          let current = "";
          try {
            current = await readFile(criticalLogPath, "utf8");
          } catch {}
          await writeFile(
            criticalLogPath,
            `${current}${current ? "\n" : ""}${JSON.stringify(event)}`,
            "utf8"
          );
        }
      },
    intakeStore:
      cloudBaseStores?.intakeStore ??
      createJsonlIntakeStore(
        env.CUSTOMER_SERVICE_INTAKE_JSONL_PATH?.trim() ||
          path.join(dataRoot, "kb-intake.json")
      ),
    runtimeMode,
    stateStore:
      cloudBaseStores?.stateStore ??
      createFileConversationStateStore(
        env.CUSTOMER_SERVICE_STATE_PATH?.trim() ||
          path.join(dataRoot, "conversation-states.json")
      )
  });
}
