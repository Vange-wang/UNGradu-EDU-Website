# Cloudflare Worker temporary reverse proxy

This folder contains a no-secret Worker example for proxying the public custom domain to the current CloudBase default production domain.

## Public domain policy

- Canonical public domain: `https://ungradeedu.eu.cc`
- `https://www.ungradeedu.eu.cc` redirects permanently to the canonical root domain while preserving path and query string.
- Fallback only: `https://ungradu-edu-proxy.vangewang0919.workers.dev/`
- Keep the existing `workers.dev` resource enabled. Do not delete it or promote it as the primary public URL.
- The CloudBase URL remains the upstream origin, not a public URL to promote.

## Dashboard paste version

Use `worker.js` when editing directly in the Cloudflare Dashboard online editor. Do not paste `worker.ts` into the Dashboard editor; it contains TypeScript-only syntax such as `type Env`, which causes `Unexpected identifier 'Env'`.

Shortest Dashboard path:

1. Open Cloudflare Dashboard -> Workers & Pages -> your Worker -> Edit Code.
2. Replace the whole editor content with `Code文档/cloudflare/worker.js`.
3. Click Save and Deploy.
4. Open the Worker fallback URL and check `/`, `/rules`, `/feedback`, and `/api/feedback`.

`worker.js` has the CloudBase default production domain as a no-secret fallback. If you prefer using an environment variable, keep `UPSTREAM_ORIGIN` set to the same CloudBase origin below.

## Required Cloudflare settings

- Worker environment variable: `UPSTREAM_ORIGIN=https://ungradu-edu-prod-275285-6-1445807473.sh.run.tcloudbase.com`
- Worker name: `ungradu-edu-proxy`.
- Keep `workers.dev` enabled as a fallback.
- The `ungradeedu.eu.cc` zone must be Active in the same Cloudflare account before attaching a Custom Domain.
- Attach both `ungradeedu.eu.cc` and `www.ungradeedu.eu.cc` as Custom Domains to the existing Worker. The Worker redirects `www` to the root domain.
- TLS: keep Cloudflare SSL/TLS enabled. Do not disable HTTPS.
- Secrets: no secret is required for this reverse proxy. Do not add CloudBase keys, session secrets, SMTP secrets, or TencentCloud keys to the Worker.

The executable Wrangler example is `Code文档/cloudflare/wrangler.example.toml`. It declares both Custom Domains and explicitly keeps `workers_dev = true`. Use it only after `wrangler whoami` succeeds for the account that owns an Active `ungradeedu.eu.cc` zone. A deploy changes the existing Worker, so first confirm the Worker name, account, zone, and routes in the dashboard. Do not deploy from an unauthenticated or mismatched account.

Dashboard-only path:

1. Add `ungradeedu.eu.cc` to Cloudflare and change the authoritative nameservers to the pair assigned by Cloudflare.
2. Wait until the zone status is Active and confirm there is no conflicting CNAME on the root or `www` hostname.
3. Open Workers & Pages -> `ungradu-edu-proxy` -> Settings -> Domains & Routes.
4. Add Custom Domain `ungradeedu.eu.cc`.
5. Add Custom Domain `www.ungradeedu.eu.cc`.
6. Keep the existing `workers.dev` route enabled.
7. Wait for both certificates to become active before public promotion.

## What the Worker does

- Preserves request path and query string when proxying to CloudBase.
- Rewrites `Host` to the CloudBase origin host.
- Drops forwarded client/origin headers that are unnecessary for this temporary proxy.
- Removes common upstream implementation headers such as `Server` and `X-Powered-By`.
- Removes upstream implementation headers before returning responses to users, including `X-CloudBase-*`, `X-CloudBaseRun-*`, `X-Upstream-*`, `X-Nextjs-*`, and upstream request IDs.
- Adds conservative security headers aligned with `next.config.ts`.

## Limits

This is a temporary reverse-proxy layer. The CloudBase default production domain can still be accessed directly if users know it. The stronger long-term setup is a formal custom domain with ICP readiness where required, CloudBase custom-domain binding, and origin-side restrictions that make the default domain non-public or non-authoritative.
