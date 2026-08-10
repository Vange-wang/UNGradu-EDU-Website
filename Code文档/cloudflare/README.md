# Cloudflare Worker temporary reverse proxy

This folder contains the Worker proxy and the staged origin-verification implementation for the current CloudBase production origin.

## Public domain policy

- Canonical public domain: `https://ungraduedu.eu.cc`
- `https://www.ungraduedu.eu.cc` redirects permanently to the new canonical root domain while preserving path and query string.
- Legacy rollback domain: `https://ungradeedu.eu.cc`
- `https://www.ungradeedu.eu.cc` keeps its existing permanent redirect to the legacy root domain, preserving path and query string.
- Do not remove the legacy root or `www` Custom Domain until the new-domain production acceptance and rollback-retention gate are both explicitly complete.
- The existing Worker resource remains, but its public `workers.dev` URL is disabled.
- The CloudBase URL remains the upstream origin, not a public URL to promote.

## Dashboard paste version

Use `worker.js` when editing directly in the Cloudflare Dashboard online editor. Do not paste `worker.ts` into the Dashboard editor; it contains TypeScript-only syntax such as `type Env`, which causes `Unexpected identifier 'Env'`.

Shortest Dashboard path:

1. Open Cloudflare Dashboard -> Workers & Pages -> your Worker -> Edit Code.
2. Replace the whole editor content with `Code文档/cloudflare/worker.js`.
3. Click Save and Deploy.
4. Open both the new canonical domain and retained legacy domain and check `/`, `/rules`, `/feedback`, and `/api/feedback`.

`worker.js` has the CloudBase default production domain as a fallback. Keep `UPSTREAM_ORIGIN` set to the same CloudBase origin. Origin verification additionally uses the masked `ORIGIN_VERIFY_SECRET` binding during the approved staged rollout.

## Required Cloudflare settings

- Worker environment variable: `UPSTREAM_ORIGIN=https://ungradu-edu-prod-275285-6-1445807473.sh.run.tcloudbase.com`
- Worker name: `ungradu-edu-proxy`.
- Keep the Worker resource, but leave its Production Worker URL disabled.
- The `ungraduedu.eu.cc` zone must be Active in the same Cloudflare account before attaching a Custom Domain. The 2026-07-28 handoff reports it Active; re-check the target zone immediately before any production change.
- Attach `ungraduedu.eu.cc` and `www.ungraduedu.eu.cc` as additional Custom Domains to the existing Worker. The Worker redirects the new `www` hostname to the new root domain.
- Keep the existing `ungradeedu.eu.cc` and `www.ungradeedu.eu.cc` Custom Domains unchanged as the rollback entry. The legacy `www` hostname continues redirecting to the legacy root.
- TLS: keep Cloudflare SSL/TLS enabled. Do not disable HTTPS.
- Secret binding: `ORIGIN_VERIFY_SECRET`, added only through the platform secret UI/CLI during the approved window. Do not store it in Wrangler config or Git.
- Do not add CloudBase keys, session secrets, SMTP secrets, or TencentCloud keys to the Worker.

The executable Wrangler example is `Code文档/cloudflare/wrangler.example.toml`. It declares the new root and `www` Custom Domains plus both retained legacy routes, and keeps `workers_dev = false`. Use it only after `wrangler whoami` succeeds for the account that owns the Active `ungraduedu.eu.cc` zone. A deploy changes the existing Worker, so first confirm the Worker name, account, zone, current legacy routes, and proposed new routes in the dashboard. Do not deploy from an unauthenticated or mismatched account.

Dashboard-only path:

