import { describe, expect, it } from "vitest";

import {
  readContactProfileFromApi,
  saveContactProfileToApi
} from "@/features/profile/contact-profile-api-client";

describe("contact profile API client", () => {
  it("sends the current test user phone as a temporary identity header", async () => {
    const calls: Array<{ body: string | null; headers: Headers; method: string }> = [];
    const fetcher: typeof fetch = async (_url, init) => {
      calls.push({
        body: init?.body?.toString() ?? null,
        headers: new Headers(init?.headers),
        method: init?.method ?? "GET"
      });

      return Response.json({
        ok: true,
        value: { phone: "13800138000", wechat: "parent_a" },
        errors: {}
      });
    };

    await saveContactProfileToApi({
      currentUserPhone: "13800138000",
      fetcher,
      input: { phone: "13800138000", wechat: "parent_a" }
    });
    await readContactProfileFromApi({
      currentUserPhone: "13800138000",
      fetcher
    });

    expect(calls).toEqual([
      {
        body: JSON.stringify({ phone: "13800138000", wechat: "parent_a" }),
        headers: expect.any(Headers),
        method: "PUT"
      },
      {
        body: null,
        headers: expect.any(Headers),
        method: "GET"
      }
    ]);
    expect(calls[0].headers.get("x-ungradu-test-user-phone")).toBeNull();
    expect(calls[1].headers.get("x-ungradu-test-user-phone")).toBeNull();
  });
});
