# V7｜ISSUE-0035 现有证据与数据库延期后的文档债务关单范围调整附录

> 文档状态：`DRAFT_NON_CANONICAL / AUTHOR_DRAFT / HERMES_REVIEW_PENDING`  
> 审查预算：`MAX_REVIEW_ROUNDS=3`，当前 `CURRENT_REVIEW_ROUND=1/3`  
> 目标 Issue：`ISSUE-0035`；唯一写入 owner：产品经理 Agent v2.3.2（`019fefa7-9883-7af2-bdb5-acc5c8513781`）  
> 本附录是用户明确选择保守 C 路径后的 material scope adjustment；不修改旧 V7 Spec，不启动 `ISSUE-0031`，不把延期或转移写成完成。

## 1. 决策、范围与当前状态

### 1.1 事实来源

| 来源 ID | 来源 | SHA-256 | 本附录用途 |
| --- | --- | --- | --- |
| `SRC-01` | `协同工作文档/ISSUE/Open_Issue/ISSUE-0035-联合Spec首轮非阻塞文档审查改进台账.md` | `E1221666D0DC0B3E2BAEBEDE777F3DBE7FB596C3F4F2607FEACAA96BFC9E0A26` | N-001～N-015 的原始发现、A/B/C 历史分类与责任边界 |
| `SRC-02` | `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0035-联合Spec文档债务关闭-spec.md` | `B51D37004F5123660FF863E4C8A0776B13F0F044C4AFD8C7438C1638E9F66BF4` | 原 V7 目标、非目标、15 项契约和 N-006 冲突规则；保持历史只读 |
| `SRC-03` | `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0035-联合Spec文档债务关闭-hermes-round-1.md` | `578B2ACBD243149F02C4A99FDE464AD742538E2311A53385A6065B9EDAD4F580` | N-011 的旧 V7 Round 1 report provenance；只作历史报告证据，不改写旧周期 |
| `SRC-04` | `协同工作文档/ISSUE/Open_Issue/ISSUE-0045-0035联合Spec关闭Spec-Hermes-Round1非阻塞文档债务.md` | `56DF9D73016F4514EDF5B4CDEBFBCACDE3773454B522B502110956CD4C1973A8` | 旧 V7 R1 的 N1-N6/MAC1-MAC4 非阻塞承载关系；不重复登记、不修改 |
| `SRC-05` | `协同工作文档/ISSUE/Issue_List/ISSUE总表.md` | `33EC95EA892DEDC4908CF71FD5467E0983E1D237F83375B73006E33572478B3A` | 当前 Issue 状态与 Active Open；只读快照 |
| `SRC-06` | `协同工作文档/ISSUE/Close_Issue/ISSUE-0038-0036联系方式快速智能审核Spec首轮非阻塞文档审查改进台账.md` | `804CAA1A3B5C0183232D497959802A68ED80C4B8E8216DD9C9008794EC8487E9` | V6/0038 仅自身已关闭，解除 V7 文档依赖；不转移功能完成结论 |
| `SRC-07` | `协同工作文档/ISSUE/Close_Issue/ISSUE-0034-全站安全基线与加固计划.md` | `D5AB0E7D9C166F0E640B1130A4B4A9974624C1574CFD27BE80222C7EE5222DDE` | N-003 的安全负例/生产安全候选证据及其残余限制 |
| `SRC-08` | `协同工作文档/ISSUE/Close_Issue/ISSUE-0033-已发布需求与信息的用户自主管理.md` | `B6800C703A11FB73F2E9383985E73675EEA7F1835E89A1EEFD8A6B4A71CE75ED` | N-010 的事务、幂等、失败、回滚候选证据；不自动等于补偿合同 |
| `SRC-09` | `协同工作文档/ISSUE/Close_Issue/ISSUE-0017-风险反馈举报投诉最小记录能力缺口.md` | `1D9750D2CA5E6AD93D8A5EC23AE72B8CC26790DAC1BB267A5B72BAA7866B2275` | N-013 的 risk_feedback 实现、集合与生产 POST 候选证据；不自动补齐全部产品决策 |

当前事实：`ISSUE-0035=open / NON_BLOCKING_DOCUMENT_REVIEW`；原台账历史计数为 A=5、B=6、C=4、D=0；`ISSUE-0038=closed / WORKFLOW_COMPLETE` 仅适用于自身；项目 workflow 仍为 `WORKFLOW_ACTIVE`；Active Open 精确为 `ISSUE-0031/0035/0040/0041/0042/0043/0044/0045/0046`。用户已明确“进行下一步，直至关闭”，本附录将其限定为本次保守文档-only范围，不替 Issue 管理员作状态变更。

