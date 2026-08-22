# V4 ISSUE-0032 参数候选收据

## 1. 文档状态与责任边界

- 文档状态：`DRAFT_NON_CANONICAL`
- 文档类型：`PARAMETER_CANDIDATE`
- 当前审查状态：`HERMES_REVIEW_PENDING`
- 用户方案选择：`USER_PROFILE_SELECTION=B`
- 关键文档审查预算：`MAX_REVIEW_ROUNDS=3`
- 当前审查轮次：`CURRENT_REVIEW_ROUND=0/3`
- 作者与候选 owner：产品经理 Agent，注册线程 `019fefa7-9883-7af2-bdb5-acc5c8513781`
- 项目 workflow：`WORKFLOW_ACTIVE`
- ISSUE-0032：`open / USER_CONFIRMATION_PENDING`

本文件是用户选择方案 B 后形成的 provider-neutral 参数候选收据。它不是最终
`V4_PARAMETER_RECEIPT`，不是 `DOCUMENT_GATE_PASSED`，不授权实现、测试、真实
provider/widget/Secret、平台配置、部署、生产验证或 Issue 状态变更。

最终冻结仍须经过 Hermes `deepseek-v4-pro`、适用的 Document QA/Issue 管理员处置
和用户最终确认。独立技术/安全复核只能复核候选参数与证据，不能替业务方批准产品
参数。ISSUE-0031、数据库和全部付费动作继续延期。

## 2. 唯一范围

本收据候选只服务 `ISSUE-0032` 的邮箱验证码发送前服务端人机验证信任链：

```text
request origin/source guard
  -> provider-neutral verify
  -> one-time consume
  -> account/IP/device/action limit
  -> 既有 email 60s cooldown
  -> send
```

核心产品安全链固定为：

```text
verify -> consume -> limit -> send
```

本轮不把密码登录、邮箱验证码登录、数据库阶段、付费服务、provider 选择、网络
区域、DPA、生产配置或其他 Issue 带入 ISSUE-0032 参数冻结。

## 3. 事实来源与候选绑定

| 来源 | 当前绑定事实 |
|---|---|
| `2026-08-15-issue-0032-邮箱人机验证关闭-spec.md` | SHA-256=`F7939E3BD8769B9BE4CB18335A71B1BC624FD32182827F099F219F8DD36B9073`；正文仍为 `DRAFT_NON_CANONICAL / AUTHOR_DRAFT / USER_CONFIRMATION_PENDING` |
| `2026-08-18-v4-issue-0032-用户确认与阶段边界冻结记录.md` | SHA-256=`AA027E3A3C78FB39DBD9689BDD8A7ACF44DEF5932270F0CD94476BAA5830E5E7`；只冻结 provider-neutral 目标与边界，具体参数此前未确认 |
| V4 分支 | `V4-issue-0032-email-turnstile-closure`；HEAD=`ee41c3f30770be6f7a9a0e548975464268b911d2`；tree=`bc09512016e9e987f0a591096d10f6a6571eceef` |
| V4 依赖输入 | package SHA-256=`36CF12650567FB6B736653995072C431592F8C1F7559260F6D3E44047A2FAFFF`；lock SHA-256=`257A945825407CCDDFCAFA18F1E2C7FAD7FB8D53F39AB99DD5E191F5DD6651BF` |
| 目标测试输入 | `issue-0034-security-baseline.test.ts` SHA-256=`3406DDB1E16C1D3117F048A9D3B97E0B568CBD8074D225E36BE7841987B09900`；`email-auth.test.ts` SHA-256=`D532BFB279E1189A6E71A55FC0F327AB5628F9B4978DB96B5E19C1EDD3B933F5`；`login-approved-visual-contract.test.ts` SHA-256=`37490B3368220697A505D7B539083DA1E0F98C89098DEAC5BDDF4764D15F0AF3` |
| 开发员线程证据 | `019fefa7-a3c3-7333-94d7-d61961c5ea99` 报告 3/3 files、51/51 tests、0 failed/skipped；当前尚无持久化测试收据，本候选不得把该线程事实升格为独立技术或生产门禁 |

