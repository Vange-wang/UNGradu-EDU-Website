import { describe, expect, it } from "vitest";

import { createTutorProfileApiHandlers } from "@/server/tutor-profile-api";
import { createTutorProfileManagementHandlers } from "@/app/api/tutor-profiles/management-handlers";

type StoredDocument = Record<string, unknown>;

const validInput = {
  gender: "女",
  school: "东莞理工学院",
  major: "数学与应用数学",
  subjects: ["数学"],
  grades: ["初中"],
  timeSlots: ["周六下午"],
  feeRanges: [{ grade: "初中", subject: "数学", min: "90", max: "130" }],
  abilityDescription: "擅长拆题和基础巩固，有同伴辅导经验。",
  proofImages: [{ name: "score.webp", type: "image/webp", size: 1024 }]
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
    "profile-a": {
      ...validInput,
      ownerUserId: "tutor-a",
      feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
      status: "published",
      createdAt: "2026-06-22T00:00:00.000Z",
      updatedAt: "2026-06-22T00:00:00.000Z",
      version: 1
    }
  });

  const publicHandlers = createTutorProfileApiHandlers({ collection, env });
  const managementHandlers = createTutorProfileManagementHandlers({
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

describe("tutor profile API handlers", () => {
  it("returns public list and detail without owner identifiers", async () => {
    const handlers = createHandlers();

    const list = await handlers.GET_COLLECTION(
      new Request("http://localhost/api/tutor-profiles?subject=数学")
    );
    const detail = await handlers.GET_ITEM(
      new Request("http://localhost/api/tutor-profiles/profile-a"),
      { params: Promise.resolve({ id: "profile-a" }) }
    );

    await expect(list.json()).resolves.toMatchObject({
      ok: true,
      value: [{ id: "profile-a", school: "东莞理工学院" }]
    });
    await expect(detail.json()).resolves.toMatchObject({
      ok: true,
      value: { id: "profile-a", school: "东莞理工学院" }
    });
  });

  it("saves and lists only my tutor profiles outside production", async () => {
    const handlers = createHandlers();

    const saved = await handlers.POST_COLLECTION(
      new Request("http://localhost/api/tutor-profiles", {
        body: JSON.stringify(validInput),
        headers: { "x-ungradu-test-user-phone": "tutor-b" },
        method: "POST"
      })
    );
    const mine = await handlers.GET_COLLECTION(
      new Request("http://localhost/api/tutor-profiles?scope=mine", {
        headers: { "x-ungradu-test-user-phone": "tutor-b" }
      })
    );

    expect(saved.status).toBe(200);
    await expect(mine.json()).resolves.toMatchObject({
      ok: true,
      value: [{ ownerUserId: "tutor-b", status: "published" }]
    });
  });

  it("rejects private scope without identity and rejects production temporary identity", async () => {
    const handlers = createHandlers();
    const productionHandlers = createHandlers({
      NODE_ENV: "production",
      NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true"
    });

    const missing = await handlers.GET_COLLECTION(
      new Request("http://localhost/api/tutor-profiles?scope=mine")
    );
    const production = await productionHandlers.POST_COLLECTION(
      new Request("http://localhost/api/tutor-profiles", {
        body: JSON.stringify(validInput),
        headers: { "x-ungradu-test-user-phone": "tutor-a" },
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
    const handlers = createTutorProfileManagementHandlers({
      collection,
      env: { NODE_ENV: "test", NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true" },
      runTransaction: undefined as never
    });
    const response = await handlers.POST_COLLECTION(
      new Request("http://localhost/api/tutor-profiles", {
        body: JSON.stringify(validInput),
        headers: { "x-ungradu-test-user-phone": "tutor-b" },
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

  it("allows only the owner to update a tutor profile by id", async () => {
    const handlers = createHandlers();

    const updated = await handlers.PATCH_ITEM(
      new Request("http://localhost/api/tutor-profiles/profile-a", {
        body: JSON.stringify({
          ...validInput,
          abilityDescription: "Updated ability description",
          version: 1
        }),
        headers: { "x-ungradu-test-user-phone": "tutor-a" },
        method: "PATCH"
      }),
      { params: Promise.resolve({ id: "profile-a" }) }
    );
    const forbidden = await handlers.PATCH_ITEM(
      new Request("http://localhost/api/tutor-profiles/profile-a", {
        body: JSON.stringify({
          ...validInput,
          abilityDescription: "Forbidden update",
          version: 1
        }),
        headers: { "x-ungradu-test-user-phone": "tutor-b" },
        method: "PATCH"
      }),
      { params: Promise.resolve({ id: "profile-a" }) }
    );

    expect(updated.status).toBe(200);
    await expect(updated.json()).resolves.toMatchObject({
      ok: true,
      value: {
        id: "profile-a",
        ownerUserId: "tutor-a",
        abilityDescription: "Updated ability description"
      }
    });
    expect(forbidden.status).toBe(404);
  });
});
