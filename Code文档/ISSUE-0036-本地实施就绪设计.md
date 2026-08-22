# ISSUE-0036 联系方式快速智能审核：本地实施就绪设计

> 状态：`LOCAL_IMPLEMENTATION_READY_DESIGN_ONLY`
>
> 本文是代码开发员的本地设计和验证边界，不是业务授权、Spec 改写、Issue 关闭或生产变更计划。

## 0. 依据、范围与硬边界

本设计以以下已冻结输入为依据：

- Spec：`D:\codex_project\家教对接website\规划文档\Spec文档\Release_version_Spec\2026-08-10-issue-0036-联系方式快速智能审核-spec.md`
  - SHA-256：`005EA5F2490DC2E43A134BA0421EFBD357179C90E29A6F2AB560F6F61A97B437`
- Hermes Round 3：`0 SERIOUS / PASS_WITH_NONBLOCKING_OPEN_ISSUES`
  - 报告 SHA-256：`B3749F4C713C743FCF2510B1F7BE0F917B92EE4265D916947FBA8AFB178AE470`
- 业务门禁决策包：`D:\codex_project\家教对接website\规划文档\产品迭代\2026-08-10-ISSUE-0036-业务门禁决策包.md`
  - SHA-256：`AFFA051D5A78D91DE09D23276DB4452AAB874575907883F5257C189516305C73`

当前 14 项业务门仍未确认，Issue 仍处于 `USER_CONFIRMATION_PENDING`。因此本轮只形成设计，不创建审核集合、不接 AI、不改发布状态、不发送邮件、不触发联系方式旁路、不访问生产、不改 CloudBase/Cloudflare、不给 `.env.local` 写值、不运行 npm、不执行 Git mutation。后文“拟变更文件”均是门禁通过后的候选，不是本轮已授权的文件。

### 0.1 当前已有代码接入事实

以下是设计所依赖的现有边界；本轮不修改它们：

| 现有接入点 | 当前职责 | ISSUE-0036 接入原则 |
| --- | --- | --- |
| `D:\codex_project\家教对接website\Code文档\server\parent-needs.ts:677-925` | 家长需求保存、更新、所有者读取、公开读取；当前已具备 `version`、`managementState`、事务和审计相关路径 | 只在业务确认后，在服务端发布门前接入审核候选；保留 0033 所有权、版本、删除/恢复门禁 |
| `D:\codex_project\家教对接website\Code文档\server\tutor-profiles.ts:672-920` | 老师资料对称的保存、更新、所有者读取、公开读取 | 与家长需求共用审核契约，但保留两来源现有 API/数据契约；不把联系方式字段加入审核输入 |
| `D:\codex_project\家教对接website\Code文档\server\conversations.ts:482-774` | 会话、消息读取/发送及 0033 删除态只读门控 | 审核失败或 pending 不得放行消息/联系方式公开；不修改聊天数据流来代替审核状态 |
| `D:\codex_project\家教对接website\Code文档\server\contact-exchange.ts:358-786` | 联系方式交换创建、批准、拒绝、撤回、已授权资料读取 | 审核状态不合格时服务端再次读 source；不在客户端隐藏按钮后宣称安全 |
| `D:\codex_project\家教对接website\Code文档\server\contact-profiles.ts:61-109` | 联系资料读写 | 只允许作为严格的受保护数据源参与 D2 门控；不把 profile 正文送入审核，也不在审核日志记录正文 |
| `D:\codex_project\家教对接website\Code文档\server\api-utils.ts:1-95` | 认证读取、JSON 响应和错误状态 | 审核 API 复用服务端认证，不接受前端传 owner、published 或审核结论 |
| `D:\codex_project\家教对接website\Code文档\app\api\parent-needs\route.ts:16-38`、`app\api\parent-needs\[id]\route.ts:15-38` | 家长列表/发布及 owner item GET/PATCH/DELETE/restore 路由组合 | 只在 route 组合层调用审核门；不新增公开旁路 |
| `D:\codex_project\家教对接website\Code文档\app\api\tutor-profiles\route.ts:16-38`、`app\api\tutor-profiles\[id]\route.ts:15-38` | 老师列表/发布及 owner item GET/PATCH/DELETE/restore | 与家长完全对称，未确认前保持现有行为 |
| `D:\codex_project\家教对接website\Code文档\app\api\contact-exchange\route.ts:11-20` | 联系方式交换 GET/POST 组合 | 审核状态只通过服务端 source 复核；不得另增匿名端点 |

