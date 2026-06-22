import { describe, expect, it } from "vitest";

import { createTutorProfileApiHandlers } from "@/server/tutor-profile-api";

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
  return createTutorProfileApiHandlers({
    collection: createFakeCollection({
      "profile-a": {
        ...validInput,
        ownerUserId: "tutor-a",
        feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      }
    }),
    env
  });
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
      errors: { request: "生产环境不接受临时测试登录身份" }
    });
  });
});
