import { createHash, randomUUID as createRandomUUID } from "node:crypto";
import { link, lstat, mkdir, open, readFile, realpath, unlink } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import tcb from "@cloudbase/node-sdk";

export const PROD_CLOUDBASE_ENV_ID = "ungradu-edu-prod-d3efys1f5970e3f";
export const MANIFEST_ROOT = join(tmpdir(), "issue-0033-d2-cleanup-manifests");
export const PROFILE_APPROVAL_STATEMENT =
  "I confirm that both contact profiles are dedicated synthetic ISSUE-0033 D2 test profiles. This approval does not authorize production writes.";

const PROFILE_APPROVAL_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const PROFILE_APPROVAL_FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
const SYNTHETIC_FIXTURE_AUTHORIZATION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SYNTHETIC_FIXTURE_AUTHORIZATION_FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
const LEGACY_PAGE_SIZE = 100;
const LEGACY_MAX_PAGES = 1000;
const TARGET_COLLECTIONS = [
  "messages",
  "contact_exchange_requests",
  "conversations",
  "parent_needs"
];
const PRE_FIXTURE_PROBE_BUSINESS_ID_PATTERN =
  /^(message|contact-exchange|conversation|parent-need)-/;
const LEGACY_SOURCE_TYPES = ["parent-need", "tutor-profile"];
const LEGACY_SOURCE_COLLECTIONS = {
  "parent-need": "parent_needs",
  "tutor-profile": "tutor_profiles"
};
const LEGACY_SCAN_FIELDS = {
  parent_needs: [
    "_id", "id", "status", "version", "updatedAt", "managementState",
    "ownerUserId", "teacherGenderPreference", "subjects", "grade", "budgetMin",
    "budgetMax", "timeSlots", "region", "community", "childIntro"
  ],
  tutor_profiles: [
    "_id", "id", "status", "version", "updatedAt", "managementState",
    "ownerUserId", "gender", "school", "major", "subjects", "grades", "timeSlots",
    "feeRanges", "abilityDescription", "proofImages"
  ],
  conversations: [
    "_id", "id", "sourceId", "sourceType", "sourceStatus", "sourceVersion",
    "participantUserIds"
  ],
  messages: ["_id", "id", "conversationId", "senderUserId", "text"],
  contact_exchange_requests: [
    "_id", "id", "conversationId", "requesterUserId", "receiverUserId",
    "status", "sourceStatus", "sourceVersion", "approvalIdempotencyKey"
  ]
};
const POST_FIXTURE_SCAN_FIELDS = Object.freeze({
  parent_needs: [
    "_id", "id", "status", "version", "updatedAt", "managementState",
    "ownerUserId", "deletedAt", "community"
  ],
  tutor_profiles: [
    "_id", "id", "status", "version", "updatedAt", "managementState"
  ],
  conversations: [
    "_id", "id", "sourceId", "sourceType", "sourceStatus", "sourceVersion",
    "participantUserIds"
  ],
  messages: ["_id", "id", "conversationId", "senderUserId"],
  contact_exchange_requests: [
    "_id", "id", "conversationId", "requesterUserId", "receiverUserId",
    "status", "sourceStatus", "sourceVersion"
  ]
});
const SOURCE_MARKER_FIELDS = {
  "parent-need": [
    "teacherGenderPreference", "subjects", "grade", "budgetMin", "budgetMax",
    "timeSlots", "region", "community", "childIntro"
  ],
  "tutor-profile": [
    "gender", "school", "major", "subjects", "grades", "timeSlots", "feeRanges",
    "abilityDescription", "proofImages"
  ]
};
const PERMANENT_DENYLIST = {
  messages: [],
  contact_exchange_requests: [],
  conversations: ["conversation-d43e1f63-3096-4723-a8a7-35342dd36f37"],
  parent_needs: ["parent-need-63a85ca8-4501-4501-9a90-4b911f737d0b"]
};
const AUDIT_ACTIONS = ["create", "update", "delete", "restore", "update"];
const AUDIT_FROM = [
  null,
  { status: "published", version: 1 },
  { status: "published", version: 2 },
  { status: "deleted", version: 3 },
  { status: "published", version: 4 }
];
const AUDIT_TO = [
  { status: "published", version: 1 },
  { status: "published", version: 2 },
  { status: "deleted", version: 3 },
  { status: "published", version: 4 },
  { status: "published", version: 5 }
];
const RUN_MARKER_PATTERN =
  /^i33-d2-052-\d{8}T\d{6}Z-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RANDOM_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const APPROVAL_ID_PATTERN =
  /^issue-0033-d2-profile-approval-([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/i;
const SYNTHETIC_FIXTURE_MODE = "synthetic-fixture-lifecycle";
const SYNTHETIC_FIXTURE_PLAN_MODE = "synthetic-fixture-plan";
const SYNTHETIC_FIXTURE_AUTH_MODE = "synthetic-fixture-authorize";
const POST_FIXTURE_PREPARE_MODE = "post-fixture-prepare";
const POST_CLEANUP_VERIFY_MODE = "post-cleanup-verify";
const POST_CLEANUP_RECEIPT_SHA256_BY_MARKER = Object.freeze({
  "i33-d2-052-20260805T180555Z-c2329f57-81e7-45e3-b025-2887f4e66312":
    "4881ada73ca99b8c45515ebc362900d8451ab5888d622d7fd338d0b4df378cce"
});
const SYNTHETIC_FIXTURE_AUTH_KIND = "issue-0033-d2-synthetic-fixture-authorization";
const SYNTHETIC_FIXTURE_STEP_NAMES = [
  "preflight-absent",
  "source-create-v1",
  "source-update-v2",
  "conversation-create",
  "message-create",
  "contact-request-create",
  "contact-request-approve",
  "source-delete-v3",
  "deleted-gates",
  "source-restore-v4",
  "restored-gates",
  "source-update-v5",
  "final-verification"
];
const SYNTHETIC_FIXTURE_DOMAIN_EXPORTS = Object.freeze([
  "approveServerContactExchangeRequest",
  "createOrReadServerConversationFromSource",
  "createServerContactExchangeRequest",
  "deleteServerParentNeed",
  "readServerAuthorizedContactProfiles",
  "restoreServerParentNeed",
  "saveServerParentNeed",
  "sendServerConversationMessage",
  "updateServerParentNeed"
]);
const SYNTHETIC_FIXTURE_DOMAIN_FILES = Object.freeze({
  "@/features/parent-needs/parent-need": "features/parent-needs/parent-need.ts",
  "@/features/profile/contact-profile": "features/profile/contact-profile.ts",
  "@/server/contact-profiles": "server/contact-profiles.ts",
  "@/server/contact-exchange": "server/contact-exchange.ts",
  "@/server/conversations": "server/conversations.ts",
  "@/server/parent-needs": "server/parent-needs.ts"
});

let syntheticFixtureDomainPromise;

export async function loadD2SyntheticFixtureDomain() {
  if (!syntheticFixtureDomainPromise) {
    syntheticFixtureDomainPromise = (async () => {
      const { register } = await import("node:module");
      const codeRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
      const canonicalRoot = await realpath(codeRoot);
      const rootStat = await lstat(codeRoot);
      if (rootStat.isSymbolicLink() || !rootStat.isDirectory() || canonicalRoot !== codeRoot) {
        fail("SYNTHETIC_FIXTURE_DOMAIN_ROOT_UNSAFE");
      }
      const imported = await import("typescript");
      const ts = imported.default ?? imported;
      const sourceEntries = [];
      const aliasEntries = [];
      for (const [alias, relativePath] of Object.entries(SYNTHETIC_FIXTURE_DOMAIN_FILES)) {
        const candidate = resolve(codeRoot, relativePath);
        const stat = await lstat(candidate);
        const canonicalFile = await realpath(candidate);
        if (
          stat.isSymbolicLink() ||
          !stat.isFile() ||
          dirname(canonicalFile) === canonicalFile ||
          !canonicalFile.startsWith(`${canonicalRoot}\\`) ||
          canonicalFile !== candidate
        ) {
          fail("SYNTHETIC_FIXTURE_DOMAIN_PATH_UNSAFE");
        }
        const url = pathToFileURL(canonicalFile).href;
        const source = await readFile(canonicalFile, "utf8");
        const output = ts.transpileModule(source, {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.ReactJSX,
            esModuleInterop: true
          },
          fileName: canonicalFile,
          reportDiagnostics: false
        });
        aliasEntries.push([alias, url]);
        sourceEntries.push([url, output.outputText]);
      }
      const loaderSource = `
        let aliases;
        let sources;
        export async function initialize(data) {
          aliases = new Map(data.aliases);
          sources = new Map(data.sources);
        }
        export async function resolve(specifier) {
          const resolved = aliases.get(specifier) ?? (sources.has(specifier) ? specifier : null);
          if (!resolved) throw new Error("D2_DOMAIN_IMPORT_FORBIDDEN");
          return { url: resolved, shortCircuit: true };
        }
        export async function load(url) {
          if (!sources.has(url)) throw new Error("D2_DOMAIN_IMPORT_FORBIDDEN");
          return { format: "module", source: sources.get(url), shortCircuit: true };
        }
      `;
      register(`data:text/javascript,${encodeURIComponent(loaderSource)}`, {
        parentURL: import.meta.url,
        data: { aliases: aliasEntries, sources: sourceEntries }
      });
      const [parentNeeds, conversations, contactExchange] = await Promise.all([
        import(pathToFileURL(join(codeRoot, "server", "parent-needs.ts")).href),
        import(pathToFileURL(join(codeRoot, "server", "conversations.ts")).href),
        import(pathToFileURL(join(codeRoot, "server", "contact-exchange.ts")).href)
      ]);
      const domain = {
        approveServerContactExchangeRequest: contactExchange.approveServerContactExchangeRequest,
        createOrReadServerConversationFromSource:
          conversations.createOrReadServerConversationFromSource,
        createServerContactExchangeRequest: contactExchange.createServerContactExchangeRequest,
        deleteServerParentNeed: parentNeeds.deleteServerParentNeed,
        readServerAuthorizedContactProfiles: contactExchange.readServerAuthorizedContactProfiles,
        restoreServerParentNeed: parentNeeds.restoreServerParentNeed,
        saveServerParentNeed: parentNeeds.saveServerParentNeed,
        sendServerConversationMessage: conversations.sendServerConversationMessage,
        updateServerParentNeed: parentNeeds.updateServerParentNeed
      };
      for (const name of SYNTHETIC_FIXTURE_DOMAIN_EXPORTS) {
        if (typeof domain[name] !== "function") fail("SYNTHETIC_FIXTURE_DOMAIN_UNAVAILABLE");
      }
      return Object.freeze(domain);
    })().catch((error) => {
      syntheticFixtureDomainPromise = undefined;
      if (error instanceof D2CleanupError) throw error;
      fail("SYNTHETIC_FIXTURE_DOMAIN_UNAVAILABLE");
    });
  }
  return syntheticFixtureDomainPromise;
}

export class D2CleanupError extends Error {
  constructor(code, { collection, id, progress, residualManifest } = {}) {
    const suffix = collection
      ? ` collection=${collection}${id ? ` idLabel=${hashId(id)}` : ""}`
      : "";
    super(`D2C_${code}${suffix}`);
    this.name = "D2CleanupError";
    this.code = `D2C_${code}`;
    if (progress) this.progress = progress;
    if (residualManifest) this.residualManifest = residualManifest;
  }
}

function fail(code, collection, id) {
  throw new D2CleanupError(code, { collection, id });
}

function hashId(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function hashFull(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function createExecutionConfirmation(mode, runMarker, residualState) {
  const token = residualState?.resumeToken ?? "initial";
  return `D2C-EXECUTE:${mode}:${runMarker}:${token}`;
}

export function createSyntheticFixtureExecutionConfirmation({
  envId,
  expectedAuthorizationSha256,
  expectedFixturePlanSha256,
  ownerId,
  participantId,
  runMarker
}) {
  const identity = validatePrepareIdentity({ envId, ownerId, participantId, runMarker });
  if (!SHA256_PATTERN.test(expectedFixturePlanSha256 ?? "")) {
    fail("SYNTHETIC_FIXTURE_PLAN_SHA256_INVALID");
  }
  if (!SHA256_PATTERN.test(expectedAuthorizationSha256 ?? "")) {
    fail("SYNTHETIC_FIXTURE_AUTHORIZATION_SHA256_INVALID");
  }
  const digest = hashFull(JSON.stringify({
    mode: SYNTHETIC_FIXTURE_MODE,
    envId: identity.envId,
    runMarker: identity.runMarker,
    ownerId: identity.ownerId,
    participantId: identity.participantId,
    planSha256: expectedFixturePlanSha256.toLowerCase(),
    authorizationSha256: expectedAuthorizationSha256.toLowerCase()
  }));
  return `D2C-EXECUTE:${SYNTHETIC_FIXTURE_MODE}:${digest}`;
}

export function createD2SyntheticFixtureMachinePlan({
  envId,
  ownerId,
  participantId,
  runMarker
}) {
  const identity = validatePrepareIdentity({ envId, ownerId, participantId, runMarker });
  return {
    schemaVersion: 2,
    kind: "issue-0033-d2-synthetic-fixture-plan",
    mode: SYNTHETIC_FIXTURE_MODE,
    envId: identity.envId,
    runMarker: identity.runMarker,
    participants: {
      ownerId: identity.ownerId,
      participantId: identity.participantId
    },
    sourceType: "parent-need",
    targetLimits: {
      parent_needs: 1,
      conversations: 1,
      messages: 1,
      contact_exchange_requests: 1
    },
    lifecycle: [
      { action: "create", status: "published", version: 1 },
      { action: "update", status: "published", version: 2 },
      { action: "delete", status: "deleted", version: 3 },
      { action: "restore", status: "published", version: 4 },
      { action: "update", status: "published", version: 5 }
    ],
    expectedWrites: {
      sourceTransactions: 5,
      documentSetCalls: 20,
      targetDocuments: 4,
      auditDocumentsRetained: 5
    },
    authorizationRequirements: {
      bindingFields: [
        "mode", "envId", "runMarker", "ownerId", "participantId", "planSha256"
      ],
      preFixtureClaim: "EXACT_EXISTING_NON_LINK",
      lifecycleAuthorization: "EXTERNAL_ARTIFACT_SHA256_AND_EXCLUSIVE_LOCK",
      legacyBaseline: "DOUBLE_SNAPSHOT_EXACT_SET_MATCH",
      contactProfiles: "DOUBLE_SNAPSHOT_EXTERNAL_APPROVAL_EXACT_MATCH"
    },
    steps: SYNTHETIC_FIXTURE_STEP_NAMES.map((name, index) => ({
      index: index + 1,
      name
    })),
    failurePolicy: {
      automaticCleanup: false,
      automaticRetry: false,
      nextAction: "READ_ONLY_VERIFY"
    }
  };
}

export function deriveAuditId(sourceId, version) {
  if (!Number.isInteger(version) || version < 1 || version > 5) {
    fail("AUDIT_VERSION_INVALID");
  }
  return `parent-need-${sourceId}-${AUDIT_ACTIONS[version - 1]}-v${version}`;
}

function validateBoundedPath(path, expectedName, errorCode) {
  if (typeof path !== "string" || !path) fail(errorCode);
  const candidate = resolve(path);
  const root = resolve(MANIFEST_ROOT);
  if (dirname(candidate) !== root || basename(candidate) !== expectedName) {
    fail(errorCode);
  }
  return candidate;
}

function validateApprovalPath(path) {
  if (typeof path !== "string" || !path) fail("APPROVAL_PATH_INVALID");
  const candidate = resolve(path);
  const root = resolve(MANIFEST_ROOT);
  const name = basename(candidate);
  if (
    dirname(candidate) !== root ||
    !APPROVAL_ID_PATTERN.test(name.slice(0, -5)) ||
    !name.endsWith(".json")
  ) {
    fail("APPROVAL_PATH_INVALID");
  }
  return candidate;
}

export function parseCleanupArgs(argv) {
  const parsed = {
    approvalPath: undefined,
    authorizationPath: undefined,
    confirmExecute: undefined,
    envId: undefined,
    expectedApprovalSha256: undefined,
    expectedAuthorizationSha256: undefined,
    expectedFixturePlanSha256: undefined,
    manifestPath: undefined,
    mode: "dry-run",
    ownerId: undefined,
    participantId: undefined,
    prepareArtifactPath: undefined,
    resumeStatePath: undefined,
    runMarker: undefined
  };
  const valueFlags = new Map([
    ["--approval", "approvalPath"],
    ["--authorization", "authorizationPath"],
    ["--confirm-execute", "confirmExecute"],
    ["--env-id", "envId"],
    ["--expected-approval-sha256", "expectedApprovalSha256"],
    ["--expected-authorization-sha256", "expectedAuthorizationSha256"],
    ["--expected-fixture-plan-sha256", "expectedFixturePlanSha256"],
    ["--manifest", "manifestPath"],
    ["--mode", "mode"],
    ["--owner-id", "ownerId"],
    ["--participant-id", "participantId"],
    ["--prepare-artifact", "prepareArtifactPath"],
    ["--resume-state", "resumeStatePath"],
    ["--run-marker", "runMarker"]
  ]);

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const key = valueFlags.get(flag);
    if (!key) fail("CLI_ARGUMENT_INVALID");
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) fail("CLI_ARGUMENT_VALUE_MISSING");
    parsed[key] = value;
    index += 1;
  }

  if (![
    "prepare",
    POST_FIXTURE_PREPARE_MODE,
    POST_CLEANUP_VERIFY_MODE,
    "pre-fixture-probe",
    SYNTHETIC_FIXTURE_PLAN_MODE,
    SYNTHETIC_FIXTURE_AUTH_MODE,
    SYNTHETIC_FIXTURE_MODE,
    "dry-run",
    "probe",
    "cleanup"
  ].includes(parsed.mode)) {
    fail("MODE_INVALID");
  }
  if (!parsed.envId || !parsed.runMarker) fail("CLI_REQUIRED_ARGUMENT_MISSING");
  parsed.envId = parsed.envId.trim();
  parsed.runMarker = parsed.runMarker.trim();
  if (parsed.ownerId !== undefined) parsed.ownerId = parsed.ownerId.trim();
  if (parsed.participantId !== undefined) parsed.participantId = parsed.participantId.trim();
  if (!RUN_MARKER_PATTERN.test(parsed.runMarker)) fail("RUN_MARKER_INVALID");
  if (parsed.mode === "pre-fixture-probe") {
    if (
      parsed.approvalPath || parsed.authorizationPath || parsed.prepareArtifactPath ||
      !parsed.confirmExecute ||
      parsed.expectedApprovalSha256 || parsed.expectedAuthorizationSha256 ||
      parsed.expectedFixturePlanSha256 ||
      parsed.manifestPath ||
      parsed.ownerId ||
      parsed.participantId ||
      parsed.resumeStatePath
    ) {
      fail("PRE_FIXTURE_PROBE_ARGUMENT_FORBIDDEN");
    }
    return parsed;
  }
  if (parsed.mode === "prepare") {
    if (
      parsed.approvalPath || parsed.authorizationPath || parsed.prepareArtifactPath ||
      parsed.confirmExecute ||
      parsed.expectedApprovalSha256 || parsed.expectedAuthorizationSha256 ||
      parsed.expectedFixturePlanSha256 ||
      parsed.manifestPath ||
      parsed.resumeStatePath
    ) {
      fail("PREPARE_ARGUMENT_FORBIDDEN");
    }
    if (
      !parsed.ownerId ||
      !parsed.participantId ||
      parsed.ownerId === parsed.participantId
    ) {
      fail("PREPARE_PARTICIPANTS_INVALID");
    }
    return parsed;
  }
  if (parsed.mode === POST_FIXTURE_PREPARE_MODE) {
    if (
      parsed.approvalPath || parsed.authorizationPath || parsed.prepareArtifactPath ||
      parsed.confirmExecute ||
      parsed.expectedApprovalSha256 || parsed.expectedAuthorizationSha256 ||
      parsed.expectedFixturePlanSha256 ||
      parsed.resumeStatePath
    ) {
      fail("POST_FIXTURE_PREPARE_ARGUMENT_FORBIDDEN");
    }
    if (
      !parsed.ownerId ||
      !parsed.participantId ||
      parsed.ownerId === parsed.participantId ||
      !parsed.manifestPath
    ) {
      fail("POST_FIXTURE_PREPARE_ARGUMENT_INVALID");
    }
    parsed.manifestPath = validateBoundedPath(
      parsed.manifestPath,
      `${parsed.runMarker}.json`,
      "POST_FIXTURE_PREPARE_MANIFEST_PATH_INVALID"
    );
    return parsed;
  }
  if (parsed.mode === POST_CLEANUP_VERIFY_MODE) {
    if (
      parsed.authorizationPath || parsed.prepareArtifactPath || parsed.confirmExecute ||
      parsed.expectedAuthorizationSha256 || parsed.expectedFixturePlanSha256 ||
      parsed.resumeStatePath
    ) {
      fail("POST_CLEANUP_VERIFY_ARGUMENT_FORBIDDEN");
    }
    if (
      !parsed.ownerId || !parsed.participantId || parsed.ownerId === parsed.participantId ||
      !parsed.manifestPath || !parsed.approvalPath || !parsed.expectedApprovalSha256
    ) {
      fail("POST_CLEANUP_VERIFY_ARGUMENT_INVALID");
    }
    if (!SHA256_PATTERN.test(parsed.expectedApprovalSha256)) {
      fail("POST_CLEANUP_VERIFY_ARGUMENT_INVALID");
    }
    parsed.expectedApprovalSha256 = parsed.expectedApprovalSha256.toLowerCase();
    parsed.manifestPath = validateBoundedPath(
      parsed.manifestPath,
      `${parsed.runMarker}.json`,
      "POST_CLEANUP_VERIFY_MANIFEST_PATH_INVALID"
    );
    parsed.approvalPath = validateApprovalPath(parsed.approvalPath);
    return parsed;
  }
  if (parsed.mode === SYNTHETIC_FIXTURE_PLAN_MODE) {
    if (
      parsed.approvalPath || parsed.authorizationPath || parsed.prepareArtifactPath ||
      parsed.confirmExecute ||
      parsed.expectedApprovalSha256 || parsed.expectedAuthorizationSha256 ||
      parsed.expectedFixturePlanSha256 ||
      parsed.manifestPath ||
      parsed.resumeStatePath ||
      !parsed.ownerId ||
      !parsed.participantId ||
      parsed.ownerId === parsed.participantId
    ) {
      fail("SYNTHETIC_FIXTURE_PLAN_ARGUMENT_INVALID");
    }
    return parsed;
  }
  if (parsed.mode === SYNTHETIC_FIXTURE_AUTH_MODE) {
    if (
      !parsed.approvalPath || !parsed.expectedApprovalSha256 ||
      !parsed.expectedFixturePlanSha256 || !parsed.prepareArtifactPath ||
      !parsed.ownerId || !parsed.participantId || parsed.ownerId === parsed.participantId ||
      parsed.confirmExecute || parsed.authorizationPath || parsed.expectedAuthorizationSha256 ||
      parsed.manifestPath || parsed.resumeStatePath
    ) {
      fail("SYNTHETIC_FIXTURE_AUTHORIZATION_ARGUMENT_INVALID");
    }
    if (!SHA256_PATTERN.test(parsed.expectedApprovalSha256) ||
        !SHA256_PATTERN.test(parsed.expectedFixturePlanSha256)) {
      fail("SYNTHETIC_FIXTURE_AUTHORIZATION_ARGUMENT_INVALID");
    }
    parsed.expectedApprovalSha256 = parsed.expectedApprovalSha256.toLowerCase();
    parsed.expectedFixturePlanSha256 = parsed.expectedFixturePlanSha256.toLowerCase();
    parsed.approvalPath = validateApprovalPath(parsed.approvalPath);
    parsed.prepareArtifactPath = validateBoundedPath(
      parsed.prepareArtifactPath,
      `${parsed.runMarker}.prepare.json`,
      "PREPARE_OUTPUT_PATH_INVALID"
    );
    return parsed;
  }
  if (parsed.mode === SYNTHETIC_FIXTURE_MODE) {
    if (
      parsed.approvalPath || parsed.prepareArtifactPath ||
      parsed.expectedApprovalSha256 ||
      parsed.manifestPath ||
      parsed.resumeStatePath ||
      !parsed.confirmExecute ||
      !parsed.authorizationPath ||
      !parsed.expectedAuthorizationSha256 ||
      !parsed.expectedFixturePlanSha256 ||
      !parsed.ownerId ||
      !parsed.participantId ||
      parsed.ownerId === parsed.participantId
    ) {
      fail("CLI_REQUIRED_ARGUMENT_MISSING");
    }
    if (!SHA256_PATTERN.test(parsed.expectedFixturePlanSha256)) {
      fail("SYNTHETIC_FIXTURE_PLAN_SHA256_INVALID");
    }
    if (!SHA256_PATTERN.test(parsed.expectedAuthorizationSha256)) {
      fail("SYNTHETIC_FIXTURE_AUTHORIZATION_SHA256_INVALID");
    }
    parsed.expectedFixturePlanSha256 = parsed.expectedFixturePlanSha256.toLowerCase();
    parsed.expectedAuthorizationSha256 = parsed.expectedAuthorizationSha256.toLowerCase();
    parsed.authorizationPath = validateBoundedPath(
      parsed.authorizationPath,
      `${parsed.runMarker}.synthetic-fixture.authorization.json`,
      "SYNTHETIC_FIXTURE_AUTHORIZATION_PATH_INVALID"
    );
    return parsed;
  }
  if (parsed.ownerId || parsed.participantId || parsed.authorizationPath ||
      parsed.expectedAuthorizationSha256 || parsed.prepareArtifactPath) {
    fail("CLEANUP_ARGUMENT_FORBIDDEN");
  }
  if (parsed.expectedFixturePlanSha256) fail("CLEANUP_ARGUMENT_FORBIDDEN");
  if (!parsed.approvalPath || !parsed.expectedApprovalSha256 || !parsed.manifestPath) {
    fail("CLI_REQUIRED_ARGUMENT_MISSING");
  }
  if (!SHA256_PATTERN.test(parsed.expectedApprovalSha256)) fail("APPROVAL_SHA256_INVALID");
  parsed.expectedApprovalSha256 = parsed.expectedApprovalSha256.toLowerCase();
  parsed.manifestPath = validateBoundedPath(
    parsed.manifestPath,
    `${parsed.runMarker}.json`,
    "MANIFEST_PATH_INVALID"
  );
  parsed.approvalPath = validateApprovalPath(parsed.approvalPath);
  if (parsed.resumeStatePath) {
    if (parsed.mode !== "cleanup") fail("RESIDUAL_MANIFEST_MODE_INVALID");
    parsed.resumeStatePath = validateBoundedPath(
      parsed.resumeStatePath,
      `${parsed.runMarker}.resume.json`,
      "RESIDUAL_PATH_INVALID"
    );
  }
  return parsed;
}

function countAndFirst(result) {
  const data = result?.data;
  if (Array.isArray(data)) return { count: data.length, first: data[0] };
  return { count: data && typeof data === "object" ? 1 : 0, first: data };
}

function normalizeDeleted(value, collection, id) {
  if (value === 0 || value === "0") return 0;
  if (value === 1 || value === "1") return 1;
  fail("DELETE_RESULT_INVALID", collection, id);
}

function requireObject(value, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(code);
  return value;
}

function requireString(value, code) {
  if (typeof value !== "string" || !value) fail(code);
  return value;
}

function requireExactKeys(value, keys, code) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    fail(code);
  }
}

