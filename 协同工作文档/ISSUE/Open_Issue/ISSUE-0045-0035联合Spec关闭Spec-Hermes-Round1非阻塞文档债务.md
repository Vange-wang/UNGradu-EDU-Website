# ISSUE-0045：0035 联合 Spec 关闭 Spec Hermes Round 1 非阻塞文档债务

## 基本信息

- Issue ID：ISSUE-0045
- 类型：documentation / non-blocking review improvement
- 状态：open
- 工作流状态：NON_BLOCKING_DOCUMENT_REVIEW
- 优先级：P3
- 来源报告：规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0035-联合Spec文档债务关闭-hermes-round-1.md
- 来源报告 SHA-256：578B2ACBD243149F02C4A99FDE464AD742538E2311A53385A6065B9EDAD4F580
- owner：ISSUE-0035 关闭 Spec owner / 项目总负责人（联合门禁与授权）；ISSUE 管理员仅维护本台账，Document QA 不处理本报告无 SERIOUS 的非阻塞项
- 关系：仅追踪 ISSUE-0035 关闭 Spec Round 1 的 6 项 NON_SERIOUS 与直接缺失验收项；不修改或关闭 ISSUE-0035，不改变 ISSUE-0031、0038 的延期/上游门禁。

## 登记边界

- 本 Issue 不修改 0035 Spec、Hermes 报告、原 ISSUE-0035 canonical、0031/0038 canonical、代码、UI、平台或生产。
- 每项均为 open / non-blocking 文档改进；本报告无 SERIOUS，但仍不阻断其他 Document QA SERIOUS 整改，且须在未来授权文档窗口满足关闭触发后关闭。
- N-006 的 A/B/C、N-010、N-013、N-003、V6 receipt、V7 base、0031 延期和 0038 关闭证据均由既有 canonical/业务门禁承载，不在本 Issue 重复造业务 Issue。

## NON_SERIOUS 与缺失验收项逐条映射

| 报告项 | 事实与影响 | 状态与 owner | 未来关闭触发 |
| --- | --- | --- | --- |
| N1 | D 分类未定义，且 D4 依赖另有含义；D=0 无法独立解读。 | open / non-blocking；0035 Spec owner | 补 D 分类图例并明确 D4 与分类 D 无关。 |
| N2 | 来源快照 hash 仅截断显示，与“hash 可复读”标准有张力；不能独立核对。 | open / non-blocking；0035 Spec owner/项目总负责人 | 增加截断展示说明或登记完整 hash，并完成来源复读。 |
| N3 | 目标要求 C 项有停止条件，但验收标准只覆盖证据/决策入口；停止条件可能漏验。 | open / non-blocking；0035 Spec owner/对应 owner | AC3 或等价项明确验证每个 C 项停止条件可复读。 |
| N4 | 唯一下步未点名 ISSUE-0038，可能漏掉 V6 receipt 的上游门禁。 | open / non-blocking；项目总负责人/0035 owner | 唯一下步显式写出含 ISSUE-0038 关闭证据的 V6 receipt。 |
| N5 | 表头“唯一 Issue：ISSUE-0035”与 0038、0031 依赖关系易误导 0035 可独立关闭。 | open / non-blocking；0035 Spec owner | 改为明确关闭对象及依赖关系的表头和交叉引用。 |
| N6 | 目标产品版本 v2.3.2 与产品经理 Agent v2.3.2 同串，版本语义不清。 | open / non-blocking；项目总负责人/0035 owner | 分别标注目标产品版本与 Agent 版本。 |
| MAC-1 | C 项停止条件没有单独可复读验收；直接对应 N3。 | open / non-blocking；0035 Spec owner | 补逐项停止条件、证据入口、owner 和判定。 |
| MAC-2 | D 分类说明/图例缺失；直接对应 N1。 | open / non-blocking；0035 Spec owner | D 图例和 D4 区分进入冻结 Spec。 |
| MAC-3 | 4.2 的无跨 Issue 携带证明与回滚点未在 AC 中单列；关闭证据可能不完整。 | open / non-blocking；项目总负责人/0035 owner | 补 cross-Issue carry proof 与 rollback point 的验收项及证据。 |
| MAC-4 | 快照 hash 完整性/可核验性未设验收项；直接对应 N2。 | open / non-blocking；0035 Spec owner/ISSUE 管理员 | 补完整 hash 或截断展示说明的可复读验收。 |

