# ISSUE-0038：0036 联系方式快速智能审核 Spec 首轮非阻塞文档审查改进台账

## 当前关闭状态（2026-08-25；历史段落保留）

- Issue ID：`ISSUE-0038`
- 类型：`documentation / non-blocking review improvement`
- 状态：`closed`
- 工作流状态：`WORKFLOW_COMPLETE`（仅 ISSUE-0038 自身；项目总 workflow 仍为 `WORKFLOW_ACTIVE`）
- 关闭语义：按 2026-08-25 范围调整附录，关闭当前批准范围内的文档债务；这是文档-only、暂缓需求/范围调整后的适用关闭，不代表 ISSUE-0036 的 AI/人工审核、provider、flag-on、生产观察、部署或回滚完成。
- 用户确认门：`USER_CONFIRMATION_PASSED`。用户已在明确知悉“0038 只解决文档欠账，不开发 AI/人工审核、不改数据库、不部署、不启用 flag；0036 是功能本身、0038 是整理说明书和审查记录”后回复：“行，现在做，是不是很快解决”。
- 当前责任：ISSUE 管理员维护本关闭记录；ISSUE-0044 继续承载本次附录的 NON_SERIOUS 追踪。未来恢复功能需求时，必须重开 ISSUE-0036 或建立明确继任 Issue，重新通过 Spec、实现、独立复核、部署/生产与业务验收门禁。

### 关闭证据与独立复读

- 旧 V6 关闭 Spec：`规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0038-联系方式审核文档债务关闭-spec.md`，SHA-256=`7248241D9EBE78FC0E6D9491CBAE5BC87C8C3423AA1BC65E6E81DC6AE72AFD46`；旧 Hermes R1/R2/R3 SHA 分别为 `2151DC34C2E6757DF65266E1568CC1DFD9CB438D1DCBEA540877B95D51371C1E`、`72A02E04B29DCB2724231E4DD29915F7C706F9408B1333DF9244CA5340F6862A`、`5721D48B8BE4E54AC4FC477737398CA825C3CA1AB38B5737579D09C22A04D6B4`。这些是历史关闭链，不能替代本次范围调整。
- 新 material scope addendum：`规划文档/Spec文档/Release_version_Spec/2026-08-25-issue-0038-0036延期关闭后的文档债务关单范围调整-spec-addendum.md`，SHA-256=`563219A51BE647CD72081ABBAC9E06C5CF7D46DA448D504A5E47AE9DEC46A9FE`。
- 新 Hermes R1/R2/R3 SHA 分别为 `10DC4847E8B3E90EF13E01E91036DA565B7397671A0EFA37132BC09D34528635`、`4918393B2C0D441304DD812D083479D0301BE07ED72C400BFC64693ED6089F63`、`5842A3B843A5B27E79A7D2B67CE4F249C4416D679B6C692AA0A746ED41A39901`；metadata SHA 分别为 `AFA4ED6F2A90D1D209296690B8378DA571CB52C33741D4CFF90AE6A45BC73775`、`9116A5B54A69053B64A9A49E9374D523F172A7BD53766906AD8A26FB841B2357`、`EA5CEF263A36033F18642F0FDBB703248E8FA3A74440D5943217DAE65466159A`。R3 为 `deepseek-v4-pro`、3/3、`canonical_source_unchanged=true`、`PASS_WITH_NONBLOCKING_OPEN_ISSUES`、`SERIOUS=0`；不启动第四轮。
- Document QA ledger：`协同工作文档/文档QA/DocumentQA工作记录.md`，SHA-256=`9759259E0BCA2FF55BFF0FFC39EE3E8AA31C9FA2F7D19E2CE447F8A7AF5E2027`。R1/R2 SERIOUS 已按职责路由并由 R3 复读为零；NON_SERIOUS 由 ISSUE-0044 追加追踪。
- ISSUE-0036 Close canonical：`协同工作文档/ISSUE/Close_Issue/ISSUE-0036-家长需求与老师资料的联系方式快速智能审核.md`，其关闭口径仅为“人工审核延期、暂缓需求/范围调整后关闭”，不代表生产审核完成；本 Issue 不改变该口径。