1. Confirm `ungraduedu.eu.cc` is Active in Cloudflare and its authoritative nameservers match the independent pair assigned to that zone.
2. Confirm there is no conflicting CNAME on the new root or `www` hostname.
3. Open Workers & Pages -> `ungradu-edu-proxy` -> Settings -> Domains & Routes.
4. Confirm the existing `ungradeedu.eu.cc` and `www.ungradeedu.eu.cc` routes remain present; do not delete or replace them.
5. Add Custom Domain `ungraduedu.eu.cc`.
6. Add Custom Domain `www.ungraduedu.eu.cc`.
7. Keep the existing Worker resource but leave the public Production Worker URL disabled.
8. Wait for both new certificates to become active before public promotion.
9. Verify new `www` redirects to the new root, legacy `www` redirects to the legacy root, and both roots serve the expected application before changing any public promotion.

This repository change is configuration preparation only. Do not deploy it while either new Custom Domain, certificate, or rollback check remains unverified.

## Production gates before promotion

- Confirm both new Custom Domains and their edge certificates are Active without removing either legacy route.
- Reproduce the required zone-level security posture on the new zone; settings on `ungradeedu.eu.cc` do not automatically transfer to `ungraduedu.eu.cc`. Re-check SSL/TLS mode, Always Use HTTPS, Minimum TLS, WAF/Bot controls, and any host-specific rate-limit expression before promotion.
- Deploy only the reviewed Worker commit and verify `/`, `/login`, `/rules`, `/feedback`, and the anonymous API authentication boundaries on both root domains.
- Verify `www.ungraduedu.eu.cc` returns 308 to the new root and `www.ungradeedu.eu.cc` still returns 308 to the legacy root with exact path/query preservation.
- Verify HTTPS enforcement, TLS policy, security headers, upstream-header removal, and origin-verification behavior on the new entry.
- Authentication cookies are host-scoped. A session established on the legacy domain is not proof of a valid session on the new domain; use a non-sensitive acceptance account to verify a fresh new-domain login without exposing credentials.

## What the Worker does

- Preserves request path and query string when proxying to CloudBase.
- Redirects each `www` hostname to its matching root domain, so the legacy rollback entry does not depend on the new zone.
- Rewrites `Host` to the CloudBase origin host.
- Drops forwarded client/origin headers that are unnecessary for this temporary proxy.
- Removes any client-supplied `x-ungrade-origin-verify` header, then injects the masked Worker secret when configured.
- Removes common upstream implementation headers such as `Server` and `X-Powered-By`.
- Removes upstream implementation headers before returning responses to users, including `X-CloudBase-*`, `X-CloudBaseRun-*`, `X-Upstream-*`, `X-Nextjs-*`, and upstream request IDs.
- Adds conservative security headers aligned with `next.config.ts`.
- Removes the private verification header from upstream responses so it cannot be exposed to browsers.

## Origin isolation rollout

The CloudBase application supports `off`, `observe`, and `enforce` modes. `observe` records only method, pathname, mode, status, and reject decision; it does not log the provided or expected secret, cookies, query strings, request bodies, or IP addresses. It is not a routine production rotation or rollback mode.

Follow [`origin-isolation-runbook.md`](./origin-isolation-runbook.md). The release checklist must explicitly set `ORIGIN_OLD_SECRET_EXPOSURE` and `ORIGIN_ROTATION_STRATEGY`: the current console exposure is `exposed` and therefore uses coordinated `hard-cut` (CloudBase new primary, then Worker new primary, with a bounded temporary 403), never a previous slot. Only a verified `not-exposed` case may use the overlap transition. The transition preflight is separate from final readiness; final readiness always requires no previous value. During the current zero-user phase, deployment and controlled testing may happen at any time, but CloudBase health, rollback pair, masked-only secret presence, synthetic data, monitoring, and stop conditions remain mandatory. Freeze a new release window before real users or formal public promotion.

## Limits

This is a temporary reverse-proxy layer. The CloudBase default production domain can still be accessed directly if users know it. The stronger long-term setup is a formal custom domain with ICP readiness where required, CloudBase custom-domain binding, and origin-side restrictions that make the default domain non-public or non-authoritative.
