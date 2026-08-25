import {
  getContactReviewOwnerPresentation,
  type ContactReviewDisplayStatus
} from "@/features/contact-review/contact-review-owner-ui";

export type ParentNeedManagementView = "active" | "deleted" | "legacy";
export type { ContactReviewDisplayStatus } from "@/features/contact-review/contact-review-owner-ui";

type ManagedRecord = {
  managementState: "legacy-readonly" | "managed";
  reviewStatus?: ContactReviewDisplayStatus;
  status: "deleted" | "pending_review" | "published";
};

export function filterParentNeedsForManagementView<T extends ManagedRecord>(
  records: readonly T[],
  view: ParentNeedManagementView
) {
  return records.filter((record) => {
    if (view === "legacy") return record.managementState === "legacy-readonly";
    if (record.managementState !== "managed") return false;
    return view === "deleted" ? record.status === "deleted" : record.status !== "deleted";
  });
}

export function describeContactReviewStatus(status: ContactReviewDisplayStatus | undefined) {
  return getContactReviewOwnerPresentation({
    canAppeal: false,
    canEdit: status === "published" || status === "rejected",
    publicVisibility: status === "published" ? "published" : "hidden",
    reviewStatus: status ?? "published"
  }).label;
}

export function getParentNeedRecoveryState(
  deletedAt: string | null,
  now = new Date().toISOString()
) {
  if (!deletedAt) return { canRestore: false, deadline: null };
  const deadline = new Date(new Date(deletedAt).getTime() + 48 * 60 * 60 * 1000)
    .toISOString();
  return {
    canRestore: new Date(now).getTime() < new Date(deadline).getTime(),
    deadline
  };
}
