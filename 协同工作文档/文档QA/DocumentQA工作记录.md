# Document QA 工作记录

## 2026-08-01｜Document QA v2.3.0 正式接管

- 会话：`019fbd2e-5b12-7f41-88db-f30489656a5f` / `DocumentQAv2.3.0`
- 接管文件：`协同工作文档/AGENT身份注册信息/DocumentQAAgent-019fbd2e-5b12-7f41-88db-f30489656a5f.md`、本工作记录。
- 授权边界：仅在项目总负责人发送完整 `SERIOUS` 批次后，修订命名 Spec 和指定 QA ledger；本次不修改 Spec、Issue、代码、UI、平台配置、中央注册信息或其他角色文件。
- 当前状态：`WAITING_ROLE`。
- canonical Spec：`2026-08-01-issue-0031-0034-数据安全与自主内容管理分阶段-spec.md`。
- canonical SHA-256：`EE0DDECB73ED6D6AD9F303B57C2FB0D0CDF1E545635E4A8454E34EA9D986FC5F`。
- Hermes：尚未开始，`0/3`；尚未收到完整 `SERIOUS` 批次。
- 阻塞：等待总负责人提供与上述 hash 匹配的 Hermes 报告、完整 `SERIOUS` 批次、冻结决策、轮次以及指定 QA ledger 路径。
- 唯一下一步：总负责人发送首轮 Hermes 完整 `SERIOUS` 返工包；无 `SERIOUS` 时保持不改 Spec。

## 2026-08-01｜DOCQA-ISSUE-0031-0034-R1 SERIOUS 修订

- 输入已核对：canonical SHA-256 `EE0DDECB73ED6D6AD9F303B57C2FB0D0CDF1E545635E4A8454E34EA9D986FC5F`；Hermes Round 1 报告 SHA-256 `7A90219DE193DD46A7D5A8660A66BD69E0DDF77927499ADD84E9787142ECF581`。
- 修订范围：仅 canonical Spec、`2026-08-01-issue-0031-0034-DocumentQA修订记录.md` 和本工作记录；仅处理 S-001、S-002。
- 修订结果：每轮 SERIOUS 的唯一批次规则已与阶段图/审查记录/下一步一致；旧记录安全隔离最低不变量、验收/失败路径和 D8 已补充。
- 非范围：N-001～N-010 与 Missing Acceptance Criteria 未修改，应由 ISSUE 管理员登记。
- 轮次：仍为 `1 / 3`，修订不重置计数；不自我批准。
- 输出 canonical SHA-256：`11CBF1E4CA2523153136C92EB3567B81FAB3175EDA6B4A2EFE5127921D3C3004`。
- 当前状态：`QA_DOCUMENT_REWORK_COMPLETE`；总负责人可据此发起 Hermes Round 2/3。

## 2026-08-10｜POST0033-DOCQA-R1-SERIOUS-BATCH-20260810

- 会话/角色：`019fbd2e-5b12-7f41-88db-f30489656a5f` / Document QA v2.3.0；新草案周期 Round 1/3，非旧联合 Spec 第四轮。
- 输入已核对：草案 `D2C9C03E6ED74B20B0F92BD9966D32644586A4066C402693311AFB2B32482CFA`；Hermes 报告 `AB4CAA3C470917E0F367175A663653A35351AB0A91EAB923C8956C45570FD14D`；sidecar `339FC33A3AB36684EFF85FD003984FD210E8E864609CC30953E09692C8CB75E1`。
- 冻结输入已采用：D4/D6/D7 仅写建议安全骨架、未确认值可收紧；0020 外部 owner UNKNOWN 且保持 `EXTERNAL_BLOCKED`；原报告/sidecar 不改、binding 由 sidecar + 总负责人 append-only freeze；0035 移出关键路径；0036 不编 S4；TECH_VERIFIED 与 BUSINESS_ACCEPTED 分层，业务沉默不自动通过。
- 本次仅处理 S-001～S-006；未处理 ISSUE-0037 的 N-001～N-004。
- 修订结果：新增 D4/D6/D7 决策门；补 0020 升级链；建立 provenance/G0 不改原件规则；补 S1/S2/S3 定量技术骨架；将 0035 移出硬依赖；将 0036 标为独立未来门禁；补双层收口、超时升级和失败传播。
- 输出草案 SHA-256：`427216758E4F9E9F434E48FE8F5609825037558ACF760C175366AF83724ED259`；大小 `36,349 bytes`；`rg -n` 最后一行 `438`。
- QA ledger：`规划文档/Spec文档/Release_version_Spec/2026-08-10-post-0033-DocumentQA修订记录.md`；hash `20E07AD277127B5BB033A5AC3202F63E28C1CBCF74310386AD6FD8E2B18B5C72`。
- 无关变更证据：原 Hermes 报告/sidecar hash 未改变；本任务写入范围仅为草案、新 ledger 和本工作记录；未运行 Hermes/npm/Git mutation/部署，未改旧联合 Spec、旧 QA ledger、Issue、代码、UI 或平台。
- 当前状态：`QA_DOCUMENT_REWORK_COMPLETE`，不是文档通过；唯一下一步为总负责人核对输出 hash并登记 append-only provenance freeze 后发起 Hermes Round 2/3。

## 2026-08-10｜ISSUE-0036 Round 1 SERIOUS 完整批次一次性修订

- 会话/角色：`019fbd2e-5b12-7f41-88db-f30489656a5f` / Document QA v2.3.0；共享审查计数 `Round 1/3`，不重置。
- 输入已核对：Spec `0F6B7E30750E2D5733AF18D9D8C693041BC3E4F8D8921F6AC0DC2784C345A2F6`；Hermes 报告 `CF9A9FF6170DC0F53DD29584D4B0075F18424AA76CD637791C7BA8B302DEA7BD`；metadata `0609AD394CB1E9C66D244480267F75DAD1590AA786C411E21D28D3E96F71AB5C`。
- 冻结决策已采用：F-001～F-007 一次性批量修订；供应商原始请求/响应默认零留存、无训练/广告画像/二次用途；DPA/地域/子处理者/删除保留门；TECH_VERIFIED 与 BUSINESS_ACCEPTED 分层，业务沉默不自动通过。
- 修订映射：F-001 SLO/15 秒硬超时与分层埋点；F-002 原始 Unicode 混淆扫描、NFKC 后 offset map；F-003 版本化高置信规则与联系人类别；F-004 恢复统一 `pending_review` 且禁止 `deleted → published`；F-005 供应商数据边界与 fail-closed；F-006 合法数字上下文排除/冲突人工；F-007 允许/禁止状态转换与服务失败不发布。
- 补验收：归一化/偏移、URL/社交、12 项 fail-closed、提示注入、成本熔断、390px 移动端无障碍均已写入 Spec 与 ledger；N-001～N-007 不处理，由 ISSUE-0038 负责。
- 输出 Spec SHA-256：`9410FDA4E4B7A6E9474E96239C916D5A79AC32627159E89F6A5A4A8F29F313EC`；大小 `36,672 bytes`；`rg -n` 最后一行 `537`。
- QA ledger：`规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-DocumentQA修订记录.md`；SHA-256 `871A0C21072CB0A6BBC99AB57F758406842D7C5C90F84B97B550AC301086CF3F`；大小 `6,999 bytes`；`rg -n` 最后一行 `47`。
- 原 Hermes 报告/metadata 未修改且 hash 应保持输入值；未运行 Hermes/npm/Git mutation/部署，未改 Issue、代码、UI、配置、旧 Spec 或旧 ledger。
- 当前状态：`QA_DOCUMENT_REWORK_COMPLETE`，不宣称通过；唯一下一步为总负责人冻结新 source hash 并发起 Hermes Round 2。

## 2026-08-10｜ISSUE-0036 Round 2 S-001/S-002 申诉最小修订

