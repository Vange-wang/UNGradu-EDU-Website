# ISSUE-0036 Document QA 修订记录

## 1. 接管与输入

- 角色：Document QA v2.3.0
- 会话 ID：`019fbd2e-5b12-7f41-88db-f30489656a5f`
- 统一标题：`DocumentQAv2.3.0`
- 唯一维护 owner：本会话的 Document QA；仅维护命名 Spec 的 SERIOUS 修订和本 ledger，产品最终确认、Hermes、Issue、代码和部署由各自 owner 负责。
- 任务：ISSUE-0036 Round 1 SERIOUS 完整批次一次性修订
- 审查计数：Round 1/3（共享计数已使用 1 轮，最多剩余 2 轮；不重置）
- 输入 Spec：`规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-联系方式快速智能审核-spec.md`
- 输入 Spec SHA-256：`0F6B7E30750E2D5733AF18D9D8C693041BC3E4F8D8921F6AC0DC2784C345A2F6`
- Hermes Round 1 报告：`规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-hermes-round-1.md`
- Hermes 报告 SHA-256：`CF9A9FF6170DC0F53DD29584D4B0075F18424AA76CD637791C7BA8B302DEA7BD`
- Hermes metadata：`规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-hermes-round-1.md.metadata.json`
- Hermes metadata SHA-256：`0609AD394CB1E9C66D244480267F75DAD1590AA786C411E21D28D3E96F71AB5C`
- 输入判定：三个输入 hash 均匹配；Hermes verdict 为 `REWORK_REQUIRED`，完整 SERIOUS 批次为 F-001～F-007。
- 冻结边界：只处理 F-001～F-007 及其受影响的六项验收维度；N-001～N-007 已由 ISSUE-0038 登记，本批不处理。

## 2. 一次性 SERIOUS 修订映射

| Finding | 原位置与风险 | 新位置 | 修订理由 | 验证证据 |
| --- | --- | --- | --- | --- |
| F-001 | §9 自动审核路径为 p95≤10 秒但硬超时 5 秒，未分离提交响应与审核耗时 | §9 SLO 表、§9 埋点段落、§8.1、§10.1/10.3 | 固定端到端 p95≤10 秒、硬超时 15 秒；提交接口仍快速返回安全 pending；超时只能待审/人工且不公开，业务可收紧不可放宽 | 回读 `p95 ≤10 秒`、`硬超时 15 秒`、`pending_review/needs_manual_review`、分层 p50/p95/p99 和故障注入验收 |
| F-002 | §4.2 先 NFKC 后识别混淆，未保证原始偏移/信息损失可追溯 | §4.2、§10.1 normalization/offset 验收 | 先扫描未经 NFKC 的零宽、控制、同形等混淆并保留原索引，再建立 offset map；双视图不一致、越界或信息损失 fail-closed | 回读“先原始 Unicode 扫描”“offset map”“映射越界/信息损失 → needs_manual_review”及单元断言 |
| F-003 | §5.1 只有类别示例，缺少版本化高置信最小框架和长数字/单关键词边界 | §5.1.1、§9、§10.1 golden corpus | 固定 policyVersion、完整模式、上下文/合法数字排除、可映射偏移且 AI 不得单独决定；邮箱、手机、座机、QQ、微信、URL/社交 ID 有最小规则；纯长数字/中文数字/单关键词不自动拒绝 | 回读高置信联合条件、联系人类别规则、合法上下文清单及 golden cases |
| F-004 | §6.1 将恢复重审写成推荐默认，未禁止 `deleted → published`，删除期间约束未完全锁定 | §6.1、§6.2.1、§10.1/10.2 | 统一恢复进入 `pending_review`，恢复前校验 owner/参与者/版本/策略；删除期间聊天只读且无消息/联系方式；禁止 `deleted → published`，复核前不公开 | 回读允许/禁止转换表、删除/恢复集成验收和 390px 文案/状态验收 |
| F-005 | §8.3 仅有平台日志和泛化训练禁用语句，未锁定供应商原始请求/响应留存、DPA、地域、子处理者和删除/保留门 | §8.2、§8.3、§10.2/10.3/10.4 | 原始请求/响应默认零留存；禁止训练、广告画像和二次用途；必须确认 DPA、地域/跨境、子处理者、删除/保留、访问/密钥与日志政策；未知策略或超出 24 小时的供应商 fail-closed | 回读 `REVIEW_RAW_RETENTION_HOURS=0`、≤24h 例外及供应商协议/日志证据验收；仅记录 hash/类别/版本/耗时等元数据 |
| F-006 | §5.1 未定义合法数字上下文排除，可能误杀年份、价格、成绩、地址等 | §5.1.1、§10.1 | 版本化列出年份/日期时间、价格、成绩等级、地址房间、数量时长和纯长数字排除；先看联系方式上下文，重叠或冲突转人工 | 回读排除清单、联系方式优先/冲突人工规则及正常数字 golden cases |
| F-007 | 原状态机没有穷举允许/禁止转换，服务失败/超时/预算或 stale 旁路的禁止发布边界不完整 | §6.2.1、§8.1/8.2、§10.1/10.2/10.3 | 明确允许转换与所有关键禁止转换；任何超时、预算熔断、输出/队列/审计失败、版本/hash/owner/权限不确定都只能 pending/manual，禁止前端或供应商旁路发布 | 回读转换穷举、12 项 fail-closed 矩阵、预算熔断和 provider stub 故障注入验收 |

