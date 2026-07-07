import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  join(process.cwd(), "app", "customer-service", "page.tsx"),
  "utf8"
);

const chatSource = readFileSync(
  join(process.cwd(), "features", "customer-service", "customer-service-chat.tsx"),
  "utf8"
);

const navSource = readFileSync(
  join(process.cwd(), "features", "auth", "session-nav.tsx"),
  "utf8"
);

describe("customer service page copy", () => {
  it("keeps customer service as rule guidance rather than arbitration", () => {
    expect(pageSource).toContain("智能客服");
    expect(pageSource).toContain("不由智能客服裁决");
    expect(pageSource).not.toContain("平台保证退款");
    expect(pageSource).not.toContain("平台担保交易");
    expect(pageSource).not.toContain("客服会立即处理");
  });

  it("keeps the offline customer service chat available on first render", () => {
    expect(pageSource).not.toContain('dynamic = "force-dynamic"');
    expect(pageSource).toContain(`<div className="customer-service-main">
            <CustomerServiceChat />
          </div>`);
    expect(pageSource).toContain("NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL");
    expect(pageSource).toContain("customer-service-dify-entry");
    expect(pageSource).not.toContain("<iframe");
    expect(pageSource).not.toContain("customer-service-dify-frame");
  });

  it("keeps first-screen chat controls usable without Dify", () => {
    expect(chatSource).toContain('aria-label="站内智能客服对话"');
    expect(chatSource).toContain('aria-label="快捷问题"');
    expect(chatSource).toContain('id="customer-service-question"');
    expect(chatSource).toContain('placeholder="输入问题');
  });

  it("adds a top navigation entry for customer service", () => {
    expect(navSource).toContain('href="/customer-service"');
    expect(navSource).toContain("智能客服");
  });
});
