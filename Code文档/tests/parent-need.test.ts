import { describe, expect, it } from "vitest";

import {
  type ParentNeedInput,
  validateParentNeedInput
} from "@/features/parent-needs/parent-need";

const validParentNeedInput: ParentNeedInput = {
  teacherGenderPreference: "不限",
  subjects: ["数学", "英语"],
  grade: "初一",
  budgetMin: "80",
  budgetMax: "120",
  timeSlots: ["周六上午", "周日下午"],
  region: {
    province: "广东省",
    city: "东莞市",
    district: "松山湖"
  },
  community: "松山湖大学城",
  childIntro: "基础中等，希望提升数学解题习惯。"
};

describe("parent need validation", () => {
  it("accepts a complete structured parent need", () => {
    const result = validateParentNeedInput(validParentNeedInput);

    expect(result).toEqual({
      ok: true,
      value: {
        teacherGenderPreference: "不限",
        subjects: ["数学", "英语"],
        grade: "初一",
        budgetMin: 80,
        budgetMax: 120,
        timeSlots: ["周六上午", "周日下午"],
        region: {
          province: "广东省",
          city: "东莞市",
          district: "松山湖"
        },
        community: "松山湖大学城",
        childIntro: "基础中等，希望提升数学解题习惯。"
      },
      errors: {}
    });
  });

  it("rejects child intros longer than 100 characters", () => {
    const result = validateParentNeedInput({
      ...validParentNeedInput,
      childIntro: "一".repeat(101)
    });

    expect(result.ok).toBe(false);
    expect(result.errors.childIntro).toBe("孩子简介最多 100 字");
  });

  it("rejects empty child intro", () => {
    const result = validateParentNeedInput({
      ...validParentNeedInput,
      childIntro: "   "
    });

    expect(result.ok).toBe(false);
    expect(result.errors.childIntro).toBe("请填写孩子简介");
  });

  it("rejects contact information in child intro", () => {
    const result = validateParentNeedInput({
      ...validParentNeedInput,
      childIntro: "请加微信 parent_edu 或打 13800138000"
    });

    expect(result.ok).toBe(false);
    expect(result.errors.childIntro).toBe("孩子简介不得包含手机号或微信号");
  });

  it("rejects door numbers in child intro", () => {
    const result = validateParentNeedInput({
      ...validParentNeedInput,
      childIntro: "孩子住在 3 栋 1201 室，放学后可上课。"
    });

    expect(result.ok).toBe(false);
    expect(result.errors.childIntro).toBe("孩子简介不得包含详细门牌地址");
  });

  it("rejects door numbers in the community field", () => {
    const result = validateParentNeedInput({
      ...validParentNeedInput,
      community: "松山湖大学城 3 栋 1201 室"
    });

    expect(result.ok).toBe(false);
    expect(result.errors.community).toBe("具体位置最多填写到小区或村，不填写门牌号");
  });

  it("rejects unreasonable budget ranges", () => {
    const result = validateParentNeedInput({
      ...validParentNeedInput,
      budgetMin: "180",
      budgetMax: "120"
    });

    expect(result.ok).toBe(false);
    expect(result.errors.budget).toBe("预算区间最低值不能高于最高值");
  });
});
