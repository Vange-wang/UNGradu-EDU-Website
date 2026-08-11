import { createHmac } from "node:crypto";

export type EmailChallengeFailureReason =
  | "action-mismatch"
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
  consumedAt: Date;
  expiresAt: Date;
  schemaVersion: 1;
};

type PersistentChallengeReplayTransaction = {
  collection: (name: string) => {
    doc: (id: string) => {
      get: () => Promise<{ data?: unknown[] | Record<string, unknown> }>;
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

function readReplayDocument(data: unknown[] | Record<string, unknown> | undefined) {
  const value = Array.isArray(data) ? data[0] : data;
  return value && typeof value === "object"
    ? value as Record<string, unknown>
    : undefined;
}

export function createCloudBasePersistentEmailChallengeReplayGuard({
  collectionName,
  database,
  keySecret,
  now = () => Date.now()
}: {
  collectionName?: string;
  database?: PersistentChallengeReplayDatabase;
  keySecret?: string;
  now?: () => number;
}): EmailChallengeReplayGuard {
  const normalizedCollectionName = collectionName?.trim() ?? "";
  const normalizedKeySecret = keySecret?.trim() ?? "";
  const configured = Boolean(
    database?.runTransaction &&
    normalizedKeySecret &&
    /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(normalizedCollectionName)
  );

  return {
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

      const documentId = createHmac("sha256", normalizedKeySecret)
        .update(`challenge\0${action}\0${normalizedToken}`)
        .digest("base64url");
      try {
        const transactionResult = await database.runTransaction(async (transaction) => {
          const doc = transaction.collection(normalizedCollectionName).doc(documentId);
          const stored = readReplayDocument((await doc.get()).data);
          const storedExpiresAt = stored?.expiresAt instanceof Date
            ? stored.expiresAt.getTime()
            : new Date(String(stored?.expiresAt ?? "")).getTime();
          if (Number.isFinite(storedExpiresAt) && storedExpiresAt > current) {
            return { ok: false as const, reason: "replay" as const };
          }
          await doc.set({
            action,
            consumedAt: new Date(current),
            expiresAt,
            schemaVersion: 1
          });
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
  const allowedHostnames = new Set(
    expectedHostnames.map((hostname) => hostname.trim().toLowerCase()).filter(Boolean)
  );

  return {
    expectedHostnames: [...allowedHostnames],
    async verify(input) {
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
    nowMs - issuedAtMs > DEFAULT_TOKEN_TTL_MS
  ) {
    return { ok: false, reason: "expired" };
  }

  return {
    ...result,
    expiresAt: new Date(issuedAtMs + DEFAULT_TOKEN_TTL_MS).toISOString()
  };
}
