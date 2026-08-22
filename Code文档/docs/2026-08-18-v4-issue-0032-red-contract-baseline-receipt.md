# V4 ISSUE-0032 现有定向基线与 RED/契约清点回执

## 1. 状态与边界

- 任务 ID：`V4-ISSUE-0032-RED-CONTRACT-BASELINE-INVENTORY-20260818`
- 执行角色：`019fefa7-a3c3-7333-94d7-d61961c5ea99 / 代码开发员v2.3.2`
- 总体状态：`BASELINE_RUNTIME_BLOCKED`
- 静态交叉结论：`BASELINE_CONTRACT_GAP_REPRODUCED`
- 不得声称：`EXISTING_SERVER_FAIL_CLOSED_TESTS_PASS`、`TDD_RED_TEST_ADDED`、`V4-S1_PASS`、实现完成或 `TECH_REVIEW_PASS`。
- 本轮只读取冻结 Spec、V4 commit 内容和现有测试，并尝试运行获准的三份既有定向测试；未新增或修改 V4 代码、测试、快照、配置和依赖。

## 2. 冻结现场

| 项目 | 新鲜结果 |
| --- | --- |
| V4 worktree | `D:/codex_project/家教对接website-v4-issue-0032-email-turnstile-closure` |
| branch | `V4-issue-0032-email-turnstile-closure` |
| HEAD | `ee41c3f30770be6f7a9a0e548975464268b911d2` |
| tree | `bc09512016e9e987f0a591096d10f6a6571eceef` |
| status / staged / unstaged / untracked | `0 / 0 / 0 / 0` |
| tracked | `394` |
| upstream / push | 无 upstream；未 push |
| branch creation receipt | SHA-256=`140D487AEFCBCEEDCDB48D32E3CC1AC2B0573A4382559A81C69BA86E973F42D5`；7,649 bytes / 91 lines |
| ISSUE-0032 Spec | SHA-256=`F7939E3BD8769B9BE4CB18335A71B1BC624FD32182827F099F219F8DD36B9073`；16,889 bytes / 191 lines |
| V4 dependencies | `Code文档/node_modules` 不存在；未安装、复制、链接或创建依赖目录 |
| allowed Vitest binary | 主工作树 `Code文档/node_modules/.bin/vitest.cmd` 存在 |

项目 workflow=`WORKFLOW_ACTIVE`；`ISSUE-0032=open / USER_CONFIRMATION_PENDING`。`V4_PARAMETER_RECEIPT` 尚未冻结，因此本轮不能编写参数化 RED、执行 V4-S1 或给出阶段 PASS。

## 3. 五个 inherited seam 的只读事实

1. `app/api/auth/email/send-code/route.ts:16-23`：生产条件下设置 `requireChallenge=true`，并以 fail-closed verifier、数据库集合、持久限流器创建 handler。
2. `server/email-auth-api.ts:188-240,243-281`：`POST_SEND_CODE` 解析 `challengeToken` 与 `email`；在限流和 `sendEmailLoginCode` 前调用 `verifyChallengeForRequest(..., "email_send_code")`；缺失、错误、不可达或 replay 均先返回失败。
3. `server/security/email-challenge.ts:3-38,70-72,180-249,260-317`：现有 verifier 具备缺 token、错误 action/hostname、过期、重复、timeout、provider/解析不可达和 Secret 缺失的 fail-closed 分类；固定默认 TTL 只是继承实现，不是 V4 参数冻结结论。
4. `features/auth/login-form.tsx:84-116`：邮箱验证码客户端 `POST /api/auth/email/send-code` 的请求体精确为 `{ email }`，没有 `challengeToken`。
5. `features/auth/login-form.tsx:363-405` 与 `features/auth/turnstile-widget.tsx:9-15,64-100`：既有 `TurnstileWidget` 只在 password mode 渲染，action 固定为 `password_login`；其 token、错误、过期、reset、卸载清理生命周期没有接到 email-code mode。

上述内容共同证明“服务端已有、客户端未接”的 inherited partial baseline；它不是本轮新增 RED，也不证明邮箱发送前链已完成。

## 4. 现有测试盘点

| 现有测试文件 | 静态定义 | 已覆盖 | 未覆盖 / 证明边界 |
| --- | ---: | --- | --- |
| `tests/issue-0034-security-baseline.test.ts` | 16 tests | `requireChallenge=true` 下缺 token 与 bad token 返回 403；valid synthetic token 可进入发送且最终只有 1 次发送；provider 不可达返回 503 且发送 0；通用 verifier 对 issue time、provider 错误、timeout、重复、错 action/hostname、过期和 Secret 缺失 fail-closed | email send-code 的 valid test 让 verifier 回显传入 action/hostname，未独立断言其精确值；未验证 email token 的项目侧一次性重放；完整 provider failure matrix 使用 `password_login`，不能替代 email-code UI/发送链契约 |
| `tests/email-auth.test.ts` | 26 tests | 邮箱格式、一次性验证码、掩码、限流、验证码过期/复用、账号/Session/密码等既有邮箱认证行为 | helper 的 send-code payload 只有 `email`，默认 test handler 不要求 challenge；没有 production `requireChallenge=true` 的 email send-code token/widget 契约 |
| `tests/login-approved-visual-contract.test.ts` | 9 tests，含 1 个条件 browser suite | password mode 请求包含 `challengeToken`、无 token 时按钮禁用、widget action=`password_login`、错误/过期/reset/unmount 清 token、成功前清 token；browser suite 设计为脚本失败后重试和可访问提示 | 没有 email-code mode widget、`email_send_code` action、send-code payload token、无 token 禁止发送、email token 错误/过期/reset/模式切换生命周期测试；本轮启动失败，无法确认 browser suite 实际执行或 skip |

