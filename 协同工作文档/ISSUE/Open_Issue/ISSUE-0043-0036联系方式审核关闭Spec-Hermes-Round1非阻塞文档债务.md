# ISSUE-0043：0036 联系方式审核关闭 Spec Hermes Round 1 非阻塞文档债务

## 基本信息

- Issue ID：ISSUE-0043
- 类型：documentation / non-blocking review improvement
- 状态：open
- 工作流状态：NON_BLOCKING_DOCUMENT_REVIEW
- 优先级：P3
- 来源报告：规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0036-联系方式审核关闭-hermes-round-1.md
- 来源报告 SHA-256：26DB77C8D9EBEB7B5BE0DFDE62F8950184E7EA7566E7BBF82493633CDD82C536
- owner：ISSUE-0036 原实现 owner（Spec 契约与合成队列证据）/ 产品与业务 owner（范围和语义）/ 项目总负责人；ISSUE 管理员仅维护本台账
- 关系：仅追踪 ISSUE-0036 关闭 Spec Round 1 的 NON_SERIOUS 与其直接缺失验收项；不修改或关闭 ISSUE-0036，不把 V7 无 SERIOUS 写成 0036 功能或业务可关闭。

## 登记边界

- 本 Issue 不修改 0036 Spec、Hermes 报告、Document QA、代码、UI、AI provider、生产人工审核或平台。
- 每项均为 open / non-blocking 文档改进；不阻断当前 Document QA 对 S1–S3 的 SERIOUS 整改，但须在未来授权文档窗口满足关闭触发后关闭。
- 直接对应 S3 的 MAC-3、MAC-4 不在本 Issue 新建，继续由 Document QA 处理，不得降级。

## NON_SERIOUS 与缺失验收项逐条映射

| 报告项 | 事实与影响 | 状态与 owner | 未来关闭触发 |
| --- | --- | --- | --- |
| N1 | 14 项推荐方向被反复作为用户确认门禁但未枚举；确认清单不自包含，难以核对。 | open / non-blocking；0036 Spec owner/产品 owner | 附 14 项清单或精确指向源文档小节，并经业务/适用复核。 |
| N2 | V3→V4→V5 串行门禁未说明阶段含义及关闭证据承载物；外部依赖路由可能歧义。 | open / non-blocking；项目总负责人/0036 owner | 补阶段语义、证据 owner、关闭 receipt 指向并完成上游复读。 |
| N3 | “至少覆盖 childIntro 与 abilityDescription”与“最终字段/分类待确认”并存；最小范围与最终范围容易混读。 | open / non-blocking；产品/业务 owner | 明确最小范围、最终范围、待确认范围和不自动扩大的边界。 |
| N4 | V5-S2 状态列表缺 draft，与 §9.5 不一致；状态契约可能漏掉起始态。 | open / non-blocking；0036 Spec owner | 统一状态列表并通过适用独立复核；不改变未经确认的业务语义。 |
| N5 | 来源表将 CONTEXT、AGENTS、钦定产品经理合并为一格并挤入三枚 hash；独立回读可读性差。 | open / non-blocking；0036 Spec owner/ISSUE 管理员 | 拆分来源行并保留完整 path、hash、字节数、行数。 |
| MAC-1 | §8.3 只声明不得把开关存在写成已演练，缺少回滚演练/回滚点验收条目。 | open / non-blocking；项目总负责人/0036 owner | 补回滚点、演练或安全替代证据的明确判定；不得表述为已真实演练。 |
| MAC-2 | 上游 V3/V4 串行门禁与精确 base receipt 缺少“缺失即 UPSTREAM_GATE_BLOCKED”的可测检查。 | open / non-blocking；项目总负责人/0036 owner | 将 base receipt 完整性和缺失时阻断规则写入验收矩阵并复核。 |
| MAC-5 | V5-S0 的 14 项方向确认没有对应验收条目；直接对应 N1。 | open / non-blocking；产品/业务 owner | 14 项清单与逐项确认结果进入可复读验收证据。 |

## SERIOUS 与既有 Open-Issue 路由

| 报告项 | 处置 |
| --- | --- |
| MAC-3 日志不落原文/token/Secret | 直接对应 S3，继续由 Document QA 处理；不在本 Issue 降级。 |
| MAC-4 仅使用合成/脱敏语料 | 直接对应 S3，继续由 Document QA 处理；不在本 Issue 降级。 |
| 供应商、模型、部署位置、提示词、数据保留、人工队列、阈值、审核时限、OCR、生产 key/DPA | 由 ISSUE-0036 原 canonical 的业务/生产门禁承载；本 Issue 只追踪 N1/N3 的文档自包含性，不重复登记。 |
| V3 是否闭合、base commit、无障碍 owner、独立复核判据 | 分别由 ISSUE-0036 原有上游/业务门禁及 N2/N3 文档项承载；不新建同一业务 Issue。 |

## 关闭条件与持续边界

- 关闭触发：N1–N5、MAC-1、MAC-2、MAC-5 均完成授权文档修订或保守决策；完整来源、base receipt、14 项确认和回滚边界可复读；S1–S3 由 Document QA 处理；ISSUE 管理员独立回读后关闭 ISSUE-0043。
- 当前保持 open / NON_BLOCKING_DOCUMENT_REVIEW；不因 V7 无 SERIOUS、0036 的本地/合成队列准备或 Round 1 报告而自动关闭。
- 明确口径：本 Issue 不阻断当前文档 SERIOUS 项整改，但须在未来触发条件满足后关闭；不等于 ISSUE-0036 实现、独立复核、生产人工闭环、AI 出域、业务验收或项目 workflow 完成。
- 唯一下一步：项目总负责人等待 Document QA 完成 SERIOUS 整改后，安排 Hermes Round 2 复核状态、分类、隐私及受影响验收段落。

## 2026-08-23 V5 Hermes Round 2 NON_SERIOUS 追加登记

