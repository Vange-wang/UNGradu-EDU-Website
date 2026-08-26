I've read the full document (124 lines) and cross-checked every hash, mapping, count, and cross-reference internally. Here is my Round 2/3 review.

---

# Review Report — ISSUE-0040 V3–V7 总索引非阻塞文档债务关单 Spec Addendum

## Metadata
- Document: `2026-08-26-issue-0040-v3-v7总索引非阻塞文档债务关单-spec-addendum.md`
- Review round: 2/3
- Reviewer model: deepseek-v4-pro
- Status claim in doc: `HERMES_REVIEW_PENDING`, Round 1/3 done (SERIOUS=1, REWORK_REQUIRED)
- Scope reviewed: sanitized copy only (single file); no source Specs/receipts were readable

## Verdict
**REWORK_REQUIRED** — one serious finding remains (reproducibility/completeness gap around the V5 addendum and the §6 index), plus several non-blocking cross-reference and traceability defects.

---

## Serious Findings

### S-01 — V5 scope-adjustment addendum is hash-only and missing from §6, contradicting the document's own precision contract
- **Severity:** SERIOUS
- **Location:** §2 D-04 (line 30); §2.1 (line 36); §4 N6 (line 63); §6 (lines 87–95); §7 items #2/#6 (lines 102, 106)
- **Evidence:**
  - §2 D-04 references the "V5 范围调整附录" by SHA `CC7C520B...` only — no path, no filename, no date, no line anchor.
  - §2.1 (line 36) explicitly names "V5/V6/V7 addendum" and states "任何来源路径、hash、行锚点漂移都进入 `REVIEW_BLOCKED`" — i.e. every source should carry path+hash+anchor.
  - §6 indexes V6 (line 92) and V7 (line 93) addendums with full `path + SHA`, but the V5 row (line 91) lists only the close receipt; the V5 addendum is absent.
  - §4 N6 (line 63) asserts "§6 按五份关闭 Spec/**后续 addendum** 索引负例、阈值、fail-closed/unknown" — overstating §6's actual coverage.
  - Binding depth gradient confirms the outlier: V7 addendum = path+hash+anchor (§5.2); V6 addendum = path+hash (§6); **V5 addendum = hash only**.
- **Impact:** The V5 addendum cannot be located or re-read from this document alone, breaking the document's core "精确清单/可复读" deliverable and blocking M1 checklist item #2 ("close receipt/addendum 链…一一对应") and #6 ("…均有来源入口") for V5.
- **Correction:** Either (a) add the V5 addendum path/filename/date in §2 D-04 and add an `addendum path+SHA` entry to the §6 V5 row (mirroring V6/V7), or (b) if the V5 addendum genuinely carries no negative/threshold/fail-closed content, state that explicitly and narrow §4 N6 to "V6/V7 addendum" so the claim matches §6.
- **Future closure trigger:** Any source path/hash/anchor drift → `REVIEW_BLOCKED` (per §2.1/§8); re-verify at Round 3.

---

## Non-Serious Findings

### NS-01 — §4 M4 cites §8 for content that lives in §3.1
- **Location:** §4 M4 (line 65) vs §8 (lines 110–116) vs §3.1 (lines 44–48)
- **Evidence:** M4 evidence says "§8 记录实际 V3→V7 依序收口结果"; §8 contains only prohibitions ("不得声称…"), while the V3→V7 "close receipt 已存在" facts are in §3.1.
- **Impact:** Wrong section pointer; reader following it finds no closure results. Substance is present and correct, just mis-located.
- **Correction:** Change "§8" to "§3.1" (or cite both).

### NS-02 — §5.1 V6 classification lacks a source path/SHA/anchor
- **Location:** §5.1 (line 75) vs §5.2 (line 79); §7 item #5 (line 105)
- **Evidence:** §5.2 binds the V7 classification to `path + SHA + §3 第 55–73 行`; §5.1 gives only "V6 原 Spec 的分类语义保持原样" with no path/SHA/line anchor. M1 checklist item #5 requires "V6 B/C/D 按 §5.1 复读", but there is no pinned source to re-read against.
- **Impact:** Reproducibility of the V6 B=7/C=5/D=1 enumeration is under-specified.
- **Correction:** Add the D-05 source path/hash and the specific line range holding the B/C/D lists.

### NS-03 — V7 C-item owners/triggers (N-003/N-010/N-013) are not restated, yet checklist #5 requires verifying they "未漂移"
- **Location:** §5.2 (line 79); §6 V7 (line 93); §7 item #5 (line 105)
- **Evidence:** The document names the four C items and says they stay transfer/deferred, but does not restate owners/triggers for N-003/N-010/N-013. Checklist item #5 asks to confirm "N-003/N-010/N-013 的 owner/trigger 均未漂移" with no in-document baseline.
- **Impact:** Verification must go back to the source (V7 addendum §3 lines 55–73); the addendum is not self-contained on this point.
- **Correction:** Restate the three owners/triggers inline, or explicitly point to the frozen source anchor as the sole baseline.

