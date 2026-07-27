import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const pageSource = fs.readFileSync(
  path.join(root, "app", "customer-service", "page.tsx"),
  "utf8"
);
const chatSource = fs.readFileSync(
  path.join(root, "features", "customer-service", "customer-service-chat.tsx"),
  "utf8"
);
const globalCss = fs.readFileSync(path.join(root, "app", "globals.css"), "utf8");

describe("approved customer-service visual contract", () => {
  it("uses the frozen native section visuals without removing live controls", () => {
    expect(pageSource).toContain("customer-service-native-static-reference");
    expect(globalCss).toContain("customer-service-background.png");
    expect(globalCss).toContain("customer-service-static-header.png");
    expect(globalCss).toContain("customer-service-static-info.png");
    expect(globalCss).toContain("customer-service-static-side.png");
    expect(globalCss).toContain("customer-service-static-chat-frame.png");
    expect(globalCss).toContain("customer-service-static-welcome.png");
    expect(globalCss).toContain("customer-service-static-chip-1.png");
    expect(globalCss).toContain("customer-service-static-chip-5.png");
    expect(globalCss).toContain("customer-service-static-input.png");
    expect(globalCss).toContain("customer-service-static-send.png");
    expect(chatSource).toContain("customer-service-compose");
    expect(chatSource).toContain("customer-service-quick-list");
  });

  it("switches from the frozen pristine state to live dynamic messages", () => {
    expect(chatSource).toContain('data-chat-state={isPristine ? "pristine" : "active"}');
    expect(chatSource).toContain("const isPristine = messages.length === 1");
    expect(chatSource).toContain('data-has-input={input.length > 0 ? "true" : "false"}');
    expect(globalCss).toContain('[data-chat-state="pristine"]');
    expect(globalCss).toContain('[data-chat-state="active"]');
  });

  it("keeps Dify display copy removed and the five approved quick questions", () => {
    expect(pageSource).not.toMatch(/Dify|NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL/);
    const quickQuestionBlock = chatSource.match(
      /const quickQuestions = \[([\s\S]*?)\];/
    )?.[1] ?? "";
    expect(quickQuestionBlock.match(/".+？"/g)).toHaveLength(5);
  });
});
