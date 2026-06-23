import { describe, expect, it } from "vitest";

import {
  createTestSession,
  isTestLoginAllowed,
  readTestSession,
  validateTestLoginInput
} from "@/features/auth/test-auth";
import { createMemoryStorage } from "@/lib/memory-storage";

describe("validateTestLoginInput", () => {
  it("rejects invalid phone numbers", () => {
    const result = validateTestLoginInput({ phone: "123", code: "000000" });

    expect(result.ok).toBe(false);
    expect(result.errors.phone).toBe("请填写有效的 11 位手机号");
  });

  it("rejects incorrect local test codes", () => {
    const result = validateTestLoginInput({ phone: "13800138000", code: "123456" });

    expect(result.ok).toBe(false);
    expect(result.errors.code).toBe("本地测试验证码为 000000");
  });

  it("creates a readable test session after valid login", () => {
    const storage = createMemoryStorage();
    const session = createTestSession({ phone: "13800138000" }, storage);

    expect(readTestSession(storage)).toEqual(session);
  });
});

describe("isTestLoginAllowed", () => {
  it("allows test login in development", () => {
    expect(isTestLoginAllowed({ nodeEnv: "development" })).toBe(true);
  });

  it("allows explicit test login outside development when not in production", () => {
    expect(
      isTestLoginAllowed({
        nodeEnv: "test",
        allowTestLogin: "true"
      })
    ).toBe(true);
  });

  it("rejects test login in production even when explicitly enabled", () => {
    expect(isTestLoginAllowed({ nodeEnv: "production" })).toBe(false);
    expect(
      isTestLoginAllowed({
        appEnv: "production",
        allowHostedTestLogin: "true",
        nodeEnv: "production",
        allowTestLogin: "true"
      })
    ).toBe(false);
  });

  it("allows hosted M5 test login only for isolated test app environment", () => {
    expect(
      isTestLoginAllowed({
        appEnv: "test",
        allowHostedTestLogin: "true",
        nodeEnv: "production"
      })
    ).toBe(true);

    expect(
      isTestLoginAllowed({
        appEnv: "test",
        allowHostedTestLogin: "false",
        nodeEnv: "production"
      })
    ).toBe(false);
  });
});
