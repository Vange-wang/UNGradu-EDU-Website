# V4 / ISSUE-0032 Provider-Specific Authorization Package — Document QA Round 1 整改记录

## 1. 批次身份与边界

- 任务 ID：`V4-ISSUE-0032-PROVIDER-AUTH-DOCQA-R1-20260820`
- 执行角色：`DocumentQAv2.3.2 / 019fefa7-c5cf-7e62-9859-5263998dfd77`
- 来源：`项目总负责人v2.3.3 / 01a00565-5d72-7663-991d-178c5dcfd170`
- workflow：`WORKFLOW_ACTIVE`
- ISSUE-0032：`open`
- 本批状态：仅整改 Hermes Round 1 的完整 S1/S2 SERIOUS 批次；不是自我批准、不是 `DOCUMENT_GATE_PASSED`、不是实现、测试、平台、部署、生产或 Issue 授权。
- 共享审查预算：Hermes Round 1/3 已使用；Document QA 整改不重置轮次；下一门为 Hermes Round 2/3 聚焦复核。
- 用户冻结决定：本轮用户明确选择生产观察方案 A；本记录不得将阈值冻结写成观察已执行或已通过。

## 2. 冻结输入与并发保护

| 输入 | 写前 SHA-256 | bytes | lines | 核对结果 |
|---|---:|---:|---:|---|
| provider-specific canonical | `9C1D6E4CC505F1B0A3B06E5F2A64618573D4D70ADA1A1CDA1C15D704160A5142` | 28576 | 333 | 写前再次匹配，允许进入整改 |
| Hermes Round 1 报告 | `CE917BAB5F5B3054A0E2A308FCC1121C6AD1EBCE6589CE13110209B2F8195A72` | 6883 | 83 | `REWORK_REQUIRED`，2 SERIOUS / 5 NON_SERIOUS |
| Hermes Round 1 metadata | `41287DEF24F2C8719AB1645372E21E09662E28061084BAD6A7C0375C6CB77A46` | 946 | 16 | round=1/3；model=`deepseek-v4-pro`；source unchanged；默认模型未改 |
| Document QA 工作记录 | `7674CA449D8BA6D2ECED038CD73A7780C0896630E16037D0FE6E22D5C2314C60` | 17477 | 114 | 仅允许 prefix-preserving append |

- V4 exact code baseline：branch `V4-issue-0032-email-turnstile-closure`；commit `23c959e0fc1e8096828fb8c855ecddb2800995bf`；tree `90addce1c5ca2d7cfd9acc5084156ab4e1860b97`。
- 写前复核 V4 worktree clean；main 既有 dirty/untracked 状态不清理、不恢复、不暂存、不提交。
- 产品经理线程仍可能 active；总负责人已冻结 canonical 写入 owner。本批写前 canonical hash 与冻结输入一致；写后仍须复核只含三项白名单变化。
- 只读核对未读取、复制、记录或输出任何真实 Secret、token、Cookie、邮箱或 SMTP 凭据。

## 3. SERIOUS 整改矩阵

### S1 — 变量名称到实际代码读取位置缺少最小绑定

- **原位置/问题**：canonical §3 与 §6.2 仅列能力、变量名称和平台名称存在性，没有把变量逐项绑定到 V4 exact commit 的实际 consumer；下游可能误把“名称存在”当成 send-code route 已接线。
- **新位置/文本语义**：
  - §3.1 明确 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 已经 `runtime-public-config.ts → login/page.tsx → login-page-content.tsx → login-form.tsx → turnstile-widget.tsx` 传递；缺失时不产生可提交 token。
  - §3.1 明确目标 `app/api/auth/email/send-code/route.ts` 仍构造 `createFailClosedEmailChallengeVerifier()`，没有读取 `TURNSTILE_SECRET_KEY` 或 `TURNSTILE_EXPECTED_HOSTNAMES`；这两个变量仅在密码登录 route 有读取证据。
  - §3.2 把未来最小代码主范围收敛到 send-code route；共享 verifier、API 与客户端链路默认不改，除非定向测试证明必要。
  - 新增 §6.3，逐项覆盖 §6.2 全部变量组，以及 `action=email_send_code` 和 `expected hostname=ungraduedu.eu.cc`；每行给出分类、实际读取位置、`WIRED / PRESENT_BUT_NOT_WIRED / PLATFORM_ONLY / PENDING_BY_GATE`、消费语义、缺失时 fail-closed、未来 owner 与证据。
  - §6.3 明确 `TURNSTILE_EXPECTED_HOSTNAMES` 的现有 parser 使用 ASCII 逗号 U+002C、trim/lowercase/去空项和 exact 校验。该说明是让 S1 绑定可执行的直接必需回归，不代表关闭 ISSUE-0046 N5。
  - §10.1 增加错误变量名、缺失值、site key/Secret 错配、wrong hostname/action 的确定性 fail-closed 与 send=0 验收；§6.3 增加变量或读取位置变化时重新冻结的 closure trigger。
