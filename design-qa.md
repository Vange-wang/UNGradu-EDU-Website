# SITEWIDE-UI-REFRESH-20260727-001 developer design QA

Date: 2026-07-28

Scope: six frozen-reference pages on `codex/sitewide-ui-refresh-20260727`, including the follow-up interaction rework after `27361175310fa84af25b207a2f1ee4a883af8248`.

## Frozen-reference comparison

The native-size production-mode comparison set is under:

`C:\Users\86166\.codex\visualizations\2026\07\17\019f70ec-6331-7083-aecb-bb8484511518\sitewide-followup-rework\final-production-20260728\comparisons-native`

| Page | Native comparison viewport | MAE | Developer visual check |
| --- | ---: | ---: | --- |
| Home | 1635×962 | 4.5555 | No new structural or interaction-state drift |
| Login | 1634×963 | 4.9851 | Code mode matches the frozen frame; password mode remains readable |
| Rules | 1630×965 | 5.2593 | Frozen two-column composition retained; copy is readable |
| Customer service | 1536×1024 | 1.2356 | Initial state retains the frozen frame and welcome message |
| Tutor profiles | 1536×1024 | 0.2551 | Three-frame geometry retained; live-result artifact removed |
| Parent needs | 1536×1024 | 0.1993 | Three-frame geometry retained; long live titles stay inside the card |

Each page prefix contains `reference`, `actual`, `overlay-50`, `diff`, and `metrics`. Home, login, and rules are compared at their frozen files' native dimensions; the other three references are natively 1536×1024.

The 1536×1024 and 390×844 responsive captures are under the same evidence root. Because no frozen 390×844 artwork exists, `comparisons-responsive-derived` uses a documented center-cover derivative only to provide the requested traceable reference/actual/overlay/diff/MAE artifacts. Those derived MAE values are not treated as pixel-fidelity acceptance metrics; mobile acceptance is based on responsive geometry, interaction continuity, and absence of horizontal overflow.

## Interaction and accessibility checks

- Login code and password states are readable at 1536×1024 and 390×844.
- Rules copy remains readable; the standard return link is reached through real Tab traversal and has a visible focus ring.
- Home protected-entry controls are reached through real Tab traversal and show the D+ blue focus ring without changing the unfocused frozen frame.
- Customer-service quick questions were activated separately with Enter and Space. Quick-question, manual-send, and long-history states retain the same approved frame and persistent welcome message. The message container remains height-limited while `scrollHeight` grows.
- Tutor and parent filters have fixture initial-state evidence and public-real-data live-state evidence. The live paths retain real publish/detail links and do not expose contact information in the capture record.
- The 1536×1024 and 390×844 keyboard audits traverse 124 focus stops across the six pages. Every stop has positive geometry, `opacity=1`, and a visible outline or shadow.
- All final production-mode captures have DPR 1, one page main node, and `innerWidth = clientWidth = scrollWidth`. No unexpected 4xx/5xx remains; anonymous `/api/auth/session` 401 is the existing authentication boundary.

## Static visual and live-control mapping

- Home: frozen hero/cards/principles are local section slices; navigation and protected-entry links/buttons remain real DOM controls with visible focus.
- Login: the frozen initial form frame is a local section slice; mode switch, fields, code/password actions, validation, and submission remain the real form and become visibly active on focus.
- Rules: the frozen intro/list artwork is local section imagery; the return-home control is a real link.
- Customer service: local slices supply the header, information strip, side copy, chat frame, initial welcome, five question labels, input placeholder, and send skin. Real links/buttons/input/form/message history occupy measured hit areas; focus rings remain visible, and dynamic messages render in the same frame.
- Tutor profiles and parent needs: local slices supply the frozen fixture frame. Real filter fields/buttons and publish/detail links remain interactive. Any filter change or public API data switches to the live result layer.
- The three deleted Dify/offline explanatory lines are absent. No complete frozen page is used as a page background.

## Engineering gate

- Targeted UI tests: 5 files, 22 tests, exit 0.
- Follow-up contract: 6 tests, exit 0.
- Typecheck: exit 0.
- Lint: exit 0, no warnings.
- Isolated-worktree suite excluding the externally missing operations fixture: 58 files, 228 tests, exit 0.
- Original dirty worktree operations-baseline test, read-only: 1 file, 2 tests, exit 0.
- Production build: exit 0, 31 static pages; the known standalone junction symlink warning does not change the exit code.

This is developer-side evidence only. Independent UI review, merge authorization, production deployment, and user acceptance remain separate gates.

final result: passed
