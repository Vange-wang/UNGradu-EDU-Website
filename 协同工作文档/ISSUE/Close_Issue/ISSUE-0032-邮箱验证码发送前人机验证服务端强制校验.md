# ISSUE-0032：邮箱验证码发送前人机验证服务端强制校验

## 基本信息

- Issue ID：`ISSUE-0032`
- 类型：future security improvement / abuse prevention planning
- 状态：`closed`
- 工作流状态：`WORKFLOW_COMPLETE`（仅 ISSUE-0032 自身）
- 阶段口径：V4 exact commit、独立技术复核、本地回归、Deploy 069 生产行为与产品/业务验收已按本次关单复核证据收口；严格连续 24 小时方案 A 未通过，且 Deploy 069 source-binding/rollback receipt 未精确证明，均保留为业务方接受的残余风险，不改写为技术 PASS。ISSUE-0042 与 ISSUE-0046 继续为 open / NON_BLOCKING_DOCUMENT_REVIEW；项目 workflow 仍 `WORKFLOW_ACTIVE`
- 优先级：P1
- 来源：业务方后续需求：登录时接入 Cloudflare 点击勾选式人机验证，只有通过真人验证才允许发送邮箱验证码。
- 当前责任：项目总负责人独立核对本次 canonical 迁移与总表同步；522 源站可用性问题由项目总负责人/平台执行侧另行登记和处理，不并入 ISSUE-0032 的认证链结论；ISSUE 管理员仅维护状态。

## 当前门禁（2026-08-10）

- 业务方向已确认：D1/D2/D3/D5/D8 口径已确认；D4 倾向 SQL/MySQL、D6 为 Turnstile/等价服务方向、D7 为安全基线方向，但 D4/D6/D7 的实施前最终选型/量化门禁仍保留。最终 Spec snapshot=`DBB40E250A6847DBF8109EB5D759CD558F74155CD5FE2C2691C5BACC48D5F14A`，QA ledger=`4119E877E30AED483F0287C4DD53B99055968484EB0B8E887A0E73078480CC51`，Hermes R3/3 report=`E62B4CBCB8E938DD744B85A0D4C80930FB758CAE6010CB8F99274C60A3FA9F5D`；上述方向不是最终实施选型或量化值。
- `ISSUE-0033` 已 `closed / WORKFLOW_COMPLETE`，0032 的上游实现门禁已解除；本 Issue 仍保持 `open / USER_CONFIRMATION_PENDING`，不得把方向确认写成已获开发授权。
- provider-neutral 本地实现准备已获业务方向授权，但 provider-specific widget/secret、真实服务端验证与生产集成仍未通过；必须先取得中国大陆目标网络可用性、供应商/平台证据、失败与无障碍回归、密钥与回滚门禁。数据库延期不转化为本 Issue 的 provider-specific 通过。
- 当前责任：业务方/项目总负责人完成上述最终选型与量化确认；产品经理维护 Spec 口径；ISSUE 管理员维护本状态；未分配开发实现角色。
- 最小解除条件：provider-neutral 本地/集成契约通过独立复核，并取得中国大陆目标网络、provider-specific widget/secret、平台验证与生产回滚证据。
- 唯一下一步：按推荐方向推进受门禁约束的 provider-neutral 本地实现准备；在上述网络与平台证据齐备前，不接入真实 widget/secret、不部署生产。

## 登记边界

- 后续评估 Cloudflare Turnstile 或等价人机验证，并在邮箱验证码发送前执行服务端强制校验。
- 正式启动时须评估失败处理、无障碍、隐私、绕过路径、服务端验证与回滚；当前不预先选定供应商、方案或实现细节。
- 不阻塞 `ISSUE-0030`，不得据此接入 Cloudflare、修改登录流程、编写代码或分配实现任务。

## 依赖与恢复条件

- 依赖：联合 Spec 文档门禁已通过且 `ISSUE-0033` 已 `closed / WORKFLOW_COMPLETE`；provider-neutral 本地授权不替代 D4/D6/D7 适用实施前最终选型/量化、目标网络、平台与生产证据。
- 恢复触发：业务方或项目总负责人完成 D4/D6/D7 适用门禁，并明确 provider-specific 集成/生产授权。
- 唯一下一步：在 provider-specific 门禁恢复前保持 `open / USER_CONFIRMATION_PENDING`，先推进受限 provider-neutral 本地/集成准备，不接入真实 widget/secret。

## 阶段变更 Spec 最终门禁同步（2026-08-10）

