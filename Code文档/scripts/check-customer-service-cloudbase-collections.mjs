import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import tcb from "@cloudbase/node-sdk";

const envFilePath = path.resolve(process.cwd(), ".env.local");
const collections = [
  "customer_service_conversation_states",
  "customer_service_audit_records",
  "customer_service_kb_intake",
  "customer_service_critical_events"
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(".env.local does not exist. Create it under Code文档 first.");
  }

  const values = {};

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    values[trimmedLine.slice(0, separatorIndex).trim()] = trimmedLine
      .slice(separatorIndex + 1)
      .trim();
  }

  return values;
}

function readRequired(values, key) {
  const value = values[key]?.trim();

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

async function main() {
  const values = parseEnvFile(envFilePath);
  const env = readRequired(values, "CLOUDBASE_ENV_ID");
  const secretId = readRequired(values, "TENCENTCLOUD_SECRETID");
  const secretKey = readRequired(values, "TENCENTCLOUD_SECRETKEY");
  const database = tcb.init({ env, secretId, secretKey }).database();

  console.log(`Customer service CloudBase collection check: ${env}`);

  for (const collectionName of collections) {
    try {
      await database.collection(collectionName).limit(1).get();
      console.log(`${collectionName}: readable`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (
        !message.includes("DATABASE_COLLECTION_NOT_EXIST") &&
        !message.includes("Db or Table not exist")
      ) {
        throw error;
      }

      await database.createCollection(collectionName);
      await database.collection(collectionName).limit(1).get();
      console.log(`${collectionName}: created and readable`);
    }
  }
}

main().catch((error) => {
  console.error("Customer service CloudBase collection check failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
