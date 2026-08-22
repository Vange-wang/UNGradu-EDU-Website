# ISSUE-0036：家长需求与老师资料的联系方式快速智能审核

## 基本信息

- Issue ID：`ISSUE-0036`
- 类型：future feature / content safety review planning
- 状态：`open`
- 工作流状态：`USER_CONFIRMATION_PENDING`
- 阶段口径：0036 Spec Hermes Round 3/3 已为 `PASS_WITH_NONBLOCKING_OPEN_ISSUES`、0 项 `SERIOUS`，Round 3 的 NS-001～NS-006 由独立 `ISSUE-0038` 追踪，禁止第四轮。业务方已授权 14 项推荐方向进入本地/集成/合成队列实施；无实名人工审核 owner、供应商/DPA/生产 key 时，禁止生产人工闭环、AI 出域或自动公开。本 Issue 保持 `open / USER_CONFIRMATION_PENDING`，不关闭
- 优先级：P1（待业务方确认后再重新排序）
- 来源：业务方原话：“增加一个issue，家长端或者老师端提交家教信息和老师信息之后要有个快速审核期，审核提交的内容里面有没有夹杂联系方式，邮箱、电话、微信号、qq号等等，尤其注意很长的数字，你先推荐审核方法，我是想的ai智能审核”；随后明确：“那这个先记录吧，之后再做决策，先按spec文档开始行动开发”。本轮仅执行登记授权。
- 当前责任：原实现 owner 可在本地/集成/合成队列门禁内推进；生产人工审核 owner、供应商/DPA/生产 key 尚未具备，ISSUE 管理员仅维护本 Issue 台账。

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
