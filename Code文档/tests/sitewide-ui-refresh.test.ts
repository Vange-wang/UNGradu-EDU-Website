import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const layoutSource = read("app/layout.tsx");
const homeSource = read("app/page.tsx");
const loginSource = read("app/login/page.tsx");
const rulesSource = read("app/rules/page.tsx");
const customerServiceSource = read("app/customer-service/page.tsx");
const parentNeedsSource = read("app/parent-needs/page.tsx");
const tutorProfilesSource = read("app/tutor-profiles/page.tsx");
const globalsCss = read("app/globals.css");
const siteHeaderSource = read("features/navigation/site-header.tsx");

describe("sitewide D+ refresh structure", () => {
  it("keeps the logged-out navigation contract and adds the shared brand mark", () => {
    expect(layoutSource).toContain("<SiteHeader />");
    expect(siteHeaderSource).toContain('className="brand-mark"');
    expect(siteHeaderSource).toContain('className="brand-name"');
    expect(read("features/auth/session-nav.tsx")).toContain("登录 / 注册");
    expect(read("features/auth/session-nav.tsx")).toContain("智能客服");
    expect(read("features/auth/session-nav.tsx")).toContain("规则");
  });

  it("builds the approved home gateway without moving feedback into navigation", () => {
    expect(homeSource).toContain("大学生家教平台");
    expect(homeSource).toContain("大学生家教 · 先聊清楚");
    expect(homeSource).toContain("更安心");
    expect(homeSource).toContain("更便捷");
    expect(homeSource).toContain("选择多");
    expect(homeSource).toContain('className="home-entry-grid"');
    expect(homeSource).toContain('className="home-link-grid"');
    expect(homeSource).toContain('href="/feedback"');
    expect(read("features/auth/session-nav.tsx")).not.toContain('href="/feedback"');
  });

  it("uses one shared back-arrow pattern without page-level duplicates", () => {
    expect(siteHeaderSource).toContain('className="site-back-link"');
    expect(siteHeaderSource).toContain('aria-label="返回上一级"');
    for (const source of [
      loginSource,
      rulesSource,
      parentNeedsSource,
      tutorProfilesSource
    ]) {
      expect(source).not.toContain('className="page-back-arrow"');
      expect(source).not.toContain('aria-label="返回首页"');
    }
  });

  it("keeps login behavior while exposing the approved two-column shell", () => {
    expect(loginSource).toContain('className="auth-shell sitewide-auth-shell"');
    expect(loginSource).toContain("<LoginPageContent");
    expect(read("features/auth/login-form.tsx")).toContain(
      'fetch("/api/auth/email/login"'
    );
  });

  it("keeps four business rules and removes the obsolete HTTPS Worker copy", () => {
    expect(rulesSource).toMatch(/className="[^"]*rules-refresh-layout[^"]*"/);
    expect(rulesSource.match(/className="notice-item/g)?.length).toBe(4);
    expect(rulesSource).not.toContain("Cloudflare Worker");
    expect(rulesSource).not.toContain("HTTPS 入口");
  });

  it("removes only the customer-service Dify display block", () => {
    expect(customerServiceSource).toContain('className="customer-service-info-strip"');
    expect(customerServiceSource).not.toContain("当前使用站内离线客服");
    expect(customerServiceSource).not.toContain("Dify WebApp 仅作为延后入口");
    expect(customerServiceSource).not.toContain(
      "NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL"
    );
    expect(customerServiceSource).toContain("<CustomerServiceChat />");
  });

  it("uses the approved three-frame marketplace layout without changing data flows", () => {
    for (const source of [parentNeedsSource, tutorProfilesSource]) {
      expect(source).toContain('className="marketplace-refresh-shell"');
      expect(source).toMatch(/className="[^"]*marketplace-refresh-main[^"]*"/);
      expect(source).toContain('className="filter-panel"');
      expect(source).toContain('className="market-header"');
      expect(source).toContain('className="result-panel"');
    }
    expect(parentNeedsSource).toContain("listPublicParentNeedsFromApi");
    expect(tutorProfilesSource).toContain("listPublicTutorProfilesFromApi");
  });

  it("locks the responsive geometry and internal-scroll contracts in CSS", () => {
    expect(globalsCss).toContain(".sitewide-refresh-page");
    expect(globalsCss).toContain(".marketplace-refresh-shell");
    expect(globalsCss).toContain(".customer-service-info-strip");
    expect(globalsCss).toMatch(
      /\.customer-service-messages\s*\{[^}]*overflow-y:\s*auto/s
    );
    expect(globalsCss).toMatch(
      /\.customer-service-quick-list\s*\{[^}]*display:\s*flex/s
    );
    expect(globalsCss).toContain("@media (max-width: 720px)");
  });
});
