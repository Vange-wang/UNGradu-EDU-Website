I've read the full 379-line document. Below is my Round 2/3 review.

---

# Hermes Review — Round 2/3

## Metadata

- Document: `2026-08-20-v4-issue-0032-provider-specific-authorization-package.md`
- Task: `V4-ISSUE-0032-PROVIDER-SPECIFIC-AUTH-PACKAGE-20260820`
- Reviewer model: `deepseek-v4-pro` (deepseek)
- Round: 2 / 3
- Review type: read-only, no file edits, no approval claimed

## Round

Round 2/3 — focused verification of Round-1 S1/S2 remediation and direct regressions. Note: I do not have the Round-1 report in this session; I cannot do a line-level diff of the two serious findings. I verify the document on its own merits and flag where that traceability is blocked.

## Verdict

PASS_WITH_NONBLOCKING_OPEN_ISSUES

No serious findings remain. The central technical gap (send-code route does not read `TURNSTILE_SECRET_KEY` / `TURNSTILE_EXPECTED_HOSTNAMES`) is correctly stated, scoped, and gated as `PRESENT_BUT_NOT_WIRED`, not over-claimed. Scope, security/privacy, stop/rollback/rotation, and acceptance matrices are internally consistent and well-bounded. Remaining items are metadata/consistency and traceability issues only.

## Serious Findings

None.

## Non-Serious Findings

N1 — Stale review-round counter (factual inconsistency)
- Location: line 7 (`CURRENT_REVIEW_ROUND=0/3`)
- Evidence: line 7 says 0 rounds completed, but line 355 states "Hermes Round 1 已完成并给出 REWORK_REQUIRED" and line 377 sets the gate to `HERMES_ROUND_2_PENDING`.
- Impact: a downstream reader or agent may misread the review history and re-run Round 1, or doubt the rework provenance.
- Correction: set `CURRENT_REVIEW_ROUND=1/3` (Round 1 done, Round 2 in progress), consistent with §13/§15.

N2 — Undefined external references `S1`/`S2` and `ISSUE-0046 N5`
- Location: lines 13, 214, 355, 379 (`S1/S2`); line 214 (`ISSUE-0046 N5`)
- Evidence: the document repeatedly claims it "整改 Round 1 的 S1/S2" but never states what S1 and S2 were; `ISSUE-0046 N5` is referenced once with no definition or pointer.
- Impact: the Round-1 remediation claim is not self-verifiable from this document alone; the ISSUE-0046 scope boundary is opaque.
- Correction: add a one-line definition of S1 and S2 (or a pointer to the Round-1 report path), and one line of context for ISSUE-0046 N5.

N3 — "方案 A" vs "方案 B" namespace collision
- Location: lines 94/236 (`方案 B`/`参数 B` = parameter candidate) vs lines 263/301/355 (`方案 A` = production observation plan)
- Evidence: two independent decisions both use the "方案" label; a reader may infer the observation plan's alternative is "方案 B" (the parameter candidate), which it is not.
- Impact: local ambiguity, no technical effect, but risks mis-citation in a frozen authorization record.
- Correction: disambiguate, e.g. "参数方案 B" vs "观察方案 A".

N4 — Observation-plan sampling distribution unspecified
- Location: §10.3 item 2 (line 304) and item 5 (line 307)
- Evidence: the plan pins 24 samples / 24h, 12 per account, ≥4 non-overlapping periods, but not the time distribution. The stop threshold "任意 1 小时窗口错误率达到 5% 且该窗口有效样本不少于 10 次" requires ≥10 valid samples inside a single 1-hour window, which is unreachable under a ~1-sample/hour spread and only reachable if sampling is deliberately clustered.
- Impact: one of the three subsystem stop conditions is vestigial or ambiguous in reachability; does not invalidate the plan (the "连续 2 次" and "累计 3/24" conditions remain reachable and safe).
- Correction: state whether samples may be clustered (making the 1h/5% clause live) or spread (making it dead), so the acceptance matrix is unambiguous.

N5 — Bare "R1" is ambiguous with "Hermes Round 1"
- Location: line 84 (`已由 R1 返工链承接`)
- Evidence: §2.2 line 84's "R1" refers to the TECH_REVIEW chain (`...-r1-review.md`, TECH_REVIEW_PASS on line 85), while line 355's "Hermes Round 1" is the Document-QA chain. The bare "R1" is easily confused with "Hermes Round 1".
- Impact: minor provenance confusion between two distinct review chains.
- Correction: qualify as "TECH_REVIEW R1" in line 84.

## Contradictions

C1 — Review-round state conflict (also N1)
- Line 7 `CURRENT_REVIEW_ROUND=0/3` contradicts line 355 ("Round 1 已完成") and line 377 (`HERMES_ROUND_2_PENDING`). Same correction as N1.

No other contradictions found. The technical facts, hashes, TTLs (300s), timeouts (5000ms verify / 10s email / 120s delivery), rate limits (3/15m, 10/15m, 5/15m, 5/15m), cooldowns (60s email / 5s retry), sample arithmetic (12+12=24, 3+3=6), and the §6.2↔§6.3 variable matrices are internally consistent. Screenshot count (7) matches the table.

## Missing Acceptance Criteria

- Sampling time distribution across the 24-hour observation window (ties to N4). All other acceptance dimensions — test matrix, provider-specific integration, stop/rollback/rotation, evidence layers, prohibited claims — are present.

## Remediation Checklist

1. Fix line 7 to `CURRENT_REVIEW_ROUND=1/3`.
2. Add definitions/pointers for S1, S2, and ISSUE-0046 N5.
3. Disambiguate observation-plan "方案 A" from parameter "方案 B".
4. Pin the observation sampling distribution (or explicitly mark clustering allowed).
5. Qualify line 84 "R1" as "TECH_REVIEW R1".
6. Cross-check S1/S2 remediation against the actual Round-1 report (outside this session's scope).

## Open-Issue List

Document's own correctly-gated items (all `PENDING_BY_GATE`, none self-claimed as done): send-code verifier wiring; real provider + credentials; site-key/Secret match; actual CloudBase values; SMTP provider/connectivity/DPA/cost; China network; trusted proxy; collection/transaction/permission/cleanup; key rotation; observation plan execution; code implementation; formal tests; independent tech review; platform config; deployment; production evidence; user-visible acceptance; business risk acceptance; ISSUE-0032 closure.