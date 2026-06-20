import { describe, expect, it } from "vitest";

import {
  readContactProfile,
  saveContactProfile
} from "@/features/profile/contact-profile-storage";
import { createMemoryStorage } from "@/lib/memory-storage";

describe("contact profile storage", () => {
  it("reads a saved contact profile across storage reads", () => {
    const storage = createMemoryStorage();

    const saved = saveContactProfile({
      input: { phone: " 13800138000 ", wechat: " tutor_edu " },
      ownerPhone: "13800138000",
      storage
    });

    expect(saved.ok).toBe(true);
    expect(readContactProfile({ ownerPhone: "13800138000", storage })).toEqual({
      phone: "13800138000",
      wechat: "tutor_edu"
    });
  });

  it("does not save invalid contact profiles", () => {
    const storage = createMemoryStorage();

    const saved = saveContactProfile({
      input: { phone: "", wechat: "" },
      ownerPhone: "13800138000",
      storage
    });

    expect(saved.ok).toBe(false);
    expect(readContactProfile({ ownerPhone: "13800138000", storage })).toBeNull();
  });

  it("keeps contact profiles isolated by test account phone", () => {
    const storage = createMemoryStorage();

    saveContactProfile({
      input: { phone: "13800138000", wechat: "parent_a" },
      ownerPhone: "13800138000",
      storage
    });
    saveContactProfile({
      input: { phone: "13900139000", wechat: "parent_b" },
      ownerPhone: "13900139000",
      storage
    });

    expect(readContactProfile({ ownerPhone: "13800138000", storage })).toEqual({
      phone: "13800138000",
      wechat: "parent_a"
    });
    expect(readContactProfile({ ownerPhone: "13900139000", storage })).toEqual({
      phone: "13900139000",
      wechat: "parent_b"
    });
  });
});
