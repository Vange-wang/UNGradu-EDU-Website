# ISSUE-0042：0032 邮箱人机验证关闭 Spec Hermes Round 1 非阻塞文档债务

## 基本信息

- Issue ID：ISSUE-0042
- 类型：documentation / non-blocking review improvement
- 状态：open
- 工作流状态：NON_BLOCKING_DOCUMENT_REVIEW
- 优先级：P3
- 来源报告：规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0032-邮箱人机验证关闭-hermes-round-1.md
- 来源报告 SHA-256：B0EAF7A5B89A7FBF1478698FB35601F8F4087DEDC41F9143F9E67501C7218499
- owner：ISSUE-0032 原实现 owner（契约与测试矩阵）/ 项目总负责人、产品与业务 owner（参数及业务语义）；ISSUE 管理员仅维护本台账
- 关系：仅追踪 ISSUE-0032 关闭 Spec Round 1 的 NON_SERIOUS 与其直接缺失验收项；不修改或关闭 ISSUE-0032，不授权真实 widget、Secret、provider-specific 集成或生产部署。

## 登记边界

- 本 Issue 不修改 0032 Spec、Hermes 报告、Document QA、代码、UI、provider、平台或生产配置。
- 每项均为 open / non-blocking 文档改进；不阻断当前 Document QA 对 S1/S2 的 SERIOUS 整改，但须在未来授权文档窗口满足关闭触发后关闭。
- 直接属于 S2 的 MAC-2 继续由 Document QA/0032 原业务门禁处理，不在本 Issue 降级。

## NON_SERIOUS、矛盾与缺失验收项逐条映射

| 报告项 | 事实与影响 | 状态与 owner | 未来关闭触发 |
| --- | --- | --- | --- |
| N1 | 来源表头称“读取快照 SHA-256”但值为截断 hash；不能作为完整性证据，易误导复读者。 | open / non-blocking；0032 Spec owner | 表头标明截断值，冻结时登记完整 SHA-256、字节数、行数并可复读。 |
| N2 | 产品版本、V4 分支代号、V3 上游依赖、V2 代码分支并存且无集中映射；可能误选 base。 | open / non-blocking；项目总负责人/0032 owner | 增加编号映射说明并通过 base receipt/适用复核。 |
| N3 | 独立复核被作为门禁但无通过判据；可能流于流程盖章。 | open / non-blocking；独立复核 owner/项目总负责人 | 形成负例、重放、并发、故障注入等独立签名证据的通过判据。 |
| N4 | V4-S3 将 72 小时列为交付项，同时注释称其未冻结；易被误采为硬值。 | open / non-blocking；产品/业务 owner | 改为批准观察窗口待定或明确 72 小时仅为示例，并由业务门禁确认。 |
| C2（非严重业务语义张力） | “不改变既有发送语义”与重试/冷却要求关系未澄清；可能在实现时无意引入新增语义。 | open / non-blocking；产品/业务 owner/0032 owner | 明确冷却/重试是否已有行为；若是新增行为，形成明确业务确认和验收边界。 |
| MAC-1 | §7 要求日志/截图不含真实邮箱、脱敏账号、token、Cookie 且日志脱敏，但 §9 无完整断言。 | open / non-blocking；0032 owner/安全复核 | 补日志、截图、审计抽样的 PII/token/Cookie 脱敏验收证据。 |
| MAC-3 | 消费标记的保留期/清理没有验收标准；一次性消费与重放检测的存储边界不可复读。 | open / non-blocking；0032 owner/产品业务 owner | 冻结消费标记必要字段、保留期、清理及重放证据。 |
| MAC-4 | 文档禁止把保留旧前端入口写成回滚已演练，但 §9 无实际回滚取证条目。 | open / non-blocking；项目总负责人/0032 owner | 明确回滚点、实际演练或安全替代证据及其适用门禁；不得虚构已演练。 |
| MAC-5 | 缺少 verify → consume → send 的显式顺序断言，前置失败不得调用发送动作未被单独验收。 | open / non-blocking；0032 原实现 owner | 补顺序、失败分支、send 未调用的可复现测试与独立复核证据。 |

## SERIOUS 与既有 Open-Issue 路由

