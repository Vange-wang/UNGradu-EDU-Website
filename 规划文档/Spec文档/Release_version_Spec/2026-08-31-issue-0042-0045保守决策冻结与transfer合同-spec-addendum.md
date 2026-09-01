# ISSUE-0042 / ISSUE-0045 保守决策冻结与 transfer 合同附录

> 文档状态：`DRAFT_NON_CANONICAL / AUTHOR_DRAFT / HERMES_REVIEW_PENDING`
> 审查预算：`MAX_REVIEW_ROUNDS=3`；本新冻结范围 `CURRENT_REVIEW_ROUND=1/3`
> 作者与唯一写入 owner：产品经理 Agent v2.3.2（`019fefa7-9883-7af2-bdb5-acc5c8513781`）
> 项目 workflow：`WORKFLOW_ACTIVE`

## 1. 目的、边界与决策原则

本附录只为 ISSUE-0042 的五项产品/安全决策和八项可执行补证任务，以及 ISSUE-0045 的 V7-0035-N-010/N-013 transfer 合同建立可复读的产品合同。它不取代 Issue canonical、总表、原 Spec、历史 Hermes/QA 报告或 Issue 管理员状态记录。

本轮允许的结论是文档决策冻结和证据任务可执行，不是代码、provider、Secret、真实 widget、平台、部署、生产、数据库、付费或 Issue 关闭通过。任何 `RESOLVED_BY_DOC` 只表示定义/映射/边界已固定，不表示运行行为已证明。

不可变边界：

- 0042 仍只服务 ISSUE-0032 的 provider-neutral 文档债务；不选择 provider、真实 hostname、Secret、网络、DPA、采购、计费或生产观察值。
- 0045 仍只服务 ISSUE-0035 的文档审查台账；`V7-0035-N-003` 继续由 ISSUE-0041/安全 owner 承载，`V7-0035-N-006` 继续由 ISSUE-0031 承载，二者均未完成。
- ISSUE-0031、数据库、支付、全部付费动作、AI/OCR、额外出域和生产启用继续冻结。
- 不修改 Issue canonical、Issue 总表、既有 Spec、历史 Hermes/QA、代码、UI、平台或其他角色文件；本附录通过也不改变任何 Issue 状态。
- 失败、未知、不可证明或存储不可用均采用 fail-closed；不得用来源 Issue 的关闭替代目标项的专项证据。

## 2. 事实来源与当前实现核对