- 会话/角色：`019fbd2e-5b12-7f41-88db-f30489656a5f` / Document QA v2.3.0；共享计数 `Round 2/3`，剩余且仅剩 Round 3/3。
- 输入已核对：Spec `9410FDA4E4B7A6E9474E96239C916D5A79AC32627159E89F6A5A4A8F29F313EC`；Round 2 报告 `980EC8B46DBFBADF932ADF50878CE89A4069ABFE6CC4BE509C4DB9AC35161717`；metadata `29F30C8245A97E5C781DCF2255CBD983DAC2140ECFA2218CA40EB3A3BEF5AF38`。
- 冻结决策已采用：不改内容申诉 `rejected → appeal_pending → needs_manual_review → published/rejected`；改内容 `rejected → draft → pending_review`；原因码、同一审核、发布前版本/owner/hash/审计校验；24h 限制、重复 key 幂等、第三次原判锁 7 天及 fail-closed；申诉 SLO 入队 p95≤30m、裁决 p95≤4h、99%≤1 工作日。
- 验收已补：两条 golden path、24h 重复/冲突 key、跨账号/stale/删除态、7 天锁定、审计失败、SLO 负测与公开/聊天/联系方式门控。
- 输出 Spec SHA-256：`005EA5F2490DC2E43A134BA0421EFBD357179C90E29A6F2AB560F6F61A97B437`；大小 `39,996 bytes`；`rg -n` 最后一行 `575`。
- QA ledger：同一 `2026-08-10-issue-0036-DocumentQA修订记录.md` 已追加本轮记录；SHA-256 `E949EAF42F4A0137EE5618A64468D14F4A29BADEFAD76375F4C38CA8EAA69D3B`；大小 `10,516 bytes`；`rg -n` 最后一行 `76`。
- Round 2 报告/metadata 未修改；未处理 ISSUE-0038；未运行 Hermes/npm/Git mutation/deploy，未改代码、UI、配置或其他角色文件，未自我批准。
- 当前状态：`QA_DOCUMENT_REWORK_COMPLETE`，不宣称通过；唯一下一步为总负责人冻结新 source hash 并发起 Hermes Round 3/3。

## 2026-08-11｜Document QA v2.3.2 正式重绑定

- 新会话/标题：`019fefa7-c5cf-7e62-9859-5263998dfd77` / `DocumentQAv2.3.2`；模型配置：`gpt-5.6-sol / high`。
- 旧绑定：`019fbd2e-5b12-7f41-88db-f30489656a5f` / `DocumentQAv2.3.0` 已转为历史归档，不再接收新任务。
- 本次维护文件：新增 `协同工作文档/AGENT身份注册信息/DocumentQAAgent-019fefa7-c5cf-7e62-9859-5263998dfd77.md`；最小更新旧注册文件归档状态；追加本工作记录。不新建独立钦定锚点。
- 职责边界：仅在项目总负责人发送匹配 canonical hash 的完整 `SERIOUS` 批次、冻结决策和共享轮次后，修订明确命名的 Spec 与指定 QA ledger；不运行 Hermes、不自我批准、不处理 `NON_SERIOUS`。
- 权限边界：不修改中央 `AGENT注册状态总览.md`、`协同工作总览.md`、`CONTEXT.md`、未授权 Spec、Issue canonical/state、代码、UI、其他角色文件或平台配置；不运行 npm、不执行 Git mutation、不部署、不创建任务或 subagent。
- 当前项目状态：`WORKFLOW_ACTIVE`，不是 `WORKFLOW_COMPLETE`；本角色在无完整 `SERIOUS` 批次时保持 `WAITING_ROLE`。
- Active Open：`ISSUE-0020`、`ISSUE-0031`、`ISSUE-0032`、`ISSUE-0034`、`ISSUE-0035`、`ISSUE-0036`、`ISSUE-0038`。
- `ISSUE-0020`：`open / EXTERNAL_BLOCKED`；Contract B 为 `HARD_CUT_FUNCTIONAL_PASS_WITH_EXECUTION_DEVIATION`。CloudBase DeployId `055`、Worker 短版本 `e72e0119` 已记录；`AUTH_SESSION_SECRET` 在 055 的有效读取与登录 `503` 尚待核对。
- 登录入口修复 commit `b6bbb51da31671f6641df1747c81046317d9d765` 已推送但未部署；双账号反馈、回滚替代证据与最终残余风险接受仍未通过。
- 数据库与涉及付费的动作延期。本次重绑定不构成 Issue 关闭、部署、生产验收或业务方验收。
- 唯一下一步：由新项目总负责人统一更新中央 `AGENT注册状态总览.md` 与 `协同工作总览.md`，将本会话登记为唯一 Document QA 入口；完成前本角色保持 `WAITING_ROLE`，不接收或执行新的修订任务。

## 2026-08-15｜V3–V7 关闭 Spec Hermes Round 1 SERIOUS 完整批次整改

- 任务/会话：`V3-V7-CLOSURE-SPECS-DOCQA-R1-20260815`；`019fefa7-c5cf-7e62-9859-5263998dfd77` / `DocumentQAv2.3.2`；模型 `gpt-5.6-sol / high`；共享计数仍为 Hermes `Round 1/3`，本次整改不重置。
- 输入已核对：5 份源文档与 5 份 Round 1 报告均完整读取，SHA-256 全部匹配项目总负责人冻结任务包。
- 修订范围：仅 5 份获授权源文档、`协同工作文档/文档QA/2026-08-15-v3-v7-关闭Spec-DocumentQA-Round1整改记录.md` 与本工作记录；V7/0035 源文档无 SERIOUS，保持不变。
- SERIOUS 结果：总索引 2 项、V3/0034 2 项、V4/0032 2 项、V5/0036 3 项、V6/0038 2 项，共 11 项及直接受影响回归已一次性整改；未处理 NON_SERIOUS、Missing Acceptance Criteria、措辞或可选增强。
- 输出源 hash：总索引 `516A4D05DFF64BF5B7271783138FCC6E608B9450949456177E4F383EC96EDF77`；V3 `86B457B178B8BFB897DA42189C310C0CD1497D8D7886E7B5278B4905BD57ACF6`；V4 `F7939E3BD8769B9BE4CB18335A71B1BC624FD32182827F099F219F8DD36B9073`；V5 `CEA06C42018223C3A45E6E62FDC9047041E025A3654A678FB2E13ECEEE2F563E`；V6 `8E837657F525176844F7E3E62C43F97864A719D3077FB76DE448E5AF4BC5294D`。
- QA ledger：`2026-08-15-v3-v7-关闭Spec-DocumentQA-Round1整改记录.md`；SHA-256 `5CEE1A159F640E214DBF3AA3108872467DD7C85D5E21F33709EF45A49FC5DA5B`；8,259 bytes；66 行。
- 保留门禁：`WORKFLOW_ACTIVE`；DRAFT_NON_CANONICAL / USER_CONFIRMATION_PENDING；V6 的 `V5_ACCEPTED_EVIDENCE_REF` 仍为 UPSTREAM_GATE_BLOCKED；V7 的 ISSUE-0031/N-006 冲突仍在；0031、数据库和全部付费动作继续延期。
- 越权核对：未运行 Hermes/npm，未执行 Git mutation，未部署或操作 Cloudflare/CloudBase，未创建任务/subagent；未修改 Hermes 报告、Issue canonical/state/总表、CONTEXT、中央总览/注册、产品经理记录、代码、UI、平台配置或其他角色文件；不自我批准。
- 并发状态：最终只读回读发现 `ISSUE总表.md` 已由输入 hash `0C404DE8…A2F316` 外部更新为 `8ABD40D9F286B7C5DCE4F79C7C32345BA9665CFED714EEC4CD2C1AA7FA0F7252`，新增 ISSUE-0040～0045 NON_SERIOUS 台账并登记 ISSUE-0020 关闭；原 0031/0032/0034/0035/0036/0038 状态未因该批改变。本角色未写该文件，且按授权未把 NON_SERIOUS 并入冻结源文档。
- 当前状态：`SERIOUS_BATCH_REMEDIATED`，不是审查通过、用户批准、实现授权、分支完成、部署、生产验收或 Issue 关闭。
- 唯一下一步：项目总负责人完整回读修订文件并使用修订后精确 hash 发起 Hermes Round 2。

## 2026-08-15｜V6 / ISSUE-0038 Hermes Round 2 S-03 严重回归整改

