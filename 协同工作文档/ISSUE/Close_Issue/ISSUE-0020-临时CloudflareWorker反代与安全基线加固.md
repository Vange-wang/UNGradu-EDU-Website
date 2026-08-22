# ISSUE-0020 临时 Cloudflare Worker 反代与安全基线加固

| 字段 | 内容 |
| --- | --- |
| id | `ISSUE-0020` |
| title | 临时 Cloudflare Worker 反代与安全基线加固 |
| type | ops / security hardening / deployment workaround |
| status | closed / WORKFLOW_COMPLETE |
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
- 2026-08-10 旧 public rollback domain 匿名只读复测：`https://ungradeedu.eu.cc/` 返回 200 且安全头在；旧 `www` 对 `/feedback?rollback=20260810&keep=1` 返回 308 并精确保留 path/query；`/api/auth/session` 返回 401 且安全头在。该子门仅证明旧 public rollback domain 当前可达、重定向与匿名边界无回归。
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

- **生产源站隔离已生效，回滚完整门禁待确认**：2026-07-29 无凭据探测显示固定 CloudBase 源站 `https://ungradu-edu-prod-275285-6-1445807473.sh.run.tcloudbase.com/` 返回 403（`server: cbrgw`），经 Worker 的新 apex `https://ungraduedu.eu.cc/` 返回 200（Cloudflare）；现有 `ORIGIN_VERIFY_SECRET` 绑定继续服务新旧入口。此前 observe → Worker 注入 → enforce 403 阶段已完成，不得再将“源站仍可直访”“尚未启用 403”或“需要重新执行 observe→enforce”列为当前事实或下一动作。2026-08-10 旧 public rollback domain 的可达、path/query redirect、匿名 401 子门已部分通过；但该证据不证明 CloudBase revision 可回滚、凭据轮换或实际 rollback 演练，完整回滚门禁仍未通过。业务方于 2026-07-29 明确“没有固定的生产窗口，随时都可以进行测试”，故北京时间 `00:00–01:00` 不再是当前强制窗口或外部阻塞。
- **登录态 / 业务回归**：缺少专用非敏感安全测试账号，尚未执行一次真实已登录 feedback 提交成功回归，以证明后续源站隔离观察 / 灰度不影响正常业务写入。
- **凭据轮换与最终接受**：此前暴露的生产凭据尚未形成轮换证据；技术事实复核完成后，仍须由业务方明确接受届时残余风险。
- 以上三项为当前 workflow 技术 / 外部阻塞。AI Crawl Control 与限流规则均已完成配置及生产证据复核，不再属于阻塞；workers.dev 已关闭并经外部 404 复核，不再列为剩余风险。全部技术门禁通过后，仍须按届时现状由业务方明确接受无法消除的残余风险，ISSUE 管理员才可最终关闭。

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
- 2026-07-18 仓库证据：产品提交 `705db43e9ff02fc16210f7354824b25a391a82e3` 固定限流 `5 次 / 10 分钟 / IP、阻断 10 分钟`、三类 AI bots 全 Block、源站隔离 `00:00–01:00` 窗口与 `24 小时 + 30 分钟 + 30 分钟` 节奏；开发提交 `6b51f52c` 已准备源站验证观察 / 强制模式及运行手册，typecheck、lint、build 和 47 文件 / 189 测试通过。上述均为产品决策与代码准备证据，不等于生产配置已完成。该窗口为历史过程记录，已被业务方 2026-07-29“没有固定的生产窗口，随时都可以进行测试”明确覆盖，不再作为当前强制执行窗口。
- 2026-07-18 当前执行事实：Rate limiting 仍为 Free 0/1，10 分钟 Period / Duration 能力未确认且规则未创建；AI bots 三项尚无已保存为 Block 的证据；两端生产 Secret 未生成 / 未部署、观察与强制 403 未启用，CloudBase 源站仍可直访；缺少专用测试账号，登录态 feedback 提交未回归。因此 `ISSUE-0020` 继续保持 `open / EXTERNAL_BLOCKED`。
- 2026-07-18 限流正式契约更新：产品提交 `60486d5f` 根据 Cloudflare Free 实际能力，将不可执行的历史参数 `5 次 / 10 分钟 / IP、阻断 10 分钟` 修订为仅根域、仅 `POST`、精确 `/api/feedback`、每来源 IP `3 requests / 10 seconds`、阻断 `10 seconds`；历史参数仅保留为决策变更依据，不再作为验收标准。
- 2026-07-18 限流生产证据：规则 `feedback-post-rate-limit` 存在且 Active，Rate limiting 显示 1/1；列表表达式精确匹配根域、POST 与 `/api/feedback`，动作为 Block。开发证据提交 `9aff1117abdcbd8d64aaf9048a1825ba2462208b` 记录同源前三次进入应用、第四次由 Cloudflare 返回 429 / error 1015、等待 11 秒恢复应用响应，`GET /feedback` 保持 200；核心路由、`www` 308、HTTP 301、TLS 1.0 拒绝、安全头和去指纹无回归。
- 2026-07-18 限流门禁判定：**通过**。规则详情页未独立复核“来源 IP”字段，但同一来源的实际计数、阻断及恢复行为已证明生产规则有效；空 JSON 返回 400 属于应用载荷校验顺序事实，不作为限流失败，也不替代后续真实登录态业务回归。
- 2026-07-19 AI Crawl Control 控制台证据：总负责人只读核对页面共 32 个 crawler；AI Assistant、AI Crawler、AI Search 三类共 26 个，Block=true 为 26/26、未阻止为 0；Googlebot 属于 Search Engine Crawler，Block=false；Arquivo Web Crawler 属于 Archiver，Block=true。
- 2026-07-19 00:30:53 +08:00，代码开发员独立生产复测 verdict 为“通过（证据边界已限定）”：核心路由、HTTPS、TLS、安全响应头和去指纹无回归；OAI-SearchBot/1.0 返回 403（CF-Ray `a1d2ddaa4ba0ccca-NRT`），ChatGPT-User/1.0 返回 403（`a1d2ddaa0891afd4-NRT`），Googlebot/2.1 返回 200（`a1d2ddab2a30262f-NRT`）。开发证据提交 `694cf901a2b0ae0ebccc737af421ec66456baf44` 已推送。
- 2026-07-19 AI Crawl Control 证据边界：GPTBot/1.0、GPTBot/1.2、ClaudeBot/1.0 从普通来源伪造 UA 返回 200，只能证明 UA 字符串不足以代表 Cloudflare verified crawler 身份；不能据此认定真实 verified crawler 绕过，也不能将 26/26 配置状态表述为全部 26 个真实爬虫均已逐一完成 HTTP 阻断实测。
- 2026-07-19 AI Crawl Control 门禁判定：**通过**。通过依据是 26/26 目标类别控制台配置状态、部分代表性 HTTP 差异化行为及核心生产无回归的组合证据；本结论不扩展为产品验收或全量真实 crawler HTTP 覆盖声明。
- 2026-07-29 生产源站隔离纠错证据：无凭据访问固定 CloudBase 源站 `https://ungradu-edu-prod-275285-6-1445807473.sh.run.tcloudbase.com/` 返回 403（`server: cbrgw`），经 Worker 的新 apex `https://ungraduedu.eu.cc/` 返回 200（Cloudflare）。总负责人工作记录同时确认现有 `ORIGIN_VERIFY_SECRET` 绑定继续服务新旧入口。此前 observe → Worker 注入 → enforce 403 已完成；早期“源站仍可直访 / 尚未启用 403 / 待重新 observe→enforce”仅为历史阶段记录，不再是当前事实或下一动作。

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
10. AI Crawl Control 页面显示目标 AI Assistant / AI Crawler / AI Search 共 26 个均为 Block，未阻止为 0；OAI-SearchBot 与 ChatGPT-User 代表性请求为 403，Googlebot 保持 200，核心生产无回归。证据提交 `694cf901a2b0ae0ebccc737af421ec66456baf44` 已推送。普通来源伪造 GPTBot / ClaudeBot UA 的 200 不构成 verified crawler 绕过证据，本门禁通过不等于 26 个真实爬虫均已逐一 HTTP 实测。

