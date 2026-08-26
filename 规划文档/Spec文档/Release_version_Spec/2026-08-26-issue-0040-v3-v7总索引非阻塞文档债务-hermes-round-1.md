Review complete. Read the full 124-line sanitized copy. Below is the Round 1 report.

---

# Round 1/3 Review — ISSUE-0040 V3–V7 总索引非阻塞文档债务关单范围调整附录

**Metadata**
- Document: `2026-08-26-issue-0040-v3-v7总索引非阻塞文档债务关单-spec-addendum.md`
- Status claimed in doc: `DRAFT_NON_CANONICAL / AUTHOR_DRAFT / HERMES_REVIEW_PENDING`
- Review model: `deepseek-v4-pro`
- Round: 1/3 (of `MAX_REVIEW_ROUNDS=3`)
- Reviewer role: independent read-only; no edits made, no user approval claimed

**Verdict: REWORK_REQUIRED** — 1 serious finding (S1) blocks the document gate.

---

## Serious Findings

**S1 — V7 A/B classification items are not enumerated, so A=5/B=6 and the "11 项文档采纳候选" are unverifiable**
- Location: §5.2 (line 79), contrasted with §5.1 (line 75); contradicted by §4 N5 (line 62); blocks §7 item 5 (line 105).
- Evidence: §5.1 enumerates all V6 B items (N-001, N-005, N-007, NS-001, NS-002, NS-004, NS-005), C items, and D item explicitly. §5.2 states only "A=5、B=6 是当前 doc-only 文档绑定候选，C=4 是 N-003、N-006、N-010、N-013"，naming only the 4 C items. The 5 A items and 6 B items are never listed. §4 N5 asserts "§5 分别列出 V6 的 B/C/D 与 V7 的 A/B/C"，which is false for V7 A/B.
- Impact: The checklist gate (§7 item 5) requires the ISSUE administrator to verify "V7 A/B/C 分类按源语义保留". Without the concrete A/B item lists, the count A=5/B=6 is an unverifiable assertion, and the operative conclusion "11 项文档采纳候选" leaves 7 of 11 items unnamed. This defeats the document's own core promise of "可复读绑定" (re-readable binding) and makes the N5 debt only partially disposed.
- Correction: Mirror §5.1 by enumerating the 5 A items and 6 B items explicitly; OR add a precise source anchor (path + SHA `54A331358C55C204E8B17A6C8311014882A2D8B54C13490F04D85CB40D0E2CCB` + section where A/B items live) and correct §4 N5's "§5 分别列出" wording to reflect source-by-reference for V7 A/B.
- Future closure trigger: §7 item 5 cannot be independently executed until V7 A/B items are enumerable or anchored.

---

## Non-Serious Findings

**N1 — §6 table has 3 header columns but 4 body columns per row**
- Location: §6 header (line 87) vs data rows (lines 89–93).
- Evidence: Header is `来源 | 可复读主题 | 当前适用结论` (3 cells); each row carries 4 cells, splitting the source path/hash and the thematic list (e.g. "认证、跨账号、源站/伪造头…") into separate columns with no matching header.
- Impact: Markdown renderers will misalign or silently drop the 4th cell, risking loss/merge of the "当前适用结论" text during machine read-back — a real defect in a document whose value is machine-re-readable hashes.
- Correction: add a 4th header (e.g. split into 来源入口(path/hash) + 主题), or merge path/hash back into the 可复读主题 cell.

**N2 — §6 V5 row omits the V5 addendum hash that §2 records**
- Location: §6 V5 row (line 91) vs §2 D-04 (line 30) vs §6 V6/V7 rows (lines 92–93).
- Evidence: §2 lists V5 addendum SHA `CC7C520B549D2F8449119A533C455D725331957B2F4EA5AE321F2F317110DA2A`. §6's V5 row references only the close receipt `4243F742…` and path, while V6 and V7 rows list both original Spec and addendum.
- Impact: §7 item 6 requires "五份关闭 Spec/后续 addendum … 均有来源入口"; the V5 addendum is a documented 范围调整附录 but lacks its §6 source-entry. Low risk (info exists in §2), but asymmetrical and under-satisfies the checklist.
- Correction: add the V5 addendum path/hash to §6's V5 row.