- 最终 canonical Spec snapshot SHA-256=`DBB40E250A6847DBF8109EB5D759CD558F74155CD5FE2C2691C5BACC48D5F14A`；QA ledger SHA-256=`4119E877E30AED483F0287C4DD53B99055968484EB0B8E887A0E73078480CC51`。
- Hermes Round 3/3 report SHA-256=`E62B4CBCB8E938DD744B85A0D4C80930FB758CAE6010CB8F99274C60A3FA9F5D`；metadata SHA-256=`A43D97A71CE19F2D3AC2182AE4DC0F5F54D44B22E2C9B4B7ADBA6982CA7653EB`；`deepseek-v4-pro`，`canonical_source_unchanged=true`，verdict=`PASS_WITH_NONBLOCKING_OPEN_ISSUES`（0 SERIOUS / 5 NON_SERIOUS），禁止第四轮。
- 当前获授权范围仅为 provider-neutral 本地实现准备/验证；真实 widget、secret、provider-specific API 与中国大陆目标网络集成不在本次已通过范围内，仍须独立证据、平台验证、生产回滚与业务验收。
- 唯一下一步：原实现 owner 在本地/集成门禁内推进 provider-neutral 契约，随后补齐中国大陆网络与平台证据，再申请 provider-specific/生产集成门禁；Issue 保持 open。

## 2026-08-10 补充授权边界

- 用户授权非金钱阶段持续推进，因此 provider-neutral 本地/集成、免费配置与受控验收可按既有门禁继续；涉及付费采购或付费服务仍暂停。
- 该授权不披露密钥明文、不绕过 CAPTCHA，不替代中国大陆网络/平台证据、独立复核、生产回滚与业务验收；真实 widget/secret 仍须专门门禁。

## 冻结执行顺序（2026-08-10 当前口径；源自 2026-08-01 顺序决策）

- ISSUE-0031、ISSUE-0032、ISSUE-0034 是大型后续任务，三项须由统筹、分阶段、可验收完整 Spec 覆盖；业务方现已授权启动该 Spec 草案，唯一 canonical 草案由产品经理 v2.3.0 撰写。
- 联合 Spec 已完成适用文档门禁，且 `ISSUE-0033` 已 `closed / WORKFLOW_COMPLETE`；0031/0032/0034 的上游顺序门禁已解除，但 D4/D6/D7 的适用实施前最终选型/量化门禁仍须逐项闭环；0032 仅 provider-neutral 本地获授权。
- `ISSUE-0030` 已 `closed / WORKFLOW_COMPLETE`；本 Issue 尚未获开发实现、测试、部署或实现角色分配授权。
- 唯一下一步：原实现 owner 先在 provider-neutral 本地/集成范围推进；业务方/项目总负责人完成 D4/D6/D7 适用最终选型/量化及网络/平台证据后，再明确 provider-specific 实施授权。

## 关键文档门禁状态（2026-08-01，历史快照；已由后续门禁取代）

- 唯一 canonical Spec 草案：任务 `SPEC-0031-0034-20260801-R1-DRAFT`；SHA-256 `EE0DDECB73ED6D6AD9F303B57C2FB0D0CDF1E545635E4A8454E34EA9D986FC5F`，33708 bytes / 352 lines。
- Hermes Preflight 已通过：Hermes v0.18.2、`review_model=deepseek-v4-pro`、`default_model_changed=false`。
- 历史阻塞：本项目中央注册尚无独立 Document QA 线程；该阻塞随后已解除并完成适用 Hermes/Document QA 门禁。
- 历史快照曾为 `open / HERMES_REVIEW_BLOCKED`；不代表当前状态。当前门禁见“当前门禁（2026-08-09）”。
- 历史阻塞所有者与解除条件均已完成；不再作为当前 ISSUE-0032 阻塞。
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
- 唯一下一步：由业务方/项目总负责人确认 D4/D6/D7 的最终选型与量化值，并明确 ISSUE-0032 实施授权。

## 2026-08-19 参数回执用户确认门同步

