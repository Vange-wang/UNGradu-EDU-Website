import { describe, expect, it } from "vitest";

import {
  describeRiskFeedbackStatus,
  normalizeRiskFeedbackInput,
  validateRiskFeedbackInput
} from "@/features/feedback/risk-feedback";

describe("risk feedback validation", () => {
  it("allows anonymous risk feedback with optional contact information", () => {
    const result = validateRiskFeedbackInput({
      category: "虚假信息",
      targetType: "家教信息",
      targetReference: "tutor-profile-1",
      description: "资料中疑似夸大教学经历，需要后续排查。",
      evidenceNote: "",
      contactMethod: "",
      sourcePage: "/feedback"
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        category: "虚假信息",
        targetType: "家教信息",
        targetReference: "tutor-profile-1",
        description: "资料中疑似夸大教学经历，需要后续排查。",
        evidenceNote: "",
        contactMethod: "",
        sourcePage: "/feedback"
      }
    });
  });

  it("requires category, target type, description and source page", () => {
    const result = validateRiskFeedbackInput({
      category: "",
      targetType: "",
      targetReference: "",
      description: "",
      evidenceNote: "",
      contactMethod: "",
      sourcePage: ""
    });

    expect(result).toMatchObject({
      ok: false,
      errors: {
        category: "请选择反馈类型",
        targetType: "请选择反馈对象",
        description: "请填写问题描述",
        sourcePage: "缺少提交来源"
      }
    });
  });

  it("trims free text and caps long optional notes", () => {
    const result = validateRiskFeedbackInput({
      category: "骚扰",
      targetType: "聊天",
      targetReference: "  /chats/abc  ",
      description: "  对方多次要求线下付款，需要记录。  ",
      evidenceNote: "x".repeat(501),
      contactMethod: "  parent@example.com  ",
      sourcePage: "  /feedback  "
    });

    expect(result.ok).toBe(false);
    expect(result.errors.evidenceNote).toBe("证据说明最多 500 字");
    expect(normalizeRiskFeedbackInput({
      category: "骚扰",
      targetType: "聊天",
      targetReference: "  /chats/abc  ",
      description: "  对方多次要求线下付款，需要记录。  ",
      evidenceNote: "  可查看聊天记录  ",
      contactMethod: "  parent@example.com  ",
      sourcePage: "  /feedback  "
    })).toMatchObject({
      targetReference: "/chats/abc",
      description: "对方多次要求线下付款，需要记录。",
      evidenceNote: "可查看聊天记录",
      contactMethod: "parent@example.com",
      sourcePage: "/feedback"
    });
  });

  it("provides neutral status labels for feedback records", () => {
    expect(describeRiskFeedbackStatus("recorded")).toBe("已记录");
    expect(describeRiskFeedbackStatus("reviewing")).toBe("排查中");
    expect(describeRiskFeedbackStatus("closed")).toBe("已归档");
    expect(describeRiskFeedbackStatus("unable_to_process")).toBe("暂无法处理");
  });
});
