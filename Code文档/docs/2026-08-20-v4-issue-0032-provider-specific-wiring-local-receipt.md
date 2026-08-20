# V4 ISSUE-0032 Provider-Specific 最小服务端接线本地回执

## 1. 任务、固定点与边界

- 任务：`V4-ISSUE-0032-PROVIDER-WIRING-LOCAL-20260820`
- 执行角色：`代码开发员v2.3.2 / 019fefa7-a3c3-7333-94d7-d61961c5ea99`
- branch：`V4-issue-0032-email-turnstile-closure`
- 写前 HEAD：`23c959e0fc1e8096828fb8c855ecddb2800995bf`
- 写前 tree：`90addce1c5ca2d7cfd9acc5084156ab4e1860b97`
- 写前 Git 状态：clean，staged/unstaged/untracked=`0/0/0`
- workflow：`WORKFLOW_ACTIVE`
- ISSUE-0032：`open`

本批目标仅为把邮箱验证码发送 route 接到仓库既有 Turnstile Siteverify verifier，并完成本地合成测试。未读取或写入真实 Secret、token、Cookie、邮箱或凭据；未调用真实 Cloudflare、SMTP、CloudBase 或数据库；未执行 Git mutation、提交、推送、部署或平台配置。生产观察方案 A、provider/platform 配置、生产验证、产品/业务验收和 Issue 关单不属于本批。

## 2. 根因与最小方案

写前 `app/api/auth/email/send-code/route.ts` 固定注入 `createFailClosedEmailChallengeVerifier()`，因此即使运行环境具有 `TURNSTILE_SECRET_KEY` 与 `TURNSTILE_EXPECTED_HOSTNAMES`，邮箱发码 route 也不会调用 Siteverify。

最小方案只替换该 route 的 verifier 工厂：

- 使用既有 `createTurnstileEmailChallengeVerifier`；
- 从 `createRuntimeEnvWithSessionRevocation` 返回的 env 读取 `TURNSTILE_SECRET_KEY`；
- 将 `TURNSTILE_EXPECTED_HOSTNAMES` 按 ASCII 逗号拆分、trim、lowercase、去空项后传入既有 exact-hostname 校验；
- 不修改共享 verifier、邮箱认证 API、前端、密码登录 route、依赖、环境变量名称或错误契约。

## 3. RED → GREEN

公共 seam：真实 `POST /api/auth/email/send-code` route export；仅 mock CloudBase 数据库与 Siteverify 网络这两个系统边界，全部输入为合成值。

### RED

命令：

```text
D:\node\nvm\v24.19.0\node.exe .\node_modules\vitest\vitest.mjs run tests/issue-0032-provider-specific-wiring.test.ts --maxWorkers=1 --maxConcurrency=1 --reporter=verbose
```

结果：exit `1`；`1 failed / 2 passed`。唯一失败断言为有效 provider 配置下 `fetch` 期望调用一次、实际为 `0`；这精确证明 route 仍使用占位 fail-closed verifier。缺 Secret、空 hostname allowlist 两个既有 fail-closed 场景均已通过。

### GREEN

只修改 route 的 verifier 注入后以同一命令复跑：exit `0`；`1 file / 3 tests passed`。

行为证据：

- 有效合成配置调用固定 Siteverify endpoint 一次，请求携带合成 Secret 与合成 token；mixed-case hostname 配置经 trim/lower/filter 后与 exact provider hostname 匹配。
- 邮箱业务 Secret 故意缺失时，challenge 已通过但发送链继续以 JSON 503 fail closed；`email_login_codes` 零写入。
- Turnstile Secret 缺失或 hostname allowlist 为空时，provider 调用为 0、JSON 503、`email_login_codes` 零写入。
- Secret 只存在于测试进程的合成占位输入和私有 FormData 断言，不进入响应、日志、snapshot 或本回执。

## 4. 新鲜验证