function validateTargetCollection(collection) {
  if (!TARGET_COLLECTIONS.includes(collection)) fail("TARGET_COLLECTION_INVALID");
  return collection;
}

function normalizeIdSet(ids, duplicateCode, invalidCode) {
  if (!Array.isArray(ids)) fail(invalidCode);
  const normalized = [];
  const seen = new Set();
  for (const id of ids) {
    requireString(id, invalidCode);
    if (seen.has(id)) fail(duplicateCode);
    seen.add(id);
    normalized.push(id);
  }
  return normalized.sort();
}

function validateManifest({ envId, manifest, runMarker }) {
  if (envId !== PROD_CLOUDBASE_ENV_ID) fail("ENV_NOT_PRODUCTION_CANONICAL");
  if (!RUN_MARKER_PATTERN.test(runMarker)) fail("RUN_MARKER_INVALID");
  const value = requireObject(manifest, "MANIFEST_INVALID");
  requireExactKeys(
    value,
    ["schemaVersion", "envId", "runMarker", "participants", "targets", "legacyDenylist"],
    "MANIFEST_SHAPE_INVALID"
  );
  if (value.schemaVersion !== 3) fail("MANIFEST_SCHEMA_INVALID");
  if (value.envId !== envId) fail("MANIFEST_ENV_MISMATCH");
  if (value.runMarker !== runMarker) fail("MANIFEST_MARKER_MISMATCH");

  const participants = requireObject(value.participants, "PARTICIPANTS_INVALID");
  requireExactKeys(participants, ["ownerId", "participantId"], "PARTICIPANTS_INVALID");
  const ownerId = requireString(participants.ownerId, "OWNER_ID_INVALID");
  const participantId = requireString(participants.participantId, "PARTICIPANT_ID_INVALID");
  if (ownerId === participantId) fail("PARTICIPANTS_NOT_DISTINCT");

  const targets = requireObject(value.targets, "TARGETS_INVALID");
  requireExactKeys(targets, TARGET_COLLECTIONS, "TARGET_ALLOWLIST_MISMATCH");
  for (const collection of TARGET_COLLECTIONS) {
    const target = requireObject(targets[collection], "TARGET_INVALID");
    requireExactKeys(target, ["id"], "TARGET_INVALID");
    requireString(target.id, "MANIFEST_ID_INVALID");
  }

  const legacyDenylist = requireObject(value.legacyDenylist, "LEGACY_DENYLIST_INVALID");
  requireExactKeys(legacyDenylist, TARGET_COLLECTIONS, "LEGACY_DENYLIST_INVALID");
  const allDenied = new Set();
  for (const collection of TARGET_COLLECTIONS) {
    const normalized = normalizeIdSet(
      legacyDenylist[collection],
      "LEGACY_DENYLIST_DUPLICATE",
      "LEGACY_DENYLIST_INVALID"
    );
    for (const permanentId of PERMANENT_DENYLIST[collection]) {
      if (!normalized.includes(permanentId)) fail("LEGACY_DENYLIST_PERMANENT_ID_MISSING");
    }
    for (const id of normalized) allDenied.add(id);
  }
  for (const collection of TARGET_COLLECTIONS) {
    const id = targets[collection].id;
    if (allDenied.has(id)) fail("DENYLIST_ID", collection, id);
  }
  return value;
}

function approvalBytes(value) {
  if (typeof value === "string") return Buffer.from(value, "utf8");
  if (value instanceof Uint8Array) return Buffer.from(value);
  fail("APPROVAL_ARTIFACT_INVALID");
}

function validateApprovalArtifact({
  approvalArtifactBytes,
  expectedApprovalSha256,
  manifest,
  now
}) {
  if (typeof expectedApprovalSha256 !== "string" || !SHA256_PATTERN.test(expectedApprovalSha256)) {
    fail("APPROVAL_SHA256_INVALID");
  }
  const bytes = approvalBytes(approvalArtifactBytes);
  if (hashFull(bytes) !== expectedApprovalSha256.toLowerCase()) fail("APPROVAL_HASH_MISMATCH");
  let envelope;
  try {
    envelope = JSON.parse(bytes.toString("utf8"));
  } catch {
    fail("APPROVAL_ARTIFACT_INVALID");
  }
  const value = requireObject(envelope, "APPROVAL_ARTIFACT_INVALID");
  requireExactKeys(
    value,
    ["schemaVersion", "approvalId", "statement", "profiles", "nonce", "issuedAt"],
    "APPROVAL_ARTIFACT_INVALID"
  );
  if (value.schemaVersion !== 1) fail("APPROVAL_SCHEMA_INVALID");
  const approvalId = requireString(value.approvalId, "APPROVAL_ID_INVALID");
  if (!APPROVAL_ID_PATTERN.test(approvalId)) fail("APPROVAL_ID_INVALID");
  const nonce = requireString(value.nonce, "APPROVAL_NONCE_INVALID");
  if (!RANDOM_UUID_PATTERN.test(nonce)) fail("APPROVAL_NONCE_INVALID");
  if (approvalId.endsWith(nonce)) fail("APPROVAL_NONCE_INVALID");
  if (value.statement !== PROFILE_APPROVAL_STATEMENT) fail("APPROVAL_STATEMENT_INVALID");
  const issuedAt = requireString(value.issuedAt, "APPROVAL_ISSUED_AT_INVALID");
  const issuedMs = Date.parse(issuedAt);
  const nowDate = typeof now === "function" ? now() : new Date();
  const nowMs = nowDate instanceof Date ? nowDate.getTime() : Number.NaN;
  if (
    !Number.isFinite(issuedMs) ||
    new Date(issuedMs).toISOString() !== issuedAt ||
    !Number.isFinite(nowMs)
  ) {
    fail("APPROVAL_ISSUED_AT_INVALID");
  }
  if (issuedMs - nowMs > PROFILE_APPROVAL_FUTURE_TOLERANCE_MS) fail("APPROVAL_TIME_INVALID");
  if (nowMs - issuedMs > PROFILE_APPROVAL_MAX_AGE_MS) fail("APPROVAL_EXPIRED");

  if (!Array.isArray(value.profiles) || value.profiles.length !== 2) {
    fail("APPROVAL_PROFILE_COUNT_INVALID");
  }
  const profilesByRole = new Map();
  const profileIds = new Set();
  for (const profile of value.profiles) {
    const item = requireObject(profile, "APPROVAL_PROFILE_INVALID");
    requireExactKeys(item, ["role", "id", "ownerUserId", "updatedAt"], "APPROVAL_PROFILE_INVALID");
    if (!["owner", "participant"].includes(item.role)) fail("APPROVAL_PROFILE_ROLE_INVALID");
    if (profilesByRole.has(item.role)) fail("APPROVAL_PROFILE_ROLE_DUPLICATE");
    const id = requireString(item.id, "APPROVAL_PROFILE_ID_INVALID");
    if (profileIds.has(id)) fail("APPROVAL_PROFILE_ID_DUPLICATE");
    profileIds.add(id);
    const profileOwner = requireString(item.ownerUserId, "APPROVAL_PROFILE_OWNER_INVALID");
    requireString(item.updatedAt, "APPROVAL_PROFILE_UPDATED_AT_INVALID");
    if (id !== profileOwner) fail("APPROVAL_PROFILE_ID_OWNER_MISMATCH");
    const expectedOwner = item.role === "owner"
      ? manifest.participants.ownerId
      : manifest.participants.participantId;
    if (profileOwner !== expectedOwner) fail("APPROVAL_PROFILE_PARTICIPANT_MISMATCH");
    profilesByRole.set(item.role, item);
  }
  if (!profilesByRole.has("owner") || !profilesByRole.has("participant")) {
    fail("APPROVAL_PROFILE_ROLE_MISSING");
  }
  return value;
}

function hasId(document, id) {
  return document.id === id || document._id === id;
}

function sameParticipants(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    [...actual].sort().every((id, index) => id === [...expected].sort()[index])
  );
}

function validateTargetDocument(collection, document, manifest) {
  const id = manifest.targets[collection].id;
  const sourceId = manifest.targets.parent_needs.id;
  const conversationId = manifest.targets.conversations.id;
  const { ownerId, participantId } = manifest.participants;
  if (!hasId(document, id)) fail("TARGET_ID_MISMATCH", collection, id);
  if (collection === "parent_needs") {
    if (
      document.ownerUserId !== ownerId ||
      document.status !== "published" ||
      document.version !== 5 ||
      typeof document.updatedAt !== "string" ||
      !String(document.community ?? "").includes(manifest.runMarker) ||
      !String(document.childIntro ?? "").includes(manifest.runMarker)
    ) {
      fail("SOURCE_CONTRACT_MISMATCH", collection, id);
    }
    return;
  }
  if (collection === "conversations") {
    if (
      document.sourceId !== sourceId ||
      document.sourceType !== "parent-need" ||
      document.sourceStatus !== "published" ||
      document.sourceVersion !== 5 ||
      !sameParticipants(document.participantUserIds, [ownerId, participantId])
    ) {
      fail("CONVERSATION_RELATION_MISMATCH", collection, id);
    }
    return;
  }
  if (collection === "messages") {
    if (
      document.conversationId !== conversationId ||
      ![ownerId, participantId].includes(document.senderUserId) ||
      !String(document.text ?? "").includes(manifest.runMarker)
    ) {
      fail("MESSAGE_RELATION_MISMATCH", collection, id);
    }
    return;
  }
  if (
    document.conversationId !== conversationId ||
    document.requesterUserId !== participantId ||
    document.receiverUserId !== ownerId ||
    document.status !== "approved" ||
    document.sourceStatus !== "published" ||
    document.sourceVersion !== 5
  ) {
    fail("REQUEST_RELATION_MISMATCH", collection, id);
  }
}

function matchesLifecycleEdge(actual, expected) {
  if (expected === null) return actual === null;
  return actual && typeof actual === "object" &&
    actual.status === expected.status && actual.version === expected.version;
}

function validateAuditDocument(document, version, manifest) {
  const sourceId = manifest.targets.parent_needs.id;
  const id = deriveAuditId(sourceId, version);
  if (
    !hasId(document, id) ||
    document.action !== AUDIT_ACTIONS[version - 1] ||
    document.result !== "success" ||
    document.targetId !== sourceId ||
    document.targetType !== "parent-need" ||
    document.actorUserId !== manifest.participants.ownerId ||
    typeof document.occurredAt !== "string" ||
    !document.occurredAt ||
    typeof document.requestId !== "string" ||
    !document.requestId ||
    !matchesLifecycleEdge(document.from, AUDIT_FROM[version - 1]) ||
    !matchesLifecycleEdge(document.to, AUDIT_TO[version - 1])
  ) {
    fail("AUDIT_CONTRACT_MISMATCH", "audit_events", id);
  }
}

const TARGET_FIELDS = {
  messages: ["_id", "id", "conversationId", "senderUserId", "text"],
  contact_exchange_requests: [
    "_id", "id", "conversationId", "requesterUserId", "receiverUserId",
    "status", "sourceStatus", "sourceVersion", "approvalIdempotencyKey"
  ],
  conversations: [
    "_id", "id", "participantUserIds", "sourceId", "sourceType",
    "sourceStatus", "sourceVersion"
  ],
  parent_needs: [
    "_id", "id", "ownerUserId", "status", "version", "updatedAt",
    "community", "childIntro"
  ]
};
const PROFILE_FIELDS = ["_id", "id", "ownerUserId", "updatedAt"];
const AUDIT_FIELDS = [
  "_id", "id", "action", "actorUserId", "occurredAt", "requestId",
  "result", "targetId", "targetType", "from", "to"
];

async function readOne(read, collection, id, events, stage) {
  const result = await read();
  const { count, first } = countAndFirst(result);
  events.push({ collection, count, idLabel: hashId(id), stage });
  if (count !== 1) fail("EXACT_COUNT_MISMATCH", collection, id);
  return requireObject(first, "DOCUMENT_INVALID");
}

function normalizeUniverseSnapshot(snapshot) {
  const value = requireObject(snapshot, "LEGACY_UNIVERSE_INVALID");
  requireExactKeys(value, ["complete", "collections"], "LEGACY_UNIVERSE_INVALID");
  if (value.complete !== true) fail("LEGACY_UNIVERSE_INCOMPLETE");
  const collections = requireObject(value.collections, "LEGACY_UNIVERSE_INVALID");
  requireExactKeys(collections, TARGET_COLLECTIONS, "LEGACY_UNIVERSE_INVALID");
  return Object.fromEntries(TARGET_COLLECTIONS.map((collection) => [
    collection,
    normalizeIdSet(
      collections[collection],
      "LEGACY_UNIVERSE_DUPLICATE",
      "LEGACY_UNIVERSE_INVALID"
    )
  ]));
}

function sameUniverse(left, right) {
  return TARGET_COLLECTIONS.every(
    (collection) => JSON.stringify(left[collection]) === JSON.stringify(right[collection])
  );
}

async function validateLegacyUniverse(adapter, manifest, events, stage) {
  let firstRaw;
  let secondRaw;
  try {
    firstRaw = await adapter.readLegacyUniverse();
    secondRaw = await adapter.readLegacyUniverse();
  } catch (error) {
    if (error instanceof D2CleanupError) throw error;
    fail("LEGACY_UNIVERSE_READ_FAILED");
  }
  const first = normalizeUniverseSnapshot(firstRaw);
  const second = normalizeUniverseSnapshot(secondRaw);
  if (!sameUniverse(first, second)) fail("LEGACY_UNIVERSE_UNSTABLE");
  const actualLegacy = {};
  const expectedLegacy = {};
  for (const collection of TARGET_COLLECTIONS) {
    const targetId = manifest.targets[collection].id;
    if (!first[collection].includes(targetId)) fail("LEGACY_UNIVERSE_TARGET_MISSING");
    actualLegacy[collection] = first[collection].filter((id) => id !== targetId);
    expectedLegacy[collection] = normalizeIdSet(
      manifest.legacyDenylist[collection],
      "LEGACY_DENYLIST_DUPLICATE",
      "LEGACY_DENYLIST_INVALID"
    );
  }
  if (!sameUniverse(actualLegacy, expectedLegacy)) fail("LEGACY_UNIVERSE_MISMATCH");
  for (const collection of TARGET_COLLECTIONS) {
    events.push({
      collection,
      count: actualLegacy[collection].length,
      idLabel: hashId(`legacy-universe:${collection}`),
      stage: `${stage}-legacy-universe`
    });
  }
}

async function validateProfiles(adapter, approval, events, stage) {
  for (const role of ["owner", "participant"]) {
    const profile = approval.profiles.find((item) => item.role === role);
    const document = await readOne(
      () => adapter.readContactProfile(role),
      "contact_profiles",
      profile.id,
      events,
      stage
    );
    if (
      !hasId(document, profile.id) ||
      document.ownerUserId !== profile.ownerUserId ||
      document.updatedAt !== profile.updatedAt
    ) {
      fail("CONTACT_PROFILE_MISMATCH", "contact_profiles", profile.id);
    }
  }
}

async function preflight(adapter, manifest, approval, targetCollections, stage) {
  const events = [];
  await validateLegacyUniverse(adapter, manifest, events, stage);
  for (const collection of targetCollections) {
    const id = manifest.targets[collection].id;
    const document = await readOne(
      () => adapter.readTarget(collection),
      collection,
      id,
      events,
      stage
    );
    validateTargetDocument(collection, document, manifest);
  }
  await validateProfiles(adapter, approval, events, stage);
  for (let version = 1; version <= 5; version += 1) {
    const id = deriveAuditId(manifest.targets.parent_needs.id, version);
    const document = await readOne(
      () => adapter.readAudit(version),
      "audit_events",
      id,
      events,
      stage
    );
    validateAuditDocument(document, version, manifest);
  }
  return events;
}

function validateCleanupUniverse(universe, manifest, completedCollections, remainingCollections) {
  const completed = new Set(completedCollections);
  const remaining = new Set(remainingCollections);
  const actualLegacy = {};
  const expectedLegacy = {};
  for (const collection of TARGET_COLLECTIONS) {
    const targetId = manifest.targets[collection].id;
    const targetPresent = universe[collection].includes(targetId);
    if (completed.has(collection) && targetPresent) {
      fail("CLEANUP_COMPLETED_TARGET_REAPPEARED", collection, targetId);
    }
    if (remaining.has(collection) && !targetPresent) {
      fail("CLEANUP_REMAINING_TARGET_MISSING", collection, targetId);
    }
    actualLegacy[collection] = universe[collection].filter((id) => id !== targetId);
    expectedLegacy[collection] = normalizeIdSet(
      manifest.legacyDenylist[collection],
      "LEGACY_DENYLIST_DUPLICATE",
      "LEGACY_DENYLIST_INVALID"
    );
  }
  if (!sameUniverse(actualLegacy, expectedLegacy)) fail("LEGACY_UNIVERSE_MISMATCH");
  return actualLegacy;
}