- 任务/会话：`V6-ISSUE-0038-DOCQA-R2-S03-20260815`；`019fefa7-c5cf-7e62-9859-5263998dfd77` / `DocumentQAv2.3.2`；共享审查计数为 Hermes `Round 2/3`，整改不重置，下一轮为最终 Round 3/3。
- 输入已核对：V6 Spec `8E837657F525176844F7E3E62C43F97864A719D3077FB76DE448E5AF4BC5294D`；Round 1 报告 `2151DC34C2E6757DF65266E1568CC1DFD9CB438D1DCBEA540877B95D51371C1E`；Round 2 报告 `72A02E04B29DCB2724231E4DD29915F7C706F9408B1333DF9244CA5340F6862A`。
- 冻结修订：采用 Correction 1，保持 B=7/C=5/D=1。B 项只走冻结文档复读、绑定最终 V6 hash 的 Hermes/Document QA、ISSUE 管理员采纳 receipt；业务确认、业务证据、新业务确认只适用于 C/D 已定义门禁。
- S-03 结果：同步 §1.1/§2.1/§2.4、角色与阶段矩阵、§5 全部 7 个 B 行、§7、§8 第2/7/9/10条和 §10；新增“7 个 B 业务前置项计数必须为 0”的可测试判据。
- 输出 V6 Spec：SHA-256 `7248241D9EBE78FC0E6D9491CBAE5BC87C8C3423AA1BC65E6E81DC6AE72AFD46`；17,407 bytes；175 行。
- QA ledger：`2026-08-15-v3-v7-关闭Spec-DocumentQA-Round1整改记录.md` 追加 Round 2/S-03 段；SHA-256 `9083A23C79BF4D383F1838DA672D30A2BD7E7A74CA67D6C73A870D0B594FF8D8`；11,536 bytes；101 行。
- 非范围：未处理 Round 2 N-08、Round 1 NON_SERIOUS 或 Missing Acceptance Criteria；未运行 Hermes/npm、Git mutation、部署或平台操作，未创建任务/subagent，未修改任何报告、Issue/总表、CONTEXT、中央文件、其他草案、代码/UI、平台/角色文件；不自我批准。
- 保留门禁：`WORKFLOW_ACTIVE`；V6 仍为 `DRAFT_NON_CANONICAL / AUTHOR_DRAFT / UPSTREAM_GATE_BLOCKED`；`V5_ACCEPTED_EVIDENCE_REF`、用户确认门及 V3→V4→V5→V6→V7 路线未变。
- 当前状态：`S03_REMEDIATED`，不是文档通过、用户批准、实现授权、部署、生产验收或 Issue 关闭。
- 唯一下一步：项目总负责人使用新 V6 hash 执行 Hermes Round 3/3（最终轮）；若仍有 SERIOUS，进入 `DOCUMENT_REVIEW_LIMIT_REACHED`，不得自动 Round 4。

## 2026-08-19｜V4 / ISSUE-0032 参数候选 Hermes Round 1 SERIOUS 批次整改

- 任务/会话：项目总负责人 v2.3.3 用户单步授权；`019fefa7-c5cf-7e62-9859-5263998dfd77` / `DocumentQAv2.3.2` / `gpt-5.6-sol / high`；workflow=`WORKFLOW_ACTIVE`。
- 写前核对：candidate `E831907690C8886440268CEC00B9E62C86436FD595BE380B64B33F737DC312D9`（13,717 bytes / 214 lines）；Round 1 报告 `F337BFCD501D7A8410D201D387740A939EB8DB6B254CE33F97EA76AF475C12AD`；metadata `C7F8FB8984DB4F7CAE8CC1E8C9CD5C865B94A2656AC3B9728B03631AD112BF73`。产品经理 active 冻结通知有效，candidate hash 未漂移后才写入。
- S1：action `5 / 15m` 保持不变，改为 `environment_ref + email_send_code + ip_pseudonym` 的 keyed pseudonym 非全局复合桶；不同网络不共享容量，同网络不同主体受动作专属桶约束，account/IP/device 层仍独立启用。
- S2：定义 production request origin/source guard；显式 allowlist 精确 Origin 与匿名 JSON 才通过；无效请求 403、guard/allowlist 配置不可用 503，均 send count=0；Host/Origin/Referer 不得自举 allowlist，synthetic 与 production 证据分离。
- S3：production 所有 active layers 必须在一次原子事务中整体 check-and-increment；`L-1` 并发只允许一个写到 `L`，其余 429，不得持久化 `L+1`；事务/存储不可用 503 且所有层零增量。
- 输出 candidate：`52358D5F7BC7BE75819CA6CBBFDA9D8AAD64C98CF8863D91A4A197E75F557ECF`；18,543 bytes；259 lines。
- QA ledger：`2026-08-19-v4-issue-0032-parameter-receipt-DocumentQA-Round1整改记录.md`；`C136D9B413E1DA12D13AF84DD6B408565A8FE92F5E469EB4E7DCF24C8C6F9185`；10,102 bytes；89 lines。
- 冻结值：token 300s、timeout 5000ms、account 3/15m、IP 10/15m、device 5/15m、action 5/15m、session N/A、cleanup +1h、新 challenge cooldown 5s、既有 email cooldown 60s，均未漂移。
- 非范围：N1-N8 NON_SERIOUS 均未关闭；特别保留 `CURRENT_REVIEW_ROUND=0/3`、device 派生、unknown-proxy 阈值、fixed/sliding window、cooldown/cleanup 扩展矩阵与外部 hash 验真事项。ISSUE-0031、数据库及全部付费动作继续延期。
- 审查门禁：有效 Hermes Round 1/3 已用，QA 整改不重置；当前仅 `SERIOUS_BATCH_REMEDIATED / HERMES_ROUND_2_PENDING`，不是自我批准、`DOCUMENT_GATE_PASSED`、用户确认、实现/测试授权、部署、生产验收或 Issue 关闭。
- 越权核对：未运行 Hermes/npm/test/build，未执行 Git mutation、部署或平台/数据库/付费操作，未创建任务/subagent；未修改报告/metadata、0032 Spec、freeze record、Issue/总表、CONTEXT、中央文件、产品经理记录、代码/UI/测试/平台或其他角色文件。
- 唯一下一步：等待用户单步授权项目总负责人执行 Hermes Round 2/3；本角色本轮不启动 Round 2。

## 2026-08-20｜V4 / ISSUE-0032 Provider-Specific Authorization Package Hermes Round 1 SERIOUS 批次整改

- 任务/会话：`V4-ISSUE-0032-PROVIDER-AUTH-DOCQA-R1-20260820`；`019fefa7-c5cf-7e62-9859-5263998dfd77` / `DocumentQAv2.3.2` / `gpt-5.6-sol / high`；workflow=`WORKFLOW_ACTIVE`，ISSUE-0032=`open`。
- 写前核对：canonical `9C1D6E4CC505F1B0A3B06E5F2A64618573D4D70ADA1A1CDA1C15D704160A5142`（28,576 bytes / 333 lines）；Round 1 报告 `CE917BAB5F5B3054A0E2A308FCC1121C6AD1EBCE6589CE13110209B2F8195A72`；metadata `41287DEF24F2C8719AB1645372E21E09662E28061084BAD6A7C0375C6CB77A46`。写前 canonical hash 未漂移，V4 exact worktree clean。
- exact code 基线：branch `V4-issue-0032-email-turnstile-closure`；commit `23c959e0fc1e8096828fb8c855ecddb2800995bf`；tree `90addce1c5ca2d7cfd9acc5084156ab4e1860b97`。只读追溯实际 consumer，没有读取或输出任何真实 Secret、token、Cookie、邮箱或 SMTP 凭据。
- S1：新增 §6.3 变量→actual read site→状态→消费/fail-closed→owner/证据矩阵，覆盖 §6.2 全部变量组、`action=email_send_code` 与 `expected hostname=ungraduedu.eu.cc`。确认公开 site key 前端链已 `WIRED`；目标 send-code route 仍固定 fail-closed，`TURNSTILE_SECRET_KEY`/`TURNSTILE_EXPECTED_HOSTNAMES` 为 `PRESENT_BUT_NOT_WIRED / PENDING_BY_GATE`；冻结 hostname 仅 `PLATFORM_ONLY / PENDING_BY_GATE`。
- S1 验收：补错误变量名、缺失值、site key/Secret 错配、wrong hostname/action 的 fail-closed 与 send=0 合同，并把未来允许的最小代码主范围收敛到 send-code route。hostname delimiter/normalization 仅为 S1 可执行绑定的直接回归，不关闭 ISSUE-0046 N5。
- S2：按用户本轮明确选择 A，冻结仅 2 个账号、连续 24h、至少 24 次合法样本（A/B 各 12）、至少 4 个时段、6 组隔离（A→B 3、B→A 3），并量化子系统错误、配置异常、误拒、延迟/送达、零容忍停止条件、owner、脱敏证据与从零恢复规则；实际执行仍为 `PENDING_BY_GATE`。
- 输出 canonical：`56D8C7060A10F996A58DC9F30CCE767F07537B9EF90AB6F69DDB59D098E30EFC`；41,113 bytes；379 lines。§0 仅消除“未运行 Document QA”的历史句与本批执行事实冲突，未修改 `CURRENT_REVIEW_ROUND=0/3` 等 ISSUE-0046 元数据；§15 明示 `HERMES_ROUND_2_PENDING`。
- QA ledger：`2026-08-20-v4-issue-0032-provider-specific-authorization-package-DocumentQA-Round1整改记录.md`；`F77141594E9B420E6CD8C436C0D30804B1063664EC132D91480B8BEB10A4290C`；9,696 bytes；83 lines。
- NON_SERIOUS：Hermes N1–N5 继续由 ISSUE-0046 管理；未修改 ISSUE-0046，未处理纯 N1 元数据，不宣称任何 N 项关闭。ISSUE-0031、数据库与全部付费动作继续延期。
- 权限/门禁：未运行 Hermes/npm/test/build，未执行 Git mutation、部署或平台/provider/database/付费动作，未创建任务/subagent；不是自我批准、`DOCUMENT_GATE_PASSED`、实现/平台授权、生产验收或 Issue 关闭。
- 当前门禁：`SERIOUS_BATCH_REMEDIATED / HERMES_ROUND_2_PENDING`。唯一下一步：项目总负责人执行 Hermes Round 2/3 聚焦复核；本线程不得执行。