## 4. 方案 B 固定候选参数

### 4.1 动作、TTL、超时与主机表达

| 参数 | 候选冻结值 | 语义与边界 |
|---|---|---|
| `action` | `email_send_code` | 只允许邮箱验证码发送动作；`password_login` 不属于本 Issue 的参数范围 |
| `token_ttl` | `300s` | issue time 与当前时间的年龄满足 `age < 300s` 才可继续；`age = 300s` 和 `age > 300s` 均拒绝 |
| `verify_timeout` | `5000ms` | provider-neutral verify 调用达到或超过 5000ms 视为 timeout；服务端不自动重试 |
| `expected_actions` | `[`email_send_code`]` | 精确字符串匹配，不接受动作别名、大小写变体或客户端自报动作 |
| `expected_hostnames` | `HOSTSET[environment]` | 每个环境使用显式有限集合：`LOCAL_SYNTHETIC_HOST_REF`、`INTEGRATION_SYNTHETIC_HOST_REF`、`STAGING_HOST_REF`、`PRODUCTION_HOST_REF`；实际解析值属于 `PENDING_BY_GATE` |
| host 匹配 | 精确小写匹配 | 禁止 wildcard；禁止把请求 Host、Origin 或 Referer 自动当作 allowlist |
| provider success | success + action + hostname + 合法 issue time + TTL | 缺一项即不成功；provider 返回 success 不等于服务端发送授权 |

`LOCAL_SYNTHETIC_HOST_REF` 与 `INTEGRATION_SYNTHETIC_HOST_REF` 只能用于本地和
集成 synthetic fixture。`STAGING_HOST_REF` 与 `PRODUCTION_HOST_REF` 只表示环境
配置引用名，不在本候选中写入实际域名。

当前继承代码的 `300000ms` 与默认 `5000ms` 只是 inherited fact；本候选将其显式化，
并把 TTL 精确等于边界由当前的宽松 `>` 语义收紧为 `>=` 拒绝。该差异须在后续实现
和测试门中单独证明。

#### 4.1.1 production request origin/source guard

production enforce 下，邮箱验证码发送属于 unsafe、匿名预认证写入；request
origin/source guard 是 provider verify 之前的独立首门。其输入只包括请求方法、显式
`Origin`、production Origin allowlist 配置引用、是否属于匿名预认证写入，以及解析后的
request media type。通过必须同时满足：

1. `Origin` 存在，规范化后与已配置 allowlist 中某一项精确匹配；
2. 匿名预认证写入的 media type（忽略参数并小写比较）精确等于 `application/json`；
3. guard 与 production allowlist 配置均可用。

缺失或不在 allowlist 的 `Origin`、匿名预认证非 JSON 请求均以 403 拒绝，且 send
count=`0`。guard 或 production allowlist 配置缺失、不可读取或不可判定时 fail-closed
为 503，且 send count=`0`；不得把配置不可用伪装成一次普通来源不匹配。请求自身的
Host、Origin、Referer 均不得被自动提升为 allowlist，也不得从 Referer 推导通过。
challenge hostname 是 provider verify 的独立后续门，不能替代本 guard。

当前继承的 middleware 对 guard 拒绝统一返回 403；本候选明确把“请求不满足规则”
与“guard/allowlist 配置不可用”分别冻结为 403 与 503。该差异必须在后续实现与测试门
单独证明，不能据现状宣称通过。

### 4.2 一次性消费标记

候选标记字段固定为：

```text
schema_version
key_version
environment_ref
action
consumed_at
expires_at
cleanup_after
```

- 文档 ID 使用带 `key_version` 的 HMAC，输入包含环境、动作和 challenge token；不得保存 raw token。
- 标记不得保存 raw token、email、IP 或 UA；日志也不得输出这些值。
- `cleanup_after = expires_at + 1h`。
- `cleanup_after` 之前已有标记一律判定为 replay；不得因标记清理失败而重新放行 token。
- 清理只能删除已过 `cleanup_after` 的标记；清理任务不可改变 TTL 结论。
- key rotation 必须在旧标记保留窗口内保留可验证的 `key_version` 读取能力；具体轮换方案属于 `PENDING_BY_GATE`。
- production 必须使用持久化、事务化消费；local/synthetic 可以使用确定性的内存 guard，但不能据此宣称生产一次性消费通过。

