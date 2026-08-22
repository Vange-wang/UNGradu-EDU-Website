# V4 ISSUE-0032｜V4-S2 Provider-Specific Authorization Package

## 0. 文档状态与授权边界

- 文档状态：`DRAFT_NON_CANONICAL / AUTHOR_DRAFT / HERMES_REVIEW_PENDING`
- 审查预算：`MAX_REVIEW_ROUNDS=3`
- 当前审查轮次：`CURRENT_REVIEW_ROUND=0/3`
- 任务 ID：`V4-ISSUE-0032-PROVIDER-SPECIFIC-AUTH-PACKAGE-20260820`
- 执行角色：产品经理 v2.3.2（`019fefa7-9883-7af2-bdb5-acc5c8513781`）
- 项目 workflow：`WORKFLOW_ACTIVE`
- ISSUE-0032：仍为 open；当前 Issue 总表显示 `open / IMPLEMENTATION_AUTHORIZATION_PENDING`。
- 本包的唯一作用是形成 provider-specific 参数、Secret、平台配置和后续证据链的作者草案。用户本次授权覆盖“进入该大门禁并形成授权包”，不等于代码实现授权、平台写入授权、部署授权、生产通过或 Issue 关闭。
- 作者草案阶段未运行 Hermes、Document QA、npm、测试、build 或 Git mutation。本次仅由注册 Document QA 整改 Hermes Round 1 的 S1/S2；未运行 Hermes Round 2、npm、测试、build 或 Git mutation，未写代码/UI、未打开 Cloudflare/CloudBase 控制台，也未读取、生成、复制或回显任何真实 Secret、token、Cookie、邮箱凭据或 SMTP 值。

## 1. 目标、非目标与选定复用路径

### 1.1 目标

本包为 V4-S2 建立一份可审查、可冻结、可分层取证的 provider-specific 授权边界，覆盖：

1. 复用现有 Cloudflare Turnstile Widget 与既有 SMTP 邮件发送机制的选择依据；
2. provider、hostname、action、Secret 引用和 CloudBase 变量名称之间的最小绑定关系；
3. 当前代码的真实接线差距、允许的最小代码范围与测试矩阵；
4. Secret、未成年人数据、token、邮箱、IP、回放标记和日志的隐私边界；
5. 从实现、测试、独立技术复核、平台配置、部署、生产验证、产品/业务验收到 Issue 管理员关单的证据分层；
6. 失败停止、回滚、Secret 轮换和重新打开条件。

### 1.2 非目标

- 不在本包内选换新的 Turnstile provider、邮件 provider、SMTP 服务商或地区网络。
- 不在本包内采购、付费、签署 DPA、建立 CloudBase collection、执行 TTL 清理任务、查询数据库或验证数据库权限。
- 不在本包内修改 ISSUE-0032 canonical/state、Issue 总表、Spec、参数候选、用户确认记录、中央注册/总览或其他角色文件。
- 不在本包内实现、测试、提交、推送、部署、生产验证、UI 文案验收或关闭 Issue。
- 不把现有 Widget、环境变量名称、DeployId、代码层 `TECH_REVIEW_PASS` 或提交回执写成 provider-specific production pass。

### 1.3 选定复用路径与成本边界

当前作者草案选择“复用现有 Cloudflare Turnstile Widget + 复用既有 SMTP 机制”，原因是代码基线已经包含官方客户端、Cloudflare `siteverify` endpoint、`email_send_code` action 和既有邮件发送抽象。该选择不代表真实 provider、SMTP 连通性、中国大陆网络可用性、DPA 或成本已经通过。

- 新增 provider：不引入。
- 新采购或新计费：本包不授权；不新增采购。
- 增量成本：`PENDING_BY_GATE`。复用路径不能自动证明现有计划覆盖、零增量成本或不产生跨境/地区费用。
- DPA、数据处理地区和中国大陆目标网络：`PENDING_BY_GATE`。
- 复用既有 SMTP：仅表示沿用代码中的既有发送机制；既有服务商身份、SMTP 连通、发信域、DPA、成本和生产送达仍需单独证据。

## 2. 当前事实来源与精确基线

### 2.1 V4 代码基线

只读复核得到：

| 项目 | 当前事实 |
|---|---|
| branch | `V4-issue-0032-email-turnstile-closure` |
| exact commit | `23c959e0fc1e8096828fb8c855ecddb2800995bf` |
| tree | `90addce1c5ca2d7cfd9acc5084156ab4e1860b97` |
| parent | `ee41c3f30770be6f7a9a0e548975464268b911d2` |
| local tracking | local branch 与 `origin/V4-issue-0032-email-turnstile-closure` 均指向 `23c959e…`；本次仅复读本地 tracking 快照，未联网刷新远端 |
| worktree | clean |
| 代码层上游结论 | provider-neutral `TECH_REVIEW_PASS` 与 `POST_PUSH_COMMIT_ATTESTATION_PASS` 作为上游输入；仅证明本地/代码层，不证明 provider-specific、平台配置、部署或生产 |

相关只读代码文件已回读，hash/字节/行数如下：

