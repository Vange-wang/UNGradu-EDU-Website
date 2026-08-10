import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import tcb from "@cloudbase/node-sdk";

const envFilePath = path.resolve(process.cwd(), ".env.local");
const batchSize = Number.parseInt(process.env.M5_BACKFILL_BATCH_SIZE ?? "100", 10);

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

  if (
    value.toLowerCase().includes("your-") ||
    value.toLowerCase().includes("secretid") ||
    value.toLowerCase().includes("secretkey")
  ) {
    throw new Error(`${key} is still a placeholder.`);
  }

  return value;
}

function normalizeUserId(userId) {
  return typeof userId === "string" ? userId.trim() : "";
}

function normalizeSourceType(sourceType) {
  return sourceType === "parent-need" || sourceType === "tutor-profile"
    ? sourceType
    : "";
}

function createIndexFields(conversation) {
  const sourceId = typeof conversation.sourceId === "string"
    ? conversation.sourceId.trim()
    : "";
  const sourceType = normalizeSourceType(conversation.sourceType);
  const participantUserIds = Array.isArray(conversation.participantUserIds)
    ? conversation.participantUserIds.map(normalizeUserId).filter(Boolean).sort()
    : [];

  if (!sourceId || !sourceType || participantUserIds.length < 2) {
    return null;
  }

  return {
    conversationUniqKey: `${sourceType}:${sourceId}:${participantUserIds.join(":")}`,
    participantKeys: participantUserIds,
    sourceKey: `${sourceType}:${sourceId}`
  };
}

function needsBackfill(conversation, indexFields) {
  return (
    conversation.conversationUniqKey !== indexFields.conversationUniqKey ||
    conversation.sourceKey !== indexFields.sourceKey ||
    !Array.isArray(conversation.participantKeys) ||
    conversation.participantKeys.join(":") !== indexFields.participantKeys.join(":")
  );
}

async function main() {
  if (!Number.isInteger(batchSize) || batchSize <= 0 || batchSize > 1000) {
    throw new Error("M5_BACKFILL_BATCH_SIZE must be an integer between 1 and 1000.");
  }

  const values = parseEnvFile(envFilePath);
  const env = readRequired(values, "CLOUDBASE_ENV_ID");
  const secretId = readRequired(values, "TENCENTCLOUD_SECRETID");
  const secretKey = readRequired(values, "TENCENTCLOUD_SECRETKEY");
  const app = tcb.init({ env, secretId, secretKey });
  const collection = app.database().collection("conversations");
  let scanned = 0;
  let skipped = 0;
  let updated = 0;
  let offset = 0;

  console.log("M5 conversation index backfill");
  console.log(`Env: ${env}`);
  console.log("SecretId: [configured]");

  while (true) {
    const result = await collection.skip(offset).limit(batchSize).get();
    const conversations = Array.isArray(result.data) ? result.data : [];

    if (conversations.length === 0) {
      break;
    }

    for (const conversation of conversations) {
      scanned += 1;

      const docId = conversation._id ?? conversation.id;
      const indexFields = createIndexFields(conversation);

      if (typeof docId !== "string" || !indexFields) {
        skipped += 1;
        continue;
      }

      if (!needsBackfill(conversation, indexFields)) {
        continue;
      }

      await collection.doc(docId).update(indexFields);
      updated += 1;
    }

    offset += conversations.length;
  }

  console.log(`Scanned: ${scanned}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
}

main().catch((error) => {
  console.error("M5 conversation index backfill failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
