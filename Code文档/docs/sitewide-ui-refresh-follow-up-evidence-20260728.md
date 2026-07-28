# Sitewide UI refresh follow-up evidence index

Task: `SITEWIDE-UI-REFRESH-20260727-001`

Branch: `codex/sitewide-ui-refresh-20260727`

Rejected baseline: `27361175310fa84af25b207a2f1ee4a883af8248`

Status: developer rework evidence ready for independent UI review; not merged and not deployed.

## Evidence roots

- Frozen-reference and final local production-mode evidence:
  `C:\Users\86166\.codex\visualizations\2026\07\17\019f70ec-6331-7083-aecb-bb8484511518\sitewide-followup-rework\final-production-20260728`
- Interaction states:
  `C:\Users\86166\.codex\visualizations\2026\07\17\019f70ec-6331-7083-aecb-bb8484511518\sitewide-followup-rework\green-interactions`
- Full keyboard traversal:
  `C:\Users\86166\.codex\visualizations\2026\07\17\019f70ec-6331-7083-aecb-bb8484511518\sitewide-followup-rework\keyboard-audit`
- Initial red reproductions:
  `C:\Users\86166\.codex\visualizations\2026\07\17\019f70ec-6331-7083-aecb-bb8484511518\sitewide-followup-rework\red-baseline`

## Six-page default-state index

| Page | Frozen-native actual/geometry | 1536×1024 actual/geometry | 390×844 actual/geometry | Native overlay/diff/MAE prefix |
| --- | --- | --- | --- | --- |
| Home | `home-native` | `home1536` | `home390` | `comparisons-native\home-*` |
| Login | `login-native` | `login1536` | `login390` | `comparisons-native\login-*` |
| Rules | `rules-native` | `rules1536` | `rules390` | `comparisons-native\rules-*` |
| Customer service | `customer1536` | `customer1536` | `customer390` | `comparisons-native\customer-service-*` |
| Tutor profiles | `tutor1536` | `tutor1536` | `tutor390` | `comparisons-native\tutor-profiles-*` |
| Parent needs | `parent1536` | `parent1536` | `parent390` | `comparisons-native\parent-needs-*` |

For requested responsive comparison artifacts, use `comparisons-responsive-derived`. Its frozen-reference images are center-cover derivatives recorded in `responsive-derived-references`; they preserve traceability but are not substitutes for a missing frozen mobile design.

## Interaction-state index

- Home focus:
  `home-home-focus-parent-entry-1536x1024`,
  `home-home-focus-parent-entry-390x844`
- Login:
  `login-none-1536x1024`, `login-none-390x844`,
  `login-login-toggle-password-1536x1024`,
  `login-login-toggle-password-390x844`
- Rules:
  `rules-rules-focus-home-1536x1024`,
  `rules-rules-focus-home-390x844`
- Customer service:
  `customer-service-none-*`,
  `customer-service-activate-first-question-*` (Enter),
  `customer-service-activate-first-question-space-*` (Space),
  `customer-service-customer-manual-send-*`,
  `customer-service-customer-scroll-history-*`
- Tutor public real data:
  `tutor-profiles-tutor-apply-subject-filter-1536x1024`,
  `tutor-profiles-tutor-apply-subject-filter-390x844`
- Parent public real data:
  `parent-needs-parent-apply-subject-filter-1536x1024`,
  `parent-needs-parent-apply-subject-filter-390x844`

Every interaction folder contains viewport/full-page screenshots and a geometry/network JSON record. Public-data records store only provenance/count/status and do not copy contact data into the evidence index.

## Network and accessibility interpretation

- Production-mode captures contain no unexpected 4xx/5xx, missing assets, runtime exceptions, or horizontal overflow.
- Anonymous `GET /api/auth/session` 401 is expected and is the only retained error-class response.
- Keyboard-audit JSON files record every Tab stop's tag/type/href, geometry, opacity, outline, and shadow. Links use Enter semantics; buttons use Enter/Space semantics, with both activation paths explicitly exercised on the customer-service question control.

## Remaining gate

The evidence package is ready for independent UI review. It is not evidence of merge, deployment, Issue closure, or user acceptance.

## Focused SERIOUS-1 / SERIOUS-2 remediation after `97ad27b3`

Independent UI review found two blocking interaction-state defects in
`97ad27b3ff3268a0d25603db2e7f3ff3eae8fca9`. The focused remediation evidence
root is:

`C:\Users\86166\.codex\visualizations\2026\07\17\019f70ec-6331-7083-aecb-bb8484511518\sitewide-followup-rework\serious-01-02-fix-20260728`

Direct screenshots:

- Customer-service 21-message desktop scroll:
  `serious-1-customer-history-desktop-final.png`
- Customer-service 21-message mobile scroll:
  `serious-1-customer-history-mobile-final.png`
- Tutor public-real-data desktop live result:
  `serious-2-tutor-label-desktop-final.png`
- Tutor public-real-data mobile live result:
  `serious-2-tutor-label-mobile-final.png`

Geometry and interaction records:

- Customer service desktop:
  `customer-service-scroll-1536x1024-final3`; the message viewport stays at
  `clientHeight=473`, while `scrollHeight=1637` and `scrollTop=160`.
  The welcome item remains a real `101px` flow item, the absolute pseudo layer
  is `none`, and the measured adjacent-message overlap count is `0`.