### 13 项处置结论

1. B=7：`N-001/N-005/N-007/NS-001/NS-002/NS-004/NS-005`，按附录 §3.1 的 `B-E01`～`B-E07` 纯文档采纳链完成本次管理员 receipt；不附加业务签字，不把该 receipt 写成业务/生产验收。
2. `N-002`：判定为 `V5_BOUNDED_SUFFICIENT`，仅覆盖 bounded local/synthetic/flag-off 范围；不得外推为生产证据。
3. `N-003/N-004/N-006/NS-006` 与 `D/NS-003`：判定为 `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER`。N/A 不代表完成；owner、未来触发和转移关系保留在 ISSUE-0044 或适用既有台账，不静默删除。
4. 附录 §3.1 与旧 Spec 锚点行号存在轻微差异，按 R3 OI-2 以附录 §3.1 为当前权威并保留审计说明；不构成当前关闭阻塞。
5. R3 OI-1 要求的源文件 receipt 已独立完成：旧 0036 Spec 实际 SHA-256=`005EA5F2490DC2E43A134BA0421EFBD357179C90E29A6F2AB560F6F61A97B437`、39996 bytes；B-E01～B-E07 映射与锚点已复读。

| 项目 | 当前处置 | 绑定/未来触发 |
| --- | --- | --- |
| `N-001` | `B_DOC_ADMIN_ADOPTED` | `B-E01` 纯文档采纳链；不附加业务签字。 |
| `N-005` | `B_DOC_ADMIN_ADOPTED` | `B-E02` 纯文档采纳链；不外推实现或生产。 |
| `N-007` | `B_DOC_ADMIN_ADOPTED` | `B-E03` 纯文档采纳链；不外推实现或生产。 |
| `NS-001` | `B_DOC_ADMIN_ADOPTED` | `B-E04` 纯文档采纳链；不外推实现或生产。 |
| `NS-002` | `B_DOC_ADMIN_ADOPTED` | `B-E05` 纯文档采纳链；不外推实现或生产。 |
| `NS-004` | `B_DOC_ADMIN_ADOPTED` | `B-E06` 纯文档采纳链；不外推实现或生产。 |
| `NS-005` | `B_DOC_ADMIN_ADOPTED` | `B-E07` 纯文档采纳链；不外推实现或生产。 |
| `N-002` | `V5_BOUNDED_SUFFICIENT` | 仅 bounded local/synthetic/flag-off；未来不得外推生产，若范围恢复须重新建立生产门禁。 |
| `N-003` | `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` | N/A 不代表完成；保留 owner/future trigger，由 ISSUE-0044 或适用既有台账继续追踪。 |
| `N-004` | `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` | N/A 不代表完成；保留 owner/future trigger，由 ISSUE-0044 或适用既有台账继续追踪。 |
| `N-006` | `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` | N/A 不代表完成；保留 owner/future trigger，由 ISSUE-0044 或适用既有台账继续追踪。 |
| `NS-006` | `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` | N/A 不代表完成；保留 owner/future trigger，由 ISSUE-0044 或适用既有台账继续追踪。 |
| `NS-003` / D | `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER` | 留待生产观察/后续版本复评；不因本次文档-only 关闭视为完成。 |

### V6 branch/base/deploy gate 判定

- 本次是批准范围内的纯文档-only 关闭；V6 分支、base receipt、部署和生产证据对当前关闭判定为 `N/A_FOR_CURRENT_CLOSURE`。
- 当前未创建 V6 分支/base receipt；候选 commit `f8ad5d009c5483d6791699d2c2394765a23fb2f2` 仅作为历史 bounded local/synthetic/flag-off 证据，明确不是 `BASE_ACCEPTED`，不冒充 V6 revision、部署或生产证据。
- 因此不执行 Git、部署或平台动作，也不因缺少 V6 base receipt 虚构失败；未来若恢复功能范围，须由 ISSUE-0036 或继任 Issue 重新建立对应 branch/base/实现/部署/生产门禁。

