import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const compareScript = join(
  process.cwd(),
  "scripts",
  "compare-visual-screenshots.py"
);
const captureScript = join(
  process.cwd(),
  "scripts",
  "capture-sitewide-visual.mjs"
);

describe("sitewide visual fidelity tooling", () => {
  it("creates a reproducible overlay, diff, and numeric pixel report", () => {
    const directory = mkdtempSync(join(tmpdir(), "sitewide-visual-"));

    try {
      const reference = join(directory, "reference.png");
      const actual = join(directory, "actual.png");
      const output = join(directory, "comparison");

      execFileSync(
        "py",
        [
          "-3",
          "-c",
          [
            "from PIL import Image",
            `Image.new("RGB", (4, 3), (255, 255, 255)).save(r"${reference}")`,
            `Image.new("RGB", (4, 3), (255, 255, 255)).save(r"${actual}")`
          ].join(";")
        ],
        { stdio: "pipe" }
      );

      execFileSync(
        "py",
        [
          "-3",
          compareScript,
          "--reference",
          reference,
          "--actual",
          actual,
          "--output-prefix",
          output
        ],
        { stdio: "pipe" }
      );

      const report = JSON.parse(
        readFileSync(`${output}-metrics.json`, "utf8")
      ) as {
        changedPixelRatio: number;
        height: number;
        meanAbsoluteError: number;
        width: number;
      };

      expect(report).toMatchObject({
        changedPixelRatio: 0,
        height: 3,
        meanAbsoluteError: 0,
        width: 4
      });
      expect(readFileSync(`${output}-overlay-50.png`).length).toBeGreaterThan(0);
      expect(readFileSync(`${output}-diff.png`).length).toBeGreaterThan(0);
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("keeps viewport and full-page captures separate and records DPR geometry", () => {
    const source = readFileSync(captureScript, "utf8");

    expect(source).toContain("viewport.png");
    expect(source).toContain("fullpage.png");
    expect(source).toContain("devicePixelRatio");
    expect(source).toContain("documentElement.clientWidth");
    expect(source).toContain("documentElement.scrollWidth");
    expect(source).toContain("window.innerWidth");
    expect(source).toContain("deviceScaleFactor: 1");
    expect(source).toContain("Network.responseReceived");
    expect(source).toContain("networkRequestId");
    expect(source).toContain("networkEntries");
    expect(source).toContain("entryTutorCta");
    expect(source).toContain("backArrow");
    expect(source).toContain("customer-back-arrow-keyboard");
  });
});
