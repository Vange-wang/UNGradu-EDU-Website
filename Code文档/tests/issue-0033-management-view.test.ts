import { describe, expect, it } from "vitest";

import {
  filterParentNeedsForManagementView,
  getParentNeedRecoveryState
} from "@/features/parent-needs/parent-need-management";
import {
  filterTutorProfilesForManagementView,
  getTutorProfileRecoveryState
} from "@/features/tutor-profiles/tutor-profile-management";

const records = [
  { id: "active", managementState: "managed", status: "published" },
  { id: "deleted", managementState: "managed", status: "deleted" },
  { id: "legacy", managementState: "legacy-readonly", status: "published" }
] as const;

describe("ISSUE-0033 management view state", () => {
  it("defaults to active records and exposes deleted and legacy views explicitly", () => {
    expect(filterParentNeedsForManagementView(records, "active").map(({ id }) => id))
      .toEqual(["active"]);
    expect(filterParentNeedsForManagementView(records, "deleted").map(({ id }) => id))
      .toEqual(["deleted"]);
    expect(filterParentNeedsForManagementView(records, "legacy").map(({ id }) => id))
      .toEqual(["legacy"]);
    expect(filterTutorProfilesForManagementView(records, "active").map(({ id }) => id))
      .toEqual(["active"]);
    expect(filterTutorProfilesForManagementView(records, "deleted").map(({ id }) => id))
      .toEqual(["deleted"]);
    expect(filterTutorProfilesForManagementView(records, "legacy").map(({ id }) => id))
      .toEqual(["legacy"]);
  });

  it("marks the exact 48-hour boundary expired and withholds recovery", () => {
    const deletedAt = "2026-08-01T00:00:00.000Z";

    expect(getParentNeedRecoveryState(deletedAt, "2026-08-02T23:59:59.999Z"))
      .toMatchObject({ canRestore: true, deadline: "2026-08-03T00:00:00.000Z" });
    expect(getParentNeedRecoveryState(deletedAt, "2026-08-03T00:00:00.000Z"))
      .toMatchObject({ canRestore: false, deadline: "2026-08-03T00:00:00.000Z" });
    expect(getTutorProfileRecoveryState(deletedAt, "2026-08-03T00:00:00.000Z"))
      .toMatchObject({ canRestore: false, deadline: "2026-08-03T00:00:00.000Z" });
  });
});
