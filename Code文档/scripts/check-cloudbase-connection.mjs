import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import tcb from "@cloudbase/node-sdk";

const envFilePath = path.resolve(process.cwd(), ".env.local");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(".env.local 不存在，请先在 Code文档 目录下创建本地环境变量文件");
  }

  const values = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();
    values[key] = value;
  }

  return values;
}

function readRequired(values, key) {
  const value = values[key]?.trim();

  if (!value) {
    throw new Error(`${key} 必须配置`);
  }

  if (value.includes("你的") || value.toLowerCase().includes("your-")) {
    throw new Error(`${key} 仍是占位值，请替换为真实配置`);
  }

  return value;
}

async function main() {
  const values = parseEnvFile(envFilePath);
  const env = readRequired(values, "CLOUDBASE_ENV_ID");
  const secretId = readRequired(values, "TENCENTCLOUD_SECRETID");
  const secretKey = readRequired(values, "TENCENTCLOUD_SECRETKEY");
  const collectionName = process.argv[2] || "users";
  const app = tcb.init({ env, secretId, secretKey });
  const result = await app.database().collection(collectionName).limit(1).get();

  console.log("CloudBase 连接检查通过");
  console.log(`环境 ID: ${env}`);
  console.log(`SecretId: ${secretId.slice(0, 4)}***`);
  console.log(`集合: ${collectionName}`);
  console.log(`读取条数: ${Array.isArray(result.data) ? result.data.length : 0}`);
}

main().catch((error) => {
  console.error("CloudBase 连接检查失败");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
