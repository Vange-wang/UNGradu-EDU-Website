# AGENT 注册状态总览

更新日期：2026-08-15

用途：作为项目侧边栏中的实时可视化入口，一表查看各 Agent 的注册信息、职责边界、会话绑定和工作状态。

## 1. 注册状态表

| Agent 名称 | 角色 | 会话 ID | 线程标题 | 输入边界 | 输出边界 | 工作日志 | 产出目录 | 当前状态 | 责任状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 项目总负责人 Agent | Project Lead / 多 Agent 编排与责任溯源负责人 | `01a00565-5d72-7663-991d-178c5dcfd170` | `项目总负责人v2.3.3` | 业务方任务、流程文档、各 Agent 回执、项目文档只读上下文、协同失败证据 | 任务分发命令、协同协议、状态总览、责任溯源、交流记录 | `总负责人文档/总负责人工作记录.md` | `协同工作文档/`、`总负责人文档/` | 已注册，v2.3.3 当前唯一入口；模型 `gpt-5.6-sol / high`；`WORKFLOW_ACTIVE` | 第一负责人，仅调度、跟进、门禁、生产协调与收口 |
| 产品经理 Agent | Product Manager / 验收负责人 | `019fefa7-9883-7af2-bdb5-acc5c8513781` | `产品经理v2.3.2` | 业务需求、Spec、PRD、里程碑、验收材料、产品决策 | PRD、Spec、里程碑、验收报告、产品决策记录 | `规划文档/产品经理工作记录.md` | `规划文档/`、`协同工作文档/AGENT身份注册信息/` | 已注册，v2.3.2 当前唯一入口；模型 `gpt-5.6-luna / max`；`WORKFLOW_ACTIVE` | 需求与产品验收负责人 |
| 代码开发员 Agent | Code Developer / Issue 修复负责人 | `019fefa7-a3c3-7333-94d7-d61961c5ea99` | `代码开发员v2.3.2` | 已确认 Spec、PRD、Issue、缺陷清单、代码审查报告、代码仓库 | 业务代码、测试、脚本、代码文档、验证结果 | `Code文档/开发员工作记录.md` | `Code文档/`、必要时 `规划文档/里程碑文档/发布前准备/` | 已注册，v2.3.2 当前唯一入口；模型 `gpt-5.6-sol / high`；后续开发/部署须另行授权 | 实现与代码验证负责人 |
| ISSUE 管理员 Agent | Issue Documentation / Issue 状态维护负责人 | `019fefa7-af55-75c3-9cea-da6e548d7002` | `ISSUE管理员v2.3.2` | 用户或 Agent 提出的 Issue、代码开发员 Issue 包、阶段最终报告、总负责人交办的 Issue 状态更新 | Issue 编号、Issue 总表、Open/Close Issue 文档、状态流转记录、关闭依据 | `协同工作文档/ISSUE/ISSUE管理员工作记录.md` | `协同工作文档/ISSUE/`、`协同工作文档/ISSUE/Issue_List/`、`协同工作文档/ISSUE/Open_Issue/`、`协同工作文档/ISSUE/Close_Issue/` | 已注册，v2.3.2 当前唯一入口；模型 `gpt-5.6-luna / max`；Active Open=6 | ISSUE 状态维护负责人 |
| UI 设计师 Agent | UI Designer / Visual Design / Interface Redesign | `019fefa7-ba66-7d63-8918-17fa0271437c` | `UI设计师v2.3.2` | 项目总控制人视觉方向、截图 / 参考图、页面现状、已确认 Spec、UI 设计输入与素材 | UI 重设计方案、草图模板、视觉规范、阶段设计定稿、设计验收与交接文档 | `UI美术文档/UI设计师工作记录.md` | `UI美术文档/`、`协同工作文档/AGENT身份注册信息/` | 已注册，v2.3.2 当前唯一入口；模型 `gpt-5.6-luna / max`；`WORKFLOW_ACTIVE` | UI 视觉设计、设计交接与独立 UI 复核负责人 |
| Document QA Agent | Independent Document QA / 严重问题修订负责人 | `019fefa7-c5cf-7e62-9859-5263998dfd77` | `DocumentQAv2.3.2` | 总负责人发送的 canonical Spec hash、Hermes 报告、完整 `SERIOUS` 批次、冻结决策与共享轮次 | 仅命名 Spec 的 `SERIOUS` 修订及指定 QA ledger | `协同工作文档/文档QA/DocumentQA工作记录.md` | `规划文档/Spec文档/Release_version_Spec/`、`协同工作文档/文档QA/` | 已注册，v2.3.2 当前唯一入口；模型 `gpt-5.6-sol / high`；`WAITING_ROLE` | 不运行 Hermes、不自我批准、不处理 `NON_SERIOUS`，最多三轮共享计数 |
| 独立代码复核 Agent | Independent Code Reviewer / 独立代码与测试验收负责人 | `019fefa7-d1d3-7ac3-a5ba-8b8abe299958` | `独立代码复核v2.3.2` | 总负责人发送的固定点、限定 diff、canonical Issue/Spec、开发验证证据 | Standards 与 Spec 两轴只读复核；`TECH_REVIEW_PASS` 或 `TECH_REVIEW_REWORK_REQUIRED`；路径/行号/严重度/证据 | `Code文档/独立代码复核工作记录.md` | `Code文档/` | 已注册，v2.3.2 当前唯一入口；模型 `gpt-5.6-sol / high`；等待正式只读复核包 | 独立代码/测试验收；只读技术门禁，不实现修复、不自我批准 |

