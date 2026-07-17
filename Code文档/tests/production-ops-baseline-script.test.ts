import { execFileSync } from "node:child_process";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const codeRoot = join(__dirname, "..");

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
});
