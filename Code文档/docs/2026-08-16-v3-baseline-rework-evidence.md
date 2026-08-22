# V3 baseline-only RED-first 返工 Phase B 证据

## 结论

- 任务：`V3-BASELINE-REWORK-IMPLEMENT-20260816-B`
- 执行角色：`019fefa7-a3c3-7333-94d7-d61961c5ea99 / 代码开发员v2.3.2 / gpt-5.6-sol / high`
- 状态：`BASELINE_REWORK_IMPLEMENTED`
- 原因：Phase B 的功能与安全候选全部保留；Phase C 仅在 `vitest.config.ts` 增加 `fileParallelism: false`，默认 `npm test` 已新鲜通过 80/80 files、574 passed / 1 skipped，并且 typecheck、lint、无环境注入标准 build 全部 exit 0。Phase B 的默认 full-suite 红灯及其串行隔离证据继续保留为诊断历史。
- 本轮仍只是 baseline-only 返工候选，不是 ISSUE-0034 正式实现、提交、部署、生产通过、Issue 关闭或业务验收。

## 冻结输入与保护边界

- V3 worktree：`D:\codex_project\家教对接website-v3-issue-0034-security-baseline-closure`
- branch：`V3-issue-0034-security-baseline-closure`
- HEAD：`33314857da0f2d72066443965454d23fc70a16d3`
- tree：`4ee5996aa9308aa4486f0453c5c397ebdd09a949`
- parent：`3896a1fa9ac15da23f9ba6d3ff2cb124357a05ab`
- `Code文档/package.json` SHA-256：`36CF12650567FB6B736653995072C431592F8C1F7559260F6D3E44047A2FAFFF`
- `Code文档/package-lock.json` SHA-256：`257A945825407CCDDFCAFA18F1E2C7FAD7FB8D53F39AB99DD5E191F5DD6651BF`
- 主工作树写入前：23 staged、Code staged=2、cached patch OID=`d00aa22eb314e5c82710388d656a2250ff482ee8`；客服/Dify、其他 Issue 与全部既有 dirty/staged/untracked 均为受保护状态。

## 实际修改与根因对应

1. `Code文档/tests/home-approved-visual-contract.test.ts`
   - 根因：测试把已接受的原生 `img` 实现错误耦合为 `next/image`。
   - 修复：只把断言对齐现有原生 `img`、本地品牌资产和无内联 style 的既有可见/CSP 契约；未改 UI、CSS、资产或生产组件。
2. `Code文档/scripts/issue-0033-d2-cleanup.mjs`
   - 根因：受限 synthetic domain loader 漏掉 `@/server/security/access-policy`。
   - 修复：只补一条本地映射；未访问真实 D2/CloudBase。
3. `Code文档/tests/production-ops-baseline-script.test.ts`
   - 根因：测试隐式依赖主工作树中未跟踪的五份 S2 文档。
   - 修复：在系统 TEMP 创建完全合成 fixture，并以显式 cwd 直接调用同一生产检查脚本；默认检查未删除、未跳过、未弱化；测试结束只递归删除自身 `ungradu-production-ops-*` 临时目录。
4. `Code文档/app/api/auth/session/route.ts`
   - 根因：本地 test-login 浏览器模式没有 CloudBase revocation store 时，session route 在测试态也返回 503。
   - 修复：仅当 `APP_ENV=test`、`NODE_ENV!=production`、`NEXT_PUBLIC_ALLOW_TEST_LOGIN=true` 且 `AUTH_SESSION_REVOCATION_REQUIRED!=true` 时允许本地测试 fallback；production、`NODE_ENV=production` 或显式要求 revocation 时继续 fail-closed 503。