async function readCleanupState(adapter, manifest, approval, completedCollections, remainingCollections) {
  const events = [];
  let universeRaw;
  try {
    universeRaw = await adapter.readLegacyUniverse();
  } catch (error) {
    if (error instanceof D2CleanupError) throw error;
    fail("LEGACY_UNIVERSE_READ_FAILED");
  }
  const universe = normalizeUniverseSnapshot(universeRaw);
  const actualLegacy = validateCleanupUniverse(
    universe,
    manifest,
    completedCollections,
    remainingCollections
  );
  const completed = new Set(completedCollections);
  const targets = {};
  for (const collection of TARGET_COLLECTIONS) {
    const id = manifest.targets[collection].id;
    const result = countAndFirst(await adapter.readTarget(collection));
    events.push({ collection, count: result.count, idLabel: hashId(id), stage: "pre-delete" });
    if (completed.has(collection)) {
      if (result.count !== 0) fail("CLEANUP_COMPLETED_TARGET_REAPPEARED", collection, id);
      targets[collection] = null;
      continue;
    }
    if (result.count !== 1) fail("CLEANUP_REMAINING_TARGET_MISSING", collection, id);
    const document = requireObject(result.first, "DOCUMENT_INVALID");
    validateTargetDocument(collection, document, manifest);
    targets[collection] = hashFull(JSON.stringify(document));
  }

  const profiles = {};
  for (const role of ["owner", "participant"]) {
    const expected = approval.profiles.find((item) => item.role === role);
    const result = countAndFirst(await adapter.readContactProfile(role));
    events.push({
      collection: "contact_profiles",
      count: result.count,
      idLabel: hashId(expected.id),
      stage: "pre-delete"
    });
    if (result.count !== 1) fail("EXACT_COUNT_MISMATCH", "contact_profiles", expected.id);
    const document = requireObject(result.first, "DOCUMENT_INVALID");
    if (
      !hasId(document, expected.id) ||
      document.ownerUserId !== expected.ownerUserId ||
      document.updatedAt !== expected.updatedAt
    ) {
      fail("CONTACT_PROFILE_MISMATCH", "contact_profiles", expected.id);
    }
    profiles[role] = hashFull(JSON.stringify({
      id: document.id ?? document._id,
      ownerUserId: document.ownerUserId,
      updatedAt: document.updatedAt
    }));
  }

  const audits = {};
  for (let version = 1; version <= 5; version += 1) {
    const id = deriveAuditId(manifest.targets.parent_needs.id, version);
    const result = countAndFirst(await adapter.readAudit(version));
    events.push({ collection: "audit_events", count: result.count, idLabel: hashId(id), stage: "pre-delete" });
    if (result.count !== 1) fail("EXACT_COUNT_MISMATCH", "audit_events", id);
    const document = requireObject(result.first, "DOCUMENT_INVALID");
    validateAuditDocument(document, version, manifest);
    audits[version] = hashFull(JSON.stringify(document));
  }

  for (const collection of TARGET_COLLECTIONS) {
    events.push({
      collection,
      count: actualLegacy[collection].length,
      idLabel: hashId(`legacy-universe:${collection}`),
      stage: "pre-delete-legacy-universe"
    });
  }
  return {
    events,
    signature: JSON.stringify({ audits, profiles, targets, universe })
  };
}

async function validateCleanupState(adapter, manifest, approval, completedCollections, remainingCollections) {
  const first = await readCleanupState(
    adapter,
    manifest,
    approval,
    completedCollections,
    remainingCollections
  );
  const second = await readCleanupState(
    adapter,
    manifest,
    approval,
    completedCollections,
    remainingCollections
  );
  if (first.signature !== second.signature) fail("CLEANUP_STATE_UNSTABLE");
  return first.events;
}

function createResidualState(runMarker, completedCollections) {
  const residualCollections = TARGET_COLLECTIONS.slice(completedCollections.length);
  const resumeToken = hashFull(
    `D2C-RESUME|${runMarker}|${completedCollections.join(",")}|${residualCollections.join(",")}`
  );
  return {
    schemaVersion: 1,
    runMarkerHash: hashId(runMarker),
    completedCollections: [...completedCollections],
    residualCollections,
    resumeToken
  };
}

function validateResumeState(resumeState, runMarker) {
  if (!resumeState) return { completedCollections: [], residualCollections: TARGET_COLLECTIONS };
  const value = requireObject(resumeState, "RESIDUAL_MANIFEST_INVALID");
  requireExactKeys(
    value,
    ["schemaVersion", "runMarkerHash", "completedCollections", "residualCollections", "resumeToken"],
    "RESIDUAL_MANIFEST_INVALID"
  );
  if (value.schemaVersion !== 1 || value.runMarkerHash !== hashId(runMarker)) {
    fail("RESIDUAL_MANIFEST_INVALID");
  }
  const completed = value.completedCollections;
  const residual = value.residualCollections;
  if (
    !Array.isArray(completed) ||
    !Array.isArray(residual) ||
    completed.length >= TARGET_COLLECTIONS.length ||
    completed.some((item, index) => item !== TARGET_COLLECTIONS[index]) ||
    residual.some((item, index) => item !== TARGET_COLLECTIONS[completed.length + index]) ||
    completed.length + residual.length !== TARGET_COLLECTIONS.length
  ) {
    fail("RESIDUAL_MANIFEST_INVALID");
  }
  const expected = createResidualState(runMarker, completed);
  if (value.resumeToken !== expected.resumeToken) fail("RESIDUAL_TOKEN_INVALID");
  return value;
}

function requireExecutionConfirmation(mode, runMarker, confirmExecute, residualState) {
  if (confirmExecute !== createExecutionConfirmation(mode, runMarker, residualState)) {
    fail("EXECUTION_CONFIRMATION_REQUIRED");
  }
}

function attachPartialFailure(error, runMarker, completedCollections, failedCollection, events) {
  const failure = error instanceof D2CleanupError ? error : new D2CleanupError("TOOL_FAILED");
  failure.progress = {
    completedCollections: [...completedCollections],
    failedCollection,
    events
  };
  failure.residualManifest = createResidualState(runMarker, completedCollections);
  return failure;
}

function attachPreFixtureProbeFailure(error, completedCollections, failedCollection, events) {
  const failure = error instanceof D2CleanupError
    ? error
    : new D2CleanupError("PRE_FIXTURE_PROBE_OPERATION_FAILED");
  failure.progress = {
    completedCollections: [...completedCollections],
    failedCollection,
    events: [...events]
  };
  return failure;
}

function validatePreFixtureProbeAdapter(adapter) {
  const value = requireObject(adapter, "PRE_FIXTURE_PROBE_ADAPTER_INVALID");
  requireExactKeys(value, TARGET_COLLECTIONS, "PRE_FIXTURE_PROBE_ADAPTER_INVALID");
  for (const collection of TARGET_COLLECTIONS) {
    const operation = requireObject(
      value[collection],
      "PRE_FIXTURE_PROBE_ADAPTER_INVALID"
    );
    requireExactKeys(
      operation,
      ["idLabel", "read", "remove"],
      "PRE_FIXTURE_PROBE_ADAPTER_INVALID"
    );
    if (
      typeof operation.idLabel !== "string" ||
      !/^[0-9a-f]{12}$/.test(operation.idLabel) ||
      typeof operation.read !== "function" ||
      typeof operation.remove !== "function"
    ) {
      fail("PRE_FIXTURE_PROBE_ADAPTER_INVALID");
    }
  }
  return value;
}

const DEFAULT_PRE_FIXTURE_PROBE_CLAIM_IO = { lstat, mkdir, open, realpath };
const DEFAULT_SYNTHETIC_FIXTURE_CLAIM_IO = { lstat, readFile, realpath };

export async function claimPreFixtureProbeExecution(
  runMarker,
  { io = DEFAULT_PRE_FIXTURE_PROBE_CLAIM_IO } = {}
) {
  if (!RUN_MARKER_PATTERN.test(runMarker)) fail("RUN_MARKER_INVALID");
  for (const method of ["lstat", "mkdir", "open", "realpath"]) {
    if (typeof io?.[method] !== "function") fail("PRE_FIXTURE_PROBE_CLAIM_IO_INVALID");
  }
  const root = resolve(MANIFEST_ROOT);
  await io.mkdir(root, { recursive: true });
  const rootStat = await io.lstat(root);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    fail("PRE_FIXTURE_PROBE_CLAIM_ROOT_UNSAFE");
  }
  if (await io.realpath(root) !== root) fail("PRE_FIXTURE_PROBE_CLAIM_ROOT_UNSAFE");
  const claimPath = resolve(root, `${runMarker}.pre-fixture-probe.claim`);
  if (dirname(claimPath) !== root) fail("PRE_FIXTURE_PROBE_CLAIM_PATH_INVALID");

  let handle;
  try {
    handle = await io.open(claimPath, "wx", 0o600);
  } catch (error) {
    if (error?.code === "EEXIST") fail("PRE_FIXTURE_PROBE_ALREADY_CLAIMED");
    fail("PRE_FIXTURE_PROBE_CLAIM_FAILED");
  }
  try {
    await handle.writeFile("pre-fixture-probe-claimed\n", "utf8");
    await handle.sync();
    await handle.close();
  } catch {
    await handle.close().catch(() => undefined);
    fail("PRE_FIXTURE_PROBE_CLAIM_FAILED");
  }
}

export async function verifyPreFixtureProbeClaim(
  runMarker,
  { io = DEFAULT_SYNTHETIC_FIXTURE_CLAIM_IO } = {}
) {
  if (!RUN_MARKER_PATTERN.test(runMarker)) fail("RUN_MARKER_INVALID");
  for (const method of ["lstat", "readFile", "realpath"]) {
    if (typeof io?.[method] !== "function") fail("SYNTHETIC_FIXTURE_CLAIM_IO_INVALID");
  }
  const root = resolve(MANIFEST_ROOT);
  const claimPath = resolve(root, `${runMarker}.pre-fixture-probe.claim`);
  if (dirname(claimPath) !== root) fail("SYNTHETIC_FIXTURE_CLAIM_UNSAFE");

  let rootStat;
  let claimStat;
  try {
    [rootStat, claimStat] = await Promise.all([io.lstat(root), io.lstat(claimPath)]);
  } catch (error) {
    if (error?.code === "ENOENT") fail("SYNTHETIC_FIXTURE_CLAIM_MISSING");
    fail("SYNTHETIC_FIXTURE_CLAIM_UNSAFE");
  }
  if (
    rootStat.isSymbolicLink() ||
    !rootStat.isDirectory() ||
    claimStat.isSymbolicLink() ||
    !claimStat.isFile()
  ) {
    fail("SYNTHETIC_FIXTURE_CLAIM_UNSAFE");
  }
  let canonicalRoot;
  let canonicalClaim;
  let content;
  try {
    [canonicalRoot, canonicalClaim, content] = await Promise.all([
      io.realpath(root),
      io.realpath(claimPath),
      io.readFile(claimPath, "utf8")
    ]);
  } catch {
    fail("SYNTHETIC_FIXTURE_CLAIM_UNSAFE");
  }
  if (
    canonicalRoot !== root ||
    canonicalClaim !== claimPath ||
    dirname(canonicalClaim) !== canonicalRoot
  ) {
    fail("SYNTHETIC_FIXTURE_CLAIM_UNSAFE");
  }
  if (content !== "pre-fixture-probe-claimed\n") {
    fail("SYNTHETIC_FIXTURE_CLAIM_CONTENT_INVALID");
  }
  return claimPath;
}

export async function runD2PreFixtureProbe({
  adapter,
  claimExecution,
  confirmExecute,
  envId,
  runMarker
}) {
  if (envId !== PROD_CLOUDBASE_ENV_ID) fail("ENV_NOT_PRODUCTION_CANONICAL");
  if (!RUN_MARKER_PATTERN.test(runMarker)) fail("RUN_MARKER_INVALID");
  requireExecutionConfirmation("pre-fixture-probe", runMarker, confirmExecute);
  const operations = validatePreFixtureProbeAdapter(adapter);
  const claim = claimExecution ?? (() => claimPreFixtureProbeExecution(runMarker));
  if (typeof claim !== "function") fail("PRE_FIXTURE_PROBE_CLAIM_INVALID");
  try {
    await claim();
  } catch (error) {
    if (error instanceof D2CleanupError) throw error;
    fail("PRE_FIXTURE_PROBE_CLAIM_FAILED");
  }

  const completedCollections = [];
  const events = [];
  for (const collection of TARGET_COLLECTIONS) {
    const operation = operations[collection];
    try {
      const before = countAndFirst(await operation.read());
      events.push({
        collection,
        count: before.count,
        idLabel: operation.idLabel,
        stage: "pre-fixture-probe-pre-read"
      });
      if (before.count !== 0) fail("PRE_FIXTURE_PROBE_ID_NOT_EMPTY", collection);

      const deleted = normalizeDeleted(
        (await operation.remove())?.deleted,
        collection
      );
      events.push({
        collection,
        count: deleted,
        idLabel: operation.idLabel,
        stage: "pre-fixture-probe-remove"
      });
      if (deleted !== 0) {
        fail("PRE_FIXTURE_PROBE_DELETE_COUNT_MISMATCH", collection);
      }

      const after = countAndFirst(await operation.read());
      events.push({
        collection,
        count: after.count,
        idLabel: operation.idLabel,
        stage: "pre-fixture-probe-post-read"
      });
      if (after.count !== 0) {
        fail("PRE_FIXTURE_PROBE_POST_READ_NOT_EMPTY", collection);
      }
      completedCollections.push(collection);
    } catch (error) {
      throw attachPreFixtureProbeFailure(
        error,
        completedCollections,
        collection,
        events
      );
    }
  }
  return { events, ok: true, phase: "pre-fixture-probe-complete" };
}

function createSyntheticParentNeedInput(runMarker, version) {
  return {
    teacherGenderPreference: "不限",
    subjects: ["数学"],
    grade: "初一",
    budgetMin: "88",
    budgetMax: "108",
    timeSlots: ["周六上午"],
    region: {
      province: "广东省",
      city: "东莞市",
      district: "松山湖"
    },
    community: `合成测试位置-${runMarker}`,
    childIntro: `${runMarker} 合成测试需求 v${version}`
  };
}

function deriveSyntheticFixtureId(prefix, runMarker) {
  return `${prefix}-${hashFull(`${SYNTHETIC_FIXTURE_MODE}:${runMarker}:${prefix}`)}`;
}

function deriveSyntheticFixtureIds(runMarker) {
  return Object.freeze({
    conversationId: deriveSyntheticFixtureId("conversation", runMarker),
    messageId: deriveSyntheticFixtureId("message", runMarker),
    requestId: deriveSyntheticFixtureId("contact-exchange", runMarker),
    approvalIdempotencyKey: hashFull(`approve:${runMarker}`)
  });
}

const SYNTHETIC_FIXTURE_ADAPTER_METHODS = [
  "approveContactRequest",
  "countMessages",
  "countRequests",
  "createContactRequest",
  "createConversation",
  "createSource",
  "deleteSource",
  "hasAuthorizedProfiles",
  "readAudit",
  "readConversation",
  "readMessage",
  "readPreflightSnapshot",
  "readProfileProjection",
  "readRequest",
  "readSource",
  "restoreSource",
  "sendMessage",
  "updateSource"
];

function validateSyntheticFixtureAdapter(adapter) {
  const value = requireObject(adapter, "SYNTHETIC_FIXTURE_ADAPTER_INVALID");
  requireExactKeys(value, SYNTHETIC_FIXTURE_ADAPTER_METHODS, "SYNTHETIC_FIXTURE_ADAPTER_INVALID");
  for (const method of SYNTHETIC_FIXTURE_ADAPTER_METHODS) {
    if (typeof value[method] !== "function") fail("SYNTHETIC_FIXTURE_ADAPTER_INVALID");
  }
  return value;
}

function requireSyntheticSuccess(result, code) {
  if (!result || result.ok !== true || !result.value || typeof result.value !== "object") {
    fail(code);
  }
  return result.value;
}

function requireSyntheticBlocked(result, code) {
  if (!result || result.ok !== false || result.status !== 403 || result.value !== null) {
    fail(code);
  }
}

function requireSyntheticDocument(result, collection, id) {
  const { count, first } = countAndFirst(result);
  if (count !== 1) fail("SYNTHETIC_FIXTURE_EXACT_COUNT_MISMATCH", collection, id);
  const document = requireObject(first, "SYNTHETIC_FIXTURE_DOCUMENT_INVALID");
  if (!hasId(document, id)) fail("SYNTHETIC_FIXTURE_ID_MISMATCH", collection, id);
  return document;
}

function validateSyntheticSource(document, { ownerId, runMarker, sourceId, status, version }) {
  if (
    !hasId(document, sourceId) ||
    document.ownerUserId !== ownerId ||
    document.status !== status ||
    document.version !== version ||
    typeof document.updatedAt !== "string" ||
    !String(document.community ?? "").includes(runMarker) ||
    !String(document.childIntro ?? "").includes(runMarker)
  ) {
    fail("SYNTHETIC_FIXTURE_SOURCE_STATE_MISMATCH", "parent_needs", sourceId);
  }
}

function validateSyntheticConversation(
  document,
  { conversationId, ownerId, participantId, sourceId, sourceStatus, sourceVersion }
) {
  if (
    !hasId(document, conversationId) ||
    document.sourceId !== sourceId ||
    document.sourceType !== "parent-need" ||
    !sameParticipants(document.participantUserIds, [ownerId, participantId]) ||
    (sourceStatus !== undefined && document.sourceStatus !== sourceStatus) ||
    (sourceVersion !== undefined && document.sourceVersion !== sourceVersion)
  ) {
    fail("SYNTHETIC_FIXTURE_CONVERSATION_MISMATCH", "conversations", conversationId);
  }
}

function createSyntheticResidual({ capturedTargets, completedSteps, ownerId, participantId, runMarker }) {
  return {
    schemaVersion: 1,
    kind: "issue-0033-d2-synthetic-fixture-residual",
    runMarker,
    participants: { ownerId, participantId },
    completedSteps: [...completedSteps],
    capturedTargets: structuredClone(capturedTargets),
    permittedNextAction: "READ_ONLY_VERIFY"
  };
}

function attachSyntheticFixtureFailure(
  error,
  { capturedTargets, completedSteps, failedStep, ownerId, participantId, runMarker }
) {
  const failure = error instanceof D2CleanupError
    ? error
    : new D2CleanupError("SYNTHETIC_FIXTURE_OPERATION_FAILED");
  failure.progress = {
    completedSteps: [...completedSteps],
    failedStep
  };
  failure.residualManifest = createSyntheticResidual({
    capturedTargets,
    completedSteps,
    ownerId,
    participantId,
    runMarker
  });
  return failure;
}

