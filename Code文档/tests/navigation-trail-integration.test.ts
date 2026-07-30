import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const siteHeaderSource = readFileSync(
  new URL("../features/navigation/site-header.tsx", import.meta.url),
  "utf8"
);
const trailHookSource = readFileSync(
  new URL("../features/navigation/use-navigation-trail.ts", import.meta.url),
  "utf8"
);

describe("shared Header real navigation trail integration", () => {
  it("uses the same-tab trail for the back href while preserving accessibility", () => {
    expect(siteHeaderSource).toContain("useNavigationTrailBackRoute");
    expect(siteHeaderSource).toContain('aria-label="返回上一级"');
    expect(siteHeaderSource).toMatch(/href=\{backRoute\}/);
    expect(siteHeaderSource).toMatch(/onClick=\{consumeBackNavigation\}/);
    expect(siteHeaderSource).not.toContain("history.back");
  });

  it("persists a tab-scoped trail and distinguishes push from replace", () => {
    expect(trailHookSource).toContain("sessionStorage");
    expect(trailHookSource).toContain("history.pushState");
    expect(trailHookSource).toContain("history.replaceState");
    expect(trailHookSource).toContain("pendingModeRef");
    expect(trailHookSource).toContain("tabId");
    expect(trailHookSource).toContain("consumeNavigationTrailBack");
  });
});
