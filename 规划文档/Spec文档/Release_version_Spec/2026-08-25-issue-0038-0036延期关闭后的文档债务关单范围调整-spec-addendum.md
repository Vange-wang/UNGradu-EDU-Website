# V6 / ISSUE-0038：0036 延期关闭后的文档债务关单范围调整附录

文档类型：`ISSUE_SCOPE_ADJUSTMENT_ADDENDUM`
文档状态：`AUTHOR_DRAFT / QA_SERIOUS_REMEDIATED / HERMES_ROUND_3_PENDING`
新审查周期：`MAX_REVIEW_ROUNDS=3`；`CURRENT_REVIEW_ROUND=2/3`（Round 2 已完成，Round 3 待执行）
目标 Issue：`ISSUE-0038`
项目 workflow：`WORKFLOW_ACTIVE`
责任角色/单一写入 owner：产品经理 Agent v2.3.2（019fefa7-9883-7af2-bdb5-acc5c8513781）

> 本附录是 ISSUE-0036 按“人工审核延期、暂缓需求/范围调整后关闭”口径关闭后产生的实质范围调整。它只处理 ISSUE-0038 文档债务，不恢复 0036 功能，不启用 AI/人工审核，不改变代码、数据库、平台、部署或生产行为。旧 V6 Spec 及其 Hermes Round 1/2/3（3/3）历史保持不变；本附录不是旧周期 Round 4。

## 1. 新事实、依赖关系与关闭边界

ISSUE-0036 当前关闭 canonical：

`协同工作文档/ISSUE/Close_Issue/ISSUE-0036-家长需求与老师资料的联系方式快速智能审核.md`；SHA-256=`4243F74233FA1BA9011FE2FEC6732614EC424933732A190C1320FDFB6CEC7531`。

其关闭语义仅为：在人工审核延期的 material scope adjustment 下，bounded 本地/集成/合成安全骨架和 flag-off 边界按调整后范围收口；不代表生产 AI、生产人工审核、reviewer/Secret、人工队列/申诉生产闭环、flag-on、自动公开、部署、生产观察或回滚演练完成。项目 workflow 仍为 `WORKFLOW_ACTIVE`。

当前 ISSUE-0038 原始台账仍为 `open / NON_BLOCKING_DOCUMENT_REVIEW`；台账 SHA-256=`FA9B4588658140940B54589118FC54E0112A9AA35446F1209BC33A15AB33A501`。本附录不修改其 canonical/state，也不宣布 0038 已关闭。

依赖证据：

| 来源 | 精确绑定 | 本附录用途 |
|---|---|---|
| 0038 原 V6 Spec | `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0038-联系方式审核文档债务关闭-spec.md`；SHA-256=`7248241D9EBE78FC0E6D9491CBAE5BC87C8C3423AA1BC65E6E81DC6AE72AFD46` | 保留原 13 项 B=7/C=5/D=1 分类、文档采纳链和非功能范围 |
| 原 ISSUE-0036 Spec | `规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-联系方式快速智能审核-spec.md`；SHA-256=`005EA5F2490DC2E43A134BA0421EFBD357179C90E29A6F2AB560F6F61A97B437`；适用锚点详见 §3.1 `B_EVIDENCE_INDEX` | 7 项 B 的唯一原始 Spec 文档事实来源；只供文档复读，不构成功能、业务或生产证据 |
| 0038 Hermes 历史 | R1=`2151DC34C2E6757DF65266E1568CC1DFD9CB438D1DCBEA540877B95D51371C1E`；R2=`72A02E04B29DCB2724231E4DD29915F7C706F9408B1333DF9244CA5340F6862A`；R3=`5721D48B8BE4E54AC4FC477737398CA825C3CA1AB38B5737579D09C22A04D6B4` | 证明旧周期已完成 3/3；不得补跑第四轮 |
| ISSUE-0038 非阻塞台账 | `协同工作文档/ISSUE/Open_Issue/ISSUE-0044-0038联系方式审核文档债务关闭Spec-Hermes-Round1非阻塞文档债务.md`；SHA-256=`C0C2A36D2B5A886126D12C9169AEBEE1059CC0C1F9394E5E967BCDF68488CD8F` | 继续承载既有 NON_SERIOUS/N-08 文档债务；本附录不修改该台账 |
| V5 bounded 产品/实现证据 | 产品裁决 `规划文档/产品迭代/2026-08-24-v5-issue-0036-产品验收与生产接线准备裁决.md`；SHA-256=`FA56F5D140D6E053321C173CB3ECA591358F75FBC7172AA88CDEE6EC56392789`；commit=`f8ad5d009c5483d6791699d2c2394765a23fb2f2`；tree=`19b903a8a4e6e2ece653c2c175cbcbbdfadae352` | 仅作为 bounded local/integrated/synthetic 与 flag-off 证据，不升级为生产证据 |
| V5 关闭 canonical | 上述 0036 close canonical | 证明当前范围调整后的 0036 关闭边界，不证明原始功能目标完成 |

