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
