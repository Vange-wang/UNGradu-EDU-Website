# ISSUE-0044：0038 联系方式审核文档债务关闭 Spec Hermes Round 1 非阻塞文档债务

## 基本信息

- Issue ID：ISSUE-0044
- 类型：documentation / non-blocking review improvement
- 状态：open
- 工作流状态：NON_BLOCKING_DOCUMENT_REVIEW
- 优先级：P3
- 来源报告：规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0038-联系方式审核文档债务关闭-hermes-round-1.md
- 来源报告 SHA-256：2151DC34C2E6757DF65266E1568CC1DFD9CB438D1DCBEA540877B95D51371C1E
- owner：ISSUE-0038 文档债务 Spec owner / 项目总负责人（授权与冻结）/ Document QA（SERIOUS 独立复核）；ISSUE 管理员仅维护本台账
- 关系：仅追踪 ISSUE-0038 关闭 Spec Round 1 的 NON_SERIOUS、非严重缺失验收项及 Round 2 新增 N-08；不修改或关闭 ISSUE-0038，不改变 ISSUE-0036 的功能状态。

## Round 2 追加登记：N-08

- 来源报告：规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0038-联系方式审核文档债务关闭-hermes-round-2.md
- 来源报告 SHA-256：72A02E04B29DCB2724231E4DD29915F7C706F9408B1333DF9244CA5340F6862A
- Round：2 / 3；报告结论：REWORK_REQUIRED；本节仅登记报告唯一 NON_SERIOUS N-08。
- N-08 事实与影响：B_HANDLING_MATRIX 的命名覆盖范围不清。§2.4 line 60 将其称为“7 项 B 的唯一落盘位置”，而 §5 line 104 又把包含全部 13 项 B+C+D 的表称为“B_HANDLING_MATRIX 唯一落盘”；读者无法判断该名称只指 B 行还是整张 13 项表，可能导致关闭证据引用范围不一致。
- 状态：open / NON_BLOCKING_DOCUMENT_REVIEW；owner：ISSUE-0038 文档债务 Spec owner / 项目总负责人（文档冻结与适用复核）；ISSUE 管理员仅维护台账。
- 未来关闭触发：在获授权的下一轮 Spec 修订中，将 B_HANDLING_MATRIX 改为明确区分“仅 B 行”与“全部 13 项 B+C+D 表”的名称，或补充唯一范围说明；经 Hermes Round 3 受影响段落复核后，由 ISSUE 管理员独立回读关闭 N-08。
- 关系与边界：N-08 仅追加到 ISSUE-0044，不新建 Issue，不修改或关闭原 ISSUE-0038，不改变 ISSUE-0036 或其他 Issue 状态；不阻断当前文档 SERIOUS 项整改，但须在未来触发条件满足后关闭。

## 登记边界

- 本 Issue 不修改 0038 Spec、Hermes 报告、原 ISSUE-0038 canonical、0036 Spec、Document QA、代码、UI、平台或生产。
- 每项均为 open / non-blocking 文档改进；不阻断当前 Document QA 对 S-01/S-02/S-03 的 SERIOUS 整改，但须在未来授权文档窗口满足关闭触发后关闭。
- 直接属于 S-02 的 MAC-5 继续由 Document QA 处理，不在本 Issue 降级或重复造一个“权威性”业务 Issue。

## NON_SERIOUS、相关矛盾与缺失验收项逐条映射

