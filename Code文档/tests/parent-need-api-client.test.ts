import { describe, expect, it } from "vitest";

import {
  listMyParentNeedsFromApi,
  listPublicParentNeedsFromApi,
  readPublicParentNeedFromApi,
  saveParentNeedToApi
} from "@/features/parent-needs/parent-need-api-client";

const input = {
  teacherGenderPreference: "不限",
  subjects: ["数学"],
  grade: "初一",
  budgetMin: "80",
  budgetMax: "120",
  timeSlots: ["周六下午"],
  region: { province: "广东省", city: "东莞市", district: "松山湖" },
  community: "松山湖大学城",
  childIntro: "基础中等，需要巩固计算习惯。"
};

describe("parent need API client", () => {
  it("uses public routes for public reads and temporary identity for private reads and writes", async () => {
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

    await listPublicParentNeedsFromApi({
      fetcher,
      filters: { grade: "初一", subject: "数学" }
    });
    await readPublicParentNeedFromApi({ fetcher, id: "need-a" });
    await listMyParentNeedsFromApi({
      currentUserPhone: "13800138000",
      fetcher
    });
    await saveParentNeedToApi({
      currentUserPhone: "13800138000",
      fetcher,
      input
    });

    expect(calls[0].url).toBe("/api/parent-needs?grade=%E5%88%9D%E4%B8%80&subject=%E6%95%B0%E5%AD%A6");
    expect(calls[0].headers.get("x-ungradu-test-user-phone")).toBeNull();
    expect(calls[1].url).toBe("/api/parent-needs/need-a");
    expect(calls[2].url).toBe("/api/parent-needs?scope=mine");
    expect(calls[2].headers.get("x-ungradu-test-user-phone")).toBe("13800138000");
    expect(calls[3].method).toBe("POST");
    expect(calls[3].body).toBe(JSON.stringify(input));
    expect(calls[3].headers.get("x-ungradu-test-user-phone")).toBe("13800138000");
  });
});