尚未通过的关闭门禁：

1. **暴露凭据轮换门禁（责任人：项目总负责人 / 凭据持有方）**：对此前暴露的生产凭据完成轮换并提供不含敏感值的可归档证据；不得在本 Issue、日志、截图或回传中记录密钥明文。
2. **登录态 / 业务回归门禁（责任人：项目总负责人提供账号；代码开发员 / 验收方执行）**：提供专用非敏感安全测试账号，完成一次真实已登录 feedback 提交成功回归，证明当前已生效的源站隔离不影响正常业务写入；不得使用真实未成年人、联系方式或投诉隐私数据。空 JSON 400 仅证明载荷校验顺序，不满足本门禁。
3. **回滚入口持续可用门禁（责任人：项目总负责人 / Cloudflare 与 CloudBase 配置执行侧）**：2026-08-10 旧 public rollback domain 的可达、path/query redirect 与匿名 401 子门已通过；053 revision 与平台回退入口已确认，但仍须完成实际回滚演练。当前旧 `ORIGIN_VERIFY_SECRET` 已被控制台明文展示触及，归类为 `exposed`，只能按 Contract B 做 CloudBase 新值→Worker 新值的成对 coordinated hard-cut；中间短暂 403 是已知且必须设停止条件的中断，不得写成无中断。exposed 值的回滚也只能成对 hard-cut，`observe/off` 不得作为常规回滚；若紧急恢复旧暴露值，风险门禁仍未闭环，必须立即重启轮换。
4. **最终残余风险接受门禁（责任人：业务方）**：上述技术事实完成复核后，按届时实际状态逐项接受仍未消除的风险；至少包括 CloudBase 单一上游、实际 hard-cut 的短暂中断、SSL Full 非 strict、Free 限流仅提供 10 秒突发抑制及其他 Free 计划未覆盖能力。平台监控视图与运行手册停止条件已确认可用，但不等于监控观察或回滚演练完成。workers.dev、限流及 AI Crawl Control 已通过，不得再列为未修复项。

