import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const globalsCss = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function readRule(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = globalsCss.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[^}]*)\\}`));

  return match?.groups?.body ?? "";
}

describe("chat layout CSS", () => {
  it("constrains the D+ chat message list to scroll inside the chat panel", () => {
    const conversationMainRule = readRule(".dplus-chat-page .conversation-main");
    const messageListRule = readRule(".dplus-chat-page .message-list");

    expect(conversationMainRule).toContain("display: grid");
    expect(conversationMainRule).toContain("min-height: 0");
    expect(messageListRule).toContain("max-height:");
    expect(messageListRule).toContain("overflow-y: auto");
    expect(messageListRule).toContain("min-height:");
  });
});