### 1.2 调整后的关闭口径

本轮仅允许把 ISSUE-0035 的当前批准文档债务范围整理为：既有文档证据可复读的 A/B 项完成当前文档采纳；证据不足或依赖未解除的 C 项明确 `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER`，保留 owner、future trigger 和不可声称结论。若最终门禁通过，关闭候选只表示“当前批准范围的文档债务处置完成”，不表示数据库迁移、补偿事务生产演练、生产安全无风险、任何代码/生产功能完成或项目 workflow 完成。

### 1.3 非目标与不可声称

- 不启动、设计、采购、迁移、双写、查询或恢复 `ISSUE-0031` 的数据库/CloudBase 认证数据；数据库、付费和采购继续延期。
- 不修改旧 V7 Spec、旧 Hermes 报告、ISSUE-0035/0031/0045 canonical、Issue 总表、代码、UI、平台、中央注册或角色文件。
- 不以 `ISSUE-0034` 的已接受残余风险、`ISSUE-0033` 的自身生产闭环或 `ISSUE-0017` 的自身反馈闭环冒充本 Issue 的全部 C 项证据。
- 不启动 AI/provider/OCR、额外出域、自动公开、生产人工审核或新的部署；确定性扫描、既有 flag-off 证据不等于智能审核已上线。
- 本附录通过、Hermes 通过、用户确认或分支不存在，均不自动关闭 ISSUE-0035；只有 ISSUE 管理员按当前或经批准的新规则独立复读并更新 canonical 才可能关闭。

## 2. 角色、依赖与证据分层

| 角色 | 本附录责任 | 明确边界 |
| --- | --- | --- |
| 产品经理 Agent v2.3.2 | 维护本附录、15 项矩阵、用户可见边界和工作记录 | 不实现、不迁移、不部署、不改 Issue canonical |
| 项目总负责人 | 冻结范围、核验来源、路由 Hermes/QA/Issue 管理员 | 不代替专业 owner 自证或修改他人文件 |
| Document QA | 仅在 Hermes 产生 SERIOUS 时，按完整批次整改本附录及指定 ledger | 不处理 NON_SERIOUS，不修改旧 Spec/Issue |
| 对应 C 项 owner | 未来提供 N-003/N-010/N-013 的专项证据 | 当前无授权时不进入实现/生产 |
| ISSUE-0031 owner/业务方 | 未来处理 N-006 与数据库恢复决策 | 当前延期，不由 V7 代做 |
| ISSUE 管理员 | 独立复读矩阵、receipt 和关闭规则并维护 ISSUE-0035 | 不得把转移项无记录豁免为已解决 |

依赖顺序为：V6/ISSUE-0038 已仅自身关闭 → 本附录文档审查 → 用户确认本次保守范围 → ISSUE 管理员独立关单审查。V7 是 doc-only；V6 Close canonical SHA=`804CAA1A3B5C0183232D497959802A68ED80C4B8E8216DD9C9008794EC8487E9` 仅证明 0038 自身文档债务已关闭，不替代 V7 的 15 项矩阵。

## 3. N-001～N-015 当前处置矩阵

处置标记定义：`CURRENT_CLOSURE_SUFFICIENT` 仅表示当前批准的文档-only关闭范围已有足够可复读的文档绑定，不表示相关运行能力或生产门通过；`N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` 表示本轮不将该项写成完成，转由已有 C 项/上游 tracker 持续承载。