| 文件 | SHA-256 | bytes | lines |
|---|---|---:|---:|
| `Code文档/server/security/email-challenge.ts` | `8BF5B96947651DCB40C438113C64D6DCFF78E201D057A26FF09C2939D13B6DC0` | 11153 | 355 |
| `Code文档/server/email-auth-api.ts` | `CC7174B413586D936F5FBB0A7A521578EA641649FE781C9161ABF3345A370B44` | 20726 | 678 |
| `Code文档/app/api/auth/email/send-code/route.ts` | `8644430D967E73C6F439602D33F9F43F7770242FB32A930E0E788C94906C9831` | 1709 | 40 |
| `Code文档/features/auth/turnstile-widget.tsx` | `D363FA29C20881A6F9D7C9351DB078171C8EB5F369A7954617126B9D77771F1C` | 5273 | 177 |
| `Code文档/features/auth/login-form.tsx` | `3573CE939C4E988ECF52EC557A4762D2040FF886FDDB858BB631BE98BB911504` | 18827 | 574 |
| `Code文档/server/runtime-public-config.ts` | `517E00C40590AE778F7C702BD00315CC8B1534ECC01A2ACD5677BF5A15EAE394` | 301 | 9 |
| `Code文档/server/api-utils.ts` | `D6BF4EF63F27082AC8E606746E9DBC78862D36A474144E811C3281B38BE47584` | 13120 | 434 |
| `Code文档/server/security/rate-limit.ts` | `8D3628C069A52698BA318CAEB4365436AB93B699F9638EE99DFD038A751A63C2` | 10580 | 336 |
| `Code文档/server/origin-request-verification.ts` | `AA3F5651B4079879F6F641FD3FB1398A1845BDB627EB78A432987D165777CF75` | 2785 | 101 |
| `Code文档/tests/issue-0032-provider-neutral.test.ts` | `EF910518A7A7E71487389B2BF8E3C0AACE8FF0966C4CC6A694BEE635FFEF8D72` | 39536 | 1091 |
| `Code文档/tests/email-auth.test.ts` | `6D8238D4A065CDD856DA093C56E60AC9507A3270E45D10328C14E20572D3C6EE` | 39456 | 1152 |

### 2.2 既有 V4 回执来源

以下回执只作为继承事实与范围输入，不把其结论扩写为本包通过：

| 回执 | SHA-256 | bytes / lines | 只读结论边界 |
|---|---|---:|---|
| `Code文档/docs/2026-08-18-v4-issue-0032-branch-base-independent-review.md` | `DB640B30E3CDF4016AAA1B35C25745CF910BF7E3E03C086DA8EB5D5D886356C4` | 13840 / 160 | 前序 `TECH_REVIEW_REWORK_REQUIRED`，已由 R1 返工链承接 |
| `Code文档/docs/2026-08-18-v4-issue-0032-branch-base-independent-r1-review.md` | `756027FDB465C65AA8ED41CE4EA536F4D629E1FE84AFA1B65DC3E7E60C143239` | 10400 / 143 | `TECH_REVIEW_PASS`；仅为 base/代码范围独立复核，不是 provider-specific pass |
| `Code文档/docs/2026-08-18-v4-issue-0032-isolated-dependency-runtime-receipt.md` | `738AFD2DCD83EF3B06AD08936902EFF718CAD74113DBC0B10F9AC5FF726CC4E8` | 5075 / 70 | 依赖运行时受阻；不能声称本包或测试 ready |
| `Code文档/docs/2026-08-18-v4-issue-0032-branch-creation-receipt.md` | `140D487AEFCBCEEDCDB48D32E3CC1AC2B0573A4382559A81C69BA86E973F42D5` | 7649 / 91 | 分支创建与初始 clean/no-carry；不表示实现、部署或关单 |
| `Code文档/docs/2026-08-18-v4-issue-0032-branch-base-receipt-candidate.md` | `FD1BC12D1C9FECB2687D3A6CCFA35B5971BFE81ED02744787CB0FF90A2929C76` | 24100 / 223 | base candidate；不表示 `BASE_ACCEPTED` |
| `Code文档/docs/2026-08-18-v4-issue-0032-red-contract-baseline-receipt.md` | `DDEBD437897D82197E731FFD39469CAD07D075B384B6F7970AD5255862B82191` | 8882 / 94 | RED/契约基线输入；本包不重跑测试 |

### 2.3 Spec、参数与 Issue 绑定

- ISSUE-0032 关闭 Spec：`F7939E3BD8769B9BE4CB18335A71B1BC624FD32182827F099F219F8DD36B9073`，16889 bytes / 191 lines。
- 参数候选：`52358D5F7BC7BE75819CA6CBBFDA9D8AAD64C98CF8863D91A4A197E75F557ECF`，18543 bytes / 259 lines；其用户确认记录已将方案 B 固定参数确认为产品基线。
- 参数确认记录：`2DC7D6096BE82FB3F1A45B7F40A594AC44BAFF57E022376FC8D717A54DD0FA9D`，5615 bytes / 79 lines。
- 当前 ISSUE-0032 canonical：`714E115A73420B2183993F5B1A5C0D54AF54562BFBE125BF37E1EB287781BBC2`，12270 bytes / 88 lines；状态仍 open。
- 项目 Active Open 仍为 11 项；ISSUE-0031、数据库和全部付费动作继续延期。

## 3. 当前代码接线差距与允许的最小实现范围

### 3.1 已有能力与真实差距

`email-challenge.ts` 已包含 provider-neutral 抽象、Cloudflare `siteverify` endpoint、精确 hostname 校验、`email_send_code` action 校验、300 秒 TTL、5 秒超时、错误分类和持久 replay guard；`login-form.tsx` 已有 `TurnstileWidget` 的 `email_send_code` action 与 `challengeToken` 请求 seam。`server/runtime-public-config.ts` 已读取并裁剪 `NEXT_PUBLIC_TURNSTILE_SITE_KEY`，经 `app/login/page.tsx`、`login-page-content.tsx` 传到 `login-form.tsx` 与 `turnstile-widget.tsx`；缺失时前端不产生可提交 token。`email-auth-api.ts` 已将 challenge 失败、consume、限流、既有 60 秒 cooldown 和发送串在同一 fail-closed 流程中。

真实差距是 `app/api/auth/email/send-code/route.ts` 当前仍构造 `createFailClosedEmailChallengeVerifier()`，且目标 route 没有读取 `TURNSTILE_SECRET_KEY` 或 `TURNSTILE_EXPECTED_HOSTNAMES`。这两个变量只在 exact commit 的密码登录 route 中存在读取证据，不能据此推定邮箱 send-code 已接线。因此仅把 Secret、hostname allowlist 或 site key 写入 CloudBase，不会使邮箱 send-code route 真实调用 Cloudflare verifier；必须经过后续单独授权，由代码 owner 做最小 verifier factory/env wiring。当前差距不能写成生产故障已修复，也不能通过平台变量写入绕过。

