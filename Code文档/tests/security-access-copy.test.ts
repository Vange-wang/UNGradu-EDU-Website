import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(join(process.cwd(), "app", "page.tsx"), "utf8");
const rulesSource = readFileSync(
  join(process.cwd(), "app", "rules", "page.tsx"),
  "utf8"
);

describe("public access and safety copy", () => {
  it("keeps public safety hints neutral and visible", () => {
    const combinedSource = `${homeSource}\n${rulesSource}`;

    expect(combinedSource).toContain("HTTPS 入口");
    expect(combinedSource).toContain("Cloudflare Worker");
    expect(combinedSource).toContain("基础安全加固");
    expect(combinedSource).toContain("ISSUE-0020");
    expect(combinedSource).toContain("不做支付、担保、认证或人工仲裁");
    expect(combinedSource).toContain("不提供担保交易、认证、退款、合同或人工仲裁");
    expect(combinedSource).toContain("手机号、微信号、详细住址、证件或支付凭证");
    expect(combinedSource).not.toContain("已认证安全");
    expect(combinedSource).not.toContain("官方安全认证");
    expect(combinedSource).not.toContain("绝对安全防护");
    expect(combinedSource).not.toContain("客服会立即联系");
    expect(combinedSource).not.toContain("必定退款");
  });
});