## 1. 目标架构与模块边界

推荐采用 Spec 的 Option B：确定性高召回规则层 + provider-neutral 的结构化 AI 路由 + 人工队列兜底。规则、AI、队列都只能产出审核候选和路由，不直接改变公开状态；最终公开发布必须经过服务端的当前版本、所有权、策略版本、审计和幂等门。

### 1.1 候选的未来模块（门禁通过后才可创建）

下列路径是候选模块名，方便独立复核和隔离 dirty worktree；本轮不创建：

| 候选文件 | 单一职责 | 禁止承担的职责 |
| --- | --- | --- |
| `D:\codex_project\家教对接website\Code文档\features\contact-review\types.ts` | 纯类型：来源、状态、决定、规则命中、版本、幂等和安全投影 | 不读取数据库、不调用网络 |
| `D:\codex_project\家教对接website\Code文档\features\contact-review\normalize.ts` | 原始视图扫描、NFKC、宽度/大小写/数字视图和 offset map | 不判定发布、不保存正文 |
| `D:\codex_project\家教对接website\Code文档\features\contact-review\rules.ts` | 版本化确定性规则、上下文和合法长数字排除 | 不调用 AI、不发消息/邮件 |
| `D:\codex_project\家教对接website\Code文档\features\contact-review\state.ts` | 状态机和纯 guard；由调用方注入当前 source snapshot | 不做持久化 |
| `D:\codex_project\家教对接website\Code文档\features\contact-review\provider.ts` | provider-neutral `ReviewProvider` 接口及本地 stub | 默认不得出网；不得接受任意 URL/工具 |
| `D:\codex_project\家教对接website\Code文档\features\contact-review\queue.ts` | 人工队列的纯契约和权限投影 | 不擅自指定审核 owner/工作时间 |
| `D:\codex_project\家教对接website\Code文档\server\contact-review\service.ts` | 事务边界、版本/幂等/审计写入，正式业务调用入口 | 不信任客户端结论，不绕过 source guard |
| `D:\codex_project\家教对接website\Code文档\server\contact-review\store.ts` | CloudBase/未来数据库的窄适配器 | 不暴露任意 collection/filter/write |
| `D:\codex_project\家教对接website\Code文档\server\contact-review\audit.ts` | 脱敏审核审计 projection | 不写原文、联系方式、prompt 或供应商 response |
| `D:\codex_project\家教对接website\Code文档\app\api\contact-review\route.ts` | 仅认证后的审核状态/人工操作端点 | 不提供匿名公开审核结果，不提供客户端 publish |
| `D:\codex_project\家教对接website\Code文档\tests\contact-review\*.test.ts` | 规则、状态、API、故障注入和隐私契约 | 不连接真实 CloudBase/供应商 |

物理集合/表名不在本轮冻结。候选逻辑记录可以是 `contact_review_candidates`、`contact_review_tasks`、`contact_review_idempotency` 和既有 `audit_events` 的新事件类型，但是否新建集合、是否沿用现有审计集合、索引和区域必须在 D4/D6/D7 门禁后由业务/技术负责人确认。设计中的逻辑接口必须先能由内存 fake 实现，不把候选名称当作生产 schema。

### 1.2 领域接口（逻辑契约，不是本轮代码）