| 门禁 | 结果 |
|---|---|
| 聚焦新测试 | exit 0；1 file / 3 passed |
| ISSUE-0032 与直接安全/route/browser 回归 | exit 0；6 files / 84 passed；真实 login browser lifecycle suite 已运行 |
| `npm run typecheck` | exit 0 |
| 默认 `npm test` | exit 0；82/82 files；597 passed / 1 skipped（唯一 skip 为需显式 `RUN_ISSUE0033_CLOUDBASE_INTEGRATION=1` 的真实 CloudBase 集成套件，本批禁止运行） |
| `npm run lint` | exit 0；0 warning/error |
| 无额外环境注入 `npm run build` | exit 0；Next 15.5.19；17/17 static pages；目标 route 进入动态 route manifest |
| `git diff --check` | exit 0 |

所有 npm 命令均由一致的绝对 Node 24.19.0 / npm 11.17.0 路径启动；未执行安装、audit fix 或依赖更新。

## 5. 精确 manifest 与文件证据

本批业务实现候选仅包含：

1. `Code文档/app/api/auth/email/send-code/route.ts`
2. `Code文档/tests/issue-0032-provider-specific-wiring.test.ts`
3. `Code文档/docs/2026-08-20-v4-issue-0032-provider-specific-wiring-local-receipt.md`
4. `Code文档/开发员工作记录.md`（仅末尾追加）

生产 route 写前 SHA-256=`8644430D967E73C6F439602D33F9F43F7770242FB32A930E0E788C94906C9831`，`1709 bytes / 40 lines`。新测试写前不存在。其余共享实现与回归测试均未修改；`package.json`、`package-lock.json` 无 diff。

最终 SHA-256、bytes、lines 与工作记录 prefix 证明见本回执末节和完成回报。

## 6. Fail-closed、安全、隐私与回滚边界

- Origin/CSRF → verify → consume → layered limit → 60s cooldown → send 的既有顺序未改。
- 缺 Secret、空/非法 hostname、provider 不可达/超时、wrong action/hostname、过期、duplicate/replay 继续由既有 verifier/API 回归覆盖并 fail closed，发送为 0。
- 未新增 endpoint、provider、环境变量、依赖、hostname、Origin 或真实配置；未记录任何真实值。
- 回滚候选是撤销本批 route 的 verifier 注入和对应聚焦测试；不得以回滚恢复或暴露旧 Secret。
- 本地合成测试通过不证明 site key/Secret 匹配、CloudBase 实际变量值、SMTP、数据库 collection/权限、中国大陆网络、生产可用或业务接受。

## 7. 当前门禁与唯一下一步

- 状态：`LOCAL_IMPLEMENTATION_AND_TESTS_COMPLETE`
- 当前门禁：`INDEPENDENT_TECH_REVIEW_PENDING`
- 未通过：provider/platform 配置、部署、provider-specific 生产验证、观察方案 A、产品/业务验收、ISSUE-0032 关单及项目 workflow 完成。
- 唯一下一步：返回项目总负责人，由其路由现有独立复核线程；本线程不得提交、推送、部署或改平台/Issue。

## 8. 最终回读

- `Code文档/app/api/auth/email/send-code/route.ts`：SHA-256=`FD34CA51035DB31FEACFB152177A5AE74E499A46FC092BF144EBC00866F20326`，`1925 bytes / 46 lines`；写前→写后为 `864443...C9831` → `FD34CA...20326`。
- `Code文档/tests/issue-0032-provider-specific-wiring.test.ts`：SHA-256=`E82F0882908F289D62C71BD0D5A70033F2DE9538E9E3F5B28E69B04135650759`，`5382 bytes / 157 lines`；写前不存在。
- `Code文档/开发员工作记录.md`：SHA-256=`1D74F910069D9B5500B5E310881798206217A97BB26C3E2A7A3704EEAFD1485C`，`297407 bytes / 4480 lines`；写前→写后为 `80FE12...6868E` → `1D74F9...1485C`。
- 工作记录前 `295569` bytes 的 SHA-256 复算仍为 `80FE1207AC32B1750819EB74DE6E3D9B38BD5F41335A90B3A0FA697DF856868E`，证明旧前缀逐字节不变、仅末尾追加。
- 本回执为本批新增产物；其最终 SHA-256、bytes、lines 在完成回报中登记，以避免自引用 hash。
