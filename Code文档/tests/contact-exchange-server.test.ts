import { describe, expect, it } from "vitest";

import {
  approveServerContactExchangeRequest,
  createServerContactExchangeRequest,
  listServerContactExchangeRequests,
  readServerAuthorizedContactProfiles,
  rejectServerContactExchangeRequest,
  withdrawServerContactExchangeRequest
} from "@/server/contact-exchange";

type StoredDocument = Record<string, unknown>;

function activeExchangeTimes() {
  const createdAt = new Date();
  const approvedAt = new Date(createdAt.getTime() + 5 * 60 * 1000);

  return {
    approvedAt: approvedAt.toISOString(),
    createdAt: createdAt.toISOString()
  };
}

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
        return {
          async get() {
            return {
              data: Array.from(documents.entries())
                .filter(([, document]) =>
                  Object.entries(query).every(
                    ([key, value]) => document[key] === value
                  )
                )
                .map(([id, document]) => ({ ...document, id }))
            };
          }
        };
      }
    }
  };
}

function createDependencies() {
  const conversations = createFakeCollection({
    "conversation-a": {
      participantUserIds: ["parent-a", "tutor-a"],
      sourceId: "parent-need-a",
      sourceType: "parent-need",
      createdAt: "2026-06-22T00:00:00.000Z"
    }
  });
  const contactProfiles = createFakeCollection({
    "parent-a": {
      ownerUserId: "parent-a",
      phone: "13800138000",
      wechat: "parent_contact",
      updatedAt: "2026-06-22T00:00:00.000Z"
    },
    "tutor-a": {
      ownerUserId: "tutor-a",
      phone: "13900139000",
      wechat: "tutor_contact",
      updatedAt: "2026-06-22T00:00:00.000Z"
    }
  });
  const requests = createFakeCollection();
  const parentNeeds = createFakeCollection({
    "parent-need-a": {
      ownerUserId: "parent-a",
      status: "published",
      version: 1
    }
  });
  const tutorProfiles = createFakeCollection();

  return {
    contactProfilesCollection: contactProfiles.collection,
    conversationsCollection: conversations.collection,
    parentNeeds,
    parentNeedsCollection: parentNeeds.collection,
    requests,
    requestsCollection: requests.collection,
    tutorProfilesCollection: tutorProfiles.collection
  };
}