- **依据**：只读追溯 exact commit 中 `server/runtime-public-config.ts`、login page/content/form/widget、`app/api/auth/email/send-code/route.ts`、`app/api/auth/password/login/route.ts`、`server/security/email-challenge.ts`、`server/email-auth-api.ts`、`server/email-auth.ts`、`server/email-delivery.ts`、`server/security/request-guard.ts`、`server/security/rate-limit.ts`、`server/security/session-revocation.ts`、`server/auth-session.ts` 与 `middleware.ts`。未凭平台截图或推测补读取位置。
- **选择理由**：这是冻结事实内唯一能同时区分客户端已接线、目标服务端未接线、平台名称存在和未来证据门的最小矩阵；它不会把密码登录 route 的读取证据错误外推到邮箱 send-code route。
- **冻结决定保持**：provider、action、hostname、TTL、timeout、Origin/CSRF 顺序、replay/限流、数据库延期和禁止输出 Secret 均未放宽；没有执行实现或平台动作。
- **定向验收**：未来 Round 2 应逐行核对 exact commit 读取位置；确认错误名称/缺失值 fail closed；缺 site key 不产生 token；site key/Secret 错配、wrong hostname/action 在 consume/limit/send 前拒绝且 send=0；任何证据不含值。
- **受影响回归**：§0 将“作者阶段未运行 Document QA”与“本次只做 S1/S2、未运行 Round 2”分开；§3.1、§3.2、§6.2 后新增 §6.3、§9 用户确认状态、§10.1、§13–§15 的门禁和下一步。该 §0 修正只消除本批执行事实冲突，未修改 `CURRENT_REVIEW_ROUND=0/3` 等 ISSUE-0046 元数据。

### S2 — 生产观察窗口与停止阈值未量化

- **原位置/问题**：canonical §10.2、§11、§12 仅要求观察窗口和停止条件，没有量化样本、双账号方向、错误率分母、停止阈值、延迟/送达阈值和恢复规则。
- **新位置/文本语义**：新增 §10.3“用户冻结的生产观察方案 A”，并同步 §9、§11、§12、§13–§15：
  - 仅 2 个专用测试邮箱/账号 A、B；连续 24 小时；单次中断最多 15 分钟，超过即整段从零重启。
  - 至少 24 次合法合成端到端请求，A/B 各 12 次，覆盖至少 4 个时间段。
  - 至少 6 组双账号隔离验证：A→B 3 组、B→A 3 组。
  - 合法分母须同时满足新鲜 token、正确 action/hostname、合法 Origin/CSRF、未触发 cooldown/限流；恶意、错误、wrong action/hostname、replay 和主动触发限制的负例不进入误拒率分母。
  - provider verify、SMTP、应用接口任一子系统达到连续 2 次系统错误、累计 3/24，或任意 1 小时错误率达到 5% 且有效样本不少于 10 次，立即停止。
  - 配置缺失、Secret 错配、JSON parse abnormal、provider success 但 action/hostname 错误立即停止；合法语义误拒必须 0/24，1 次可复现即停止。
  - 接口响应超过 10 秒或合法邮件 120 秒未收到，单次 degraded；连续 2 次或累计 3/24 停止；禁止无 Turnstile 降级。
  - Secret/隐私泄露、错误 action/hostname 放行、replay 再消费、Origin/CSRF 绕过、双账号串扰、未授权对象可见、verify/consume 前发送均零容忍立即停止。
  - 固定代码、平台、独立复核、产品/业务 owner；证据只含脱敏时间线、子系统状态/延迟、双账号矩阵、送达时间及停止/恢复记录。
  - 唯一责任层修复后完整 24 小时从零重启；Secret/隐私事件须轮换与独立复核，禁止恢复旧 Secret。
- **依据**：本轮用户明确确认的冻结方案 A；没有改成 12 个账号，也没有自行改变数字。
- **选择理由**：把误拒分母、安全负例、子系统错误、延迟、零容忍事件和恢复分别定义，才能让独立复核给出确定 pass/fail，并防止以 HTTP 200、部署号或少量样本替代生产观察。
- **冻结决定保持**：阈值冻结不等于执行通过；生产观察、实现、平台、部署、产品/业务风险接受仍为 `PENDING_BY_GATE`。
- **定向验收**：Round 2 应逐项核对 `2 accounts / 24h / 24 requests / 6 groups` 与所有停止、证据、owner、从零恢复条款无漂移；确认合法误拒 pass 只能为 0/24。
- **受影响回归**：§9 用户确认行、§10.2 后新增 §10.3、§11、§12、§13–§15。

## 4. NON_SERIOUS 与未关闭事项

- Hermes Round 1 N1–N5 均由 ISSUE-0046 管理，本批没有修改 ISSUE-0046，也不宣称任何 N 项关闭。
- `CURRENT_REVIEW_ROUND=0/3` 等纯 N1 元数据未因本批单独润色。
- 唯一触及 N5 邻域的是 §6.3 对现有 hostname parser 的 delimiter/normalization 描述；其直接因果是让 S1 的变量→读取位置绑定可执行，仍不关闭 N5。
- 未处理其他措辞、格式、外部 hash、默认值或可选增强；ISSUE-0031、数据库与全部付费动作继续延期。

## 5. 输出与门禁

| 输出 | 写后 SHA-256 | bytes | lines |
|---|---:|---:|---:|
| provider-specific canonical | `56D8C7060A10F996A58DC9F30CCE767F07537B9EF90AB6F69DDB59D098E30EFC` | 41113 | 379 |

- canonical 输入→输出：`9C1D6E...A5142` → `56D8C7...E30EFC`；变化只对应 S1/S2 及其直接回归。
- Document QA 工作记录将在本账本冻结后仅追加；最终文件 hash/bytes/lines 与前 17477 bytes prefix 证明由完成回报给出。
- 报告、metadata、产品经理工作记录、ISSUE 总表、CONTEXT、中央注册/总览、角色文件、代码、UI 与平台配置均不在写入范围，完成前须复核未变。
- 当前门禁：`HERMES_ROUND_2_PENDING`。
- 唯一下一步：项目总负责人运行 Hermes Round 2/3，聚焦复核 S1/S2 及其直接回归；本线程不得执行。
