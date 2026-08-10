import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildStructuredEvidence,
  createOutputClassifier,
  inspectDependencyClosure,
  scanEvidenceArtifact,
  summarizeStaticHtml,
  summarizeCsp
} from "../scripts/issue-0034-failure-isolation.mjs";

const baseProbe = {
  label: "candidate",
  pathname: "/tutor-profiles",
  status: 200,
  contentType: "text/html; charset=utf-8",
  cacheControl: "no-store, must-revalidate",
  csp: {
    directives: ["default-src", "script-src", "style-src"],
    hasNonce: true,
    unsafeInline: false,
    unsafeEval: true
  },
  dom: {
    htmlNonEmpty: true,
    targetPresent: true,
    inlineScriptCount: 4
  }
};

describe("ISSUE-0034 failure isolation structured evidence", () => {
  it("keeps CSP and process output inside the fixed allowlist", () => {
    const csp = summarizeCsp("default-src 'self'; script-src 'self' 'nonce-secret-value' 'unsafe-eval'; style-src 'self' 'nonce-style-value'");
    expect(csp).toEqual({
      directives: ["default-src", "script-src", "style-src"],
      hasNonce: true,
      unsafeInline: false,
      unsafeEval: true
    });

    const output = createOutputClassifier();
    output.push("authorization: Bear");
    output.push("er secret-value\nEvalError: blocked");
    expect(output.finish()).toEqual({ classes: ["csp-eval-blocked"], chunkCount: 2 });
  });

  it("rejects unknown fields before writing an evidence artifact", () => {
    expect(() => buildStructuredEvidence({
      schemaVersion: 2,
      kind: "issue-0034-s1-failure-isolation",
      generatedAt: "2026-08-10T00:00:00.000Z",
      head: "synthetic-head",
      branch: "synthetic-branch",
      candidateFiles: [],
      probes: [baseProbe],
      suiteRuns: [],
      baseline: { status: "ready" },
      unknown: "must-reject"
    })).toThrow(/unknown/i);
  });

  it("fails closed when a value contains a nonce, credential, or body-like data", () => {
    expect(() => scanEvidenceArtifact({ safe: true, csp: "'nonce-0123456789abcdef'" })).toThrow(/sensitive/i);
    expect(() => scanEvidenceArtifact({ safe: true, body: "synthetic child detail" })).toThrow(/sensitive/i);
    expect(() => scanEvidenceArtifact({ safe: true, csp: { nonceMatchesResponse: true } })).toThrow(/unknown/i);
    expect(scanEvidenceArtifact({ safe: true })).toEqual({
      ruleVersion: "2026-08-10-issue-0034-v2",
      result: "pass",
      checkedFields: 1
    });
  });

  it("uses the real tutor targets and self.__next_f in static HTML summaries", () => {
    const detail = summarizeStaticHtml(
      "/tutor-profiles/preview-tutor",
      '<main class="detail-hero"><script>self.__next_f.push([])</script></main>'
    );
    const listing = summarizeStaticHtml(
      "/tutor-profiles",
      '<main class="listing-card"><script>self.__next_f.push([])</script></main>'
    );
    expect(detail.targetPresent).toBe(true);
    expect(listing.targetPresent).toBe(true);
    expect(detail.inlineScriptCount).toBe(1);
    expect(listing.inlineScriptCount).toBe(1);
    expect(detail).not.toHaveProperty("nonceMatchCount");
    expect(detail).not.toHaveProperty("events");
  });

  it("records bounded machine-readable failure classification without raw output", () => {
    const output = createOutputClassifier("tests/navigation-trail-browser.test.ts");
    output.push(" × 真实共享 Header 访问轨迹返回 > monotonically consumes A to B 30000ms\n");
    output.push("   → 未进入发布家教需求。；state={...}\n");
    const result = output.finish();
    expect(result.failureDetails).toHaveLength(1);
    expect(result.failureDetails![0]).toMatchObject({
      suite: "tests/navigation-trail-browser.test.ts",
      testName: "monotonically consumes A to B",
      failureCategory: "navigation-timing",
      candidatePath: "/profile",
      selector: "shared-header-trail",
      assertionClass: "navigation-target",
      processPhase: "browser-fixture"
    });
    expect(result.failureDetails![0].testHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result).not.toHaveProperty("stdout");
    expect(result).not.toHaveProperty("stderr");
  });

  it("proves the baseline dependency closure has regular Next/Vitest entries and no reparse points", () => {
    const root = mkdtempSync(join(tmpdir(), "issue-0034-dependency-"));
    try {
      mkdirSync(join(root, "next", "dist", "bin"), { recursive: true });
      mkdirSync(join(root, "vitest"), { recursive: true });
      writeFileSync(join(root, "next", "dist", "bin", "next"), "synthetic");
      writeFileSync(join(root, "vitest", "vitest.mjs"), "synthetic");
      expect(inspectDependencyClosure(root)).toEqual({
        reparsePointCount: 0,
        pathEscape: false,
        nextEntryRegular: true,
        vitestEntryRegular: true
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
