import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const rulesPage = fs.readFileSync(path.join(root, "app", "rules", "page.tsx"), "utf8");
const globalCss = fs.readFileSync(path.join(root, "app", "globals.css"), "utf8");

describe("approved rules visual contract", () => {
  it("uses the approved student and shield illustration instead of CSS placeholders", () => {
    expect(rulesPage).toContain('from "next/image"');
    expect(rulesPage).toContain("/assets/sitewide-ui/rules-student-shield.png");
    expect(rulesPage).not.toContain("dplus-person");
  });

  it("keeps the frozen two-panel native composition and real rule copy", () => {
    expect(rulesPage).toContain("rules-native-static-reference");
    expect(globalCss).toContain("rules-static-intro.png");
    expect(globalCss).toContain("rules-static-list.png");
    expect(rulesPage).toContain("当前为小范围试运行");
    expect(rulesPage).not.toMatch(/HTTPS|Worker/);
  });

  it("keeps the live mobile trial explanation readable on the warm card", () => {
    expect(globalCss).toMatch(
      /\.rules-refresh-layout \.notice-aside\s*\{[^}]*color:\s*var\(--dplus-ink\)/s
    );
  });
});
