# ISSUE-0034 V3 CloudBase Run 部署回执（构建阻塞）

- 日期：2026-08-17（Asia/Shanghai）
- 执行角色：`019fefa7-a3c3-7333-94d7-d61961c5ea99 / 代码开发员v2.3.2`
- 状态：`DEPLOYMENT_BLOCKED`
- Workflow：`WORKFLOW_ACTIVE`
- Issue：`ISSUE-0034 open / TECH_REVIEW_PASS`
- 边界：本回执只覆盖 CloudBase Run 应用部署尝试和部署层基础证据；不等于生产技术验收、产品验收、Issue 关闭或 workflow 完成。

## 1. 上游门与冻结输入

- Post-push 独立复核：`POST_PUSH_TECH_REVIEW_PASS`，Standards/Spec P0/P1/P2 均为 `0/0/0`。
- Post-push report：`Code文档/docs/2026-08-17-v3-issue-0034-post-push-independent-review.md`
  - SHA-256：`266B9997DA74F181D033A65E75E9161A7D2D38D25FB20E5B1AA8FB7126310A73`
- Exact push receipt：`Code文档/docs/2026-08-17-v3-issue-0034-exact-push-receipt.md`
  - SHA-256：`DE4F1680374DC0CDB885B29621A45FC7D0780B7E07884BD4292E2DD2B754279C`
- V3 branch：`V3-issue-0034-security-baseline-closure`
- Local HEAD / local ref / upstream / live remote：`ee41c3f30770be6f7a9a0e548975464268b911d2`
- Parent：`9988a46a03dabe5bf8e5a2331fc951ecd16d788e`
- Tree：`bc09512016e9e987f0a591096d10f6a6571eceef`
- Commit patch Git OID：`769b6a40f192ab06ecccb71b3dbb3caba80fb080`
- Commit manifest：14 项，missing/extra=`0/0`。
- `package.json` SHA-256：`36CF12650567FB6B736653995072C431592F8C1F7559260F6D3E44047A2FAFFF`
- `package-lock.json` SHA-256：`257A945825407CCDDFCAFA18F1E2C7FAD7FB8D53F39AB99DD5E191F5DD6651BF`
- 部署前 V3 status：clean，staged/untracked=`0/0`。

精确 14 文件 commit manifest：

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

## 2. 平台目标与部署前基线

- CloudBase CLI：`3.5.10`，已登录。
- EnvId：`ungradu-edu-prod-d3efys1f5970e3f`。
- Service：`ungradu-edu-prod`，唯一匹配，类型 `container`，端口 `3000`，套餐 `个人版`。
- 部署前 service 状态：`normal`，UpdateTime=`2026-08-15 19:01:49`。
- 部署前在线/回滚行为锚点：DeployId `064`，BuildId `2601742210`，状态 `normal`，FlowRatio=`100`，HasTraffic=`true`。
- `064` 只作为上一稳定平台版本与行为锚点，不证明 Git SHA，也未执行回滚。

部署前公开只读基线：

- apex `/`、`/rules`、`/feedback`：`200`，安全响应头存在，无 Set-Cookie。
- 匿名 `/api/auth/session`：`401 application/json`，安全响应头存在，无 Set-Cookie。
- `www /feedback?deploy=v3-0034&keep=1`：`308` 到 `https://ungraduedu.eu.cc/feedback?deploy=v3-0034&keep=1`。
- 固定 CloudBase 源站：无 proof 与合成无效 proof 均 `403 text/plain`，保持 fail-closed。

## 3. 授权命令与实际执行

授权命令：

```text
tcb -e ungradu-edu-prod-d3efys1f5970e3f cloudrun deploy --serviceName ungradu-edu-prod --port 3000 --source "D:\codex_project\家教对接website-v3-issue-0034-security-baseline-closure\Code文档" --force --json
```

- 首次非 PTY 调用 exit `0`，输出 283 bytes，SHA-256=`aec724605ff984dfc6a76ec19420b431ab84fb61b979ada861bb5a3cac13680b`；平台部署记录仍精确止于 `064`，没有产生写入。
- 只读检查 CLI 3.5.10 实现确认：`--force` 只跳过总体确认，现有服务仍会单独询问是否启用灰度；非交互调用停在该提示处。
- 未使用 `--traffic`。第二次以同一授权命令进入 PTY，明确选择默认的 `No (automatically switch traffic to new version after successful release)`，保持非灰度全量发布策略，不新增或改变流量规则。
- 实际提交命令 exit `0`；CLI 回报容器云托管提交完成并给出目标服务部署状态页。
- 未出现付费、套餐升级、新服务、环境变量、Secret、数据库、删除或回滚提示。

## 4. 平台部署结果

