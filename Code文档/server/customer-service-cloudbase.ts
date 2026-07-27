import { createHash } from "node:crypto";

import type {
  CustomerServiceAuditStore,
  CustomerServiceConversationState,
  CustomerServiceCriticalEventSink,
  CustomerServiceIntakeRecord,
  CustomerServiceIntakeStore,
  CustomerServiceStateStore
} from "@/server/customer-service";

type CloudBaseDocumentResult = {
  data?: Array<Record<string, unknown>>;
};

type CloudBaseDocumentReference = {
  get: () => Promise<CloudBaseDocumentResult>;
  remove: () => Promise<{ deleted?: number }>;
  set: (data: Record<string, unknown>) => Promise<unknown>;
};

type CloudBaseCollectionReference = {
  doc: (id: string) => CloudBaseDocumentReference;
};

type CloudBaseTransaction = {
  collection: (name: string) => CloudBaseCollectionReference;
};

export type CustomerServiceCloudBaseDatabase = {
  collection: (name: string) => CloudBaseCollectionReference;
  runTransaction: <T>(
    operation: (transaction: CloudBaseTransaction) => Promise<T>
  ) => Promise<T | { result: T }>;
};

type CustomerServiceCollectionNames = {
  audits: string;
  criticalEvents: string;
  intake: string;
  states: string;
};

const DEFAULT_COLLECTION_NAMES: CustomerServiceCollectionNames = {
  audits: "customer_service_audit_records",
  criticalEvents: "customer_service_critical_events",
  intake: "customer_service_kb_intake",
  states: "customer_service_conversation_states"
};

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function documentId(prefix: string, value: string) {
  return `${prefix}_${sha256(value)}`;
}

function readDocument<T>(result: CloudBaseDocumentResult) {
  const document = result.data?.[0];

  if (!document) {
    return null;
  }

  const value = { ...document };
  delete value._id;
  return value as T;
}

function unwrapTransactionResult<T>(result: T | { result: T }) {
  if (
    result &&
    typeof result === "object" &&
    "result" in result
  ) {
    return result.result;
  }

  return result as T;
}

export function createCloudBaseCustomerServiceStores(
  database: CustomerServiceCloudBaseDatabase,
  collectionNames: Partial<CustomerServiceCollectionNames> = {}
): {
  auditStore: CustomerServiceAuditStore;
  criticalEventSink: CustomerServiceCriticalEventSink;
  intakeStore: CustomerServiceIntakeStore;
  stateStore: CustomerServiceStateStore;
} {
  const names = {
    ...DEFAULT_COLLECTION_NAMES,
    ...collectionNames
  };

  return {
    auditStore: {
      async append(record) {
        await database
          .collection(names.audits)
          .doc(record.auditRecordId)
          .set(record as unknown as Record<string, unknown>);
        return record;
      }
    },
    criticalEventSink: {
      async emit(event) {
        await database
          .collection(names.criticalEvents)
          .doc(
            documentId(
              "cs_critical",
              `${event.code}|${event.messageId}|${event.templateId}|${event.timestamp}`
            )
          )
          .set(event);
      }
    },
    intakeStore: {
      async readByFingerprint(fingerprint) {
        const result = await database
          .collection(names.intake)
          .doc(documentId("cs_intake", fingerprint))
          .get();
        return readDocument<CustomerServiceIntakeRecord>(result);
      },
      async removeByFingerprint(fingerprint) {
        const result = await database
          .collection(names.intake)
          .doc(documentId("cs_intake", fingerprint))
          .remove();
        return result.deleted !== 0;
      },
      async upsert(record) {
        const transactionResult = await database.runTransaction(
          async (transaction) => {
            const reference = transaction
              .collection(names.intake)
              .doc(documentId("cs_intake", record.fingerprint));
            const existing = readDocument<CustomerServiceIntakeRecord>(
              await reference.get()
            );
            const nextRecord = existing
              ? {
                  ...existing,
                  conversationId: record.conversationId,
                  messageId: record.messageId,
                  occurrenceCount: existing.occurrenceCount + 1,
                  updatedAt: record.updatedAt
                }
              : record;

            await reference.set(nextRecord as unknown as Record<string, unknown>);
            return nextRecord;
          }
        );

        return unwrapTransactionResult(transactionResult);
      }
    },
    stateStore: {
      async read(conversationId) {
        const result = await database
          .collection(names.states)
          .doc(documentId("cs_state", conversationId))
          .get();
        return readDocument<CustomerServiceConversationState>(result);
      },
      async write(state) {
        await database
          .collection(names.states)
          .doc(documentId("cs_state", state.conversationId))
          .set(state as unknown as Record<string, unknown>);
        return state;
      }
    }
  };
}
