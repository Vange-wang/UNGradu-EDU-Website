import { describe, expect, it } from "vitest";

import { getContactReviewOwnerPresentation } from "@/features/contact-review/contact-review-owner-ui";
import { filterParentNeedsForManagementView } from "@/features/parent-needs/parent-need-management";
import { filterTutorProfilesForManagementView } from "@/features/tutor-profiles/tutor-profile-management";

describe("ISSUE-0036 owner review UI", () => {
  it.each([
    ["pending_review", "待审核", "已提交审核，审核完成前不会公开", false, false],
    ["needs_manual_review", "需要人工审核", "需要人工审核，处理完成前不会公开", false, false],
    ["appeal_pending", "申诉处理中", "申诉已提交，等待复核", false, false],
    ["rejected", "审核未通过", "审核未通过，可申诉或编辑后重新提交", true, true],
    ["published", "已批准", "审核已通过；公开端仅展示批准快照，联系方式仍默认隐藏", false, true]
  ] as const)("renders %s without implying automatic publication", (
    reviewStatus,
    label,
    message,
    canAppeal,
    canEdit
  ) => {
    expect(getContactReviewOwnerPresentation({
      canAppeal,
      canEdit,
      publicVisibility: reviewStatus === "published" ? "published" : "hidden",
      reviewStatus
    })).toEqual({ canAppeal, canEdit, label, message });
  });

  it("keeps deleted content hidden and requires review after restore", () => {
    expect(getContactReviewOwnerPresentation({
      canAppeal: false,
      canEdit: false,
      publicVisibility: "deleted",
      reviewStatus: "published"
    })).toEqual({
      canAppeal: false,
      canEdit: false,
      label: "已删除",
      message: "已删除，恢复后需要重新审核"
    });
  });

  it("keeps pending and rejected managed records visible in the existing active management view", () => {
    const records = [
      { id: "published", managementState: "managed", reviewStatus: "published", status: "published" },
      { id: "pending", managementState: "managed", reviewStatus: "pending_review", status: "pending_review" },
      { id: "rejected", managementState: "managed", reviewStatus: "rejected", status: "pending_review" },
      { id: "deleted", managementState: "managed", reviewStatus: "published", status: "deleted" }
    ] as const;

    for (const filter of [filterParentNeedsForManagementView, filterTutorProfilesForManagementView]) {
      expect(filter(records, "active").map(({ id }) => id)).toEqual(["published", "pending", "rejected"]);
      expect(filter(records, "deleted").map(({ id }) => id)).toEqual(["deleted"]);
    }
  });
});
