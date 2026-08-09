export const PROD_CLOUDBASE_ENV_ID: string;
export const MANIFEST_ROOT: string;
export const PROFILE_APPROVAL_STATEMENT: string;

export type D2CliMode =
  | "prepare"
  | "post-fixture-prepare"
  | "post-cleanup-verify"
  | "pre-fixture-probe"
  | "synthetic-fixture-authorize"
  | "synthetic-fixture-plan"
  | "synthetic-fixture-lifecycle"
  | D2CleanupMode;
export type D2CleanupMode = "dry-run" | "probe" | "cleanup";
export type D2TargetCollection =
  | "messages"
  | "contact_exchange_requests"
  | "conversations"
  | "parent_needs";
export type D2ContactProfileRole = "owner" | "participant";
export type CloudBaseExactResult = { data?: unknown };
export type CloudBaseRemoveResult = { deleted?: unknown };

export type D2PrepareTargetState = "ABSENT" | "PARTIAL" | "COMPLETE";
export type D2PrepareTargets = Record<
  D2TargetCollection,
  { id: string } | null
>;

export type D2PrepareDiscoverySnapshot = {
  completeness: "COMPLETE" | "INCOMPLETE";
  targetState: D2PrepareTargetState;
  legacyDenylist: Record<D2TargetCollection, string[]>;
  targets: D2PrepareTargets;
};

export type D2PrepareAdapter = {
  readDiscoverySnapshot(): Promise<D2PrepareDiscoverySnapshot>;
  readProfileProjection(role: D2ContactProfileRole): Promise<CloudBaseExactResult>;
};

export type D2PostFixturePrepareAdapter = D2PrepareAdapter & {
  readAudit(version: 1 | 2 | 3 | 4 | 5): Promise<CloudBaseExactResult>;
};

export type D2PostCleanupVerifyAdapter = D2PostFixturePrepareAdapter & {
  readTarget(collection: D2TargetCollection): Promise<CloudBaseExactResult>;
};

export type D2PrepareOutputIo = {
  mkdir(path: string, options: { recursive: true }): Promise<unknown>;
  lstat(path: string): Promise<{
    isDirectory(): boolean;
    isFile(): boolean;
    isSymbolicLink(): boolean;
  }>;
  realpath(path: string): Promise<string>;
  open(path: string, flags: "wx", mode: number): Promise<{
    writeFile(value: string, encoding: "utf8"): Promise<unknown>;
    sync(): Promise<unknown>;
    close(): Promise<unknown>;
  }>;
  link(existingPath: string, newPath: string): Promise<unknown>;
  unlink(path: string): Promise<unknown>;
};

export type D2LegacyUniverseSnapshot = {
  complete: boolean;
  collections: Record<D2TargetCollection, string[]>;
};

export type D2CleanupAdapter = {
  readTarget(collection: D2TargetCollection): Promise<CloudBaseExactResult>;
  removeTarget(collection: D2TargetCollection): Promise<CloudBaseRemoveResult>;
  readContactProfile(role: D2ContactProfileRole): Promise<CloudBaseExactResult>;
  readAudit(version: 1 | 2 | 3 | 4 | 5): Promise<CloudBaseExactResult>;
  readLegacyUniverse(): Promise<D2LegacyUniverseSnapshot>;
  readProbe(
    collection: D2TargetCollection,
    probeId: string
  ): Promise<CloudBaseExactResult>;
  removeProbe(
    collection: D2TargetCollection,
    probeId: string
  ): Promise<CloudBaseRemoveResult>;
};

export type D2PreFixtureProbeOperation = {
  idLabel: string;
  read(): Promise<CloudBaseExactResult>;
  remove(): Promise<CloudBaseRemoveResult>;
};

export type D2PreFixtureProbeAdapter = Record<
  D2TargetCollection,
  D2PreFixtureProbeOperation
>;

export type D2SyntheticFixtureResult<T extends Record<string, unknown> = Record<string, unknown>> =
  | { ok: true; status?: number; value: T; errors: Record<string, never> }
  | { ok: false; status: number; value: null; errors: { request: string } };