- 独立同步结论：`V4_PARAMETER_RECEIPT_USER_CONFIRMED`、`DOCUMENT_GATE_PASSED`、`USER_CONFIRMATION_PASSED` 已通过；`ISSUE-0032` 仅同步为 `open / IMPLEMENTATION_AUTHORIZATION_PENDING`，本段不是 Issue 关闭记录。
- 用户最终确认记录：`规划文档/Spec文档/Release_version_Spec/2026-08-19-v4-issue-0032-参数回执用户最终确认记录.md`，SHA-256=`2DC7D6096BE82FB3F1A45B7F40A594AC44BAFF57E022376FC8D717A54DD0FA9D`，5615 bytes / 79 lines。该记录只确认参数回执与文档门禁，不授权代码实现、测试、provider/Secret、平台、生产、业务验收或 Issue 关闭。
- 参数候选：`规划文档/Spec文档/Release_version_Spec/2026-08-19-v4-issue-0032-parameter-receipt-candidate.md`，SHA-256=`52358D5F7BC7BE75819CA6CBBFDA9D8AAD64C98CF8863D91A4A197E75F557ECF`，18543 bytes / 259 lines；用户选择方案 B，作为最终参数回执基线。
- Hermes Round 1 与整改绑定：Round 1 报告 SHA-256=`F337BFCD501D7A8410D201D387740A939EB8DB6B254CE33F97EA76AF475C12AD`，8890 bytes / 119 lines；Round 1 metadata SHA-256=`C7F8FB8984DB4F7CAE8CC1E8C9CD5C865B94A2656AC3B9728B03631AD112BF73`，912 bytes / 16 lines；Document QA ledger SHA-256=`C136D9B413E1DA12D13AF84DD6B408565A8FE92F5E469EB4E7DCF24C8C6F9185`，10102 bytes / 89 lines。S1/S2/S3 整改边界已由后续 Round 2 复核承接。
- Hermes Round 2 绑定：`规划文档/Spec文档/Release_version_Spec/2026-08-19-v4-issue-0032-parameter-receipt-hermes-round-2.md`，SHA-256=`7F9D66B2027658797FC118596082EBFFB867665CF5FC5C6EC7D09FD21C63A768`，6911 bytes / 87 lines；同名 metadata SHA-256=`AA029D71F8F9C9EBF5C7E4EAD24574023153B41F304526D68A9EEAB7018AFAFB`，1977 bytes / 33 lines。模型=`deepseek-v4-pro`，轮次=`2/3`，结论=`PASS_WITH_NONBLOCKING_OPEN_ISSUES`，`SERIOUS=0`，S1/S2/S3 closed；N1-N9 均由 ISSUE-0042 作为 open / NON_BLOCKING_DOCUMENT_REVIEW 追踪，不自动执行 Round 3。
- ISSUE-0042 绑定：`协同工作文档/ISSUE/Open_Issue/ISSUE-0042-0032邮箱人机验证关闭Spec-Hermes-Round1非阻塞文档债务.md`，SHA-256=`9DF5DD66D45C0277E67824053E1CFA9F9B6B9CD703F6C833A2080FDC472B0BB0`，11432 bytes / 82 lines；原 Round 1 台账及 Round 2 N1-N9 含义、状态和映射不在本次修改范围内。
- 产品经理工作记录绑定：`规划文档/产品经理工作记录.md`，SHA-256=`5C73456F70C11806CFA37ABE0E0806766CCC1DB0561F16B29F352B481A1E2208`，345408 bytes / 4812 lines；其最终确认段与上述门禁口径一致。
- 当前边界：参数确认门已通过；实施授权门仍为 `IMPLEMENTATION_AUTHORIZATION_PENDING`。不得把参数确认写成实现、测试、集成、部署、生产验证、业务验收或关单；provider-specific widget/Secret、平台与生产动作仍未授权。ISSUE-0031、数据库及全部付费动作继续延期。
- 项目 workflow 仍为 `WORKFLOW_ACTIVE`；Active Open 保持 11 项：`ISSUE-0031/0032/0035/0036/0038/0040/0041/0042/0043/0044/0045`。
- 唯一下一步：项目总负责人准备边界明确的 provider-neutral 实现包，并在开始代码前向用户请求一次“大动作”授权；在获得该授权前不得继续实现、测试或提交。

## 2026-08-23 ISSUE-0032 独立关单审查与 canonical 关闭

- 独立关单结论：`ISSUE_0032_CLOSED / WORKFLOW_COMPLETE (ISSUE-0032 only)`。本次关闭只适用于 ISSUE-0032 自身；项目总 workflow 仍为 `WORKFLOW_ACTIVE`，不代表其他 Issue、项目验收或项目完成。
- 状态迁移：原 `Open_Issue/ISSUE-0032-邮箱验证码发送前人机验证服务端强制校验.md` 已迁移且不存在；当前唯一 canonical 为 `协同工作文档/ISSUE/Close_Issue/ISSUE-0032-邮箱验证码发送前人机验证服务端强制校验.md`，不得保留重复 Open canonical。
- 关闭边界：代码、独立技术复核、推送回执、Deploy 069、生产用户可见链路与产品/业务验收证据已分层核对。严格连续 24 小时 Scheme A 技术窗口以及 Deploy 069 source-binding / rollback receipt 仍是证据缺口；它们由业务方接受为残余风险，但绝不改写为技术 PASS、严格 24 小时技术 PASS、精确平台 Git provenance 或真实回滚已演练。