当前生产配置必须继续为 `CONTACT_REVIEW_ENABLED=false`、`CONTACT_REVIEW_SCHEMA_READY=false`；本附录不写 Secret、不配置 reviewer、不创建审核任务、不部署、不操作平台。

## 2. 本次调整后的 V6 目标与非目标

### 2.1 目标

在不改变运行行为的前提下，使 ISSUE-0038 的文档债务处置能够诚实复读：

1. 7 项 B 继续走纯文档采纳链；不要求业务确认、业务证据或新业务确认。
2. 5 项 C 和 1 项 D 逐项明确哪些可由已关闭 0036 的 bounded 证据支撑，哪些因 0036 功能延期而对当前关闭 `N/A`，哪些继续由原 0038/ISSUE-0044 等既有台账追踪。
3. 明确 `N/A_FOR_CURRENT_CLOSURE` 不是“已完成”、不是生产通过，也不是静默删除；每一项保留 future trigger、owner 和重开条件。
4. 使 Issue 管理员可独立区分：文档债务关闭、0036 功能范围调整后关闭、生产 AI/人工审核未启用。

### 2.2 非目标

- 不恢复或扩大 ISSUE-0036 的原始生产人工/AI 功能，不实现任何代码、UI、数据库、审核队列、申诉入口或 provider。
- 不启用 AI/OCR/出域、reviewer/Secret、flag-on、自动公开、部署、生产观察、回滚演练或真实生产数据。
- 不修改旧 V6 Spec、旧 R1/R2/R3、ISSUE-0038、ISSUE-0044、Issue 总表或其他 canonical。
- 不把 V5 bounded evidence 写成生产 AI/人工审核完成，不把 0038 附录、分支或矩阵完成写成 Issue 已关闭。

## 3. 13 项最终处置矩阵

处置类别定义：

- `B_DOC_ADMIN_CANDIDATE`：B 项纯文档候选；需绑定本附录最终 hash、适用 Hermes/Document QA 与 ISSUE 管理员 receipt 后才可采纳。
- `V5_BOUNDED_SUFFICIENT`：仅在当前 0036 调整范围内，既有 V5 bounded 证据足以复读该项；不外推生产。
- `N/A_FOR_CURRENT_CLOSURE`：该项依赖已延期的 AI/人工/生产观察或未冻结语义，本轮明确不适用；保留 future trigger，不称已完成。
- `TRANSFER_EXISTING_TRACKER`：不在本附录关闭，继续由 ISSUE-0038 原 C/D 记录或既有 ISSUE-0044 追踪；本轮不修改台账。

### 3.1 B=7 逐项证据索引（`B_EVIDENCE_INDEX`）

下表是 7 项 B 的完整、可测试文档证据索引。每项只绑定同一份冻结原 ISSUE-0036 Spec 的文档事实；路径、SHA-256 和锚点必须同时匹配，不能以文件名、短 hash、主题相似文字或后续功能/生产证据替代。