### NS-04 — §9 "Round 1 NON_SERIOUS N1–N4" collides with §4 debt IDs N1–N6
- **Location:** §9 (line 120) vs §4 (lines 58–67)
- **Evidence:** "N1–N4" (Round 1 non-serious finding labels) shares the "N#" shape with the ten debt IDs N1–N6 in §4; a reader may conflate "review findings N1–N4" with "debts N1–N4".
- **Impact:** Local ambiguity, no material risk to disposition logic.
- **Correction:** Use distinct labels (e.g. `R1-NS-1..4`).

### NS-05 — §9 §122 conditional is stale
- **Location:** §9 (line 122)
- **Evidence:** "若 Round 1 SERIOUS=0，文档门可记为…" — Round 1 was SERIOUS=1, so the condition is already false; the post-Round-2 acceptance path is left implicit.
- **Impact:** Confusing status narrative; no correctness impact.
- **Correction:** Replace with the actual Round 2/3 gate wording (e.g. "若 Round 2/3 SERIOUS=0…").

### NS-06 — N-xxx item IDs overlap across V6 and V7 without explicit cross-issue disambiguation
- **Location:** §5.1 (line 75) vs §5.2 (line 79); §5.3 (line 83)
- **Evidence:** V6 uses N-001..N-007, V7 uses N-001..N-015; e.g. "V6 N-006" (C item) ≠ "V7 N-006" (database → ISSUE-0031). §5.3 disambiguates classification *letters* only, not item IDs.
- **Impact:** Low; §5.3's principle (cross-issue references require path/hash/anchor) implicitly covers it, but an explicit note would prevent ID conflation.
- **Correction:** Add one sentence in §5.3 noting N-xxx IDs are issue-local and must be qualified by Issue number.

---

## Contradictions
1. §4 N6 evidence ("§6 按五份关闭 Spec/后续 addendum 索引…") vs §6 content (V5 addendum omitted). — root of S-01
2. §4 M4 evidence ("§8 记录实际 V3→V7 依序收口结果") vs §8 content (prohibitions only; closure facts in §3.1). — NS-01
3. §2.1 standard ("任何来源路径、hash、行锚点漂移都进入 REVIEW_BLOCKED"; "V5/V6/V7 addendum 是后续文档") vs V5 addendum having only a hash. — root of S-01

## Missing Acceptance Criteria
1. No M1 checklist item requires verifying that §2's hash/bytes/lines were actually recomputed against current files (only the §2 header asserts this; checklist #1 assumes it).
2. No criterion covers the V5 addendum path (because it is missing) — see S-01.
3. No criterion binds the §5.1 V6 classification to a source path/hash/anchor (see NS-02).

## Remediation Checklist (for Round 3)
1. [S-01] Add V5 addendum path/filename/date in §2 D-04 and index it in §6 V5 row (or explicitly scope it out and fix §4 N6 wording).
2. [NS-01] Fix §4 M4 "§8" → "§3.1".
3. [NS-02] Add V6 classification source path/hash + line anchor in §5.1.
4. [NS-03] Restate N-003/N-010/N-013 owners/triggers or pin to source anchor.
5. [NS-04] Rename Round 1 finding labels to avoid N# collision.
6. [NS-05] Replace stale §122 conditional with actual Round 2/3 gate wording.
7. [NS-06] Add issue-local ID qualification note in §5.3.
8. [Optional] Add M1 item: verify §2 hash/bytes/lines recomputed against current files.

## Open-Issue List
1. **Round 1 S1 untraceable in this document.** §9 asserts "SERIOUS=1" and "已整改" but never records what S1 was or how it was fixed; Round 2 verification of S1 requires the Round 1 report, which was not supplied with the sanitized copy. I cannot confirm the specific fix; I reviewed the current text holistically instead.
2. **Hash/bytes/lines values unverifiable from this copy.** Internally consistent (all 64-hex, all cross-references match), but actual file identity must be confirmed by the ISSUE admin re-reading the six sources (M1 checklist #1).
3. **V6/V7 close receipts "已存在" (§3.1) but path-less** (§2 gives SHA `804CAA1A...` / `32567B0C...` only). Since §2.1 defers receipt ownership to the ISSUE admin, this is not counted as serious, but the paths should be confirmed during admin receipt.

---

Bottom line: hashes, V3→V7 mapping, item counts (V6 7/5/1, V7 5/6/4/0, 11 current/4 transfer), and the ten debt dispositions are internally consistent and correctly fail-closed. One material gap remains (S-01: V5 addendum hash-only + missing from §6) plus six non-blocking traceability defects. Rework is narrow, not a rewrite.