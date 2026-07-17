import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REQUIRED_PRODUCTION_VARIABLES = [
  "APP_ENV",
  "AUTH_SESSION_SECRET",
  "CLOUDBASE_ENV_ID",
  "EMAIL_CODE_SECRET",
  "EMAIL_FROM",
  "EMAIL_PROVIDER",
  "SMTP_HOST",
  "SMTP_PASS",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "TENCENTCLOUD_SECRETID",
  "TENCENTCLOUD_SECRETKEY"
];

const FORBIDDEN_TEST_SWITCHES = [
  "M5_ENABLE_HOSTED_TEST_LOGIN",
  "NEXT_PUBLIC_ALLOW_TEST_LOGIN"
];

const REQUIRED_COLLECTIONS = [
  "contact_profiles",
  "parent_needs",
  "tutor_profiles",
  "conversations",
  "messages",
  "contact_exchange_requests",
  "email_login_codes",
  "email_login_users"
];

const REQUIRED_S2_DOCS = [
  "../规划文档/里程碑文档/生产运行观察与运维基线准备/S2生产运行观察与运维基线执行包.md",
  "../规划文档/里程碑文档/生产运行观察与运维基线准备/生产运行观察记录模板.md",
  "../规划文档/里程碑文档/生产运行观察与运维基线准备/生产问题分级与响应规则.md",
  "../规划文档/里程碑文档/生产运行观察与运维基线准备/部署回滚与环境配置核对清单.md",
  "../规划文档/里程碑文档/生产运行观察与运维基线准备/数据库集合与权限配置检查表.md"
];

const RELEASE_CHECKLIST_PATH = "../规划文档/里程碑文档/生产运行观察与运维基线准备/部署回滚与环境配置核对清单.md";
const DATABASE_CHECKLIST_PATH = "../规划文档/里程碑文档/生产运行观察与运维基线准备/数据库集合与权限配置检查表.md";
const ENV_EXAMPLE_PATH = ".env.example";

function isTruthy(value) {
  return String(value ?? "").trim().toLowerCase() === "true";
}

function readTextIfExists(root, relativePath) {
  const absolutePath = path.resolve(root, relativePath);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  return fs.readFileSync(absolutePath, "utf8");
}

function assertProductionOpsBaseline({ cwd = process.cwd(), env = process.env } = {}) {
  const failures = [];
  const warnings = [];
  const repositoryRoot = path.resolve(cwd, "..");

  for (const relativePath of REQUIRED_S2_DOCS) {
    if (!fs.existsSync(path.resolve(cwd, relativePath))) {
      failures.push(`S2 document is missing: ${relativePath}`);
    }
  }

  const envExample = readTextIfExists(cwd, ENV_EXAMPLE_PATH);

  if (!envExample) {
    failures.push(".env.example is missing.");
  } else {
    for (const variableName of REQUIRED_PRODUCTION_VARIABLES) {
      if (!envExample.includes(variableName)) {
        failures.push(`.env.example does not document ${variableName}.`);
      }
    }
  }

  for (const switchName of FORBIDDEN_TEST_SWITCHES) {
    if (isTruthy(env[switchName])) {
      failures.push(`${switchName}=true is not allowed for production operations baseline.`);
    }
  }

  const databaseChecklist = readTextIfExists(cwd, DATABASE_CHECKLIST_PATH);

  if (!databaseChecklist) {
    failures.push("database collection checklist is missing.");
  } else {
    for (const collectionName of REQUIRED_COLLECTIONS) {
      if (!databaseChecklist.includes(`\`${collectionName}\``)) {
        failures.push(`database collection checklist does not mention ${collectionName}.`);
      }
    }
  }

  const releaseChecklist = readTextIfExists(cwd, RELEASE_CHECKLIST_PATH);

  if (!releaseChecklist) {
    failures.push("deployment rollback checklist is missing.");
  } else {
    if (!releaseChecklist.includes("2d409faf820d76a497a33a77e11045bc0e2d6b07")) {
      failures.push("deployment checklist does not record the current S1 production repair head.");
    }

    if (releaseChecklist.includes("由部署平台实际发布记录填写")) {
      warnings.push("rollback baseline still depends on deployment platform records.");
    }
  }

  if (!fs.existsSync(path.join(repositoryRoot, "规划文档"))) {
    failures.push("repository planning documents directory is not reachable from Code文档.");
  }

  return { failures, warnings };
}

function main() {
  const result = assertProductionOpsBaseline();

  console.log("S2 production operations baseline check");
  console.log("- checked S2 operating documents");
  console.log("- checked documented production environment variable names");
  console.log("- checked forbidden production test switches");
  console.log("- checked required CloudBase collection names");
  console.log("- checked release and rollback baseline record");
  console.log("- no real secrets, verification codes, passwords, or production data were read");

  for (const warning of result.warnings) {
    console.log(`- warning: ${warning}`);
  }

  if (result.failures.length > 0) {
    for (const failure of result.failures) {
      console.error(`- failed: ${failure}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log("S2 production operations baseline check passed");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}

export {
  assertProductionOpsBaseline,
  FORBIDDEN_TEST_SWITCHES,
  REQUIRED_COLLECTIONS,
  REQUIRED_PRODUCTION_VARIABLES,
  REQUIRED_S2_DOCS
};
