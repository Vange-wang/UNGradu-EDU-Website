import { rmSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nextBuildDir = resolve(projectRoot, ".next");

if (!nextBuildDir.startsWith(`${projectRoot}${sep}`)) {
  throw new Error("Refusing to clean a path outside the Code文档 project root.");
}

rmSync(nextBuildDir, {
  force: true,
  recursive: true
});

console.log("cleaned .next build artifacts");