### 1.1 v2.3.2 当前连续性与门禁

- 当前项目 workflow 为 `WORKFLOW_ACTIVE`，不是 `WORKFLOW_COMPLETE`；`ISSUE-0020` 自身已由 ISSUE 管理员关闭为 `closed / WORKFLOW_COMPLETE`，不得扩展为整个项目完成。
- Active Open 恰为 `ISSUE-0031`、`ISSUE-0032`、`ISSUE-0034`、`ISSUE-0035`、`ISSUE-0036`、`ISSUE-0038`，共 6 项。
- ISSUE-0020 最终生产锚点：Contract B=`HARD_CUT_FUNCTIONAL_PASS_WITH_EXECUTION_DEVIATION`，Worker 短版本=`e72e0119`，CloudBase 当前运行版本=`ungradu-edu-prod-064`。
- 登录/CSRF 修复 commit `33314857da0f2d72066443965454d23fc70a16d3` 已推送并由 064 的路由、日志与用户可见行为证明生效；平台版本与 Git SHA 的精确 provenance 仍作为已接受残余风险保留。
- 两个专用非敏感账号均完成登录态 CSRF→feedback POST→GET 成功链路与双向账号隔离；独立技术 `PASS`、产品 `PASS`、安全回滚替代 `PASS`。
- 业务方于 2026-08-15 明确接受并要求登记七项残余风险；ISSUE 管理员已在 Close canonical 中登记为 `ACCEPTED_RESIDUAL_RISK`。不得表述为已执行真实反向回滚演练或完全合规。
- 数据库与付费动作继续延期。唯一下一步：按 canonical Open Issue 优先级核对 `ISSUE-0034` 的最新门禁并恢复后续 workflow；不得因 ISSUE-0020 关闭跳过其他 Issue 的独立复核、生产或业务验收。

### 1.2 v2.3.3 正式中央重绑定后的当前连续性与门禁