- 本批次来源 Spec：`规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0036-联系方式审核关闭-spec.md`，SHA-256=`F37E6AD7BB24F3C52561413B53735FA7B09F2BFFEC1CC2F111646087FF697844`。
- Hermes Round 2 报告：`规划文档/Spec文档/Release_version_Spec/2026-08-23-v5-issue-0036-hermes-round-2.md`，SHA-256=`0ACA79D9AF9EAC9E10F6DD2F223E5E40255D5D52C8D9E1BC52AD2DB8D23427CE`；metadata：`规划文档/Spec文档/Release_version_Spec/2026-08-23-v5-issue-0036-hermes-round-2.md.metadata.json`，SHA-256=`A6951EE1AD8F0657D197DB9D0F8675A22388FB74467CEAC8CFD35EDDD0E526CC`。模型=`deepseek-v4-pro`，轮次=`2/3`，`canonical_source_unchanged=true`，verdict=`PASS_WITH_NONBLOCKING_OPEN_ISSUES`，`SERIOUS=0`。
- 本批次只登记以下四项具名、非阻塞文档债务；均为 `open / non-blocking`，不触发 Document QA，不改变 ISSUE-0036 状态，不等于 ISSUE-0036 关闭、实现通过、生产人工闭环、AI 出域、业务验收或项目 workflow 完成。

| canonical finding ID | 报告 finding / 缺失验收项 | 事实与影响 | owner | future closure trigger |
| --- | --- | --- | --- | --- |
| `V5-R2-N1` | Hermes Round 2 `N1`：冻结 hash 历史快照记录的清晰度 | 报告引用的冻结源 hash `CEA06C42…F563E` 对应文档加入 §1.3 前的 `17488 bytes / 198 lines`，当前 Spec 为 `21593 bytes / 219 lines`；历史快照与最终冻结绑定容易混读，但不影响当前内容结论。 | ISSUE-0036 Spec owner / 项目总负责人 | 在最终冻结时重新计算 219 行最终文档 SHA-256，并将新 hash 写入 Hermes metadata；完成独立回读后关闭。 |
| `V5-R2-N2` | Hermes Round 2 `N2`：文档轮次字段滞后 | 文档内部 `CURRENT_REVIEW_ROUND=0/3` 与本报告外部轮次 `2/3` 不一致；报告判定为说明已发生重新冻结后的 cosmetic bookkeeping，不是正确性阻塞。 | ISSUE-0036 Spec owner / 项目总负责人 | 下一次冻结/审查周期启动时更新轮次字段，并复读 metadata、source hash 与报告绑定后关闭。 |
| `V5-R2-N3` | Hermes Round 2 `N3`：appeal 交叉引用清晰度 | §5.2 固定未编辑拒绝后的申诉状态路径，§5.3 又保留业务对“申诉后编辑/取消后回 draft”的分支选择未决；两者可兼容，但缺少一条明确交叉引用，存在语义误读风险。 | ISSUE-0036 Spec owner / 产品与业务 owner | 增加交叉引用，明确 §5.2 固定安全状态转换、§5.3 仅保留业务分支选择未决，并经适用独立复读后关闭。 |
| `V5-R2-N4` | Hermes Round 2 `OPEN-4`：rollback drill 标准缺失验收项 | 报告指出 §9 没有明确要求实际执行 rollback drill，虽 §8.3 已禁止把“开关存在”写成已演练，仍缺少可测验收项；本登记不得表述为真实回滚已演练。 | 项目总负责人 / ISSUE-0036 Spec owner | 在 §9 增加回滚到已验收 base 的演练、审计和独立复核标准，或明确延期至 V5-S4 production 收口证据；形成可复读 receipt 后关闭。 |

- 逐项映射保持：`V5-R2-N1 → report N1`、`V5-R2-N2 → report N2`、`V5-R2-N3 → report N3`、`V5-R2-N4 → report OPEN-4 / missing acceptance criterion`。本 Issue 不把报告的 `SERIOUS=0` 改写成 ISSUE-0036 可关闭，不处理其他业务未决门禁，也不启动 Round 3 或第四轮。
- 当前状态仍为 `open / NON_BLOCKING_DOCUMENT_REVIEW`；唯一下一步：项目总负责人等待适用 Document QA/既有审查链完成后，安排未来冻结、复读与上述四项触发条件核验。

## 2026-08-23 V5 生产冻结附件 Hermes Round 1 NON_SERIOUS 追加登记

- 生产冻结 Spec：`规划文档/Spec文档/Release_version_Spec/2026-08-23-v5-issue-0036-production-wiring-freeze-spec.md`，SHA-256=`0BE4B113B4F39DA6A76FE1F91A555E0122B36C192D57DA3A7ABE49B873F6DCBC`，18812 bytes / 265 lines。
- Hermes Round 1/3 报告：`规划文档/Spec文档/Release_version_Spec/2026-08-23-v5-issue-0036-production-wiring-hermes-round-1.md`，SHA-256=`B76BE1CCA24E15E9DAD26F669D493C5EC531BF7F49522C563F531819B78DDAF6`，8620 bytes / 79 lines；metadata SHA-256=`AB8A3862830D999A647B538A57C0DD917D1AB4AC48E057DF42FE69530EB47CA5`，914 bytes / 16 lines；model=`deepseek-v4-pro`，round=`1/3`，`canonical_source_unchanged=true`。
- 报告实际结论为 `REWORK_REQUIRED`，含 S1/S2 两项 `SERIOUS`；本批次只登记报告中的 N1-N9 为 `open / non-blocking` 文档债务。S1/S2 继续交 Document QA，不在本 Issue 降级、关闭或改写为 NON_SERIOUS。

