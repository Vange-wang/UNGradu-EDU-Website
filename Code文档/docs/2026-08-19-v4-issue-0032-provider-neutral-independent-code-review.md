# V4 ISSUE-0032 provider-neutral 独立代码复核

- 任务：`V4-ISSUE-0032-PROVIDER-NEUTRAL-INDEPENDENT-REVIEW-20260819`
- 日期：`2026-08-19`
- 执行角色：`019fefa7-d1d3-7ac3-a5ba-8b8abe299958 / 独立代码复核v2.3.2 / gpt-5.6-sol / high`
- 被审 worktree：`D:\codex_project\家教对接website-v4-issue-0032-email-turnstile-closure`
- 独立结论：`TECH_REVIEW_REWORK_REQUIRED`

## 1. 结论与权限边界

本轮严格按 `code-review` 要求先冻结 Standards 轴，再进入 Spec 轴。发现计数：

- Standards：P0/P1/P2=`0/1/0`
- Spec：P0/P1/P2=`0/3/1`

现有定向、全量、类型、lint、build 均为新鲜 exit 0，但这些绿灯没有覆盖全部冻结契约；其中真实浏览器测试还把服务端 challenge 403 后的立即二次请求写成了 GREEN，与已确认的 5 秒新 challenge 人工重试 cooldown 相反。因此当前候选不得通过独立技术门。

本结论只针对当前未提交 provider-neutral working-tree 候选。它不授权修改候选、provider 接入、Git mutation、commit/push、部署、平台/Secret/数据库/付费操作、生产验收、业务验收或 ISSUE-0032 关单。项目 workflow 保持 `WORKFLOW_ACTIVE`。

## 2. 固定点、manifest 与输入身份

- branch：`V4-issue-0032-email-turnstile-closure`
- fixed HEAD：`ee41c3f30770be6f7a9a0e548975464268b911d2`
- fixed tree：`bc09512016e9e987f0a591096d10f6a6571eceef`
- candidate：相对 fixed HEAD 的未提交 working-tree diff
- tracked patch Git OID：`2c4aa24fb8d2342a6af51d8e7e731e680cc5ec50`
- tracked shortstat：`11 files changed, 370 insertions(+), 54 deletions(-)`
- candidate manifest：`11 tracked modified + 2 untracked / 0 staged`
- 13 文件哈希清单指纹：SHA-256 `C28A17EA972035ACA27C6EC3784FA18AA7FC0B032E67405A22AD050746400808`
- missing/extra：`0/0`
- `package.json`：SHA-256 `36CF12650567FB6B736653995072C431592F8C1F7559260F6D3E44047A2FAFFF`
- `package-lock.json`：SHA-256 `257A945825407CCDDFCAFA18F1E2C7FAD7FB8D53F39AB99DD5E191F5DD6651BF`
- package/lock diff：`0/0`

候选逐文件身份：

| # | 路径 | SHA-256 | bytes / lines |
|---:|---|---|---:|
| 1 | `Code文档/app/api/auth/email/send-code/route.ts` | `8644430D967E73C6F439602D33F9F43F7770242FB32A930E0E788C94906C9831` | 1709 / 40 |
| 2 | `Code文档/features/auth/login-form.tsx` | `6129917A277FEC8F7E92483D60DF70725D9FDF179F869C973DEA28479D6EB8C5` | 18135 / 553 |
| 3 | `Code文档/features/auth/turnstile-widget.tsx` | `D363FA29C20881A6F9D7C9351DB078171C8EB5F369A7954617126B9D77771F1C` | 5273 / 177 |
| 4 | `Code文档/middleware.ts` | `173ED215F801CEA4E433855F5D9E61DC1739468C1E6DD70D1612EA7C411F34D5` | 5227 / 162 |
| 5 | `Code文档/server/email-auth-api.ts` | `C40F2D39B521D42007A9BD6CD516430883ABB9B7EAFEA8B16C654CBA60F4E0BD` | 20039 / 657 |
| 6 | `Code文档/server/security/email-challenge.ts` | `3503B5DA43AD90E2ACE42DD7B412263B35AB03410C5B09126BFDB21E08A6AE67` | 10652 / 338 |
| 7 | `Code文档/server/security/rate-limit.ts` | `8D3628C069A52698BA318CAEB4365436AB93B699F9638EE99DFD038A751A63C2` | 10580 / 336 |
| 8 | `Code文档/tests/email-auth.test.ts` | `718E2AC3FB084CCDFA10036CD592B736EA4E6C484D3C36B2E276907E54319CC1` | 39186 / 1147 |
| 9 | `Code文档/tests/issue-0034-security-baseline.test.ts` | `2122118201C49CB00249D6D46681B61815FBF0B7273C9A1A57389054385884B5` | 24155 / 663 |
| 10 | `Code文档/tests/login-approved-visual-contract.test.ts` | `D4640A35D5FE81C289265FE0FEECB118606E2E5535CE33E88E946290316E6856` | 20383 / 481 |
| 11 | `Code文档/tests/issue-0032-provider-neutral.test.ts` | `C530A645888A44FE543CB42E7BECA9145949AB4A3BF1D3A54FB628BF3ECAF4B8` | 22949 / 650 |
| 12 | `Code文档/docs/2026-08-19-v4-issue-0032-provider-neutral-local-implementation-receipt.md` | `EB2F09B0B908C6AAAC08069AF9A247D202A07A6B205147BB3DFE11353A824F16` | 11389 / 135 |
| 13 | `Code文档/开发员工作记录.md` | `B8A533CE52539FB9239283D62D75E7EFE36CCFB905A48A7F5CDDA18973C6772E` | 293633 / 4429 |

