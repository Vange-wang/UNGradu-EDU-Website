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
      hostname: string;
      issuedAt?: string;
      ok: true;
      tokenId?: string;
    }
  | { ok: false; reason: EmailChallengeFailureReason };

export type EmailChallengeVerifier = {
  verify: (
    input: EmailChallengeVerificationInput
  ) => Promise<EmailChallengeVerificationResult>;
};

const DEFAULT_TOKEN_TTL_MS = 300_000;

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

  if (result.hostname !== expectedHostname) {
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

  return result;
}
