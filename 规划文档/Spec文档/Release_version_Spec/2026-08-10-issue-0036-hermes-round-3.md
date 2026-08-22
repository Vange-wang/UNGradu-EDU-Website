---

# Document QA Review — Round 3/3

**Metadata**

| Field | Value |
|---|---|
| Document | `2026-08-10-issue-0036-联系方式快速智能审核-spec.md` |
| Path | `C:\Users\86166\AppData\Local\Temp\vange-hermes-review-2da5ccb2-fad3-4f49-8f1e-70785db66875\` |
| Document SHA-256 | Not computed (read-only review; file not hashed) |
| Round | 3/3 — 仅复核 S-001/S-002 及受影响申诉回归，禁止自动第四轮 |
| Model | deepseek-v4-pro |
| Reviewer | Hermes / Document QA (independent read-only) |
| Date | 2026-08-10 |

**VERDICT: PASS_WITH_NONBLOCKING_OPEN_ISSUES**

No serious findings remain. The state machine is internally consistent, the appeal flow has proper abuse-prevention gating, fail-closed principles are upheld in all 12 enumerated failure modes, and the acceptance matrices are testable. Six non-serious documentation-clarity items are listed below; none block approval or implementation authorization.

---

## Serious Findings

*None.*

Prior-round serious items (S-001 state-machine transitions, S-002 appeal regressions) are resolved. Verified:

- **S-001 (state machine):** All allowed transitions (6.2.1) are consistent with the narrative description (6.1). Prohibited transitions explicitly block every bypass vector: supplier allow, AI-only allow, frontend flag, timeout, budget meltdown, queue/audit failure. `deleted → pending_review` recovery path requires owner/participant/version/policy revalidation before publish; no `deleted → published` shortcut exists.
- **S-002 (appeal regression):** The appeal path (`rejected → appeal_pending → needs_manual_review → published/rejected`) is defined consistently across 6.1, 6.2.1, 7.1, and 10.1-10.2. Abuse prevention (24h rate limit, idempotency, 3-strike 7-day lock) covers cross-account, stale-version, duplicate-key, and deleted-state attack vectors. Pre-publish re-checks (policyVersion, contentVersion, owner, contentHash, audit success) are required. All appeal negative tests in 10.2 map to concrete gating logic in 7.1.

No regression introduced by the Round 2 fixes.

---

## Non-Serious Findings

### NS-001 — `appeal_pending` absent from core state enumeration
- **Location:** §6.1 状态, lines 225-238
- **Evidence:** Core states listed: draft, pending_review, published, rejected, needs_manual_review. `appeal_pending` is introduced mid-paragraph as "独立中间状态" but never promoted to the top-level enumeration.
- **Impact:** Minor discoverability gap. A reader scanning the initial state list may miss that `appeal_pending` is a first-class audit state (not a transient sub-status).
- **Correction:** Add `appeal_pending` to the core state bullet list in §6.1, or explicitly note "以下为核心审核状态；appeal_pending 为独立申诉中间状态详见 §7.1".

### NS-002 — `deleted` used as state despite being declared "not a review state"
- **Location:** §6.1 (line 246: "删除不是新的审核状态") vs §6.2.1 (lines 277-278: `published → deleted`, `deleted → pending_review`)
- **Evidence:** The spec explicitly says deletion is not a review state, yet `deleted` appears in the allowed-transition list and in acceptance tests (10.2) as a state label.
- **Impact:** Terminology inconsistency. No operational risk — the intended semantics (ISSUE-0033 lifecycle, 48h soft-delete, recovery via pending_review) are unambiguous.
- **Correction:** Either rename the transition labels to avoid "state" language (e.g., "published record enters soft-delete window → recoverable via pending_review") or acknowledge `deleted` as a lifecycle marker distinct from review states.

### NS-003 — No rate-limit on `rejected → draft → pending_review` resubmission spam
- **Location:** §7.1 (lines 312-324)
- **Evidence:** The 24h appeal limit and 3-strike contentHash lock apply only to appeals (`appeal_pending` path). A user repeatedly making trivial edits and resubmitting (`rejected → draft → pending_review`) generates new contentVersions with new contentHashes, bypassing both the rate limit and the hash lock.
- **Impact:** Low. Each resubmission costs a review cycle, but the deterministic layer is cheap (p95 ≤200ms) and AI calls are budget-capped. A determined spammer could waste review capacity but cannot force publication. The idempotencyKey and version-condition writes prevent duplicate publications.
- **Future closure trigger:** If production shows abnormal resubmission volume, add a per-entity rolling-window submission cap (e.g., N submissions per hour) independent of contentHash.

### NS-004 — Ambiguity in "连续维持原判" counting start
- **Location:** §7.1, line 318
- **Evidence:** "同一 `contentHash` 连续维持原判累计达到第 3 次后锁定 7 天" — unclear whether the initial auto-rejection counts as the first "维持原判" or whether counting starts from the first formal appeal rejection. The section is titled "申诉滥用" which suggests appeal-only counting, but the text "维持原判" could be read to include the original rejection.
- **Impact:** Minor implementation ambiguity. Both interpretations are defensible and neither creates a safety gap (locking after 2 appeals vs 3 appeals).
- **Correction:** Clarify: "同一 contentHash 的申诉被连续驳回（维持原判）累计 3 次后锁定 7 天；初始自动拒绝不计入此计数。"

### NS-005 — Section 4.2 step 2 uses "先" implying first-execution but it is step 2
- **Location:** §4.2, line 126
- **Evidence:** Step 2 begins "**先**对未经 NFKC 的原始 Unicode 文本扫描混淆" — the word "先" (first) conflicts with its position as step 2. Step 1 (version/hash/length check) comes before it.
- **Impact:** Trivial ordering confusion; the numbered list makes the actual order clear.
- **Correction:** Replace "先对" with "对" or reorder so the Unicode-scan step genuinely comes first if "先" is intentional.

### NS-006 — No explicit transition to abandon an appeal in favor of editing
- **Location:** §6.1, §7.1
- **Evidence:** A user in `appeal_pending` who changes their mind and wants to edit content instead has no documented path. The only defined paths from `rejected` are: (a) appeal without content change → `appeal_pending`, (b) modify content → `draft → pending_review`. It is unclear whether `appeal_pending → draft` is allowed or whether the user must wait for the appeal to resolve.
- **Impact:** Edge-case UX gap. In practice, an implementation could either allow appeal cancellation → draft, or require appeal resolution first. Neither choice creates a safety hole as long as the new submission goes through full review.
- **Future closure trigger:** Define during UX/implementation phase whether `appeal_pending` can be withdrawn by the user to enter `draft`.

---

## Contradictions

None. All state transitions, fail-closed rules, and acceptance criteria are internally consistent.

---

## Missing Acceptance Criteria

None at the Spec level. All four test tiers (§10.1–10.4) plus business acceptance (§10.5) are defined with concrete responsibilities, evidence types, and pass/fail conditions. The 14 unresolved business gates (§14) are explicitly acknowledged as blocking implementation, which is appropriate for a DRAFT_NON_CANONICAL document.

---

## Remediation Checklist

| ID | Action | Owner | Priority |
|---|---|---|---|
| NS-001 | Add `appeal_pending` to §6.1 core state list | PM | Optional |
| NS-002 | Align `deleted` terminology in §6.2.1 with §6.1 declaration | PM | Optional |
| NS-003 | Note resubmission-spam gap; monitor in production | Tech Lead | Deferred |
| NS-004 | Clarify "维持原判" counting start in §7.1 | PM | Optional |
| NS-005 | Fix "先" wording in §4.2 step 2 | PM | Optional |
| NS-006 | Define appeal-abandonment path during UX design | PM/UX | Deferred |

---

## Open-Issue List

1. **14 unresolved business gates** (§14 + §2.3): field scope, contact categories, auto-reject precision, AI routing scope, SLO/thresholds, queue working hours, appeal SLA, vendor/model/region/DPA/budget, retention periods, minors/OCR, old-published snapshot semantics during re-review, human review owner, second-review and appeal permissions. All block implementation; all are explicitly owned by the business side.
2. **0036 product owner not yet registered** (§2.2): implementation cannot proceed until the general lead assigns a named owner.
3. **OCR decision gate** (§1.3, §4.1): explicitly excluded from initial scope; requires separate business confirmation before any image text enters the pipeline.

---

**Review complete.** The document is ready for source-hash freeze and handoff to business stakeholders for gate resolution (§14). No rework required. No further Hermes/Document QA rounds are authorized per the document's own constraint (line 569-570).