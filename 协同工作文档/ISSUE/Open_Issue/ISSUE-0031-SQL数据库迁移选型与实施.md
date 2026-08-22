# ISSUE-0031：SQL 数据库迁移选型与实施

## 基本信息

- Issue ID：`ISSUE-0031`
- 类型：future improvement / data persistence planning
- 状态：`open`
- 工作流状态：`USER_CONFIRMATION_PENDING`
- 阶段口径：最终阶段变更 Spec 已完成 Hermes Round 3/3（`PASS_WITH_NONBLOCKING_OPEN_ISSUES`，0 项 `SERIOUS`、5 项 `NON_SERIOUS`，禁止第四轮）；`ISSUE-0033` 已 `closed / WORKFLOW_COMPLETE` 且上游门禁解除。业务方明确数据库暂不迁移、以后专门做；本轮预算=0，不采购、不迁移、不双写。ISSUE-0031 保持 `open / USER_CONFIRMATION_PENDING`，进入未来独立数据库周期，当前未授权实施
- 优先级：P2
- 来源：业务方后续需求：“数据库改为 MySQL 或其他 SQL 数据库”。
- 当前责任：产品经理 v2.3.0 仅负责唯一 canonical Spec 草案；不分配开发实现角色，ISSUE 管理员仅维护状态。

## 当前门禁（2026-08-10）

- 业务方向已确认：D1/D2/D3/D5/D8 口径已确认；D4 倾向 SQL/MySQL、D6 为 Turnstile/等价服务方向、D7 为安全基线方向，但 D4/D6/D7 的实施前最终选型/量化门禁仍保留。最终 Spec snapshot=`DBB40E250A6847DBF8109EB5D759CD558F74155CD5FE2C2691C5BACC48D5F14A`，QA ledger=`4119E877E30AED483F0287C4DD53B99055968484EB0B8E887A0E73078480CC51`，Hermes R3/3 report=`E62B4CBCB8E938DD744B85A0D4C80930FB758CAE6010CB8F99274C60A3FA9F5D`；上述方向不是最终实施选型或量化值。
- `ISSUE-0033` 已 `closed / WORKFLOW_COMPLETE`，0031 的上游实现门禁已解除；本 Issue 仍保持 `open / USER_CONFIRMATION_PENDING`，不得把方向确认写成已获开发授权。
- 数据库实施已延期至未来独立周期；本轮不采购、不迁移、不双写，预算为 0。未来恢复时仍须重新形成 D4 最终数据库供应商/地域/预算/RPO/RTO/停机容忍/合同等可核验选型与量化门禁，并由业务方或项目总负责人重新授权。
- 当前责任：业务方/项目总负责人完成上述最终选型与量化确认；产品经理维护 Spec 口径；ISSUE 管理员维护本状态；未分配开发实现角色。
- 最小解除条件：未来独立数据库周期获得业务方或项目总负责人明确启动授权，并形成 D4 最终选型/量化记录及预算、采购、迁移、双写边界。
- 唯一下一步：保持数据库延期边界；待业务方未来明确启动独立周期后，再评估 D4 选型与实施门禁，此前不启动代码、采购、迁移、双写或部署。

## 登记边界

- 本 Issue 仅登记迁移到 SQL 数据库的选型与实施需求；MySQL 仅为候选，不构成已确认技术选型。
- 当前不输出产品方案、架构、数据模型、迁移方案、代码、测试或部署计划。
- 不阻塞 `ISSUE-0030`，不得据此启动开发或分配实现任务。

## 依赖与恢复条件

- 依赖：联合 Spec 文档门禁已通过且 `ISSUE-0033` 已 `closed / WORKFLOW_COMPLETE`；数据库延期后，当前剩余依赖为未来独立周期的 D4 最终选型/量化及 D4/D6/D7 相关生产证据。
- 恢复触发：业务方或项目总负责人未来明确启动数据库独立周期，并完成 D4/D6/D7 适用门禁与实施授权。
- 唯一下一步：在未来独立周期授权前保持 `open / USER_CONFIRMATION_PENDING`，不启动数据库实施。

## 冻结执行顺序（2026-08-10 当前口径；源自 2026-08-01 顺序决策）

- ISSUE-0031、ISSUE-0032、ISSUE-0034 是大型后续任务，三项须由统筹、分阶段、可验收完整 Spec 覆盖；业务方现已授权启动该 Spec 草案，唯一 canonical 草案由产品经理 v2.3.0 撰写。
- 联合 Spec 已完成适用文档门禁，且 `ISSUE-0033` 已 `closed / WORKFLOW_COMPLETE`；0031/0032/0034 的上游顺序门禁已解除，但 D4/D6/D7 的适用实施前最终选型/量化门禁仍须逐项闭环；0031 本轮数据库预算为0并延期。
- `ISSUE-0030` 已 `closed / WORKFLOW_COMPLETE`；本 Issue 尚未获开发实现、测试、部署或实现角色分配授权。
- 唯一下一步：保持数据库延期，待业务方/项目总负责人未来启动独立周期后完成 D4/D6/D7 适用最终选型与量化确认，再明确 ISSUE-0031 实施授权。

## 关键文档门禁状态（2026-08-01，历史快照；已由后续门禁取代）

