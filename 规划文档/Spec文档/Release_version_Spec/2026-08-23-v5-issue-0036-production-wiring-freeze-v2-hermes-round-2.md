I've reviewed the document holistically. Here is my report.

---

# Independent Review Report — ISSUE-0036 Production Wiring Freeze v2

## Metadata

- Document reviewed: `2026-08-23-v5-issue-0036-production-wiring-freeze-v2-spec.md` (sanitized copy)
- Path: `C:\Users\86166\AppData\Local\Temp\vange-hermes-review-e8646158-753a-49e9-b0e2-f48c27e600bf\2026-08-23-v5-issue-0036-production-wiring-freeze-v2-spec.md`
- Review round: 2/3 (per instruction)
- Required invocation model: deepseek-v4-pro
- Reviewer role: independent read-only; no file edits, no user-approval claims
- Access note: the S-001～S-004 remediation ledger referenced in §14 (line 376) was NOT provided to this reviewer. Specific verification of those prior fixes could not be performed; this report reviews the document as a coherent whole and flags every currently-discoverable material finding.

## Round

2/3. The document is internally labeled `CURRENT_REVIEW_ROUND=1/3` and "本轮 Round 1" (lines 5, 20) while its status header and §14 state `HERMES_ROUND_2_PENDING` (lines 3, 372, 376). The round counter is stale (see Contradiction C-1).

## Verdict

**REWORK_REQUIRED**

Two material state-machine defects remain in the normative aggregate/lifecycle contract (§6–§7). Both affect the correctness and failure-handling of the two-person review/appeal control and would force implementers to guess.

---

## Serious Findings

### S-1 — Aggregate rule "任一 rejected → rejected" is incompatible with the lifecycle matrix and N/N recompute for the reachable mixed "rejected + pending_review" state

- Severity: SERIOUS
- Location: §6.2 (line 187), §5.2 (line 124), §5.3 (lines 133–134), §6.3 (line 199), §7.6 (line 279)
- Evidence:
  - Line 187: "全部 N 个 required field tasks 均为 published 才能为 published；**任一 rejected 则为 rejected**；任一 appeal_pending 则为 appeal_pending；否则存在 needs_manual_review 则为 needs_manual_review；存在 pending、missing、duplicate、unknown 或事务不完整则为 pending_review/fail-closed。"
  - Line 124: normal field decisions are made individually (`appealMode=false` 的 `pending_review/needs_manual_review -> published/rejected`), so partial decisions are the default workflow.
  - Line 133: the appeal gate is only "aggregate is rejected AND `appealUsedAt=null`" — no precondition that all fields are already decided.
  - Line 199: "rejected vN+1 申诉 … 若终审全字段通过则 active=N+1、pending=null" — assumes the version has no other undecided fields.
  - Line 279: recompute has only two branches (all published → published; any appealed field still rejected → rejected); the "appealed field approved but another field still pending_review" outcome is undefined.
- Impact: In normal field-by-field review, reviewer rejects field A while field B is still `pending_review`. By line 187 the aggregate is labeled "rejected" (priority beats "存在 pending"). The owner is then permitted to appeal (line 133), but the appeal converts only the currently-rejected fields (line 134), leaving field B `pending_review`. If the second reviewer approves field A, line 279 matches neither branch (not all published; no appealed field still rejected), so aggregate status is undefined; line 199's "终审全字段通过 → active=N+1" is false for this state. Implementers cannot compute aggregate status or pointer transitions for a reachable, non-pathological state.
- Correction (future closure trigger): Either (a) redefine aggregate "rejected" to require "all N fields decided (published/rejected) and ≥1 rejected", treating "≥1 rejected + others pending" as `pending_review`, or (b) explicitly model the mixed state in §6.3 and extend §7.6 recompute with a third branch ("appealed field approved + other field still pending → aggregate=pending_review, no active switch"). Add a §12 acceptance test for the mixed state.

### S-2 — Appeal fail-closed path (`needs_manual_review`) has no documented exit; claim/triage status is contradictory with §7.6

- Severity: SERIOUS
- Location: §7.6 (line 277), §5.3 (lines 132, 136), §5.2 (line 124), §4.3 (line 99), §4.2 (line 93)
- Evidence:
  - Line 277: on decision-vector validation failure (transaction available), "全部 appealed fields 与 aggregate 一致转为 `needs_manual_review`".
  - Line 132: pending pointing to any `activeReviewStatuses` (which includes `needs_manual_review`) → edit returns `409 REVIEW_VERSION_CONFLICT`.
  - Line 136: `appealUsedAt` non-null → only edit is allowed (but edit is 409-blocked per line 132).
  - Line 124: the explicit "needs_manual_review → published/rejected" transition is restricted to `appealMode=false`; no equivalent transition exists for `appealMode=true`.
  - Line 99: "primary/backup 只能 claim/triage 到 `needs_manual_review`" implies claim changes status, contradicting line 277 (which implies the field was still `appeal_pending` before the failure).