## 3. 六项受影响验收维度

1. **归一化/偏移**：原始视图先于 NFKC 扫描；原文索引、offset map、越界、信息损失和双视图不一致均有断言。
2. **URL/社交**：协议 URL、www/域名、短链、微信/QQ/社交变体有 golden cases；只解析不联网，并按上下文进入 allow_candidate/人工/拒绝路径。
3. **12 项 fail-closed**：检测器失败、标准化/偏移失败、AI 超时、AI 不可达、预算熔断、输出解析错误、人工队列不可用、contentVersion 不一致、contentHash 不一致、owner/权限不确定、提示注入或不可信指令、审计失败均保持待审/人工且不公开（提示注入与不可信指令合并为一个测试项，矩阵总数严格为 12）。
4. **提示注入**：忽略规则、直接发布、调用 URL、泄露系统提示等样本不得触发工具、不得公开，进入人工/待审并保留审计。
5. **成本熔断**：provider stub/隔离 key 验证预算达到上限后停止外部调用、保持 pending/manual、告警/恢复/幂等可追踪，不能由重试、前端或降级供应商绕过。
6. **390px 移动端无障碍**：pending、人工、拒绝、申诉和长文案在 390px 下无裁切/横向溢出；焦点、错误关联、屏幕阅读器和触控目标均有真实页面/DOM 或等价操作证据。

## 4. 产物与门禁

- 输出 Spec SHA-256（修订后）：`9410FDA4E4B7A6E9474E96239C916D5A79AC32627159E89F6A5A4A8F29F313EC`（36672 bytes；`rg -n '^'` 末行 537；ledger 写入后已复核）。
- QA 状态：`QA_DOCUMENT_REWORK_COMPLETE`；这是 Document QA 的修订完成，不是 Hermes 通过、TECH_VERIFIED、BUSINESS_ACCEPTED 或 Issue 关闭。
- 原 Hermes 报告与 metadata 未修改；其输入 SHA-256 必须保持本记录第 1 节所列值。
- 未修改旧联合 Spec、旧 QA ledger、Issue、代码、UI、平台配置；未运行 Hermes/npm/Git mutation/deploy；未自我批准。
- 本轮唯一下一步：总负责人冻结输出 source hash，发起 Hermes Round 2；Round 2 只复核 F-001～F-007 及受影响回归。第三轮后仍有 SERIOUS 时进入 `DOCUMENT_REVIEW_LIMIT_REACHED`，禁止自动第四轮。

## 5. Round 2/3｜申诉 SERIOUS 最小修订

