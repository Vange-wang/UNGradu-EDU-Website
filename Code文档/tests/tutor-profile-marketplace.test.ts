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

  it("uses an opaque detail id without the owner phone", () => {
    const storage = createMemoryStorage();
    const ownerPhone = "13800138000";
    const saved = saveTutorProfile({
      input: baseInput,
      ownerPhone,
      storage
    });

    if (!saved.ok) {
      throw new Error("expected valid tutor profile");
    }

    expect(saved.value.id).not.toContain(ownerPhone);
    expect(`/tutor-profiles/${saved.value.id}`).not.toContain(ownerPhone);
  });

  it("reads M2 legacy local tutor profiles that do not have an owners index", () => {
    const storage = createMemoryStorage();
    const ownerPhone = "13800138000";

    storage.setItem(
      `ungradu.tutorProfiles.${ownerPhone}`,
      JSON.stringify([
        {
          ...baseInput,
          id: `${ownerPhone}-legacy-id`,
          ownerPhone,
          status: "published",
          feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
          createdAt: new Date().toISOString()
        }
      ])
    );

    const profiles = readAllTutorProfiles({ storage });

    expect(profiles).toHaveLength(1);
    expect(profiles[0].ownerPhone).toBe(ownerPhone);
    expect(profiles[0].id).not.toContain(ownerPhone);
    expect(`/tutor-profiles/${profiles[0].id}`).not.toContain(ownerPhone);
  });

  it("keeps the migrated tutor profile id stable after reading legacy local data", () => {
    const storage = createMemoryStorage();
    const ownerPhone = "13800138000";

    storage.setItem(
      `ungradu.tutorProfiles.${ownerPhone}`,
      JSON.stringify([
        {
          ...baseInput,
          id: `${ownerPhone}-legacy-id`,
          ownerPhone,
          status: "published",
          feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
          createdAt: new Date().toISOString()
        }
      ])
    );

    const firstRead = readAllTutorProfiles({ storage });
    const secondRead = readAllTutorProfiles({ storage });

    expect(firstRead).toHaveLength(1);
    expect(secondRead).toHaveLength(1);
    expect(secondRead[0].id).toBe(firstRead[0].id);
  });
});