export type D2SyntheticFixtureAdapter = {
  readPreflightSnapshot(): Promise<D2PrepareDiscoverySnapshot>;
  readProfileProjection(role: D2ContactProfileRole): Promise<CloudBaseExactResult>;
  createSource(input: { input: Record<string, unknown>; now: string }): Promise<D2SyntheticFixtureResult>;
  updateSource(input: {
    expectedVersion: number;
    id: string;
    input: Record<string, unknown>;
    now: string;
  }): Promise<D2SyntheticFixtureResult>;
  deleteSource(input: {
    expectedVersion: number;
    id: string;
    idempotencyKey: string;
    now: string;
  }): Promise<D2SyntheticFixtureResult>;
  restoreSource(input: {
    expectedVersion: number;
    id: string;
    idempotencyKey: string;
    now: string;
  }): Promise<D2SyntheticFixtureResult>;
  createConversation(input: {
    now: string;
    preallocatedId?: string;
    sourceId: string;
    sourceType: "parent-need";
  }): Promise<D2SyntheticFixtureResult>;
  sendMessage(input: {
    conversationId: string;
    now: string;
    preallocatedId?: string;
    text: string;
  }): Promise<D2SyntheticFixtureResult>;
  createContactRequest(input: {
    conversationId: string;
    now: string;
    preallocatedId?: string;
  }): Promise<D2SyntheticFixtureResult>;
  approveContactRequest(input: {
    approvalIdempotencyKey?: string;
    now: string;
    requestId: string;
    secondConfirmation: true;
  }): Promise<D2SyntheticFixtureResult>;
  readSource(id: string): Promise<CloudBaseExactResult>;
  readConversation(id: string): Promise<CloudBaseExactResult>;
  readMessage(id: string): Promise<CloudBaseExactResult>;
  readRequest(id: string): Promise<CloudBaseExactResult>;
  readAudit(sourceId: string, version: number): Promise<CloudBaseExactResult>;
  countMessages(conversationId: string): Promise<number>;
  countRequests(conversationId: string): Promise<number>;
  hasAuthorizedProfiles(conversationId: string): Promise<boolean>;
};

export type D2PreFixtureProbeClaimIo = {
  mkdir(path: string, options: { recursive: true }): Promise<unknown>;
  lstat(path: string): Promise<{
    isDirectory(): boolean;
    isSymbolicLink(): boolean;
  }>;
  realpath(path: string): Promise<string>;
  open(path: string, flags: "wx", mode: number): Promise<{
    writeFile(value: string, encoding: "utf8"): Promise<unknown>;
    sync(): Promise<unknown>;
    close(): Promise<unknown>;
  }>;
};

export type D2CleanupManifest = {
  schemaVersion: 3;
  envId: string;
  runMarker: string;
  participants: { ownerId: string; participantId: string };
  targets: Record<D2TargetCollection, { id: string }>;
  legacyDenylist: Record<D2TargetCollection, string[]>;
};

export type D2ContactProfileApproval = {
  schemaVersion: 1;
  approvalId: string;
  statement: string;
  profiles: Array<{
    role: D2ContactProfileRole;
    id: string;
    ownerUserId: string;
    updatedAt: string;
  }>;
  nonce: string;
  issuedAt: string;
};

export type D2PrepareOutput = {
  schemaVersion: 1;
  kind: "issue-0033-d2-prepare";
  envId: string;
  runMarker: string;
  participants: { ownerId: string; participantId: string };
  completeness: "COMPLETE";
  targetState: D2PrepareTargetState;
  legacyDenylist: Record<D2TargetCollection, string[]>;
  targets: D2PrepareTargets;
  manifestCandidate: D2CleanupManifest | null;
  profileApprovalProjection: Array<{
    role: D2ContactProfileRole;
    id: string;
    ownerUserId: string;
    updatedAt: string;
  }>;
  approvalState: "EXTERNAL_APPROVAL_REQUIRED";
};

export type D2PostFixturePrepareOutput = {
  schemaVersion: 1;
  kind: "issue-0033-d2-post-fixture-prepare";
  mode: "post-fixture-prepare";
  envId: string;
  runMarker: string;
  participants: { ownerId: string; participantId: string };
  completeness: "COMPLETE";
  targetState: "PRESENT";
  legacyDenylist: Record<D2TargetCollection, string[]>;
  targets: Record<D2TargetCollection, { id: string }>;
  manifestCandidate: D2CleanupManifest;
  profileApprovalProjection: D2PrepareOutput["profileApprovalProjection"];
  approvalState: "EXTERNAL_APPROVAL_REQUIRED";
  audits: {
    state: "PRESENT_BUT_RETAINED";
    count: 5;
    labels: string[];
  };
  writeCounters: {
    transactions: 0;
    creates: 0;
    updates: 0;
    removes: 0;
  };
};

