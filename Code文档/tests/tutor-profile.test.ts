import { describe, expect, it } from "vitest";

import {
  type TutorProfileInput,
  validateTutorProfileInput
} from "@/features/tutor-profiles/tutor-profile";

const validTutorProfileInput: TutorProfileInput = {
  gender: "女",
  school: "东莞理工学院",
  major: "数学与应用数学",
  subjects: ["数学", "物理"],
  grades: ["初中", "高中"],
  timeSlots: ["周六下午", "周日晚上"],
  feeRanges: [
    {
      grade: "初中",
      subject: "数学",
      min: "90",
      max: "130"
    }
  ],
  abilityDescription: "高考数学成绩优秀，有同伴辅导经验，擅长拆解题型。",
  proofImages: [
    {
      name: "math-score.webp",
      type: "image/webp",
      size: 1024 * 1024
    }
  ]
};

describe("tutor profile validation", () => {
  it("accepts a complete tutor profile with optional proof images", () => {
    const result = validateTutorProfileInput(validTutorProfileInput);

    expect(result).toEqual({
      ok: true,
      value: {
        gender: "女",
        school: "东莞理工学院",
        major: "数学与应用数学",
        subjects: ["数学", "物理"],
        grades: ["初中", "高中"],
        timeSlots: ["周六下午", "周日晚上"],
        feeRanges: [
          {
            grade: "初中",
            subject: "数学",
            min: 90,
            max: 130
          }
        ],
        abilityDescription: "高考数学成绩优秀，有同伴辅导经验，擅长拆解题型。",
        proofImages: [
          {
            name: "math-score.webp",
            type: "image/webp",
            size: 1048576
          }
        ]
      },
      errors: {}
    });
  });

  it("allows proof images to be omitted", () => {
    const result = validateTutorProfileInput({
      ...validTutorProfileInput,
      proofImages: []
    });

    expect(result.ok).toBe(true);
  });

  it("rejects contact information in ability description", () => {
    const result = validateTutorProfileInput({
      ...validTutorProfileInput,
      abilityDescription: "可加微信 tutor_edu 或联系 13800138000"
    });

    expect(result.ok).toBe(false);
    expect(result.errors.abilityDescription).toBe("能力说明不得包含手机号或微信号");
  });

  it("rejects unreasonable fee ranges", () => {
    const result = validateTutorProfileInput({
      ...validTutorProfileInput,
      feeRanges: [
        {
          grade: "初中",
          subject: "数学",
          min: "150",
          max: "100"
        }
      ]
    });

    expect(result.ok).toBe(false);
    expect(result.errors.feeRanges).toBe("课时费区间最低值不能高于最高值");
  });

  it("rejects unsupported proof image types", () => {
    const result = validateTutorProfileInput({
      ...validTutorProfileInput,
      proofImages: [
        {
          name: "score.pdf",
          type: "application/pdf",
          size: 1000
        }
      ]
    });

    expect(result.ok).toBe(false);
    expect(result.errors.proofImages).toBe("证明图片仅支持 JPG、PNG 或 WebP");
  });
});
