export type AtomicEmailCodeDocument = {
  attempts?: number;
  expiresAt?: string;
  usedAt?: string;
};

export type AtomicEmailCodeCollection = {
  doc: (id: string) => {
    get: () => Promise<{ data?: unknown[] | Record<string, unknown> }>;
    set?: (value: Record<string, unknown>) => Promise<unknown>;
    update?: (value: Record<string, unknown>) => Promise<unknown>;
  };
};

export type AtomicEmailCodeTransactionRunner = <T>(
  operation: (collection: AtomicEmailCodeCollection) => Promise<T>
) => Promise<T>;

const locks = new Map<string, Promise<void>>();

function readFirstDocument(result: { data?: unknown[] | Record<string, unknown> }) {
  if (Array.isArray(result.data)) return result.data[0] as AtomicEmailCodeDocument | undefined;
  return result.data as AtomicEmailCodeDocument | undefined;
}

async function withLocalLock<T>(key: string, operation: () => Promise<T>) {
  const previous = locks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const queued = previous.then(() => current);
  locks.set(key, queued);
  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (locks.get(key) === queued) locks.delete(key);
  }
}

async function consumeFromCollection({
  collection,
  docId,
  now
}: {
  collection: AtomicEmailCodeCollection;
  docId: string;
  now: Date;
}) {
  const documentRef = collection.doc(docId);
  const stored = readFirstDocument(await documentRef.get());
  if (!stored || stored.usedAt) return { ok: false as const, reason: "already-used" as const };
  if (stored.expiresAt && new Date(stored.expiresAt).getTime() <= now.getTime()) {
    return { ok: false as const, reason: "expired" as const };
  }

  const patch = { attempts: stored.attempts ?? 0, usedAt: now.toISOString() };
  if (documentRef.update) {
    await documentRef.update(patch);
  } else if (documentRef.set) {
    await documentRef.set({ ...stored, ...patch });
  } else {
    return { ok: false as const, reason: "storage-unavailable" as const };
  }

  return { ok: true as const };
}

export async function consumeEmailCodeOnce({
  collection,
  docId,
  now = new Date(),
  runTransaction
}: {
  collection: AtomicEmailCodeCollection;
  docId: string;
  now?: Date;
  runTransaction?: AtomicEmailCodeTransactionRunner;
}) {
  const key = `email-code:${docId}`;
  return withLocalLock(key, async () => {
    if (runTransaction) {
      try {
        return await runTransaction((transactionCollection) =>
          consumeFromCollection({ collection: transactionCollection, docId, now })
        );
      } catch {
        return { ok: false as const, reason: "transaction-unavailable" as const };
      }
    }

    return consumeFromCollection({ collection, docId, now });
  });
}
