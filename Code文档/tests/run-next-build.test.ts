import { EventEmitter } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  acquireBuildLock,
  runNextBuild
} from "@/scripts/run-next-build.mjs";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true })
    )
  );
});

describe("Next build orchestration", () => {
  it("starts the repository-local Next CLI with the current Node runtime", async () => {
    const child = new EventEmitter();
    const spawnProcess = vi.fn(() => {
      queueMicrotask(() => child.emit("exit", 0, null));
      return child;
    });
    const lockRoot = await mkdtemp(path.join(tmpdir(), "next-build-lock-"));
    temporaryDirectories.push(lockRoot);
    const buildPromise = runNextBuild({
      cwd: "C:\\project",
      lockPath: path.join(lockRoot, "build.lock"),
      nextCliPath: "C:\\project\\node_modules\\next\\dist\\bin\\next",
      runtimePath: "C:\\node\\node.exe",
      spawnProcess
    });

    await buildPromise;

    expect(spawnProcess).toHaveBeenCalledWith(
      "C:\\node\\node.exe",
      ["C:\\project\\node_modules\\next\\dist\\bin\\next", "build"],
      expect.objectContaining({
        cwd: "C:\\project",
        shell: false,
        stdio: "inherit"
      })
    );
  });

  it("fails closed when another build owns the repository lock", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "next-build-lock-"));
    temporaryDirectories.push(root);
    const lockPath = path.join(root, "build.lock");
    const release = await acquireBuildLock(lockPath);

    await expect(
      acquireBuildLock(lockPath, {
        maxWaitMs: 10,
        pollIntervalMs: 1
      })
    ).rejects.toThrow("Another Next build is already using this repository");

    await release();
  });

  it("reclaims a lock only when its recorded owner process is no longer alive", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "next-build-lock-"));
    temporaryDirectories.push(root);
    const lockPath = path.join(root, "build.lock");
    await writeFile(
      lockPath,
      JSON.stringify({
        pid: 424242,
        startedAt: "2026-07-27T00:00:00.000Z",
        token: "stale-token"
      }),
      "utf8"
    );

    const release = await acquireBuildLock(lockPath, {
      isProcessAlive: () => false,
      maxWaitMs: 10,
      pollIntervalMs: 1
    });

    await release();
  });

  it("does not reclaim a lock while its recorded owner process is alive", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "next-build-lock-"));
    temporaryDirectories.push(root);
    const lockPath = path.join(root, "build.lock");
    await writeFile(
      lockPath,
      JSON.stringify({
        pid: 424242,
        startedAt: "2026-07-27T00:00:00.000Z",
        token: "active-token"
      }),
      "utf8"
    );

    await expect(
      acquireBuildLock(lockPath, {
        isProcessAlive: () => true,
        maxWaitMs: 10,
        pollIntervalMs: 1
      })
    ).rejects.toThrow("owner pid 424242");
  });

  it.each([0, 1])("releases the lock after child exit code %i", async (exitCode) => {
    const root = await mkdtemp(path.join(tmpdir(), "next-build-lock-"));
    temporaryDirectories.push(root);
    const lockPath = path.join(root, "build.lock");
    const child = new EventEmitter();
    const buildPromise = runNextBuild({
      cwd: root,
      lockPath,
      nextCliPath: path.join(root, "next"),
      runtimePath: process.execPath,
      spawnProcess: () => {
        queueMicrotask(() => child.emit("exit", exitCode, null));
        return child;
      }
    });

    if (exitCode === 0) {
      await buildPromise;
    } else {
      await expect(buildPromise).rejects.toThrow(
        "Next build exited with code 1"
      );
    }

    const release = await acquireBuildLock(lockPath);
    await release();
  });

  it.each([
    {
      emitFailure(child: EventEmitter) {
        child.emit("exit", null, "SIGTERM");
      },
      expectedMessage: "Next build exited with signal SIGTERM"
    },
    {
      emitFailure(child: EventEmitter) {
        child.emit("error", new Error("spawn failed"));
      },
      expectedMessage: "spawn failed"
    }
  ])("releases the lock after $expectedMessage", async ({
    emitFailure,
    expectedMessage
  }) => {
    const root = await mkdtemp(path.join(tmpdir(), "next-build-lock-"));
    temporaryDirectories.push(root);
    const lockPath = path.join(root, "build.lock");
    const child = new EventEmitter();
    const buildPromise = runNextBuild({
      cwd: root,
      lockPath,
      nextCliPath: path.join(root, "next"),
      runtimePath: process.execPath,
      spawnProcess: () => {
        queueMicrotask(() => emitFailure(child));
        return child;
      }
    });

    await expect(buildPromise).rejects.toThrow(expectedMessage);
    const release = await acquireBuildLock(lockPath);
    await release();
  });
});
