export type TutorProfileInput = {
  gender: string;
  school: string;
  major: string;
  subjects: string[];
  grades: string[];
  timeSlots: string[];
  feeRanges: Array<{
    grade: string;
    subject: string;
    min: string;
    max: string;
  }>;
  abilityDescription: string;
  proofImages: Array<{
    name: string;
    type: string;
    size: number;
  }>;
};

export type TutorProfile = Omit<TutorProfileInput, "feeRanges"> & {
  feeRanges: Array<{
    grade: string;
    subject: string;
    min: number;
    max: number;
  }>;
};

type TutorProfileErrors = {
  gender?: string;
  school?: string;
  major?: string;
  subjects?: string;
  grades?: string;
  timeSlots?: string;
  feeRanges?: string;
  abilityDescription?: string;
  proofImages?: string;
};

export type TutorProfileValidation =
  | {
      ok: true;
      value: TutorProfile;
      errors: TutorProfileErrors;
    }
  | {
      ok: false;
      value: null;
      errors: TutorProfileErrors;
    };

const MAINLAND_PHONE_PATTERN = /1[3-9]\d{9}/;
const WECHAT_HINT_PATTERN = /微信|vx|wechat|weixin/i;
const ALLOWED_PROOF_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
]);
const MAX_PROOF_IMAGE_SIZE = 5 * 1024 * 1024;

function trimList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function toPositiveNumber(value: string) {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function validateTutorProfileInput(
  input: TutorProfileInput
): TutorProfileValidation {
  const gender = input.gender.trim();
  const school = input.school.trim();
  const major = input.major.trim();
  const subjects = trimList(input.subjects);
  const grades = trimList(input.grades);
  const timeSlots = trimList(input.timeSlots);
  const abilityDescription = input.abilityDescription.trim();
  const errors: TutorProfileErrors = {};

  if (!gender) {
    errors.gender = "请选择性别";
  }

  if (!school) {
    errors.school = "请填写学校";
  }

  if (!major) {
    errors.major = "请填写专业";
  }

  if (subjects.length === 0) {
    errors.subjects = "请选择可教科目";
  }

  if (grades.length === 0) {
    errors.grades = "请选择可教学段";
  }

  if (timeSlots.length === 0) {
    errors.timeSlots = "请选择可上课时间段";
  }

  const feeRanges = input.feeRanges.map((range) => ({
    grade: range.grade.trim(),
    subject: range.subject.trim(),
    min: toPositiveNumber(range.min),
    max: toPositiveNumber(range.max)
  }));

  if (feeRanges.length === 0) {
    errors.feeRanges = "请至少填写一个课时费区间";
  } else if (
    feeRanges.some(
      (range) => !range.grade || !range.subject || range.min === null || range.max === null
    )
  ) {
    errors.feeRanges = "请填写完整有效的课时费区间";
  } else if (
    feeRanges.some(
      (range) => range.min !== null && range.max !== null && range.min > range.max
    )
  ) {
    errors.feeRanges = "课时费区间最低值不能高于最高值";
  }

  if (!abilityDescription) {
    errors.abilityDescription = "请填写能力说明";
  } else if (
    MAINLAND_PHONE_PATTERN.test(abilityDescription) ||
    WECHAT_HINT_PATTERN.test(abilityDescription)
  ) {
    errors.abilityDescription = "能力说明不得包含手机号或微信号";
  }

  const proofImages = input.proofImages.map((image) => ({
    name: image.name.trim(),
    type: image.type.trim(),
    size: image.size
  }));

  if (
    proofImages.some((image) => !ALLOWED_PROOF_IMAGE_TYPES.has(image.type.toLowerCase()))
  ) {
    errors.proofImages = "证明图片仅支持 JPG、PNG 或 WebP";
  } else if (proofImages.some((image) => image.size > MAX_PROOF_IMAGE_SIZE)) {
    errors.proofImages = "单张证明图片不能超过 5MB";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      value: null,
      errors
    };
  }

  return {
    ok: true,
    value: {
      gender,
      school,
      major,
      subjects,
      grades,
      timeSlots,
      feeRanges: feeRanges.map((range) => ({
        grade: range.grade,
        subject: range.subject,
        min: range.min ?? 0,
        max: range.max ?? 0
      })),
      abilityDescription,
      proofImages
    },
    errors: {}
  };
}
