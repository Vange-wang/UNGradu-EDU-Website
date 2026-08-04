export type TutorProfileManagementView = "active" | "deleted" | "legacy";

type ManagedRecord = {
  managementState: "legacy-readonly" | "managed";
  status: "deleted" | "published";
};

export function filterTutorProfilesForManagementView<T extends ManagedRecord>(
  records: readonly T[],
  view: TutorProfileManagementView
) {
  return records.filter((record) => {
    if (view === "legacy") return record.managementState === "legacy-readonly";
    if (record.managementState !== "managed") return false;
    return view === "deleted" ? record.status === "deleted" : record.status === "published";
  });
}

export function getTutorProfileRecoveryState(
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