## 2026-08-23｜V5 / ISSUE-0036 生产接线冻结包 Hermes Round 1 SERIOUS 批次整改

- 执行角色：`019fefa7-c5cf-7e62-9859-5263998dfd77 / DocumentQAv2.3.2 / gpt-5.6-sol / high`；workflow=`WORKFLOW_ACTIVE`；共享计数保持 Round 1/3。
- 写前输入：canonical `0BE4B113B4F39DA6A76FE1F91A555E0122B36C192D57DA3A7ABE49B873F6DCBC`（18,812 bytes / 265 lines）；Hermes R1 report `B76BE1CCA24E15E9DAD26F669D493C5EC531BF7F49522C563F531819B78DDAF6`；metadata `AB8A3862830D999A647B538A57C0DD917D1AB4AC48E057DF42FE69530EB47CA5`。
- S1：申诉链中 primary/backup 只可 claim/triage；最终 published/rejected 必须由与 content owner、primary/backup claimant 均不同账号的 second reviewer 完成。task/audit 固定 appeal mode、primary、second reviewer、decision、decidedAt；非法角色、同账号二审、自审、缺字段或 stale version fail-closed。
- S2：published vN 编辑创建 pending vN+1，最后 approved vN 内容不变并继续公开；新版本批准时原子切换 active pointer，拒绝/申诉时保留 vN。删除立即隐藏公开 snapshot，恢复只创建 hidden + pending_review 新版本。DTO/API/UI、事务、审计、停止、回滚与正负验收已同步。
- 输出 canonical：`9E5DE15240D36E67C6721F83DC006152B22D1B8A8E3539621F98194CA51BCF90`；27,453 bytes / 306 lines。
- QA ledger：`2026-08-23-v5-issue-0036-production-wiring-freeze-DocumentQA-Round1整改记录.md`；SHA-256 `AE7013D15C56008D09132E8749EE41729698316F85A31C6B871CA01F578BD12D`；5,262 bytes / 52 lines。
- NON_SERIOUS：N1–N9 未交 QA且不宣称关闭；与 N4/N5 邻域重合的 DTO/全审核角色自审约束仅是 S2/S1 的直接必要回归。
- 权限边界：未运行 Hermes/npm，未执行 Git mutation、部署、Cloudflare/CloudBase 或平台操作；未修改 report/metadata、原 V5 closing Spec、Issue canonical/总表、代码、UI、中央文件或其他角色文件；未创建任务/subagent；不自我批准。
- 当前状态：`QA_DOCUMENT_REWORK_COMPLETE / HERMES_ROUND_2_PENDING`。唯一下一步：项目总负责人组织 focused Hermes Round 2/3；本线程不得执行。

## 2026-08-23｜V5 / ISSUE-0036 生产冻结包 Hermes Round 2 revision-affected SERIOUS 整改

- 执行角色：`019fefa7-c5cf-7e62-9859-5263998dfd77 / DocumentQAv2.3.2 / gpt-5.6-sol / high`；workflow=`WORKFLOW_ACTIVE`；共享计数保持 Round 2/3。
- 写前输入：canonical `9E5DE15240D36E67C6721F83DC006152B22D1B8A8E3539621F98194CA51BCF90`（27,453 bytes / 306 lines）；R2 report `2AD553A815E42D55A3F6A0A9D32F6F493FD7B06922044E5E595DF0AAACC366F2`；metadata `49B6A4FC30E5186626CAEC8E28ACA69D65A4B42D8112F05EEB43DC786DB65FA4`。正文 verdict=`REWORK_REQUIRED` 优先于脚本包装状态。
- 唯一 S1：冻结 per-field task + `contact_review_entity_versions` aggregate。字段 task 只保存 owner/entity/version/field/hash/rule/status/operator/idempotency；实体 aggregate 保存 requiredFields、field task/reviewKey、aggregateStatus/revision、active/pending version 和 publicVisibility。
- 聚合公开门：新建 N/N required fields 终态通过前 hidden；编辑 vN+1 只有 N/N 通过才原子替换旧 vN，任一 rejected/appeal/manual/pending/missing/duplicate 保持旧 snapshot；删除立即 hidden，恢复创建新 aggregate 与全部字段 tasks。
- 事务/接口证据：每个字段决定、requiredFields 完整性/唯一性复核、aggregate 重算、适用公开指针与 audit 同事务提交；DTO/API/UI、索引、停止、回滚和 1/N、N-1/N、N/N、missing/duplicate/concurrency 负例已同步。
- 输出 canonical：`C2988846E38D3C4338A38C06CC96B239BD59B9504D26E950CE07838265E393CF`；36,822 bytes / 349 lines。
- QA ledger：`2026-08-23-v5-issue-0036-production-wiring-freeze-DocumentQA-Round2整改记录.md`；SHA-256 `2F4682F16D60089B1A8A033000867BF3C351FB894E64208B2D3E3DA3227D7369`；4,855 bytes / 47 lines。
- NON_SERIOUS：R2 N1–N10 未处理或宣称关闭；文档头 `CURRENT_REVIEW_ROUND=1/3` 与上一轮 next-step 文本漂移仅登记，未修改。
- 权限边界：未运行 Hermes/npm，未执行 Git mutation、部署或平台操作；未修改 report/metadata、原 V5 Spec、Issue、代码/UI/平台、中央文件或其他角色文件；未创建任务/subagent；不自我批准。
- 当前状态：`QA_DOCUMENT_REWORK_COMPLETE / HERMES_ROUND_3_PENDING`。唯一下一步：项目总负责人组织 focused Hermes Round 3/3；本线程不得执行。

## 2026-08-23｜V5 / ISSUE-0036 生产接线冻结包 v2 Hermes Round 1 完整 SERIOUS 批次整改