| 索引 ID | B 项 | source path | source SHA-256 | section / line anchor | 可复读文档事实 |
|---|---|---|---|---|---|
| B-E01 | N-001 | `规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-联系方式快速智能审核-spec.md` | `005EA5F2490DC2E43A134BA0421EFBD357179C90E29A6F2AB560F6F61A97B437` | §5.1–§5.3，第 141–219 行；§10.1，第 398–420 行 | 高置信确定性必须同时满足固定规则、完整模式、上下文、合法数字排除和可映射偏移；AI 单独命中不得自动拒绝/公开；golden cases 覆盖联系方式模式、合法数字反例和 fail-closed。 |
| B-E02 | N-005 | `规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-联系方式快速智能审核-spec.md` | `005EA5F2490DC2E43A134BA0421EFBD357179C90E29A6F2AB560F6F61A97B437` | §5.2，第 195–209 行；§8.2，第 338–349 行；§13，第 544–558 行 | AI 层采用 provider-neutral adapter；变量只列引用名和用途，不写真实 Secret；provider/model/region/预算/密钥均未由该 Spec 自行选择，缺失或不可用时 fail-closed。 |
| B-E03 | N-007 | `规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-联系方式快速智能审核-spec.md` | `005EA5F2490DC2E43A134BA0421EFBD357179C90E29A6F2AB560F6F61A97B437` | §6.1–§6.2.1，第 223–282 行；§10.1–§10.2，第 421–449 行 | 删除期间不公开且聊天/联系方式受限；恢复必须重校验 owner/版本/hash/策略并进入 `deleted → pending_review`，不得直达 `published`；正负验收覆盖恢复重审与越权阻断。 |
| B-E04 | NS-001 | `规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-联系方式快速智能审核-spec.md` | `005EA5F2490DC2E43A134BA0421EFBD357179C90E29A6F2AB560F6F61A97B437` | §6.1，第 227–239 行；§6.2.1，第 265–275 行；§10.1，第 424–427 行 | `appeal_pending` 是拒绝后不改内容申诉的独立中间状态，只能继续 `needs_manual_review`，不得直达 `published`，且不恢复聊天或联系方式；golden path 明确复读该链。 |
| B-E05 | NS-002 | `规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-联系方式快速智能审核-spec.md` | `005EA5F2490DC2E43A134BA0421EFBD357179C90E29A6F2AB560F6F61A97B437` | §6.1，第 241–253 行；§6.2.1，第 265–282 行；§10.1–§10.2，第 421–449 行 | `deleted` 是生命周期覆盖而非新增审核状态；删除立即停止公开，恢复统一进入 `pending_review` 并重新审核，不得恢复到 `published` 或聊天/联系方式能力。 |
| B-E06 | NS-004 | `规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-联系方式快速智能审核-spec.md` | `005EA5F2490DC2E43A134BA0421EFBD357179C90E29A6F2AB560F6F61A97B437` | §7，第 299–310 行；§7.1，第 311–324 行；§10.2，第 440–446 行 | 幂等绑定 owner/entity/version/hash；重复 key 同结果、冲突 key 拒绝且不入队；同 contentHash 连续维持原判达到第 3 次锁 7 天，锁定及负例均 fail-closed。 |
| B-E07 | NS-005 | `规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-联系方式快速智能审核-spec.md` | `005EA5F2490DC2E43A134BA0421EFBD357179C90E29A6F2AB560F6F61A97B437` | §4.2，第 121–137 行；§10.1，第 398–404 行 | 顺序固定为原始 Unicode 混淆扫描 → NFKC/全半角等规范化并建立 offset map → 原文/归一双视图规则 → 结果冲突、偏移失败或信息损失进入人工，禁止直接 allow。 |

索引验收合同：`B-E01`～`B-E07` 必须各有且仅有一个定义行，并各有且仅有一个 §3.2 矩阵回链，分别映射 7 个 B 项；每个定义行的 source path 必须存在且完整文件 SHA-256 必须等于 `005EA5F2490DC2E43A134BA0421EFBD357179C90E29A6F2AB560F6F61A97B437`；每个 section/line anchor 必须能复读到对应“可复读文档事实”。任一路径/hash/锚点缺失、漂移、重复错配或主题不符均为 `REVIEW_BLOCKED`，B 项不得采纳。该索引的业务确认、业务证据、新业务确认和生产证据前置项计数必须为 0。

### 3.2 最终处置矩阵

