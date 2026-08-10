import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import tcb from "@cloudbase/node-sdk";

const envFilePath = path.resolve(process.cwd(), ".env.local");
const collections = [
  "contact_profiles",
  "parent_needs",
  "tutor_profiles",
  "conversations",
  "messages",
  "contact_exchange_requests"
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(".env.local does not exist. Create it under Code文档 first.");
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
    throw new Error(`${key} is required.`);
  }

  if (value.toLowerCase().includes("your-") || value.toLowerCase().includes("secretid") ||
    value.toLowerCase().includes("secretkey")) {
    throw new Error(`${key} is still a placeholder.`);
  }

  return value;
}

async function main() {
  const values = parseEnvFile(envFilePath);
  const env = readRequired(values, "CLOUDBASE_ENV_ID");
  const secretId = readRequired(values, "TENCENTCLOUD_SECRETID");
  const secretKey = readRequired(values, "TENCENTCLOUD_SECRETKEY");
  const app = tcb.init({ env, secretId, secretKey });
  const database = app.database();

  console.log("M5 CloudBase collection check");
  console.log(`Env: ${env}`);
  console.log("SecretId: [configured]");

  for (const collectionName of collections) {
    let result;

    try {
      result = await database.collection(collectionName).limit(1).get();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (!message.includes("DATABASE_COLLECTION_NOT_EXIST") &&
        !message.includes("Db or Table not exist")) {
        throw error;
      }

      console.log(`${collectionName}: missing, creating`);
      await database.createCollection(collectionName);
      result = await database.collection(collectionName).limit(1).get();
    }

    const count = Array.isArray(result.data) ? result.data.length : 0;
    console.log(`${collectionName}: readable (${count} sample docs)`);
  }
}

main().catch((error) => {
  console.error("M5 CloudBase collection check failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
