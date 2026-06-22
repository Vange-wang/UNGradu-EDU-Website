import { describe, expect, it } from "vitest";

import {
  listMyTutorProfilesFromApi,
  listPublicTutorProfilesFromApi,
  readPublicTutorProfileFromApi,
  saveTutorProfileToApi
} from "@/features/tutor-profiles/tutor-profile-api-client";

const input = {
  gender: "女",
  school: "东莞理工学院",
  major: "数学与应用数学",
  subjects: ["数学"],
  grades: ["初中"],
  timeSlots: ["周六下午"],
  feeRanges: [{ grade: "初中", subject: "数学", min: "90", max: "130" }],
  abilityDescription: "擅长拆题和基础巩固，有同伴辅导经验。",
  proofImages: []
};

describe("tutor profile API client", () => {
  it("uses cookie-backed routes for private reads and writes", async () => {
    const calls: Array<{ body: string | null; headers: Headers; method: string; url: string }> = [];
    const fetcher: typeof fetch = async (url, init) => {
      calls.push({
        body: init?.body?.toString() ?? null,
        headers: new Headers(init?.headers),
        method: init?.method ?? "GET",
        url: url.toString()
      });

      return Response.json({ ok: true, value: [], errors: {} });
    };

    await listPublicTutorProfilesFromApi({
      fetcher,
      filters: { grade: "初中", subject: "数学" }
    });
    await readPublicTutorProfileFromApi({ fetcher, id: "profile-a" });
    await listMyTutorProfilesFromApi({
      currentUserPhone: "13900139000",
      fetcher
    });
    await saveTutorProfileToApi({
      currentUserPhone: "13900139000",
      fetcher,
      input
    });

    expect(calls[0].url).toBe("/api/tutor-profiles?grade=%E5%88%9D%E4%B8%AD&subject=%E6%95%B0%E5%AD%A6");
    expect(calls[0].headers.get("x-ungradu-test-user-phone")).toBeNull();
    expect(calls[1].url).toBe("/api/tutor-profiles/profile-a");
    expect(calls[2].url).toBe("/api/tutor-profiles?scope=mine");
    expect(calls[2].headers.get("x-ungradu-test-user-phone")).toBeNull();
    expect(calls[3].method).toBe("POST");
    expect(calls[3].body).toBe(JSON.stringify(input));
    expect(calls[3].headers.get("x-ungradu-test-user-phone")).toBeNull();
  });
});