### 3.2 仅在实现授权后允许讨论的代码范围

以下范围是 provider-specific 实现提案，不是本轮实现授权：

1. `Code文档/app/api/auth/email/send-code/route.ts`：目标接线主范围；把 fail-closed factory 替换为使用既有 Cloudflare verifier 且受环境配置控制的工厂，读取 `TURNSTILE_SECRET_KEY` 与 `TURNSTILE_EXPECTED_HOSTNAMES`；缺配置、配置异常或依赖不可用必须继续 fail closed。
2. `Code文档/server/security/email-challenge.ts`：默认只复用现有 verifier、endpoint、action、hostname、TTL、timeout 和 fail-closed 错误映射；只有定向测试证明共享 helper 无法完成目标 route 接线时，才允许提出最小补丁，不放宽校验。
3. `Code文档/server/email-auth-api.ts`：默认不改；只有定向测试证明 verifier 注入或配置传递契约不一致时才允许提出最小补丁，且必须保留 `verify → consume → account/IP/device/action limit → existing email cooldown → send` 顺序与失败 send count=0。
4. `Code文档/tests/issue-0032-provider-neutral.test.ts`、`Code文档/tests/email-auth.test.ts` 及必要的单一 provider-specific 合成测试文件：只补覆盖本次接线差距的断言。
5. `Code文档/server/runtime-public-config.ts`、`app/login/page.tsx`、`features/auth/login-page-content.tsx`、`features/auth/login-form.tsx` 与 `turnstile-widget.tsx` 默认不改，因为当前 site key 与 email action/token seam 已存在；只有独立测试证明该链路与服务端契约不一致时，才可提出另一个最小范围决定。UI 文案、无障碍替代和视觉验收不由本包豁免。

明确排除：数据库 schema/collection 创建或迁移、Origin/CSRF 规则放宽、trusted client IP、SMTP provider 替换、其他 Issue、生产配置文件写入、Secret 值进入代码或测试、无关 UI 重排。上述范围均须由用户再次确认并由各 owner 取证。

## 4. Cloudflare Turnstile provider-specific 事实与引用边界

### 4.1 Widget 事实

- Widget 名称：`ungradu-edu-login-prod`。
- 绑定 hostname：`ungraduedu.eu.cc`，1 个 hostname。
- 模式：`Managed`。
- pre-clearance：未启用。
- site key：平台中存在；值不记录、不进入仓库、日志、截图或回复。
- 官方客户端与 verify endpoint：代码基线已固定；本包不重新调用 endpoint。

### 4.2 预期 provider 响应契约

对邮箱验证码发送，必须同时满足：

- provider success 为 true；
- provider action 精确等于 `email_send_code`；
- provider hostname 精确等于配置的 `ungraduedu.eu.cc`，大小写归一化后仍须在 exact allowlist 内；
- challenge timestamp 合法、不可为未来且年龄小于 300 秒；`age >= 300s` 拒绝；
- token 未被 replay/duplicate 消费；
- consume 成功后才允许限流、既有 60 秒邮件 cooldown 和发送。

禁止 wildcard，禁止用请求 Host 自动生成 allowlist，禁止把 provider 返回的任意 hostname 当作配置来源。`TURNSTILE_EXPECTED_HOSTNAMES` 的真实值、生产映射与平台读取尚未独立证明，属于 `PENDING_BY_GATE`。

