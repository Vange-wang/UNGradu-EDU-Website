import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import windowsRmRetry from "@/scripts/next-windows-rm-retry.cjs";

const { installWindowsExportRmRetry } = windowsRmRetry;

describe("Next Windows export cleanup retry", () => {
  it("retries transient ENOTEMPTY failures for the temporary export directory", async () => {
    const projectRoot = "C:\\project";
    const exportDirectory = path.resolve(projectRoot, ".next", "export");
    const nativeRm = vi
      .fn()
      .mockRejectedValueOnce(
        Object.assign(new Error("directory not empty"), { code: "ENOTEMPTY" })
      )
      .mockRejectedValueOnce(
        Object.assign(new Error("directory not empty"), { code: "ENOTEMPTY" })
      )
      .mockResolvedValue(undefined);
    const fsPromises = { rm: nativeRm };

    installWindowsExportRmRetry({
      fsPromises,
      platform: "win32",
      projectRoot,
      sleep: async () => {}
    });
    await fsPromises.rm(exportDirectory, { force: true, recursive: true });

    expect(nativeRm).toHaveBeenCalledTimes(3);
  });

  it("does not retry or swallow failures outside the temporary export directory", async () => {
    const failure = Object.assign(new Error("directory not empty"), {
      code: "ENOTEMPTY"
    });
    const nativeRm = vi.fn().mockRejectedValue(failure);
    const fsPromises = { rm: nativeRm };

    installWindowsExportRmRetry({
      fsPromises,
      platform: "win32",
      projectRoot: "C:\\project",
      sleep: async () => {}
    });

    await expect(
      fsPromises.rm("C:\\project\\.next\\server", {
        force: true,
        recursive: true
      })
    ).rejects.toBe(failure);
    expect(nativeRm).toHaveBeenCalledTimes(1);
  });

  it("is a no-op on non-Windows platforms and is idempotent on Windows", () => {
    const nativeRm = vi.fn();
    const nonWindowsPromises = { rm: nativeRm };
    const windowsPromises = { rm: nativeRm };

    expect(
      installWindowsExportRmRetry({
        fsPromises: nonWindowsPromises,
        platform: "linux",
        projectRoot: "/project"
      })
    ).toBe(false);
    expect(nonWindowsPromises.rm).toBe(nativeRm);

    expect(
      installWindowsExportRmRetry({
        fsPromises: windowsPromises,
        platform: "win32",
        projectRoot: "C:\\project"
      })
    ).toBe(true);
    expect(
      installWindowsExportRmRetry({
        fsPromises: windowsPromises,
        platform: "win32",
        projectRoot: "C:\\project"
      })
    ).toBe(false);
  });
});
