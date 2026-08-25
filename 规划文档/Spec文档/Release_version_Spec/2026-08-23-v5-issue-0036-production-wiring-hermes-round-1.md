# Hermes 独立复核报告（Round 1/3）

## Metadata
- 审查对象：`2026-08-23-v5-issue-0036-production-wiring-freeze-spec.md`（sanitized copy）
- 位置：`C:\Users\86166\AppData\Local\Temp\vange-hermes-review-a428974d-72e1-4dec-ac01-2b32844f60c2\`
- 规模：265 行 / 18,812 字节
- 复核模型：deepseek-v4-pro
- 复核模式：只读，未修改文件，未代表用户批准
- 上游断言（V5 closing Spec SHA、Hermes Round 2 "SERIOUS=0"、commit 03da0015、S2 证据 636 passed 等）属于外部声明，本次仅按文档内部自洽性审查，不验证其真实性。

## Round
1 / 3

## Verdict
**REWORK_REQUIRED** — 存在 2 项 SERIOUS（申诉二审角色与状态机矛盾、编辑路径与版本化公开语义缺失），需交 Document QA 一次性整改。

---

## Serious Findings

### S1 — 申诉二审角色与状态机互相矛盾，可被 primary/backup 绕过二审
- 严重度：SERIOUS
- 位置：§4.1（行 65）vs §5.2（行 92–93）
- 证据：行 65 明确「second reviewer：处理申诉、边界案例」；但行 93 申诉路径为 `rejected -> appeal_pending -> needs_manual_review -> published/rejected`，其终跳 `needs_manual_review -> published/rejected` 唯一对应的转移行 92 标注为「primary/backup 人工决定」。状态枚举（§5.1）里没有独立的「二审待决」状态，`needs_manual_review` 被「规则失败待人工」与「申诉待二审」复用，而转移表未用任何条件区分二者。
- 影响：按冻结合同，primary/backup 可对申诉任务做出 published/rejected 决定，直接违反行 93「不得跳过二审」与 §4.1 角色分配；反之若坚持只有 second reviewer 可决定申诉，则 §5.2 完全没有 second reviewer 的转移行（second reviewer 角色在转移表中零出现）。这是联系方式公开路径上的授权/安全缺陷。
- 修正：新增「second reviewer 决定」转移（如 `appeal_pending -> published/rejected`），或对 `needs_manual_review -> published/rejected` 用已存在的 `appealMode` 字段（§6.2 行 129）门控执行者必须是 second reviewer；并在 audit eventType/operatorRef 校验中强制角色。同时把 second reviewer 显式写进 §5.2。

### S2 — 编辑路径与版本化公开语义不完整，状态机无法表达「编辑已发布内容」
- 严重度：SERIOUS
- 位置：§5.2（行 89、94）vs §5.3（行 104–105）vs §3.1 目标#5（行 40）
- 证据：§5.3 行 104 给出「编辑后新版本路径：用户先形成 draft，生成新 version 和新 content hash，再进入 pending_review」这一**无条件**的一般编辑路径；但 §5.2 转移表里产生 draft 的只有行 90「任一编辑草稿 -> draft」（语义含糊的自环）和行 94「编辑后申诉：rejected -> draft」。表中不存在 `published/pending_review/needs_manual_review -> draft` 的编辑转移。§3.1 目标#5（行 40）承诺「编辑…不会绕过重新审核」，但没有对应转移背书。
- 影响：冻结合同无法表达「用户编辑已 published 内容」这一常态操作；且未定义编辑后**旧版本是否继续公开**——若旧 version 仍是 published，则公开列表在重审期间继续返回旧描述，与 fail-closed 姿态、目标#2（行 37「未完成审核的内容不进入公开列表」）的版本化语义含糊，实现方只能自行猜测。
- 修正：在 §5.2 补全 `published/pending_review/needs_manual_review -> draft`（编辑触发）转移；明确编辑后旧版本的公开可见性（建议 fail-closed：编辑即撤下旧版本，或明确保留旧版本公开的依据与授权边界），并在 §12 证据矩阵增加对应负例。

---

## Non-Serious Findings

- **N1** — §7（行 168）清理规则依赖未定义的「closed」状态：`closed queue/task 元数据保留 30 天`，但 §5.1（行 83）状态枚举无「closed」。清理 job 的删除范围依赖该词，需在清理实现前 pin 定义（建议 = published/rejected/deleted 等终态集合）。
- **N2** — 审计哈希链与保留期张力：§6.3（行 142）`previousEventDigest/eventDigest` 构成链，§7（行 169）180 天后清理删除审计事件会破坏链的可验证性，与 §3.1 目标#6（行 41）「审计可回放」需澄清口径（回放与链验证仅在保留窗口内成立，还是需另外处理）。
- **N3** — 状态声明不一致：文件头（行 3）`DRAFT_NON_CANONICAL / AUTHOR_FROZEN / HERMES_REVIEW_PENDING` 与 §14（行 261）`HERMES_REVIEW_PENDING / USER_CONFIRMATION_PASSED / PRODUCTION_INPUTS_PENDING` 用了两组不同 token；且行 261「USER_CONFIRMATION_PASSED」与行 265「等待后续用户确认」表面矛盾，需澄清「已通过的用户确认」指向的是上游保守默认（§1 行 12），而非本附件执行确认。
- **N4** — §8.1（行 182）API「必须能区分」的状态列表漏列 `published`（§5.1 七态之一），列表不完整。
- **N5** — §4.1 自审禁令仅显式写在 primary 行（行 63），backup/second 行未显式；§6.5（行 162）虽对全体 operator 生效，角色表措辞宜统一为「所有审核角色不得审核自己的 content owner 内容」。
- **N6** — §9（行 201）「至少连续 24 小时观察」无法端到端观察 §4.2（行 74）48h 申诉 SLA，观察窗口与 SLA 覆盖关系未说明。
- **N7** — 队列 claim/锁定语义未定义：§6.2（行 129）`queueRole/assignedAt/dueAt` 的写入时机、原子领取（防两个审核者同时领取同一任务）、primary 超时后 backup 接管的锁定机制，§6.5 与 §4.2 均未契约化。
- **N8** — 幂等键组成未冻结：§6.5（行 164）依赖幂等键隔离，但未定义其字段组成；§6.2（行 132）若 `contentHash` 采用服务端 keyed digest，密钥轮换会破坏行 93「未编辑申诉原内容 hash 不变」的同 hash 判定。
- **N9** — §5.2（行 91）「确定性候选或审核失败」与（行 90）「任一编辑草稿 -> draft」措辞含糊，意图可推断但作为「精确结构合同」宜精化。

---

## Contradictions
1. §4.1（second reviewer 处理申诉）↔ §5.2（申诉终跳由 primary/backup 决定、second reviewer 无转移行）→ 见 S1。
2. §5.3（无条件「编辑→draft→pending_review」）↔ §5.2（仅 `rejected -> draft`）→ 见 S2。
3. §7「不删除审计链来掩盖失败」+ §3.1「审计可回放」↔ §7「audit 保留 180 天后清理」→ 见 N2。
4. §14「USER_CONFIRMATION_PASSED」↔ §14「等待后续用户确认」→ 见 N3。

## Missing Acceptance Criteria
- A1：申诉**仅**由 second reviewer 决定、二审不可跳过的负例测试/证据（对应 S1）。
- A2：编辑已 published 内容后旧版本可见性与新版本强制重审的验收（对应 S2）。
- A3：队列 claim 原子性 / 防双审 / 超时接管锁定的验收（对应 N7）。
- A4：审计链完整性验证（含保留期后链验证口径）的验收（对应 N2）。
- A5：SLA 计时口径与 24h 观察窗口覆盖关系的说明（对应 N6）。

## Remediation Checklist
1. S1：补「second reviewer 决定」转移并写入门控（`appealMode`）与审计 eventType/operatorRef 校验。
2. S2：补 `published/pending_review/needs_manual_review -> draft` 编辑转移，冻结编辑后旧版本公开可见性规则。
3. N1：在 §7 定义「closed」集合。
4. N2：明确「可回放/链验证」与保留期的关系口径。
5. N3：统一状态 token，澄清 USER_CONFIRMATION_PASSED 范围。
6. N4：§8.1 状态列表补 `published`。
7. N5：§4.1 自审禁令统一到全部审核角色。
8. N6/N7/N8/N9：按各 finding 的修正说明落地（观察窗口口径、队列 claim 契约、幂等键组成、措辞精化）。

## Open-Issue List
- S1、S2 两项 SERIOUS 待 Document QA 一次性整改后进入 Round 2 验证。
- 文档自承的「PRODUCTION_INPUTS_PENDING」类待补证据（真实账号绑定、schema/index/transaction 实证、UI/API 接线、预生产/生产 revision、24h 观察、回滚演练、独立生产复核、产品/业务验收、Issue 关单）仍属生产前硬门，本复核不视为本附件缺陷，但要求各自单独取证（与文档 §14 一致）。
- 上游 V5 Spec / Round 2 / S2 / commit 哈希等外部断言未经本复核验证，仅接受为引用。

（说明：本次为只读复核，未编辑任何文件；以上结论不构成对用户批准或 Issue 关闭的任何声称。）