| canonical finding ID | 报告 finding | 事实与影响 | owner | future closure trigger |
| --- | --- | --- | --- | --- |
| `V5-PROD-FREEZE-R1-N1` | N1 | §7 清理规则使用未在 §5.1 定义的 `closed` 状态；清理 job 的删除范围存在语义不确定性。 | 生产冻结 Spec owner / 生产 wiring owner | 在后续生产冻结文档债务周期定义 `closed` 终态集合，并经独立回读确认清理范围后关闭。 |
| `V5-PROD-FREEZE-R1-N2` | N2 | 审计 `previousEventDigest/eventDigest` 链与 180 天后清理规则的关系未冻结，审计回放与链验证窗口可能被误读。 | 生产冻结 Spec owner / 安全与审计 owner | 在后续文档周期明确保留期内回放/链验证口径及期满后的验证策略，并形成可复读验收证据后关闭。 |
| `V5-PROD-FREEZE-R1-N3` | N3 | 文件头状态 token 与 §14 状态 token/用户确认范围表述不一致，`USER_CONFIRMATION_PASSED` 的作用域容易误读。 | 生产冻结 Spec owner / 产品与业务 owner | 统一状态 token，明确上游确认与本附件执行确认边界，并经独立复读后关闭。 |
| `V5-PROD-FREEZE-R1-N4` | N4 | §8.1 API 状态列表漏列 §5.1 的 `published`，列表不完整。 | 生产 wiring/API contract owner | 后续生产冻结文档周期补齐 `published` 并完成 API 状态矩阵独立核验后关闭。 |
| `V5-PROD-FREEZE-R1-N5` | N5 | 自审禁令仅在 primary 角色行显式出现，backup/second reviewer 的统一约束表达不充分。 | 生产冻结 Spec owner / 安全与审核角色 owner | 统一所有审核角色的自审禁令，并经角色/审计约束复读后关闭。 |
| `V5-PROD-FREEZE-R1-N6` | N6 | 24 小时观察窗口与 48 小时申诉 SLA 的覆盖关系未说明，时间口径可能混淆。 | 生产观察 owner / 产品与业务 owner | 在后续文档周期明确两者起止点、覆盖关系及验收分母，并完成独立复核后关闭。 |
| `V5-PROD-FREEZE-R1-N7` | N7 | queue claim、原子锁定、primary 超时及 backup 接管语义未契约化，存在双领取和接管边界不清风险。 | 生产 wiring/queue owner / 安全 owner | 补充 claim/锁定/超时接管的原子语义、审计字段与验收证据后关闭；不得以实现存在替代契约证据。 |
| `V5-PROD-FREEZE-R1-N8` | N8 | 幂等键字段组成未冻结；keyed digest 密钥轮换可能影响未编辑申诉原内容 hash 的同 hash 判定。 | 生产 wiring/安全实现 owner | 冻结幂等键组成、keyed digest 轮换与历史判定兼容语义，并形成脱敏复读证据后关闭。 |
| `V5-PROD-FREEZE-R1-N9` | N9 | §5.2 “确定性候选或审核失败”与“任一编辑草稿 → draft”措辞不够精确，状态触发意图需明确。 | 生产冻结 Spec owner / 生产 wiring owner | 精化状态触发条件、适用对象与失败路径，并通过后续文档债务周期独立复核后关闭。 |

- 逐项映射保持：`V5-PROD-FREEZE-R1-N1` 至 `N9` 分别对应报告 N1 至 N9；九项均不升级为当前 Document QA 阻塞项，不改变 ISSUE-0036 canonical/state，不等于生产冻结通过或 Issue 关闭。
- 当前 ISSUE-0043 仍为 `open / NON_BLOCKING_DOCUMENT_REVIEW`；唯一下一步：等待后续生产冻结附件文档债务周期，在不触碰 S1/S2 SERIOUS 路由边界的前提下复核 N1-N9 future closure trigger。

## 2026-08-23 V5 生产冻结附件 Hermes Round 2 NON_SERIOUS 追加登记

- 本批次与上一批 R1 N1-N9 独立分隔，不覆盖、不合并、不误判重复。R2 报告：`规划文档/Spec文档/Release_version_Spec/2026-08-23-v5-issue-0036-production-wiring-hermes-round-2.md`，SHA-256=`2AD553A815E42D55A3F6A0A9D32F6F493FD7B06922044E5E595DF0AAACC366F2`，8737 bytes / 97 lines；metadata SHA-256=`49B6A4FC30E5186626CAEC8E28ACA69D65A4B42D8112F05EEB43DC786DB65FA4`，914 bytes / 16 lines；model=`deepseek-v4-pro`，round=`2/3`，`canonical_source_unchanged=true`。
- R2 metadata 声明的 source SHA-256=`9E5DE15240D36E67C6721F83DC006152B22D1B8A8E3539621F98194CA51BCF90`；当前工作区生产冻结 Spec live SHA-256=`0BE4B113B4F39DA6A76FE1F91A555E0122B36C192D57DA3A7ABE49B873F6DCBC`。本登记保留该来源绑定差异，不将报告写成当前 live Spec 已完成精确 source binding。
- 报告实际 verdict=`REWORK_REQUIRED`，含 1 项 `SERIOUS` S1；本批次只登记 R2 N1-N10 与审查轮次头部元数据债务为 `open / non-blocking`。S1 继续由 Document QA/原严重整改链处理，不在本 Issue 降级、关闭或混入 N1-N10。

