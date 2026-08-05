import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  ChatMessagePanel,
  scrollMessageListToLatest
} from "@/features/chat/chat-message-panel";

describe("聊天消息面板自动滚动", () => {
  it("首次进入或收到新消息时滚动到消息历史底部", () => {
    const messageList = {
      scrollHeight: 2_400,
      scrollTop: 0
    };

    scrollMessageListToLatest(messageList);

    expect(messageList.scrollTop).toBe(2_400);
  });

  it("关联发布删除后保留历史区并禁用输入框和发送按钮", () => {
    const html = renderToStaticMarkup(createElement(ChatMessagePanel, {
      authorizedProfiles: false,
      messages: [{
        id: "message-a",
        conversationId: "conversation-a",
        direction: "received",
        text: "删除前消息仍可读",
        createdAt: "2026-08-01T00:00:00.000Z"
      }],
      messageText: "",
      onMessageTextChange: () => undefined,
      onSubmit: () => undefined,
      readOnly: true
    }));

    expect(html).toContain("删除前消息仍可读");
    expect(html).toContain("关联发布已删除");
    expect(html).toMatch(/<textarea[^>]*disabled=""/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>发送<\/button>/);
  });
});
