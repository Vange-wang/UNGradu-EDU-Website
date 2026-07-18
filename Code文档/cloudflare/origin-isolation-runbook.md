# CloudBase origin isolation rollout

This runbook prepares the approved staged origin-isolation change. It does not authorize an immediate production deploy.

## Fixed contract

- Private request header: `x-ungrade-origin-verify`.
- Cloudflare Worker secret binding: `ORIGIN_VERIFY_SECRET`.
- CloudBase application secret: `ORIGIN_VERIFY_SECRET` with the same value.
- CloudBase mode: `ORIGIN_VERIFY_MODE=off|observe|enforce`.
- Never store or print the secret in Git, deployment notes, screenshots, shell history, application logs, or responses.
- The Worker removes any client-supplied header with the same name before adding the platform secret.

## Preconditions

1. Execute production changes only during Beijing time 00:00-01:00.
2. Confirm access to both the Cloudflare Worker secret settings and the CloudBase production secret/environment settings.
3. Prepare the previous Worker deployment and previous CloudBase revision for rollback.
4. Prepare a dedicated non-sensitive acceptance account. Do not use real minors, contact details, or complaint content.
5. Confirm monitoring can distinguish `valid`, `missing`, `invalid`, and `misconfigured` events without logging the secret, cookies, query strings, request bodies, or IP addresses.

If any precondition is missing, remain `WAITING_WINDOW` or `WAITING_ACCESS`; do not generate an orphan secret and do not deploy.

## Phase 1: 24-hour observation

1. Generate one cryptographically strong random secret directly into an approved platform secret manager or password manager.
2. Save the same value as a masked/encrypted secret in Cloudflare and CloudBase. Do not save it in a local file or command history.
3. Deploy the CloudBase application with `ORIGIN_VERIFY_MODE=observe` first. Do not change the Worker yet.
4. Verify direct CloudBase requests remain unchanged while logs record `missing` without secret values.
5. Observe for 24 hours and classify expected Worker traffic versus known direct-origin traffic.

## Phase 2: Worker header injection, 30-minute gray period

1. During 00:00-01:00, confirm the Cloudflare secret binding exists without reading its value back.
2. Deploy the Worker code that strips the client header and injects `ORIGIN_VERIFY_SECRET` upstream.
3. Keep CloudBase in `observe` mode for 30 minutes.
4. Verify twice: `/`, `/rules`, `/feedback` return 200; anonymous `GET /api/feedback` returns 401; www preserves path/query in its 308 redirect; HTTP redirects to HTTPS; TLS 1.0 is rejected; security headers remain; no implementation or origin-secret header leaks.
5. With the acceptance account, submit one non-sensitive feedback record and verify it succeeds.
6. Send a client-controlled fake `x-ungrade-origin-verify` header through the public domain and confirm the origin records `valid`, proving the Worker replaced it rather than forwarding it.

## Phase 3: enforce and monitor

1. Only after the gray checks pass, change CloudBase to `ORIGIN_VERIFY_MODE=enforce`.
2. Confirm direct CloudBase requests without the secret return 403, while Worker requests remain healthy.
3. Monitor for 30 minutes.

## Mandatory rollback

Start rollback within five minutes if any approved trigger occurs: two consecutive critical-page failures 60 seconds apart, anonymous feedback GET not returning 401, acceptance feedback submission failing, Worker requests receiving 403, spoofed headers bypassing replacement, or any secret disclosure.

Rollback order is fixed:

1. Set CloudBase back to `ORIGIN_VERIFY_MODE=observe` or `off` so missing secrets no longer return 403.
2. Verify direct-origin access is restored.
3. Roll back the Worker to the previous deployment.
4. Re-run the full route, authentication, redirect, TLS, header, and feedback checks.

Do not reverse this order. Cancel the rollout if cumulative unavailability may exceed five minutes.
