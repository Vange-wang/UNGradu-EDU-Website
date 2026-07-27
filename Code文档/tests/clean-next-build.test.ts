import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  cleanBuildDirectory
} from "@/scripts/clean-next-build.mjs";
import packageJson from "@/package.json";

const temporaryDirectories: string[] = [];
type DirectoryRemover = (
  target: string,
  options: {
    force: boolean;
    maxRetries: number;
    recursive: boolean;
    retryDelay: number;
  }
) => Promise<void>;

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true })
    )
  );
});

describe("Windows Next build cleanup", () => {
  it("keeps the standard build on the Next-managed cache lifecycle", () => {
    expect(packageJson.scripts.build).toBe(
      "node scripts/run-next-build.mjs"
    );
    expect(packageJson.scripts["build:clean"]).toBe(
      "node scripts/clean-next-build.mjs"
    );
  });

  it("generates Next route types before invoking TypeScript", () => {
    expect(packageJson.scripts.typecheck).toBe(
      "next typegen && tsc --noEmit"
    );
  });

  it("retries transient ENOTEMPTY failures before succeeding", async () => {
    let attempts = 0;
    const remove: DirectoryRemover = vi.fn(async () => {
      attempts += 1;
      if (attempts < 3) {
        throw Object.assign(new Error("directory not empty"), {
          code: "ENOTEMPTY"
        });
      }
    });
    const sleep = vi.fn(async () => {});

    await cleanBuildDirectory("C:\\safe-project\\.next", {
      maxAttempts: 4,
      remove,
      retryDelayMs: 1,
      sleep
    });

    expect(remove).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it.each(["EPERM", "EBUSY"])("retries transient Windows %s failures", async (code) => {
    const remove: DirectoryRemover = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error(code), { code }))
      .mockResolvedValue(undefined);

    await cleanBuildDirectory("C:\\safe-project\\.next", {
      maxAttempts: 2,
      remove,
      retryDelayMs: 1,
      sleep: async () => {}
    });

    expect(remove).toHaveBeenCalledTimes(2);
  });

  it("fails immediately for non-transient filesystem errors", async () => {
    const failure = Object.assign(new Error("access denied"), {
      code: "EACCES"
    });
    const remove: DirectoryRemover = vi.fn().mockRejectedValue(failure);

    await expect(
      cleanBuildDirectory("C:\\safe-project\\.next", {
        maxAttempts: 5,
        remove,
        retryDelayMs: 1,
        sleep: async () => {}
      })
    ).rejects.toBe(failure);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("removes a real nested build directory", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "clean-next-build-"));
    temporaryDirectories.push(root);
    const buildDirectory = path.join(root, ".next");
    const artifact = path.join(buildDirectory, "server", "artifact.txt");
    await mkdir(path.dirname(artifact), { recursive: true });
    await writeFile(artifact, "generated", "utf8");
    expect(await readFile(artifact, "utf8")).toBe("generated");

    await cleanBuildDirectory(buildDirectory);

    await expect(readFile(artifact, "utf8")).rejects.toMatchObject({
      code: "ENOENT"
    });
  });
});
