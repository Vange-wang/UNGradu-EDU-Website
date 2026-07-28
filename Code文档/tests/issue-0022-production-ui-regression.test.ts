import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const globalsCss = readFileSync(path.join(root, "app", "globals.css"), "utf8");
const nextConfig = readFileSync(path.join(root, "next.config.ts"), "utf8");
const homePage = readFileSync(path.join(root, "app", "page.tsx"), "utf8");
const captureScript = readFileSync(
  path.join(root, "scripts", "capture-sitewide-visual.mjs"),
  "utf8"
);
const workerVerificationScript = readFileSync(
  path.join(root, "scripts", "verify-issue-0022-worker-assets.mjs"),
  "utf8"
);

function ruleBodies(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [
    ...globalsCss.matchAll(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, "g"))
  ];
  expect(matches.length, `missing CSS rule for ${selector}`).toBeGreaterThan(0);
  return matches.map((match) => match[1]).join("\n");
}

describe("ISSUE-0022 production UI regression contracts", () => {
  it("serves bundled design assets directly instead of through the isolated-origin image optimizer", () => {
    expect(nextConfig).toMatch(
      /images:\s*\{\s*unoptimized:\s*true\s*\}/s
    );
  });

  it("caps approved desktop compositions without whole-page zoom or transform scaling", () => {
    expect(ruleBodies(".home-refresh-layout")).toMatch(/max-width:\s*1460px/);
    expect(ruleBodies(".home-refresh-layout")).toMatch(/margin-inline:\s*auto/);
    expect(ruleBodies(".sitewide-auth-shell")).toMatch(/max-width:\s*1410px/);
    expect(ruleBodies(".sitewide-auth-shell")).toMatch(/margin-inline:\s*auto/);
    expect(ruleBodies(".rules-refresh-page .rules-refresh-layout")).toMatch(
      /max-width:\s*1495px/
    );
    expect(ruleBodies(".rules-refresh-page .rules-refresh-layout")).toMatch(
      /margin-inline:\s*auto/
    );
    expect(globalsCss).not.toMatch(
      /\.(?:home-refresh-page|auth-page|rules-refresh-page|marketplace-refresh-page)[^{]*\{[^}]*(?:zoom\s*:|transform\s*:\s*scale\()/s
    );
  });

  it("uses the approved home hero raster for the desktop title while preserving the semantic heading", () => {
    expect(globalsCss).toMatch(
      /@media\s*\(min-width:\s*861px\)[^{]*\{[\s\S]*?\.home-native-static-reference\s+\.home-title-block::after\s*\{[^}]*home-static-hero\.png/s
    );
    expect(globalsCss).toMatch(
      /\.home-native-static-reference\s+\.home-title-block\s*>\s*\*\s*\{[^}]*opacity:\s*0/s
    );
    expect(homePage).toContain('<h1 id="home-title">大学生家教平台</h1>');
  });

  it("records visible image decode, CSS background readiness, and real viewport scale", () => {
    expect(captureScript).toContain("image.currentSrc || image.src");
    expect(captureScript).toContain("naturalWidth: image.naturalWidth");
    expect(captureScript).toContain("window.visualViewport");
    expect(captureScript).toContain('type === "Image"');
    expect(captureScript).toContain("background image failed:");
    expect(captureScript).toContain('getComputedStyle(element, "::after")');
  });

  it("keeps the production-like Worker asset probe secret ephemeral", () => {
    expect(workerVerificationScript).toContain("randomBytes(32)");
    expect(workerVerificationScript).toContain("ORIGIN_VERIFY_SECRET");
    expect(workerVerificationScript).toContain("directWithoutWorker");
    expect(workerVerificationScript).not.toContain(
      "console.log(originVerifySecret)"
    );
    expect(workerVerificationScript).not.toContain(
      "writeFile(originVerifySecret"
    );
  });
});
