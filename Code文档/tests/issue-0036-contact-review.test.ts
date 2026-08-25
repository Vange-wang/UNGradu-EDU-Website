import { describe, expect, it } from "vitest";

import { reviewContactContent } from "../server/security/contact-content-review";

describe("ISSUE-0036 deterministic contact review", () => {
  it("keeps clean approved-field content non-public while recording only safe audit metadata", () => {
    const text = "希望周末巩固数学基础。";
    const result = reviewContactContent({
      entityId: "need-synthetic-a",
      entityType: "parent_need",
      field: "childIntro",
      ownerId: "owner-synthetic-a",
      text,
      version: 1
    });

    expect(result).toMatchObject({
      classification: "allow_candidate",
      state: "pending_review",
      audit: {
        contentHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        entityId: "need-synthetic-a",
        entityType: "parent_need",
        field: "childIntro",
        ownerId: "owner-synthetic-a",
        reviewKey: expect.stringMatching(/^[a-f0-9]{64}$/),
        ruleVersion: "issue-0036-deterministic-v1",
        version: 1
      }
    });
    expect(JSON.stringify(result)).not.toContain(text);
  });

  it("maps a normalized full-width phone signal back to the original Unicode range", () => {
    const text = "请联系１３８００１３８０００安排课程";
    const result = reviewContactContent({
      entityId: "profile-synthetic-a",
      entityType: "tutor_profile",
      field: "abilityDescription",
      ownerId: "owner-synthetic-b",
      text,
      version: 2
    });

    expect(result).toMatchObject({
      classification: "contact_confirmed",
      state: "needs_manual_review",
      signals: [
        {
          kind: "phone",
          originalRange: { start: 3, end: 14 }
        }
      ]
    });
    expect(JSON.stringify(result)).not.toContain("１３８００１３８０００");
    expect(JSON.stringify(result)).not.toContain("13800138000");
  });

  it("routes an obfuscated contact handle signal to manual review without exposing the handle", () => {
    const text = "擅长基础巩固，可通过微 信 tutor_help 沟通";
    const result = reviewContactContent({
      entityId: "profile-synthetic-b",
      entityType: "tutor_profile",
      field: "abilityDescription",
      ownerId: "owner-synthetic-b",
      text,
      version: 1
    });

    expect(result).toMatchObject({
      classification: "contact_likely",
      state: "needs_manual_review",
      signals: [{ kind: "contact_handle" }]
    });
    expect(JSON.stringify(result)).not.toContain("tutor_help");
  });

  it("fails closed on an ambiguous long numeric sequence", () => {
    const result = reviewContactContent({
      entityId: "need-synthetic-b",
      entityType: "parent_need",
      field: "childIntro",
      ownerId: "owner-synthetic-a",
      text: "课程备注编号 12345678，需进一步核对。",
      version: 1
    });

    expect(result).toMatchObject({
      classification: "ambiguous",
      state: "needs_manual_review",
      signals: [{ kind: "numeric_sequence" }]
    });
  });

  it.each([
    ["ten digits", "2234567890"],
    ["eleven digits", "22345678901"],
    ["twelve digits", "223456789012"],
    ["a longer continuous value", "22345678901234567890"],
    ["a longer separated value", "22-34-56-78-90-12-34-56"]
  ])("routes %s to manual review instead of allowing it", (_label, numericValue) => {
    const result = reviewContactContent({
      entityId: "need-synthetic-boundary",
      entityType: "parent_need",
      field: "childIntro",
      ownerId: "owner-synthetic-a",
      text: `课程备注编号 ${numericValue}，需进一步核对。`,
      version: 1
    });

    expect(result).toMatchObject({
      classification: "ambiguous",
      state: "needs_manual_review",
      signals: [{ kind: "numeric_sequence" }]
    });
    expect(JSON.stringify(result)).not.toContain(numericValue);
  });

  it("returns an editable draft for empty approved-field input", () => {
    const result = reviewContactContent({
      entityId: "need-synthetic-c",
      entityType: "parent_need",
      field: "childIntro",
      ownerId: "owner-synthetic-a",
      text: "   ",
      version: 1
    });

    expect(result).toMatchObject({
      classification: "input_error",
      state: "draft",
      signals: []
    });
  });

  it("fails closed when a caller asks to review an unapproved field", () => {
    const field = "biography-unknown";
    const result = reviewContactContent({
      entityId: "profile-synthetic-c",
      entityType: "tutor_profile",
      field,
      ownerId: "owner-synthetic-b",
      text: "普通合成文本",
      version: 1
    });

    expect(result).toMatchObject({
      classification: "policy_error",
      state: "needs_manual_review",
      signals: [],
      audit: { field: "unsupported" }
    });
    expect(JSON.stringify(result)).not.toContain(field);
  });

  it("fails closed when Unicode normalization cannot produce a safe offset map", () => {
    const result = reviewContactContent({
      entityId: "need-synthetic-d",
      entityType: "parent_need",
      field: "childIntro",
      ownerId: "owner-synthetic-a",
      text: "异常\ud800内容",
      version: 1
    });

    expect(result).toMatchObject({
      classification: "normalization_failure",
      state: "needs_manual_review",
      signals: []
    });
  });

  it.each([
    ["an empty owner", { ownerId: "" }],
    ["a whitespace-only owner", { ownerId: "   " }],
    ["an empty entity", { entityId: "" }],
    ["a whitespace-only entity", { entityId: "   " }],
    ["a negative version", { version: -1 }],
    ["a zero version", { version: 0 }],
    ["a fractional version", { version: 1.5 }],
    ["a non-finite version", { version: Number.NaN }]
  ])("fails closed without a trusted review key for %s", (_label, override) => {
    const result = reviewContactContent({
      entityId: "need-synthetic-metadata",
      entityType: "parent_need",
      field: "childIntro",
      ownerId: "owner-synthetic-metadata",
      text: "希望周末巩固数学基础。",
      version: 1,
      ...override
    });

    expect(result).toMatchObject({
      classification: "policy_error",
      state: "needs_manual_review",
      signals: [],
      audit: { reviewKey: null }
    });
  });

  it("isolates identical content when owner, entity, or version changes independently", () => {
    const common = {
      entityType: "parent_need" as const,
      field: "childIntro",
      text: "希望周末巩固数学基础。",
      version: 1
    };
    const baseline = reviewContactContent({
      ...common,
      entityId: "need-synthetic-e",
      ownerId: "owner-synthetic-a"
    });
    const ownerChanged = reviewContactContent({
      ...common,
      entityId: "need-synthetic-e",
      ownerId: "owner-synthetic-b"
    });
    const entityChanged = reviewContactContent({
      ...common,
      entityId: "need-synthetic-f",
      ownerId: "owner-synthetic-a"
    });
    const versionChanged = reviewContactContent({
      ...common,
      entityId: "need-synthetic-e",
      ownerId: "owner-synthetic-a",
      version: 2
    });

    expect(new Set([
      baseline.audit.reviewKey,
      ownerChanged.audit.reviewKey,
      entityChanged.audit.reviewKey,
      versionChanged.audit.reviewKey
    ]).size).toBe(4);
    expect(ownerChanged.audit.contentHash).toBe(baseline.audit.contentHash);
    expect(entityChanged.audit.contentHash).toBe(baseline.audit.contentHash);
    expect(versionChanged.audit.contentHash).toBe(baseline.audit.contentHash);
  });
});
