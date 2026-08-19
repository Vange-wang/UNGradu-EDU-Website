# V4 ISSUE-0032 provider-neutral 独立代码复核 R1

日期：2026-08-19
任务：`V4-ISSUE-0032-PROVIDER-NEUTRAL-TARGETED-RE-REVIEW-R1-20260819`
执行角色：`019fefa7-d1d3-7ac3-a5ba-8b8abe299958 / 独立代码复核v2.3.2 / gpt-5.6-sol / high`
来源：`01a00565-5d72-7663-991d-178c5dcfd170 / 项目总负责人v2.3.3`

## 1. Verdict

`TECH_REVIEW_PASS`

- Standards P0/P1/P2：`0/0/0`。
- Spec P0/P1/P2：`0/0/0`。
- 首轮 5 项 finding：`P1-S1 CLOSED`、`P1-C1 CLOSED`、`P1-C2 CLOSED`、`P1-C3 CLOSED`、`P2-C4 CLOSED`。
- 本结论只表示 provider-neutral 本地候选通过 targeted R1 独立技术门；不等于 provider-specific 接入、commit/push、部署、生产验证、产品/业务验收或 ISSUE-0032 关闭。

## 2. 固定点、manifest 与保护边界

- branch：`V4-issue-0032-email-turnstile-closure`。
- HEAD：`ee41c3f30770be6f7a9a0e548975464268b911d2`。
- tree：`bc09512016e9e987f0a591096d10f6a6571eceef`。
- candidate：相对 HEAD 的未提交 working-tree diff；`0 staged`。
- 业务候选仍为 `11 tracked modified + 2 untracked`；工作树另有 reviewer-owned 首轮报告 1 个 untracked，已明确排除且保持只读。
- 当前 tracked patch Git OID：`9c5b22744e53c156b1dae37616dda427ee14ab0d`；shortstat：`11 files changed, 531 insertions(+), 69 deletions(-)`。
- 来源包给定 R1 聚合标识：SHA-256 `A35873C00FF2AA691D0F7A7F0FB3C283DC01D4791C50B418CE8B4ED4764F3A86`。该包未给出聚合序列化算法；本复核不反向猜测算法，以以下 13 个逐文件 SHA-256、bytes、lines 作为独立固定身份，均与来源包的逐文件固定值一致。
- missing/extra：业务候选 `0/0`；首轮报告不是业务候选。

| # | 路径 | SHA-256 | bytes / lines |
|---:|---|---|---:|
| 1 | `Code文档/app/api/auth/email/send-code/route.ts` | `8644430D967E73C6F439602D33F9F43F7770242FB32A930E0E788C94906C9831` | 1709 / 40 |
| 2 | `Code文档/features/auth/login-form.tsx` | `3573CE939C4E988ECF52EC557A4762D2040FF886FDDB858BB631BE98BB911504` | 18827 / 574 |
| 3 | `Code文档/features/auth/turnstile-widget.tsx` | `D363FA29C20881A6F9D7C9351DB078171C8EB5F369A7954617126B9D77771F1C` | 5273 / 177 |
| 4 | `Code文档/middleware.ts` | `E7D9777F18FE92658104ADF9ED9C2C55267C2DE3BD78CA7689BBA6AEC281DB42` | 5446 / 170 |
| 5 | `Code文档/server/email-auth-api.ts` | `CC7174B413586D936F5FBB0A7A521578EA641649FE781C9161ABF3345A370B44` | 20726 / 678 |
| 6 | `Code文档/server/security/email-challenge.ts` | `8BF5B96947651DCB40C438113C64D6DCFF78E201D057A26FF09C2939D13B6DC0` | 11153 / 355 |
| 7 | `Code文档/server/security/rate-limit.ts` | `8D3628C069A52698BA318CAEB4365436AB93B699F9638EE99DFD038A751A63C2` | 10580 / 336 |
| 8 | `Code文档/tests/email-auth.test.ts` | `6D8238D4A065CDD856DA093C56E60AC9507A3270E45D10328C14E20572D3C6EE` | 39456 / 1152 |
| 9 | `Code文档/tests/issue-0034-security-baseline.test.ts` | `2122118201C49CB00249D6D46681B61815FBF0B7273C9A1A57389054385884B5` | 24155 / 663 |
| 10 | `Code文档/tests/login-approved-visual-contract.test.ts` | `D151D84783C79267ACCE11F79B2F65217B7A62CC393FD4682F09AB19FFD2FB1C` | 22503 / 530 |
| 11 | `Code文档/tests/issue-0032-provider-neutral.test.ts` | `EF910518A7A7E71487389B2BF8E3C0AACE8FF0966C4CC6A694BEE635FFEF8D72` | 39536 / 1091 |
| 12 | `Code文档/docs/2026-08-19-v4-issue-0032-provider-neutral-local-implementation-receipt.md` | `483DEF4F9A5A7A53A71EA3BE1E4CE26174DCC1297DD3021869BE4E2BBF4FB893` | 18786 / 207 |
| 13 | `Code文档/开发员工作记录.md` | `80FE1207AC32B1750819EB74DE6E3D9B38BD5F41335A90B3A0FA697DF856868E` | 295569 / 4454 |

