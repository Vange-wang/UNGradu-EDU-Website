# 2026-07-08 Cloudflare 临时 Worker 反代与安全加固配置清单

任务 ID：`CLOUDFLARE-WORKER-SECURITY-2026-07-08-001`

关联 Issue：`ISSUE-0020`

负责人线程：项目总负责人 v2.1.0（`019f2318-50b7-75e0-b0fc-0013edefc039`）

## 背景

项目总控制人已确认先走临时方案：使用免费可委派域名接入 Cloudflare，并通过 Cloudflare Worker 反代当前 CloudBase 默认生产域名：

`https://ungradu-edu-prod-275285-6-1445807473.sh.run.tcloudbase.com/`

该方案用于短期防护和访问入口收敛，不等同于最终最高安全生产架构。正式高安全链路仍应使用已备案正式域名、CloudBase 自定义域名、有效 SSL 证书、Cloudflare DNS / WAF / Bot / Rate Limiting 等完整组合。

## 官方依据

- Cloudflare Workers Custom Domains：自定义域名可将一个域名或子域名的所有路径指向 Worker，Cloudflare 会创建 DNS 记录并签发必要证书。
  - https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- Cloudflare SSL/TLS：Cloudflare 建议优先使用 Full 或 Full (strict)，以避免到源站链路被降级。
  - https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/
- Cloudflare Full (strict)：源站必须支持 443 HTTPS，且证书未过期、可信、匹配目标主机名。
  - https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/
- Cloudflare Flexible：访问者到 Cloudflare 加密，但 Cloudflare 到源站为 HTTP；含登录或个人数据的网站不应使用。
  - https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/flexible/
- Cloudflare Rate Limiting：可按表达式、周期、请求数和阻断/挑战时长限制 API 或登录等高风险入口。
  - https://developers.cloudflare.com/waf/rate-limiting-rules/
- CloudBase 自定义域名：正式绑定自定义域名需要域名备案、腾讯云 SSL 证书，并配置 CNAME 指向 CloudBase 环境域名。
  - https://docs.cloudbase.net/en/service/custom-domain

## 推荐临时域名路径

优先尝试 `.pp.ua` 临时免费域名，例如：

1. `ungradu-edu.pp.ua`
2. `ungraduedu.pp.ua`
3. `ungradu-education.pp.ua`
4. `ungradu-edu-test.pp.ua`

注意：

- `.pp.ua` 需要项目总控制人本人完成手机号或 Telegram 激活。
- `.pp.ua` WHOIS 信息可能公开，不适合作为长期正式品牌域名。
- 如果注册/激活要求支付卡、实名信息或验证码，必须由项目总控制人本人处理。

## Cloudflare 配置步骤

1. 在 Cloudflare 添加已激活域名，选择 Free plan。
2. 将注册商侧 nameserver 改为 Cloudflare 分配的两个 NS。
3. 等待 Cloudflare zone 状态变为 Active。
4. 创建 Worker，部署代码开发员交付的 Worker 反代脚本。
5. 在 Worker 的 Settings -> Domains & Routes 添加自定义域名：
   - 推荐：`www.<临时域名>`
   - 如 Cloudflare 允许并且无冲突，可再配置 apex 域名 `<临时域名>`。
6. SSL/TLS 模式：
   - 优先 `Full (strict)`。
   - 如果 Worker 作为入口且源站请求固定为 CloudBase HTTPS 默认域名，可保持 Cloudflare 到用户侧自动证书，Worker 到 CloudBase 使用 HTTPS。
   - 不使用 `Flexible`。
7. 开启基础安全：
   - Always Use HTTPS。
   - Automatic HTTPS Rewrites。
   - Bot Fight Mode（Free 可用时开启）。
   - WAF Managed Rules / Free managed protections（Free 可用项全部启用）。
   - Security Level 至少 Medium；被攻击时临时切 Under Attack Mode。
8. DNS：
   - Worker Custom Domain 通常由 Cloudflare 自动创建指向 Worker 的记录。
   - 不要额外创建直连 CloudBase 的橙云 CNAME，避免绕过 Worker 逻辑。

## Rate Limiting 建议

先建立保守规则，避免误伤正常用户：

| 场景 | 表达式示例 | 建议阈值 | 动作 |
| --- | --- | --- | --- |
| 登录 / 注册 / 验证码 | `http.request.uri.path contains "/api/auth"` | 10 次 / 60 秒 / IP | Managed Challenge 或 Block 5 分钟 |
| 风险反馈 | `http.request.uri.path eq "/api/feedback"` | 5 次 / 60 秒 / IP | Managed Challenge 或 Block 10 分钟 |
| 聊天 / 消息写入 | `http.request.uri.path contains "/api/chats"` | 30 次 / 60 秒 / IP | Managed Challenge |
| 全站异常高频 | `http.host eq "<临时域名>"` | 300 次 / 60 秒 / IP | Managed Challenge |

上线第一天建议先用 Managed Challenge，观察无误后再提高敏感接口的阻断强度。

## Worker 反代验收标准

- `https://www.<临时域名>/` 返回 200。
- `/customer-service`、`/feedback`、`/chats/...` 等已知页面可访问。
- query string 能保留。
- 表单 POST / API 请求能正确到达 CloudBase。
- 响应头包含基础安全头：
  - `Strict-Transport-Security`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Content-Security-Policy` 或等价 frame / object 限制
- 不暴露不必要的上游实现信息：
  - 尽量移除或覆盖 `server`、`x-powered-by` 等响应头。
- 不出现 HTTP 明文跳转。
- 不使用 Cloudflare Flexible SSL。

## 风险与限制

- 临时 Worker 反代不能完全隐藏 CloudBase 默认域名；只要默认域名仍公开，攻击者仍可能绕过 Cloudflare 直接访问源站。
- 免费 Cloudflare 能缓解常规流量攻击和低成本滥用，但不承诺绝对防 DDoS。
- CloudBase 正式自定义域名可能受 ICP 备案和证书要求阻塞，`.pp.ua` 临时域名大概率不能作为 CloudBase 正式生产自定义域名。
- 如果需要最高安全等级，后续必须迁移到正式域名、备案、CloudBase 自定义域名和源站访问限制方案。

## 当前流转状态

- `ISSUE-0020` 已登记为 Open。
- 代码开发员执行子线程正在准备 Worker 与代码侧安全基线。
- 外部账号操作待项目总控制人本人完成域名注册 / 激活 / Cloudflare 登录。