async function runD2SyntheticFixtureLifecycleCore({
  adapter,
  authorizationLease,
  confirmExecute,
  envId,
  expectedFixturePlanSha256,
  now = () => new Date(),
  ownerId,
  participantId,
  runMarker
}) {
  const identity = validatePrepareIdentity({ envId, ownerId, participantId, runMarker });
  const plan = createD2SyntheticFixtureMachinePlan(identity);
  const planSha256 = hashFull(JSON.stringify(plan));
  if (
    typeof expectedFixturePlanSha256 !== "string" ||
    !SHA256_PATTERN.test(expectedFixturePlanSha256) ||
    planSha256 !== expectedFixturePlanSha256.toLowerCase()
  ) {
    fail("SYNTHETIC_FIXTURE_PLAN_HASH_MISMATCH");
  }
  const lease = requireObject(authorizationLease, "SYNTHETIC_FIXTURE_AUTHORIZATION_REQUIRED");
  requireExactKeys(lease, ["authorization", "authorizationSha256", "finalize"],
    "SYNTHETIC_FIXTURE_AUTHORIZATION_REQUIRED");
  if (typeof lease.finalize !== "function" || !SHA256_PATTERN.test(lease.authorizationSha256 ?? "")) {
    fail("SYNTHETIC_FIXTURE_AUTHORIZATION_REQUIRED");
  }
  const authorization = lease.authorization;
  if (
    authorization?.envId !== identity.envId ||
    authorization?.runMarker !== identity.runMarker ||
    authorization?.participants?.ownerId !== identity.ownerId ||
    authorization?.participants?.participantId !== identity.participantId ||
    authorization?.planSha256 !== planSha256
  ) {
    fail("SYNTHETIC_FIXTURE_AUTHORIZATION_BINDING_MISMATCH");
  }
  const expectedConfirmation = createSyntheticFixtureExecutionConfirmation({
    ...identity,
    expectedAuthorizationSha256: lease.authorizationSha256,
    expectedFixturePlanSha256: planSha256
  });
  if (confirmExecute !== expectedConfirmation) fail("EXECUTION_CONFIRMATION_REQUIRED");
  const operations = validateSyntheticFixtureAdapter(adapter);

  const baseTime = now();
  if (!(baseTime instanceof Date) || !Number.isFinite(baseTime.getTime())) {
    fail("SYNTHETIC_FIXTURE_TIME_INVALID");
  }
  let timeOffset = 0;
  const nextTime = () => new Date(baseTime.getTime() + timeOffset++ * 1000).toISOString();
  const completedSteps = [];
  const capturedTargets = {
    messages: null,
    contact_exchange_requests: null,
    conversations: null,
    parent_needs: null
  };
  const events = [];
  let sourceId = "";
  let conversationId = "";
  let messageId = "";
  let requestId = "";
  let legacyDenylist;
  const auditIds = [];
  const deterministicIds = deriveSyntheticFixtureIds(identity.runMarker);

  const validateLifecycleAudit = async (version) => {
    const auditId = deriveAuditId(sourceId, version);
    validateAuditDocument(
      requireSyntheticDocument(
        await operations.readAudit(sourceId, version), "audit_events", auditId
      ),
      version,
      {
        targets: { parent_needs: { id: sourceId } },
        participants: { ownerId: identity.ownerId }
      }
    );
    if (!auditIds.includes(auditId)) auditIds.push(auditId);
  };

  const executeStep = async (name, operation) => {
    try {
      const value = await operation();
      completedSteps.push(name);
      events.push({ stage: name, status: "complete" });
      return value;
    } catch (error) {
      throw attachSyntheticFixtureFailure(error, {
        capturedTargets,
        completedSteps,
        failedStep: name,
        ownerId: identity.ownerId,
        participantId: identity.participantId,
        runMarker
      });
    }
  };

  await executeStep("preflight-absent", async () => {
    const first = normalizePrepareDiscovery(await operations.readPreflightSnapshot());
    const second = normalizePrepareDiscovery(await operations.readPreflightSnapshot());
    if (
      first.completeness !== "COMPLETE" ||
      first.targetState !== "ABSENT" ||
      JSON.stringify(first) !== JSON.stringify(second) ||
      Object.values(first.targets).some(Boolean)
    ) {
      fail("SYNTHETIC_FIXTURE_PREFLIGHT_NOT_ABSENT");
    }
    if (
      JSON.stringify(first.legacyDenylist) !== JSON.stringify(authorization.legacyDenylist) ||
      hashFull(JSON.stringify(first.legacyDenylist)) !== authorization.legacyBaselineSha256
    ) {
      fail("SYNTHETIC_FIXTURE_LEGACY_BASELINE_DRIFT");
    }
    const liveProfiles = [];
    for (const [role, expectedOwnerId] of [
      ["owner", identity.ownerId],
      ["participant", identity.participantId]
    ]) {
      const profileFirst = normalizePrepareProfile(
        await operations.readProfileProjection(role), role, expectedOwnerId
      );
      const profileSecond = normalizePrepareProfile(
        await operations.readProfileProjection(role), role, expectedOwnerId
      );
      if (JSON.stringify(profileFirst) !== JSON.stringify(profileSecond)) {
        fail("SYNTHETIC_FIXTURE_PROFILE_UNSTABLE");
      }
      liveProfiles.push(profileFirst);
    }
    if (JSON.stringify(liveProfiles) !== JSON.stringify(authorization.profileProjections)) {
      fail("SYNTHETIC_FIXTURE_PROFILE_APPROVAL_DRIFT");
    }
    legacyDenylist = first.legacyDenylist;
  });

  await executeStep("source-create-v1", async () => {
    const source = requireSyntheticSuccess(await operations.createSource({
      input: createSyntheticParentNeedInput(runMarker, 1),
      now: nextTime()
    }), "SYNTHETIC_FIXTURE_SOURCE_CREATE_FAILED");
    sourceId = requireString(source.id, "SYNTHETIC_FIXTURE_SOURCE_ID_INVALID");
    capturedTargets.parent_needs = { id: sourceId };
    const document = requireSyntheticDocument(
      await operations.readSource(sourceId), "parent_needs", sourceId
    );
    validateSyntheticSource(document, {
      ownerId: identity.ownerId, runMarker, sourceId, status: "published", version: 1
    });
    await validateLifecycleAudit(1);
  });

  await executeStep("source-update-v2", async () => {
    requireSyntheticSuccess(await operations.updateSource({
      expectedVersion: 1,
      id: sourceId,
      input: createSyntheticParentNeedInput(runMarker, 2),
      now: nextTime()
    }), "SYNTHETIC_FIXTURE_SOURCE_UPDATE_FAILED");
    validateSyntheticSource(
      requireSyntheticDocument(await operations.readSource(sourceId), "parent_needs", sourceId),
      { ownerId: identity.ownerId, runMarker, sourceId, status: "published", version: 2 }
    );
    await validateLifecycleAudit(2);
  });

  await executeStep("conversation-create", async () => {
    conversationId = deterministicIds.conversationId;
    capturedTargets.conversations = { id: conversationId };
    const conversation = requireSyntheticSuccess(await operations.createConversation({
      now: nextTime(), preallocatedId: conversationId, sourceId, sourceType: "parent-need"
    }), "SYNTHETIC_FIXTURE_CONVERSATION_CREATE_FAILED");
    if (conversation.id !== conversationId) fail("SYNTHETIC_FIXTURE_CONVERSATION_ID_INVALID");
    validateSyntheticConversation(
      requireSyntheticDocument(
        await operations.readConversation(conversationId), "conversations", conversationId
      ),
      {
        conversationId,
        ownerId: identity.ownerId,
        participantId: identity.participantId,
        sourceId
      }
    );
  });

  await executeStep("message-create", async () => {
    if (await operations.countMessages(conversationId) !== 0) {
      fail("SYNTHETIC_FIXTURE_MESSAGE_PRECOUNT_MISMATCH");
    }
    messageId = deterministicIds.messageId;
    capturedTargets.messages = { id: messageId };
    const message = requireSyntheticSuccess(await operations.sendMessage({
      conversationId,
      now: nextTime(),
      preallocatedId: messageId,
      text: `${runMarker} 合成站内消息`
    }), "SYNTHETIC_FIXTURE_MESSAGE_CREATE_FAILED");
    if (message.id !== messageId) fail("SYNTHETIC_FIXTURE_MESSAGE_ID_INVALID");
    const document = requireSyntheticDocument(
      await operations.readMessage(messageId), "messages", messageId
    );
    if (
      document.conversationId !== conversationId ||
      document.senderUserId !== identity.participantId ||
      !String(document.text ?? "").includes(runMarker) ||
      await operations.countMessages(conversationId) !== 1
    ) {
      fail("SYNTHETIC_FIXTURE_MESSAGE_MISMATCH", "messages", messageId);
    }
  });

  await executeStep("contact-request-create", async () => {
    if (await operations.countRequests(conversationId) !== 0) {
      fail("SYNTHETIC_FIXTURE_REQUEST_PRECOUNT_MISMATCH");
    }
    requestId = deterministicIds.requestId;
    capturedTargets.contact_exchange_requests = { id: requestId };
    const request = requireSyntheticSuccess(await operations.createContactRequest({
      conversationId,
      now: nextTime(),
      preallocatedId: requestId
    }), "SYNTHETIC_FIXTURE_REQUEST_CREATE_FAILED");
    if (request.id !== requestId) fail("SYNTHETIC_FIXTURE_REQUEST_ID_INVALID");
    const document = requireSyntheticDocument(
      await operations.readRequest(requestId), "contact_exchange_requests", requestId
    );
    if (
      document.conversationId !== conversationId ||
      document.requesterUserId !== identity.participantId ||
      document.receiverUserId !== identity.ownerId ||
      document.status !== "pending" ||
      await operations.countRequests(conversationId) !== 1
    ) {
      fail("SYNTHETIC_FIXTURE_REQUEST_MISMATCH", "contact_exchange_requests", requestId);
    }
  });

  await executeStep("contact-request-approve", async () => {
    requireSyntheticSuccess(await operations.approveContactRequest({
      approvalIdempotencyKey: deterministicIds.approvalIdempotencyKey,
      now: nextTime(), requestId, secondConfirmation: true
    }), "SYNTHETIC_FIXTURE_REQUEST_APPROVE_FAILED");
    const document = requireSyntheticDocument(
      await operations.readRequest(requestId), "contact_exchange_requests", requestId
    );
    if (document.status !== "approved" || !(await operations.hasAuthorizedProfiles(conversationId))) {
      fail("SYNTHETIC_FIXTURE_AUTHORIZATION_MISMATCH");
    }
  });

  await executeStep("source-delete-v3", async () => {
    requireSyntheticSuccess(await operations.deleteSource({
      expectedVersion: 2,
      id: sourceId,
      idempotencyKey: `d2-delete-${runMarker}`,
      now: nextTime()
    }), "SYNTHETIC_FIXTURE_SOURCE_DELETE_FAILED");
    validateSyntheticSource(
      requireSyntheticDocument(await operations.readSource(sourceId), "parent_needs", sourceId),
      { ownerId: identity.ownerId, runMarker, sourceId, status: "deleted", version: 3 }
    );
    validateSyntheticConversation(
      requireSyntheticDocument(
        await operations.readConversation(conversationId), "conversations", conversationId
      ),
      {
        conversationId,
        ownerId: identity.ownerId,
        participantId: identity.participantId,
        sourceId,
        sourceStatus: "deleted",
        sourceVersion: 3
      }
    );
    const request = requireSyntheticDocument(
      await operations.readRequest(requestId), "contact_exchange_requests", requestId
    );
    if (request.sourceStatus !== "deleted" || request.sourceVersion !== 3) {
      fail("SYNTHETIC_FIXTURE_REQUEST_SOURCE_STATE_MISMATCH");
    }
    await validateLifecycleAudit(3);
  });

  let deletedMessageStatus;
  let deletedContactStatus;
  let deletedAuthorizedProfilesVisible;
  await executeStep("deleted-gates", async () => {
    const messageCount = await operations.countMessages(conversationId);
    const requestCount = await operations.countRequests(conversationId);
    const blockedMessage = await operations.sendMessage({
      conversationId,
      now: nextTime(),
      text: `${runMarker} 删除态禁止写入`
    });
    const blockedContact = await operations.createContactRequest({
      conversationId,
      now: nextTime()
    });
    requireSyntheticBlocked(blockedMessage, "SYNTHETIC_FIXTURE_DELETED_MESSAGE_NOT_BLOCKED");
    requireSyntheticBlocked(blockedContact, "SYNTHETIC_FIXTURE_DELETED_CONTACT_NOT_BLOCKED");
    deletedMessageStatus = blockedMessage.status;
    deletedContactStatus = blockedContact.status;
    deletedAuthorizedProfilesVisible = await operations.hasAuthorizedProfiles(conversationId);
    if (
      deletedAuthorizedProfilesVisible ||
      await operations.countMessages(conversationId) !== messageCount ||
      await operations.countRequests(conversationId) !== requestCount
    ) {
      fail("SYNTHETIC_FIXTURE_DELETED_GATE_SIDE_EFFECT");
    }
  });

  await executeStep("source-restore-v4", async () => {
    requireSyntheticSuccess(await operations.restoreSource({
      expectedVersion: 3,
      id: sourceId,
      idempotencyKey: `d2-restore-${runMarker}`,
      now: nextTime()
    }), "SYNTHETIC_FIXTURE_SOURCE_RESTORE_FAILED");
    validateSyntheticSource(
      requireSyntheticDocument(await operations.readSource(sourceId), "parent_needs", sourceId),
      { ownerId: identity.ownerId, runMarker, sourceId, status: "published", version: 4 }
    );
    await validateLifecycleAudit(4);
  });

  let restoredAuthorizedProfilesVisible;
  await executeStep("restored-gates", async () => {
    restoredAuthorizedProfilesVisible = await operations.hasAuthorizedProfiles(conversationId);
    if (
      !restoredAuthorizedProfilesVisible ||
      await operations.countMessages(conversationId) !== 1 ||
      await operations.countRequests(conversationId) !== 1
    ) {
      fail("SYNTHETIC_FIXTURE_RESTORED_GATE_MISMATCH");
    }
  });

  await executeStep("source-update-v5", async () => {
    requireSyntheticSuccess(await operations.updateSource({
      expectedVersion: 4,
      id: sourceId,
      input: createSyntheticParentNeedInput(runMarker, 5),
      now: nextTime()
    }), "SYNTHETIC_FIXTURE_SOURCE_FINAL_UPDATE_FAILED");
    validateSyntheticSource(
      requireSyntheticDocument(await operations.readSource(sourceId), "parent_needs", sourceId),
      { ownerId: identity.ownerId, runMarker, sourceId, status: "published", version: 5 }
    );
    await validateLifecycleAudit(5);
  });

  const manifest = {
    schemaVersion: 3,
    envId: identity.envId,
    runMarker,
    participants: { ownerId: identity.ownerId, participantId: identity.participantId },
    targets: structuredClone(capturedTargets),
    legacyDenylist
  };
  await executeStep("final-verification", async () => {
    validateManifest({ envId: identity.envId, manifest, runMarker });
    for (const collection of TARGET_COLLECTIONS) {
      const id = manifest.targets[collection].id;
      const reader = {
        messages: operations.readMessage,
        contact_exchange_requests: operations.readRequest,
        conversations: operations.readConversation,
        parent_needs: operations.readSource
      }[collection];
      validateTargetDocument(
        collection,
        requireSyntheticDocument(await reader(id), collection, id),
        manifest
      );
    }
    for (let version = 1; version <= 5; version += 1) {
      const auditId = deriveAuditId(sourceId, version);
      validateAuditDocument(
        requireSyntheticDocument(
          await operations.readAudit(sourceId, version), "audit_events", auditId
        ),
        version,
        manifest
      );
    }
  });

  return {
    ok: true,
    phase: "synthetic-fixture-complete",
    planSha256,
    manifest,
    auditIds,
    lifecycle: { status: "published", version: 5 },
    gates: {
      deletedMessageStatus,
      deletedContactStatus,
      deletedAuthorizedProfilesVisible,
      restoredAuthorizedProfilesVisible
    },
    events
  };
}

async function runD2SyntheticFixtureLifecycle(input) {
  try {
    const result = await runD2SyntheticFixtureLifecycleCore(input);
    await input.authorizationLease.finalize({
      phase: "complete",
      planSha256: result.planSha256,
      targetLabels: Object.fromEntries(TARGET_COLLECTIONS.map((collection) => [
        collection,
        hashId(result.manifest.targets[collection].id)
      ]))
    });
    return result;
  } catch (error) {
    if (typeof input?.authorizationLease?.finalize === "function") {
      await input.authorizationLease.finalize({
        phase: "failed",
        failure: safeFailurePayload(error)
      }).catch(() => undefined);
    }
    throw error;
  }
}

export async function runD2SyntheticFixtureLifecycleForTest(input) {
  if (process.env.NODE_ENV !== "test") fail("SYNTHETIC_FIXTURE_TEST_SEAM_FORBIDDEN");
  return runD2SyntheticFixtureLifecycle(input);
}

async function runProbe(adapter, manifest, events, randomUUID) {
  const probeIds = TARGET_COLLECTIONS.map(() => randomUUID());
  if (
    probeIds.some((id) => !RANDOM_UUID_PATTERN.test(id)) ||
    new Set(probeIds).size !== TARGET_COLLECTIONS.length
  ) {
    fail("PROBE_UUID_INVALID");
  }
  for (let index = 0; index < TARGET_COLLECTIONS.length; index += 1) {
    const collection = TARGET_COLLECTIONS[index];
    const id = `probe-${manifest.runMarker}-${probeIds[index]}`;
    const existing = countAndFirst(await adapter.readProbe(collection, id));
    events.push({ collection, count: existing.count, idLabel: hashId(id), stage: "probe-preflight" });
    if (existing.count !== 0) fail("PROBE_ID_NOT_EMPTY", collection, id);
    const deleted = normalizeDeleted((await adapter.removeProbe(collection, id))?.deleted, collection, id);
    events.push({ collection, count: deleted, idLabel: hashId(id), stage: "probe" });
    if (deleted !== 0) fail("PROBE_DELETE_COUNT_MISMATCH", collection, id);
  }
  return events;
}

async function runCleanup(adapter, manifest, approval, initialEvents, resumeState) {
  const events = [...initialEvents];
  const completedCollections = [...resumeState.completedCollections];
  for (const collection of resumeState.residualCollections) {
    const remaining = TARGET_COLLECTIONS.slice(completedCollections.length);
    try {
      events.push(...await validateCleanupState(
        adapter,
        manifest,
        approval,
        completedCollections,
        remaining
      ));
      const id = manifest.targets[collection].id;
      let removeAttempted = false;
      try {
        removeAttempted = true;
        const deleted = normalizeDeleted((await adapter.removeTarget(collection))?.deleted, collection, id);
        events.push({ collection, count: deleted, idLabel: hashId(id), stage: "cleanup" });
        if (deleted !== 1) fail("CLEANUP_DELETE_COUNT_MISMATCH", collection, id);
        const verification = countAndFirst(await adapter.readTarget(collection));
        events.push({
          collection,
          count: verification.count,
          idLabel: hashId(id),
          stage: "verify-removed"
        });
        if (verification.count !== 0) fail("CLEANUP_RESIDUAL_DOCUMENT", collection, id);
      } catch (error) {
        if (removeAttempted) {
          const committed = countAndFirst(await adapter.readTarget(collection));
          events.push({
            collection,
            count: committed.count,
            idLabel: hashId(id),
            stage: "verify-remove-failure"
          });
          if (committed.count === 0) completedCollections.push(collection);
        }
        throw error;
      }
      completedCollections.push(collection);
    } catch (error) {
      throw attachPartialFailure(error, manifest.runMarker, completedCollections, collection, events);
    }
  }
  return events;
}

export async function runD2Cleanup({
  adapter,
  approvalArtifactBytes,
  confirmExecute,
  envId,
  expectedApprovalSha256,
  manifest,
  mode = "dry-run",
  now = () => new Date(),
  randomUUID = createRandomUUID,
  resumeState,
  runMarker
}) {
  if (!["dry-run", "probe", "cleanup"].includes(mode)) fail("MODE_INVALID");
  const validatedManifest = validateManifest({ envId, manifest, runMarker });
  const approval = validateApprovalArtifact({
    approvalArtifactBytes,
    expectedApprovalSha256,
    manifest: validatedManifest,
    now
  });
  if (mode !== "cleanup" && resumeState) fail("RESIDUAL_MANIFEST_MODE_INVALID");
  if (mode === "probe") {
    requireExecutionConfirmation(mode, runMarker, confirmExecute);
    const events = [];
    await validateLegacyUniverse(adapter, validatedManifest, events, "probe");
    await validateProfiles(adapter, approval, events, "probe");
    return { events: await runProbe(adapter, validatedManifest, events, randomUUID), ok: true, phase: "probe-complete" };
  }
  if (mode === "cleanup") {
    const validatedResume = validateResumeState(resumeState, runMarker);
    requireExecutionConfirmation(mode, runMarker, confirmExecute, resumeState);
    if (validatedResume.residualCollections.length === 0) fail("CLEANUP_ALREADY_COMPLETE");
    const initialEvents = [];
    const events = await runCleanup(adapter, validatedManifest, approval, initialEvents, validatedResume);
    return { events, ok: true, phase: "cleanup-complete" };
  }
  const events = await preflight(
    adapter,
    validatedManifest,
    approval,
    TARGET_COLLECTIONS,
    "preflight"
  );
  return { events, ok: true, phase: "dry-run-complete" };
}

function fixedProjection(fields) {
  return Object.fromEntries(fields.map((field) => [field, true]));
}

function queryRows(result) {
  const data = result?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return [data];
  return [];
}

function validatePrepareIdentity({ envId, ownerId, participantId, runMarker }) {
  const normalizedOwnerId = requireString(ownerId, "PREPARE_OWNER_ID_INVALID").trim();
  const normalizedParticipantId = requireString(
    participantId,
    "PREPARE_PARTICIPANT_ID_INVALID"
  ).trim();
  const normalizedMarker = requireString(runMarker, "RUN_MARKER_INVALID").trim();
  const normalizedEnvId = requireString(envId, "ENV_NOT_PRODUCTION_CANONICAL").trim();
  if (normalizedEnvId !== PROD_CLOUDBASE_ENV_ID) fail("ENV_NOT_PRODUCTION_CANONICAL");
  if (!RUN_MARKER_PATTERN.test(normalizedMarker)) fail("RUN_MARKER_INVALID");
  if (!normalizedOwnerId) fail("PREPARE_OWNER_ID_INVALID");
  if (!normalizedParticipantId) fail("PREPARE_PARTICIPANT_ID_INVALID");
  if (normalizedOwnerId === normalizedParticipantId) fail("PREPARE_PARTICIPANTS_INVALID");
  return {
    envId: normalizedEnvId,
    ownerId: normalizedOwnerId,
    participantId: normalizedParticipantId,
    runMarker: normalizedMarker
  };
}

