import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

import { describe, expect, it, vi } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const workerTsPath = join(here, "..", "cloudflare", "worker.ts");
const workerJsPath = join(here, "..", "cloudflare", "worker.js");

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
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");

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
