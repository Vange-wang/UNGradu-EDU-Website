# V4 ISSUE-0032 provider-neutral 本地实现回执

日期：2026-08-19
任务：`V4-ISSUE-0032-PROVIDER-NEUTRAL-IMPLEMENTATION-20260819`
代码 owner：`019fefa7-a3c3-7333-94d7-d61961c5ea99 / 代码开发员v2.3.2`
状态：`PROVIDER_NEUTRAL_LOCAL_IMPLEMENTATION_COMPLETE` / `LOCAL_VALIDATION_COMPLETE` / `INDEPENDENT_REVIEW_PENDING`

## 1. 边界与固定起点

- 工作树：`D:\codex_project\家教对接website-v4-issue-0032-email-turnstile-closure`
- 分支：`V4-issue-0032-email-turnstile-closure`
- 基线 HEAD：`ee41c3f30770be6f7a9a0e548975464268b911d2`
- 基线 tree：`bc09512016e9e987f0a591096d10f6a6571eceef`
- 写前状态：clean；本轮未改变 HEAD/tree，未执行任何 Git mutation。
- `package.json` SHA-256：`36CF12650567FB6B736653995072C431592F8C1F7559260F6D3E44047A2FAFFF`
- `package-lock.json` SHA-256：`257A945825407CCDDFCAFA18F1E2C7FAD7FB8D53F39AB99DD5E191F5DD6651BF`
- 参数确认门已通过；本轮只实现 provider-neutral 本地契约，不选择或连接真实 provider，不写 site key、Secret、实际 hostname 或实际 Origin allowlist。

## 2. 实际实现清单

| 路径 | SHA-256 | 作用 |
| --- | --- | --- |
| `app/api/auth/email/send-code/route.ts` | `8644430D967E73C6F439602D33F9F43F7770242FB32A930E0E788C94906C9831` | 将邮箱发送路由接到持久 challenge consume 边界；默认 verifier 仍 provider-neutral fail-closed。 |
| `features/auth/login-form.tsx` | `6129917A277FEC8F7E92483D60DF70725D9FDF179F869C973DEA28479D6EB8C5` | 邮箱发送携带 challenge token；无 token 阻断；发送完成、失败和模式切换清除 token。 |
| `features/auth/turnstile-widget.tsx` | `D363FA29C20881A6F9D7C9351DB078171C8EB5F369A7954617126B9D77771F1C` | action 改为受限联合类型，支持 `email_send_code`；密码默认行为和视觉不变；支持父级 reset 与 5 秒人工重试冷却。 |
| `middleware.ts` | `173ED215F801CEA4E433855F5D9E61DC1739468C1E6DD70D1612EA7C411F34D5` | 真实生产邮箱发送入口在 Origin 配置不可用时 JSON 503；违规 Origin/媒体类型继续 403，并在 handler 前短路。 |
| `server/email-auth-api.ts` | `C40F2D39B521D42007A9BD6CD516430883ABB9B7EAFEA8B16C654CBA60F4E0BD` | 固化 guard→verify→consume→limit→cooldown→send 顺序；5000ms fail-closed；异常转结构化 JSON；邮箱发送使用独立 HMAC 限流键。 |
| `server/security/email-challenge.ts` | `3503B5DA43AD90E2ACE42DD7B412263B35AB03410C5B09126BFDB21E08A6AE67` | 300 秒严格边界、hostname 配置校验、带 key version/environment 的 HMAC 防重放文档及清理时间。 |
| `server/security/rate-limit.ts` | `8D3628C069A52698BA318CAEB4365436AB93B699F9638EE99DFD038A751A63C2` | account/IP/device/action 独立 HMAC 伪名；action 绑定环境、动作和 IP 伪名；持久记录增加安全清理时间。 |
| `tests/email-auth.test.ts` | `718E2AC3FB084CCDFA10036CD592B736EA4E6C484D3C36B2E276907E54319CC1` | 仅补齐受影响生产式合成依赖，不改变既有业务断言。 |
| `tests/issue-0034-security-baseline.test.ts` | `2122118201C49CB00249D6D46681B61815FBF0B7273C9A1A57389054385884B5` | 为既有合成 challenge fixture 显式提供 hostname 配置，保持 fail-closed 回归。 |
| `tests/login-approved-visual-contract.test.ts` | `D4640A35D5FE81C289265FE0FEECB118606E2E5535CE33E88E946290316E6856` | 真实本地 Next + headless Chrome 验证邮箱/密码 action、token reset、脚本重试和可访问错误状态。 |
| `tests/issue-0032-provider-neutral.test.ts` | `C530A645888A44FE543CB42E7BECA9145949AB4A3BF1D3A54FB628BF3ECAF4B8` | 新增 provider-neutral 公共 seam 的 10 项行为测试。 |

