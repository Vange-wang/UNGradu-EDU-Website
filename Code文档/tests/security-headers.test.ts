import { describe, expect, it } from "vitest";

import nextConfig from "@/next.config";
import { createContentSecurityPolicy } from "@/server/security/content-security-policy";

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
              value: "max-age=31536000; includeSubDomains"
            }
          ])
        })
      ])
    );
  });

  it("keeps the CSP compatible with Next.js while blocking framing by other origins", async () => {
    const csp = createContentSecurityPolicy("synthetic-request-nonce");

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'nonce-synthetic-request-nonce'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp.split(";").every((directive) => !directive.includes("'unsafe-inline'"))).toBe(true);
    expect(csp).toContain("style-src 'self' 'nonce-synthetic-request-nonce'");
    expect(csp).toContain("style-src-attr 'unsafe-hashes'");
    expect(csp).toContain("'sha256-zlqnbDt84zf1iSefLU/ImC54isoprH/MRiVZGskwexk='");
    expect(csp).toContain("'sha256-32t0bJPIyxns/QqsW8RE3JGUERKnHL5RygHBgJvEanc='");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });
});
