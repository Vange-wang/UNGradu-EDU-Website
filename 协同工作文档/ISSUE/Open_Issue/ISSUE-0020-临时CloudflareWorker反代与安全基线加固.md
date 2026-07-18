# ISSUE-0020 临时 Cloudflare Worker 反代与安全基线加固

| 字段 | 内容 |
| --- | --- |
| id | `ISSUE-0020` |
| title | 临时 Cloudflare Worker 反代与安全基线加固 |
| type | ops / security hardening / deployment workaround |
| status | open |
| priority | P1 |
| source | 用户确认临时 Cloudflare Worker 反代方案；2026-07-18 指定新公开域名 `ungradeedu.eu.cc`，继续在同一 Issue 内跟踪域名接入、部署与安全基线闭环 |
| owner_agent | Cloudflare / CloudBase 配置执行侧（技术门禁） / 项目总负责人（权限、窗口与证据路由） / 业务方（最终残余风险接受） / ISSUE 管理员（状态维护） |
| related_files | Cloudflare Worker；Cloudflare Free 安全配置；CloudBase 默认访问域名；`ungradeedu.eu.cc` 根域与 `www`；Custom Domain / DNS / 证书配置；安全响应头与去指纹验证记录 |

## 背景

用户已确认采用临时 Cloudflare Worker 反代方案，用于在 CloudBase 自定义域名链路不稳定或暂不可用时，先建立可访问的 HTTPS 入口与基础安全防护。

2026-07-18，用户将计划公开域名切换为 `ungradeedu.eu.cc`。此前 `.pp.ua` 路径保留为历史背景，不再作为当前唯一下一步；本 Issue 继续沿用原编号，跟踪新域名接入现有 Worker、部署和线上安全复测。

当前生产事实：

- `ungradeedu.eu.cc` 已切换到 Cloudflare 权威 NS，zone 为 Active；根域与 `www` 已解析到 Cloudflare 边缘。
- Worker `ungradu-edu-proxy` 生产版本 `d8eff139` 为 Active；根域与 `www` Custom Domain 已生效；workers.dev 公网入口已关闭，外部访问返回 404。
- 根域核心路由、匿名反馈权限边界、`www` 到根域 308、HTTPS、安全响应头与去指纹均已通过生产复测。
- Worker 反代仍不能替代 CloudBase 源站权限、原始域名隐藏、业务鉴权、持续监控和长期合规部署。

## 验收标准

本 Issue 只有在以下条件全部满足后，才允许进入关闭：

- Cloudflare Worker 代理入口可访问，目标页面 / 核心路由返回正常。
- HTTPS 正常启用，浏览器访问无证书错误或混合内容阻断。
- Cloudflare Free 可用安全项已启用并形成清单，包括但不限于 SSL/TLS 模式、Always Use HTTPS、Automatic HTTPS Rewrites、Bot Fight Mode 或等价免费防护、基础 WAF / 安全规则。
- WAF / rate limit 或等价限流防护配置清单完成，明确当前 Free 计划可用项、规则目的、触发对象和不覆盖范围。
- 安全响应头验证通过，至少核对 `Strict-Transport-Security`、`X-Content-Type-Options`、`Referrer-Policy`、`X-Frame-Options` 或 `Content-Security-Policy` 等关键响应头是否按方案生效。
- 原始 CloudBase 域名可被绕过访问的风险已明确告知用户，并记录短期接受 / 后续处理口径。
- 验收记录中包含访问地址、验证时间、关键截图或命令输出摘要、未完成项和剩余风险。

## 阻塞项

- **AI bots 保存**：产品已确定 Search、Agent、Training 全部 Block，但尚无三项已保存为 Block 的控制台证据。
- **双平台 Secret 权限与上线窗口**：源站隔离观察模式代码已准备，但尚未取得 Cloudflare Worker 与 CloudBase 两端 Secret 写权限及北京时间 `00:00–01:00` 上线窗口；未生成或部署生产 Secret，未进入 24 小时观察及两段 30 分钟灰度，源站强制 403 未启用，CloudBase 原始源站仍可直访。
- **登录态 / 业务回归**：缺少专用非敏感安全测试账号，尚未执行一次真实已登录 feedback 提交成功回归，以证明后续源站隔离观察 / 灰度不影响正常业务写入。
- 以上三项为当前 workflow 技术 / 外部阻塞。限流规则已经生产部署并完成行为复核，不再属于阻塞；workers.dev 已关闭并经外部 404 复核，不再列为剩余风险。全部技术门禁通过后，仍须按届时现状由业务方明确接受无法消除的残余风险，ISSUE 管理员才可最终关闭。

