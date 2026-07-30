import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("SITE-UX-IMPLEMENT-20260729-001", () => {
  it("renders the only return-home arrow from the shared header on inner pages", () => {
    const layoutSource = read("app/layout.tsx");
    const pageSources = [
      "app/login/page.tsx",
      "app/rules/page.tsx",
      "app/customer-service/page.tsx",
      "app/feedback/page.tsx",
      "app/parent-needs/page.tsx",
      "app/parent-needs/new/page.tsx",
      "app/tutor-profiles/page.tsx",
      "app/tutor-profiles/new/page.tsx",
      "app/profile/page.tsx"
    ].map(read);

    expect(layoutSource).toContain("<SiteHeader />");
    for (const source of pageSources) {
      expect(source).not.toContain('className="page-back-arrow"');
      expect(source).not.toContain("返回首页");
    }
  });

  it("locks the shared header and return target to the approved desktop and mobile geometry", () => {
    const headerSource = read("features/navigation/site-header.tsx");
    const globalsCss = read("app/globals.css");

    expect(headerSource).toContain('aria-label="返回上一级"');
    expect(headerSource).toContain('className="site-back-link"');
    expect(headerSource).not.toMatch(/className="site-back-link"[^>]*href="\//);
    expect(headerSource).toContain(
      'useNavigationTrailBackRoute(pathname ?? "/")'
    );
    expect(headerSource).toContain('pathname !== "/"');
    expect(globalsCss).toMatch(
      /\.site-header\.site-header\s*\{[^}]*height:\s*72px[^}]*background:\s*#fff/s
    );
    expect(globalsCss).toMatch(
      /\.site-back-link\s*\{[^}]*height:\s*48px[^}]*width:\s*48px/s
    );
    expect(globalsCss).toMatch(
      /@media\s*\(max-width:\s*720px\)[\s\S]*?\.site-header\.site-header\s*\{[^}]*height:\s*64px/s
    );
    expect(globalsCss).toMatch(
      /@media\s*\(max-width:\s*720px\)[\s\S]*?\.site-back-link\s*\{[^}]*height:\s*40px[^}]*width:\s*40px/s
    );
    expect(globalsCss).toMatch(
      /@media\s*\(max-width:\s*720px\)[\s\S]*?\.site-header\.site-header \.brand-name\s*\{[^}]*display:\s*inline/s
    );
  });

  it("removes the clipped hidden-scroll auxiliary navigation from the 390px header", () => {
    const globalsCss = read("app/globals.css");

    expect(globalsCss).toMatch(
      /@media\s*\(max-width:\s*720px\)[\s\S]*?\.site-header\.site-header \.top-nav\s*\{[^}]*display:\s*none[^}]*overflow-x:\s*visible[^}]*scrollbar-width:\s*auto/s
    );
  });

  it("keeps the login form controls shrinkable inside the two-column shell", () => {
    const globalsCss = read("app/globals.css");

    expect(globalsCss).toMatch(
      /\.sitewide-auth-shell\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s
    );
    expect(globalsCss).toMatch(
      /\.sitewide-auth-shell\s*>\s*\*\s*\{[^}]*min-width:\s*0/s
    );
    expect(globalsCss).toMatch(
      /\.sitewide-auth-shell \.form > \.field:first-child,[\s\S]*?\.auth-code-field,[\s\S]*?\.sitewide-auth-shell \.form > \.button\.primary\s*\{[^}]*width:\s*100%/s
    );
  });

  it("keeps every home link card on equal shrinkable columns", () => {
    const globalsCss = read("app/globals.css");

    expect(globalsCss).toMatch(
      /\.home-refresh-main\s*\{[^}]*width:\s*100%/s
    );
    expect(globalsCss).toMatch(
      /@media\s*\(max-width:\s*1100px\)[\s\S]*?\.home-refresh-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s
    );
    expect(globalsCss).toMatch(
      /\.home-link-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s
    );
    expect(globalsCss).toMatch(
      /@media\s*\(max-width:\s*720px\)[\s\S]*?\.home-link-grid\s*\{[^}]*grid-template-columns:\s*1fr/s
    );
  });

  it("places the muted chat card first across both profile columns", () => {
    const profileSource = read("app/profile/page.tsx");
    const globalsCss = read("app/globals.css");

    expect(profileSource.indexOf('title: "我的聊天"')).toBeLessThan(
      profileSource.indexOf('title: "联系方式管理"')
    );
    expect(profileSource).toContain("account-card-chat");
    expect(profileSource.indexOf('className="dplus-profile-banner"')).toBeLessThan(
      profileSource.indexOf('className="account-card-grid"')
    );
    expect(globalsCss).toMatch(
      /\.account-card-chat\s*\{[^}]*background:\s*#C9D3C5[^}]*grid-column:\s*1\s*\/\s*-1/s
    );
    expect(globalsCss).toMatch(
      /@media\s*\(max-width:\s*720px\)[\s\S]*?\.account-card-chat\s*\{[^}]*grid-column:\s*auto/s
    );
  });

  it("uses the confirmed warm-neutral account panel without changing the profile card grid", () => {
    const globalsCss = read("app/globals.css");

    expect(globalsCss).toMatch(
      /\.dplus-profile-page \.account-summary\s*\{[^}]*background:\s*#FFF9E8[^}]*border:\s*3px solid #1B1B1A[^}]*box-shadow:\s*4px 4px 0 #1B1B1A/s
    );
    expect(globalsCss).toMatch(
      /\.dplus-profile-page \.account-status-grid\s*\{[^}]*background:\s*#E7EEE6[^}]*border:\s*2px solid #1B1B1A[^}]*border-radius:\s*14px/s
    );
    expect(globalsCss).toMatch(
      /\.dplus-profile-page \.account-status-grid > div \+ div\s*\{[^}]*border-left:\s*1px solid #C5CEC2/s
    );
    expect(globalsCss).toMatch(
      /\.dplus-profile-page \.dplus-account-rules span\s*\{[^}]*background:\s*#FFF1A8[^}]*border:\s*2px solid #1B1B1A/s
    );
    expect(globalsCss).toMatch(
      /\.dplus-profile-page \.dplus-account-rules span:nth-child\(2\)\s*\{[^}]*background:\s*#D9E7D5/s
    );
    expect(globalsCss).toMatch(
      /\.dplus-profile-page \.dplus-account-rules span:nth-child\(3\)\s*\{[^}]*background:\s*#FFD1B3/s
    );
    expect(globalsCss).toMatch(
      /\.dplus-profile-page \.account-summary \.button\.secondary\s*\{[^}]*background:\s*#FFFDF7[^}]*min-height:\s*48px/s
    );
    expect(globalsCss).toMatch(
      /@media\s*\(max-width:\s*720px\)[\s\S]*?\.dplus-profile-page \.account-summary\s*\{[^}]*padding:\s*20px/s
    );
  });

  it("compresses only the profile hero while preserving readable copy and its yellow ornament", () => {
    const globalsCss = read("app/globals.css");

    expect(globalsCss).toMatch(
      /@media\s*\(min-width:\s*721px\)[\s\S]*?\.dplus-profile-page \.workspace-header\s*\{[^}]*min-height:\s*164px[^}]*padding:\s*18px 32px 16px[^}]*margin-bottom:\s*16px/s
    );
    expect(globalsCss).toMatch(
      /@media\s*\(min-width:\s*721px\)[\s\S]*?\.dplus-profile-page \.workspace-header > div\s*\{[^}]*display:\s*grid[^}]*gap:\s*6px[^}]*max-width:\s*calc\(100% - 112px\)/s
    );
    expect(globalsCss).toMatch(
      /@media\s*\(min-width:\s*721px\)[\s\S]*?\.dplus-profile-page \.wide-panel::before\s*\{[^}]*height:\s*68px[^}]*right:\s*32px[^}]*top:\s*24px[^}]*width:\s*68px/s
    );
    expect(globalsCss).toMatch(
      /@media\s*\(max-width:\s*720px\)[\s\S]*?\.dplus-profile-page \.workspace-header\s*\{[^}]*min-height:\s*148px[^}]*padding:\s*6px 16px 8px[^}]*margin-bottom:\s*12px/s
    );
    expect(globalsCss).toMatch(
      /@media\s*\(max-width:\s*720px\)[\s\S]*?\.dplus-profile-page \.workspace-header > div\s*\{[^}]*display:\s*grid[^}]*gap:\s*4px[^}]*max-width:\s*calc\(100% - 72px\)/s
    );
    expect(globalsCss).toMatch(
      /@media\s*\(max-width:\s*720px\)[\s\S]*?\.dplus-profile-page \.wide-panel::before\s*\{[^}]*height:\s*56px[^}]*right:\s*16px[^}]*top:\s*18px[^}]*width:\s*56px/s
    );
    expect(globalsCss).toMatch(
      /\.dplus-profile-page \.workspace-header > div \.eyebrow\s*\{[^}]*justify-self:\s*start[^}]*width:\s*fit-content/s
    );
  });
});