| ID | 历史分类 | 当前处置 | 精确证据/引用与边界 | owner | future trigger |
| --- | --- | --- | --- | --- | --- |
| N-001 | A | `CURRENT_CLOSURE_SUFFICIENT` | 原 V7 Spec §4.2、§5 N-001；本附录声明不创建 V7 分支，分支命名只作文档规则 | 产品经理/Issue 管理员 | 若后续确需分支，先由总负责人提供独立 base receipt |
| N-002 | B | `CURRENT_CLOSURE_SUFFICIENT` | 原 V7 Spec §2.1、§5 N-002、§7；本轮只关闭完整业务周期的文档绑定，不承诺运行周期或业务 SLA | 产品经理/业务方 | 业务方要求量化真实周期/退出条件时另行形成决策与证据 |
| N-003 | C | `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` → `ISSUE-0035` C 项门，并由 `ISSUE-0041`/安全 owner 继续追踪 | 0034 Close SHA=`D5AB0E7D9C166F0E640B1130A4B4A9974624C1574CFD27BE80222C7EE5222DDE` 可作安全负例与生产安全边界候选；其中认证生产矩阵不可用、监控/回滚与 provenance 限制已保留，不能声称 N-003 的全部专属负测已完成 | 安全 owner/项目总负责人 | 明确 N-003 对象矩阵、告警、回滚与独立安全复核后再重审 |
| N-004 | B | `CURRENT_CLOSURE_SUFFICIENT` | 原 V7 Spec §5 N-004；沿用 Header 与真实访问轨迹的既有来源引用，不改变真实行为 | 产品经理/Issue 管理员 | 来源路径或实际访问规则变更时重新复读 |
| N-005 | B | `CURRENT_CLOSURE_SUFFICIENT` | 原 V7 Spec §5 N-005；保持 provider-neutral CHALLENGE 变量，真实 provider/Secret/region/成本不由本附录选择 | 产品经理/0032 owner | provider-specific 或生产接入另走 ISSUE-0032/0046 门禁 |
| N-006 | C | `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` → `ISSUE-0031` | 原 V7 Spec §6.1–§6.3；CloudBase 内置认证可迁移性仍未知，不能把数据库延期写成已解决 | ISSUE-0031 owner/业务方 | 0031 恢复后完成适配、迁移、恢复、对账、回滚与业务确认 |
| N-007 | A | `CURRENT_CLOSURE_SUFFICIENT` | 原 V7 Spec §5 N-007；引用既有 deletedAt/48h 语义，不自行延长或改变保留期 | 产品经理/Issue 管理员 | 业务修改删除/恢复窗口时重新确认 |
| N-008 | A | `CURRENT_CLOSURE_SUFFICIENT`（仅文档绑定） | 原 V7 Spec §5 N-008；RPO/RTO、限流、SQL 阈值仍明确为建议/待确认值，不声称已量化或生产通过 | 产品经理/业务方/0031 owner | 业务方冻结量化值并取得适用技术/生产证据 |
| N-009 | A | `CURRENT_CLOSURE_SUFFICIENT` | 原 V7 Spec §5 N-009 与 ISSUE-0034 Close “关单证据链”；历史生产引用只作来源，不推导新版本 | 产品经理/项目总负责人 | 生产基线变更时更新引用并独立复读 |
| N-010 | C | `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` → `ISSUE-0035` C 项门 | 0033 Close SHA=`B6800C703A11FB73F2E9383985E73675EEA7F1835E89A1EEFD8A6B4A71CE75ED` 证明其自身 CloudBase 事务、幂等、失败回滚和清理证据；未形成 ISSUE-0035 专属补偿事务可接受标准，不能升格为完成 | 0033/0035 C 项 owner、技术与业务 owner | 明确关系一致、幂等、对账、补偿/回滚和故障注入的专项标准与独立复核 |
| N-011 | B | `CURRENT_CLOSURE_SUFFICIENT` | 原 V7 Spec §5 N-011（`SRC-02`）与 §1.1 已登记完整路径/hash 的旧 V7 R1 report（`SRC-03`）；区分 reviewed source、sidecar/report/ledger 与当前附录 | 产品经理/项目总负责人 | provenance 文件或审查周期变更时重新绑定 |
| N-012 | B | `CURRENT_CLOSURE_SUFFICIENT` | 原 V7 Spec §5 N-012；本附录固定 task ID 中 `R1` 是来源发现批次语义，不改变 Hermes `1/3` 计数，也不制造旧周期 Round 4 | 产品经理/Issue 管理员 | 命名约定变更时更新 canonical 交叉引用 |
| N-013 | C | `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` → `ISSUE-0035` C 项门 | 0017 Close SHA=`1D9750D2CA5E6AD93D8A5EC23AE72B8CC26790DAC1BB267A5B72BAA7866B2275` 证明 `/feedback`、最小记录、集合与目标环境 POST 证据；仍不足以独立证明本联合 Spec 所需用途、关联、保留、owner 全套契约 | 0035 C 项 owner/产品与安全 owner | 冻结用途、最小字段、关联、保留、访问 owner 并取得独立复读 |
| N-014 | A | `CURRENT_CLOSURE_SUFFICIENT` | 原 V7 Spec §5 N-014；绑定既有恢复窗口、删除与审计规则，不新增保留期，不把 0031 迁移纳入 | 产品经理/Issue 管理员 | 删除/恢复或审计规则改变时重新复读 |
| N-015 | B | `CURRENT_CLOSURE_SUFFICIENT` | 原 V7 Spec §3、§5 N-015、当前注册角色及本附录单一 owner 规则；PM、总负责人、QA、Issue 管理员责任分离 | 产品经理/项目总负责人 | 角色注册或写入 owner 改变时重新冻结 |