```ts
type ReviewSourceType = "parent-need" | "tutor-profile";
type ReviewStatus = "draft" | "pending_review" | "needs_manual_review" | "rejected" | "published" | "deleted" | "appeal_pending";
type ReviewDecision = "allow_candidate" | "contact_likely" | "ambiguous" | "policy_or_input_error";

interface ReviewCandidateInput {
  sourceType: ReviewSourceType;
  sourceId: string;
  ownerUserId: string;             // 只取服务端 session
  contentVersion: number;
  contentHash: string;             // 规范化前后均可追溯，但不逆向正文
  fields: Array<{ field: "childIntro" | "abilityDescription"; value: string }>;
  policyVersion: string;
  ruleVersion: string;
  idempotencyKey: string;
}

interface ReviewSnapshot {
  sourceType: ReviewSourceType;
  sourceId: string;
  ownerUserId: string;
  contentVersion: number;
  contentHash: string;
  status: ReviewStatus;
  policyVersion: string;
  ruleVersion: string;
  updatedAt: string;
}

interface ReviewAuditProjection {
  auditId: string;
  sourceType: ReviewSourceType;
  sourceId: string;
  contentVersion: number;
  contentHash: string;
  from: { status: ReviewStatus; version: number };
  to: { status: ReviewStatus; version: number };
  decision: ReviewDecision | "manual" | "system_failure";
  reasonCode: string;
  actorType: "system" | "human";
  actorRefHash?: string;
  policyVersion: string;
  ruleVersion: string;
  occurredAt: string;
}
```

`ReviewSnapshot` 是服务端当前事实；任何 AI、队列或客户端结果都是候选结果，提交前必须重新读取 source 并比较 `contentVersion + contentHash + ownerUserId + policyVersion`。`ReviewAuditProjection` 禁止正文、命中片段、email/phone/WeChat/QQ、完整 prompt/response、token、IP 和供应商原始错误。

### 1.3 状态、版本与并发

1. 新建/编辑先产生新 `contentVersion` 和 `contentHash`，状态为 `pending_review`；编辑不直接覆盖当前 published 快照。
2. 规则命中、Unicode/offset 无法映射、AI 超时/预算、人工队列不可用、审计失败、owner/权限不确定，统一进入 `needs_manual_review` 或保持 `pending_review`，绝不公开。
3. 仅当前版本、当前 owner、当前策略/规则版本、合法人工决定和已写审计，才允许 `needs_manual_review -> published`。
4. `deleted -> published` 永远禁止；0033 恢复为 `deleted -> pending_review`，聊天保持只读、联系方式隐藏，重审通过后才恢复能力。
5. 人工决定在提交时再次比较版本/hash；过期结果丢弃并重新入队，不覆盖更新后的候选。
6. 所有变更采用服务端条件写/事务或等价原子适配；事务不可用、审计写失败、锁竞争和响应不确定都 fail-closed。

## 2. 标准化、确定性规则与隐私边界

### 2.1 固定 Unicode/NFKC 顺序

每个审核字段严格执行以下顺序，并在测试中固定顺序号：

1. 读取服务端允许的字段，记录 `contentVersion`、字段名、长度和 `contentHash`；超出业务确认的最大长度立即不公开并入人工队列。
2. 在 NFKC 前扫描零宽字符、控制字符、方向控制、全角/半角、连字、同形字、emoji、反向文本、分隔符和疑似中文数字；保存去标识化的 code-point 类别与原始 offset，不保存原文。
3. 对副本执行 NFKC、宽度/大小写/数字视图归一化，建立 normalized offset map；原始字符串不可被覆盖。
4. 同时在 raw view 与 normalized view 运行规则；offset 无法双向映射、两视图结论冲突或发生信息损失时只进入人工路径。
5. 仅对 URL 做语法解析，不发起 DNS/HTTP 请求；不把链接内容抓回审核。

### 2.2 规则层

规则结果必须包含 `ruleVersion`、类别、置信级别、原始/归一化 offset 的脱敏范围和 `legalNumberExclusion` 结论。自动高置信候选至少同时满足：完整 pattern、上下文支持、合法数字排除通过、offset 可追溯；单个关键词不得自动拒绝或发布。

- 联系类别候选：email、手机/座机、微信、QQ、URL/social ID、长数字、中文数字、Unicode/分隔符混淆。
- 合法长数字排除：1900–2099 年份、日期/时间、价格/预算、分数/年级、地址/房间号、数量/时长；联系方式上下文优先，冲突时人工。
- 长数字、中文数字、仅有联系方式关键词、语言/国家未知，默认 `ambiguous -> needs_manual_review`，不是自动拒绝。
- 不读取或推断 contact profile 正文、聊天正文、未公开图片、登录标识；`childIntro`/`abilityDescription` 之外的公开字段必须等业务确认后才能加入输入清单。

