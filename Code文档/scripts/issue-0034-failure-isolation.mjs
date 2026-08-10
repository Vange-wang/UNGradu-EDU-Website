import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { cp, mkdir, writeFile } from "node:fs/promises";
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCHEMA_VERSION = 2;
const RULE_VERSION = "2026-08-10-issue-0034-v2";
const SAFE_CLASSES = new Set([
  "csp-eval-blocked",
  "missing-dependency",
  "module-resolution",
  "next-manifest-missing",
  "process-error"
]);
const SAFE_TOP_LEVEL_KEYS = new Set([
  "schemaVersion",
  "kind",
  "generatedAt",
  "head",
  "branch",
  "candidateFiles",
  "baseline",
  "probes",
  "suiteRuns",
  "artifacts",
  "sensitiveScan"
]);
const SAFE_KEYS = new Set([
  "schemaVersion",
  "kind",
  "generatedAt",
  "head",
  "branch",
  "candidateFiles",
  "baseline",
  "probes",
  "suiteRuns",
  "artifacts",
  "sensitiveScan",
  "safe",
  "path",
  "bytes",
  "sha256",
  "missing",
  "label",
  "baseUrl",
  "paths",
  "pathname",
  "status",
  "contentType",
  "cacheControl",
  "location",
  "csp",
  "directives",
  "hasNonce",
  "unsafeInline",
  "unsafeEval",
  "elapsedMs",
  "errorCode",
  "dom",
  "htmlNonEmpty",
  "targetPresent",
  "htmlLength",
  "scriptCount",
  "bodyTextLength",
  "inlineScriptCount",
  "classes",
  "chunkCount",
  "failureDetails",
  "output",
  "suite",
  "testName",
  "testHash",
  "failureCategory",
  "candidatePath",
  "selector",
  "assertionClass",
  "processPhase",
  "startedAt",
  "finishedAt",
  "exitCode",
  "signal",
  "timedOut",
  "dependencyMode",
  "dependencyReady",
  "reparsePointCount",
  "pathEscape",
  "nextEntryRegular",
  "vitestEntryRegular",
  "archive",
  "source",
  "target",
  "nextBin",
  "vitestBin",
  "relativePath",
  "ruleVersion",
  "result",
  "checkedFields",
  "probeCount",
  "suiteCount"
]);
const SUITE_CONTEXT = new Map([
  ["tests/issue-0033-submit-hydration-browser.test.ts", { candidatePath: "/parent-needs/new|/tutor-profiles/new", selector: "publish-form" }],
  ["tests/navigation-trail-browser.test.ts", { candidatePath: "/profile", selector: "shared-header-trail" }],
  ["tests/ui-preview-confirmed-actual-browser.test.ts", { candidatePath: "/tutor-profiles/preview-tutor|/tutor-profiles", selector: "preview-target" }]
]);
const SENSITIVE_KEY_PATTERN = /^(body|text|html|snippet|stdout|stderr|message|raw|nonce|authorization|cookie|secret|token|password|email|phone|wechat|weixin|qq|vx|childintro|abilitydescription|proofimages?)$/i;
const SENSITIVE_VALUE_PATTERNS = [
  /['"]nonce-[^'"\s]+['"]/i,
  /\bBearer\s+[A-Za-z0-9._-]+/i,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /(?<!\d)1[3-9]\d{9}(?!\d)/,
  /(?:微信|wechat|weixin|qq|vx)\s*[:：=]?\s*\S+/i
];

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function safeErrorCode(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (/module not found|cannot find package|ERR_MODULE_NOT_FOUND/i.test(message)) {
    return "missing-dependency";
  }
  if (/fallback-build-manifest|manifest/i.test(message)) {
    return "next-manifest-missing";
  }
  if (/evalerror|unsafe-eval/i.test(message)) {
    return "csp-eval-blocked";
  }
  return "process-error";
}

export function summarizeCsp(value) {
  if (!value) {
    return {
      directives: [],
      hasNonce: false,
      unsafeInline: false,
      unsafeEval: false
    };
  }

  const directives = new Map();
  for (const rawDirective of String(value).split(";")) {
    const tokens = rawDirective.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    directives.set(tokens[0].toLowerCase(), tokens.slice(1));
  }
  const names = [...directives.keys()].sort();
  const nonceValues = [];
  for (const tokens of directives.values()) {
    for (const token of tokens) {
      if (/^'nonce-[^']+'$/i.test(token)) nonceValues.push(token.toLowerCase());
    }
  }
  const allTokens = [...directives.values()].flat();
  return {
    directives: names,
    hasNonce: nonceValues.length > 0,
    unsafeInline: allTokens.some((token) => token.toLowerCase() === "'unsafe-inline'"),
    unsafeEval: allTokens.some((token) => token.toLowerCase() === "'unsafe-eval'")
  };
}