最小解除条件：此前暴露生产凭据的轮换证据、专用非敏感验收账号的真实已登录 feedback 成功回归、完整回滚入口/实际演练证据，以及技术事实复核后的业务方残余风险接受均齐备。平台监控视图与停止条件已确认，但不替代上述门禁；054→e81 provenance 仍是显式未证明风险而非进入 hard-cut 准备的唯一前置阻塞。恢复触发条件：项目总负责人将对应证据包及最终风险接受原文路由给 ISSUE 管理员，由 ISSUE 管理员独立复核状态；任一轮换证据 / 测试账号回归 / 完整回滚演练 / 风险接受缺失，均保持或恢复 `open / EXTERNAL_BLOCKED`。历史 `00:00–01:00` 窗口已被 2026-07-29 业务方指令覆盖，不再是恢复条件。

## 历史阶段唯一下一步（关闭前）

当前阶段：`PLATFORM_MONITORING_AND_STOP_CONDITIONS_CONFIRMED / CONTRACT_B_HARD_CUT_PREPARATION`。唯一下一步：CloudBase 与 Worker 两端先打开新 `ORIGIN_VERIFY_SECRET` 的加密绑定编辑入口但不保存，确认两端可连续操作后，再按 Contract B 执行协调 hard-cut；任何 Secret 值不得写入记录或回传。登录态 feedback、完整回滚演练与业务方最终残余风险接受仍需后续证据。

## 最终关闭证据与残余风险登记（2026-08-15）

### 1. Issue 自身关闭结论

- `ISSUE-0020` 本身由 `open / EXTERNAL_BLOCKED` 迁移为 `closed / WORKFLOW_COMPLETE`。
- 本关闭结论仅覆盖 `ISSUE-0020`；项目总 workflow 仍为 `WORKFLOW_ACTIVE`，不代表其他 Issue、项目部署或项目业务验收完成。
- 本次关闭不记录、不读取、不回传任何 Secret 值；保留 Contract B 的执行偏差和所有残余风险，不改写为完全合规，不得表述为真实反向回滚已演练。

### 2. 独立复核、产品与生产证据

- 独立技术结论：`TECH_FINAL_VERDICT=PASS`；Standards P0/P1/P2=`0/0/0`；Issue gate P0/P1/P2=`0/0/0`；`SAFE_ROLLBACK_ALTERNATIVE=PASS`；业务接受后 `ISSUE_CLOSE_ALLOWED=YES`。
- 产品经理结论：`PRODUCT_FINAL_VERDICT=PASS`；用户可见反馈流程、双账号隔离和安全告知边界通过；业务接受后建议关闭。
- 生产环境：`ungradu-edu-prod-064`。两个专用账号均完成 `CSRF 200 → POST /api/feedback 200 → GET /api/feedback 200`；反馈编号为 `risk-feedback-7ace2863-eb26-438b-ae96-85be692c4ce8`、`risk-feedback-4289043a-0df9-4956-9097-412dfff6f2d4`；双向隔离截图已核验。
- 当前基线：新 apex `/`、`/rules`、`/feedback`=`200`，匿名 session=`401`；旧 apex=`200`；`www`=`308` 且保留 path/query；固定源站无头/伪造头均=`403`；安全头在。
- Contract B=`HARD_CUT_FUNCTIONAL_PASS_WITH_EXECUTION_DEVIATION`；Worker 短版本=`e72e0119`。B2 中断超过 5 分钟的执行偏差保留，不登记为完全合规。
- 登录/CSRF 修复 commit=`33314857da0f2d72066443965454d23fc70a16d3`，branch=`V2-unified-navigation-responsive-profile-20260729`，已推送；`064` 行为证明路径生效，但不写成平台 Git SHA 精确映射。
- 旧 Secret classified 为 `exposed`；不允许常规恢复。安全回滚替代由 053 回退入口保留、旧公共回滚域、真实 mismatch 后 forward recovery、监控/停止条件、超过 60 秒稳定观察和 064 双账号生产回归组成；不表述为真实反向回滚已演练。

