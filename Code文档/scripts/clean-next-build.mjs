import { rm } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nextBuildDir = resolve(projectRoot, ".next");
const RETRYABLE_WINDOWS_ERROR_CODES = new Set([
  "EBUSY",
  "ENOTEMPTY",
  "EPERM"
]);

function delay(milliseconds) {
  return new Promise((resolveDelay) => {
    setTimeout(resolveDelay, milliseconds);
  });
}

export async function cleanBuildDirectory(
  targetDirectory,
  {
    maxAttempts = 8,
    remove = rm,
    retryDelayMs = 100,
    sleep = delay
  } = {}
) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new TypeError("maxAttempts must be a positive integer.");
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await remove(targetDirectory, {
        force: true,
        maxRetries: 2,
        recursive: true,
        retryDelay: 50
      });
      return;
    } catch (error) {
      const retryable =
        error &&
        typeof error === "object" &&
        RETRYABLE_WINDOWS_ERROR_CODES.has(error.code);

      if (!retryable || attempt === maxAttempts) {
        throw error;
      }

      await sleep(retryDelayMs * attempt);
    }
  }
}

async function run() {
  if (!nextBuildDir.startsWith(`${projectRoot}${sep}`)) {
    throw new Error("Refusing to clean a path outside the Code文档 project root.");
  }

  await cleanBuildDirectory(nextBuildDir);
  console.log("cleaned .next build artifacts");
}

const invokedScriptPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedScriptPath === fileURLToPath(import.meta.url)) {
  await run();
}