本轮未修改 `.env.example`，因为所需持久集合/HMAC 变量名均为已有安全边界；未登记、读取或写入任何值。

## 3. 参数合同映射

### A. 请求来源与媒体类型

- 生产 `POST /api/auth/email/send-code` 缺失/空 Origin allowlist：503 JSON。
- Origin 缺失或不允许、非 `application/json`（允许参数、规范化大小写）：403，并由 middleware 在 handler 前短路。
- 不从请求 Host/Origin/Referer 自举 allowlist；配置来自服务端环境引用。
- 配置失败与违规请求的 challenge verify/consume/limit/cooldown/send 均不会进入。

### B. provider-neutral challenge

- action 固定为 `email_send_code`；widget action 只能在 `email_send_code | password_login` 中选择。
- TTL 采用严格 300 秒：T-1ms 通过，T 与 T+1ms 拒绝。
- handler 级 timeout 为 5000ms：4999ms 结果可接收；5000ms 与 5001ms 503；自动重试为 0。
- expected hostnames 必须由 verifier 的服务端配置集合注入，转小写精确匹配；空集合或 `*` 在 provider 调用前 503。
- missing/invalid/expired/replay/wrong action/hostname 返回 403；timeout/unreachable/config/持久存储异常返回 503；失败均不发送邮件。

### C. 一次性消费

- 持久文档包含 `schemaVersion`、`keyVersion`、`environmentRef`、`action`、`consumedAt`、`expiresAt`、`cleanupAfter`。
- 文档 ID 为 43 字符 HMAC；key version、环境引用、action 和 token 全部进入 HMAC 输入，既保持旧 ID 形状又实现版本隔离。
- 不保存 raw token/email/IP/UA/Secret；`cleanupAfter = expiresAt + 1h`。
- 邮箱 challenge 记录存在即判 replay；即使超过 cleanup 时间但清理尚未发生也不放行。
- 生产路由只接持久事务 guard；内存 guard 仅保留既有 local/synthetic seam，不冒充生产。

### D. 原子分层限流

- 层级：account `3/15m`、IP `10/15m`、device `5/15m`、action `5/15m`；匿名预认证无 session 层。
- account/IP/device/action 使用独立、带 key version 的 HMAC 伪名；未知代理进入 `unknown-proxy` 保守桶。
- action key 绑定 `environmentRef + email_send_code + ip pseudonym`，不是全站固定单桶。
- 单一事务先检查所有层，再全部写入；任一层拒绝或存储异常时零增量。
- 并发剩余 1 个配额时，两个请求恰好一个通过、一个 429，最终计数精确到上限。
- 选择：固定窗口。理由是现有持久 limiter 已以首次接受请求的 `windowStartedAtMs` 为原子窗口锚点，可在不扩张公共 API 的情况下精确复用。W-1 仍受旧窗口限制，W 精确重置，W+1 属于新窗口；持久记录在窗口结束后再保留 1 小时。

### E. 顺序与既有邮箱语义

- 成功顺序严格为 `request guard → verify → persistent consume → layered persistent limit → 60s email cooldown → send`，各一次。
- challenge/provider 不自动重试；token 在发送尝试结束后立即清除；人工重新取得 challenge 的 UI retry 冷却为 5 秒。
- 既有验证码发送冷却 60 秒、验证码 TTL 5 分钟、错误验证码最大 5 次保持不变；原有邮件认证测试回归通过。

### F. 客户端 seam

- 邮箱 code/reset 模式渲染 `email_send_code` action；password 模式保持 `password_login`。
- 无 token 时发送按钮禁用且 handler 再次防御性阻断。
- 请求携带 `challengeToken`；失败、成功、过期、challenge error、脚本失败重试和模式切换均清除旧 token。
- 未加入真实 widget 配置、site key、endpoint、域名或视觉重设计。

## 4. RED → GREEN 证据

统一测试入口使用 V4 自身 Vitest 与绝对 Node 24 路径；每个切片只在公共 seam 观察行为。