function createFixedDiscoveryReader(database, input) {
  const identity = validatePrepareIdentity(input);

  async function enumerateFixedCollection(collection, fields) {
    const rows = [];
    const seen = new Set();
    let complete = false;
    for (let page = 0; page < LEGACY_MAX_PAGES; page += 1) {
      const skip = page * LEGACY_PAGE_SIZE;
      const result = await database
        .collection(collection)
        .orderBy("_id", "asc")
        .skip(skip)
        .limit(LEGACY_PAGE_SIZE)
        .field(fixedProjection(fields))
        .get();
      const pageRows = queryRows(result);
      if (pageRows.length > LEGACY_PAGE_SIZE) return { complete: false, rows: [] };
      for (const row of pageRows) {
        if (!row || typeof row !== "object" || Array.isArray(row)) {
          return { complete: false, rows: [] };
        }
        const id = row.id ?? row._id;
        if (
          typeof id !== "string" ||
          !id ||
          (typeof row.id === "string" && typeof row._id === "string" && row.id !== row._id) ||
          seen.has(id)
        ) {
          return { complete: false, rows: [] };
        }
        seen.add(id);
        rows.push({ ...row, id });
      }
      if (pageRows.length < LEGACY_PAGE_SIZE) {
        complete = true;
        break;
      }
    }
    return { complete, rows };
  }

  function valueContainsMarker(value) {
    if (typeof value === "string") return value.includes(identity.runMarker);
    if (Array.isArray(value)) return value.some(valueContainsMarker);
    if (value && typeof value === "object") {
      return Object.values(value).some(valueContainsMarker);
    }
    return false;
  }

  function classifySource(row, sourceType) {
    if (!["published", "deleted"].includes(row.status)) return { valid: false };
    const managed = Boolean(row.updatedAt) && Number.isInteger(row.version) && row.version > 0;
    const managementState = managed ? "managed" : "legacy-readonly";
    if (row.managementState !== undefined && row.managementState !== managementState) {
      return { valid: false };
    }
    const markerFields = SOURCE_MARKER_FIELDS[sourceType].filter((field) =>
      valueContainsMarker(row[field])
    );
    const hasAnyMarker = markerFields.length > 0;
    const hasCanonicalMarker =
      sourceType === "parent-need" &&
      markerFields.length === 2 &&
      markerFields.includes("community") &&
      markerFields.includes("childIntro");
    if (
      hasAnyMarker &&
      (
        !hasCanonicalMarker ||
        row.ownerUserId !== identity.ownerId ||
        !managed ||
        row.status !== "published" ||
        row.version !== 5
      )
    ) {
      return { valid: false };
    }
    const markerTarget =
      hasCanonicalMarker && managed && row.status === "published" && row.version === 5;
    return { legacy: !managed, markerTarget, valid: true };
  }

  function incompleteDiscovery() {
    return {
      completeness: "INCOMPLETE",
      targetState: "UNKNOWN",
      legacyDenylist: Object.fromEntries(
        TARGET_COLLECTIONS.map((collection) => [collection, []])
      ),
      targets: Object.fromEntries(TARGET_COLLECTIONS.map((collection) => [collection, null]))
    };
  }

  return async function readDiscoverySnapshot() {
    const parentResult = await enumerateFixedCollection(
      LEGACY_SOURCE_COLLECTIONS["parent-need"],
      LEGACY_SCAN_FIELDS.parent_needs
    );
    const tutorResult = await enumerateFixedCollection(
      LEGACY_SOURCE_COLLECTIONS["tutor-profile"],
      LEGACY_SCAN_FIELDS.tutor_profiles
    );
    const conversationResult = await enumerateFixedCollection(
      "conversations",
      LEGACY_SCAN_FIELDS.conversations
    );
    const messageResult = await enumerateFixedCollection("messages", LEGACY_SCAN_FIELDS.messages);
    const requestResult = await enumerateFixedCollection(
      "contact_exchange_requests",
      LEGACY_SCAN_FIELDS.contact_exchange_requests
    );
    if (
      !parentResult.complete ||
      !tutorResult.complete ||
      !conversationResult.complete ||
      !messageResult.complete ||
      !requestResult.complete
    ) {
      return incompleteDiscovery();
    }

    const sources = new Map();
    const legacyParentIds = [];
    const markerTargets = [];
    for (const [sourceType, rows] of [
      ["parent-need", parentResult.rows],
      ["tutor-profile", tutorResult.rows]
    ]) {
      for (const row of rows) {
        const classification = classifySource(row, sourceType);
        if (!classification.valid) return incompleteDiscovery();
        const key = `${sourceType}:${row.id}`;
        if (sources.has(key)) return incompleteDiscovery();
        sources.set(key, { ...classification, id: row.id, sourceType });
        if (classification.legacy && sourceType === "parent-need") legacyParentIds.push(row.id);
        if (classification.markerTarget) markerTargets.push({ id: row.id, sourceType });
      }
    }
    if (markerTargets.length > 1) return incompleteDiscovery();
    const markerTarget = markerTargets[0] ?? null;

    const conversations = new Map();
    const legacyConversationIds = [];
    const targetConversations = [];
    for (const row of conversationResult.rows) {
      if (
        !LEGACY_SOURCE_TYPES.includes(row.sourceType) ||
        typeof row.sourceId !== "string" ||
        !row.sourceId
      ) {
        return incompleteDiscovery();
      }
      const source = sources.get(`${row.sourceType}:${row.sourceId}`);
      if (!source) return incompleteDiscovery();
      const relation = source.legacy
        ? "legacy"
        : markerTarget && source.id === markerTarget.id && source.sourceType === markerTarget.sourceType
          ? "target"
          : "ordinary";
      conversations.set(row.id, { id: row.id, relation });
      if (relation === "legacy") legacyConversationIds.push(row.id);
      if (relation === "target") targetConversations.push(row);
    }
    if (targetConversations.length > 1) return incompleteDiscovery();
    if (
      targetConversations.length === 1 &&
      (
        targetConversations[0].sourceStatus !== "published" ||
        targetConversations[0].sourceVersion !== 5 ||
        !sameParticipants(
          targetConversations[0].participantUserIds,
          [identity.ownerId, identity.participantId]
        )
      )
    ) {
      return incompleteDiscovery();
    }
    const targetConversationId = targetConversations[0]?.id ?? null;

    const legacyMessageIds = [];
    const targetMessages = [];
    for (const row of messageResult.rows) {
      if (typeof row.conversationId !== "string" || !row.conversationId) {
        return incompleteDiscovery();
      }
      const conversation = conversations.get(row.conversationId);
      if (!conversation) return incompleteDiscovery();
      if (conversation.relation === "legacy") legacyMessageIds.push(row.id);
      if (conversation.relation === "target") targetMessages.push(row);
    }
    if (
      targetMessages.length > 1 ||
      (targetMessages.length === 1 &&
        (
          ![identity.ownerId, identity.participantId].includes(targetMessages[0].senderUserId) ||
          !String(targetMessages[0].text ?? "").includes(identity.runMarker)
        ))
    ) {
      return incompleteDiscovery();
    }

    const legacyRequestIds = [];
    const targetRequests = [];
    for (const row of requestResult.rows) {
      if (typeof row.conversationId !== "string" || !row.conversationId) {
        return incompleteDiscovery();
      }
      const conversation = conversations.get(row.conversationId);
      if (!conversation) return incompleteDiscovery();
      if (conversation.relation === "legacy") legacyRequestIds.push(row.id);
      if (conversation.relation === "target") targetRequests.push(row);
    }
    if (
      targetRequests.length > 1 ||
      (targetRequests.length === 1 &&
        (
          targetRequests[0].requesterUserId !== identity.participantId ||
          targetRequests[0].receiverUserId !== identity.ownerId ||
          targetRequests[0].status !== "approved" ||
          targetRequests[0].sourceStatus !== "published" ||
          targetRequests[0].sourceVersion !== 5
        ))
    ) {
      return incompleteDiscovery();
    }

    const targets = {
      messages: targetMessages[0] ? { id: targetMessages[0].id } : null,
      contact_exchange_requests: targetRequests[0] ? { id: targetRequests[0].id } : null,
      conversations: targetConversationId ? { id: targetConversationId } : null,
      parent_needs: markerTarget ? { id: markerTarget.id } : null
    };
    const presentTargets = Object.values(targets).filter(Boolean).length;
    const targetState = presentTargets === 0
      ? "ABSENT"
      : presentTargets === TARGET_COLLECTIONS.length
        ? "COMPLETE"
        : "PARTIAL";
    return {
      completeness: "COMPLETE",
      targetState,
      legacyDenylist: {
        messages: legacyMessageIds.sort(),
        contact_exchange_requests: legacyRequestIds.sort(),
        conversations: legacyConversationIds.sort(),
        parent_needs: legacyParentIds.sort()
      },
      targets
    };
  };
}

function assertSafeProjectionResult(result, fields) {
  const allowed = new Set(fields);
  for (const row of queryRows(result)) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      fail("POST_FIXTURE_PROJECTION_UNSAFE");
    }
    if (Object.keys(row).some((field) => !allowed.has(field))) {
      fail("POST_FIXTURE_PROJECTION_UNSAFE");
    }
  }
  return result;
}

function createSafeDiscoveryReader(database, input, manifest, expectedTargetState) {
  const identity = validatePrepareIdentity(input);
  if (!["present", "absent"].includes(expectedTargetState)) {
    fail("SAFE_DISCOVERY_TARGET_STATE_INVALID");
  }

  async function enumerateSafeCollection(collection, fields) {
    const rows = [];
    const seen = new Set();
    let complete = false;
    for (let page = 0; page < LEGACY_MAX_PAGES; page += 1) {
      const skip = page * LEGACY_PAGE_SIZE;
      const raw = await database
        .collection(collection)
        .orderBy("_id", "asc")
        .skip(skip)
        .limit(LEGACY_PAGE_SIZE)
        .field(fixedProjection(fields))
        .get();
      const result = assertSafeProjectionResult(raw, fields);
      const pageRows = queryRows(result);
      if (pageRows.length > LEGACY_PAGE_SIZE) return { complete: false, rows: [] };
      for (const row of pageRows) {
        const id = row.id ?? row._id;
        if (
          typeof id !== "string" ||
          !id ||
          (typeof row.id === "string" && typeof row._id === "string" && row.id !== row._id) ||
          seen.has(id)
        ) {
          return { complete: false, rows: [] };
        }
        seen.add(id);
        rows.push({ ...row, id });
      }
      if (pageRows.length < LEGACY_PAGE_SIZE) {
        complete = true;
        break;
      }
    }
    return { complete, rows };
  }

  function incompleteDiscovery() {
    return {
      completeness: "INCOMPLETE",
      targetState: "UNKNOWN",
      legacyDenylist: Object.fromEntries(
        TARGET_COLLECTIONS.map((collection) => [collection, []])
      ),
      targets: Object.fromEntries(TARGET_COLLECTIONS.map((collection) => [collection, null]))
    };
  }

  function classifySource(row, sourceType) {
    if (!["published", "deleted"].includes(row.status)) return { valid: false };
    const managed = Boolean(row.updatedAt) && Number.isInteger(row.version) && row.version > 0;
    const managementState = managed ? "managed" : "legacy-readonly";
    if (row.managementState !== undefined && row.managementState !== managementState) {
      return { valid: false };
    }
    const markerTarget =
      sourceType === "parent-need" &&
      typeof row.community === "string" &&
      row.community.includes(identity.runMarker);
    if (
      markerTarget &&
      (
        expectedTargetState !== "present" ||
        row.id !== manifest.targets.parent_needs.id ||
        row.ownerUserId !== identity.ownerId ||
        !managed ||
        row.status !== "published" ||
        row.version !== 5 ||
        (row.deletedAt !== undefined && row.deletedAt !== null)
      )
    ) {
      return { valid: false };
    }
    return { legacy: !managed, markerTarget, valid: true };
  }

  return async function readPostFixtureDiscoverySnapshot() {
    const parentResult = await enumerateSafeCollection(
      "parent_needs",
      POST_FIXTURE_SCAN_FIELDS.parent_needs
    );
    const tutorResult = await enumerateSafeCollection(
      "tutor_profiles",
      POST_FIXTURE_SCAN_FIELDS.tutor_profiles
    );
    const conversationResult = await enumerateSafeCollection(
      "conversations",
      POST_FIXTURE_SCAN_FIELDS.conversations
    );
    const messageResult = await enumerateSafeCollection(
      "messages",
      POST_FIXTURE_SCAN_FIELDS.messages
    );
    const requestResult = await enumerateSafeCollection(
      "contact_exchange_requests",
      POST_FIXTURE_SCAN_FIELDS.contact_exchange_requests
    );
    if (
      !parentResult.complete ||
      !tutorResult.complete ||
      !conversationResult.complete ||
      !messageResult.complete ||
      !requestResult.complete
    ) {
      return incompleteDiscovery();
    }

    const sources = new Map();
    const legacyParentIds = [];
    const markerTargets = [];
    for (const [sourceType, rows] of [
      ["parent-need", parentResult.rows],
      ["tutor-profile", tutorResult.rows]
    ]) {
      for (const row of rows) {
        const classification = classifySource(row, sourceType);
        if (!classification.valid) return incompleteDiscovery();
        const key = `${sourceType}:${row.id}`;
        if (sources.has(key)) return incompleteDiscovery();
        sources.set(key, { ...classification, id: row.id, sourceType });
        if (classification.legacy && sourceType === "parent-need") legacyParentIds.push(row.id);
        if (classification.markerTarget) markerTargets.push({ id: row.id, sourceType });
      }
    }
    if (
      (expectedTargetState === "present" && markerTargets.length !== 1) ||
      (expectedTargetState === "absent" && markerTargets.length !== 0)
    ) {
      return incompleteDiscovery();
    }
    const markerTarget = markerTargets[0] ?? null;

    const conversations = new Map();
    const legacyConversationIds = [];
    const targetConversations = [];
    for (const row of conversationResult.rows) {
      if (
        !LEGACY_SOURCE_TYPES.includes(row.sourceType) ||
        typeof row.sourceId !== "string" ||
        !row.sourceId
      ) {
        return incompleteDiscovery();
      }
      const source = sources.get(`${row.sourceType}:${row.sourceId}`);
      if (!source) return incompleteDiscovery();
      const relation = source.legacy
        ? "legacy"
        : markerTarget && source.id === markerTarget.id && source.sourceType === markerTarget.sourceType
          ? "target"
          : "ordinary";
      conversations.set(row.id, { id: row.id, relation });
      if (relation === "legacy") legacyConversationIds.push(row.id);
      if (relation === "target") targetConversations.push(row);
    }
    if (expectedTargetState === "absent" && targetConversations.length !== 0) {
      return incompleteDiscovery();
    }
    if (expectedTargetState === "present" && (
      targetConversations.length !== 1 ||
      targetConversations[0].id !== manifest.targets.conversations.id ||
      targetConversations[0].sourceStatus !== "published" ||
      targetConversations[0].sourceVersion !== 5 ||
      !sameParticipants(
        targetConversations[0].participantUserIds,
        [identity.ownerId, identity.participantId]
      )
    )) return incompleteDiscovery();

    const legacyMessageIds = [];
    const targetMessages = [];
    for (const row of messageResult.rows) {
      if (typeof row.conversationId !== "string" || !row.conversationId) {
        return incompleteDiscovery();
      }
      const conversation = conversations.get(row.conversationId);
      if (!conversation) return incompleteDiscovery();
      if (conversation.relation === "legacy") legacyMessageIds.push(row.id);
      if (conversation.relation === "target") targetMessages.push(row);
    }
    if (expectedTargetState === "absent" && targetMessages.length !== 0) {
      return incompleteDiscovery();
    }
    if (expectedTargetState === "present" && (
      targetMessages.length !== 1 ||
      targetMessages[0].id !== manifest.targets.messages.id ||
      ![identity.ownerId, identity.participantId].includes(targetMessages[0].senderUserId)
    )) return incompleteDiscovery();

    const legacyRequestIds = [];
    const targetRequests = [];
    for (const row of requestResult.rows) {
      if (typeof row.conversationId !== "string" || !row.conversationId) {
        return incompleteDiscovery();
      }
      const conversation = conversations.get(row.conversationId);
      if (!conversation) return incompleteDiscovery();
      if (conversation.relation === "legacy") legacyRequestIds.push(row.id);
      if (conversation.relation === "target") targetRequests.push(row);
    }
    if (expectedTargetState === "absent" && targetRequests.length !== 0) {
      return incompleteDiscovery();
    }
    if (expectedTargetState === "present" && (
      targetRequests.length !== 1 ||
      targetRequests[0].id !== manifest.targets.contact_exchange_requests.id ||
      targetRequests[0].requesterUserId !== identity.participantId ||
      targetRequests[0].receiverUserId !== identity.ownerId ||
      targetRequests[0].status !== "approved" ||
      targetRequests[0].sourceStatus !== "published" ||
      targetRequests[0].sourceVersion !== 5
    )) return incompleteDiscovery();

    return {
      completeness: "COMPLETE",
      targetState: expectedTargetState === "present" ? "COMPLETE" : "ABSENT",
      legacyDenylist: {
        messages: legacyMessageIds.sort(),
        contact_exchange_requests: legacyRequestIds.sort(),
        conversations: legacyConversationIds.sort(),
        parent_needs: legacyParentIds.sort()
      },
      targets: {
        messages: expectedTargetState === "present" ? { id: targetMessages[0].id } : null,
        contact_exchange_requests: expectedTargetState === "present"
          ? { id: targetRequests[0].id }
          : null,
        conversations: expectedTargetState === "present" ? { id: targetConversations[0].id } : null,
        parent_needs: expectedTargetState === "present" ? { id: markerTarget.id } : null
      }
    };
  };
}

function exactGet(database, collection, id, fields) {
  return database.collection(collection).doc(id).field(fixedProjection(fields)).get();
}

async function exactSafeProjectedGet(database, collection, id, fields) {
  const result = await exactGet(database, collection, id, fields);
  return assertSafeProjectionResult(result, fields);
}

export function createCloudBasePrepareAdapter(database, input) {
  const identity = validatePrepareIdentity(input);
  const profileIds = { owner: identity.ownerId, participant: identity.participantId };
  return {
    readDiscoverySnapshot: createFixedDiscoveryReader(database, identity),
    readProfileProjection(role) {
      if (!["owner", "participant"].includes(role)) fail("PREPARE_PROFILE_ROLE_INVALID");
      return exactGet(database, "contact_profiles", profileIds[role], PROFILE_FIELDS);
    }
  };
}

export function createCloudBasePostFixturePrepareAdapter(database, input) {
  const identity = validatePrepareIdentity(input);
  const manifest = validateManifest({
    envId: identity.envId,
    manifest: input.expectedManifest,
    runMarker: identity.runMarker
  });
  if (
    manifest.participants.ownerId !== identity.ownerId ||
    manifest.participants.participantId !== identity.participantId
  ) {
    fail("POST_FIXTURE_PREPARE_PARTICIPANTS_MISMATCH");
  }
  const sourceId = manifest.targets.parent_needs.id;
  const profileIds = { owner: identity.ownerId, participant: identity.participantId };
  return {
    readAudit(version) {
      return exactSafeProjectedGet(
        database,
        "audit_events",
        deriveAuditId(sourceId, version),
        AUDIT_FIELDS
      );
    },
    readDiscoverySnapshot: createSafeDiscoveryReader(database, identity, manifest, "present"),
    readProfileProjection(role) {
      if (!["owner", "participant"].includes(role)) fail("PREPARE_PROFILE_ROLE_INVALID");
      return exactSafeProjectedGet(
        database,
        "contact_profiles",
        profileIds[role],
        PROFILE_FIELDS
      );
    }
  };
}

export function createCloudBasePostCleanupVerifyAdapter(database, input) {
  const identity = validatePrepareIdentity(input);
  const manifest = validateManifest({
    envId: identity.envId,
    manifest: input.expectedManifest,
    runMarker: identity.runMarker
  });
  if (
    manifest.participants.ownerId !== identity.ownerId ||
    manifest.participants.participantId !== identity.participantId
  ) {
    fail("POST_CLEANUP_VERIFY_PARTICIPANTS_MISMATCH");
  }
  const sourceId = manifest.targets.parent_needs.id;
  const profileIds = { owner: identity.ownerId, participant: identity.participantId };
  return Object.freeze({
    readAudit(version) {
      return exactSafeProjectedGet(
        database,
        "audit_events",
        deriveAuditId(sourceId, version),
        AUDIT_FIELDS
      );
    },
    readDiscoverySnapshot: createSafeDiscoveryReader(database, identity, manifest, "absent"),
    readProfileProjection(role) {
      if (!Object.hasOwn(profileIds, role)) fail("POST_CLEANUP_PROFILE_ROLE_INVALID");
      return exactSafeProjectedGet(database, "contact_profiles", profileIds[role], PROFILE_FIELDS);
    },
    readTarget(collection) {
      validateTargetCollection(collection);
      return exactSafeProjectedGet(
        database,
        collection,
        manifest.targets[collection].id,
        ["_id", "id"]
      );
    }
  });
}

function addSyntheticStatus(result, fallbackStatus) {
  if (!result || typeof result !== "object") {
    return { ok: false, status: fallbackStatus, value: null, errors: { request: "操作失败" } };
  }
  if (result.ok === false && !Number.isInteger(result.status)) {
    return { ...result, status: fallbackStatus };
  }
  return result;
}

async function createSyntheticFixtureAdapterWithDomain(database, input, domain) {
  const identity = validatePrepareIdentity(input);
  const deterministicIds = deriveSyntheticFixtureIds(identity.runMarker);
  if (typeof database?.collection !== "function" || typeof database?.runTransaction !== "function") {
    fail("SYNTHETIC_FIXTURE_TRANSACTION_UNAVAILABLE");
  }
  requireExactKeys(domain, SYNTHETIC_FIXTURE_DOMAIN_EXPORTS, "SYNTHETIC_FIXTURE_DOMAIN_INVALID");
  for (const operation of SYNTHETIC_FIXTURE_DOMAIN_EXPORTS) {
    if (typeof domain[operation] !== "function") fail("SYNTHETIC_FIXTURE_DOMAIN_INVALID");
  }

  const collections = Object.freeze({
    audit: database.collection("audit_events"),
    contactProfiles: database.collection("contact_profiles"),
    conversations: database.collection("conversations"),
    messages: database.collection("messages"),
    parentNeeds: database.collection("parent_needs"),
    requests: database.collection("contact_exchange_requests"),
    tutorProfiles: database.collection("tutor_profiles")
  });
  const runTransaction = (operation) => database.runTransaction((transaction) => operation({
    auditCollection: transaction.collection("audit_events"),
    contactExchangeRequestsCollection: transaction.collection("contact_exchange_requests"),
    conversationsCollection: transaction.collection("conversations"),
    sourceCollection: transaction.collection("parent_needs")
  }));
  const conversationDependencies = {
    conversationsCollection: collections.conversations,
    parentNeedsCollection: collections.parentNeeds,
    tutorProfilesCollection: collections.tutorProfiles
  };
  const contactDependencies = {
    ...conversationDependencies,
    contactProfilesCollection: collections.contactProfiles,
    requestsCollection: collections.requests
  };

  async function countRelated(collection, conversationId) {
    const result = await database
      .collection(collection)
      .where({ conversationId })
      .field({ _id: true })
      .get();
    return queryRows(result).length;
  }

  async function recoverAfterUncertainCommit({ operation, readBack, matches }) {
    try {
      return await operation();
    } catch (operationError) {
      let recovered;
      try {
        recovered = countAndFirst(await readBack());
      } catch {
        throw operationError;
      }
      if (recovered.count !== 1 || !matches(recovered.first)) {
        throw operationError;
      }
      return { ok: true, value: recovered.first, errors: {} };
    }
  }

  return Object.freeze({
    readPreflightSnapshot: createFixedDiscoveryReader(database, identity),
    readProfileProjection(role) {
      if (!Object.hasOwn({ owner: true, participant: true }, role)) {
        fail("SYNTHETIC_FIXTURE_PROFILE_ROLE_INVALID");
      }
      const id = role === "owner" ? identity.ownerId : identity.participantId;
      return exactGet(database, "contact_profiles", id, PROFILE_FIELDS);
    },
    createSource: ({ input: sourceInput, now }) => domain.saveServerParentNeed({
      authenticatedUserId: identity.ownerId,
      collection: collections.parentNeeds,
      input: sourceInput,
      now,
      runTransaction
    }),
    updateSource: ({ expectedVersion, id, input: sourceInput, now }) =>
      domain.updateServerParentNeed({
        authenticatedUserId: identity.ownerId,
        expectedVersion,
        id,
        input: sourceInput,
        now,
        runTransaction
      }),
    deleteSource: ({ expectedVersion, id, idempotencyKey, now }) =>
      domain.deleteServerParentNeed({
        authenticatedUserId: identity.ownerId,
        expectedVersion,
        id,
        idempotencyKey,
        now,
        runTransaction
      }),
    restoreSource: ({ expectedVersion, id, idempotencyKey, now }) =>
      domain.restoreServerParentNeed({
        authenticatedUserId: identity.ownerId,
        expectedVersion,
        id,
        idempotencyKey,
        now,
        runTransaction
    }),
    async createConversation({ now, sourceId, sourceType }) {
      const participantUserIds = [identity.ownerId, identity.participantId].sort();
      return addSyntheticStatus(await recoverAfterUncertainCommit({
        operation: () => domain.createOrReadServerConversationFromSource({
          authenticatedUserId: identity.participantId,
          ...conversationDependencies,
          now,
          preallocatedId: deterministicIds.conversationId,
          sourceId,
          sourceType
        }),
        readBack: () => exactGet(
          database, "conversations", deterministicIds.conversationId, TARGET_FIELDS.conversations
        ),
        matches: (document) => {
          const value = document && typeof document === "object" ? document : {};
          return (value.id ?? value._id) === deterministicIds.conversationId &&
            value.sourceId === sourceId && value.sourceType === sourceType &&
            Array.isArray(value.participantUserIds) &&
            [...value.participantUserIds].sort().join(":") === participantUserIds.join(":");
        }
      }), 403);
    },
    async sendMessage({ conversationId, now, text }) {
      return addSyntheticStatus(await recoverAfterUncertainCommit({
        operation: () => domain.sendServerConversationMessage({
          authenticatedUserId: identity.participantId,
          ...conversationDependencies,
          conversationId,
          messagesCollection: collections.messages,
          now,
          preallocatedId: deterministicIds.messageId,
          text
        }),
        readBack: () => exactGet(database, "messages", deterministicIds.messageId, TARGET_FIELDS.messages),
        matches: (document) => {
          const value = document && typeof document === "object" ? document : {};
          return (value.id ?? value._id) === deterministicIds.messageId &&
            value.conversationId === conversationId &&
            value.senderUserId === identity.participantId && value.text === text.trim();
        }
      }), 403);
    },
    async createContactRequest({ conversationId, now }) {
      return addSyntheticStatus(await recoverAfterUncertainCommit({
        operation: () => domain.createServerContactExchangeRequest({
          authenticatedUserId: identity.participantId,
          ...contactDependencies,
          conversationId,
          now,
          preallocatedId: deterministicIds.requestId
        }),
        readBack: () => exactGet(
          database, "contact_exchange_requests", deterministicIds.requestId,
          TARGET_FIELDS.contact_exchange_requests
        ),
        matches: (document) => {
          const value = document && typeof document === "object" ? document : {};
          return (value.id ?? value._id) === deterministicIds.requestId &&
            value.conversationId === conversationId &&
            value.requesterUserId === identity.participantId &&
            value.receiverUserId === identity.ownerId && value.status === "pending";
        }
      }), 403);
    },
    async approveContactRequest({ now, requestId, secondConfirmation }) {
      return addSyntheticStatus(await recoverAfterUncertainCommit({
        operation: () => domain.approveServerContactExchangeRequest({
          authenticatedUserId: identity.ownerId,
          ...contactDependencies,
          approvalIdempotencyKey: deterministicIds.approvalIdempotencyKey,
          now,
          requestId,
          secondConfirmation
        }),
        readBack: () => exactGet(
          database, "contact_exchange_requests", requestId,
          TARGET_FIELDS.contact_exchange_requests
        ),
        matches: (document) => {
          const value = document && typeof document === "object" ? document : {};
          return (value.id ?? value._id) === requestId &&
            value.conversationId && value.requesterUserId === identity.participantId &&
            value.receiverUserId === identity.ownerId && value.status === "approved" &&
            value.approvalIdempotencyKey === deterministicIds.approvalIdempotencyKey;
        }
      }), 403);
    },
    readSource: (id) => exactGet(database, "parent_needs", id, TARGET_FIELDS.parent_needs),
    readConversation: (id) => exactGet(
      database, "conversations", id, TARGET_FIELDS.conversations
    ),
    readMessage: (id) => exactGet(database, "messages", id, TARGET_FIELDS.messages),
    readRequest: (id) => exactGet(
      database, "contact_exchange_requests", id, TARGET_FIELDS.contact_exchange_requests
    ),
    readAudit: (sourceId, version) => exactGet(
      database, "audit_events", deriveAuditId(sourceId, version), AUDIT_FIELDS
    ),
    countMessages: (conversationId) => countRelated("messages", conversationId),
    countRequests: (conversationId) => countRelated(
      "contact_exchange_requests", conversationId
    ),
    async hasAuthorizedProfiles(conversationId) {
      const result = await domain.readServerAuthorizedContactProfiles({
        authenticatedUserId: identity.participantId,
        ...contactDependencies,
        conversationId
      });
      return result?.ok === true && result.value !== null;
    }
  });
}

