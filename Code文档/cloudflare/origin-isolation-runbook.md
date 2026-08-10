# CloudBase origin isolation rollout

This runbook prepares the approved staged origin-isolation change. It does not authorize an immediate production deploy.

## Fixed contract

- Private request header: `x-ungrade-origin-verify`.
- Cloudflare Worker primary secret binding: `ORIGIN_VERIFY_SECRET`.
- CloudBase application primary secret: `ORIGIN_VERIFY_SECRET`.
- CloudBase temporary previous secret: `ORIGIN_VERIFY_SECRET_PREVIOUS` (server-side only; remove before final readiness).
- CloudBase mode: `ORIGIN_VERIFY_MODE=off|observe|enforce`.
- Never store or print the secret in Git, deployment notes, screenshots, shell history, application logs, or responses.
- The Worker removes any client-supplied header with the same name before adding the platform secret.

## Current zero-user window override (2026-08-10)

The business owner has withdrawn the former fixed Beijing `00:00-01:00` window because the production service currently has no users. While that zero-user condition and the controlled synthetic-test scope remain explicitly valid, deployment and controlled production testing may be performed at any time. This changes only the clock constraint; it does not remove any safety gate below.

- Before every change, confirm the previous CloudBase revision and previous Worker deployment, an executable rollback path, masked-only Secret presence, a non-sensitive synthetic acceptance account/data set, monitoring, and stop conditions.
- CloudBase must be deployed and shown healthy first. The reviewed rotation keeps effective enforcement; it does not use `observe`/`off` as a routine rollback or rotation step. The Worker is deployed only after the CloudBase health evidence is captured.
- When real users appear or formal public promotion begins, the project owner must freeze a new release window before further production changes.

## Preconditions

1. During the current zero-user phase, no fixed clock window is required; outside that phase, use a release window frozen by the project owner.
2. Confirm access to both the Cloudflare Worker secret settings and the CloudBase production secret/environment settings.
3. Prepare the previous Worker deployment and previous CloudBase revision for rollback.
4. Prepare a dedicated non-sensitive acceptance account. Do not use real minors, contact details, or complaint content.
5. Confirm monitoring can distinguish `valid`, `missing`, `invalid`, and `misconfigured` events without logging the secret, cookies, query strings, request bodies, or IP addresses.

If any precondition is missing, remain `WAITING_ACCESS` or `WAITING_PRECONDITIONS`; do not generate an orphan secret and do not deploy.

## Machine-selected rotation contracts

The release checklist carries only non-secret classification inputs:

- `ORIGIN_OLD_SECRET_EXPOSURE=exposed|not-exposed`.
- `ORIGIN_ROTATION_STRATEGY=hard-cut|overlap`.
- The transition gate is run separately with `node scripts/production-readiness-check.mjs --phase transition`; final readiness is `npm run release:production:preflight --silent` and always requires an empty previous slot.

These checks consume process environment names and non-secret classifications only; they do not connect to CloudBase/Cloudflare and do not bind a deployment automatically. A passing local release artifact must still be paired with the platform's revision, Worker deployment, health, and rollback evidence.

The inputs are mutually exclusive. `exposed` requires `hard-cut` and never permits `ORIGIN_VERIFY_SECRET_PREVIOUS`; `not-exposed` requires `overlap` for its transition and may temporarily use the previous slot. Missing or unknown inputs fail closed. The current console display of the old Origin Secret is classified as `exposed`; it must not be relabeled `not-exposed` to preserve a no-interruption plan.

The `mode` used by `api-utils` is the application write-request Origin/CSRF guard. It is not the Worker-to-CloudBase header-secret validator; passing one does not prove the other. `observe`/`off` are not rotation or rollback strategies.

## Contract A: old value not exposed — overlap transition

Use this only when the old value has not been exposed. Keep `ORIGIN_VERIFY_MODE=enforce` throughout.

| Step | CloudBase accepted set | Worker sends | Expected result | Stop condition |
| --- | --- | --- | --- | --- |
| A1 | old primary only | old | health and synthetic requests 2xx; direct requests without the header 403 | Any baseline mismatch or missing rollback evidence |
| A2 | new primary + old previous | old | 2xx; new revision healthy | Any 5xx, 403 for old, or previous slot not recorded as temporary |
| A3 | new primary + old previous | new | 2xx; old direct header remains accepted only for the overlap window | Any new-primary failure or secret disclosure |
| A4 | new primary only | new | 2xx; old header 403; readiness passes | Previous remains, health/monitoring fails, or unexpected data change |

Forward order is A1 → A2 → A3 → synthetic checks → A4 → revoke the old provider secret. The Worker never receives or stores the previous value. Capture non-sensitive status and revision evidence at every step.

Rollback for Contract A first restores an accepted overlap (new primary + old previous, or old primary + new previous as appropriate), then switches the Worker to the matching old value, verifies 2xx/direct-origin rejection, and only then converges CloudBase to the single old primary. Do not switch to `observe`/`off`. If the overlap cannot be restored, stop and retain the last known-good pair; do not guess at a one-sided change.

## Contract B: old value exposed — coordinated hard cut

The current console exposure requires this contract. Do not configure `ORIGIN_VERIFY_SECRET_PREVIOUS`; the brief outage during the pair switch is expected and must be bounded by the stop condition.

| Step | CloudBase accepted set | Worker sends | Expected result | Stop condition |
| --- | --- | --- | --- | --- |
| B1 | old primary only | old | baseline 2xx; direct requests without the header 403 | Baseline or rollback evidence missing |
| B2 | new primary only | old | short, expected 403 while the pair is mismatched | Any 5xx, prolonged 403, or evidence/monitoring failure |
| B3 | new primary only | new | 2xx; direct requests without the header 403 | New pair does not recover immediately or any secret disclosure |
| B4 | new primary only | new | synthetic checks and final readiness pass; previous is absent | Any legacy old-value acceptance or readiness failure |

Forward order is B1 → B2 → B3 → synthetic checks → B4 → revoke the old exposed value. Never use the old exposed value as a previous slot or as a routine rollback configuration.

Rollback for Contract B is another coordinated hard cut: set CloudBase to the old primary only, accept the short mismatch 403, then switch the Worker to the old value and verify recovery. After recovery, the exposed old value is emergency material only; the rotation is still not closed and must be restarted with a new secret. Do not claim zero interruption and do not fall back to `observe`/`off`.

## Mandatory rollback

Start rollback within five minutes if any approved trigger occurs: two consecutive critical-page failures 60 seconds apart, anonymous feedback GET not returning 401, acceptance feedback submission failing, Worker requests receiving 403, spoofed headers bypassing replacement, or any secret disclosure.

Rollback order is fixed but follows the selected contract:

1. Restore the last known-good CloudBase revision and its accepted-secret state. Contract A first restores a valid overlap; Contract B restores the old primary as a hard cut and explicitly accepts the bounded mismatch 403.
2. Switch the Worker to the matching value only after that accepted state is healthy, then verify Worker and direct-origin rejection behavior.
3. Re-run the route, authentication, redirect, TLS, header, and feedback checks.
4. Contract A may then converge CloudBase to the single old primary. Contract B remains an exposed-value incident and must restart rotation with a new secret after recovery.

Never switch production to `observe`/`off` as a routine rotation or rollback step.

Do not reverse this order. Cancel the rollout if cumulative unavailability may exceed five minutes.
