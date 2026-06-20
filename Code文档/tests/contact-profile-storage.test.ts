import { describe, expect, it } from "vitest";

import {
  readContactProfile,
  saveContactProfile
} from "@/features/profile/contact-profile-storage";
import { createMemoryStorage } from "@/lib/memory-storage";

describe("contact profile storage", () => {
  it("reads a saved contact profile across storage reads", () => {
    const storage = createMemoryStorage();

    const saved = saveContactProfile(
      { phone: " 13800138000 ", wechat: " tutor_edu " },
      storage
    );

    expect(saved.ok).toBe(true);
    expect(readContactProfile(storage)).toEqual({
      phone: "13800138000",
      wechat: "tutor_edu"
    });
  });

  it("does not save invalid contact profiles", () => {
    const storage = createMemoryStorage();

    const saved = saveContactProfile({ phone: "", wechat: "" }, storage);

    expect(saved.ok).toBe(false);
    expect(readContactProfile(storage)).toBeNull();
  });
});
