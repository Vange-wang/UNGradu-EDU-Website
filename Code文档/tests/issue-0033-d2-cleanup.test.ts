import { createHash } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdir, readFile, readdir, rmdir, symlink, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

import { describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import * as cleanupModule from "../scripts/issue-0033-d2-cleanup.mjs";
import {
  claimPreFixtureProbeExecution,
  consumeD2SyntheticFixtureAuthorizationForTest,
  createCloudBaseAdapter,
  createCloudBasePreFixtureProbeAdapter,
  createCloudBasePostFixturePrepareAdapter,
  createCloudBasePostCleanupVerifyAdapter,
  createCloudBasePrepareAdapter,
  createCloudBaseSyntheticFixtureAdapter,
  createD2SyntheticFixtureTestAdapter,
  createD2SyntheticFixtureMachinePlan,
  createD2SyntheticFixtureAuthorizationForTest,
  createExecutionConfirmation,
  createSyntheticFixtureExecutionConfirmation,
  D2CleanupError,
  deriveAuditId,
  MANIFEST_ROOT,
  parseCleanupArgs,
  PROD_CLOUDBASE_ENV_ID,
  PROFILE_APPROVAL_STATEMENT,
  runD2Prepare,
  runD2PostFixturePrepare,
  runD2PostCleanupVerify,
  runD2Cleanup,
  runD2PreFixtureProbe,
  runD2SyntheticFixtureLifecycleForTest,
  verifyPreFixtureProbeClaim,
  writeD2SyntheticFixtureAuthorizationForTest,
  writePostFixturePrepareOutput,
  writePostCleanupVerifyOutput,
  writePrepareOutput
} from "../scripts/issue-0033-d2-cleanup.mjs";
import type {
  D2CleanupAdapter,
  D2CleanupManifest,
  D2LegacyUniverseSnapshot,
  D2PreFixtureProbeAdapter,
  D2PreFixtureProbeClaimIo,
  D2PrepareAdapter,
  D2PrepareDiscoverySnapshot,
  D2PrepareOutput,
  D2PrepareOutputIo,
  D2PostFixturePrepareAdapter,
  D2PostCleanupVerifyAdapter,
  D2ResidualManifest,
  D2SyntheticFixtureResidualManifest,
  D2SyntheticFixtureAdapter
} from "../scripts/issue-0033-d2-cleanup.mjs";

const RUN_MARKER =
  "i33-d2-052-20260805T120000Z-11111111-1111-4111-8111-111111111111";
const NOW = "2026-08-05T13:00:00.000Z";
const TARGET_COLLECTIONS = [
  "messages",
  "contact_exchange_requests",
  "conversations",
  "parent_needs"
] as const;
type ProfileRole = "owner" | "participant";

function sha256(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

function hashId(value: string) {
  return sha256(value).slice(0, 12);
}

function createManifest(): D2CleanupManifest {
  return {
    schemaVersion: 3,
    envId: PROD_CLOUDBASE_ENV_ID,
    runMarker: RUN_MARKER,
    participants: {
      ownerId: "synthetic-owner-i33-d2",
      participantId: "synthetic-participant-i33-d2"
    },
    targets: {
      messages: { id: "message-i33-d2" },
      contact_exchange_requests: { id: "contact-exchange-i33-d2" },
      conversations: { id: "conversation-i33-d2" },
      parent_needs: { id: "parent-need-i33-d2-source" }
    },
    legacyDenylist: {
      messages: ["legacy-parent-message-i33-d2", "legacy-tutor-message-i33-d2"],
      contact_exchange_requests: [
        "legacy-parent-request-i33-d2",
        "legacy-tutor-request-i33-d2"
      ],
      conversations: [
        "conversation-d43e1f63-3096-4723-a8a7-35342dd36f37",
        "legacy-conversation-i33-d2-second"
      ],
      parent_needs: ["parent-need-63a85ca8-4501-4501-9a90-4b911f737d0b"]
    }
  };
}

type ApprovalEnvelope = {
  schemaVersion: 1;
  approvalId: string;
  statement: string;
  profiles: Array<{
    role: ProfileRole;
    id: string;
    ownerUserId: string;
    updatedAt: string;
  }>;
  nonce: string;
  issuedAt: string;
};

function createApprovalEnvelope(
  manifest = createManifest(),
  overrides: Partial<ApprovalEnvelope> = {}
): ApprovalEnvelope {
  return {
    schemaVersion: 1,
    approvalId:
      "issue-0033-d2-profile-approval-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    statement: PROFILE_APPROVAL_STATEMENT,
    profiles: [
      {
        role: "owner",
        id: manifest.participants.ownerId,
        ownerUserId: manifest.participants.ownerId,
        updatedAt: "2026-08-05T12:00:00.000Z"
      },
      {
        role: "participant",
        id: manifest.participants.participantId,
        ownerUserId: manifest.participants.participantId,
        updatedAt: "2026-08-05T12:00:01.000Z"
      }
    ],
    nonce: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    issuedAt: "2026-08-05T12:30:00.000Z",
    ...overrides
  };
}

function createApprovalArtifact(
  manifest = createManifest(),
  overrides: Partial<ApprovalEnvelope> = {}
) {
  const envelope = createApprovalEnvelope(manifest, overrides);
  const bytes = JSON.stringify(envelope);
  return { bytes, envelope, sha256: sha256(bytes) };
}

function createLegacySnapshot(): D2LegacyUniverseSnapshot {
  return {
    complete: true,
    collections: {
      messages: [
        "legacy-parent-message-i33-d2",
        "legacy-tutor-message-i33-d2",
        "message-i33-d2"
      ],
      contact_exchange_requests: [
        "contact-exchange-i33-d2",
        "legacy-parent-request-i33-d2",
        "legacy-tutor-request-i33-d2"
      ],
      conversations: [
        "conversation-d43e1f63-3096-4723-a8a7-35342dd36f37",
        "conversation-i33-d2",
        "legacy-conversation-i33-d2-second"
      ],
      parent_needs: [
        "parent-need-63a85ca8-4501-4501-9a90-4b911f737d0b",
        "parent-need-i33-d2-source"
      ]
    }
  };
}

type UniverseRows = Record<string, Array<Record<string, unknown>>>;

function createIndependentUniverseRows(): UniverseRows {
  return {
    parent_needs: [
      {
        _id: "parent-need-63a85ca8-4501-4501-9a90-4b911f737d0b",
        id: "parent-need-63a85ca8-4501-4501-9a90-4b911f737d0b",
        status: "published",
        version: 0,
        createdAt: "2026-07-30T00:00:00.000Z"
      },
      {
        _id: "ordinary-parent-source",
        id: "ordinary-parent-source",
        status: "published",
        version: 2,
        updatedAt: "2026-08-01T00:00:00.000Z"
      },
      {
        _id: "parent-need-i33-d2-source",
        id: "parent-need-i33-d2-source",
        ownerUserId: "synthetic-owner-i33-d2",
        status: "published",
        version: 5,
        updatedAt: "2026-08-05T12:05:00.000Z",
        community: `synthetic-${RUN_MARKER}`,
        childIntro: `synthetic-${RUN_MARKER}`
      }
    ],
    tutor_profiles: [
      {
        _id: "legacy-tutor-source",
        id: "legacy-tutor-source",
        status: "published",
        createdAt: "2026-07-30T00:00:00.000Z"
      },
      {
        _id: "ordinary-tutor-source",
        id: "ordinary-tutor-source",
        status: "published",
        version: 3,
        updatedAt: "2026-08-01T00:00:00.000Z"
      }
    ],
    conversations: [
      {
        _id: "conversation-d43e1f63-3096-4723-a8a7-35342dd36f37",
        id: "conversation-d43e1f63-3096-4723-a8a7-35342dd36f37",
        sourceId: "parent-need-63a85ca8-4501-4501-9a90-4b911f737d0b",
        sourceType: "parent-need"
      },
      {
        _id: "legacy-conversation-i33-d2-second",
        id: "legacy-conversation-i33-d2-second",
        sourceId: "legacy-tutor-source",
        sourceType: "tutor-profile"
      },
      {
        _id: "ordinary-conversation-i33-d2",
        id: "ordinary-conversation-i33-d2",
        sourceId: "ordinary-parent-source",
        sourceType: "parent-need"
      },
      {
        _id: "conversation-i33-d2",
        id: "conversation-i33-d2",
        sourceId: "parent-need-i33-d2-source",
        sourceType: "parent-need",
        sourceStatus: "published",
        sourceVersion: 5,
        participantUserIds: ["synthetic-owner-i33-d2", "synthetic-participant-i33-d2"]
      }
    ],
    messages: [
      {
        _id: "legacy-parent-message-i33-d2",
        id: "legacy-parent-message-i33-d2",
        conversationId: "conversation-d43e1f63-3096-4723-a8a7-35342dd36f37"
      },
      {
        _id: "legacy-tutor-message-i33-d2",
        id: "legacy-tutor-message-i33-d2",
        conversationId: "legacy-conversation-i33-d2-second"
      },
      {
        _id: "ordinary-message-i33-d2",
        id: "ordinary-message-i33-d2",
        conversationId: "ordinary-conversation-i33-d2"
      },
      {
        _id: "message-i33-d2",
        id: "message-i33-d2",
        conversationId: "conversation-i33-d2",
        senderUserId: "synthetic-participant-i33-d2",
        text: `${RUN_MARKER} MUST-NOT-LEAK-MESSAGE`
      }
    ],
    contact_exchange_requests: [
      {
        _id: "legacy-parent-request-i33-d2",
        id: "legacy-parent-request-i33-d2",
        conversationId: "conversation-d43e1f63-3096-4723-a8a7-35342dd36f37"
      },
      {
        _id: "legacy-tutor-request-i33-d2",
        id: "legacy-tutor-request-i33-d2",
        conversationId: "legacy-conversation-i33-d2-second"
      },
      {
        _id: "ordinary-request-i33-d2",
        id: "ordinary-request-i33-d2",
        conversationId: "ordinary-conversation-i33-d2"
      },
      {
        _id: "contact-exchange-i33-d2",
        id: "contact-exchange-i33-d2",
        conversationId: "conversation-i33-d2",
        requesterUserId: "synthetic-participant-i33-d2",
        receiverUserId: "synthetic-owner-i33-d2",
        status: "approved",
        sourceStatus: "published",
        sourceVersion: 5
      }
    ],
    contact_profiles: [
      {
        _id: "synthetic-owner-i33-d2",
        id: "synthetic-owner-i33-d2",
        ownerUserId: "synthetic-owner-i33-d2",
        updatedAt: "2026-08-05T12:00:00.000Z",
        phone: "MUST-NOT-LEAK-OWNER"
      },
      {
        _id: "synthetic-participant-i33-d2",
        id: "synthetic-participant-i33-d2",
        ownerUserId: "synthetic-participant-i33-d2",
        updatedAt: "2026-08-05T12:00:01.000Z",
        wechat: "MUST-NOT-LEAK-PARTICIPANT"
      }
    ]
  };
}

function createUniverseDatabase(
  rows: UniverseRows,
  onGet?: (collection: string, skip: number, limit: number) => unknown,
  options: { ignoreProjection?: boolean } = {}
) {
  const calls: Array<{ collection: string; skip: number; limit: number }> = [];
  const fieldCalls: Array<{
    collection: string;
    kind: "query" | "document";
    fields: string[];
  }> = [];
  const mutations = {
    add: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    runTransaction: vi.fn()
  };

  function projectResult(
    value: unknown,
    projection: Record<string, boolean> | null
  ) {
    if (!projection || options.ignoreProjection || !value || typeof value !== "object") {
      return value;
    }
    const selected = new Set(
      Object.entries(projection).filter(([, enabled]) => enabled).map(([field]) => field)
    );
    const projectRow = (row: unknown) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) return row;
      return Object.fromEntries(
        Object.entries(row).filter(([field]) => selected.has(field))
      );
    };
    const result = value as { data?: unknown };
    return {
      ...result,
      data: Array.isArray(result.data)
        ? result.data.map(projectRow)
        : projectRow(result.data)
    };
  }

  const collection = vi.fn((name: string) => {
    const makeQuery = (selectRows: () => Array<Record<string, unknown>>) => {
      let querySkip = 0;
      let queryLimit = 100;
      let projection: Record<string, boolean> | null = null;
      const chained: Record<string, unknown> = {
        orderBy: vi.fn(() => chained),
        field: vi.fn((value: Record<string, boolean>) => {
          projection = value;
          fieldCalls.push({
            collection: name,
            kind: "query",
            fields: Object.keys(value).sort()
          });
          return chained;
        }),
        skip: vi.fn((value: number) => { querySkip = value; return chained; }),
        limit: vi.fn((value: number) => { queryLimit = value; return chained; }),
        get: vi.fn(async () => projectResult(
          { data: selectRows().slice(querySkip, querySkip + queryLimit) },
          projection
        ))
      };
      return chained;
    };
    let skip = 0;
    let limit = 100;
    let projection: Record<string, boolean> | null = null;
    const query: Record<string, unknown> = {
      orderBy: vi.fn(() => query),
      field: vi.fn((value: Record<string, boolean>) => {
        projection = value;
        fieldCalls.push({
          collection: name,
          kind: "query",
          fields: Object.keys(value).sort()
        });
        return query;
      }),
      skip: vi.fn((value: number) => { skip = value; return query; }),
      limit: vi.fn((value: number) => { limit = value; return query; }),
      get: vi.fn(async () => {
        calls.push({ collection: name, skip, limit });
        if (onGet) {
          const value = onGet(name, skip, limit);
          if (value !== undefined) return projectResult(value, projection);
        }
        return projectResult(
          { data: (rows[name] ?? []).slice(skip, skip + limit) },
          projection
        );
      }),
      doc: vi.fn((id: string) => {
        let documentProjection: Record<string, boolean> | null = null;
        const reference: Record<string, unknown> = {
          field: vi.fn((value: Record<string, boolean>) => {
            documentProjection = value;
            fieldCalls.push({
              collection: name,
              kind: "document",
              fields: Object.keys(value).sort()
            });
            return reference;
          }),
          get: vi.fn(async () => projectResult({
            data: (rows[name] ?? []).filter((row) => (row.id ?? row._id) === id)
          }, documentProjection)),
          set: vi.fn(async (data: Record<string, unknown>) => {
            mutations.set(name, id);
            const collectionRows = rows[name] ?? (rows[name] = []);
            const index = collectionRows.findIndex((row) => (row.id ?? row._id) === id);
            const stored = { ...data, id, _id: id };
            if (index >= 0) collectionRows[index] = stored;
            else collectionRows.push(stored);
            return { updated: 1 };
          }),
          update: vi.fn(async () => { mutations.update(name, id); return { updated: 1 }; }),
          remove: vi.fn(async () => { mutations.remove(name, id); return { deleted: 0 }; })
        };
        return reference;
      }),
      add: vi.fn(async () => { mutations.add(name); return { id: "fake-added-id" }; }),
      update: vi.fn(async () => { mutations.update(name); return { updated: 0 }; }),
      remove: vi.fn(async () => { mutations.remove(name); return { deleted: 0 }; }),
      where: vi.fn((filter: Record<string, unknown>) => makeQuery(() =>
        (rows[name] ?? []).filter((row) => Object.entries(filter).every(([key, value]) => {
          const actual = row[key];
          return Array.isArray(actual) ? actual.includes(value) : actual === value;
        }))
      ))
    };
    return query;
  });
  return {
    calls,
    collection,
    fieldCalls,
    mutations,
    runTransaction: vi.fn(async (operation: (transaction: { collection: typeof collection }) => unknown) => {
      mutations.runTransaction();
      return operation({ collection });
    })
  };
}

function createFixtureDocuments(
  manifest = createManifest(),
  approval = createApprovalEnvelope(manifest)
) {
  const { ownerId, participantId } = manifest.participants;
  const sourceId = manifest.targets.parent_needs.id;
  const conversationId = manifest.targets.conversations.id;
  const documents = new Map<string, Record<string, unknown>>([
    [
      `parent_needs:${sourceId}`,
      {
        id: sourceId,
        ownerUserId: ownerId,
        status: "published",
        version: 5,
        updatedAt: "2026-08-05T12:05:00.000Z",
        community: `synthetic-${RUN_MARKER}`,
        childIntro: `synthetic-${RUN_MARKER}`
      }
    ],
    [
      `conversations:${conversationId}`,
      {
        id: conversationId,
        sourceId,
        sourceType: "parent-need",
        sourceStatus: "published",
        sourceVersion: 5,
        participantUserIds: [ownerId, participantId]
      }
    ],
    [
      `messages:${manifest.targets.messages.id}`,
      {
        id: manifest.targets.messages.id,
        conversationId,
        senderUserId: participantId,
        text: `synthetic-message-${RUN_MARKER}`
      }
    ],
    [
      `contact_exchange_requests:${manifest.targets.contact_exchange_requests.id}`,
      {
        id: manifest.targets.contact_exchange_requests.id,
        conversationId,
        requesterUserId: participantId,
        receiverUserId: ownerId,
        status: "approved",
        sourceStatus: "published",
        sourceVersion: 5
      }
    ]
  ]);
  for (const profile of approval.profiles) {
    documents.set(`contact_profiles:${profile.id}`, { ...profile });
  }
  for (let version = 1; version <= 5; version += 1) {
    const action = ["create", "update", "delete", "restore", "update"][version - 1];
    const fromStatus = version === 1 ? null : version === 4 ? "deleted" : "published";
    const toStatus = version === 3 ? "deleted" : "published";
    const id = deriveAuditId(sourceId, version);
    documents.set(`audit_events:${id}`, {
      id,
      action,
      actorUserId: ownerId,
      occurredAt: `2026-08-05T12:0${version - 1}:00.000Z`,
      requestId: `synthetic-request-${version}`,
      result: "success",
      targetId: sourceId,
      targetType: "parent-need",
      from: version === 1 ? null : { status: fromStatus, version: version - 1 },
      to: { status: toStatus, version }
    });
  }
  return documents;
}

function resultFor(documents: Map<string, Record<string, unknown>>, key: string) {
  return { data: documents.has(key) ? documents.get(key) : undefined };
}

type FakeAdapter = {
  [Key in keyof D2CleanupAdapter]: Mock<D2CleanupAdapter[Key]>;
};

function createFakeAdapter(
  documents = createFixtureDocuments(),
  manifest = createManifest(),
  approval = createApprovalEnvelope(manifest)
): FakeAdapter {
  const legacyUniverse = createLegacySnapshot();
  const readTarget = vi.fn<D2CleanupAdapter["readTarget"]>(async (collection) =>
    resultFor(documents, `${collection}:${manifest.targets[collection].id}`)
  );
  const removeTarget = vi.fn<D2CleanupAdapter["removeTarget"]>(async (collection) => ({
    deleted: documents.delete(`${collection}:${manifest.targets[collection].id}`) ? 1 : 0
  }));
  const readContactProfile = vi.fn<D2CleanupAdapter["readContactProfile"]>(async (role) => {
    const profile = approval.profiles.find((item) => item.role === role)!;
    return resultFor(documents, `contact_profiles:${profile.id}`);
  });
  const readAudit = vi.fn<D2CleanupAdapter["readAudit"]>(async (version) =>
    resultFor(documents, `audit_events:${deriveAuditId(manifest.targets.parent_needs.id, version)}`)
  );
  const readLegacyUniverse = vi.fn<D2CleanupAdapter["readLegacyUniverse"]>(async () => ({
    complete: true,
    collections: Object.fromEntries(TARGET_COLLECTIONS.map((collection) => [
      collection,
      legacyUniverse.collections[collection].filter((id) =>
        id !== manifest.targets[collection].id ||
        documents.has(`${collection}:${manifest.targets[collection].id}`)
      )
    ])) as D2LegacyUniverseSnapshot["collections"]
  }));
  const readProbe = vi.fn<D2CleanupAdapter["readProbe"]>(async () => ({ data: undefined }));
  const removeProbe = vi.fn<D2CleanupAdapter["removeProbe"]>(async () => ({ deleted: 0 }));
  return {
    readTarget,
    removeTarget,
    readContactProfile,
    readAudit,
    readLegacyUniverse,
    readProbe,
    removeProbe
  };
}

