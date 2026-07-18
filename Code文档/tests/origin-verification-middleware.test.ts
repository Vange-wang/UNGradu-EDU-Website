import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const middlewarePath = join(here, "..", "middleware.ts");

type MiddlewareModule = {
  middleware(request: NextRequest): Response | Promise<Response>;
};

async function loadMiddleware() {
  expect(existsSync(middlewarePath)).toBe(true);
  if (!existsSync(middlewarePath)) {
    return null;
  }

  return (await import(pathToFileURL(middlewarePath).href)) as MiddlewareModule;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("origin verification middleware", () => {
  it("logs a missing header in observe mode without rejecting the request", async () => {
    vi.stubEnv("ORIGIN_VERIFY_MODE", "observe");
    vi.stubEnv("ORIGIN_VERIFY_SECRET", "expected-test-secret");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const middlewareModule = await loadMiddleware();
    if (!middlewareModule) return;

    const response = await middlewareModule.middleware(
      new NextRequest("https://origin.example.com/feedback")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(warn).toHaveBeenCalledTimes(1);
    const log = String(warn.mock.calls[0][0]);
    expect(log).toContain('"mode":"observe"');
    expect(log).toContain('"status":"missing"');
    expect(log).not.toContain("expected-test-secret");
  });

  it("returns 403 for an invalid header only after enforce mode is enabled", async () => {
    vi.stubEnv("ORIGIN_VERIFY_MODE", "enforce");
    vi.stubEnv("ORIGIN_VERIFY_SECRET", "expected-test-secret");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const middlewareModule = await loadMiddleware();
    if (!middlewareModule) return;

    const response = await middlewareModule.middleware(
      new NextRequest("https://origin.example.com/api/feedback", {
        headers: { "x-ungrade-origin-verify": "wrong-test-secret" }
      })
    );

    expect(response.status).toBe(403);
    expect(await response.text()).toBe("Forbidden.");
    expect(response.headers.get("x-ungrade-origin-verify")).toBeNull();
  });
});