| 项目 | 类别 | 本轮最终处置 | evidence/ref | owner 与 future trigger |
|---|---|---|---|---|
| N-001 | B | `B_DOC_ADMIN_CANDIDATE` | `B-E01`：原 0036 Spec 高风险自动拒绝边界与合成 golden-case 文档事实；精确 path/hash/anchor 见 §3.1 | 0038 Spec owner；管理员 receipt 采纳后关闭 B 债务 |
| N-005 | B | `B_DOC_ADMIN_CANDIDATE` | `B-E02`：原 0036 Spec provider-neutral、变量名引用及未选择 provider/Secret 的文档边界；精确 path/hash/anchor 见 §3.1 | 0038 Spec owner；同上 |
| N-007 | B | `B_DOC_ADMIN_CANDIDATE` | `B-E03`：原 0036 Spec 删除/恢复重审文档事实；精确 path/hash/anchor 见 §3.1；不把 0036 本次范围调整写成新功能 | 0038 Spec owner；同上 |
| NS-001 | B | `B_DOC_ADMIN_CANDIDATE` | `B-E04`：`appeal_pending` 中间状态与不得直达 published；精确 path/hash/anchor 见 §3.1 | 0038 Spec owner；同上 |
| NS-002 | B | `B_DOC_ADMIN_CANDIDATE` | `B-E05`：`deleted` 生命周期与恢复重审术语；精确 path/hash/anchor 见 §3.1 | 0038 Spec owner；同上 |
| NS-004 | B | `B_DOC_ADMIN_CANDIDATE` | `B-E06`：同 owner/entity/version/hash 的计数、幂等及锁定边界；精确 path/hash/anchor 见 §3.1 | 0038 Spec owner；同上 |
| NS-005 | B | `B_DOC_ADMIN_CANDIDATE` | `B-E07`：Unicode 扫描→规范化/offset→双视图→失败转人工；精确 path/hash/anchor 见 §3.1 | 0038 Spec owner；同上 |
| N-002 | C | `V5_BOUNDED_SUFFICIENT` | V5 close canonical、product ruling 与 commit/tree 绑定的 bounded 跨账号、owner/entity/version/hash 隔离、幂等和审计证据 | 0038/V5 owner；不外推生产持久层，管理员复读时核 hash |
| N-003 | C | `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` | 生产重试次数、退避、成本/SLO 依赖未启用的 AI/人工/生产路径；0036 当前范围不冻结建议次数 | 0038 owner/ISSUE-0044；未来重新启用功能或出现观察需求时重开 C 门 |
| N-004 | C | `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` | 生产 provider 失败/超时退避不适用；当前无 AI provider/出域，不能写成 AI failover 已验证 | 0038 owner/ISSUE-0044；未来 provider 授权时回到新 Spec |
| N-006 | C | `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` | 当前范围明确 OCR/URL/嵌入不启用；bounded flag-off 证据可证明未启用，不证明 URL 已安全 | 0038 owner/ISSUE-0044；未来纳入 URL/OCR 时重新复核 |
| NS-006 | C | `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` | 生产申诉放弃/编辑路径依赖未启用人工审核与未冻结产品语义；不得虚构业务确认 | 0038 owner/ISSUE-0044；未来恢复 0036 时由业务确认并重审 |
| NS-003 | D | `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` | 生产观察窗口与 rejected→draft 频率决定未发生；本次 flag-off/文档-only 范围不产生观察样本 | 0038 owner/ISSUE-0044；未来 flag-on/生产观察或后续版本触发 |

矩阵的含义是“当前范围的最终处置”，不是把 N/A 项标记为已完成。所有 C/D 项的原始债务、未来 owner 和触发条件继续可从 ISSUE-0038/ISSUE-0044 复读；不得静默丢失或删除。

## 4. 证据层级与关单候选门

### 4.1 文档-only 关单候选

本附录通过自身 Hermes/适用 Document QA 后，仅可提出以下候选：

- B=7：§3.1 `B_EVIDENCE_INDEX` 中逐项精确路径/hash/段落的既有文档引用 + 本附录最终 hash 绑定的审查证据 + ISSUE 管理员采纳 receipt；B 不要求业务确认。
- C/D：按第 3 节明确为 `V5_BOUNDED_SUFFICIENT` 或 `N/A_FOR_CURRENT_CLOSURE`，并保留 existing tracker、owner 和 future trigger；N/A 不代表功能或生产完成。
- 关闭记录必须明确：ISSUE-0038 仅处理当前批准范围内的文档债务；0036 原始生产审核目标、AI provider、人工审核、flag-on 和部署仍未完成。
- 在业务方确认本附录、适用文档门通过、证据索引完整且 ISSUE 管理员独立复读前，ISSUE-0038 保持 `open / NON_BLOCKING_DOCUMENT_REVIEW`。

### 4.2 不适用生产证据

由于本次范围明确 no-code/no-deploy/no-production：

- 不执行或要求新的生产观察、生产人工审核、生产 AI、回滚演练、数据库事务或审核员配置；
- 不把 V5 `PRODUCT_ACCEPTANCE_PASS`、`DEPLOYMENT_ALLOWED_FLAG_OFF_ONLY` 或 `PRODUCTION_FLAG_ON_BLOCKED` 改写为生产 PASS；
- 不把 V5 commit/tree 改写为本次 V6 分支已验收 base，不把 branch completion 当作 Issue 关闭。

## 5. V6 分支与 base receipt 边界

本附录作者、Hermes 和文档 QA 阶段不创建 V6 分支；纯文档关单候选不因本附录自动授权 Git 操作。若项目总负责人后续判断最终管理员采纳必须绑定 V6 分支，则计划分支仍为 `V6-issue-0038-contact-review-doc-debt-closure`，可记录的 base 仅是：