export async function createCloudBaseSyntheticFixtureAdapter(database, input) {
  return createSyntheticFixtureAdapterWithDomain(
    database,
    input,
    await loadD2SyntheticFixtureDomain()
  );
}

export async function createD2SyntheticFixtureTestAdapter(database, input, domain) {
  if (process.env.NODE_ENV !== "test") fail("SYNTHETIC_FIXTURE_TEST_SEAM_FORBIDDEN");
  return createSyntheticFixtureAdapterWithDomain(database, input, domain);
}

export function createCloudBasePreFixtureProbeAdapter(
  database,
  { envId, randomUUID = createRandomUUID, runMarker }
) {
  if (envId !== PROD_CLOUDBASE_ENV_ID) fail("ENV_NOT_PRODUCTION_CANONICAL");
  if (!RUN_MARKER_PATTERN.test(runMarker)) fail("RUN_MARKER_INVALID");
  const uuids = TARGET_COLLECTIONS.map(() => randomUUID());
  if (
    uuids.some((uuid) => !RANDOM_UUID_PATTERN.test(uuid)) ||
    new Set(uuids).size !== TARGET_COLLECTIONS.length
  ) {
    fail("PRE_FIXTURE_PROBE_UUID_INVALID");
  }

  return Object.freeze(Object.fromEntries(TARGET_COLLECTIONS.map((collection, index) => {
    const id = `issue-0033-pre-fixture-probe-${collection}-${runMarker}-${uuids[index]}`;
    if (
      PRE_FIXTURE_PROBE_BUSINESS_ID_PATTERN.test(id) ||
      Object.values(PERMANENT_DENYLIST).some((ids) => ids.includes(id))
    ) {
      fail("PRE_FIXTURE_PROBE_ID_COLLISION");
    }
    return [collection, Object.freeze({
      idLabel: hashId(id),
      read: () => exactGet(database, collection, id, ["_id"]),
      remove: () => database.collection(collection).doc(id).remove()
    })];
  })));
}

function normalizePrepareTargets(value, code) {
  const targets = requireObject(value, code);
  requireExactKeys(targets, TARGET_COLLECTIONS, code);
  const normalized = {};
  const seen = new Set();
  for (const collection of TARGET_COLLECTIONS) {
    const target = targets[collection];
    if (target === null) {
      normalized[collection] = null;
      continue;
    }
    const item = requireObject(target, code);
    requireExactKeys(item, ["id"], code);
    const id = requireString(item.id, code);
    if (seen.has(id)) fail(code);
    seen.add(id);
    normalized[collection] = { id };
  }
  return normalized;
}

function normalizePrepareDiscovery(value) {
  const snapshot = requireObject(value, "PREPARE_DISCOVERY_INVALID");
  requireExactKeys(
    snapshot,
    ["completeness", "targetState", "legacyDenylist", "targets"],
    "PREPARE_DISCOVERY_INVALID"
  );
  if (snapshot.completeness !== "COMPLETE") fail("PREPARE_DISCOVERY_INCOMPLETE");
  if (!["ABSENT", "PARTIAL", "COMPLETE"].includes(snapshot.targetState)) {
    fail("PREPARE_TARGET_STATE_INVALID");
  }
  const legacy = requireObject(snapshot.legacyDenylist, "PREPARE_LEGACY_INVALID");
  requireExactKeys(legacy, TARGET_COLLECTIONS, "PREPARE_LEGACY_INVALID");
  const legacyDenylist = Object.fromEntries(TARGET_COLLECTIONS.map((collection) => [
    collection,
    normalizeIdSet(
      legacy[collection],
      "PREPARE_LEGACY_DUPLICATE",
      "PREPARE_LEGACY_INVALID"
    )
  ]));
  const targets = normalizePrepareTargets(snapshot.targets, "PREPARE_TARGETS_INVALID");
  const present = Object.values(targets).filter(Boolean).length;
  if (
    (snapshot.targetState === "ABSENT" && present !== 0) ||
    (snapshot.targetState === "PARTIAL" && (present === 0 || present === TARGET_COLLECTIONS.length)) ||
    (snapshot.targetState === "COMPLETE" && present !== TARGET_COLLECTIONS.length)
  ) {
    fail("PREPARE_TARGET_STATE_INVALID");
  }
  return {
    completeness: "COMPLETE",
    targetState: snapshot.targetState,
    legacyDenylist,
    targets
  };
}

function normalizePrepareProfile(result, role, expectedOwnerId) {
  const { count, first } = countAndFirst(result);
  if (count !== 1) fail("PREPARE_PROFILE_COUNT_INVALID");
  const profile = requireObject(first, "PREPARE_PROFILE_INVALID");
  if (!hasId(profile, expectedOwnerId) || profile.ownerUserId !== expectedOwnerId) {
    fail("PREPARE_PROFILE_MISMATCH");
  }
  const updatedAt = requireString(profile.updatedAt, "PREPARE_PROFILE_UPDATED_AT_INVALID");
  return { role, id: expectedOwnerId, ownerUserId: expectedOwnerId, updatedAt };
}

export async function runD2Prepare({
  adapter,
  envId,
  ownerId,
  participantId,
  runMarker
}) {
  const identity = validatePrepareIdentity({ envId, ownerId, participantId, runMarker });
  let first;
  let second;
  try {
    first = normalizePrepareDiscovery(await adapter.readDiscoverySnapshot());
    second = normalizePrepareDiscovery(await adapter.readDiscoverySnapshot());
  } catch (error) {
    if (error instanceof D2CleanupError) throw error;
    fail("PREPARE_DISCOVERY_READ_FAILED");
  }
  if (JSON.stringify(first) !== JSON.stringify(second)) fail("PREPARE_DISCOVERY_UNSTABLE");

  const profileApprovalProjection = [];
  for (const [role, expectedOwnerId] of [
    ["owner", identity.ownerId],
    ["participant", identity.participantId]
  ]) {
    let profileFirst;
    let profileSecond;
    try {
      profileFirst = normalizePrepareProfile(
        await adapter.readProfileProjection(role),
        role,
        expectedOwnerId
      );
      profileSecond = normalizePrepareProfile(
        await adapter.readProfileProjection(role),
        role,
        expectedOwnerId
      );
    } catch (error) {
      if (error instanceof D2CleanupError) throw error;
      fail("PREPARE_PROFILE_READ_FAILED");
    }
    if (JSON.stringify(profileFirst) !== JSON.stringify(profileSecond)) {
      fail("PREPARE_PROFILE_UNSTABLE");
    }
    profileApprovalProjection.push(profileFirst);
  }

  const participants = { ownerId: identity.ownerId, participantId: identity.participantId };
  const manifestCandidate = first.targetState === "COMPLETE"
    ? {
        schemaVersion: 3,
        envId: identity.envId,
        runMarker: identity.runMarker,
        participants,
        targets: first.targets,
        legacyDenylist: first.legacyDenylist
      }
    : null;
  return {
    schemaVersion: 1,
    kind: "issue-0033-d2-prepare",
    envId: identity.envId,
    runMarker: identity.runMarker,
    participants,
    completeness: "COMPLETE",
    targetState: first.targetState,
    legacyDenylist: first.legacyDenylist,
    targets: first.targets,
    manifestCandidate,
    profileApprovalProjection,
    approvalState: "EXTERNAL_APPROVAL_REQUIRED"
  };
}

function manifestsMatchDiscovery(manifest, prepared) {
  if (
    manifest.envId !== prepared.envId ||
    manifest.runMarker !== prepared.runMarker ||
    manifest.participants.ownerId !== prepared.participants.ownerId ||
    manifest.participants.participantId !== prepared.participants.participantId
  ) {
    return false;
  }
  return TARGET_COLLECTIONS.every((collection) =>
    manifest.targets[collection].id === prepared.targets[collection]?.id &&
    JSON.stringify([...manifest.legacyDenylist[collection]].sort()) ===
      JSON.stringify(prepared.legacyDenylist[collection])
  );
}

function normalizePostFixtureAudit(result, version, manifest) {
  const { count, first } = countAndFirst(result);
  if (count !== 1) fail("POST_FIXTURE_AUDIT_COUNT_INVALID", "audit_events");
  const document = requireObject(first, "POST_FIXTURE_AUDIT_INVALID");
  validateAuditDocument(document, version, manifest);
  return document;
}

export async function runD2PostFixturePrepare({
  adapter,
  envId,
  expectedManifest,
  ownerId,
  participantId,
  runMarker
}) {
  requireExactKeys(
    requireObject(adapter, "POST_FIXTURE_PREPARE_ADAPTER_INVALID"),
    ["readAudit", "readDiscoverySnapshot", "readProfileProjection"],
    "POST_FIXTURE_PREPARE_ADAPTER_INVALID"
  );
  for (const method of ["readAudit", "readDiscoverySnapshot", "readProfileProjection"]) {
    if (typeof adapter[method] !== "function") fail("POST_FIXTURE_PREPARE_ADAPTER_INVALID");
  }
  const identity = validatePrepareIdentity({ envId, ownerId, participantId, runMarker });
  const manifest = validateManifest({
    envId: identity.envId,
    manifest: expectedManifest,
    runMarker: identity.runMarker
  });
  if (
    manifest.participants.ownerId !== identity.ownerId ||
    manifest.participants.participantId !== identity.participantId
  ) {
    fail("POST_FIXTURE_PREPARE_PARTICIPANTS_MISMATCH");
  }
  const prepared = await runD2Prepare({
    adapter: {
      readDiscoverySnapshot: adapter.readDiscoverySnapshot,
      readProfileProjection: adapter.readProfileProjection
    },
    ...identity
  });
  if (
    prepared.targetState !== "COMPLETE" ||
    prepared.manifestCandidate === null ||
    !manifestsMatchDiscovery(manifest, prepared)
  ) {
    fail("POST_FIXTURE_MANIFEST_MISMATCH");
  }

  const auditLabels = [];
  for (let version = 1; version <= 5; version += 1) {
    let first;
    let second;
    try {
      first = normalizePostFixtureAudit(await adapter.readAudit(version), version, manifest);
      second = normalizePostFixtureAudit(await adapter.readAudit(version), version, manifest);
    } catch (error) {
      if (error instanceof D2CleanupError) throw error;
      fail("POST_FIXTURE_AUDIT_READ_FAILED", "audit_events");
    }
    if (JSON.stringify(first) !== JSON.stringify(second)) {
      fail("POST_FIXTURE_AUDIT_UNSTABLE", "audit_events");
    }
    auditLabels.push(hashId(deriveAuditId(manifest.targets.parent_needs.id, version)));
  }

  return {
    schemaVersion: 1,
    kind: "issue-0033-d2-post-fixture-prepare",
    mode: POST_FIXTURE_PREPARE_MODE,
    envId: identity.envId,
    runMarker: identity.runMarker,
    participants: { ownerId: identity.ownerId, participantId: identity.participantId },
    completeness: "COMPLETE",
    targetState: "PRESENT",
    legacyDenylist: prepared.legacyDenylist,
    targets: prepared.targets,
    manifestCandidate: manifest,
    profileApprovalProjection: prepared.profileApprovalProjection,
    approvalState: "EXTERNAL_APPROVAL_REQUIRED",
    audits: { state: "PRESENT_BUT_RETAINED", count: 5, labels: auditLabels },
    writeCounters: { transactions: 0, creates: 0, updates: 0, removes: 0 }
  };
}

function validatePostCleanupArtifactBindings(value) {
  const bindings = requireObject(value, "POST_CLEANUP_BINDINGS_INVALID");
  requireExactKeys(
    bindings,
    ["codeSha256", "manifestSha256", "approvalSha256", "finalCleanupReceiptSha256"],
    "POST_CLEANUP_BINDINGS_INVALID"
  );
  for (const hash of Object.values(bindings)) {
    if (typeof hash !== "string" || !SHA256_PATTERN.test(hash)) {
      fail("POST_CLEANUP_BINDINGS_INVALID");
    }
  }
  return Object.fromEntries(
    Object.entries(bindings).map(([key, hash]) => [key, hash.toLowerCase()])
  );
}

function normalizePostCleanupAudit(result, version, manifest) {
  const { count, first } = countAndFirst(result);
  if (count !== 1) fail("POST_CLEANUP_AUDIT_COUNT_INVALID", "audit_events");
  const document = requireObject(first, "POST_CLEANUP_AUDIT_INVALID");
  validateAuditDocument(document, version, manifest);
  return document;
}

export async function runD2PostCleanupVerify({
  adapter,
  approvalArtifactBytes,
  artifactBindings,
  envId,
  expectedApprovalSha256,
  expectedManifest,
  now,
  ownerId,
  participantId,
  runMarker
}) {
  const runtime = requireObject(adapter, "POST_CLEANUP_ADAPTER_INVALID");
  requireExactKeys(
    runtime,
    ["readAudit", "readDiscoverySnapshot", "readProfileProjection", "readTarget"],
    "POST_CLEANUP_ADAPTER_INVALID"
  );
  for (const method of ["readAudit", "readDiscoverySnapshot", "readProfileProjection", "readTarget"]) {
    if (typeof runtime[method] !== "function") fail("POST_CLEANUP_ADAPTER_INVALID");
  }
  const identity = validatePrepareIdentity({ envId, ownerId, participantId, runMarker });
  const manifest = validateManifest({
    envId: identity.envId,
    manifest: expectedManifest,
    runMarker: identity.runMarker
  });
  if (
    manifest.participants.ownerId !== identity.ownerId ||
    manifest.participants.participantId !== identity.participantId
  ) {
    fail("POST_CLEANUP_VERIFY_PARTICIPANTS_MISMATCH");
  }
  const approval = validateApprovalArtifact({
    approvalArtifactBytes,
    expectedApprovalSha256,
    manifest,
    now
  });
  const bindings = validatePostCleanupArtifactBindings(artifactBindings);
  if (bindings.approvalSha256 !== expectedApprovalSha256.toLowerCase()) {
    fail("POST_CLEANUP_BINDINGS_INVALID");
  }
  const approvedProfiles = Object.fromEntries(
    approval.profiles.map((profile) => [profile.role, profile])
  );

  async function readStableSnapshot() {
    const targets = {};
    for (const collection of TARGET_COLLECTIONS) {
      let result;
      try {
        result = await runtime.readTarget(collection);
      } catch (error) {
        if (error instanceof D2CleanupError) throw error;
        fail("POST_CLEANUP_TARGET_READ_FAILED", collection);
      }
      const { count } = countAndFirst(result);
      if (count !== 0) fail("POST_CLEANUP_TARGET_PRESENT", collection);
      targets[collection] = { count: 0, label: hashId(manifest.targets[collection].id) };
    }

    let discovery;
    try {
      discovery = normalizePrepareDiscovery(await runtime.readDiscoverySnapshot());
    } catch (error) {
      if (error instanceof D2CleanupError && error.code === "D2C_POST_FIXTURE_PROJECTION_UNSAFE") {
        throw error;
      }
      if (error instanceof D2CleanupError) fail("POST_CLEANUP_DISCOVERY_INCOMPLETE");
      fail("POST_CLEANUP_DISCOVERY_READ_FAILED");
    }
    if (
      discovery.targetState !== "ABSENT" ||
      Object.values(discovery.targets).some((target) => target !== null)
    ) {
      fail("POST_CLEANUP_TARGET_PRESENT");
    }
    for (const collection of TARGET_COLLECTIONS) {
      if (
        JSON.stringify(discovery.legacyDenylist[collection]) !==
        JSON.stringify([...manifest.legacyDenylist[collection]].sort())
      ) {
        fail("POST_CLEANUP_LEGACY_MISMATCH", collection);
      }
    }

    const profiles = [];
    for (const [role, expectedOwnerId] of [
      ["owner", identity.ownerId],
      ["participant", identity.participantId]
    ]) {
      let profile;
      try {
        profile = normalizePrepareProfile(
          await runtime.readProfileProjection(role),
          role,
          expectedOwnerId
        );
      } catch (error) {
        if (error instanceof D2CleanupError) throw error;
        fail("POST_CLEANUP_PROFILE_READ_FAILED");
      }
      if (JSON.stringify(profile) !== JSON.stringify(approvedProfiles[role])) {
        fail("POST_CLEANUP_PROFILE_MISMATCH");
      }
      profiles.push(profile);
    }

    const audits = [];
    for (let version = 1; version <= 5; version += 1) {
      try {
        audits.push(normalizePostCleanupAudit(await runtime.readAudit(version), version, manifest));
      } catch (error) {
        if (error instanceof D2CleanupError) throw error;
        fail("POST_CLEANUP_AUDIT_READ_FAILED", "audit_events");
      }
    }
    return { discovery, targets, profiles, audits };
  }

  const first = await readStableSnapshot();
  const second = await readStableSnapshot();
  if (JSON.stringify(first) !== JSON.stringify(second)) fail("POST_CLEANUP_SNAPSHOT_UNSTABLE");
  return {
    schemaVersion: 1,
    kind: "issue-0033-d2-post-cleanup-verify",
    mode: POST_CLEANUP_VERIFY_MODE,
    envId: identity.envId,
    runMarker: identity.runMarker,
    participants: { ownerId: identity.ownerId, participantId: identity.participantId },
    completeness: "COMPLETE",
    targetState: "ABSENT",
    targets: first.targets,
    legacyDenylist: first.discovery.legacyDenylist,
    profileApprovalProjection: first.profiles,
    audits: {
      state: "PRESENT_BUT_RETAINED",
      count: 5,
      labels: [1, 2, 3, 4, 5].map((version) =>
        hashId(deriveAuditId(manifest.targets.parent_needs.id, version)))
    },
    bindings: {
      ...bindings,
      legacyBaselineSha256: hashFull(JSON.stringify(manifest.legacyDenylist))
    },
    mutationCounters: { transactions: 0, adds: 0, sets: 0, updates: 0, removes: 0 }
  };
}

function validatePostFixturePrepareOutput(value) {
  const output = requireObject(value, "POST_FIXTURE_PREPARE_OUTPUT_INVALID");
  requireExactKeys(
    output,
    [
      "schemaVersion", "kind", "mode", "envId", "runMarker", "participants",
      "completeness", "targetState", "legacyDenylist", "targets", "manifestCandidate",
      "profileApprovalProjection", "approvalState", "audits", "writeCounters"
    ],
    "POST_FIXTURE_PREPARE_OUTPUT_INVALID"
  );
  if (
    output.schemaVersion !== 1 ||
    output.kind !== "issue-0033-d2-post-fixture-prepare" ||
    output.mode !== POST_FIXTURE_PREPARE_MODE ||
    output.completeness !== "COMPLETE" ||
    output.targetState !== "PRESENT" ||
    output.approvalState !== "EXTERNAL_APPROVAL_REQUIRED"
  ) {
    fail("POST_FIXTURE_PREPARE_OUTPUT_INVALID");
  }
  const prepared = validatePrepareOutput({
    schemaVersion: 1,
    kind: "issue-0033-d2-prepare",
    envId: output.envId,
    runMarker: output.runMarker,
    participants: output.participants,
    completeness: output.completeness,
    targetState: "COMPLETE",
    legacyDenylist: output.legacyDenylist,
    targets: output.targets,
    manifestCandidate: output.manifestCandidate,
    profileApprovalProjection: output.profileApprovalProjection,
    approvalState: output.approvalState
  });
  const audits = requireObject(output.audits, "POST_FIXTURE_PREPARE_OUTPUT_INVALID");
  requireExactKeys(audits, ["state", "count", "labels"], "POST_FIXTURE_PREPARE_OUTPUT_INVALID");
  if (
    audits.state !== "PRESENT_BUT_RETAINED" ||
    audits.count !== 5 ||
    !Array.isArray(audits.labels) ||
    audits.labels.length !== 5 ||
    new Set(audits.labels).size !== 5 ||
    audits.labels.some((label) => typeof label !== "string" || !/^[0-9a-f]{12}$/.test(label))
  ) {
    fail("POST_FIXTURE_PREPARE_OUTPUT_INVALID");
  }
  const writeCounters = requireObject(
    output.writeCounters,
    "POST_FIXTURE_PREPARE_OUTPUT_INVALID"
  );
  requireExactKeys(
    writeCounters,
    ["transactions", "creates", "updates", "removes"],
    "POST_FIXTURE_PREPARE_OUTPUT_INVALID"
  );
  if (Object.values(writeCounters).some((count) => count !== 0)) {
    fail("POST_FIXTURE_PREPARE_OUTPUT_INVALID");
  }
  return {
    ...output,
    participants: prepared.participants,
    legacyDenylist: prepared.legacyDenylist,
    targets: prepared.targets,
    manifestCandidate: prepared.manifestCandidate,
    profileApprovalProjection: prepared.profileApprovalProjection,
    audits: { ...audits, labels: [...audits.labels] },
    writeCounters: { ...writeCounters }
  };
}

