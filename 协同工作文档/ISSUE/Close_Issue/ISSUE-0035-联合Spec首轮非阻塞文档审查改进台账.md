# ISSUE-0035：联合 Spec 首轮非阻塞文档审查改进台账

## 当前关闭状态（2026-08-26；历史段落保留）

- Issue ID：`ISSUE-0035`
- 类型：`documentation / non-blocking review improvement`
- 状态：`closed`
- 工作流状态：`WORKFLOW_COMPLETE`（仅 ISSUE-0035 自身；项目总 workflow 仍为 `WORKFLOW_ACTIVE`）
- 关闭语义：按 2026-08-26 现有证据与数据库延期后的 material scope adjustment，关闭当前批准范围内的文档债务；这是保守 doc-only 范围调整关闭，不表示 N-003/N-006/N-010/N-013 完成，不表示数据库、安全生产、补偿事务、risk_feedback 完整合同、代码、部署或项目完成。
- 用户确认门：`USER_CONFIRMATION_PASSED`。用户明确“进行下一步，直至关闭”；本次授权仅限保守 doc-only scope adjustment，不授权数据库、支付、代码、部署或生产。
- 当前责任：ISSUE 管理员维护本关闭记录；N-003 转入 ISSUE-0041，N-006 继续由 ISSUE-0031 承载，N-010/N-013 转入 ISSUE-0045；各目标 Issue 保持 open 并保留 future trigger。

## SOURCE_RECEIPT_SET（SRC-01～SRC-09）

ISSUE 管理员已逐项完整回读 9 个来源文件并按字节核对 SHA；以下路径、实际 SHA 与用途锚点均匹配附录 §1.1，9 个来源均未反向引用本附录文件名，未发现循环引用：

| 来源 | 完整路径 | 实际 SHA-256 | 可回读用途锚点 | receipt |
| --- | --- | --- | --- | --- |
| `SRC-01` | `协同工作文档/ISSUE/Open_Issue/ISSUE-0035-联合Spec首轮非阻塞文档审查改进台账.md` | `E1221666D0DC0B3E2BAEBEDE777F3DBE7FB596C3F4F2607FEACAA96BFC9E0A26` | N-001～N-015 原始发现、A/B/C/D 分类与责任边界 | `PASS`（写入前 Open canonical） |
| `SRC-02` | `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0035-联合Spec文档债务关闭-spec.md` | `B51D37004F5123660FF863E4C8A0776B13F0F044C4AFD8C7438C1638E9F66BF4` | 原 V7 目标、非目标、15 项契约和 N-006 冲突规则 | `PASS` |
| `SRC-03` | `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0035-联合Spec文档债务关闭-hermes-round-1.md` | `578B2ACBD243149F02C4A99FDE464AD742538E2311A53385A6065B9EDAD4F580` | N-011 的旧 V7 Round 1 provenance | `PASS` |
| `SRC-04` | `协同工作文档/ISSUE/Open_Issue/ISSUE-0045-0035联合Spec关闭Spec-Hermes-Round1非阻塞文档债务.md` | `56DF9D73016F4514EDF5B4CDEBFBCACDE3773454B522B502110956CD4C1973A8` | 旧 V7 R1 N1-N6/MAC1-MAC4 承载关系 | `PASS`（写入前状态） |
| `SRC-05` | `协同工作文档/ISSUE/Issue_List/ISSUE总表.md` | `33EC95EA892DEDC4908CF71FD5467E0983E1D237F83375B73006E33572478B3A` | 当前 Issue 状态与 Active Open 快照 | `PASS`（写入前状态） |
| `SRC-06` | `协同工作文档/ISSUE/Close_Issue/ISSUE-0038-0036联系方式快速智能审核Spec首轮非阻塞文档审查改进台账.md` | `804CAA1A3B5C0183232D497959802A68ED80C4B8E8216DD9C9008794EC8487E9` | 0038 仅自身文档-only 关闭及解除 V7 文档依赖 | `PASS` |
| `SRC-07` | `协同工作文档/ISSUE/Close_Issue/ISSUE-0034-全站安全基线与加固计划.md` | `D5AB0E7D9C166F0E640B1130A4B4A9974624C1574CFD27BE80222C7EE5222DDE` | N-003 安全负例/生产安全候选及残余限制 | `PASS` |
| `SRC-08` | `协同工作文档/ISSUE/Close_Issue/ISSUE-0033-已发布需求与信息的用户自主管理.md` | `B6800C703A11FB73F2E9383985E73675EEA7F1835E89A1EEFD8A6B4A71CE75ED` | N-010 事务、幂等、失败、回滚候选证据 | `PASS` |
| `SRC-09` | `协同工作文档/ISSUE/Close_Issue/ISSUE-0017-风险反馈举报投诉最小记录能力缺口.md` | `1D9750D2CA5E6AD93D8A5EC23AE72B8CC26790DAC1BB267A5B72BAA7866B2275` | N-013 risk_feedback 实现、集合与生产 POST 候选证据 | `PASS` |

