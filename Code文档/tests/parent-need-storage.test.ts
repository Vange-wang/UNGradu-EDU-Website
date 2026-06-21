import { describe, expect, it } from "vitest";

import {
  readParentNeeds,
  saveParentNeed
} from "@/features/parent-needs/parent-need-storage";
import { createMemoryStorage } from "@/lib/memory-storage";

const input = {
  teacherGenderPreference: "女老师",
  subjects: ["数学"],
  grade: "小学五年级",
  budgetMin: "70",
  budgetMax: "100",
  timeSlots: ["周六下午"],
  region: {
    province: "广东省",
    city: "东莞市",
    district: "松山湖"
  },
  community: "松山湖大学城",
  childIntro: "需要耐心引导，巩固基础。"
};

describe("parent need storage", () => {
  it("saves parent needs under the current test account", () => {
    const storage = createMemoryStorage();

    const saved = saveParentNeed({
      input,
      ownerPhone: "13800138000",
      storage
    });

    expect(saved.ok).toBe(true);
    expect(readParentNeeds({ ownerPhone: "13800138000", storage })).toHaveLength(1);
    expect(readParentNeeds({ ownerPhone: "13800138000", storage })[0]).toMatchObject({
      ownerPhone: "13800138000",
      subjects: ["数学"],
      budgetMin: 70,
      budgetMax: 100,
      status: "published"
    });
  });

  it("keeps parent needs isolated by test account phone", () => {
    const storage = createMemoryStorage();

    saveParentNeed({ input, ownerPhone: "13800138000", storage });
    saveParentNeed({
      input: { ...input, community: "广东医科大学东莞校区" },
      ownerPhone: "13900139000",
      storage
    });

    expect(readParentNeeds({ ownerPhone: "13800138000", storage })[0].community).toBe(
      "松山湖大学城"
    );
    expect(readParentNeeds({ ownerPhone: "13900139000", storage })[0].community).toBe(
      "广东医科大学东莞校区"
    );
  });
});
