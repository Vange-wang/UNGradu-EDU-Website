import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const docsRoot = join(process.cwd(), "docs", "customer-service");

function readDoc(fileName: string) {
  const filePath = join(docsRoot, fileName);

  expect(existsSync(filePath), `${fileName} should exist`).toBe(true);

  return readFileSync(filePath, "utf8");
}

describe("customer service knowledge delivery docs", () => {
  it("ships a tutoring-site knowledge base with product boundaries", () => {
    const content = readDoc("ungradu-customer-service-knowledge-base.md");

    expect(content).toContain("UNGradu EDU");
    expect(content).toContain("家长");
    expect(content).toContain("大学生家教");
    expect(content).toContain("站内沟通");
    expect(content).toContain("联系方式");
    expect(content).toContain("不提供担保交易");
    expect(content).toContain("不裁决退款");
    expect(content).toContain("不处理合同仲裁");
    expect(content).toContain("风险与功能反馈");
  });

  it("ships the active v2.2 knowledge source with identity and fallback rules", () => {
    const content = readDoc("ungradu-customer-service-knowledge-base-v2.md");

    expect(content).toContain("CS-KB-UNGRADU-V2.2-2026-08-13");
    expect(content).toContain("最高优先级身份确认规则");
    expect(content).toContain("不能只回复“没有找到确切答案”");
    expect(content).toContain("初二属于初中年级");
    expect(content).toContain("平台当前不提供在线支付");
    expect(content).toContain("/feedback");
  });

  it("ships a Dify system prompt that protects privacy and escalation boundaries", () => {
    const content = readDoc("ungradu-customer-service-system-prompt.md");

    expect(content).toContain("只能依据知识库");
    expect(content).toContain("不要索要身份证");
    expect(content).toContain("不要索要银行卡");
    expect(content).toContain("未成年人");
    expect(content).toContain("/feedback");
    expect(content).toContain("不要承诺立即人工处理");
  });

  it("ships setup and acceptance material for a repeatable Dify handoff", () => {
    const setup = readDoc("dify-customer-service-setup.md");
    const tests = readDoc("ungradu-customer-service-test-cases.md");

    expect(setup).toContain("deepseek-v4-flash");
    expect(setup).toContain("NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL");
    expect(setup).toContain("WebApp");
    expect(setup).toContain("不要把 API Key 放进前端");

    expect(tests).toContain("线上验收");
    expect(tests).toContain("/customer-service");
    expect(tests).toContain("智能客服");
    expect(tests).toContain("不担保");
    expect(tests).toContain("不仲裁");
    expect(setup).toContain("CS-KB-UNGRADU-V2.2-2026-08-13");
    expect(setup).toContain("不调用 GPT、Dify API 或其他模型");
    expect(setup).toContain("CloudBase Run");
  });
});
