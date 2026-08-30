import { createHmac } from "node:crypto";

export type EmailChallengeFailureReason =
  | "action-mismatch"
  | "config-missing"
  | "expired"
  | "hostname-mismatch"
  | "invalid"
  | "missing"
  | "replay"
  | "secret-missing"
  | "timeout"
  | "unreachable";

export type EmailChallengeVerificationInput = {
  action: "email_send_code" | "password_login";
  hostname: string;
  now?: Date;
  token: string;
};

export type EmailChallengeVerificationResult =
  | {
      action: string;
      expiresAt?: string;
      hostname: string;
      issuedAt?: string;
      ok: true;
      providerEnforcesSingleUse?: boolean;
      tokenId?: string;
    }
  | { ok: false; reason: EmailChallengeFailureReason };

export type EmailChallengeVerifier = {
  expectedHostnames?: readonly string[];
  verify: (
    input: EmailChallengeVerificationInput
  ) => Promise<EmailChallengeVerificationResult>;
};

type PersistentChallengeReplayDocument = {
  action: string;
  cleanup_after: Date;
  consumed_at: Date;
  environment_ref: string;
  expires_at: Date;
  key_version: string;
  schema_version: 1;
};

type PersistentChallengeReplayTransaction = {
  collection: (name: string) => {
    doc: (id: string) => {
      get: () => Promise<{ data?: unknown[] | Record<string, unknown> }>;
      remove?: () => Promise<unknown>;
      set: (value: PersistentChallengeReplayDocument) => Promise<unknown>;
    };
  };
};

export type PersistentChallengeReplayDatabase = {
  runTransaction: <T>(
    operation: (transaction: PersistentChallengeReplayTransaction) => Promise<T>
  ) => Promise<T | { result?: T }>;
};

export type EmailChallengeReplayGuard = {
  cleanup?: (input: {
    action: "email_send_code" | "password_login";
    token: string;
  }) => Promise<
    { ok: true; removed: boolean } |
    { ok: false; reason: "unavailable" }
  >;
  consume: (input: {
    action: "email_send_code" | "password_login";
    expiresAt: Date;
    token: string;
  }) => Promise<{ ok: true } | { ok: false; reason: "replay" | "unavailable" }>;
};

const DEFAULT_TOKEN_TTL_MS = 300_000;
const TURNSTILE_SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileSiteverifyResponse = {
  action?: unknown;
  challenge_ts?: unknown;
  "error-codes"?: unknown;
  hostname?: unknown;
  success?: unknown;
};

const EXACT_HOSTNAME_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function normalizeExactHostnames(hostnames: readonly string[]) {
  const normalized = hostnames.map((hostname) => hostname.trim().toLowerCase());
  if (
    normalized.length === 0 ||
    normalized.some((hostname) =>
      !hostname ||
      hostname.length > 253 ||
      hostname.includes("*") ||
      hostname.split(".").some((label) => !EXACT_HOSTNAME_LABEL.test(label))
    )
  ) {
    return undefined;
  }
  return [...new Set(normalized)];
}

function readReplayDocument(data: unknown[] | Record<string, unknown> | undefined) {
  const value = Array.isArray(data) ? data[0] : data;
  return value && typeof value === "object"
    ? value as Record<string, unknown>
    : undefined;
}

