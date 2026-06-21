import { describe, expect, it } from "vitest";

import {
  findTutorProfileById,
  filterTutorProfiles,
  readAllTutorProfiles,
  saveTutorProfile
} from "@/features/tutor-profiles/tutor-profile-storage";
import { createMemoryStorage } from "@/lib/memory-storage";

const baseInput = {
  gender: "女",
  school: "东莞理工学院",
  major: "数学与应用数学",
  subjects: ["数学"],
  grades: ["初中"],
  timeSlots: ["周六下午"],
  feeRanges: [
    {
      grade: "初中",
      subject: "数学",
      min: "90",
      max: "130"
    }
  ],
  abilityDescription: "擅长拆题和基础巩固，有同伴辅导经验。",
  proofImages: []
};

describe("tutor profile marketplace", () => {
  it("reads published tutor profiles across test accounts", () => {
    const storage = createMemoryStorage();

    saveTutorProfile({ input: baseInput, ownerPhone: "13800138000", storage });
    saveTutorProfile({
      input: {
        ...baseInput,
        gender: "男",
        school: "广东医科大学",
        major: "临床医学",
        subjects: ["生物"],
        grades: ["高中"],
        feeRanges: [{ grade: "高中", subject: "生物", min: "110", max: "160" }],
        abilityDescription: "生物知识框架清晰，可带高中复习。"
      },
      ownerPhone: "13900139000",
      storage
    });

    const profiles = readAllTutorProfiles({ storage });

    expect(profiles).toHaveLength(2);
    expect(profiles.map((profile) => profile.ownerPhone).sort()).toEqual([
      "13800138000",
      "13900139000"
    ]);
  });

  it("filters tutor profiles by subject, grade, fee range, and gender", () => {
    const storage = createMemoryStorage();

    saveTutorProfile({ input: baseInput, ownerPhone: "13800138000", storage });
    saveTutorProfile({
      input: {
        ...baseInput,
        gender: "男",
        school: "广东医科大学",
        major: "临床医学",
        subjects: ["生物"],
        grades: ["高中"],
        feeRanges: [{ grade: "高中", subject: "生物", min: "110", max: "160" }],
        abilityDescription: "生物知识框架清晰，可带高中复习。"
      },
      ownerPhone: "13900139000",
      storage
    });

    const matched = filterTutorProfiles(readAllTutorProfiles({ storage }), {
      subject: "数学",
      grade: "初中",
      feeMin: "100",
      feeMax: "120",
      gender: "女"
    });

    expect(matched).toHaveLength(1);
    expect(matched[0].school).toBe("东莞理工学院");
    expect(matched[0].feeRanges[0]).toMatchObject({ min: 90, max: 130 });
  });

  it("finds a tutor profile detail by id without contact fields", () => {
    const storage = createMemoryStorage();
    const saved = saveTutorProfile({
      input: baseInput,
      ownerPhone: "13800138000",
      storage
    });

    if (!saved.ok) {
      throw new Error("expected valid tutor profile");
    }

    const detail = findTutorProfileById({
      id: saved.value.id,
      storage
    });

    expect(detail).toMatchObject({
      id: saved.value.id,
      school: "东莞理工学院",
      abilityDescription: "擅长拆题和基础巩固，有同伴辅导经验。"
    });
    expect(detail).not.toHaveProperty("phone");
    expect(detail).not.toHaveProperty("wechat");
  });
});
