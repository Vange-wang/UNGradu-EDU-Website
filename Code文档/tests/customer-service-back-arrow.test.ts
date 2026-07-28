import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const customerServiceSource = readFileSync(
  join(process.cwd(), "app/customer-service/page.tsx"),
  "utf8"
);

describe("customer-service standard back arrow", () => {
  it("renders exactly one standard link back to the home page", () => {
    const standardBackArrows = customerServiceSource.match(
      /<Link\s+aria-label="返回首页"\s+className="page-back-arrow"\s+href="\/">/g
    );

    expect(standardBackArrows).toHaveLength(1);
  });

  it("keeps the frozen customer-service content and chat entry unchanged", () => {
    expect(customerServiceSource).toContain("先问清规则 再开始找家教");
    expect(customerServiceSource).toContain("平台客服助手");
    expect(customerServiceSource).toContain("<CustomerServiceChat />");
    expect(customerServiceSource).not.toContain("当前使用站内离线客服");
    expect(customerServiceSource).not.toContain("Dify WebApp 仅作为延后入口");
    expect(customerServiceSource).not.toContain(
      "NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL"
    );
  });
});
