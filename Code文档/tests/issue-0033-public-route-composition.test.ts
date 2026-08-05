import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type StoredDocument = Record<string, unknown>;

const cloudBaseState = vi.hoisted(() => ({
  collections: new Map<string, Map<string, StoredDocument>>(),
  transactionAvailable: true,
  transactionCalls: 0
}));

function collectionFor(name: string) {
  let documents = cloudBaseState.collections.get(name);
  if (!documents) {
    documents = new Map<string, StoredDocument>();
    cloudBaseState.collections.set(name, documents);
  }

  return {
    doc(id: string) {
      return {
        async get() {
          const document = documents!.get(id);
          return { data: document ? [{ ...document, id }] : [] };
        },
        async set(document: StoredDocument) {
          documents!.set(id, { ...document });
          return { updated: 1 };
        }
      };
    },
    where(query: StoredDocument) {
      return {
        async get() {
          return {
            data: Array.from(documents!.entries())
              .filter(([, document]) =>
                Object.entries(query).every(([key, value]) => document[key] === value)
              )
              .map(([id, document]) => ({ ...document, id }))
          };
        }
      };
    }
  };
}

vi.mock("@/server/cloudbase-server", () => ({
  createCloudBaseServerApp: () => ({
    database: () => {
      const database = {
        collection: collectionFor
      } as {
        collection: typeof collectionFor;
        runTransaction?: (operation: (transaction: { collection: typeof collectionFor }) => unknown) => unknown;
      };

      if (cloudBaseState.transactionAvailable) {
        database.runTransaction = async (operation) => {
          cloudBaseState.transactionCalls += 1;
          return operation({ collection: collectionFor });
        };
      }

      return database;
    }
  })
}));

const parentPayload = {
  teacherGenderPreference: "不限",
  subjects: ["数学"],
  grade: "初一",
  budgetMin: "80",
  budgetMax: "120",
  timeSlots: ["周六下午"],
  region: { province: "广东省", city: "东莞市", district: "松山湖" },
  community: "合成测试位置-route-composition",
  childIntro: "合成测试需求，仅用于实际 route 导出组合测试。"
};

const tutorPayload = {
  gender: "女",
  school: "合成测试大学",
  major: "数学教育",
  subjects: ["数学"],
  grades: ["初中"],
  timeSlots: ["周六下午"],
  feeRanges: [{ grade: "初中", subject: "数学", min: "90", max: "130" }],
  abilityDescription: "合成教学能力说明，仅用于实际 route 导出组合测试。",
  proofImages: [{ name: "synthetic.webp", type: "image/webp", size: 1024 }]
};

function postRequest(pathname: string, body: unknown, userId: string) {
  return new Request(`http://localhost${pathname}`, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "x-ungradu-test-user-phone": userId
    },
    method: "POST"
  });
}

function authenticatedRequest(
  pathname: string,
  userId: string,
  options: { body?: unknown; idempotencyKey?: string; method?: string } = {}
) {
  return new Request(`http://localhost${pathname}`, {
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    headers: {
      "content-type": "application/json",
      ...(options.idempotencyKey
        ? { "idempotency-key": options.idempotencyKey }
        : {}),
      "x-ungradu-test-user-phone": userId
    },
    method: options.method ?? "GET"
  });
}

function managementProjection(record: StoredDocument) {
  return {
    id: record.id,
    managementState: record.managementState,
    status: record.status,
    updatedAt: record.updatedAt,
    version: record.version
  };
}

function collectionSnapshot() {
  return Array.from(cloudBaseState.collections.entries()).map(([name, documents]) => [
    name,
    Array.from(documents.entries())
  ]);
}