### 关闭后边界与恢复条件

- ISSUE-0044 仍保持 `open / NON_BLOCKING_DOCUMENT_REVIEW`，承接新附录 R1/R2/R3 的去重 NON_SERIOUS；其存在不阻断本次文档-only 关闭。
- 本关闭不代表 ISSUE-0036 的 AI/人工审核、provider、Secret、数据库、flag-on、生产观察、部署、回滚演练或项目总 workflow 完成。
- 项目 workflow 必须保持 `WORKFLOW_ACTIVE`；Active Open 由总表维护，其他 Issue 不因本次关闭改变。
- 唯一下一步：项目总负责人独立核对本次目录与状态变更，并在后续统一 GitHub 推送；功能恢复时先重开 ISSUE-0036 或建立继任 Issue，再重新走完整门禁。

## 历史记录（原 Open canonical，保留原文）

## 基本信息

- Issue ID：`ISSUE-0038`
- 类型：documentation / non-blocking review improvement
- 状态：`open`
- 工作流状态：`NON_BLOCKING_DOCUMENT_REVIEW`
- 阶段口径：`ISSUE-0036` 联系方式快速智能审核 Spec 的 Round 1 发现 7 项 `SERIOUS` 与 7 项 `NON_SERIOUS`；Round 3/3 已复核为 0 项 `SERIOUS`、6 项 `NON_SERIOUS`（NS-001～NS-006）。独立核对登记 B=7，C=5、D=1 保持未关闭。本 Issue 仅追踪 N-001～N-007 与 NS-001～NS-006，不把 `NON_SERIOUS` 作为 0036 功能实现、Spec 决策或生产阻塞；禁止第四轮。
- 优先级：P3
- 来源 Spec：`规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-联系方式快速智能审核-spec.md`
- source SHA-256：`0F6B7E30750E2D5733AF18D9D8C693041BC3E4F8D8921F6AC0DC2784C345A2F6`
- Hermes Round 1 报告：`规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-hermes-round-1.md`
- report SHA-256：`CF9A9FF6170DC0F53DD29584D4B0075F18424AA76CD637791C7BA8B302DEA7BD`
- metadata SHA-256：`0609AD394CB1E9C66D244480267F75DAD1590AA786C411E21D28D3E96F71AB5C`
- Hermes Round 1 结论：`REWORK_REQUIRED`；7 项 `SERIOUS` 交独立 Document QA，7 项 `NON_SERIOUS` 由本 Issue 逐项追踪。
- 当前 Spec Round 3 source SHA-256：`005EA5F2490DC2E43A134BA0421EFBD357179C90E29A6F2AB560F6F61A97B437`
- Hermes Round 3/3 报告：`规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-hermes-round-3.md`
- Round 3 report SHA-256：`B3749F4C713C743FCF2510B1F7BE0F917B92EE4265D916947FBA8AFB178AE470`
- Hermes Round 3/3 结论：`PASS_WITH_NONBLOCKING_OPEN_ISSUES`；0 项 `SERIOUS`、6 项 `NON_SERIOUS`，禁止自动第四轮。
- 当前责任：ISSUE 管理员仅维护本台账；未分配产品方案、实现、测试、UI、部署或平台角色。

## 独立范围与不阻塞口径

- 本 Issue 是 `ISSUE-0036` Spec 的独立非阻塞文档审查台账，不并入 `ISSUE-0036` 的功能门禁，也不并入 `ISSUE-0037`（后 0033 分阶段执行草案台账）。
- 本 Issue 不修改 0036 Spec、Hermes 报告、Document QA、产品文档、代码、UI、配置、部署或平台，不运行 npm/Git，不创建任务或 subagent。
- N-001～N-007 均为 `NON_BLOCKING` 文档清晰度、可测试性或范围可追溯性改进；不改变 `ISSUE-0036` 当前 `open / USER_CONFIRMATION_PENDING`，不授权 0036 实现或部署。
- Round 1 的 7 项 `SERIOUS` 仅由独立 Document QA 处理；本 Issue 不代修、不自审、不把严重批次修订当作 N-001～N-007 已关闭证据。
- Round 3 的 NS-001～NS-006 追加至本台账；它们不并入 `ISSUE-0036` 功能门禁，也不改变 `ISSUE-0036` 的 `open / USER_CONFIRMATION_PENDING`。