- 唯一 canonical Spec 草案：任务 `SPEC-0031-0034-20260801-R1-DRAFT`；SHA-256 `EE0DDECB73ED6D6AD9F303B57C2FB0D0CDF1E545635E4A8454E34EA9D986FC5F`，33708 bytes / 352 lines。
- Hermes Preflight 已通过：Hermes v0.18.2、`review_model=deepseek-v4-pro`、`default_model_changed=false`。
- 历史阻塞：本项目中央注册尚无独立 Document QA 线程；该阻塞随后已解除并完成适用 Hermes/Document QA 门禁。
- 历史快照曾为 `open / HERMES_REVIEW_BLOCKED`；不代表当前状态。当前门禁见“当前门禁（2026-08-09）”。
- 历史阻塞所有者与解除条件均已完成；不再作为当前 ISSUE-0031 阻塞。
- 历史唯一下一步为完成独立 Document QA 注册并启动 Round 1；已被后续 Round 2 及业务确认取代。

## 联合 Spec 门禁同步（2026-08-01，历史快照；已由 Round 3/业务确认取代）

- 独立 Document QA v2.3.0 已获业务方授权并正式注册：会话 `019fbd2e-5b12-7f41-88db-f30489656a5f`，标题 `DocumentQAv2.3.0`；其职责仅为 Hermes `SERIOUS` 批次出现时改命名 Spec 与 QA ledger，不运行 Hermes、不自审。
- 联合 Spec canonical SHA-256 仍为 `EE0DDECB73ED6D6AD9F303B57C2FB0D0CDF1E545635E4A8454E34EA9D986FC5F`；Hermes Preflight 已通过，现进入第 `1/3` 轮。
- 历史快照曾为 `open / HERMES_REVIEW_PENDING`，不代表当前状态；该文档门禁已完成。
- 历史唯一下一步为等待 Hermes Round 1；已由 Round 2 通过、业务方向确认及当前 D4/D6/D7 门禁取代。

## Round 2 通过后的门禁（2026-08-01，历史快照；当前口径见“当前门禁（2026-08-09）”）

- Hermes Round 2/3 报告 SHA-256 `FBBDD36BBBC829EABDACA7F70D1CFA61A4FD663B46F481166A143977FF41DB72`，source SHA-256 `11CBF1E4CA2523153136C92EB3567B81FAB3175EDA6B4A2EFE5127921D3C3004`，`canonical_source_unchanged=true`；结论 `PASS_WITH_NONBLOCKING_OPEN_ISSUES`，0 项 `SERIOUS`、5 项 `NON_SERIOUS`。
- 项目总负责人已用 Round 1 报告与 QA ledger 对照确认 `S-001` / `S-002` 修订完整且未越界；不启动 Round 3。Round 1/2 的 `NON_SERIOUS` 均由 ISSUE-0035 独立追踪，不阻塞本 Issue。
- 当前为 `open / USER_CONFIRMATION_PENDING`：文档门禁已通过，业务方向已确认；仍等待 D4/D6/D7 实施前最终选型与量化门禁，不得开发、测试、部署或关闭。
- 唯一下一步：由业务方/项目总负责人确认 D4/D6/D7 的最终选型与量化值，并明确 ISSUE-0031 实施授权。

## 阶段变更 Spec 最终门禁同步（2026-08-10）

- 最终 canonical Spec snapshot SHA-256=`DBB40E250A6847DBF8109EB5D759CD558F74155CD5FE2C2691C5BACC48D5F14A`；QA ledger SHA-256=`4119E877E30AED483F0287C4DD53B99055968484EB0B8E887A0E73078480CC51`。
- Hermes Round 3/3 report SHA-256=`E62B4CBCB8E938DD744B85A0D4C80930FB758CAE6010CB8F99274C60A3FA9F5D`；metadata SHA-256=`A43D97A71CE19F2D3AC2182AE4DC0F5F54D44B22E2C9B4B7ADBA6982CA7653EB`；`deepseek-v4-pro`，`canonical_source_unchanged=true`，verdict=`PASS_WITH_NONBLOCKING_OPEN_ISSUES`（0 SERIOUS / 5 NON_SERIOUS），禁止第四轮。
- 业务方最终决定数据库暂不迁移、以后专门做；本轮预算=0，不采购、不迁移、不双写。该决定不关闭本 Issue，也不构成数据库实施授权。
- 当前状态继续 `open / USER_CONFIRMATION_PENDING`；恢复触发为业务方未来明确启动数据库独立周期，并重新确认 D4 供应商/地域/预算、迁移/双写策略、RPO/RTO、停机容忍、合同与生产验收证据。
- 唯一下一步：保持延期边界，等待未来独立周期授权；在此之前不启动数据库代码、采购、迁移、双写、部署或生产操作。

## 2026-08-10 补充授权边界

- 用户授权所有不影响 sandbox/System OS 的非金钱权限请求、Issue、代码、测试、Git、免费配置、部署与受控验收持续推进；本 Issue 的付费采购、付费服务与数据库迁移预算仍暂停搁置。
- 本授权不等于密钥明文披露、不授权绕过 CAPTCHA、不虚构 owner、不跳过独立验收；数据库仍须未来独立周期重新确认选型、预算与实施门禁。