### 4.3 Secret 与公开配置

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`：公开客户端配置名称；截图只证明名称存在，不证明值、环境匹配或 Widget 实际可用。
- `TURNSTILE_SECRET_KEY`：服务端 Secret 引用名称；真实值只能留在 CloudBase/Cloudflare 加密 UI，不能进入仓库、日志、截图、对话或测试输出。
- Secret 值不得由产品经理、聊天记录或代码 owner 复制传播；只允许在另行授权的平台 UI 操作中映射。

## 5. 截图证据索引与证明分层

本轮只读取 7 个用户提供的脱敏 PNG 文件的原始字节并计算 SHA-256、bytes、dimensions；未把图像复制入仓库，未回显图中值，未记录任何 Secret 或配置值。

| 编号 | 文件 | SHA-256 | bytes | dimensions |
|---:|---|---|---:|---:|
| 1 | `codex-clipboard-2e8417d7-2434-455e-9c2a-983075ddba68.png` | `3C9C4F30754171BEC587F10B3922F3DF840E5E4CA52F561D2FB036CBD30B76D9` | 130789 | 2334x1306 |
| 2 | `codex-clipboard-d9513536-1cb0-4030-b293-67066d31334c.png` | `7FA102BB57AD6A1D467F54B375DA6A99332202280F541926BA61E419985779CB` | 186357 | 2280x1444 |
| 3 | `codex-clipboard-bad045eb-1027-4029-bcac-4c0d5cf952cd.png` | `3043CF645F9118F456A7EAAC86AC20C4DA31C66DB9A5B07311CFB0B05AA3397D` | 208700 | 2154x1336 |
| 4 | `codex-clipboard-7b853fc5-dc1a-463a-9684-bf2bdfb0a663.png` | `1BC08BBBDAC976498094532CBD2CCA6A679BC77F1E49E82E8BFC109E8E7D0BB3` | 229644 | 2066x1314 |
| 5 | `codex-clipboard-c68d0d86-81f6-4ee2-961f-41ebd06872f0.png` | `A50A171CC617F6F30F684C1EA6EBDA4C168BBEE8C4F86C9D8CAD4C63609CCBFA` | 35884 | 494x836 |
| 6 | `codex-clipboard-3ebe9420-d815-454f-8725-17091f7f562d.png` | `ACE35219D177C6F94846ACF9F41DF24650DFAF0674C8A0C65810214C06891EA7` | 56686 | 476x830 |
| 7 | `codex-clipboard-3f1d39f2-fa66-4ea7-a8f1-c9043f8077a3.png` | `E0C8E8E10D35504230EFA2546F4780DCBFAEA8D6CB926D95CCFEF40820350896` | 58032 | 482x912 |

截图集合可支持的事实层：Widget 名称、hostname、Managed/单 hostname/no pre-clearance 等平台页面事实，以及 CloudBase 环境变量名称存在性。截图集合不可支持：任何变量值正确性、Secret 匹配、SMTP 连通、provider 返回、collection 实际存在/权限/事务/清理、trusted proxy、China 网络、DPA、成本、生产可用性或 Issue 关闭。截图 hash 只证明输入字节身份，不提升其证明层级。

## 6. CloudBase 平台与环境变量名称存在性

### 6.1 继承平台上下文

- CloudBase 服务：`ungradu-edu-prod`。
- 类型：container / normal。
- DeployId `066`：`2026-08-18 00:03:55`，100% 流量，1 实例；这是既有平台上下文，不是本包部署结果。
- DeployId `065`：build failed / 0 实例。
- DeployId `064`：normal / 0 流量，作为历史稳定锚点输入；版本号不证明 Git SHA 映射。
- 本包不执行数据库操作、不验证 collection、不写环境变量、不重启或部署服务。

### 6.2 变量名称矩阵

截图只证明“名称存在性”。实际值、Secret 对应关系、环境读取、连通性和运行效果均为 `PENDING_BY_GATE`。平台配置写入 owner 统一为“经总负责人另行授权的平台执行者”；代码读取/映射 owner 为原实现 owner；产品/业务 owner 只确认语义与风险，不直接代替平台或代码 owner。

| 分组 | 变量名称 | 分类 | 当前证明 | owner / 后续门 |
|---|---|---|---|---|
| 运行环境 | `APP_ENV` | 非 Secret 运行边界 | 名称存在 | 平台执行者写入；代码 owner 证明 production fail-closed |
| 会话/验证码 Secret | `AUTH_SESSION_SECRET`、`EMAIL_CODE_SECRET` | Secret | 名称存在，不证明值 | 平台加密 UI；代码 owner 证明独立用途与轮换 |
| 邮件 provider | `EMAIL_PROVIDER`、`EMAIL_FROM` | 受限配置 | 名称存在 | 平台执行者；SMTP provider/DPA/cost 仍 pending |
| SMTP 连接 | `SMTP_HOST`、`SMTP_PORT`、`SMTP_SECURE`、`SMTP_USER`、`SMTP_PASS` | 连接配置/凭据 | 名称存在，不证明可连通 | `SMTP_PASS` 仅加密 UI；平台与邮件 owner 取证 |
| Origin/CSRF | `ORIGIN_VERIFY_SECRET`、`ORIGIN_VERIFY_MODE`、`CSRF_SECRET`、`ALLOWED_ORIGINS` | Secret/安全边界 | 名称存在 | 平台执行者与代码 owner；不得在本包放宽 enforce |
| 限流 | `AUTH_RATE_LIMIT_COLLECTION`、`AUTH_RATE_LIMIT_KEY_SECRET` | collection 名称/Secret | 名称存在，不证明 collection | 数据库延期；不得新建、查询或迁移 |
| 回放 | `AUTH_CHALLENGE_REPLAY_COLLECTION`、`AUTH_CHALLENGE_REPLAY_KEY_SECRET` | collection 名称/Secret | 名称存在，不证明事务/权限/清理 | 数据库延期；只保留 fail-closed 设计 |
| Turnstile 客户端 | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | 公开客户端配置 | 名称存在，不证明值匹配 Widget | 平台执行者与代码 owner；不记录值 |
| Turnstile 服务端 | `TURNSTILE_SECRET_KEY` | Secret | 名称存在，不证明匹配 Widget | 平台加密 UI；不得进入仓库/日志/聊天 |
| Turnstile allowlist | `TURNSTILE_EXPECTED_HOSTNAMES` | 非 Secret exact allowlist | 名称存在，不证明实际值 | 平台执行者；必须 exact、无 wildcard |
| 会话版本/撤销 | `AUTH_SESSION_KEY_VERSION`、`AUTH_SESSION_REVOCATION_REQUIRED` | 非 Secret 安全开关 | 名称存在 | 平台执行者与代码 owner 证明 rotation/revocation |

名称存在性不等于生产有效绑定。尤其不能由截图推出 `TURNSTILE_SECRET_KEY` 与 Widget 的 site key 属于同一配置、SMTP 可连接、CloudBase collection 存在、事务原子或 cleanup 已运行。

### 6.3 exact commit 变量读取与目标 route 绑定矩阵

本矩阵只追溯 V4 exact commit `23c959e0fc1e8096828fb8c855ecddb2800995bf` / tree `90addce1c5ca2d7cfd9acc5084156ab4e1860b97`，不证明平台实际值或生产执行结果。状态语义：`WIRED` 表示该变量或常量在 exact commit 有可追溯消费链；`PRESENT_BUT_NOT_WIRED` 表示仓库已有读取或能力，但没有接入本包目标 send-code route；`PLATFORM_ONLY` 表示目前只有平台/冻结业务事实；`PENDING_BY_GATE` 表示仍需未来 owner 提交掩码配置、实现、测试或独立复核证据。任何 `WIRED` 都不自动等于生产通过。

| 变量/常量 | Secret/公开分类 | exact commit 实际读取位置 | 当前状态 | 消费语义与缺失时 fail-closed | 未来 owner / 必需证据 |
|---|---|---|---|---|---|
| `APP_ENV` | 非 Secret 运行边界 | `app/api/auth/email/send-code/route.ts` 的 route environment；`middleware.ts` 的 production guard | `WIRED` + `PENDING_BY_GATE` | 决定 production fail-closed 路径；生产环境归类本身必须由部署配置证明，不得仅凭变量名称存在推定 | 平台 owner 提供掩码环境证据；代码 owner 与独立复核 owner证明 production 分支 |
| `AUTH_SESSION_SECRET` | Secret | `server/auth-session.ts` 的 session secret 读取；密码登录 API 复用其 fail-closed 结果 | `WIRED` + `PENDING_BY_GATE` | 生产缺失时不签发/不接受有效 session；不得输出值 | 平台 owner 掩码证据；代码 owner 的缺失值测试 |
| `EMAIL_CODE_SECRET` | Secret | `server/email-auth.ts` 的 email code hash secret 读取 | `WIRED` + `PENDING_BY_GATE` | 生产缺失时无法生成可验证 code hash，发送链返回 503，send=0 | 平台 owner 掩码证据；代码 owner fail-closed 测试 |
| `EMAIL_PROVIDER`、`EMAIL_FROM` | 受限配置 | `server/email-delivery.ts` 的 provider 与 sender 配置 | `WIRED` + `PENDING_BY_GATE` | 缺失、provider 不支持或 sender 无效时 delivery 不成立，API 返回 503；不得把配置错误当成功 | 邮件/平台 owner 的掩码配置与合成送达证据 |
| `SMTP_HOST`、`SMTP_PORT`、`SMTP_SECURE`、`SMTP_USER`、`SMTP_PASS` | 连接配置/Secret | `server/email-delivery.ts` 的 SMTP transport 配置 | `WIRED` + `PENDING_BY_GATE` | 缺失、格式错误、认证或连接失败均不得产出成功发送；API 返回 503，send=0；不得输出凭据 | 邮件/平台 owner 的掩码配置、连接分类与合成送达证据 |
| `ORIGIN_VERIFY_SECRET` | Secret | `middleware.ts` 生成/校验来源证明；`server/email-auth-api.ts` 在 send-code 流程消费 | `WIRED` + `PENDING_BY_GATE` | production 缺失或证明不可用返回 503；不进入 provider verify，send=0 | 平台 owner 掩码证据；代码 owner 顺序测试 |
| `ORIGIN_VERIFY_MODE` | 非 Secret 安全开关 | `middleware.ts`、`server/api-utils.ts`、`server/email-auth-api.ts` | `WIRED` + `PENDING_BY_GATE` | production 必须归一化为 enforce；不可用不得形成 legacy bypass | 平台 owner 环境证据；代码 owner enforce 测试 |
| `CSRF_SECRET`、`ALLOWED_ORIGINS` | Secret / exact allowlist | `middleware.ts`、`server/api-utils.ts`、`server/email-auth-api.ts`；allowlist 由 `server/security/request-guard.ts` 消费 | `WIRED` + `PENDING_BY_GATE` | production 缺配置返回 503；missing/invalid/non-allowlisted origin 或 CSRF mismatch 返回 403，provider verify 前拒绝，send=0 | 平台 owner 掩码/非敏感名称证据；代码 owner 顺序与拒绝测试 |
| `AUTH_RATE_LIMIT_COLLECTION`、`AUTH_RATE_LIMIT_KEY_SECRET` | collection / Secret | `server/security/rate-limit.ts` 读取持久层配置；`server/email-auth-api.ts` 调用 limiter | `WIRED` + `PENDING_BY_GATE` | production 存储或 key 不可用返回 503，send=0；数据库动作继续延期 | 数据/平台 owner 后续授权证据；代码 owner 事务与失败测试 |
| `AUTH_CHALLENGE_REPLAY_COLLECTION`、`AUTH_CHALLENGE_REPLAY_KEY_SECRET` | collection / Secret | `app/api/auth/email/send-code/route.ts` 注入 replay guard；`server/security/email-challenge.ts` 消费 | `WIRED` + `PENDING_BY_GATE` | 缺配置、存储或 consume 不可用返回 503，send=0；不得持久化 raw token | 数据/平台 owner 后续授权证据；代码 owner replay 测试 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | 公开客户端配置 | `server/runtime-public-config.ts#getRuntimePublicConfig` → `app/login/page.tsx` → `features/auth/login-page-content.tsx` → `features/auth/login-form.tsx` → `turnstile-widget.tsx` | `WIRED` + `PENDING_BY_GATE` | 缺失时 widget 不产生可提交 challenge token，发送按钮不可进入合法发码；实际 site key/Secret 配对仍未证明 | 平台 owner 掩码 Widget 映射；代码 owner 客户端缺失/错配测试 |
| `TURNSTILE_SECRET_KEY` | Secret | 仅 `app/api/auth/password/login/route.ts` 有读取证据；目标 `app/api/auth/email/send-code/route.ts` 未读取 | `PRESENT_BUT_NOT_WIRED` + `PENDING_BY_GATE` | 当前目标 route 固定 fail-closed verifier，生产 send-code challenge 返回 503，send=0；未来缺失或错配必须继续 fail closed | 代码 owner 接线与缺失/错配测试；平台 owner 掩码匹配证据 |
| `TURNSTILE_EXPECTED_HOSTNAMES` | 非 Secret exact allowlist | 仅 `app/api/auth/password/login/route.ts` 读取；以 ASCII 逗号 U+002C 分隔、逐项 trim/lowercase/去空项后交给 exact hostname 校验；目标 send-code route 未读取 | `PRESENT_BUT_NOT_WIRED` + `PENDING_BY_GATE` | 空集合、非法 label、wildcard 或 wrong hostname 必须拒绝，send=0；该 delimiter 说明只为 S1 可执行绑定所必需，不关闭 ISSUE-0046 N5 | 代码 owner 目标 route 接线与 parser/拒绝测试；平台 owner 提供非敏感 allowlist 证据 |
| `action=email_send_code` | 公开协议常量 | `features/auth/login-form.tsx` / `turnstile-widget.tsx` 生成；`server/email-auth-api.ts` 传入 expected action；`server/security/email-challenge.ts` exact 比较 | `WIRED` + `PENDING_BY_GATE` | wrong action 必须在 consume/limit/send 前返回 403，send=0；目标 provider verifier 仍待接线 | 代码 owner exact-action 测试；独立复核 owner 核对时间线 |
| `expected hostname=ungraduedu.eu.cc` | 公开冻结 allowlist 值 | exact commit 无该 hostname 字面量；目前仅见于本包冻结 Widget 事实 | `PLATFORM_ONLY` + `PENDING_BY_GATE` | 不得从请求 Host/Origin/Referer 自举；wrong hostname 或未配置 exact allowlist 必须拒绝，send=0 | 平台 owner 非敏感 hostname 证据；代码 owner 接线；独立复核 owner 比对 provider response |
| `AUTH_SESSION_KEY_VERSION`、`AUTH_SESSION_REVOCATION_REQUIRED` | 非 Secret 安全开关 | `server/auth-session.ts`、`server/security/session-revocation.ts` | `WIRED` + `PENDING_BY_GATE` | production 缺版本、版本陈旧或撤销 guard 不可用时 session/auth fail closed；不得恢复旧 Secret | 平台 owner 版本证据；代码 owner rotation/revocation 测试 |