`SOURCE_RECEIPT_SET=9/9`。源文件读取、实际 hash、用途锚点和无循环引用均通过；未以产品经理或 Hermes 自证替代源文件复读。

## 15 项矩阵逐项独立复读结论

| ID | 历史分类 | 当前结论 | 说明/未来触发 |
| --- | --- | --- | --- |
| `N-001` | A | `CURRENT_CLOSURE_SUFFICIENT` | 仅文档 binding；分支规则如未来启用须另取 base receipt。 |
| `N-002` | B | `CURRENT_CLOSURE_SUFFICIENT` | 仅完整业务周期的文档绑定，不承诺运行周期或 SLA。 |
| `N-003` | C | `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` → ISSUE-0041 | 保留安全负例、告警、停止、回滚和独立复核 future trigger；不等于安全负测完成。 |
| `N-004` | B | `CURRENT_CLOSURE_SUFFICIENT` | 仅文档 binding；来源或访问规则变化时复读。 |
| `N-005` | B | `CURRENT_CLOSURE_SUFFICIENT` | provider-neutral 文档 binding；不授权 provider/Secret/生产接入。 |
| `N-006` | C | `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` → ISSUE-0031 | 数据库/CloudBase 认证迁移继续延期；不修改 ISSUE-0031，不写 resolved。 |
| `N-007` | A | `CURRENT_CLOSURE_SUFFICIENT` | 仅既有删除语义文档 binding。 |
| `N-008` | A | `CURRENT_CLOSURE_SUFFICIENT` | RPO/RTO、限流、SQL 阈值仍为建议/待确认，不写成已量化生产通过。 |
| `N-009` | A | `CURRENT_CLOSURE_SUFFICIENT` | 既有生产来源仅作可追溯引用，不推导新版本通过。 |
| `N-010` | C | `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` → ISSUE-0045 | 0033 证据仅为候选来源；补偿事务专项标准、对账、故障注入、回滚和业务接受仍未完成。 |
| `N-011` | B | `CURRENT_CLOSURE_SUFFICIENT` | 旧 V7 R1 report provenance 已由 SRC-02/SRC-03 绑定；周期变更时复读。 |
| `N-012` | B | `CURRENT_CLOSURE_SUFFICIENT` | task ID 的 R1 语义为命名 binding，不制造 Round 4。 |
| `N-013` | C | `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` → ISSUE-0045 | 0017 仅为候选来源；用途、字段、关联、保留、owner、审计契约仍需专项证据。 |
| `N-014` | A | `CURRENT_CLOSURE_SUFFICIENT` | 仅恢复、删除和审计规则的文档 binding。 |
| `N-015` | B | `CURRENT_CLOSURE_SUFFICIENT` | 角色分离和单一 owner 文档 binding；不替代 QA/专业角色验收。 |

矩阵核对：历史 `A=5/B=6/C=4/D=0`；当前 `CURRENT_CLOSURE_SUFFICIENT=11`（仅文档 binding）；`N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER=4`。四项转移均保留 owner/future trigger，N/A 不代表完成。

## 转移去空转与 NON_SERIOUS 追加

