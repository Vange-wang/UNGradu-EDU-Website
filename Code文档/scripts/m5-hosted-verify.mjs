import { spawn } from "node:child_process";
import process from "node:process";

const baseUrl = (process.env.M5_BASE_URL || "").trim().replace(/\/$/, "");

function isLocalTarget(url) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(url);
}

function runStep(label, args) {
  return new Promise((resolve, reject) => {
    console.log(`\nM5 hosted verify: ${label}`);
    const child = spawn(process.execPath, args, {
      env: process.env,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} exited with code ${code ?? "unknown"}`));
    });
  });
}

async function main() {
  if (!baseUrl) {
    throw new Error("M5_BASE_URL is required for hosted verification.");
  }

  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new Error("M5_BASE_URL must start with http:// or https://.");
  }

  if (isLocalTarget(baseUrl)) {
    throw new Error("Hosted verification requires a non-localhost M5_BASE_URL.");
  }

  console.log("M5 hosted verification start");
  console.log(`Target: ${baseUrl}`);
  await runStep("HTTP flow", ["scripts/m5-http-flow-and-load.mjs"]);
  await runStep("HTTP 50 virtual users load", [
    "scripts/m5-http-flow-and-load.mjs",
    "--load"
  ]);
  console.log("\nM5 hosted verification passed");
}

main().catch((error) => {
  console.error("\nM5 hosted verification failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