describe("ISSUE-0033 public Next route composition", () => {
  beforeEach(() => {
    cloudBaseState.collections.clear();
    cloudBaseState.transactionAvailable = true;
    cloudBaseState.transactionCalls = 0;
    vi.resetModules();
    vi.stubEnv("APP_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_ALLOW_TEST_LOGIN", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("routes complete valid parent and tutor payloads through the exported transactional POST handlers", async () => {
    const parentRoute = await import("@/app/api/parent-needs/route");
    const tutorRoute = await import("@/app/api/tutor-profiles/route");

    const parentResponse = await parentRoute.POST(
      postRequest("/api/parent-needs", parentPayload, "synthetic-parent-owner")
    );
    const tutorResponse = await tutorRoute.POST(
      postRequest("/api/tutor-profiles", tutorPayload, "synthetic-tutor-owner")
    );

    expect(parentResponse.status).toBe(200);
    expect(tutorResponse.status).toBe(200);
    await expect(parentResponse.json()).resolves.toMatchObject({
      ok: true,
      value: { status: "published", version: 1 }
    });
    await expect(tutorResponse.json()).resolves.toMatchObject({
      ok: true,
      value: { status: "published", version: 1 }
    });
    expect(cloudBaseState.transactionCalls).toBe(2);
    expect(cloudBaseState.collections.get("parent_needs")?.size).toBe(1);
    expect(cloudBaseState.collections.get("tutor_profiles")?.size).toBe(1);
    expect(cloudBaseState.collections.get("audit_events")?.size).toBe(2);
  });

  it("keeps TRANSACTION_UNAVAILABLE as a fail-closed 503 through both exported POST routes", async () => {
    cloudBaseState.transactionAvailable = false;
    vi.resetModules();
    const parentRoute = await import("@/app/api/parent-needs/route");
    const tutorRoute = await import("@/app/api/tutor-profiles/route");

    const parentResponse = await parentRoute.POST(
      postRequest("/api/parent-needs", parentPayload, "synthetic-parent-owner")
    );
    const tutorResponse = await tutorRoute.POST(
      postRequest("/api/tutor-profiles", tutorPayload, "synthetic-tutor-owner")
    );

    expect(parentResponse.status).toBe(503);
    expect(tutorResponse.status).toBe(503);
    await expect(parentResponse.json()).resolves.toMatchObject({
      code: "TRANSACTION_UNAVAILABLE",
      ok: false
    });
    await expect(tutorResponse.json()).resolves.toMatchObject({
      code: "TRANSACTION_UNAVAILABLE",
      ok: false
    });
    expect(cloudBaseState.transactionCalls).toBe(0);
    expect(cloudBaseState.collections.get("parent_needs")?.size ?? 0).toBe(0);
    expect(cloudBaseState.collections.get("tutor_profiles")?.size ?? 0).toBe(0);
    expect(cloudBaseState.collections.get("audit_events")?.size ?? 0).toBe(0);
  });

  it("keeps owner list and dynamic item routes consistent across the full management lifecycle", async () => {
    const parentCollectionRoute = await import("@/app/api/parent-needs/route");
    const tutorCollectionRoute = await import("@/app/api/tutor-profiles/route");
    const parentItemRoute = await import("@/app/api/parent-needs/[id]/route");
    const tutorItemRoute = await import("@/app/api/tutor-profiles/[id]/route");

    const parentOwner = "synthetic-parent-owner";
    const tutorOwner = "synthetic-tutor-owner";
    const parentCreatedResponse = await parentCollectionRoute.POST(
      postRequest("/api/parent-needs", parentPayload, parentOwner)
    );
    const tutorCreatedResponse = await tutorCollectionRoute.POST(
      postRequest("/api/tutor-profiles", tutorPayload, tutorOwner)
    );
    const parentCreated = (await parentCreatedResponse.json()) as {
      value: StoredDocument;
    };
    const tutorCreated = (await tutorCreatedResponse.json()) as {
      value: StoredDocument;
    };
    const parentId = String(parentCreated.value.id);
    const tutorId = String(tutorCreated.value.id);
    const routeContext = (id: string) => ({ params: Promise.resolve({ id }) });

    const parentListResponse = await parentCollectionRoute.GET(
      authenticatedRequest("/api/parent-needs?scope=mine", parentOwner)
    );
    const tutorListResponse = await tutorCollectionRoute.GET(
      authenticatedRequest("/api/tutor-profiles?scope=mine", tutorOwner)
    );
    const parentList = (await parentListResponse.json()) as {
      value: StoredDocument[];
    };
    const tutorList = (await tutorListResponse.json()) as {
      value: StoredDocument[];
    };
    const parentOwnerResponse = await parentItemRoute.GET(
      authenticatedRequest(`/api/parent-needs/${parentId}?scope=mine`, parentOwner),
      routeContext(parentId)
    );
    const tutorOwnerResponse = await tutorItemRoute.GET(
      authenticatedRequest(`/api/tutor-profiles/${tutorId}?scope=mine`, tutorOwner),
      routeContext(tutorId)
    );
    const parentOwnerItem = (await parentOwnerResponse.json()) as {
      value: StoredDocument;
    };
    const tutorOwnerItem = (await tutorOwnerResponse.json()) as {
      value: StoredDocument;
    };

    expect(parentOwnerResponse.status).toBe(200);
    expect(tutorOwnerResponse.status).toBe(200);
    expect(managementProjection(parentOwnerItem.value)).toEqual(
      managementProjection(parentList.value[0])
    );
    expect(managementProjection(tutorOwnerItem.value)).toEqual(
      managementProjection(tutorList.value[0])
    );
    expect(managementProjection(parentOwnerItem.value)).toMatchObject({
      id: parentId,
      managementState: "managed",
      status: "published",
      version: 1
    });
    expect(managementProjection(tutorOwnerItem.value)).toMatchObject({
      id: tutorId,
      managementState: "managed",
      status: "published",
      version: 1
    });

    const parentPublicResponse = await parentItemRoute.GET(
      new Request(`http://localhost/api/parent-needs/${parentId}`),
      routeContext(parentId)
    );
    const tutorPublicResponse = await tutorItemRoute.GET(
      new Request(`http://localhost/api/tutor-profiles/${tutorId}`),
      routeContext(tutorId)
    );
    const parentPublic = (await parentPublicResponse.json()) as {
      ok: boolean;
      value: StoredDocument;
    };
    const tutorPublic = (await tutorPublicResponse.json()) as {
      ok: boolean;
      value: StoredDocument;
    };
    expect(parentPublicResponse.status).toBe(200);
    expect(tutorPublicResponse.status).toBe(200);
    expect(parentPublic.ok).toBe(true);
    expect(tutorPublic.ok).toBe(true);
    expect(parentPublic.value).not.toHaveProperty("managementState");
    expect(parentPublic.value).not.toHaveProperty("ownerUserId");
    expect(parentPublic.value).not.toHaveProperty("version");
    expect(tutorPublic.value).not.toHaveProperty("managementState");
    expect(tutorPublic.value).not.toHaveProperty("ownerUserId");
    expect(tutorPublic.value).not.toHaveProperty("version");

    const parentUnauthenticated = await parentItemRoute.GET(
      new Request(`http://localhost/api/parent-needs/${parentId}?scope=mine`),
      routeContext(parentId)
    );
    const tutorUnauthenticated = await tutorItemRoute.GET(
      new Request(`http://localhost/api/tutor-profiles/${tutorId}?scope=mine`),
      routeContext(tutorId)
    );
    expect(parentUnauthenticated.status).toBe(401);
    expect(tutorUnauthenticated.status).toBe(401);

    expect(typeof parentItemRoute.PATCH).toBe("function");
    expect(typeof parentItemRoute.DELETE).toBe("function");
    expect(typeof parentItemRoute.POST).toBe("function");
    expect(typeof tutorItemRoute.PATCH).toBe("function");
    expect(typeof tutorItemRoute.DELETE).toBe("function");
    expect(typeof tutorItemRoute.POST).toBe("function");

    const parentUpdatedResponse = await parentItemRoute.PATCH(
      authenticatedRequest(`/api/parent-needs/${parentId}`, parentOwner, {
        body: { ...parentPayload, version: 1 },
        method: "PATCH"
      }),
      routeContext(parentId)
    );
    const tutorUpdatedResponse = await tutorItemRoute.PATCH(
      authenticatedRequest(`/api/tutor-profiles/${tutorId}`, tutorOwner, {
        body: { ...tutorPayload, version: 1 },
        method: "PATCH"
      }),
      routeContext(tutorId)
    );
    await expect(parentUpdatedResponse.json()).resolves.toMatchObject({
      ok: true,
      value: { status: "published", version: 2 }
    });
    await expect(tutorUpdatedResponse.json()).resolves.toMatchObject({
      ok: true,
      value: { status: "published", version: 2 }
    });

    const parentDeletedResponse = await parentItemRoute.DELETE(
      authenticatedRequest(`/api/parent-needs/${parentId}`, parentOwner, {
        body: { version: 2 },
        idempotencyKey: "route-parent-delete-v2",
        method: "DELETE"
      }),
      routeContext(parentId)
    );
    const tutorDeletedResponse = await tutorItemRoute.DELETE(
      authenticatedRequest(`/api/tutor-profiles/${tutorId}`, tutorOwner, {
        body: { version: 2 },
        idempotencyKey: "route-tutor-delete-v2",
        method: "DELETE"
      }),
      routeContext(tutorId)
    );
    await expect(parentDeletedResponse.json()).resolves.toMatchObject({
      ok: true,
      value: { status: "deleted", version: 3 }
    });
    await expect(tutorDeletedResponse.json()).resolves.toMatchObject({
      ok: true,
      value: { status: "deleted", version: 3 }
    });

    const parentDeletedOwnerResponse = await parentItemRoute.GET(
      authenticatedRequest(`/api/parent-needs/${parentId}?scope=mine`, parentOwner),
      routeContext(parentId)
    );
    const tutorDeletedOwnerResponse = await tutorItemRoute.GET(
      authenticatedRequest(`/api/tutor-profiles/${tutorId}?scope=mine`, tutorOwner),
      routeContext(tutorId)
    );
    await expect(parentDeletedOwnerResponse.json()).resolves.toMatchObject({
      ok: true,
      value: { managementState: "managed", status: "deleted", version: 3 }
    });
    await expect(tutorDeletedOwnerResponse.json()).resolves.toMatchObject({
      ok: true,
      value: { managementState: "managed", status: "deleted", version: 3 }
    });

    const parentDeletedPublicResponse = await parentItemRoute.GET(
      new Request(`http://localhost/api/parent-needs/${parentId}`),
      routeContext(parentId)
    );
    const tutorDeletedPublicResponse = await tutorItemRoute.GET(
      new Request(`http://localhost/api/tutor-profiles/${tutorId}`),
      routeContext(tutorId)
    );
    expect(parentDeletedPublicResponse.status).toBe(404);
    expect(tutorDeletedPublicResponse.status).toBe(404);

    const parentRestoredResponse = await parentItemRoute.POST(
      authenticatedRequest(`/api/parent-needs/${parentId}`, parentOwner, {
        body: { action: "restore", version: 3 },
        idempotencyKey: "route-parent-restore-v3",
        method: "POST"
      }),
      routeContext(parentId)
    );
    const tutorRestoredResponse = await tutorItemRoute.POST(
      authenticatedRequest(`/api/tutor-profiles/${tutorId}`, tutorOwner, {
        body: { action: "restore", version: 3 },
        idempotencyKey: "route-tutor-restore-v3",
        method: "POST"
      }),
      routeContext(tutorId)
    );
    await expect(parentRestoredResponse.json()).resolves.toMatchObject({
      ok: true,
      value: { status: "published", version: 4 }
    });
    await expect(tutorRestoredResponse.json()).resolves.toMatchObject({
      ok: true,
      value: { status: "published", version: 4 }
    });
  });

  it("fails closed when dynamic route transactions are unavailable", async () => {
    const parentCollectionRoute = await import("@/app/api/parent-needs/route");
    const tutorCollectionRoute = await import("@/app/api/tutor-profiles/route");
    const parentItemRoute = await import("@/app/api/parent-needs/[id]/route");
    const tutorItemRoute = await import("@/app/api/tutor-profiles/[id]/route");
    const parentOwner = "synthetic-parent-owner";
    const tutorOwner = "synthetic-tutor-owner";
    const routeContext = (id: string) => ({ params: Promise.resolve({ id }) });

    const createParent = async () => {
      const response = await parentCollectionRoute.POST(
        postRequest("/api/parent-needs", parentPayload, parentOwner)
      );
      const body = (await response.json()) as { value: StoredDocument };
      return String(body.value.id);
    };
    const createTutor = async () => {
      const response = await tutorCollectionRoute.POST(
        postRequest("/api/tutor-profiles", tutorPayload, tutorOwner)
      );
      const body = (await response.json()) as { value: StoredDocument };
      return String(body.value.id);
    };

    const parentPublishedId = await createParent();
    const tutorPublishedId = await createTutor();
    const parentDeletedId = await createParent();
    const tutorDeletedId = await createTutor();
    await parentItemRoute.DELETE(
      authenticatedRequest(`/api/parent-needs/${parentDeletedId}`, parentOwner, {
        body: { version: 1 },
        idempotencyKey: "route-parent-seed-delete",
        method: "DELETE"
      }),
      routeContext(parentDeletedId)
    );
    await tutorItemRoute.DELETE(
      authenticatedRequest(`/api/tutor-profiles/${tutorDeletedId}`, tutorOwner, {
        body: { version: 1 },
        idempotencyKey: "route-tutor-seed-delete",
        method: "DELETE"
      }),
      routeContext(tutorDeletedId)
    );

    cloudBaseState.transactionAvailable = false;
    cloudBaseState.transactionCalls = 0;
    vi.resetModules();
    const parentUnavailableRoute = await import("@/app/api/parent-needs/[id]/route");
    const tutorUnavailableRoute = await import("@/app/api/tutor-profiles/[id]/route");
    const before = collectionSnapshot();

    const responses = [
      await parentUnavailableRoute.PATCH(
        authenticatedRequest(`/api/parent-needs/${parentPublishedId}`, parentOwner, {
          body: { ...parentPayload, version: 1 },
          method: "PATCH"
        }),
        routeContext(parentPublishedId)
      ),
      await parentUnavailableRoute.DELETE(
        authenticatedRequest(`/api/parent-needs/${parentPublishedId}`, parentOwner, {
          body: { version: 1 },
          idempotencyKey: "route-parent-unavailable-delete",
          method: "DELETE"
        }),
        routeContext(parentPublishedId)
      ),
      await parentUnavailableRoute.POST(
        authenticatedRequest(`/api/parent-needs/${parentDeletedId}`, parentOwner, {
          body: { action: "restore", version: 2 },
          idempotencyKey: "route-parent-unavailable-restore",
          method: "POST"
        }),
        routeContext(parentDeletedId)
      ),
      await tutorUnavailableRoute.PATCH(
        authenticatedRequest(`/api/tutor-profiles/${tutorPublishedId}`, tutorOwner, {
          body: { ...tutorPayload, version: 1 },
          method: "PATCH"
        }),
        routeContext(tutorPublishedId)
      ),
      await tutorUnavailableRoute.DELETE(
        authenticatedRequest(`/api/tutor-profiles/${tutorPublishedId}`, tutorOwner, {
          body: { version: 1 },
          idempotencyKey: "route-tutor-unavailable-delete",
          method: "DELETE"
        }),
        routeContext(tutorPublishedId)
      ),
      await tutorUnavailableRoute.POST(
        authenticatedRequest(`/api/tutor-profiles/${tutorDeletedId}`, tutorOwner, {
          body: { action: "restore", version: 2 },
          idempotencyKey: "route-tutor-unavailable-restore",
          method: "POST"
        }),
        routeContext(tutorDeletedId)
      )
    ];

    for (const response of responses) {
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toMatchObject({
        code: "TRANSACTION_UNAVAILABLE",
        ok: false
      });
    }
    expect(cloudBaseState.transactionCalls).toBe(0);
    expect(collectionSnapshot()).toEqual(before);
  });
});