type RunInput = Parameters<typeof runD2Cleanup>[0];
type TestRunInput = Omit<RunInput, "adapter"> & { adapter: FakeAdapter };

function runInput(overrides: Partial<TestRunInput> = {}): TestRunInput {
  const manifest = createManifest();
  const approval = createApprovalArtifact(manifest);
  const documents = createFixtureDocuments(manifest, approval.envelope);
  return {
    adapter: createFakeAdapter(documents, manifest, approval.envelope),
    approvalArtifactBytes: approval.bytes,
    envId: PROD_CLOUDBASE_ENV_ID,
    expectedApprovalSha256: approval.sha256,
    manifest,
    now: () => new Date(NOW),
    runMarker: RUN_MARKER,
    ...overrides
  };
}

function createFakePreFixtureProbeAdapter() {
  const reads = Object.fromEntries(TARGET_COLLECTIONS.map((collection) => [
    collection,
    vi.fn(async () => ({ data: undefined }))
  ])) as Record<(typeof TARGET_COLLECTIONS)[number], Mock>;
  const removes = Object.fromEntries(TARGET_COLLECTIONS.map((collection) => [
    collection,
    vi.fn(async () => ({ deleted: 0 }))
  ])) as Record<(typeof TARGET_COLLECTIONS)[number], Mock>;
  const adapter = Object.fromEntries(TARGET_COLLECTIONS.map((collection) => [
    collection,
    {
      idLabel: hashId(`pre-fixture-${collection}`),
      read: reads[collection],
      remove: removes[collection]
    }
  ])) as unknown as D2PreFixtureProbeAdapter;
  return { adapter, reads, removes };
}

function preFixtureProbeInput(adapter = createFakePreFixtureProbeAdapter().adapter) {
  return {
    adapter,
    claimExecution: vi.fn(async () => undefined),
    confirmExecute: createExecutionConfirmation("pre-fixture-probe", RUN_MARKER),
    envId: PROD_CLOUDBASE_ENV_ID,
    runMarker: RUN_MARKER
  };
}

function createFakeSyntheticFixtureAdapter() {
  const ownerId = "email_42322f7b8901e4fb8174c6c1";
  const participantId = "email_88cc6554aa448d72dc948fec";
  let source: Record<string, unknown> | null = null;
  let conversation: Record<string, unknown> | null = null;
  let message: Record<string, unknown> | null = null;
  let request: Record<string, unknown> | null = null;
  const audits = new Map<number, Record<string, unknown>>();
  const writeAudit = (version: number, action: string, status: string) => {
    const sourceId = String(source?.id ?? "");
    audits.set(version, {
      id: deriveAuditId(sourceId, version),
      action,
      actorUserId: ownerId,
      occurredAt: `2026-08-05T14:00:0${version}.000Z`,
      requestId: `synthetic-lifecycle-${version}`,
      result: "success",
      targetId: sourceId,
      targetType: "parent-need",
      from: version === 1 ? null : {
        status: version === 4 ? "deleted" : "published",
        version: version - 1
      },
      to: { status, version }
    });
  };
  const syncRelations = (status: string, version: number) => {
    if (conversation) {
      conversation = { ...conversation, sourceStatus: status, sourceVersion: version };
    }
    if (request) {
      request = { ...request, sourceStatus: status, sourceVersion: version };
    }
  };
  const ok = (value: unknown) => ({ ok: true, status: 200, value, errors: {} });
  const blocked = () => ({
    ok: false,
    status: 403,
    value: null,
    errors: { request: "关联发布已删除" }
  });
  const adapter = {
    readPreflightSnapshot: vi.fn<() => Promise<D2PrepareDiscoverySnapshot>>(async () => ({
      completeness: "COMPLETE",
      targetState: "ABSENT",
      legacyDenylist: createManifest().legacyDenylist,
      targets: {
        messages: null,
        contact_exchange_requests: null,
        conversations: null,
        parent_needs: null
      }
    })),
    readProfileProjection: vi.fn(async (role: ProfileRole) => ({ data: {
      id: role === "owner" ? ownerId : participantId,
      ownerUserId: role === "owner" ? ownerId : participantId,
      updatedAt: "2026-08-05T13:00:00.000Z"
    } })),
    createSource: vi.fn(async ({ input, now }: { input: Record<string, unknown>; now: string }) => {
      source = {
        ...input,
        id: "parent-need-synthetic-fixture",
        ownerUserId: ownerId,
        status: "published",
        version: 1,
        createdAt: now,
        updatedAt: now,
        managementState: "managed",
        deletedAt: null
      };
      writeAudit(1, "create", "published");
      return ok(source);
    }),
    updateSource: vi.fn(async ({ expectedVersion, input, now }: {
      expectedVersion: number;
      input: Record<string, unknown>;
      now: string;
    }) => {
      if (!source || source.version !== expectedVersion || source.status !== "published") {
        return { ok: false, status: 409, value: null, errors: { request: "version" } };
      }
      source = { ...source, ...input, version: expectedVersion + 1, updatedAt: now };
      syncRelations("published", expectedVersion + 1);
      writeAudit(expectedVersion + 1, "update", "published");
      return ok(source);
    }),
    createConversation: vi.fn(async ({ sourceId, now, preallocatedId }: {
      sourceId: string; now: string; preallocatedId: string;
    }) => {
      conversation = {
        id: preallocatedId,
        sourceId,
        sourceType: "parent-need",
        participantUserIds: [ownerId, participantId],
        createdAt: now
      };
      return ok(conversation);
    }),
    sendMessage: vi.fn(async ({ text, now, preallocatedId }: {
      text: string; now: string; preallocatedId?: string;
    }) => {
      if (!source || source.status !== "published" ||
          (conversation?.sourceVersion && conversation.sourceVersion !== source.version)) {
        return blocked();
      }
      if (!message) {
        message = {
          id: preallocatedId,
          conversationId: conversation?.id,
          senderUserId: participantId,
          text,
          createdAt: now
        };
      }
      return ok(message);
    }),
    createContactRequest: vi.fn(async ({ now, preallocatedId }: {
      now: string; preallocatedId?: string;
    }) => {
      if (!source || source.status !== "published" ||
          (conversation?.sourceVersion && conversation.sourceVersion !== source.version)) {
        return blocked();
      }
      if (!request) {
        request = {
          id: preallocatedId,
          conversationId: conversation?.id,
          requesterUserId: participantId,
          receiverUserId: ownerId,
          status: "pending",
          secondConfirmedAt: null,
          createdAt: now,
          updatedAt: now
        };
      }
      return ok(request);
    }),
    approveContactRequest: vi.fn(async ({ now }: { now: string }) => {
      request = { ...request, status: "approved", secondConfirmedAt: now, updatedAt: now };
      return ok(request);
    }),
    deleteSource: vi.fn(async ({ expectedVersion, now }: { expectedVersion: number; now: string }) => {
      if (!source || source.version !== expectedVersion) return blocked();
      source = { ...source, status: "deleted", version: 3, updatedAt: now, deletedAt: now };
      syncRelations("deleted", 3);
      writeAudit(3, "delete", "deleted");
      return ok(source);
    }),
    restoreSource: vi.fn(async ({ expectedVersion, now }: { expectedVersion: number; now: string }) => {
      if (!source || source.version !== expectedVersion) return blocked();
      source = { ...source, status: "published", version: 4, updatedAt: now, deletedAt: null };
      syncRelations("published", 4);
      writeAudit(4, "restore", "published");
      return ok(source);
    }),
    readSource: vi.fn(async () => ({ data: source })),
    readConversation: vi.fn(async () => ({ data: conversation })),
    readMessage: vi.fn(async () => ({ data: message })),
    readRequest: vi.fn(async () => ({ data: request })),
    readAudit: vi.fn(async (_sourceId: string, version: number) => ({ data: audits.get(version) })),
    countMessages: vi.fn(async () => (message ? 1 : 0)),
    countRequests: vi.fn(async () => (request ? 1 : 0)),
    hasAuthorizedProfiles: vi.fn(async () => Boolean(
      source?.status === "published" &&
      request?.status === "approved" &&
      (!conversation?.sourceVersion || conversation.sourceVersion === source.version)
    ))
  };
  return {
    adapter: adapter as typeof adapter & D2SyntheticFixtureAdapter,
    state: () => ({ source, conversation, message, request, audits })
  };
}

function syntheticFixtureRunInput(adapter: D2SyntheticFixtureAdapter) {
  const ownerId = "email_42322f7b8901e4fb8174c6c1";
  const participantId = "email_88cc6554aa448d72dc948fec";
  const plan = createD2SyntheticFixtureMachinePlan({
    envId: PROD_CLOUDBASE_ENV_ID,
    ownerId,
    participantId,
    runMarker: RUN_MARKER
  });
  const authorizationSha256 = "a".repeat(64);
  const authorizationLease = {
    authorization: {
      envId: PROD_CLOUDBASE_ENV_ID,
      runMarker: RUN_MARKER,
      participants: { ownerId, participantId },
      planSha256: sha256(JSON.stringify(plan)),
      legacyBaselineSha256: sha256(JSON.stringify(createManifest().legacyDenylist)),
      legacyDenylist: createManifest().legacyDenylist,
      profileProjections: [
        { role: "owner" as const, id: ownerId, ownerUserId: ownerId,
          updatedAt: "2026-08-05T13:00:00.000Z" },
        { role: "participant" as const, id: participantId, ownerUserId: participantId,
          updatedAt: "2026-08-05T13:00:00.000Z" }
      ]
    },
    authorizationSha256,
    finalize: vi.fn(async () => undefined)
  };
  return {
    adapter,
    authorizationLease,
    confirmExecute: createSyntheticFixtureExecutionConfirmation({
      envId: PROD_CLOUDBASE_ENV_ID,
      expectedAuthorizationSha256: authorizationSha256,
      expectedFixturePlanSha256: sha256(JSON.stringify(plan)),
      ownerId,
      participantId,
      runMarker: RUN_MARKER
    }),
    envId: PROD_CLOUDBASE_ENV_ID,
    expectedFixturePlanSha256: sha256(JSON.stringify(plan)),
    now: () => new Date("2026-08-05T14:00:00.000Z"),
    ownerId,
    participantId,
    runMarker: RUN_MARKER
  };
}

async function captureSyntheticFailure(
  input: Parameters<typeof runD2SyntheticFixtureLifecycleForTest>[0]
) {
  try {
    await runD2SyntheticFixtureLifecycleForTest(input);
  } catch (error) {
    return error as D2CleanupError;
  }
  throw new Error("expected synthetic fixture failure");
}

function removeManagedTarget(rows: UniverseRows) {
  const ids = new Set([
    "parent-need-i33-d2-source",
    "conversation-i33-d2",
    "message-i33-d2",
    "contact-exchange-i33-d2"
  ]);
  for (const collection of TARGET_COLLECTIONS) {
    rows[collection] = rows[collection].filter((row) => !ids.has(String(row.id ?? row._id)));
  }
  return rows;
}

function createPrepareRuntime(rows = createIndependentUniverseRows(), runMarker = RUN_MARKER) {
  const database = createUniverseDatabase(rows);
  const rawAdapter = createCloudBasePrepareAdapter(
    { collection: database.collection },
    {
      envId: PROD_CLOUDBASE_ENV_ID,
      ownerId: "synthetic-owner-i33-d2",
      participantId: "synthetic-participant-i33-d2",
      runMarker
    }
  );
  const adapter = {
    readDiscoverySnapshot: vi.fn(rawAdapter.readDiscoverySnapshot),
    readProfileProjection: vi.fn(rawAdapter.readProfileProjection)
  };
  return {
    adapter,
    database,
    input: {
      adapter,
      envId: PROD_CLOUDBASE_ENV_ID,
      ownerId: "synthetic-owner-i33-d2",
      participantId: "synthetic-participant-i33-d2",
      runMarker
    }
  };
}

function createPostFixturePrepareRuntime(
  rows = createIndependentUniverseRows(),
  options: { ignoreProjection?: boolean } = {}
) {
  const documents = createFixtureDocuments();
  rows.audit_events = [...documents.entries()]
    .filter(([key]) => key.startsWith("audit_events:"))
    .map(([, document]) => structuredClone(document));
  const database = createUniverseDatabase(rows, undefined, options);
  const rawAdapter = createCloudBasePostFixturePrepareAdapter(
    { collection: database.collection },
    {
      envId: PROD_CLOUDBASE_ENV_ID,
      ownerId: "synthetic-owner-i33-d2",
      participantId: "synthetic-participant-i33-d2",
      runMarker: RUN_MARKER,
      expectedManifest: createManifest()
    }
  );
  const adapter: D2PostFixturePrepareAdapter = {
    readAudit: vi.fn(rawAdapter.readAudit),
    readDiscoverySnapshot: vi.fn(rawAdapter.readDiscoverySnapshot),
    readProfileProjection: vi.fn(rawAdapter.readProfileProjection)
  };
  return {
    adapter,
    database,
    input: {
      adapter,
      envId: PROD_CLOUDBASE_ENV_ID,
      expectedManifest: createManifest(),
      ownerId: "synthetic-owner-i33-d2",
      participantId: "synthetic-participant-i33-d2",
      runMarker: RUN_MARKER
    },
    rows
  };
}

function createPostCleanupVerifyRuntime(
  rows = removeManagedTarget(createIndependentUniverseRows()),
  options: { ignoreProjection?: boolean } = {}
) {
  const manifest = createManifest();
  const approval = createApprovalArtifact(manifest);
  const documents = createFixtureDocuments(manifest, approval.envelope);
  rows.audit_events = [...documents.entries()]
    .filter(([key]) => key.startsWith("audit_events:"))
    .map(([, document]) => structuredClone(document));
  const database = createUniverseDatabase(rows, undefined, options);
  const rawAdapter = createCloudBasePostCleanupVerifyAdapter(
    { collection: database.collection },
    {
      envId: PROD_CLOUDBASE_ENV_ID,
      ownerId: manifest.participants.ownerId,
      participantId: manifest.participants.participantId,
      runMarker: RUN_MARKER,
      expectedManifest: manifest
    }
  );
  const adapter: D2PostCleanupVerifyAdapter = {
    readAudit: vi.fn(rawAdapter.readAudit),
    readDiscoverySnapshot: vi.fn(rawAdapter.readDiscoverySnapshot),
    readProfileProjection: vi.fn(rawAdapter.readProfileProjection),
    readTarget: vi.fn(rawAdapter.readTarget)
  };
  const artifactBindings = {
    codeSha256: "1".repeat(64),
    manifestSha256: sha256(JSON.stringify(manifest)),
    approvalSha256: approval.sha256,
    finalCleanupReceiptSha256: "4".repeat(64)
  };
  return {
    adapter,
    approval,
    artifactBindings,
    database,
    input: {
      adapter,
      approvalArtifactBytes: approval.bytes,
      artifactBindings,
      envId: PROD_CLOUDBASE_ENV_ID,
      expectedApprovalSha256: approval.sha256,
      expectedManifest: manifest,
      now: () => new Date(NOW),
      ownerId: manifest.participants.ownerId,
      participantId: manifest.participants.participantId,
      runMarker: RUN_MARKER
    },
    manifest,
    rows
  };
}

async function createAuthorizationFreshnessFixture({
  authorizationIssuedAt,
  consumedAt,
  markerIndex,
  storedIssuedAt = authorizationIssuedAt
}: {
  authorizationIssuedAt: string;
  consumedAt: string;
  markerIndex: number;
  storedIssuedAt?: string;
}) {
  const markerSuffix = String(markerIndex).padStart(12, "0");
  const runMarker =
    `i33-d2-052-20260806T000000Z-1000000${markerIndex}-0000-4000-8000-${markerSuffix}`;
  const prepared = await runD2Prepare(
    createPrepareRuntime(removeManagedTarget(createIndependentUniverseRows()), runMarker).input
  );
  const approval = createApprovalArtifact(createManifest(), { issuedAt: authorizationIssuedAt });
  const plan = createD2SyntheticFixtureMachinePlan({
    envId: prepared.envId,
    ownerId: prepared.participants.ownerId,
    participantId: prepared.participants.participantId,
    runMarker
  });
  const authorization = createD2SyntheticFixtureAuthorizationForTest({
    approvalArtifactBytes: approval.bytes,
    expectedApprovalSha256: approval.sha256,
    expectedFixturePlanSha256: sha256(JSON.stringify(plan)),
    issuedAt: authorizationIssuedAt,
    nonce: `2000000${markerIndex}-0000-4000-8000-${markerSuffix}`,
    prepareOutput: prepared
  });
  authorization.issuedAt = storedIssuedAt;
  const authorizationPath = join(
    MANIFEST_ROOT,
    `${runMarker}.synthetic-fixture.authorization.json`
  );
  const claimPath = join(MANIFEST_ROOT, `${runMarker}.pre-fixture-probe.claim`);
  const lockPath = join(MANIFEST_ROOT, `${runMarker}.synthetic-fixture.lifecycle.lock`);
  const paths = [authorizationPath, claimPath, lockPath];
  await Promise.all(paths.map((path) => unlink(path).catch(() => undefined)));
  await claimPreFixtureProbeExecution(runMarker);
  await writeD2SyntheticFixtureAuthorizationForTest(authorization);
  const bytes = await readFile(authorizationPath);
  const input = {
    authorizationPath,
    envId: prepared.envId,
    expectedAuthorizationSha256: sha256(bytes),
    expectedFixturePlanSha256: sha256(JSON.stringify(plan)),
    now: () => new Date(consumedAt),
    ownerId: prepared.participants.ownerId,
    participantId: prepared.participants.participantId,
    runMarker
  };
  return {
    input,
    lockPath,
    cleanup: () => Promise.all(paths.map((path) => unlink(path).catch(() => undefined)))
  };
}

function createPrepareOutputIo({
  failAt,
  finalExists = false
}: {
  failAt?: "write" | "sync" | "close" | "publish" | "publish-race" | "cleanup";
  finalExists?: boolean;
} = {}) {
  const events: string[] = [];
  let temporaryPath = "";
  let finalPath = "";
  const expectedFinalPath = join(MANIFEST_ROOT, `${RUN_MARKER}.prepare.json`);
  const error = (code: string) => Object.assign(new Error(code), { code });
  const handle = {
    writeFile: vi.fn(async () => {
      events.push("write");
      if (failAt === "write") throw error("EIO");
    }),
    sync: vi.fn(async () => {
      events.push("sync");
      if (failAt === "sync") throw error("EIO");
    }),
    close: vi.fn(async () => {
      events.push("close");
      if (failAt === "close") throw error("EIO");
    })
  };
  const io: D2PrepareOutputIo = {
    mkdir: vi.fn(async () => undefined),
    lstat: vi.fn(async (path) => {
      if (path === MANIFEST_ROOT) {
        return { isDirectory: () => true, isFile: () => false, isSymbolicLink: () => false };
      }
      if (path === expectedFinalPath && finalExists) {
        return { isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false };
      }
      if (path === temporaryPath && temporaryPath) {
        return { isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false };
      }
      throw error("ENOENT");
    }),
    realpath: vi.fn(async (path) => path),
    open: vi.fn(async (path) => {
      temporaryPath = path;
      events.push("open");
      return handle;
    }),
    link: vi.fn(async (source, destination) => {
      finalPath = destination;
      events.push("link");
      expect(source).toBe(temporaryPath);
      if (failAt === "publish-race") throw error("EEXIST");
      if (failAt === "publish") throw error("EINTR");
    }),
    unlink: vi.fn(async (path) => {
      events.push(`unlink:${path === temporaryPath ? "temporary" : "other"}`);
      if (failAt === "cleanup") throw error("EACCES");
    })
  };
  return { events, finalPath: () => finalPath, handle, io, temporaryPath: () => temporaryPath };
}