5. 以下 8 个 route：
   - `Code文档/app/api/contact-exchange/route.ts`
   - `Code文档/app/api/conversations/route.ts`
   - `Code文档/app/api/conversations/[id]/route.ts`
   - `Code文档/app/api/conversations/[id]/messages/route.ts`
   - `Code文档/app/api/parent-needs/route.ts`
   - `Code文档/app/api/parent-needs/[id]/route.ts`
   - `Code文档/app/api/tutor-profiles/route.ts`
   - `Code文档/app/api/tutor-profiles/[id]/route.ts`
   - 根因：模块导入时立即初始化 CloudBase adapter，使标准 build 在无真实 Secret 时失败。
   - 修复：改为模块内 memoized lazy handler factory，CloudBase 仅在真实请求首次进入时创建；HTTP 导出、URL、method、参数、body、鉴权、事务和错误语义不变，严格配置 parser 未改。

## RED → GREEN

Phase A 的新鲜 RED 已由总负责人验收，本轮未人为制造重复 RED；每个切片在最小改动后立即执行对应 GREEN。

| Seam | Phase A RED | Phase B GREEN |
| --- | --- | --- |
| Homepage | 1/3 failed，过时 `next/image` 实现断言 | `npm test -- tests/home-approved-visual-contract.test.ts --maxWorkers=1 --maxConcurrency=1 --reporter=verbose`：exit 0，1 file，3/3，Vitest 313 ms |
| D2 cleanup | 104/105，`access-policy` domain unavailable | `npm test -- tests/issue-0033-d2-cleanup.test.ts --maxWorkers=1 --maxConcurrency=1 --reporter=verbose`：exit 0，1 file，105/105，Vitest 3.87 s |
| Navigation | 2/2 failed，session 503 后回 `/login` | `npm test -- tests/navigation-trail-browser.test.ts --maxWorkers=1 --maxConcurrency=1 --reporter=verbose`：exit 0，1 file，2/2，Vitest 35.39 s |
| Production ops | 静态分析确认依赖主工作树五份 untracked 文档，按授权未运行真实默认依赖链 | `npm test -- tests/production-ops-baseline-script.test.ts --maxWorkers=1 --maxConcurrency=1 --reporter=verbose`：exit 0，1 file，7/7，Vitest 699 ms；TEMP fixture 零残留 |
| Standard build | 无环境注入时 import-time CloudBase parser 失败 | `npm run build`：确认重跑 exit 0，compiled 11.8 s，static pages 17/17；命令未注入环境变量 |

## 回归与质量门禁

- 受影响回归：`npm test -- tests/cloudbase-server.test.ts tests/auth-session-api.test.ts tests/issue-0034-security-rework.test.ts tests/issue-0034-route-exports.test.ts --maxWorkers=1 --maxConcurrency=1 --reporter=verbose`，exit 0，4 files，63/63，Vitest 5.00 s。`tests/issue-0034-route-exports.test.ts` 未修改。
- `npm run typecheck`：exit 0，约 9.46 s。
- `npm run lint`：exit 0，约 9.35 s。
- 默认 `npm test`：exit 1，80 files 中 75 passed / 5 failed；575 tests 中 555 passed / 1 failed / 19 skipped；Vitest 121.30 s。
  - `issue-0034-security-rework`：调用计数 1 次而非 2 次；同文件已在受影响串行回归通过 35/35。
  - `navigation-trail-browser`、`issue-0033-submit-hydration-browser`、`login-approved-visual-contract`、`ui-preview-confirmed-actual-browser`：并发启动本地 Next/浏览器时服务未就绪或 hook timeout。
- 失败集只读串行隔离：上述 5 个文件以 `--maxWorkers=1 --maxConcurrency=1 --reporter=verbose` 运行，exit 0，5 files，61/61，Vitest 153.01 s。此结果支持“默认全量并发资源竞争/测试隔离”归因，但不改写默认全量 exit 1。
- 最终 `npm run build`（再次无环境变量注入）：exit 0，compiled 16.9 s，static pages 17/17。
- `git diff --check`：exit 0。

## 安全与 fail-closed 证明