1. middleware 真实生产缝：RED 为缺 Origin 配置仍返回 `403 text/plain Forbidden.`，JSON 解析失败；GREEN 为缺配置 503 JSON、缺/错 Origin 与非 JSON 403、合法请求穿过 middleware。
2. TTL：RED 为 300000ms 边界仍 `ok:true`；GREEN 为 T-1 通过，T/T+1 `expired`。
3. hostname 配置：RED 为空集合仍调用 provider 并落入 unreachable；GREEN 为空或 wildcard 在 provider 前 `config-missing`。
4. 持久 replay：RED 为缺 key/environment/cleanup 字段且清理时间后可重用；GREEN 为完整版本化文档、无 raw token、清理未完成仍 replay。
5. 分层键：RED 为 provider-neutral HMAC 键构造器不存在；GREEN 为四维独立伪名及 unknown-proxy 桶。
6. 原子 limiter：RED 为持久记录没有 `cleanupAfter`；GREEN 为并发仅一个到达上限、拒绝零写、固定窗口 W-1/W/W+1 与 +1h 清理语义成立。
7. direct handler guard：RED 为配置不可用返回 403；GREEN 为 verify/consume/limit/send 全 0 且 JSON 503。
8. 完整顺序：首个 RED 暴露旧 raw/账号绑定限流键；第二个 RED 暴露请求 URL hostname 被用于 challenge；GREEN 为配置 hostname、独立 HMAC 键及六阶段顺序各一次。
9. timeout：RED 为 5000ms 仍放行 200；GREEN 为 4999ms 可返回结果，5000/5001ms 503，verifier 仅调用一次。
10. 浏览器生命周期：RED 为邮箱模式不渲染 widget/不发送 token；随后 RED 为 challenge 失败后 retry 未冷却；GREEN 为真实浏览器中邮箱/密码 action、token 轮换、模式切换、脚本重载、5 秒 retry 与可访问通知成立。
11. consume 异常：RED 为事务 adapter 抛错逃逸；GREEN 为 JSON 503，limit/send 均 0。
12. 共享兼容回归：初次 7 文件回归 123/125，两个既有测试发现 replay ID 加前缀破坏 43 字符契约；最小修复让 key version 进入 HMAC 输入而不改变 ID 形状，随后相关 60/60 与完整 125/125 通过。

## 5. 新鲜验证

| 验证 | 结果 |
| --- | --- |
| 新增 ISSUE-0032 定向测试 | exit 0；1 file / 10 tests passed |
| 受影响 7 文件回归 | exit 0；7 files / 125 tests passed |
| 原三文件基线回归 | exit 0；3 files / 51 tests passed；真实本地 Next/headless Chrome browser suite 已运行 |
| 默认 `npm test`（最终候选） | exit 0；81/81 files passed；589 passed / 1 skipped（590 total）；222.72s |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0；0 warnings |
| 无额外环境注入 `npm run build` | exit 0；Next 15.5.19；17/17 静态页；middleware 与邮箱发送路由成功产出 |
| `git diff --check` | exit 0；仅 Git 的 LF→CRLF 工作区提示，无 whitespace error |

唯一 skip 沿用仓库既有显式真实 CloudBase 集成边界；本轮未启用或替代它。

## 6. 安全与隔离证明

- 真实 provider 请求：0；网络探测：0；真实邮箱/token/Cookie/IP/UA：0。
- 真实 Secret/site key/hostname/Origin allowlist 值读取、输出、落盘：0。
- Cloudflare/CloudBase/数据库真实写入/付费/部署/生产操作：0。
- Git add/commit/push/merge/rebase/tag/branch mutation：0。
- `package.json`、`package-lock.json` 未改；未安装依赖。
- 主仓文件写入：0；所有实现、测试、回执与工作记录均位于 V4 隔离 worktree。
- 日志和持久文档不包含 raw token/email/IP/UA/Secret；错误响应仅暴露稳定通用文案。

## 7. 尚未通过的门禁

- provider-specific verifier、真实 widget/site key、Secret、实际 hostname/Origin allowlist 参数尚未接入。
- 未执行真实 provider、平台、数据库、部署或生产验证。
- 尚未独立代码复核，未 commit、未 push。
- ISSUE-0032 仍 open；本回执不等于 V4-S1、provider production、TECH_REVIEW、部署、业务验收或 Issue close。

## 8. 唯一下一步

返回项目总负责人冻结本地候选并路由现有独立代码复核线程；当前 owner 不自行提交、推送、部署或修改 Issue。

## 9. 独立复核返工 R1（2026-08-19）

### 9.1 输入与边界