矩阵计数：当前文档采纳候选为 11 项（A=5、B=6）；当前转移/延期项为 N-003、N-006、N-010、N-013 四项，保持其原 C 风险；全部 B 项的“完成”均严格限于文档 binding，不是实现或生产通过。原始 A/B/C 历史分类不改写。

## 4. N-003、N-010、N-013 的证据裁决

### 4.1 N-003 安全负例

ISSUE-0034 Close 可作为候选来源，因为它记录了安全负例、独立安全复核、Deploy 066 及产品接受的边界；但同一 canonical 明确保留 `AUTHENTICATED_PRODUCTION_EVIDENCE_UNAVAILABLE`、未执行真实反向回滚和平台 Git provenance 限制。故本附录只采纳“来源可复读、边界可复读”，不采纳“0035 的 IDOR、批量枚举、跨账号、失败闭环、告警和回滚全部已证明”。N-003 留在原 C 项门，未来必须提供与 N-003 对象/接口直接对应的负测、告警、停止/恢复和独立复核。

### 4.2 N-010 补偿事务

ISSUE-0033 Close 记录了真实 CloudBase 事务、幂等、失败回滚、清理和生产闭环，但这些证据针对 ISSUE-0033 自身生命周期。它没有在当前可复读范围内冻结 ISSUE-0035 所需的补偿事务可接受关系、对账、不一致处理、重复执行、回滚失败和业务风险标准。因此本轮不写 `CURRENT_CLOSURE_SUFFICIENT`，仅转回 ISSUE-0035 C 项门；未来不得用“0033 已关闭”替代专项验收。

### 4.3 N-013 risk_feedback

ISSUE-0017 Close 证明 `/feedback` 或等价入口、最小记录、匿名策略、成功/失败提示、`risk_feedback_records` 集合和目标环境 POST 写入曾具备自身关闭证据；但 N-013 还要求与联合 Spec 对齐的用途、必要关联、保留、访问 owner 和审计边界。现有关闭 canonical 未将这些项目逐一固化为本 Issue 的完整合同，故仅作为候选来源，不写当前完成，转回 ISSUE-0035 C 项门。不得扩展为即时客服、人工仲裁、退款、担保或处理 SLA。

## 5. 数据库延期冲突与 doc-only 分支边界

- N-006 固定为 `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER → ISSUE-0031`，状态是上游延期/未解除，不是 resolved；本附录不启动 ISSUE-0031，不查询或写入数据库，不采购、不付费、不双写。
- V7 本轮为纯文档采纳链，branch/base/deploy/production 对当前关闭范围为 `N/A`；“N/A”仅表示该层不适用，不能被解释为代码、提交、部署或生产证据。
- 不制造空分支、不创建 Git receipt。若后续总负责人判断确需 V7 分支，必须先从已验收 V6 Close 的精确来源取得独立 base receipt，核验 ref/parent/tree/工作树/未跟踪和无跨 Issue 携带，再由授权角色另行执行；本附录不执行 Git mutation。
- 0038 的关闭只解除 V7 的文档依赖入口，不把 0038 的 `WORKFLOW_COMPLETE` 扩写为 0035 或项目完成。

## 6. 安全、隐私、未成年人、失败与回滚

- 不复制真实未成年人信息、联系方式、Secret、Cookie、生产记录或数据库内容；引用只保留路径、hash、可复读章节和边界。
- 任何来源 hash/路径不一致、矩阵项缺 owner/trigger、延期被写成 resolved、C 项证据被跨 Issue 复用、或出现循环引用，均为 `REVIEW_BLOCKED`，不得关单。
- N-003 发现越权、批量枚举、联系方式或未成年人字段泄露时，停止相关后续动作并回到安全 owner；N-010 出现事务不一致或回滚失败时保持停止/人工处置；N-013 出现反馈数据越权或超范围用途时保持 fail-closed。
- 文档回滚只回到上一份可复读的附录快照；不删除旧 Spec、报告、台账或关闭 canonical。未来范围恢复须由用户重新确认，并经新 Spec、实现、独立复核、适用生产证据、产品验收和 Issue 管理员门禁。

