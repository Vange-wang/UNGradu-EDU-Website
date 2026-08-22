# V3 实现准备与运行基线凭据（2026-08-16）

## 1. 结论与边界

- 任务：`V3-IMPLEMENTATION-READINESS-BASELINE-20260816`
- 执行角色：`019fefa7-a3c3-7333-94d7-d61961c5ea99 / 代码开发员v2.3.2 / gpt-5.6-sol / high`
- 最终状态：`BASELINE_REWORK_REQUIRED`
- 直接原因：本轮新鲜 `npm test` 为 exit `1`，标准无环境输入的 `npm run build` 为 exit `1`；即使部分隔离重跑和合成构建通过，也不能改写 full suite/build 的实际结果。
- 适用范围：仅证明冻结 V3 worktree 的依赖安装、运行基线和 ISSUE-0034 只读 readiness mapping；不修改 V3 代码、测试、配置、Spec、Issue、UI、角色或平台文件。
- 明确非结论：本凭据不授权实现、提交、推送、部署、平台操作或生产验证，不表示 `ISSUE-0034` 或项目 workflow 完成。

## 2. 冻结输入

| 字段 | 本轮只读核对值 |
| --- | --- |
| V3 worktree | `D:\codex_project\家教对接website-v3-issue-0034-security-baseline-closure` |
| branch | `V3-issue-0034-security-baseline-closure` |
| HEAD | `33314857da0f2d72066443965454d23fc70a16d3` |
| tree | `4ee5996aa9308aa4486f0453c5c397ebdd09a949` |
| parent | `3896a1fa9ac15da23f9ba6d3ff2cb124357a05ab` |
| 初始 Git status | clean；records=`0` |
| 初始 `node_modules` / `.next` | 均不存在 |
| ISSUE-0034 关闭 Spec SHA-256 | `86B457B178B8BFB897DA42189C310C0CD1497D8D7886E7B5278B4905BD57ACF6` |
| V3-V7 索引/分支契约 SHA-256 | `516A4D05DFF64BF5B7271783138FCC6E608B9450949456177E4F383EC96EDF77` |
| ISSUE-0034 canonical SHA-256 | `CB2C870D7BE05E3169F6750AE26FFDFB94D3D32F7F5A4526D457B8D4C7780E07` |
| Issue 总表 SHA-256 | `447968152364B31F6597176A2B98AB516D4B10E40D75B56262D55F1E641E92E5` |

固定 Spec 与索引正文仍保留作者草案/待确认表头；`总负责人文档/2026-08-15-v3-branch-base-receipt.md` 和产品范围声明已明确：用户确认绑定的是上述精确字节版本，不静默改写表头。该证据关系足以作为本次只读 mapping 输入，但不等于 Spec canonical 状态或 Issue 状态已经改变。

`ISSUE-0034` 当前仍为 `open / TECH_REVIEW_PASS`；项目 workflow=`WORKFLOW_ACTIVE`。`ISSUE-0031`、数据库及全部付费动作继续延期。

## 3. 包与运行环境

| 项 | 值 |
| --- | --- |
| Node | `v20.18.0` |
| npm | `10.8.2` |
| `package.json` | SHA-256=`36CF12650567FB6B736653995072C431592F8C1F7559260F6D3E44047A2FAFFF`；1527 bytes / 42 lines |
| `package-lock.json` | SHA-256=`257A945825407CCDDFCAFA18F1E2C7FAD7FB8D53F39AB99DD5E191F5DD6651BF`；280293 bytes / 7844 lines |
| package engines | 未声明 |
| 核心版本 | Next `^15.5.19`、React `^19.2.7`、TypeScript `^6.0.3`、Vitest `^4.1.9`、ESLint `^8.57.1` |

本轮识别并遵守的脚本：`typecheck=tsc --noEmit`、`lint=eslint . --max-warnings=0`、`test=vitest run`、`build=node scripts/clean-next-build.mjs && next build`。明令禁止的 `cloudbase:check`、`m5:*`、`production:ops:baseline`、`release:production:preflight` 均未作为独立命令执行。

## 4. `npm ci`

