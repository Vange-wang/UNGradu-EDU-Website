const fs = require("node:fs");
const path = require("node:path");

const PATCH_MARKER = Symbol.for(
  "local.next.windows-export-rm-retry-installed"
);
const RETRYABLE_ERROR_CODES = new Set(["EBUSY", "ENOTEMPTY", "EPERM"]);

function delay(milliseconds) {
  return new Promise((resolveDelay) => {
    setTimeout(resolveDelay, milliseconds);
  });
}

function installWindowsExportRmRetry({
  fsPromises = fs.promises,
  maxAttempts = 8,
  platform = process.platform,
  projectRoot = path.resolve(__dirname, ".."),
  retryDelayMs = 100,
  sleep = delay
} = {}) {
  if (platform !== "win32" || fsPromises[PATCH_MARKER]) {
    return false;
  }

  const exportDirectory = path.resolve(projectRoot, ".next", "export");
  const nativeRm = fsPromises.rm.bind(fsPromises);

  fsPromises.rm = async (target, options) => {
    if (path.resolve(target) !== exportDirectory) {
      return nativeRm(target, options);
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await nativeRm(target, options);
      } catch (error) {
        const retryable =
          error &&
          typeof error === "object" &&
          RETRYABLE_ERROR_CODES.has(error.code);
        if (!retryable || attempt === maxAttempts) {
          throw error;
        }
        await sleep(retryDelayMs * attempt);
      }
    }
  };

  Object.defineProperty(fsPromises, PATCH_MARKER, {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false
  });
  return true;
}

module.exports = {
  installWindowsExportRmRetry
};
