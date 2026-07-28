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

## Return-button outer-board single-point remediation after `09b1c645`

The evidence root for the user-requested pale-yellow board removal is:

`C:\Users\86166\.codex\visualizations\2026\07\17\019f70ec-6331-7083-aecb-bb8484511518\sitewide-followup-rework\return-edge-pixel-fix-20260728`

The red asset contract established two independent asset layers:

- Both 57×53 return-button slices were fully opaque, so their rounded black
  frames retained captured yellow pixels in the outer corners.
- Both 1536×1024 page backgrounds retained a rectangular pale-yellow backing at
  `x=47..111, y=86..146`, four pixels beyond the positioned return-button slice.

No CSS or TSX change was necessary. The final repair changes alpha only outside
the button's detected black frame and reconstructs only the corresponding
exposed background pixels from the nearest exterior gradient sample.

Approved pixel boundary:

- Tutor return slice: 350 exterior pixels became transparent; its complete RGB
  stream remains
  `ac051994581ace666f71c313d8f60f084def75d6c9fda5de88c6584ae690a23e`.
- Parent return slice: 328 exterior pixels became transparent; its complete RGB
  stream remains
  `9df41ed7a47f53c3eecfab54cb5df77612ea546c8d968571ada1f811a9aa59c6`.
- Tutor background: 1,294 approved pixels rebuilt; the desktop screenshot
  changes 1,293 pixels.
- Parent background: 1,272 approved pixels rebuilt; the desktop screenshot
  changes 1,270 pixels.
- Both screenshot change boxes are exactly `x=47..111, y=86..146`; changed
  pixels outside the approved exterior mask are `0`. The black border, white
  fill, arrow, element geometry, hit target, and all other page pixels are
  therefore unchanged from `09b1c645`.

Direct evidence:

- Final tutor desktop:
  `captures\tutor-default-1536x1024\tutor-profiles-1536x1024-viewport.png`
- Final parent desktop:
  `captures\parent-default-1536x1024\parent-needs-1536x1024-viewport.png`
- Local 8× before/after/diff:
  `tutor-return-before-8x.png`, `tutor-return-after-8x.png`,
  `tutor-return-diff-8x.png`, and the corresponding `parent-return-*` files.
- Machine-readable pixel proof: `return-pixel-diff-metrics.json`.

Regression evidence:

- Both 390×844 page screenshots are byte-for-byte identical to the
  `09b1c645` screenshots; both retain zero horizontal overflow.
- The desktop diff has no changes outside the return-board mask, so the
  previously repaired filter-frame area is byte-identical.
- Home, Login, Rules, and Customer Service default desktop screenshots are
  byte-for-byte identical to their `09b1c645` evidence. All hashes are recorded
  in `unchanged-screenshot-hashes.json`.
- Public-real-data filtering returns HTTP 200 for both marketplaces at desktop
  and mobile widths. `browser-regression-summary.json` records no unexpected
  network or console errors; anonymous `GET /api/auth/session` HTTP 401 remains
  the expected authentication boundary.
- Focus captures preserve return `href="/"` and the existing 3px blue
  `focus-visible` outline. The link box was not changed.

Engineering gates:

- Red: 4/6 focused asset tests failed; return slices had zero transparent
  exterior pixels and background discontinuity was 17.
- Green: 6/6 focused asset tests pass.
- `npm run typecheck` and `npm run lint`: exit 0.
- Full isolated run: 236 pass / 1 known operations-fixture failure. Excluding
  only that file: 59 files / 235 tests pass. The exact operations test passes
  2/2 read-only in the original worktree.
- `npm run build`: exit 0 with 31 static pages; only the known Windows shared
  `node_modules` junction `EPERM` warning remains.
- No production, Cloudflare, CloudBase, DNS, Secret, Issue, or original-worktree
  file was changed.

## ISSUE-0022 default-zoom, asset-delivery, and title remediation

Task: `ISSUE-0022 / SITEWIDE-UI-REFRESH-20260727-001`

Baseline: `79d6775a8d519ea8db36efd0e889e38b3c6acbff`

Evidence root:

`C:\Users\86166\.codex\visualizations\2026\07\17\019f70ec-6331-7083-aecb-bb8484511518\issue-0022-fix`

### Reproducible red evidence and root cause

- The CloudBase-origin probe returned HTTP 403 `text/plain` for direct
  `/assets/sitewide-ui/brand-mark.png` and `home-boy.png`; corresponding
  `/_next/image` requests returned HTTP 400 because the internal image fetch
  could not carry the outer Worker's origin-verification header.
- The pre-fix DPR-1 matrix reproduced the layout at 1536×768 and 1920×974.
  Home, Login, and Rules had no composition cap at common desktop widths;
  the approved source-sized skins only activated inside narrow native viewport
  media windows. Browser zoom changed visible area, not the intrinsic layout.
- The pre-fix live title was a system-font approximation with a 5px stroke and
  a 9px/16px shadow, while the approved 978×290 title/decor raster already
  existed in the repository.
- Focused TDD red command:
  `npm test -- --run tests/issue-0022-production-ui-regression.test.ts`;
  all three initial contracts failed before implementation.

### Fix and final browser evidence

- Next image delivery is unoptimized, so bundled design assets use direct
  `/assets` URLs instead of the incompatible internal optimizer path.
- The approved Home, Login, and Rules desktop compositions are centered and
  capped at 1460px, 1410px, and 1495px respectively. No page-level `zoom` or
  `transform: scale()` was added.
- At desktop widths, the Home title/decor layer uses the approved
  `home-static-hero.png`; the real `h1` remains in the DOM for semantics.