**N3 — Item-ID namespace collision between V6 and V7 is not disambiguated**
- Location: §5.1 V6 C (line 75) vs §5.2 V7 C (line 79) vs §6 V7 row (line 93); §5.3 (line 83) only disambiguates letter enums.
- Evidence: "N-003" and "N-006" appear in both V6's C list and V7's C list. §5.3 states "V6 的 B/C/D 与 V7 的 A/B/C 不是公共枚举" and "V6 C 不自动等于 V7 C"，but says nothing about item IDs. V6's N-006 is described as needing "V5 功能/独立复核" evidence, while V7's N-006 is "数据库迁移依赖 → 转 ISSUE-0031". If the IDs are global, these descriptions conflict; if per-source, the doc never says so.
- Impact: The ISSUE-0031 transfer for "N-006" could be mis-tracked if the administrator reads V6's N-006 instead of V7's.
- Correction: state explicitly that N-xxx/NS-xxx IDs are per-source namespaces (V6 vs V7), and disambiguate N-003/N-006.

**N4 — User-confirmation gate for this addendum is under-specified**
- Location: §9 (lines 120, 122).
- Evidence: §9 states the addendum is "用户'继续'授权下"的产物, and that if Round 1 SERIOUS=0 the document gate can be marked `USER_CONFIRMATION_PASSED`（scoped to doc-only). No distinct confirmation step/owner is named, distinct from ISSUE-0031's `USER_CONFIRMATION_PENDING`.
- Impact: Mild governance ambiguity — "继续" (proceed) is treated as equivalent to formal content confirmation. Low material risk since §8 correctly forbids auto-closing ISSUE-0040, but the confirmation actor/trigger should be explicit.
- Correction: name who confirms and when (e.g. "总负责人复读 Round 1 报告后单独确认"), separate from the ISSUE-0031 confirmation.

---

## Contradictions

- C1: §4 N5 claims "§5 分别列出 … V7 的 A/B/C" but §5.2 does not list V7 A/B items → underpins S1.
- C2: If N-003/N-006 are globally-scoped IDs, §5.1 (V6 N-006 = V5 functional-evidence item) contradicts §6 (V7 N-006 = database-migration → ISSUE-0031); §5.3 does not resolve this → see N3.

## Missing Acceptance Criteria

- M1: No distinct, named step/owner for the user-confirmation gate of this addendum (separate from ISSUE-0031). (§9)
- M2: §7 item 5's V7 A/B verification is not executable without item enumeration (S1).
- M3 (minor): §7 item 1 implies hash/bytes/lines recomputation at receipt time but does not state a concrete recompute step; acceptable if the ISSUE admin's receipt procedure is defined elsewhere.

---

## Remediation Checklist (ordered by severity)

1. Enumerate V7 A=5 and B=6 items (or anchor them to the V7 addendum SHA `54A33135…` + section), and fix §4 N5 wording. [S1]
2. Correct §6 table to a consistent 4-column header. [N1]
3. Add V5 addendum path/hash (`CC7C520B…`) to §6 V5 row. [N2]
4. State N-xxx/NS-xxx namespace scope (per-source) and disambiguate N-003/N-006. [N3]
5. Name the distinct user-confirmation step/owner for this addendum's gate. [N4]

## Open-Issue List (remain open / tracked after this review)

- ISSUE-0040 — still `open`; closure requires ISSUE admin independent re-read; not closed by this addendum or by Round 1.
- ISSUE-0031 — `open / USER_CONFIRMATION_PENDING`; unchanged.
- V7 N-003 / N-010 / N-013 — no专项证据, remain unclosed with owner/future-trigger.
- V7 N-006 — transfer to ISSUE-0031 tracking; database not started.
- V3–V5 functional/production/business gates — proven only by their own close chains, never by this addendum.

---

Round 2 should verify S1's fix (V7 A/B enumeration or source anchor + §4 N5 wording correction) and confirm no regression to the §5.3 cross-enum rule, §7 checklist, or the §2 hash bindings.