describe("ISSUE-0033 D2 exact-ID cleanup", () => {
  it("parses pre-fixture-probe without fixture artifacts and binds its own confirmation", () => {
    const confirmation = createExecutionConfirmation("pre-fixture-probe", RUN_MARKER);
    const parsed = parseCleanupArgs([
      "--mode", "pre-fixture-probe",
      "--env-id", PROD_CLOUDBASE_ENV_ID,
      "--run-marker", RUN_MARKER,
      "--confirm-execute", confirmation
    ]);

    expect(parsed).toMatchObject({
      approvalPath: undefined,
      confirmExecute: confirmation,
      envId: PROD_CLOUDBASE_ENV_ID,
      expectedApprovalSha256: undefined,
      manifestPath: undefined,
      mode: "pre-fixture-probe",
      ownerId: undefined,
      participantId: undefined,
      resumeStatePath: undefined,
      runMarker: RUN_MARKER
    });
    expect(confirmation).not.toBe(createExecutionConfirmation("probe", RUN_MARKER));
    expect(confirmation).not.toBe(createExecutionConfirmation("cleanup", RUN_MARKER));

    for (const forbidden of [
      ["--manifest", join(MANIFEST_ROOT, `${RUN_MARKER}.json`)],
      ["--approval", join(MANIFEST_ROOT, "issue-0033-d2-profile-approval-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.json")],
      ["--expected-approval-sha256", "a".repeat(64)],
      ["--owner-id", "owner"],
      ["--participant-id", "participant"],
      ["--resume-state", join(MANIFEST_ROOT, `${RUN_MARKER}.resume.json`)]
    ]) {
      expect(() => parseCleanupArgs([
        "--mode", "pre-fixture-probe",
        "--env-id", PROD_CLOUDBASE_ENV_ID,
        "--run-marker", RUN_MARKER,
        "--confirm-execute", confirmation,
        ...forbidden
      ])).toThrow("D2C_PRE_FIXTURE_PROBE_ARGUMENT_FORBIDDEN");
    }
  });

  it.each([[0], ["0"]])(
    "runs the four fixed pre-fixture zero-hit operations sequentially for deleted=%s",
    async (deleted) => {
      const { adapter, reads, removes } = createFakePreFixtureProbeAdapter();
      for (const collection of TARGET_COLLECTIONS) removes[collection].mockResolvedValue({ deleted });
      const input = preFixtureProbeInput(adapter);

      const result = await runD2PreFixtureProbe(input);

      expect(result).toMatchObject({ ok: true, phase: "pre-fixture-probe-complete" });
      expect(result.events).toHaveLength(12);
      expect(input.claimExecution).toHaveBeenCalledTimes(1);
      for (const collection of TARGET_COLLECTIONS) {
        expect(reads[collection]).toHaveBeenCalledTimes(2);
        expect(removes[collection]).toHaveBeenCalledTimes(1);
        expect(reads[collection].mock.invocationCallOrder[0]).toBeLessThan(
          removes[collection].mock.invocationCallOrder[0]
        );
        expect(removes[collection].mock.invocationCallOrder[0]).toBeLessThan(
          reads[collection].mock.invocationCallOrder[1]
        );
      }
      expect(JSON.stringify(result)).not.toContain(RUN_MARKER);
    }
  );

  it("fails before remove when a pre-read hits an existing legacy, business, or target ID", async () => {
    const { adapter, reads, removes } = createFakePreFixtureProbeAdapter();
    reads.messages.mockResolvedValueOnce({ data: { id: "occupied" } });
    let failure: D2CleanupError | undefined;
    try {
      await runD2PreFixtureProbe(preFixtureProbeInput(adapter));
    } catch (error) {
      failure = error as D2CleanupError;
    }
    expect(failure?.code).toBe("D2C_PRE_FIXTURE_PROBE_ID_NOT_EMPTY");
    expect(failure?.progress).toMatchObject({
      completedCollections: [],
      failedCollection: "messages"
    });
    expect(removes.messages).not.toHaveBeenCalled();
    for (const collection of TARGET_COLLECTIONS.slice(1)) {
      expect(reads[collection]).not.toHaveBeenCalled();
      expect(removes[collection]).not.toHaveBeenCalled();
    }
  });

  it.each([[1], ["1"], [2], ["invalid"], [undefined]])(
    "rejects non-zero or malformed pre-fixture remove result %s and stops",
    async (deleted) => {
      const { adapter, reads, removes } = createFakePreFixtureProbeAdapter();
      removes.messages.mockResolvedValueOnce({ deleted });
      await expect(runD2PreFixtureProbe(preFixtureProbeInput(adapter))).rejects.toThrow(
        /D2C_(PRE_FIXTURE_PROBE_DELETE_COUNT_MISMATCH|DELETE_RESULT_INVALID)/
      );
      expect(reads.messages).toHaveBeenCalledTimes(1);
      expect(reads.contact_exchange_requests).not.toHaveBeenCalled();
    }
  );

  it("fails after a non-empty post-read and does not touch later collections", async () => {
    const { adapter, reads, removes } = createFakePreFixtureProbeAdapter();
    reads.messages
      .mockResolvedValueOnce({ data: undefined })
      .mockResolvedValueOnce({ data: { id: "unexpected-residual" } });
    await expect(runD2PreFixtureProbe(preFixtureProbeInput(adapter))).rejects.toThrow(
      "D2C_PRE_FIXTURE_PROBE_POST_READ_NOT_EMPTY"
    );
    expect(removes.messages).toHaveBeenCalledTimes(1);
    expect(reads.contact_exchange_requests).not.toHaveBeenCalled();
  });

  it("stops at the Nth collection with machine progress and never retries", async () => {
    const { adapter, reads, removes } = createFakePreFixtureProbeAdapter();
    removes.conversations.mockRejectedValueOnce(new Error("synthetic remove failure"));
    let failure: D2CleanupError | undefined;
    try {
      await runD2PreFixtureProbe(preFixtureProbeInput(adapter));
    } catch (error) {
      failure = error as D2CleanupError;
    }
    expect(failure?.progress).toMatchObject({
      completedCollections: ["messages", "contact_exchange_requests"],
      failedCollection: "conversations"
    });
    expect(removes.conversations).toHaveBeenCalledTimes(1);
    expect(reads.parent_needs).not.toHaveBeenCalled();
    expect(removes.parent_needs).not.toHaveBeenCalled();
  });

  it("rejects cross-mode, cross-marker, and repeated execution confirmations", async () => {
    const { adapter } = createFakePreFixtureProbeAdapter();
    for (const confirmation of [
      createExecutionConfirmation("probe", RUN_MARKER),
      createExecutionConfirmation("cleanup", RUN_MARKER),
      createExecutionConfirmation(
        "pre-fixture-probe",
        "i33-d2-052-20260805T120001Z-22222222-2222-4222-8222-222222222222"
      )
    ]) {
      await expect(runD2PreFixtureProbe({
        ...preFixtureProbeInput(adapter),
        confirmExecute: confirmation
      })).rejects.toThrow("D2C_EXECUTION_CONFIRMATION_REQUIRED");
    }

    let claimed = false;
    const claimIo: D2PreFixtureProbeClaimIo = {
      mkdir: vi.fn(async () => undefined),
      lstat: vi.fn(async () => ({
        isDirectory: () => true,
        isSymbolicLink: () => false
      })),
      realpath: vi.fn(async (path) => path),
      open: vi.fn(async () => {
        if (claimed) throw Object.assign(new Error("exists"), { code: "EEXIST" });
        claimed = true;
        return {
          writeFile: vi.fn(async () => undefined),
          sync: vi.fn(async () => undefined),
          close: vi.fn(async () => undefined)
        };
      })
    };
    const claimExecution = vi.fn(async () => {
      await claimPreFixtureProbeExecution(RUN_MARKER, { io: claimIo });
      return undefined;
    });
    const first = preFixtureProbeInput(createFakePreFixtureProbeAdapter().adapter);
    first.claimExecution = claimExecution;
    await expect(runD2PreFixtureProbe(first)).resolves.toMatchObject({ ok: true });
    const second = preFixtureProbeInput(createFakePreFixtureProbeAdapter().adapter);
    second.claimExecution = claimExecution;
    await expect(runD2PreFixtureProbe(second)).rejects.toThrow(
      "D2C_PRE_FIXTURE_PROBE_ALREADY_CLAIMED"
    );
    expect(claimExecution).toHaveBeenCalledTimes(2);
  });

  it("builds only four fixed adapters with unique non-business probe IDs", async () => {
    const docCalls: Array<{ collection: string; id: string; operation: string }> = [];
    const database = {
      collection: vi.fn((collection: string) => ({
        doc: vi.fn((id: string) => {
          const reference = {
            field: vi.fn(() => reference),
            get: vi.fn(async () => {
              docCalls.push({ collection, id, operation: "get" });
              return { data: undefined };
            }),
            remove: vi.fn(async () => {
              docCalls.push({ collection, id, operation: "remove" });
              return { deleted: 0 };
            })
          };
          return reference;
        })
      }))
    };
    const uuids = [
      "44444444-4444-4444-8444-444444444441",
      "44444444-4444-4444-8444-444444444442",
      "44444444-4444-4444-8444-444444444443",
      "44444444-4444-4444-8444-444444444444"
    ];
    const adapter = createCloudBasePreFixtureProbeAdapter(database, {
      envId: PROD_CLOUDBASE_ENV_ID,
      randomUUID: vi.fn().mockImplementation(() => uuids.shift()),
      runMarker: RUN_MARKER
    });

    expect(Object.keys(adapter)).toEqual(TARGET_COLLECTIONS);
    for (const operation of Object.values(adapter)) {
      expect(Object.keys(operation).sort()).toEqual(["idLabel", "read", "remove"]);
    }
    await runD2PreFixtureProbe(preFixtureProbeInput(adapter));

    expect(database.collection.mock.calls.map(([collection]) => collection)).toEqual(
      expect.arrayContaining([...TARGET_COLLECTIONS])
    );
    expect(new Set(database.collection.mock.calls.map(([collection]) => collection))).toEqual(
      new Set(TARGET_COLLECTIONS)
    );
    const ids = [...new Set(docCalls.map(({ id }) => id))];
    expect(ids).toHaveLength(4);
    for (const id of ids) {
      expect(id).toContain(RUN_MARKER);
      expect(id).toMatch(/[0-9a-f]{8}-[0-9a-f-]{27}$/i);
      expect(id).not.toMatch(/^(message|contact-exchange|conversation|parent-need)-/);
      expect([
        "conversation-d43e1f63-3096-4723-a8a7-35342dd36f37",
        "parent-need-63a85ca8-4501-4501-9a90-4b911f737d0b"
      ]).not.toContain(id);
    }
  });

  it("parses prepare with only non-sensitive discovery inputs and rejects execution flags", () => {
    const args = [
      "--mode", "prepare",
      "--env-id", PROD_CLOUDBASE_ENV_ID,
      "--run-marker", RUN_MARKER,
      "--owner-id", "synthetic-owner-i33-d2",
      "--participant-id", "synthetic-participant-i33-d2"
    ];
    expect(parseCleanupArgs(args)).toMatchObject({
      envId: PROD_CLOUDBASE_ENV_ID,
      mode: "prepare",
      ownerId: "synthetic-owner-i33-d2",
      participantId: "synthetic-participant-i33-d2",
      runMarker: RUN_MARKER
    });
    for (const forbidden of [
      ["--confirm-execute", "forbidden"],
      ["--manifest", join(MANIFEST_ROOT, `${RUN_MARKER}.json`)],
      ["--approval", join(MANIFEST_ROOT, "forbidden.json")],
      ["--expected-approval-sha256", "0".repeat(64)],
      ["--resume-state", join(MANIFEST_ROOT, `${RUN_MARKER}.resume.json`)]
    ]) {
      expect(() => parseCleanupArgs([...args, ...forbidden])).toThrow(
        "D2C_PREPARE_ARGUMENT_FORBIDDEN"
      );
    }
  });

  it("parses post-fixture prepare with one exact manifest and rejects write-capable flags", () => {
    const manifestPath = join(MANIFEST_ROOT, `${RUN_MARKER}.json`);
    const args = [
      "--mode", "post-fixture-prepare",
      "--env-id", PROD_CLOUDBASE_ENV_ID,
      "--run-marker", RUN_MARKER,
      "--owner-id", "synthetic-owner-i33-d2",
      "--participant-id", "synthetic-participant-i33-d2",
      "--manifest", manifestPath
    ];
    expect(parseCleanupArgs(args)).toMatchObject({
      envId: PROD_CLOUDBASE_ENV_ID,
      manifestPath,
      mode: "post-fixture-prepare",
      ownerId: "synthetic-owner-i33-d2",
      participantId: "synthetic-participant-i33-d2",
      runMarker: RUN_MARKER
    });
    for (const forbidden of [
      ["--confirm-execute", "forbidden"],
      ["--authorization", join(MANIFEST_ROOT, `${RUN_MARKER}.authorization.json`)],
      ["--approval", join(MANIFEST_ROOT, "forbidden.json")],
      ["--expected-approval-sha256", "0".repeat(64)],
      ["--expected-authorization-sha256", "0".repeat(64)],
      ["--expected-fixture-plan-sha256", "0".repeat(64)],
      ["--prepare-artifact", join(MANIFEST_ROOT, `${RUN_MARKER}.prepare.json`)],
      ["--resume-state", join(MANIFEST_ROOT, `${RUN_MARKER}.resume.json`)]
    ]) {
      expect(() => parseCleanupArgs([...args, ...forbidden])).toThrow(
        "D2C_POST_FIXTURE_PREPARE_ARGUMENT_FORBIDDEN"
      );
    }
  });

  it("parses post-cleanup verify as a strictly read-only artifact-bound mode", () => {
    const manifestPath = join(MANIFEST_ROOT, `${RUN_MARKER}.json`);
    const approvalPath = join(
      MANIFEST_ROOT,
      "issue-0033-d2-profile-approval-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.json"
    );
    const args = [
      "--mode", "post-cleanup-verify",
      "--env-id", PROD_CLOUDBASE_ENV_ID,
      "--run-marker", RUN_MARKER,
      "--owner-id", "synthetic-owner-i33-d2",
      "--participant-id", "synthetic-participant-i33-d2",
      "--manifest", manifestPath,
      "--approval", approvalPath,
      "--expected-approval-sha256", "a".repeat(64)
    ];
    expect(parseCleanupArgs(args)).toMatchObject({
      approvalPath,
      envId: PROD_CLOUDBASE_ENV_ID,
      expectedApprovalSha256: "a".repeat(64),
      manifestPath,
      mode: "post-cleanup-verify",
      ownerId: "synthetic-owner-i33-d2",
      participantId: "synthetic-participant-i33-d2",
      runMarker: RUN_MARKER
    });
    for (const forbidden of [
      ["--confirm-execute", "forbidden"],
      ["--authorization", join(MANIFEST_ROOT, `${RUN_MARKER}.authorization.json`)],
      ["--expected-authorization-sha256", "b".repeat(64)],
      ["--expected-fixture-plan-sha256", "c".repeat(64)],
      ["--prepare-artifact", join(MANIFEST_ROOT, `${RUN_MARKER}.prepare.json`)],
      ["--resume-state", join(MANIFEST_ROOT, `${RUN_MARKER}.resume.json`)]
    ]) {
      expect(() => parseCleanupArgs([...args, ...forbidden])).toThrow(
        "D2C_POST_CLEANUP_VERIFY_ARGUMENT_FORBIDDEN"
      );
    }
  });

  it("prepares a stable legacy baseline and profile projections before the fixture exists", async () => {
    const runtime = createPrepareRuntime(removeManagedTarget(createIndependentUniverseRows()));
    expect(Object.keys(runtime.adapter).sort()).toEqual([
      "readDiscoverySnapshot",
      "readProfileProjection"
    ]);
    expect(runtime.adapter).not.toHaveProperty("removeTarget");
    expect(runtime.adapter).not.toHaveProperty("removeProbe");

    const result = await runD2Prepare(runtime.input);
    expect(result).toMatchObject({
      schemaVersion: 1,
      kind: "issue-0033-d2-prepare",
      completeness: "COMPLETE",
      targetState: "ABSENT",
      targets: {
        messages: null,
        contact_exchange_requests: null,
        conversations: null,
        parent_needs: null
      },
      manifestCandidate: null,
      approvalState: "EXTERNAL_APPROVAL_REQUIRED"
    });
    expect(result.legacyDenylist).toEqual(createManifest().legacyDenylist);
    expect(result.profileApprovalProjection).toEqual([
      {
        role: "owner",
        id: "synthetic-owner-i33-d2",
        ownerUserId: "synthetic-owner-i33-d2",
        updatedAt: "2026-08-05T12:00:00.000Z"
      },
      {
        role: "participant",
        id: "synthetic-participant-i33-d2",
        ownerUserId: "synthetic-participant-i33-d2",
        updatedAt: "2026-08-05T12:00:01.000Z"
      }
    ]);
    expect(JSON.stringify(result)).not.toMatch(
      /MUST-NOT-LEAK|phone|wechat|childIntro|community|text/i
    );
    expect(runtime.adapter.readDiscoverySnapshot).toHaveBeenCalledTimes(2);
    expect(runtime.adapter.readDiscoverySnapshot).toHaveBeenCalledWith();
    expect(runtime.adapter.readProfileProjection).toHaveBeenCalledTimes(4);
  });

  it("refreshes one complete marker fixture into an exact manifest candidate", async () => {
    const runtime = createPrepareRuntime();
    const result = await runD2Prepare(runtime.input);
    expect(result.targetState).toBe("COMPLETE");
    expect(result.targets).toEqual(createManifest().targets);
    expect(result.manifestCandidate).toEqual(createManifest());
    expect(result.legacyDenylist).toEqual(createManifest().legacyDenylist);
    expect(JSON.stringify(result)).not.toContain("ordinary-");
  });

  it("post-fixture prepare binds four exact targets and retains five canonical audits read-only", async () => {
    const runtime = createPostFixturePrepareRuntime();
    expect(Object.keys(runtime.adapter).sort()).toEqual([
      "readAudit",
      "readDiscoverySnapshot",
      "readProfileProjection"
    ]);
    for (const writeCapability of [
      "add", "set", "update", "remove", "runTransaction", "removeTarget"
    ]) {
      expect(runtime.adapter).not.toHaveProperty(writeCapability);
    }

    const result = await runD2PostFixturePrepare(runtime.input);
    expect(result).toMatchObject({
      schemaVersion: 1,
      kind: "issue-0033-d2-post-fixture-prepare",
      mode: "post-fixture-prepare",
      completeness: "COMPLETE",
      targetState: "PRESENT",
      manifestCandidate: createManifest(),
      audits: {
        state: "PRESENT_BUT_RETAINED",
        count: 5,
        labels: [1, 2, 3, 4, 5].map((version) => hashId(
          deriveAuditId(createManifest().targets.parent_needs.id, version)
        ))
      },
      writeCounters: {
        transactions: 0,
        creates: 0,
        updates: 0,
        removes: 0
      }
    });
    expect(Object.keys(result.manifestCandidate.targets)).toEqual(TARGET_COLLECTIONS);
    expect(result.manifestCandidate).not.toHaveProperty("audits");
    expect((runtime.adapter.readAudit as Mock).mock.calls).toEqual([
      [1], [1], [2], [2], [3], [3], [4], [4], [5], [5]
    ]);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("MUST-NOT-LEAK");
    expect(serialized).not.toContain("phone");
    expect(serialized).not.toContain("wechat");
    const requestedFields = runtime.database.fieldCalls.map((call) => ({
      ...call,
      fields: [...call.fields].sort()
    }));
    expect(requestedFields.length).toBeGreaterThan(0);
    expect(requestedFields.every((call) => call.fields.length > 0)).toBe(true);
    expect(requestedFields).toEqual(expect.arrayContaining([
      expect.objectContaining({
        collection: "messages",
        kind: "query",
        fields: ["_id", "conversationId", "id", "senderUserId"]
      }),
      expect.objectContaining({
        collection: "parent_needs",
        kind: "query",
        fields: [
          "_id", "community", "deletedAt", "id", "managementState", "ownerUserId",
          "status", "updatedAt", "version"
        ]
      }),
      expect.objectContaining({
        collection: "contact_profiles",
        kind: "document",
        fields: ["_id", "id", "ownerUserId", "updatedAt"]
      })
    ]));
    const forbiddenFields = new Set([
      "abilityDescription", "childIntro", "email", "phone", "proofImages", "text", "wechat"
    ]);
    expect(
      requestedFields.flatMap((call) => call.fields).filter((field) => forbiddenFields.has(field))
    ).toEqual([]);
    expect(runtime.database.mutations.add).not.toHaveBeenCalled();
    expect(runtime.database.mutations.set).not.toHaveBeenCalled();
    expect(runtime.database.mutations.update).not.toHaveBeenCalled();
    expect(runtime.database.mutations.remove).not.toHaveBeenCalled();
    expect(runtime.database.mutations.runTransaction).not.toHaveBeenCalled();
  });

  it("fails closed when the database ignores the post-fixture field projection", async () => {
    const runtime = createPostFixturePrepareRuntime(createIndependentUniverseRows(), {
      ignoreProjection: true
    });
    await expect(runD2PostFixturePrepare(runtime.input)).rejects.toThrow(
      "D2C_POST_FIXTURE_PROJECTION_UNSAFE"
    );
    expect(runtime.database.mutations.add).not.toHaveBeenCalled();
    expect(runtime.database.mutations.set).not.toHaveBeenCalled();
    expect(runtime.database.mutations.update).not.toHaveBeenCalled();
    expect(runtime.database.mutations.remove).not.toHaveBeenCalled();
    expect(runtime.database.mutations.runTransaction).not.toHaveBeenCalled();
  });

  it("post-fixture prepare fails closed for manifest drift, unstable discovery, or audit drift", async () => {
    const nonCanonical = createPostFixturePrepareRuntime();
    await expect(runD2PostFixturePrepare({
      ...nonCanonical.input,
      envId: "non-canonical-env"
    })).rejects.toThrow("D2C_ENV_NOT_PRODUCTION_CANONICAL");

    const manifestDrift = createPostFixturePrepareRuntime();
    manifestDrift.input.expectedManifest = {
      ...createManifest(),
      targets: {
        ...createManifest().targets,
        messages: { id: "different-message-id" }
      }
    };
    await expect(runD2PostFixturePrepare(manifestDrift.input)).rejects.toThrow(
      "D2C_POST_FIXTURE_MANIFEST_MISMATCH"
    );

    const legacyDrift = createPostFixturePrepareRuntime();
    legacyDrift.input.expectedManifest = {
      ...createManifest(),
      legacyDenylist: {
        ...createManifest().legacyDenylist,
        messages: [...createManifest().legacyDenylist.messages, "unexpected-legacy-message"]
      }
    };
    await expect(runD2PostFixturePrepare(legacyDrift.input)).rejects.toThrow(
      "D2C_POST_FIXTURE_MANIFEST_MISMATCH"
    );

    const auditAsCleanupTarget = createPostFixturePrepareRuntime();
    auditAsCleanupTarget.input.expectedManifest = {
      ...createManifest(),
      targets: {
        ...createManifest().targets,
        audit_events: { id: deriveAuditId(createManifest().targets.parent_needs.id, 1) }
      }
    } as D2CleanupManifest;
    await expect(runD2PostFixturePrepare(auditAsCleanupTarget.input)).rejects.toThrow(
      "D2C_TARGET_ALLOWLIST_MISMATCH"
    );

    const extraMarkerRows = createIndependentUniverseRows();
    const source = extraMarkerRows.parent_needs.find(
      (row) => row.id === createManifest().targets.parent_needs.id
    );
    if (!source) throw new Error("managed target source fixture missing");
    extraMarkerRows.parent_needs.push({ ...source, id: "second-marker-target", _id: "second-marker-target" });
    await expect(
      runD2PostFixturePrepare(createPostFixturePrepareRuntime(extraMarkerRows).input)
    ).rejects.toThrow("D2C_PREPARE_DISCOVERY_INCOMPLETE");

    const unstable = createPostFixturePrepareRuntime();
    const first = await unstable.adapter.readDiscoverySnapshot();
    const second = structuredClone(first);
    second.legacyDenylist.messages.push("concurrent-legacy-message");
    unstable.adapter.readDiscoverySnapshot = vi.fn()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);
    await expect(runD2PostFixturePrepare(unstable.input)).rejects.toThrow(
      "D2C_PREPARE_DISCOVERY_UNSTABLE"
    );

    const missingAudit = createPostFixturePrepareRuntime();
    const missingAuditRead = missingAudit.adapter.readAudit;
    missingAudit.adapter.readAudit = vi.fn(async (version) =>
      version === 4 ? { data: undefined } : missingAuditRead(version)
    );
    await expect(runD2PostFixturePrepare(missingAudit.input)).rejects.toThrow(
      "D2C_POST_FIXTURE_AUDIT_COUNT_INVALID"
    );

    const auditDrift = createPostFixturePrepareRuntime();
    const originalReadAudit = auditDrift.adapter.readAudit;
    let auditThreeReads = 0;
    auditDrift.adapter.readAudit = vi.fn(async (version) => {
      const value = await originalReadAudit(version);
      if (version !== 3 || auditThreeReads++ === 0) return value;
      const data = Array.isArray(value.data) ? value.data[0] : value.data;
      return { data: { ...(data as Record<string, unknown>), requestId: "changed" } };
    });
    await expect(runD2PostFixturePrepare(auditDrift.input)).rejects.toThrow(
      "D2C_POST_FIXTURE_AUDIT_UNSTABLE"
    );
  });

  it("writes post-fixture output atomically without touching or replacing pre-fixture prepare", async () => {
    const postOutput = await runD2PostFixturePrepare(createPostFixturePrepareRuntime().input);
    const preOutput = await runD2Prepare(createPrepareRuntime().input);
    const prePath = join(MANIFEST_ROOT, `${RUN_MARKER}.prepare.json`);
    const postPath = join(MANIFEST_ROOT, `${RUN_MARKER}.post-fixture.prepare.json`);
    await unlink(prePath).catch(() => undefined);
    await unlink(postPath).catch(() => undefined);
    try {
      await writePrepareOutput(preOutput);
      const preHash = sha256(await readFile(prePath));
      await expect(writePostFixturePrepareOutput(postOutput)).resolves.toBe(postPath);
      expect(JSON.parse(await readFile(postPath, "utf8"))).toEqual(postOutput);
      expect(sha256(await readFile(prePath))).toBe(preHash);
      await expect(writePostFixturePrepareOutput(postOutput)).rejects.toThrow(
        "D2C_PROTECTED_ARTIFACT_EXISTS"
      );
      expect(sha256(await readFile(prePath))).toBe(preHash);
    } finally {
      await unlink(postPath).catch(() => undefined);
      await unlink(prePath).catch(() => undefined);
    }
  });

  it("verifies post-cleanup absence, retained audits, profiles, and legacy state with read-only projections", async () => {
    const runtime = createPostCleanupVerifyRuntime();
    expect(Object.keys(runtime.adapter).sort()).toEqual([
      "readAudit", "readDiscoverySnapshot", "readProfileProjection", "readTarget"
    ]);
    for (const writeCapability of [
      "add", "set", "update", "remove", "runTransaction", "removeTarget"
    ]) {
      expect(runtime.adapter).not.toHaveProperty(writeCapability);
    }

    const result = await runD2PostCleanupVerify(runtime.input);
    expect(result).toMatchObject({
      schemaVersion: 1,
      kind: "issue-0033-d2-post-cleanup-verify",
      mode: "post-cleanup-verify",
      completeness: "COMPLETE",
      targetState: "ABSENT",
      targets: Object.fromEntries(TARGET_COLLECTIONS.map((collection) => [
        collection,
        { count: 0, label: hashId(runtime.manifest.targets[collection].id) }
      ])),
      audits: {
        state: "PRESENT_BUT_RETAINED",
        count: 5,
        labels: [1, 2, 3, 4, 5].map((version) => hashId(
          deriveAuditId(runtime.manifest.targets.parent_needs.id, version)
        ))
      },
      bindings: {
        ...runtime.artifactBindings,
        legacyBaselineSha256: sha256(JSON.stringify(runtime.manifest.legacyDenylist))
      },
      mutationCounters: {
        transactions: 0,
        adds: 0,
        sets: 0,
        updates: 0,
        removes: 0
      }
    });
    expect(runtime.adapter.readDiscoverySnapshot).toHaveBeenCalledTimes(2);
    expect(runtime.adapter.readTarget).toHaveBeenCalledTimes(8);
    expect(runtime.adapter.readProfileProjection).toHaveBeenCalledTimes(4);
    expect(runtime.adapter.readAudit).toHaveBeenCalledTimes(10);
    expect(result.profileApprovalProjection).toEqual(runtime.approval.envelope.profiles);
    expect(result.legacyDenylist).toEqual(runtime.manifest.legacyDenylist);

    const requestedFields = runtime.database.fieldCalls.flatMap((call) => call.fields);
    for (const forbidden of [
      "abilityDescription", "childIntro", "email", "phone", "proofImages", "text", "wechat"
    ]) {
      expect(requestedFields).not.toContain(forbidden);
    }
    expect(runtime.database.mutations.add).not.toHaveBeenCalled();
    expect(runtime.database.mutations.set).not.toHaveBeenCalled();
    expect(runtime.database.mutations.update).not.toHaveBeenCalled();
    expect(runtime.database.mutations.remove).not.toHaveBeenCalled();
    expect(runtime.database.mutations.runTransaction).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toMatch(/MUST-NOT-LEAK|childIntro|phone|wechat|text/i);
  });

  it("post-cleanup verify fails closed for target, audit, profile, legacy, marker, or projection drift", async () => {
    const targetReappears = createPostCleanupVerifyRuntime();
    targetReappears.rows.messages.push({
      _id: targetReappears.manifest.targets.messages.id,
      id: targetReappears.manifest.targets.messages.id,
      conversationId: targetReappears.manifest.targets.conversations.id,
      senderUserId: targetReappears.manifest.participants.participantId
    });
    await expect(runD2PostCleanupVerify(targetReappears.input)).rejects.toThrow(
      "D2C_POST_CLEANUP_TARGET_PRESENT"
    );

    const missingAudit = createPostCleanupVerifyRuntime();
    const auditReader = missingAudit.adapter.readAudit;
    missingAudit.adapter.readAudit = vi.fn(async (version) =>
      version === 3 ? { data: undefined } : auditReader(version)
    );
    await expect(runD2PostCleanupVerify(missingAudit.input)).rejects.toThrow(
      "D2C_POST_CLEANUP_AUDIT_COUNT_INVALID"
    );

    const profileDrift = createPostCleanupVerifyRuntime();
    profileDrift.rows.contact_profiles[0].updatedAt = "2026-08-05T12:00:09.000Z";
    await expect(runD2PostCleanupVerify(profileDrift.input)).rejects.toThrow(
      "D2C_POST_CLEANUP_PROFILE_MISMATCH"
    );

    const legacyDrift = createPostCleanupVerifyRuntime();
    legacyDrift.rows.messages.push({
      _id: "new-legacy-message",
      id: "new-legacy-message",
      conversationId: "conversation-d43e1f63-3096-4723-a8a7-35342dd36f37"
    });
    await expect(runD2PostCleanupVerify(legacyDrift.input)).rejects.toThrow(
      "D2C_POST_CLEANUP_LEGACY_MISMATCH"
    );

    const markerCollision = createPostCleanupVerifyRuntime();
    markerCollision.rows.parent_needs.push({
      _id: "unexpected-marker-source",
      id: "unexpected-marker-source",
      ownerUserId: markerCollision.manifest.participants.ownerId,
      status: "published",
      version: 5,
      updatedAt: "2026-08-05T12:05:00.000Z",
      community: RUN_MARKER
    });
    await expect(runD2PostCleanupVerify(markerCollision.input)).rejects.toThrow(
      "D2C_POST_CLEANUP_DISCOVERY_INCOMPLETE"
    );

    const unsafeProjection = createPostCleanupVerifyRuntime(
      removeManagedTarget(createIndependentUniverseRows()),
      { ignoreProjection: true }
    );
    await expect(runD2PostCleanupVerify(unsafeProjection.input)).rejects.toThrow(
      "D2C_POST_FIXTURE_PROJECTION_UNSAFE"
    );
  });

  it("writes one atomic no-overwrite post-cleanup verification artifact", async () => {
    const output = await runD2PostCleanupVerify(createPostCleanupVerifyRuntime().input);
    const outputPath = join(MANIFEST_ROOT, `${RUN_MARKER}.post-cleanup.verify.json`);
    await unlink(outputPath).catch(() => undefined);
    try {
      await expect(writePostCleanupVerifyOutput(output)).resolves.toBe(outputPath);
      expect(JSON.parse(await readFile(outputPath, "utf8"))).toEqual(output);
      await expect(writePostCleanupVerifyOutput(output)).rejects.toThrow(
        "D2C_PROTECTED_ARTIFACT_EXISTS"
      );
    } finally {
      await unlink(outputPath).catch(() => undefined);
    }
  });

  it("reports a partial marker fixture without manufacturing a manifest", async () => {
    const rows = createIndependentUniverseRows();
    rows.messages = rows.messages.filter((row) => row.id !== "message-i33-d2");
    const runtime = createPrepareRuntime(rows);
    const result = await runD2Prepare(runtime.input);
    expect(result).toMatchObject({
      completeness: "COMPLETE",
      targetState: "PARTIAL",
      targets: {
        messages: null,
        contact_exchange_requests: { id: "contact-exchange-i33-d2" },
        conversations: { id: "conversation-i33-d2" },
        parent_needs: { id: "parent-need-i33-d2-source" }
      },
      manifestCandidate: null
    });
  });

  it("fails closed for every marker-bearing source that is not the one canonical target", async () => {
    const cases: Array<[string, (rows: UniverseRows) => void]> = [
      ["deleted", (rows) => { rows.parent_needs[2].status = "deleted"; }],
      ["wrong version", (rows) => { rows.parent_needs[2].version = 4; }],
      ["legacy", (rows) => {
        rows.parent_needs[2].version = 0;
        delete rows.parent_needs[2].updatedAt;
      }],
      ["management-state conflict", (rows) => {
        rows.parent_needs[2].managementState = "legacy-readonly";
      }],
      ["only community", (rows) => { rows.parent_needs[2].childIntro = "synthetic"; }],
      ["only child intro", (rows) => { rows.parent_needs[2].community = "synthetic"; }],
      ["ordinary managed collision", (rows) => {
        rows.parent_needs[1].community = RUN_MARKER;
      }],
      ["legacy collision", (rows) => {
        rows.parent_needs[0].childIntro = RUN_MARKER;
      }],
      ["tutor source collision", (rows) => {
        rows.tutor_profiles[1].abilityDescription = RUN_MARKER;
      }]
    ];
    for (const [label, mutate] of cases) {
      const rows = createIndependentUniverseRows();
      mutate(rows);
      await expect(
        runD2Prepare(createPrepareRuntime(rows).input),
        label
      ).rejects.toThrow("D2C_PREPARE_DISCOVERY_INCOMPLETE");
    }
  });

  it("fails closed for multiple targets, unstable snapshots, and partial reads", async () => {
    const multipleRows = createIndependentUniverseRows();
    multipleRows.parent_needs.push({
      ...multipleRows.parent_needs[2],
      _id: "second-managed-marker-source",
      id: "second-managed-marker-source"
    });
    await expect(runD2Prepare(createPrepareRuntime(multipleRows).input)).rejects.toThrow(
      "D2C_PREPARE_DISCOVERY_INCOMPLETE"
    );

    const unmarkedMessageRows = createIndependentUniverseRows();
    const targetMessage = unmarkedMessageRows.messages.find(
      (row) => row.id === "message-i33-d2"
    );
    if (!targetMessage) throw new Error("target message fixture missing");
    targetMessage.text = "synthetic message without the run marker";
    await expect(
      runD2Prepare(createPrepareRuntime(unmarkedMessageRows).input)
    ).rejects.toThrow("D2C_PREPARE_DISCOVERY_INCOMPLETE");

    const stableRuntime = createPrepareRuntime();
    const first = await stableRuntime.adapter.readDiscoverySnapshot();
    const second = structuredClone(first);
    second.legacyDenylist.messages.push("concurrent-legacy-message");
    const unstableAdapter: D2PrepareAdapter = {
      readDiscoverySnapshot: vi.fn()
        .mockResolvedValueOnce(first)
        .mockResolvedValueOnce(second),
      readProfileProjection: stableRuntime.adapter.readProfileProjection
    };
    await expect(runD2Prepare({
      ...stableRuntime.input,
      adapter: unstableAdapter
    })).rejects.toThrow("D2C_PREPARE_DISCOVERY_UNSTABLE");

    const incompleteAdapter: D2PrepareAdapter = {
      readDiscoverySnapshot: vi.fn(async () => ({
        ...first,
        completeness: "INCOMPLETE" as const
      })),
      readProfileProjection: stableRuntime.adapter.readProfileProjection
    };
    await expect(runD2Prepare({
      ...stableRuntime.input,
      adapter: incompleteAdapter
    })).rejects.toThrow("D2C_PREPARE_DISCOVERY_INCOMPLETE");
  });

  it("writes one safe TEMP prepare artifact without overwrite, symlink, or path escape", async () => {
    const output = await runD2Prepare(createPrepareRuntime().input);
    const outputPath = join(MANIFEST_ROOT, `${RUN_MARKER}.prepare.json`);
    await unlink(outputPath).catch(() => undefined);
    try {
      await expect(writePrepareOutput(output)).resolves.toBe(outputPath);
      expect(JSON.parse(await readFile(outputPath, "utf8"))).toEqual(output);
      await expect(writePrepareOutput(output)).rejects.toThrow("D2C_PREPARE_OUTPUT_EXISTS");
    } finally {
      await unlink(outputPath).catch(() => undefined);
    }

    await expect(writePrepareOutput({
      ...output,
      runMarker: "../escape"
    } as D2PrepareOutput)).rejects.toThrow("D2C_RUN_MARKER_INVALID");

    const symlinkMarker =
      "i33-d2-052-20260805T120001Z-22222222-2222-4222-8222-222222222222";
    const symlinkOutput = await runD2Prepare(
      createPrepareRuntime(removeManagedTarget(createIndependentUniverseRows()), symlinkMarker).input
    );
    const symlinkPath = join(MANIFEST_ROOT, `${symlinkMarker}.prepare.json`);
    const symlinkTarget = join(tmpdir(), "issue-0033-d2-prepare-symlink-target");
    await mkdir(MANIFEST_ROOT, { recursive: true });
    await mkdir(symlinkTarget, { recursive: true });
    await unlink(symlinkPath).catch(() => undefined);
    try {
      await symlink(symlinkTarget, symlinkPath, "junction");
      await expect(writePrepareOutput(symlinkOutput)).rejects.toThrow(
        "D2C_PREPARE_OUTPUT_UNSAFE"
      );
    } finally {
      await unlink(symlinkPath).catch(() => undefined);
      await rmdir(symlinkTarget).catch(() => undefined);
    }
  });

  it("publishes prepare output atomically without replacing a final file or exposing partial JSON", async () => {
    const output = await runD2Prepare(createPrepareRuntime().input);
    const realOutputPath = join(MANIFEST_ROOT, `${RUN_MARKER}.prepare.json`);
    await unlink(realOutputPath).catch(() => undefined);
    try {
      const success = createPrepareOutputIo();
      await expect(writePrepareOutput(output, {
        io: success.io,
        randomUUID: () => "33333333-3333-4333-8333-333333333333"
      })).resolves.toBe(realOutputPath);
      expect(success.events).toEqual([
        "open", "write", "sync", "close", "link", "unlink:temporary"
      ]);
      expect(success.temporaryPath()).toMatch(/\.prepare\.[0-9a-f-]+\.tmp$/i);
      expect(success.finalPath()).toBe(realOutputPath);

      for (const failAt of ["write", "sync", "close", "publish"] as const) {
        const failed = createPrepareOutputIo({ failAt });
        await expect(writePrepareOutput(output, {
          io: failed.io,
          randomUUID: () => "44444444-4444-4444-8444-444444444444"
        }), failAt).rejects.toThrow(
          failAt === "publish" ? "D2C_PREPARE_OUTPUT_PUBLISH_FAILED" :
            "D2C_PREPARE_OUTPUT_WRITE_FAILED"
        );
        expect(failed.io.link).toHaveBeenCalledTimes(failAt === "publish" ? 1 : 0);
        expect(failed.io.unlink).toHaveBeenCalledWith(failed.temporaryPath());
        expect(failed.io.unlink).not.toHaveBeenCalledWith(realOutputPath);
      }

      const race = createPrepareOutputIo({ failAt: "publish-race" });
      await expect(writePrepareOutput(output, {
        io: race.io,
        randomUUID: () => "55555555-5555-4555-8555-555555555555"
      })).rejects.toThrow("D2C_PREPARE_OUTPUT_EXISTS");
      expect(race.io.unlink).toHaveBeenCalledWith(race.temporaryPath());
      expect(race.io.unlink).not.toHaveBeenCalledWith(realOutputPath);

      const existing = createPrepareOutputIo({ finalExists: true });
      await expect(writePrepareOutput(output, {
        io: existing.io,
        randomUUID: () => "66666666-6666-4666-8666-666666666666"
      })).rejects.toThrow("D2C_PREPARE_OUTPUT_EXISTS");
      expect(existing.io.open).not.toHaveBeenCalled();

      const cleanupFailure = createPrepareOutputIo({ failAt: "cleanup" });
      await expect(writePrepareOutput(output, {
        io: cleanupFailure.io,
        randomUUID: () => "77777777-7777-4777-8777-777777777777"
      })).rejects.toThrow("D2C_PREPARE_OUTPUT_TEMP_CLEANUP_FAILED");
      expect(cleanupFailure.events.slice(0, 5)).toEqual([
        "open", "write", "sync", "close", "link"
      ]);
      expect(cleanupFailure.io.unlink).not.toHaveBeenCalledWith(realOutputPath);
    } finally {
      await unlink(realOutputPath).catch(() => undefined);
    }
  });

  it("recovers after an actual process interruption without publishing partial JSON", async () => {
    const interruptedMarker =
      "i33-d2-052-20260805T120002Z-88888888-8888-4888-8888-888888888888";
    const output = await runD2Prepare(
      createPrepareRuntime(removeManagedTarget(createIndependentUniverseRows()), interruptedMarker)
        .input
    );
    const finalPath = join(MANIFEST_ROOT, `${interruptedMarker}.prepare.json`);
    await mkdir(MANIFEST_ROOT, { recursive: true });
    await unlink(finalPath).catch(() => undefined);
    const moduleUrl = pathToFileURL(
      join(process.cwd(), "scripts", "issue-0033-d2-cleanup.mjs")
    ).href;
    const childScript = `
      import * as fs from "node:fs/promises";
      import { writePrepareOutput } from ${JSON.stringify(moduleUrl)};
      const output = JSON.parse(Buffer.from(process.env.D2_PREPARE_OUTPUT, "base64").toString("utf8"));
      const io = {
        ...fs,
        open: async (...args) => {
          const handle = await fs.open(...args);
          return {
            writeFile: async (value, encoding) => {
              await handle.writeFile(value.slice(0, 32), encoding);
              process.exit(86);
            },
            sync: () => handle.sync(),
            close: () => handle.close()
          };
        }
      };
      await writePrepareOutput(output, {
        io,
        randomUUID: () => "99999999-9999-4999-8999-999999999999"
      });
    `;
    const env = Object.fromEntries(
      ["PATH", "Path", "SystemRoot", "TEMP", "TMP"]
        .filter((key) => process.env[key])
        .map((key) => [key, process.env[key] as string])
    );
    const childEnv: NodeJS.ProcessEnv = {
      ...env,
      NODE_ENV: "test",
      D2_PREPARE_OUTPUT: Buffer.from(JSON.stringify(output)).toString("base64")
    };
    const child: ChildProcess = spawn(
      process.execPath,
      ["--input-type=module", "--eval", childScript],
      {
      cwd: process.cwd(),
      env: childEnv,
      stdio: "ignore"
      }
    );
    const exitCode = await new Promise<number | null>((resolveExit, rejectExit) => {
      child.once("error", rejectExit);
      child.once("exit", resolveExit);
    });
    expect(exitCode).toBe(86);
    await expect(readFile(finalPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });

    const temporaryPrefix = `.${interruptedMarker}.prepare.`;
    const interruptedTemporaryNames = (await readdir(MANIFEST_ROOT)).filter((name) =>
      name.startsWith(temporaryPrefix)
    );
    expect(interruptedTemporaryNames).toEqual([
      `${temporaryPrefix}99999999-9999-4999-8999-999999999999.tmp`
    ]);
    try {
      await expect(writePrepareOutput(output, {
        randomUUID: () => "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
      })).resolves.toBe(finalPath);
      expect(JSON.parse(await readFile(finalPath, "utf8"))).toEqual(output);
    } finally {
      await unlink(finalPath).catch(() => undefined);
      for (const name of interruptedTemporaryNames) {
        await unlink(join(MANIFEST_ROOT, name)).catch(() => undefined);
      }
    }
  });

  it("keeps the adapter semantic and removes all self-generated approval paths", () => {
    const manifest = createManifest();
    const approval = createApprovalArtifact(manifest);
    const database = { collection: vi.fn() };
    const adapter = createCloudBaseAdapter(database, manifest, {
      approvalArtifactBytes: approval.bytes,
      expectedApprovalSha256: approval.sha256,
      now: () => new Date(NOW)
    });

    expect(Object.keys(adapter).sort()).toEqual([
      "readAudit",
      "readContactProfile",
      "readLegacyUniverse",
      "readProbe",
      "readTarget",
      "removeProbe",
      "removeTarget"
    ]);
    expect(adapter).not.toHaveProperty("getExact");
    expect(adapter).not.toHaveProperty("removeExact");
    expect(adapter).not.toHaveProperty("removeAudit");
    expect(adapter).not.toHaveProperty("removeContactProfile");
    expect(cleanupModule).not.toHaveProperty("createDedicatedProfilesConfirmation");
    expect(cleanupModule).not.toHaveProperty("createLegacyDenylistConfirmation");

    const unsafe = createManifest();
    unsafe.targets.conversations.id =
      "conversation-d43e1f63-3096-4723-a8a7-35342dd36f37";
    expect(() => createCloudBaseAdapter(database, unsafe, {
      approvalArtifactBytes: approval.bytes,
      expectedApprovalSha256: approval.sha256,
      now: () => new Date(NOW)
    })).toThrow("D2C_DENYLIST_ID");
    expect(database.collection).not.toHaveBeenCalled();
  });

  it("requires two stable complete legacy-universe snapshots equal to the manifest sorted sets", async () => {
    const input = runInput();
    input.manifest.legacyDenylist.messages.reverse();
    const result = await runD2Cleanup(input);
    expect(result.phase).toBe("dry-run-complete");
    expect(input.adapter.readLegacyUniverse).toHaveBeenCalledTimes(2);
    expect(input.adapter.removeTarget).not.toHaveBeenCalled();
  });

  it.each([
    ["missing", (input: TestRunInput) => { input.manifest.legacyDenylist.messages = []; }],
    ["extra", (input: TestRunInput) => { input.manifest.legacyDenylist.messages.push("not-in-universe"); }],
    ["duplicate", (input: TestRunInput) => { input.manifest.legacyDenylist.messages.push("legacy-message-i33-d2"); }],
    ["cross collection", (input: TestRunInput) => {
      input.manifest.legacyDenylist.messages = ["legacy-request-i33-d2"];
      input.manifest.legacyDenylist.contact_exchange_requests = ["legacy-message-i33-d2"];
    }]
  ])("fails closed for a %s legacy denylist", async (_name, mutate) => {
    const input = runInput();
    mutate(input);
    await expect(runD2Cleanup(input)).rejects.toThrow(/D2C_LEGACY_(DENYLIST|UNIVERSE)/);
    expect(input.adapter.removeTarget).not.toHaveBeenCalled();
  });

  it("fails closed when a concurrent legacy ID changes the second snapshot", async () => {
    const input = runInput();
    const first = createLegacySnapshot();
    const second = structuredClone(first);
    second.collections.messages.push("concurrent-legacy-message");
    input.adapter.readLegacyUniverse
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);
    await expect(runD2Cleanup(input)).rejects.toThrow("D2C_LEGACY_UNIVERSE_UNSTABLE");
    expect(input.adapter.removeTarget).not.toHaveBeenCalled();
  });

  it("fails closed when the complete universe does not contain the captured target", async () => {
    const input = runInput();
    const snapshot = createLegacySnapshot();
    snapshot.collections.messages = snapshot.collections.messages.filter(
      (id) => id !== input.manifest.targets.messages.id
    );
    input.adapter.readLegacyUniverse.mockResolvedValue(snapshot);
    await expect(runD2Cleanup(input)).rejects.toThrow(
      "D2C_LEGACY_UNIVERSE_TARGET_MISSING"
    );
    expect(input.adapter.removeTarget).not.toHaveBeenCalled();
  });

  it.each([
    ["incomplete pagination", async () => ({ ...createLegacySnapshot(), complete: false })],
    ["read rejection", async () => { throw new Error("sdk read failed"); }]
  ])("fails closed for legacy-universe %s", async (_name, implementation) => {
    const input = runInput();
    input.adapter.readLegacyUniverse.mockImplementation(implementation);
    await expect(runD2Cleanup(input)).rejects.toThrow(/D2C_LEGACY_UNIVERSE_(INCOMPLETE|READ_FAILED)/);
    expect(input.adapter.removeTarget).not.toHaveBeenCalled();
  });

  it("builds only the canonical legacy relationship closure plus one managed marker target", async () => {
    const manifest = createManifest();
    const approval = createApprovalArtifact(manifest);
    const rows = createIndependentUniverseRows();
    rows.messages.push(...Array.from({ length: 101 }, (_, index) => ({
      _id: `ordinary-paged-message-${String(index).padStart(3, "0")}`,
      id: `ordinary-paged-message-${String(index).padStart(3, "0")}`,
      conversationId: "ordinary-conversation-i33-d2"
    })));
    const database = createUniverseDatabase(rows);
    const adapter = createCloudBaseAdapter({ collection: database.collection }, manifest, {
      approvalArtifactBytes: approval.bytes,
      expectedApprovalSha256: approval.sha256,
      now: () => new Date(NOW)
    });
    const readUniverse = vi.spyOn(adapter, "readLegacyUniverse");

    const snapshot = await adapter.readLegacyUniverse();
    expect(snapshot).toEqual(createLegacySnapshot());
    expect(JSON.stringify(snapshot)).not.toContain("ordinary-");
    expect(database.calls).toContainEqual({ collection: "messages", skip: 100, limit: 100 });
    expect(readUniverse).toHaveBeenCalledTimes(1);
    expect(readUniverse).toHaveBeenCalledWith();
    expect([...new Set(database.collection.mock.calls.map(([name]) => name))]).toEqual([
      "parent_needs",
      "tutor_profiles",
      "conversations",
      "messages",
      "contact_exchange_requests"
    ]);

    rows.messages = rows.messages.filter(
      (row) => row.id !== manifest.targets.messages.id
    );
    const progressiveSnapshot = await adapter.readLegacyUniverse();
    expect(progressiveSnapshot.complete).toBe(true);
    expect(progressiveSnapshot.collections.messages).not.toContain(manifest.targets.messages.id);
    expect(progressiveSnapshot.collections.conversations).toContain(manifest.targets.conversations.id);
  });

  it.each([
    ["orphan conversation", (rows: UniverseRows) => {
      rows.conversations.push({
        id: "orphan-conversation",
        sourceId: "missing-source",
        sourceType: "parent-need"
      });
    }],
    ["orphan message", (rows: UniverseRows) => {
      rows.messages.push({ id: "orphan-message", conversationId: "missing-conversation" });
    }],
    ["orphan request", (rows: UniverseRows) => {
      rows.contact_exchange_requests.push({
        id: "orphan-request",
        conversationId: "missing-conversation"
      });
    }],
    ["unknown source type", (rows: UniverseRows) => {
      rows.conversations[0].sourceType = "unknown-source";
    }],
    ["version management-state conflict", (rows: UniverseRows) => {
      rows.parent_needs[1].managementState = "legacy-readonly";
    }],
    ["multiple managed marker targets", (rows: UniverseRows) => {
      rows.parent_needs.push({
        ...rows.parent_needs[2],
        _id: "second-managed-marker-source",
        id: "second-managed-marker-source"
      });
    }]
  ])("marks the legacy universe incomplete for %s", async (_name, mutate) => {
    const manifest = createManifest();
    const approval = createApprovalArtifact(manifest);
    const rows = createIndependentUniverseRows();
    mutate(rows);
    const database = createUniverseDatabase(rows);
    const adapter = createCloudBaseAdapter({ collection: database.collection }, manifest, {
      approvalArtifactBytes: approval.bytes,
      expectedApprovalSha256: approval.sha256,
      now: () => new Date(NOW)
    });
    const snapshot = await adapter.readLegacyUniverse();
    expect(snapshot.complete).toBe(false);

    const input = runInput();
    input.adapter.readLegacyUniverse.mockResolvedValue(snapshot);
    await expect(runD2Cleanup(input)).rejects.toThrow("D2C_LEGACY_UNIVERSE_INCOMPLETE");
    expect(input.adapter.removeTarget).not.toHaveBeenCalled();
  });

  it("fails closed when the fixed internal legacy scan is truncated or rejects", async () => {
    const manifest = createManifest();
    const approval = createApprovalArtifact(manifest);
    const rows = createIndependentUniverseRows();
    const truncatedDatabase = createUniverseDatabase(rows, (collection, skip) => {
      if (collection !== "messages") return undefined;
      return {
        data: Array.from({ length: 100 }, (_, index) => ({
          id: `never-ending-${skip + index}`,
          conversationId: "ordinary-conversation-i33-d2"
        }))
      };
    });
    const truncatedAdapter = createCloudBaseAdapter(
      { collection: truncatedDatabase.collection },
      manifest,
      {
        approvalArtifactBytes: approval.bytes,
        expectedApprovalSha256: approval.sha256,
        now: () => new Date(NOW)
      }
    );
    await expect(truncatedAdapter.readLegacyUniverse()).resolves.toMatchObject({ complete: false });
    expect(truncatedDatabase.calls).toContainEqual({
      collection: "messages",
      skip: 99_900,
      limit: 100
    });

    const rejectedDatabase = createUniverseDatabase(rows, (collection) => {
      if (collection === "tutor_profiles") throw new Error("fixed read failed");
      return undefined;
    });
    const rejectedAdapter = createCloudBaseAdapter(
      { collection: rejectedDatabase.collection },
      manifest,
      {
        approvalArtifactBytes: approval.bytes,
        expectedApprovalSha256: approval.sha256,
        now: () => new Date(NOW)
      }
    );
    await expect(rejectedAdapter.readLegacyUniverse()).rejects.toThrow("fixed read failed");
  });

  it("requires a TEMP-only independently hashed, current, compliant profile approval artifact", async () => {
    const input = runInput();
    await expect(runD2Cleanup(input)).resolves.toMatchObject({ ok: true });

    await expect(runD2Cleanup({
      ...runInput(),
      approvalArtifactBytes: undefined as never
    })).rejects.toThrow("D2C_APPROVAL_ARTIFACT_INVALID");

    const missingHash = runInput({ expectedApprovalSha256: "" });
    await expect(runD2Cleanup(missingHash)).rejects.toThrow("D2C_APPROVAL_SHA256_INVALID");

    const mismatch = runInput({ expectedApprovalSha256: "0".repeat(64) });
    await expect(runD2Cleanup(mismatch)).rejects.toThrow("D2C_APPROVAL_HASH_MISMATCH");

    const wrongStatement = createApprovalArtifact(createManifest(), { statement: "self approved" });
    await expect(runD2Cleanup(runInput({
      approvalArtifactBytes: wrongStatement.bytes,
      expectedApprovalSha256: wrongStatement.sha256
    }))).rejects.toThrow("D2C_APPROVAL_STATEMENT_INVALID");

    const expired = createApprovalArtifact(createManifest(), { issuedAt: "2026-08-04T12:00:00.000Z" });
    await expect(runD2Cleanup(runInput({
      approvalArtifactBytes: expired.bytes,
      expectedApprovalSha256: expired.sha256
    }))).rejects.toThrow("D2C_APPROVAL_EXPIRED");
  });

  it.each([
    ["duplicate role", (envelope: ApprovalEnvelope) => { envelope.profiles[1].role = "owner"; }],
    ["duplicate id", (envelope: ApprovalEnvelope) => { envelope.profiles[1].id = envelope.profiles[0].id; }],
    ["owner mismatch", (envelope: ApprovalEnvelope) => { envelope.profiles[0].ownerUserId = "other"; }],
    ["invalid nonce", (envelope: ApprovalEnvelope) => { envelope.nonce = "short"; }],
    ["invalid approval id", (envelope: ApprovalEnvelope) => { envelope.approvalId = "self-approved"; }]
  ])("rejects approval artifact %s", async (_name, mutate) => {
    const envelope = createApprovalEnvelope();
    mutate(envelope);
    const bytes = JSON.stringify(envelope);
    const input = runInput({ approvalArtifactBytes: bytes, expectedApprovalSha256: sha256(bytes) });
    await expect(runD2Cleanup(input)).rejects.toThrow(/D2C_APPROVAL_/);
    expect(input.adapter.removeTarget).not.toHaveBeenCalled();
  });

  it("requires the approved profile projections to exactly match the read-only production snapshot", async () => {
    for (const field of ["id", "ownerUserId", "updatedAt"] as const) {
      const input = runInput();
      input.adapter.readContactProfile.mockImplementation(async (role) => {
        const envelope = createApprovalEnvelope(input.manifest);
        const profile = envelope.profiles.find((item) => item.role === role)!;
        return { data: { ...profile, [field]: `changed-${field}` } };
      });
      await expect(runD2Cleanup(input)).rejects.toThrow("D2C_CONTACT_PROFILE_MISMATCH");
      expect(input.adapter.removeTarget).not.toHaveBeenCalled();
    }
  });

  it("limits manifest, approval, and residual artifacts to exact TEMP paths", () => {
    const approval = createApprovalArtifact();
    const manifestPath = join(MANIFEST_ROOT, `${RUN_MARKER}.json`);
    const approvalPath = join(MANIFEST_ROOT, `${approval.envelope.approvalId}.json`);
    const resumePath = join(MANIFEST_ROOT, `${RUN_MARKER}.resume.json`);
    expect(parseCleanupArgs([
      "--env-id", PROD_CLOUDBASE_ENV_ID,
      "--run-marker", RUN_MARKER,
      "--manifest", manifestPath,
      "--approval", approvalPath,
      "--expected-approval-sha256", approval.sha256
    ])).toMatchObject({ approvalPath, expectedApprovalSha256: approval.sha256, manifestPath });
    expect(parseCleanupArgs([
      "--env-id", PROD_CLOUDBASE_ENV_ID,
      "--run-marker", RUN_MARKER,
      "--manifest", manifestPath,
      "--approval", approvalPath,
      "--expected-approval-sha256", approval.sha256,
      "--mode", "cleanup",
      "--resume-state", resumePath
    ])).toMatchObject({ resumeStatePath: resumePath });

    for (const [flag, path] of [
      ["--manifest", join(tmpdir(), `${RUN_MARKER}.json`)],
      ["--approval", join(tmpdir(), `${approval.envelope.approvalId}.json`)],
      ["--resume-state", join(tmpdir(), `${RUN_MARKER}.resume.json`)]
    ]) {
      const args = [
        "--env-id", PROD_CLOUDBASE_ENV_ID,
        "--run-marker", RUN_MARKER,
        "--manifest", manifestPath,
        "--approval", approvalPath,
        "--expected-approval-sha256", approval.sha256,
        "--mode", "cleanup"
      ];
      const index = args.indexOf(flag);
      if (index >= 0) args[index + 1] = path;
      else args.push(flag, path);
      expect(() => parseCleanupArgs(args)).toThrow(/D2C_(MANIFEST|APPROVAL|RESIDUAL)_PATH_INVALID/);
    }
  });

  it("preflights the fixture without remove and derives the complete five-audit chain", async () => {
    const input = runInput();
    const result = await runD2Cleanup(input);
    expect(result.events).toContainEqual({
      collection: "parent_needs",
      count: 1,
      idLabel: hashId(input.manifest.targets.parent_needs.id),
      stage: "preflight"
    });
    expect(input.adapter.readAudit.mock.calls.map(([version]) => version)).toEqual([1, 2, 3, 4, 5]);
    expect(input.adapter.removeTarget).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain(RUN_MARKER);

    const broken = runInput();
    broken.adapter.readAudit.mockImplementation(async (version) => {
      const id = deriveAuditId(broken.manifest.targets.parent_needs.id, version);
      const document = { ...createFixtureDocuments(broken.manifest).get(`audit_events:${id}`)! };
      if (version === 4) document.from = { status: "published", version: 3 };
      return { data: document };
    });
    await expect(runD2Cleanup(broken)).rejects.toThrow("D2C_AUDIT_CONTRACT_MISMATCH");
  });

  it("accepts object or array SDK data and rejects zero or multiple exact documents", async () => {
    const arrayInput = runInput();
    arrayInput.adapter.readTarget.mockImplementation(async (collection) => ({
      data: [createFixtureDocuments(arrayInput.manifest).get(
        `${collection}:${arrayInput.manifest.targets[collection].id}`
      )]
    }));
    await expect(runD2Cleanup(arrayInput)).resolves.toMatchObject({ ok: true });

    for (const data of [undefined, [{ id: "a" }, { id: "b" }]]) {
      const input = runInput();
      input.adapter.readTarget.mockResolvedValueOnce({ data });
      await expect(runD2Cleanup(input)).rejects.toThrow("D2C_EXACT_COUNT_MISMATCH");
    }
  });

  it.each([[0], ["0"]])("proves probe GET=0 before normalized deleted=%s", async (deleted) => {
    const input = runInput({
      confirmExecute: createExecutionConfirmation("probe", RUN_MARKER),
      mode: "probe",
      randomUUID: vi.fn()
        .mockReturnValueOnce("22222222-2222-4222-8222-222222222221")
        .mockReturnValueOnce("22222222-2222-4222-8222-222222222222")
        .mockReturnValueOnce("22222222-2222-4222-8222-222222222223")
        .mockReturnValueOnce("22222222-2222-4222-8222-222222222224")
    });
    input.adapter.removeProbe.mockResolvedValue({ deleted });
    const result = await runD2Cleanup(input);
    expect(result.phase).toBe("probe-complete");
    expect(input.adapter.readProbe).toHaveBeenCalledTimes(4);
    expect(input.adapter.removeProbe).toHaveBeenCalledTimes(4);
    for (let index = 0; index < 4; index += 1) {
      expect(input.adapter.readProbe.mock.invocationCallOrder[index]).toBeLessThan(
        input.adapter.removeProbe.mock.invocationCallOrder[index]
      );
    }
  });

  it("never removes a probe ID that exact GET finds", async () => {
    const input = runInput({
      confirmExecute: createExecutionConfirmation("probe", RUN_MARKER),
      mode: "probe",
      randomUUID: vi.fn()
        .mockReturnValueOnce("33333333-3333-4333-8333-333333333331")
        .mockReturnValueOnce("33333333-3333-4333-8333-333333333332")
        .mockReturnValueOnce("33333333-3333-4333-8333-333333333333")
        .mockReturnValueOnce("33333333-3333-4333-8333-333333333334")
    });
    input.adapter.readProbe.mockResolvedValueOnce({ data: { id: "occupied" } });
    await expect(runD2Cleanup(input)).rejects.toThrow("D2C_PROBE_ID_NOT_EMPTY");
    expect(input.adapter.removeProbe).not.toHaveBeenCalled();
  });

  it.each([[1], ["1"]])("revalidates all surviving state before normalized cleanup deleted=%s", async (deleted) => {
    const manifest = createManifest();
    const approval = createApprovalArtifact(manifest);
    const documents = createFixtureDocuments(manifest, approval.envelope);
    const adapter = createFakeAdapter(documents, manifest, approval.envelope);
    const input = runInput({
      adapter,
      approvalArtifactBytes: approval.bytes,
      confirmExecute: createExecutionConfirmation("cleanup", RUN_MARKER),
      expectedApprovalSha256: approval.sha256,
      manifest,
      mode: "cleanup"
    });
    input.adapter.removeTarget.mockImplementation(async (collection) => {
      documents.delete(`${collection}:${input.manifest.targets[collection].id}`);
      return { deleted };
    });
    const result = await runD2Cleanup(input);
    expect(result.phase).toBe("cleanup-complete");
    expect(input.adapter.removeTarget.mock.calls.map(([collection]) => collection)).toEqual(TARGET_COLLECTIONS);
    expect(input.adapter.readContactProfile).toHaveBeenCalledTimes(16);
    expect(input.adapter.readAudit).toHaveBeenCalledTimes(40);
    expect(input.adapter.readLegacyUniverse).toHaveBeenCalledTimes(8);
  });

  it("fails before the next delete when a relation or legacy universe changes", async () => {
    const manifest = createManifest();
    const approval = createApprovalArtifact(manifest);
    const documents = createFixtureDocuments(manifest, approval.envelope);
    const input = runInput({
      adapter: createFakeAdapter(documents, manifest, approval.envelope),
      approvalArtifactBytes: approval.bytes,
      confirmExecute: createExecutionConfirmation("cleanup", RUN_MARKER),
      expectedApprovalSha256: approval.sha256,
      manifest,
      mode: "cleanup"
    });
    input.adapter.removeTarget.mockImplementation(async (collection) => {
      const deleted = documents.delete(`${collection}:${input.manifest.targets[collection].id}`) ? 1 : 0;
      if (collection === "messages") {
        documents.get(`conversations:${input.manifest.targets.conversations.id}`)!.sourceVersion = 4;
      }
      return { deleted };
    });
    let failure: unknown;
    try { await runD2Cleanup(input); } catch (error) { failure = error; }
    expect(failure).toBeInstanceOf(D2CleanupError);
    expect(failure).toMatchObject({
      code: "D2C_CONVERSATION_RELATION_MISMATCH",
      progress: { completedCollections: ["messages"] },
      residualManifest: {
        residualCollections: ["contact_exchange_requests", "conversations", "parent_needs"]
      }
    });
    expect(input.adapter.removeTarget).toHaveBeenCalledTimes(1);
  });

  it("returns machine residual progress, requires a fresh token, and blocks second cleanup", async () => {
    const manifest = createManifest();
    const approval = createApprovalArtifact(manifest);
    const documents = createFixtureDocuments(manifest, approval.envelope);
    const input = runInput({
      adapter: createFakeAdapter(documents, manifest, approval.envelope),
      approvalArtifactBytes: approval.bytes,
      confirmExecute: createExecutionConfirmation("cleanup", RUN_MARKER),
      expectedApprovalSha256: approval.sha256,
      manifest,
      mode: "cleanup"
    });
    input.adapter.removeTarget.mockImplementation(async (collection) => {
      if (collection === "contact_exchange_requests") return { deleted: 0 };
      return { deleted: documents.delete(`${collection}:${input.manifest.targets[collection].id}`) ? 1 : 0 };
    });
    let failure: unknown;
    try { await runD2Cleanup(input); } catch (error) { failure = error; }
    if (!(failure instanceof D2CleanupError) || !failure.residualManifest) {
      throw new Error("expected residual cleanup failure");
    }
    expect(failure.progress).toMatchObject({
      completedCollections: ["messages"],
      failedCollection: "contact_exchange_requests"
    });
    expect(JSON.stringify(failure.residualManifest)).not.toContain(RUN_MARKER);
    expect(JSON.stringify(failure.residualManifest)).not.toContain(input.manifest.targets.messages.id);

    const resumeDocuments = createFixtureDocuments(input.manifest);
    resumeDocuments.delete(`messages:${input.manifest.targets.messages.id}`);
    const cleanupResidual = failure.residualManifest as import(
      "../scripts/issue-0033-d2-cleanup.mjs"
    ).D2ResidualManifest;
    const resume = runInput({
      adapter: createFakeAdapter(resumeDocuments),
      mode: "cleanup",
      resumeState: cleanupResidual
    });
    await expect(runD2Cleanup(resume)).rejects.toThrow("D2C_EXECUTION_CONFIRMATION_REQUIRED");
    resume.confirmExecute = createExecutionConfirmation("cleanup", RUN_MARKER, cleanupResidual);
    await expect(runD2Cleanup(resume)).resolves.toMatchObject({ phase: "cleanup-complete" });
    expect(resume.adapter.removeTarget.mock.calls.map(([collection]) => collection)).toEqual([
      "contact_exchange_requests", "conversations", "parent_needs"
    ]);
    const firstCount = resume.adapter.removeTarget.mock.calls.length;
    await expect(runD2Cleanup(resume)).rejects.toThrow("D2C_CLEANUP_REMAINING_TARGET_MISSING");
    expect(resume.adapter.removeTarget).toHaveBeenCalledTimes(firstCount);
  });

  it("records a commit-then-throw delete as completed and resumes only remaining targets", async () => {
    const manifest = createManifest();
    const approval = createApprovalArtifact(manifest);
    const documents = createFixtureDocuments(manifest, approval.envelope);
    const adapter = createFakeAdapter(documents, manifest, approval.envelope);
    adapter.removeTarget.mockImplementation(async (collection) => {
      const deleted = documents.delete(`${collection}:${manifest.targets[collection].id}`);
      if (collection === "messages" && deleted) throw new Error("transport failed after commit");
      return { deleted: deleted ? 1 : 0 };
    });
    const input = runInput({
      adapter,
      approvalArtifactBytes: approval.bytes,
      confirmExecute: createExecutionConfirmation("cleanup", RUN_MARKER),
      expectedApprovalSha256: approval.sha256,
      manifest,
      mode: "cleanup"
    });

    let failure: unknown;
    try { await runD2Cleanup(input); } catch (error) { failure = error; }
    expect(failure).toBeInstanceOf(D2CleanupError);
    expect(failure).toMatchObject({
      progress: { completedCollections: ["messages"], failedCollection: "messages" },
      residualManifest: {
        residualCollections: ["contact_exchange_requests", "conversations", "parent_needs"]
      }
    });
    const residual = (failure as D2CleanupError).residualManifest as D2ResidualManifest;
    const resumeAdapter = createFakeAdapter(documents, manifest, approval.envelope);
    const resume = runInput({
      adapter: resumeAdapter,
      approvalArtifactBytes: approval.bytes,
      confirmExecute: createExecutionConfirmation("cleanup", RUN_MARKER, residual),
      expectedApprovalSha256: approval.sha256,
      manifest,
      mode: "cleanup",
      resumeState: residual
    });
    await expect(runD2Cleanup(resume)).resolves.toMatchObject({ phase: "cleanup-complete" });
    expect(resumeAdapter.removeTarget.mock.calls.map(([collection]) => collection)).toEqual([
      "contact_exchange_requests", "conversations", "parent_needs"
    ]);
  });

  it("fails closed when a completed target reappears or a remaining target disappears", async () => {
    const manifest = createManifest();
    const approval = createApprovalArtifact(manifest);
    const documents = createFixtureDocuments(manifest, approval.envelope);
    documents.delete(`messages:${manifest.targets.messages.id}`);
    const residual: D2ResidualManifest = {
      schemaVersion: 1 as const,
      runMarkerHash: hashId(RUN_MARKER),
      completedCollections: ["messages"],
      residualCollections: ["contact_exchange_requests", "conversations", "parent_needs"],
      resumeToken: sha256(
        `D2C-RESUME|${RUN_MARKER}|messages|contact_exchange_requests,conversations,parent_needs`
      )
    };
    const adapter = createFakeAdapter(documents, manifest, approval.envelope);
    adapter.readLegacyUniverse.mockResolvedValue({
      complete: true,
      collections: createLegacySnapshot().collections
    });
    const reappeared = runInput({
      adapter,
      approvalArtifactBytes: approval.bytes,
      confirmExecute: createExecutionConfirmation("cleanup", RUN_MARKER, residual),
      expectedApprovalSha256: approval.sha256,
      manifest,
      mode: "cleanup",
      resumeState: residual
    });
    await expect(runD2Cleanup(reappeared)).rejects.toThrow("D2C_CLEANUP_COMPLETED_TARGET_REAPPEARED");
    expect(adapter.removeTarget).not.toHaveBeenCalled();

    const missingDocuments = createFixtureDocuments(manifest, approval.envelope);
    missingDocuments.delete(`contact_exchange_requests:${manifest.targets.contact_exchange_requests.id}`);
    const missingAdapter = createFakeAdapter(missingDocuments, manifest, approval.envelope);
    const missing = runInput({
      adapter: missingAdapter,
      approvalArtifactBytes: approval.bytes,
      confirmExecute: createExecutionConfirmation("cleanup", RUN_MARKER),
      expectedApprovalSha256: approval.sha256,
      manifest,
      mode: "cleanup"
    });
    await expect(runD2Cleanup(missing)).rejects.toThrow("D2C_CLEANUP_REMAINING_TARGET_MISSING");
    expect(missingAdapter.removeTarget).not.toHaveBeenCalled();
  });

  it("requires two semantically identical cleanup snapshots before remove", async () => {
    const input = runInput({
      confirmExecute: createExecutionConfirmation("cleanup", RUN_MARKER),
      mode: "cleanup"
    });
    const original = input.adapter.readTarget.getMockImplementation()!;
    let conversationReads = 0;
    input.adapter.readTarget.mockImplementation(async (collection) => {
      const result = await original(collection);
      const data = result.data as Record<string, unknown> | undefined;
      if (collection !== "conversations" || ++conversationReads !== 2 || !data) return result;
      return {
        data: {
          ...data,
          participantUserIds: [...(data.participantUserIds as string[])].reverse()
        }
      };
    });
    await expect(runD2Cleanup(input)).rejects.toThrow("D2C_CLEANUP_STATE_UNSTABLE");
    expect(input.adapter.removeTarget).not.toHaveBeenCalled();
  });

  it.each([
    ["legacy", (adapter: FakeAdapter) => {
      const originalRead = adapter.readLegacyUniverse.getMockImplementation()!;
      const originalRemove = adapter.removeTarget.getMockImplementation()!;
      let drifted = false;
      adapter.removeTarget.mockImplementation(async (collection) => {
        const result = await originalRemove(collection);
        if (collection === "messages") drifted = true;
        return result;
      });
      adapter.readLegacyUniverse.mockImplementation(async () => {
        const snapshot = await originalRead();
        if (!drifted) return snapshot;
        return {
          ...snapshot,
          collections: {
            ...snapshot.collections,
            conversations: [...snapshot.collections.conversations, "unexpected-marker-or-legacy-id"]
          }
        };
      });
    }, "D2C_LEGACY_UNIVERSE_MISMATCH"],
    ["profile", (adapter: FakeAdapter, documents: Map<string, Record<string, unknown>>) => {
      const original = adapter.removeTarget.getMockImplementation()!;
      adapter.removeTarget.mockImplementation(async (collection) => {
        const result = await original(collection);
        if (collection === "messages") {
          const profileKey = [...documents.keys()].find((key) => key.startsWith("contact_profiles:"))!;
          documents.get(profileKey)!.updatedAt = "2026-08-05T12:00:01.000Z";
        }
        return result;
      });
    }, "D2C_CONTACT_PROFILE_MISMATCH"],
    ["audit", (adapter: FakeAdapter, documents: Map<string, Record<string, unknown>>, manifest: D2CleanupManifest) => {
      const original = adapter.removeTarget.getMockImplementation()!;
      adapter.removeTarget.mockImplementation(async (collection) => {
        const result = await original(collection);
        if (collection === "messages") {
          documents.get(`audit_events:${deriveAuditId(manifest.targets.parent_needs.id, 5)}`)!.action = "delete";
        }
        return result;
      });
    }, "D2C_AUDIT_CONTRACT_MISMATCH"]
  ])("fails before the second remove when %s state drifts", async (_name, mutate, code) => {
    const manifest = createManifest();
    const approval = createApprovalArtifact(manifest);
    const documents = createFixtureDocuments(manifest, approval.envelope);
    const adapter = createFakeAdapter(documents, manifest, approval.envelope);
    mutate(adapter, documents, manifest);
    const input = runInput({
      adapter,
      approvalArtifactBytes: approval.bytes,
      confirmExecute: createExecutionConfirmation("cleanup", RUN_MARKER),
      expectedApprovalSha256: approval.sha256,
      manifest,
      mode: "cleanup"
    });
    await expect(runD2Cleanup(input)).rejects.toThrow(code);
    expect(adapter.removeTarget).toHaveBeenCalledTimes(1);
  });

  it("builds a deterministic synthetic-fixture machine plan and binds lifecycle CLI arguments", () => {
    const ownerId = "email_42322f7b8901e4fb8174c6c1";
    const participantId = "email_88cc6554aa448d72dc948fec";
    const plan = createD2SyntheticFixtureMachinePlan({
      envId: PROD_CLOUDBASE_ENV_ID,
      ownerId,
      participantId,
      runMarker: RUN_MARKER
    });

    expect(plan).toMatchObject({
      schemaVersion: 2,
      kind: "issue-0033-d2-synthetic-fixture-plan",
      mode: "synthetic-fixture-lifecycle",
      envId: PROD_CLOUDBASE_ENV_ID,
      runMarker: RUN_MARKER,
      participants: { ownerId, participantId },
      expectedWrites: {
        auditDocumentsRetained: 5,
        documentSetCalls: 20,
        sourceTransactions: 5,
        targetDocuments: 4
      }
    });
    expect(plan.steps.map((step) => step.name)).toEqual([
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
    ]);
    const serialized = JSON.stringify(plan);
    expect(serialized).toContain(RUN_MARKER);
    expect(serialized).not.toMatch(/@|\b1[3-9]\d{9}\b|微信|wechat|weixin|\bqq\b/i);

    const planArgs = parseCleanupArgs([
      "--mode", "synthetic-fixture-plan",
      "--env-id", PROD_CLOUDBASE_ENV_ID,
      "--run-marker", RUN_MARKER,
      "--owner-id", ownerId,
      "--participant-id", participantId
    ]);
    expect(planArgs).toMatchObject({ mode: "synthetic-fixture-plan", ownerId, participantId });

    const planSha256 = sha256(JSON.stringify(plan));
    const authorizationSha256 = "a".repeat(64);
    const authorizationPath = join(
      MANIFEST_ROOT,
      `${RUN_MARKER}.synthetic-fixture.authorization.json`
    );
    const confirm = createSyntheticFixtureExecutionConfirmation({
      envId: PROD_CLOUDBASE_ENV_ID,
      expectedAuthorizationSha256: authorizationSha256,
      expectedFixturePlanSha256: planSha256,
      ownerId,
      participantId,
      runMarker: RUN_MARKER
    });
    const lifecycleArgs = parseCleanupArgs([
      "--mode", "synthetic-fixture-lifecycle",
      "--env-id", PROD_CLOUDBASE_ENV_ID,
      "--run-marker", RUN_MARKER,
      "--owner-id", ownerId,
      "--participant-id", participantId,
      "--authorization", authorizationPath,
      "--expected-authorization-sha256", authorizationSha256,
      "--expected-fixture-plan-sha256", planSha256,
      "--confirm-execute", confirm
    ]);
    expect(lifecycleArgs).toMatchObject({
      confirmExecute: confirm,
      authorizationPath,
      expectedAuthorizationSha256: authorizationSha256,
      expectedFixturePlanSha256: planSha256,
      mode: "synthetic-fixture-lifecycle",
      ownerId,
      participantId
    });
    expect(() => parseCleanupArgs([
      "--mode", "synthetic-fixture-lifecycle",
      "--env-id", PROD_CLOUDBASE_ENV_ID,
      "--run-marker", RUN_MARKER,
      "--owner-id", ownerId,
      "--participant-id", participantId,
      "--confirm-execute", createExecutionConfirmation("cleanup", RUN_MARKER)
    ])).toThrow("D2C_CLI_REQUIRED_ARGUMENT_MISSING");
  });

  it("runs exactly one managed synthetic fixture through v1-v5 and retains five audits", async () => {
    const ownerId = "email_42322f7b8901e4fb8174c6c1";
    const participantId = "email_88cc6554aa448d72dc948fec";
    const { adapter } = createFakeSyntheticFixtureAdapter();
    const result = await runD2SyntheticFixtureLifecycleForTest(
      syntheticFixtureRunInput(adapter)
    );

    expect(result).toMatchObject({
      ok: true,
      phase: "synthetic-fixture-complete",
      manifest: {
        schemaVersion: 3,
        envId: PROD_CLOUDBASE_ENV_ID,
        runMarker: RUN_MARKER,
        participants: { ownerId, participantId },
        targets: {
          parent_needs: { id: "parent-need-synthetic-fixture" },
          conversations: { id: expect.stringMatching(/^conversation-[0-9a-f]{64}$/) },
          messages: { id: expect.stringMatching(/^message-[0-9a-f]{64}$/) },
          contact_exchange_requests: {
            id: expect.stringMatching(/^contact-exchange-[0-9a-f]{64}$/)
          }
        }
      },
      lifecycle: { status: "published", version: 5 },
      gates: {
        deletedAuthorizedProfilesVisible: false,
        deletedContactStatus: 403,
        deletedMessageStatus: 403,
        restoredAuthorizedProfilesVisible: true
      }
    });
    expect(result.auditIds).toEqual([1, 2, 3, 4, 5].map((version) =>
      deriveAuditId("parent-need-synthetic-fixture", version)
    ));
    expect(adapter.readPreflightSnapshot).toHaveBeenCalledTimes(2);
    expect(adapter.sendMessage).toHaveBeenCalledTimes(2);
    expect(adapter.createContactRequest).toHaveBeenCalledTimes(2);
    expect(adapter.countMessages).toHaveBeenCalledTimes(5);
    expect(adapter.countRequests).toHaveBeenCalledTimes(5);
  });

  it.each(["PARTIAL", "COMPLETE", "UNKNOWN"])(
    "refuses marker residue state %s before the first fixture write",
    async (targetState) => {
      const { adapter } = createFakeSyntheticFixtureAdapter();
      adapter.readPreflightSnapshot.mockResolvedValue({
        completeness: targetState === "UNKNOWN" ? "INCOMPLETE" : "COMPLETE",
        targetState: (targetState === "UNKNOWN" ? "ABSENT" : targetState) as
          D2PrepareDiscoverySnapshot["targetState"],
        legacyDenylist: createManifest().legacyDenylist,
        targets: {
          messages: targetState === "PARTIAL" ? { id: "message-residual" } : null,
          contact_exchange_requests: null,
          conversations: null,
          parent_needs: targetState === "COMPLETE" ? { id: "source-existing" } : null
        }
      });
      const failure = await captureSyntheticFailure(syntheticFixtureRunInput(adapter));
      expect(failure.code).toBe({
        PARTIAL: "D2C_SYNTHETIC_FIXTURE_PREFLIGHT_NOT_ABSENT",
        COMPLETE: "D2C_PREPARE_TARGET_STATE_INVALID",
        UNKNOWN: "D2C_PREPARE_DISCOVERY_INCOMPLETE"
      }[targetState]);
      expect(failure.progress).toMatchObject({ failedStep: "preflight-absent" });
      expect(adapter.createSource).not.toHaveBeenCalled();
    }
  );

  it("rejects cross-mode confirmation and plan-hash replay before claim or data access", async () => {
    for (const override of [
      {
        confirmExecute: createExecutionConfirmation("pre-fixture-probe", RUN_MARKER)
      },
      { expectedFixturePlanSha256: "0".repeat(64) }
    ]) {
      const { adapter } = createFakeSyntheticFixtureAdapter();
      const input = { ...syntheticFixtureRunInput(adapter), ...override };
      const failure = await captureSyntheticFailure(input);
      expect(failure.code).toMatch(
        /D2C_(EXECUTION_CONFIRMATION_REQUIRED|SYNTHETIC_FIXTURE_PLAN_HASH_MISMATCH)/
      );
      expect(input.authorizationLease.finalize).toHaveBeenCalledTimes(1);
      expect(adapter.readPreflightSnapshot).not.toHaveBeenCalled();
      expect(adapter.createSource).not.toHaveBeenCalled();
    }
  });

  it.each([
    ["createSource", 1, "source-create-v1"],
    ["updateSource", 1, "source-update-v2"],
    ["createConversation", 1, "conversation-create"],
    ["sendMessage", 1, "message-create"],
    ["createContactRequest", 1, "contact-request-create"],
    ["approveContactRequest", 1, "contact-request-approve"],
    ["deleteSource", 1, "source-delete-v3"],
    ["restoreSource", 1, "source-restore-v4"],
    ["updateSource", 2, "source-update-v5"]
  ] as const)(
    "fails once at %s call %i with an exact residual manifest",
    async (method, failureCall, failedStep) => {
      const { adapter } = createFakeSyntheticFixtureAdapter();
      const operation = adapter[method] as Mock;
      const original = operation.getMockImplementation();
      let calls = 0;
      operation.mockImplementation(async (...args: unknown[]) => {
        calls += 1;
        if (calls === failureCall) throw new Error("synthetic injected failure");
        return original?.(...args);
      });
      const failure = await captureSyntheticFailure(syntheticFixtureRunInput(adapter));
      expect(failure.code).toBe("D2C_SYNTHETIC_FIXTURE_OPERATION_FAILED");
      expect(failure.progress).toMatchObject({ failedStep });
      expect(failure.residualManifest).toMatchObject({
        kind: "issue-0033-d2-synthetic-fixture-residual",
        permittedNextAction: "READ_ONLY_VERIFY",
        runMarker: RUN_MARKER
      });
      const collection = ({
          createConversation: "conversations",
          sendMessage: "messages",
          createContactRequest: "contact_exchange_requests",
          approveContactRequest: "contact_exchange_requests"
        } as Partial<Record<typeof method,
          "conversations" | "messages" | "contact_exchange_requests">>)[method];
      if (collection) {
        const residual = failure.residualManifest as D2SyntheticFixtureResidualManifest;
        expect(residual.capturedTargets[collection]?.id).toMatch(
          new RegExp(`^${collection === "contact_exchange_requests" ? "contact-exchange" :
            collection === "conversations" ? "conversation" : "message"}-[0-9a-f]{64}$`)
        );
      }
      expect(failure.residualManifest).not.toHaveProperty("resumeToken");
    }
  );

  it.each([
    ["deleted-gates", "sendMessage", 2],
    ["restored-gates", "hasAuthorizedProfiles", 3],
    ["final-verification", "readMessage", 2]
  ] as const)(
    "fails closed in the %s verification step without advancing",
    async (failedStep, method, failureCall) => {
      const { adapter } = createFakeSyntheticFixtureAdapter();
      const operation = adapter[method] as Mock;
      const original = operation.getMockImplementation();
      let calls = 0;
      operation.mockImplementation(async (...args: unknown[]) => {
        calls += 1;
        if (calls !== failureCall) return original?.(...args);
        if (method === "sendMessage") {
          return { ok: true, status: 200, value: { id: "forbidden-message" }, errors: {} };
        }
        if (method === "hasAuthorizedProfiles") return false;
        const result = await original?.(...args) as { data?: Record<string, unknown> };
        return { data: { ...result.data, senderUserId: "unexpected-participant" } };
      });
      const failure = await captureSyntheticFailure(syntheticFixtureRunInput(adapter));
      expect(failure.progress).toMatchObject({ failedStep });
      expect(failure.residualManifest).toMatchObject({
        permittedNextAction: "READ_ONLY_VERIFY"
      });
    }
  );

  it("rejects an audit-chain mismatch and never emits contact or source text", async () => {
    const { adapter } = createFakeSyntheticFixtureAdapter();
    const originalReadAudit = adapter.readAudit.getMockImplementation();
    adapter.readAudit.mockImplementation(async (sourceId: string, version: number) => {
      const result = await originalReadAudit!(sourceId, version);
      if (version !== 3) return result;
      return { data: { ...(result as { data: object }).data, action: "update" } };
    });
    const failure = await captureSyntheticFailure(syntheticFixtureRunInput(adapter));
    expect(failure.code).toBe("D2C_AUDIT_CONTRACT_MISMATCH");
    expect(failure.progress).toMatchObject({ failedStep: "source-delete-v3" });

    for (const call of [
      ...adapter.createSource.mock.calls,
      ...adapter.updateSource.mock.calls,
      ...adapter.sendMessage.mock.calls
    ]) {
      const serialized = JSON.stringify(call);
      expect(serialized).toContain(RUN_MARKER);
      expect(serialized).not.toMatch(/@|(?:微信|wechat|weixin|QQ)|1[3-9]\d{9}/i);
    }
  });

  it("requires the exact existing pre-fixture claim and rejects missing, linked, or wrong content", async () => {
    const claimPath = join(MANIFEST_ROOT, `${RUN_MARKER}.pre-fixture-probe.claim`);
    const io = {
      lstat: vi.fn(async (path: string) => {
        if (path === MANIFEST_ROOT) {
          return { isDirectory: () => true, isFile: () => false, isSymbolicLink: () => false };
        }
        if (path === claimPath) {
          return { isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false };
        }
        throw Object.assign(new Error("missing"), { code: "ENOENT" });
      }),
      realpath: vi.fn(async (path: string) => path),
      readFile: vi.fn(async () => "pre-fixture-probe-claimed\n")
    };
    await expect(verifyPreFixtureProbeClaim(RUN_MARKER, { io })).resolves.toBe(claimPath);
    io.readFile.mockResolvedValueOnce("wrong\n");
    await expect(verifyPreFixtureProbeClaim(RUN_MARKER, { io })).rejects.toThrow(
      "D2C_SYNTHETIC_FIXTURE_CLAIM_CONTENT_INVALID"
    );
    io.lstat.mockImplementationOnce(async () => ({
      isDirectory: () => true,
      isFile: () => false,
      isSymbolicLink: () => false
    })).mockImplementationOnce(async () => ({
      isDirectory: () => false,
      isFile: () => true,
      isSymbolicLink: () => true
    }));
    await expect(verifyPreFixtureProbeClaim(RUN_MARKER, { io })).rejects.toThrow(
      "D2C_SYNTHETIC_FIXTURE_CLAIM_UNSAFE"
    );
  });

  it("loads only the audited ISSUE-0033 domain mutation seam without raw writes", async () => {
    const moduleUrl = pathToFileURL(join(
      process.cwd(), "scripts", "issue-0033-d2-cleanup.mjs"
    )).href;
    const child: ChildProcess = spawn(process.execPath, [
      "--input-type=module",
      "--eval",
      `const { loadD2SyntheticFixtureDomain } = await import(${JSON.stringify(moduleUrl)});` +
        "const domain = await loadD2SyntheticFixtureDomain();" +
        "const forbidden=[];" +
        "for (const specifier of ['node:child_process','node:net','https://example.invalid','data:text/javascript,export default 1'," +
          `${JSON.stringify(pathToFileURL(join(tmpdir(), "outside-domain.mjs")).href)}]) {` +
        "try { await import(specifier); forbidden.push(false); } catch { forbidden.push(true); }}" +
        "process.stdout.write(JSON.stringify({keys:Object.keys(domain).sort(),forbidden}));"
    ], { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", (chunk) => { stdout += chunk; });
    child.stderr?.on("data", (chunk) => { stderr += chunk; });
    const exitCode = await new Promise<number | null>((resolveExit, rejectExit) => {
      child.once("error", rejectExit);
      child.once("exit", resolveExit);
    });
    expect(stderr).toBe("");
    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout)).toEqual({
      forbidden: [true, true, true, true, true],
      keys: [
        "approveServerContactExchangeRequest",
        "createOrReadServerConversationFromSource",
        "createServerContactExchangeRequest",
        "deleteServerParentNeed",
        "readServerAuthorizedContactProfiles",
        "restoreServerParentNeed",
        "saveServerParentNeed",
        "sendServerConversationMessage",
        "updateServerParentNeed"
      ]
    });
  });

  it("wires the synthetic adapter only through fixed domain operations and transactions", async () => {
    const collection = vi.fn((name: string) => ({ name }));
    const database = {
      collection,
      runTransaction: vi.fn(async (operation: (transaction: { collection: typeof collection }) => unknown) =>
        operation({ collection }))
    };
    const ok = (value: object) => ({ ok: true, value, errors: {} });
    const saveServerParentNeed = vi.fn(async (input: Record<string, unknown>) => {
      const result = await (input.runTransaction as (operation: (value: object) => object) => object)(
        (value) => value
      );
      expect(Object.keys(result).sort()).toEqual([
        "auditCollection",
        "contactExchangeRequestsCollection",
        "conversationsCollection",
        "sourceCollection"
      ]);
      return ok({ id: "parent-need-fixed" });
    });
    const domain = {
      approveServerContactExchangeRequest: vi.fn(async () => ok({ id: "request-fixed" })),
      createOrReadServerConversationFromSource: vi.fn(async () => ok({ id: "conversation-fixed" })),
      createServerContactExchangeRequest: vi.fn(async () => ok({ id: "request-fixed" })),
      deleteServerParentNeed: vi.fn(async () => ok({ id: "parent-need-fixed" })),
      readServerAuthorizedContactProfiles: vi.fn(async () => ({
        ok: true, value: { currentUser: {}, otherUser: {} }, errors: {}
      })),
      restoreServerParentNeed: vi.fn(async () => ok({ id: "parent-need-fixed" })),
      saveServerParentNeed,
      sendServerConversationMessage: vi.fn(async () => ({
        ok: false, value: null, errors: { request: "deleted" }
      })),
      updateServerParentNeed: vi.fn(async () => ok({ id: "parent-need-fixed" }))
    };
    const adapter = await createD2SyntheticFixtureTestAdapter(database, {
      envId: PROD_CLOUDBASE_ENV_ID,
      ownerId: "email_42322f7b8901e4fb8174c6c1",
      participantId: "email_88cc6554aa448d72dc948fec",
      runMarker: RUN_MARKER
    }, domain);
    await adapter.createSource({ input: { childIntro: RUN_MARKER }, now: NOW });
    expect(saveServerParentNeed).toHaveBeenCalledWith(expect.objectContaining({
      authenticatedUserId: "email_42322f7b8901e4fb8174c6c1",
      collection: { name: "parent_needs" },
      now: NOW,
      runTransaction: expect.any(Function)
    }));
    await expect(adapter.sendMessage({
      conversationId: "conversation-fixed",
      now: NOW,
      text: `${RUN_MARKER} 合成站内消息`
    })).resolves.toMatchObject({ ok: false, status: 403 });
    expect(database.runTransaction).toHaveBeenCalledTimes(1);
  });

  it("keeps production domain loading fixed and rejects raw writer injection", async () => {
    expect(createCloudBaseSyntheticFixtureAdapter).toHaveLength(2);
    const database = {
      collection: vi.fn(() => ({})),
      runTransaction: vi.fn()
    };
    const rawWriter = vi.fn();
    await expect(createD2SyntheticFixtureTestAdapter(database, {
      envId: PROD_CLOUDBASE_ENV_ID,
      ownerId: "owner",
      participantId: "participant",
      runMarker: RUN_MARKER
    }, {
      approveServerContactExchangeRequest: vi.fn(),
      createOrReadServerConversationFromSource: vi.fn(),
      createServerContactExchangeRequest: vi.fn(),
      deleteServerParentNeed: vi.fn(),
      readServerAuthorizedContactProfiles: vi.fn(),
      restoreServerParentNeed: vi.fn(),
      saveServerParentNeed: vi.fn(),
      sendServerConversationMessage: vi.fn(),
      updateServerParentNeed: vi.fn(),
      rawCollectionWriter: rawWriter
    } as never)).rejects.toThrow("D2C_SYNTHETIC_FIXTURE_DOMAIN_INVALID");
    expect(rawWriter).not.toHaveBeenCalled();
  });

  it("recovers exact non-source ids after commit-then-throw without retrying mutations", async () => {
    const calls: Record<string, Array<Record<string, unknown>>> = {
      conversation: [], message: [], request: [], approve: []
    };
    const rows: Record<string, Array<Record<string, unknown>>> = {
      audit_events: [], contact_exchange_requests: [], contact_profiles: [], conversations: [],
      messages: [], parent_needs: [], tutor_profiles: []
    };
    const put = (collection: string, id: string, value: Record<string, unknown>) => {
      const document = { ...value, id, _id: id };
      const index = rows[collection].findIndex((candidate) => (candidate.id ?? candidate._id) === id);
      if (index >= 0) rows[collection][index] = document;
      else rows[collection].push(document);
    };
    const commitThenThrow = (
      name: keyof typeof calls,
      commit: (input: Record<string, unknown>) => void
    ) =>
      vi.fn(async (input: Record<string, unknown>) => {
        calls[name].push(input);
        commit(input);
        throw new Error("commit then transport failure");
      });
    const expectedConversationId = `conversation-${sha256(`synthetic-fixture-lifecycle:${RUN_MARKER}:conversation`)}`;
    const messageId = `message-${sha256(`synthetic-fixture-lifecycle:${RUN_MARKER}:message`)}`;
    const requestId = `contact-exchange-${sha256(`synthetic-fixture-lifecycle:${RUN_MARKER}:contact-exchange`)}`;
    const approvalIdempotencyKey = sha256(`approve:${RUN_MARKER}`);
    const domain = {
      approveServerContactExchangeRequest: commitThenThrow("approve", (input) =>
        put("contact_exchange_requests", String(input.requestId), {
          ...rows.contact_exchange_requests[0], status: "approved",
          approvalIdempotencyKey: input.approvalIdempotencyKey
        })),
      createOrReadServerConversationFromSource: commitThenThrow("conversation", (input) =>
        put("conversations", String(input.preallocatedId), {
          participantUserIds: ["owner", "participant"], sourceId: input.sourceId,
          sourceType: input.sourceType
        })),
      createServerContactExchangeRequest: commitThenThrow("request", (input) =>
        put("contact_exchange_requests", String(input.preallocatedId), {
          conversationId: input.conversationId, requesterUserId: "participant",
          receiverUserId: "owner", status: "pending"
        })),
      deleteServerParentNeed: vi.fn(),
      readServerAuthorizedContactProfiles: vi.fn(),
      restoreServerParentNeed: vi.fn(),
      saveServerParentNeed: vi.fn(),
      sendServerConversationMessage: commitThenThrow("message", (input) =>
        put("messages", String(input.preallocatedId), {
          conversationId: input.conversationId, senderUserId: "participant", text: input.text
        })),
      updateServerParentNeed: vi.fn()
    };
    const adapter = await createD2SyntheticFixtureTestAdapter(createUniverseDatabase(rows), {
      envId: PROD_CLOUDBASE_ENV_ID,
      ownerId: "owner",
      participantId: "participant",
      runMarker: RUN_MARKER
    }, domain);
    const conversation = await adapter.createConversation({
      now: NOW, sourceId: "source", sourceType: "parent-need"
    });
    const conversationId = String(conversation.value?.id);
    const message = await adapter.sendMessage({ conversationId, now: NOW, text: RUN_MARKER });
    const request = await adapter.createContactRequest({ conversationId, now: NOW });
    await adapter.approveContactRequest({ now: NOW, requestId: String(request.value?.id),
      secondConfirmation: true });
    expect(conversation.value?.id).toBe(expectedConversationId);
    expect(message.value?.id).toBe(messageId);
    expect(request.value?.id).toBe(requestId);
    expect(rows.contact_exchange_requests[0].approvalIdempotencyKey).toBe(approvalIdempotencyKey);
    for (const name of ["conversation", "message", "request", "approve"] as const) {
      expect(calls[name]).toHaveLength(1);
    }
    expect(calls.conversation[0].preallocatedId).toBe(expectedConversationId);
    expect(calls.message[0].preallocatedId).toBe(messageId);
    expect(calls.request[0].preallocatedId).toBe(requestId);
    expect(calls.approve[0].approvalIdempotencyKey).toBe(approvalIdempotencyKey);
  });

  it("runs the full lifecycle through the fixed CloudBase adapter with mocked database and domain", async () => {
    const ownerId = "email_42322f7b8901e4fb8174c6c1";
    const participantId = "email_88cc6554aa448d72dc948fec";
    const rows = removeManagedTarget(createIndependentUniverseRows());
    rows.contact_profiles = [
      { id: ownerId, _id: ownerId, ownerUserId: ownerId, updatedAt: "2026-08-05T13:00:00.000Z" },
      { id: participantId, _id: participantId, ownerUserId: participantId,
        updatedAt: "2026-08-05T13:00:00.000Z" }
    ];
    const database = createUniverseDatabase(rows);
    const find = (collection: string, id: string) =>
      (rows[collection] ?? []).find((row) => (row.id ?? row._id) === id);
    const put = (collection: string, id: string, value: Record<string, unknown>) => {
      const target = rows[collection] ?? (rows[collection] = []);
      const index = target.findIndex((row) => (row.id ?? row._id) === id);
      const stored = { ...value, id, _id: id };
      if (index >= 0) target[index] = stored;
      else target.push(stored);
      return stored;
    };
    const sourceId = "parent-need-adapter-full-lifecycle";
    const ok = (value: Record<string, unknown>) => ({ ok: true, value, errors: {} });
    const blocked = () => ({ ok: false, value: null, errors: { request: "deleted" } });
    const writeAudit = (version: number, action: string, status: string, now: string) =>
      put("audit_events", deriveAuditId(sourceId, version), {
        action,
        actorUserId: ownerId,
        occurredAt: now,
        requestId: `adapter-lifecycle-${version}`,
        result: "success",
        targetId: sourceId,
        targetType: "parent-need",
        from: version === 1 ? null : {
          status: version === 4 ? "deleted" : "published",
          version: version - 1
        },
        to: { status, version }
      });
    const sync = (status: string, version: number) => {
      for (const collection of ["conversations", "contact_exchange_requests"]) {
        for (const row of rows[collection] ?? []) {
          if (row.sourceId === sourceId || find("conversations", String(row.conversationId))?.sourceId === sourceId) {
            row.sourceStatus = status;
            row.sourceVersion = version;
          }
        }
      }
    };
    const mutateSource = (input: Record<string, unknown>, version: number, status: string,
      action: string, now: string) => {
      const current = find("parent_needs", sourceId) ?? {};
      const source = put("parent_needs", sourceId, {
        ...current,
        ...input,
        ownerUserId: ownerId,
        status,
        version,
        managementState: "managed",
        updatedAt: now,
        ...(status === "deleted" ? { deletedAt: now } : { deletedAt: null })
      });
      sync(status, version);
      writeAudit(version, action, status, now);
      return ok(source);
    };
    type TransactionRunner = <T>(operation: () => T | Promise<T>) => Promise<T>;
    type SourceMutationInput = {
      expectedVersion?: number;
      input: Record<string, unknown>;
      now: string;
      runTransaction: TransactionRunner;
    };
    type ConversationInput = { now: string; preallocatedId: string };
    type MessageInput = {
      conversationId: string;
      now: string;
      preallocatedId: string;
      text: string;
    };
    type RequestInput = { conversationId: string; now: string; preallocatedId: string };
    type ApprovalInput = { now: string; requestId: string };
    const domain = {
      saveServerParentNeed: vi.fn(async ({ input, now, runTransaction }: SourceMutationInput) =>
        runTransaction(async () => mutateSource(input, 1, "published", "create", now))),
      updateServerParentNeed: vi.fn(async ({ input, expectedVersion, now,
        runTransaction }: SourceMutationInput) => runTransaction(async () =>
        mutateSource(input, Number(expectedVersion) + 1, "published", "update", now))),
      deleteServerParentNeed: vi.fn(async ({ now, runTransaction }: SourceMutationInput) =>
        runTransaction(async () => mutateSource({}, 3, "deleted", "delete", now))),
      restoreServerParentNeed: vi.fn(async ({ now, runTransaction }: SourceMutationInput) =>
        runTransaction(async () => mutateSource({}, 4, "published", "restore", now))),
      createOrReadServerConversationFromSource: vi.fn(async ({ now, preallocatedId }: ConversationInput) =>
        ok(put("conversations", preallocatedId, {
          sourceId, sourceType: "parent-need", sourceStatus: "published", sourceVersion: 2,
          participantUserIds: [ownerId, participantId], createdAt: now
        }))),
      sendServerConversationMessage: vi.fn(async ({ conversationId, now, preallocatedId,
        text }: MessageInput) => {
        if (find("parent_needs", sourceId)?.status !== "published") return blocked();
        const existing = find("messages", preallocatedId);
        return ok(existing ?? put("messages", preallocatedId, {
          conversationId, senderUserId: participantId, text, createdAt: now
        }));
      }),
      createServerContactExchangeRequest: vi.fn(async ({ conversationId, now,
        preallocatedId }: RequestInput) => {
        if (find("parent_needs", sourceId)?.status !== "published") return blocked();
        const existing = find("contact_exchange_requests", preallocatedId);
        return ok(existing ?? put("contact_exchange_requests", preallocatedId, {
          conversationId, requesterUserId: participantId, receiverUserId: ownerId,
          status: "pending", sourceStatus: "published", sourceVersion: 2,
          secondConfirmedAt: null, createdAt: now, updatedAt: now
        }));
      }),
      approveServerContactExchangeRequest: vi.fn(async ({ now, requestId }: ApprovalInput) => {
        const current = find("contact_exchange_requests", requestId) ?? {};
        return ok(put("contact_exchange_requests", requestId, {
          ...current, status: "approved", secondConfirmedAt: now, updatedAt: now
        }));
      }),
      readServerAuthorizedContactProfiles: vi.fn(async () =>
        find("parent_needs", sourceId)?.status === "published" &&
        (rows.contact_exchange_requests ?? []).some((request) => request.status === "approved")
          ? ok({ currentUser: {}, otherUser: {} })
          : blocked())
    };
    const adapter = await createD2SyntheticFixtureTestAdapter(database, {
      envId: PROD_CLOUDBASE_ENV_ID,
      ownerId,
      participantId,
      runMarker: RUN_MARKER
    }, domain);
    const result = await runD2SyntheticFixtureLifecycleForTest(syntheticFixtureRunInput(adapter));
    expect(result).toMatchObject({
      phase: "synthetic-fixture-complete",
      lifecycle: { status: "published", version: 5 },
      gates: { deletedMessageStatus: 403, deletedContactStatus: 403,
        restoredAuthorizedProfilesVisible: true }
    });
    expect(database.runTransaction).toHaveBeenCalledTimes(5);
    expect(rows.audit_events.filter((row) => String(row.id).includes(sourceId))).toHaveLength(5);
  });

  it("binds lifecycle authorization and checks legacy/profile snapshots before the first write", async () => {
    const { adapter } = createFakeSyntheticFixtureAdapter();
    const trimmedPlan = createD2SyntheticFixtureMachinePlan({
      envId: ` ${PROD_CLOUDBASE_ENV_ID} `,
      ownerId: " owner ",
      participantId: " participant ",
      runMarker: ` ${RUN_MARKER} `
    });
    expect(trimmedPlan.participants).toEqual({ ownerId: "owner", participantId: "participant" });
    expect(trimmedPlan.authorizationRequirements).toMatchObject({
      legacyBaseline: "DOUBLE_SNAPSHOT_EXACT_SET_MATCH",
      contactProfiles: "DOUBLE_SNAPSHOT_EXTERNAL_APPROVAL_EXACT_MATCH"
    });

    const profileDrift = syntheticFixtureRunInput(adapter);
    adapter.readProfileProjection.mockResolvedValueOnce({ data: {
      id: "unexpected", ownerUserId: "unexpected", updatedAt: NOW
    } });
    const failure = await captureSyntheticFailure(profileDrift);
    expect(failure.code).toMatch(/D2C_(PREPARE_PROFILE_MISMATCH|SYNTHETIC_FIXTURE_PROFILE_APPROVAL_DRIFT)/);
    expect(adapter.createSource).not.toHaveBeenCalled();

    const { adapter: secondAdapter } = createFakeSyntheticFixtureAdapter();
    const identityReplay = syntheticFixtureRunInput(secondAdapter);
    identityReplay.authorizationLease.authorization.participants.ownerId = "other-owner";
    const identityFailure = await captureSyntheticFailure(identityReplay);
    expect(identityFailure.code).toBe("D2C_SYNTHETIC_FIXTURE_AUTHORIZATION_BINDING_MISMATCH");
    expect(secondAdapter.readPreflightSnapshot).not.toHaveBeenCalled();
  });

  it("derives an external-profile-bound authorization and consumes its lock only once", async () => {
    const prepared = await runD2Prepare(
      createPrepareRuntime(removeManagedTarget(createIndependentUniverseRows())).input
    );
    const approval = createApprovalArtifact();
    const plan = createD2SyntheticFixtureMachinePlan({
      envId: prepared.envId,
      ownerId: prepared.participants.ownerId,
      participantId: prepared.participants.participantId,
      runMarker: prepared.runMarker
    });
    const driftedApproval = createApprovalArtifact(createManifest(), {
      profiles: createApprovalEnvelope().profiles.map((profile) =>
        profile.role === "owner" ? { ...profile, updatedAt: "2026-08-05T12:00:09.000Z" } : profile)
    });
    expect(() => createD2SyntheticFixtureAuthorizationForTest({
      approvalArtifactBytes: driftedApproval.bytes,
      expectedApprovalSha256: driftedApproval.sha256,
      expectedFixturePlanSha256: sha256(JSON.stringify(plan)),
      issuedAt: NOW,
      nonce: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      prepareOutput: prepared
    })).toThrow("D2C_SYNTHETIC_FIXTURE_PROFILE_APPROVAL_DRIFT");
    const authorization = createD2SyntheticFixtureAuthorizationForTest({
      approvalArtifactBytes: approval.bytes,
      expectedApprovalSha256: approval.sha256,
      expectedFixturePlanSha256: sha256(JSON.stringify(plan)),
      issuedAt: NOW,
      nonce: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      prepareOutput: prepared
    });
    const authorizationPath = join(
      MANIFEST_ROOT,
      `${RUN_MARKER}.synthetic-fixture.authorization.json`
    );
    const claimPath = join(MANIFEST_ROOT, `${RUN_MARKER}.pre-fixture-probe.claim`);
    const lockPath = join(MANIFEST_ROOT, `${RUN_MARKER}.synthetic-fixture.lifecycle.lock`);
    await Promise.all([authorizationPath, claimPath, lockPath].map((path) =>
      unlink(path).catch(() => undefined)));
    try {
      await claimPreFixtureProbeExecution(RUN_MARKER);
      await writeD2SyntheticFixtureAuthorizationForTest(authorization);
      const bytes = await readFile(authorizationPath);
      const expectedAuthorizationSha256 = sha256(bytes);
      const input = {
        authorizationPath,
        envId: prepared.envId,
        expectedAuthorizationSha256,
        expectedFixturePlanSha256: sha256(JSON.stringify(plan)),
        now: () => new Date(NOW),
        ownerId: prepared.participants.ownerId,
        participantId: prepared.participants.participantId,
        runMarker: prepared.runMarker
      };
      const lease = await consumeD2SyntheticFixtureAuthorizationForTest(input);
      expect(lease.authorization.profileProjections).toEqual(prepared.profileApprovalProjection);
      await expect(consumeD2SyntheticFixtureAuthorizationForTest(input)).rejects.toThrow(
        "D2C_SYNTHETIC_FIXTURE_ALREADY_CLAIMED"
      );
      await lease.finalize({ phase: "failed", failure: { code: "TEST" } });
      expect(await readFile(lockPath, "utf8")).toContain('"phase":"failed"');
    } finally {
      await Promise.all([authorizationPath, claimPath, lockPath].map((path) =>
        unlink(path).catch(() => undefined)));
    }
  });

  it.each([
    {
      name: "non-canonical ISO",
      authorizationIssuedAt: "2026-08-06T00:00:00.000Z",
      storedIssuedAt: "2026-08-06T00:00:00Z",
      markerIndex: 1,
      expectedCode: "D2C_SYNTHETIC_FIXTURE_AUTHORIZATION_TIME_INVALID"
    },
    {
      name: "more than five minutes in the future",
      authorizationIssuedAt: "2026-08-06T00:05:00.001Z",
      storedIssuedAt: "2026-08-06T00:05:00.001Z",
      markerIndex: 2,
      expectedCode: "D2C_SYNTHETIC_FIXTURE_AUTHORIZATION_TIME_FUTURE"
    },
    {
      name: "older than twenty-four hours",
      authorizationIssuedAt: "2026-08-04T23:59:59.999Z",
      storedIssuedAt: "2026-08-04T23:59:59.999Z",
      markerIndex: 3,
      expectedCode: "D2C_SYNTHETIC_FIXTURE_AUTHORIZATION_EXPIRED"
    }
  ])("rejects $name before creating the lifecycle lock", async ({
    authorizationIssuedAt,
    expectedCode,
    markerIndex,
    storedIssuedAt
  }) => {
    const fixture = await createAuthorizationFreshnessFixture({
      authorizationIssuedAt,
      consumedAt: "2026-08-06T00:00:00.000Z",
      markerIndex,
      storedIssuedAt
    });
    try {
      await expect(consumeD2SyntheticFixtureAuthorizationForTest(fixture.input)).rejects.toThrow(
        expectedCode
      );
      await expect(readFile(fixture.lockPath)).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await fixture.cleanup();
    }
  });

  it.each([
    ["exactly five minutes in the future", "2026-08-06T00:05:00.000Z", 4],
    ["exactly twenty-four hours old", "2026-08-05T00:00:00.000Z", 5]
  ])("accepts authorization issued %s at the inclusive freshness boundary", async (
    _name,
    authorizationIssuedAt,
    markerIndex
  ) => {
    const fixture = await createAuthorizationFreshnessFixture({
      authorizationIssuedAt,
      consumedAt: "2026-08-06T00:00:00.000Z",
      markerIndex
    });
    try {
      const lease = await consumeD2SyntheticFixtureAuthorizationForTest(fixture.input);
      expect(lease.authorization.issuedAt).toBe(authorizationIssuedAt);
      await lease.finalize({ phase: "failed", failure: { code: "BOUNDARY_TEST" } });
    } finally {
      await fixture.cleanup();
    }
  });

  it("emits the machine plan locally before any credential or CloudBase initialization", async () => {
    const scriptPath = join(process.cwd(), "scripts", "issue-0033-d2-cleanup.mjs");
    const planPath = join(MANIFEST_ROOT, `${RUN_MARKER}.synthetic-fixture.plan.json`);
    await unlink(planPath).catch(() => undefined);
    try {
      const child = spawn(process.execPath, [
        scriptPath,
        "--mode", "synthetic-fixture-plan",
        "--env-id", PROD_CLOUDBASE_ENV_ID,
        "--run-marker", RUN_MARKER,
        "--owner-id", "email_42322f7b8901e4fb8174c6c1",
        "--participant-id", "email_88cc6554aa448d72dc948fec"
      ], {
        cwd: process.cwd(),
        env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, NODE_ENV: "test" },
        stdio: ["ignore", "pipe", "pipe"]
      });
      let stdout = "";
      let stderr = "";
      child.stdout?.setEncoding("utf8");
      child.stderr?.setEncoding("utf8");
      child.stdout?.on("data", (chunk: string) => { stdout += chunk; });
      child.stderr?.on("data", (chunk: string) => { stderr += chunk; });
      const exitCode = await new Promise<number | null>((resolveExit, rejectExit) => {
        child.once("error", rejectExit);
        child.once("exit", resolveExit);
      });
      expect(exitCode).toBe(0);
      expect(stderr).toBe("");
      expect(stdout).not.toContain("email_42322f7b8901e4fb8174c6c1");
      expect(stdout).not.toContain("email_88cc6554aa448d72dc948fec");
      const output = JSON.parse(stdout);
      expect(output).toMatchObject({
        ok: true,
        mode: "synthetic-fixture-plan",
        outputPath: planPath,
        ownerLabel: expect.stringMatching(/^[0-9a-f]{12}$/),
        participantLabel: expect.stringMatching(/^[0-9a-f]{12}$/)
      });
      const plan = JSON.parse(await readFile(planPath, "utf8"));
      expect(plan).toMatchObject({
        expectedWrites: { documentSetCalls: 20, auditDocumentsRetained: 5 }
      });
      expect(output.planSha256).toBe(sha256(JSON.stringify(plan)));
    } finally {
      await unlink(planPath).catch(() => undefined);
    }
  });
});
