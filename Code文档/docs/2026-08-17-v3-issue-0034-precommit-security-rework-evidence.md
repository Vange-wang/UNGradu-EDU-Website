# V3 ISSUE-0034 提交前安全返工证据

## 1. 状态与冻结输入

- 任务：`V3-ISSUE-0034-PRECOMMIT-SECURITY-REWORK-20260817`
- 执行角色：`019fefa7-a3c3-7333-94d7-d61961c5ea99 / 代码开发员v2.3.2`
- V3 worktree：`D:\codex_project\家教对接website-v3-issue-0034-security-baseline-closure`
- branch：`V3-issue-0034-security-baseline-closure`
- HEAD：`9988a46a03dabe5bf8e5a2331fc951ecd16d788e`
- tree：`cb6ba9a4af645002ac7005f564049532a009152c`
- 当前结论：`FORMAL_REWORK_READY`。该结论仅表示本地返工候选与本地门禁完成，不表示独立复核、提交、推送、部署、生产、业务验收或 Issue 关闭。

## 2. 根因与五文件返工

### 2.1 联系方式对象的时钟与副作用

1. `Code文档/server/contact-exchange.ts`
   - 将对象读取与过期刷新/持久化分离。
   - `approve/reject/withdraw` 先核对 receiver/requester，再允许合法 actor 触发过期刷新；stranger 对过期对象得到统一 404 且零 `set`。
   - 领域层显式 `now` 测试 seam 保留，生产默认仍使用服务端时钟。
2. `Code文档/server/contact-exchange-api.ts`
   - 为兼容既有 payload，仍可解析客户端 `now` 字段，但公开 API 不再把它传入领域函数；过去/未来伪造值均不能控制创建、过期或审批时钟。
3. `Code文档/tests/issue-0034-route-matrix.test.ts`
   - 增加过期对象 stranger approve/reject/withdraw 的统一 404、零写入负例；保留合法 receiver/requester 过期 403。
   - 增加客户端伪造过去/未来 `now` 无效的 API 契约，并固定生命周期测试时钟。
4. `Code文档/tests/issue-0034-route-exports.test.ts`
   - 固定 legacy 零写入场景的测试时钟，消除固定 2026-08-10 夹具随日历漂移触发过期写入。

### 2.2 密码挑战测试毫秒竞态

5. `Code文档/tests/issue-0034-security-rework.test.ts`
   - 仅在 `checks the limiter after a successful password challenge` 内建立固定 `challengeNow`。
   - handler 的 `now` 与 verifier 的 `issuedAt` 使用同一时间源；replay/limiter 次数、失效窗口、安全断言及全部生产实现不变。
   - 写前四文件安全组合曾连续两次稳定出现 59/60：第二次 challenge 在 replay consume 前因 `issuedAt` 比 handler 已捕获的 `now` 晚 1 ms 而被拒，`replayConsume` 期望 2、实际 1。该用例筛选与单文件均可通过，证明为跨测试组合中的毫秒级竞态。第五文件写入前的新鲜组合恰好 60/60，进一步符合非确定性竞态特征，不替代既有 RED。

未修改任何生产密码登录实现，没有 retry、skip、timeout、放宽断言或第六个返工文件。

## 3. RED→GREEN

### 3.1 四文件安全返工

- RED：`npm test -- tests/issue-0034-route-matrix.test.ts tests/issue-0034-route-exports.test.ts --maxWorkers=1 --maxConcurrency=1 --reporter=verbose`
  - exit 1；1 failed / 1 passed files，3 failed / 20 passed tests。
  - 症状：invisible action 零写入期望 0/实际 1；新增 expired stranger 三动作零写入期望 0/实际 3；客户端伪造 `now` 使创建时间落到 1900 年。
- GREEN：同命令 exit 0；2/2 files、23/23 tests。
- 原提交门 7 文件：exit 0；7/7 files、48/48 tests。
- 联系方式生命周期：exit 0；2/2 files、11/11 tests。

### 3.2 第五文件确定性修正

- 既有 RED：安全负例组合连续两次 exit 1；3/4 files、59/60 tests；唯一失败为 limiter/replay 调用计数竞态。
- 修正后筛选：1/1 passed，34 skipped，exit 0。
- 修正后单文件：35/35 passed，exit 0。
- 修正后安全负例组合：4/4 files、60/60 tests，exit 0。

## 4. 最终工程门禁

