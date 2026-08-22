I have read the full document. Now producing the Round 1 review. I'll load the Hermes Agent skill for review-format guidance, then deliver the report.

---

# Document QA Round 1 — Independent Read-Only Review

**Document:** `2026-08-10-数据库延期与非数据库阶段执行变更-spec.md`  
**Round:** 1/3  
**Reviewer model:** `deepseek-v4-pro`  
**Review date:** 2026-08-10  
**Hash of reviewed copy:** not pre-frozen (per §12, hash frozen by 总负责人 before routing)

---

## VERDICT: **REWORK_REQUIRED** — 4 SERIOUS findings, 6 NON_SERIOUS

---

## SERIOUS FINDINGS

### S001 — Impossible requirement: "0数据丢失" (Section 9.2, line 260)

- **Location:** §9.2, 延期期间的禁止与恢复, the trigger-condition checklist
- **Evidence:** `"100%对账、0数据丢失"` stated as a hard gate for future F1 database migration restart
- **Impact:** Zero data loss is not practically achievable in any database migration (in-flight writes, edge cases, clock skew). Framing it as a hard requirement creates a gate that can never be satisfied, blocking F1 permanently or forcing dishonest sign-off.
- **Correction:** Reframe as a measurable target with an acceptable threshold, e.g. `"验证对账差异可逐条解释且确认为零业务影响"` or `"对账差异≤N条且全部可人工追溯"`. Keep `"100%对账"` as the reconciliation coverage target but decouple it from the impossible `"0数据丢失"` guarantee.

---

### S002 — Circular fallback dependency: no baseline version for initial deployment (Sections 5.3, 6.3, 10.3)

- **Location:**
  - §5.3 line 149: `"失败即关闭新增策略或回滚到已知安全版本"`
  - §6.3 line 181–182: `"立即关闭发送开关并恢复上一稳定版本"`
  - §10.3 line 291: `"S1 失败：关闭新增安全策略或回滚到上一稳定版本"`
- **Evidence:** S1 is the first implementation phase; no prior stable version exists. The `"回滚到上一稳定版本"` branch has no target for initial deployment. The `"关闭新增安全策略"` branch is usable but imprecise — what is the fallback state for the running system after policies are disabled?
- **Impact:** In a real S1/S2 production failure, the rollback path is undefined. Operators will face ambiguity about what "the stable version" is, risking extended downtime or incorrect recovery actions.
- **Correction:** For initial deployment of each phase, define the baseline version explicitly: the pre-S1 production state (current CloudBase-only deployment) is the rollback target for S1; the post-S1 stable state is the rollback target for S2; and so on. Add: `"首次部署回滚目标为部署前的当前生产状态（{具体标识}）"`.

---

### S003 — Turnstile Free China widget unavailability: indefinite block with no resolution path (Section 6.1, lines 157–158)

- **Location:** §6.1, 冻结推荐, `"widget region 优先 china，不支持时保持阻塞"`
- **Evidence:** Cloudflare Turnstile Free tier may have limitations on China widget region support. The spec mandates `"保持阻塞"` if unavailable, but provides zero decision path: no alternative provider, no escalation trigger, no deadline, no owner for the decision.
- **Impact:** S2 can stall indefinitely on an external dependency that the spec does not control. No one is assigned to verify availability before S2 starts, and no one is authorized to resolve the deadlock.
- **Correction:** Add before S2 prerequisites: (a) a **pre-S2 verification step** — 配置执行侧 confirms Turnstile Free China widget availability with a control-panel screenshot or API probe; (b) an **escalation rule** — if unavailable, 总负责人 must within N business days either approve an alternative provider, approve `world` region with documented risk acceptance, or formally descope S2; (c) block S2 code work until verification passes.

---

### S004 — Indefinite pending state for S3 content with no SLA, timeout, or user-facing behavior (Section 7.3, lines 215–220)

- **Location:** §7.3, 无人工 owner 时的允许与禁止
- **Evidence:** `"直到真实 owner、备援、权限、值班、二审和升级链登记并通过独立复核，S3 只能保持 pending/manual"`. The spec defines what is forbidden (no auto-publish, no AI decision) but does not define: maximum duration in `pending/manual`, user-visible status or messaging, or an escalation path when content ages beyond a reasonable window.
- **Impact:** From the end-user perspective, submitted content silently disappears into a black hole with no feedback. This is a material user-experience gap that could trigger complaints, support load, or regulatory concern (especially given the未成年人 context).
- **Correction:** Add to §7.3 or a new §7.5: (a) maximum `pending/manual` duration (e.g., 7 calendar days), after which the system auto-notifies an escalation contact; (b) user-facing status message (`"审核队列暂未开放，预计{X}内处理"`); (c) a fallback behavior for content exceeding maximum pending age (e.g., `"超时自动退回草稿并通知提交者"`).

---

## NON-SERIOUS FINDINGS

### N001 — SLO targets stated as frozen without feasibility acknowledgment (Section 7.2, gate 05, line 204)