### 3. 业务方接受原文

> 我已知悉并接受 ISSUE-0020 上述七项残余风险，同意采用安全回滚替代证据，不要求恢复已暴露旧密钥进行真实回滚演练，并授权 ISSUE 管理员关闭 ISSUE-0020。但进行风险登记

接受方：业务方；接受日期：2026-08-15。

### 4. 七项残余风险登记

| ID | 事实 | 状态 | 接受方 | 接受日期 | 再打开触发条件 / owner |
| --- | --- | --- | --- | --- | --- |
| R1 | Contract B 的 B2 预期 403 中断超过 5 分钟停止上限；该执行偏差已如实保留。 | `ACCEPTED_RESIDUAL_RISK` | 业务方 | 2026-08-15 | 后续 hard-cut 再次超过 5 分钟、出现 HTTP 5xx 或违反停止条件；owner：项目总负责人 / CloudBase 与 Worker 配置执行侧。 |
| R2 | 053 包含/关联已暴露旧值，禁止常规回退；如紧急使用旧值，必须立即再次轮换。 | `ACCEPTED_RESIDUAL_RISK` | 业务方 | 2026-08-15 | 暴露旧值被恢复、出现在新工件/日志，或紧急使用后未立即重新轮换；owner：凭据负责人 / 项目总负责人。 |
| R3 | 未执行真实反向回滚演练，采用 `SAFE_ROLLBACK_ALTERNATIVE=PASS`；不得表述为已演练。 | `ACCEPTED_RESIDUAL_RISK` | 业务方 | 2026-08-15 | 安全替代证据失效、发生真实回滚需求，或回滚入口/forward recovery/停止条件不可用；owner：项目总负责人 / Cloudflare 与 CloudBase 配置执行侧。 |
| R4 | `054→e81`、`064→33314857` 的平台 Git provenance 未精确证明；064 仅证明行为路径生效。 | `ACCEPTED_RESIDUAL_RISK` | 业务方 | 2026-08-15 | 需要精确版本归因、出现行为与提交不一致，或平台 BuildId/commit 映射发生冲突；owner：项目总负责人 / 平台执行侧。 |
| R5 | CloudBase 单一上游与单 Worker 四域名共同构成故障面。 | `ACCEPTED_RESIDUAL_RISK` | 业务方 | 2026-08-15 | 单一上游、单 Worker 或四域名共同出现不可用、绕过或安全回归；owner：项目总负责人 / Cloudflare 与 CloudBase 配置执行侧。 |
| R6 | SSL 当前为 Full，非 strict。 | `ACCEPTED_RESIDUAL_RISK` | 业务方 | 2026-08-15 | 业务/合规要求 strict、源站证书链可用且未切换，或出现 TLS 降级/证书验证风险；owner：项目总负责人 / 平台配置执行侧。 |
| R7 | Cloudflare Free 限流仅提供 10 秒突发抑制及免费计划能力边界，不等于持续抗滥用或 DDoS 承诺。 | `ACCEPTED_RESIDUAL_RISK` | 业务方 | 2026-08-15 | 免费能力不足以应对持续滥用、出现异常流量/反馈写入风险，或需要付费能力；owner：项目总负责人 / 业务方。 |

### 5. 关闭后的责任边界

- `ISSUE-0020` 关闭后，如任一再打开触发条件成立，由项目总负责人按 owner 路由重新打开或新建对应 Issue；ISSUE 管理员仅维护状态与证据，不执行平台、代码、Git 或业务验收动作。
- 关闭依据不扩展到 `ISSUE-0031`、`ISSUE-0032`、`ISSUE-0034`、`ISSUE-0035`、`ISSUE-0036`、`ISSUE-0038`，也不改变项目总 workflow `WORKFLOW_ACTIVE`。

## 2026-08-10 最小生产只读复测追加证据

