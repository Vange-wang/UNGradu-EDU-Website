import { describe, expect, it } from "vitest";

import {
  readServerContactProfile,
  saveServerContactProfile
} from "@/server/contact-profiles";

type StoredDocument = Record<string, unknown>;

function createFakeContactProfileCollection(initialValues: Record<string, StoredDocument> = {}) {
  const documents = new Map(Object.entries(initialValues));
  const calls: Array<{ docId: string; data?: unknown; type: "get" | "set" }> = [];

  return {
    calls,
    collection: {
      doc(docId: string) {
        return {
          async get() {
            calls.push({ docId, type: "get" });
            const data = documents.get(docId);
            return { data: data ? [data] : [] };
          },
          async set(data: unknown) {
            calls.push({ data, docId, type: "set" });
            documents.set(docId, data as StoredDocument);
            return { updated: 1 };
          }
        };
      }
    }
  };
}

describe("server contact_profiles interface", () => {
  it("saves the current user's contact profile to their own document", async () => {
    const fake = createFakeContactProfileCollection();

    const result = await saveServerContactProfile({
      authenticatedUserId: "user-a",
      collection: fake.collection,
      input: { phone: " 13800138000 ", wechat: " parent_a " }
    });

    expect(result).toEqual({
      ok: true,
      value: { phone: "13800138000", wechat: "parent_a" },
      errors: {}
    });
    expect(fake.calls).toEqual([
      {
        docId: "user-a",
        type: "set",
        data: {
          ownerUserId: "user-a",
          phone: "13800138000",
          wechat: "parent_a",
          updatedAt: expect.any(String)
        }
      }
    ]);
  });

  it("reads only the current user's contact profile", async () => {
    const fake = createFakeContactProfileCollection({
      "user-a": {
        ownerUserId: "user-a",
        phone: "13800138000",
        wechat: "parent_a",
        updatedAt: "2026-06-22T00:00:00.000Z"
      },
      "user-b": {
        ownerUserId: "user-b",
        phone: "13900139000",
        wechat: "parent_b",
        updatedAt: "2026-06-22T00:00:00.000Z"
      }
    });

    await expect(
      readServerContactProfile({
        authenticatedUserId: "user-a",
        collection: fake.collection
      })
    ).resolves.toEqual({
      ok: true,
      value: { phone: "13800138000", wechat: "parent_a" },
      errors: {}
    });
    expect(fake.calls).toEqual([{ docId: "user-a", type: "get" }]);
  });

  it("rejects missing authenticated user and invalid contact input", async () => {
    const fake = createFakeContactProfileCollection();

    await expect(
      readServerContactProfile({
        authenticatedUserId: "",
        collection: fake.collection
      })
    ).resolves.toMatchObject({
      ok: false,
      errors: { request: "必须登录后才能访问联系方式存档" }
    });

    await expect(
      saveServerContactProfile({
        authenticatedUserId: "user-a",
        collection: fake.collection,
        input: { phone: "", wechat: "" }
      })
    ).resolves.toMatchObject({
      ok: false,
      errors: { phone: "请填写用于交换的手机号" }
    });
    expect(fake.calls).toEqual([]);
  });
});
