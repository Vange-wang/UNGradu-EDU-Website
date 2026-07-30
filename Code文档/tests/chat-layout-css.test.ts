import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const globalsCss = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const chatPageSource = readFileSync(
  new URL("../app/chats/[id]/page.tsx", import.meta.url),
  "utf8"
);

function readRule(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = globalsCss.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[^}]*)\\}`));

  return match?.groups?.body ?? "";
}

describe("chat layout CSS", () => {
  it("uses a real grid decoration instead of an absolutely positioned chat pseudo-element", () => {
    expect(chatPageSource).toContain('className="chat-header-decoration"');
    expect(globalsCss).toMatch(
      /\.dplus-chat-page \.wide-panel::before\s*\{[^}]*content:\s*none;/
    );
    expect(globalsCss).toMatch(
      /\.dplus-chat-page \.workspace-header\s*\{[^}]*display:\s*grid;/
    );
  });

  it("uses the enlarged three-column desktop and single-column mobile contract", () => {
    expect(globalsCss).toMatch(
      /\.dplus-chat-page\s*\{[^}]*max-width:\s*1600px;/
    );
    expect(globalsCss).toMatch(
      /\.dplus-chat-page \.conversation-workspace\s*\{[^}]*minmax\(620px, 1fr\)/
    );
    expect(globalsCss).toMatch(
      /@media \(min-width: 981px\) and \(max-width: 1199px\)[\s\S]*?\.conversation-workspace\s*\{\s*grid-template-columns: 1fr;/
    );
    expect(globalsCss).toMatch(
      /@media \(max-width: 720px\)[\s\S]*?\.conversation-main\s*\{[\s\S]*?grid-template-rows: 92px minmax\(0, 1fr\) auto;/
    );
    expect(globalsCss).toMatch(
      /@media \(max-width: 720px\)[\s\S]*?\.chat-compose\s*\{[\s\S]*?min-height: 154px;/
    );
    expect(globalsCss).toMatch(
      /@media \(min-width: 1200px\)[\s\S]*?\.conversation-main\s*\{[^}]*height: 734px;/
    );
    expect(globalsCss).toMatch(
      /@media \(min-width: 1200px\) and \(min-height: 850px\)[\s\S]*?height: 778px;/
    );
    expect(globalsCss).toMatch(
      /@media \(min-width: 1200px\) and \(min-height: 1000px\)[\s\S]*?height: 866px;/
    );
    expect(globalsCss).toMatch(
      /\.dplus-chat-page \.conversation-main\s*\{[^}]*grid-template-rows: 56px minmax\(0, 1fr\) auto;/
    );
    expect(globalsCss).toMatch(
      /\.dplus-chat-page \.message-list\s*\{[^}]*height: auto;[^}]*min-height: 0;/
    );
  });

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
