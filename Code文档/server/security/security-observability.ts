const SENSITIVE_KEY = /(authorization|cookie|email|phone|secret|token|password|child|intro|contact|message|text|proof|ability)/i;
// Values can carry sensitive data even when the caller chooses a benign key
// such as `note` or `reason`. Keep these checks deliberately narrow so normal
// operational labels remain observable while short contact/minor values do
// not leak into audit or alert payloads.
const SENSITIVE_VALUE = /(?:[^\s@]+@[^\s@]+\.[^\s@]+|(?:\+?\d[\d\s().-]{8,}\d)|(?:孩子|儿童|未成年|学生|家长|微信|微 信|扣扣|QQ))/iu;
const MAX_KEY_LENGTH = 80;
const MAX_STRING_LENGTH = 256;

export type RedactedSecurityAudit = {
  actorId?: string;
  correlationId: string;
  event: string;
  metadata: Record<string, string | number | boolean>;
  occurredAt: string;
};

export type SecurityAlertSink = {
  available: boolean;
  emit: (event: RedactedSecurityAudit) => void;
};

function containsSensitiveValue(value: unknown): boolean {
  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH || SENSITIVE_VALUE.test(value);
  }
  if (Array.isArray(value)) return value.some(containsSensitiveValue);
  if (value && typeof value === "object") {
    return Object.entries(value).some(([key, item]) => SENSITIVE_KEY.test(key) || containsSensitiveValue(item));
  }
  return false;
}

function safeMetadata(metadata: Record<string, unknown>) {
  const safe: Record<string, string | number | boolean> = {};
  for (const [rawKey, value] of Object.entries(metadata).slice(0, 64)) {
    const key = rawKey.trim().slice(0, MAX_KEY_LENGTH);
    if (!key || SENSITIVE_KEY.test(key)) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      if (typeof value === "string" && (value.length > MAX_STRING_LENGTH || containsSensitiveValue(value))) continue;
      safe[key] = typeof value === "string" ? value.slice(0, MAX_STRING_LENGTH) : value;
    }
  }
  return safe;
}

export function createRedactedSecurityAudit({
  actorId,
  correlationId,
  event,
  metadata = {},
  occurredAt = new Date().toISOString()
}: {
  actorId?: string;
  correlationId: string;
  event: string;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}): RedactedSecurityAudit {
  return {
    actorId: actorId && !containsSensitiveValue(actorId)
      ? actorId.trim().slice(0, MAX_STRING_LENGTH) || undefined
      : undefined,
    correlationId: correlationId.trim().slice(0, MAX_STRING_LENGTH),
    event: event.trim().slice(0, MAX_STRING_LENGTH),
    metadata: safeMetadata(metadata),
    occurredAt
  };
}

export function createMemoryAlertSink({
  mode = "local"
}: {
  mode?: "local" | "production";
  requireExternal?: boolean;
} = {}) {
  const events: RedactedSecurityAudit[] = [];
  const productionUnavailable = mode === "production";
  return {
    available: !productionUnavailable,
    events,
    mode,
    emit(event: RedactedSecurityAudit) {
      if (productionUnavailable) {
        throw new Error("SECURITY_ALERT_SINK_UNAVAILABLE");
      }
      events.push(event);
    }
  };
}

/** Explicit production seam. It never silently stores alerts in process memory. */
export function createFailClosedSecurityAlertSink(): SecurityAlertSink {
  return {
    available: false,
    emit() {
      throw new Error("SECURITY_ALERT_SINK_UNAVAILABLE");
    }
  };
}