| canonical finding ID | R2 报告 finding | 事实与影响 | owner | future closure trigger |
| --- | --- | --- | --- | --- |
| `V5-PROD-FREEZE-R2-N1` | N1 | 幂等唯一性未钉入固定索引表；仅靠集成测试兜底可能遗漏并发去重约束。 | 生产 wiring/数据库索引 owner | 后续生产冻结文档债务周期固定 `idempotencyKeyHash` 唯一索引/约束，并形成 schema/并发验收证据后关闭。 |
| `V5-PROD-FREEZE-R2-N2` | N2 | `pending_review` 与 `needs_manual_review` 在普通非申诉流程中的进入判据未定义。 | 生产冻结 Spec owner / 规则与审核 owner | 明确两状态的规则结果、进入条件和 fail-closed 语义，并经独立复读后关闭。 |
| `V5-PROD-FREEZE-R2-N3` | N3 | second reviewer 的普通边界案例角色合同与状态机不一致，普通需二审路径未定义。 | 生产冻结 Spec owner / 审核角色 owner | 将普通需二审标记与 second reviewer 转移纳入同一状态机，或删除不适用角色承诺，并复核后关闭。 |
| `V5-PROD-FREEZE-R2-N4` | N4 | DTO 使用 `reviewStatus/pendingVersion`，schema 使用 `status/pendingReviewVersion`，存在字段漂移。 | 生产 wiring/API contract owner | 统一 DTO、schema、索引与验收矩阵字段名，并完成独立回读后关闭。 |
| `V5-PROD-FREEZE-R2-N5` | N5 | “任意可删除状态”未枚举，进行中的 `appeal_pending/needs_manual_review` 是否可删除不清。 | 生产冻结 Spec owner / 数据生命周期 owner | 冻结可删除状态白名单及申诉/人工处理中保护规则，并形成清理验收后关闭。 |
| `V5-PROD-FREEZE-R2-N6` | N6 | 申诉被 second reviewer 驳回后的再申诉没有上界，可能形成 reject→appeal 无限环。 | 产品/业务 owner / 审核规则 owner | 由业务确认再申诉次数、终态和用户告知，并写入状态机及验收证据后关闭。 |
| `V5-PROD-FREEZE-R2-N7` | N7 | pending 期间并发再次编辑未定义，单一 `pendingReviewVersion` 无法表达 vN+1/vN+2 处置。 | 生产 wiring/版本 owner / 产品 owner | 明确拒绝、排队或合并策略及版本/审计边界，并形成并发负例证据后关闭。 |
| `V5-PROD-FREEZE-R2-N8` | N8 | task 元数据清理后，删除内容再恢复时的版本链和审核依据未定义。 | 数据生命周期 owner / 生产 wiring owner | 冻结清理后恢复、版本链和审核证据保留/重建规则，并经恢复场景复核后关闭。 |
| `V5-PROD-FREEZE-R2-N9` | N9 | “用户不看到完整联系方式”可能被误解为 owner 也不能看到自己提交的内容。 | 产品与业务 owner / Spec owner | 明确为“不看到他人联系方式”或经业务确认的精确语义，并同步 DTO/UI/验收措辞后关闭。 |
| `V5-PROD-FREEZE-R2-N10` | N10 | 未成年人字段法律保留、家长授权及申诉合规语义仍待业务/合规确认。 | 业务/合规 owner / 产品经理 | 完成业务与合规确认，冻结保留、授权、申诉边界及可复读记录后关闭。 |
| `V5-PROD-FREEZE-R2-META-ROUND` | R2 头部元数据债务 | 文档头与第 14 行仍写 `CURRENT_REVIEW_ROUND=1/3`，而本轮实际及 metadata 为 `2/3`；审查计数与下一步口径不一致。 | 生产冻结 Spec owner / Hermes 绑定 owner | 在后续冻结周期将头部轮次、正文下一步与 metadata/report 统一为实际轮次，并完成 source/hash 复读后关闭。 |

- R2 映射保持独立：`V5-PROD-FREEZE-R2-N1` 至 `N10` 分别对应 R2 报告 N1 至 N10；`V5-PROD-FREEZE-R2-META-ROUND` 单独对应 R2 头部 `1/3` 与实际 `2/3` 的元数据债务。R1 `V5-PROD-FREEZE-R1-N1` 至 `N9` 原登记不变。
- 当前 ISSUE-0043 仍为 `open / NON_BLOCKING_DOCUMENT_REVIEW`；这些项不升级为当前 QA 阻塞项，不改变 ISSUE-0036 state/总表，不等于生产冻结通过或正式关单。

## 2026-08-23 V5 生产冻结附件 Hermes Round 3 NON_SERIOUS 追加登记

- 本批次与 R1 N1-N9、R2 N1-N10 及 R2 元数据债务独立分隔，不覆盖、不合并、不误判重复。R3 报告：`规划文档/Spec文档/Release_version_Spec/2026-08-23-v5-issue-0036-production-wiring-hermes-round-3.md`，SHA-256=`3C8771E047214ACC69CDB0AC57FA57B21D047C11905305E63BE1122FB7616C09`，10571 bytes / 116 lines；metadata SHA-256=`E03DD6976938422D72457696AD863C60BDE8EF43A53A302B546BDE09C193A86B`，914 bytes / 16 lines；model=`deepseek-v4-pro`，round=`3/3`，`canonical_source_unchanged=true`。
- R3 metadata 声明的 source SHA-256=`C2988846E38D3C4338A38C06CC96B239BD59B9504D26E950CE07838265E393CF`。报告正文 verdict=`REWORK_REQUIRED`；SERIOUS-1/2 保持开放，审查上限为 `DOCUMENT_REVIEW_LIMIT_REACHED`，不得降级。`MISSING-ACC-1` 依附 SERIOUS-2，本批次不作为非阻塞项登记。
- 本批次只登记 R3 `NS-3/NS-4/NS-5/NS-6/NS-7/NS-8/NS-9/NS-10/NS-11` 与 `MISSING-ACC-2/MISSING-ACC-3`，均为 `open / non-blocking`；不触发 SERIOUS 降级、不启动第四轮、不改变 ISSUE-0036 state/总表或正式关单口径。