## 不做范围

- 不承诺绝对防 DDoS，仅登记 Cloudflare Free 能力范围内的基础防护与风险告知。
- 不使用 Flexible SSL，避免浏览器到 Cloudflare 加密但 Cloudflare 到源站非加密造成的安全降级。
- 不泄露、提交或记录任何 Cloudflare、CloudBase、NIC、DNS、Worker Secret 等真实密钥 / Token。
- 不删除现有 CloudBase、域名、DNS、Worker 或其他线上资源。
- 不修改 `Code文档` 业务代码；本 Issue 只追踪临时反代配置与安全基线验收。

## 处理记录

- 2026-07-08：由 ISSUE / 配置执行子智能体根据用户指令登记为 Open。登记前核对 `ISSUE总表.md`：Open 区为 `_当前无 Open Issue_`，Closed 最新编号为 `ISSUE-0019`，本轮顺延为 `ISSUE-0020`。
- 2026-07-18：任务 `DOMAIN-SWITCH-2026-07-18-001-ISSUE-UPDATE-1` 将用户指定的新公开域名 `ungradeedu.eu.cc` 纳入同范围追踪，不新建 Issue，状态保持 `open`。
- 2026-07-18 DNS / 权限证据：公共 DNS 显示当前 NS 为 `ns1.julydns.com` / `ns2.julydns.com`；根域和 `www` 无 A / AAAA / CNAME，HTTPS 尚不可验证。Cloudflare Dashboard 当前无登录态，本机无 Wrangler / API 凭据，未进行外部配置。
- 2026-07-18 开发侧证据：代码开发员已在本地准备根域与 `www` Custom Domain 配置、`www` 到根域的 308 跳转、保留 workers.dev 入口和扩展去指纹；定向测试 1 file / 8 tests 通过。上述变更尚未提交、推送或部署，因此只计为本地准备证据，不计为生产闭环。
- 2026-07-18 线上残余风险：现有线上 Worker 仍返回 `x-cloudbaserun-*`、`x-upstream-*`、`x-nextjs-*`、`x-request-id`，线上去指纹门禁未通过。
- 2026-07-18 15:57 +08:00，ISSUE 管理员执行独立实时复核：公共 DNS 经 `1.1.1.1` 返回 Cloudflare NS `maya.ns.cloudflare.com` / `rodney.ns.cloudflare.com`；根域 `/`、`/rules`、`/feedback` 均为 200，匿名 `/api/feedback` 为 401；`www` 请求 `/feedback?from=www&keep=1` 返回 308，`Location` 精确保留为 `https://ungradeedu.eu.cc/feedback?from=www&keep=1`；workers.dev `/` 为 200。
- 2026-07-18 独立响应头复核：根域与 workers.dev 的 HTTPS、HSTS、CSP、Permissions-Policy、Referrer-Policy、`X-Content-Type-Options`、`X-Frame-Options` 均生效；`www` 308 后落到具备上述响应头的根域；三入口均未发现 `x-nextjs-*`、`x-request-id`、`x-upstream-*`、`x-cloudbase*`。先前“域名未生效 / 尚未部署 / 线上去指纹未通过”仅保留为历史过程，不再代表当前状态。
- 2026-07-18 仓库证据复核：代码开发员工作记录确认 Worker `ungradu-edu-proxy` 生产版本 `d8eff139` Active；定向 8/8、全量 181/181、typecheck、lint、build 通过。开发提交 `23620c99a8e0c322c913af9f4f4f5bd0d494eda3` 已位于当前分支及远端 `origin/codex/vnext-feedback-status-security-20260717`。
- 2026-07-18 产品证据复核：产品经理独立产品验收结论为“通过”，并确认无需新开或重开其他 Issue；产品经理未代替 ISSUE 管理员关闭 `ISSUE-0020`。
- 2026-07-18 ISSUE 管理员结论：技术、部署、Git 与产品验收证据已通过；未发现需要新建 Issue 的不同范围问题。由于业务方风险接受和 zone 级安全配置状态证据仍缺，`ISSUE-0020` 保持 `open / EXTERNAL_BLOCKED`。
- 2026-07-18 16:42 +08:00，ISSUE 管理员复核新增 zone 技术证据：Always Use HTTPS 已从 Off 调整为 On，Minimum TLS 已从 TLS 1.0 调整为 TLS 1.2；页面证据分别显示 checked=true 与 TLS 1.2。Automatic HTTPS Rewrites、TLS 1.3 为 On；SSL 模式为 Full（非 strict）；Managed Rules 未部署 / Pro；Custom Rules 0/5；Rate limit 0/1；Bot Fight Mode 未能证明启用；三类 AI bot 允许；Leaked credentials mitigation 为 Off。
- 2026-07-18 16:42 +08:00 公网独立复核：HTTP 根域返回 301，`Location` 精确为 `https://ungradeedu.eu.cc/`；OpenSSL TLS 1.0 握手收到 `protocol version` / alert 70；HTTPS `/`、`/rules`、`/feedback` 为 200，匿名 `/api/feedback` 为 401，`www` 308 精确保留 path/query，workers.dev `/` 为 200；安全响应头保留且未出现上游指纹。
- 2026-07-18 仓库证据：开发记录提交 `f2cadb573236b51e06a4ac70430eef728b0e93e9` 已推送至 `origin/codex/vnext-feedback-status-security-20260717`，记录了 zone 安全加固状态。
- 2026-07-18 门禁结论更新：zone 技术配置证据门禁通过；配置确认不等于风险接受。`ISSUE-0020` 保持 `open / EXTERNAL_BLOCKED`，唯一剩余门禁为业务方逐项明确接受全部残余风险。
- 2026-07-18 第三批安全证据：workers.dev 控制台已关闭，ISSUE 管理员独立公网复核其根路径返回 404；根域 `/`、`/rules`、`/feedback` 为 200，匿名 `/api/feedback` 为 401，`www /feedback?from=www&keep=1` 为 308 且 Location 精确保留 path/query；根域关键安全响应头保留且未发现 `x-nextjs-*`、`x-request-id`、`x-upstream-*`、`x-cloudbase*`。workers.dev 可直访风险据此移出剩余风险清单。
- 2026-07-18 仓库证据：产品提交 `705db43e9ff02fc16210f7354824b25a391a82e3` 固定限流 `5 次 / 10 分钟 / IP、阻断 10 分钟`、三类 AI bots 全 Block、源站隔离 `00:00–01:00` 窗口与 `24 小时 + 30 分钟 + 30 分钟` 节奏；开发提交 `6b51f52c` 已准备源站验证观察 / 强制模式及运行手册，typecheck、lint、build 和 47 文件 / 189 测试通过。上述均为产品决策与代码准备证据，不等于生产配置已完成。
- 2026-07-18 当前执行事实：Rate limiting 仍为 Free 0/1，10 分钟 Period / Duration 能力未确认且规则未创建；AI bots 三项尚无已保存为 Block 的证据；两端生产 Secret 未生成 / 未部署、观察与强制 403 未启用，CloudBase 源站仍可直访；缺少专用测试账号，登录态 feedback 提交未回归。因此 `ISSUE-0020` 继续保持 `open / EXTERNAL_BLOCKED`。
- 2026-07-18 限流正式契约更新：产品提交 `60486d5f` 根据 Cloudflare Free 实际能力，将不可执行的历史参数 `5 次 / 10 分钟 / IP、阻断 10 分钟` 修订为仅根域、仅 `POST`、精确 `/api/feedback`、每来源 IP `3 requests / 10 seconds`、阻断 `10 seconds`；历史参数仅保留为决策变更依据，不再作为验收标准。
- 2026-07-18 限流生产证据：规则 `feedback-post-rate-limit` 存在且 Active，Rate limiting 显示 1/1；列表表达式精确匹配根域、POST 与 `/api/feedback`，动作为 Block。开发证据提交 `9aff1117abdcbd8d64aaf9048a1825ba2462208b` 记录同源前三次进入应用、第四次由 Cloudflare 返回 429 / error 1015、等待 11 秒恢复应用响应，`GET /feedback` 保持 200；核心路由、`www` 308、HTTP 301、TLS 1.0 拒绝、安全头和去指纹无回归。
- 2026-07-18 限流门禁判定：**通过**。规则详情页未独立复核“来源 IP”字段，但同一来源的实际计数、阻断及恢复行为已证明生产规则有效；空 JSON 返回 400 属于应用载荷校验顺序事实，不作为限流失败，也不替代后续真实登录态业务回归。