- DeployId：`065`
- DeployTime：`2026-08-17 23:33:09`
- RunId：`multi_tenant_1wvzKmp9AFeNZd`
- BuildId：`2601802192`
- 最终状态：`build_failed`
- FlowRatio：`0`
- HasTraffic：`false`
- ImageUrl：空（没有可发布镜像）
- VersionName：平台本次返回未提供，未虚构。
- 部署记录终态 RequestId：`e5f32c9a-7281-4bfe-b214-fb66ce386ffa` 的原始证据以平台实际输出为准；本回执不把 RequestId 当业务 provenance。

> 注：上一行 RequestId 仅为查询链辅助字段，若平台控制台显示不同查询 RequestId，以 DeployId/BuildId/DeployTime/终态为部署主键。

构建日志（BuildId `2601802192`）完整读取后锁定的失败点：

```text
[2026-08-17 23:33:35] ERROR: unable to prepare context: path "Code文档" not found
```

- 构建日志 RequestId：`20089a33-cc69-4d25-b9d0-292ab7628e42`。
- 失败发生在云端解压源码包后、Docker image build context 准备阶段。
- 这是部署打包/构建上下文契约错误；不是应用运行时、数据库、Secret、Cloudflare Worker 或生产对象访问验收结论。
- `065` 没有镜像、没有流量，不能声明 `ee41c3f3` 已部署，也不能建立平台版本到 Git SHA 的生产映射。

## 5. 失败后现网与回滚边界

- CloudBase service 列表仍为唯一目标、类型 `container`、状态 `normal`；UpdateTime 更新为 `2026-08-17 23:33:42`。
- 部署历史显示 `064` 继续 FlowRatio=`100`、HasTraffic=`true`；`065` 为 FlowRatio=`0`、HasTraffic=`false`。
- 因生产仍由 `064` 正常承载，未触发“生产不可用”紧急回滚条件；没有执行 rollback、traffic、版本删除或恢复旧 Secret。
- 失败后只读 smoke（`2026-08-17T23:39:47+08:00`）：
  - apex `/`、`/rules`、`/feedback`：`200`；CSP、`nosniff`、Referrer-Policy、`DENY` 与 HSTS 存在，无 Set-Cookie。
  - 匿名 `/api/auth/session`：`401 application/json`，安全头存在，无 Set-Cookie。
  - `www` canonical：`308`，路径和 query 原样保留到 apex。
  - 固定源站无 proof / 合成无效 proof：均 `403 text/plain`，fail-closed。
- 上述 smoke 只证明当前 `064` 基础可用和保护链未被失败构建破坏，不证明 `065` 或 `ee41c3f3` 的认证对象生产验收。

## 6. 源码与工作树保护

- 部署后 V3 branch/HEAD/tree/parent/local/upstream/live remote、14 manifest、commit patch OID、package/lock 哈希均未漂移。
- CLI 提交后生成了一个部署前不存在的未跟踪 `Code文档/cloudbaserc.json`：204 bytes，SHA-256=`B69535A2406DD1A717CE6BDBE8B0AE4CB668EC0F3875AD01DFC62760D58A8818`；其安全结构仅含 version/schema、上述 EnvId 与 service name，无 Secret。
- 该文件属于 CLI 本次瞬时副作用，已精确删除以恢复部署前状态；没有修改任何 tracked 文件。最终 V3 status clean，staged/untracked=`0/0`。
- 主工作树继续保持 branch=`V2-unified-navigation-responsive-profile-20260729`、HEAD=`33314857da0f2d72066443965454d23fc70a16d3`、staged=`23`、Code staged=`2`、cached patch OID=`d00aa22eb314e5c82710388d656a2250ff482ee8`。
- 本任务只新增本回执并追加开发员工作记录；既有 dirty/staged/untracked 未清理、覆盖、暂存或提交。

## 7. 未执行与未通过门禁

- 未发布 Cloudflare Worker；`cloudflare/worker.js` 未变。
- 未读取、输出、设置或修改任何真实 Secret/环境变量值。
- 未操作数据库、付费、套餐、DNS、域名、流量、Issue、Spec、UI。
- 未运行 npm、测试、typecheck、lint 或本地 build；上游 fresh 技术门已由提交/post-push 证据冻结，本包仅部署。
- 未执行 Git mutation、commit、push、merge、rebase、reset、clean、stash 或分支/worktree mutation。
- 未执行生产认证对象/跨账号/统一404的独立技术或产品验收。
- 未关闭 `ISSUE-0034`。

## 8. 当前阻塞与唯一下一步

- 当前状态：`DEPLOYMENT_BLOCKED`。
- 未通过门禁：DeployId `065` 云端构建失败、没有镜像、没有流量；`ee41c3f3` 尚未进入生产，因此独立生产技术/产品验收不能开始。
- 唯一下一步：返回项目总负责人，针对 `path "Code文档" not found` 下发最小部署打包/构建上下文返工与重新部署包；必须保持同一 commit 候选、不得借机修改 Secret/环境变量/数据库/Worker/业务代码。新版本部署成功后，再路由独立生产技术与产品验收。
