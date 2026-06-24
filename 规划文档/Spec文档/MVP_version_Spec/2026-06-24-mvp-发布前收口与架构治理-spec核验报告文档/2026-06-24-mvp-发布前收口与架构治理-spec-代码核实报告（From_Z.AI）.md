# 《MVP 发布前收口与架构治理 Spec》代码核实报告

日期：2026-06-24

核实身份：产品经理（独立代码核实）

核实对象：

- `规划文档/Spec文档/2026-06-24-mvp-发布前收口与架构治理-spec.md`（草案，以下简称“Spec”）
- `规划文档/Spec文档/2026-06-24-mvp-发布前收口与架构治理-spec-审核报告.md`（以下简称“审核报告”）

核实方式：不再依据文档之间的转述，而是直接读取分支 `codex/m5-security-preflight` 上的源码，逐项核对 Spec 第 10 节、审核报告第 2-4 节中每一个点名的代码断言（文件、行号、代码模式、数字）是否真实存在，并据此判断两份文档的合理性。

## 1. 总体结论

经源码独立核实，Spec 与审核报告中**所有点名的技术断言均与代码实际相符**，没有发现任何一方存在凭空杜撰或与代码不符的描述。两份文档的方向、范围与优先级分级相互印证，可以作为发布前收口阶段的工作依据。

在此基础上：

- **Spec**：方向准确、范围清晰，存在 1 处与代码实际防护能力不符的偏保守表述，建议补正。
- **审核报告**：7 条修改意见的技术依据全部核实属实，优先级分级（必须改 / 建议改）合理，建议在定稿前采纳。
- **补充发现**：代码中还存在一条 Spec 与审核报告均未提及的备用认证路径，建议纳入禁用测试登录确认清单。

## 2. Spec 第 10 节技术问题逐项核实

下表每一项均由本报告作者直接读源码确认，不依赖任何文档转述。

| Spec 章节 | 问题点 | 核实文件:行号 | 核实结论 |
| --- | --- | --- | --- |
| 10.1 | 会话查询全集合扫描 | `Code文档/server/conversations.ts:192-200` | 属实。`readAllConversations()` 使用 `conversationsCollection.where({}).get()` 后内存 `.filter()`，`createOrReadServerConversationFromSource()`（252 行）与 `listServerConversationsForUser()`（323 行）均依赖该全量读取结果做筛选和去重。 |
| 10.2 | 登录 `next` 参数无校验 | `Code文档/features/auth/login-form.tsx:76` | 属实。登录成功回调直接执行 `router.push(searchParams.get("next") ?? "/")`，无任何字符串校验。 |
| 10.3 | 反馈入口只有文案 | `Code文档/app/feedback/page.tsx:1-13` | 属实。页面仅含纯文案，无 `mailto:` 链接、无表单、无外部收集链接，连运营邮箱地址都未填写。 |
| 10.4 | Cookie 无服务端硬过期 | `Code文档/server/auth-session.ts:100-142` | 属实。`readAuthSessionFromRequest()` 仅校验签名与字段完整性，无任何基于 `createdAt` 的时间窗口判断；第 15 行 `MAX_AGE_SECONDS` 仅用于写入 Cookie 的 `Max-Age`。 |
| 10.5 | 前端 API 非 JSON 响应无容错 | `Code文档/features/auth/login-form.tsx:65`、`features/chat/chat-api-client.ts:38`、`features/parent-needs/parent-need-api-client.ts:40`、`features/tutor-profiles/tutor-profile-api-client.ts:40`、`features/profile/contact-profile-api-client.ts:30`、`features/auth/use-test-session.ts:32` | 属实。6 个前端 API client 均直接 `await response.json()`，无 try/catch。若 CloudBase Run 返回 HTML 错误页（正是 M5 托管复验首次遇到的情况），这些调用会抛异常导致页面崩溃。 |
| 10.6 | 无可见登出入口 | `Code文档/app/profile/page.tsx:7-12`、`Code文档/app/layout.tsx:20-24` | 属实。个人页链接列表仅含“联系方式管理/我发布的需求/我发布的家教信息/我的聊天”；全局导航仅有“登录/个人页/规则”，均无“退出登录”入口。 |
| 10.7 | 证明图片仅存元数据 | `Code文档/server/tutor-profiles.ts:96-112` | 属实。`normalizeTutorProfile()` 仅要求 `proofImages` 是数组，无真实 CloudBase 文件上传逻辑，仅保存元数据。 |
| 12.1 | 公开列表分页上限约 1000 条 | `Code文档/server/parent-needs.ts:116-117`、`Code文档/server/tutor-profiles.ts:118-119` | 属实。`RECENT_PUBLIC_QUERY_LIMIT = 100` × `RECENT_PUBLIC_QUERY_MAX_PAGES = 10`，两集合均为 1000 条上限。 |