绑定矩阵的关闭触发是：代码 owner 在单独实现授权下提交目标 send-code route 的最小 diff 和 exact commit；平台 owner 提交不含值的名称/环境/Widget 映射证据；定向测试覆盖错误变量名、缺失值、site key/Secret 不匹配、wrong hostname/action；独立复核逐项把新 commit 的实际读取位置回填到本矩阵。任一变量新增、删除、改名、换读取位置或改变 fail-closed 语义，都必须重新冻结映射，禁止下游凭变量名称猜接线。

## 7. SMTP、回放、限流与数据库延期边界

### 7.1 既有 SMTP

本包复用代码已有 SMTP 发送抽象，不新增 provider、不新增采购、不新增计费授权。`EMAIL_PROVIDER` 与 SMTP 名称存在不代表：

- 实际 SMTP provider 已选定或满足中国大陆网络；
- `SMTP_HOST/PORT/SECURE/USER/PASS` 已匹配且可连通；
- `EMAIL_FROM` 已通过发信域校验；
- 邮件到达率、退信处理、DPA、成本或人工支持已确认。

缺失、不可达、认证失败或 provider 语义不明时，send-code 必须返回既有失败分类，不得返回验证码，不得把 provider 错误当作 Turnstile 成功。

### 7.2 Replay 与限流