describe("server contact exchange interface", () => {
  it("keeps contact profiles unreadable until a participant approves with second confirmation", async () => {
    const dependencies = createDependencies();
    const activeTimes = activeExchangeTimes();

    const request = await createServerContactExchangeRequest({
      ...dependencies,
      authenticatedUserId: "parent-a",
      conversationId: "conversation-a",
      now: activeTimes.createdAt
    });

    expect(request).toMatchObject({
      ok: true,
      value: {
        conversationId: "conversation-a",
        direction: "sent",
        status: "pending"
      }
    });

    await expect(
      readServerAuthorizedContactProfiles({
        ...dependencies,
        authenticatedUserId: "parent-a",
        conversationId: "conversation-a"
      })
    ).resolves.toEqual({ ok: true, value: null, errors: {} });

    const approved = await approveServerContactExchangeRequest({
      ...dependencies,
      authenticatedUserId: "tutor-a",
      now: activeTimes.approvedAt,
      requestId: request.ok ? request.value.id : "",
      secondConfirmation: true
    });

    expect(approved).toMatchObject({
      ok: true,
      value: {
        direction: "received",
        status: "approved",
        secondConfirmedAt: activeTimes.approvedAt
      }
    });

    await expect(
      readServerAuthorizedContactProfiles({
        ...dependencies,
        authenticatedUserId: "parent-a",
        conversationId: "conversation-a"
      })
    ).resolves.toEqual({
      ok: true,
      value: {
        currentUser: { phone: "13800138000", wechat: "parent_contact" },
        otherUser: { phone: "13900139000", wechat: "tutor_contact" }
      },
      errors: {}
    });
  });

  it("denies non-participant request creation, listing, and authorized contact reads", async () => {
    const dependencies = createDependencies();

    await expect(
      createServerContactExchangeRequest({
        ...dependencies,
        authenticatedUserId: "stranger",
        conversationId: "conversation-a"
      })
    ).resolves.toMatchObject({
      ok: false,
      status: 404,
      errors: { request: "无法找到请求的资源" }
    });

    await expect(
      listServerContactExchangeRequests({
        ...dependencies,
        authenticatedUserId: "stranger",
        conversationId: "conversation-a"
      })
    ).resolves.toEqual({
      errors: { request: "无法找到请求的资源" },
      ok: false,
      status: 404,
      value: null
    });

    await expect(
      readServerAuthorizedContactProfiles({
        ...dependencies,
        authenticatedUserId: "stranger",
        conversationId: "conversation-a"
      })
    ).resolves.toEqual({
      errors: { request: "无法找到请求的资源" },
      ok: false,
      status: 404,
      value: null
    });
  });

  it("requires the receiver to approve with second confirmation", async () => {
    const dependencies = createDependencies();
    const request = await createServerContactExchangeRequest({
      ...dependencies,
      authenticatedUserId: "parent-a",
      conversationId: "conversation-a"
    });
    const requestId = request.ok ? request.value.id : "";

    await expect(
      approveServerContactExchangeRequest({
        ...dependencies,
        authenticatedUserId: "parent-a",
        requestId,
        secondConfirmation: true
      })
    ).resolves.toMatchObject({
      ok: false,
      status: 404,
      errors: { request: "无法找到请求的资源" }
    });

    await expect(
      approveServerContactExchangeRequest({
        ...dependencies,
        authenticatedUserId: "tutor-a",
        requestId,
        secondConfirmation: false
      })
    ).resolves.toMatchObject({
      ok: false,
      errors: { request: "同意交换联系方式前必须完成二次确认" }
    });
  });

  it("supports rejecting, withdrawing, and expiring pending requests", async () => {
    const rejectedDependencies = createDependencies();
    const rejected = await createServerContactExchangeRequest({
      ...rejectedDependencies,
      authenticatedUserId: "parent-a",
      conversationId: "conversation-a"
    });

    await expect(
      rejectServerContactExchangeRequest({
        ...rejectedDependencies,
        authenticatedUserId: "tutor-a",
        requestId: rejected.ok ? rejected.value.id : ""
      })
    ).resolves.toMatchObject({
      ok: true,
      value: { direction: "received", status: "rejected" }
    });

    const withdrawnDependencies = createDependencies();
    const withdrawn = await createServerContactExchangeRequest({
      ...withdrawnDependencies,
      authenticatedUserId: "parent-a",
      conversationId: "conversation-a"
    });

    await expect(
      withdrawServerContactExchangeRequest({
        ...withdrawnDependencies,
        authenticatedUserId: "parent-a",
        requestId: withdrawn.ok ? withdrawn.value.id : ""
      })
    ).resolves.toMatchObject({
      ok: true,
      value: { direction: "sent", status: "withdrawn" }
    });

    const expiredDependencies = createDependencies();
    const expired = await createServerContactExchangeRequest({
      ...expiredDependencies,
      authenticatedUserId: "parent-a",
      conversationId: "conversation-a",
      now: "2026-06-01T00:00:00.000Z"
    });

    await expect(
      approveServerContactExchangeRequest({
        ...expiredDependencies,
        authenticatedUserId: "tutor-a",
        now: "2026-06-10T00:00:00.000Z",
        requestId: expired.ok ? expired.value.id : "",
        secondConfirmation: true
      })
    ).resolves.toMatchObject({
      ok: false,
      errors: { request: "联系方式交换请求已过期" }
    });
  });

  it("blocks every exchange transition and hides previously authorized profiles while the source is deleted", async () => {
    const dependencies = createDependencies();
    const activeTimes = activeExchangeTimes();
    const request = await createServerContactExchangeRequest({
      ...dependencies,
      authenticatedUserId: "parent-a",
      conversationId: "conversation-a",
      now: activeTimes.createdAt
    });
    await dependencies.parentNeedsCollection.doc("parent-need-a").set({
      ownerUserId: "parent-a",
      status: "deleted",
      version: 2
    });

    await expect(
      createServerContactExchangeRequest({
        ...dependencies,
        authenticatedUserId: "parent-a",
        conversationId: "conversation-a"
      })
    ).resolves.toMatchObject({
      ok: false,
      errors: { request: "关联发布已删除，暂不可交换联系方式" }
    });
    await expect(
      approveServerContactExchangeRequest({
        ...dependencies,
        authenticatedUserId: "tutor-a",
        now: activeTimes.approvedAt,
        requestId: request.ok ? request.value.id : "",
        secondConfirmation: true
      })
    ).resolves.toMatchObject({
      ok: false,
      errors: { request: "关联发布已删除，暂不可交换联系方式" }
    });
    await expect(
      rejectServerContactExchangeRequest({
        ...dependencies,
        authenticatedUserId: "tutor-a",
        requestId: request.ok ? request.value.id : ""
      })
    ).resolves.toMatchObject({
      ok: false,
      errors: { request: "关联发布已删除，暂不可交换联系方式" }
    });
    await expect(
      withdrawServerContactExchangeRequest({
        ...dependencies,
        authenticatedUserId: "parent-a",
        requestId: request.ok ? request.value.id : ""
      })
    ).resolves.toMatchObject({
      ok: false,
      errors: { request: "关联发布已删除，暂不可交换联系方式" }
    });

    const approvedDependencies = createDependencies();
    const approvedRequest = await createServerContactExchangeRequest({
      ...approvedDependencies,
      authenticatedUserId: "parent-a",
      conversationId: "conversation-a",
      now: activeTimes.createdAt
    });
    await approveServerContactExchangeRequest({
      ...approvedDependencies,
      authenticatedUserId: "tutor-a",
      now: activeTimes.approvedAt,
      requestId: approvedRequest.ok ? approvedRequest.value.id : "",
      secondConfirmation: true
    });
    await approvedDependencies.parentNeedsCollection.doc("parent-need-a").set({
      ownerUserId: "parent-a",
      status: "deleted",
      version: 2
    });
    await expect(
      readServerAuthorizedContactProfiles({
        ...approvedDependencies,
        authenticatedUserId: "parent-a",
        conversationId: "conversation-a"
      })
    ).resolves.toEqual({ ok: true, value: null, errors: {} });
  });
});

