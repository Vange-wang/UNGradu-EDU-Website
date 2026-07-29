import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const customerServiceSource = readFileSync(
  join(process.cwd(), "app/customer-service/page.tsx"),
  "utf8"
);
const siteHeaderSource = readFileSync(
  join(process.cwd(), "features/navigation/site-header.tsx"),
  "utf8"
);
const globalCss = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
const homeEntryGridCss =
  globalCss.match(/\.home-entry-grid\s*\{([^}]*)\}/)?.[1] ?? "";

describe("customer-service shared back arrow", () => {
  it("renders the standard home link only in the shared header", () => {
    const standardBackArrows = siteHeaderSource.match(
      /<Link\s+aria-label="返回首页"\s+className="page-back-arrow"\s+href="\/">/g
    );

    expect(standardBackArrows).toBeNull();
    expect(siteHeaderSource).toContain('aria-label="返回首页"');
    expect(siteHeaderSource).toContain('className="site-back-link"');
    expect(customerServiceSource).not.toContain('aria-label="返回首页"');
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

  it("keeps the customer-service work area directly after its hero", () => {
    const heroStart = customerServiceSource.indexOf(
      '<section className="customer-service-info-strip">'
    );
    const workspaceStart = customerServiceSource.indexOf(
      '<div className="customer-service-layout">'
    );

    expect(heroStart).toBeGreaterThanOrEqual(0);
    expect(workspaceStart).toBeGreaterThan(heroStart);
    expect(customerServiceSource.slice(heroStart, workspaceStart)).not.toContain(
      "page-back-arrow"
    );
  });

  it("lets home entry grid rows expand when the tutor card copy wraps", () => {
    expect(homeEntryGridCss).toMatch(
      /grid-auto-rows:\s*minmax\(219px,\s*max-content\);/
    );
  });

  it("keeps both home entry columns shrinkable instead of reserving a fixed parent-card width", () => {
    expect(homeEntryGridCss).toMatch(
      /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/
    );
  });
});