参数 B 已确认的产品语义继续适用：

- consume 标记使用 `schema_version / key_version / environment_ref / action / consumed_at / expires_at / cleanup_after`；文档 ID 使用带 key version 的 HMAC；不存 raw token/email/IP/UA；`cleanup_after=expires_at+1h`。
- 核心顺序为 `verify → consume → account/IP/device/action limit → existing email 60s cooldown → send`。
- account `3/15m`、IP `10/15m`、device `5/15m`、action `5/15m`；未登录 email send 的 session 维度为 N/A。
- provider 自动重试为 0；同一个 token 不重试/复用；新 challenge 人工重试 cooldown 为 5s；既有 email cooldown 为 60s。
- 无可信生产 proxy IP 时必须进入 keyed `unknown-proxy` bucket，不得信任客户端提供的 `cf-connecting-ip`，不得自动放行。

当前代码存在 CloudBase persistent replay guard 与 rate-limit 接口，但生产 collection 实际存在、权限、事务原子性、TTL cleanup、key rotation 和观察窗口没有本包证据。ISSUE-0031、数据库迁移和所有付费动作继续延期；本包不得新建、查询、清理或迁移数据库数据。

## 8. Origin、CSRF 与请求信任链

provider-specific 接线不得绕过既有请求源防护：

1. 先执行 request origin/source guard；生产 `ORIGIN_VERIFY_MODE` 必须保持 enforce 语义。
2. `ALLOWED_ORIGINS`、`ORIGIN_VERIFY_SECRET` 与 `CSRF_SECRET` 缺失、错误、过期或不可用时 fail closed。
3. 通过源站/CSRF 门后才读取 challenge token、调用 provider verify。
4. provider verify 通过后才 consume、限流、cooldown 和 send。
5. 任何 provider 成功都不能替代 Origin/CSRF；任何请求 Host 都不能建立 provider hostname allowlist。

本包不改变 Origin/CSRF 规则，不扩大允许来源，不增加 legacy bypass。平台变量名称存在不证明值正确或 production enforce 已在生产生效。

## 9. 证据分层与 owner 矩阵

| 阶段 | 必须证明 | 主要 owner | 本包状态 |
|---|---|---|---|
| 作者草案 | provider-specific 目标、范围、Secret/平台边界、失败和恢复 | 产品经理 | 当前文档；`AUTHOR_DRAFT` |
| 用户确认 | 精确冻结该包的 provider/hostname/action/成本和敏感数据边界，以及生产观察方案 A | 用户/业务方 | 方案 A 的观察阈值已由用户在本轮明确冻结；实际执行通过仍为 `PENDING_BY_GATE` |
| 代码实现 | 仅最小 verifier factory/env wiring，保留 fail-closed 与执行顺序 | 原实现 owner | 未授权 |
| 本地/集成测试 | synthetic 与 provider-specific response、边界、无 send 失败、回放/限流/Origin/CSRF | 原实现 owner | 未运行 |
| 独立技术复核 | 与 Spec/参数回执/代码树和测试结果独立交叉核对 | 独立技术复核 owner | 未启动 |
| 平台配置 | Cloudflare Widget/site key/secret、CloudBase 名称和值映射，仅掩码证明 | 平台执行者 | 未授权；截图仅名称存在 |
| 部署 | 新 revision、流量、版本与回滚点 | 平台执行者/总负责人 | 未授权；066 只是继承上下文 |
| 生产验证 | 中国大陆目标网络、真实 Widget、hostname/action、SMTP、双账号、回放/限流、日志与观察窗口 | 独立生产复核 owner | 未启动 |
| 产品/业务验收 | 用户可见登录/发码结果、隐私/未成年人告知、残余风险接受 | 产品经理/业务方 | 未启动 |
| Issue 关单 | canonical 状态迁移与关单条件复核 | ISSUE 管理员 | 不由本包执行 |