### 2.3 provider-neutral AI stub

```ts
interface ReviewProvider {
  classify(input: {
    approvedReviewCopy: string[];
    ruleProjection: unknown;
    policyVersion: string;
    providerRef: string;
    modelRef: string;
    regionRef: string;
    timeoutMs: number;
  }): Promise<{
    decision: ReviewDecision;
    schemaVersion: string;
    score?: number;
    reasonCode: string;
  }>;
}
```

默认实现是本地 deterministic stub：可注入 timeout、malformed schema、budget breaker、unreachable、prompt-injection 和 slow response；不出网、不读 secret、不调用工具/URL/命令。生产适配器必须固定 provider/model/region/policy 引用，最多一次受控重试；任何失败、未知供应商日志政策、地域/DPA/子处理者不明均保持人工状态。AI 只能路由/排序，不能独自 publish/reject。

### 2.4 人工队列接口

队列最小契约为：

- `enqueue(candidateProjection, reasonCode, priority)`：幂等，以 `sourceId + contentVersion + contentHash + policyVersion` 去重；不含原文。
- `claim(taskId, reviewerId)`：服务端角色和 lease 校验；没有已确认的审核 owner 时保持未处理，不自行分配人员。
- `decide(taskId, decision, reasonCode, reviewerId, policyVersion)`：二审/高风险策略由业务门确认后启用；提交前重读 source。
- `appeal(sourceId, contentVersion, contentHash, ownerUserId, idempotencyKey, reasonCode)`：只允许当前 owner；理由码必填，拒绝原文日志。
- `readForOwner`：只返回 pending/manual/rejected 的产品文案和安全状态，不返回命中内容、规则细节或他人记录。

队列不可用、lease 过期、超时、审核 owner 不存在时都不自动通过、不转普通编辑、不公开。通知/邮件不是本轮默认旁路；测试必须证明 0 邮件调用。

## 3. 幂等、申诉与审计数据结构

### 3.1 幂等键和结果重放

服务端将 `idempotencyKey + sourceType + sourceId + ownerUserId + contentVersion + contentHash + policyVersion` 作为一次操作身份。相同键/相同 payload 只返回原结果，不重复写候选、队列、审计或通知；相同键但 payload 不一致返回冲突，不入队。普通编辑不能清空历史结果。所有结果重放和冲突均写脱敏 audit metadata。

### 3.2 申诉滥用门

- 同 owner/entity/version 24 小时最多一次；重复 key 幂等。
- 同 key payload 不一致、非 owner、版本/hash 不一致、deleted/过期、已有 pending appeal、审计失败均 fail-closed。
- 相同 `contentHash` 连续三次同一结论触发 7 天服务端锁；锁期间不入队、不公开，只有当前 policy/version/owner/授权 key 可解锁。
- 申诉超时保持 pending/manual 并告警；不自动恢复发布或绕过删除态。

### 3.3 审计最小字段

审计事件至少记录 `auditId/sourceType/sourceId/contentVersion/contentHash/from/to/decision/reasonCode/actorType/actorRefHash/policyVersion/ruleVersion/occurredAt/requestId`。`requestId` 和 `idempotencyKey` 可哈希化。绝不记录联系方式、正文、命中片段、完整 provider payload、token、secret、Cookie、IP 或未成年人敏感信息。

## 4. RED-first 测试设计

所有测试先在旧行为/缺失适配器上保存 RED，再实现最小代码转 GREEN；测试默认只使用内存 fake 和结构化 fake provider，不连接真实 CloudBase、邮件、AI 或生产。测试文件为未来候选路径，当前不创建。

### 4.1 单元与契约（对应 Spec §10.1）

建议：`D:\codex_project\家教对接website\Code文档\tests\contact-review\normalize.test.ts`、`rules.test.ts`、`state.test.ts`、`provider.test.ts`。

