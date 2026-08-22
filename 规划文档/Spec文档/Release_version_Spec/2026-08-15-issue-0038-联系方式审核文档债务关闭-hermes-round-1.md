# ISSUE-0038 联系方式审核文档债务关闭 Spec — 审查报告

## Metadata

- Round: 1 / 3
- Model (invocation): deepseek-v4-pro
- Target (sanitized copy only): `2026-08-15-issue-0038-联系方式审核文档债务关闭-spec.md`
- Review mode: read-only; no edits made; no user approval claimed
- Doc self-declared status: `DRAFT_NON_CANONICAL / AUTHOR_DRAFT / UPSTREAM_GATE_BLOCKED`
- Scope note: external file hashes/paths/IDs (lines 23–30) were not verified against the filesystem — sanitized copy only; correctness of those values is a downstream (non-round-1) concern.

## Verdict

**REWORK_REQUIRED**

Two serious findings. Both affect the core contract (Section 5 taxonomy) and downstream closure execution, not wording. Round 2 should verify their fixes plus regressions on the acceptance criteria they touch.

---

## Serious Findings

### S-01 — B/C/D 分类契约与 B 项绑定条件自相矛盾
- Location: §1.1 line 17 vs §5 line 98 (N-001) and line 100 (N-007)
- Evidence:
  - Line 17 定义：B 项有「可追溯文档证据候选」；C/D 才需要「功能、独立复核、观察或业务证据」。
  - Line 98 N-001（B）绑定包含「…和 V5 相关段落」——V5 段落属功能证据来源，非文档候选。
  - Line 100 N-007（B）绑定包含「引用删除保留/恢复规则**与业务确认**」——业务确认属 C/D 域证据，非文档候选。
- Impact: 7-vs-5 的 B/C 划分不可靠；§8 验收标准第 2、3 条（lines 137–138）无法一致判定。下游执行者可能：(a) 只做文档复读就关闭 N-007，漏掉业务确认；或 (b) 把 N-001/N-007 按 C 项处理，破坏「B 项可经文档关闭」的路线。二者都动摇整个处置契约的分类基础。
- Correction: 二选一并统一：
  1. 若 N-001/N-007 确需 V5 段落/业务确认，则改分类为 C，更新 line 17 的 B/C 计数（B 将不再是 7）；
  2. 若保持 B，则删除绑定中的「V5 相关段落」「业务确认」，明确 B 项仅凭已冻结 0036 Spec（line 29, hash 005EA5F2…A97B437）复读关闭。
  无论哪种，line 17 的 B/C/D 定义、§5 各行绑定、§8 第 2/3 条必须三处同步。

### S-02 — B 项「统一/固定/复读」产物的落盘位置与权威性未定义
- Location: §2.1 line 39 vs §2.2 line 45 vs §5 lines 99/102/104 vs line 3
- Evidence:
  - 目标要求「消除术语、适用范围、状态机和 owner 的歧义」(line 39)。
  - B 项绑定使用「统一 deleted 生命周期与恢复重审术语」(NS-002, line 102)、「固定 Unicode 扫描→…顺序」(NS-005, line 104)、「复读高风险自动拒绝边界」(N-001, line 99)——这些动词隐含要产出变更后的文本。
  - 但非目标禁止「修改 ISSUE-0038 canonical/state、既有 0036 Spec」(line 45)，且本稿自标 `DRAFT_NON_CANONICAL` (line 3)。
  - 全文未说明这些「统一/固定/复读」结果写入哪个文件、以什么权威性生效。
- Impact: 可行性/下游执行缺口。执行者无法确定 B 项关闭是「改写既有 0036 Spec（被禁止）」还是「写进非 canonical 矩阵（无约束力）」；可能越界改源文件，或产出无法真正消除源文档歧义的「关闭」。直接影响 §2.1 的「Issue 管理员可独立复读」目标是否成立。
- Correction: 明确单一落盘位置与权威模型。例如：B 项复读结果写入 V6 术语/引用矩阵，并说明其通过 Issue 管理员验收后如何获得约束力（或明确声明「关闭=在矩阵记录解释、源文档歧义保留、后续单独走 canonical 采纳流程」）。若「统一术语」要求改既有 Spec，则必须显式列出该例外并回到授权范围。

---

## Non-Serious Findings

