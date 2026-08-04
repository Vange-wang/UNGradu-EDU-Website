import { describe, expect, it } from "vitest";

import { createParentNeedApiHandlers } from "@/server/parent-need-api";
import { createParentNeedManagementHandlers } from "@/app/api/parent-needs/management-handlers";

type StoredDocument = Record<string, unknown>;

const validInput = {
  teacherGenderPreference: "不限",
  subjects: ["数学"],
  grade: "初一",
  budgetMin: "80",
  budgetMax: "120",
  timeSlots: ["周六下午"],
  region: {
    province: "广东省",
    city: "东莞市",
    district: "松山湖"
  },
  community: "松山湖大学城",
  childIntro: "基础中等，需要巩固计算习惯。"
};

function createFakeCollection(initialValues: Record<string, StoredDocument> = {}) {
  const documents = new Map(Object.entries(initialValues));

  return {
    doc(docId: string) {
      return {
        async get() {
          const data = documents.get(docId);
          return { data: data ? [{ ...data, id: docId }] : [] };
        },
        async set(data: StoredDocument) {
          documents.set(docId, data);
          return { updated: 1 };
        }
      };
    },
    where(query: Record<string, unknown>) {
      return {
        async get() {
          return {
            data: Array.from(documents.entries())
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

function createHandlers(env = { NODE_ENV: "test", NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true" }) {
  const collection = createFakeCollection({
    "need-a": {
      ...validInput,
      ownerUserId: "parent-a",
      budgetMin: 80,
      budgetMax: 120,
      status: "published",
      createdAt: "2026-06-22T00:00:00.000Z",
      updatedAt: "2026-06-22T00:00:00.000Z",
      version: 1
    }
  });

  const publicHandlers = createParentNeedApiHandlers({ collection, env });
  const managementHandlers = createParentNeedManagementHandlers({
    collection,
    env,
    runTransaction: async (operation) => operation({
      auditCollection: createFakeCollection(),
      contactExchangeRequestsCollection: createFakeCollection(),
      conversationsCollection: createFakeCollection(),
      sourceCollection: collection
    })
  });

  return {
    GET_COLLECTION: publicHandlers.GET_COLLECTION,
    ...managementHandlers
  };
}

describe("parent need API handlers", () => {
  it("returns public list and detail without owner identifiers", async () => {
    const handlers = createHandlers();

    const list = await handlers.GET_COLLECTION(
      new Request("http://localhost/api/parent-needs?subject=数学")
    );
    const detail = await handlers.GET_ITEM(
      new Request("http://localhost/api/parent-needs/need-a"),
      { params: Promise.resolve({ id: "need-a" }) }
    );

    await expect(list.json()).resolves.toMatchObject({
      ok: true,
      value: [{ id: "need-a", grade: "初一" }]
    });
    await expect(detail.json()).resolves.toMatchObject({
      ok: true,
      value: { id: "need-a", grade: "初一" }
    });
    expect(JSON.stringify(await createHandlers().GET_COLLECTION(
      new Request("http://localhost/api/parent-needs")
    ).then((response) => response.json()))).not.toContain("parent-a");
  });

  it("saves and lists only my parent needs outside production", async () => {
    const handlers = createHandlers();

    const saved = await handlers.POST_COLLECTION(
      new Request("http://localhost/api/parent-needs", {
        body: JSON.stringify(validInput),
        headers: { "x-ungradu-test-user-phone": "parent-b" },
        method: "POST"
      })
    );
    const mine = await handlers.GET_COLLECTION(
      new Request("http://localhost/api/parent-needs?scope=mine", {
        headers: { "x-ungradu-test-user-phone": "parent-b" }
      })
    );

    expect(saved.status).toBe(200);
    await expect(mine.json()).resolves.toMatchObject({
      ok: true,
      value: [{ ownerUserId: "parent-b", status: "published" }]
    });
  });

  it("rejects missing identity for private scope and rejects production temporary identity", async () => {
    const handlers = createHandlers();
    const productionHandlers = createHandlers({
      NODE_ENV: "production",
      NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true"
    });

    const missing = await handlers.GET_COLLECTION(
      new Request("http://localhost/api/parent-needs?scope=mine")
    );
    const production = await productionHandlers.POST_COLLECTION(
      new Request("http://localhost/api/parent-needs", {
        body: JSON.stringify(validInput),
        headers: { "x-ungradu-test-user-phone": "parent-a" },
        method: "POST"
      })
    );

    expect(missing.status).toBe(401);
    expect(production.status).toBe(401);
    await expect(production.json()).resolves.toMatchObject({
      ok: false,
      errors: {
        request: "Production does not accept temporary test login identity."
      }
    });
  });

  it("preserves transaction-unavailable status instead of flattening it to 400", async () => {
    const collection = createFakeCollection();
    const handlers = createParentNeedManagementHandlers({
      collection,
      env: { NODE_ENV: "test", NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true" },
      runTransaction: undefined as never
    });
    const response = await handlers.POST_COLLECTION(
      new Request("http://localhost/api/parent-needs", {
        body: JSON.stringify(validInput),
        headers: { "x-ungradu-test-user-phone": "parent-b" },
        method: "POST"
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "TRANSACTION_UNAVAILABLE",
      errors: { request: "内容管理事务暂不可用" },
      ok: false
    });
  });

  it("allows only the owner to update a parent need by id", async () => {
    const handlers = createHandlers();

    const updated = await handlers.PATCH_ITEM(
      new Request("http://localhost/api/parent-needs/need-a", {
        body: JSON.stringify({
          ...validInput,
          budgetMin: "100",
          budgetMax: "150",
          version: 1
        }),
        headers: { "x-ungradu-test-user-phone": "parent-a" },
        method: "PATCH"
      }),
      { params: Promise.resolve({ id: "need-a" }) }
    );
    const forbidden = await handlers.PATCH_ITEM(
      new Request("http://localhost/api/parent-needs/need-a", {
        body: JSON.stringify({
          ...validInput,
          budgetMin: "110",
          budgetMax: "160",
          version: 1
        }),
        headers: { "x-ungradu-test-user-phone": "parent-b" },
        method: "PATCH"
      }),
      { params: Promise.resolve({ id: "need-a" }) }
    );

    expect(updated.status).toBe(200);
    await expect(updated.json()).resolves.toMatchObject({
      ok: true,
      value: { id: "need-a", ownerUserId: "parent-a", budgetMin: 100 }
    });
    expect(forbidden.status).toBe(404);
  });

  it("soft deletes, hides public detail, and restores with version and idempotency headers", async () => {
    const handlers = createHandlers();
    const context = { params: Promise.resolve({ id: "need-a" }) };
    const deleted = await handlers.DELETE_ITEM(
      new Request("http://localhost/api/parent-needs/need-a", {
        body: JSON.stringify({ version: 1 }),
        headers: {
          "content-type": "application/json",
          "idempotency-key": "delete-need-a-api-1",
          "x-ungradu-test-user-phone": "parent-a"
        },
        method: "DELETE"
      }),
      context
    );
    const publicDetail = await handlers.GET_ITEM(
      new Request("http://localhost/api/parent-needs/need-a"),
      context
    );
    const hiddenFromOtherOwner = await handlers.GET_ITEM(
      new Request("http://localhost/api/parent-needs/need-a?scope=mine", {
        headers: { "x-ungradu-test-user-phone": "parent-b" }
      }),
      context
    );
    const restored = await handlers.POST_ITEM(
      new Request("http://localhost/api/parent-needs/need-a", {
        body: JSON.stringify({ action: "restore", version: 2 }),
        headers: {
          "content-type": "application/json",
          "idempotency-key": "restore-need-a-api-2",
          "x-ungradu-test-user-phone": "parent-a"
        },
        method: "POST"
      }),
      context
    );

    expect(deleted.status).toBe(200);
    expect(publicDetail.status).toBe(404);
    expect(hiddenFromOtherOwner.status).toBe(404);
    await expect(publicDetail.json()).resolves.toMatchObject({
      ok: false,
      errors: { request: "未找到该发布记录" }
    });
    await expect(hiddenFromOtherOwner.json()).resolves.toMatchObject({
      ok: false,
      errors: { request: "未找到该发布记录" }
    });
    expect(restored.status).toBe(200);
    await expect(restored.json()).resolves.toMatchObject({
      ok: true,
      value: { status: "published", version: 3 }
    });
  });
});