当前 V4 代码已有 `action / consumedAt / expiresAt / schemaVersion` 的持久化回放
guard，但尚未证明 `key_version / environment_ref / cleanup_after` 和显式清理行为。
该差异是候选到实现验收之间的门禁，不是本文件对代码现状的 PASS 声明。

### 4.3 限流与隐私最小化

| 层级 | 候选阈值 | key 语义 |
|---|---:|---|
| account | `3 / 15m` | 规范化邮箱的 keyed pseudonym；不保存 raw email |
| IP | `10 / 15m` | 只取可信代理来源，生成 keyed pseudonym；不读取不可信 forwarded chain |
| device | `5 / 15m` | 服务端派生的 keyed pseudonym；不保存 raw UA/语言串 |
| action | `5 / 15m` | 最小非全局复合 key：`environment_ref + email_send_code + ip_pseudonym` 的 keyed pseudonym；绝不是全站固定动作单桶 |
| session | `N/A` | 未登录邮箱发送属于预认证流程，没有可验证 session；不得用 unknown-session 冒充真实 session |

IP 规则：

- 只接受已配置且受信任的代理来源；当前来源缺失时进入独立 `unknown-proxy` bucket，不能自动放行。
- raw IP 不落库、不写日志；限流记录只保存 keyed pseudonym 和必要计数元数据。
- 限流记录保留到 `window end + 1h`，清理失败不得绕过限制。
- 生产限流不可降级到进程内计数器；外部限流不可用时返回 503 且 send count 必须为 0。

action 层的规范化输入固定为环境引用、动作常量 `email_send_code` 与 IP 层已经生成的
`ip_pseudonym`；三者使用无歧义分隔和带 `key_version` 的 HMAC 再生成
`action_pseudonym`。持久化 key 和日志只允许出现该 keyed pseudonym 与必要版本/计数
元数据，不得出现 raw email、IP、token、UA。不同可信网络伪名不会共享错误的全站
`5 / 15m` 桶；同一可信网络内的不同 account/device 会共享该动作专属桶，使 action
层在 IP `10 / 15m` 之外仍提供独立的验证码发送收敛作用。account、IP、device 层仍须
逐层启用且不得被 action 复合 key 替代或绕过。来源缺失时只复用 IP 规则已经给出的
`unknown-proxy` 伪名输入；本候选不扩展该 bucket 的阈值或策略。

production 的所有 active layers 必须在一次原子事务式 check-and-increment 中完成。
同一请求只能出现两种持久化结果：全部 active layers 通过并各递增一次，或因任一层
饱和/事务失败而全部不递增；禁止部分落账。硬上限 `L` 的语义固定为：预存计数为
`L-1` 时只剩一个容量，并发竞争只能有一个请求提交到 `L`，其余请求返回 429，存储
中不得出现 `L+1`。验收中的“L+1”表示饱和后的额外尝试或并发输家，不表示允许持久化
超发。事务或限流存储不可用时返回 503、send count=`0`，且所有 active layers 保持
事务前计数。窗口年龄为 `W-1` 时仍在原窗口，等于 `W` 时进入新窗口。

### 4.4 重试与既有邮箱语义

- provider 自动重试次数：`0`。
- 同一个 challenge token 永不重试、永不复用；所有失败重试必须取得新 token。
- 新 challenge 的人工重试 cooldown：`5s`；该值只约束 challenge 重新获取，不改变邮箱发送接口的成功语义。
- 既有邮箱发送 cooldown：`60s`，本轮保持不变。
- 既有 email code TTL：`5m`，本轮保持不变。
- 既有 wrong-code 最大次数：`5`，本轮保持不变。
- verify 成功但 consume、限流或既有 60 秒冷却拒绝时，已消费 token 不可再次使用；客户端必须重新获取 challenge。