export type D2PostCleanupVerifyOutput = {
  schemaVersion: 1;
  kind: "issue-0033-d2-post-cleanup-verify";
  mode: "post-cleanup-verify";
  envId: string;
  runMarker: string;
  participants: { ownerId: string; participantId: string };
  completeness: "COMPLETE";
  targetState: "ABSENT";
  targets: Record<D2TargetCollection, { count: 0; label: string }>;
  legacyDenylist: Record<D2TargetCollection, string[]>;
  profileApprovalProjection: D2PrepareOutput["profileApprovalProjection"];
  audits: { state: "PRESENT_BUT_RETAINED"; count: 5; labels: string[] };
  bindings: {
    codeSha256: string;
    manifestSha256: string;
    approvalSha256: string;
    finalCleanupReceiptSha256: string;
    legacyBaselineSha256: string;
  };
  mutationCounters: { transactions: 0; adds: 0; sets: 0; updates: 0; removes: 0 };
};

export type D2ResidualManifest = {
  schemaVersion: 1;
  runMarkerHash: string;
  completedCollections: D2TargetCollection[];
  residualCollections: D2TargetCollection[];
  resumeToken: string;
};

export type D2SyntheticFixtureResidualManifest = {
  schemaVersion: 1;
  kind: "issue-0033-d2-synthetic-fixture-residual";
  runMarker: string;
  participants: { ownerId: string; participantId: string };
  completedSteps: string[];
  capturedTargets: D2PrepareTargets;
  permittedNextAction: "READ_ONLY_VERIFY";
};

export type D2CleanupEvent = {
  collection: string;
  count: number;
  idLabel: string;
  stage: string;
};

export type D2SyntheticFixtureMachinePlan = {
  schemaVersion: 2;
  kind: "issue-0033-d2-synthetic-fixture-plan";
  mode: "synthetic-fixture-lifecycle";
  envId: string;
  runMarker: string;
  participants: { ownerId: string; participantId: string };
  sourceType: "parent-need";
  targetLimits: Record<D2TargetCollection, 1>;
  lifecycle: Array<{
    action: "create" | "update" | "delete" | "restore";
    status: "published" | "deleted";
    version: number;
  }>;
  expectedWrites: {
    sourceTransactions: 5;
    documentSetCalls: 20;
    targetDocuments: 4;
    auditDocumentsRetained: 5;
  };
  authorizationRequirements: {
    bindingFields: string[];
    preFixtureClaim: "EXACT_EXISTING_NON_LINK";
    lifecycleAuthorization: "EXTERNAL_ARTIFACT_SHA256_AND_EXCLUSIVE_LOCK";
    legacyBaseline: "DOUBLE_SNAPSHOT_EXACT_SET_MATCH";
    contactProfiles: "DOUBLE_SNAPSHOT_EXTERNAL_APPROVAL_EXACT_MATCH";
  };
  steps: Array<{ index: number; name: string }>;
  failurePolicy: {
    automaticCleanup: false;
    automaticRetry: false;
    nextAction: "READ_ONLY_VERIFY";
  };
};

export class D2CleanupError extends Error {
  code: string;
  progress?:
    | {
        completedCollections: D2TargetCollection[];
        failedCollection: D2TargetCollection;
        events: D2CleanupEvent[];
      }
    | { completedSteps: string[]; failedStep: string };
  residualManifest?: D2ResidualManifest | D2SyntheticFixtureResidualManifest;
}

export function createExecutionConfirmation(
  mode:
    | "pre-fixture-probe"
    | "synthetic-fixture-lifecycle"
    | Exclude<D2CleanupMode, "dry-run">,
  runMarker: string,
  residualState?: D2ResidualManifest
): string;

export function createSyntheticFixtureExecutionConfirmation(input: {
  envId: string;
  expectedAuthorizationSha256: string;
  expectedFixturePlanSha256: string;
  now?: () => Date;
  ownerId: string;
  participantId: string;
  runMarker: string;
}): string;