- 总负责人执行无登录、无写入的公开 HTTP HEAD 复测：`https://ungraduedu.eu.cc/` 返回 `200`，`Server: cloudflare`；`HSTS`、`CSP`、`Permissions-Policy`、`Referrer-Policy`、`X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY` 均存在。
- `https://www.ungraduedu.eu.cc/feedback?from=verify&keep=1` 返回 `308`，`Location` 精确保留为 `https://ungraduedu.eu.cc/feedback?from=verify&keep=1`。
- 固定 CloudBase 源站 `https://ungradu-edu-prod-275285-6-1445807473.sh.run.tcloudbase.com/` 返回 `403`，`server: cbrgw`；该证据与既有源站隔离通过结论一致。
- `https://ungraduedu.eu.cc/api/auth/session` 返回 `401`，安全响应头保留；仅证明匿名会话边界，不证明登录态业务回归或生产写入。
- 本轮未取得 workers.dev 最终状态行，不记录为重新验证通过或失败；HEAD/源站/匿名会话证据不证明业务写回、workers.dev 状态、回滚版本或回滚入口可用。
- `ISSUE-0020` 继续保持 `open / EXTERNAL_BLOCKED`；未通过门禁仍精确为：凭据轮换、专用非敏感账号登录态 feedback 成功回归、回滚入口现场确认、业务方最终残余风险接受。Active Open 仍为 8 项。

范围边界：本次仅追加 ISSUE-0020 canonical 与本工作记录的只读证据；未修改其他 Issue、Spec、代码、UI、总负责人文件或平台，未运行 npm/Git mutation、部署或生产写入。

## 2026-08-10 验收账号准备与登录态只读补充

- 业务方报告两个专用验收账号已准备；本条仅登记准备事实，不等于 feedback 成功、回滚验证或最终风险接受。
- 本轮 Chrome 页面只读确认一个账号显示“退出登录”，仅证明该账号当前登录态可见；未读取或记录 cookie、token、feedback 内容或生产写回。
- Edge 浏览器扩展当前不可用，第二账号未由本任务独立核验；不得将“两个账号已准备”扩展为两个账号均已登录或已完成业务回归。
- `ISSUE-0020` 保持 `open / EXTERNAL_BLOCKED`。凭据轮换、专用非敏感账号登录态 feedback 成功、回滚入口现场确认及业务方最终残余风险接受继续是未通过门禁。
- 唯一下一步：总负责人在不扩大生产写入范围的前提下路由第二账号只读登录态与一次受控 feedback 成功回归、凭据轮换及回滚入口证据，随后取得业务方最终残余风险接受。

## 2026-08-10 补充授权边界

- 用户授权非金钱的免费配置、部署与受控验收持续推进；凭据轮换、专用账号回归、回滚入口与业务残余风险门禁仍须取得对应证据。
- 不得将广泛授权解释为密钥明文泄露、绕过 CAPTCHA、虚构 owner 或跳过独立验收；本 Issue 仍保持 `open / EXTERNAL_BLOCKED`。

## 2026-08-11 生产部署证据与 www 回归登记

- 业务方报告 CloudBase“版本号-53”、流量 100%；Cloudflare Worker Version=`b76e7c2d-995b-464d-b2b3-ed4d0139bb40`，Source=`dash`。该“53”仅作为平台部署标识，不能推断为 Git SHA 精确映射。
- 总负责人生产只读复测：apex `/`、`/rules`、`/feedback` 均 200；匿名 `/api/auth/session` 为 401；安全头与 nonce CSP 正常；CloudBase 固定源站为 403；伪造公网 `x-ungrade-origin-verify` 仍由 Worker 正常返回 200，未绕过源站隔离。
- 初步在本机 WLAN 首选递归 DNS 路径上曾见 `www` 落 AWS CDN 404、`SEC_E_WRONG_PRINCIPAL`，但该归因已被权威复核纠正：Cloudflare Dashboard 中 www Custom Domain、Worker DNS record、含 www 证书均 Active；公共递归 DNS（223.5.5.5、119.29.29.29、114.114.114.114、1.1.1.1、8.8.8.8）查询 apex/www 均返回 Cloudflare `104.21.46.185 / 172.67.141.97`。
- 使用 `curl --resolve www:443:104.21.46.185` 且正常 TLS 校验，`https://www.ungraduedu.eu.cc/feedback?deploy=53&keep=1` 返回 308，Location 精确保留到 apex 同 path/query；Worker/Cloudflare 生产配置没有回归。此前 `www→apex` 失效结论撤销，不归为平台返工。
- `ISSUE-0020` 保持 `open / EXTERNAL_BLOCKED`；DNS 异常仅定位为本机 WLAN 当前首选 DNS `194.169.55.66` 返回非 Cloudflare 地址（该机第二 DNS 为 `8.8.8.8`），不表述为中国网络普遍污染；公共递归 DNS 与 Cloudflare 平台均正常。凭据轮换、专用非敏感账号登录态 feedback、完整回滚入口/演练和业务方最终残余风险接受仍未通过。`ISSUE-0034` 保持 `open / TECH_REVIEW_PASS`，生产验收仅部分通过；Active Open=7。
- 唯一下一步：在本机/当前网络首选 DNS 诊断范围内复核 `194.169.55.66` 的解析路径，同时继续收集 ISSUE-0020 剩余生产门禁证据，不修改已 Active 的 Cloudflare 配置。