- candidate commit=`f8ad5d009c5483d6791699d2c2394765a23fb2f2`；tree=`19b903a8a4e6e2ece653c2c175cbcbbdfadae352`；
- 该 commit 只是 0036 bounded local/synthetic、flag-off 范围的候选输入，不是 V6 `BASE_ACCEPTED`，也不是生产 revision；
- 必须由项目总负责人另行制作并核验 V6 base receipt：exact SHA/ref/parent、V5 关闭层级、输入文件 hash、工作树/索引/未跟踪快照、无跨 Issue 携带、文档回滚点；
- 在该独立 receipt 与用户授权前，不创建分支、不执行 Git mutation、不把 candidate 写成已验收 base。

## 6. 安全、隐私、失败、回滚与未来重开

- 本附录、矩阵、截图和审查副本不得写入真实联系方式、未成年人原文、账号标识、token、Secret、provider 响应或生产业务数据。
- 引用路径/hash 漂移、循环引用、owner 不明、C/D 误写为完成、flag 配置非 false、出现自动公开或生产副作用时，状态为 `REVIEW_BLOCKED`，停止文档采纳。
- 文档回滚点是本附录上一份可验证快照；不得删除旧 Spec、旧 Hermes/QA 报告或旧 ISSUE-0044 追踪。
- 业务方未来若重新启用联系方式审核，必须重开 ISSUE-0036 或建立明确继任 Issue，重新经过新 Spec、用户确认、实现、独立技术/UI复核、部署/生产证据、产品/业务验收和 Issue 管理员关单；在此前双 flag 继续 false。

## 7. 当前门禁与唯一下一步

本附录当前为 `AUTHOR_DRAFT / QA_SERIOUS_REMEDIATED / HERMES_ROUND_3_PENDING`，不是 `DOCUMENT_GATE_PASSED`，不授权 0038 关闭、0036 恢复、实现、部署或生产动作。旧 V6 Spec 的 3/3 历史保持不变；本附录新周期 Round 1/3 与 Round 2/3 均已完成且 verdict 均为 `REWORK_REQUIRED`，当前共享计数为 `2/3`，不得改写历史或重置计数。

### 7.1 Round 1 S-1/S-2 定义与 Round 3 复核范围

本文所称 `R1 S-1`、`R1 S-2` 仅指新附录 Round 1 报告 `规划文档/Spec文档/Release_version_Spec/2026-08-25-issue-0038-0036延期关闭后的文档债务关单范围调整-hermes-round-1.md`（SHA-256=`10DC4847E8B3E90EF13E01E91036DA565B7397671A0EFA37132BC09D34528635`）中的两项 SERIOUS，不得与 Round 2 报告的 `SERIOUS-1/2` 混用：

- `R1 S-1`：§1 依赖表未绑定 7 个 B 项引用的原 ISSUE-0036 Spec 完整路径与 SHA-256。修订落点为 §1“原 ISSUE-0036 Spec”依赖行，必须精确绑定路径、`005EA5F2…A97B437` 完整 hash 与 §3.1 索引入口。
- `R1 S-2`：7 个 B 项缺少逐项 source path、完整 SHA、section/line anchor，且“证据索引完整”不可测试。修订落点为 §3.1 `B_EVIDENCE_INDEX`、§3.2 七个 B 行回链及 §4.1 文档-only 关单候选门。

focused Hermes Round 3/3 的“受影响回归”精确限制为：

1. §1 原 ISSUE-0036 Spec 路径存在、完整 SHA 精确匹配，且只作为 B 项文档事实来源；
2. §3.1 `B-E01`～`B-E07` 各有且仅有一个定义行，并各有且仅有一个 §3.2 回链，7 个 section/line anchor 可复读且主题对应；
3. §4.1 的 B=7 关单候选门明确引用 §3.1，路径/hash/锚点任一缺失或漂移均保持 `REVIEW_BLOCKED`；
4. 13 项矩阵的 B=7/C=5/D=1 分类及处置不漂移：B 仍不要求业务确认、业务证据或新业务确认；N-002 仍为 `V5_BOUNDED_SUFFICIENT`；其余已冻结 C/D 仍为 `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER`，N/A 不等于完成或生产通过；
5. 旧 V6 Spec/R1–R3、新附录 R1/R2 report/metadata 均保持只读，且新周期表头、§7 当前状态与下一步共同表示“Round 2/3 已完成、Round 3/3 待执行”。

唯一下一步：由项目总负责人组织 focused Hermes Round 3/3，仅复核 `R1 S-1`、`R1 S-2`、上述五项受影响回归及本轮轮次/门禁一致性；Document QA 本线程不得运行 Hermes，不得修改旧 V6 Spec、旧 R1/R2/R3 历史或新附录 R1/R2 报告。