## 当前精确关闭门禁

已通过门禁：

1. Cloudflare zone、根域与 `www` Custom Domain、证书和 Worker 生产版本均已生效。
2. 根域三条核心路由、匿名 401、`www` 精确保留 path/query 的 308 已通过实时复核。
3. 根域与 `www` 的 HTTPS、安全响应头和线上去指纹已通过实时复核；workers.dev 公网入口已关闭并经外部 404 复核，不再属于剩余风险。
4. 定向 8/8、全量 181/181、typecheck、lint、build 已通过。
5. 开发提交 `23620c99a8e0c322c913af9f4f4f5bd0d494eda3` 已推送，生产版本 `d8eff139` Active。
6. 产品经理独立产品验收通过；无需新开或重开其他 Issue。
7. zone 技术配置证据门禁已通过：Always Use HTTPS On、Minimum TLS 1.2、Automatic HTTPS Rewrites On、TLS 1.3 On；SSL Full（非 strict）、Managed Rules、Custom Rules、Rate limit、Bot Fight、AI bot、Leaked credentials mitigation 的当前状态与不覆盖范围已明确记录。HTTP 301 与 TLS 1.0 alert 70 已通过独立公网复核；提交 `f2cadb573236b51e06a4ac70430eef728b0e93e9` 已推送。
8. 产品提交 `705db43e9ff02fc16210f7354824b25a391a82e3` 已固定本批总体加固方向；限流参数已由产品提交 `60486d5f` 按 Free 套餐能力正式修订。开发提交 `6b51f52c` 已完成源站隔离观察模式代码准备，typecheck、lint、build 与 47 文件 / 189 测试通过。
9. 限流规则 `feedback-post-rate-limit` 已 Active，Rate limiting 1/1；正式契约为根域 + POST + 精确 `/api/feedback` + 每来源 IP `3 requests / 10 seconds` + 阻断 `10 seconds`。生产行为确认前三次进入应用、第四次 Cloudflare 429 / error 1015、等待 11 秒恢复；基线无回归。证据提交 `9aff1117abdcbd8d64aaf9048a1825ba2462208b` 已推送。