| canonical finding ID | R3 报告 finding | 事实与影响 | owner | future closure trigger |
| --- | --- | --- | --- | --- |
| `V5-PROD-FREEZE-R3-NS3` | NS-3 | second reviewer 处理“边界案例/需二审任务”没有对应状态、标志或转移支撑，普通需二审任务路由不清。 | 生产冻结 Spec owner / 审核角色 owner | 明确 out-of-scope 并删除角色承诺，或补充标志、状态转移与验收证据，经后续文档周期复读后关闭。 |
| `V5-PROD-FREEZE-R3-NS4` | NS-4 | aggregate 初始状态未定义，七态含 `draft` 但聚合规则不会产生 draft，创建事务也未显式写初始状态。 | 生产冻结 Spec owner / aggregate owner | 固定 aggregate 初始状态及 create 事务写入规则，并经状态机独立复核后关闭。 |
| `V5-PROD-FREEZE-R3-NS5` | NS-5 | “SLA 不写入本附件”与 24h/48h 目标措辞存在张力，目标与 SLA 承诺边界易混淆。 | 产品与业务 owner / 生产冻结 Spec owner | 明确 24h/48h 仅为内部目标或正式 SLA 的适用范围，并完成业务/文档复读后关闭。 |
| `V5-PROD-FREEZE-R3-NS6` | NS-6 | 文档头与第 14 行记账为 `CURRENT_REVIEW_ROUND=1/3`，本次调用为 `3/3`，下一步仍指向 Round 2/3。 | 生产冻结 Spec owner / Hermes 绑定 owner | 在风险接受、范围调整或新周期决定后，统一文档头、正文下一步、metadata 与 report 的实际轮次并复读后关闭。 |
| `V5-PROD-FREEZE-R3-NS7` | NS-7 | `pending_review -> published/rejected` 直通路径与“规则结果总进 needs_manual_review”语义冲突，pending_review 是否可人工直决未明确。 | 生产冻结 Spec owner / 审核规则 owner | 明确 pending_review 的决策态语义、适用角色和状态转移，并完成负例/状态矩阵复核后关闭。 |
| `V5-PROD-FREEZE-R3-NS8` | NS-8 | schema 的“必需字段”可能被实现为恒 NOT NULL，但 pending 任务的 decision/decidedAt/secondReviewerRef 等字段应允许为空。 | 生产 wiring/schema owner | 明确“字段存在”与“字段恒非空”的区别，补齐 nullable/状态矩阵约束并独立复读后关闭。 |
| `V5-PROD-FREEZE-R3-NS9` | NS-9 | “任意可删除状态”未枚举，published、人工处理中或申诉中的删除边界不清。 | 数据生命周期 owner / 生产冻结 Spec owner | 冻结可删除状态白名单及进行中任务保护规则，并完成清理验收后关闭。 |
| `V5-PROD-FREEZE-R3-NS10` | NS-10 | `classification` 字段的取值、来源及与 `ruleVersion`/状态的关系未定义。 | 生产 wiring/API contract owner / 规则 owner | 定义 classification 枚举、来源、版本绑定与状态语义，并纳入 schema/验收矩阵后关闭。 |
| `V5-PROD-FREEZE-R3-NS11` | NS-11 | §12.2 负例漏列 `rejected/deleted/duplicate`，与 §6.2.1 规则枚举不完整对应。 | 生产冻结 Spec owner / QA 验收 owner | 补齐负例或精确引用完整规则原文，完成 focused 文档复核后关闭。 |
| `V5-PROD-FREEZE-R3-MISSING-ACC-2` | MISSING-ACC-2 | 恢复场景缺少“不得恢复未授权联系方式可见性/聊天权限”的显式负例验收。 | 产品与业务 owner / 生产验收 owner | 将联系方式可见性与聊天授权恢复负例写入验收矩阵并形成可复读证据后关闭。 |
| `V5-PROD-FREEZE-R3-MISSING-ACC-3` | MISSING-ACC-3 | 30/180 天 retention/清理、legal hold、幂等、部分失败告警及清理失败不得重新启用 token/公开状态缺少专属验收。 | 数据生命周期 owner / 生产运维 owner | 补齐 retention/清理专项验收、legal hold、失败告警与 fail-closed 证据后关闭。 |

- 逐项映射保持：R3 `NS-3` 至 `NS-11` 与 `MISSING-ACC-2/3` 分别对应上述 canonical ID；`MISSING-ACC-1` 依附 SERIOUS-2，未登记为非阻塞。R1/R2 批次及其状态、含义和来源保持不变。
- 当前 ISSUE-0043 仍为 `open / NON_BLOCKING_DOCUMENT_REVIEW`；唯一下一步：等待业务方对审查上限作出风险接受、范围调整或新周期决定，再由适用 owner 复核 R3 非阻塞项的 future closure trigger。

## 2026-08-23 V5 生产接线冻结包 v2 Hermes Round 1 NON_SERIOUS/MAC 追加登记

- 本批次是 `v2 新周期 Round1`，与既有生产冻结 R1/R2/R3 批次独立分隔，不覆盖、不合并、不误判重复。v2 canonical：`规划文档/Spec文档/Release_version_Spec/2026-08-23-v5-issue-0036-production-wiring-freeze-v2-spec.md`，SHA-256=`4F361440FD8D6012CA916501E7D21DEFF10150E178B04C96637908BA6CE814CF`，33014 bytes / 340 lines。
- Hermes R1 report：`规划文档/Spec文档/Release_version_Spec/2026-08-23-v5-issue-0036-production-wiring-freeze-v2-hermes-round-1.md`，SHA-256=`464EC1043C453810F3799E0D2F5D05AAAC872B35A5EE3E1158E2CAAF547D3D62`，12562 bytes / 121 lines；metadata SHA-256=`D8D9B93B67E7C7CD189A560235B5E12B2C723B5B33DC870CCD04349D81B0F53C`，927 bytes / 16 lines；model=`deepseek-v4-pro`，round=`1/3`，`canonical_source_unchanged=true`。
- 报告 verdict=`REWORK_REQUIRED`，S-001~S-004 共 4 项 `SERIOUS`；四项正交交 Document QA，保持原级别，不在本 Issue 降级为非阻塞。本批次只登记 N-001~N-008 与 MAC-1~MAC-5，均为 `open / non-blocking`。

| canonical finding ID | 来源项 | 事实与影响 | owner | future closure trigger |
| --- | --- | --- | --- | --- |
| `V5-V2-R1-N-001` | N-001 | §6.3 标题称“四场景”但生命周期矩阵有六行，文档计数与内容不一致。 | v2 Spec owner / 产品经理 | 后续 v2 canonical 修订统一标题与矩阵范围，并经最终 Hermes/独立验收确认后关闭。 |
| `V5-V2-R1-N-002` | N-002 | §7.5 “Unique indexes”混入非唯一索引；content/rule/field 索引用途及唯一性不清。 | v2 Spec owner / schema owner | 修订索引标题、唯一性和各索引用途，完成 schema/验收矩阵独立确认后关闭。 |
| `V5-V2-R1-N-003` | N-003 | `cancel/close/stale/abandoned/closed` 不在正式状态枚举中，可能被实现为隐藏状态。 | v2 Spec owner / 状态机 owner | 统一为正式状态或删除/明确定义子状态，经状态机复核后关闭。 |
| `V5-V2-R1-N-004` | N-004 | 禁用 AI/OCR/provider/模型训练后仍遗留“模型分数”措辞，存在范围误导。 | v2 Spec owner / 产品经理 | 清理遗留死文本并经最终文档复读确认未重新授权 AI/provider 后关闭。 |
| `V5-V2-R1-N-005` | N-005 | 文档未定义邮件机制却写“不新增邮件”，形成无来源的遗留约束。 | v2 Spec owner / 产品经理 | 删除或定义邮件边界，并经最终 Hermes/独立验收确认后关闭。 |
| `V5-V2-R1-N-006` | N-006 | `draft` task 状态的进入、提交、聚合及退出生命周期未定义。 | v2 Spec owner / 状态机与 schema owner | 补齐 draft entry/exit、task 创建和聚合规则，并完成状态矩阵复核后关闭。 |
| `V5-V2-R1-N-007` | N-007 | `pending/manual/appeal` 简写可能被误读为独立状态，正式枚举与正文术语不一致。 | v2 Spec owner / 状态机 owner | 统一使用正式状态名并通过最终文档/独立验收确认后关闭。 |
| `V5-V2-R1-N-008` | N-008 | 审核员读取必要脱敏内容缺少脱敏机制、来源与 API 边界说明。 | v2 Spec owner / 安全与审核 API owner | 明确最小脱敏字段、读取来源/API、不可见联系方式与未成年人正文边界，并经独立验收后关闭。 |
| `V5-V2-R1-MAC-1` | MAC-1 | 24h/48h 处理目标、超时 overdue audit/告警及不自动决定缺少专项验收。 | v2 Spec owner / 生产验收 owner | 增加超时、审计、告警和不自动 publish/reject 的可判定测试，最终 Hermes/独立验收确认后关闭。 |
| `V5-V2-R1-MAC-2` | MAC-2 | 403/409/422/503 缺逐码验收，503 无部分副作用边界未验证。 | v2 Spec owner / API与生产验收 owner | 补逐码响应、状态保持、无部分副作用和审计证据后关闭。 |
| `V5-V2-R1-MAC-3` | MAC-3 | 公共/其他账号不得看到联系方式、owner 仅本人可见缺专项验收。 | 产品/业务 owner / 生产验收 owner | 形成公共、其他账号、owner 三类隔离负例与可复读证据后关闭。 |
| `V5-V2-R1-MAC-4` | MAC-4 | 审核员仅读必要脱敏字段、不可见联系方式及未成年人正文缺专项验收。 | 安全/审核 API owner / 生产验收 owner | 补审核员最小字段读取与禁止字段负例，完成独立验收后关闭。 |
| `V5-V2-R1-MAC-5` | MAC-5 | backup 仅在超时/不可用时接管的触发、角色和审计缺专项验收。 | 生产 wiring/审核角色 owner | 补超时/不可用触发、接管身份、dueAt 与审计证据，最终 Hermes/独立验收确认后关闭。 |