- 执行角色：`019fefa7-c5cf-7e62-9859-5263998dfd77 / DocumentQAv2.3.2 / gpt-5.6-sol / high`；workflow=`WORKFLOW_ACTIVE`；v2 新周期共享计数保持 Round 1/3。
- 写前输入：canonical `4F361440FD8D6012CA916501E7D21DEFF10150E178B04C96637908BA6CE814CF`（33,014 bytes / 340 lines）；R1 report `464EC1043C453810F3799E0D2F5D05AAAC872B35A5EE3E1158E2CAAF547D3D62`；metadata `D8D9B93B67E7C7CD189A560235B5E12B2C723B5B33DC870CCD04349D81B0F53C`；正文 verdict=`REWORK_REQUIRED`，SERIOUS=4。
- S-001：以 `activeReviewStatuses`/`completedDecisionStatuses` 取代未定义状态别名；rejected 非 active，pending 仍指 rejected 时只允许同版本一次申诉或 edit 更高版本二选一，published/delete 清 pending，普通 rejected 不清 pending。
- S-002：新增版本无关 `contact_review_idempotency`；唯一键为 scopeKey+idempotencyKeyHash，不含 entityVersion；同请求返回原结果，不同 requestHash=409，版本/task/aggregate/pointer/audit/result 同事务。
- S-003：删除不可建的 aggregate pending unique index；唯一当前候选只由主实体 `pendingReviewVersion` 与 `entityRevision/currentVersion` CAS 保证，不增加第二指针或虚构 partial index。
- S-004：每个 rejected entityVersion 最多一个版本级 appeal request，覆盖全部 rejected requiredFields；published fields 不重开；second reviewer 提交完整逐字段决定向量，任一校验失败整体 fail-closed，不落部分结果。
- 输出 canonical：`C8613135340AA00F4F1C6C58C2EB53864BF0256F4BA8C3FCC4D815F6CB4D7A05`；43,573 bytes / 376 lines。
- QA ledger：`2026-08-23-v5-issue-0036-production-wiring-freeze-v2-DocumentQA-Round1整改记录.md`；SHA-256 `5E666680176221535441F5DF76B023BD4FA9CB4D13F39A47D56ED9367C5654DC`；7,016 bytes / 53 lines。
- 非范围：N-001～N-008、MAC-1～MAC-5 未处理或宣称关闭；S-001 删除未定义状态别名与 N-003 邻域有直接必要重合，但不作为 N-003 关闭；N-005“邮件”遗留措辞保持。未修改 R1 report/metadata、v1 及其 reports/QA、Issue/总表/ISSUE-0043、产品经理记录、代码/UI/平台、中央/角色文件。
- 权限边界：未运行 Hermes/npm/测试/build，未执行 Git mutation、部署或平台操作；未创建任务/subagent；不自我批准。
- 当前状态：`QA_DOCUMENT_REWORK_COMPLETE / HERMES_ROUND_2_PENDING`。唯一下一步：项目总负责人组织 focused Hermes Round 2/3；本线程不得执行。

## 2026-08-23｜V5 / ISSUE-0036 生产接线冻结包 v2 Hermes Round 2 SERIOUS 批次整改

- 执行角色：`019fefa7-c5cf-7e62-9859-5263998dfd77 / DocumentQAv2.3.2 / gpt-5.6-sol / high`；workflow=`WORKFLOW_ACTIVE`；共享计数保持 Round 2/3。
- 写前输入：canonical `C8613135340AA00F4F1C6C58C2EB53864BF0256F4BA8C3FCC4D815F6CB4D7A05`（43,573 bytes / 376 lines）；R2 report `DBEF9912BEA98B906D5FC79E099A58D9FAA749B2AFEAD0C5D7F191A0F28779FB`；metadata `D88CE3703D9B4B44705857AC540FA9792DDF5BB4CD1A9EE7CAB574351BC29D4F`；正文 verdict=`REWORK_REQUIRED`，SERIOUS=2。
- S-1：aggregate 固定为 N/N published → appeal_pending → needs_manual_review → fully-decided published/rejected 且至少一 rejected → 其他 pending/fail-closed。rejected+pending 不可申诉，完成全部普通决定后才可能 rejected。
- S-2：claim/triage 只写 triage/claim audit 并保持 appeal_pending；终审校验失败或 SLA 超时可进入 appealMode=true needs_manual_review，唯一恢复出口为 primary/backup 的 `resumeAppealReview`，复用原 appealRequestId 且不产生第二 appeal。
- 组合保护：owner 在 appeal_pending/manual 期间 edit=409；resume 可审计化 handoff，second 必须不同于当前 triage 与 owner；非法/并发 resume 保持 manual；事务/存储不可用 503 且零状态/副作用。
- 输出 canonical：`95AA1D2D6DFFE12E30C53E9D1A3C9EAA69AC5BFD33CB3DDD946F2DCCA5B5307A`；52,245 bytes / 405 lines。
- QA ledger：`2026-08-23-v5-issue-0036-production-wiring-freeze-v2-DocumentQA-Round2整改记录.md`；SHA-256 `33A4B2C72779AFB1CB1E1E3256EC8588EABB12CB2D7A410F01574F4D3A00B1FE`；5,727 bytes / 37 lines。
- 非范围：R2 N-1/N-2、C-1/C-2、AC-3 未处理或宣称关闭；N-2 claim 时机仅因 S-2 直接重合而同步，C-1/C-2 原文仍保留。未修改 report/metadata、v1、Round 1 QA、Issue/总表/ISSUE-0043、PM 记录、代码/UI/平台、中央/角色文件。
- 外部并发：ISSUE-0043 在本轮由 `436B7D08…6454DEEA` 变为 `A573DE01…CF55C0D`，内容为 ISSUE 管理员登记 R2 非阻塞项；该文件未由本 QA 写入，且不与三份白名单 owner 文件重叠。
- 权限边界：未运行 Hermes/npm/测试/build，未执行 Git mutation、部署或平台操作；未创建任务/subagent；不自我批准。
- 当前状态：`QA_DOCUMENT_REWORK_COMPLETE / HERMES_ROUND_3_PENDING`。唯一下一步：项目总负责人组织 focused Hermes Round 3/3；本线程不得执行。

## 2026-08-25｜V5 / ISSUE-0036 人工审核延期暂缓关闭附录 Hermes Round 1 S1 整改

- 执行角色：`019fefa7-c5cf-7e62-9859-5263998dfd77 / DocumentQAv2.3.2 / gpt-5.6-sol / high`；workflow=`WORKFLOW_ACTIVE`；本附录新周期共享计数保持 Round 1/3。
- 写前输入：canonical `E10524B8F1C3D59EFFC532C66775B483F2EEC80248E2416F0624F811D97D5D54`（9,704 bytes / 103 lines）；R1 report `E54768E4CA0BB2516E67EB503AAB7C7F38E14632772F5054A66649FED5A2C0D6`；metadata `6A04F86C3C595DD72536E34FCDDC4530C4298EE42C5795658C730646FBE0429E`；正文 verdict=`REWORK_REQUIRED`，SERIOUS=1。
- S1 原位置/问题：原 §1 仅概括“人工审核先放着、说明范围调整后继续推进”，并绑定结论仍为 `CANNOT_CLOSE / KEEP_OPEN_DEFERRED` 的旧裁决；缺少原始业务指令、owner/时间、持久化复读来源及新决定如何取代旧裁决的明确关系。
- S1 新位置/语义：新增 §1.1“独立业务决策绑定（S1）”，串联业务方长期目标、2026-08-25 原话“那人工审核就先不做，先放着”、获知 `CANNOT_CLOSE` 与 material scope adjustment 前提后的“继续”，并限定这组指令只授权“暂缓需求/范围调整后关闭”候选。
- 持久化绑定：原始指令绑定项目总负责人线程 `01a00565-5d72-7663-991d-178c5dcfd170`；总负责人工作记录复读快照 `0164694F1C362BB1E3847CA32FFB82F6BA075D00884F107B15A47F4D225A607F`；产品经理工作记录复读快照 `0B36EA399E18C2DDE77F6A2EB99D135EC24EA7930360C674B95F6E2689E51E2E`；前置裁决文档 `F422F8CF111D0E1741E9E684ECFDABBB7975A9C4E836229381910E78D67B700C`。
- 取代关系：本附录仅在“人工审核延期、暂缓需求关闭”范围内取代旧 `KEEP_OPEN_DEFERRED` 作为后续产品确认/Issue 管理员复读依据；旧裁决保留为范围变更前历史证据。文档门、业务方按最终文本确认与 ISSUE 管理员 canonical 操作前，Issue 仍为 `open / USER_CONFIRMATION_PENDING`。
- 定向验证：两个 flag 继续为 false；人工审核、生产 AI、reviewer/Secret、flag-on、自动公开、部署、生产观察及回滚演练均未被授权或写成通过；未来启用仍须重开 ISSUE-0036 或建立继任 Issue。文档唯一下一步已改为 focused Hermes Round 2/3，仅复核 S1 与受影响回归。
- 输出 canonical：`CC7C520B549D2F8449119A533C455D725331957B2F4EA5AE321F2F317110DA2A`；13,260 bytes / 121 lines。
- 非范围：Hermes R1 N1～N5 未处理、未宣称关闭；未修改 report/metadata、旧 Spec、旧产品裁决、产品经理/总负责人记录、Issue canonical/总表、代码、UI、平台、中央/角色文件。
- 权限边界：未运行 Hermes/npm/测试/build，未执行 Git mutation、部署或平台操作；未创建任务/subagent；本次 QA 不自我批准，不宣布 `DOCUMENT_GATE_PASSED` 或 Issue 关闭。
- 当前状态：`QA_DOCUMENT_REWORK_COMPLETE / HERMES_ROUND_2_PENDING`。本段即本批 QA ledger；唯一下一步：项目总负责人路由产品经理执行 focused Hermes Round 2/3，仅复核 S1 与受影响回归。