- `"提交 p95≤1s、确定性≤200ms、自动路径≤10s/硬15s"` — these are specific numeric targets. The document does not acknowledge they require architecture validation (CloudBase doc DB latency, Cloudflare Workers cold-start, etc.). Not serious because §7.4 only requires "观察" (observation), not guarantee, but adding a note `"(目标值；需架构验证后冻结)"` would prevent future disputes.

### N002 — "统一硬门确认表" hash referenced but source document not accessible (Line 83)

- The SHA-256 `1C7FDE07...` is given but no pointer to where the original table can be retrieved. A reviewer cannot verify §7.2's 14-gate mapping against the authoritative source. Add a reference: file path, commit, or Document QA ledger entry where the table is stored.

### N003 — Account verification responsibility not explicitly assigned (Section 2.3 vs. Section 8.1)

- §8.1 states `"账号实际可用性必须由责任角色在限定环境确认"` but the responsibility matrix in §2.3 does not list "受控账号验证" as an explicit duty for any role. 代码开发员 is the closest fit (they run the local/integration tests) but this should be explicit.

### N004 — Environment variable defaults unspecified for deferred/absent configuration (Section 11, lines 309–311)

- Variables like `AI_PROVIDER_REF` state `"未确认为空/禁用"` but the system's behavior when the variable is empty/unset is not defined. Does the system refuse to start? Degrade gracefully? Log a warning and skip AI classification? Specify the safe default behavior for each variable in its absent state.

### N005 — G0 acceptance criteria are self-referential (Section 10.1, G0 row, line 274; Section 12)

- G0's local criterion is `"文档结构、来源 hash、旧 canonical 未改"` — the document reviewing itself for structural correctness. Since no external Document QA ledger entry has been recorded yet (§12 says `"待独立 Document QA 记录"`), this criterion cannot be independently verified until after review. Not a logical flaw (this review IS the verification), but the wording should acknowledge the dependency.

### N006 — Precedence ambiguity with existing 0036 Spec (Lines 9–11, Section 7.2)

- §1 states this Spec does not overwrite the existing 0036 Spec, but §7.2 maps 14 gates from the unified hard gate table. If a discrepancy exists between this mapping and the canonical 0036 Spec, which takes precedence? Add a precedence clause: `"如本 Spec 的 14 门映射与 0036 canonical 存在差异，以 0036 canonical 为准，本映射仅反映本次接受的推荐方向"`.

---

## CONTRADICTIONS

None found. The document is internally consistent across all sections, role assignments, phase ordering, and prohibition statements.

---

## MISSING ACCEPTANCE CRITERIA

1. **S1 RED=0 quantitative coverage:** §5.3 requires `"S1 RED=0"` but does not define what specific test cases or attack vectors constitute sufficient RED coverage. A minimum test catalogue or reference to a security standard (e.g., OWASP ASVS Level 2) would make this auditable.

2. **Synthetic data standards:** The spec repeatedly requires "合成数据" (§5.2, §5.3, §7.3, §8.1) but never defines what qualifies as acceptably synthetic. Are randomly generated strings with no semantic meaning sufficient? Must they resemble real data in structure? Define a minimum standard.

3. **S2 pre-start verification for Turnstile China widget:** No explicit verification step exists before S2 implementation begins (see S003).

4. **User-facing behavior during pending/manual state:** Not defined (see S004).

---

## REMEDIATION CHECKLIST

| ID | Action | Priority | Blocks |
|---|---|---|---|
| S001 | Replace "0数据丢失" with measurable threshold | SERIOUS | F1 restart |
| S002 | Define baseline version for initial-deployment rollback in §5.3, §6.3, §10.3 | SERIOUS | S1/S2 production go |
| S003 | Add pre-S2 Turnstile China verification + escalation path | SERIOUS | S2 start |
| S004 | Add pending/manual timeout, user message, and escalation | SERIOUS | S3 production go |
| N001 | Add feasibility caveat to SLO targets | Non-blocking | None |
| N002 | Add pointer to unified hard gate table source | Non-blocking | None |
| N003 | Assign account verification to explicit role in §2.3 | Non-blocking | None |
| N004 | Specify default behavior for absent env vars | Non-blocking | None |
| N005 | Clarify G0 self-referential criteria wording | Non-blocking | None |
| N006 | Add precedence clause for 0036 Spec | Non-blocking | None |

---

## OPEN-ISSUE LIST

1. **Who signs off on synthetic data acceptability?** The spec requires synthetic data throughout but no role is assigned to validate data quality. Suggest: 独立代码复核 confirms synthetic data compliance before integration phase starts.

2. **What happens if the two test accounts are NOT actually available?** §8.1 states availability must be confirmed but doesn't define the consequence of unavailability. Does it block S1? Block P-OPS only? Clarify.

3. **The "20 CNY/月" figure persists in the document** (§1, §2.4, §9.2) despite being explicitly not approved. This is correct (it's documented as rejected), but if the figure is misleading it could be removed from the summary table and only kept in the prohibition section. Minor editorial decision.

---

**Round 1 complete.** Four SERIOUS findings require resolution before G0 can pass. All six NON-SERIOUS findings are advisory. No contradictions detected. Return to 总负责人 for hash freeze and routing to Document QA ledger, then back to Hermes for Round 2 after SERIOUS items are addressed.