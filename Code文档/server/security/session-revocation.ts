export type SessionRevocationStore = {
  readRevokedAt: (userId: string) => Promise<string | undefined>;
  revoke: (userId: string, at: string) => Promise<string>;
};

export type AuthSessionRevocationGuard = {
  check: (input: SessionLifecycleInput) => Promise<SessionLifecycleResult>;
  revoke: (userId: string, at?: Date) => Promise<string | void>;
};

export type SessionLifecycleInput = {
  createdAt: string;
  keyVersion?: string;
  now?: Date;
  userId: string;
};

export type SessionLifecycleResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "created-at-invalid"
        | "key-version-missing"
        | "key-version-stale"
        | "revoked";
    };

export function createSessionRevocationGuard({
  activeKeyVersion,
  store
}: {
  activeKeyVersion: string;
  store: SessionRevocationStore;
}) {
  const expectedKeyVersion = activeKeyVersion.trim();

  return {
    async check(input: SessionLifecycleInput): Promise<SessionLifecycleResult> {
      const createdAtMs = new Date(input.createdAt).getTime();
      const nowMs = (input.now ?? new Date()).getTime();

      if (!Number.isFinite(createdAtMs) || createdAtMs > nowMs) {
        return { ok: false, reason: "created-at-invalid" };
      }

      if (!input.keyVersion?.trim()) {
        return { ok: false, reason: "key-version-missing" };
      }

      if (!expectedKeyVersion || input.keyVersion.trim() !== expectedKeyVersion) {
        return { ok: false, reason: "key-version-stale" };
      }

      const revokedAt = await store.readRevokedAt(input.userId.trim());
      if (revokedAt && createdAtMs <= new Date(revokedAt).getTime()) {
        return { ok: false, reason: "revoked" };
      }

      return { ok: true };
    },

    async revoke(userId: string, at = new Date()) {
      return store.revoke(userId.trim(), at.toISOString());
    }
  };
}

export function createCloudBaseSessionRevocationStore(collection: {
  doc: (id: string) => {
    get: () => Promise<{ data?: unknown[] | Record<string, unknown> }>;
    set: (value: Record<string, unknown>) => Promise<unknown>;
  };
}) : SessionRevocationStore {
  return {
    async readRevokedAt(userId) {
      const response = await collection.doc(userId.trim()).get();
      const value = Array.isArray(response.data) ? response.data[0] : response.data;
      if (!value || typeof value !== "object") return undefined;
      const revokedAt = (value as Record<string, unknown>).revokedAt;
      return typeof revokedAt === "string" ? revokedAt : undefined;
    },
    async revoke(userId, at) {
      const revokedAt = at.trim();
      await collection.doc(userId.trim()).set({
        updatedAt: new Date().toISOString(),
        userId: userId.trim(),
        revokedAt
      });
      return revokedAt;
    }
  };
}

export function createMemorySessionRevocationStore(): SessionRevocationStore & {
  values: Map<string, string>;
} {
  const values = new Map<string, string>();
  return {
    values,
    async readRevokedAt(userId) {
      return values.get(userId);
    },
    async revoke(userId, at) {
      values.set(userId, at);
      return at;
    }
  };
}
