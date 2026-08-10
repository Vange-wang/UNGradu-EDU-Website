export type JsonFieldSchema = {
  enum?: readonly unknown[];
  type?: "array" | "boolean" | "number" | "object" | "string";
  items?: JsonFieldSchema;
  object?: {
    allowedKeys?: readonly string[];
    fields?: Record<string, JsonFieldSchema>;
  };
};

export type JsonSafetyLimits = {
  allowedKeys?: readonly string[];
  maxArrayLength?: number;
  maxBodyBytes?: number;
  maxDepth?: number;
  maxStringLength?: number;
  requireObjectRoot?: boolean;
  schema?: Record<string, JsonFieldSchema>;
};

export type JsonSafetyResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "array-too-long"
        | "body-too-large"
        | "invalid-root"
        | "invalid-type"
        | "object-too-deep"
        | "string-too-long"
        | "unknown-field";
    };

const DEFAULT_LIMITS = {
  maxArrayLength: 200,
  maxBodyBytes: 1_000_000,
  maxDepth: 8,
  maxStringLength: 100_000,
  requireObjectRoot: true
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function matchesSchema(value: unknown, schema: JsonFieldSchema, depth: number, limits: Required<Pick<JsonSafetyLimits, "maxArrayLength" | "maxDepth" | "maxStringLength">>): JsonSafetyResult {
  if (schema.enum && !schema.enum.some((candidate) => Object.is(candidate, value))) {
    return { ok: false, reason: "invalid-type" };
  }

  if (schema.type) {
    const actual = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
    if (actual !== schema.type) return { ok: false, reason: "invalid-type" };
  }

  if (schema.items) {
    if (!Array.isArray(value)) return { ok: false, reason: "invalid-type" };
    if (value.length > limits.maxArrayLength) return { ok: false, reason: "array-too-long" };
    for (const item of value) {
      const result = matchesSchema(item, schema.items, depth + 1, limits);
      if (!result.ok) return result;
    }
  }

  if (schema.object) {
    if (!isObject(value)) return { ok: false, reason: "invalid-type" };
    const allowedKeys = schema.object.allowedKeys ?? Object.keys(schema.object.fields ?? {});
    const allowed = new Set(allowedKeys);
    if (Object.keys(value).some((key) => !allowed.has(key))) {
      return { ok: false, reason: "unknown-field" };
    }
    for (const [key, fieldSchema] of Object.entries(schema.object.fields ?? {})) {
      if (key in value) {
        const result = matchesSchema(value[key], fieldSchema, depth + 1, limits);
        if (!result.ok) return result;
      }
    }
  }

  if (depth > limits.maxDepth) return { ok: false, reason: "object-too-deep" };
  if (typeof value === "string" && value.length > limits.maxStringLength) {
    return { ok: false, reason: "string-too-long" };
  }
  return { ok: true };
}

export function validateJsonValue(value: unknown, limits: JsonSafetyLimits = {}): JsonSafetyResult {
  const resolved = { ...DEFAULT_LIMITS, ...limits };
  if (resolved.requireObjectRoot !== false && !isObject(value)) {
    return { ok: false, reason: "invalid-root" };
  }

  function visit(current: unknown, depth: number): JsonSafetyResult {
    if (depth > resolved.maxDepth) return { ok: false, reason: "object-too-deep" };
    if (typeof current === "string" && current.length > resolved.maxStringLength) {
      return { ok: false, reason: "string-too-long" };
    }
    if (Array.isArray(current)) {
      if (current.length > resolved.maxArrayLength) return { ok: false, reason: "array-too-long" };
      for (const item of current) {
        const result = visit(item, depth + 1);
        if (!result.ok) return result;
      }
      return { ok: true };
    }
    if (isObject(current)) {
      for (const item of Object.values(current)) {
        const result = visit(item, depth + 1);
        if (!result.ok) return result;
      }
    }
    return { ok: true };
  }

  const result = visit(value, 0);
  if (!result.ok) return result;

  if (isObject(value) && limits.allowedKeys) {
    const allowed = new Set(limits.allowedKeys);
    if (Object.keys(value).some((key) => !allowed.has(key))) return { ok: false, reason: "unknown-field" };
  }

  if (isObject(value) && limits.schema) {
    for (const [key, schema] of Object.entries(limits.schema)) {
      if (key in value) {
        const schemaResult = matchesSchema(value[key], schema, 1, resolved);
        if (!schemaResult.ok) return schemaResult;
      }
    }
    const schemaKeys = new Set(Object.keys(limits.schema));
    if (Object.keys(value).some((key) => !schemaKeys.has(key) && !limits.allowedKeys?.includes(key))) {
      return { ok: false, reason: "unknown-field" };
    }
  }

  const bytes = new TextEncoder().encode(JSON.stringify(value)).byteLength;
  return bytes > resolved.maxBodyBytes ? { ok: false, reason: "body-too-large" } : { ok: true };
}

export function allowedObjectKeys(value: unknown, allowed: readonly string[]): JsonSafetyResult {
  if (!isObject(value)) return { ok: false, reason: "invalid-root" };
  const allowedSet = new Set(allowed);
  return Object.keys(value).every((key) => allowedSet.has(key))
    ? { ok: true }
    : { ok: false, reason: "unknown-field" };
}