## 2026-08-11 www 证据纠正

- 权威复核撤销“Cloudflare 配置被删/需修 Custom Domain”的归因：Cloudflare Dashboard 中 www Custom Domain、Worker DNS record（Proxy/Worker）及含 www 证书均 Active；1.1.1.1/8.8.8.8 查询 apex/www 均正确返回 Cloudflare `104.21.46.185 / 172.67.141.97`。
- `curl --resolve www:443:104.21.46.185` 正常 TLS 校验，`https://www.ungraduedu.eu.cc/feedback?deploy=53&keep=1` 返回 308，Location 精确保留到 apex 同 path/query。Worker/Cloudflare 生产配置没有回归。
- 此前本机 WLAN 首选 DNS `194.169.55.66` 返回另一组地址并导向 AWS CDN 404，现归入客户端 DNS 诊断范围；公共递归 DNS 与平台均正常，状态继续 `open / EXTERNAL_BLOCKED`，不得写成平台返工或中国网络普遍污染。

## 2026-08-11 最终 DNS 归因与 DeployId=053 登记

- 中国公共递归 DNS `223.5.5.5`（阿里）、`119.29.29.29`（腾讯）、`114.114.114.114` 及 `1.1.1.1`、`8.8.8.8` 对 apex/www 均返回 Cloudflare `104.21.46.185 / 172.67.141.97`；平台与主流公共 DNS 均正常。
- 仅本机 WLAN 当前首选 DNS `194.169.55.66` 返回错误的非 Cloudflare 地址；本机第二 DNS 为 `8.8.8.8`。因此不表述为“中国网络普遍 DNS 污染”，仅登记本机/当前网络首选递归 DNS 异常。
- CloudBase Dashboard 只读确认 DeployId=`053`，时间=`2026-08-11 00:06:50 +08:00`，状态=`正常`，流量=`100%`，实例=`1`。控制台服务配置页本轮只读检查意外触及生产环境变量展示区域；不记录、不回传任何变量值，仅登记变量类别已暴露，需由凭据负责人按轮换流程处理。
- 该事实不构成 ISSUE-0034 生产回归，也不新增或重开平台技术阻断；`ISSUE-0020` 仍 `open / EXTERNAL_BLOCKED`，仅保留客户端 DNS 诊断与生产变量类别轮换边界。
- 唯一下一步：凭据负责人完成生产变量类别安全轮换并诊断本机首选 DNS `194.169.55.66`，随后继续现有专用账号 feedback、回滚/演练与最终残余风险验收门禁。

## 2026-08-11 回滚契约修正与凭据暴露边界

- 本次唯一当前契约：旧 `ORIGIN_VERIFY_SECRET` 已触及控制台明文展示，`ORIGIN_OLD_SECRET_EXPOSURE=exposed`；不得在配置、工件或回传中保留或写入任何 Secret 值，且不得配置 `previous`。生产轮换仅允许 Contract B coordinated hard-cut：先将 CloudBase 切换到新值，再将 Worker 切换到新值；中间短暂 403 属预期中断，必须为每一步设置健康检查、停止条件和回滚记录，不得宣称无中断。
- exposed 值的回滚同样采用匹配成对 hard-cut，可能短暂 403；`observe/off` 不得作为常规回滚契约。若紧急恢复旧暴露值，只能作为临时风险动作，风险门禁仍未闭环，必须立即重新启动轮换。
- 仅当旧值可证明 `not-exposed` 时才允许 Contract A overlap：过渡期 CloudBase 接受 `primary+previous`，再切 Worker 新值、验证、移除 `previous`；回滚先恢复 accepted-secret overlap，再切 Worker，最后收敛为单值，全程保持 enforce。
- 机器门禁只记录字段而不记录值：`ORIGIN_OLD_SECRET_EXPOSURE`、`ORIGIN_ROTATION_STRATEGY`、`phase=transition|final`；任一字段 unknown/missing 即 fail-closed，`phase=final` 时 `previous` 必须为空。任何本地 readiness 只作为显式 release artifact，不等同平台 revision、Worker 发布、监控观察或回滚演练证据。
- `ISSUE-0020` 仍保持 `open / EXTERNAL_BLOCKED`；凭据轮换、专用非敏感账号登录态 feedback、完整回滚演练与业务方最终残余风险接受仍未通过。本次只读契约修正不授权生产轮换。

## 2026-08-11 e81 提交推送与平台只读预检登记

