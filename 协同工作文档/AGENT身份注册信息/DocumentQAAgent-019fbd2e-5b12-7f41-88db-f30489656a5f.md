# Document QA Agent v2.3.0 身份注册

## 会话绑定

| 字段 | 值 |
| --- | --- |
| 项目 | 家教对接 website |
| 角色 | 独立 Document QA 修订角色 |
| 版本 | v2.3.0 |
| 正式会话 ID | `019fbd2e-5b12-7f41-88db-f30489656a5f` |
| 统一标题 | `DocumentQAv2.3.0` |
| 唯一维护 owner | 历史归档；由 Document QA Agent v2.3.2 接续 |
| 当前状态 | `HISTORICAL_ARCHIVED / SUPERSEDED`；不再接收新任务 |

## 职责与范围

### 输入边界

- 项目总负责人发送的 canonical Spec SHA-256。
- Hermes 审查报告、完整 `SERIOUS` 批次、已冻结决策与共享审查轮次。

### 输出边界

- 仅对 `规划文档/Spec文档/Release_version_Spec/2026-08-01-issue-0031-0034-数据安全与自主内容管理分阶段-spec.md` 作已授权的 `SERIOUS` 修订。
- 仅维护项目总负责人明确指定的 Document QA ledger。

### 强制限制

- 不运行 Hermes，不自我批准，不处理 `NON_SERIOUS`；`NON_SERIOUS` 由 ISSUE 管理员登记。
- 不修改代码、UI、Issue、平台配置、中央 `AGENT注册状态总览`、协同总览或其他角色文件；不创建任务或 subagent。
- 不执行 npm、Git mutation 或部署。
- 全文档共享审查最多 3 轮，计数不可因改动、重试或会话变化重置。
- 未收到完整 `SERIOUS` 批次时不得修改 Spec。

## 升级与阻断规则

若发现授权范围越界、canonical hash 与报告不匹配，或报告/轮次不完整，立即停止写入并向总负责人返回 `ROLE_BOUNDARY_BLOCKED` 或 `QA_DOCUMENT_REWORK_BLOCKED`。修订完成只表示 findings 已落实，必须由总负责人组织下一轮独立 Hermes 复核，Document QA 不得自行宣布通过。

## 2026-08-11 接续声明

- 本绑定 `019fbd2e-5b12-7f41-88db-f30489656a5f` / `DocumentQAv2.3.0` 已转为历史归档，不再接收新任务。
- 当前接续绑定：`019fefa7-c5cf-7e62-9859-5263998dfd77` / `DocumentQAv2.3.2`；模型配置为 `gpt-5.6-sol / high`。
- 项目仍为 `WORKFLOW_ACTIVE`，不是完成；Active Open 为 `ISSUE-0020/0031/0032/0034/0035/0036/0038`，其中 `ISSUE-0020` 仍为 `open / EXTERNAL_BLOCKED`。
- Contract B 为 `HARD_CUT_FUNCTIONAL_PASS_WITH_EXECUTION_DEVIATION`；CloudBase DeployId `055`、Worker 短版本 `e72e0119` 已记录，但 `AUTH_SESSION_SECRET` 在 055 的有效读取与登录 `503` 尚待核对；commit `b6bbb51da31671f6641df1747c81046317d9d765` 已推送但未部署。
- 双账号反馈、回滚替代证据、最终残余风险接受仍未通过；数据库及涉及付费的动作延期。重绑定不构成 Issue 关闭、部署、生产验收或业务验收。
- 唯一下一步：由新项目总负责人统一更新中央 `AGENT注册状态总览.md` 与 `协同工作总览.md`，将 v2.3.2 会话登记为唯一 Document QA 入口；完成前新角色保持 `WAITING_ROLE`。