### 关单证据绑定

- 实现固定点：分支 `V4-issue-0032-email-turnstile-closure`，exact commit=`3c69840c6d1722c0438c5d9342c4d68efcecd6d0`，parent=`bdab1d8331afd52f46fb9e71cbe43cdc8f9b8d5d`，tree=`ad009f8eb7585d3bf35fdff75449825eee6a8b11`；远端同名分支与该提交同步。上游冻结 patch OID=`ba45432b649dc3d1092fe9645094493c76a8ac26`，本登记不将其改写为平台 Git provenance 证明。
- 代码/独立复核：提交包含 CloudBase 邮箱验证码原子消费修复及测试；最新验证为 email-auth `29/29`、ISSUE-0032 四文件 `56/56`、ISSUE-0034 三文件 `65/65`、全量 `82/82 files`、`600 passed / 1 skipped`，typecheck/lint/build 均退出 0、build `17/17`、diff-check=0。独立代码复核报告 `Code文档/docs/2026-08-20-v4-issue-0032-provider-specific-independent-code-review-r1.md` SHA-256=`5EA949908694009B589549AD24D1984BD690E720B0C1A096257C38A97405A197`，结论 `TECH_REVIEW_PASS`；上游冻结推送回执结论为 `POST_PUSH_COMMIT_ATTESTATION_PASS`。
- 参数与文档链：最终 provider-specific authorization package SHA-256=`56D8C7060A10F996A58DC9F30CCE767F07537B9EF90AB6F69DDB59D098E30EFC`，41113 bytes / 379 lines；该 package 的作者/文档状态边界仍保留，不把文档草案状态当作实现或生产通过。Document QA ledger SHA-256=`F77141594E9B420E6CD8C436C0D30804B1063664EC132D91480B8BEB10A4290C`；Hermes Round 2 报告 SHA-256=`B83E042B9032498812A1A5FBB04CD735EA88B58437FEA51A4A1630685AA937A0`，metadata SHA-256=`49396FEB08F60BBABBF4748BBC5D36FE5D80270732A6C889E60D89FA193F08A5`，`round=2/3`、`model=deepseek-v4-pro`、`canonical_source_unchanged=true`、`default_model_changed=false`、结论=`PASS_WITH_NONBLOCKING_OPEN_ISSUES`、`SERIOUS=0`。ISSUE-0046 继续承载 NON_SERIOUS，不因本次关单关闭。
- 参数回执链：用户最终确认记录 SHA-256=`2DC7D6096BE82FB3F1A45B7F40A594AC44BAFF57E022376FC8D717A54DD0FA9D`；最终参数候选 SHA-256=`52358D5F7BC7BE75819CA6CBBFDA9D8AAD64C98CF8863D91A4A197E75F557ECF`；参数回执 Hermes Round 2 SHA-256=`7F9D66B2027658797FC118596082EBFFB867665CF5FC5C6EC7D09FD21C63A768`、metadata SHA-256=`AA029D71F8F9C9EBF5C7E4EAD24574023153B41F304526D68A9EEAB7018AFAFB`；ISSUE-0042 SHA-256=`9DF5DD66D45C0277E67824053E1CFA9F9B6B9CD703F6C833A2080FDC472B0BB0`。ISSUE-0042 仍为 `open / NON_BLOCKING_DOCUMENT_REVIEW`。
- 产品/业务最终验收：`规划文档/里程碑文档/2026-08-23-v4-issue-0032-产品业务最终验收.md`，SHA-256=`48BF86BD97A8CD37D86DC7DF84A3BC7EF75350D9DE0C77DE2DD631578DE64105`，5526 bytes / 80 lines；文件结论为 `PRODUCT_BUSINESS_ACCEPTANCE_PASS_WITH_ACCEPTED_RESIDUAL_RISKS`，明确业务接受不等于技术 PASS，并明确 24 小时窗口、Deploy 069 source-binding/rollback receipt 为残余风险，522 独立分类，ISSUE-0042/0046 保持 open，项目 workflow 保持 active。
- 生产边界：Cloudflare Widget=`ungradu-edu-login-prod`、hostname=`ungraduedu.eu.cc`、Managed；Deploy 069 为正常、100% 流量、实例数不少于 1。用户确认 Turnstile、收信、登录、刷新保持登录、退出、旧验证码重放拒绝及重新取码登录均成功。累计样本至少 28 次：第一批 18（A/B 各 9，双向隔离 6/6），第二批 10（A/B 各 5，A→B 3/3、B→A 2/3）；两批均因中断超过 15 分钟，故不满足一次连续 24 小时严格技术 PASS。
- 持久化生产独立复核：`Code文档/docs/2026-08-23-v4-issue-0032-production-independent-review.md`，SHA-256=`4026E98D17AF2FBF0D020A96E802E2531D6085828E76684A026C65BE91FA4732`，7582 bytes / 100 lines；verdict=`PRODUCTION_TECH_ACCEPTANCE_BLOCKED_WITH_ACCEPTED_BUSINESS_RISK`，原技术结论保持 `PRODUCTION_TECH_ACCEPTANCE_BLOCKED`，P0/P1/P2=`0/2/0`。主链、Session、顺序重放子门为 `PASS`；未通过门禁精确为 Scheme A 单一连续 24 小时窗口、Deploy 069 source-binding 与安全 rollback receipt。该报告明确业务接受不得改写技术 PASS，也不是 Issue 关单决定。

