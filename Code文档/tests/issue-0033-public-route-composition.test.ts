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
});