| 报告项 | 处置 |
| --- | --- |
| MAC-2 无障碍路径不得绕过服务端验证/限流 | 与 S2 的无障碍路径未定义直接相关，继续由 Document QA 与 ISSUE-0032 既有门禁承载；不新建重复 Issue。 |
| provider、目标网络、域名/地域、DPA、成本、TTL、超时、IP 保留、限流、轮换、观察窗口、文案、误拒阈值 | 由 ISSUE-0032 原 canonical 的 provider-neutral → 集成 → 生产/业务门禁承载；本 Issue 只登记 N4 的文档表达，不重复业务未决项。 |
| V3 关闭证据、上一已验收版本 base commit | 由 ISSUE-0032 原有上游/base receipt 门禁及总索引 S2 路由承载；不把它们降级为新 NON_SERIOUS。 |
| 无障碍路径 owner、独立复核通过 | owner/门禁由 ISSUE-0032 原 canonical 承载；N3 只追踪当前 Spec 缺判据。 |

## 关闭条件与持续边界

- 关闭触发：N1–N4、C2、MAC-1、MAC-3、MAC-4、MAC-5 均完成授权文档修订或保守决策，相关完整 hash/参数/验收证据可复读，S1/S2 已由 Document QA 处理，ISSUE 管理员独立回读后关闭 ISSUE-0042。
- 当前保持 open / NON_BLOCKING_DOCUMENT_REVIEW；不因 provider-neutral 本地准备、Round 1 报告或 ISSUE-0032 的任一阶段通过而自动关闭。
- 明确口径：本 Issue 不阻断当前文档 SERIOUS 项整改，但须在未来触发条件满足后关闭；不等于真实 widget/Secret/provider-specific 集成、生产部署、业务验收或项目 workflow 完成。
- 唯一下一步：项目总负责人等待 Document QA 完成 SERIOUS 整改后，安排 Hermes Round 2 复核参数、无障碍与发送顺序的受影响段落。

## 2026-08-19 参数回执 Hermes Round 2 追加批次

- 批次范围：仅登记 V4 / ISSUE-0032 参数回执 Hermes Round 2/3 的 `NON_SERIOUS` N1–N9；不修改本文件原 Round 1 N1–N4、C2、MAC-1、MAC-3、MAC-4、MAC-5 的事实、状态或映射，不新建 Issue。
- Round 2 报告：`规划文档/Spec文档/Release_version_Spec/2026-08-19-v4-issue-0032-parameter-receipt-hermes-round-2.md`；SHA-256=`7F9D66B2027658797FC118596082EBFFB867665CF5FC5C6EC7D09FD21C63A768`；6911 bytes / 87 lines；模型=`deepseek-v4-pro`；轮次=`2/3`；结论=`PASS_WITH_NONBLOCKING_OPEN_ISSUES`。
- Round 2 metadata：`规划文档/Spec文档/Release_version_Spec/2026-08-19-v4-issue-0032-parameter-receipt-hermes-round-2.md.metadata.json`；SHA-256=`AA029D71F8F9C9EBF5C7E4EAD24574023153B41F304526D68A9EEAB7018AFAFB`；1977 bytes / 33 lines；`round=2/3`、`model=deepseek-v4-pro`、`canonical_source_unchanged=true`。
- 参数候选绑定：`规划文档/Spec文档/Release_version_Spec/2026-08-19-v4-issue-0032-parameter-receipt-candidate.md`；SHA-256=`52358D5F7BC7BE75819CA6CBBFDA9D8AAD64C98CF8863D91A4A197E75F557ECF`；18543 bytes / 259 lines。
- Document QA Round 1 整改记录/QA ledger 绑定：`协同工作文档/文档QA/2026-08-19-v4-issue-0032-parameter-receipt-DocumentQA-Round1整改记录.md`；SHA-256=`C136D9B413E1DA12D13AF84DD6B408565A8FE92F5E469EB4E7DCF24C8C6F9185`；10102 bytes / 89 lines。该记录明确本批仅处理 S1/S2/S3 serious 整改，N1–N8 不在 QA 批次关闭范围内。
- Round 2 serious 状态：`SERIOUS=0`；S1/S2/S3 已关闭；不自动执行 Round 3。报告中的 N1–N8 保持 `NON_SERIOUS`，N9 为本轮新增的非阻塞清晰度项；本追加不升降级任何项。

### Round 2 N1–N9 逐项追加台账