- 固定独立技术最终 verdict=`TECH_REVIEW_PASS`，Standards/Spec P0/P1/P2 均 `0/0/0`；该结论仅允许不读值、不改配置的平台预检，不授权凭据轮换或关闭。
- 安全整改 commit=`e81a29f10701a9f553441988381c4891d809233e`，branch=`V2-unified-navigation-responsive-profile-20260729`，22 个白名单文件，普通 push 成功且 remote 与 local 一致；10 files/94 tests、typecheck/lint、build 16/16、diff-check 均通过。该提交尚未部署。
- 只读平台预检：CloudBase DeployId=`053` 正常/100% 流量/1 实例；Worker current=`b76e7c2d-995b-464d-b2b3-ed4d0139bb40`；apex=200、匿名 session=401、固定源站=403、伪造验证头访问固定源站仍=403、旧 apex=200。
- 053 revision 与平台可执行回退入口已确认；尚未点击回退，不能写成完整回滚演练通过。上一 Worker deployment 精确版本和平台监控视图仍缺；尚未部署 e81、未轮换/撤销 Secret、未完成登录态 feedback、完整回滚演练或业务方最终残余风险接受。
- `ISSUE-0020` 保持 `open / EXTERNAL_BLOCKED`，Active Open=7。唯一下一步：取得 DeployId=054 部署日志中的无敏感 BuildId/Commit 映射，并取得监控页错误率/5xx/延迟与停止条件证据；不得点击回退或删除。确认后再按授权推进 exposed Contract B hard-cut、登录态 feedback 与完整回滚演练。e81 代码不含 Worker 文件，Worker 代码无需因 e81 另行发布。

## 2026-08-11 DeployId=054 证据与 Worker 部署范围纠正

- 业务方报告 CloudBase DeployId=`054` 已部署。匿名只读复验：主域名 `/`=200、`/api/auth/session`=401、旧公开入口 `/`=200、固定 CloudBase 源站直连=403、固定源站携带合成伪造 `x-ungrade-origin-verify` 仍=403；本批结论仅为 `PRODUCTION_SMOKE_PASS`。
- DeployId=`054` 尚无 BuildId 或 repository commit 精确映射，不得写成已证明对应 Git commit `e81a29f10701a9f553441988381c4891d809233e`。
- 经 `git show` 核对，e81 的 22 个提交文件不包含 `Code文档/cloudflare/worker.js` 或 `worker.ts`；本轮只需 CloudBase 代码发布，现有 Worker Version=`b76e7c2d-995b-464d-b2b3-ed4d0139bb40` 保持，不把 Worker 代码发布列为 e81 待办。
- 后续 exposed + Contract B hard-cut 轮换 `ORIGIN_VERIFY_SECRET` 时，才需要更新 Worker 加密绑定；平台届时可能生成新的 Worker deployment/version，但代码不变。不得读取、记录或回显任何 Secret 值。
- `ISSUE-0020` 继续 `open / EXTERNAL_BLOCKED`；054 不等于凭据轮换、回滚演练、登录态 feedback 或最终风险接受。053 revision 与平台可执行回退入口已确认，但尚未完成实际回滚演练。仍缺 054 BuildId/提交映射、平台监控/停止条件、实际 exposed hard-cut、登录态 feedback、完整回滚演练与最终残余风险接受；Worker 旧代码版本不再是 e81 发布阻塞，但 hard-cut 的 Worker 绑定恢复路径仍须证据。

## 2026-08-11 CloudBase 054/053 回退入口证据补充

- 业务方部署截图确认：054 时间 `2026-08-11 08:20:20 +08:00`、状态正常、流量 100%、实例 0、当前活动版本且回退按钮禁用；053 时间 `2026-08-11 00:06:50 +08:00`、状态正常、流量 `-`、实例 0、回退按钮可用。
- 该截图证明 053 revision 仍保留且存在平台可执行回退入口；本轮未点击回退，不得写成完整回滚演练通过。实例数 0 不单独判定故障，既有 054 生产 smoke 证据仍有效。
- 当前仍缺 054 BuildId/提交精确映射、平台监控页错误率/5xx/延迟与停止条件、exposed Contract B hard-cut、登录态 feedback、完整回滚演练和最终残余风险接受；ISSUE-0020 保持 `open / EXTERNAL_BLOCKED`，Active Open=7。
- 唯一下一步：取得 054 部署日志详情中的无敏感 BuildId/Commit 映射，并取得监控页错误率/5xx/延迟与停止条件证据；不得点击回退或删除。

## 2026-08-11 Cloudflare 拓扑消歧与 Contract B 单一配对同步