### 接受残余风险登记

| ID | 事实 | 状态 | 接受方 | 接受日期 | 再打开触发条件 | owner |
| --- | --- | --- | --- | --- | --- | --- |
| R1 | 两个生产观察批次均发生超过 15 分钟中断；累计至少 28 次样本不能替代一次连续 24 小时 Scheme A 技术窗口。 | `ACCEPTED_RESIDUAL_RISK` | 业务方/用户 | `2026-08-23` | 若严格 24 小时窗口成为强制门禁、出现新的验证码误拒/系统错误/重放成功/跨账号串收，或业务接受被撤回，则重开或重新审查 ISSUE-0032。 | 项目总负责人 / 生产执行侧 / 产品经理 |
| R2 | Deploy 069 的精确 source-binding 与 rollback receipt 尚未形成可复读闭环；不得声称真实回滚已演练或平台 Git provenance 已精确证明。 | `ACCEPTED_RESIDUAL_RISK` | 业务方/用户 | `2026-08-23` | 若发现部署源绑定冲突、部署漂移、必须执行真实回滚，或后续关单规范要求该 receipt，则重开或补充独立审查。 | 项目总负责人 / 平台与生产执行侧 |

### 522 独立分类（不并入 ISSUE-0032 关闭门）

- 2026-08-22 17:15:42 UTC 的截图显示 Cloudflare `522 Connection timed out`、Browser Working / Cloudflare Working / Host Error；截图 SHA-256=`00EDA7AA9BDD0BD14818F4C62C1838003BB931E85C1D7847F323204691E3FF06`，302218 bytes。
- 该事实分类为 `INTERMITTENT_ORIGIN_AVAILABILITY_RISK / INDEPENDENT_OPS_ISSUE`，不是 Turnstile、邮箱验证码、session 或 replay 子门的证据，也不作为 ISSUE-0032 技术 PASS 的依据。产品验收记录中的后续只读复核显示正式域名约 2.2 秒返回 200、默认 CloudBase 域名约 0.17 秒返回 403；因此本次不把 522 悄悄吞入 ISSUE-0032，也不在本 canonical 中新建或重开 Issue。
- owner/下一触发：项目总负责人及平台/生产执行侧独立跟踪源站可用性；若后续证据证明 522 由本 Issue 的认证改动直接引起，或阻断本 Issue 已定义的认证证据链，再按证据重新评估关联 Issue。数据库、全部付费动作及 ISSUE-0031 继续延期。

### 其他状态与保护边界

- ISSUE-0042、ISSUE-0046 均保持 `open / NON_BLOCKING_DOCUMENT_REVIEW`；不关闭 ISSUE-0031、0035、0036、0038、0040、0041、0042、0043、0044、0045 或任何其他 Issue。
- 本次不记录任何 Secret、token、cookie 或平台敏感值；不执行 npm、测试、构建、Git mutation、提交、推送、部署、Cloudflare/CloudBase/provider、数据库、付费或任务/subagent 操作。
- 唯一下一步：项目总负责人独立核对本 Close canonical、ISSUE 总表与本工作记录；522 由平台/生产执行侧按独立源站可用性问题继续跟踪。项目 workflow 不得因本 Issue 关闭而写成 `WORKFLOW_COMPLETE`。