规范/证据输入：

- 参数收据候选：SHA-256 `52358D5F7BC7BE75819CA6CBBFDA9D8AAD64C98CF8863D91A4A197E75F557ECF`，18543 bytes / 259 lines。
- Hermes Round 2：SHA-256 `7F9D66B2027658797FC118596082EBFFB867665CF5FC5C6EC7D09FD21C63A768`，6911 bytes / 87 lines。
- 用户最终确认记录：SHA-256 `2DC7D6096BE82FB3F1A45B7F40A594AC44BAFF57E022376FC8D717A54DD0FA9D`，5615 bytes / 79 lines。
- ISSUE-0032 canonical 实际路径：`协同工作文档/ISSUE/Open_Issue/ISSUE-0032-邮箱验证码发送前人机验证服务端强制校验.md`，SHA-256 `714E115A73420B2183993F5B1A5C0D54AF54562BFBE125BF37E1EB287781BBC2`，12270 bytes / 88 lines。复核包所写 `Issue_List/ISSUE-0032.md` 不存在；通过精确预期哈希定位到上述 canonical，属于路径勘误，不影响内容身份。
- 开发回执：SHA-256 `EB2F09B0B908C6AAAC08069AF9A247D202A07A6B205147BB3DFE11353A824F16`。

## 3. Standards pass（先冻结）

### P0

none。

### P1-S1：未在代码信任边界内证明 `cf-connecting-ip` 来自已配置可信代理

- 路径/行号：`Code文档/server/email-auth-api.ts:140-163`；`Code文档/server/security/rate-limit.ts:64-99`
- 证据：邮箱发送限流直接读取请求的 `cf-connecting-ip` 并作为 `trustedProxyIp` 生成 IP/action 伪名。当前函数没有可信代理适配器、来源认证结果或“仅在可信上游已覆盖该头时才读取”的条件；只要请求到达 handler，改变该请求头即可改变 IP 与 action bucket。`env.TRUSTED_PROXY_IP` 只是 header 缺失时的备选值，也没有建立来源信任。
- 可复现影响：两个 email、UA、环境完全相同、仅 `cf-connecting-ip` 值不同的 handler 请求会生成不同 IP/action keyed pseudonym。若未来 provider-specific/部署边界没有保证该头由可信代理覆盖，客户端可通过伪造头拆分 `IP 10/15m` 与 `action 5/15m` 桶；本地 provider-neutral 代码不能把尚待平台取证的事实当成已成立。
- 违反：安全边界必须在生产代码中显式、可验证；参数收据 `4.3` 要求“只接受已配置且受信任的代理来源”，来源缺失进入 `unknown-proxy`，不读取不可信 forwarded chain。
- 最小返工：把可信客户端 IP 作为经过上游认证/配置的服务端依赖注入；未证明可信来源时固定进入 `unknown-proxy`。新增负例证明客户端自报 `cf-connecting-ip` 不能拆桶，并把 future Cloudflare/Worker header 覆盖行为留到 provider/platform 门取证。

### P2

none。

## 4. Spec pass

### P0

none。

### P1-C1：guard 配置不可用只覆盖空 allowlist，其他配置故障仍被错误归类为 403

