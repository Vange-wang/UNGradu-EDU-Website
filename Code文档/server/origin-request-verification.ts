export const ORIGIN_VERIFY_HEADER = "x-ungrade-origin-verify";

export type OriginVerificationMode = "off" | "observe" | "enforce";
export type OriginVerificationStatus =
  | "disabled"
  | "valid"
  | "missing"
  | "invalid"
  | "misconfigured";

export type OriginVerificationResult = {
  mode: OriginVerificationMode;
  status: OriginVerificationStatus;
  shouldReject: boolean;
};

export function normalizeOriginVerificationMode(
  value: string | undefined,
  context: { appEnv?: string; nodeEnv?: string } = {}
): OriginVerificationMode {
  const normalized = value?.trim().toLowerCase();
  if (context.nodeEnv === "production" || context.appEnv === "production") {
    return "enforce";
  }

  if (normalized === "observe" || normalized === "enforce") {
    return normalized;
  }

  return "off";
}

function secretsMatch(providedSecret: string, expectedSecret: string) {
  const encoder = new TextEncoder();
  const provided = encoder.encode(providedSecret);
  const expected = encoder.encode(expectedSecret);
  const comparisonLength = Math.max(provided.length, expected.length, 1);
  let difference = provided.length ^ expected.length;

  for (let index = 0; index < comparisonLength; index += 1) {
    difference |= (provided[index] ?? 0) ^ (expected[index] ?? 0);
  }

  return difference === 0;
}

export function evaluateOriginRequest(input: {
  mode: OriginVerificationMode;
  expectedSecret: string | undefined;
  providedSecret: string | null;
}): OriginVerificationResult {
  if (input.mode === "off") {
    return { mode: "off", status: "disabled", shouldReject: false };
  }

  if (!input.expectedSecret) {
    return {
      mode: input.mode,
      status: "misconfigured",
      shouldReject: input.mode === "enforce"
    };
  }

  if (!input.providedSecret) {
    return {
      mode: input.mode,
      status: "missing",
      shouldReject: input.mode === "enforce"
    };
  }

  const status = secretsMatch(input.providedSecret, input.expectedSecret)
    ? "valid"
    : "invalid";

  return {
    mode: input.mode,
    status,
    shouldReject: input.mode === "enforce" && status !== "valid"
  };
}

export function createOriginVerificationLog(input: {
  method: string;
  pathname: string;
  result: OriginVerificationResult;
}) {
  return {
    event: "origin_verification",
    method: input.method,
    mode: input.result.mode,
    pathname: input.pathname,
    shouldReject: input.result.shouldReject,
    status: input.result.status
  };
}