## 2026-08-25｜V6 / ISSUE-0038 新附录 Hermes Round 1 S-1/S-2 整改

- 执行角色：`019fefa7-c5cf-7e62-9859-5263998dfd77 / DocumentQAv2.3.2 / gpt-5.6-sol / high`；workflow=`WORKFLOW_ACTIVE`；本附录新周期共享计数保持 Round 1/3。
- 写前输入：canonical `444291F7FFF586BFF076312037F79F57F168690909A5FD1F163FE3BD3CDA18CC`（11,964 bytes / 118 lines）；R1 report `10DC4847E8B3E90EF13E01E91036DA565B7397671A0EFA37132BC09D34528635`；metadata `AFA4ED6F2A90D1D209296690B8378DA571CB52C33741D4CFF90AE6A45BC73775`；正文 verdict=`REWORK_REQUIRED`，SERIOUS=2。
- S-1 原位置/问题：原 §1 依赖表没有绑定 7 个 B 项实际引用的原 ISSUE-0036 Spec；§3 仅出现裸 SHA `005EA5…A97B437`。新位置：§1 依赖表新增原 0036 Spec 完整路径、精确 SHA 与 §3.1 锚点入口，明确其仅是文档事实来源。
- S-2 原位置/问题：原 §3 七个 B 行只有主题描述，§4.1 要求的精确路径/hash/段落与“证据索引完整”不可测试。新位置：新增 §3.1 `B_EVIDENCE_INDEX`，逐项给出 `B-E01`～`B-E07` 的 source path、完整 SHA、section/line anchor、可复读事实与确定性 pass/fail 合同；§3.2 七行及 §4.1 逐项回链索引。
- B=7 索引摘要：N-001=`§5.1–§5.3/§10.1`；N-005=`§5.2/§8.2/§13`；N-007=`§6.1–§6.2.1/§10.1–§10.2`；NS-001=`§6.1/§6.2.1/§10.1`；NS-002=`§6.1/§6.2.1/§10.1–§10.2`；NS-004=`§7/§7.1/§10.2`；NS-005=`§4.2/§10.1`。七项均绑定 `规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-联系方式快速智能审核-spec.md` 与 SHA-256 `005EA5F2490DC2E43A134BA0421EFBD357179C90E29A6F2AB560F6F61A97B437`。
- 冻结裁决保持：B=7 仍为纯文档 `B_DOC_ADMIN_CANDIDATE`，业务确认/业务证据/新业务确认/生产证据前置项为 0；N-002 保持 `V5_BOUNDED_SUFFICIENT`；N-003/N-004/N-006/NS-006 与 D/NS-003 保持 `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER`，N/A 不等于完成或生产通过。
- 输出 canonical：`4EB2B6A4E4E369C77DB6695F4875837950D77144E1B33156EB0F4270504312F6`；17,066 bytes / 137 lines。
- 非范围：Hermes R1 N-1～N-5 未处理、未宣称关闭；旧 V6 Spec 与旧 R1/R2/R3 历史保持不变，本附录仍是新实质范围周期，不是旧周期 Round 4。
- 权限边界：未运行 Hermes/npm/测试/build，未执行 Git mutation、部署或平台操作；未创建任务/subagent；未修改 report/metadata、0036/0038/0044 canonical、Issue 总表、PM worklog、代码/UI/CONTEXT、中央或角色文件；不自我批准。
- 当前状态：`QA_DOCUMENT_REWORK_COMPLETE / HERMES_ROUND_2_PENDING`。本段即本批 QA ledger；唯一下一步：回项目总负责人组织 focused Hermes Round 2/3，仅复核 S-1、S-2 与受影响回归。

## 2026-08-25｜V6 / ISSUE-0038 新附录 Hermes Round 2 SERIOUS 整改

- 执行角色：`019fefa7-c5cf-7e62-9859-5263998dfd77 / DocumentQAv2.3.2 / gpt-5.6-sol / high`；workflow=`WORKFLOW_ACTIVE`；本附录新周期共享计数保持 Round 2/3，下一轮为最终 Round 3/3。
- 写前输入：canonical `4EB2B6A4E4E369C77DB6695F4875837950D77144E1B33156EB0F4270504312F6`（17,066 bytes / 137 lines）；R2 report `4918393B2C0D441304DD812D083479D0301BE07ED72C400BFC64693ED6089F63`（8,452 bytes / 104 lines）；metadata `9116A5B54A69053B64A9A49E9374D523F172A7BD53766906AD8A26FB841B2357`；正文 verdict=`REWORK_REQUIRED`，SERIOUS=2。
- SERIOUS-1 原位置/问题：原 §7 第137行引用未定义的 `S-1`、`S-2` 与“受影响回归”，focused 门禁不可执行。新位置：§7.1 绑定新附录 R1 report 完整路径/hash，明确 `R1 S-1`=依赖表原 0036 Spec 路径/hash，`R1 S-2`=7 个 B 项逐项索引，并枚举五项受影响回归检查范围。
- SERIOUS-2 原位置/问题：原第5行 `CURRENT_REVIEW_ROUND=1/3`、§7“从 Round 1 开始”、下一步 Round 2 与实际已完成 Round 2/3 冲突。新位置：文档头与 §7 统一为 Round 2/3 已完成、共享计数 2/3、Round 3/3 待执行；R1/R2 verdict 均如实保留为 `REWORK_REQUIRED`，未宣称通过或重置轮次。
- 受影响回归：仅检查 §1 原 0036 依赖、§3.1 七个定义/§3.2 七个回链、§4.1 文档关单门、13 项 B/C/D 实质处置不漂移、旧 V6 与新附录 R1/R2 历史只读及轮次/下一步一致性。
- 输出 canonical：`563219A51BE647CD72081ABBAC9E06C5CF7D46DA448D504A5E47AE9DEC46A9FE`；19,183 bytes / 152 lines。
- 冻结保持：13 项矩阵、R1 已形成的 §1 依赖与 `B-E01`～`B-E07` 索引未改；B 不要求业务确认；C/D 的 N/A/TRANSFER 不等于完成或生产通过；旧 V6 Spec/R1–R3 与新附录 R1/R2 report/metadata 未修改。
- 非范围：Round 2 NON_SERIOUS 未处理、未宣称关闭，继续由 ISSUE 管理员登记 ISSUE-0044；未做措辞性返工。
- 权限边界：未运行 Hermes/npm/测试/build，未执行 Git mutation、部署或平台操作；未创建任务/subagent；未修改 Issue canonical/总表、PM worklog、代码/UI/CONTEXT、中央/角色文件；不自我批准、不宣布 `DOCUMENT_GATE_PASSED`。
- 当前状态：`QA_DOCUMENT_REWORK_COMPLETE / HERMES_ROUND_3_PENDING`。本段即本批 QA ledger；唯一下一步：回项目总负责人组织 focused Hermes Round 3/3。

## 2026-08-26｜V7 / ISSUE-0035 新附录 Hermes Round 1 S1/S2 严重批次整改