- 工作目录：V3 worktree 的 `Code文档`。
- 命令：`npm ci`，严格使用现有 lockfile。
- 结果：exit `0`；49,819 ms；added `420` packages；`157` packages looking for funding。
- engine warning：`eslint-visitor-keys@5.0.1` 要求 Node `^20.19.0 || ^22.13.0 || >=24`，当前为 Node `20.18.0`。未升级系统 Node。
- deprecated warning 共 6 条：`inflight@1.0.6`、`@humanwhocodes/config-array@0.13.0`、`rimraf@3.0.2`、`glob@7.2.3`、`@humanwhocodes/object-schema@2.0.3`、`eslint@8.57.1`。
- npm 配置 `audit=true`，但本次 `npm ci` 输出没有 vulnerability/audit 数量摘要；未额外运行 `npm audit`，也未运行 `npm audit fix`、`npm update` 或安装新依赖。
- 安装后 `package.json` 与 `package-lock.json` 哈希均未改变；V3 Git status 仍 clean。

## 5. 新鲜运行基线

| 门禁 | 命令 | 结果 | 时长 |
| --- | --- | --- | ---: |
| typecheck | `npm run typecheck` | exit `0` | 34,571 ms |
| lint | `npm run lint` | exit `0`，warnings=`0` | 91,257 ms |
| full test | `npm test` | exit `1`；80 files 中 73 passed / 7 failed；575 tests 中 553 passed / 3 failed / 19 skipped | 124,715 ms |
| 标准 build | `npm run build` | exit `1`；Collecting page data 阶段因 `CLOUDBASE_ENV_ID 必须配置` 失败 | 119,968 ms |

任何单项或隔离重跑通过均未被写成 full baseline 通过。

## 6. Full test 失败与只读隔离

### 6.1 Full suite 原始失败

| 失败项 | 原始结果 | 当前分类 |
| --- | --- | --- |
| `tests/home-approved-visual-contract.test.ts` | 1/3 failed；测试要求 `SiteHeader` 导入 `next/image`，base 实现为带 CSP 注释的原生 `<img>` | 可复现基线契约不一致；不在本任务改动授权内 |
| `tests/issue-0033-d2-cleanup.test.ts` | 1/105 failed；子进程抛 `D2C_SYNTHETIC_FIXTURE_DOMAIN_UNAVAILABLE` | 可复现 ISSUE-0033 synthetic domain 基线缺陷；未越权修复 |
| `tests/production-ops-baseline-script.test.ts` | 1/7 failed；缺 5 份 S2 运维文档，并重复报告数据库/回滚 checklist 缺失 | 隔离 worktree 缺少未跟踪 fixture；其中数据库 checklist 又属于明确延期范围 |
| `tests/issue-0033-submit-hydration-browser.test.ts` | beforeAll 120s timeout，8 tests skipped | 串行隔离通过，归因并发/启动竞争 |
| `tests/login-approved-visual-contract.test.ts` | 服务未就绪，1 test skipped | 串行隔离通过，归因并发/启动竞争 |
| `tests/ui-preview-confirmed-actual-browser.test.ts` | Next 服务未就绪，7 tests skipped | 串行隔离通过，归因并发/启动竞争 |
| `tests/navigation-trail-browser.test.ts` | beforeAll 60s timeout，2 tests skipped | 单文件隔离仍稳定失败，不可归为仅并发问题 |

### 6.2 最小隔离证据

1. 静态两文件串行：
   - 命令：`npm test -- tests/home-approved-visual-contract.test.ts tests/issue-0033-d2-cleanup.test.ts --maxWorkers=1 --maxConcurrency=1 --reporter=verbose`
   - 结果：exit `1`；2 files failed；108 tests 中 106 passed / 2 failed；13,195 ms。
   - 两项原失败均稳定复现。
2. 四个浏览器失败文件串行：
   - 命令：对 submit-hydration、login、navigation-trail、ui-preview 四文件使用 `--maxWorkers=1 --maxConcurrency=1 --reporter=verbose`。
   - 结果：exit `1`；3 files passed / 1 failed；26 tests 中 24 passed / 2 failed；293,727 ms。
   - submit-hydration `8/8`、login `9/9`、ui-preview `7/7` 通过；navigation 两项失败。
3. navigation 单文件再跑：
   - 结果：exit `1`；2/2 failed；70,145 ms。
   - 两条路径均在真实等待点回到 `/login`；一条报告“首页发布入口未进入发布需求页”，另一条报告“个人页未渲染我发布的需求入口”；状态均含 `pathname=/login`、trail=`["/","/login"]`。
   - 这是稳定基线红灯；本轮未修改 test-login、session、middleware 或导航代码。
4. `production-ops-baseline-script.test.ts` 未独立重跑：用户明确禁止直接运行 `production:ops:baseline`，而该测试会调用该脚本；保留 full-suite 首次失败作为唯一新鲜证据。

### 6.3 未跟踪 fixture 隔离证明