- 当前项目总负责人为 `01a00565-5d72-7663-991d-178c5dcfd170 / 项目总负责人v2.3.3 / gpt-5.6-sol / high`；旧 v2.3.2 `019fefa7-8eb3-7412-879d-e6c40094ea70` 已转为历史归档，不再接收新任务。
- 六个专业角色 v2.3.2 的注册、锚点、工作记录和绑定未变：产品经理 `019fefa7-9883-7af2-bdb5-acc5c8513781`、代码开发员 `019fefa7-a3c3-7333-94d7-d61961c5ea99`、ISSUE 管理员 `019fefa7-af55-75c3-9cea-da6e548d7002`、UI 设计师 `019fefa7-ba66-7d63-8918-17fa0271437c`、Document QA `019fefa7-c5cf-7e62-9859-5263998dfd77`、独立代码复核 `019fefa7-d1d3-7ac3-a5ba-8b8abe299958`。
- 项目 workflow 仍为 `WORKFLOW_ACTIVE`，迁移不等于完成；`ISSUE-0020` 已 `closed / WORKFLOW_COMPLETE`（仅自身），七项残余风险已登记并由业务方接受。
- Active Open 恰为 `ISSUE-0031/0032/0034/0035/0036/0038`；`ISSUE-0031`、数据库和全部付费动作继续延期。
- 当前代码基线仅作接续事实：branch=`V2-unified-navigation-responsive-profile-20260729`，已知 HEAD=`33314857da0f2d72066443965454d23fc70a16d3`；不以此执行 Git 或推断其他门禁。
- V3→V7 为单 Issue 单分支路线：V3=`V3-issue-0034-security-baseline-closure`→0034；V4=`V4-issue-0032-email-turnstile-closure`→0032；V5=`V5-issue-0036-contact-review-closure`→0036；V6=`V6-issue-0038-contact-review-doc-debt-closure`→0038；V7=`V7-issue-0035-joint-spec-doc-debt-closure`→0035；ISSUE-0031 不进入本轮。
- 分支必须从上一已验收版本的确定提交创建；一个分支只闭环一个 Issue；各阶段证据分别取证，分支完成不自动等于 Issue 关闭。五份关闭 Spec 与总版本索引/分支契约尚未编写，用户确认前不进入实现。
- 唯一下一步：由新总负责人路由现有产品经理线程 `019fefa7-9883-7af2-bdb5-acc5c8513781` 编写五份 Issue 关闭 Spec 与总版本索引/分支契约；关键文档按 Hermes CLI `deepseek-v4-pro` 最多三轮，`SERIOUS` 批次交 Document QA，`NON_SERIOUS` 交 ISSUE 管理员。

## 2. 历史绑定（仅作归档）

