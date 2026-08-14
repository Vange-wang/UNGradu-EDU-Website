import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchWithCsrf, parseApiResponse } from "@/features/api/api-client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("shared API client response parser", () => {
  it("sends only the browser public Origin when requesting a CSRF proof", async () => {
    vi.stubGlobal("window", { location: { origin: "https://ungraduedu.eu.cc" } });
    const calls: Array<{ headers: Headers; url: string }> = [];
    const fetcher: typeof fetch = async (input, init) => {
      calls.push({ headers: new Headers(init?.headers), url: input.toString() });
      if (input.toString().startsWith("/api/auth/csrf")) {
        return Response.json({
          errors: {},
          ok: true,
          value: { proof: "synthetic-proof" }
        });
      }
      return Response.json({ errors: {}, ok: true, value: null });
    };

    await fetchWithCsrf(fetcher, "/api/feedback", { method: "POST" });

    expect(calls[0].headers.get("x-ungrade-csrf-origin")).toBe(
      "https://ungraduedu.eu.cc"
    );
    expect(calls[0].headers.has("csrf-secret")).toBe(false);
  });

  it("fails closed with JSON and preserves correlation when the CSRF proof response is malformed", async () => {
    let businessWriteCalls = 0;
    const fetcher: typeof fetch = async (input) => {
      if (input.toString().startsWith("/api/auth/csrf")) {
        return Response.json({ errors: {}, ok: true, value: {} }, {
          headers: { "x-correlation-id": "csrf-correlation" }
        });
      }

      businessWriteCalls += 1;
      return Response.json({ errors: {}, ok: true, value: null });
    };

    const response = await fetchWithCsrf(fetcher, "/api/feedback", {
      body: "{}",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      method: "POST"
    });

    expect(businessWriteCalls).toBe(0);
    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("x-correlation-id")).toBe("csrf-correlation");
    await expect(parseApiResponse(response)).resolves.toMatchObject({
      errors: { request: "服务暂时不可用，请稍后重试。" },
      ok: false,
      value: null
    });
  });

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
