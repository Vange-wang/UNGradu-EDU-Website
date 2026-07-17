# Cloudflare Worker temporary reverse proxy

This folder contains a no-secret Worker example for temporarily proxying a Cloudflare free domain or custom domain to the current CloudBase default production domain.

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