export function createD2SyntheticFixtureMachinePlan(input: {
  envId: string;
  ownerId: string;
  participantId: string;
  runMarker: string;
}): D2SyntheticFixtureMachinePlan;

export function loadD2SyntheticFixtureDomain(): Promise<Record<
  | "approveServerContactExchangeRequest"
  | "createOrReadServerConversationFromSource"
  | "createServerContactExchangeRequest"
  | "deleteServerParentNeed"
  | "readServerAuthorizedContactProfiles"
  | "restoreServerParentNeed"
  | "saveServerParentNeed"
  | "sendServerConversationMessage"
  | "updateServerParentNeed",
  (...args: never[]) => unknown
>>;

export function deriveAuditId(sourceId: string, version: number): string;

export function parseCleanupArgs(argv: string[]): {
  approvalPath: string | undefined;
  authorizationPath: string | undefined;
  confirmExecute: string | undefined;
  envId: string;
  expectedApprovalSha256: string | undefined;
  expectedAuthorizationSha256: string | undefined;
  expectedFixturePlanSha256: string | undefined;
  manifestPath: string | undefined;
  mode: D2CliMode;
  ownerId: string | undefined;
  participantId: string | undefined;
  prepareArtifactPath: string | undefined;
  resumeStatePath: string | undefined;
  runMarker: string;
};

export function createCloudBasePrepareAdapter(
  database: unknown,
  input: {
    envId: string;
    ownerId: string;
    participantId: string;
    runMarker: string;
  }
): D2PrepareAdapter;

export function createCloudBasePostFixturePrepareAdapter(
  database: unknown,
  input: {
    envId: string;
    expectedManifest: D2CleanupManifest;
    ownerId: string;
    participantId: string;
    runMarker: string;
  }
): D2PostFixturePrepareAdapter;

export function createCloudBasePostCleanupVerifyAdapter(
  database: unknown,
  input: {
    envId: string;
    expectedManifest: D2CleanupManifest;
    ownerId: string;
    participantId: string;
    runMarker: string;
  }
): D2PostCleanupVerifyAdapter;

export function createCloudBasePreFixtureProbeAdapter(
  database: unknown,
  input: {
    envId: string;
    randomUUID?: () => string;
    runMarker: string;
  }
): D2PreFixtureProbeAdapter;

export function createCloudBaseSyntheticFixtureAdapter(
  database: unknown,
  input: {
    envId: string;
    ownerId: string;
    participantId: string;
    runMarker: string;
  }
): Promise<D2SyntheticFixtureAdapter>;

export function createD2SyntheticFixtureTestAdapter(
  database: unknown,
  input: {
    envId: string;
    ownerId: string;
    participantId: string;
    runMarker: string;
  },
  domain: Record<string, (...args: never[]) => unknown>
): Promise<D2SyntheticFixtureAdapter>;

export function claimPreFixtureProbeExecution(
  runMarker: string,
  options?: { io?: D2PreFixtureProbeClaimIo }
): Promise<void>;

export function verifyPreFixtureProbeClaim(
  runMarker: string,
  options?: {
    io?: Pick<D2PreFixtureProbeClaimIo, "lstat" | "realpath"> & {
      readFile(path: string, encoding: "utf8"): Promise<string>;
    };
  }
): Promise<string>;

export function runD2PreFixtureProbe(input: {
  adapter: D2PreFixtureProbeAdapter;
  claimExecution?: () => Promise<void>;
  confirmExecute: string;
  envId: string;
  runMarker: string;
}): Promise<{
  events: D2CleanupEvent[];
  ok: true;
  phase: "pre-fixture-probe-complete";
}>;

