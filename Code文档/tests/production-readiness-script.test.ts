import { execFileSync } from "node:child_process";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const codeRoot = join(__dirname, "..");

function runPreflight(env: Record<string, string | undefined>) {
  return execFileSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "release:production:preflight", "--silent"],
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
    const output = runPreflight({
      APP_ENV: "production",
      AUTH_SESSION_SECRET: "production-secret-placeholder-with-enough-length",
      CLOUDBASE_ENV_ID: "prod-env-id",
      EMAIL_CODE_SECRET: "production-email-code-secret-placeholder",
      EMAIL_FROM: "noreply@example.com",
      EMAIL_PROVIDER: "smtp",
      M5_ENABLE_HOSTED_TEST_LOGIN: "true",
      NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true",
      SMTP_HOST: "smtp.example.com",
      SMTP_PASS: "production-smtp-password-placeholder",
      SMTP_PORT: "465",
      SMTP_SECURE: "true",
      SMTP_USER: "smtp-user-placeholder",
      TENCENTCLOUD_SECRETID: "production-secret-id-placeholder",
      TENCENTCLOUD_SECRETKEY: "production-secret-key-placeholder"
    });

    expect(output).toContain("release production preflight passed");
    expect(output).toContain("temporary test login rejected in production");
    expect(output).toContain("x-ungradu-test-user-phone rejected in production");
    expect(output).not.toContain("production-secret-key-placeholder");
  });

  it("fails when APP_ENV is not production", () => {
    expect(() =>
      runPreflight({
        APP_ENV: "test",
        AUTH_SESSION_SECRET: "production-secret-placeholder-with-enough-length",
        CLOUDBASE_ENV_ID: "prod-env-id",
        EMAIL_CODE_SECRET: "production-email-code-secret-placeholder",
        EMAIL_FROM: "noreply@example.com",
        EMAIL_PROVIDER: "smtp",
        SMTP_HOST: "smtp.example.com",
        SMTP_PASS: "production-smtp-password-placeholder",
        SMTP_PORT: "465",
        SMTP_SECURE: "true",
        SMTP_USER: "smtp-user-placeholder",
        TENCENTCLOUD_SECRETID: "production-secret-id-placeholder",
        TENCENTCLOUD_SECRETKEY: "production-secret-key-placeholder"
      })
    ).toThrow();
  });

  it("fails when production email delivery config is missing", () => {
    expect(() =>
      runPreflight({
        APP_ENV: "production",
        AUTH_SESSION_SECRET: "production-secret-placeholder-with-enough-length",
        CLOUDBASE_ENV_ID: "prod-env-id",
        EMAIL_CODE_SECRET: "production-email-code-secret-placeholder",
        EMAIL_PROVIDER: "console",
        TENCENTCLOUD_SECRETID: "production-secret-id-placeholder",
        TENCENTCLOUD_SECRETKEY: "production-secret-key-placeholder"
      })
    ).toThrow();
  });
});