只读锚点：

- 首轮独立报告 SHA-256=`572E9BA6A48584F2D09982EFE44FBD2F0C3FDD8D15A0119E74C852EF5C5F7E60`，16186 bytes / 144 lines，未修改。
- `package.json` SHA-256=`36CF12650567FB6B736653995072C431592F8C1F7559260F6D3E44047A2FAFFF`；`package-lock.json` SHA-256=`257A945825407CCDDFCAFA18F1E2C7FAD7FB8D53F39AB99DD5E191F5DD6651BF`；二者相对 HEAD diff=`0/0`。
- 主工作树保持 branch=`V2-unified-navigation-responsive-profile-20260729`、HEAD=`33314857da0f2d72066443965454d23fc70a16d3`、全仓 staged=`23`、Code staged=`2`、cached OID=`d00aa22eb314e5c82710388d656a2250ff482ee8`。

## 3. Standards pass（先冻结）

### P0

none。

### P1-S1 closure：CLOSED

- 路径/行号：`Code文档/server/email-auth-api.ts:34-50,130-185`；`Code文档/app/api/auth/email/send-code/route.ts:16-35`；`Code文档/tests/issue-0032-provider-neutral.test.ts:464-548`。
- 结论：邮箱发送路径不再直接信任客户端 `cf-connecting-ip`。只有显式注入的服务端 `resolveTrustedClientIp(request)` 能区分网络；生产默认 route 未注入 resolver，因此固定落入 `unknown-proxy`。resolver 抛错、HMAC 配置错误或 limiter 异常均被同一 `try/catch` 映射为 JSON 503，发送不会执行。
- 反例证据：测试仅改变客户端声明 IP 时，`ipKey/actionKey` 保持相同；显式注入两个可信 resolver 时，两组 keyed pseudonym 才不同；断言对象不含 raw IP。
- Standards 新 findings：P0/P1/P2=`0/0/0`。

## 4. Spec pass

### P0

none。

### P1-C1 closure：CLOSED

- 路径/行号：`Code文档/middleware.ts:47-75,95-151`；`Code文档/server/email-auth-api.ts:293-360`；`Code文档/tests/issue-0032-provider-neutral.test.ts:108-368`。
- 结论：production 邮箱发送在 `ALLOWED_ORIGINS`、`ORIGIN_VERIFY_SECRET`、`CSRF_SECRET` 任一缺失/空值或 guard 非 enforce 状态时，在 Origin/challenge verifier 之前返回 `Cache-Control: no-store` 的 JSON 503；请求自身错误 Origin、缺 Origin或非 JSON 仍为 403。合法配置与合法请求才进入 handler/verifier。
- 调用链证据：真实 middleware→handler tracer 对三类缺配置均得到 handler/verify/consume/limit/send=`0/0/0/0/0`；违规请求同样全 0；合法配置进入 handler 且 verifier 恰 1 次。direct handler 负例对 verify/consume/limit/send 均为 0。

