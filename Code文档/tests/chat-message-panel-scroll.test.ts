import { describe, expect, it } from "vitest";

import { scrollMessageListToLatest } from "@/features/chat/chat-message-panel";

describe("聊天消息面板自动滚动", () => {
  it("首次进入或收到新消息时滚动到消息历史底部", () => {
    const messageList = {
      scrollHeight: 2_400,
      scrollTop: 0
    };

    scrollMessageListToLatest(messageList);

    expect(messageList.scrollTop).toBe(2_400);
  });
});
