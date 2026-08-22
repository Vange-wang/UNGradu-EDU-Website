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