## Round 1 非阻塞发现逐项台账

| 台账项 | 发现与证据 | 建议处置（非冻结方案） | 未来关闭触发 |
| --- | --- | --- | --- |
| `N-001` | “高风险自动拒绝”在 §5.3 被使用，但未给出可操作定义或示例，容易与高置信确定性命中混淆。 | 增加示例级边界（例如完整银行卡号+姓名、明确线下地址+电话组合），并标注仍待业务确认；不自行扩大自动拒绝范围。 | 文档迭代后定义/示例落入 Spec，并通过适用独立文档门禁或业务确认。 |
| `N-002` | “相同内容可合并审核”未明确跨用户边界，可能误共享不同用户相同文本的审核结果。 | 明确仅同一 `entityId` 下相同内容版本的连续提交可合并，保留 `ownerId`/版本隔离；不改变未确认的实现方案。 | Spec 明确实体/所有权边界并通过适用复核。 |
| `N-003` | 队列重试写“有限次数和退避”，未给出次数范围，SLO 与验收难以复现。 | 增加建议范围（如 3～5 次）并标注待业务/产品确认，不在本 Issue 冻结最终数值。 | 重试次数、退避与超限转人工语义形成可测试定义并通过适用复核。 |
| `N-004` | AI 解析失败仅写“重试一次”，没有退避策略；瞬时限流时可能立即再次失败。 | 增加建议退避区间（如 200～500ms），并明确失败仍 fail-closed/转人工；最终参数待确认。 | 退避、重试和失败转人工规则可测试且通过适用复核。 |
| `N-005` | 用户可见文案当前仅规划中文，但 §2.3 提及其他语言/国家号码，语言范围未闭合。 | 明确首期文案语言范围（例如仅中文）及多语言作为后续项；不自行扩大首期范围。 | 语言范围与后续边界写入 Spec 并通过适用复核或业务确认。 |
| `N-006` | URL/嵌入图片内容风险未在审核范围与公开渲染边界中明确；当前仅说明不抓取 URL、图片 OCR 非首期范围。 | 增加公开 URL 的安全渲染约束（如 `nofollow`/`noopener`）及图片/嵌入内容的非范围说明，另由安全复核确认；不把该建议写成已完成实现。 | URL/嵌入内容边界与渲染/安全复核引用可追溯并通过适用门禁。 |
| `N-007` | 分阶段计划缺少时间估算；未授权草案不冻结排期，但进入实施授权前缺少排期输入。 | 标注时间估算待 0036 owner 登记后由各阶段负责人提供；不在本 Issue 代填工期。 | 各阶段负责人提供估算并形成可追溯排期输入，适用门禁通过。 |

## Round 3/3 非阻塞发现逐项台账

Round 3/3 报告结论为 `PASS_WITH_NONBLOCKING_OPEN_ISSUES`，0 项 `SERIOUS`、6 项 `NON_SERIOUS`。以下 NS 项追加追踪；Round 3 为本 Spec 的最后允许审查轮次，不启动第四轮。

