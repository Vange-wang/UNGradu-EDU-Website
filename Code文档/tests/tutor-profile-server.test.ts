import { describe, expect, it } from "vitest";

import {
  filterServerTutorProfiles,
  findPublicServerTutorProfileById,
  listPublicServerTutorProfiles,
  listServerTutorProfilesForOwner,
  saveServerTutorProfile
} from "@/server/tutor-profiles";

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

describe("server tutor_profiles interface", () => {
  it("saves a tutor profile to the current user's ownership", async () => {
    const fake = createFakeCollection();

    const result = await saveServerTutorProfile({
      authenticatedUserId: "tutor-a",
      collection: fake.collection,
      input: validInput,
      now: "2026-06-22T00:00:00.000Z"
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        ownerUserId: "tutor-a",
        status: "published",
        feeRanges: [{ min: 90, max: 130 }],
        proofImages: [{ name: "score.webp", type: "image/webp", size: 1024 }]
      }
    });
  });

  it("lists only the current user's own tutor profiles", async () => {
    const fake = createFakeCollection({
      "profile-a": {
        ...validInput,
        ownerUserId: "tutor-a",
        feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      },
      "profile-b": {
        ...validInput,
        ownerUserId: "tutor-b",
        feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      }
    });

    await expect(
      listServerTutorProfilesForOwner({
        authenticatedUserId: "tutor-a",
        collection: fake.collection
      })
    ).resolves.toMatchObject({
      ok: true,
      value: [{ id: "profile-a", ownerUserId: "tutor-a" }]
    });
  });

  it("returns public list and detail without owner identifiers", async () => {
    const fake = createFakeCollection({
      "profile-a": {
        ...validInput,
        ownerUserId: "tutor-a",
        feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      }
    });

    const publicList = await listPublicServerTutorProfiles({
      collection: fake.collection
    });
    const publicDetail = await findPublicServerTutorProfileById({
      collection: fake.collection,
      id: "profile-a"
    });

    expect(publicList).toMatchObject({
      ok: true,
      value: [{ id: "profile-a", school: "东莞理工学院" }]
    });
    expect(publicDetail).toMatchObject({
      ok: true,
      value: { id: "profile-a", school: "东莞理工学院" }
    });
    expect(JSON.stringify(publicList)).not.toContain("tutor-a");
    expect(JSON.stringify(publicDetail)).not.toContain("tutor-a");
    expect(publicDetail.ok && publicDetail.value).not.toHaveProperty("ownerUserId");
  });

  it("filters public tutor profiles by subject, grade, fee, and gender", async () => {
    const fake = createFakeCollection({
      "profile-a": {
        ...validInput,
        ownerUserId: "tutor-a",
        feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      },
      "profile-b": {
        ...validInput,
        gender: "男",
        subjects: ["生物"],
        grades: ["高中"],
        ownerUserId: "tutor-b",
        feeRanges: [{ grade: "高中", subject: "生物", min: 160, max: 220 }],
        status: "published",
        createdAt: "2026-06-22T00:00:00.000Z"
      }
    });
    const publicList = await listPublicServerTutorProfiles({
      collection: fake.collection
    });

    if (!publicList.ok) {
      throw new Error("expected public list");
    }

    const matched = filterServerTutorProfiles(publicList.value, {
      feeMax: "120",
      feeMin: "100",
      gender: "女",
      grade: "初中",
      subject: "数学"
    });

    expect(matched).toHaveLength(1);
    expect(matched[0].id).toBe("profile-a");
  });

  it("lists newly created public tutor profiles when the collection has many older documents", async () => {
    const oldProfiles = Object.fromEntries(
      Array.from({ length: 120 }, (_, index) => [
        `old-profile-${index}`,
        {
          ...validInput,
          ownerUserId: `old-tutor-${index}`,
          feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
          status: "published",
          createdAt: `2026-06-20T00:${String(index).padStart(2, "0")}:00.000Z`
        }
      ])
    );
    const fake = createFakeCollection({
      ...oldProfiles,
      "fresh-profile": {
        ...validInput,
        ownerUserId: "fresh-tutor",
        feeRanges: [{ grade: "初中", subject: "数学", min: 90, max: 130 }],
        status: "published",
        createdAt: "2026-06-23T00:00:00.000Z"
      }
    });

    const publicList = await listPublicServerTutorProfiles({
      collection: fake.collection,
      filters: { subject: "数学" }
    });

    expect(publicList).toMatchObject({
      ok: true,
      value: expect.arrayContaining([
        expect.objectContaining({ id: "fresh-profile" })
      ])
    });
  });

  it("rejects missing authentication and invalid input", async () => {
    const fake = createFakeCollection();

    await expect(
      saveServerTutorProfile({
        authenticatedUserId: "",
        collection: fake.collection,
        input: validInput
      })
    ).resolves.toMatchObject({
      ok: false,
      errors: { request: "必须登录后才能发布家教信息" }
    });

    await expect(
      saveServerTutorProfile({
        authenticatedUserId: "tutor-a",
        collection: fake.collection,
        input: { ...validInput, abilityDescription: "请加微信 tutor_edu" }
      })
    ).resolves.toMatchObject({
      ok: false,
      errors: { abilityDescription: expect.any(String) }
    });
  });
});