| 代号 | 来源 | SHA-256 | bytes / lines | 本附录用途 |
| --- | --- | --- | --- | --- |
| A42-ISSUE | `协同工作文档/ISSUE/Open_Issue/ISSUE-0042-0032邮箱人机验证关闭Spec-Hermes-Round1非阻塞文档债务.md` | `43B49953BBD3D8A7B8F4032704BDE9CF5AA6831D6A7F568C96FCBF7FA6FCEBBF` | 13683 / 98 | 0042 原 N1–N4、C2、MAC-1/3/4/5 与 Round 2 N1–N9 |
| A42-SPEC | `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0032-邮箱人机验证关闭-spec.md` | `F7939E3BD8769B9BE4CB18335A71B1BC624FD32182827F099F219F8DD36B9073` | 16889 / 191 | provider-neutral 原合同 |
| A42-REC | `规划文档/Spec文档/Release_version_Spec/2026-08-19-v4-issue-0032-参数回执用户最终确认记录.md` | `2DC7D6096BE82FB3F1A45B7F40A594AC44BAFF57E022376FC8D717A54DD0FA9D` | 5615 / 79 | 方案 B 用户确认与未授权边界 |
| A42-CAND | `规划文档/Spec文档/Release_version_Spec/2026-08-19-v4-issue-0032-parameter-receipt-candidate.md` | `52358D5F7BC7BE75819CA6CBBFDA9D8AAD64C98CF8863D91A4A197E75F557ECF` | 18543 / 259 | 方案 B 固定参数；只读 |
| A42-R2 | `规划文档/Spec文档/Release_version_Spec/2026-08-19-v4-issue-0032-parameter-receipt-hermes-round-2.md` | `7F9D66B2027658797FC118596082EBFFB867665CF5FC5C6EC7D09FD21C63A768` | 6911 / 87 | N1–N9 非阻塞来源 |
| A42-CHALLENGE | `Code文档/server/security/email-challenge.ts` | `1E74379D327AC2A0A0AF3028BF7205C76529D27DAA656C6F6E4039C0EE05DF96` | 9509 / 317 | TTL、verify、replay guard 当前路径 |
| A42-RATE | `Code文档/server/security/rate-limit.ts` | `3543AE2FC35059D3DBB0D1DE816F261CD24862D7394B338AC5B42C890F7F0ECD` | 8926 / 296 | 限流常量、固定窗、HMAC 文档 ID |
| A42-GUARD | `Code文档/server/security/request-guard.ts` | `76C0F655BBE29D8F2688473A2661D440A15F05A7E37E70254DE5CC2EFC13D964` | 8469 / 254 | trusted/unknown proxy key 路径 |
| A42-API | `Code文档/server/email-auth-api.ts` | `0ABF96F60E56AC9DCF7BD60D38DA968279221FA590B33B8F50B29EBADF863CA3` | 16908 / 589 | `POST_SEND_CODE` 顺序与设备/IP输入 |
| A42-ROUTE | `Code文档/app/api/auth/email/send-code/route.ts` | `EF799A3D1C3C0F1D49C2D258BE29A1F032809FDDA187C2BEB97DC7FAEEB42828` | 1235 / 29 | 生产仍使用 fail-closed verifier 的事实 |
| A45-ISSUE | `协同工作文档/ISSUE/Open_Issue/ISSUE-0045-0035联合Spec关闭Spec-Hermes-Round1非阻塞文档债务.md` | `170C23168AEB7B466CF26EF62458230765E15E6A0245CEB657A8A53C1013F44B` | 12485 / 88 | 0045 N/MAC 与 transfer 关闭语义 |
| A45-V7 | `规划文档/Spec文档/Release_version_Spec/2026-08-26-issue-0035-现有证据与数据库延期后的文档债务关单范围调整-spec-addendum.md` | `54A331358C55C204E8B17A6C8311014882A2D8B54C13490F04D85CB40D0E2CCB` | 19107 / 131 | V7 15 项、N-003/N-006/N-010/N-013 transfer |
| A45-CLOSE | `协同工作文档/ISSUE/Close_Issue/ISSUE-0035-联合Spec首轮非阻塞文档审查改进台账.md` | `32567B0CBDCB89212C0A20348597054A12F42BB62FFF5C1C48A57B2C60C34968` | 17541 / 142 | 0035 已按 doc-only 口径关闭；历史与当前边界 |
| A45-CLEAN | `规划文档/Spec文档/Release_version_Spec/2026-08-31-issue-0042-0044-0045产品文档债务集中清理附录.md` | `CEEE27D8AA6F73FA7DE1F13E8AC7C9F412627E985EB4C3C4A13AEA563C34411B` | 19772 / 142 | 0045 O-003 与四项 transfer 的集中索引 |
| A45-R2 | `规划文档/Spec文档/Release_version_Spec/2026-08-31-issue-0042-0044-0045产品文档债务集中清理附录-hermes-round-2.md` | `AFDFEFD2CCB8A968E4CDB213E824D56932C761FE4ACB02D6DE6D68655A80787D` | 7668 / 99 | R2 `SERIOUS=0` 与本地复读限制 |

当前代码事实必须与目标合同区分：`DEFAULT_TOKEN_TTL_MS=300_000`；verify 对 issued time 做 ISO、未来时间和 TTL 检查；限流默认 account/action/device/ip/session 为 3/5/5/10/5，窗口均为 15 分钟且实现为固定窗；生产 route 当前使用 `createFailClosedEmailChallengeVerifier()`。当前匿名 device 输入是服务端读取的 UA 与 Accept-Language 截断串，登录态 device 使用 session 派生 key；当前 `email-auth-api.ts` 将请求中的 `cf-connecting-ip` 或环境值送入 proxy key 路径。上述事实不等于已证明生产可信。