| 台账项 | 发现与证据 | 建议处置（非冻结方案） | 未来关闭触发 |
| --- | --- | --- | --- |
| `NS-001` | `appeal_pending` 作为独立中间状态出现，但未列入 §6.1 核心状态枚举。 | 将其加入核心状态清单，或明确其为独立申诉中间状态并交叉引用 §7.1。 | 后续实质文档迭代完成状态枚举/交叉引用并通过适用门禁；不启动第四轮。 |
| `NS-002` | §6.1 称 `deleted` 不是审核状态，但 §6.2.1 与验收测试又把它写入转换/状态标签，术语口径不一致。 | 将其表述为软删除生命周期标记并避免与审核状态混称，或明确其为独立生命周期状态。 | 后续实质文档迭代统一术语并通过适用门禁；不把该项视为生产缺陷。 |
| `NS-003` | `rejected → draft → pending_review` 可通过改变内容版本避开仅针对申诉的限流/连续 hash 锁，缺少独立重提交频率边界。 | 如生产出现异常重提交量，再增加按 entity 的滚动窗口提交上限；当前仅登记观察项，不提前冻结数值。 | 生产观察出现异常并形成确认的频率限制，或业务方确认无需新增限制。 |
| `NS-004` | “连续维持原判累计达到第 3 次”未说明初始自动拒绝是否计入计数。 | 明确计数从连续被驳回的申诉开始，初始自动拒绝是否计入需在后续文档/业务确认中写清。 | 后续实质迭代明确计数起点并通过适用门禁。 |
| `NS-005` | §4.2 步骤 2 使用“先”字样，但前面已有步骤 1，容易造成执行顺序文字歧义。 | 删除“先”或重排步骤，使文字与编号顺序一致；不改变已确认的检测顺序。 | 后续实质文档迭代修正措辞并通过适用门禁。 |
| `NS-006` | 未定义用户在 `appeal_pending` 中放弃申诉、转而编辑内容的路径。 | 在 UX/实现阶段明确是否允许 `appeal_pending → draft`，或要求先完成申诉；新提交仍须经过完整审核。 | 业务/产品确认该边界并形成可追溯 UX/实现验收口径。 |

## SERIOUS 修订边界（不并入本 Issue）

- Hermes Round 1 的 F-001～F-007 已由独立 Document QA 修订并在 Round 3/3 复核通过；本 Issue 仅保留该历史证据，不修改、不验收、不重新开启这些严重项。
- 严重主题保留为：SLO 数学矛盾、NFKC 与同形检测顺序、核心高置信命中定义、恢复重审语义冲突、AI 供应商日志/数据处理、合法数字上下文规则、状态机非法转换清单。
- Round 3/3 已无未解决 `SERIOUS`；NS-001～NS-006 与 N-001～N-007 均不得改变本 Issue 的 `NON_BLOCKING` 属性或被误记为 0036 已获业务确认/实现授权。项目审查上限已用尽，不启动第四轮。

## 依赖、恢复与关闭门禁

- 当前保持 `open / NON_BLOCKING_DOCUMENT_REVIEW`；`ISSUE-0036` 继续保持 `open / USER_CONFIRMATION_PENDING`，其业务方案与实现门禁不因本 Issue 登记而改变。
- 最小解除条件：获业务方/项目总负责人明确的 0036 文档迭代授权；N-001～N-007 与 NS-001～NS-006 逐项形成可核验修订记录并通过适用的独立文档门禁。
- 关闭条件：N-001～N-007 与 NS-001～NS-006 共 13 项均完成适用处置，Round 1/Round 3 source/report 关系与修订后的 0036 Spec 可追溯，且 ISSUE 管理员收到 owner 归属的独立复核证据；不得因 Round 3 通过或 0036 进入下一阶段而自动关闭。
- 唯一下一步：等待业务方/项目总负责人确认 0036 Spec 的业务门禁与后续实质文档维护；Round 3 已是最后审查轮次，不启动第四轮，本 Issue 不进入实现或部署。

## 2026-08-10 文档债务处置矩阵独立复核登记