## 既有 Open-Issue 路由及不重复登记

| 报告 Open-Issue | 处置 |
| --- | --- |
| N-006 A/B/C、N-010、N-013、N-003 | 已由原 ISSUE-0035 的 C 项与对应实现/安全/业务证据门禁承载；本 Issue 不重复登记。 |
| V6 关闭 receipt、V7 精确 base commit | 由 ISSUE-0038、V3-V7 索引和对应原 Issue 的上游/base receipt 门禁承载；不把 base provenance 降级为本 Issue 的非严重项。 |
| 0031 延期期间是否维持 0035 Open | 由 ISSUE-0031 与 ISSUE-0035 既有延期/业务确认状态承载；数据库与付费动作继续延期。 |
| ISSUE-0038 完整管理员关闭证据 | 由原 ISSUE-0038 canonical 及其既有 C/D 门禁承载；本 Issue 仅追踪 N4 的“未显式点名”文档缺口。 |

## 关闭条件与持续边界

- 关闭触发：N1–N6、MAC-1–MAC-4 均完成授权文档修订或保守决策；跨 Issue、rollback point、hash、D 分类、版本和上游 receipt 证据可复读；ISSUE 管理员独立回读后关闭 ISSUE-0045。
- 当前保持 open / NON_BLOCKING_DOCUMENT_REVIEW；不因 0035 的 PASS_WITH_NONBLOCKING_OPEN_ISSUES、N-006 决策、0038 关闭或任何单层通过而自动关闭。
- 明确口径：本 Issue 不阻断当前文档 SERIOUS 项整改，但须在未来触发条件满足后关闭；不等于 ISSUE-0035/0038/0031 关闭、数据库实施、付费动作、Spec 冻结或项目 workflow 完成。
- 唯一下一步：项目总负责人等待 Document QA 后，安排 Hermes Round 2 复核本 Issue 的非阻塞修订及受影响回归。

## 2026-08-26 V7 ISSUE-0035 范围调整附录 NON_SERIOUS 追加批次

来源：`规划文档/Spec文档/Release_version_Spec/2026-08-26-issue-0035-现有证据与数据库延期后的文档债务关单范围调整-spec-addendum.md`，SHA-256=`54A331358C55C204E8B17A6C8311014882A2D8B54C13490F04D85CB40D0E2CCB`；Hermes R1 SHA=`80ECCD19464464660840E34F687B70A2C1A561FC6A2AE5DC0E428A629DAD6A9E`，R2 SHA=`E926D2A28DAFE171167CD092F4D54CAFB4AEC8139142A1C9FD9765CE66B6033B`，R2 metadata SHA=`AC054351A7E8163934861388DB65FBE030545776674BEB2D8EE17A90E519EE29`；模型=`deepseek-v4-pro`，Round 1/3→2/3，R2=`PASS_WITH_NONBLOCKING_OPEN_ISSUES`、`SERIOUS=0`。本批次复用 ISSUE-0045，不新建 Issue；所有条目均为 `open / non-blocking`，不阻断 ISSUE-0035 当前 doc-only 关单；未来关闭须满足 owner/future trigger 与适用独立复读。

