import { describe, expect, it } from "vitest";

import { getTutorCustomerServiceReply } from "@/features/customer-service/tutor-customer-service-agent";

describe("tutor customer service agent", () => {
  it("answers parent need publishing questions", () => {
    const reply = getTutorCustomerServiceReply("家长怎么发布找老师需求？");

    expect(reply.intent).toBe("parent_need");
    expect(reply.answer).toContain("科目");
    expect(reply.answer).toContain("公开列表不会展示联系方式");
    expect(reply.handoffRequired).toBe(false);
  });

  it("answers tutor profile publishing questions", () => {
    const reply = getTutorCustomerServiceReply("大学生怎么发布家教资料？");

    expect(reply.intent).toBe("tutor_profile");
    expect(reply.answer).toContain("可教科目");
    expect(reply.answer).toContain("不要在公开资料里直接写手机号或微信");
  });

  it("keeps contact exchange behind mutual confirmation", () => {
    const reply = getTutorCustomerServiceReply("什么时候能交换联系方式？");

    expect(reply.intent).toBe("contact_exchange");
    expect(reply.answer).toContain("双方先站内沟通并二次确认");
  });

  it("does not promise payments, refunds or arbitration", () => {
    const reply = getTutorCustomerServiceReply("如果有退款纠纷平台会赔偿吗？");

    expect(reply.intent).toBe("risk_handoff");
    expect(reply.handoffRequired).toBe(true);
    expect(reply.answer).toContain("不做担保交易、退款裁决、合同处理或人工仲裁");
  });

  it("handles pricing without platform payment promises", () => {
    const reply = getTutorCustomerServiceReply("课时费多少钱？");

    expect(reply.intent).toBe("pricing");
    expect(reply.answer).toContain("不做支付、抽佣或课时费担保");
  });

  it("keeps a general fee-and-payment question on the pricing boundary", () => {
    const reply = getTutorCustomerServiceReply("课时费和付款怎么处理？");

    expect(reply.intent).toBe("pricing");
    expect(reply.answer).not.toContain("请问你是家长/学生端");
    expect(reply.answer).toContain("具体数额");
  });

  it("combines study details when the parent question is phrased differently", () => {
    const reply = getTutorCustomerServiceReply("我想给八年级孩子找英语家教，从哪开始？");

    expect(reply.intent).toBe("parent_need");
    expect(reply.answer).toContain("科目选择“英语”");
    expect(reply.answer).toContain("学段/年级选择“初二”");
    expect(reply.answer).toContain("/parent-needs/new");
    expect(reply.answer).toContain("公开列表不会展示联系方式");
  });

  it("answers general complaint and false-information policy without forcing a role", () => {
    const reply = getTutorCustomerServiceReply("平台怎么处理投诉或虚假信息？");

    expect(reply.intent).toBe("feedback");
    expect(reply.answer).toContain("/feedback");
    expect(reply.answer).not.toContain("请问你是家长/学生端");
  });

  it("asks for role and event state before answering a concrete offline dispute", () => {
    const reply = getTutorCustomerServiceReply("线下发生纠葛怎么办？");

    expect(reply.intent).toBe("risk_handoff");
    expect(reply.answer).toContain("请问你是家长/学生端");
    expect(reply.answer).toContain("事情已经发生了吗");
    expect(reply.answer).not.toContain("应停止或继续付款");
  });

  it("uses the knowledge fallback to give related facts instead of a bare miss", () => {
    const reply = getTutorCustomerServiceReply("初二英语怎么匹配？");

    expect(reply.intent).toBe("fallback");
    expect(reply.answer).toContain("当前未确认");
    expect(reply.answer).toContain("科目选择“英语”");
    expect(reply.answer).toContain("/feedback");
  });
});