function hashText(value) {
  return createHash("sha256").update(String(value), "utf8").digest("hex");
}

function classifyFailureLine(line) {
  if (/timed out|timeout/i.test(line)) {
    return { failureCategory: "fixture-timeout", assertionClass: "timeout", processPhase: "browser-fixture" };
  }
  if (/目标区域未渲染|target[^\n]*(not rendered|missing)|not rendered/i.test(line)) {
    return { failureCategory: "target-rendering", assertionClass: "target-presence", processPhase: "browser-fixture" };
  }
  if (/未进入|state=|trail/i.test(line)) {
    return { failureCategory: "navigation-timing", assertionClass: "navigation-target", processPhase: "browser-fixture" };
  }
  if (/csp|nonce|unsafe-inline|unsafe-eval/i.test(line)) {
    return { failureCategory: "csp-policy", assertionClass: "csp-runtime", processPhase: "browser-fixture" };
  }
  return { failureCategory: "assertion-failed", assertionClass: "unknown", processPhase: "vitest" };
}

function createFailureDetail(suite, rawName) {
  const parts = String(rawName).split(" > ");
  const testName = parts.at(-1)?.trim().replace(/\s+/g, " ") || "[redacted]";
  const safeTestName = testName.length <= 160 && !SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(testName)) ? testName : "[redacted]";
  const context = SUITE_CONTEXT.get(suite) ?? { candidatePath: "[redacted]", selector: "unknown" };
  return {
    suite,
    testName: safeTestName,
    testHash: hashText(`${suite}\u0000${testName}`),
    failureCategory: "assertion-failed",
    candidatePath: context.candidatePath,
    selector: context.selector,
    assertionClass: "unknown",
    processPhase: "vitest"
  };
}

export function createOutputClassifier(suite = "") {
  const classes = new Set();
  const failureDetails = [];
  let chunkCount = 0;
  let tail = "";
  let lineTail = "";
  return {
    push(chunk) {
      chunkCount += 1;
      const text = Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
      const window = `${tail}${text}`;
      if (/EvalError|unsafe-eval/i.test(window)) classes.add("csp-eval-blocked");
      if (/ERR_MODULE_NOT_FOUND|Cannot find package|Module not found/i.test(window)) {
        classes.add(/ERR_MODULE_NOT_FOUND|Cannot find package/i.test(window) ? "missing-dependency" : "module-resolution");
      }
      if (/fallback-build-manifest/i.test(window)) classes.add("next-manifest-missing");
      tail = window.slice(-32);
      if (suite) {
        const lines = `${lineTail}${text}`.split(/\r?\n/);
        lineTail = lines.pop()?.slice(-512) ?? "";
        for (const line of lines) {
          const failure = line.match(/^\s*[×x]\s+(.+?)\s+\d+ms\s*$/u);
          if (failure) {
            failureDetails.push(createFailureDetail(suite, failure[1]));
            continue;
          }
          const current = failureDetails.at(-1);
          if (current && (line.includes("→") || /timed out|timeout|未进入|目标区域未渲染|target|csp|nonce/i.test(line))) {
            Object.assign(current, classifyFailureLine(line));
          }
        }
      }
    },
    finish() {
      const result = { classes: [...classes].sort(), chunkCount };
      if (suite) {
        result.failureDetails = failureDetails.filter((item, index, all) =>
          all.findIndex((candidate) => candidate.testHash === item.testHash) === index
        );
      }
      return result;
    }
  };
}

function assertSafeKey(key) {
  if (!SAFE_KEYS.has(key) || SENSITIVE_KEY_PATTERN.test(key)) {
    throw new Error(`sensitive or unknown evidence field: ${key}`);
  }
}

function scanNode(value, pathName, state) {
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    state.checkedFields += 1;
    return;
  }
  if (typeof value === "string") {
    if (value.length > 512 || SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
      throw new Error(`sensitive evidence value at ${pathName}`);
    }
    state.checkedFields += 1;
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > 128) throw new Error(`evidence array too large at ${pathName}`);
    value.forEach((item, index) => scanNode(item, `${pathName}[${index}]`, state));
    return;
  }
  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      assertSafeKey(key);
      scanNode(item, `${pathName}.${key}`, state);
    }
    return;
  }
  throw new Error(`unsupported evidence value at ${pathName}`);
}

