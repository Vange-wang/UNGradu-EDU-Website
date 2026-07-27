import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const pageSource = fs.readFileSync(
  path.join(root, "app", "parent-needs", "page.tsx"),
  "utf8"
);
const globalCss = fs.readFileSync(path.join(root, "app", "globals.css"), "utf8");
const captureSource = fs.readFileSync(
  path.join(root, "scripts", "capture-sitewide-visual.mjs"),
  "utf8"
);

describe("approved parent-needs marketplace visual contract", () => {
  it("uses the frozen native regions while preserving live marketplace controls", () => {
    expect(pageSource).toContain("parent-needs-native-static-reference");
    expect(globalCss).toContain("parent-needs-background.png");
    expect(globalCss).toContain("parent-needs-static-header.png");
    expect(globalCss).toContain("parent-needs-static-back.png");
    expect(globalCss).toContain("parent-needs-static-filter.png");
    expect(globalCss).toContain("parent-needs-static-intro.png");
    expect(globalCss).toContain("parent-needs-static-result.png");
    expect(globalCss).toContain("parent-needs-static-results-frame.png");
    expect(pageSource).toContain(
      'data-result-state={usesApprovedVisualFixture ? "fixture" : "live"}'
    );
    expect(pageSource).toContain('className="filter-stack"');
    expect(pageSource).toContain('href="/parent-needs/new"');
    expect(pageSource).toContain('href={`/parent-needs/${need.id}`}');
  });

  it("locks the native three-frame geometry and uses a capture-only API fixture", () => {
    expect(globalCss).toContain("grid-template-columns: 415px 909px");
    expect(globalCss).toContain("grid-template-rows: 235px 630px");
    expect(captureSource).toContain("approved-parent-needs-visual-fixture");
    expect(captureSource).toContain('options.page === "parent-needs"');
  });
});
