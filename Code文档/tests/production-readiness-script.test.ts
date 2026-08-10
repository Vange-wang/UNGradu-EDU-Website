import { execFileSync } from "node:child_process";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const codeRoot = join(__dirname, "..");

function productionEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    ALLOWED_ORIGINS: "https://ungraduedu.eu.cc",
    APP_ENV: "production",
    AUTH_SESSION_KEY_VERSION: "v1",
    AUTH_SESSION_REVOCATION_REQUIRED: "true",
    AUTH_SESSION_SECRET: "production-secret-placeholder-with-enough-length",
    CLOUDBASE_ENV_ID: "prod-env-id",
    CSRF_SECRET: "csrf-secret-placeholder",
    EMAIL_CODE_SECRET: "production-email-code-secret-placeholder",
    EMAIL_FROM: "noreply@example.com",
    EMAIL_PROVIDER: "smtp",
    NODE_ENV: "production",
    ORIGIN_OLD_SECRET_EXPOSURE: "exposed",
    ORIGIN_ROTATION_STRATEGY: "hard-cut",
    ORIGIN_VERIFY_MODE: "enforce",
    ORIGIN_VERIFY_SECRET: "origin-secret-placeholder",
    SMTP_HOST: "smtp.example.com",
    SMTP_PASS: "production-smtp-password-placeholder",
    SMTP_PORT: "465",
    SMTP_SECURE: "true",
    SMTP_USER: "smtp-user-placeholder",
    TENCENTCLOUD_SECRETID: "production-secret-id-placeholder",
    TENCENTCLOUD_SECRETKEY: "production-secret-key-placeholder",
    ...overrides
  };
}

function runPreflight(env: Record<string, string | undefined>, args: string[] = []) {
  return execFileSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "release:production:preflight", "--silent", ...(args.length > 0 ? ["--", ...args] : [])],
    {
      cwd: codeRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        ...env
      },
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
}

describe("production readiness preflight script", () => {
  it("passes with production env while proving temporary test login stays rejected under misconfigured test switches", () => {
    const output = runPreflight(productionEnv({
      M5_ENABLE_HOSTED_TEST_LOGIN: "true",
      NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true"
    }));

    expect(output).toContain("release production preflight passed");
    expect(output).toContain("temporary test login rejected in production");
    expect(output).toContain("x-ungradu-test-user-phone rejected in production");
    expect(output).not.toContain("production-secret-key-placeholder");
  });

  it("fails when APP_ENV is not production", () => {
    expect(() =>
      runPreflight(productionEnv({ APP_ENV: "test" }))
    ).toThrow();
  });

  it("fails when production email delivery config is missing", () => {
    expect(() =>
      runPreflight(productionEnv({ EMAIL_PROVIDER: "console" }))
    ).toThrow();
  });

  it("fails closed while a previous origin secret remains or the final mode is not enforce", () => {
    expect(() => runPreflight(productionEnv({ ORIGIN_VERIFY_SECRET_PREVIOUS: "old-secret-placeholder" }))).toThrow();
    expect(() => runPreflight(productionEnv({ ORIGIN_VERIFY_MODE: "observe" }))).toThrow();
  });

  it("rejects an exposed origin classified for overlap or with a previous value", () => {
    expect(() => runPreflight(productionEnv({
      ORIGIN_ROTATION_STRATEGY: "overlap"
    }))).toThrow();
    expect(() => runPreflight(productionEnv({
      ORIGIN_VERIFY_SECRET_PREVIOUS: "old-secret-placeholder"
    }))).toThrow();
  });

  it("allows only not-exposed overlap during transition and keeps final readiness separate", () => {
    const output = runPreflight({
      ...productionEnv({
        ORIGIN_OLD_SECRET_EXPOSURE: "not-exposed",
        ORIGIN_ROTATION_STRATEGY: "overlap",
        ORIGIN_VERIFY_SECRET_PREVIOUS: "old-secret-placeholder"
      }),
      ORIGIN_ROTATION_PHASE: "transition"
    }, ["--phase", "transition"]);

    expect(output).toContain("origin rotation transition preflight passed");
    expect(() => runPreflight(productionEnv({
      ORIGIN_OLD_SECRET_EXPOSURE: "not-exposed",
      ORIGIN_ROTATION_STRATEGY: "overlap",
      ORIGIN_VERIFY_SECRET_PREVIOUS: "old-secret-placeholder"
    }))).toThrow();
    expect(runPreflight(productionEnv({
      ORIGIN_OLD_SECRET_EXPOSURE: "not-exposed",
      ORIGIN_ROTATION_STRATEGY: "overlap"
    }))).toContain("release production preflight passed");
  });

  it("rejects missing or unknown rotation classifications", () => {
    expect(() => runPreflight(productionEnv({
      ORIGIN_OLD_SECRET_EXPOSURE: undefined
    }))).toThrow();
    expect(() => runPreflight(productionEnv({
      ORIGIN_ROTATION_STRATEGY: "observe"
    }))).toThrow();
  });

  it("rejects future revoked-at timestamps while allowing empty or historical canonical ISO", () => {
    expect(() => runPreflight(productionEnv({ AUTH_SESSION_REVOKED_AT: new Date(Date.now() + 60_000).toISOString() }))).toThrow();
    expect(() => runPreflight(productionEnv({ AUTH_SESSION_REVOKED_AT: "not-a-timestamp" }))).toThrow();
    expect(runPreflight(productionEnv({ AUTH_SESSION_REVOKED_AT: "" }))).toContain("release production preflight passed");
    expect(runPreflight(productionEnv({ AUTH_SESSION_REVOKED_AT: "2026-01-01T00:00:00.000Z" }))).toContain("release production preflight passed");
  });
});
