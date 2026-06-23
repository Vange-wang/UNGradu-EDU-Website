import { describe, expect, it } from "vitest";

import {
  filterServerParentNeeds,
  findPublicServerParentNeedById,
  listPublicServerParentNeeds,
  listServerParentNeedsForOwner,
  saveServerParentNeed
} from "@/server/parent-needs";

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
    documents,
    collection: {
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
        const state = {
          limit: undefined as number | undefined,
          orderBy: undefined as { direction: "asc" | "desc"; field: string } | undefined,
          skip: 0
        };
        const chain = {
          orderBy(field: string, direction: "asc" | "desc") {
            state.orderBy = { direction, field };
            return chain;
          },
          skip(value: number) {
            state.skip = value;
            return chain;
          },
          limit(value: number) {
            state.limit = value;
            return chain;
          },
          async get() {
            let rows = Array.from(documents.entries())
              .filter(([, document]) =>
                Object.entries(query).every(([key, value]) => document[key] === value)
              )
              .map(([id, document]) => ({ ...document, id }));

            if (state.orderBy) {
              rows = rows.sort((left, right) => {
                const leftDocument = left as Record<string, unknown>;
                const rightDocument = right as Record<string, unknown>;
                const leftValue = String(leftDocument[state.orderBy?.field ?? ""] ?? "");
                const rightValue = String(rightDocument[state.orderBy?.field ?? ""] ?? "");
                const direction = state.orderBy?.direction === "asc" ? 1 : -1;
                return leftValue.localeCompare(rightValue) * direction;
              });
            }

            return {
              data: rows.slice(
                state.skip,
                state.skip + (state.limit ?? 100)
              )
            };
          }
        };

        return chain;
      }
    }
  };
}

describe("server parent_needs interface", () => {
  it("saves a parent need to the current user's ownership", async () => {
    const fake = createFakeCollection();

    const result = await saveServerParentNeed({
      authenticatedUserId: "parent-a",
      collection: fake.collection,
      input: validInput,
      now: "2026-06-22T00:00:00.000Z"
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ownerUserId: "parent-a",
        status: "published",
        budgetMin: 80,
        budgetMax: 120,
        createdAt: "2026-06-22T00:00:00.000Z"
      }
    });
    expect(JSON.stringify(Array.from(fake.documents.values()))).toContain("parent-a");
  });

  it("lists only the current user's own parent needs", async () => {
    const fake = createFakeCollection({
      "need-a": {
        ...validInput,
        ownerUserId: "parent-a",
        budgetMin: 80,
        budgetMax: 120,
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      },
      "need-b": {
        ...validInput,
        ownerUserId: "parent-b",
        budgetMin: 80,
        budgetMax: 120,
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      }
    });

    await expect(
      listServerParentNeedsForOwner({
        authenticatedUserId: "parent-a",
        collection: fake.collection
      })
    ).resolves.toMatchObject({
      ok: true,
      value: [{ id: "need-a", ownerUserId: "parent-a" }]
    });
  });

  it("returns public list and detail without owner identifiers", async () => {
    const fake = createFakeCollection({
      "need-a": {
        ...validInput,
        ownerUserId: "parent-a",
        budgetMin: 80,
        budgetMax: 120,
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      }
    });

    const publicList = await listPublicServerParentNeeds({
      collection: fake.collection
    });
    const publicDetail = await findPublicServerParentNeedById({
      collection: fake.collection,
      id: "need-a"
    });

    expect(publicList).toMatchObject({
      ok: true,
      value: [{ id: "need-a", grade: "初一" }]
    });
    expect(publicDetail).toMatchObject({
      ok: true,
      value: { id: "need-a", grade: "初一" }
    });
    expect(JSON.stringify(publicList)).not.toContain("parent-a");
    expect(JSON.stringify(publicDetail)).not.toContain("parent-a");
    expect(publicDetail.ok && publicDetail.value).not.toHaveProperty("ownerUserId");
  });

  it("filters public parent needs by subject, grade, budget, and gender preference", async () => {
    const fake = createFakeCollection({
      "need-a": {
        ...validInput,
        ownerUserId: "parent-a",
        budgetMin: 80,
        budgetMax: 120,
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      },
      "need-b": {
        ...validInput,
        teacherGenderPreference: "女老师",
        subjects: ["英语"],
        grade: "高一",
        ownerUserId: "parent-b",
        budgetMin: 160,
        budgetMax: 220,
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      }
    });
    const publicList = await listPublicServerParentNeeds({
      collection: fake.collection
    });

    if (!publicList.ok) {
      throw new Error("expected public list");
    }

    const matched = filterServerParentNeeds(publicList.value, {
      budgetMax: "100",
      budgetMin: "90",
      grade: "初一",
      subject: "数学",
      teacherGenderPreference: "不限"
    });

    expect(matched).toHaveLength(1);
    expect(matched[0].id).toBe("need-a");
  });

  it("lists newly created public parent needs when the collection has many older documents", async () => {
    const oldNeeds = Object.fromEntries(
      Array.from({ length: 120 }, (_, index) => [
        `old-need-${index}`,
        {
          ...validInput,
          ownerUserId: `old-parent-${index}`,
          budgetMin: 80,
          budgetMax: 120,
          status: "published",
          createdAt: `2026-06-20T00:${String(index).padStart(2, "0")}:00.000Z`
        }
      ])
    );
    const fake = createFakeCollection({
      ...oldNeeds,
      "fresh-need": {
        ...validInput,
        ownerUserId: "fresh-parent",
        budgetMin: 80,
        budgetMax: 120,
        status: "published",
        createdAt: "2026-06-23T00:00:00.000Z"
      }
    });

    const publicList = await listPublicServerParentNeeds({
      collection: fake.collection,
      filters: { subject: "数学" }
    });

    expect(publicList).toMatchObject({
      ok: true,
      value: expect.arrayContaining([
        expect.objectContaining({ id: "fresh-need" })
      ])
    });
  });

  it("rejects missing authentication and invalid input", async () => {
    const fake = createFakeCollection();

    await expect(
      saveServerParentNeed({
        authenticatedUserId: "",
        collection: fake.collection,
        input: validInput
      })
    ).resolves.toMatchObject({
      ok: false,
      errors: { request: "必须登录后才能发布家长需求" }
    });

    await expect(
      saveServerParentNeed({
        authenticatedUserId: "parent-a",
        collection: fake.collection,
        input: { ...validInput, childIntro: "请加微信 parent_edu" }
      })
    ).resolves.toMatchObject({
      ok: false,
      errors: { childIntro: expect.any(String) }
    });
  });
});
