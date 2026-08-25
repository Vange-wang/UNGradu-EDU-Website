# ISSUE-0036：家长需求与老师资料的联系方式快速智能审核

## 基本信息

- Issue ID：`ISSUE-0036`
- 类型：future feature / content safety review planning
- 状态：`closed`
- 工作流状态：`WORKFLOW_COMPLETE`（仅 ISSUE-0036 自身；项目总 workflow 仍为 `WORKFLOW_ACTIVE`）
- 阶段口径：本 Issue 按 2026-08-25 “人工审核延期、暂缓需求/范围调整后关闭”口径适用关单；这不是生产智能审核、生产人工审核、AI provider、flag-on、自动公开、部署、生产观察或回滚演练完成。历史 open/USER_CONFIRMATION_PENDING 阶段与原生产合同继续保留在下文历史记录中。
- 优先级：P1（待业务方确认后再重新排序）
- 来源：业务方原话：“增加一个issue，家长端或者老师端提交家教信息和老师信息之后要有个快速审核期，审核提交的内容里面有没有夹杂联系方式，邮箱、电话、微信号、qq号等等，尤其注意很长的数字，你先推荐审核方法，我是想的ai智能审核”；随后明确：“那这个先记录吧，之后再做决策，先按spec文档开始行动开发”。本轮仅执行登记授权。
- 当前责任：ISSUE 管理员维护已关闭 canonical、总表与连续性；未来若重新启用联系方式审核，必须重开 ISSUE-0036 或建立明确继任 Issue，重新经过 Spec、实现、独立复核、部署/生产和业务验收。

## 问题与当前代码缺口（只读事实）

- 家长需求的 `childIntro` 当前以基础规则识别连续大陆手机号和少量微信关键词，并另有门牌地址规则；未形成对邮箱、QQ、座机、拆分数字、中文数字、谐音、变体、网址等联系方式形态的完整覆盖。
- 老师资料的 `abilityDescription` 当前以基础规则识别连续大陆手机号和少量微信关键词；同样未形成上述联系方式形态的完整覆盖。
- 当前读取的相关字段来自 `Code文档/features/parent-needs/parent-need.ts` 与 `Code文档/features/tutor-profiles/tutor-profile.ts`；本 Issue 不修改这些文件。
- 其他会公开展示的用户可控文本字段尚未完成范围盘点；老师证明图片当前只记录元信息且不公开，是否纳入 OCR 审核尚未决策。

## 候选方向（非冻结方案）

- 业务方已表达希望采用 AI 智能审核；当前仅记录候选组合：本地确定性规则 + 专业 AI 内容审核 + 模糊结果进入待复核队列。
- 该组合只是后续评估输入，不代表已决定 AI 供应商、模型、部署位置、提示词、数据保留、拦截阈值或人工复核流程。
- “明确联系方式退回修改、模糊内容短暂待审核、审核服务失败不得直接公开”仅为待业务确认的候选处理语义，不得视为已批准规则。

## 候选范围与明确非范围

- 待评估范围：家长需求与老师资料的创建、修改路径，以及所有会公开展示的用户可控文本字段；最终字段清单需单独确认。
- 首期候选内容包括联系方式识别、风险判定、审核失败路径和发布前状态控制；不预设具体时限、阈值、供应商或人工队列规则。
- 明确非范围：本轮不改联合 Spec，不改变最终 Spec snapshot；不修改 ISSUE-0031/0032/0034/0035 的状态或 D4/D6/D7 顺序门禁，不重开已 `closed / WORKFLOW_COMPLETE` 的 ISSUE-0033；不决定图片 OCR 范围；不授权生产人工闭环、AI 出域、自动公开或部署。

## 依赖、决策待定项与边界

- 依赖：14 项推荐方向的本地/集成/合成队列门禁；生产人工闭环、AI 出域与自动公开还依赖实名人工审核 owner、供应商/DPA、生产 key 及业务验收；`ISSUE-0033` 已 `closed / WORKFLOW_COMPLETE`，本 Issue 不阻塞 0031/0032/0034 的后续门禁或开发顺序。
- 待决策项至少包括：联系方式类型与变体覆盖；本地规则与 AI 的职责边界；供应商/模型与数据隐私；通过、退回、待复核、服务失败的状态语义；拦截与误报阈值；审核时限；人工复核角色和队列；重试、回滚、审计与申诉；所有公开文本字段清单；是否纳入图片 OCR。
- 不自行定义最终 AI 供应商、拦截阈值、审核时限、人工复核方式或 OCR 范围。