Full suite 所缺的 5 份 S2 文档在主工作树均存在，但在冻结 base commit 中均未跟踪、在 V3 worktree 均不存在：

- `规划文档/里程碑文档/生产运行观察与运维基线准备/S2生产运行观察与运维基线执行包.md`
- `规划文档/里程碑文档/生产运行观察与运维基线准备/生产运行观察记录模板.md`
- `规划文档/里程碑文档/生产运行观察与运维基线准备/生产问题分级与响应规则.md`
- `规划文档/里程碑文档/生产运行观察与运维基线准备/部署回滚与环境配置核对清单.md`
- `规划文档/里程碑文档/生产运行观察与运维基线准备/数据库集合与权限配置检查表.md`

这些文件属于主工作树受保护 untracked 状态，不能复制或带入 V3。特别是数据库 checklist 与本轮“ISSUE-0031/数据库延期”边界冲突，必须由总负责人/产品与测试契约 owner 决定：是将非数据库基线测试从延期数据库 fixture 解耦，还是在另行授权、审查和追踪后提供适用的权威输入；代码 owner 不自行选择。

## 7. Build 失败隔离

### 7.1 标准命令

无任何环境变量的 `npm run build` 在 `Collecting page data` 阶段失败，四个实际报错入口包括：

- `/api/contact-exchange`
- `/api/conversations`
- `/api/conversations/[id]`
- `/api/parent-needs`

共同根因是构建期加载 CloudBase adapter 时 `CLOUDBASE_ENV_ID 必须配置`。因此标准本地 build 门禁未通过。

### 7.2 合成输入归因重跑

仅使用仓库 `Dockerfile` 已登记的 build-only 合成值设置 `APP_ENV=test`、`CLOUDBASE_ENV_ID`、`TENCENTCLOUD_SECRETID`、`TENCENTCLOUD_SECRETKEY`、`AUTH_SESSION_SECRET` 后，重跑相同 `npm run build`：

- exit `0`；53,167 ms；Next `15.5.19`；compiled successfully；static generation `17/17`；完整 route manifest 生成。
- 所有值均是仓库已公开的测试标识或字面占位符，不是真实 Secret；命令结束后已从当前进程环境移除。
- 该结果只证明原 build 红灯由缺少明确的本地 build 输入触发；不能把合成重跑写成标准 build 已通过，也不能替代未来环境契约修复。

## 8. ISSUE-0034 V3 剩余实现/补证映射（只读）

本表是 readiness mapping，不是实现计划批准。base 已有能力以本轮实际 tree 和新鲜 full test 中未列为失败的相关测试为证；任何源码修改仍必须先取得独立授权并建立精确 RED。