- 只读输入一：`规划文档/产品迭代/2026-08-10-0035-0037-0038-非阻塞文档债务处置矩阵.md`，SHA-256=`85FFBA55B8F269745F0E577CB86347D59669225AF512633803D4330398E45D94`。
- 只读输入二：`规划文档/产品迭代/2026-08-10-0035-0037-0038-非关键勘误与交叉引用补充.md`，SHA-256=`F9172407A41182C2C84920DA9638D2ACCC8EAA9C7D69F3176865BDE27CCF43C3`。
- ISSUE 管理员逐项复读两份输入及 K/G 锚点；补充文件第 5 节逐项覆盖本 Issue 的 B 项 `N-001/N-005/N-007/NS-001/NS-002/NS-004/NS-005`（7/7），不是以产品经理自证替代来源核对。
- 处置计数登记：A=0、B=7（已形成补充 binding 文本，仍需后续授权窗口落到 canonical/适用文档）、C=5（N-002/N-003/N-004/N-006/NS-006 仍需实现、独立复核、生产观察或业务确认）、D=1（NS-003 留待生产观察/后续版本复评）。
- 当前状态仍为 `open / NON_BLOCKING_DOCUMENT_REVIEW`；`ISSUE-0036` 继续 `open / USER_CONFIRMATION_PENDING`，本 Issue 不静默通过 0036 业务门。owner=ISSUE 管理员；最小解除条件=一次明确授权的非关键文档维护窗口处理 B，并由 0036 owner/业务方完成 C/D 门禁；唯一下一步=保持 B/C/D 追踪并等待 0036 业务确认与对应实现/生产观察证据。

## 2026-08-10 非关键文档维护批次独立复核登记（历史快照；已由当前补充复核更新）

- 只读维护批次：`规划文档/产品迭代/2026-08-10-0035-0037-0039-非关键文档维护批次.md`，SHA-256=`2ADD34D2E2E659253F23419E484D9F29A9D7FA94F55B6E9AD97CB4904FF6E74D`；产品经理记录 SHA-256=`0B169780758A5B82B4D033106C3F74F0AC110846D0E14105657D523D40BC977A`。
- ISSUE 管理员完整复读维护批次、处置矩阵 SHA=`85FFBA55B8F269745F0E577CB86347D59669225AF512633803D4330398E45D94`、勘误补充 SHA=`F9172407A41182C2C84920DA9638D2ACCC8EAA9C7D69F3176865BDE27CCF43C3`，并逐项对照 K/G 等只读锚点；未接受产品经理自证替代来源核对。
- 逐项映射：A=0；B=7（`N-001/N-005/N-007/NS-001/NS-002/NS-004/NS-005`）由补充文件第 5 节形成 binding；C=5（`N-002/N-003/N-004/N-006/NS-006`）仍需实现、跨账号负测、独立复核、生产观察或业务确认；D=1（`NS-003`）留待生产观察/后续版本复评。


## 2026-08-10 当前 canonical 交叉引用与后续决策入口独立复核

- 只读补充：`规划文档/产品迭代/2026-08-10-0035-0038-当前canonical交叉引用与后续决策入口补充.md`；SHA-256=`2931DE0DF7A6CF4C2BF45EEE09C2F9B07C69B378C212F623C300A80CDD9A24E5`；12758 bytes / 121 lines，UTF-8 无 BOM、无 NUL。产品经理记录 SHA-256=`131CC1138C67710A8D75762132F5682E4DBB011D6C16E8A70AB806DAAA703E5B`。
- ISSUE 管理员独立回读补充文件、当前 canonical 与既有来源，确认 7 项 B 候选均有当前路径/hash/责任与保守边界：`N-001/N-005/N-007/NS-001/NS-002/NS-004/NS-005`。这只是文档交叉引用与决策入口证据，不代表 ISSUE-0036 实现、独立复核、生产观察或业务验收通过。
- C=`N-002/N-003/N-004/N-006/NS-006`（5）继续保持 Open；D=`NS-003`（1）继续保持观察项。当前计数仍为 `A=0 / B=7 / C=5 / D=1`，本 Issue 不满足关闭条件。
- 唯一下一步：由 0036 owner/业务/UI/安全责任侧补齐 C/D 的实现、独立复核、生产观察或业务决策证据；真实 provider、数据库、付费与生产动作仍按门禁冻结。ISSUE-0038 继续 `open / NON_BLOCKING_DOCUMENT_REVIEW`。
