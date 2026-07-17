import { describe, expect, it } from "vitest";

import nextConfig from "@/next.config";

describe("security response headers", () => {
  it("applies conservative security headers to all Next.js routes", async () => {
    const headersConfig = await nextConfig.headers?.();

    expect(headersConfig).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "/:path*",
          headers: expect.arrayContaining([
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "X-Frame-Options", value: "DENY" },
            {
              key: "Strict-Transport-Security",
              value: "max-age=86400"
            }
          ])
        })
      ])
    );
  });

  it("keeps the CSP compatible with Next.js while blocking framing by other origins", async () => {
    const headersConfig = await nextConfig.headers?.();
    const allHeaders = headersConfig?.flatMap((entry) => entry.headers) ?? [];
    const csp = allHeaders.find((header) => header.key === "Content-Security-Policy")?.value;

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });
});
