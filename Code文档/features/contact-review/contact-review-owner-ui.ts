export type ContactReviewDisplayStatus =
  | "appeal_pending"
  | "needs_manual_review"
  | "pending_review"
  | "published"
  | "rejected";

export type ContactReviewPublicVisibility = "deleted" | "hidden" | "published";

export function getContactReviewOwnerPresentation({
  canAppeal,
  canEdit,
  publicVisibility,
  reviewStatus
}: {
  canAppeal: boolean;
  canEdit: boolean;
  publicVisibility: ContactReviewPublicVisibility;
  reviewStatus: ContactReviewDisplayStatus;
}) {
  if (publicVisibility === "deleted") {
    return { canAppeal: false, canEdit: false, label: "已删除", message: "已删除，恢复后需要重新审核" };
  }
  if (reviewStatus === "pending_review") {
    return { canAppeal: false, canEdit: false, label: "待审核", message: "已提交审核，审核完成前不会公开" };
  }
  if (reviewStatus === "needs_manual_review") {
    return { canAppeal: false, canEdit: false, label: "需要人工审核", message: "需要人工审核，处理完成前不会公开" };
  }
  if (reviewStatus === "appeal_pending") {
    return { canAppeal: false, canEdit: false, label: "申诉处理中", message: "申诉已提交，等待复核" };
  }
  if (reviewStatus === "rejected") {
    return {
      canAppeal,
      canEdit,
      label: "审核未通过",
      message: canAppeal ? "审核未通过，可申诉或编辑后重新提交" : "审核未通过，可编辑后重新提交"
    };
  }
  return {
    canAppeal: false,
    canEdit,
    label: "已批准",
    message: "审核已通过；公开端仅展示批准快照，联系方式仍默认隐藏"
  };
}