### P1-C2 closure：CLOSED

- 路径/行号：`Code文档/features/auth/login-form.tsx:29-33,75-143`；`Code文档/tests/login-approved-visual-contract.test.ts:300-529`。
- 结论：challenge/API 失败使用 `performance.now()` 建立单调 5000ms 截止点；N-1 阻断请求，N 可提交新 token；第二次失败后的 N-1 仍阻断，N+1 使用第三个新 token 成功。每次尝试结束均先清 token并 reset；成功后既有 60 秒邮件 cooldown 保留，密码模式 action 与行为未改变。
- 浏览器证据：测试启动真实本地 Next，使用 headless Chrome/Edge 驱动页面和网络 seam；三次请求依次携带三个不同 token，N-1 两次请求计数均不增加，并继续覆盖脚本失败重载、邮箱/密码 action、challenge error/expired 与无障碍 alert。

### P1-C3 closure：CLOSED

- 路径/行号：`Code文档/server/security/email-challenge.ts:108-189`；`Code文档/server/security/rate-limit.ts:119-230`；`Code文档/tests/issue-0032-provider-neutral.test.ts:34-91,774-881,916-1089`。
- 结论：email 同 token 并发消费结果精确为 1 success/1 replay；account/IP/device/action 分别预置 L-1 后并发，仅 1 个写到 L、输家返回对应 429，最终各 active layer 精确为 L；第二次 set 强制失败时事务 staged 状态不提交，文档数为 0；同可信网络由不同 account/device 共享 action 5 次上限，第 6 次 429，另一可信网络首次通过。
- 测试真实性：事务模拟先复制 committed state 到 staged state，operation 全部成功后才整体替换 committed map；中途 set 抛错不会执行 commit，且并发通过串行事务队列观察上一个已提交结果。测试调用公开 replay guard、持久 limiter 与 keyed-key seam，不以内部字符串断言替代行为。

### P2-C4 closure：CLOSED

- 路径/行号：`Code文档/server/security/email-challenge.ts:85-101,202-217`；`Code文档/tests/issue-0032-provider-neutral.test.ts:718-772`。
- 结论：空列表、任意包含 `*` 的 wildcard、scheme、port、空格和非法 label 均在 provider 调用前判为 `config-missing`；provider call=`0`。mixed-case 合法 exact hostname 规范化为小写后成功匹配，未引入宽泛匹配。

### Spec 新 findings

P0/P1/P2=`0/0/0`。

## 5. 新鲜独立验证

| 验证 | 本轮结果 |
|---|---|
| R1 核心四文件 | exit 0；4/4 files；66/66 tests |
| 受影响安全/路由三文件扩展回归 | exit 0；3/3 files；64/64 tests |
| 默认 `npm test` | exit 0；81/81 files；594 passed / 1 existing skipped（595 total）；171.83s |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0；0 warnings |
| `npm run build` | exit 0；Next 15.5.19；17/17 static pages；middleware 与邮箱发送路由成功产出 |
| `git diff --check HEAD` | exit 0；仅 LF→CRLF 工作区提示，无 whitespace error |

唯一 skip 仍为仓库既有显式真实 CloudBase 集成边界；未将其写成 provider-specific 或生产通过。

## 6. 边界、未通过门禁与唯一下一步

- 未修改业务候选 13 文件、首轮报告、R1 实现回执、开发记录、Spec、Issue、中央/其他角色文件或 UI。
- 未执行 npm install、网络、真实 provider/Secret、Cloudflare/CloudBase、数据库真实写、付费、Git mutation、commit/push、部署、生产、Issue 状态修改或任务/subagent 创建。
- workflow 仍为 `WORKFLOW_ACTIVE`；ISSUE-0032 仍 open。本轮未通过门禁：provider-specific verifier、真实 widget/site key/Secret、实际 hostname/Origin allowlist、commit/push、部署、生产技术证据、产品/业务验收与 Issue close。
- 唯一下一步：交项目总负责人收口本地 provider-neutral 技术门并决定后续受限门禁；本角色不自行提交、推送、接入 provider、部署或修改 Issue。