- 角色/会话：Document QA v2.3.0 / `019fbd2e-5b12-7f41-88db-f30489656a5f`；共享计数为 Round 2/3，剩余且仅剩 Round 3/3，不重置。
- 输入 Spec SHA-256：`9410FDA4E4B7A6E9474E96239C916D5A79AC32627159E89F6A5A4A8F29F313EC`。
- Round 2 报告：`规划文档/Spec文档/Release_version_Spec/2026-08-10-issue-0036-hermes-round-2.md`；SHA-256 `980EC8B46DBFBADF932ADF50878CE89A4069ABFE6CC4BE509C4DB9AC35161717`。
- Round 2 metadata SHA-256：`29F30C8245A97E5C781DCF2255CBD983DAC2140ECFA2218CA40EB3A3BEF5AF38`；verdict `REWORK_REQUIRED`，仅 S-001/S-002，无 NON_SERIOUS。
- 冻结决策来源：`规划文档/产品经理工作记录.md` 的 `PRODUCT_0036_APPEAL_DECISION_READY`；只落入申诉状态、滥用防护、SLO 与对应验收，不扩大到 ISSUE-0038 或其他产品需求。

### 5.1 SERIOUS 映射

| Finding | 原位置与风险 | 新位置 | 修订理由 | 验证 |
| --- | --- | --- | --- | --- |
| S-001 | §6.1 只有 `rejected → draft`，§6.2.1 的“申诉进入 draft 或 needs_manual_review”未定义触发条件、独立状态、发布门和 SLA | §6.1、§6.2.1、§6.3、§9、§10.1、§10.3 | 不改内容申诉唯一走 `rejected → appeal_pending → needs_manual_review → published/rejected`；改内容唯一走 `rejected → draft → pending_review`；`appeal_pending` 不直达 published，reasonCode 必填，补充说明同一审核，发布前校验 policyVersion/contentVersion/owner/contentHash/审计 | 回读两条状态路径、原因码/文案、申诉 SLO、golden path 和服务端当前版本/审计断言 |
| S-002 | §6/§8 未限制用户重复申诉，无法防止人工队列耗尽或模式探测 | §7.1、§9、§10.2、§10.3 | 同 owner+entity+version 24h 最多 1 次；重复 key 幂等、冲突 key 拒绝；同 contentHash 连续维持原判第 3 次锁 7 天，锁定仅审计不入队；删除/非 owner/stale/冲突/锁定 fail-closed，服务端与前后端不可绕过 | 回读计数不可刷新清零、重复/跨账号/stale/锁定/审计失败负测、SLO 超时告警与不公开断言 |

### 5.2 受影响验收映射

- **AC-MISS-01**：§10.1 新增不改内容申诉 golden path、修改内容重审 path；验证公开列表/详情、聊天和联系方式门控、reasonCode、补充说明及最终发布条件。
- **AC-MISS-02**：§10.2 新增 24h 第二次申诉、重复/冲突 idempotencyKey、跨账号、stale、删除态、7 天锁定和审计写入失败负测；验证拒绝或幂等、不重复入队/发布、不恢复聊天/联系方式。
- **申诉 SLO**：§9 与 §10.3 同时验证入队 p95≤30 分钟、裁决 p95≤4 小时、99%≤1 个工作日；超时保持 pending/manual、不公开并告警。

### 5.3 输出与边界

- 输出 Spec SHA-256：`005EA5F2490DC2E43A134BA0421EFBD357179C90E29A6F2AB560F6F61A97B437`；`39,996 bytes`；`rg -n` 末行 `575`。
- QA 状态：`QA_DOCUMENT_REWORK_COMPLETE`；不是 Hermes 通过、TECH_VERIFIED、BUSINESS_ACCEPTED 或 Issue 关闭。
- Round 2 报告/metadata 原件未修改，输入 hash 保持本节所列值；未处理 ISSUE-0038，无其他 NON_SERIOUS。
- 本轮仅写入命名 Spec、本 ledger 和本角色工作记录；未运行 Hermes/npm/Git mutation/deploy，未自我批准。
- 唯一下一步：总负责人冻结新 source hash 并发起共享计数下 Hermes Round 3/3；第三轮后仍有 SERIOUS 必须进入 `DOCUMENT_REVIEW_LIMIT_REACHED`，禁止自动第四轮。