function readReplayDate(
  document: Record<string, unknown> | undefined,
  snakeCaseKey: string,
  legacyKey: string
) {
  const value = document?.[snakeCaseKey] ?? document?.[legacyKey];
  const timestamp = value instanceof Date
    ? value.getTime()
    : new Date(String(value ?? "")).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function unwrapTransactionResult<T>(transactionResult: T | { result?: T }) {
  return transactionResult &&
    typeof transactionResult === "object" &&
    "result" in transactionResult &&
    transactionResult.result
      ? transactionResult.result
      : transactionResult as T;
}

export function createCloudBasePersistentEmailChallengeReplayGuard({
  collectionName,
  database,
  environmentRef = "shared-auth",
  keySecret,
  keyVersion = "v1",
  now = () => Date.now()
}: {
  collectionName?: string;
  database?: PersistentChallengeReplayDatabase;
  environmentRef?: string;
  keySecret?: string;
  keyVersion?: string;
  now?: () => number;
}): EmailChallengeReplayGuard {
  const normalizedCollectionName = collectionName?.trim() ?? "";
  const normalizedEnvironmentRef = environmentRef.trim();
  const normalizedKeySecret = keySecret?.trim() ?? "";
  const normalizedKeyVersion = keyVersion.trim();
  const configured = Boolean(
    database?.runTransaction &&
    normalizedEnvironmentRef &&
    normalizedKeySecret &&
    /^[A-Za-z0-9_-]{1,16}$/.test(normalizedKeyVersion) &&
    /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(normalizedCollectionName)
  );
  const createDocumentId = (
    action: "email_send_code" | "password_login",
    token: string
  ) => createHmac("sha256", normalizedKeySecret)
    .update(`challenge\0${normalizedKeyVersion}\0${normalizedEnvironmentRef}\0${action}\0${token}`)
    .digest("base64url");

  return {
    async cleanup({ action, token }) {
      const normalizedToken = token.trim();
      if (!configured || !database || !normalizedToken) {
        return { ok: false as const, reason: "unavailable" as const };
      }
      const documentId = createDocumentId(action, normalizedToken);
      try {
        const transactionResult = await database.runTransaction(async (transaction) => {
          const doc = transaction.collection(normalizedCollectionName).doc(documentId);
          const stored = readReplayDocument((await doc.get()).data);
          if (!stored) return { ok: true as const, removed: false };
          const cleanupAfterMs = readReplayDate(stored, "cleanup_after", "cleanupAfter");
          const consumedAtMs = readReplayDate(stored, "consumed_at", "consumedAt");
          const expiresAtMs = readReplayDate(stored, "expires_at", "expiresAt");
          const storedEnvironmentRef = stored.environment_ref ?? stored.environmentRef;
          const storedKeyVersion = stored.key_version ?? stored.keyVersion;
          const storedSchemaVersion = stored.schema_version ?? stored.schemaVersion;
          if (
            stored.action !== action ||
            storedEnvironmentRef !== normalizedEnvironmentRef ||
            storedKeyVersion !== normalizedKeyVersion ||
            Number(storedSchemaVersion) !== 1 ||
            cleanupAfterMs === undefined ||
            consumedAtMs === undefined ||
            expiresAtMs === undefined ||
            consumedAtMs > expiresAtMs ||
            cleanupAfterMs !== expiresAtMs + 60 * 60_000
          ) {
            return { ok: false as const, reason: "unavailable" as const };
          }
          if (now() < cleanupAfterMs) {
            return { ok: true as const, removed: false };
          }
          if (!doc.remove) {
            return { ok: false as const, reason: "unavailable" as const };
          }
          await doc.remove();
          return { ok: true as const, removed: true };
        });
        const result = unwrapTransactionResult(transactionResult);
        return result && typeof result === "object" && "ok" in result
          ? result as
              | { ok: true; removed: boolean }
              | { ok: false; reason: "unavailable" }
          : { ok: false as const, reason: "unavailable" as const };
      } catch {
        return { ok: false as const, reason: "unavailable" as const };
      }
    },
    async consume({ action, expiresAt, token }) {
      const normalizedToken = token.trim();
      const expiresAtMs = expiresAt.getTime();
      const current = now();
      if (
        !configured ||
        !database ||
        !normalizedToken ||
        !Number.isFinite(expiresAtMs) ||
        expiresAtMs <= current
      ) {
        return { ok: false, reason: "unavailable" };
      }

      const documentId = createDocumentId(action, normalizedToken);
      try {
        const transactionResult = await database.runTransaction(async (transaction) => {
          const doc = transaction.collection(normalizedCollectionName).doc(documentId);
          const stored = readReplayDocument((await doc.get()).data);
          const storedExpiresAt = readReplayDate(stored, "expires_at", "expiresAt");
          if (
            stored &&
            (action === "email_send_code" ||
              (storedExpiresAt !== undefined && storedExpiresAt > current))
          ) {
            return { ok: false as const, reason: "replay" as const };
          }
          await doc.set({
            action,
            cleanup_after: new Date(expiresAtMs + 60 * 60_000),
            consumed_at: new Date(current),
            environment_ref: normalizedEnvironmentRef,
            expires_at: expiresAt,
            key_version: normalizedKeyVersion,
            schema_version: 1
          });
          return { ok: true as const };
        });
        const result = unwrapTransactionResult(transactionResult);
        return result && typeof result === "object" && "ok" in result
          ? result as { ok: true } | { ok: false; reason: "replay" | "unavailable" }
          : { ok: false as const, reason: "unavailable" as const };
      } catch {
        return { ok: false as const, reason: "unavailable" as const };
      }
    }
  };
}

export function createTurnstileEmailChallengeVerifier({
  expectedHostnames,
  fetchImpl = fetch,
  secretKey,
  timeoutMs = 5_000
}: {
  expectedHostnames: string[];
  fetchImpl?: typeof fetch;
  secretKey?: string;
  timeoutMs?: number;
}): EmailChallengeVerifier {
  const normalizedSecret = secretKey?.trim() ?? "";
  const normalizedHostnames = normalizeExactHostnames(expectedHostnames);
  const allowedHostnames = new Set(normalizedHostnames ?? []);
  const hostnamesConfigured = Boolean(normalizedHostnames);

  return {
    expectedHostnames: [...allowedHostnames],
    async verify(input) {
      if (!hostnamesConfigured) return { ok: false, reason: "config-missing" };
      if (!normalizedSecret) return { ok: false, reason: "secret-missing" };
      if (input.token.length > 2048) return { ok: false, reason: "invalid" };

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        Math.max(1, timeoutMs)
      );
      try {
        const body = new FormData();
        body.set("secret", normalizedSecret);
        body.set("response", input.token);
        const response = await fetchImpl(TURNSTILE_SITEVERIFY_URL, {
          body,
          method: "POST",
          signal: controller.signal
        });
        if (!response.ok) return { ok: false, reason: "unreachable" };
        const result = await response.json() as TurnstileSiteverifyResponse;

        if (result.success !== true) {
          const errorCodes = Array.isArray(result["error-codes"])
            ? result["error-codes"].filter((value): value is string => typeof value === "string")
            : [];
          if (errorCodes.includes("timeout-or-duplicate")) {
            return { ok: false, reason: "replay" };
          }
          if (
            errorCodes.includes("missing-input-secret") ||
            errorCodes.includes("invalid-input-secret")
          ) {
            return { ok: false, reason: "secret-missing" };
          }
          if (errorCodes.includes("internal-error")) {
            return { ok: false, reason: "unreachable" };
          }
          return { ok: false, reason: "invalid" };
        }
        if (typeof result.action !== "string" || result.action !== input.action) {
          return { ok: false, reason: "action-mismatch" };
        }
        if (
          typeof result.hostname !== "string" ||
          !allowedHostnames.has(result.hostname.toLowerCase())
        ) {
          return { ok: false, reason: "hostname-mismatch" };
        }

        return {
          action: result.action,
          hostname: result.hostname.toLowerCase(),
          issuedAt: typeof result.challenge_ts === "string" ? result.challenge_ts : undefined,
          ok: true,
          providerEnforcesSingleUse: true
        };
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "name" in error &&
          error.name === "AbortError"
        ) {
          return { ok: false, reason: "timeout" };
        }
        return { ok: false, reason: "unreachable" };
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}

export function createFailClosedEmailChallengeVerifier(): EmailChallengeVerifier {
  return {
    async verify() {
      return { ok: false, reason: "secret-missing" };
    }
  };
}

export async function verifyEmailChallenge({
  expectedAction,
  expectedHostname,
  now = new Date(),
  token,
  verifier
}: {
  expectedAction: "email_send_code" | "password_login";
  expectedHostname: string;
  now?: Date;
  token?: string;
  verifier: EmailChallengeVerifier;
}): Promise<EmailChallengeVerificationResult> {
  const normalizedToken = token?.trim();
  if (!normalizedToken) return { ok: false, reason: "missing" };

  let result: EmailChallengeVerificationResult;
  try {
    result = await verifier.verify({
      action: expectedAction,
      hostname: expectedHostname,
      now,
      token: normalizedToken
    });
  } catch {
    return { ok: false, reason: "unreachable" };
  }

  if (!result.ok) return result;

  const allowedHostnames = verifier.expectedHostnames ?? [expectedHostname];
  if (!allowedHostnames.includes(result.hostname)) {
    return { ok: false, reason: "hostname-mismatch" };
  }
  if (result.action !== expectedAction) {
    return { ok: false, reason: "action-mismatch" };
  }

  if (!result.issuedAt) {
    return { ok: false, reason: "expired" };
  }

  const issuedAtMs = new Date(result.issuedAt).getTime();
  const nowMs = now.getTime();
  if (
    !Number.isFinite(issuedAtMs) ||
    new Date(issuedAtMs).toISOString() !== result.issuedAt ||
    issuedAtMs > nowMs ||
    nowMs - issuedAtMs >= DEFAULT_TOKEN_TTL_MS
  ) {
    return { ok: false, reason: "expired" };
  }

  return {
    ...result,
    expiresAt: new Date(issuedAtMs + DEFAULT_TOKEN_TTL_MS).toISOString()
  };
}