| 门禁 | 新鲜结果 |
| --- | --- |
| 默认 `npm test` | exit 0；80/80 files；579 passed / 1 skipped，共 580；277.58 s |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0，0 warnings |
| 无环境注入 `npm run build` | exit 0；Next.js 15.5.19；17/17 static pages |
| `git diff --check` | exit 0；仅有 Git 的 LF→CRLF 提示，无 whitespace error |

## 5. 最终候选固定包

- 最终 patch Git OID：`769b6a40f192ab06ecccb71b3dbb3caba80fb080`
- shortstat：`14 files changed, 495 insertions(+), 120 deletions(-)`
- V3：14 tracked modified / 0 staged / 0 untracked。
- 原候选为 13 文件；本轮第五文件授权新增 `tests/issue-0034-security-rework.test.ts`，故最终 manifest 客观为 14 文件。授权文字称“原候选其余 8 文件”，按冻结 13 文件减本轮原四文件实际为 9 文件；以下 9 文件均核对为冻结 SHA 不变：
  - `server/api-utils.ts`：`951CB0FC1B7134FDD5E3C8E2ED6FB04B587623551954DFD1D7FE840B917AA9F2`
  - `server/conversation-api.ts`：`E33A6DADAEE1950024E80A24527B1AECE8460F30BD7C0CE523819746AB32BF79`
  - `server/conversations.ts`：`DFF721FD2E1838698F68F76336E5D11357098679C9F3BF4A7144BD91101B5004`
  - `server/security/access-policy.ts`：`90FB78BECA3628A5B5E56E66ED2B69A36EE84082DBCA33BBAE8066BA19D65617`
  - `tests/contact-exchange-api.test.ts`：`DE17D85015732162ACEEB28F1B270A7D06543BB35C40D19F3B2096EE98653F8B`
  - `tests/contact-exchange-server.test.ts`：`156ED5F497F5C17F00F47BA356B2DD5C6A716B69E4FDB23C4C0956C3F9455CD6`
  - `tests/conversation-api.test.ts`：`C49051E9E92259FE459832D1DE9B975925A43CEB1B7E9D96100B61C455BDF952`
  - `tests/conversation-server.test.ts`：`EEE9D3212B9E050FB8D87259D16CA23C4434BCEE67DF035CCFCB58A07CA13783`
  - `tests/m5-server-flow-and-load.test.ts`：`133D76639D26D7754AA092E65CC5A5F99F3688E40F3632EA3AC69DDB7E9E6FDD`
- package SHA-256：`36CF12650567FB6B736653995072C431592F8C1F7559260F6D3E44047A2FAFFF`
- package-lock SHA-256：`257A945825407CCDDFCAFA18F1E2C7FAD7FB8D53F39AB99DD5E191F5DD6651BF`
- 系统 TEMP 的 `ungradu-production-ops-*` fixture 残留为 0；真实 Secret、隐私数据、生产 URL/账号访问与平台写入均为 0。

## 6. 完整 manifest

1. `Code文档/server/api-utils.ts`
2. `Code文档/server/contact-exchange-api.ts`
3. `Code文档/server/contact-exchange.ts`
4. `Code文档/server/conversation-api.ts`
5. `Code文档/server/conversations.ts`
6. `Code文档/server/security/access-policy.ts`
7. `Code文档/tests/contact-exchange-api.test.ts`
8. `Code文档/tests/contact-exchange-server.test.ts`
9. `Code文档/tests/conversation-api.test.ts`
10. `Code文档/tests/conversation-server.test.ts`
11. `Code文档/tests/issue-0034-route-exports.test.ts`
12. `Code文档/tests/issue-0034-route-matrix.test.ts`
13. `Code文档/tests/issue-0034-security-rework.test.ts`
14. `Code文档/tests/m5-server-flow-and-load.test.ts`

## 7. 边界与下一步

- 主工作树原 staged 23 / Code staged 2 / cached patch OID=`d00aa22eb314e5c82710388d656a2250ff482ee8` 保持。
- 未执行 Git mutation、commit、push、branch/worktree mutation、部署、Cloudflare/CloudBase、生产、Secret、数据库、付费、Issue/Spec/UI 修改或任务/subagent。
- Workflow 保持 `WORKFLOW_ACTIVE`；`ISSUE-0034` 保持 `open / TECH_REVIEW_PASS`。本次修正改变了已复核候选，必须重新交原独立 reviewer 复核。
- 唯一下一步：项目总负责人冻结上述 14 文件候选、OID 与验证证据，并路由原独立代码复核线程；本线程不得自行提交或代替 reviewer 下结论。