- 逐项映射保持：`V5-V2-R1-N-001`~`N-008` 分别对应 v2 R1 N-001~N-008；`V5-V2-R1-MAC-1`~`MAC-5` 分别对应 MAC-1~MAC-5。若 Document QA 严重整改的受影响回归顺带覆盖某项，仅记录为“待后续审查确认”，不在本 Issue 自行关闭。
- 当前 ISSUE-0043 仍为 `open / NON_BLOCKING_DOCUMENT_REVIEW`；本批次不改变当前文档门、用户确认门、ISSUE-0036 state/总表或项目 workflow。唯一下一步：等待 Document QA 完成 S-001~S-004 整改及 focused Hermes Round 2。

## 2026-08-23 V5 生产接线冻结包 v2 Hermes Round 2 NON_SERIOUS 追加登记

- 本批次是 `v2 Round2` 独立批次，与既有生产冻结 R1/R2/R3 及 v2 Round1 台账分开编号、分开追踪，不覆盖、不合并、不误判重复。v2 canonical：`规划文档/Spec文档/Release_version_Spec/2026-08-23-v5-issue-0036-production-wiring-freeze-v2-spec.md`，SHA-256=`C8613135340AA00F4F1C6C58C2EB53864BF0256F4BA8C3FCC4D815F6CB4D7A05`；Hermes Round 2 report：`规划文档/Spec文档/Release_version_Spec/2026-08-23-v5-issue-0036-production-wiring-freeze-v2-hermes-round-2.md`，SHA-256=`DBEF9912BEA98B906D5FC79E099A58D9FAA749B2AFEAD0C5D7F191A0F28779FB`；metadata：`规划文档/Spec文档/Release_version_Spec/2026-08-23-v5-issue-0036-production-wiring-freeze-v2-hermes-round-2.md.metadata.json`，SHA-256=`D88CE3703D9B4B44705857AC540FA9792DDF5BB4CD1A9EE7CAB574351BC29D4F`；model=`deepseek-v4-pro`，round=`2/3`，`canonical_source_unchanged=true`。
- 报告实际 verdict=`REWORK_REQUIRED`。S-1/S-2 保持 `SERIOUS` 并继续交 Document QA；AC-1/AC-2 分别依附 S-1/S-2，不在本批次降级或登记为非阻塞。以下仅登记 N-1、N-2、C-1、C-2 与 AC-3，均为 `open / non-blocking`。

| canonical finding ID | 来源项 | 事实与影响 | owner | future closure trigger |
| --- | --- | --- | --- | --- |
| `V5-V2-R2-N-001` | N-1 | delete 流程中的 `hidden` 与 `publicVisibility=deleted` 用词不统一；枚举已能指向预期行为，但文档表述不一致。 | v2 生产接线冻结 Spec owner / 状态与可见性 owner | 在最终 canonical 修订中统一 delete 可见性术语，并经后续 Hermes/独立验收确认后关闭。 |
| `V5-V2-R2-N-002` | N-2 | `claimAt`/`triageReviewerRef`/`triageReviewerRole` 在终审 vector 中的写入时机不清，claim/triage 与终审记录边界需明确。 | v2 生产接线冻结 Spec owner / 审核流程 owner | 明确 claim/triage 持久化时机与终审仅校验/记录的边界，并经状态机/验收复核后关闭。 |
| `V5-V2-R2-C-001` | C-1 | 文档头 `CURRENT_REVIEW_ROUND=1/3` 与本次实际 Round `2/3` 及 Round 2 状态不一致，审查轮次范围不清。 | v2 Spec owner / Hermes 绑定 owner | 统一文档头、正文、metadata 与 report 的实际轮次，完成最终复读后关闭。 |
| `V5-V2-R2-C-002` | C-2 | `DRAFT_NON_CANONICAL` 与“完整 canonical”同时使用，authority status 与 self-contained completeness 语义冲突。 | v2 Spec owner / 产品文档 owner | 明确 draft/canonical authority 与文档完整性的术语边界，并经最终 Hermes/独立验收确认后关闭。 |
| `V5-V2-R2-MAC-003` | AC-3 | owner 私有视图“仅本人可见联系方式”、其他账号与公共端“永不返回联系方式”缺少独立的跨账号/公共端验收用例，当前仅被既有规则间接覆盖。 | 产品与业务 owner / 生产验收 owner | 增加 owner、其他账号、公共端三类可见性矩阵及可复读证据，经独立验收确认后关闭。 |

