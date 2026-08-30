import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export type RateLimitWindow = {
  limit: number;
  windowMs: number;
};

export type LayeredRateLimitConfig = {
  account: RateLimitWindow;
  action: RateLimitWindow;
  device: RateLimitWindow;
  ip: RateLimitWindow;
  session?: RateLimitWindow;
};

export type ExternalRateLimiter = {
  check: (input: RateLimitInput) =>
    | Promise<RateLimitResult>
    | RateLimitResult;
};

export type RateLimitResult = { ok: true } | { ok: false; reason: string };

type PersistentRateLimitDocument = {
  cleanup_after: Date;
  count: number;
  expires_at: Date;
  layer: string;
  updated_at: Date;
  window_started_at_ms: number;
};

type PersistentRateLimitTransaction = {
  collection: (name: string) => {
    doc: (id: string) => {
      get: () => Promise<{ data?: unknown[] | Record<string, unknown> }>;
      set: (value: PersistentRateLimitDocument) => Promise<unknown>;
    };
  };
};

export type PersistentRateLimitDatabase = {
  runTransaction: <T>(
    operation: (transaction: PersistentRateLimitTransaction) => Promise<T>
  ) => Promise<T | { result?: T }>;
};

const DEFAULT_CONFIG: LayeredRateLimitConfig = {
  account: { limit: 3, windowMs: 15 * 60_000 },
  action: { limit: 5, windowMs: 15 * 60_000 },
  device: { limit: 5, windowMs: 15 * 60_000 },
  ip: { limit: 10, windowMs: 15 * 60_000 },
  session: { limit: 5, windowMs: 15 * 60_000 }
};

export type RateLimitInput = {
  accountKey: string;
  actionKey: string;
  deviceKey: string;
  ipKey: string;
  sessionKey?: string;
};

export function createEmailSendRateLimitKeys({
  acceptLanguage,
  email,
  environmentRef,
  keySecret,
  keyVersion,
  trustedProxyIp,
  userAgent
}: {
  acceptLanguage?: string;
  email: string;
  environmentRef: string;
  keySecret: string;
  keyVersion: string;
  trustedProxyIp?: string;
  userAgent?: string;
}): RateLimitInput {
  const normalizedEnvironmentRef = environmentRef.trim();
  const normalizedKeySecret = keySecret.trim();
  const normalizedKeyVersion = keyVersion.trim();
  if (
    !normalizedEnvironmentRef ||
    !normalizedKeySecret ||
    !/^[A-Za-z0-9_-]{1,16}$/.test(normalizedKeyVersion)
  ) {
    throw new Error("RATE_LIMIT_KEY_CONFIGURATION_UNAVAILABLE");
  }

  const pseudonym = (scope: string, value: string) =>
    `${normalizedKeyVersion}_${createHmac("sha256", normalizedKeySecret)
      .update(`${scope}\0${normalizedKeyVersion}\0${normalizedEnvironmentRef}\0${value}`)
      .digest("base64url")}`;
  const accountKey = pseudonym("account", email.trim().toLowerCase());
  const ipKey = pseudonym("ip", normalizeTrustedProxyIp(trustedProxyIp) || "unknown-proxy");
  const userAgentInput = truncateUtf8(userAgent ?? "", 256);
  const languageInput = truncateUtf8(acceptLanguage ?? "", 128);
  const deviceMessage =
    `${userAgentInput.byteLength}|${userAgentInput.value}|` +
    `${languageInput.byteLength}|${languageInput.value}`;
  const deviceKey =
    `device:${normalizedKeyVersion}:${normalizedEnvironmentRef}:` +
    createHmac("sha256", normalizedKeySecret)
      .update(deviceMessage)
      .digest("base64url");
  const actionKey = pseudonym("action", `email_send_code\0${ipKey}`);

  return { accountKey, actionKey, deviceKey, ipKey };
}

export function normalizeTrustedProxyIp(value?: string) {
  const normalized = value?.trim();
  return normalized && isIP(normalized) !== 0 ? normalized : undefined;
}