以下 N1–N9 均属于本“2026-08-19 参数回执 Round 2 追加批次”，每项仅在本批登记一次，状态均为 `open / NON_BLOCKING_DOCUMENT_REVIEW`；不覆盖同编号的 Round 1 条目。

| Round 2 finding | 事实与影响 | 状态 | owner | future closure trigger |
| --- | --- | --- | --- | --- |
| N1 | §2“核心产品安全链”仍写 `verify → consume → limit → send`，遗漏 request guard 与既有 60 秒 cooldown，可能使读者误解为完整顺序。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | ISSUE-0032 产品文档 owner | 明确该链为非穷举，或补齐遗漏门禁并经 ISSUE 管理员独立回读。 |
| N2 | device pseudonym 仍只写服务端 keyed pseudonym，未定义派生输入，隐私最小化与可复验边界不完整。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | ISSUE-0032 产品 / 安全 / 实现 owner | 定义隐私最小化的服务端派生输入，或明确 `PENDING`，并补充边界测试。 |
| N3 | `unknown-proxy` bucket 未冻结阈值或策略；与 S1 action key 复用 `ip_pseudonym` 的交互虽倾向保守 fail-closed，仍缺可验收语义。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | ISSUE-0032 产品 / 安全 owner | 冻结阈值，或明确 fail-closed 语义及对应验收。 |
| N4 | 5 秒 challenge retry cooldown、60 秒邮件 cooldown、5 分钟 code TTL、错误码最多 5 次虽有继承数值，但未在 §7 形成确定性数值验收。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | ISSUE-0032 产品 / 实现 owner | 补齐四组数值的确定性边界测试与回执。 |
| N5 | candidate 仍写 `CURRENT_REVIEW_ROUND=0/3`，§10 仍写 Hermes 当前轮次 `0/3`，与当前 Round 2/3 状态过时。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | 候选文档 owner / 产品经理 | 获授权后维护为 2/3 与下一门禁，并形成新的 hash / 审查绑定。 |
| N6 | §3 外部 SHA-256、Git HEAD/tree 与测试绑定在 Hermes 脱敏环境中未被独立重新验真。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | 项目总负责人 / 独立复核角色 | 最终冻结前 fresh 核验精确 hash、HEAD、tree 与 test receipts。 |
| N7 | 固定窗口与滑动窗口语义不清；`W-1` 在原窗口、`W` 进入新窗口的文字未选择算法。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | ISSUE-0032 产品 / 安全 owner | 显式选择窗口算法并冻结对应边界测试语义。 |
| N8 | “仅在 `cleanup_after` 后删除、清理不改变 TTL”未进入 §7 独立验收行，清理行为的回执边界不完整。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | ISSUE-0032 产品 / 实现 owner | 增加清理专项测试与可复读证据。 |
| N9 | §4.1.1 将 request method 列为 request-guard 输入，但三条 pass 条件未引用 method，未冻结方法约束；报告将其定性为新增局部清晰度缺口。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | 候选文档 owner / 产品 / 安全 | 规定 method 约束，或明确 method 由 endpoint 层处理且不属于 guard，并补验收。 |

### Round 2 状态与项目边界

- ISSUE-0042 继续 `open / NON_BLOCKING_DOCUMENT_REVIEW`；N1–N9 均为非阻塞追加，不阻断当前 SERIOUS 整改，也不因本轮通过而关闭。
- `ISSUE-0032` 继续 `open / USER_CONFIRMATION_PENDING`；参数回执通过不等于实现授权、测试授权、生产授权、Issue 关闭或项目完成；真实 provider、Secret、平台配置、生产与业务门禁仍按原 Issue 承载。
- Active Open 保持精确为 11 项：`ISSUE-0031/0032/0035/0036/0038/0040/0041/0042/0043/0044/0045`。`ISSUE-0031`、数据库及全部付费动作继续延期；项目 workflow 保持 `WORKFLOW_ACTIVE`。
- 本批不修改 Spec、candidate、Hermes report/metadata、Document QA、ISSUE-0032 canonical、代码、UI、CONTEXT、中央注册/总览、钦定 ISSUE 管理员或其他角色文件；不运行 npm，不执行 Git mutation，不部署、不操作 Cloudflare/CloudBase/provider，不创建任务/subagent，不进入实现、测试、提交或关单。
- 唯一下一步 / 下一责任人：项目总负责人独立核对本次 ISSUE-0042 Round 2 N1–N9 登记；等待用户对下一步单独授权。