尚未通过的关闭门禁：

1. **AI bots 门禁（责任人：Cloudflare 账号持有人 / 配置执行侧）**：将 Search、Agent、Training 三项保存为 Block，并提供保存后页面证据及根域无回归结果。
2. **源站隔离生产门禁（责任人：项目总负责人 / Cloudflare 与 CloudBase 配置执行侧）**：在 `00:00–01:00` 窗口取得双平台 Secret 写权限与回滚入口，部署同一生产 Secret，完成 24 小时观察、Worker 注入后 30 分钟灰度、启用无正确头即 403 后 30 分钟监控；证明 Worker 正常且 CloudBase 直接访问被拒绝。当前不得提前启用 403。
3. **登录态 / 业务回归门禁（责任人：项目总负责人提供账号；代码开发员 / 验收方执行）**：提供专用非敏感安全测试账号，在源站隔离观察 / 灰度阶段完成一次真实已登录 feedback 提交成功回归，证明正常业务写入未受影响；不得使用真实未成年人、联系方式或投诉隐私数据。空 JSON 400 仅证明载荷校验顺序，不满足本门禁。
4. **最终残余风险接受门禁（责任人：业务方）**：上述技术门禁全部通过后，按届时实际状态逐项接受仍未消除的风险；至少包括 CloudBase 单一上游、持续监控覆盖缺口、SSL Full 非 strict、Free 限流仅提供 10 秒突发抑制及其他 Free 计划未覆盖能力。workers.dev 已修复，不得再列入接受清单。

最小解除条件：上述三项技术门禁形成生产证据，随后业务方对届时仍存在的残余风险给出可归档确认。恢复触发条件：项目总负责人将对应证据包及最终风险接受原文路由给 ISSUE 管理员，由 ISSUE 管理员独立复核状态；任一配置未保存、Secret / 窗口 / 测试账号缺失、生产回归失败或源站仍可绕过，均保持或恢复 `open / EXTERNAL_BLOCKED`。

## 唯一下一步

Cloudflare 账号持有人将 Search、Agent、Training 三类 AI bots 全部保存为 Block，并向项目总负责人提供保存后页面证据及根域无回归结果。