- 执行角色：`019fefa7-c5cf-7e62-9859-5263998dfd77 / DocumentQAv2.3.2 / gpt-5.6-sol / high`；workflow=`WORKFLOW_ACTIVE`；新附录共享计数保持 Round 1/3。
- 写前输入：canonical `F308B1327427957A08A9E94CF4E95661DA5C4D5687284A1709CED01BECEA8248`（17,887 bytes / 128 lines）；R1 report `80ECCD19464464660840E34F687B70A2C1A561FC6A2AE5DC0E428A629DAD6A9E`（9,858 bytes / 125 lines）；metadata `315CA389CEC68A02490BA349D23363598E696E364820C16CBCE6FBBC2D5A2EB3`；正文 verdict=`REWORK_REQUIRED`，SERIOUS=2，model=`deepseek-v4-pro`，canonical_source_unchanged=true。
- S1 原位置/问题：原 §3 N-011 仅出现旧 V7 R1 report SHA `578B2ACB…AD4F580`，§1.1 没有完整路径，无法独立回读。新位置/语义：§1.1 `SRC-03` 登记 `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0035-联合Spec文档债务关闭-hermes-round-1.md` 及完整 SHA，§3 N-011 明确以 `SRC-02` reviewed source + `SRC-03` 历史 report provenance 共同支撑，且不改写旧周期。
- S1 选择理由/验证：保留必要 provenance，不删除报告引用；旧报告现场 SHA 与冻结值一致，路径存在且可回读。N-011 仍为 B / `CURRENT_CLOSURE_SUFFICIENT`，仅补足证据链，不升格为实现、生产或 Issue 通过。
- S2 原位置/问题：原 §7 仅列 0035/0038/0034/0033/0017 五类，遗漏原 V7 Spec、ISSUE-0045、Issue 总表，且管理员 receipt 覆盖范围未定义。新位置/语义：§1.1 全部来源编号为 `SRC-01`～`SRC-09`，§7 固定同一 `SOURCE_RECEIPT_SET`，要求逐项核验 ID、完整路径、SHA、用途锚点、可回读性和无循环引用；任一失败进入 §6 `REVIEW_BLOCKED`。
- S2 直接受影响回归：§1.1 原 0038 来源文件名按字面不存在；只读定位到同 SHA 的真实 canonical 路径 `协同工作文档/ISSUE/Close_Issue/ISSUE-0038-0036联系方式快速智能审核Spec首轮非阻塞文档审查改进台账.md`，已同步为 `SRC-06`，使管理员 receipt 可执行。该修订是 S2/§6 路径核验的直接必需项，不处理或关闭任何 NON_SERIOUS。
- 定向验证：九个 `SRC-01`～`SRC-09` 当前均存在且 SHA 与 §1.1 一致；§7 与 §1.1 一一对应，`SRC-02`/`SRC-03`/`SRC-04`/`SRC-05` 的用途边界不可互替；15 项矩阵仍为 11 项 current（A=5、B=6）/4 项 transfer（C=4、D=0），N-003/N-006/N-010/N-013 处置不变，§6 `REVIEW_BLOCKED`/hash/path/循环引用规则保持有效。
- 输出 canonical：`54A331358C55C204E8B17A6C8311014882A2D8B54C13490F04D85CB40D0E2CCB`；19,107 bytes / 131 lines。
- 非范围：Hermes R1 N1～N3、M1 与 O1～O4 未整改、未宣称关闭；尤其未改 0032 owner、未为 N-006 新增独立表行、未补 A/B/C 语义。未修改任何 Hermes report/metadata、Issue canonical/总表、产品工作记录、其他 Spec、代码/UI/平台、中央/角色文件。
- 权限边界：未运行 Hermes/npm/测试/build，未执行 Git mutation、部署或平台操作；未创建任务/subagent；本次 QA 不自我批准，不宣布 `DOCUMENT_GATE_PASSED` 或 ISSUE-0035 关闭。
- 工作记录采用 prefix-preserving append；追加前 SHA-256=`9759259E0BCA2FF55BFF0FFC39EE3E8AA31C9FA2F7D19E2CE447F8A7AF5E2027`，38,603 bytes / 221 lines。
- 当前状态：`QA_DOCUMENT_REWORK_COMPLETE / HERMES_ROUND_2_PENDING`。唯一下一步：项目总负责人路由产品经理执行 focused Hermes Round 2/3，仅复核 S1、S2 与受影响回归。

## 2026-08-26｜ISSUE-0040 关单附录 Hermes Round 1 S1 严重整改

- 任务/角色：`ISSUE-0040-ADDENDUM-QA-R1-20260826 / DocumentQAv2.3.2 / 019fefa7-c5cf-7e62-9859-5263998dfd77`；workflow=`WORKFLOW_ACTIVE`；共享计数保持 Round 1/3。
- 写前输入：canonical `6C155F50C7222A716BC55510A1286CD33840EA1069624F2E738B7DE345A8B1C6`（17,083 bytes / 124 lines）；R1 report `E4D50137E607DA5CABD8C79FA24556D42C41B5EF02894EB1B7504AB0A2295C57`（7,374 bytes / 88 lines）；metadata `6FBD2D307245E09C2F64123429C5E311050F4D89B3C7A21B16D4DEB7A8433712`；正文 verdict=`REWORK_REQUIRED`，SERIOUS=1，model=`deepseek-v4-pro`，canonical_source_unchanged=true。
- S1 原位置/问题：原 §5.2 只写 V7 A=5/B=6 数量并仅枚举 C 四项，§4 N5 却声称 §5 已列出 V7 A/B/C，导致 11 项文档采纳候选与 §7 checklist 无法逐项独立验证。
- S1 新位置/语义：§5.2 绑定 V7 来源附录完整 path、SHA `54A331358C55C204E8B17A6C8311014882A2D8B54C13490F04D85CB40D0E2CCB` 与 §3 第55–73行；逐项枚举 A={N-001,N-007,N-008,N-009,N-014}、B={N-002,N-004,N-005,N-011,N-012,N-015}、C={N-003,N-006,N-010,N-013}、D=0。§4 N5 同步为 §5.1/§5.2 均逐项列举并绑定来源，§7 第5项形成可执行的逐项复读合同。
- 选择理由：采用“完整枚举 + 精确冻结来源锚点”双重绑定，避免只依赖数量断言；不引入新分类、不转换 V6/V7 字母语义、不把 C 项或 N/A 写成完成。
- 定向验证：V7 仍为 A=5/B=6/C=4/D=0，11 current/4 transfer；C 仍仅 N-003/N-006/N-010/N-013，N-006 仍指向 ISSUE-0031。§5.3 源分类隔离全文未变；§2 六份来源/hash bindings 全文未变；§7 仅同步第5项的 S1 可执行核验。
- 审查状态同步：Round 1/3 已完成且共享计数保持 1/3，正文 `REWORK_REQUIRED / SERIOUS=1` 如实保留；唯一下一步更新为原产品经理执行 focused Hermes Round 2/3。本次 QA 不运行 Hermes、不自我批准、不宣布文档门通过。
- 输出 canonical：`F7FA5335DAEB097A60C766B915EFA7F760334D1306AF7FF2826024D1DC33E971`；17,885 bytes / 124 lines。
- 非范围：R1 NON_SERIOUS N1～N4 未处理、未宣称关闭；§6 表头、V5 addendum、N-xxx 命名空间和用户确认门均未整改。未修改其他 Spec、report/metadata、Issue canonical/总表、PM worklog、代码/UI/平台、中央/角色文件。
- 权限边界：未运行 npm/测试/build/Hermes，未执行 Git mutation、部署、数据库/付费或平台操作；未创建任务/subagent。
- 工作记录采用 prefix-preserving append；追加前 SHA-256=`3CBECA9DB0124BA97A9815A04EF334E6941E0754D9A99813CACB88ADB8888C18`，42,161 bytes / 236 lines。
- 当前状态：`QA_DOCUMENT_REWORK_COMPLETE / HERMES_ROUND_2_PENDING`。唯一下一步：项目总负责人路由原产品经理执行 focused Hermes Round 2/3，仅复核 S1 与受影响回归。

## 2026-08-26｜ISSUE-0040 关单附录 Hermes Round 2 S-01 最小整改

