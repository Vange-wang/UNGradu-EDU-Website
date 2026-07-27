import { describe, expect, it } from "vitest";

import {
  createCloudBaseCustomerServiceStores,
  type CustomerServiceCloudBaseDatabase
} from "@/server/customer-service-cloudbase";
import {
  createConfiguredCustomerServiceOrchestrator,
  type CustomerServiceAuditRecord,
  type CustomerServiceConversationState,
  type CustomerServiceIntakeRecord
} from "@/server/customer-service";

function createFakeDatabase() {
  const collections = new Map<string, Map<string, Record<string, unknown>>>();

  function collection(name: string) {
    const documents = collections.get(name) ?? new Map<string, Record<string, unknown>>();
    collections.set(name, documents);

    return {
      doc(id: string) {
        return {
          async get() {
            const data = documents.get(id);
            return { data: data ? [{ ...data, _id: id }] : [] };
          },
          async remove() {
            documents.delete(id);
            return { deleted: 1 };
          },
          async set(data: Record<string, unknown>) {
            documents.set(id, { ...data });
            return { id };
          }
        };
      }
    };
  }

  const database = {
    collection,
    async runTransaction<T>(
      operation: (transaction: { collection: typeof collection }) => Promise<T>
    ) {
      function transactionCollection(name: string) {
        const reference = collection(name);

        return {
          doc(id: string) {
            const document = reference.doc(id);

            return {
              ...document,
              async get() {
                const result = await document.get();
                return { data: result.data[0] ?? null };
              }
            };
          }
        };
      }

      return {
        result: await operation({
          collection: transactionCollection as unknown as typeof collection
        })
      };
    }
  } satisfies CustomerServiceCloudBaseDatabase;

  return { collections, database };
}

function createIntakeRecord(
  overrides: Partial<CustomerServiceIntakeRecord> = {}
): CustomerServiceIntakeRecord {
  return {
    conversationId: "conversation-1",
    createdAt: "2026-07-28T01:00:00.000Z",
    fingerprint: `sha256:${"a".repeat(64)}`,
    intakeRecordId: "customer-service-intake-1",
    intentLabel: "fallback",
    messageId: "message-1",
    normalizationVersion: "kb-intake-norm-v1",
    occurrenceCount: 1,
    sanitizedQuestion: "怎样制定每周数学学习计划？",
    siteSection: "/customer-service",
    source: "kb_miss",
    status: "new",
    updatedAt: "2026-07-28T01:00:00.000Z",
    ...overrides
  };
}

describe("CloudBase customer service persistence", () => {
  it("atomically deduplicates intake records and supports deletion", async () => {
    const { database } = createFakeDatabase();
    const { intakeStore } = createCloudBaseCustomerServiceStores(database);

    const first = await intakeStore.upsert(createIntakeRecord());
    const second = await intakeStore.upsert(
      createIntakeRecord({
        conversationId: "conversation-2",
        intakeRecordId: "customer-service-intake-2",
        messageId: "message-2",
        updatedAt: "2026-07-28T02:00:00.000Z"
      })
    );

    expect(first.intakeRecordId).toBe("customer-service-intake-1");
    expect(second).toMatchObject({
      conversationId: "conversation-2",
      intakeRecordId: "customer-service-intake-1",
      messageId: "message-2",
      occurrenceCount: 2,
      updatedAt: "2026-07-28T02:00:00.000Z"
    });

    expect(await intakeStore.removeByFingerprint?.(first.fingerprint)).toBe(true);
    expect(await intakeStore.readByFingerprint?.(first.fingerprint)).toBeNull();
  });

  it("persists conversation state, audits, and critical events in separate collections", async () => {
    const { collections, database } = createFakeDatabase();
    const { auditStore, criticalEventSink, stateStore } =
      createCloudBaseCustomerServiceStores(database);
    const state: CustomerServiceConversationState = {
      conversationId: "conversation-1",
      handoffLocked: false,
      humanResolved: false,
      lastSafeAction: "allow",
      piiPlaceholderTypes: [],
      priorBlockCount: 0,
      priorRiskCategories: [],
      ruleVersion: "customer-service-guard-v1"
    };

    await stateStore.write(state);
    expect(await stateStore.read(state.conversationId)).toEqual(state);

    const audit = {
      auditRecordId: "audit-1",
      messageId: "message-1"
    } as CustomerServiceAuditRecord;
    await auditStore.append(audit);
    await criticalEventSink.emit({
      code: "FINAL_GUARD_TEMPLATE_REJECTED",
      conversationIdHash: "sha256:redacted",
      messageId: "message-1",
      templateId: "SERVICE_ERROR",
      timestamp: "2026-07-28T01:00:00.000Z"
    });

    expect(collections.get("customer_service_audit_records")?.size).toBe(1);
    expect(collections.get("customer_service_critical_events")?.size).toBe(1);
  });

  it("uses CloudBase persistence automatically in production", async () => {
    const { collections, database } = createFakeDatabase();
    const orchestrator = createConfiguredCustomerServiceOrchestrator({
      cloudBaseDatabase: database,
      env: {
        APP_ENV: "production",
        CUSTOMER_SERVICE_RUNTIME_MODE: "local_mvp",
        NODE_ENV: "test"
      }
    });

    const result = await orchestrator.handleMessage({
      conversationId: "production-conversation",
      messageId: "production-message",
      pageContext: {
        entry: "customer-service-page",
        page: "/customer-service"
      },
      text: "怎样制定每周数学学习计划？"
    });

    expect(result.ok).toBe(true);
    expect(collections.get("customer_service_kb_intake")?.size).toBe(1);
    expect(collections.get("customer_service_conversation_states")?.size).toBe(1);
    expect(collections.get("customer_service_audit_records")?.size).toBe(1);
  });
});