- 两张 Worker Domains 截图的 breadcrumb 均指向同一 Worker：`ungradu-edu-proxy`；Cloudflare Domains 首页的两个 Active 项是两个 Zone：`ungraduedu.eu.cc`（新）与 `ungradeedu.eu.cc`（旧），不是两个 Worker。
- 同一 `ungradu-edu-proxy` Production 环境绑定四个 Custom Domains：`ungraduedu.eu.cc`、`www.ungraduedu.eu.cc`、`ungradeedu.eu.cc`、`www.ungradeedu.eu.cc`。因此 origin 轮换只更新该单一 Worker 的一个 `ORIGIN_VERIFY_SECRET` 加密绑定，四个入口共同生效；不得重复更新、删除 Zone/域名或修改路由。
- hard-cut 拓扑固定为 CloudBase 服务 `ungradu-edu-prod` ↔ Worker `ungradu-edu-proxy` 的单一 matching pair。ISSUE-0020 保持 `open / EXTERNAL_BLOCKED`、Active Open=7；监控/停止条件与 053 回退入口已确认，实际 exposed hard-cut、登录态 feedback、完整回滚演练和最终残余风险接受仍未通过；054→e81 provenance 保留未证明风险。
- 唯一下一步：业务方本地生成新的强随机 Secret 且不回传/不截图；CloudBase 与该单 Worker 两端同名 Secret 编辑框就绪后，按 Contract B 先保存 CloudBase、随后保存 Worker，再由总负责人同步进行外部状态码验证。任何 Secret 值不得写入记录或回传。

## 2026-08-11 Contract B hard-cut 实际结果

- 业务方本地生成新强随机 Secret，CloudBase 与唯一 Worker `ungradu-edu-proxy` 使用同名 matching pair；Secret 值未回传、截图或落盘。
- CloudBase DeployId=`055` 先部署；13:31:07 +08:00 起进入预期 B2：新 apex/session=403、固定源站=403、无 HTTP 5xx。Cloudflare 首次仅保存 Secret 未 Deploy，Worker 仍使用旧值，导致 B2 超过运行手册 5 分钟停止上限；随后按官方 Dashboard 流程完成 `ungradu-edu-proxy` Production Deploy。
- 新 apex 于 13:40:41 恢复 200/session 401，旧 apex 于 13:42:07 恢复 200；两次探测端 ERR 非 HTTP 5xx，四项连续稳定至少至 13:43:52。B4 只读回归：新旧 apex=200、新旧 www=308 且保留 path/query、`/rules`/`/feedback`=200、匿名 session=401、固定源站无头/伪造头均=403，无 5xx、无源站绕过。
- 结论：`HARD_CUT_FUNCTIONAL_PASS_WITH_EXECUTION_DEVIATION`。matching pair 与安全终态通过，但 B2 超过 5 分钟停止条件，不能登记完全合规或完整回滚演练通过；当前不回滚到暴露旧值，053 仅作为暴露旧值紧急 revision 保留，054→e81 provenance 风险仍未证明。
- 当前状态：`open / EXTERNAL_BLOCKED`；阶段：`CONTRACT_B_HARD_CUT_FUNCTIONAL_PASS_WITH_EXECUTION_DEVIATION / POST_HARD_CUT_REVIEW_PENDING`。仍未通过新 Worker deployment/version 非敏感标识登记、双专用账号登录态 feedback、完整回滚演练的安全替代证据及最终残余风险接受。
- 唯一下一步：取得新 Worker deployment/version 标识并完成双账号登录态 feedback 回归；随后决定不恢复暴露旧值的安全回滚演练替代并取得业务方最终风险接受。任何 Secret 值不得写入记录或回传。

## 2026-08-11 Worker hard-cut 短版本证据补充

- 业务方 Cloudflare deployment 截图可见 Worker=`ungradu-edu-proxy`；最新显示/选中的短版本为 `e72e0119`，事件为 `Updated secret: ORIGIN_VERIFY_SECRET`，来源 Dashboard，操作者 `vangewang0919`，界面显示约 10m ago。
- 上一条短版本为 `72888e23`，同一 Secret 更新事件，界面显示约 13m ago；两者均属于同一 Worker 的更新记录，不是两个 Worker。
- 截图不含 Secret 值、完整版本 UUID 或流量信息；不得据此猜测完整标识或流量。结合既有外部恢复与稳定证据，登记 `e72e0119` 为本次有效更新后的最新显示短版本。
- `ISSUE-0020` 保持 `open / EXTERNAL_BLOCKED`、Active Open=7；hard-cut verdict 仍为 `FUNCTIONAL_PASS_WITH_EXECUTION_DEVIATION`。仍未通过双专用账号登录态 feedback、完整回滚演练/不恢复暴露旧值的安全替代证据及最终残余风险接受；054→e81 provenance 保留未证明风险。
- 唯一下一步：Chrome/Edge 两个专用非敏感账号各完成一次 feedback 成功回归并核对账号隔离；不得使用真实用户信息或记录任何 Secret 值。