全仓 `tests` 只读检索显示，直接出现 `email_send_code` 或 `POST_SEND_CODE(sendCodeRequest...)` 的现有测试文件只有 `tests/issue-0034-security-baseline.test.ts`；没有另一份现有 email-code UI challenge 测试可用于本轮补证。

## 5. A–G 契约矩阵

| 项 | 结论 | 证据边界 |
| --- | --- | --- |
| A. client payload | `GAP_REPRODUCED`：只含 `email`，缺 `challengeToken` | `login-form.tsx:97-102` |
| B. requireChallenge 缺 token | 现有测试契约预期 403，且与 bad token、valid token 串行后总发送数为 1，静态断言意味着前两次发送 0 | `issue-0034-security-baseline.test.ts:361-380`；因 runtime blocked，不能称本轮测试 PASS |
| C. valid synthetic token | 现有测试预期 200/发送一次；实现明确传 `email_send_code` | 测试未独立断言 action/hostname，也未覆盖 email token replay；不能声称 action/hostname/一次性/重放/顺序已由完整行为测试闭环 |
| D. password UI | 已有静态与条件浏览器契约：token payload、禁用、widget、action、错误/过期/reset/unmount、成功清理 | 仅 password mode；本轮未成功执行 |
| E. email-code UI | `GAP_REPRODUCED`：无 widget/token/action/lifecycle seam | 现有测试零覆盖，不得把 password 测试外推 |
| F. 参数依赖 | `UPSTREAM_PENDING` | token TTL、verify timeout、host/action、consume 保留/清理、账号/IP/设备/会话/动作阈值/窗口/顺序、provider 分类与 owner/批准人均须先由 `V4_PARAMETER_RECEIPT` 冻结 |
| G. 可称状态 | 可称 `BASELINE_CONTRACT_GAP_REPRODUCED` | 不能称 `EXISTING_SERVER_FAIL_CLOSED_TESTS_PASS`，因为两次命令均在 test collection 前启动失败 |

## 6. 获准测试命令与运行时阻塞

首次命令：

```text
& 'D:/codex_project/家教对接website/Code文档/node_modules/.bin/vitest.cmd' run --root 'D:/codex_project/家教对接website-v4-issue-0032-email-turnstile-closure/Code文档' 'tests/issue-0034-security-baseline.test.ts' 'tests/email-auth.test.ts' 'tests/login-approved-visual-contract.test.ts'
```

- exit=`1`；用时约 `4.41s`。
- 在测试收集前加载 `vitest.config.ts` 失败：`ERR_MODULE_NOT_FOUND: Cannot find package 'vitest'`。
- test files loaded=`0`；tests passed/failed/skipped=`0/0/0`；startup error=`1`。

按授权只做一次进程级重试：

```text
$env:NODE_PATH='D:/codex_project/家教对接website/Code文档/node_modules'; & '<same-main-vitest-binary>' run --root '<same-V4-Code-root>' '<same-three-test-files>'
```

- exit=`1`；用时约 `0.70s`。
- 同一 ESM package resolution 失败；`NODE_PATH` 没有让 V4 `vitest.config.ts` 的 ESM import 解析到主工作树 package。
- test files loaded=`0`；tests passed/failed/skipped=`0/0/0`；startup error=`1`。
- 两次运行后 V4 均为 status/staged/unstaged/untracked=`0/0/0/0`，未残留 `vitest.config.ts.timestamp-*.mjs`。

最小解除条件：由总负责人取得新的单步授权，为 V4 worktree 提供可被其 ESM 配置正常解析的隔离依赖运行时（例如在 V4 `Code文档` 使用冻结 lockfile 执行受控 `npm ci`），随后原样重跑同一三文件命令。当前授权明确禁止安装、复制、junction/symlink，因此本线程在此停止，不能换用主工作树源码冒充 V4。

## 7. 未执行项与唯一下一步

- 未新增/修改任何 V4 文件；未运行全量 test、typecheck、lint、build 或浏览器服务器。
- 未使用真实邮箱、token、Cookie、Secret 或 provider 响应；未联网、未部署、未操作平台/数据库/付费。
- 未执行 Git mutation、push；未修改 Spec、Issue、UI、注册文件；未创建任务/subagent。
- 未冻结 provider/widget/Secret/参数值；未进入 V4-S1。

唯一下一步：返回项目总负责人验收本 `BASELINE_RUNTIME_BLOCKED` 回执；由总负责人另获用户单步授权后解除 V4 依赖运行时阻塞，再由同一代码 owner 重跑完全相同的三份现有定向测试。不得在此之前新增 RED、实现或参数结论。
