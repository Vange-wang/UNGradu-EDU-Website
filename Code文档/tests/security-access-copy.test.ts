import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(join(process.cwd(), "app", "page.tsx"), "utf8");
const rulesSource = readFileSync(
  join(process.cwd(), "app", "rules", "page.tsx"),
  "utf8"
);

describe("public access and safety copy", () => {
  it("keeps business safety boundaries visible without infrastructure copy", () => {
    const combinedSource = `${homeSource}\n${rulesSource}`;

    expect(combinedSource).not.toContain("HTTPS 入口");
    expect(combinedSource).not.toContain("Cloudflare Worker");
    expect(combinedSource).not.toContain("基础安全加固");
    expect(combinedSource).not.toContain("ISSUE-0020");
    expect(combinedSource).toContain("不做支付、抽佣、成交追踪或评价");
    expect(combinedSource).toContain("不提供担保交易、认证、退款、合同或人工仲裁");
    expect(combinedSource).toContain("手机号、微信号、详细住址、证件或支付凭证");
    expect(combinedSource).not.toContain("已认证安全");
    expect(combinedSource).not.toContain("官方安全认证");
    expect(combinedSource).not.toContain("绝对安全防护");
    expect(combinedSource).not.toContain("客服会立即联系");
    expect(combinedSource).not.toContain("必定退款");
  });
});
