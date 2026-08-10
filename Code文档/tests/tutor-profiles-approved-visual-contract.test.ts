import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const pageSource = fs.readFileSync(
  path.join(root, "app", "tutor-profiles", "page.tsx"),
  "utf8"
);
const detailSource = fs.readFileSync(
  path.join(root, "app", "tutor-profiles", "[id]", "page.tsx"),
  "utf8"
);
const globalCss = fs.readFileSync(path.join(root, "app", "globals.css"), "utf8");
const captureSource = fs.readFileSync(
  path.join(root, "scripts", "capture-sitewide-visual.mjs"),
  "utf8"
);

describe("approved tutor-profile marketplace visual contract", () => {
  it("uses the frozen native regions while preserving live marketplace controls", () => {
    expect(pageSource).toContain("tutor-profiles-native-static-reference");
    expect(globalCss).toContain("tutor-profiles-background.png");
    expect(globalCss).toContain("tutor-profiles-static-header.png");
    expect(globalCss).toContain("tutor-profiles-static-back.png");
    expect(globalCss).toContain("tutor-profiles-static-filter.png");
    expect(globalCss).toContain("tutor-profiles-static-intro.png");
    expect(globalCss).toContain("tutor-profiles-static-result.png");
    expect(globalCss).toContain("tutor-profiles-static-results-frame.png");
    expect(pageSource).toContain('data-result-state={usesApprovedVisualFixture ? "fixture" : "live"}');
    expect(pageSource).toContain('className="filter-stack"');
    expect(pageSource).toContain('href="/tutor-profiles/new"');
    expect(pageSource).toContain('href={`/tutor-profiles/${profile.id}`}');
  });

  it("locks the native three-frame geometry and uses a capture-only API fixture", () => {
    expect(globalCss).toContain("grid-template-columns: 415px 909px");
    expect(globalCss).toContain("grid-template-rows: 235px 630px");
    expect(captureSource).toContain("approved-tutor-visual-fixture");
    expect(captureSource).toContain('options.page === "tutor-profiles"');
  });

  it("does not render a dangling school/major separator or proof metadata", () => {
    expect(pageSource).toContain("function isValidPublicSummary");
    expect(pageSource).toContain("formatTutorIdentity(profile)");
    expect(detailSource).toContain("证明材料暂不公开");
    expect(detailSource).not.toContain("证明图片：{profile.proofImages.length}");
    expect(detailSource).toContain("function isValidPublicSummary");
  });
});