- 逐项映射保持：`V5-V2-R2-N-001` 对应 R2 N-1，`V5-V2-R2-N-002` 对应 R2 N-2，`V5-V2-R2-C-001` 对应 R2 C-1，`V5-V2-R2-C-002` 对应 R2 C-2，`V5-V2-R2-MAC-003` 对应 R2 AC-3。AC-1/AC-2 继续依附 S-1/S-2，不作为非阻塞降级登记；若 Document QA 严重整改回归顺带覆盖上述项目，仅记为待最终审查确认，不在本 Issue 自行关闭。
- 当前 ISSUE-0043 仍为 `open / NON_BLOCKING_DOCUMENT_REVIEW`；本批次不改变 ISSUE-0036 的 `open / USER_CONFIRMATION_PENDING`、ISSUE 总表、用户确认门或项目 workflow。唯一下一步：等待 Document QA 处理 S-1/S-2，并由项目总负责人安排 focused Hermes R3；不得关闭 ISSUE-0036。

## 2026-08-23 V5 生产接线冻结包 v2 Hermes Round 3 NON_SERIOUS/O 追加登记

- 本批次是 `v2 Round3` 独立批次，与既有生产冻结 R1/R2/R3、v2 Round1 与 v2 Round2 台账分开追踪。v2 canonical：`规划文档/Spec文档/Release_version_Spec/2026-08-23-v5-issue-0036-production-wiring-freeze-v2-spec.md`，SHA-256=`95AA1D2D6DFFE12E30C53E9D1A3C9EAA69AC5BFD33CB3DDD946F2DCCA5B5307A`；Hermes Round 3 report：`规划文档/Spec文档/Release_version_Spec/2026-08-23-v5-issue-0036-production-wiring-freeze-v2-hermes-round-3.md`，SHA-256=`4955BF6A17BD12E69781B0D40069C600824004F8F5D23C0EA5CCD8C188777E53`；metadata：`规划文档/Spec文档/Release_version_Spec/2026-08-23-v5-issue-0036-production-wiring-freeze-v2-hermes-round-3.md.metadata.json`，SHA-256=`03E2EE84EBE9CE1B41A504FB5C1BD2178BBEC5FAD8E7DB85883EA6B6700222F7`；model=`deepseek-v4-pro`，round=`3/3`，`canonical_source_unchanged=true`。
- 报告实际 verdict=`REWORK_REQUIRED`，审查状态=`DOCUMENT_REVIEW_LIMIT_REACHED`。S-1“轮次元数据冲突”保持 `SERIOUS`，不得降级；不得启动第四轮。以下仅登记 R3 的 NON_SERIOUS/O 项，均为 `open / non-blocking`。C-1 与 S-1 同一严重项，不重复登记；C-2/C-3 分别并入 N-4/N-3。

| canonical finding ID | 来源项 | 事实与影响 | 去重/关联 | owner | future closure trigger |
| --- | --- | --- | --- | --- | --- |
| `V5-V2-R3-N-001` | N-1 | owner 私有视图可见自己的联系方式、public/其他账号在任何状态永不可见联系方式，缺少显式独立验收。 | R2 `AC-3` 再确认引用；不新造重复债务。 | 产品与业务 owner / 生产验收 owner | 增加 owner、其他账号、公共端及各状态的联系方式隔离矩阵，完成独立验收后关闭。 |
| `V5-V2-R3-N-002` | N-2 | 普通/申诉 SLA 超时转入 `needs_manual_review`，并产生 overdue audit/告警，缺少显式验收。 | v2 R1 `MAC-1` 再确认引用；不新造重复债务。 | v2 Spec owner / 生产验收 owner | 补齐普通与申诉超时转移、overdue audit、告警和不自动决定的可判定测试，经独立验收后关闭。 |
| `V5-V2-R3-N-003` | N-3 | §6.1 aggregate 定位键遗漏 `entityType`，与 §6.2/§7.5 的完整唯一键不一致，可能造成跨实体类型版本定位歧义。 | R3 `C-3` 合并追踪。 | v2 Spec owner / 状态机与 schema owner | 在最终 canonical 中统一 aggregate 唯一键并完成状态机/schema 独立复核后关闭。 |
| `V5-V2-R3-N-004` | N-4 | 删除态 `hidden` 与权威枚举 `deleted` 混用，影响删除/恢复语义的文字清晰度。 | R3 `C-2` 与 R2 `N-1` 再确认引用；不新造重复债务。 | v2 Spec owner / 可见性与生命周期 owner | 统一删除态术语并复核删除、恢复及公共可见性验收后关闭。 |
| `V5-V2-R3-N-005` | N-5 | §6.3 标题称“四场景”，矩阵实际包含 8 行，标题与内容计数不一致。 | v2 R1 `N-001` 再确认引用；不新造重复债务。 | v2 Spec owner / 产品文档 owner | 统一标题与矩阵范围或明确“四场景”所指范围，经最终文档复读后关闭。 |
| `V5-V2-R3-O-001` | O-1 | focused R3 报告未携带 R2 ledger，逐项追溯依赖外部工件，未来冻结/实施 handoff 的证据链不自包含。 | 新增 R3 handoff 可追溯性非阻塞项。 | 项目总负责人 / 文档交付与 QA owner | 后续冻结或实施 handoff 附带 R2 report 与 QA ledger，并完成逐项追溯复核后关闭。 |
| `V5-V2-R3-O-002` | O-2 | M-1/M-2 未补前，§12 对隐私访问控制与 SLA 超时失败路径的验收仍不完整。 | 引用 R3 `N-1/N-2` 及其既有 R2 AC-3、v2 R1 MAC-1；不扩大为新功能 Issue。 | QA 验收 owner / 产品与业务 owner | 补齐 M-1/M-2 并由独立验收确认 N-1/N-2 对应路径后关闭。 |

