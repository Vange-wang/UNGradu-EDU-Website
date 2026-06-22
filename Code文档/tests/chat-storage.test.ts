import { describe, expect, it } from "vitest";

import {
  approveContactExchangeRequest,
  createOrReadConversation,
  createContactExchangeRequest,
  listContactExchangeRequestsForConversation,
  listConversationMessages,
  readAuthorizedContactProfiles,
  readConversationForUser,
  rejectContactExchangeRequest,
  sendConversationMessage,
  withdrawContactExchangeRequest
} from "@/features/chat/chat-storage";
import { saveContactProfile } from "@/features/profile/contact-profile-storage";
import { createMemoryStorage } from "@/lib/memory-storage";

describe("chat storage", () => {
  it("creates one conversation for the same source and only participants can read it", () => {
    const storage = createMemoryStorage();

    const first = createOrReadConversation({
      currentUserPhone: "13800138000",
      otherUserPhone: "13900139000",
      sourceId: "tutor-profile-1",
      sourceType: "tutor-profile",
      storage
    });
    const second = createOrReadConversation({
      currentUserPhone: "13900139000",
      otherUserPhone: "13800138000",
      sourceId: "tutor-profile-1",
      sourceType: "tutor-profile",
      storage
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);

    if (!first.ok || !second.ok) {
      return;
    }

    expect(second.value.id).toBe(first.value.id);
    expect(
      readConversationForUser({
        conversationId: first.value.id,
        currentUserPhone: "13800138000",
        storage
      })
    ).toEqual(first.value);
    expect(
      readConversationForUser({
        conversationId: first.value.id,
        currentUserPhone: "13700137000",
        storage
      })
    ).toBeNull();
  });

  it("allows only conversation participants to send and read messages in created order", () => {
    const storage = createMemoryStorage();
    const conversation = createOrReadConversation({
      currentUserPhone: "13800138000",
      otherUserPhone: "13900139000",
      sourceId: "parent-need-1",
      sourceType: "parent-need",
      storage
    });

    expect(conversation.ok).toBe(true);

    if (!conversation.ok) {
      return;
    }

    const blocked = sendConversationMessage({
      conversationId: conversation.value.id,
      senderPhone: "13700137000",
      storage,
      text: "我不应该能发消息"
    });
    const first = sendConversationMessage({
      conversationId: conversation.value.id,
      senderPhone: "13800138000",
      storage,
      text: "你好，想了解一下周末时间"
    });
    const second = sendConversationMessage({
      conversationId: conversation.value.id,
      senderPhone: "13900139000",
      storage,
      text: "可以，周六下午方便"
    });

    expect(blocked.ok).toBe(false);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(
      listConversationMessages({
        conversationId: conversation.value.id,
        currentUserPhone: "13800138000",
        storage
      }).map((message) => message.text)
    ).toEqual(["你好，想了解一下周末时间", "可以，周六下午方便"]);
    expect(
      listConversationMessages({
        conversationId: conversation.value.id,
        currentUserPhone: "13700137000",
        storage
      })
    ).toEqual([]);
  });

  it("keeps contact profiles hidden until a pending exchange request is approved with second confirmation", () => {
    const storage = createMemoryStorage();
    const conversation = createOrReadConversation({
      currentUserPhone: "13800138000",
      otherUserPhone: "13900139000",
      sourceId: "tutor-profile-1",
      sourceType: "tutor-profile",
      storage
    });

    expect(conversation.ok).toBe(true);

    if (!conversation.ok) {
      return;
    }

    saveContactProfile({
      input: { phone: "13800138000", wechat: "parent_contact" },
      ownerPhone: "13800138000",
      storage
    });
    saveContactProfile({
      input: { phone: "13900139000", wechat: "tutor_contact" },
      ownerPhone: "13900139000",
      storage
    });

    const request = createContactExchangeRequest({
      conversationId: conversation.value.id,
      requesterPhone: "13800138000",
      storage
    });

    expect(request.ok).toBe(true);
    expect(
      readAuthorizedContactProfiles({
        conversationId: conversation.value.id,
        currentUserPhone: "13800138000",
        storage
      })
    ).toBeNull();

    if (!request.ok) {
      return;
    }

    const withoutConfirmation = approveContactExchangeRequest({
      confirmerPhone: "13900139000",
      requestId: request.value.id,
      secondConfirmation: false,
      storage
    });

    expect(withoutConfirmation.ok).toBe(false);
    expect(
      readAuthorizedContactProfiles({
        conversationId: conversation.value.id,
        currentUserPhone: "13800138000",
        storage
      })
    ).toBeNull();

    const approved = approveContactExchangeRequest({
      confirmerPhone: "13900139000",
      requestId: request.value.id,
      secondConfirmation: true,
      storage
    });

    expect(approved.ok).toBe(true);
    expect(
      readAuthorizedContactProfiles({
        conversationId: conversation.value.id,
        currentUserPhone: "13800138000",
        storage
      })
    ).toEqual({
      currentUser: { phone: "13800138000", wechat: "parent_contact" },
      otherUser: { phone: "13900139000", wechat: "tutor_contact" }
    });
    expect(
      readAuthorizedContactProfiles({
        conversationId: conversation.value.id,
        currentUserPhone: "13700137000",
        storage
      })
    ).toBeNull();
  });

  it("supports rejecting and withdrawing pending contact exchange requests before approval", () => {
    const storage = createMemoryStorage();
    const conversation = createOrReadConversation({
      currentUserPhone: "13800138000",
      otherUserPhone: "13900139000",
      sourceId: "parent-need-1",
      sourceType: "parent-need",
      storage
    });

    expect(conversation.ok).toBe(true);

    if (!conversation.ok) {
      return;
    }

    const rejectedRequest = createContactExchangeRequest({
      conversationId: conversation.value.id,
      requesterPhone: "13800138000",
      storage
    });

    expect(rejectedRequest.ok).toBe(true);

    if (!rejectedRequest.ok) {
      return;
    }

    expect(
      rejectContactExchangeRequest({
        receiverPhone: "13900139000",
        requestId: rejectedRequest.value.id,
        storage
      })
    ).toMatchObject({ ok: true, value: { status: "rejected" } });

    const withdrawnRequest = createContactExchangeRequest({
      conversationId: conversation.value.id,
      requesterPhone: "13900139000",
      storage
    });

    expect(withdrawnRequest.ok).toBe(true);

    if (!withdrawnRequest.ok) {
      return;
    }

    expect(
      withdrawContactExchangeRequest({
        requesterPhone: "13900139000",
        requestId: withdrawnRequest.value.id,
        storage
      })
    ).toMatchObject({ ok: true, value: { status: "withdrawn" } });
  });

  it("lists contact exchange requests only for conversation participants", () => {
    const storage = createMemoryStorage();
    const conversation = createOrReadConversation({
      currentUserPhone: "13800138000",
      otherUserPhone: "13900139000",
      sourceId: "parent-need-1",
      sourceType: "parent-need",
      storage
    });

    expect(conversation.ok).toBe(true);

    if (!conversation.ok) {
      return;
    }

    const request = createContactExchangeRequest({
      conversationId: conversation.value.id,
      requesterPhone: "13800138000",
      storage
    });

    expect(request.ok).toBe(true);
    expect(
      listContactExchangeRequestsForConversation({
        conversationId: conversation.value.id,
        currentUserPhone: "13900139000",
        storage
      }).map((item) => item.id)
    ).toEqual(request.ok ? [request.value.id] : []);
    expect(
      listContactExchangeRequestsForConversation({
        conversationId: conversation.value.id,
        currentUserPhone: "13700137000",
        storage
      })
    ).toEqual([]);
  });

  it("expires pending contact exchange requests after seven days from creation", () => {
    const storage = createMemoryStorage();
    const conversation = createOrReadConversation({
      currentUserPhone: "13800138000",
      otherUserPhone: "13900139000",
      sourceId: "parent-need-1",
      sourceType: "parent-need",
      storage
    });

    expect(conversation.ok).toBe(true);

    if (!conversation.ok) {
      return;
    }

    const request = createContactExchangeRequest({
      conversationId: conversation.value.id,
      createdAt: "2026-06-01T00:00:00.000Z",
      requesterPhone: "13800138000",
      storage
    });

    expect(request.ok).toBe(true);

    if (!request.ok) {
      return;
    }

    const approved = approveContactExchangeRequest({
      confirmerPhone: "13900139000",
      now: "2026-06-09T00:00:00.000Z",
      requestId: request.value.id,
      secondConfirmation: true,
      storage
    });

    expect(approved).toMatchObject({
      ok: false,
      errors: { request: "联系方式交换请求已过期" }
    });
  });
});
