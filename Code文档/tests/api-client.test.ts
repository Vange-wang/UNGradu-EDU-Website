import { describe, expect, it } from "vitest";

import { parseApiResponse } from "@/features/api/api-client";

describe("shared API client response parser", () => {
  it("returns a readable request error when the response is not JSON", async () => {
    const response = new Response("<html>Bad gateway</html>", {
      headers: { "content-type": "text/html" },
      status: 502
    });

    await expect(parseApiResponse(response)).resolves.toEqual({
      ok: false,
      value: null,
      errors: {
        request: "服务暂时不可用，请稍后重试。"
      }
    });
  });

  it("returns a readable request error for non-2xx JSON responses without crashing pages", async () => {
    const response = Response.json(
      { ok: false, value: null, errors: { request: "upstream failed" } },
      { status: 500 }
    );

    await expect(parseApiResponse(response)).resolves.toEqual({
      ok: false,
      value: null,
      errors: {
        request: "upstream failed"
      }
    });
  });
});