- 路径/行号：`Code文档/middleware.ts:70-98,108-122`；`Code文档/server/email-auth-api.ts:288-314`；`Code文档/tests/issue-0032-provider-neutral.test.ts:49-166`
- 证据：新增 503 分支只判断 `ALLOWED_ORIGINS` 为空。middleware 的 origin source guard 若 `ORIGIN_VERIFY_SECRET` 缺失，会先在 `result.shouldReject` 分支返回 `403 text/plain`；`CSRF_SECRET` 缺失则由 `evaluateWriteRequest` 落入统一 403。direct handler 也只把空 allowlist 特判为 503，其余 guard 配置故障沿用 guard 返回状态。新增测试只覆盖空 allowlist，没有覆盖 source-guard/CSRF 等必需 guard 配置不可用。
- 可复现影响：生产 `POST /api/auth/email/send-code` 在合法 Origin/JSON、但 `ORIGIN_VERIFY_SECRET` 或 `CSRF_SECRET` 不可用时返回 403，将系统配置故障伪装成普通请求违规。verify/send 虽未调用，但 403/503 契约不成立。
- 违反：参数收据 `4.1.1`、失败表与验收矩阵要求请求违规为 403，guard/allowlist 配置缺失、不可读取或不可判定为 JSON 503，且 verify/send count 均为 0。
- 最小返工：为该精确路由在 middleware 与 direct handler 统一识别全部必需 guard 配置/状态；配置不可用返回同一 no-store JSON 503，请求不满足规则仍 403。补真实 middleware→handler tracer，逐项断言 verify/consume/limit/cooldown/send 全 0。

### P1-C2：服务端 challenge 失败后立即取得并提交新 token，未执行 5 秒人工重试 cooldown

- 路径/行号：`Code文档/features/auth/login-form.tsx:75-78,101-124`；`Code文档/features/auth/turnstile-widget.tsx:55-70,95-106`；`Code文档/tests/login-approved-visual-contract.test.ts:370-437,471-474`
- 证据：`sendCode` 对任意 API 结果在 `finally` 直接 `resetTurnstile()`；widget 的 `resetSignal` 分支立即调用 `window.turnstile.reset()`，不会进入 `beginRetryCooldown()`。5 秒 cooldown 只由 widget 自身 `error-callback`/`expired-callback` 的 `clearToken()` 触发。真实浏览器测试把首个 `/api/auth/email/send-code` 403 模拟为 `synthetic challenge consumed`，随后等待第二个 token 后立即再次点击，并断言连续发送 token 1、token 2；没有等待或断言 5 秒。
- 可复现影响：invalid/replay/wrong action/host 等服务端 challenge 拒绝后，客户端可立即获取新 token 并重发，不符合已冻结的新 challenge 人工重试节流。token 未复用，但 5 秒参数未实现。
- 违反：参数收据 `4.4` 固定“新 challenge 的人工重试 cooldown=5s”，所有失败重试必须取得新 token；客户端 seam 需覆盖失败/过期/reset 生命周期。
- 最小返工：服务端 challenge/API 失败导致 token 作废时，同时启动 5 秒 challenge reacquire/retry cooldown；在 cooldown 内不自动产生可提交的新 token或不允许再次发送。保留成功后的 60 秒邮件 cooldown与密码模式兼容。浏览器测试必须用单调时间证明 5 秒前不可提交、边界后新 token 可提交。

### P1-C3：冻结的限流/回放验收矩阵未被当前测试证据完整覆盖

- 路径/行号：`Code文档/tests/issue-0032-provider-neutral.test.ts:446-529,533-648`
- 证据：回放用例是顺序首次消费/版本轮换/清理未删除后的 replay；本文件没有 `email_send_code` 同 token 并发双消费只允许一个成功的用例。限流用例只验证键形状及单一 action limit=1 的同 key 双请求；没有分别对 account/IP/device/action 预置 `L-1` 后并发竞争，没有强制事务中途失败后四层零增量，也没有用不同 account/device 填满网络 A 的 5 次 action 桶、验证第 6 次 429 与网络 B 首次仍通过。现有 ISSUE-0034 回归包含旧 password-login 回放并发，但不能替代本轮 email action 的完整受影响矩阵。
- 可复现影响：测试全部通过仍不能证明四层硬上限、跨主体 action 范围、事务失败零部分写和 email action 并发消费。当前 81 文件绿灯因此不足以支持参数收据的正式本地验收结论。
- 违反：参数收据验收矩阵 `consume`、`limit`、`action scope`、`failure` 明确要求上述行为证据；用户本包也要求判断测试是否真实观察公开 seam、是否伪通过。
- 最小返工：在 provider-neutral 测试中补齐 email challenge 并发消费；对四层逐层做 `L-1/L/L+1` 并发门；强制事务失败并断言全部 active layers 零增量；以不同 account/device、同/异可信网络完成 action 5/15m 范围矩阵。不得仅断言内部 key 字符串形状。

### P2-C4：hostname 配置只拒绝字面量 `*`，没有拒绝其他 wildcard 形式

