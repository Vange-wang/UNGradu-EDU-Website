import { describe, expect, it } from "vitest";

import {
  findParentNeedById,
  filterParentNeeds,
  readAllParentNeeds,
  saveParentNeed
} from "@/features/parent-needs/parent-need-storage";
import { createMemoryStorage } from "@/lib/memory-storage";

const baseInput = {
  teacherGenderPreference: "女老师",
  subjects: ["数学"],
  grade: "初一",
  budgetMin: "80",
  budgetMax: "120",
  timeSlots: ["周六下午"],
  region: {
    province: "广东省",
    city: "东莞市",
    district: "松山湖"
  },
  community: "松山湖大学城",
  childIntro: "基础中等，需要巩固计算习惯。"
};

describe("parent need marketplace", () => {
  it("reads published parent needs across test accounts", () => {
    const storage = createMemoryStorage();

    saveParentNeed({ input: baseInput, ownerPhone: "13800138000", storage });
    saveParentNeed({
      input: {
        ...baseInput,
        teacherGenderPreference: "不限",
        subjects: ["英语"],
        grade: "高中",
        budgetMin: "130",
        budgetMax: "180",
        community: "广东医科大学东莞校区",
        childIntro: "想提升阅读和写作。"
      },
      ownerPhone: "13900139000",
      storage
    });

    const needs = readAllParentNeeds({ storage });

    expect(needs).toHaveLength(2);
    expect(needs.map((need) => need.ownerPhone).sort()).toEqual([
      "13800138000",
      "13900139000"
    ]);
  });

  it("filters parent needs by subject, grade, budget, and gender preference", () => {
    const storage = createMemoryStorage();

    saveParentNeed({ input: baseInput, ownerPhone: "13800138000", storage });
    saveParentNeed({
      input: {
        ...baseInput,
        subjects: ["英语"],
        grade: "初二",
        budgetMin: "130",
        budgetMax: "170",
        community: "东莞城市学院",
        childIntro: "英语基础薄弱，需要规律练习。"
      },
      ownerPhone: "13900139000",
      storage
    });

    const matched = filterParentNeeds(readAllParentNeeds({ storage }), {
      subject: "数学",
      grade: "初一",
      budgetMin: "90",
      budgetMax: "110",
      teacherGenderPreference: "女老师"
    });

    expect(matched).toHaveLength(1);
    expect(matched[0].subjects).toEqual(["数学"]);
    expect(matched[0].childIntro).toBe("基础中等，需要巩固计算习惯。");
  });

  it("finds a parent need detail by id without contact fields", () => {
    const storage = createMemoryStorage();
    const saved = saveParentNeed({
      input: baseInput,
      ownerPhone: "13800138000",
      storage
    });

    if (!saved.ok) {
      throw new Error("expected valid parent need");
    }

    const detail = findParentNeedById({
      id: saved.value.id,
      storage
    });

    expect(detail).toMatchObject({
      id: saved.value.id,
      grade: "初一",
      childIntro: "基础中等，需要巩固计算习惯。"
    });
    expect(detail).not.toHaveProperty("phone");
    expect(detail).not.toHaveProperty("wechat");
  });
});