- 执行角色：`DocumentQAv2.3.2 / 019fefa7-c5cf-7e62-9859-5263998dfd77`；workflow=`WORKFLOW_ACTIVE`；共享计数保持 Round 2/3，下一轮为最终 Round 3/3。
- 写前输入：canonical `F7FA5335DAEB097A60C766B915EFA7F760334D1306AF7FF2826024D1DC33E971`（17,885 bytes / 124 lines）；R2 report `51E45869821D20B9595A9180554C0C20ABB38A4F6BA131CAB12C5A0CD9D8F6F1`（8,862 bytes / 103 lines）；metadata `73DCD0DF395956DC98E71D085E7FCB72F0A3ECE75AD2291F2ADF59DB4146A696`；`deepseek-v4-pro / 2/3 / canonical_source_unchanged=true / exit=0`，正文 verdict=`REWORK_REQUIRED`，SERIOUS=1。
- S-01 原位置/问题：§2 D-04 仅保留 V5 范围调整附录 SHA，缺完整 path/filename/date；§6 V5 行只列 close receipt，导致 §4 N6 所称“关闭 Spec/后续 addendum 来源索引”与实际内容不一致，M1 checklist #2/#6 无法对 V5 独立执行。
- S-01 新位置/语义：§2 D-04 新增 `规划文档/Spec文档/Release_version_Spec/2026-08-25-issue-0036-人工审核延期与暂缓关闭范围调整-spec-addendum.md`、完整 SHA `CC7C520B549D2F8449119A533C455D725331957B2F4EA5AE321F2F317110DA2A`，并使用真实章节锚点 §1.1、§2.1–§2.2、§3–§5.3，不虚构行号；§6 V5 行同步加入同一 addendum path+SHA，与 ISSUE-0036 close receipt 一一对应。
- 选择理由：S-01 与 R1 NON_SERIOUS N2 有重叠，但本轮仅因 R2 将缺口绑定到 canonical 自设 M1/N6 可复读关闭条件而作最小补链；不借此升级或处理其他 NON_SERIOUS。
- 定向验证：M1 #2 现可从 D-04 逐项复读 V5 addendum→ISSUE-0036 close receipt 链，M1 #6 可从 §6 V5 行取得 addendum 来源入口；V5 addendum 现场 SHA/bytes/lines=`CC7C520B…110DA2A / 13,260 / 121`。§2 D-01/D-02/D-03/D-05/D-06 行未变。
- 受影响回归：V7 A=5/B=6/C=4/D=0、11 current/4 transfer、N-006→ISSUE-0031 未漂移；§5 全段（含 §5.3 分类隔离）和 §7 checklist 全段未修改。
- 输出 canonical：`8AC485F414EF502FBC77E7B56DA867A1E4109A87C0BF5740BBFB5B90525501CF`；18,341 bytes / 124 lines。
- 非范围：R2 NS-01～NS-06 均未处理、未宣称关闭；未修 M4 指针、V6 anchor、V7 owner、标签、§9 状态或命名空间。未修改其他 Spec、R1/R2 report/metadata、Issue canonical/总表、PM 记录、代码/UI/平台/中央/角色文件。
- 权限边界：未运行 Hermes/npm/测试/build，未执行 Git mutation、部署、数据库/付费或平台操作；未创建任务/subagent；本次 QA 不自我批准，不宣布文档门通过。
- 工作记录采用 prefix-preserving append；追加前 SHA-256=`40A29FCE5AA7B6AA3D88C2898A554662906103C1AE6E58A5120206FB6E5FF6FA`，45,059 bytes / 251 lines。
- 当前状态：`QA_DOCUMENT_REWORK_COMPLETE / HERMES_ROUND_3_PENDING`。唯一下一步：项目总负责人路由原产品经理执行最后 focused Hermes Round 3/3，仅复核 S-01 与受影响回归。

## 2026-08-31｜ISSUE-0042/0044/0045 集中清理附录 Hermes Round 1 S1/S2 严重批次整改

- 执行角色：`DocumentQAv2.3.2 / 019fefa7-c5cf-7e62-9859-5263998dfd77 / gpt-5.6-sol / high`；项目 workflow=`WORKFLOW_ACTIVE`；共享审查计数保持 Round 1/3。
- 写前输入：canonical `8FAA13ACBCCA97C68280E19AECFD0B5A72D8496BB5D0BA1C61B4B2E1C06B27B6`（18,703 bytes / 142 lines）；R1 report `E46ABE3F63C923C884471FF57C0D0D7E67F52EB8DEB39F21495BBAE65C39A070`（8,301 bytes / 99 lines）；metadata `464D99B5DB99F6B41E34DD24F31109DA2E232081C84E94609B07C676A6352E7D`；`deepseek-v4-pro / Round 1/3 / canonical_source_unchanged=true / REWORK_REQUIRED`，完整 SERIOUS=2。
- S1 before：原 §5“0045 小结”写为 `16/3/1`，相加仅20，与表内21项及4个 `REQUIRES_IMPLEMENTATION_OR_INDEPENDENT_REVIEW` 行不一致。S1 after：§5 开头明确总计21项，§5 小结统一为 `RESOLVED_BY_DOC=16 / REQUIRES=4 / EXTERNAL=1 / 16+4+1=21`，§7 ISSUE-0045 摘要同步为 `16/4/1`。
- S1 定向验证：ISSUE-0045 表仍为21行；4个 requires 行仍是 MAC-3、`ISSUE-0045-LEDGER-V7-R1-O-001`、`ISSUE-0045-LEDGER-V7-R1-O-002`、`ISSUE-0045-LEDGER-V7-R2-OI-001`；唯一 external 行仍为 `ISSUE-0045-LEDGER-V7-R1-O-003`，未改变任何行 disposition。
- S2 before：原 `V7-R1-N-003=RESOLVED_BY_DOC` 与 V7 来源矩阵 `N-003=N/A+transfer` 共用 `N-003` token，可能把未完成安全 transfer 误读为已解决。S2 after：§5 固定两个命名空间——`ISSUE-0045-LEDGER-*` 仅指 ISSUE-0045 文档审查台账项，`V7-0035-N-*` 仅指 A45-V7 §3 来源矩阵项；11个追加台账行统一改为 `ISSUE-0045-LEDGER-*`。
- S2 核心隔离：`ISSUE-0045-LEDGER-V7-R1-N-003` 仅表示历史 A/B/C/D 映射文档债务已补，不等于 `V7-0035-N-003`；后者继续为未完成 safety transfer，由 `ISSUE-0041`/安全 owner 承载，不得写成通过、完成或关闭。`V7-0035-N-006/N-010/N-013` 同样保持 transfer/延期边界。
- 来源复核：A45-ISSUE SHA=`335CB48AE2FA965644BC95E852784039D062E5BE97DD8AF18C5571E5395AFFCB`，其 `V7-0035-R1-N-003` 是文档分类映射发现；A45-V7 SHA=`54A331358C55C204E8B17A6C8311014882A2D8B54C13490F04D85CB40D0E2CCB`，其 §3 `N-003` 明确为 `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` 并由 ISSUE-0041/安全 owner 继续追踪。
- 输出 canonical：`CEEE27D8AA6F73FA7DE1F13E8AC7C9F412627E985EB4C3C4A13AEA563C34411B`；19,772 bytes / 142 lines。
- 非范围：R1 NON_SERIOUS N1（§3 intro qualifier）、N2（证据列表头）、N3（证据引用格式）、N4（范围 framing）均未处理、未宣称关闭；Missing Acceptance Criteria 与 OI-1～OI-5 也未在本 QA 批次扩写。
- 权限边界：未运行 Hermes/npm/测试/build，未执行 Git mutation、部署、平台、数据库或付费动作；未创建任务/subagent；未修改 Issue canonical/总表、产品经理记录、代码/UI、其他角色或中央文件；本次 QA 不自我批准、不宣布文档门通过或三项 Issue 关闭。
- 工作记录采用 prefix-preserving append；追加前 SHA-256=`B003A837868615A76ACD2551803A7B18E3F78E8EF26C76DA3FEAAD188AE14A9F`，48,045 bytes / 266 lines。
- 当前状态：`QA_SERIOUS_BATCH_REMEDIATED / HERMES_ROUND_2_PENDING`。唯一下一步：交回项目总负责人，由其组织 focused Hermes Round 2/3，仅复核 S1、S2 与受影响回归。
