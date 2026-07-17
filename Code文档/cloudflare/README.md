# Cloudflare Worker temporary reverse proxy

This folder contains a no-secret Worker example for temporarily proxying a Cloudflare free domain or custom domain to the current CloudBase default production domain.

## Dashboard paste version

Use `worker.js` when editing directly in the Cloudflare Dashboard online editor. Do not paste `worker.ts` into the Dashboard editor; it contains TypeScript-only syntax such as `type Env`, which causes `Unexpected identifier 'Env'`.

Shortest Dashboard path:

1. Open Cloudflare Dashboard -> Workers & Pages -> your Worker -> Edit Code.
2. Replace the whole editor content with `Code文档/cloudflare/worker.js`.
3. Click Save and Deploy.
4. Open the Worker URL and check `/`, `/rules`, `/feedback`, and `/api/feedback`.

`worker.js` has the CloudBase default production domain as a no-secret fallback. If you prefer using an environment variable, keep `UPSTREAM_ORIGIN` set to the same CloudBase origin below.

## Required Cloudflare settings

- Worker environment variable: `UPSTREAM_ORIGIN=https://ungradu-edu-prod-275285-6-1445807473.sh.run.tcloudbase.com`
- Route or domain: enable `workers.dev` for a temporary free domain, or bind a Cloudflare-managed custom domain/route to this Worker.
- TLS: keep Cloudflare SSL/TLS enabled. Do not disable HTTPS.
- Secrets: no secret is required for this reverse proxy. Do not add CloudBase keys, session secrets, SMTP secrets, or TencentCloud keys to the Worker.

## What the Worker does

- Preserves request path and query string when proxying to CloudBase.
- Rewrites `Host` to the CloudBase origin host.
- Drops forwarded client/origin headers that are unnecessary for this temporary proxy.
- Removes common upstream implementation headers such as `Server` and `X-Powered-By`.
- Adds conservative security headers aligned with `next.config.ts`.

## Limits

This is a temporary reverse-proxy layer. The CloudBase default production domain can still be accessed directly if users know it. The stronger long-term setup is a formal custom domain with ICP readiness where required, CloudBase custom-domain binding, and origin-side restrictions that make the default domain non-public or non-authoritative.
