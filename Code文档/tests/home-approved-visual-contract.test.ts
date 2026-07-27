import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const homeSource = fs.readFileSync(path.join(root, "app", "page.tsx"), "utf8");
const layoutSource = fs.readFileSync(path.join(root, "app", "layout.tsx"), "utf8");
const globalCss = fs.readFileSync(path.join(root, "app", "globals.css"), "utf8");

describe("approved home visual contract", () => {
  it("uses the approved local illustration assets instead of placeholder CSS people", () => {
    expect(homeSource).toContain('from "next/image"');
    expect(homeSource).toContain("/assets/sitewide-ui/home-boy.png");
    expect(homeSource).toContain("/assets/sitewide-ui/home-girl.png");
    expect(homeSource).toContain("/assets/sitewide-ui/home-decor-left.png");
    expect(homeSource).toContain("/assets/sitewide-ui/home-decor-right.png");
    expect(homeSource).toContain("/assets/sitewide-ui/home-shield-check.png");
    expect(homeSource).not.toContain("dplus-person");
    expect(homeSource).not.toContain("home-title-decor");
  });

  it("uses the approved local brand mark and keeps all interactive home copy as DOM text", () => {
    expect(layoutSource).toContain('from "next/image"');
    expect(layoutSource).toContain("/assets/sitewide-ui/brand-mark.png");
    expect(homeSource).toContain("发布找老师需求");
    expect(homeSource).toContain("发布老师信息");
    expect(homeSource).toContain("我要找家教");
    expect(homeSource).toContain("我要做家教");
    expect(homeSource).toContain("站内沟通");
    expect(homeSource).toContain("联系方式仅在双方确认后交换");
    expect(globalCss).toContain(".home-approved-person");
    expect(globalCss).toContain(".home-approved-decor");
  });

  it("uses source-sized section slices only at the approved desktop viewport while keeping DOM hit areas", () => {
    expect(globalCss).toContain(".home-native-static-reference");
    expect(globalCss).toContain("home-static-hero.png");
    expect(globalCss).toContain("home-static-entry-parent.png");
    expect(globalCss).toContain("home-static-entry-tutor.png");
    expect(globalCss).toContain("home-static-link-demand.png");
    expect(globalCss).toContain("home-static-link-tutors.png");
    expect(globalCss).toContain("home-static-link-feedback.png");
    expect(globalCss).toContain("home-static-link-service.png");
    expect(globalCss).toContain("home-static-principles.png");
    expect(homeSource).toContain("home-native-static-reference");
  });
});
