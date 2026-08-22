# ISSUE-0034 V3 CloudBase Run 部署打包重试回执

- 执行日期：2026-08-18（Asia/Shanghai）
- 执行角色：`019fefa7-a3c3-7333-94d7-d61961c5ea99 / 代码开发员v2.3.2`
- 状态：`DEPLOYMENT_RETRY_COMPLETE`
- Workflow：`WORKFLOW_ACTIVE`
- Issue：`ISSUE-0034 open / TECH_REVIEW_PASS`
- 边界：本回执只证明精确提交快照已完成 CloudBase Run 应用部署及基础只读烟测；不替代认证对象的独立生产技术验收、产品/业务验收、Issue 关闭或 workflow 完成。

## 1. 冻结输入与失败锚点

- V3 branch：`V3-issue-0034-security-baseline-closure`。
- Local HEAD / upstream / live remote：`ee41c3f30770be6f7a9a0e548975464268b911d2`。
- Parent：`9988a46a03dabe5bf8e5a2331fc951ecd16d788e`。
- Tree：`bc09512016e9e987f0a591096d10f6a6571eceef`。
- Commit manifest：精确 14 项；commit patch Git OID：`769b6a40f192ab06ecccb71b3dbb3caba80fb080`。
- `package.json` SHA-256：`36CF12650567FB6B736653995072C431592F8C1F7559260F6D3E44047A2FAFFF`。
- `package-lock.json` SHA-256：`257A945825407CCDDFCAFA18F1E2C7FAD7FB8D53F39AB99DD5E191F5DD6651BF`。
- 上轮阻塞回执 SHA-256：`D78722001C0BC564F63A60099546961EA71360B9F0B6411F7C15EF7D70B76789`。
- 上轮 DeployId `065` / BuildId `2601802192` 保持 `build_failed`、FlowRatio=`0`、无镜像；精确失败为 `unable to prepare context: path "Code文档" not found`。
- 上轮稳定锚点 `064` 在重试前为 `normal`、FlowRatio=`100`；没有删除 `064` 或 `065`，没有执行回滚。

## 2. 确定性部署包 provenance

- 系统 TEMP 任务根：`C:\Users\86166\AppData\Local\Temp\codex-v3-0034-deploy-retry-bee9968cb84a40fda2565f0b2611c9c8`（任务结束后已删除）。
- 使用 `git archive --format=tar --output=<temp archive> ee41c3f30770be6f7a9a0e548975464268b911d2` 生成精确 commit 快照；archive exit `0`。
- archive：12,339,200 bytes；SHA-256=`38BE61AD877E3277112920E9C59E8B75FAF6D997536068940187B4CD3485676F`。
- Windows `tar.exe` 首次因中文路径解码失败，未进入部署；对应临时目录已精确删除。随后使用 Python 标准库 `tarfile` 的安全 data filter 解包同一 archive，没有安装依赖或改变内容。
- Git tree / tar / package 文件数均为 `394`；tar 与 package 对 commit manifest 的 missing/extra 均为 `0/0`。
- archive 的 Windows checkout 表示有 334 个原始换行差异；使用 Git 路径过滤规则执行 `git hash-object --path` 后，394/394 文件均精确归一到 commit blob，filtered mismatch=`0`。这说明差异仅为 Git text normalization，不是内容漂移。
- 临时包内 `Code文档/Dockerfile`、`package.json`、`package-lock.json` 及六个生产 server 文件均存在；package/lock 哈希与冻结值一致。
- `Code文档` 部署输入：294 entries；Git OID=`47dcc89e06bda08c7006029d730cb0f67f410100`；SHA-256=`E9D8038325BFE0FD4C763D92454F9CC635D54430DF138BB33451A3630A3227B7`。
- 完整 package manifest SHA-256=`E5470B8E59DFF713B3076A5D72DB0EB8194658F00CD82D4FE69933075008943C`。
- 包中不含 `.git`、`cloudbaserc.json`、主工作树回执/dirty/staged/untracked、真实环境文件或 Secret 文件；仅包含仓库冻结的 `.env.example`。

## 3. 平台重试命令与结果

- EnvId：`ungradu-edu-prod-d3efys1f5970e3f`。
- Service：`ungradu-edu-prod`，唯一匹配，类型 `container`，端口 `3000`，个人版；部署前与部署后 service 均为 `normal`。
- 从临时 package 根执行：

```text
tcb -e ungradu-edu-prod-d3efys1f5970e3f cloudrun deploy --serviceName ungradu-edu-prod --port 3000 --source "C:\Users\86166\AppData\Local\Temp\codex-v3-0034-deploy-retry-bee9968cb84a40fda2565f0b2611c9c8\package" --force --json
```

