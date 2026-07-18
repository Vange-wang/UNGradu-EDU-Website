import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

import { describe, expect, it, vi } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const workerTsPath = join(here, "..", "cloudflare", "worker.ts");
const workerJsPath = join(here, "..", "cloudflare", "worker.js");
const wranglerConfigPath = join(here, "..", "cloudflare", "wrangler.example.toml");

type WorkerEnv = {
  UPSTREAM_ORIGIN: string;
};

type WorkerModule = {
  default: {
    fetch(request: Request, env: WorkerEnv): Promise<Response>;
  };
};

async function importWorker(workerPath: string) {
  if (!existsSync(workerPath)) {
    return null;
  }

  return (await import(pathToFileURL(workerPath).href)) as WorkerModule;
}

describe("Cloudflare Worker reverse proxy example", () => {
  it("provides a Worker implementation under Code文档/cloudflare/worker.ts", () => {
    expect(existsSync(workerTsPath)).toBe(true);
  });

  it("provides a JavaScript version that can be pasted into the Cloudflare Dashboard editor", () => {
    expect(existsSync(workerJsPath)).toBe(true);
    expect(() => execFileSync(process.execPath, ["--check", workerJsPath])).not.toThrow();

    const workerJs = readFileSync(workerJsPath, "utf8");
    expect(workerJs).not.toContain("type Env");
    expect(workerJs).not.toContain(": Request");
    expect(workerJs).not.toContain("Promise<Response>");
  });

  it("declares the custom root and www domains while keeping workers.dev as a fallback", () => {
    const wranglerConfig = readFileSync(wranglerConfigPath, "utf8");

    expect(wranglerConfig).toContain('name = "ungradu-edu-proxy"');
    expect(wranglerConfig).toContain("workers_dev = true");
    expect(wranglerConfig).toMatch(
      /\[\[routes\]\]\s+pattern = "ungradeedu\.eu\.cc"\s+custom_domain = true/
    );
    expect(wranglerConfig).toMatch(
      /\[\[routes\]\]\s+pattern = "www\.ungradeedu\.eu\.cc"\s+custom_domain = true/
    );
  });

  it.each([
    ["TypeScript source", workerTsPath],
    ["Dashboard JavaScript paste version", workerJsPath]
  ])("redirects www to the canonical root domain while preserving path and query: %s", async (_, workerPath) => {
    const worker = await importWorker(workerPath);
    expect(worker).not.toBeNull();

    const fetchMock = vi.fn<(request: Request) => Promise<Response>>();
    vi.stubGlobal("fetch", fetchMock);

    const response = await worker!.default.fetch(
      new Request("https://www.ungradeedu.eu.cc/feedback?from=www"),
      { UPSTREAM_ORIGIN: "https://ungradu-edu-prod-275285-6-1445807473.sh.run.tcloudbase.com" }
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://ungradeedu.eu.cc/feedback?from=www");
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it.each([
    ["TypeScript source", workerTsPath],
    ["Dashboard JavaScript paste version", workerJsPath]
  ])("proxies to the configured CloudBase origin while preserving path and query: %s", async (_, workerPath) => {
    const worker = await importWorker(workerPath);
    expect(worker).not.toBeNull();

    const fetchMock = vi.fn<(request: Request) => Promise<Response>>(async () => {
      return new Response("ok", {
        headers: {
          "content-type": "text/html",
          "X-CloudBase-Session-Id": "session-id",
          "x-cloudbase-upstream-status-code": "200",
          "x-cloudbase-upstream-timecost": "20",
          "x-cloudbase-upstream-type": "cloudrun",
          "x-cloudbaserun-scale-timecost": "3000",
          "x-upstream-status-code": "200",
          "x-nextjs-cache": "HIT",
          "x-request-id": "upstream-request-id",
          server: "cloudbase",
          "x-powered-by": "next"
        }
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await worker!.default.fetch(
      new Request("https://proxy.example.com/course/list?city=shanghai", {
        headers: {
          host: "proxy.example.com",
          "x-forwarded-host": "proxy.example.com"
        }
      }),
      { UPSTREAM_ORIGIN: "https://ungradu-edu-prod-275285-6-1445807473.sh.run.tcloudbase.com" }
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const proxiedRequest = fetchMock.mock.calls[0][0];
    expect(proxiedRequest.url).toBe(
      "https://ungradu-edu-prod-275285-6-1445807473.sh.run.tcloudbase.com/course/list?city=shanghai"
    );
    expect(proxiedRequest.headers.get("host")).toBe(
      "ungradu-edu-prod-275285-6-1445807473.sh.run.tcloudbase.com"
    );
    expect(proxiedRequest.headers.get("x-forwarded-host")).toBeNull();
    expect(response.headers.get("server")).toBeNull();
    expect(response.headers.get("x-powered-by")).toBeNull();
    expect(response.headers.get("x-cloudbase-session-id")).toBeNull();
    expect(response.headers.get("x-cloudbase-upstream-status-code")).toBeNull();
    expect(response.headers.get("x-cloudbase-upstream-timecost")).toBeNull();
    expect(response.headers.get("x-cloudbase-upstream-type")).toBeNull();
    expect(response.headers.get("x-cloudbaserun-scale-timecost")).toBeNull();
    expect(response.headers.get("x-upstream-status-code")).toBeNull();
    expect(response.headers.get("x-nextjs-cache")).toBeNull();
    expect(response.headers.get("x-request-id")).toBeNull();
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");

    vi.unstubAllGlobals();
  });

  it("uses the CloudBase default production origin in the Dashboard paste version when no env variable is configured", async () => {
    const worker = await importWorker(workerJsPath);
    expect(worker).not.toBeNull();

    const fetchMock = vi.fn<(request: Request) => Promise<Response>>(async () => new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);

    await worker!.default.fetch(new Request("https://proxy.example.com/rules"), {} as WorkerEnv);

    expect(fetchMock.mock.calls[0][0].url).toBe(
      "https://ungradu-edu-prod-275285-6-1445807473.sh.run.tcloudbase.com/rules"
    );

    vi.unstubAllGlobals();
  });
});
