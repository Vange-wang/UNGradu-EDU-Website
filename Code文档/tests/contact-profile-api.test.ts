import { describe, expect, it } from "vitest";

import { createContactProfileApiHandlers } from "@/server/contact-profile-api";

type StoredDocument = Record<string, unknown>;

function createFakeCollection(initialValues: Record<string, StoredDocument> = {}) {
  const documents = new Map(Object.entries(initialValues));

  return {
    doc(docId: string) {
      return {
        async get() {
          const data = documents.get(docId);
          return { data: data ? [data] : [] };
        },
        async set(data: StoredDocument) {
          documents.set(docId, data);
          return { updated: 1 };
        }
      };
    }
  };
}

describe("contact profile API handlers", () => {
  it("saves and reads the current test user's contact profile outside production", async () => {
    const handlers = createContactProfileApiHandlers({
      collection: createFakeCollection(),
      env: { NODE_ENV: "test", NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true" }
    });
    const headers = { "x-ungradu-test-user-phone": "13800138000" };

    const saved = await handlers.PUT(
      new Request("http://localhost/api/contact-profile", {
        body: JSON.stringify({ phone: "13800138000", wechat: "parent_a" }),
        headers,
        method: "PUT"
      })
    );
    const read = await handlers.GET(
      new Request("http://localhost/api/contact-profile", { headers })
    );

    await expect(saved.json()).resolves.toMatchObject({
      ok: true,
      value: { phone: "13800138000", wechat: "parent_a" }
    });
    await expect(read.json()).resolves.toMatchObject({
      ok: true,
      value: { phone: "13800138000", wechat: "parent_a" }
    });
  });

  it("rejects missing temporary identity and production temporary identity", async () => {
    const handlers = createContactProfileApiHandlers({
      collection: createFakeCollection(),
      env: { NODE_ENV: "test", NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true" }
    });
    const productionHandlers = createContactProfileApiHandlers({
      collection: createFakeCollection(),
      env: { NODE_ENV: "production", NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true" }
    });

    const missingIdentity = await handlers.GET(
      new Request("http://localhost/api/contact-profile")
    );
    const productionIdentity = await productionHandlers.GET(
      new Request("http://localhost/api/contact-profile", {
        headers: { "x-ungradu-test-user-phone": "13800138000" }
      })
    );

    expect(missingIdentity.status).toBe(401);
    expect(productionIdentity.status).toBe(401);
    await expect(productionIdentity.json()).resolves.toMatchObject({
      ok: false,
      errors: {
        request: "Production does not accept temporary test login identity."
      }
    });
  });

  it("rejects invalid contact profile input", async () => {
    const handlers = createContactProfileApiHandlers({
      collection: createFakeCollection(),
      env: { NODE_ENV: "test", NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true" }
    });

    const response = await handlers.PUT(
      new Request("http://localhost/api/contact-profile", {
        body: JSON.stringify({ phone: "", wechat: "" }),
        headers: { "x-ungradu-test-user-phone": "13800138000" },
        method: "PUT"
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      errors: { phone: "请填写用于交换的手机号" }
    });
  });
});