## 关闭门禁与唯一下一步

- 关闭前必须有业务方确认的审核目标与处理语义、明确的产品/技术 Spec、实现与验证证据、独立适用复核，以及生产/业务验收；不得以本次登记或候选方案说明代替这些门禁。
- 最小解除条件：本地/集成/合成队列验证证据齐备；生产人工闭环另须业务方确认审核目标、公开字段范围、风险接受度和处理语义，并补齐实名 owner、供应商/DPA 与生产 key。
- 当前保持 `open / USER_CONFIRMATION_PENDING`，属于独立 `NON_BLOCKING` Issue；本地/集成/合成队列已获授权，但不代表生产通过或 Issue 关闭。
- 唯一下一步：原实现 owner 在本地/集成/合成队列范围内按门禁推进；业务方补齐实名审核 owner、供应商/DPA 与生产 key 前，不启动生产人工闭环、AI 出域、自动公开或部署。

## 2026-08-25 适用关单：人工审核延期、暂缓需求/范围调整后关闭

- 关闭状态：`closed / WORKFLOW_COMPLETE`，仅表示 ISSUE-0036 自身在已批准的 material scope adjustment 下关闭；项目总 workflow 仍为 `WORKFLOW_ACTIVE`。
- 关闭语义：业务方明确“人工审核就先不做，先放着”，并在获知旧合同 `CANNOT_CLOSE / KEEP_OPEN_DEFERRED` 必须先完成 material scope adjustment 后明确“继续”。范围调整 addendum 取代旧裁决的适用前提，但不追溯改写旧裁决，也不证明原始生产闭环完成。
- 文档门：addendum SHA-256=`CC7C520B549D2F8449119A533C455D725331957B2F4EA5AE321F2F317110DA2A`；Hermes R1 SHA-256=`E54768E4CA0BB2516E67EB503AAB7C7F38E14632772F5054A66649FED5A2C0D6`，唯一 S1 已由 QA 修订；Hermes focused R2 SHA-256=`61AC1D365A483C6230083B6C604D0F39203BE2C461D7591AAF9619BD8D5A8AE6`，metadata SHA-256=`2DDEE947E1089B109C8EF84150E0C1BE026869B13EFBE29101E77A72BA647547`，`deepseek-v4-pro` / `2/3` / `canonical_source_unchanged=true` / `PASS_WITH_NONBLOCKING_OPEN_ISSUES` / SERIOUS=0；QA ledger SHA-256=`8D47B5F8582E1FAB596DFB812179E133F8D24A1A59338FAAFB81049B90123658`。按 vange-workflow，SERIOUS=0 后文档门通过，本周期不启动 Round 3。
- 业务与产品边界：bounded 产品验收 SHA-256=`FA56F5D140D6E053321C173CB3ECA591358F75FBC7172AA88CDEE6EC56392789`，结论=`PRODUCT_ACCEPTANCE_PASS`、`DEPLOYMENT_ALLOWED_FLAG_OFF_ONLY`、`PRODUCTION_FLAG_ON_BLOCKED`；仅覆盖 bounded local/integrated/synthetic 范围，不能替代生产验收。
- 实现证据：V5 branch=`V5-issue-0036-contact-review-closure`、commit=`f8ad5d009c5483d6791699d2c2394765a23fb2f2`、tree=`19b903a8a4e6e2ece653c2c175cbcbbdfadae352`；技术/UI 独立复核通过，`659 passed / 1 existing skipped`，build `18/18`。该证据绑定的是既有 bounded local/synthetic 交付，不把当前工作树 HEAD 或该提交写成生产 revision。
- 生产边界：`CONTACT_REVIEW_ENABLED=false`、`CONTACT_REVIEW_SCHEMA_READY=false` 保持；未启用 reviewer/Secret/审核入口、AI provider/出域、flag-on、自动公开、生产观察、回滚演练或部署。数据库/付费及其他 Issue 不因本次关闭改变。
- 非阻塞债务：范围调整 addendum R1 N1-N5、R2 N-001/N-002/O-3 已追加至 ISSUE-0043；ISSUE-0043 保持 `open / NON_BLOCKING_DOCUMENT_REVIEW`，不阻止本次“暂缓需求关闭”，但其未来触发条件仍须由适用 owner 处理。
- 未来恢复触发：业务方若重新决定启用联系方式审核，必须重开 ISSUE-0036 或建立明确继任 Issue，重新经过 provider/人工范围 Spec、用户确认、实现、测试、独立技术/UI复核、适用部署/生产证据、产品/业务验收和 ISSUE 关单证据；在新链路完成前双 flag 继续为 false，不得因本次暂缓关闭自动启用。
- 本关闭不表示 ISSUE-0031、ISSUE-0035、ISSUE-0038、ISSUE-0043 或其他 Open Issue 关闭，不表示项目 workflow 完成。