function truncateUtf8(value: string, maximumBytes: number) {
  let byteLength = 0;
  let truncated = "";
  for (const character of value) {
    const characterBytes = Buffer.byteLength(character, "utf8");
    if (byteLength + characterBytes > maximumBytes) break;
    truncated += character;
    byteLength += characterBytes;
  }
  return { byteLength, value: truncated };
}

function readStoredDocument(data: unknown[] | Record<string, unknown> | undefined) {
  const value = Array.isArray(data) ? data[0] : data;
  return value && typeof value === "object"
    ? value as Record<string, unknown>
    : undefined;
}

function createPersistentDocumentId(
  keySecret: string,
  layer: keyof LayeredRateLimitConfig,
  key: string
) {
  return createHmac("sha256", keySecret)
    .update(`${layer}\0${key}`)
    .digest("base64url");
}

export function createCloudBasePersistentRateLimiter({
  collectionName,
  config = DEFAULT_CONFIG,
  database,
  keySecret,
  now = () => Date.now()
}: {
  collectionName?: string;
  config?: Partial<LayeredRateLimitConfig>;
  database?: PersistentRateLimitDatabase;
  keySecret?: string;
  now?: () => number;
}): ExternalRateLimiter {
  const normalizedCollectionName = collectionName?.trim() ?? "";
  const normalizedKeySecret = keySecret?.trim() ?? "";
  const configured = Boolean(
    database?.runTransaction &&
    normalizedKeySecret &&
    /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(normalizedCollectionName)
  );
  const resolved: LayeredRateLimitConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };

  return {
    async check(input) {
      if (!configured || !database) {
        return { ok: false as const, reason: "unavailable" };
      }

      const layers: Array<[keyof LayeredRateLimitConfig, string | undefined]> = [
        ["account", input.accountKey],
        ["ip", input.ipKey],
        ["device", input.deviceKey],
        ["action", input.actionKey],
        ["session", input.sessionKey]
      ];
      const activeLayers = layers.filter(
        (entry): entry is [keyof LayeredRateLimitConfig, string] => Boolean(entry[1])
      );
      if (activeLayers.some(([, key]) => !key.trim())) {
        return { ok: false as const, reason: "unavailable" };
      }

      try {
        const transactionResult = await database.runTransaction(async (transaction) => {
          const current = now();
          const pending: Array<{
            count: number;
            doc: ReturnType<ReturnType<PersistentRateLimitTransaction["collection"]>["doc"]>;
            layer: keyof LayeredRateLimitConfig;
            windowStartedAtMs: number;
          }> = [];

          for (const [layer, key] of activeLayers) {
            const rule = resolved[layer];
            if (!rule) continue;
            const documentId = createPersistentDocumentId(
              normalizedKeySecret,
              layer,
              key
            );
            const doc = transaction.collection(normalizedCollectionName).doc(documentId);
            const stored = readStoredDocument((await doc.get()).data);
            const storedCount = Number(stored?.count);
            const storedWindowStartedAtMs = Number(
              stored?.window_started_at_ms ?? stored?.windowStartedAtMs
            );
            const inCurrentWindow =
              Number.isFinite(storedCount) &&
              Number.isFinite(storedWindowStartedAtMs) &&
              current >= storedWindowStartedAtMs &&
              current - storedWindowStartedAtMs < rule.windowMs;
            const count = inCurrentWindow ? storedCount : 0;
            const windowStartedAtMs = inCurrentWindow
              ? storedWindowStartedAtMs
              : current;

            if (count >= rule.limit) {
              return { ok: false as const, reason: layer };
            }
            pending.push({ count: count + 1, doc, layer, windowStartedAtMs });
          }

          for (const entry of pending) {
            const rule = resolved[entry.layer];
            if (!rule) throw new Error("RATE_LIMIT_RULE_UNAVAILABLE");
            await entry.doc.set({
              cleanup_after: new Date(entry.windowStartedAtMs + rule.windowMs + 60 * 60_000),
              count: entry.count,
              expires_at: new Date(entry.windowStartedAtMs + rule.windowMs),
              layer: entry.layer,
              updated_at: new Date(current),
              window_started_at_ms: entry.windowStartedAtMs
            });
          }
          return { ok: true as const };
        });
        const result =
          transactionResult &&
          typeof transactionResult === "object" &&
          "result" in transactionResult &&
          transactionResult.result
            ? transactionResult.result
            : transactionResult;
        return result && typeof result === "object" && "ok" in result
          ? result as RateLimitResult
          : { ok: false as const, reason: "unavailable" };
      } catch {
        return { ok: false as const, reason: "unavailable" };
      }
    }
  };
}