- N-01 — 术语「V5」未定义且过载。§1.2 line 28（V5=spec）、§3.2 line 67（V5=owner）、§4.1 line 79/92（V5=证据）混用，全文无单一定义。上下文可推断为「0036 关闭/功能证据轮次」，建议在 §2 或术语处一次性定义。
- N-02 — `UPSTREAM_GATE_BLOCKED`（line 3/88）与 `REVIEW_BLOCKED`（line 129）两个阻塞态未说明关系。若二者为同一状态则是矛盾，若不同（上游依赖 vs 审查发现）则缺定义。建议明确。
- N-03 — §5 只列「关闭所需绑定」，不写每项债务本身是什么。要达到「管理员独立复读」(line 41)，需先翻台账（line 25）；建议每行附一行债务原文摘要或精确段落指针。
- N-04 — `N-`/`NS-` 前缀及 `owner/entity/version/hash` 元组（lines 103/105）未定义；`D` 既作分类（NS-003 为 D）又出现在前缀拼写中，易混淆。建议术语表澄清。
- N-05 — §3.2 Document QA/独立文档复核角色无具名 owner（只写「不由 PM 自我批准」）。独立性的可执行性存疑，建议指明复核人或指派规则。
- N-06 — §5「缺失时」列措辞不一致：「保持 Open / 不得用文案关闭 / 保持未决 / 不得声称 URL 已安全 / 用户确认前未决 / 保持观察项」语义相同但表述各异，可统一为「保持 Open/未决 + 具体禁令」。
- N-07 — §8 第 8 条「本 Spec 本身通过不改变 0036 用户行为」缺动词，语句不完整；建议改为「确认本 Spec 本身不改变…」。

---

## Contradictions

- C-01 = S-01 根因：N-001/N-007 的 B 项绑定（「V5 相关段落」「业务确认」）与 line 17 的 B/C/D 证据域定义冲突。
- C-02 = S-02 根因：「消除术语歧义」(line 39) 与「不修改既有 0036 Spec」(line 45) + 无落盘定义之间的未解矛盾。
- C-03 — line 3/88 的 `UPSTREAM_GATE_BLOCKED` 与 line 129 的 `REVIEW_BLOCKED` 关系未声明（若同义即矛盾，若异义即缺定义）。

---

## Missing Acceptance Criteria（§8 缺可测试条目）

1. Base receipt 完整性（§4.2）：exact SHA、ref/parent、验收层级、输入 hash、工作树/索引/未跟踪快照、回滚点——§8 无任何条目验证这些字段齐备。
2. 安全/隐私（§7 第 1 条）：最终矩阵不得新增真实联系方式、未成年人原文、账号标识、token、Secret——无条目验证。
3. Provenance / 无写入声明（§6 V6-S3）：「无写入声明」无对应验收条目。
4. 角色分离（§3.2）：Document QA ≠ PM 自我批准、Issue 管理员独立关单——无条目验证该独立性已落实。
5. B 项产物落盘与权威性（见 S-02）：§8 未要求验证「统一/固定/复读」产物已写入约定位置。

---

## Remediation Checklist

- [ ] 修复 S-01：N-001/N-007 绑定去 V5/业务依赖，或改分类；同步 line 17、§5、§8 第 2/3 条三处。
- [ ] 修复 S-02：定义 B 项产物的落盘文件与权威性/生效机制。
- [ ] 补 §8 缺失验收条目（base receipt、PII/Secret、无写入声明、角色独立性、B 项产物落盘）。
- [ ] 在文档内一次性定义「V5」「V6」及 `UPSTREAM_GATE_BLOCKED`/`REVIEW_BLOCKED` 的关系。
- [ ] 澄清 `N-`/`NS-`/`D` 前缀与 `owner/entity/version/hash` 元组。
- [ ] 具名 Document QA owner 或指派规则。
- [ ] §8 第 8 条补全动词；统一 §5「缺失时」措辞。
- [ ] （下游，非本轮）V5 证据到位后，逐条核对 13 项计数、外部 hash/路径与 canonical 当前状态。

## Open-Issue List

- V5_ACCEPTED_EVIDENCE_REF 尚不存在（upstream 硬阻塞，doc 已正确标记 `UPSTREAM_GATE_BLOCKED`）。
- NS-006 申诉放弃/编辑路径业务确认未决。
- NS-003 观察窗口与频率限制是否当前版本冻结未决。
- C 项是否存在需回退 V5 的功能回归未决。
- 是否批准本轮只做文档债务关闭候选（不改 canonical/Spec）未决。

（后三条与 S-01/S-02 修复相互影响，round 2 需在修正后重新核对这些 open item 的表述是否仍自洽。）