- raw → NFKC 顺序、全角/半角、大小写、Unicode 同形/零宽/方向控制、emoji、分隔符；保留 offset map，不能映射即 manual。
- email/手机/座机/微信/QQ/URL/social ID、中文数字、长数字及分隔符混淆；合法年份、日期时间、预算、分数/年级、地址房间号、数量/时长均不自动拒绝。
- 高置信必须具备完整 pattern、上下文、合法排除、offset；关键词或单一长数字不得自动拒绝。
- provider stub 的 allow/contact/ambiguous/policy error schema、单次重试、超时、不可达、预算熔断、恶意 prompt、超大输入；全部失败均 pending/manual。
- 所有状态迁移、版本/hash 竞争、0033 delete/restore overlay、拒绝的非法迁移和 old published snapshot 保留。
- 0 邮件、0 公开旁路、0 contact profile 正文读取、0 原始 prompt/response/正文日志。

### 4.2 API/事务/安全（对应 Spec §10.2）

建议：`D:\codex_project\家教对接website\Code文档\tests\contact-review\service.test.ts`、`route-composition.test.ts`、`appeal-abuse.test.ts`。

- parent-need/tutor-profile 新建和编辑只进入 pending；非当前 reviewed version 不公开。
- 正常已发布旧快照仍可读；pending/manual/rejected/deleted 的公开 API、聊天和联系方式交换均 fail-closed。
- forged `published/allow`、旧 version/hash、错误 owner、匿名、非法 source、重复 key、事务不可用、审计失败、队列不可用、AI timeout/budget、prompt injection 全部返回脱敏错误或 pending/manual，禁止公开。
- source 删除态只允许 `deleted -> pending_review` 恢复重审，不允许 `deleted -> published`；消息历史可读但新消息、交换、授权 profile 不放行。
- 申诉重复 24h、同 key payload mismatch、跨账号、过期、deleted、7-day lock、审计失败；均不得产生重复队列、公开状态或联系方式。
- route composition 必须调用真实导出 route；不能只直接调用内部 handler。未认证为 401，非 owner/不存在/删除态统一安全语义。
- fake store 记录 `transaction/add/set/update/remove/email` 调用次数，断言正常审核路径邮件和公开旁路均为 0。

### 4.3 预生产故障注入（对应 Spec §10.3）

建议：`D:\codex_project\家教对接website\Code文档\tests\contact-review\preprod-contract.test.ts`。

- 全合成 parent/tutor 样本、正常长数字、各联系方式变体、模糊/Unicode 混淆、人工等待和申诉可重复。
- 规则、AI、队列、审计、预算、密钥轮换的独立故障注入；provider hard timeout 15 秒，熔断后外部调用次数为 0。
- 分别测量 submit/rules/AI/queue/end-to-end p95；submit 返回 pending 不等于审核完成。
- 申诉入队 p95 ≤30 分钟、裁决 p95 ≤4 小时、99% ≤1 工作日；超时仍 pending/manual 并告警。
- 72 小时等价观察或更严格业务窗口内：联系方式公开、未授权写、重复发布、邮件旁路计数均为 0；清理 receipt 只含合成 ID/哈希。

### 4.4 生产/业务验收（对应 Spec §10.4–10.5）

这里只能写成未来门禁清单，不是本地授权：

- 生产另有书面数据授权、隔离 key、部署 provenance、监控/告警、回滚和清理 receipt；先只读或小流量合成样本。
- 供应商、模型、地域、DPA、无训练/广告声明、raw retention=0（或经批准 ≤24h）、密钥引用均可回读。
- 观察至少 72 小时或业务确认更严格窗口；零绕过、零联系方式公开、零未授权写、零重复发布。
- 业务方亲自确认清洁文本、明确联系方式、正常长数字、模糊场景、拒绝修改、人工等待、申诉、编辑重审、删除/恢复、聊天/联系方式门控、移动端文案和服务异常。

## 5. 业务门前可实现与必须确认后实现

### 5.1 现在可做的纯本地基础设施（不改变业务行为）