## 阶段变更 Spec 最终门禁同步（2026-08-10）

- 最终 canonical Spec snapshot SHA-256=`DBB40E250A6847DBF8109EB5D759CD558F74155CD5FE2C2691C5BACC48D5F14A`；QA ledger SHA-256=`4119E877E30AED483F0287C4DD53B99055968484EB0B8E887A0E73078480CC51`。
- Hermes Round 3/3 report SHA-256=`E62B4CBCB8E938DD744B85A0D4C80930FB758CAE6010CB8F99274C60A3FA9F5D`；metadata SHA-256=`A43D97A71CE19F2D3AC2182AE4DC0F5F54D44B22E2C9B4B7ADBA6982CA7653EB`；`deepseek-v4-pro`，`canonical_source_unchanged=true`，verdict=`PASS_WITH_NONBLOCKING_OPEN_ISSUES`（0 SERIOUS / 5 NON_SERIOUS），禁止第四轮。
- 当前获授权范围为 14 项推荐方向的本地实现、集成验证与合成队列演练准备；不授权生产人工闭环、AI 出域或自动公开。缺少实名人工审核 owner、供应商/DPA 或生产 key 时必须 fail-closed。
- 唯一下一步：原实现 owner 在本地/集成/合成队列范围内逐级验证；业务方随后补实名审核 owner、供应商/DPA 与生产 key，并另行通过生产人工闭环、AI 出域/自动公开门禁后，Issue 才可进入后续验收。

## 2026-08-10 补充授权边界

- 用户授权非金钱的本地/集成/合成队列代码、测试、Git、免费配置、部署与受控验收按门禁持续推进；付费采购仍暂停。
- 广泛授权不等于密钥明文泄露、绕过 CAPTCHA、虚构实名人工 owner 或跳过独立复核；无 owner、供应商/DPA、生产 key 时仍禁止生产人工闭环、AI 出域与自动公开。

## Spec 文档门禁连续性（Round 3/3）

- 当前 Spec：`规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-联系方式快速智能审核-spec.md`；SHA-256=`005EA5F2490DC2E43A134BA0421EFBD357179C90E29A6F2AB560F6F61A97B437`。
- Hermes Round 3/3 报告：`规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-hermes-round-3.md`；report SHA-256=`B3749F4C713C743FCF2510B1F7BE0F917B92EE4265D916947FBA8AFB178AE470`。
- 独立结论：`PASS_WITH_NONBLOCKING_OPEN_ISSUES`；0 项 `SERIOUS`、6 项 `NON_SERIOUS`，Round 1 的严重修订已通过复核；按项目审查上限不启动第四轮。
- NS-001～NS-006 已登记至独立 `ISSUE-0038`，不并入本 Issue 的功能门禁；文档门禁通过不等于生产验收或本 Issue 关闭，本地/集成/合成队列授权仍受本 Issue 的 fail-closed 边界约束。
- 当前仍有业务侧字段范围、联系方式类别、自动拒绝精度、AI/人工路由、SLO/阈值、供应商/地域/DPA/预算、保留期、未成年人/OCR、旧版本语义、人工复核责任及权限等待确认门禁；0036 继续保持 `open / USER_CONFIRMATION_PENDING`。