export function scanEvidenceArtifact(value) {
  const state = { checkedFields: 0 };
  scanNode(value, "$", state);
  return { ruleVersion: RULE_VERSION, result: "pass", checkedFields: state.checkedFields };
}

export function buildStructuredEvidence(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("evidence must be an object");
  }
  for (const key of Object.keys(input)) {
    if (!SAFE_TOP_LEVEL_KEYS.has(key)) throw new Error(`unknown evidence field: ${key}`);
  }
  if (input.schemaVersion !== SCHEMA_VERSION) throw new Error("unsupported evidence schema");
  if (input.kind !== "issue-0034-s1-failure-isolation") throw new Error("unexpected evidence kind");
  const scan = scanEvidenceArtifact(input);
  return { ...input, sensitiveScan: scan };
}

function baselineRuntime(dependency) {
  if (!dependency) return { args: [], env: {} };
  return { args: [], env: {} };
}

function isWithin(root, target) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  return resolvedTarget === resolvedRoot || resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`);
}

export function inspectDependencyClosure(targetRoot) {
  const root = path.resolve(targetRoot);
  let reparsePointCount = 0;
  const visit = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      const entryStat = lstatSync(fullPath);
      if (entryStat.isSymbolicLink()) {
        reparsePointCount += 1;
        continue;
      }
      if (entryStat.isDirectory()) visit(fullPath);
    }
  };
  const rootStat = lstatSync(root);
  if (rootStat.isSymbolicLink()) reparsePointCount += 1;
  else visit(root);
  const realRoot = realpathSync(root);
  const nextEntry = path.join(root, "next", "dist", "bin", "next");
  const vitestEntry = path.join(root, "vitest", "vitest.mjs");
  const regularFile = (filePath) => {
    if (!existsSync(filePath)) return false;
    const entryStat = lstatSync(filePath);
    return entryStat.isFile() && !entryStat.isSymbolicLink();
  };
  return {
    reparsePointCount,
    pathEscape: !isWithin(root, realRoot),
    nextEntryRegular: regularFile(nextEntry),
    vitestEntryRegular: regularFile(vitestEntry)
  };
}

function killTree(pid) {
  if (!pid) return;
  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    } catch {
      // Process already exited.
    }
    return;
  }
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    // Process already exited.
  }
}

async function reservePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("port reservation failed");
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  return address.port;
}

async function waitForHealthy(url, child, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.status < 500) return;
    } catch {
      // Keep polling until the bounded deadline.
    }
    if (child.exitCode !== null) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`server readiness failed: ${url}`);
}

function drainOutput(child, suite = "") {
  const stdout = createOutputClassifier(suite);
  const stderr = createOutputClassifier(suite);
  child.stdout?.on("data", (chunk) => stdout.push(chunk));
  child.stderr?.on("data", (chunk) => stderr.push(chunk));
  return { stdout, stderr };
}

export function summarizeStaticHtml(pathname, html) {
  const text = String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const selector = pathname === "/tutor-profiles/preview-tutor" ? "detail-hero" : "listing-card";
  return {
    htmlNonEmpty: html.length > 0,
    targetPresent: html.includes(selector) || html.includes("data-page="),
    htmlLength: html.length,
    scriptCount: (html.match(/<script\b/gi) || []).length,
    bodyTextLength: text.length,
    inlineScriptCount: (html.match(/<script\b(?![^>]*\bsrc=)[^>]*>/gi) || []).length
  };
}

async function probeNext(workspace, label, dependency, evidenceRoot) {
  const directory = path.join(evidenceRoot, label, "next-probe");
  await mkdir(directory, { recursive: true });
  const port = await reservePort();
  const nextBin = dependency?.nextBin ?? path.join(workspace, "node_modules", "next", "dist", "bin", "next");
  const runtime = baselineRuntime(dependency);
  const child = spawn(process.execPath, [...runtime.args, nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: workspace,
    env: { ...process.env, ...runtime.env, APP_ENV: "test", NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
  const output = drainOutput(child);
  const result = { label, baseUrl: `http://127.0.0.1:${port}`, paths: [] };
  try {
    await waitForHealthy(result.baseUrl, child);
    for (const pathname of ["/tutor-profiles/preview-tutor", "/tutor-profiles"]) {
      const startedAt = Date.now();
      try {
        const response = await fetch(`${result.baseUrl}${pathname}`, { redirect: "manual" });
        const body = await response.text();
        result.paths.push({
          pathname,
          status: response.status,
          contentType: response.headers.get("content-type"),
          cacheControl: response.headers.get("cache-control"),
          location: response.headers.get("location"),
          csp: summarizeCsp(response.headers.get("content-security-policy")),
          dom: summarizeStaticHtml(pathname, body),
          elapsedMs: Date.now() - startedAt
        });
      } catch (error) {
        result.paths.push({ pathname, errorCode: safeErrorCode(error), elapsedMs: Date.now() - startedAt });
      }
    }
  } catch (error) {
    result.errorCode = safeErrorCode(error);
  } finally {
    killTree(child.pid);
  }
  result.output = output.stdout.finish();
  result.output = {
    classes: [...new Set([...result.output.classes, ...output.stderr.finish().classes])].filter((item) => SAFE_CLASSES.has(item)).sort(),
    chunkCount: result.output.chunkCount + output.stderr.finish().chunkCount
  };
  return result;
}