## 7. 证据与验收矩阵

`SOURCE_RECEIPT_SET` 固定为 §1.1 的 `SRC-01`～`SRC-09`，不得以 5/8、8/9 等不完整数量简称替代。ISSUE 管理员的独立 receipt 必须对九个来源逐项记录来源 ID、完整路径、SHA-256、文件存在且可回读、与“本附录用途”对应的章节/锚点，以及未形成当前附录↔来源↔Issue 台账的循环引用；任一来源缺失、hash 不符、用途锚点不可读或出现循环引用，均按 §6 进入 `REVIEW_BLOCKED`。该 receipt 还必须明确 `SRC-02`/`SRC-03` 共同覆盖 N-011 的 reviewed source 与历史 report provenance，`SRC-04` 仅承载旧 R1 非阻塞项，`SRC-05` 仅证明只读 Issue 状态快照，三者不得互相替代。

| 阶段 | 必需证据 | 本轮结论 |
| --- | --- | --- |
| 文档来源核验 | §1.1 `SRC-01`～`SRC-09` 逐项完整路径/hash/用途锚点/可回读性/无循环引用，与 `SOURCE_RECEIPT_SET` 一一对应 | 本附录已完成九项绑定；管理员独立 receipt 尚未完成 |
| Hermes | 本附录脱敏副本、`deepseek-v4-pro` Round 1/3、canonical unchanged | 当前 `HERMES_REVIEW_PENDING` |
| Document QA | 仅 SERIOUS 批次一次性整改及 ledger | 仅在 Hermes SERIOUS>0 时触发 |
| N-003 | 专项安全负例、告警/停止/回滚、独立安全复核 | 本轮 N/A/转移，不用 0034 关闭替代 |
| N-010 | 补偿事务故障注入、幂等/对账/回滚和业务接受 | 本轮 N/A/转移，不用 0033 关闭替代 |
| N-013 | 用途/字段/关联/保留/owner/审计与适用生产证据 | 本轮 N/A/转移，不用 0017 关闭替代 |
| Issue 关闭 | 用户确认、最终附录 hash、source/report/ledger receipt、管理员独立回读 | 未完成；不得自动关闭 |

可测试标准：N-001～N-015 每项均有且仅有一个当前处置、owner、future trigger 和来源；N-006 明确指向 ISSUE-0031 且无迁移动作；N-003/N-010/N-013 不出现 `CURRENT_CLOSURE_SUFFICIENT`；A/B 文档绑定不改变行为；doc-only 结论不生成代码/生产/数据库证据；所有报告和最终 hash 可回读。

## 8. 用户确认门、Issue 分离与未来重开

本附录将用户“进行下一步，直至关闭”的授权限定为上述 material scope adjustment：允许在不启动 0031、数据库、支付、代码、部署和生产动作的前提下继续本附录及适用文档门。该授权不等于用户已接受 N-003/N-010/N-013 的未完成证据，不等于数据库风险接受，不等于 ISSUE-0035 已关闭，也不替 Issue 管理员执行状态迁移。

未来如业务方重新要求数据库迁移、补偿事务生产演练、安全生产负测、risk_feedback 完整运营契约或任一运行功能，必须重开/继任对应 Issue，重新形成 Spec、实现、测试、独立复核、适用部署/生产和业务验收；不得以本附录关闭结果直接恢复功能。

## 9. 审查与唯一下一步

本附录已完成 Hermes CLI `deepseek-v4-pro` Round 1/3，正文 verdict=`REWORK_REQUIRED`，共享计数保持 `1/3`；本次 Document QA 仅整改 Round 1 的 S1/S2 及受影响回归，不重置轮次，不修改旧 V7 周期，不处理 NON_SERIOUS，也不得静默 fallback 或进入第四轮。

若 SERIOUS>0，状态为 `QA_DOCUMENT_REWORK`，由项目总负责人把完整批次交已登记 Document QA owner，不由本产品经理自行修订；若 SERIOUS=0，文档门可进入 `DOCUMENT_GATE_PASSED`，随后保持 `USER_CONFIRMATION_PENDING`，再路由 ISSUE 管理员独立关单审查。Hermes 或用户确认均不自动关闭 Issue。

本次 QA 整改后的唯一下一步：由项目总负责人路由产品经理执行 focused Hermes Round 2/3，仅复核 S1、S2 与受影响回归；本线程不运行 Hermes、不实现、不部署、不操作数据库/平台、不修改 Issue。