| Spec 阶段 | Base 已有能力/证据 | V3 仍需实现或补证 | 预期代码/测试路径 | 依赖与禁止范围 |
| --- | --- | --- | --- | --- |
| V3-S0 冻结 | base/tree/branch receipt 已冻结；`server/security/inventory.ts` 可生成依赖、SQL/SSRF inventory；固定 Spec/索引哈希已核 | 先修复本凭据列出的运行基线红灯；之后形成只绑定 V3 clean tree 的 threat/control gap 与证据索引 | 证据路径由总负责人另行授权；代码候选仅在 RED 指向时落到 `server/security/inventory.ts`、`tests/issue-0034-security-baseline.test.ts` | 不把主工作树 receipt、Spec、Issue、S2 untracked fixture 或其他 Issue 带入 V3 |
| V3-S1 认证与对象权限 | 已有 `auth-session.ts`、`session-revocation.ts`、`request-guard.ts`、`api-utils.ts`、CSRF route、middleware；0034 baseline/rework/route-export/route-matrix 测试覆盖撤销、Origin/CSRF、404 owner 隔离、participant/stranger/deleted/legacy/version mismatch | 运行基线绿后，逐路由对照固定 AC，补齐任何尚未由真实 route RED 证明的统一 401/404/允许的 403、规范化响应体及同一可接受时延类别；navigation 登录态基线必须先恢复 | `middleware.ts`、`server/auth-session.ts`、`server/security/{session-revocation,request-guard,access-policy}.ts`、`app/api/**`；`tests/{auth-session-api,origin-verification-middleware,issue-0034-route-exports,issue-0034-route-matrix}.test.ts` | 不改变匿名 feedback 策略、不放宽 fail-closed、不把 timing 类别自行量化为业务承诺 |
| V3-S2 输入/输出与边界 | 已有 schema/body limits、CSP nonce、Turnstile 精确 origin、公开 DTO policy、Origin verifier、Worker 源站证明与安全头测试 | 补齐全资产 SQL/SSRF/injection 清单的 current-tree binding；本地仅对可复现代码差距做 RED；未知 Host、直连源站、伪造 Worker/源站头、TLS/redirect/公开域名需后续集成/生产只读证据 | `server/security/{schema-limits,content-security-policy,public-field-policy,inventory}.ts`、`middleware.ts`、`cloudflare/worker.{js,ts}`；`tests/{issue-0034-security-baseline,security-headers,origin-verification-middleware}.test.ts` | 不运行真实域名/生产调用，不操作 Cloudflare/CloudBase；平台证据不能由本地测试替代 |
| V3-S3 运营控制 | 已有 HMAC 持久限流、防重放、结构化脱敏审计/alert sink、生产 ops baseline 脚本与相应测试 | 先解决 S2 运维文档未进入 base 导致的测试失败；明确非数据库运维 receipt 与延期数据库 checklist 的契约边界；随后补依赖治理/SBOM、owner/告警/保留/停止/恢复证据 | `server/security/{rate-limit,email-challenge,security-observability,inventory}.ts`、`scripts/production-ops-baseline-check.mjs`、`tests/{issue-0034-security-baseline,issue-0034-security-rework,production-ops-baseline-script}.test.ts` | 数据库迁移、备份/RPO/RTO/恢复演练、付费、真实 Secret 全部延期/禁止；缺 owner/阈值时不得发明值 |
| V3-S4 生产与产品验收 | base receipt 只承接 ISSUE-0020 已关闭范围；ISSUE-0034 当前仍仅 `open / TECH_REVIEW_PASS` | 未来另行取得部署 manifest、精确输入 provenance、独立最终复核、生产观察/回滚、产品/业务验收和 Issue 管理员关单证据 | 无可在本轮批准的代码路径；由后续 owner 绑定实际 evidence/receipt | 本轮无部署、平台、生产、真实账号、Secret、Issue canonical/state 权限 |

当前没有证据支持“先写一批新安全代码”。base 已包含大部分非数据库安全控制；下一实现批次必须由运行基线修复和固定 AC 的真实 RED 决定，不能按历史差距清单重复实现。

## 9. 基线返工项与最小解除条件

1. 明确并修复/裁决 `SiteHeader next/image` 测试与 CSP 原生 `<img>` 实现的单一权威契约。
2. 修复或提供可复现归因，使 `issue-0033-d2-cleanup` synthetic domain seam 在 clean base 中通过；不得借用主工作树 dirty/untracked。
3. 由上游 owner 处理 production ops 测试对 5 份未跟踪文档的依赖，并显式解决数据库 checklist 与延期范围的冲突。
4. 修复 `navigation-trail-browser` 在独立单文件运行中登录后回到 `/login` 的稳定红灯。
5. 定义不含真实 Secret、可在 clean worktree 直接执行的标准本地 build 输入契约；合成 Docker 重跑不能替代标准命令门禁。
6. 在同一 clean V3 worktree 重新新鲜运行 `npm run typecheck`、`npm run lint`、`npm test`、`npm run build`，四项均 exit `0` 后才可重新判断 `IMPLEMENTATION_READY`。

## 10. 工作树保护与未执行项

- V3 安装/测试/build 只产生被忽略的 `node_modules`、`.next` 等本地产物；未新增或修改 tracked/untracked 业务文件，最终 Git status 必须保持 clean。
- 原主工作树写入前仍为 23 staged、Code staged=2，cached patch Git OID=`d00aa22eb314e5c82710388d656a2250ff482ee8`；本任务只允许新增本凭据并追加开发员工作记录。
- 未执行 Git add/commit/push/fetch/pull/merge/rebase/cherry-pick/reset/clean/stash/branch/worktree mutation。
- 未执行部署、Cloudflare/CloudBase、真实账号、生产请求、Secret 读取/输出/写入、数据库、付费动作、任务或 subagent。

## 11. 当前状态与唯一下一步

- workflow=`WORKFLOW_ACTIVE`。
- `ISSUE-0034=open / TECH_REVIEW_PASS`；本轮 baseline 红灯不直接改 canonical 状态。
- `ISSUE-0031`、数据库和全部付费动作继续延期。
- 唯一下一步：将 `BASELINE_REWORK_REQUIRED` 凭据返回项目总负责人，由总负责人先裁决 S2 fixture/数据库延期与标准 build 输入契约，再向原代码 owner 下发精确、RED-first 的 baseline-only 返工授权；本线程不自行实现。
