import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { open, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultLockPath = resolve(projectRoot, ".next-build.lock");
const defaultNextCliPath = resolve(
  projectRoot,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next"
);

function delay(milliseconds) {
  return new Promise((resolveDelay) => {
    setTimeout(resolveDelay, milliseconds);
  });
}

async function readLockOwner(lockPath) {
  try {
    const contents = await readFile(lockPath, "utf8");
    return JSON.parse(contents);
  } catch {
    return null;
  }
}

function defaultIsProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return true;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return Boolean(
      error && typeof error === "object" && error.code === "EPERM"
    );
  }
}

export async function acquireBuildLock(
  lockPath,
  {
    isProcessAlive = defaultIsProcessAlive,
    maxWaitMs = 30_000,
    pollIntervalMs = 250,
    sleep = delay
  } = {}
) {
  const token = randomUUID();
  const startedAt = Date.now();
  let retryAfterReclaim = false;

  while (retryAfterReclaim || Date.now() - startedAt <= maxWaitMs) {
    retryAfterReclaim = false;
    try {
      const handle = await open(lockPath, "wx");
      await handle.writeFile(
        JSON.stringify({
          pid: process.pid,
          startedAt: new Date().toISOString(),
          token
        }),
        "utf8"
      );
      await handle.close();

      return async () => {
        const owner = await readLockOwner(lockPath);
        if (owner?.token === token) {
          await rm(lockPath, { force: true });
        }
      };
    } catch (error) {
      if (!error || typeof error !== "object" || error.code !== "EEXIST") {
        throw error;
      }

      const owner = await readLockOwner(lockPath);
      if (
        owner &&
        Number.isInteger(owner.pid) &&
        typeof owner.token === "string" &&
        owner.token.length > 0 &&
        !isProcessAlive(owner.pid)
      ) {
        const currentOwner = await readLockOwner(lockPath);
        if (currentOwner?.token === owner.token) {
          await rm(lockPath, { force: true });
          retryAfterReclaim = true;
          continue;
        }
      }
    }

    await sleep(pollIntervalMs);
  }

  const owner = await readLockOwner(lockPath);
  const ownerDetail =
    owner && Number.isInteger(owner.pid) ? ` (owner pid ${owner.pid})` : "";
  throw new Error(
    `Another Next build is already using this repository${ownerDetail}.`
  );
}

function waitForChild(child) {
  return new Promise((resolveChild, rejectChild) => {
    child.once("error", rejectChild);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolveChild();
        return;
      }

      const detail =
        code === null ? `signal ${signal ?? "unknown"}` : `code ${code}`;
      rejectChild(new Error(`Next build exited with ${detail}.`));
    });
  });
}

export async function runNextBuild({
  cwd = projectRoot,
  lockPath = defaultLockPath,
  nextCliPath = defaultNextCliPath,
  runtimePath = process.execPath,
  spawnProcess = spawn
} = {}) {
  const releaseLock = await acquireBuildLock(lockPath);

  try {
    const child = spawnProcess(runtimePath, [nextCliPath, "build"], {
      cwd,
      env: process.env,
      shell: false,
      stdio: "inherit",
      windowsHide: true
    });
    await waitForChild(child);
  } finally {
    await releaseLock();
  }
}

const invokedScriptPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedScriptPath === fileURLToPath(import.meta.url)) {
  await runNextBuild();
}