export function runD2SyntheticFixtureLifecycleForTest(input: {
  adapter: D2SyntheticFixtureAdapter;
  authorizationLease: {
    authorization: {
      envId: string;
      runMarker: string;
      participants: { ownerId: string; participantId: string };
      planSha256: string;
      legacyBaselineSha256: string;
      legacyDenylist: Record<D2TargetCollection, string[]>;
      profileProjections: D2ContactProfileApproval["profiles"];
    };
    authorizationSha256: string;
    finalize(state: Record<string, unknown>): Promise<void>;
  };
  confirmExecute: string;
  envId: string;
  expectedFixturePlanSha256: string;
  now?: () => Date;
  ownerId: string;
  participantId: string;
  runMarker: string;
}): Promise<{
  ok: true;
  phase: "synthetic-fixture-complete";
  planSha256: string;
  manifest: D2CleanupManifest;
  auditIds: string[];
  lifecycle: { status: "published"; version: 5 };
  gates: {
    deletedMessageStatus: 403;
    deletedContactStatus: 403;
    deletedAuthorizedProfilesVisible: false;
    restoredAuthorizedProfilesVisible: true;
  };
  events: Array<{ stage: string; status: "complete" }>;
}>;

export function createD2SyntheticFixtureAuthorizationForTest(input: {
  approvalArtifactBytes: string | Uint8Array;
  expectedApprovalSha256: string;
  expectedFixturePlanSha256: string;
  issuedAt: string;
  nonce: string;
  prepareOutput: D2PrepareOutput;
}): Record<string, unknown>;

export function writeD2SyntheticFixtureAuthorizationForTest(
  value: Record<string, unknown>,
  options?: { io?: D2PrepareOutputIo; randomUUID?: () => string }
): Promise<string>;

export function consumeD2SyntheticFixtureAuthorizationForTest(input: {
  authorizationPath: string;
  envId: string;
  expectedAuthorizationSha256: string;
  expectedFixturePlanSha256: string;
  ownerId: string;
  participantId: string;
  runMarker: string;
}): Promise<{
  authorization: {
    profileProjections: D2ContactProfileApproval["profiles"];
    [key: string]: unknown;
  };
  authorizationSha256: string;
  finalize(state: Record<string, unknown>): Promise<void>;
}>;

export function runD2Prepare(input: {
  adapter: D2PrepareAdapter;
  envId: string;
  ownerId: string;
  participantId: string;
  runMarker: string;
}): Promise<D2PrepareOutput>;

export function runD2PostFixturePrepare(input: {
  adapter: D2PostFixturePrepareAdapter;
  envId: string;
  expectedManifest: D2CleanupManifest;
  ownerId: string;
  participantId: string;
  runMarker: string;
}): Promise<D2PostFixturePrepareOutput>;

export function runD2PostCleanupVerify(input: {
  adapter: D2PostCleanupVerifyAdapter;
  approvalArtifactBytes: string | Uint8Array;
  artifactBindings: {
    codeSha256: string;
    manifestSha256: string;
    approvalSha256: string;
    finalCleanupReceiptSha256: string;
  };
  envId: string;
  expectedApprovalSha256: string;
  expectedManifest: D2CleanupManifest;
  now?: () => Date;
  ownerId: string;
  participantId: string;
  runMarker: string;
}): Promise<D2PostCleanupVerifyOutput>;

export function writePrepareOutput(
  value: D2PrepareOutput,
  options?: {
    io?: D2PrepareOutputIo;
    randomUUID?: () => string;
  }
): Promise<string>;

export function writePostFixturePrepareOutput(
  value: D2PostFixturePrepareOutput,
  options?: {
    io?: D2PrepareOutputIo;
    randomUUID?: () => string;
  }
): Promise<string>;

export function writePostCleanupVerifyOutput(
  value: D2PostCleanupVerifyOutput,
  options?: {
    io?: D2PrepareOutputIo;
    randomUUID?: () => string;
  }
): Promise<string>;

export function createCloudBaseAdapter(
  database: unknown,
  manifest: D2CleanupManifest,
  approvalInput: {
    approvalArtifactBytes: string | Uint8Array;
    expectedApprovalSha256: string;
    now?: () => Date;
  }
): D2CleanupAdapter;

export function runD2Cleanup(input: {
  adapter: D2CleanupAdapter;
  approvalArtifactBytes: string | Uint8Array;
  confirmExecute?: string;
  envId: string;
  expectedApprovalSha256: string;
  manifest: D2CleanupManifest;
  mode?: D2CleanupMode;
  now?: () => Date;
  randomUUID?: () => string;
  resumeState?: D2ResidualManifest;
  runMarker: string;
}): Promise<{
  events: D2CleanupEvent[];
  ok: true;
  phase: string;
}>;
