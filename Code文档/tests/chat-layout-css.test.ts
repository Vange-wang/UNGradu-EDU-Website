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

  it("prioritizes customer service chat controls on mobile", () => {
    expect(globalsCss).toMatch(/\.customer-service-main\s*\{\s*order:\s*-1;/);
    expect(globalsCss).toMatch(
      /\.customer-service-messages\s*\{\s*height:\s*clamp\((?:300|306)px,\s*38dvh,\s*340px\);/
    );
    expect(globalsCss).not.toContain(".customer-service-dify-frame");
  });

  it("constrains customer service history to its own scroll region", () => {
    const messagesRule = readRule(".customer-service-messages");

    expect(messagesRule).toMatch(/(?:height|max-height):/);
    expect(messagesRule).toContain("min-height: 0");
    expect(messagesRule).toContain("overflow-y: auto");
    expect(messagesRule).toContain("overflow-x: hidden");
    expect(messagesRule).toContain("overscroll-behavior: contain");
    expect(messagesRule).toContain("touch-action: pan-y");
  });

  it("keeps the customer service workspace dense without wrapping quick questions", () => {
    const layoutRule = readRule(".customer-service-layout");
    const messageTextRule = readRule(".customer-service-message p");
    const quickListRule = readRule(".customer-service-quick-list");
    const quickButtonRule = readRule(".customer-service-quick-list button");

    expect(layoutRule).toContain(
      "grid-template-columns: minmax(220px, 24%) minmax(0, 1fr)"
    );
    expect(messageTextRule).toContain("font-size: 14px");
    expect(quickListRule).toContain("flex-wrap: nowrap");
    expect(quickListRule).toContain("overflow-x: auto");
    expect(quickListRule).toContain("touch-action: pan-x");
    expect(quickButtonRule).toContain("flex: 0 0 auto");
    expect(quickButtonRule).toContain("min-height: 40px");
    expect(quickButtonRule).toContain("white-space: nowrap");
  });
});