- `N-003` 已明确转入仍 open 的 ISSUE-0041；该项不等于 ISSUE-0041 的安全负测完成。
- `N-006` 仅引用仍 open 的 ISSUE-0031 继续延期；未修改 ISSUE-0031，未写 resolved。
- `N-010/N-013` 已转入仍 open 的 ISSUE-0045；ISSUE-0035 关闭后不成为它们的唯一活动 tracker。
- 新附录周期 NON_SERIOUS 已去重追加至 ISSUE-0045，覆盖 R1 N1/N2/N3+M1/O1-O4、R2 NS-1/OI-1、NS-2/OI-2、NS-3/OI-3、OI-4；流程说明保持为非阻塞追溯项，不伪造成缺陷。
- 新附录：SHA=`54A331358C55C204E8B17A6C8311014882A2D8B54C13490F04D85CB40D0E2CCB`；R1 SHA=`80ECCD19464464660840E34F687B70A2C1A561FC6A2AE5DC0E428A629DAD6A9E`；R2 SHA=`E926D2A28DAFE171167CD092F4D54CAFB4AEC8139142A1C9FD9765CE66B6033B`；R2 metadata SHA=`AC054351A7E8163934861388DB65FBE030545776674BEB2D8EE17A90E519EE29`；模型=`deepseek-v4-pro`；R2=`PASS_WITH_NONBLOCKING_OPEN_ISSUES`、`SERIOUS=0`，不启动 R3。
- Document QA ledger：`协同工作文档/文档QA/DocumentQA工作记录.md`，SHA-256=`3CBECA9DB0124BA97A9815A04EF334E6941E0754D9A99813CACB88ADB8888C18`；R1 S1/S2 已一次性整改，R2 为 0 SERIOUS。该 ledger 仅作为审查证据绑定，不由本 Issue 改写或关闭。

## 文档-only 边界与关闭决策

- 本次用户门成立，且 SOURCE_RECEIPT_SET 9/9、Hermes R2 `SERIOUS=0`、15 项处置与 transfer 关系一致，故判定 `ISSUE_CLOSE_REVIEW_PASS_AND_CLOSED`。
- V7 本轮为纯文档采纳/范围调整；branch/base/deploy/production 对当前关闭范围不适用（`N/A_FOR_CURRENT_CLOSURE`）。未创建、未伪造 V7 branch/base receipt，不把任何候选提交或既有 Issue 的生产证据写成 0035 代码/部署通过。
- 关闭只覆盖当前批准的 doc-only 范围，不代表数据库迁移、支付、代码、部署、生产安全、补偿事务、risk_feedback 完整合同或项目 workflow 完成。
- 未来恢复 N-003/N-006/N-010/N-013 对应能力时，必须在目标 Issue/继任 Issue 中重新完成 Spec、实现、测试、独立复核、适用部署/生产和业务验收；不以本关闭结果自动恢复。

## 历史记录（原 Open canonical，保留原文）

## 基本信息

- Issue ID：`ISSUE-0035`
- 类型：documentation / non-blocking review improvement
- 状态：`open`
- 工作流状态：`NON_BLOCKING_DOCUMENT_REVIEW`
- 阶段口径：Hermes Round 1/3 与 Round 2/3 合计 15 项 `NON_SERIOUS` 发现逐项登记；独立核对登记 A=5、B=6，C=4 保持待实现/复核/生产与业务证据；不进入 Document QA 的 `SERIOUS` 整改范围，不阻塞联合 Spec 的业务确认门禁。
- 优先级：P3
- 来源：Round 1 报告 SHA-256 `7A90219DE193DD46A7D5A8660A66BD69E0DDF77927499ADD84E9787142ECF581`（`REWORK_REQUIRED`，2 项 `SERIOUS` 已交 Document QA）；Round 2 报告 `规划文档/Spec文档/Release_version_Spec/2026-08-01-issue-0031-0034-hermes-round-2.md`，SHA-256 `FBBDD36BBBC829EABDACA7F70D1CFA61A4FD663B46F481166A143977FF41DB72`，source SHA-256 `11CBF1E4CA2523153136C92EB3567B81FAB3175EDA6B4A2EFE5127921D3C3004`，`canonical_source_unchanged=true`，结论 `PASS_WITH_NONBLOCKING_OPEN_ISSUES`（0 项 `SERIOUS`、5 项 `NON_SERIOUS`）。
- 当前责任：ISSUE 管理员维护可追踪台账；Document QA 只处理 `SERIOUS` 批次，不处理本 Issue 项目。

## 边界与不阻塞口径

- 本 Issue 只记录下列 `NON_SERIOUS` 文档改进，不改 Spec、不启动产品方案、架构、代码、测试、部署或验收。
- 报告中的 2 项 `SERIOUS` 不并入本 Issue，仍由已注册 Document QA v2.3.0 按其唯一职责处理。
- 本 Issue 不改变 `ISSUE-0031`、`ISSUE-0032`、`ISSUE-0034` 当前的 `open / USER_CONFIRMATION_PENDING` 与 D4/D6/D7 实施前门禁；`ISSUE-0033` 已为 `closed / WORKFLOW_COMPLETE`，本台账不重开或改变其关闭状态。
- `Missing AC-01` 至 `AC-06` 如与下列发现同属一个缺口，只在对应条目交叉标注，不另建重复编号。

