import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const modulePath = join(here, "..", "server", "origin-request-verification.ts");

type VerificationModule = {
  ORIGIN_VERIFY_HEADER: string;
  normalizeOriginVerificationMode(value: string | undefined): "off" | "observe" | "enforce";
  evaluateOriginRequest(input: {
    mode: "off" | "observe" | "enforce";
    expectedSecret: string | undefined;
    providedSecret: string | null;
  }): {
    mode: "off" | "observe" | "enforce";
    status: "disabled" | "valid" | "missing" | "invalid" | "misconfigured";
    shouldReject: boolean;
  };
  createOriginVerificationLog(input: {
    method: string;
    pathname: string;
    result: {
      mode: "off" | "observe" | "enforce";
      status: "disabled" | "valid" | "missing" | "invalid" | "misconfigured";
      shouldReject: boolean;
    };
  }): Record<string, string | boolean>;
};

async function loadVerificationModule() {
  expect(existsSync(modulePath)).toBe(true);
  if (!existsSync(modulePath)) {
    return null;
  }

  return (await import(pathToFileURL(modulePath).href)) as VerificationModule;
}

describe("origin request verification", () => {
  it("uses a stable private request header and keeps unknown modes disabled", async () => {
    const verification = await loadVerificationModule();
    if (!verification) return;

    expect(verification.ORIGIN_VERIFY_HEADER).toBe("x-ungrade-origin-verify");
    expect(verification.normalizeOriginVerificationMode("observe")).toBe("observe");
    expect(verification.normalizeOriginVerificationMode("enforce")).toBe("enforce");
    expect(verification.normalizeOriginVerificationMode("unexpected")).toBe("off");
    expect(verification.normalizeOriginVerificationMode(undefined)).toBe("off");
  });

  it("records missing and invalid secrets in observe mode without rejecting requests", async () => {
    const verification = await loadVerificationModule();
    if (!verification) return;

    expect(
      verification.evaluateOriginRequest({
        mode: "observe",
        expectedSecret: "expected-test-secret",
        providedSecret: null
      })
    ).toEqual({ mode: "observe", status: "missing", shouldReject: false });
    expect(
      verification.evaluateOriginRequest({
        mode: "observe",
        expectedSecret: "expected-test-secret",
        providedSecret: "wrong-test-secret"
      })
    ).toEqual({ mode: "observe", status: "invalid", shouldReject: false });
  });

  it("accepts a valid secret and rejects every invalid state only in enforce mode", async () => {
    const verification = await loadVerificationModule();
    if (!verification) return;

    expect(
      verification.evaluateOriginRequest({
        mode: "observe",
        expectedSecret: "expected-test-secret",
        providedSecret: "expected-test-secret"
      })
    ).toEqual({ mode: "observe", status: "valid", shouldReject: false });
    expect(
      verification.evaluateOriginRequest({
        mode: "enforce",
        expectedSecret: "expected-test-secret",
        providedSecret: "wrong-test-secret"
      })
    ).toEqual({ mode: "enforce", status: "invalid", shouldReject: true });
    expect(
      verification.evaluateOriginRequest({
        mode: "enforce",
        expectedSecret: undefined,
        providedSecret: null
      })
    ).toEqual({ mode: "enforce", status: "misconfigured", shouldReject: true });
  });

  it("creates verification logs without serializing either secret", async () => {
    const verification = await loadVerificationModule();
    if (!verification) return;

    const result = verification.evaluateOriginRequest({
      mode: "observe",
      expectedSecret: "expected-test-secret",
      providedSecret: "wrong-test-secret"
    });
    const log = verification.createOriginVerificationLog({
      method: "POST",
      pathname: "/api/feedback",
      result
    });
    const serialized = JSON.stringify(log);

    expect(log).toEqual({
      event: "origin_verification",
      method: "POST",
      mode: "observe",
      pathname: "/api/feedback",
      shouldReject: false,
      status: "invalid"
    });
    expect(serialized).not.toContain("expected-test-secret");
    expect(serialized).not.toContain("wrong-test-secret");
  });
});