- 输入报告：`docs/2026-08-19-v4-issue-0032-provider-neutral-independent-code-review.md`；写前/写后均保持 SHA-256 `572E9BA6A48584F2D09982EFE44FBD2F0C3FDD8D15A0119E74C852EF5C5F7E60`，未修改 reviewer-owned 文件。
- 输入结论：`TECH_REVIEW_REWORK_REQUIRED`；Standards P0/P1/P2=`0/1/0`，Spec P0/P1/P2=`0/3/1`。
- 基线仍为 branch `V4-issue-0032-email-turnstile-closure`、HEAD `ee41c3f30770be6f7a9a0e548975464268b911d2`、tree `bc09512016e9e987f0a591096d10f6a6571eceef`；R1 未执行 Git mutation。
- R1 实际改动范围：`server/email-auth-api.ts`、`middleware.ts`、`features/auth/login-form.tsx`、`server/security/email-challenge.ts`、`tests/issue-0032-provider-neutral.test.ts`、`tests/login-approved-visual-contract.test.ts`、`tests/email-auth.test.ts` 以及本回执/工作记录。
- `turnstile-widget.tsx`、`server/security/rate-limit.ts`、`tests/origin-verification-middleware.test.ts`、`tests/issue-0034-security-baseline.test.ts` 无需 R1 代码改动；它们保留原候选并作为回归输入。

### 9.2 finding → 修复映射

1. **P1-S1 可信代理来源**：邮箱发送限流不再读取客户端可控 `cf-connecting-ip`。只有显式注入的 `resolveTrustedClientIp(request)` 结果能进入 keyed IP/action 伪名；缺少注入固定使用 `unknown-proxy`，解析器异常沿既有限流异常边界返回 JSON 503。provider-neutral 默认路由未假定 Cloudflare header 可信。
2. **P1-C1 完整 guard 配置**：生产邮箱发送在 middleware 与 direct handler 中均要求 Origin allowlist、Origin proof secret、CSRF secret 且规范化模式为 enforce；配置不可用在 origin/challenge verifier 前返回 `Cache-Control: no-store` JSON 503。错误 Origin 或媒体类型继续 403。真实 middleware→handler tracer 证明配置失败时 handler/verify/consume/limit/send 全 0，合法配置才进入 handler。
3. **P1-C2 5 秒人工重试冷却**：邮箱 challenge/API 失败使用 `performance.now()` 记录 5000ms 单调截止点；N-1 阻断新请求，N 可使用新 token；再次失败后第二个 N-1 阻断，N+1 使用第三个新 token成功。token 仍在每次尝试后清除，成功后的邮箱 60 秒 cooldown 与 password 模式保持不变。
4. **P1-C3 原子回放/限流矩阵**：新增串行、隔离、可回滚的事务模拟。现有实现 baseline GREEN，无需改 `rate-limit.ts`：同 token 并发恰 1 success/1 replay；account/IP/device/action 各自 L-1 后两并发恰 1 到 L、另 1 返回对应 429，最终精确 L；第二次 set 强制失败后文档 0；同可信网络不同 account/device 的 action 第 6 次 429，另一可信网络首次通过。
5. **P2-C4 exact hostname**：任何空配置、`*`、`*.example.test`、`login.*`、带 scheme/port/空格或非法 label 的值均在 provider 调用前 `config-missing`；合法 mixed-case exact hostname 转小写后成功匹配。非法配置 provider call count=0。

### 9.3 R1 RED → GREEN

| Slice | RED | GREEN |
| --- | --- | --- |
| P1-S1 | 单测 exit 1：仅改变客户端 `cf-connecting-ip` 即生成不同 `ipKey` | 同命令 exit 0；未注入 resolver 的两个请求共享 unknown-proxy IP/action 桶，两个显式可信 resolver 产生不同桶 |
| P1-C1 | middleware tracer exit 1：缺 Origin proof secret 时返回 403，而预期配置不可用 503 | exit 0；三类缺配置均 no-store JSON 503 且 handler 0，违规 Origin/媒体 403，合法配置进入 verifier |
| P1-C2 | 真实浏览器 exit 1：N-1 时请求计数由 1 增至 2 | exit 0；两次 N-1 均无新请求，N/N+1 分别携带新 token，最终成功 |
| P1-C3 | 新增 3 项行为矩阵首次即 3/3 baseline GREEN | 未制造 RED；保留公共事务 seam 的并发、逐层、回滚和跨网络覆盖 |
| P2-C4 | 单测 exit 1：wildcard hostname 进入 provider 并返回 unreachable | exit 0；所有 wildcard/非法配置均 config-missing、provider 0；mixed-case exact 成功 |