本合同特别记录三项差距：当前 TTL 条件使用 `>`，因此恰好 300 秒的边界尚未证明满足“age >= 300 拒绝”；匿名 device key 尚未在进入任何持久化/日志前显式完成 keyed pseudonym；persistent replay 文档尚无 `cleanup_after` 字段。三项均转入下述实现/独立复核包，不静默写成已通过。

## 3. ISSUE-0042 五项保守决策冻结

### 3.1 R1-N4：72 小时不是当前关单硬门

`72h` 仅是未来生产观察窗口的历史示例/待业务门禁值，不是 ISSUE-0042 当前文档债务关单硬门，也不是已批准的生产 SLA。当前 `LOCAL_DOCUMENT_ONLY_GATE` 仅要求：本附录记录该解释；A42-SPEC/A42-REC/A42-CAND 的完整 hash、bytes、lines 可复读；provider/Secret/平台/生产动作未被声称；Issue 管理员独立回读本附录、来源和非阻塞项。当前关单不产生 72 小时生产证据。

处置：`RESOLVED_BY_DOC`（决策已冻结）；未来如进入生产，必须另行确认观察窗口、样本、停止条件和 owner，未确认前为 `PENDING_BY_GATE`。

### 3.2 R1-MAC-4：本地安全替代，不冒充真实回滚

本地安全替代的可验证合同为：使用脱敏 synthetic verifier/replay/limiter fixture，记录变更前后 source hash、测试输入边界、失败响应和 `send-called=false`；模拟切回上一份本地可复读快照后，必须恢复 fail-closed verifier、无 Secret、无网络副作用、无发送副作用。安全替代只证明本地行为可回到安全默认，不证明 Cloudflare/CloudBase 真实反向回滚。

生产回滚仍要求平台上一稳定 revision、停副作用/关闭开关、保留审计、回滚后 smoke 和独立 owner receipt；禁止恢复 exposed Secret。处置：`DECISION_FROZEN / REQUIRES_IMPLEMENTATION_OR_INDEPENDENT_REVIEW`。没有上述本地 receipt 前，不得把 MAC-4 写成已完成。

### 3.3 R2-N2：device pseudonym 最小输入与 keyed 边界

只允许使用服务端观测且已截断的 `User-Agent`（最多 256 字节）与 `Accept-Language`（最多 128 字节）作为匿名 device 信号；不输入 email、raw IP、Cookie、challenge token、URL、请求正文、未成年人字段或其他原始 PII。登录态可使用已认证 session reference，但仍不得落 raw session/cookie。

派生合同：`device:v1:<environment-ref>:<HMAC-SHA-256(key=AUTH_RATE_LIMIT_KEY_SECRET, message=ua-len|ua|lang-len|lang)>`；消息采用长度前缀和固定字段顺序，key 只从服务端 Secret 读取，日志/持久化只保留 keyed pseudonym、key version、environment ref 和时间窗口。不得把当前内存中的原始组合串升级为生产持久化证据；若 key 缺失、版本不明或派生失败，返回不可用并阻止发送。

验收边界：UA 255/256/257、语言 127/128/129 字节；空值、Unicode 规范化差异、相同输入稳定性、不同输入区分性、跨 environment/key version 不相等；断言 raw UA/lang/email/IP/token/cookie 不出现在持久化和日志 fixture。处置：`DECISION_FROZEN / REQUIRES_IMPLEMENTATION_OR_INDEPENDENT_REVIEW`。

### 3.4 R2-N3：unknown-proxy 保守策略

只有由受控服务端网关证明并注入的 proxy address 才能作为 trusted proxy input。请求自带的 `cf-connecting-ip` 不得凭字段名自动视为可信；在平台证明缺失、来源为空、格式非法、多个来源冲突或读取失败时，统一进入 `unknown-proxy` bucket。unknown-proxy 不自动放行，也不绕过限流。