## Round 1 非阻塞发现逐项台账

| 台账项 | 发现 | 与 Missing AC 的合并追踪 | 后续处置边界 |
| --- | --- | --- | --- |
| `N-001` | 分支命名规则缺少定义或交叉链接。 | 无重合 AC。 | 后续获明确文档迭代授权时补足定义/链接。 |
| `N-002` | 完整业务周期未量化。 | 合并追踪 `AC-03`（完整业务周期）与 `AC-06`（P1/P2 严重度分类及其观察周期退出条件）；不另编号。 | 后续获授权时由产品/业务方量化周期与退出条件。 |
| `N-003` | 渗透式负例未定义。 | 无重合 AC。 | 后续获授权时补足负向/滥用类验收证据。 |
| `N-004` | Header 与真实访问轨迹规则缺少交叉引用。 | 无重合 AC。 | 后续获授权时补足相互引用，不改变既有真实轨迹行为。 |
| `N-005` | 人机验证环境变量名称过度绑定 Turnstile。 | 无重合 AC。 | 后续获授权时评估供应商中性命名与迁移边界。 |
| `N-006` | CloudBase 内置认证表的可迁移性未标注。 | 无重合 AC。 | 后续获授权时补足迁移限制/假设说明。 |
| `N-007` | D1 未定义默认软删除保留时长。 | 无重合 AC。 | 后续获授权时由产品/业务方确认保留期。 |
| `N-008` | 验收证据阈值仍为定性描述。 | 合并追踪 `AC-01`（RPO/RTO）、`AC-02`（速率限制）与 `AC-05`（SQL 迁移性能）三项量化阈值缺口；不另编号。 | 后续获授权时由产品/业务方定义可核验阈值。 |
| `N-009` | 生产 044 缺少引用。 | 无重合 AC。 | 后续获授权时补足生产版本引用锚点。 |
| `N-010` | 补偿事务可接受标准未定义。 | 合并追踪 `AC-04`（补偿事务验收标准）；不另编号。 | 后续获授权时补足可接受/不可接受的判定标准。 |

## Round 2 非阻塞发现逐项台账

| 台账项 | 发现 | 处置边界 |
| --- | --- | --- |
| `N-011` | Spec 内轮次元数据仍写 `1 / 3`。 | 后续获明确文档迭代授权时澄清或更新轮次口径；不启动 Round 3。 |
| `N-012` | task ID 中 `R1` 的轮次/修订语义不明确。 | 后续获授权时定义命名约定；不改变当前已通过的文档门禁。 |
| `N-013` | `risk_feedback` 表用途未定义。 | 后续获授权时补足用途、所服务范围与必要关联；不展开数据模型设计。 |
| `N-014` | 恢复窗口/超期缺少 D1 前向引用。 | 后续获授权时补足 D1 交叉引用；D1 业务决策已确认，本项仅为非阻塞文档引用改进。 |
| `N-015` | Document QA 未列入角色责任。 | 后续获授权时明确其作为角色或流程步骤的责任归属；不改变已注册 QA 的现有边界。 |

## 依赖、恢复与关闭门禁

- 当前状态为 `open / NON_BLOCKING_DOCUMENT_REVIEW`，不阻塞联合 Spec 的 `PASS_WITH_NONBLOCKING_OPEN_ISSUES` 退出、D4/D6/D7 实施前门禁或已关闭的 ISSUE-0033。
- 本台账不授权当前 Document QA 回写这些 `NON_SERIOUS` 项；其后续处理须由业务方或项目总负责人明确启动合适的文档迭代。
- 最小解除条件：业务方或项目总负责人明确授权文档迭代周期，并为 N-001～N-015 形成逐项可核验处置记录及适用门禁复核。
- 关闭门禁：每一项须在获授权的文档周期内逐项形成可核验处置记录，并经适用的文档门禁确认；不得因联合 Spec 的 `SERIOUS` 批次解决而自动关闭。
- 唯一下一步：等待业务方或项目总负责人另行授权文档迭代，逐项处理 N-001～N-015；本 Issue 不启动修订，且不启动 Round 3。

## 2026-08-10 文档债务处置矩阵独立复核登记

