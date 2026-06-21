import { describe, expect, it } from "vitest";

import {
  readTutorProfiles,
  saveTutorProfile
} from "@/features/tutor-profiles/tutor-profile-storage";
import { createMemoryStorage } from "@/lib/memory-storage";

const input = {
  gender: "男",
  school: "广东医科大学",
  major: "临床医学",
  subjects: ["生物"],
  grades: ["高中"],
  timeSlots: ["周日晚上"],
  feeRanges: [
    {
      grade: "高中",
      subject: "生物",
      min: "100",
      max: "150"
    }
  ],
  abilityDescription: "生物基础扎实，可帮助梳理知识框架。",
  proofImages: []
};

describe("tutor profile storage", () => {
  it("saves tutor profiles under the current test account", () => {
    const storage = createMemoryStorage();

    const saved = saveTutorProfile({
      input,
      ownerPhone: "13800138000",
      storage
    });

    expect(saved.ok).toBe(true);
    expect(readTutorProfiles({ ownerPhone: "13800138000", storage })).toHaveLength(1);
    expect(readTutorProfiles({ ownerPhone: "13800138000", storage })[0]).toMatchObject({
      ownerPhone: "13800138000",
      school: "广东医科大学",
      feeRanges: [{ grade: "高中", subject: "生物", min: 100, max: 150 }],
      status: "published"
    });
  });

  it("keeps tutor profiles isolated by test account phone", () => {
    const storage = createMemoryStorage();

    saveTutorProfile({ input, ownerPhone: "13800138000", storage });
    saveTutorProfile({
      input: { ...input, school: "东莞理工学院" },
      ownerPhone: "13900139000",
      storage
    });

    expect(readTutorProfiles({ ownerPhone: "13800138000", storage })[0].school).toBe(
      "广东医科大学"
    );
    expect(readTutorProfiles({ ownerPhone: "13900139000", storage })[0].school).toBe(
      "东莞理工学院"
    );
  });
});
