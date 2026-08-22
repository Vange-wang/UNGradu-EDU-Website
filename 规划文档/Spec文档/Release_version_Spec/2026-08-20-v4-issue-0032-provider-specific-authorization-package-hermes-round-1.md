Reviewed. Single sanitized file in scope (no screenshots/repo/parameter docs present in the review dir, so all hashes, byte/line counts, commit IDs, DeployId and "11 active" figures are asserted-but-unverifiable this round).

# Round 1 Review — V4-ISSUE-0032 Provider-Specific Authorization Package

**Metadata**
- Doc: `2026-08-20-v4-issue-0032-provider-specific-authorization-package.md`
- Status declared: `DRAFT_NON_CANONICAL / AUTHOR_DRAFT / HERMES_REVIEW_PENDING`
- Round: 1/3 — Model: deepseek-v4-pro
- Task ID: V4-ISSUE-0032-PROVIDER-SPECIFIC-AUTH-PACKAGE-20260820

**Verdict: REWORK_REQUIRED**

Two material completeness gaps directly undermine the package's own stated goals (1.1.2 "最小绑定关系" and 1.1.6 "失败停止/回滚"). The document is otherwise exceptionally disciplined: it overclaims nothing, marks nearly every live dependency `PENDING_BY_GATE`, and its Secret/privacy boundaries are correct. No security leak, no false production claim found.

---

## Serious Findings

### S1 — The "minimum binding relationship" (name → code read site) is never enumerated
- Severity: SERIOUS
- Location: §1.1 item 2 (line 22), §6.2 matrix (lines 180–192), §2.1 file list (66–76), §3.2 (111–115), §3.1 (105)
- Evidence: The package's primary purpose (line 22) is to establish "provider、hostname、action、Secret 引用和 CloudBase 变量名称之间的最小绑定关系". It lists 23 env-var names in §6.2 and 11 code files in §2.1/§3.2, but never states which variable name is read at which code site. Critically, it never states whether `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is actually exposed via `runtime-public-config.ts` (listed at line 71, 9 lines — trivially checkable, but left silent). Line 178 assigns "代码读取/映射 owner 为原实现 owner" but supplies no mapping itself.
- Impact: Downstream code owner must re-derive the mapping; ambiguity invites wrong-name wiring (e.g. a Secret bound to the wrong verifier field), exactly the failure the package exists to prevent. The core deliverable is present as a list, not as a binding.
- Correction: Add a name → file/site matrix, explicitly covering `TURNSTILE_SECRET_KEY`, `TURNSTILE_EXPECTED_HOSTNAMES`, and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (with a yes/no on runtime-public-config.ts whitelisting). Future closure trigger: any time a variable is added/removed, the matrix must move with it.

### S2 — Observation window and stop thresholds are required but never quantified
- Severity: SERIOUS
- Location: §9 生产验证 row (line 244), §10.2 (269), §11 (281), §12.1 (295 "停止阈值触发"), §12.3 (307), §14 (319), §7.2 (219)
- Evidence: The doc mandates an "观察窗口" and "停止阈值" as a production stop condition and acceptance criterion, but defines neither the window duration nor any numeric threshold (e.g. 5xx rate, auth-failure rate) that triggers a stop. Other §12.1 bullets are objective (Secret leak, action mismatch); this one is not.
- Impact: A stop condition that cannot be evaluated is not a failure-handling control. "PENDING_BY_GATE" can never objectively transition to PASS without defined pass/fail numbers.
- Correction: Specify observation window length and stop thresholds (concrete values, or explicit owner+date for defining them). Future closure trigger: production verification gate cannot open until numeric thresholds exist.

---

## Non-Serious Findings

- N1 — `CURRENT_REVIEW_ROUND=0/3` (line 7) is stale; this is Round 1. Metadata only.
- N2 — `POST_PUSH_COMMIT_ATTESTATION_PASS` is cited as an upstream input (line 60) but has no entry in the §2.2 receipt index (lines 82–89): no hash/bytes/lines. Traceability gap.
- N3 — Line 94 wording conflates 参数候选 with its 用户确认记录, which is a separate document listed on line 95. Minor clarity.
- N4 — §5 indexes 7 screenshots but never maps screenshot → supported fact (Widget name vs hostname vs CloudBase var names). Weakens per-evidence granularity of §9's "仅掩码证明".
- N5 — `TURNSTILE_EXPECTED_HOSTNAMES` (line 191) value is named but its encoding/format (single value? delimiter?) is undefined; §4.2 (141) repeats "真实值…尚未独立证明" without specifying format. Fold into S1 matrix or state format.

---

## Contradictions

- C1 (≈N1): metadata claims round 0/3 while the review is executing as 1/3.
- C2 (≈N2): §2.1 lists `POST_PUSH_COMMIT_ATTESTATION_PASS` as inherited input but §2.2 receipt index omits it.
- C3 (≈N3): 方案 B confirmation attributed inside the 参数候选 line vs. its own 参数确认记录 entry.

No substantive logical contradiction found in the security/scope/flow sections.

---

## Missing Acceptance Criteria

- A1 — No crisp "definition of done" checklist for the authorization package itself (freeze-hash → Hermes R1 → Document QA → user re-confirm is stated in §13/§15 but not as an enumerated, pass/fail gate).
- A2 — Observation-window duration + stop thresholds undefined (≈S2).
- A3 — `TURNSTILE_EXPECTED_HOSTNAMES` value format undefined (≈N5).
- A4 — "双账号隔离" and "用户可见结果" production criteria are named but not concretized.
- A5 — Per-screenshot → fact attribution missing (≈N4).

---

## Remediation Checklist

1. Add name → code-read-site binding matrix; confirm/deny `NEXT_PUBLIC_TURNSTILE_SITE_KEY` exposure in `runtime-public-config.ts`. (S1)
2. Quantify observation window and stop thresholds (or assign owner + date). (S2)
3. Bump `CURRENT_REVIEW_ROUND` to reflect the active round. (N1/C1)
4. Add `POST_PUSH_COMMIT_ATTESTATION_PASS` receipt (hash/bytes/lines) to §2.2. (N2/C2)
5. State `TURNSTILE_EXPECTED_HOSTNAMES` encoding. (N5/A3)
6. Add per-screenshot fact attribution. (N4/A5)
7. Tighten §2.3 wording (参数候选 vs 参数确认记录). (N3/C3)

## Open-Issue List

- O1: Binding matrix (S1) — open until added.
- O2: Observation window + stop thresholds (S2) — open until quantified.
- O3: All §14 `PENDING_BY_GATE` items (provider/credentials, site key/Secret match, actual CloudBase values, SMTP/DPA/cost, China network, trusted proxy, collection/txn/cleanup, rotation, observation, code impl, tests, independent review, platform config, deploy, production, product acceptance, Issue close) — tracked, correctly not claimed.
- O4: ISSUE-0031, DB migration, all paid actions — deferred (consistent across §2.3/§7.2).
- O5: ISSUE-0032 canonical state — still open; no claim otherwise.

**Bottom line:** the document's honesty and boundary discipline are strong, but its two headline goals — the minimum binding relationship and objective failure-handling controls — are not yet delivered in actionable form. Fix S1 and S2 before Round 2; the remaining items are non-blocking polish/traceability.