任一层证据不得替代另一层。`DeployId` 不证明 Git SHA，变量名称不证明 Secret 值，代码测试不证明中国大陆生产可用，生产 HTTP 不自动证明产品/业务接受，分支完成不自动等于 Issue 关闭。

## 10. 测试与验收矩阵（未来授权后执行）

### 10.1 本地 synthetic/provider-neutral 回归

- success：`success=true`、action exact、hostname exact、timestamp 合法，最终 send 只调用一次。
- action/hostname：exact 通过；wrong action、wrong hostname、wildcard allowlist、请求 Host 自举均拒绝，send=0。
- TTL：`T-1` 允许、`T` 与 `T+1` 拒绝；未来 timestamp、缺失 timestamp、非法 timestamp 拒绝。
- timeout：`N-1=4999ms` 允许、`N=5000ms` 及 `N+1` fail closed；不自动重试，send=0。
- provider failure：非 2xx/unreachable、timeout、配置缺失、Secret 缺失、JSON parse abnormal、未知错误分类均映射为安全错误，send=0。
- 变量绑定：对 §6.3 每一读取点注入错误变量名或缺失值，实际 consumer 必须得到缺失/无效结果并 fail closed；不得由同名平台截图替代读取证据。
- site key/Secret：缺失 site key 不产生可提交 token；site key/Secret 不匹配不得进入 consume/limit/send，并按既有配置/验证错误分类返回 503 或 403，send=0；测试证据不得包含值。
- replay/consume：首次 consume 成功；重复 token/provider duplicate、事务失败、collection 不可用均不得进入限流或 send。
- 顺序：断言 `verify → consume → limit → cooldown → send`；任何前置失败均断言 `send-not-called`。
- rate limit：account/IP/device/action 的 `L-1/L/L+1` 与 `W-1/W/W+1`；unknown-proxy 不自动放行；session N/A 不得被误当作放宽。
- Origin/CSRF：missing/invalid/mismatch、非 allowlisted origin、enforce 配置异常在 provider 调用前拒绝。

### 10.2 provider-specific 集成与生产

- 使用平台实际 Widget 产生真实 challenge；actual hostname 必须与 exact allowlist 一致；action 必须为 `email_send_code`。
- site key 与 Secret 的匹配只在平台 UI/掩码证据中证明，不在测试日志中输出值。
- 真实 provider success、wrong action/hostname、过期、duplicate/replay、timeout/unreachable、配置缺失与 SMTP send failure 分开取证。
- 真实生产验证必须覆盖目标中国大陆网络、公开登录入口、邮箱发码用户可见结果、双账号隔离、既有 60 秒 cooldown、限流、日志脱敏、观察窗口和停止条件。
- 不把 synthetic host、synthetic Secret、local mock、HTTP 200 或部署版本号当作生产 provider pass。

### 10.3 用户冻结的生产观察方案 A

以下阈值由用户在本轮明确选择并冻结，但“执行通过”仍为 `PENDING_BY_GATE`：

1. **样本与窗口**：仅使用 2 个专用测试邮箱/账号 A、B；连续观察 24 小时。每次中断最多 15 分钟，中断时间不计入有效观察时钟；任一中断超过 15 分钟，整段窗口、计数与分母从零重启。
2. **最低合法样本**：至少 24 次合法合成端到端发码请求，A、B 各 12 次，覆盖至少 4 个互不重叠的时间段，且每个账号均须在这些时段中有可追溯样本。
3. **双账号隔离**：至少 6 组有序隔离验证，A→B 3 组、B→A 3 组；每组分别记录前一账号发码完成后后一账号的 challenge、限流、cooldown、邮件与可见对象边界，不得串桶、串码、串邮件或暴露对方对象。
4. **合法分母**：样本必须同时满足新鲜 token、正确 action、正确 hostname、合法 Origin/CSRF，且未触发 cooldown 或限流。恶意输入、错误输入、wrong action/hostname、replay、主动触发 cooldown/限流的请求只进入安全负例，不进入误拒率分母。
5. **子系统停止阈值**：provider verify、SMTP、应用接口任一子系统出现连续 2 次系统错误，或 24 个合法样本中累计 3 次系统错误，或任意 1 小时窗口错误率达到 5% 且该窗口有效样本不少于 10 次，立即停止观察并暂停扩大流量。
6. **配置/语义立即停止**：配置缺失、Secret 错配、JSON 解析异常，或 provider 返回 success 但 action/hostname 错误，任一出现即停止。
7. **误拒阈值**：合法合成样本的语义误拒必须为 0/24。首次误拒即暂停并分类；出现 1 次可复现误拒立即停止。即使暂不可复现，也不得以原窗口通过，须在唯一责任层修复或排除原因后从零取得新的 0/24 完整窗口。
8. **延迟与送达**：邮件接口响应超过 10 秒，或合法邮件在请求后 120 秒内未收到，单次标记 `degraded`；连续 2 次或累计 3/24 立即停止。禁止降级为不经 Turnstile 的发送。
9. **零容忍立即停止**：Secret/隐私泄露、错误 action/hostname 被放行、replay 再消费、Origin/CSRF 绕过、双账号串扰、未授权对象可见、verify/consume 前发生发送，任一事实出现即停止。
10. **owner**：代码 owner 负责接线与错误分类；平台 owner 负责掩码配置证据；独立复核 owner 负责日志与样本复核；产品/业务 owner 负责最终风险接受。各 owner 的证据不得互相替代。
11. **证据最小集**：脱敏请求时间线、每个子系统的状态/延迟、A/B 双账号矩阵、邮件送达时间、停止与恢复记录。禁止记录 token、Secret、Cookie、邮箱原值或 SMTP 凭据。
12. **恢复**：唯一责任层修复后，完整 24 小时窗口与全部计数从零重新开始。Secret/隐私事件必须先轮换，再经独立复核后重启；禁止恢复或复用旧 Secret。

