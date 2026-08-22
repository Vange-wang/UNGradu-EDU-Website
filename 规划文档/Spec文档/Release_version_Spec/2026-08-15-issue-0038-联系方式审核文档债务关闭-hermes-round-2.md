# Round 2 Review — ISSUE-0038 联系方式审核文档债务关闭 Spec

## Metadata
- Round: 2 / 3
- Model (invocation): deepseek-v4-pro
- Target: sanitized copy only (`...\tmpialqbp.tmp`); read-only, no edits made, no user approval claimed
- Scope (per bundle header): verify S-01 / S-02 fixes + regressions directly caused by them; non-serious and style not reopened
- Note: external 0036 Spec hashes/line-ranges (145–218, 227–282, 406–410, 421–449) not verifiable against filesystem from the sanitized copy; treated as downstream, as in Round 1

## Verdict

**REWORK_REQUIRED**

S-01 and S-02 are each fixed at the literal level, but the S-02 fix introduces one new serious regression: it re-opens a business-confirmation gate on B-item closure that S-01 explicitly removed. Details below.

## Serious Findings

### S-03 (regression of S-01, introduced by S-02 fix) — B 项关闭路径重新被“业务确认”门控
- Location: §2.4 line 60 + §8 第9条 line 154 vs §1.1 line 21 + §5 N-007 line 110 + §8 第2条 line 147；§3.2 line 80 佐证
- Evidence:
  - S-01 修复（line 110）：N-007 绑定改为「…不要求或伪造新业务确认，不自行延长保留」；line 21 与 §8 第2条（line 147）均写「B 项…不得绑定 V5 功能、生产或业务证据」。即 B 项仅凭已冻结 0036 Spec 文档复读关闭，无需业务确认。
  - S-02 修复（line 60）：B 项矩阵「只有在最终 hash 通过…涉及业务语义时取得业务确认，并由 ISSUE 管理员…采纳…后才成为 0038 的权威绑定。在采纳 receipt 出现前，B 项保持 Open。」
  - §8 第9条（line 154）：B 项权威采纳 receipt 必须含「必要业务确认」。
  - §3.2（line 80）：业务方职责为「确认涉及…联系方式…的产品语义」——N-007（删除/恢复规则）、NS-002（deleted 生命周期）属联系方式产品语义，落在「涉及业务语义」范围。
- Impact: 三处说法相互打架——line 21/110/147 说 B 项无需业务确认、不绑定业务证据；line 60/154 说矩阵须「涉及业务语义时取得业务确认」，且 receipt 前 B 项保持 Open。净效果：B 项（至少 N-007、NS-002 及可能 NS-004/NS-005）仍须业务方确认才能经矩阵采纳关闭，S-01 要删除的「业务确认」依赖被 S-02 的权威模型从侧门放回。Issue 管理员无法确定关闭业务语义类 B 项是否需要业务签字；§8 第9条「必要业务确认」在未定义触发条件时不可测。这与 S-01 原目标「B 项可经文档关闭」直接冲突。
- Correction（二选一并三处同步）：
  1. 若 B 项确为纯文档关闭：把 §2.4 line 60 的「涉及业务语义时取得业务确认」限定为「仅对 C/D 项」，B 项关闭只走 文档复读 + Hermes/Document QA + ISSUE 管理员采纳，不含业务确认；§8 第9条的「必要业务确认」同步删除或改为「不适用于 B 项文档事实」。
  2. 若业务语义类 B 项必须业务签字：将这些项改分类为 C，更新 B=7 计数与 §1.1/§8 第2条，显式推翻 S-01 的 option-2 选择。
  无论哪种，须一次性定义并区分「业务证据（B 禁绑）」「业务确认（§2.4/§8）」「新业务确认（N-007 禁止）」三者关系，并在 §8 增加可测的「涉及业务语义」触发判据。

## Non-Serious Findings（仅修复引入的新表述问题）

- N-08 — `B_HANDLING_MATRIX` 命名范围不清：§2.4 line 60 称其为「7 项 B 的唯一落盘位置」，但 §5 标题（line 104）把含全部 13 项（B+C+D）的表标注为「B_HANDLING_MATRIX 唯一落盘」。该名称指「仅 B 行」还是「整张 13 项表」不明确。非阻断；建议改名或加一句范围说明。

## Contradictions

- C-01 = S-03 根因：§2.4 line 60 / §8 line 154（须业务确认）↔ §1.1 line 21 / §5 line 110 / §8 line 147（B 项不绑业务证据、不要求新业务确认）。
- （原 C-01/C-02 已随 S-01/S-02 表层修复消除；C-03 的 UPSTREAM_GATE_BLOCKED vs REVIEW_BLOCKED 属非严重项，本轮不重开。）

## Missing Acceptance Criteria（仅针对本轮修复引入的缺口）

1. 无条目定义「涉及业务语义」的触发条件，也无条目区分「业务确认」与「业务证据」「新业务确认」——§8 第9条因此不可测。
2. 若采纳上述 Correction 1，需把 §8 第9条改为不含业务确认的 B 采纳判据，并保持与第2条一致。

## Remediation Checklist

- [ ] 修复 S-03：按 Correction 1 或 2 二选一，同步 §2.4、§8 第2/9条、§1.1、§5 N-007（及相关 B 行）。
- [ ] 一次性定义「业务证据 / 业务确认 / 新业务确认」三者关系与「涉及业务语义」触发判据。
- [ ] 澄清 `B_HANDLING_MATRIX` 命名覆盖范围（非阻断）。
- [ ] （下游，非本轮）V5 证据到位后，逐条核对 13 项计数、0036 Spec 行段引用与 canonical 当前状态。

## Open-Issue List

- V5_ACCEPTED_EVIDENCE_REF 尚不存在（upstream 硬阻塞，doc 已正确标记 UPSTREAM_GATE_BLOCKED，未受影响）。
- S-03 业务确认门控歧义未决（本轮新增，需作者在下一轮前处理）。
- NS-006 申诉放弃/编辑路径业务确认未决。
- NS-003 观察窗口与频率限制是否当前版本冻结未决。
- C 项是否存在需回退 V5 的功能回归未决。
- 是否批准本轮只做文档债务关闭候选（不改 canonical/Spec）未决。

结论：S-01 的「去 V5/业务依赖」表层已修复、S-02 的「落盘+权威模型」已补上，但 S-02 引入的权威采纳条件把「业务确认」重新放回 B 项关闭路径，构成一处新的严重矛盾（S-03）。故本轮 REWORK_REQUIRED，非 PASS_WITH_NONBLOCKING_OPEN_ISSUES。