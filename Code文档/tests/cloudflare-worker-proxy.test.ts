import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

import { describe, expect, it, vi } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const workerPath = join(here, "..", "cloudflare", "worker.ts");

type WorkerEnv = {
  UPSTREAM_ORIGIN: string;
};

type WorkerModule = {
  default: {
    fetch(request: Request, env: WorkerEnv): Promise<Response>;
  };
};

async function importWorker() {
  if (!existsSync(workerPath)) {
    return null;
  }

  return (await import(pathToFileURL(workerPath).href)) as WorkerModule;
}

describe("Cloudflare Worker reverse proxy example", () => {
  it("provides a Worker implementation under Code文档/cloudflare/worker.ts", () => {
    expect(existsSync(workerPath)).toBe(true);
  });

  it("proxies to the configured CloudBase origin while preserving path and query", async () => {
    const worker = await importWorker();
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
});