function validatePostCleanupVerifyOutput(value) {
  const output = requireObject(value, "POST_CLEANUP_OUTPUT_INVALID");
  requireExactKeys(
    output,
    [
      "schemaVersion", "kind", "mode", "envId", "runMarker", "participants",
      "completeness", "targetState", "targets", "legacyDenylist",
      "profileApprovalProjection", "audits", "bindings", "mutationCounters"
    ],
    "POST_CLEANUP_OUTPUT_INVALID"
  );
  if (
    output.schemaVersion !== 1 ||
    output.kind !== "issue-0033-d2-post-cleanup-verify" ||
    output.mode !== POST_CLEANUP_VERIFY_MODE ||
    output.completeness !== "COMPLETE" ||
    output.targetState !== "ABSENT"
  ) {
    fail("POST_CLEANUP_OUTPUT_INVALID");
  }
  const identity = validatePrepareIdentity({
    envId: output.envId,
    ownerId: output.participants?.ownerId,
    participantId: output.participants?.participantId,
    runMarker: output.runMarker
  });
  const targets = requireObject(output.targets, "POST_CLEANUP_OUTPUT_INVALID");
  requireExactKeys(targets, TARGET_COLLECTIONS, "POST_CLEANUP_OUTPUT_INVALID");
  for (const collection of TARGET_COLLECTIONS) {
    const target = requireObject(targets[collection], "POST_CLEANUP_OUTPUT_INVALID");
    requireExactKeys(target, ["count", "label"], "POST_CLEANUP_OUTPUT_INVALID");
    if (target.count !== 0 || !/^[0-9a-f]{12}$/.test(target.label ?? "")) {
      fail("POST_CLEANUP_OUTPUT_INVALID");
    }
  }
  const legacy = requireObject(output.legacyDenylist, "POST_CLEANUP_OUTPUT_INVALID");
  requireExactKeys(legacy, TARGET_COLLECTIONS, "POST_CLEANUP_OUTPUT_INVALID");
  for (const collection of TARGET_COLLECTIONS) {
    normalizeIdSet(legacy[collection], "POST_CLEANUP_OUTPUT_INVALID", "POST_CLEANUP_OUTPUT_INVALID");
  }
  const expectedOwners = { owner: identity.ownerId, participant: identity.participantId };
  if (!Array.isArray(output.profileApprovalProjection) || output.profileApprovalProjection.length !== 2) {
    fail("POST_CLEANUP_OUTPUT_INVALID");
  }
  const seenRoles = new Set();
  for (const profile of output.profileApprovalProjection) {
    const item = requireObject(profile, "POST_CLEANUP_OUTPUT_INVALID");
    requireExactKeys(item, ["role", "id", "ownerUserId", "updatedAt"], "POST_CLEANUP_OUTPUT_INVALID");
    if (
      !Object.hasOwn(expectedOwners, item.role) || seenRoles.has(item.role) ||
      item.id !== expectedOwners[item.role] || item.ownerUserId !== expectedOwners[item.role] ||
      typeof item.updatedAt !== "string" || !item.updatedAt
    ) {
      fail("POST_CLEANUP_OUTPUT_INVALID");
    }
    seenRoles.add(item.role);
  }
  const audits = requireObject(output.audits, "POST_CLEANUP_OUTPUT_INVALID");
  requireExactKeys(audits, ["state", "count", "labels"], "POST_CLEANUP_OUTPUT_INVALID");
  if (
    audits.state !== "PRESENT_BUT_RETAINED" || audits.count !== 5 ||
    !Array.isArray(audits.labels) || audits.labels.length !== 5 ||
    new Set(audits.labels).size !== 5 ||
    audits.labels.some((label) => !/^[0-9a-f]{12}$/.test(label ?? ""))
  ) {
    fail("POST_CLEANUP_OUTPUT_INVALID");
  }
  const bindings = requireObject(output.bindings, "POST_CLEANUP_OUTPUT_INVALID");
  requireExactKeys(
    bindings,
    [
      "codeSha256", "manifestSha256", "approvalSha256",
      "finalCleanupReceiptSha256", "legacyBaselineSha256"
    ],
    "POST_CLEANUP_OUTPUT_INVALID"
  );
  if (Object.values(bindings).some((hash) => typeof hash !== "string" || !SHA256_PATTERN.test(hash))) {
    fail("POST_CLEANUP_OUTPUT_INVALID");
  }
  const counters = requireObject(output.mutationCounters, "POST_CLEANUP_OUTPUT_INVALID");
  requireExactKeys(
    counters,
    ["transactions", "adds", "sets", "updates", "removes"],
    "POST_CLEANUP_OUTPUT_INVALID"
  );
  if (Object.values(counters).some((count) => count !== 0)) fail("POST_CLEANUP_OUTPUT_INVALID");
  return structuredClone(output);
}

function validatePrepareOutput(value) {
  const output = requireObject(value, "PREPARE_OUTPUT_INVALID");
  requireExactKeys(
    output,
    [
      "schemaVersion", "kind", "envId", "runMarker", "participants", "completeness",
      "targetState", "legacyDenylist", "targets", "manifestCandidate",
      "profileApprovalProjection", "approvalState"
    ],
    "PREPARE_OUTPUT_INVALID"
  );
  if (
    output.schemaVersion !== 1 ||
    output.kind !== "issue-0033-d2-prepare" ||
    output.completeness !== "COMPLETE" ||
    output.approvalState !== "EXTERNAL_APPROVAL_REQUIRED"
  ) {
    fail("PREPARE_OUTPUT_INVALID");
  }
  const identity = validatePrepareIdentity({
    envId: output.envId,
    ownerId: output.participants?.ownerId,
    participantId: output.participants?.participantId,
    runMarker: output.runMarker
  });
  const discovery = normalizePrepareDiscovery({
    completeness: output.completeness,
    targetState: output.targetState,
    legacyDenylist: output.legacyDenylist,
    targets: output.targets
  });
  if (!Array.isArray(output.profileApprovalProjection) || output.profileApprovalProjection.length !== 2) {
    fail("PREPARE_OUTPUT_INVALID");
  }
  const expectedProfiles = { owner: identity.ownerId, participant: identity.participantId };
  const roles = new Set();
  const profiles = output.profileApprovalProjection.map((profile) => {
    const item = requireObject(profile, "PREPARE_OUTPUT_INVALID");
    requireExactKeys(item, ["role", "id", "ownerUserId", "updatedAt"], "PREPARE_OUTPUT_INVALID");
    if (!Object.hasOwn(expectedProfiles, item.role) || roles.has(item.role)) {
      fail("PREPARE_OUTPUT_INVALID");
    }
    roles.add(item.role);
    const expectedId = expectedProfiles[item.role];
    if (item.id !== expectedId || item.ownerUserId !== expectedId) fail("PREPARE_OUTPUT_INVALID");
    return { ...item, updatedAt: requireString(item.updatedAt, "PREPARE_OUTPUT_INVALID") };
  });
  const manifestCandidate = discovery.targetState === "COMPLETE"
    ? validateManifest({
        envId: identity.envId,
        manifest: output.manifestCandidate,
        runMarker: identity.runMarker
      })
    : output.manifestCandidate === null
      ? null
      : fail("PREPARE_OUTPUT_INVALID");
  return {
    ...output,
    participants: { ownerId: identity.ownerId, participantId: identity.participantId },
    legacyDenylist: discovery.legacyDenylist,
    targets: discovery.targets,
    manifestCandidate,
    profileApprovalProjection: profiles
  };
}

function buildSyntheticFixtureAuthorization({
  approvalArtifactBytes,
  expectedApprovalSha256,
  expectedFixturePlanSha256,
  issuedAt,
  nonce,
  prepareOutput
}) {
  const prepared = validatePrepareOutput(prepareOutput);
  if (prepared.targetState !== "ABSENT" || Object.values(prepared.targets).some(Boolean)) {
    fail("SYNTHETIC_FIXTURE_AUTHORIZATION_TARGET_NOT_ABSENT");
  }
  const plan = createD2SyntheticFixtureMachinePlan({
    envId: prepared.envId,
    ownerId: prepared.participants.ownerId,
    participantId: prepared.participants.participantId,
    runMarker: prepared.runMarker
  });
  const planSha256 = hashFull(JSON.stringify(plan));
  if (
    !SHA256_PATTERN.test(expectedFixturePlanSha256 ?? "") ||
    planSha256 !== expectedFixturePlanSha256.toLowerCase()
  ) {
    fail("SYNTHETIC_FIXTURE_PLAN_HASH_MISMATCH");
  }
  const approval = validateApprovalArtifact({
    approvalArtifactBytes,
    expectedApprovalSha256,
    manifest: {
      participants: prepared.participants
    },
    now: () => new Date(issuedAt)
  });
  if (!RANDOM_UUID_PATTERN.test(nonce ?? "")) fail("SYNTHETIC_FIXTURE_AUTHORIZATION_NONCE_INVALID");
  const issuedMs = Date.parse(issuedAt);
  if (!Number.isFinite(issuedMs) || new Date(issuedMs).toISOString() !== issuedAt) {
    fail("SYNTHETIC_FIXTURE_AUTHORIZATION_TIME_INVALID");
  }
  const legacyDenylist = structuredClone(prepared.legacyDenylist);
  const profileProjections = approval.profiles.map(({ role, id, ownerUserId, updatedAt }) => ({
    role, id, ownerUserId, updatedAt
  }));
  if (JSON.stringify(profileProjections) !== JSON.stringify(prepared.profileApprovalProjection)) {
    fail("SYNTHETIC_FIXTURE_PROFILE_APPROVAL_DRIFT");
  }
  return {
    schemaVersion: 1,
    kind: SYNTHETIC_FIXTURE_AUTH_KIND,
    mode: SYNTHETIC_FIXTURE_MODE,
    envId: prepared.envId,
    runMarker: prepared.runMarker,
    participants: structuredClone(prepared.participants),
    planSha256,
    preFixtureClaimSha256: hashFull("pre-fixture-probe-claimed\n"),
    legacyBaselineSha256: hashFull(JSON.stringify(legacyDenylist)),
    legacyDenylist,
    profileApprovalSha256: expectedApprovalSha256.toLowerCase(),
    profileProjections,
    issuedAt,
    nonce
  };
}

export function createD2SyntheticFixtureAuthorizationForTest(input) {
  if (process.env.NODE_ENV !== "test") fail("SYNTHETIC_FIXTURE_TEST_SEAM_FORBIDDEN");
  return buildSyntheticFixtureAuthorization(input);
}

function validateSyntheticFixtureAuthorization(
  value,
  { expectedAuthorizationSha256, identity, now, planSha256, serializedBytes }
) {
  if (
    !SHA256_PATTERN.test(expectedAuthorizationSha256 ?? "") ||
    hashFull(serializedBytes) !== expectedAuthorizationSha256.toLowerCase()
  ) {
    fail("SYNTHETIC_FIXTURE_AUTHORIZATION_HASH_MISMATCH");
  }
  const authorization = requireObject(value, "SYNTHETIC_FIXTURE_AUTHORIZATION_INVALID");
  requireExactKeys(authorization, [
    "schemaVersion", "kind", "mode", "envId", "runMarker", "participants",
    "planSha256", "preFixtureClaimSha256", "legacyBaselineSha256", "legacyDenylist",
    "profileApprovalSha256", "profileProjections", "issuedAt", "nonce"
  ], "SYNTHETIC_FIXTURE_AUTHORIZATION_INVALID");
  if (
    authorization.schemaVersion !== 1 ||
    authorization.kind !== SYNTHETIC_FIXTURE_AUTH_KIND ||
    authorization.mode !== SYNTHETIC_FIXTURE_MODE ||
    authorization.envId !== identity.envId ||
    authorization.runMarker !== identity.runMarker ||
    authorization.participants?.ownerId !== identity.ownerId ||
    authorization.participants?.participantId !== identity.participantId ||
    authorization.planSha256 !== planSha256 ||
    authorization.preFixtureClaimSha256 !== hashFull("pre-fixture-probe-claimed\n") ||
    !SHA256_PATTERN.test(authorization.profileApprovalSha256 ?? "") ||
    !RANDOM_UUID_PATTERN.test(authorization.nonce ?? "")
  ) {
    fail("SYNTHETIC_FIXTURE_AUTHORIZATION_BINDING_MISMATCH");
  }
  const issuedAt = requireString(
    authorization.issuedAt,
    "SYNTHETIC_FIXTURE_AUTHORIZATION_TIME_INVALID"
  );
  const issuedMs = Date.parse(issuedAt);
  const consumedAt = now();
  const consumedMs = consumedAt instanceof Date ? consumedAt.getTime() : Number.NaN;
  if (
    !Number.isFinite(issuedMs) ||
    !Number.isFinite(consumedMs) ||
    new Date(issuedMs).toISOString() !== issuedAt
  ) {
    fail("SYNTHETIC_FIXTURE_AUTHORIZATION_TIME_INVALID");
  }
  if (issuedMs - consumedMs > SYNTHETIC_FIXTURE_AUTHORIZATION_FUTURE_TOLERANCE_MS) {
    fail("SYNTHETIC_FIXTURE_AUTHORIZATION_TIME_FUTURE");
  }
  if (consumedMs - issuedMs > SYNTHETIC_FIXTURE_AUTHORIZATION_MAX_AGE_MS) {
    fail("SYNTHETIC_FIXTURE_AUTHORIZATION_EXPIRED");
  }
  const normalizedLegacy = normalizePrepareDiscovery({
    completeness: "COMPLETE",
    targetState: "ABSENT",
    legacyDenylist: authorization.legacyDenylist,
    targets: Object.fromEntries(TARGET_COLLECTIONS.map((collection) => [collection, null]))
  }).legacyDenylist;
  if (hashFull(JSON.stringify(normalizedLegacy)) !== authorization.legacyBaselineSha256) {
    fail("SYNTHETIC_FIXTURE_AUTHORIZATION_LEGACY_HASH_MISMATCH");
  }
  if (!Array.isArray(authorization.profileProjections) || authorization.profileProjections.length !== 2) {
    fail("SYNTHETIC_FIXTURE_AUTHORIZATION_PROFILE_INVALID");
  }
  const seenRoles = new Set();
  const seenIds = new Set();
  const profiles = authorization.profileProjections.map((profile) => {
    const item = requireObject(profile, "SYNTHETIC_FIXTURE_AUTHORIZATION_PROFILE_INVALID");
    requireExactKeys(item, ["role", "id", "ownerUserId", "updatedAt"],
      "SYNTHETIC_FIXTURE_AUTHORIZATION_PROFILE_INVALID");
    if (!['owner', 'participant'].includes(item.role) || seenRoles.has(item.role)) {
      fail("SYNTHETIC_FIXTURE_AUTHORIZATION_PROFILE_INVALID");
    }
    const expectedOwner = item.role === "owner" ? identity.ownerId : identity.participantId;
    if (
      item.id !== expectedOwner || item.ownerUserId !== expectedOwner ||
      seenIds.has(item.id) || !requireString(item.updatedAt,
        "SYNTHETIC_FIXTURE_AUTHORIZATION_PROFILE_INVALID")
    ) {
      fail("SYNTHETIC_FIXTURE_AUTHORIZATION_PROFILE_INVALID");
    }
    seenRoles.add(item.role);
    seenIds.add(item.id);
    return { ...item };
  });
  return { ...authorization, legacyDenylist: normalizedLegacy, profileProjections: profiles };
}

const DEFAULT_PREPARE_OUTPUT_IO = { link, lstat, mkdir, open, realpath, unlink };

function validatePrepareOutputIo(io) {
  for (const method of ["link", "lstat", "mkdir", "open", "realpath", "unlink"]) {
    if (typeof io?.[method] !== "function") fail("PREPARE_OUTPUT_IO_INVALID");
  }
  return io;
}

