# V3 ISSUE-0034 提交前安全返工独立复核

- 任务：`V3-ISSUE-0034-PRECOMMIT-SECURITY-REWORK-INDEPENDENT-REVIEW-20260817`
- 日期：`2026-08-17`
- 执行角色：`019fefa7-d1d3-7ac3-a5ba-8b8abe299958 / 独立代码复核v2.3.2 / gpt-5.6-sol / high`
- V3 worktree：`D:\codex_project\家教对接website-v3-issue-0034-security-baseline-closure`
- 独立结论：`TECH_REVIEW_PASS`

## 1. 结论与边界

本次按 Standards、Spec/安全契约两个独立轴顺序复核；两轴 P0/P1/P2 均为 `0/0/0`。前一候选 `ca614fd09179692a6372dd3d5511a94571abfcf2` 的旧 PASS 已被 2026-08-17 新鲜提交前失败推翻，本结论只适用于当前 patch OID `769b6a40f192ab06ecccb71b3dbb3caba80fb080`。

本 PASS 仅表示当前未提交 working-tree 安全返工候选通过本地独立技术门，可返回项目总负责人收口。它不等于 commit、push、部署、Cloudflare/CloudBase 或生产操作、产品/业务验收、Issue 关闭或 workflow 完成，也不授权数据库、ISSUE-0031 或付费动作。

## 2. 固定点、候选与输入身份

- branch：`V3-issue-0034-security-baseline-closure`
- fixed HEAD：`9988a46a03dabe5bf8e5a2331fc951ecd16d788e`
- fixed tree：`cb6ba9a4af645002ac7005f564049532a009152c`
- candidate：相对 fixed HEAD 的当前未提交 working-tree diff
- candidate patch Git OID：`769b6a40f192ab06ecccb71b3dbb3caba80fb080`
- manifest：精确 `14 tracked modified / 0 staged / 0 untracked`
- shortstat：`495 insertions / 120 deletions`
- 返工 evidence：SHA-256 `B8A617733B615F973A1483522ED6D8B542CA233B12C561081DB68819F15089F6`，7273 bytes / 107 lines
- COMMIT_BLOCKED 凭据：旧候选定向门 `43 passed / 3 failed`，因此旧 PASS 不可沿用
- 当前 Spec：SHA-256 `86B457B178B8BFB897DA42189C310C0CD1497D8D7886E7B5278B4905BD57ACF6`，16590 bytes / 181 lines
- 当前 ISSUE-0034 canonical：SHA-256 `CB2C870D7BE05E3169F6750AE26FFDFB94D3D32F7F5A4526D457B8D4C7780E07`，66433 bytes / 495 lines
- `package.json`：SHA-256 `36CF12650567FB6B736653995072C431592F8C1F7559260F6D3E44047A2FAFFF`
- `package-lock.json`：SHA-256 `257A945825407CCDDFCAFA18F1E2C7FAD7FB8D53F39AB99DD5E191F5DD6651BF`

候选 manifest：

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

## 3. Standards pass（先冻结）

- P0：none
- P1：none
- P2：none
- finding 计数：`0/0/0`

冻结依据：

1. `server/contact-exchange.ts:288-319,454-675` 将 raw read 与过期刷新/持久化分离；approve/reject 在 `receiverUserId`、withdraw 在 `requesterUserId` 验证后才进入刷新写入。missing、malformed、stranger 在写入前统一返回，不存在陌生主体触发过期状态持久化的旁路。
2. `server/contact-exchange-api.ts:112-165` 为 payload 兼容仍白名单解析 `now`，但 create/approve/reject/withdraw 四个公开出口均未把 `body.value.now` 传入领域层。生产 route factory 也不注入时钟，领域默认只取服务端 `new Date().toISOString()`。
3. `server/api-utils.ts:423-433` 的 `jsonResultResponse` 在序列化前剥离内部 `status`；会话/联系方式 API 的相关出口均使用该 helper，未发现把内部状态直接写入 HTTP JSON 的旁路。
4. `server/security/access-policy.ts:13-22` 集中定义规范化 404；同类 missing/non-participant 分支使用相同正文和响应 helper。401、400、403、404、409 的职责没有混用。
5. 第五个返工文件 `tests/issue-0034-security-rework.test.ts:776-826` 只把 challenge verifier 与 handler 的测试时钟固定到同一值；未改生产密码登录、调用次数、重放窗口、限流顺序、skip/retry/timeout 或断言。
6. 九个声明冻结文件的 SHA-256 逐一与 evidence 一致；生产改动相对上一候选仅位于 `contact-exchange.ts` 与 `contact-exchange-api.ts`。14 文件仍围绕同一安全错误映射和回归矩阵，未发现可执行的 duplication、shotgun surgery、middle man、兼容性或测试伪通过 finding。
7. 候选生产 diff 无新增邮箱、手机号或 Secret 字面量，无 debug/console、宽泛 CSP、数据库迁移或付费代码；客户端静态 bundle 对六类服务端 Secret 名称扫描均为 0。

## 4. Spec / 安全契约 pass