| Agent 名称 | 历史版本 | 历史会话 ID | 状态 |
| --- | --- | --- | --- |
| 项目总负责人 Agent | v2.3.2 | `019fefa7-8eb3-7412-879d-e6c40094ea70` | 2026-08-15 已归档，不再接收新任务；由 v2.3.3 接续 |
| 项目总负责人 Agent | v2.3.1 | `019fbd69-1a00-7311-976c-5c61596265d8` | 已归档，不再接收新任务；由 v2.3.2 接续 |
| 项目总负责人 Agent | v2.3.0 | `019fa8fe-d28f-7c80-84f2-da0c88282cf5` | 保持历史归档，不再作为当前调度入口 |
| 产品经理 Agent | v2.3.0 | `019fad1b-0006-74f3-9b38-ae71e6464ad4` | 已归档，不再接收新任务；由 v2.3.2 接续 |
| 代码开发员 Agent | v2.3.0 | `019fad0b-e1b4-7950-bb97-2dc580594574` | 已归档，不再接收新任务；由 v2.3.2 接续 |
| ISSUE 管理员 Agent | v2.3.0 | `019fad18-e126-75a1-948a-055914cad0ab` | 已归档，不再接收新任务；由 v2.3.2 接续 |
| UI 设计师 Agent | v2.3.0 | `019fad1d-872b-7271-8c8b-6d4b87e3dd4f` | 已归档，不再接收新任务；由 v2.3.2 接续 |
| Document QA Agent | v2.3.0 | `019fbd2e-5b12-7f41-88db-f30489656a5f` | 已归档，不再接收新任务；由 v2.3.2 接续 |
| 独立代码复核 Agent | v2.3.0 | `019fc794-cec0-7131-b3e2-662fc7a5af00` | 已归档，不再接收新任务；由 v2.3.2 接续 |
| 项目总负责人 Agent | v2.2.0 | `019f70eb-3457-7841-8942-b814d751360b` | 已归档，不再作为当前调度入口 |
| 产品经理 Agent | v2.2.0 | `019f70eb-c3ea-7930-ba4f-e11f096a5dab` | 已归档，不再接收新任务；由 v2.3.0 接续 |
| 代码开发员 Agent | v2.2.0 | `019f70ec-6331-7083-aecb-bb8484511518` | 已归档，不再接收新任务；由 v2.3.0 接续 |
| ISSUE 管理员 Agent | v2.2.0 | `019f70ed-54b6-77b3-88a4-aa78c7600087` | 已归档，不再接收新任务；由 v2.3.0 接续 |
| UI 设计师 Agent | v2.2.0 | `019f70ed-f088-77e1-8bdc-bede547e5231` | 已归档，不再接收新任务；本轮预览由 v2.3.0 接续 |
| 项目总负责人 Agent | v2.1.0 | `019f2318-50b7-75e0-b0fc-0013edefc039` | 已归档，不再作为当前调度入口 |
| 产品经理 Agent | v2.1.0 | `019f2318-8e97-79b0-822e-e084c7a42ae2` | 已归档，不再作为当前调度入口 |
| 代码开发员 Agent | v2.1.0 | `019f2318-ec47-7870-9097-ca7124837a26` | 已归档，不再作为当前调度入口 |
| ISSUE 管理员 Agent | v2.1.0 | `019f2319-3809-73c2-81de-1899fc3b92a3` | 已归档，不再作为当前调度入口 |
| UI 设计师 Agent | v2.1.0 | `019f2319-7c43-7653-9e2c-803229387ac1` | 已归档，不再作为当前调度入口 |

## 3. 状态字段说明

| 字段 | 含义 |
| --- | --- |
| 待绑定会话 ID | Agent 身份已建立，但业务方尚未提供或确认会话 ID |
| 已注册 | 身份信息、职责、输入边界、输出边界、日志和产出目录已登记 |
| 工作中 | 已收到明确任务，正在执行 |
| 待验收 | 已提交产出，等待验收 Agent 或业务方确认 |
| 阻塞 | 缺少输入、权限、流程文档、验收标准或外部条件 |
| 已完成 | 产出已验收并归档 |

## 4. 别名识别规则

- `ISSUE 管理员 Agent` 是正式名称。
- 若业务方或其他 Agent 在上下文中使用“ISSUE 管理员”“Issue 管理员”“ISSUE 负责人”“Issue 文档负责人”“Issue 负责人”等称呼，且语义指向 Issue 登记、编号、Open/Close 归档、状态维护或闭环追踪，均视为指向 `ISSUE 管理员 Agent`。
- 正式文档落笔仍统一写为“ISSUE 管理员”或“ISSUE 管理员 Agent”。
- `UI 设计师 Agent` 是正式名称。
- 若业务方或其他 Agent 在上下文中使用“UI 设计师”“UI 美术”“视觉设计师”“界面设计师”“美术设计”“页面重设计负责人”等称呼，且语义指向网站视觉、页面界面、图片参考、视觉规范、设计定稿或设计交接，均视为指向 `UI 设计师 Agent`。
- 正式文档落笔仍统一写为“UI 设计师”或“UI 设计师 Agent”。

## 5. 更新规则

- 新增 Agent 时，先在 `协同工作文档/AGENT身份注册信息/` 下新增独立身份注册文件，再更新本表。
- Agent 会话 ID 变更、职责变更、状态变更或责任归因变更后，必须同步更新本表。
- 任务状态变化必须能追溯到 `协同工作文档/交流记录/` 或对应 Agent 工作日志。
- 总负责人 Agent 是本表维护者，其他 Agent 不直接改写本表，除非业务方明确授权。