| Canonical 台账项 | 来源 finding（去重映射） | 事实与边界 | owner | future closure trigger |
| --- | --- | --- | --- | --- |
| `V7-0035-R1-N-001` | R1 N1 | N-005 对 ISSUE-0032 的引用与当前 Active Open/角色定义不一致，未来门禁指向可能悬空；当前不改变文档 binding。 | 0035 附录 owner/项目总负责人 | 澄清 0032 历史状态或改指有效 tracker，并完成来源复读。 |
| `V7-0035-R1-N-002` | R1 N2 | §7 验收表缺 N-006 专项行，虽可测试标准有覆盖，表格结构仍不对称。 | 0035 附录 owner | 补 N-006 延期、无迁移/双写/采购口径及独立复读。 |
| `V7-0035-R1-N-003` | R1 N3 + M1 | A/B/C/D 历史分类语义和 A/B 映射核验门未在附录中完全自包含，N-008 的“待确认值”需保持边界。 | 0035 附录 owner/项目总负责人 | 明确分类定义、逐项映射与原台账来源，完成独立 receipt。 |
| `V7-0035-R1-O-001` | R1 O1 | ISSUE-0034 的 Deploy 066/安全断言依赖外部 canonical receipt；这是追溯过程项，不是新安全缺陷。 | ISSUE-0041/0034 安全 owner | 完成 0034 canonical 路径/hash/锚点复读，不将其扩写为 0035 专属全部安全证据。 |
| `V7-0035-R1-O-002` | R1 O2 | ISSUE-0017 的 feedback 入口/集合/POST 断言依赖外部 canonical receipt；仅为来源核验项。 | 0035 owner/ISSUE 管理员 | 完成 0017 canonical receipt，并保留其自身范围边界。 |
| `V7-0035-R1-O-003` | R1 O3 | N-003/N-006/N-010/N-013 的 N/A+transfer 是保守范围选择，不是遗漏；本次分别转入 0041、0031、0045/既有 tracker。 | 项目总负责人/对应 Issue owner | 各 transfer 目标保留 open 状态、owner/future trigger，并在目标 Issue 完成专属证据后复核。 |
| `V7-0035-R1-O-004` | R1 O4 | 需检查旧 V7 R1 report、ISSUE-0045 与附录间是否存在循环引用；属于 receipt 流程说明，不伪造成内容缺陷。 | ISSUE 管理员 | 完成路径/hash/引用方向检查并记录无循环结论。 |
| `V7-0035-R2-NS-001` | R2 NS-1 + OI-1 | `CURRENT_REVIEW_ROUND=1/3` 与已完成 Round 2/3 的读法存在元数据歧义；不改变 R2 无 SERIOUS 结论。 | 0035 附录 owner | 下一快照统一轮次标签或定义“共享计数”语义，并复核 metadata。 |
| `V7-0035-R2-NS-002` | R2 NS-2 + OI-2 | N-005 悬空 ISSUE-0032 引用仍需状态/归属澄清；与 R1 N1 同根因，合并追踪。 | 0035 附录 owner/项目总负责人 | 明确定义 0032 历史引用或改为有效 tracker 后复核。 |
| `V7-0035-R2-NS-003` | R2 NS-3 + OI-3 | “唯一写入 owner”与 Document QA SERIOUS 例外路径存在字面张力；仅为角色说明清晰度项。 | 0035 附录 owner/Document QA 流程 owner | 明确常态 owner 与 QA 例外整改边界，不改变职责隔离。 |
| `V7-0035-R2-O-001` | R2 OI-4 | Round 2 未携带 R1 原文，采用整体复核而非逐条点验；属于审查过程透明度说明，不伪造成 finding。 | 项目总负责人/0035 附录 owner | 后续审查包附 R1 路径/hash 或形成可复读的逐条回溯索引。 |

去重说明：R1 N3 与 M1 合并；R2 NS-1/OI-1、NS-2/OI-2、NS-3/OI-3 分别合并；R2 NS-2/OI-2 与 R1 N1 的同类 0032 悬空引用保留为新周期再确认，不覆盖历史 finding。R1 O1-O4、R2 OI-4 均按过程/receipt 事项登记，不升级为 SERIOUS 或产品缺陷。ISSUE-0035 关闭不使本 Issue 成为 N-010/N-013 的唯一活动 tracker；N-010/N-013 已在 ISSUE-0035 关闭记录中转入本 Issue继续追踪。

当前 ISSUE-0045 仍为 `open / NON_BLOCKING_DOCUMENT_REVIEW`；本批次不修改 ISSUE-0035、ISSUE-0031、ISSUE-0034、Spec/Hermes/QA 或项目 workflow。