当前 provider-neutral 兼容阈值沿用 IP `10/15m` 固定窗；unknown bucket 无法写入/读取/事务确认时返回 503、send count=0；可正常计数时按该共享 bucket 计数，达到 10 次从第 11 次返回 429。unknown bucket 不能被客户端自行选择或通过更换 header 绕过。验收须覆盖可信来源、无来源、伪造 header、冲突来源、存储不可用和窗口边界。处置：`DECISION_FROZEN / REQUIRES_IMPLEMENTATION_OR_INDEPENDENT_REVIEW`。

### 3.5 R2-N7：固定窗口冻结

选择与现有 `rate-limit.ts` 一致的 fixed window，不改为 sliding window。窗口 `W=900000ms`，窗口起点为该 layer 首次接受计数的时间；`current-windowStartedAtMs < W` 仍在原窗，`>= W` 进入新窗。沿用 account `L=3/15m`、action `L=5/15m`、device `L=5/15m`、IP/unknown-proxy `L=10/15m`；未登录 email send 的 session layer 为 N/A，不能凭空构造 session identity。

测试必须覆盖每个适用 layer 的 `L-1/L/L+1`，以及 `W-1/W/W+1`；固定窗边界在恰好 W 时重置，不能滑动累计。限流检查顺序固定 account → IP/unknown-proxy → device → action → session（适用时），失败不调用 send。处置：`DECISION_FROZEN / REQUIRES_IMPLEMENTATION_OR_INDEPENDENT_REVIEW`。

## 4. ISSUE-0042 八项开发/独立复核任务包

以下任务包只授权在后续独立实现授权中按 ISSUE-0032 范围执行；本附录不授权任何代码或平台写入。每项须有 owner、路径、符号、测试、receipt 和停止条件。

| 项目 | 精确执行面 | 最小测试与预期证据 | 停止条件 |
| --- | --- | --- | --- |
| R1-N3 | `Code文档/server/security/email-challenge.ts` 的 `verifyEmailChallenge`、`EmailChallengeReplayGuard`；`server/email-auth-api.ts` 的 `verifyChallengeForRequest` | `tests/email-auth.test.ts` 与安全聚焦测试覆盖 missing/invalid/expired/replay/wrong action/host、并发 consume、timeout/unreachable/config missing；独立签名 receipt 含 status、send=0、无 Secret/PII | 任一失败路径可发送、replay 可复用、或独立签名缺失则保持 Open |
| R1-MAC-1 | `POST_SEND_CODE`、replay/rate-limit/audit 输出及其测试 fixture | 日志、截图、审计抽样的原始邮箱、token、Cookie、raw IP、Secret、未成年人字段均为零；给出脱敏扫描 receipt | 发现一条真实敏感值或无法证明抽样范围，立即停止并回到安全 owner |
| R1-MAC-3 | `createCloudBasePersistentEmailChallengeReplayGuard`、`PersistentChallengeReplayDocument`、`cleanup_after` 约定 | 记录 action、key version、environment ref、consumed/expires/cleanup 时间；同 token 第二次 replay，清理失败不复活；事务/权限/清理 receipt 分离 | collection/事务/清理不可用、字段超范围或清理后可复用，返回 503 且不继续 |
| R1-MAC-5 | `POST_SEND_CODE` 顺序：`guardWriteRequest → verifyChallengeForRequest → checkRateLimit → sendEmailLoginCode` | 顺序断言、每个前置失败分支 `sendEmailLoginCode` 未调用；覆盖 403/429/503 与 send=0 | 顺序改变、前置失败仍发送或 provider 错误被吞掉，停止 |
| R2-N4 | `DEFAULT_TOKEN_TTL_MS`、`verifyEmailChallenge`、既有 email cooldown/code TTL/wrong-code 语义 | challenge TTL `T-1/T/T+1`，特别断言恰好 `T=300s` 按已确认合同拒绝；5s challenge retry、60s email cooldown、5m code TTL、wrong-code 5 次的边界 receipt | 任何继承值漂移、T 边界仍与合同矛盾或无正式 receipt，保持实现门未通过 |
| R2-N6 | base receipt 与运行提交/树/package/测试证据绑定；不由 0042 选择 commit | fresh exact source hash、HEAD、tree、package/lock 与 test receipt；独立复核确认未跨携带别 Issue 证据 | hash/HEAD/tree 不一致、工作树不 clean 或来源不能独立回读，退回总负责人 |
| R2-N8 | replay/limiter 持久化 contract 的 `expires_at`、`cleanup_after`、幂等清理与保留边界 | `cleanup_after=expires_at+1h`，清理前 replay、清理失败不复活、重复清理幂等；保留期/权限/告警 receipt | 没有持久化 owner、清理失败可复用、或需新增未授权数据库动作，保持 deferred |
| R2-N9 | `guardWriteRequest`、`POST_SEND_CODE` method/source guard 与 API contract | POST 精确通过；GET/HEAD/OPTIONS/错误 method 按 guard/API 规则拒绝；method 失败 verify/send 均为 0 | method 约束只写在文档、无法在接口回归证明或出现绕过，停止 |