### 9.4 新鲜验证与失败隔离

- R1 ISSUE-0032 定向：`tests/issue-0032-provider-neutral.test.ts`，exit 0，15/15。
- 核心四文件最终新鲜回归：exit 0，4 files / 66 tests。
- 安全/路由三文件最终新鲜回归：exit 0，3 files / 45 tests。
- 默认 `npm test` 首轮：exit 1，80/81 files，593 passed / 1 failed / 1 skipped；唯一失败为 Chrome 随机 DevTools 端口命中 Fetch 禁用端口，Node `fetch` 在连接前报 `bad port`，非产品断言。
- 测试基础设施最小修正：同一已授权浏览器测试改用 Node 原生 HTTP PUT 打开 CDP target，不改变页面、token 或行为断言；随后浏览器定向 exit 0。
- 默认 `npm test` 最终新鲜运行：exit 0，81/81 files，594 passed / 1 skipped（595 total），174.49s。唯一 skip 仍为既有显式真实 CloudBase 集成边界。
- 最终 `npm run typecheck`：exit 0。
- 最终 `npm run lint`：exit 0，0 warnings。
- 清除当前构建进程适用项目环境变量后的 `npm run build`：exit 0，Next 15.5.19，17/17 静态页，middleware 与邮箱发送路由成功产出。
- `git diff --check`：exit 0；仅行尾工作区提示，无 whitespace error。

### 9.5 R1 安全与状态

- 未读取、输出或写入真实 provider、site key、Secret、hostname、Origin allowlist、邮箱、IP、UA、token 或 Cookie。
- 外网/provider/Cloudflare/CloudBase/真实数据库/付费/部署/生产操作均为 0；Git mutation 均为 0；package/lock 无 diff。
- 当前状态：`REWORK_COMPLETE` / `LOCAL_VALIDATION_COMPLETE` / `TARGETED_RE_REVIEW_PENDING`。
- 本状态不等于 `TECH_REVIEW_PASS`、commit、push、provider-specific、部署、生产或 ISSUE-0032 close。

### 9.6 R1 最终代码/测试固定包

| 路径 | 最终 SHA-256 |
| --- | --- |
| `app/api/auth/email/send-code/route.ts` | `8644430D967E73C6F439602D33F9F43F7770242FB32A930E0E788C94906C9831` |
| `features/auth/login-form.tsx` | `3573CE939C4E988ECF52EC557A4762D2040FF886FDDB858BB631BE98BB911504` |
| `features/auth/turnstile-widget.tsx` | `D363FA29C20881A6F9D7C9351DB078171C8EB5F369A7954617126B9D77771F1C` |
| `middleware.ts` | `E7D9777F18FE92658104ADF9ED9C2C55267C2DE3BD78CA7689BBA6AEC281DB42` |
| `server/email-auth-api.ts` | `CC7174B413586D936F5FBB0A7A521578EA641649FE781C9161ABF3345A370B44` |
| `server/security/email-challenge.ts` | `8BF5B96947651DCB40C438113C64D6DCFF78E201D057A26FF09C2939D13B6DC0` |
| `server/security/rate-limit.ts` | `8D3628C069A52698BA318CAEB4365436AB93B699F9638EE99DFD038A751A63C2` |
| `tests/email-auth.test.ts` | `6D8238D4A065CDD856DA093C56E60AC9507A3270E45D10328C14E20572D3C6EE` |
| `tests/issue-0034-security-baseline.test.ts` | `2122118201C49CB00249D6D46681B61815FBF0B7273C9A1A57389054385884B5` |
| `tests/login-approved-visual-contract.test.ts` | `D151D84783C79267ACCE11F79B2F65217B7A62CC393FD4682F09AB19FFD2FB1C` |
| `tests/issue-0032-provider-neutral.test.ts` | `EF910518A7A7E71487389B2BF8E3C0AACE8FF0966C4CC6A694BEE635FFEF8D72` |

reviewer-owned 报告保持 SHA-256
`572E9BA6A48584F2D09982EFE44FBD2F0C3FDD8D15A0119E74C852EF5C5F7E60`；
其不属于代码 owner 候选，也未被本轮修改。

## 10. R1 唯一下一步

返工候选返回项目总负责人，由其交同一独立复核线程做 targeted re-review；当前 owner 不自行复核、提交、推送、部署或修改 Issue。