- Impact: After a second-review decision fails validation (wrong account, missing reasonCode, role mismatch — a documented, reachable condition), the version is stuck in `needs_manual_review`: the owner cannot edit (409) and cannot re-appeal (`appealUsedAt` set), and no role/transition is defined to resolve an `appealMode=true` `needs_manual_review` field. This is a dead-end in a fail-closed security path. Additionally, whether claim/triage moves the field from `appeal_pending` to `needs_manual_review` is contradictory between §4.3 and §7.6.
- Correction (future closure trigger): Define (a) whether claim/triage changes field status (stay `appeal_pending` vs move to `needs_manual_review`) and (b) an explicit exit transition for `appealMode=true needs_manual_review` (e.g., corrected second-review decision vector, or a named admin/override role+action). Add the transition to §5.3, and add a §12 acceptance test for validation-failure recovery.

---

## Non-Serious Findings

### N-1 — "hidden" vs "deleted" wording on delete
- Location: §5.2 (line 126) vs §6.3 (line 201)
- Evidence: Line 126 "主实体立即 hidden"; line 201 "visibility=deleted".
- Impact: Purely conceptual wording; the enum `publicVisibility = hidden | published | deleted` makes the intended value clear. No ambiguity in behavior.
- Correction: Optional — align the wording to "visibility=deleted（公共端不可见）".

### N-2 — `claimAt`/triage fields written in the final decision vector
- Location: §4.2 (line 93)
- Evidence: The final decision vector writes `claimAt`, `triageReviewerRef`, `triageReviewerRole` in addition to second-reviewer fields — but claim/triage is a separate earlier step by primary/backup (§4.1).
- Impact: Ambiguity about whether triage fields persist at claim time or only at final decision; no behavioral risk if read as "the audit/decision record must contain these". Cross-references S-2 (claim semantics).
- Correction: Clarify persistence timing (claim persists `triageReviewerRef/claimAt`; final decision validates and records, not re-writes).

---

## Contradictions

### C-1 — Round counter inconsistency
- Line 5 (`CURRENT_REVIEW_ROUND=1/3`) and line 20 ("本轮 Round 1 必须由 Hermes…") conflict with line 3 / line 372 / line 376 (`HERMES_ROUND_2_PENDING` / "focused Hermes Round 2/3") and with the actual review round (2/3).
- Impact: Ambiguity about which round this is and the review scope; given the document's own strict round-integrity rules, this should be corrected before finalizing.

### C-2 — Canonical-status terminology clash
- Line 3 (`DRAFT_NON_CANONICAL`) vs line 20 ("v2 是一份完整 canonical").
- Impact: "canonical" is used both as authority status (non-canonical draft) and as completeness (self-contained, not a diff). Confusing to readers assessing the document's authority.

---

## Missing Acceptance Criteria

- AC-1: No §12 test covers the mixed aggregate state "some fields rejected + others still pending_review" (ties to S-1).
- AC-2: No §12 test covers recovery from the appeal validation-failure `needs_manual_review` state (ties to S-2).
- AC-3 (minor): No distinct cross-account test asserting "owner private view shows own contact; no other account/public view ever returns contact info" as a standalone case (currently only implied via §12.1 public-query gating and §12.4 cross-account permission).

---

## Remediation Checklist

1. Fix aggregate rule (S-1): add "all-decided" precondition to "rejected", or model the mixed state explicitly.
2. Extend §7.6 recompute with the third branch (appealed-approved + other-pending → pending_review).
3. Fix §6.3 matrix appeal row so it does not assert `active=N+1` on partial appeal approval.
4. Define claim/triage status effect and persistence timing (S-2 / N-2).
5. Define `appealMode=true needs_manual_review` exit transition + responsible role (S-2).
6. Add acceptance tests AC-1 and AC-2 (and optionally AC-3).
7. Correct the round counter (C-1) and disambiguate "canonical" (C-2).

## Open-Issue List

- S-1: aggregate "rejected" semantics for mixed rejected+pending — open.
- S-2: appeal fail-closed exit path and claim-status contradiction — open.
- C-1: round counter (1/3 vs 2/3) — open.
- C-2: canonical terminology — open.
- AC-3: standalone contact-visibility cross-account test — open (non-blocking).