export function createLayeredRateLimiter({
  config = DEFAULT_CONFIG,
  now = () => Date.now(),
  mode = "local",
  external
}: {
  config?: Partial<LayeredRateLimitConfig>;
  external?: ExternalRateLimiter;
  mode?: "local" | "production";
  now?: () => number;
} = {}) {
  if (mode === "production" && !external) {
    throw new Error("RATE_LIMITER_UNAVAILABLE");
  }
  const resolved: LayeredRateLimitConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };
  const counters = new Map<string, { count: number; windowStartedAtMs: number }>();

  return {
    mode,
    external: Boolean(external),
    check(input: RateLimitInput) {
      if (external) return external.check(input);
      const current = now();
      const layers: Array<[keyof LayeredRateLimitConfig, string | undefined]> = [
        ["account", input.accountKey],
        ["ip", input.ipKey],
        ["device", input.deviceKey],
        ["action", input.actionKey],
        ["session", input.sessionKey]
      ];
      const pending: Array<{
        counterKey: string;
        count: number;
        windowStartedAtMs: number;
      }> = [];

      for (const [layer, key] of layers) {
        if (!key && layer === "session") continue;
        if (!key) return { ok: false as const, reason: layer };
        const rule = resolved[layer];
        if (!rule) continue;
        const counterKey = `${layer}:${key}`;
        const stored = counters.get(counterKey);
        const inCurrentWindow = Boolean(
          stored &&
          current >= stored.windowStartedAtMs &&
          current - stored.windowStartedAtMs < rule.windowMs
        );
        const count = inCurrentWindow ? stored?.count ?? 0 : 0;
        const windowStartedAtMs = inCurrentWindow
          ? stored?.windowStartedAtMs ?? current
          : current;
        if (count >= rule.limit) {
          return { ok: false as const, reason: layer };
        }
        pending.push({ counterKey, count: count + 1, windowStartedAtMs });
      }

      for (const entry of pending) {
        counters.set(entry.counterKey, {
          count: entry.count,
          windowStartedAtMs: entry.windowStartedAtMs
        });
      }

      return { ok: true as const };
    },
    reset() {
      counters.clear();
    }
  };
}

/**
 * Route-level production seam used until a durable limiter is configured.
 * It is intentionally unavailable rather than falling back to the in-process
 * counter implementation.
 */
export function createFailClosedProductionRateLimiter() {
  return createLayeredRateLimiter({
    mode: "production",
    external: {
      check() {
        return { ok: false as const, reason: "unavailable" };
      }
    }
  });
}

export function createRouteRateLimiter(env: {
  APP_ENV?: string;
  AUTH_RATE_LIMIT_COLLECTION?: string;
  AUTH_RATE_LIMIT_KEY_SECRET?: string;
  NODE_ENV?: string;
  rateLimitDatabase?: PersistentRateLimitDatabase;
}) {
  if (env.APP_ENV !== "production" && env.NODE_ENV !== "production") {
    return createLayeredRateLimiter({ mode: "local" });
  }

  return createLayeredRateLimiter({
    external: createCloudBasePersistentRateLimiter({
      collectionName: env.AUTH_RATE_LIMIT_COLLECTION,
      database: env.rateLimitDatabase,
      keySecret: env.AUTH_RATE_LIMIT_KEY_SECRET
    }),
    mode: "production"
  });
}
