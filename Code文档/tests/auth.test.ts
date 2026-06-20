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

  it("requires an explicit flag outside development", () => {
    expect(isTestLoginAllowed({ nodeEnv: "production" })).toBe(false);
    expect(
      isTestLoginAllowed({
        nodeEnv: "production",
        allowTestLogin: "true"
      })
    ).toBe(true);
  });
});
