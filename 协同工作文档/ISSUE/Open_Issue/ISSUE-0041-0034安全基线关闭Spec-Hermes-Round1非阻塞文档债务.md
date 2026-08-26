# ISSUE-0041：0034 安全基线关闭 Spec Hermes Round 1 非阻塞文档债务

## 基本信息

- Issue ID：ISSUE-0041
- 类型：documentation / non-blocking review improvement
- 状态：open
- 工作流状态：NON_BLOCKING_DOCUMENT_REVIEW
- 优先级：P3
- 来源报告：规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0034-安全基线关闭-hermes-round-1.md
- 来源报告 SHA-256：F90F690E52C149918A8CBABEDE1888AAA456EDF87D9A2C24E6A1F0ECC6748EB1
- owner：ISSUE-0034 原安全实现 owner（文档边界与证据映射）/ 项目总负责人（冻结和生产门禁）；ISSUE 管理员仅维护本台账
- 关系：仅追踪 ISSUE-0034 关闭 Spec Round 1 的 NON_SERIOUS 与其直接缺失验收项；不修改或关闭 ISSUE-0034，不把本台账写成安全基线生产验收通过。

## 登记边界

- 本 Issue 不修改 0034 Spec、Hermes 报告、Document QA、代码、UI、Cloudflare/CloudBase、部署或生产状态。
- 本 Issue 的每项状态均为 open / non-blocking；不阻断当前 Document QA 对 SF-1/SF-2 的 SERIOUS 整改，但须在未来授权文档窗口满足关闭触发后关闭。
- SF-1、SF-2 及直接对应的缺失验收项 MAC-1、MAC-2、MAC-6 继续由 Document QA 处理；不得在本台账中降级、替代或关闭。

## NON_SERIOUS 与缺失验收项逐条映射

| 报告项 | 事实与影响 | 状态与 owner | 未来关闭触发 |
| --- | --- | --- | --- |
| NF-1 | “模板/命令边界”未映射到证据或验收标准，仅列注入/SSRF；实现者可能漏掉模板/命令边界。 | open / non-blocking；0034 文档 owner | 将模板/命令边界显式映射到证据与可复现判据，或明确已被注入项覆盖，并经适用复核。 |
| NF-2 | “依赖”与“滥用控制”没有 pass/fail 阈值，只有 V3-S3 产物引用；依赖漏洞和限流门禁可能不可复现。 | open / non-blocking；0034 安全 owner/项目总负责人 | 冻结前补依赖结果阈值及滥用/限流阈值、证据位置和失败判定。 |
| NF-3 | “删除/恢复”在 V3-S1 证据出现，但 §8 无显式判据；恢复链路可能被遗漏。 | open / non-blocking；0034 安全 owner | 补删除、恢复、负例及回滚点的显式验收判据，并通过适用复核。 |
| NF-4 | “上一已验收版本”与生产仅部分通过的现状有语义张力；可能被误读成全量验收版本。 | open / non-blocking；项目总负责人/0034 owner | 明确可接受验收层级及残余风险语义，并与 base receipt、生产状态一致。 |
| NF-5 | D7 在 owner/频率/保留/阈值等位置使用但未定义；独立读者无法确认 D7 的含义。 | open / non-blocking；项目总负责人/0034 owner | 冻结前定义 D7（例如 7 天生产观察期）及其适用范围、阈值和 owner。 |
| NF-6 | 路线图阶段 V3 与产品版本 v2.3.2 并存且未区分；可能造成下游路由歧义。 | open / non-blocking；项目总负责人 | 增加阶段编号与产品版本编号的映射说明，并经适用复读确认。 |
| NF-7 | “只读降级”与默认 fail-closed 拒绝存在语义张力，可能被误读为允许敏感读路径泄露。 | open / non-blocking；0034 安全 owner/业务 owner | 限定只读降级不泄露对象存在性/敏感字段，并与 fail-closed、业务确认口径一致。 |
| MAC-3 | 缺少模板/命令边界的可复现用例判据；该缺口直接对应 NF-1。 | open / non-blocking；0034 文档 owner | NF-1 对应的用例、输入、预期结果和证据进入冻结验收矩阵。 |
| MAC-4 | 缺少依赖扫描结果与滥用控制阈值；该缺口直接对应 NF-2。 | open / non-blocking；0034 安全 owner | 形成可复读扫描/阈值/失败证据，并通过适用独立复核。 |
| MAC-5 | 缺少删除/恢复验证判据；该缺口直接对应 NF-3。 | open / non-blocking；0034 安全 owner | 形成删除、恢复和异常路径的 pass/fail 证据并纳入冻结矩阵。 |

