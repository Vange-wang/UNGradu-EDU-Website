# ISSUE-0043：0036 联系方式审核关闭 Spec Hermes Round 1 非阻塞文档债务

## 基本信息

- Issue ID：ISSUE-0043
- 类型：documentation / non-blocking review improvement
- 状态：open
- 工作流状态：NON_BLOCKING_DOCUMENT_REVIEW
- 优先级：P3
- 来源报告：规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0036-联系方式审核关闭-hermes-round-1.md
- 来源报告 SHA-256：26DB77C8D9EBEB7B5BE0DFDE62F8950184E7EA7566E7BBF82493633CDD82C536
- owner：ISSUE-0036 原实现 owner（Spec 契约与合成队列证据）/ 产品与业务 owner（范围和语义）/ 项目总负责人；ISSUE 管理员仅维护本台账
- 关系：仅追踪 ISSUE-0036 关闭 Spec Round 1 的 NON_SERIOUS 与其直接缺失验收项；不修改或关闭 ISSUE-0036，不把 V7 无 SERIOUS 写成 0036 功能或业务可关闭。

## 登记边界

- 本 Issue 不修改 0036 Spec、Hermes 报告、Document QA、代码、UI、AI provider、生产人工审核或平台。
- 每项均为 open / non-blocking 文档改进；不阻断当前 Document QA 对 S1–S3 的 SERIOUS 整改，但须在未来授权文档窗口满足关闭触发后关闭。
- 直接对应 S3 的 MAC-3、MAC-4 不在本 Issue 新建，继续由 Document QA 处理，不得降级。

## NON_SERIOUS 与缺失验收项逐条映射

| 报告项 | 事实与影响 | 状态与 owner | 未来关闭触发 |
| --- | --- | --- | --- |
| N1 | 14 项推荐方向被反复作为用户确认门禁但未枚举；确认清单不自包含，难以核对。 | open / non-blocking；0036 Spec owner/产品 owner | 附 14 项清单或精确指向源文档小节，并经业务/适用复核。 |
| N2 | V3→V4→V5 串行门禁未说明阶段含义及关闭证据承载物；外部依赖路由可能歧义。 | open / non-blocking；项目总负责人/0036 owner | 补阶段语义、证据 owner、关闭 receipt 指向并完成上游复读。 |
| N3 | “至少覆盖 childIntro 与 abilityDescription”与“最终字段/分类待确认”并存；最小范围与最终范围容易混读。 | open / non-blocking；产品/业务 owner | 明确最小范围、最终范围、待确认范围和不自动扩大的边界。 |
| N4 | V5-S2 状态列表缺 draft，与 §9.5 不一致；状态契约可能漏掉起始态。 | open / non-blocking；0036 Spec owner | 统一状态列表并通过适用独立复核；不改变未经确认的业务语义。 |
| N5 | 来源表将 CONTEXT、AGENTS、钦定产品经理合并为一格并挤入三枚 hash；独立回读可读性差。 | open / non-blocking；0036 Spec owner/ISSUE 管理员 | 拆分来源行并保留完整 path、hash、字节数、行数。 |
| MAC-1 | §8.3 只声明不得把开关存在写成已演练，缺少回滚演练/回滚点验收条目。 | open / non-blocking；项目总负责人/0036 owner | 补回滚点、演练或安全替代证据的明确判定；不得表述为已真实演练。 |
| MAC-2 | 上游 V3/V4 串行门禁与精确 base receipt 缺少“缺失即 UPSTREAM_GATE_BLOCKED”的可测检查。 | open / non-blocking；项目总负责人/0036 owner | 将 base receipt 完整性和缺失时阻断规则写入验收矩阵并复核。 |
| MAC-5 | V5-S0 的 14 项方向确认没有对应验收条目；直接对应 N1。 | open / non-blocking；产品/业务 owner | 14 项清单与逐项确认结果进入可复读验收证据。 |

## SERIOUS 与既有 Open-Issue 路由

| 报告项 | 处置 |
| --- | --- |
| MAC-3 日志不落原文/token/Secret | 直接对应 S3，继续由 Document QA 处理；不在本 Issue 降级。 |
| MAC-4 仅使用合成/脱敏语料 | 直接对应 S3，继续由 Document QA 处理；不在本 Issue 降级。 |
| 供应商、模型、部署位置、提示词、数据保留、人工队列、阈值、审核时限、OCR、生产 key/DPA | 由 ISSUE-0036 原 canonical 的业务/生产门禁承载；本 Issue 只追踪 N1/N3 的文档自包含性，不重复登记。 |
| V3 是否闭合、base commit、无障碍 owner、独立复核判据 | 分别由 ISSUE-0036 原有上游/业务门禁及 N2/N3 文档项承载；不新建同一业务 Issue。 |

## 关闭条件与持续边界

- 关闭触发：N1–N5、MAC-1、MAC-2、MAC-5 均完成授权文档修订或保守决策；完整来源、base receipt、14 项确认和回滚边界可复读；S1–S3 由 Document QA 处理；ISSUE 管理员独立回读后关闭 ISSUE-0043。
- 当前保持 open / NON_BLOCKING_DOCUMENT_REVIEW；不因 V7 无 SERIOUS、0036 的本地/合成队列准备或 Round 1 报告而自动关闭。
- 明确口径：本 Issue 不阻断当前文档 SERIOUS 项整改，但须在未来触发条件满足后关闭；不等于 ISSUE-0036 实现、独立复核、生产人工闭环、AI 出域、业务验收或项目 workflow 完成。
- 唯一下一步：项目总负责人等待 Document QA 完成 SERIOUS 整改后，安排 Hermes Round 2 复核状态、分类、隐私及受影响验收段落。