## 3. 审核报告核实

### 3.1 审核报告“必须改”三项

| 编号 | 审核报告主张 | 核实结论 |
| --- | --- | --- |
| 2.1 | 会话问题是 M5 已修复的 `parent_needs`/`tutor_profiles` 全集合扫描模式在同类型缺陷上的复发，建议复用其分页方案 | 属实且判断扎实。`parent-needs.ts:139-157`、`tutor-profiles.ts:141-159` 均已采用 `orderBy("createdAt","desc") + skip/limit` 分页轮询，而 `conversations.ts:193` 仍是 `where({}).get()`。架构审查报告第 278 行亦佐证“M5 已从单次 `.get()` 改为分页拉取”。此条增补价值最高，能避免开发者重复造轮子。 |
| 2.2 | 指出 `next` 参数无校验的具体文件位置 `login-form.tsx` | 属实。位置与代码写法与审核报告描述完全一致（见上表 10.2）。 |
| 2.3 | 把复跑 `m5:hosted:verify` 的判断标准从“托管环境改动”改为“服务端业务逻辑改动” | 合理。本阶段第 10.1-10.5 多为服务端业务逻辑改动，并非部署配置改动，但合并后理应在托管环境复验。该措辞调整直击 M5 多轮“本地通过≠托管通过”的痛点。 |

### 3.2 审核报告“建议改”四项

| 编号 | 审核报告主张 | 核实结论 |
| --- | --- | --- |
| 3.1 | 第 10 节各小节验收标准统一补充“随托管复验一并验证” | 合理。当前各小节验收标准普遍只写“单测覆盖 XX 场景”，未区分是否需在 `m5:hosted:verify` 链路复跑。 |
| 3.2 | 第 12.1 节补充分页上限的产品语义说明 | 合理。数字准确无需改动，补一句触发条件说明能让后续读者无需翻代码即理解风险边界。 |
| 3.3 | 第 9 节补充 `AUTH_SESSION_SECRET` 轮换会导致在线用户被登出 | 合理。`auth-session.ts:39-41` 的 HMAC 签名机制确实意味着轮换密钥后所有已签发 Cookie 全部失效。 |
| 3.4 | 第 14 节补充“架构收口问题修复对照表”交付物 | 合理。第 10 节 7 项 P1/P2 目前无单独可追溯交付物跟踪修复提交与复验状态。 |

### 3.3 审核报告“确认无需改动”部分

审核报告第 4 节列出的 6 项“判断准确、无需改动”内容（第 2 节定位、4.2 范围边界、10.3/10.4/10.6 问题描述、第 15 节风险说明），本报告逐项独立读源码核实，**全部属实**，无误判。

## 4. 补充发现：备用认证路径未纳入确认清单

核实 `Code文档/server/api-utils.ts:32-75` 时发现，除 Spec 第 9 节提到的 `/api/auth/test-login` 外，还存在一条**备用认证路径**：

