import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  join(process.cwd(), "app", "customer-service", "page.tsx"),
  "utf8"
);

const navSource = readFileSync(
  join(process.cwd(), "features", "auth", "session-nav.tsx"),
  "utf8"
);

describe("customer service page copy", () => {
  it("keeps customer service as rule guidance rather than arbitration", () => {
    expect(pageSource).toContain("智能客服");
    expect(pageSource).toContain('export const dynamic = "force-dynamic"');
    expect(pageSource).toContain("NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL");
    expect(pageSource).toContain("不由智能客服裁决");
    expect(pageSource).not.toContain("平台保证退款");
    expect(pageSource).not.toContain("平台担保交易");
    expect(pageSource).not.toContain("客服会立即处理");
  });

  it("adds a top navigation entry for customer service", () => {
    expect(navSource).toContain('href="/customer-service"');
    expect(navSource).toContain("智能客服");
  });
});