- 未修改 CloudBase 严格环境 parser；`cloudbase-server.test.ts` 仍证明缺失/占位凭据被拒绝。
- 未修改 `tests/issue-0034-route-exports.test.ts`；回归仍证明 production revocation adapter 缺失、route setup/handler 故障和外部告警 sink 缺失均 fail-closed。
- session fallback 是四条件交集，仅限本地 test-login；production 与显式 revocation 要求均不进入 fallback。
- 8 个业务 route 只延迟 adapter 创建，真实请求进入时仍使用原 CloudBase collection、runtime env、事务与 handler。
- production ops 使用同一脚本及完整检查，只替换 test-owned 输入根目录；没有复制主工作树 S2 文档，没有真实数据库 checklist 动作。
- 未写入、读取、输出真实 Secret；未硬编码假 Secret；未访问生产、Cloudflare、CloudBase、数据库或付费能力。

## Diff 与工作树状态

- V3 HEAD/tree/parent 均未改变。
- V3 tracked diff 精确 12 个授权文件；无新增 untracked；`package.json` / `package-lock.json` 哈希未变。
- production-ops TEMP fixture 已清除，未发现 `ungradu-production-ops-*` 残留。
- 本轮未执行任何 Git mutation；未 add/commit/push/fetch/pull/merge/rebase/cherry-pick/reset/clean/stash/branch/worktree mutation。
- 主工作树仅允许新增本证据并追加开发员工作记录；原 staged 23 / Code staged 2 / cached patch OID 与其余保护区必须在写后复核保持。

## Phase B 当时未通过门禁

- 未通过：默认 `npm test` exit 0 硬门禁；因此不得提交、不得进入 ISSUE-0034 正式实现、不得宣称 baseline ready。
- Workflow：`WORKFLOW_ACTIVE`。
- ISSUE-0034：`open / TECH_REVIEW_PASS`，本轮没有改 Issue 状态。
- Phase B 当时的唯一下一步：返回项目总负责人裁决默认 full-suite 并发/隔离门禁；该裁决已形成 Phase C 单变量授权。

## Phase C：默认 full-suite 调度稳定化

- 任务：`V3-BASELINE-FULL-SUITE-STABILIZE-20260816-C`。
- RED：沿用 Phase B 默认 `npm test` exit 1；75/80 files 通过、555/575 tests 通过、1 failed、19 skipped。同一 5 个失败文件单 worker 为 61/61，独立验收确认根因为跨文件并发启动多个 Next/browser 与共享调用计数资源竞争。
- 唯一配置改动：在 `Code文档/vitest.config.ts` 的既有 `test` 配置中加入 `fileParallelism: false`。未修改 package/lock、测试文件、业务代码、timeout、hook timeout、skip、retry、bail、worker pool 或 `maxConcurrency`。
- GREEN：默认 `npm test`（无附加参数）exit 0；80/80 files，574 passed / 1 skipped，共 575 tests；Vitest duration 243.61 s。
- `npm run typecheck`：exit 0，约 4.29 s。
- `npm run lint`：exit 0，约 8.97 s。
- `npm run build`：无环境变量注入，exit 0，compiled 12.5 s，static pages 17/17。
- `git diff --check`：exit 0。
- V3 HEAD/tree/parent 保持冻结值；diff 精确为 Phase B 原 12 文件 + `Code文档/vitest.config.ts`，共 13 tracked modified、0 untracked；package/lock SHA-256 仍为 `36CF12650567FB6B736653995072C431592F8C1F7559260F6D3E44047A2FAFFF` / `257A945825407CCDDFCAFA18F1E2C7FAD7FB8D53F39AB99DD5E191F5DD6651BF`；TEMP fixture 零残留。
- 主工作树写证据前仍为 23 staged、Code staged=2、cached patch OID=`d00aa22eb314e5c82710388d656a2250ff482ee8`，其余受保护 dirty/untracked 未漂移。
- Workflow：`WORKFLOW_ACTIVE`。ISSUE-0034：`open / TECH_REVIEW_PASS`；本地 baseline 返工候选通过不等于独立复核、提交、V3 正式实现、部署、生产通过或 Issue 关闭。
- 唯一下一步：返回项目总负责人做独立验收与代码复核；本线程不得自行提交或进入 ISSUE-0034 实现。
