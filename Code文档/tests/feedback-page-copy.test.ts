import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  join(process.cwd(), "app", "feedback", "page.tsx"),
  "utf8"
);

describe("feedback page copy", () => {
  it("keeps feedback as an in-site record flow without service promises", () => {
    expect(pageSource).toContain("提交风险反馈");
    expect(pageSource).toContain("反馈仅用于记录排查");
    expect(pageSource).not.toContain("issues/new");
    expect(pageSource).not.toContain("客服会立即联系");
    expect(pageSource).not.toContain("工作日内处理");
    expect(pageSource).not.toContain("平台会介入裁决");
    expect(pageSource).not.toContain("必定退款");
  });
});