async function runSuite(workspace, label, suite, dependency) {
  const vitest = dependency?.vitestBin ?? path.join(workspace, "node_modules", "vitest", "vitest.mjs");
  const runtime = baselineRuntime(dependency);
  const startedAt = new Date().toISOString();
  const child = spawn(process.execPath, [...runtime.args, vitest, "run", suite, "--reporter=verbose", "--maxWorkers=1", "--maxConcurrency=1"], {
    cwd: workspace,
    env: { ...process.env, ...runtime.env, APP_ENV: "test", NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
  const output = drainOutput(child, suite);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = setTimeout(() => {
      killTree(child.pid);
      const summary = mergeOutput(output);
      summary.failureDetails = [
        ...(summary.failureDetails ?? []),
        {
          suite,
          testName: "suite-timeout",
          testHash: createHash("sha256").update(suite).digest("hex"),
          failureCategory: "fixture-timeout",
          candidatePath: SUITE_CONTEXT.get(suite)?.candidatePath ?? "suite",
          selector: SUITE_CONTEXT.get(suite)?.selector ?? "suite",
          assertionClass: "suite-timeout",
          processPhase: "vitest-run"
        }
      ];
      finish({ suite, label, startedAt, timedOut: true, finishedAt: new Date().toISOString(), output: summary });
    }, 180_000);
    child.on("exit", (code, signal) => {
      clearTimeout(timer);
      finish({ suite, label, startedAt, exitCode: code, signal, timedOut: false, finishedAt: new Date().toISOString(), output: mergeOutput(output) });
    });
  });
}

function mergeOutput(output) {
  const stdout = output.stdout.finish();
  const stderr = output.stderr.finish();
  const result = {
    classes: [...new Set([...stdout.classes, ...stderr.classes])].filter((item) => SAFE_CLASSES.has(item)).sort(),
    chunkCount: stdout.chunkCount + stderr.chunkCount
  };
  const failureDetails = [...(stdout.failureDetails ?? []), ...(stderr.failureDetails ?? [])];
  if (failureDetails.length) {
    result.failureDetails = failureDetails.filter((item, index, all) =>
      all.findIndex((candidate) => candidate.testHash === item.testHash) === index
    );
  }
  return result;
}

async function artifactMeta(filePath, relativePath) {
  if (!existsSync(filePath)) return { path: relativePath, missing: true };
  const stat = statSync(filePath);
  return { path: relativePath, bytes: stat.size, sha256: sha256(filePath) };
}

async function createBaseline(evidenceRoot, root, repoRoot) {
  const archive = path.join(evidenceRoot, "HEAD-baseline.tar");
  execFileSync("git", ["archive", "HEAD", "--output", archive], { cwd: repoRoot });
  const tarBinary = existsSync("D:\\Git\\usr\\bin\\tar.exe") ? "D:\\Git\\usr\\bin\\tar.exe" : "tar";
  const tarArgs = tarBinary.endsWith("tar.exe")
    ? ["--force-local", "-xf", archive, "-C", evidenceRoot]
    : ["-xf", archive, "-C", evidenceRoot];
  execFileSync(tarBinary, tarArgs, { cwd: repoRoot });
  const baselineCode = path.join(evidenceRoot, "Code文档");
  const sourceNodeModules = path.join(root, "node_modules");
  const targetNodeModules = path.join(baselineCode, "node_modules");
  await cp(sourceNodeModules, targetNodeModules, { recursive: true, dereference: true, force: false });
  const closure = inspectDependencyClosure(targetNodeModules);
  return {
    path: baselineCode,
    archive,
    dependencyMode: "TEMP copied and dereferenced node_modules",
    dependencyReady: closure.reparsePointCount === 0 && !closure.pathEscape && closure.nextEntryRegular && closure.vitestEntryRegular,
    ...closure,
    source: "workspace node_modules read-only copy",
    target: targetNodeModules,
    nextBin: path.join(targetNodeModules, "next", "dist", "bin", "next"),
    vitestBin: path.join(targetNodeModules, "vitest", "vitest.mjs")
  };
}

async function main() {
  const root = process.cwd();
  const repoRoot = path.resolve(root, "..");
  const marker = new Date().toISOString().replace(/[:.]/g, "-");
  const evidenceRoot = path.join(os.tmpdir(), `issue-0034-s1-seventh-isolation-${marker}`);
  const suites = [
    "tests/issue-0033-submit-hydration-browser.test.ts",
    "tests/navigation-trail-browser.test.ts",
    "tests/ui-preview-confirmed-actual-browser.test.ts"
  ];
  await mkdir(evidenceRoot, { recursive: true });
  const baseline = await createBaseline(evidenceRoot, root, repoRoot);
  const candidateRelative = [
    "server/security/content-security-policy.ts",
    "middleware.ts",
    "app/layout.tsx",
    "server/api-utils.ts",
    "server/security/security-observability.ts",
    "server/origin-request-verification.ts",
    "server/conversations.ts",
    "server/contact-exchange.ts",
    "server/email-auth-api.ts",
    "features/auth/login-form.tsx",
    "features/navigation/site-header.tsx",
    "app/globals.css",
    "cloudflare/worker.ts",
    "cloudflare/worker.js",
    "tests/cloudflare-worker-proxy.test.ts",
    "tests/security-headers.test.ts",
    "tests/login-approved-visual-contract.test.ts",
    "tests/issue-0034-csp-nonce.test.ts",
    "tests/issue-0034-failure-isolation.test.ts",
    "scripts/issue-0034-failure-isolation.mjs",
    "scripts/issue-0034-failure-isolation.d.mts",
    ...suites
  ];
  const manifest = {
    schemaVersion: SCHEMA_VERSION,
    kind: "issue-0034-s1-failure-isolation",
    generatedAt: new Date().toISOString(),
    head: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim(),
    branch: execFileSync("git", ["branch", "--show-current"], { cwd: repoRoot, encoding: "utf8" }).trim(),
    candidateFiles: await Promise.all(candidateRelative.map((relativePath) => artifactMeta(path.join(root, relativePath), relativePath))),
    baseline: {
      path: baseline.path,
      archive: baseline.archive,
      dependencyMode: baseline.dependencyMode,
      dependencyReady: baseline.dependencyReady,
      reparsePointCount: baseline.reparsePointCount,
      pathEscape: baseline.pathEscape,
      nextEntryRegular: baseline.nextEntryRegular,
      vitestEntryRegular: baseline.vitestEntryRegular,
      source: baseline.source,
      target: baseline.target,
      nextBin: baseline.nextBin,
      vitestBin: baseline.vitestBin
    },
    probes: [],
    suiteRuns: []
  };
  for (const label of ["candidate", "HEAD-baseline"]) {
    const workspace = label === "candidate" ? root : baseline.path;
    const dependency = label === "HEAD-baseline" ? baseline : undefined;
    manifest.probes.push(await probeNext(workspace, label, dependency, evidenceRoot));
    for (const suite of suites) manifest.suiteRuns.push(await runSuite(workspace, label, suite, dependency));
  }
  const safeManifest = buildStructuredEvidence(manifest);
  const manifestPath = path.join(evidenceRoot, "evidence-manifest.json");
  await writeFile(manifestPath, JSON.stringify(safeManifest, null, 2), { encoding: "utf8", flag: "wx" });
  console.log(JSON.stringify({ evidenceRoot, manifestPath, manifestSha256: sha256(manifestPath), probeCount: manifest.probes.length, suiteCount: manifest.suiteRuns.length }));
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  await main();
}