1. 只读字段盘点和字段分类文档；只使用合成/脱敏 golden corpus。
2. `normalize/rules/state` 纯函数、offset map、合法长数字排除和不可逆脱敏投影。
3. 内存 `ReviewStore`、fake transaction、fake audit、fake queue、provider-neutral stub 和故障注入。
4. schema/type/API contract fixtures；RED-first 负向测试，断言 0 邮件、0 公开旁路、0 外部 provider 调用。
5. SLO 计时/计数接口、脱敏日志 schema、审计字段白名单、规则/策略版本格式检查。
6. 迁移/回滚 runbook 的静态校验，以及 390px 可访问性/错误态的合成 UI 契约（不接真实审核状态）。

这些工作仍不能修改现有发布状态、实际数据库 schema、用户可见文案或生产配置；若测试必须 import 现有业务模块，应使用边界 fake，不写 CloudBase。

### 5.2 必须业务确认后才可实现或启用

1. 最终公开字段清单和字段最大长度；目前只可把 `childIntro`、`abilityDescription` 作为候选，不得自动加入标题、简介以外字段、图片/OCR。
2. 联系类别、国家/语言、规则自动拒绝阈值和合法数字上下文；未知语言/国家保持人工。
3. AI 是否只路由、供应商/模型/region/DPA/子处理者/预算/密钥 owner、cross-border 和 no-training 证据。
4. 真实 DB/CloudBase 集合、索引、事务和生产 route 接线；包括是否新增 review 集合或复用 `audit_events`。
5. 人工审核 owner、班次、二审条件、申诉权限/工作时间/SLA、用户文案和通知渠道；没有 owner 不得自动发布。
6. published 旧快照、编辑重审、删除恢复后的最终可见性；不得默认改变 0033 的聊天/联系方式语义。
7. raw/review/audit retention、备份/恢复/跨区域、真实 key 引用和生产观察窗口。
8. 预生产/生产合成数据、真实数据授权、部署/回滚和 Issue 关闭证据。

## 6. 迁移、回滚、可观测性、保留与密钥计划

### 6.1 迁移顺序（未来授权后）

只读字段 inventory → 合成 golden set → 独立 fake/故障注入 → 隔离环境 schema/索引验证 → 备份/恢复演练 → 小流量 pending-only → 业务确认 → 受控发布门接线 → 观察窗口 → 业务验收。每一步有独立 receipt、输入 hash、规则/策略版本和回滚点；任何门缺失保持 pending/manual，不进入下一步。

不迁移或不重写既有 `parent_needs`、`tutor_profiles`、`conversations`、`messages`、`contact_exchange_requests`、`contact_profiles` 的历史正文；旧 published 快照和 0033 审计规则由各自 owner 维护。

### 6.2 回滚

- 规则或模型回到上一已验证版本；保留新候选 pending/manual，不回滚到未审计 published。
- 关闭 AI/provider 时禁止旁路，所有新候选继续 pending/manual；队列/审计 append-only 保留。
- 发现联系方式公开、越权、IDOR、重复发布、审计缺失时立即停止发布并冻结受影响版本；只按已授权精确 ID 清理合成数据，不物理删除审计。
- 0033 delete/restore/version 门失败时冻结 0036，不由审核层自行修复聊天或联系方式。

### 6.3 观测和保留

指标至少按 submit、normalization/rules、AI、queue、end-to-end 分开记录 p50/p95/p99、错误、超时、预算熔断、manual backlog、appeal SLA、publish bypass、contact leak、email call、audit write failure；日志只含 source/hash/category/version/latency/result/error 的脱敏投影。

Spec 候选保留：provider 原始 request/response 默认 0；review copy 最多 24 小时；audit metadata 180 天候选。业务/法务未确认前不得写入生产，也不得把候选期当最终承诺。

### 6.4 密钥与配置引用

只使用配置引用，不在代码、日志、测试 fixture 或文档写入 secret 值。候选变量名（只列名称）：

