import { describe, expect, it } from "vitest";

import { createParentNeedApiHandlers } from "@/server/parent-need-api";

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
  return createParentNeedApiHandlers({
    collection: createFakeCollection({
      "need-a": {
        ...validInput,
        ownerUserId: "parent-a",
        budgetMin: 80,
        budgetMax: 120,
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      }
    }),
    env
  });
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
});