- P0：none
- P1：none
- P2：none
- finding 计数：`0/0/0`

核对结论：

1. `tests/issue-0034-route-matrix.test.ts:354-426` 真实导入 Next route，覆盖 expired stranger 的 approve/reject/withdraw：全部 404、统一正文、零持久化写；合法 receiver/requester 对同类 expired 对象仍为 403，并只持久化自身可见对象的过期状态。
2. `tests/issue-0034-route-matrix.test.ts:429-495` 用过去/未来伪造 `now` 驱动真实 route；创建时间、审批时间和过期判断均由服务端时钟决定。所有 contact API action 出口均已静态回读，无客户端时钟旁路。
3. missing、非参与者与不可见的会话详情、消息读写、联系方式读/create/action 均为相同 404 body/header 出口；每一对路径都落在一次对象读取后判断的同一时延类别。新增拒绝路径在业务写之前结束。
4. 未认证与撤销会话仍在领域调用前返回 401；参与者成功仍为 200；对象已对 actor 可见后的 expired、删除/legacy/version mismatch、二次确认等冻结非对象动作仍为 403。
5. Origin/CSRF、CSP/安全头、会话撤销、限流、审计/告警与 production fail-closed 生产实现未改，安全负例组合新鲜 60/60 通过。
6. URL、method、payload、credentials、成功 DTO、客户端/UI 未改；没有扩大公开联系方式、未成年人字段、日志、错误或 Secret 泄露面。
7. 未进入数据库、ISSUE-0031、付费、生产、平台、UI 或其他 Issue。真实 CloudBase 集成用例继续由显式环境门控制，未将其 skipped 冒充本地通过或生产通过。

## 5. 新鲜独立验证

1. 两个返工 route 测试：`2/2 files，23/23 tests`，exit 0。
2. 原七文件提交门：`7/7 files，48/48 tests`，exit 0。
3. 联系方式生命周期：`2/2 files，11/11 tests`，exit 0。
4. 安全负例：`4/4 files，60/60 tests`，exit 0；固定时钟后的 limiter/replay 用例在组合运行中通过。
5. 默认 `npm test`：`80/80 files，579 passed / 1 skipped，共 580`，exit 0，165.76 s。唯一 skipped 为需要 `RUN_ISSUE0033_CLOUDBASE_INTEGRATION=1` 的真实 CloudBase transaction integration；本任务未授权真实数据库/平台环境，因此不阻塞本地候选，也不写成 passed。
6. `npm run typecheck`：exit 0。
7. `npm run lint`：exit 0，`--max-warnings=0`。
8. 无环境注入 `npm run build`：清除 `.env.example` 所列应用变量及 `APP_ENV/NODE_ENV` 后运行；Next.js 15.5.19，compiled successfully，页面生成 `17/17`，exit 0。
9. `git diff --check HEAD`：exit 0；只有既有 LF→CRLF 提示，无 whitespace error。
10. 系统 TEMP `ungradu-production-ops-*` 残留 0；生产 diff 隐私字面量扫描 0；客户端 bundle 服务端 Secret 名称扫描 0。

全部验证后 HEAD/tree、candidate OID、14/0/0 manifest、shortstat、package/lock 及九个冻结文件哈希均未漂移。

## 6. 主工作树保护与未执行项

- 写前主工作树：HEAD=`33314857da0f2d72066443965454d23fc70a16d3`；staged `23`、Code staged `2`、cached patch OID `d00aa22eb314e5c82710388d656a2250ff482ee8`。
- 排除本报告与独立复核工作记录后，受保护 tracked patch OID 写前/写后均为 `f9fa4a8dd5b37770a99b2ce50592ce6d18f7f582`，受保护 untracked 计数写前/写后均为 `261`；工作记录原 11688 bytes 前缀 SHA-256 仍为写前整文件 SHA-256 `DAFE525A7C5FAD7F54EE443FEA143413680FF1888A46277F6AA27C64644C1F16`，确认只追加。
- 本轮唯一写入为本报告和 `Code文档/独立代码复核工作记录.md` 的追加段；其余 staged/dirty/untracked 不清理、不暂存、不修改。
- 未执行：Git mutation、commit、push、branch/ref/index 操作、deploy、Cloudflare/CloudBase/生产操作、真实 Secret 读取、数据库、付费、Issue/Spec/UI/其他角色文件修改、任务或 subagent 创建。

## 7. Workflow、Issue 与唯一下一步

- 项目 workflow 仍为 `WORKFLOW_ACTIVE`，不是 `WORKFLOW_COMPLETE`。
- `ISSUE-0034` 仍为 `open / TECH_REVIEW_PASS`；本次只恢复当前精确候选的本地独立技术门。
- 数据库、ISSUE-0031 与全部付费动作继续延期。
- 唯一下一步：项目总负责人核对本报告、候选 OID、全部新鲜门禁与保护证据后，收口本次提交前安全返工独立复核，并决定是否向原代码 owner 另行授权精确 commit；本角色不自行提交、推送、部署、进入生产或关单。