本轮没有运行测试、npm、build、网络或 provider 请求；以上是未来门禁矩阵，不是已通过结果。

## 11. 安全、隐私、未成年人和可用性边界

- token 仅短时进入服务端验证/consume，禁止写日志、回显、持久化 raw token。
- email、IP、UA 不进入 replay document；IP 仅使用可信来源的 keyed pseudonym；无可信来源使用 unknown-proxy bucket。
- Secret、SMTP 凭据、provider response 中的敏感字段、session 数据和真实用户邮箱不得进入仓库、截图、日志或聊天。
- 该流程可能被家长、学生或未成年人使用；challenge 失败、邮件不可用和人工替代路径必须保持可理解且不泄露账户存在性。生产观察的误拒停止阈值已按方案 A 冻结，但无障碍替代、文案、人工支持与实际观察通过仍为 `PENDING_BY_GATE`。
- 不以验证码、人机验证或 SMTP provider 的成功作为未成年人身份、家长同意、教师资质或业务撮合授权。
- 可用性、China network、provider SLA、SMTP deliverability、DPA、成本和方案 A observation window 的实际执行均未通过。

## 12. 停止条件、回滚与 Secret 轮换

### 12.1 停止条件

出现以下任一事实，立即停止该阶段，不自动重试、不自动切换 provider、不自动放宽 allowlist：

- site key/Secret 不匹配、Secret 缺失、Secret 进入日志/仓库/聊天或疑似泄露；
- provider 返回 action/hostname 不匹配、timestamp 无法验证、timeout/不可达/解析异常；
- verify 前发送、consume 失败后发送、replay 可再次发送、限流或 cooldown 被绕过；
- Origin/CSRF 缺失仍进入 provider 或 send，或客户端 `cf-connecting-ip` 被当作可信来源；
- SMTP 认证/连通失败、发件人未验证、用户可见错误不符合已冻结边界；
- CloudBase collection/事务/权限/清理无法证明却被当作可用；
- 真实生产观察达到 §10.3 的任一子系统、配置、误拒、延迟、零容忍或中断停止阈值；
- 任何阶段需要数据库迁移、付费采购、DPA 签署或超出本包代码范围。

### 12.2 回滚边界

- 当前 Deploy 066 是现有生产锚点；本包不部署，也不把 066 说成 provider-specific 版本。
- Deploy 064 仅作为历史稳定可见锚点，不能表述为已执行真实反向回滚或自动可回滚证明。
- 任何回滚必须由另行授权的平台执行者按回执执行；不得恢复 exposed Secret 或把旧 Secret 当作安全回退。
- rollback 后仍须重新验证 Origin/CSRF、anonymous/authenticated flow、provider fail-closed、SMTP、回放/限流和用户可见结果；如恢复观察，必须从零重启 §10.3 的完整 24 小时窗口。

### 12.3 Secret 泄露与轮换

疑似泄露时：停止部署/流量扩大；在平台加密 UI 撤销并生成新 Secret；同步更新 Cloudflare 与 CloudBase 的对应映射；提升 key version；禁止复制或恢复旧值；清理日志/截图/聊天传播面；完成独立复核后从零重启 §10.3 的完整观察窗口，通过后才恢复。轮换、观察和 revocation 证据目前均为 `PENDING_BY_GATE`。

## 13. 用户后续最小操作与再次确认门

Hermes Round 1 已完成并给出 `REWORK_REQUIRED`；本次仅整改其完整 SERIOUS 批次。方案 A 的观察阈值已经用户明确冻结，但不等于实现、平台或生产授权。在总负责人冻结本次输出 hash、执行 Hermes Round 2/3 聚焦复核并取得后续适用授权前，不得实现或平台写入。

后续若用户单独授权平台动作，用户的最小操作只能是：在 Cloudflare/CloudBase 官方加密 UI 内完成已批准的 Secret 映射和必要变量配置；不得通过聊天传递 Secret，不得把值粘贴到仓库、Issue、工作记录、截图或回复。平台执行者必须提供掩码后的名称/环境/版本证据，不提供值本身。

这项最小操作不包含采购、付费、数据库操作、DPA 签署、provider 切换或部署；这些仍需各自明确授权。

## 14. 当前 `PENDING_BY_GATE` 清单与禁止声称

以下事项均未通过：目标 send-code route 的 provider verifier 接线、真实 provider 与凭据、site key/Secret 匹配、实际 CloudBase 值、SMTP provider/连通/DPA/cost、中国大陆网络、trusted proxy、collection/事务/权限/cleanup、key rotation、方案 A 观察窗口的实际执行、代码实现、正式测试、独立技术复核、平台配置、部署、生产证据、用户可见验收、产品/业务残余风险接受和 Issue 管理员关单。

因此本文件不得声称：

- provider-specific 已通过；
- Secret 已配置或匹配；
- Cloudflare/CloudBase 已写入或部署；
- 邮箱发码生产链已可用；
- 中国大陆网络、DPA、成本或 SMTP 已通过；
- ISSUE-0032 已关闭；
- 项目 workflow 已完成。

## 15. 唯一下一步

当前门禁：`HERMES_ROUND_2_PENDING`。

唯一下一步：由项目总负责人冻结本次 Document QA 输出的精确 hash，并运行 Hermes Round 2/3 `deepseek-v4-pro` 聚焦复核 S1/S2 及其直接回归。本线程不自行调用 Hermes、不自我批准、不开始实现、测试、平台或 Issue 动作，不创建任务/subagent。