- Title pixel proof:
  `home-title-native-1635x962-v2\home-title-slice-comparison-*`.
  The approved 978×290 asset and the real-browser crop have
  `changedPixelRatio=0`, `meanAbsoluteError=0`, and `RMSE=0`.
- Final 100% Chrome matrix:
  `final\100pct-1920x974`. Final mobile matrix:
  `final\mobile-390x844`. Additional controlled matrices are
  `matrix-1536x768`, `matrix-1536x1024`,
  `matrix-2133x1082-zoom90-equivalent`, and
  `worker-proxy-1920x974`.
- Every geometry record has DPR 1, `visualViewport.scale=1`, and
  `documentElement.scrollWidth=innerWidth`. Across all final six-page captures,
  visible broken-image count, `/_next/image` dependency count, asset 4xx count,
  and unexpected console-error count are all zero. Anonymous
  `/api/auth/session` 401 remains the expected authentication boundary.
- The production-like verification script keeps a random 32-byte test secret
  in memory, makes its guarded local origin return 403 without the Worker,
  then runs the repository Worker and six real Chrome captures. Three
  representative PNGs return HTTP 200 `image/png` with valid PNG signatures;
  the six pages contain no optimizer request and no visible decode failure.
  Machine-readable result:
  `worker-proxy-1920x974\worker-asset-verification.json`.
- The Customer Service page is included only as an unchanged control page; no
  Customer Service component, CSS rule, behavior, or approved scope changed.

### Engineering gates

- Focused scripts and tests: Node syntax checks pass; 4 focused test files /
  20 tests pass.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0, zero warnings.
- Full isolated run: 241/242 passed; the sole failure is the known absent
  untracked S2 operations-document fixture. Excluding only that fixture test,
  60 files / 240 tests pass. Its exact test passes 2/2 read-only in the
  original worktree, whose status is unchanged.
- A transient empty-result failure in three Chrome chat-layout tests passed
  3/3 on immediate focused rerun and then passed in the clean 240/240 full
  rerun; no Customer Service implementation was changed.
- `npm run build`: exit 0, 31 static pages. The only warning is the existing
  Windows `EPERM` while standalone tracing encounters the shared
  `node_modules` junction.
- No generated screenshots, `.next`, logs, cache, dependency directory, real
  secret, production configuration, Issue file, or original-worktree file is
  included. This remains developer-side evidence pending independent review;
  it is not deployment, Issue closure, or user acceptance.

## ISSUE-0023 customer-service standard back arrow

Branch: `codex/customer-service-back-arrow-20260728`

Baseline: `52f88ca69872c653a75be4a4d7106405f13c937e`

Evidence root:

`C:\Users\86166\.codex\visualizations\2026\07\17\019f70ec-6331-7083-aecb-bb8484511518\issue-0023-customer-service-back-arrow`

### TDD and implementation

- Red command:
  `npm test -- --run tests/customer-service-back-arrow.test.ts`.
  One of two tests failed because `/customer-service` had no standard
  `a.page-back-arrow[href="/"][aria-label="返回首页"]`; the frozen-content
  contract passed.
- The implementation adds only the same `Link` and arrow span already used by
  the other refreshed secondary pages. No CSS, chat behavior, copy, layout,
  API, or other route changed.
- Green command covers the focused contract, sitewide structure contract, and
  real-Chrome customer-service layout: 3 files / 13 tests pass.

### Real Chrome evidence

- Desktop viewport:
  `customer-service-back-arrow-1920x974-viewport.png`.
- Desktop full page:
  `customer-service-back-arrow-1920x974-fullpage.png`.
- Mobile viewport:
  `customer-service-back-arrow-390x844-viewport.png`.
- Mobile full page:
  `customer-service-back-arrow-390x844-fullpage.png`.
- Focus evidence:
  `customer-service-back-arrow-1920x974-focus-visible.png` and
  `customer-service-back-arrow-390x844-focus-visible.png`.
- At 1920×974 the unique link is 52×52 at `(52,132)` with the shared white
  background, 3px black border, 12px radius, and 3px hard shadow. At 390×844
  it is 44×44 at `(14,137.594)` with the shared responsive 2px border.
- Desktop Enter and pointer activation, plus mobile pointer activation, all
  navigate to `/`. In both viewports the first quick question preserves the
  established transition `pristine/1 -> active/3`, with `overlapPairs=0`.
- Both geometry records have DPR 1, `visualViewport.scale=1`, and
  `documentElement.scrollWidth=documentElement.clientWidth`. Chrome reports
  zero console warnings or errors.
- Machine-readable evidence:
  `customer-service-back-arrow-1920x974-metrics.json`,
  `customer-service-back-arrow-390x844-metrics.json`,
  `back-arrow-style-comparison.json`, `interaction-evidence.json`, and
  `chrome-console-warn-error.json`.

### Engineering gates

- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0, zero warnings.
- Full isolated test run: 243/244 pass; the sole failure is the known absent
  untracked S2 operations-document fixture. Excluding only that file:
  61 files / 242 tests pass. Its exact test passes 2/2 read-only in the
  original worktree, whose status remains unchanged.
- `npm run build`: exit 0, 31 static pages. The only warning is the existing
  Windows `EPERM` while standalone tracing encounters the shared
  `node_modules` junction.
- No screenshot, `.next`, log, cache, dependency directory, real secret,
  production configuration, Issue file, or original-worktree file is included.
  This is developer-side evidence pending independent UI review; it is not a
  deployment, Issue closure, or user acceptance.