## SERIOUS 与既有 Open-Issue 路由

| 报告项 | 处置 |
| --- | --- |
| MAC-1 CloudBase/Worker/域名入口边界 | 直接对应 SF-2，继续交 Document QA；不新建本台账项。 |
| MAC-2 防枚举状态码映射 | 直接对应 SF-1，继续交 Document QA；不新建本台账项。 |
| MAC-6 “不泄露对象存在性”独立判据 | 并入 SF-1 的 Document QA 修复与回归；不降级为 NON_SERIOUS。 |
| 上一已验收版本、D7/观察窗口/告警阈值/降级语义 | 0034 原 canonical 已承载生产与安全门禁；NF-4/NF-5/NF-7 仅追踪本 Spec 的措辞和可测试性缺口，不重复建立业务 Issue。 |
| 公开字段、联系方式、未成年人最小化 | 由 ISSUE-0036 既有范围/业务确认门禁承载；不在本 Issue 重复登记。 |
| 完整源文件 hash、字节数、行数与 provenance | 由项目总负责人及 ISSUE-0034 原有冻结门禁核对；不把本报告 sanitized metadata 当作完成证据。 |

## 关闭条件与持续边界

- 关闭触发：NF-1–NF-7、MAC-3–MAC-5 均完成经授权的文档修订或保守决策；证据阶段、owner、阈值和适用复核可复读；SF-1/SF-2 由 Document QA 独立处理；ISSUE 管理员回读确认后关闭 ISSUE-0041。
- 当前保持 open / NON_BLOCKING_DOCUMENT_REVIEW；不因 0034 的 TECH_REVIEW_PASS、本地证据或生产部分通过而自动关闭。
- 明确口径：本 Issue 不阻断当前文档 SERIOUS 项整改，但须在未来触发条件满足后关闭；不等于 0034 生产验收、部署、业务验收或项目 workflow 完成。
- 唯一下一步：项目总负责人等待 Document QA 完成 SERIOUS 整改后，安排 Hermes Round 2 仅复核受影响段落。

## 2026-08-26 V7 ISSUE-0035 N-003 transfer 追加

- 来源：`规划文档/Spec文档/Release_version_Spec/2026-08-26-issue-0035-现有证据与数据库延期后的文档债务关单范围调整-spec-addendum.md`，SHA-256=`54A331358C55C204E8B17A6C8311014882A2D8B54C13490F04D85CB40D0E2CCB`，矩阵 N-003。
- `V7-0035-N-003`：N-003 在 ISSUE-0035 当前关闭范围中判定为 `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER`，现转入本仍 open 的 ISSUE-0041 继续追踪；该转移只保留安全负例/告警/停止/回滚与独立复核的未来责任，不等于安全负测完成，也不改变 ISSUE-0035 本身的文档-only 关闭语义。
- owner：0034 安全 owner / 项目总负责人；future closure trigger：形成与 N-003 对象和接口直接对应的安全负测、跨账号/越权边界、告警停止条件、回滚证据和独立安全复核，并由 ISSUE 管理员复读确认。
- 当前状态：本项 `open / non-blocking`。本追加不降级 SF-1/SF-2/MAC-1/MAC-2/MAC-6，不修改 ISSUE-0034、ISSUE-0035 或项目 workflow。
