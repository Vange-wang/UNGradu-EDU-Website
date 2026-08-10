import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";

const middlewarePath = join(dirname(fileURLToPath(import.meta.url)), "..", "middleware.ts");

type MiddlewareModule = {
  middleware(request: NextRequest): Response | Promise<Response>;
};

async function loadMiddleware() {
  expect(existsSync(middlewarePath)).toBe(true);
  return (await import(pathToFileURL(middlewarePath).href)) as MiddlewareModule;
}

afterEach(() => {
  for (const key of ["APP_ENV", "NODE_ENV", "ORIGIN_VERIFY_MODE", "ORIGIN_VERIFY_SECRET", "ALLOWED_ORIGINS", "CSRF_SECRET"]) {
    delete process.env[key];
  }
});

describe("ISSUE-0034 per-request CSP nonce boundary", () => {
  it("binds a unique response CSP nonce to the request override for each document", async () => {
    process.env.APP_ENV = "test";
    Object.assign(process.env, { NODE_ENV: "test" });
    process.env.ORIGIN_VERIFY_MODE = "off";
    const middleware = await loadMiddleware();

    const first = await middleware.middleware(new NextRequest("https://ungraduedu.eu.cc/parent-needs/new"));
    const second = await middleware.middleware(new NextRequest("https://ungraduedu.eu.cc/parent-needs/new"));
    const firstCsp = first.headers.get("content-security-policy") ?? "";
    const secondCsp = second.headers.get("content-security-policy") ?? "";

    expect(firstCsp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9_-]+'/);
    expect(secondCsp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9_-]+'/);
    expect(firstCsp).not.toBe(secondCsp);
    expect(firstCsp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(firstCsp).toContain("'unsafe-eval'");
    expect(first.headers.get("x-middleware-request-content-security-policy")).toBe(firstCsp);
    expect(second.headers.get("x-middleware-request-content-security-policy")).toBe(secondCsp);
  });

  it("keeps production origin enforcement fail-closed while retaining a nonce-bound policy", async () => {
    process.env.APP_ENV = "production";
    Object.assign(process.env, { NODE_ENV: "production" });
    process.env.ORIGIN_VERIFY_SECRET = "synthetic-origin-secret";
    const middleware = await loadMiddleware();

    const response = await middleware.middleware(new NextRequest("https://ungraduedu.eu.cc/api/parent-needs", { method: "GET" }));

    expect(response.status).toBe(403);
    expect(response.headers.get("content-security-policy")).toMatch(/'nonce-[A-Za-z0-9_-]+'/);
    const productionCsp = String(response.headers.get("content-security-policy"));
    expect(productionCsp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(productionCsp).not.toContain("'unsafe-eval'");
  });
});