八项共同验收：本地/合成与 future provider-specific 证据分开；测试通过不等于生产通过；独立复核不能替产品/业务批准；任何 Secret、token、Cookie、真实邮箱或生产数据不得进入 receipt。

## 5. ISSUE-0045 N-010/N-013 联合 Spec 专属 transfer 合同

### 5.1 合法 carrier 与分类

本合同把 N-010/N-013 的“未完成运行能力”与“文档 transfer 合同已定义”分成两个轴：合同完成可使 ISSUE-0045 的 transfer 记录可复读，但不把目标能力写成完成。稳定 carrier 为现有 `ISSUE-0045` 文档债务台账；不新建 Issue，不把已关闭 ISSUE-0035 作为活动 carrier，不把 ISSUE-0031 的延期改写为完成。

因此，若 ISSUE 管理员确认本附录的合同、carrier 和 future trigger 均可回读，`ISSUE-0045-LEDGER-V7-R1-O-003` 可在 ISSUE-0045 台账中改判为 `RESOLVED_BY_DOC_TRANSFER_CONTRACT`，仅表示合法转移关系已补齐；不表示 N-010/N-013 的实现、独立复核、数据库、生产或业务验收完成。若管理员认为现有 canonical 不允许该文档-only解释，则保持 O-003 `EXTERNAL_OR_USER_BLOCKED`，本附录不能越权解除。

### 5.2 N-010：补偿事务/回滚合同

- 对象：V7/0035 联合 Spec 所引用的跨步骤写入一致性、补偿事务、幂等、对账和回滚责任；不是本轮新增功能或数据库迁移动作。
- 用途与关联：仅用于证明某次目标操作在主写入、辅助写入或失败恢复之间没有不可解释的部分成功；记录 `sourceIssue=ISSUE-0035`、`sourceItem=V7-0035-N-010`、operation scope、entity reference、version、idempotency key hash、status、reason code、operator ref、created/updated time、rollback ref 和 schema version 等最小元数据。不得复制原文、联系方式、未成年人字段、token、Cookie 或 Secret。
- 保留与权限：保留期由未来获授权的目标实现 Spec 冻结；当前只允许形成字段/证据合同，不建 collection、不查库、不双写。访问限于对应实现 owner、独立复核和 Issue 管理员所需最小权限。
- 审计与停止：每个状态变化需有不可变审计关联；事务不可用、幂等冲突、对账不一致、补偿失败或 rollback ref 缺失时 fail-closed，停止公开/后续副作用并保留失败证据。
- 验收：必须有故障注入、重复请求、部分失败、补偿成功/失败、对账和回滚 receipt，并有技术独立复核及适用业务接受。0033 Close 只能作为候选来源，不能替代 N-010 专项证据。
- future trigger：未来重新启用相关运行能力时，由对应实现/技术/业务 owner 在 ISSUE-0045 或继任目标 Issue 中形成新 Spec、实现、独立复核和适用生产证据；当前 N-010 运行能力保持未完成。

### 5.3 N-013：risk_feedback 合同