async function writeProtectedJsonArtifact(value, finalName, { io = DEFAULT_PREPARE_OUTPUT_IO,
  randomUUID = createRandomUUID } = {}) {
  const fileIo = validatePrepareOutputIo(io);
  const root = resolve(MANIFEST_ROOT);
  await fileIo.mkdir(root, { recursive: true });
  const rootStat = await fileIo.lstat(root);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory() || await fileIo.realpath(root) !== root) {
    fail("PROTECTED_ARTIFACT_ROOT_UNSAFE");
  }
  const finalPath = resolve(root, finalName);
  if (dirname(finalPath) !== root || basename(finalPath) !== finalName) {
    fail("PROTECTED_ARTIFACT_PATH_INVALID");
  }
  try {
    await fileIo.lstat(finalPath);
    fail("PROTECTED_ARTIFACT_EXISTS");
  } catch (error) {
    if (error instanceof D2CleanupError) throw error;
    if (error?.code !== "ENOENT") fail("PROTECTED_ARTIFACT_UNSAFE");
  }
  const tempId = randomUUID();
  if (!RANDOM_UUID_PATTERN.test(tempId)) fail("PROTECTED_ARTIFACT_TEMP_ID_INVALID");
  const tempPath = resolve(root, `.${finalName}.${tempId}.tmp`);
  if (dirname(tempPath) !== root) fail("PROTECTED_ARTIFACT_TEMP_PATH_INVALID");
  let handle;
  let tempCreated = false;
  let published = false;
  try {
    handle = await fileIo.open(tempPath, "wx", 0o600);
    tempCreated = true;
    const tempStat = await fileIo.lstat(tempPath);
    if (tempStat.isSymbolicLink() || !tempStat.isFile()) fail("PROTECTED_ARTIFACT_TEMP_UNSAFE");
    await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`, "utf8");
    await handle.sync();
    await handle.close();
    handle = undefined;
    await fileIo.link(tempPath, finalPath);
    published = true;
    await fileIo.unlink(tempPath);
    tempCreated = false;
    return finalPath;
  } catch (error) {
    await handle?.close().catch(() => undefined);
    if (tempCreated && !published) await fileIo.unlink(tempPath).catch(() => undefined);
    if (error instanceof D2CleanupError) throw error;
    if (error?.code === "EEXIST") fail("PROTECTED_ARTIFACT_EXISTS");
    fail("PROTECTED_ARTIFACT_WRITE_FAILED");
  }
}

async function writeSyntheticFixtureAuthorization(value, options) {
  return writeProtectedJsonArtifact(
    value,
    `${value.runMarker}.synthetic-fixture.authorization.json`,
    options
  );
}

export async function writeD2SyntheticFixtureAuthorizationForTest(value, options) {
  if (process.env.NODE_ENV !== "test") fail("SYNTHETIC_FIXTURE_TEST_SEAM_FORBIDDEN");
  return writeSyntheticFixtureAuthorization(value, options);
}

export async function writePrepareOutput(
  value,
  { io = DEFAULT_PREPARE_OUTPUT_IO, randomUUID = createRandomUUID } = {}
) {
  const output = validatePrepareOutput(value);
  const fileIo = validatePrepareOutputIo(io);
  const root = resolve(MANIFEST_ROOT);
  await fileIo.mkdir(root, { recursive: true });
  const rootStat = await fileIo.lstat(root);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) fail("PREPARE_OUTPUT_ROOT_UNSAFE");
  if (await fileIo.realpath(root) !== root) fail("PREPARE_OUTPUT_ROOT_UNSAFE");
  const outputPath = resolve(root, `${output.runMarker}.prepare.json`);
  if (dirname(outputPath) !== root) fail("PREPARE_OUTPUT_PATH_INVALID");
  try {
    const existing = await fileIo.lstat(outputPath);
    if (existing.isSymbolicLink()) fail("PREPARE_OUTPUT_UNSAFE");
    fail("PREPARE_OUTPUT_EXISTS");
  } catch (error) {
    if (error instanceof D2CleanupError) throw error;
    if (error?.code !== "ENOENT") fail("PREPARE_OUTPUT_UNSAFE");
  }

  const temporaryId = randomUUID();
  if (!RANDOM_UUID_PATTERN.test(temporaryId)) fail("PREPARE_OUTPUT_TEMP_ID_INVALID");
  const temporaryPath = resolve(
    root,
    `.${output.runMarker}.prepare.${temporaryId}.tmp`
  );
  if (dirname(temporaryPath) !== root || temporaryPath === outputPath) {
    fail("PREPARE_OUTPUT_TEMP_PATH_INVALID");
  }

  let handle;
  let temporaryVerified = false;
  let handleClosed = false;
  let published = false;
  let phase = "write";
  try {
    handle = await fileIo.open(temporaryPath, "wx", 0o600);
    const temporaryStat = await fileIo.lstat(temporaryPath);
    if (temporaryStat.isSymbolicLink() || !temporaryStat.isFile()) {
      fail("PREPARE_OUTPUT_TEMP_UNSAFE");
    }
    temporaryVerified = true;
    await handle.writeFile(`${JSON.stringify(output, null, 2)}\n`, "utf8");
    await handle.sync();
    await handle.close();
    handleClosed = true;

    phase = "publish";
    // A same-directory hard link is atomic and has no replace semantics on Windows:
    // an existing final path produces EEXIST instead of being overwritten.
    await fileIo.link(temporaryPath, outputPath);
    published = true;

    phase = "cleanup";
    await fileIo.unlink(temporaryPath);
    temporaryVerified = false;
  } catch (error) {
    if (!handleClosed) {
      await handle?.close().catch(() => undefined);
      handleClosed = true;
    }
    if (temporaryVerified && !published) {
      await fileIo.unlink(temporaryPath).catch(() => undefined);
      temporaryVerified = false;
    }
    if (error instanceof D2CleanupError) throw error;
    if (phase === "publish" && error?.code === "EEXIST") fail("PREPARE_OUTPUT_EXISTS");
    if (phase === "publish") fail("PREPARE_OUTPUT_PUBLISH_FAILED");
    if (phase === "cleanup") fail("PREPARE_OUTPUT_TEMP_CLEANUP_FAILED");
    fail("PREPARE_OUTPUT_WRITE_FAILED");
  }
  return outputPath;
}

export async function writePostFixturePrepareOutput(value, options) {
  const output = validatePostFixturePrepareOutput(value);
  return writeProtectedJsonArtifact(
    output,
    `${output.runMarker}.post-fixture.prepare.json`,
    options
  );
}

export async function writePostCleanupVerifyOutput(value, options) {
  const output = validatePostCleanupVerifyOutput(value);
  return writeProtectedJsonArtifact(
    output,
    `${output.runMarker}.post-cleanup.verify.json`,
    options
  );
}

export function createCloudBaseAdapter(database, manifest, approvalInput) {
  const validatedManifest = validateManifest({
    envId: manifest?.envId,
    manifest,
    runMarker: manifest?.runMarker
  });
  const approval = validateApprovalArtifact({ ...approvalInput, manifest: validatedManifest });
  const targetIds = Object.fromEntries(
    TARGET_COLLECTIONS.map((collection) => [collection, validatedManifest.targets[collection].id])
  );
  const profiles = Object.fromEntries(approval.profiles.map((profile) => [profile.role, profile]));
  const sourceId = validatedManifest.targets.parent_needs.id;
  const probePrefix = `probe-${validatedManifest.runMarker}-`;
  const readDiscoverySnapshot = createFixedDiscoveryReader(database, {
    envId: validatedManifest.envId,
    ownerId: validatedManifest.participants.ownerId,
    participantId: validatedManifest.participants.participantId,
    runMarker: validatedManifest.runMarker
  });
  const requireProbeId = (id) => {
    const uuid = typeof id === "string" && id.startsWith(probePrefix)
      ? id.slice(probePrefix.length)
      : "";
    if (!RANDOM_UUID_PATTERN.test(uuid)) fail("PROBE_ID_INVALID");
  };

  return {
    readTarget(collection) {
      validateTargetCollection(collection);
      return exactGet(database, collection, targetIds[collection], TARGET_FIELDS[collection]);
    },
    removeTarget(collection) {
      validateTargetCollection(collection);
      return database.collection(collection).doc(targetIds[collection]).remove();
    },
    readContactProfile(role) {
      if (!["owner", "participant"].includes(role)) fail("APPROVAL_PROFILE_ROLE_INVALID");
      return exactGet(database, "contact_profiles", profiles[role].id, PROFILE_FIELDS);
    },
    readAudit(version) {
      return exactGet(database, "audit_events", deriveAuditId(sourceId, version), AUDIT_FIELDS);
    },
    async readLegacyUniverse() {
      const discovery = await readDiscoverySnapshot();
      const collections = Object.fromEntries(TARGET_COLLECTIONS.map((collection) => [
        collection,
        [
          ...(discovery.legacyDenylist?.[collection] ?? []),
          ...(discovery.targets?.[collection]?.id ? [discovery.targets[collection].id] : [])
        ].sort()
      ]));
      return {
        // Cleanup deliberately progresses through PARTIAL target state. The
        // caller separately proves which exact targets must be present/absent.
        complete: discovery.completeness === "COMPLETE",
        collections
      };
    },
    readProbe(collection, id) {
      validateTargetCollection(collection);
      requireProbeId(id);
      return exactGet(database, collection, id, ["_id"]);
    },
    removeProbe(collection, id) {
      validateTargetCollection(collection);
      requireProbeId(id);
      return database.collection(collection).doc(id).remove();
    }
  };
}

async function assertSafeArtifactFile(path, code) {
  const rootStat = await lstat(MANIFEST_ROOT);
  const fileStat = await lstat(path);
  if (rootStat.isSymbolicLink() || fileStat.isSymbolicLink() || !fileStat.isFile()) fail(code);
  const [canonicalRoot, canonicalFile] = await Promise.all([realpath(MANIFEST_ROOT), realpath(path)]);
  if (dirname(canonicalFile) !== canonicalRoot) fail(code);
}

function validateFinalCleanupReceipt({
  approvalSha256,
  manifestSha256,
  receipt,
  receiptSha256,
  runMarker
}) {
  const expectedSha256 = POST_CLEANUP_RECEIPT_SHA256_BY_MARKER[runMarker];
  if (!expectedSha256 || receiptSha256 !== expectedSha256) {
    fail("POST_CLEANUP_FINAL_RECEIPT_HASH_MISMATCH");
  }
  const value = requireObject(receipt, "POST_CLEANUP_FINAL_RECEIPT_INVALID");
  requireExactKeys(
    value,
    [
      "schemaVersion", "kind", "generatedAt", "codeSha256", "manifestSha256",
      "approvalSha256", "dryRunV2ReceiptSha256", "result"
    ],
    "POST_CLEANUP_FINAL_RECEIPT_INVALID"
  );
  if (
    value.schemaVersion !== 1 ||
    value.kind !== "issue-0033-d2-cleanup-final-receipt" ||
    value.manifestSha256?.toLowerCase() !== manifestSha256 ||
    value.approvalSha256?.toLowerCase() !== approvalSha256
  ) {
    fail("POST_CLEANUP_FINAL_RECEIPT_INVALID");
  }
  const result = requireObject(value.result, "POST_CLEANUP_FINAL_RECEIPT_INVALID");
  requireExactKeys(result, ["ok", "phase", "events"], "POST_CLEANUP_FINAL_RECEIPT_INVALID");
  if (result.ok !== true || result.phase !== "cleanup-complete" || !Array.isArray(result.events)) {
    fail("POST_CLEANUP_FINAL_RECEIPT_INVALID");
  }
  const cleanupCollections = result.events
    .filter((event) => event?.stage === "cleanup")
    .map((event) => event.collection);
  const verifiedCollections = result.events
    .filter((event) => event?.stage === "verify-removed" && event.count === 0)
    .map((event) => event.collection);
  if (
    JSON.stringify(cleanupCollections) !== JSON.stringify(TARGET_COLLECTIONS) ||
    JSON.stringify(verifiedCollections) !== JSON.stringify(TARGET_COLLECTIONS)
  ) {
    fail("POST_CLEANUP_FINAL_RECEIPT_INVALID");
  }
  return value;
}

async function consumeSyntheticFixtureAuthorization({
  authorizationPath,
  envId,
  expectedAuthorizationSha256,
  expectedFixturePlanSha256,
  now = () => new Date(),
  ownerId,
  participantId,
  runMarker
}) {
  const identity = validatePrepareIdentity({ envId, ownerId, participantId, runMarker });
  const plan = createD2SyntheticFixtureMachinePlan(identity);
  const planSha256 = hashFull(JSON.stringify(plan));
  if (planSha256 !== expectedFixturePlanSha256) fail("SYNTHETIC_FIXTURE_PLAN_HASH_MISMATCH");
  await verifyPreFixtureProbeClaim(identity.runMarker);
  await assertSafeArtifactFile(authorizationPath, "SYNTHETIC_FIXTURE_AUTHORIZATION_UNSAFE");
  let bytes;
  let authorization;
  try {
    bytes = await readFile(authorizationPath);
    authorization = validateSyntheticFixtureAuthorization(
      JSON.parse(bytes.toString("utf8")),
      {
        expectedAuthorizationSha256,
        identity,
        now,
        planSha256,
        serializedBytes: bytes
      }
    );
  } catch (error) {
    if (error instanceof D2CleanupError) throw error;
    fail("SYNTHETIC_FIXTURE_AUTHORIZATION_INVALID");
  }
  const lockPath = resolve(MANIFEST_ROOT, `${identity.runMarker}.synthetic-fixture.lifecycle.lock`);
  if (dirname(lockPath) !== resolve(MANIFEST_ROOT)) fail("SYNTHETIC_FIXTURE_LOCK_UNSAFE");
  let handle;
  try {
    handle = await open(lockPath, "wx", 0o600);
    await handle.writeFile(`${JSON.stringify({
      schemaVersion: 1,
      mode: SYNTHETIC_FIXTURE_MODE,
      bindingHash: hashFull(JSON.stringify({ ...identity, planSha256,
        expectedAuthorizationSha256 })),
      phase: "claimed"
    })}\n`, "utf8");
    await handle.sync();
    await handle.close();
    handle = undefined;
  } catch (error) {
    await handle?.close().catch(() => undefined);
    if (error?.code === "EEXIST") fail("SYNTHETIC_FIXTURE_ALREADY_CLAIMED");
    fail("SYNTHETIC_FIXTURE_LOCK_FAILED");
  }
  let finalized = false;
  return {
    authorization,
    authorizationSha256: expectedAuthorizationSha256,
    async finalize(state) {
      if (finalized) fail("SYNTHETIC_FIXTURE_LOCK_ALREADY_FINALIZED");
      finalized = true;
      const stat = await lstat(lockPath);
      if (stat.isSymbolicLink() || !stat.isFile() || await realpath(lockPath) !== lockPath) {
        fail("SYNTHETIC_FIXTURE_LOCK_UNSAFE");
      }
      const stateHandle = await open(lockPath, "r+");
      try {
        await stateHandle.truncate(0);
        await stateHandle.writeFile(`${JSON.stringify({
          schemaVersion: 1,
          mode: SYNTHETIC_FIXTURE_MODE,
          authorizationLabel: hashId(expectedAuthorizationSha256),
          ...state
        })}\n`, "utf8");
        await stateHandle.sync();
      } finally {
        await stateHandle.close();
      }
    }
  };
}

export async function consumeD2SyntheticFixtureAuthorizationForTest(input) {
  if (process.env.NODE_ENV !== "test") fail("SYNTHETIC_FIXTURE_TEST_SEAM_FORBIDDEN");
  return consumeSyntheticFixtureAuthorization(input);
}

function safeFailurePayload(error) {
  if (!(error instanceof D2CleanupError)) return { code: "D2C_TOOL_FAILED" };
  const residual = error.residualManifest;
  const safeResidual = residual?.kind === "issue-0033-d2-synthetic-fixture-residual"
    ? {
        schemaVersion: residual.schemaVersion,
        kind: residual.kind,
        completedSteps: residual.completedSteps,
        permittedNextAction: residual.permittedNextAction,
        runMarkerLabel: hashId(residual.runMarker),
        targetLabels: Object.fromEntries(TARGET_COLLECTIONS.map((collection) => [
          collection,
          residual.capturedTargets?.[collection]?.id
            ? hashId(residual.capturedTargets[collection].id)
            : null
        ]))
      }
    : residual;
  return {
    code: error.code,
    ...(error.progress ? { progress: error.progress } : {}),
    ...(safeResidual ? { residualManifest: safeResidual } : {}),
    ...(error.residualArtifact ? { residualArtifact: error.residualArtifact } : {})
  };
}

async function runCli(argv) {
  const options = parseCleanupArgs(argv);
  if (options.mode === SYNTHETIC_FIXTURE_PLAN_MODE) {
    const plan = createD2SyntheticFixtureMachinePlan(options);
    const outputPath = await writeProtectedJsonArtifact(
      plan,
      `${options.runMarker}.synthetic-fixture.plan.json`
    );
    const planSha256 = hashFull(JSON.stringify(plan));
    process.stdout.write(`${JSON.stringify({
      ok: true,
      mode: SYNTHETIC_FIXTURE_PLAN_MODE,
      outputPath,
      planSha256,
      runMarkerLabel: hashId(options.runMarker),
      ownerLabel: hashId(options.ownerId),
      participantLabel: hashId(options.participantId)
    })}\n`);
    return;
  }
  if (options.mode === SYNTHETIC_FIXTURE_AUTH_MODE) {
    await assertSafeArtifactFile(options.prepareArtifactPath, "PREPARE_OUTPUT_PATH_INVALID");
    await assertSafeArtifactFile(options.approvalPath, "APPROVAL_PATH_INVALID");
    await verifyPreFixtureProbeClaim(options.runMarker);
    let prepareOutput;
    let approvalArtifactBytes;
    try {
      prepareOutput = JSON.parse(await readFile(options.prepareArtifactPath, "utf8"));
      approvalArtifactBytes = await readFile(options.approvalPath);
    } catch {
      fail("SYNTHETIC_FIXTURE_AUTHORIZATION_INPUT_INVALID");
    }
    const authorization = buildSyntheticFixtureAuthorization({
      approvalArtifactBytes,
      expectedApprovalSha256: options.expectedApprovalSha256,
      expectedFixturePlanSha256: options.expectedFixturePlanSha256,
      issuedAt: new Date().toISOString(),
      nonce: createRandomUUID(),
      prepareOutput
    });
    const outputPath = await writeSyntheticFixtureAuthorization(authorization);
    const authorizationBytes = await readFile(outputPath);
    process.stdout.write(`${JSON.stringify({
      ok: true,
      mode: SYNTHETIC_FIXTURE_AUTH_MODE,
      authorizationLabel: hashId(hashFull(authorizationBytes)),
      authorizationSha256: hashFull(authorizationBytes),
      outputPath
    })}\n`);
    return;
  }
  const secretId = process.env.TENCENTCLOUD_SECRETID?.trim();
  const secretKey = process.env.TENCENTCLOUD_SECRETKEY?.trim();
  const sessionToken = process.env.TENCENTCLOUD_SESSIONTOKEN?.trim();
  if (!secretId || !secretKey) fail("CREDENTIALS_MISSING");
  const app = tcb.init({
    env: options.envId,
    secretId,
    secretKey,
    ...(sessionToken ? { sessionToken } : {})
  });

  if (options.mode === "prepare") {
    const prepared = await runD2Prepare({
      adapter: createCloudBasePrepareAdapter(app.database(), options),
      envId: options.envId,
      ownerId: options.ownerId,
      participantId: options.participantId,
      runMarker: options.runMarker
    });
    const outputPath = await writePrepareOutput(prepared);
    process.stdout.write(`${JSON.stringify({
      ok: true,
      mode: "prepare",
      targetState: prepared.targetState,
      completeness: prepared.completeness,
      outputPath
    })}\n`);
    return;
  }

  if (options.mode === POST_FIXTURE_PREPARE_MODE) {
    await assertSafeArtifactFile(
      options.manifestPath,
      "POST_FIXTURE_PREPARE_MANIFEST_PATH_INVALID"
    );
    let expectedManifest;
    try {
      expectedManifest = JSON.parse(await readFile(options.manifestPath, "utf8"));
    } catch {
      fail("POST_FIXTURE_PREPARE_MANIFEST_INVALID");
    }
    const adapter = createCloudBasePostFixturePrepareAdapter(app.database(), {
      ...options,
      expectedManifest
    });
    const prepared = await runD2PostFixturePrepare({
      adapter,
      envId: options.envId,
      expectedManifest,
      ownerId: options.ownerId,
      participantId: options.participantId,
      runMarker: options.runMarker
    });
    const outputPath = await writePostFixturePrepareOutput(prepared);
    process.stdout.write(`${JSON.stringify({
      ok: true,
      mode: POST_FIXTURE_PREPARE_MODE,
      targetState: prepared.targetState,
      completeness: prepared.completeness,
      auditCount: prepared.audits.count,
      outputPath,
      writeCounters: prepared.writeCounters
    })}\n`);
    return;
  }

  if (options.mode === POST_CLEANUP_VERIFY_MODE) {
    await assertSafeArtifactFile(
      options.manifestPath,
      "POST_CLEANUP_VERIFY_MANIFEST_PATH_INVALID"
    );
    await assertSafeArtifactFile(options.approvalPath, "POST_CLEANUP_VERIFY_APPROVAL_PATH_INVALID");
    const finalReceiptPath = join(
      MANIFEST_ROOT,
      `${options.runMarker}.cleanup.final.receipt.json`
    );
    await assertSafeArtifactFile(finalReceiptPath, "POST_CLEANUP_FINAL_RECEIPT_PATH_INVALID");
    let manifestBytes;
    let approvalArtifactBytes;
    let finalReceiptBytes;
    let expectedManifest;
    let finalReceipt;
    try {
      [manifestBytes, approvalArtifactBytes, finalReceiptBytes] = await Promise.all([
        readFile(options.manifestPath),
        readFile(options.approvalPath),
        readFile(finalReceiptPath)
      ]);
      expectedManifest = JSON.parse(manifestBytes.toString("utf8"));
      finalReceipt = JSON.parse(finalReceiptBytes.toString("utf8"));
    } catch {
      fail("POST_CLEANUP_VERIFY_ARTIFACT_INVALID");
    }
    const manifestSha256 = hashFull(manifestBytes);
    const approvalSha256 = hashFull(approvalArtifactBytes);
    const finalCleanupReceiptSha256 = hashFull(finalReceiptBytes);
    validateFinalCleanupReceipt({
      approvalSha256,
      manifestSha256,
      receipt: finalReceipt,
      receiptSha256: finalCleanupReceiptSha256,
      runMarker: options.runMarker
    });
    const codeSha256 = hashFull(await readFile(fileURLToPath(import.meta.url)));
    const adapter = createCloudBasePostCleanupVerifyAdapter(app.database(), {
      ...options,
      expectedManifest
    });
    const verified = await runD2PostCleanupVerify({
      adapter,
      approvalArtifactBytes,
      artifactBindings: {
        approvalSha256,
        codeSha256,
        finalCleanupReceiptSha256,
        manifestSha256
      },
      envId: options.envId,
      expectedApprovalSha256: options.expectedApprovalSha256,
      expectedManifest,
      now: () => new Date(),
      ownerId: options.ownerId,
      participantId: options.participantId,
      runMarker: options.runMarker
    });
    const outputPath = await writePostCleanupVerifyOutput(verified);
    process.stdout.write(`${JSON.stringify({
      ok: true,
      mode: POST_CLEANUP_VERIFY_MODE,
      targetState: verified.targetState,
      auditCount: verified.audits.count,
      outputPath,
      mutationCounters: verified.mutationCounters
    })}\n`);
    return;
  }

  if (options.mode === "pre-fixture-probe") {
    const result = await runD2PreFixtureProbe({
      adapter: createCloudBasePreFixtureProbeAdapter(app.database(), options),
      confirmExecute: options.confirmExecute,
      envId: options.envId,
      runMarker: options.runMarker
    });
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }

  if (options.mode === SYNTHETIC_FIXTURE_MODE) {
    const authorizationLease = await consumeSyntheticFixtureAuthorization({
      authorizationPath: options.authorizationPath,
      envId: options.envId,
      expectedAuthorizationSha256: options.expectedAuthorizationSha256,
      expectedFixturePlanSha256: options.expectedFixturePlanSha256,
      ownerId: options.ownerId,
      participantId: options.participantId,
      runMarker: options.runMarker
    });
    let result;
    try {
      result = await runD2SyntheticFixtureLifecycle({
        adapter: await createCloudBaseSyntheticFixtureAdapter(app.database(), options),
        authorizationLease,
        confirmExecute: options.confirmExecute,
        envId: options.envId,
        expectedFixturePlanSha256: options.expectedFixturePlanSha256,
        ownerId: options.ownerId,
        participantId: options.participantId,
        runMarker: options.runMarker
      });
    } catch (error) {
      if (error instanceof D2CleanupError &&
          error.residualManifest?.kind === "issue-0033-d2-synthetic-fixture-residual") {
        const residualPath = await writeProtectedJsonArtifact(
          error.residualManifest,
          `${options.runMarker}.synthetic-fixture.residual.json`
        );
        error.residualArtifact = {
          path: residualPath,
          sha256: hashFull(await readFile(residualPath))
        };
      }
      throw error;
    }
    const manifestPath = await writeProtectedJsonArtifact(
      result.manifest,
      `${options.runMarker}.json`
    );
    process.stdout.write(`${JSON.stringify({
      ok: true,
      phase: result.phase,
      planSha256: result.planSha256,
      manifestPath,
      manifestSha256: hashFull(await readFile(manifestPath)),
      targetLabels: Object.fromEntries(TARGET_COLLECTIONS.map((collection) => [
        collection,
        hashId(result.manifest.targets[collection].id)
      ])),
      auditCount: result.auditIds.length,
      gates: result.gates
    })}\n`);
    return;
  }

  await assertSafeArtifactFile(options.manifestPath, "MANIFEST_PATH_INVALID");
  await assertSafeArtifactFile(options.approvalPath, "APPROVAL_PATH_INVALID");
  let manifest;
  let approvalArtifactBytes;
  try {
    manifest = JSON.parse(await readFile(options.manifestPath, "utf8"));
    approvalArtifactBytes = await readFile(options.approvalPath);
  } catch {
    fail("ARTIFACT_FILE_INVALID");
  }
  let resumeState;
  if (options.resumeStatePath) {
    await assertSafeArtifactFile(options.resumeStatePath, "RESIDUAL_PATH_INVALID");
    try {
      resumeState = JSON.parse(await readFile(options.resumeStatePath, "utf8"));
    } catch {
      fail("RESIDUAL_FILE_INVALID");
    }
  }
  const validatedManifest = validateManifest({
    envId: options.envId,
    manifest,
    runMarker: options.runMarker
  });
  const approval = validateApprovalArtifact({
    approvalArtifactBytes,
    expectedApprovalSha256: options.expectedApprovalSha256,
    manifest: validatedManifest,
    now: () => new Date()
  });
  if (basename(options.approvalPath) !== `${approval.approvalId}.json`) {
    fail("APPROVAL_PATH_ID_MISMATCH");
  }

  const approvalInput = {
    approvalArtifactBytes,
    expectedApprovalSha256: options.expectedApprovalSha256,
    now: () => new Date()
  };
  const result = await runD2Cleanup({
    adapter: createCloudBaseAdapter(app.database(), validatedManifest, approvalInput),
    ...approvalInput,
    confirmExecute: options.confirmExecute,
    envId: options.envId,
    manifest: validatedManifest,
    mode: options.mode,
    resumeState,
    runMarker: options.runMarker
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const invokedAsScript =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedAsScript) {
  runCli(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${JSON.stringify(safeFailurePayload(error))}\n`);
    process.exitCode = 1;
  });
}