## 5. 统一失败分类与用户可见边界

| provider-neutral 情况 | HTTP | 用户结果 | 发送断言 |
|---|---:|---|---|
| request Origin 缺失或不在 production allowlist | 403 | 通用请求失败，不泄露 allowlist | send count=`0` |
| 匿名预认证写入 media type 非 `application/json` | 403 | 通用请求失败 | send count=`0` |
| request guard / production allowlist 配置不可用 | 503 | 通用暂不可用提示 | send count=`0` |
| missing / invalid | 403 | 通用“人机验证未通过，请稍后重试” | send count=`0` |
| expired | 403 | 通用失败，不泄露 issue time | send count=`0` |
| replay / duplicate | 403 | 通用失败，不泄露消费细节 | send count=`0` |
| wrong action / wrong host | 403 | 通用失败，不泄露 allowlist | send count=`0` |
| timeout / unreachable | 503 | 通用暂不可用提示 | send count=`0` |
| config/Secret missing | 503 | 通用暂不可用提示 | send count=`0` |
| consume store unavailable | 503 | 通用暂不可用提示 | send count=`0` |
| provider JSON parse abnormal | 503 | 通用暂不可用提示 | send count=`0` |
| rate limit hit | 429 | 通用频繁提示 | send count=`0` |
| rate-limit transaction / store unavailable | 503 | 通用暂不可用提示 | send count=`0`；所有 active layers 零增量 |

provider 错误码、风险分数、Secret、request ID、内部 correlation detail、邮箱是否
存在等信息不得返回给客户端。成功只有在完整校验链通过后才可进入既有邮箱发送函数。

## 6. 环境与证据分离

### 6.1 local/synthetic

local 和 integration 只允许使用 synthetic verifier、synthetic action/hostname、
synthetic clock、synthetic limiter 和 synthetic delivery spy。它们用于证明协议、
边界、顺序、失败映射和 `send-not-called`，不能证明真实 provider、生产 hostname、
生产 Secret、真实邮件或生产网络。request guard 的 local/integration 证据只能注入
命名 synthetic Origin 与 synthetic allowlist fixture，不得据此声称 production 配置通过。

### 6.2 future provider-specific

provider-specific adapter、verify endpoint、site key/Secret、实际 hostname、目标
网络/region、平台变量和 provider response mapping 必须在 V4-S2/S3 另行授权和取证。
production request guard 还须另行提交“显式 production Origin allowlist 配置可读取、
请求值未被自举为 allowlist、403/503 分类符合本收据”的配置与执行证据。本候选只保留
`PRODUCTION_ORIGIN_ALLOWLIST_REF` 引用名，不写实际域名。本文不选择 provider、不写
endpoint、不写 Secret、不执行网络验证。

## 7. 可测试验收矩阵

以下是后续实现/测试必须具备的合同，不是本轮已执行结果：

