export type ParentNeedInput = {
  teacherGenderPreference: string;
  subjects: string[];
  grade: string;
  budgetMin: string;
  budgetMax: string;
  timeSlots: string[];
  region: {
    province: string;
    city: string;
    district: string;
  };
  community: string;
  childIntro: string;
};

export type ParentNeed = Omit<ParentNeedInput, "budgetMin" | "budgetMax"> & {
  budgetMin: number;
  budgetMax: number;
};

type ParentNeedErrors = {
  teacherGenderPreference?: string;
  subjects?: string;
  grade?: string;
  budget?: string;
  timeSlots?: string;
  region?: string;
  community?: string;
  childIntro?: string;
};

export type ParentNeedValidation =
  | {
      ok: true;
      value: ParentNeed;
      errors: ParentNeedErrors;
    }
  | {
      ok: false;
      value: null;
      errors: ParentNeedErrors;
    };

const MAINLAND_PHONE_PATTERN = /1[3-9]\d{9}/;
const WECHAT_HINT_PATTERN = /微信|vx|wechat|weixin/i;
const DOOR_NUMBER_PATTERN = /(\d+\s*(栋|幢|座|单元|楼|层|室|房|号))|门牌/;

function trimList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function toPositiveNumber(value: string) {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function validateParentNeedInput(
  input: ParentNeedInput
): ParentNeedValidation {
  const teacherGenderPreference = input.teacherGenderPreference.trim();
  const subjects = trimList(input.subjects);
  const grade = input.grade.trim();
  const budgetMin = toPositiveNumber(input.budgetMin);
  const budgetMax = toPositiveNumber(input.budgetMax);
  const timeSlots = trimList(input.timeSlots);
  const region = {
    province: input.region.province.trim(),
    city: input.region.city.trim(),
    district: input.region.district.trim()
  };
  const community = input.community.trim();
  const childIntro = input.childIntro.trim();
  const errors: ParentNeedErrors = {};

  if (!teacherGenderPreference) {
    errors.teacherGenderPreference = "请选择希望老师性别";
  }

  if (subjects.length === 0) {
    errors.subjects = "请选择所需科目";
  }

  if (!grade) {
    errors.grade = "请选择学段/年级";
  }

  if (budgetMin === null || budgetMax === null) {
    errors.budget = "请填写有效的预算区间";
  } else if (budgetMin > budgetMax) {
    errors.budget = "预算区间最低值不能高于最高值";
  }

  if (timeSlots.length === 0) {
    errors.timeSlots = "请选择可上课时间段";
  }

  if (!region.province || !region.city || !region.district) {
    errors.region = "请选择完整地址层级";
  }

  if (!community) {
    errors.community = "请填写小区或村";
  } else if (DOOR_NUMBER_PATTERN.test(community)) {
    errors.community = "具体位置最多填写到小区或村，不填写门牌号";
  }

  if (childIntro.length > 100) {
    errors.childIntro = "孩子简介最多 100 字";
  } else if (
    MAINLAND_PHONE_PATTERN.test(childIntro) ||
    WECHAT_HINT_PATTERN.test(childIntro)
  ) {
    errors.childIntro = "孩子简介不得包含手机号或微信号";
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
      teacherGenderPreference,
      subjects,
      grade,
      budgetMin: budgetMin ?? 0,
      budgetMax: budgetMax ?? 0,
      timeSlots,
      region,
      community,
      childIntro
    },
    errors: {}
  };
}