| 报告项 | 事实与影响 | 状态与 owner | 未来关闭触发 |
| --- | --- | --- | --- |
| N-01 | V5 同时被用作 Spec、owner 和证据，术语过载；下游可能选错依赖语义。 | open / non-blocking；0038 Spec owner | 术语表一次性定义 V5/V6 及各使用场景，并经适用复读。 |
| N-02 | UPSTREAM_GATE_BLOCKED 与 REVIEW_BLOCKED 的关系未说明；同义/异义均可能造成错误状态流转。 | open / non-blocking；项目总负责人/0038 owner | 明确上游依赖阻塞与审查发现阻塞的关系、转移和关闭规则。 |
| N-03 | §5 只有绑定清单，没有每项债务本身的摘要或精确段落指针；管理员无法仅凭 Spec 独立复读。 | open / non-blocking；0038 Spec owner/ISSUE 管理员 | 每项绑定补债务原文摘要或精确路径/段落锚点并可复读。 |
| N-04 | N-/NS- 前缀、owner/entity/version/hash 元组未定义，D 同时是分类和前缀语境；易混淆。 | open / non-blocking；0038 Spec owner | 补术语和元组定义，区分分类 D 与前缀/依赖标识。 |
| N-05 | Document QA/独立文档复核只有角色描述，没有具名 owner 或指派规则；独立性执行不确定。 | open / non-blocking；项目总负责人/Document QA | 写明具名复核人或稳定指派规则，不把 ISSUE 管理员自审写成独立通过。 |
| N-06 | “保持 Open/保持未决/保持观察项”等缺失时措辞不一致；同一 fail-closed 语义可能被误读。 | open / non-blocking；0038 Spec owner | 统一为“保持 Open/未决 + 具体禁令”，并经 Round 2 回归。 |
| N-07 | §8 第 8 条缺少动词，语句不完整；可能影响关闭条件复读。 | open / non-blocking；0038 Spec owner | 补全句子并复读上下文，不改变 0036 用户行为。 |
| MAC-1 | base receipt 的 exact SHA、ref/parent、验收层级、输入 hash、工作树/索引/未跟踪快照、回滚点未纳入 §8 验收。 | open / non-blocking；项目总负责人/0038 owner | 形成完整 base receipt 字段检查和可复读证据。 |
| MAC-2 | 最终矩阵不得新增真实联系方式、未成年人原文、账号标识、token、Secret，但没有对应验收。 | open / non-blocking；安全/0038 owner | 补 PII、账号、token、Secret 零写入/脱敏的矩阵与抽样证据，不记录 Secret 值。 |
| MAC-3 | V6-S3 “无写入声明”无对应验收条目；文档债务关闭可能被误作已写入。 | open / non-blocking；0038 owner/ISSUE 管理员 | 补 no-write declaration 的内容、路径、hash 和独立回读证据。 |
| MAC-4 | 角色分离、Document QA 非 PM 自批、Issue 管理员独立关单没有验收项。 | open / non-blocking；项目总负责人/Document QA | 补角色分离证据和独立关单检查，不代替任何专业角色。 |

## SERIOUS 与既有 Open-Issue 路由

| 报告项 | 处置 |
| --- | --- |
| MAC-5 B 项产物落盘位置与权威性 | 直接对应 S-02，继续由 Document QA 处理；不在本 Issue 降级或另造重复关闭对象。 |
| S-03 业务确认重新门控 B 项 | Round 2 新增 SERIOUS 回归，继续交 Document QA；不降级、不登记为 N-08 或其他非阻塞 Issue。 |
| V5_ACCEPTED_EVIDENCE_REF 尚不存在 | 由 ISSUE-0036 的实现/独立复核/生产门禁承载；不重复登记。 |
| NS-006 申诉放弃/编辑、NS-003 观察窗口与频率限制 | 已由原 ISSUE-0038 canonical 追踪；不新建重复 Issue。 |
| C 项回退 V5、只做文档债务候选的批准 | 由 ISSUE-0036/0038 既有业务与项目总负责人授权门禁承载；不把“批准”写成已获。 |

## 关闭条件与持续边界

- 关闭触发：N-01–N-08、MAC-1–MAC-4 均完成授权文档修订或保守决策；source/hash、base receipt、no-write、PII 与角色分离证据可复读；S-01/S-02/S-03 由 Document QA 处理；ISSUE 管理员独立回读后关闭 ISSUE-0044。
- 当前保持 open / NON_BLOCKING_DOCUMENT_REVIEW；不因 V5 evidence 到位、0036 进入下一阶段或原 ISSUE-0038 的既有 N/NS 台账完成而自动关闭。
- 明确口径：本 Issue 不阻断当前文档 SERIOUS 项整改，但须在未来触发条件满足后关闭；不等于 ISSUE-0038、ISSUE-0036、Spec、实现、生产或业务门禁通过。
- 唯一下一步：项目总负责人等待 Document QA 完成 SERIOUS 整改后，安排 V6 Hermes Round 3 复核 N-08 及 S-03 受影响段落。