- 灰度选择明确为 `No (automatically switch traffic to new version after successful release)`；未使用 `--traffic`。命令提交 exit `0`，未出现付费、套餐升级、新服务、Secret/env、数据库、删除、Worker 或非目标配置提示。
- 新 DeployId：`066`。
- DeployTime：`2026-08-18 00:03:55`。
- RunId：`multi_tenant_1wvzoZEqp7Jubl`。
- BuildId：`2601797453`。
- 最终状态：`normal`；FlowRatio=`100`；HasTraffic=`true`；IsReleasing=`false`。
- ImageUrl：`ccr.ccs.tencentyun.com/tcb-100050033869-lqqa/ca-isxmixar_ungradu-edu-prod:ungradu-edu-prod-066-20260818000401`。
- 平台响应没有单独返回 VersionName 字段；镜像 tag 中可见 `ungradu-edu-prod-066-20260818000401`，不将该推断扩写成未返回字段。
- 部署后 service UpdateTime=`2026-08-18 00:03:55`，状态 `normal`。
- `064` 保留为上一稳定回滚锚点，部署后 `normal`、FlowRatio=`0`、HasTraffic=`false`；`065` 保留失败记录，仍为 `build_failed`、FlowRatio=`0`、无镜像。未删除版本、未执行回滚。
- 来源边界：部署输入由上述精确 commit archive 与 manifest/hash 固定，并由本次命令直接提交给 DeployId `066`；平台没有提供独立的 Git SHA 元数据字段，因此不把镜像自身声明为平台原生 Git attestation。

## 4. 部署后基础只读烟测

- 新鲜烟测时间：`2026-08-18T00:08:53.2636017+08:00`。
- apex `/`、`/rules`、`/feedback`：均 `200 text/html`；CSP、`nosniff`、Referrer-Policy、`DENY` 与 HSTS 存在，无 Set-Cookie。
- 匿名 `/api/auth/session`：`401 application/json`；同样安全头存在，无 Set-Cookie。
- `www /feedback?deploy=v3-0034-retry&keep=1`：`308` 到 `https://ungraduedu.eu.cc/feedback?deploy=v3-0034-retry&keep=1`，路径与 query 保留。
- 固定 CloudBase 源站：无 proof 与合成无效 `x-ungrade-origin-verify` 均为 `403 text/plain`；安全头存在，保持 fail-closed。
- 上述基础 smoke 证明 `066` 接流量后的公开基础行为和源站保护链正常，不替代登录态、跨账号、规范化 404、联系方式生命周期等独立生产验收。

## 5. TEMP 清理与保护基线

- 部署完成并取得证据后，先把任务路径解析为绝对路径，确认它位于系统 TEMP 且目录名精确以 `codex-v3-0034-deploy-retry-` 开头，才执行该唯一目录的递归删除。
- 删除前 archive/package 均存在；CLI 在临时 package 根生成的 `cloudbaserc.json` 也只位于该临时目录。删除后 task root、archive、package 均不存在；同前缀任务目录残留=`0`。删除不可恢复，但目标仅为本任务临时包。
- V3 部署后仍为上述 branch/HEAD/upstream/live remote、tree/parent、14 manifest 与 patch OID；status clean，staged/untracked=`0/0`；package/lock 哈希不变。
- 主工作树保持 branch=`V2-unified-navigation-responsive-profile-20260729`、HEAD=`33314857da0f2d72066443965454d23fc70a16d3`、staged=`23`、Code staged=`2`、cached patch OID=`d00aa22eb314e5c82710388d656a2250ff482ee8`。本任务只新增本回执并追加开发员工作记录；其余 dirty/staged/untracked 未清理、覆盖、暂存或提交。

## 6. 未执行、未通过门禁与下一步

- 未发布或修改 Cloudflare Worker；未操作 DNS、域名或 Worker Secret。
- 未读取、输出、写入或修改任何真实 Secret/环境变量值。
- 未操作数据库、付费、套餐、Issue、Spec、UI；未运行 npm、测试、typecheck、lint 或本地 build。
- 未执行 Git mutation、commit、push、fetch、pull、merge、rebase、reset、clean、stash 或工作树/分支操作。
- 未关闭 `ISSUE-0034`，当前仍为 `WORKFLOW_ACTIVE / ISSUE-0034 open / TECH_REVIEW_PASS`。
- 未通过门禁：认证对象、跨账号不可枚举、统一 404、服务端时间与联系方式生命周期仍需基于 `066` 的独立生产技术验收；随后还需产品/业务验收。
- 唯一下一步：返回项目总负责人，路由独立生产技术验收；技术门通过后再进入产品/业务验收，不由本线程自行关闭 Issue。