- Customer service mobile:
  `customer-service-scroll-390x844-final3`; `clientHeight=315`,
  `scrollHeight=2268`, `scrollTop=160`, welcome flow height `95.0625px`,
  overlap count `0`, and document overflow `0`.
- Tutor profiles desktop:
  `tutor-profiles-live-1536x1024-final2`; the public-real-data fetch records
  HTTP `200`, one result, a real opaque detail ID, and the full `老师资料` label
  at `106px` width with `white-space: nowrap`.
- Tutor profiles mobile:
  `tutor-profiles-live-390x844-final2`; public-real-data HTTP `200`, the full
  `老师资料` label remains visible, and document overflow is `0`.

The capture harness now creates an `about:blank` target, installs the public-data
fetch override, and only then navigates to the page. This removes the
pre-instrumentation local API request from the evidence. The only retained
error-class network response is the existing anonymous
`GET /api/auth/session` `401`.

The `regression` directory contains 22 fresh viewport/full-page/geometry/network
sets covering the six default pages at 1536×1024 and 390×844, home focus,
login password mode, rules focus, customer Enter/Space/manual-send, and parent
public-real-data live filtering. Every set has one main page node and zero
horizontal overflow. The new customer-service default captures are byte-for-byte
identical to the previously approved default captures at both viewports.

This focused package is developer-side rework evidence only. The two independent
UI findings require a fresh independent review; no merge, deployment, Issue
transition, or user acceptance is implied.

## Filter outer-edge single-point remediation after `cd086f3a`

The evidence root for the user-requested pale-outline removal is:

`C:\Users\86166\.codex\visualizations\2026\07\17\019f70ec-6331-7083-aecb-bb8484511518\sitewide-followup-rework\filter-edge-pixel-fix-20260728`

The initial asset contract proved that both 415×882 filter slices were fully
opaque and retained captured background pixels outside their rounded black
frames. After those pixels were made transparent, a fresh page capture proved
that the two 1536×1024 background assets also contained the same pale panel
backing four pixels outside the filter slice bounds. This was the evidence-gated
exception that required editing the two background PNGs; no CSS, TSX, component,
layout, text, control, or other page asset changed.

Approved pixel boundary:

- Tutor filter slice: 403 exterior pixels became transparent; its complete RGB
  byte stream still hashes to
  `587746b19ba9e5ad8b066325ebeb83559b4c04e2de7509ce54f49bc252d1c807`.
- Parent filter slice: 390 exterior pixels became transparent; its complete RGB
  byte stream still hashes to
  `3b4a3f02cb76c5491dfe8384a77c4885cea0395310451dc9eca876ee93255857`.
- Tutor background: only the 10,843 pixels exposed outside the black frame were
  rebuilt from their nearest exterior gradient sample.
- Parent background: only the 10,830 pixels exposed outside the black frame were
  rebuilt the same way.
- Desktop before/after comparison changed 10,837 tutor pixels and 10,818 parent
  pixels. Both changed bounding boxes are exactly `x=137..559, y=83..972`;
  changed pixels outside the approved exterior mask are `0`.
- The black frame and every pixel inside it are therefore byte-identical to the
  `cd086f3a` page capture.

Direct visual evidence:

- Final tutor desktop:
  `final-captures\tutor-default-1536x1024\tutor-profiles-1536x1024-viewport.png`
- Final parent desktop:
  `final-captures\parent-default-1536x1024\parent-needs-1536x1024-viewport.png`
- Before/after/diff crops:
  `tutor-filter-before-crop.png`, `tutor-filter-after-crop.png`,
  `tutor-filter-diff-crop.png`, and the corresponding `parent-filter-*` files.
- Nearest-neighbor 10× corner evidence:
  `tutor-filter-before-top-left-10x.png`,
  `tutor-filter-after-top-left-10x.png`, and the corresponding parent files.
- Machine-readable boundary proof: `pixel-diff-metrics.json`.

Responsive and interaction evidence:

- `final-captures` contains fixture and public-real-data viewport/full-page/
  geometry records for both pages at 1536×1024 and 390×844.
- Public-real-data subject filtering returned HTTP 200 at both widths; document
  horizontal overflow is `0`.
- `reset-regression\reset-summary.json` records a real `数学` filter followed by
  Reset for both pages: final subject and query string are empty, result state is
  `live`, public-data status is HTTP 200, and horizontal overflow is `0`.
- `browser-network-console-summary.json` records no unexpected network or
  console errors. The only error-class request is the pre-existing anonymous
  `GET /api/auth/session` HTTP 401 boundary.
- Fresh default screenshots for Home, Login, Rules, and Customer Service match
  the `cd086f3a` regression screenshots byte-for-byte; hashes are in
  `unchanged-page-hashes.json`.

Engineering gates:

- Red asset contract: 2 background tests failed with a maximum channel
  discontinuity of 14; after the minimal repair, all 4 asset tests pass and the
  preserved-pixel hashes remain unchanged.
- `npm run typecheck` and `npm run lint`: exit 0.
- Full isolated test run: 234 pass / 1 fail; the sole failure is the known
  missing untracked S2 operations-document fixture. Excluding only that file:
  59 files / 233 tests pass. The exact operations test passes 2/2 in the
  original worktree without modifying it.
- `npm run build`: exit 0 with 31 static pages. The only warning is the known
  Windows `EPERM` when the standalone collector encounters the shared
  `node_modules` junction.
- No production deployment, Cloudflare/CloudBase/DNS/Secret/Issue change, or
  user-acceptance claim is included.