describe("synthetic fixture deterministic contact seam", () => {
  it("replays preallocated create and approval ids without duplicate writes", async () => {
    const dependencies = createDependencies();
    const requestId = "contact-exchange-synthetic-deterministic";
    const createInput = {
      ...dependencies,
      authenticatedUserId: "tutor-a",
      conversationId: "conversation-a",
      now: "2026-08-05T18:00:00.000Z",
      preallocatedId: requestId
    };
    const first = await createServerContactExchangeRequest(createInput);
    const replayed = await createServerContactExchangeRequest(createInput);
    expect(first).toMatchObject({ ok: true, value: { id: requestId, status: "pending" } });
    expect(replayed).toEqual(first);
    expect(dependencies.requests.documents).toHaveLength(1);

    const approveInput = {
      ...dependencies,
      authenticatedUserId: "parent-a",
      approvalIdempotencyKey: "approve-synthetic-deterministic",
      now: "2026-08-05T18:00:01.000Z",
      requestId,
      secondConfirmation: true
    };
    const approved = await approveServerContactExchangeRequest(approveInput);
    const replayedApproval = await approveServerContactExchangeRequest(approveInput);
    expect(approved).toMatchObject({ ok: true, value: { id: requestId, status: "approved" } });
    expect(replayedApproval).toEqual(approved);

    await dependencies.parentNeedsCollection.doc("parent-need-a").set({
      ownerUserId: "parent-a",
      status: "deleted",
      version: 2
    });
    await expect(approveServerContactExchangeRequest(approveInput)).resolves.toMatchObject({
      ok: false,
      errors: { request: "关联发布已删除，暂不可交换联系方式" }
    });

    await dependencies.parentNeedsCollection.doc("parent-need-a").set({
      ownerUserId: "parent-a",
      status: "published",
      version: 1
    });
    await expect(approveServerContactExchangeRequest(approveInput)).resolves.toEqual(approved);
  });

  it("fails closed when a preallocated request id belongs to another relation", async () => {
    const dependencies = createDependencies();
    dependencies.requests.documents.set("contact-exchange-synthetic-collision", {
      conversationId: "other-conversation",
      requesterUserId: "tutor-a",
      receiverUserId: "parent-a",
      status: "pending",
      secondConfirmedAt: null,
      createdAt: "2026-08-05T18:00:00.000Z",
      updatedAt: "2026-08-05T18:00:00.000Z"
    });
    await expect(createServerContactExchangeRequest({
      ...dependencies,
      authenticatedUserId: "tutor-a",
      conversationId: "conversation-a",
      preallocatedId: "contact-exchange-synthetic-collision"
    })).resolves.toMatchObject({ ok: false });
  });
});
