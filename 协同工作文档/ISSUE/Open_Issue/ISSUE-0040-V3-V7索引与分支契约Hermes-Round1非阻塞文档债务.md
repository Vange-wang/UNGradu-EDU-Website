# ISSUE-0040：V3-V7 索引与分支契约 Hermes Round 1 非阻塞文档债务

## 基本信息

- Issue ID：ISSUE-0040
- 类型：documentation / non-blocking review improvement
- 状态：open
- 工作流状态：NON_BLOCKING_DOCUMENT_REVIEW
- 优先级：P3
- 来源报告：规划文档/Spec文档/Release_version_Spec/2026-08-15-v3-v7-总版本索引与分支契约-hermes-round-1.md
- 来源报告 SHA-256：FC01EAA2480D85A167F18970047F7D63E48CD937F138A2CA84E464C0F41FF766
- owner：项目总负责人（索引与串行门禁冻结）/ 对应 V3-V7 Spec owner；ISSUE 管理员仅维护本台账
- 关系：仅追踪 V3-V7 总索引报告的 NON_SERIOUS 与非严重缺失验收项；不修改或关闭 ISSUE-0031/0032/0034/0035/0036/0038，不改变项目总 workflow。

## 登记边界

- 本 Issue 不修改 Spec、Hermes 报告、Document QA、代码、UI、平台或部署，不启动实现。
- 以下每一项均保持为文档改进候选；不阻断当前 Document QA 对 SERIOUS 的整改，但须在未来授权的文档冻结窗口满足触发条件后关闭。
- 报告 S1、S2 及直接属于 S2 的 M2、M3 不在本 Issue 登记，继续由 Document QA 处理；不得以本 Issue 降级、替代或关闭 SERIOUS。

## NON_SERIOUS 与缺失验收项逐条映射

| 报告项 | 事实与影响 | 状态与 owner | 未来关闭触发 |
| --- | --- | --- | --- |
| N1 | “配置 receipt和已发布旧快照”缺空格，属于可读性笔误；可能影响文档复读但不改变门禁语义。 | open / non-blocking；项目总负责人 | 冻结前完成文字修订并由适用独立复读确认。 |
| N2 | v2.3.2 未明确是项目目标版本还是 Agent 版本；版本语义可能造成归档/路由歧义。 | open / non-blocking；项目总负责人 | 冻结前明确“目标产品版本”与 Agent 版本字段。 |
| N3 | “六份新草案”未逐条枚举，需从五份 Spec 加总索引推断；可能造成漏读。 | open / non-blocking；项目总负责人 | 冻结前逐条列出六份草案及其路径、完整 hash、字节数和行数。 |
| N4 | 统一关闭顺序使用产品/业务门，但 V6/V7 文档-only 路径未明确适用性；可能把 N/A 门误当必经门。 | open / non-blocking；项目总负责人/产品 owner | 冻结前补“适用”限定或明确文档-only 版本的 N/A 判定，并经适用复核。 |
| N5 | V6 使用 B/C/D、V7 使用 A/B/C，分类字母口径不一致；可能造成跨 Issue 交叉引用误读。 | open / non-blocking；项目总负责人/ISSUE 管理员 | 冻结前对照源 Issue 逐项核对分类并形成可追溯矩阵。 |
| N6 | “零容忍负例”“不确定”等抽象门依赖五份 Spec 的负例清单和阈值；索引自身不可独立判定。 | open / non-blocking；对应五份 Spec owner | 五份 Spec 冻结时逐项枚举负例与判定阈值，并由索引复读确认。 |
| M1 | 索引缺少自身完成定义与一致性检查清单，未明确六份草案齐全、hash 冻结、门禁措辞、分类和 base 规程的逐项核对。 | open / non-blocking；项目总负责人 | 冻结前形成索引级可复读 checklist，并以完整来源证据通过适用文档复核。 |
| M4 | V3→V4→V5 的技术依赖理由未说明，可能把重大排期决策误读为已证明的技术必然依赖。 | open / non-blocking；项目总负责人/产品 owner | 冻结前补技术/业务依据，或明确其为待确认的排期策略并同步依赖口径。 |
| C2（报告标注为非严重） | §3 把串行依赖写成确定事实，§10 又列为用户确认前未决；同一文档口径分裂。 | open / non-blocking；项目总负责人 | 冻结前统一为“拟议依赖，待确认”或完成授权确认，并由 Round 2 回归核对。 |
| C3（有意不对称，需澄清） | L50 对 V7 写“处理 ISSUE-0035”而非“通过并关闭”；虽与 N-006 阻塞逻辑一致，仍可能被读成笔误。 | open / non-blocking；项目总负责人 | 冻结前补充 V7 使用“处理”的理由并与 §5.5/§7.2 对齐。 |

## 报告 Open-Issue 路由及不重复登记

| 报告 Open-Issue | 处置 |
| --- | --- |
| V3 精确 base commit、门禁强度统一及 base 兜底 | S2/S1 及其相关 SERIOUS 继续交 Document QA；不在本 Issue 重登记。 |
| 五份 Spec 冻结 hash | 分别由 ISSUE-0032、0034、0035、0036、0038 的既有来源/冻结门禁承载；本 Issue 只追踪索引的枚举与一致性缺口。 |
| 用户是否严格串行 | 作为 ISSUE-0035 及 0034/0032/0036 既有业务/顺序确认门禁路由；不新建重复业务 Issue。 |
| V4 provider-specific | 由 ISSUE-0032 既有 provider/network/platform/production 门禁承载。 |
| V5 人工、AI、出域、申诉门 | 由 ISSUE-0036 既有业务确认与生产人工/供应商/DPA/key 门禁承载。 |
| V6 的 V5 accepted evidence relation | 由 ISSUE-0038 与 ISSUE-0036 既有证据门禁承载。 |
| V7 的 N-006 A/B/C | 由 ISSUE-0035、ISSUE-0038 及延期中的 ISSUE-0031 既有台账承载。 |
| 外部事实与摘要 hash 非 provenance | 由对应原 Issue/项目总负责人冻结核对承载；不把摘要 hash 当作完整 provenance。 |

## 关闭条件与持续边界

- 关闭触发：本报告 N1–N6、M1、M4、C2、C3 均在获授权的 Spec 冻结窗口完成适用修订或明确保守决策；完整来源证据可复读；Document QA 已完成其 SERIOUS 批次；项目总负责人确认不再有未处理回归；ISSUE 管理员独立回读后才能关闭 ISSUE-0040。
- 本 Issue 当前保持 open / NON_BLOCKING_DOCUMENT_REVIEW；不因 Round 1 报告存在、Round 2 启动或任一原 Issue 关闭而自动关闭。
- 明确口径：本 Issue 不阻断当前文档 SERIOUS 项整改，但须在未来触发条件满足后关闭；不得把本登记写成 Spec 冻结、实现授权或项目 WORKFLOW_COMPLETE。
- 唯一下一步：项目总负责人等待 Document QA 完成 SERIOUS 整改后，统一决定 Hermes Round 2 的回归范围。

