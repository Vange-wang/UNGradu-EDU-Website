export const PUBLIC_PARENT_NEED_FIELDS = [
  "budgetMax",
  "budgetMin",
  "createdAt",
  "grade",
  "id",
  "regionLabel",
  "status",
  "subjects",
  "teacherGenderPreference",
  "timeSlots",
  "childIntroSummary",
  "publicSafetyNote"
] as const;

export const PUBLIC_TUTOR_PROFILE_FIELDS = [
  "createdAt",
  "feeRanges",
  "gender",
  "grades",
  "id",
  "status",
  "subjects",
  "timeSlots",
  "schoolSummary",
  "majorSummary",
  "abilityDescriptionSummary",
  "publicSafetyNote"
] as const;

export const PUBLIC_INTERNAL_REVIEW_FIELDS = {
  parentNeed: ["community", "region", "childIntro"] as const,
  tutorProfile: ["major", "proofImages", "school", "abilityDescription"] as const
};

export function projectPublicFields(
  value: Record<string, unknown>,
  fields: readonly string[]
) {
  const projected: Record<string, unknown> = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(value, field)) {
      projected[field] = value[field];
    }
  }
  return projected;
}