- 对象：联合 Spec 范围内的安全、越权、隐私、错误公开或流程异常反馈记录；稳定 carrier 为 ISSUE-0045 台账及其后续授权的 `risk_feedback` 专项证据，不扩展为通用用户内容库。
- 用途与关联：只用于风险分类、去重、责任路由、审计和关闭前证据索引。建议的最小关联为 `sourceIssue=ISSUE-0035`、`sourceItem=V7-0035-N-013`、bounded entity reference/hash、category、reason code、spec version、dedupe key hash、status、owner ref、created/updated time、retention/hold ref。不得保存 raw email、手机号、未成年人内容、完整请求正文、token、Cookie、Secret 或不必要 IP。
- owner 与权限：产品/Spec owner 定义用途和字段边界；安全/实现 owner 负责权限、脱敏、审计和存储证明；Issue 管理员负责台账绑定。实际生产人工 owner、数据库权限和保留期在目标运行 Spec 中另行冻结，当前不虚构。
- 保留、删除和审计：仅保留关闭所需的最小元数据；到期清理、legal/complaint hold、删除失败告警和幂等清理须由未来目标 Spec 与平台证据确认。任何越权读取、超范围用途、字段泄露或审计断链都立即停止并 fail-closed。
- 验收：必须逐段证明用途、字段、关联、owner、权限、保留/删除、审计、脱敏和适用 POST/生产证据；ISSUE-0017 Close 只证明其自身 `/feedback`、集合和 POST 来源事实，不能替代 N-013 专属合同与验收。
- future trigger：业务方重新启用风险反馈运营或相关生产功能时，先在 ISSUE-0045/继任 Issue 中冻结目标范围、人工 owner、数据库与合规边界，再取实现、独立复核、适用部署/生产和业务证据；当前不写 resolved runtime。

### 5.4 与其他 transfer 的隔离

`V7-0035-N-003` 仍是 ISSUE-0041 的安全负例/告警/停止/回滚/独立复核责任；`V7-0035-N-006` 仍是 ISSUE-0031 的数据库认证迁移责任。N-010/N-013 的合同不得吸收、豁免或覆盖这两项，也不得把 N-003/N-006/N-010/N-013 统称为已完成。

## 6. 证据、失败、回滚与关单门

阶段证据必须分层：产品决策冻结 → 实现 receipt → 本地/集成测试 → 独立技术/安全复核 → 如适用的平台/生产证据 → 业务验收 → Issue 管理员关单。任一层不可用只能保持对应状态，不能由上一层代替。

本附录的安全回滚仅是本地 synthetic alternative。真实生产回滚需平台 revision receipt，不能用本地 commit 猜测。错误分类沿用 0032：challenge missing/invalid/expired/replay/wrong action/host 为 403；timeout/unreachable/config missing/replay store/limiter unavailable 为 503；rate limit 为 429；所有拒绝路径 send=0。

停止条件：发现 raw sensitive data、跨账号/跨 Issue 数据、原始 proxy header 被无证明信任、verify/consume/limit/send 顺序绕过、replay 复用、unknown bucket 自动放行、固定窗边界漂移、transfer 误写 resolved、hash/anchor 不一致或循环引用，立即停止后续动作并由对应 owner 处理。

关单条件：0042 的五项决策记录可复读，八项任务包有明确 owner/测试/receipt/停止条件，并经适用独立回读；0045 的 N-010/N-013 合同、stable carrier、future trigger 和与 N-003/N-006 的隔离可复读；Hermes/Document QA 适用门禁通过；最后仍由 Issue 管理员独立维护 canonical/state。以上均不自动关闭 Issue。

## 7. 审查与后续状态

本附录冻结后使用脱敏临时副本运行 Hermes CLI `deepseek-v4-pro` Round 1/3；默认模型不得修改，报告正文 verdict 为准。SERIOUS 必须整批交 Document QA，本产品经理不得自行修订；NON_SERIOUS 由 Issue 管理员登记，不为措辞返工。通过也只进入 `DOCUMENT_GATE_PASSED / USER_CONFIRMATION_PENDING`，不授权实现。

本轮唯一下一步：项目总负责人核对本附录 hash 并运行 Hermes Round 1；若有 SERIOUS，将完整批次路由已登记 Document QA，否则把非阻塞项与 transfer 合同交 ISSUE 管理员独立复读。实现、provider、Secret、平台、部署、数据库、付费和 Issue 状态变更均等待各自授权。

