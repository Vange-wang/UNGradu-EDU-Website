# ISSUE-0020 临时 Cloudflare Worker 反代与安全基线加固

| 字段 | 内容 |
| --- | --- |
| id | `ISSUE-0020` |
| title | 临时 Cloudflare Worker 反代与安全基线加固 |
| type | ops / security hardening / deployment workaround |
| status | open |
| priority | P1 |
| source | 用户确认临时 Cloudflare Worker 反代方案；2026-07-18 指定新公开域名 `ungradeedu.eu.cc`，继续在同一 Issue 内跟踪域名接入、部署与安全基线闭环 |
| owner_agent | 项目总负责人（证据路由与恢复） / 业务方（风险接受） / ISSUE 管理员（状态维护） |
| related_files | Cloudflare Worker；Cloudflare Free 安全配置；CloudBase 默认访问域名；`ungradeedu.eu.cc` 根域与 `www`；Custom Domain / DNS / 证书配置；安全响应头与去指纹验证记录 |

## 背景

用户已确认采用临时 Cloudflare Worker 反代方案，用于在 CloudBase 自定义域名链路不稳定或暂不可用时，先建立可访问的 HTTPS 入口与基础安全防护。

2026-07-18，用户将计划公开域名切换为 `ungradeedu.eu.cc`。此前 `.pp.ua` 路径保留为历史背景，不再作为当前唯一下一步；本 Issue 继续沿用原编号，跟踪新域名接入现有 Worker、部署和线上安全复测。

当前生产事实：

- `ungradeedu.eu.cc` 已切换到 Cloudflare 权威 NS，zone 为 Active；根域与 `www` 已解析到 Cloudflare 边缘。
- Worker `ungradu-edu-proxy` 生产版本 `d8eff139` 为 Active；根域、`www` Custom Domain 与 workers.dev 回退入口均已生效。
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

- 业务方尚未明确接受以下剩余风险：workers.dev 仍可直访；CloudBase 原始源站仍可绕过 Worker；CloudBase 为单一上游；当前无持续监控证据。
- 原 Issue 要求的 zone 级 Cloudflare Free 安全项、WAF / Bot / rate limit 或等价规则启用状态与不覆盖范围，当前证据包未提供可核验记录。zone 已实际接入，旧“zone 项 N/A / 后续补齐”口径不再适用。

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

## 当前精确关闭门禁

已通过门禁：

1. Cloudflare zone、根域与 `www` Custom Domain、证书和 Worker 生产版本均已生效。
2. 根域三条核心路由、匿名 401、`www` 精确保留 path/query 的 308、workers.dev 回退均已通过实时复核。
3. 三入口 HTTPS、安全响应头和线上去指纹已通过实时复核。
4. 定向 8/8、全量 181/181、typecheck、lint、build 已通过。
5. 开发提交 `23620c99a8e0c322c913af9f4f4f5bd0d494eda3` 已推送，生产版本 `d8eff139` Active。
6. 产品经理独立产品验收通过；无需新开或重开其他 Issue。

尚未通过的关闭门禁：

1. **配置证据门禁（责任人：项目总负责人 / Cloudflare 账号持有人）**：提供当前 zone 的 Cloudflare Free 安全配置记录，至少逐项说明 SSL/TLS、Always Use HTTPS、Automatic HTTPS Rewrites、Bot / WAF、rate limit 或等价规则的启用状态、不可用项和不覆盖范围。最小解除条件是形成可核验截图、导出或逐项状态记录；恢复触发条件是该证据路由给 ISSUE 管理员。
2. **业务方风险接受门禁（责任人：业务方）**：明确接受 workers.dev 仍可直访、CloudBase 原始源站仍可绕过 Worker、CloudBase 单一上游、当前无持续监控证据；如 zone 安全配置记录显示某项不可用或未启用，需一并明确接受。最小解除条件是一条可归档的明确确认；恢复触发条件是项目总负责人将该确认路由给 ISSUE 管理员。

## 唯一下一步

项目总负责人补充当前 zone 的 Cloudflare Free / WAF / Bot / rate-limit 或等价安全配置状态证据，并据此向业务方发起一次合并风险确认；两项证据齐备后路由给 ISSUE 管理员恢复最终关闭复核。