`REVIEW_PROVIDER_REF`、`REVIEW_MODEL_REF`、`REVIEW_REGION_REF`、`REVIEW_API_KEY_REF`、`REVIEW_SIGNING_KEY_REF`、`REVIEW_MONTHLY_BUDGET_CAP`、`REVIEW_REQUEST_RATE_LIMIT`、`REVIEW_TIMEOUT_MS`、`REVIEW_QUEUE_SLA_MINUTES`、`REVIEW_RAW_RETENTION_HOURS`、`REVIEW_AUDIT_RETENTION_DAYS`、`REVIEW_RULE_VERSION`、`REVIEW_POLICY_VERSION`、`REVIEW_ALERT_SINK_REF`、`REVIEW_DASHBOARD_REF`、`REVIEW_TEST_KEY_REF`、`REVIEW_PROD_KEY_REF`。

变量缺失、引用无法解析、环境/region/DPA 不一致均阻止外部调用并保持 pending/manual；不通过前端环境变量或浏览器会话补齐。

## 7. 预计变更文件与明确不动文件

### 7.1 未来候选变更（门禁通过后分批、每批独立复核）

- 纯本地先行：`Code文档/features/contact-review/{types,normalize,rules,state,provider,queue}.ts`、对应 `Code文档/tests/contact-review/*.test.ts`。
- 事务/持久化接线：`Code文档/server/contact-review/{service,store,audit}.ts`，以及业务确认后明确的 `server/parent-needs.ts`、`server/tutor-profiles.ts` 最小发布门改动。
- API/UI/队列：`Code文档/app/api/contact-review/route.ts`、现有管理页/发布页的最小状态与无障碍文案改动；必须先有产品文案/权限确认。
- 监控/运维：只在平台、region、key、保留和部署门通过后更新相应 Code文档 运维说明或受控配置；本轮不写。

### 7.2 本轮明确不动

`Code文档/server/conversations.ts`、`server/contact-exchange.ts`、`server/contact-profiles.ts`、既有 parent/tutor API adapters、`app/chats/[id]/page.tsx`、认证/登录/邮件/通知路由、`.env.local`、package/lock 文件、CloudBase/Cloudflare/DNS/部署脚本、规划文档、Spec、Issue、UI 文档、其他角色记录和任何生产数据均不动。若未来发现必须改这些文件，先回报 exact scope，不能以审核任务名义扩大。

本轮实际允许写入只有：

1. `D:\codex_project\家教对接website\Code文档\ISSUE-0036-本地实施就绪设计.md`（本文）；
2. `D:\codex_project\家教对接website\Code文档\开发员工作记录.md`（仅追加事实，保留其既有 staged/unstaged 内容）。

## 8. 硬门禁、已知/未知和唯一下一步

### 8.1 已知

- 当前现有 server/API 已有 parent/tutor owner、version、事务、审计、conversation/contact exchange 与 0033 删除态边界；0036 不应复制或绕过这些门。
- Spec 的确定性规则、NFKC 顺序、AI 结构化输出、人工 fallback、状态机、申诉滥用、fail-closed、SLO 和测试 acceptance 已写明。
- Hermes Round 3 无 SERIOUS；这不是业务授权，也不等于技术实现或生产验收通过。

### 8.2 未知/硬阻塞

14 项业务门仍未确认：公开字段和最大长度；联系方式类别/国家/语言；自动拒绝定义；AI 权限边界；SLO/误杀漏放/队列工作时间/申诉 SLA；供应商/模型/region/DPA/训练禁用/预算/密钥 owner；raw/audit retention；未成年人/OCR；旧 snapshot、编辑/恢复重审语义；人工 owner/二审；申诉权限。另有真实数据库/索引/事务、备份区域、告警 sink、部署 provenance 和生产合成数据授权未冻结。

任何一项缺失都禁止：真实 provider 调用、真实正文出域、自动发布/拒绝、生产 schema/route/状态写入、邮件/通知旁路、CloudBase/平台配置变更、生产数据写入和 Issue 关闭。

### 8.3 唯一下一步

由总负责人/产品经理向业务方收集并带日期确认的 14 项门禁（尤其 §3.2 字段/类别/阈值、AI/供应商/DPA/预算/密钥、队列 owner/SLA、保留、旧 snapshot/删除恢复语义），回填为独立业务决策证据并重新核验 hash。确认前仅允许本设计所列的纯本地、合成、无网络基础设施；不得开始业务代码实现。