| 门 | 必须证明 |
|---|---|
| request guard | production enforce 下：显式 allowlist 精确 Origin + 匿名 JSON 才进入 verify；缺失/不允许 Origin 与匿名非 JSON 分别 403，guard/allowlist 配置不可用 503；每种拒绝均 verify count=`0`、send count=`0`，且 Host/Origin/Referer 不会自举 allowlist |
| TTL | `T-1` 通过、`T` 拒绝、`T+1` 拒绝；缺失、未来、非法 issue time 拒绝 |
| timeout | `N-1` 内返回可分类结果；`N` 与 `N+1` fail-closed 为 503；无自动重试 |
| action/host | 精确 `email_send_code` 和环境集合通过；错误 action、错误 host、wildcard 均拒绝 |
| consume | 首次消费成功；并发重复消费只有一个成功；`cleanup_after` 前 replay；清理失败不放行 |
| limit | account/IP/device/action 分别验证硬上限与窗口：预置目标层 `L-1`，用同步屏障并发至少 2 个同 key 请求，只允许 1 个成功写到 `L`，其余 429，最终计数精确为 `L`；强制事务失败返回 503 且所有 active layers 零增量；session 对预认证发送保持 N/A；窗口验证 `W-1/W/W+1` |
| action scope | 用不同 account/device 的 5 个请求填满网络 A 的 `email_send_code` action 桶，第 6 个同网络新主体返回 429；此时不同 `ip_pseudonym` 的网络 B 首个请求仍可通过。另以两个不同网络伪名各自计数，断言互不占用容量，证明不存在全站固定 `5 / 15m` 桶；全过程 account/IP/device 层仍独立检查 |
| order | request guard → verify → consume → limit → existing cooldown → send；request guard 失败时 verify/consume/limit/cooldown/send 均未调用，其余每个前置失败均断言 send 未调用 |
| failure | Origin/JSON 请求违规、guard/allowlist 配置不可用、invalid、expired、replay、wrong action/host、timeout、unreachable、config missing、JSON parse abnormal、consume/rate-limit store unavailable、429 均映射正确 |
| privacy | raw token/email/IP/UA 不进入标记、日志、响应；仅 keyed pseudonym 和必要元数据保留 |
| evidence split | local/synthetic 证据与 future provider-specific、部署、生产和业务证据分别取证 |
| client seam | 邮箱验证码发送必须携带 challenge token，具备 action、无 token 阻断、失败/过期/reset 生命周期；当前代码仍缺该 seam |

当前开发员线程报告的 3/3 files、51/51 tests 只作为输入事实；正式测试收据、独立技术
复核、部署/生产证据和业务验收仍未形成。

## 8. 安全、失败、回滚与重开

- 任一校验不确定、provider 超时/不可达、配置缺失、消费存储失败、限流不可用、清理状态不可证明时，保持 fail-closed，禁止发送。
- 若实际环境 hostname 与 `HOSTSET[environment]` 不一致，停止该环境验证并回到 provider-specific 配置门，不通过放宽匹配绕过。
- 若 key rotation 使旧标记不可读，停止生产验证，保留当前拒绝行为，先修复版本化读取和保留窗口证据。
- 若发现重复发送、绕过客户端 challenge、错误 action/host 可通过、或 send-not-called 断言失败，重开 ISSUE-0032 相关实现/复核，不得以业务可用性接受替代安全门。
- 本候选尚未进入实现，因此不存在可宣称的部署回滚点；后续回滚必须回到上一已验收版本，并禁止恢复未批准或暴露的 Secret。

## 9. PENDING_BY_GATE

以下项目不得伪装为已确认、已通过或已授权：

- 真实 provider、verify endpoint、site key/Secret、实际 hostname、provider response mapping 细节。
- 目标网络/region、DPA、成本、采购、生产配置和平台 Secret 写入。
- CloudBase collection、TTL cleanup job、可信代理配置、key rotation 和 observation window。
- UI copy、无障碍替代路径、人工支持路径和误拒阈值。
- 客户端实现、服务端实现、正式测试收据、独立技术/安全复核、部署、生产证据。
- 业务验收、Issue 管理员关单、项目 workflow 完成。
- ISSUE-0031、数据库和全部付费动作。

## 10. 权责、审查与唯一下一步

- 参数候选 owner：产品经理线程 `019fefa7-9883-7af2-bdb5-acc5c8513781`。
- 业务方已选择方案 B，但该选择只绑定本候选参数方向，不等于最终收据批准。
- 业务方负责最终产品参数和残余风险确认；独立技术/安全角色负责证据复核；实现角色只在后续明确授权后工作；Issue 管理员负责状态与关单。
- `FREEZE_AT=PENDING_BY_GATE:user-selection-time`；`FINAL_RECEIPT_SHA256=PENDING_BY_GATE:after-review-and-final-confirmation`。两者均不是本轮已完成的冻结门。
- Hermes 当前轮次为 `0/3`，本轮未调用 Hermes，未调用 Document QA，也未执行实现、测试、Git mutation、部署或 Issue 操作。

唯一下一步：等待用户单步授权 Hermes Round 1；在该授权前不得开始 Hermes、QA、实现、测试、部署、平台操作或 Issue 状态变更。
