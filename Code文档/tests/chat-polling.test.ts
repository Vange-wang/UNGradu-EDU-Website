import { describe, expect, it } from "vitest";

import { CHAT_POLLING_INTERVAL_MS } from "@/features/chat/chat-polling";

describe("chat polling", () => {
  it("keeps local chat refresh interval within the five second M4 requirement", () => {
    expect(CHAT_POLLING_INTERVAL_MS).toBeGreaterThan(0);
    expect(CHAT_POLLING_INTERVAL_MS).toBeLessThanOrEqual(5000);
  });
});
