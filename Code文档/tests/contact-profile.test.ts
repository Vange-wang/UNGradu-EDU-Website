import { describe, expect, it } from "vitest";

import { validateContactProfileInput } from "@/features/profile/contact-profile";

describe("validateContactProfileInput", () => {
  it("rejects an empty phone number", () => {
    const result = validateContactProfileInput({ phone: "", wechat: "" });

    expect(result.ok).toBe(false);
    expect(result.errors.phone).toBe("请填写用于交换的手机号");
  });

  it("accepts a valid phone number with optional wechat left empty", () => {
    const result = validateContactProfileInput({ phone: "13800138000", wechat: "" });

    expect(result.ok).toBe(true);
    expect(result.value).toEqual({ phone: "13800138000", wechat: "" });
  });

  it("normalizes whitespace around contact fields", () => {
    const result = validateContactProfileInput({
      phone: " 13800138000 ",
      wechat: " tutor_edu "
    });

    expect(result.ok).toBe(true);
    expect(result.value).toEqual({ phone: "13800138000", wechat: "tutor_edu" });
  });
});