- 路径/行号：`Code文档/server/email-auth-api.ts:216-224`；`Code文档/server/security/email-challenge.ts:191-200`；`Code文档/tests/issue-0032-provider-neutral.test.ts:427-444`
- 证据：两处配置检查均只使用 `includes("*")`/`has("*")`，因此 `*.example.test`、`login.*` 等含通配符的条目被视作已配置并会进入 verifier；测试也只覆盖空集合和单独的 `"*"`。
- 影响：真实 provider 通常不会返回含 `*` 的 hostname，因此没有证明当前存在放行真实错误 host 的 P0/P1；但配置故障未在 provider 调用前 fail-closed，且 provider-neutral verifier seam 可返回同字符串而被 exact list 接受，违反“禁止 wildcard”的确定性配置契约。
- 违反：参数收据 `4.1` 和 action/host 验收门禁止 wildcard，配置缺失/无效应在 provider 调用前拒绝。
- 最小返工：标准化后拒绝任何包含 wildcard 语义或非合法精确 hostname 的条目，并补 `*.example.test`、`login.*`、混合大小写 exact hostname 的正负例。

## 5. 已核对通过的契约部分

1. `action=email_send_code`、TTL `299999/300000/300001ms`、handler timeout `4999/5000/5001ms` 的代码与测试边界一致；provider 自动重试为 0。
2. 成功路径顺序为 `guard → verify → persistent consume → layered limit → existing 60s cooldown → send`；定向顺序测试各调用一次。
3. challenge replay 文档 ID 使用带 `keyVersion/environmentRef/action/token` 的 HMAC；文档不保存 raw token，包含 `cleanupAfter`；email action 在清理实际删除前持续判 replay。
4. account/IP/device/action 均生成 keyed pseudonym；action 绑定 environment、`email_send_code` 与 IP pseudonym；生产持久 limiter 不回退进程 Map。
5. 客户端无 token 阻断、email/password action、token 携带、API 后 token 失效、widget error/expired/reset/unmount 清理和密码模式兼容均有实现与浏览器证据；仅 5 秒服务端失败冷却不成立。
6. 候选未新增实际 site key、Secret、真实 hostname 或真实 Origin allowlist；route 默认 verifier 保持 provider-neutral fail-closed。本地 synthetic 证据没有被当作 provider-specific/部署/生产通过。
7. 未发现 raw token/email/IP/UA/Secret 进入 replay/rate-limit 持久文档或响应；代码未扩入 ISSUE-0031、数据库迁移、付费、部署或生产操作。

## 6. 新鲜独立验证

1. 核心定向：`tests/issue-0032-provider-neutral.test.ts`、`email-auth.test.ts`、`issue-0034-security-baseline.test.ts`、`login-approved-visual-contract.test.ts`：`4/4 files，61/61 tests`，exit 0，23.28s。
2. 受影响安全/路由：`issue-0034-security-rework.test.ts`、`issue-0034-route-exports.test.ts`、`origin-verification-middleware.test.ts`：`3/3 files，64/64 tests`，exit 0，2.95s。
3. 默认全量：`81/81 files，589 passed / 1 skipped，共590`，exit 0，211.76s。唯一 skipped 不写成 passed。
4. `npm run typecheck`：exit 0。
5. `npm run lint`：exit 0，`--max-warnings=0`。
6. 无 `.env/.env.local/.env.production/.env.production.local` 文件条件下 `npm run build`：Next.js 15.5.19 compiled successfully，静态页面 `17/17`，exit 0；`/login` 与 API 均为动态路由。
7. `git diff --check`：exit 0；仅 LF→CRLF 提示，无 whitespace error。
8. 上述通过只证明现有断言和构建回归，不消除第 3、4 节 findings。

## 7. 保护状态、未执行项与唯一下一步

- 主工作树写前保护：branch=`V2-unified-navigation-responsive-profile-20260729`，HEAD=`33314857da0f2d72066443965454d23fc70a16d3`，staged=`23`、Code staged=`2`、cached patch OID=`d00aa22eb314e5c82710388d656a2250ff482ee8`。
- 主仓独立复核工作记录写前：SHA-256 `0450F6BE6617ECA6BEA6746BDBA24A4C15AFEDC249433CE7B7C0780186936C2B`，24326 bytes / 190 lines；本轮只允许保持此前缀并追加。
- 本轮未修改候选 13 文件、Spec、Issue、中央注册、其他角色文件或 UI；唯一持久源码/文档写入是本报告与主仓工作记录追加。获准 build 仅清理并重建 Git 忽略的 `.next` 可再生产物。未执行 Git mutation、npm install、网络、provider、Cloudflare/CloudBase、Secret、数据库、付费、部署、生产、Issue 状态修改、任务或 subagent 创建。
- 未通过门禁：provider-neutral 本地独立技术门；随后 provider-specific 选择/接入、平台/网络、commit/push、部署、生产、产品/业务验收与 ISSUE close 均未开始或未通过。
- 唯一下一步：项目总负责人把本报告一次性返回原代码 owner；原 owner 仅在重新授权的精确返工范围内修复 P1-S1、P1-C1/C2/C3 与 P2-C4，提交新的完整候选 manifest/hash/新鲜门禁后，再由本独立复核线程做 targeted re-review。本角色不自行修复或推进下一门。
