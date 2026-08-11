import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const codeRoot = join(__dirname, "..");

function productionEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    ALLOWED_ORIGINS: "https://ungraduedu.eu.cc",
    APP_ENV: "production",
    AUTH_SESSION_KEY_VERSION: "v1",
    AUTH_SESSION_REVOCATION_REQUIRED: "true",
    AUTH_SESSION_SECRET: "production-session-placeholder",
    CLOUDBASE_ENV_ID: "prod-env-id",
    CSRF_SECRET: "csrf-secret-placeholder",
    EMAIL_CODE_SECRET: "email-secret-placeholder",
    EMAIL_FROM: "noreply@example.com",
    EMAIL_PROVIDER: "smtp",
    NODE_ENV: "production",
    ORIGIN_OLD_SECRET_EXPOSURE: "exposed",
    ORIGIN_ROTATION_STRATEGY: "hard-cut",
    ORIGIN_VERIFY_MODE: "enforce",
    ORIGIN_VERIFY_SECRET: "origin-secret-placeholder",
    SMTP_HOST: "smtp.example.com",
    SMTP_PASS: "smtp-pass-placeholder",
    SMTP_PORT: "465",
    SMTP_SECURE: "true",
    SMTP_USER: "smtp-user-placeholder",
    TENCENTCLOUD_SECRETID: "secret-id-placeholder",
    TENCENTCLOUD_SECRETKEY: "secret-key-placeholder",
    ...overrides
  };
}

function runOpsBaseline(env: Record<string, string | undefined> = {}) {
  return execFileSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "production:ops:baseline", "--silent"],
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

describe("production operations baseline script", () => {
  it("passes without reading or printing real secrets", () => {
    const output = runOpsBaseline({
      AUTH_SESSION_SECRET: "do-not-print-session-secret",
      EMAIL_CODE_SECRET: "do-not-print-email-secret",
      SMTP_PASS: "do-not-print-smtp-password",
      TENCENTCLOUD_SECRETKEY: "do-not-print-cloud-secret"
    });

    expect(output).toContain("S2 production operations baseline check passed");
    expect(output).toContain("no real secrets");
    expect(output).not.toContain("do-not-print-session-secret");
    expect(output).not.toContain("do-not-print-email-secret");
    expect(output).not.toContain("do-not-print-smtp-password");
    expect(output).not.toContain("do-not-print-cloud-secret");
  });

  it("fails when production test switches are enabled", () => {
    expect(() =>
      runOpsBaseline({
        M5_ENABLE_HOSTED_TEST_LOGIN: "true"
      })
    ).toThrow();
  });

  it("fails final production baseline while a previous origin secret remains", () => {
    expect(() => runOpsBaseline(productionEnv({
      ORIGIN_VERIFY_SECRET_PREVIOUS: "old-secret-placeholder"
    }))).toThrow();
  });

  it("rejects an exposed origin using overlap and rejects future revocation timestamps", () => {
    expect(() => runOpsBaseline(productionEnv({
      ORIGIN_ROTATION_STRATEGY: "overlap"
    }))).toThrow();
    expect(() => runOpsBaseline(productionEnv({
      AUTH_SESSION_REVOKED_AT: new Date(Date.now() + 60_000).toISOString()
    }))).toThrow();
  });

  it("does not bake secret-shaped ARG or ENV declarations into the Docker image", () => {
    const dockerfile = readFileSync(join(codeRoot, "Dockerfile"), "utf8");

    expect(dockerfile).not.toMatch(/^\s*(?:ARG|ENV)\s+(?:AUTH_SESSION_SECRET|EMAIL_CODE_SECRET|TENCENTCLOUD_SECRETID|TENCENTCLOUD_SECRETKEY|ORIGIN_VERIFY_SECRET)\b/im);
    expect(dockerfile).toContain("build-only-placeholder");
    expect(dockerfile).toContain("Runtime credentials are injected");
  });

  it("delivers the public Turnstile site key from server runtime instead of the Docker build", () => {
    const dockerfile = readFileSync(join(codeRoot, "Dockerfile"), "utf8");
    const loginPage = readFileSync(
      join(codeRoot, "app", "login", "page.tsx"),
      "utf8",
    );
    const loginPageContent = readFileSync(
      join(codeRoot, "features", "auth", "login-page-content.tsx"),
      "utf8",
    );
    const loginForm = readFileSync(
      join(codeRoot, "features", "auth", "login-form.tsx"),
      "utf8",
    );

    expect(loginPage).toContain('export const dynamic = "force-dynamic"');
    expect(loginPage).toContain("readRuntimeTurnstileSiteKey()");
    expect(loginPage).toContain("turnstileSiteKey={turnstileSiteKey}");
    expect(loginPageContent).toContain(
      "<LoginForm turnstileSiteKey={turnstileSiteKey} />",
    );
    expect(loginForm).toContain("siteKey={turnstileSiteKey}");
    expect(loginForm).not.toContain(
      "process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    );
    expect(dockerfile).not.toContain("ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY");
    expect(dockerfile).not.toContain("ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY");
    expect(dockerfile).not.toMatch(
      /^\s*(?:ARG|ENV)\s+\w*(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY)\w*\b/im,
    );
  });

  it("uses fixed presence masking for CloudBase SecretId output", () => {
    for (const scriptName of [
      "check-cloudbase-connection.mjs",
      "check-m5-cloudbase-collections.mjs",
      "backfill-conversation-indexes.mjs"
    ]) {
      const script = readFileSync(join(codeRoot, "scripts", scriptName), "utf8");
      expect(script).not.toContain("slice(0, 4)");
      expect(script).toContain('SecretId: [configured]');
    }
  });
});