- 逐项映射保持：R3 `N-1`→`V5-V2-R3-N-001`（R2 AC-3 再确认），`N-2`→`V5-V2-R3-N-002`（v2 R1 MAC-1 再确认），`N-3/C-3`→`V5-V2-R3-N-003`，`N-4/C-2`→`V5-V2-R3-N-004`（R2 N-1 再确认），`N-5`→`V5-V2-R3-N-005`（v2 R1 N-001 再确认），`O-1`→`V5-V2-R3-O-001`，`O-2`→`V5-V2-R3-O-002`。C-1=S-1 不登记为非阻塞；S-1 继续 `SERIOUS / DOCUMENT_REVIEW_LIMIT_REACHED`。
- 若 Document QA 或后续整改回归顺带覆盖重合项，仅记录待最终确认，不自行关闭；本批次不改变 ISSUE-0036 的 `open / USER_CONFIRMATION_PENDING`、ISSUE 总表或项目 workflow。当前 ISSUE-0043 仍为 `open / NON_BLOCKING_DOCUMENT_REVIEW`。
- 唯一下一步：等待业务方对 `metadata-only named risk` 作出风险接受、范围调整或新周期决定；在此之前不得把 R3 登记写成严重项关闭、实现授权或 ISSUE-0036 关单。

## 2026-08-25 ISSUE-0036 人工审核延期与暂缓关闭范围调整 Hermes 非阻塞登记

- 本批次登记到既有 ISSUE-0043，不新建 Issue，不改变 ISSUE-0036 的功能范围历史；其依据为范围调整 addendum `规划文档/Spec文档/Release_version_Spec/2026-08-25-issue-0036-人工审核延期与暂缓关闭范围调整-spec-addendum.md`，SHA-256=`CC7C520B549D2F8449119A533C455D725331957B2F4EA5AE321F2F317110DA2A`。
- Hermes Round 1 report：`规划文档/Spec文档/Release_version_Spec/2026-08-25-issue-0036-人工审核延期与暂缓关闭范围调整-hermes-round-1.md`，SHA-256=`E54768E4CA0BB2516E67EB503AAB7C7F38E14632772F5054A66649FED5A2C0D6`，实际 verdict=`REWORK_REQUIRED`，唯一 S1 已由 Document QA 修订。Round 1 N1-N5 均为 `NON_SERIOUS`。
- Hermes focused Round 2 report：`规划文档/Spec文档/Release_version_Spec/2026-08-25-issue-0036-人工审核延期与暂缓关闭范围调整-hermes-round-2.md`，SHA-256=`61AC1D365A483C6230083B6C604D0F39203BE2C461D7591AAF9619BD8D5A8AE6`；metadata SHA-256=`2DDEE947E1089B109C8EF84150E0C1BE026869B13EFBE29101E77A72BA647547`；model=`deepseek-v4-pro`，round=`2/3`，`canonical_source_unchanged=true`，verdict=`PASS_WITH_NONBLOCKING_OPEN_ISSUES`，SERIOUS=0。QA ledger `协同工作文档/文档QA/DocumentQA工作记录.md` SHA-256=`8D47B5F8582E1FAB596DFB812179E133F8D24A1A59338FAAFB81049B90123658`。

| canonical finding ID | 来源项 | 事实与影响 | owner | future closure trigger |
| --- | --- | --- | --- | --- |
| `V5-SCOPE-ADJ-R1-N-001` | R1 N1 | 关闭候选条件 3/4 未明确由谁、何时、以何种证据验证跨 Issue 绑定与双 flag/reviewer/Secret 边界。 | 项目总负责人 / 实现复核 owner / ISSUE 管理员 | 补齐 commit/tree 跨 Issue 核对和双 flag/配置只读证据的 owner、时点与证据类型，并经适用复核后关闭。 |
| `V5-SCOPE-ADJ-R1-N-002` | R1 N2 | “测试/合成”与“本地/集成/合成”环境术语不一致，局部边界不清。 | 产品经理 / Spec owner | 统一环境术语或定义其关系，并经文档复读后关闭。 |
| `V5-SCOPE-ADJ-R1-N-003` | R1 N3 | `deferred` 混入状态串，但仓库 Issue 状态枚举没有该状态，可能被机械写入。 | ISSUE 管理员 / 产品经理 | 明确 `deferred` 仅为范围限定词、不是状态字段；本次关闭采用合法 `closed / WORKFLOW_COMPLETE`，经总表与 canonical 一致性复核后关闭。 |
| `V5-SCOPE-ADJ-R1-N-004` | R1 N4 | 延期清单中的 ISSUE-0031 与“首次访问 503”缺少局部标识或引用，影响边界可追溯性。 | 产品经理 / 项目总负责人 | 补充对象标识与来源引用，并经文档复读后关闭。 |
| `V5-SCOPE-ADJ-R1-N-005` | R1 N5 | addendum 绑定的 SHA-256/commit/tree 缺少明确的实际核验步骤。 | ISSUE 管理员 / 项目总负责人 | 在关单或后续 handoff 证据索引中记录实际 hash/commit/tree 核验人与时点，并完成独立复读后关闭。 |
| `V5-SCOPE-ADJ-R2-N-001` | R2 N-001 | addendum 仍写 `CURRENT_REVIEW_ROUND=1/3`，与 R2 状态和下一步不一致。 | 产品经理 / Spec owner | 下一次 addendum 修订时统一轮次字段，或删除该字段并以状态与 report 为准，经复读后关闭。 |
| `V5-SCOPE-ADJ-R2-N-002` | R2 N-002 | “本线程”指代未定义，可能误读为禁止执行 focused Hermes，而正文实际指向业务决策线程。 | 产品经理 / 项目总负责人 | 将其改为“业务决策线程”或明确线程 ID，并经文档复读后关闭。 |
| `V5-SCOPE-ADJ-R2-O-003` | R2 O-3 | focused R2 审查目录未携带 R1 report/复诊日志，R1→R2 严重修订轨迹需依赖外部工件。 | 项目总负责人 / Document QA owner | 在关单证据索引或后续 handoff 附带 R1 report 与复诊/QA ledger，完成逐项追溯后关闭。 |

- 本批次所有条目均为 `open / non-blocking` 文档债务，不阻止本次按已获批准的 material scope adjustment 对 ISSUE-0036 进行“暂缓需求关闭”；不把任何条目写成生产审核、人工 reviewer、AI provider、flag-on 或生产验收已完成。
- 当前 ISSUE-0043 继续为 `open / NON_BLOCKING_DOCUMENT_REVIEW`；其台账登记不改变 ISSUE-0036 的适用关单结论，也不关闭 ISSUE-0043。本批次唯一下一步：由项目总负责人在后续文档周期处理上述非阻塞触发条件。