- `readAuthenticatedUserId()` 在会话 Cookie 缺失时，会读取 HTTP 请求头 `x-ungradu-test-user-phone`（第 45 行）作为用户身份。
- 该路径同样受 `isTestLoginAllowed()` 保护（第 54-69 行），在 `APP_ENV=production` 下也会返回 401 拒绝。

该路径在 Spec 第 7 节“测试账号管理”和第 9 节“正式生产禁用测试登录确认”中均未提及。

判断：

- 安全性上无新增风险，因为该路径与 `test-login` 共用同一套 `isTestLoginAllowed()` 闸门，生产环境同样被拒绝。
- 但既然 Spec 要做“禁用测试登录确认清单”，为使清单与代码实际认证路径完全对齐、避免遗漏，建议在第 9 节确认项中补一条：

> 生产环境下，通过 `x-ungradu-test-user-phone` 请求头的备用测试身份路径同样被拒绝（由 `readAuthenticatedUserId` 经 `isTestLoginAllowed` 闸门控制，`APP_ENV=production` 时返回 401）。

## 5. 建议修正：Spec 第 9 节测试变量措辞偏保守

Spec 第 9 节确认项写“生产环境未配置 `M5_ENABLE_HOSTED_TEST_LOGIN=true`”和“未配置 `NEXT_PUBLIC_ALLOW_TEST_LOGIN=true`”。

核实 `Code文档/features/auth/test-auth.ts:34-54` 的实际逻辑：

```text
if (appEnv === "production") {
  return false;   // 直接拒绝，不再检查任何测试变量
}
```

即只要 `APP_ENV=production`，`isTestLoginAllowed()` **直接返回 false，不再读取上述两个测试变量**。这意味着即使误把这两个测试变量设为 `true`，只要 `APP_ENV=production`，测试登录仍被拒绝——是**双重防护**。

影响：

- Spec 当前措辞虽不影响实际安全，但会把这两个变量写成“必要条件”，容易让验收者误以为“漏配一个变量就会放行测试登录”，产生不必要的紧张或误判。
- 同时这也印证了：`APP_ENV=production` 是整条测试登录防线的**主闸**，应作为第 9 节首要确认项。

建议在第 9 节补一句说明该兜底逻辑，使确认清单与代码实际防护等级一致。

## 6. 结论与处理建议

1. **两份文档技术严谨、相互印证，可进入执行阶段。**
2. 建议在 Spec 定稿前采纳审核报告 2.1-2.3 三项“必须改”。
3. 建议补入本报告第 4 节的备用认证路径确认项，使禁用测试登录确认清单与代码实际认证路径完全对齐。
4. 建议补正本报告第 5 节指出的第 9 节措辞，明确 `APP_ENV=production` 为主闸及其兜底逻辑。
5. 审核报告 3.1-3.4 四项“建议改”可由产品经理决定是否采纳，不采纳也不影响进入执行阶段。

## 7. 核实依据文件清单

本报告所有结论的代码依据（分支 `codex/m5-security-preflight`）：

- `Code文档/server/conversations.ts`
- `Code文档/server/parent-needs.ts`
- `Code文档/server/tutor-profiles.ts`
- `Code文档/server/auth-session.ts`
- `Code文档/server/auth-api.ts`
- `Code文档/server/api-utils.ts`
- `Code文档/features/auth/login-form.tsx`
- `Code文档/features/auth/test-auth.ts`
- `Code文档/app/feedback/page.tsx`
- `Code文档/app/profile/page.tsx`
- `Code文档/app/layout.tsx`
- `Code文档/features/chat/chat-api-client.ts`
- `Code文档/features/parent-needs/parent-need-api-client.ts`
- `Code文档/features/tutor-profiles/tutor-profile-api-client.ts`
- `Code文档/features/profile/contact-profile-api-client.ts`
- `Code文档/features/auth/use-test-session.ts`
- `规划文档/技术验证/2026-06-24-mvp-m1-m5整体代码架构审查报告.md`
