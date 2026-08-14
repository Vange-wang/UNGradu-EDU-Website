import { describe, expect, it } from "vitest";

import {
  approveContactExchangeRequestFromApi,
  createContactExchangeRequestFromApi,
  createConversationFromSourceToApi,
  listContactExchangeRequestsFromApi,
  readAuthorizedContactProfilesFromApi,
  readConversationFromApi,
  readConversationMessagesFromApi,
  readConversationsFromApi,
  rejectContactExchangeRequestFromApi,
  sendConversationMessageToApi,
  withdrawContactExchangeRequestFromApi
} from "@/features/chat/chat-api-client";

describe("chat API client", () => {
  it("uses cookie-backed conversation and exchange APIs", async () => {
    const calls: Array<{ body: string | null; headers: Headers; method: string; url: string }> = [];
    const fetcher: typeof fetch = async (url, init) => {
      if (url.toString().startsWith("/api/auth/csrf")) {
        return Response.json({
          errors: {},
          ok: true,
          value: { proof: "chat-post-proof" }
        });
      }
      calls.push({
        body: init?.body?.toString() ?? null,
        headers: new Headers(init?.headers),
        method: init?.method ?? "GET",
        url: url.toString()
      });

      return Response.json({ ok: true, value: [], errors: {} });
    };

    await readConversationsFromApi({ currentUserPhone: "13800138000", fetcher });
    await createConversationFromSourceToApi({
      currentUserPhone: "13800138000",
      fetcher,
      sourceId: "parent-need-a",
      sourceType: "parent-need"
    });
    await readConversationFromApi({
      conversationId: "conversation-a",
      currentUserPhone: "13800138000",
      fetcher
    });
    await readConversationMessagesFromApi({
      conversationId: "conversation-a",
      currentUserPhone: "13800138000",
      fetcher
    });
    await sendConversationMessageToApi({
      conversationId: "conversation-a",
      currentUserPhone: "13800138000",
      fetcher,
      text: "你好"
    });
    await listContactExchangeRequestsFromApi({
      conversationId: "conversation-a",
      currentUserPhone: "13800138000",
      fetcher
    });
    await readAuthorizedContactProfilesFromApi({
      conversationId: "conversation-a",
      currentUserPhone: "13800138000",
      fetcher
    });
    await createContactExchangeRequestFromApi({
      conversationId: "conversation-a",
      currentUserPhone: "13800138000",
      fetcher
    });
    await approveContactExchangeRequestFromApi({
      currentUserPhone: "13800138000",
      fetcher,
      requestId: "exchange-a",
      secondConfirmation: true
    });
    await rejectContactExchangeRequestFromApi({
      currentUserPhone: "13800138000",
      fetcher,
      requestId: "exchange-a"
    });
    await withdrawContactExchangeRequestFromApi({
      currentUserPhone: "13800138000",
      fetcher,
      requestId: "exchange-a"
    });

    expect(calls.map((call) => call.method)).toEqual([
      "GET",
      "POST",
      "GET",
      "GET",
      "POST",
      "GET",
      "GET",
      "POST",
      "POST",
      "POST",
      "POST"
    ]);
    expect(calls.every((call) =>
      call.headers.get("x-ungradu-test-user-phone") === null
    )).toBe(true);
    expect(calls[0].url).toBe("/api/conversations");
    expect(calls[1].url).toBe("/api/conversations");
    expect(calls[1].body).toBe(JSON.stringify({
      sourceId: "parent-need-a",
      sourceType: "parent-need"
    }));
    expect(calls[2].url).toBe("/api/conversations/conversation-a");
    expect(calls[3].url).toBe("/api/conversations/conversation-a/messages");
    expect(calls[5].url).toBe("/api/contact-exchange?conversationId=conversation-a");
    expect(calls[6].url).toBe(
      "/api/contact-exchange?conversationId=conversation-a&view=authorized-profiles"
    );
    expect(calls[8].body).toBe(JSON.stringify({
      action: "approve",
      requestId: "exchange-a",
      secondConfirmation: true
    }));
    expect(calls.filter((call) => call.method === "POST").every(
      (call) => call.headers.get("x-ungrade-csrf") === "chat-post-proof"
    )).toBe(true);
  });
});