- 只读输入一：`规划文档/产品迭代/2026-08-10-0035-0037-0038-非阻塞文档债务处置矩阵.md`，SHA-256=`85FFBA55B8F269745F0E577CB86347D59669225AF512633803D4330398E45D94`。
- 只读输入二：`规划文档/产品迭代/2026-08-10-0035-0037-0038-非关键勘误与交叉引用补充.md`，SHA-256=`F9172407A41182C2C84920DA9638D2ACCC8EAA9C7D69F3176865BDE27CCF43C3`。
- ISSUE 管理员逐项复读两份输入及 J/P/D/I35 锚点；补充文件第 2 节逐项覆盖本 Issue 的 B 项 `N-002/N-004/N-005/N-011/N-012/N-015`（6/6），不是以产品经理自证替代来源核对。
- 处置计数登记：A=5（N-001/N-007/N-008/N-009/N-014 的既有证据覆盖）、B=6（已形成补充 binding 文本，仍需后续授权窗口落到 canonical/适用文档）、C=4（N-003/N-006/N-010/N-013 仍需 ISSUE-0034/0031 对应实现、独立复核、生产观察或业务验收）、D=0。
- 当前状态仍为 `open / NON_BLOCKING_DOCUMENT_REVIEW`；B 处置不等于实现或生产通过，C 四项保持未关闭。owner=ISSUE 管理员；最小解除条件=一次明确授权的非关键文档维护窗口完成 B 的 canonical/交叉引用落盘，并由对应技术/安全/业务 owner 提供 C 证据；唯一下一步=等待该授权后处理 B，同时分别路由 C 门禁。

## 2026-08-10 非关键文档维护批次独立复核登记（历史快照；已由当前补充复核更新）

- 只读维护批次：`规划文档/产品迭代/2026-08-10-0035-0038-0039-非关键文档维护批次.md`，SHA-256=`2ADD34D2E2E659253F23419E484D9F29A9D7FA94F55B6E9AD97CB4904FF6E74D`。
- ISSUE 管理员完整复读维护批次、处置矩阵 SHA=`85FFBA55B8F269745F0E577CB86347D59669225AF512633803D4330398E45D94`、勘误补充 SHA=`F9172407A41182C2C84920DA9638D2ACCC8EAA9C7D69F3176865BDE27CCF43C3`，并逐项对照 J/P/D/A24 等只读锚点；未接受产品经理自证替代来源核对。
- 逐项映射：A=5（`N-001/N-007/N-008/N-009/N-014`）具既有可追溯证据；B=6（`N-002/N-004/N-005/N-011/N-012/N-015`）由补充文件第 3 节形成 binding；C=4（`N-003/N-006/N-010/N-013`）仍需实现、独立复核、生产观察或业务证据；D=0。


## 2026-08-10 当前 canonical 交叉引用与后续决策入口独立复核

- 只读补充：`规划文档/产品迭代/2026-08-10-0035-0038-当前canonical交叉引用与后续决策入口补充.md`；SHA-256=`2931DE0DF7A6CF4C2BF45EEE09C2F9B07C69B378C212F623C300A80CDD9A24E5`；12758 bytes / 121 lines，UTF-8 无 BOM、无 NUL。产品经理工作记录 SHA-256=`131CC1138C67710A8D75762132F5682E4DBB011D6C16E8A70AB806DAAA703E5B`。
- ISSUE 管理员独立回读补充文件、当前 canonical 与既有来源，确认 11 项 A/B 候选均有当前路径/hash/责任与边界：A=`N-001/N-007/N-008/N-009/N-014`（5），B=`N-002/N-004/N-005/N-011/N-012/N-015`（6）。这只是文档交叉引用与决策入口证据，不代表实现、独立复核、生产观察或业务验收通过。
- C=`N-003/N-006/N-010/N-013`（4）继续保持 Open：分别需要安全负测/告警回滚、0031 迁移周期、补偿事务技术与业务证据、risk_feedback 字段/审计契约。当前计数仍为 `A=5 / B=6 / C=4 / D=0`，本 Issue 不满足关闭条件。
- 唯一下一步：由对应 owner 补齐上述 C 项的实现/独立复核/生产或业务证据；数据库、付费、真实 provider 与生产动作仍按各自门禁保持冻结。ISSUE-0035 继续 `open / NON_BLOCKING_DOCUMENT_REVIEW`。
