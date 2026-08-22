# ISSUE-0034 Deploy 066 独立生产技术验收

- 任务：`ISSUE-0034 Deploy 066 独立生产技术验收`
- 日期：`2026-08-18`（Asia/Shanghai）
- 执行角色：`019fefa7-d1d3-7ac3-a5ba-8b8abe299958 / 独立代码复核v2.3.2 / gpt-5.6-sol / high`
- 结论：`PRODUCTION_TECH_REVIEW_PASS_WITH_ACCEPTED_EVIDENCE_LIMIT`
- Standards findings：P0/P1/P2=`0/0/0`
- Spec/生产验收 findings：P0/P1/P2=`0/0/0`
- 证据限制：`AUTHENTICATED_PRODUCTION_EVIDENCE_UNAVAILABLE`

## 1. 结论与边界

Deploy 066 的部署身份链、公开边界、匿名认证边界、源站隔离、安全响应头和本次精确探针窗口日志均取得正向证据；在已观察范围内没有发现 P0/P1/P2 技术缺陷。因此，本轮不是 `PRODUCTION_TECH_REVIEW_BLOCKED`。

当前无法在不读取凭据、Cookie、localStorage 或密码的前提下合法复用两套生产登录会话。已有生产浏览器页属于来源负责人任务，不能越权接管；新开同配置浏览器页两次均在加载阶段超时。依照授权，本轮不再等待该通道，也不读取任何凭据，不将本地测试或匿名 smoke 冒充生产认证对象矩阵。

`AUTHENTICATED_PRODUCTION_EVIDENCE_UNAVAILABLE` 是明确的生产证据限制，不是已发现的 P0/P1 缺陷；它阻止无保留的 `PRODUCTION_TECH_REVIEW_PASS`，但在精确提交、独立本地安全门、精确部署包、Deploy 066 运行版本日志与公开/匿名生产探针形成强证据链的前提下，可给出 `PRODUCTION_TECH_REVIEW_PASS_WITH_ACCEPTED_EVIDENCE_LIMIT`。本角色不代替产品/业务方接受残余风险；在业务明确接受前，不能进入 ISSUE 管理员关闭结论。

本结论不等于认证对象生产矩阵已通过，不等于产品/业务验收，不等于 ISSUE-0034 关闭，也不授权部署、平台变更、数据库架构或 Secret 操作。

## 2. 冻结输入

- 上游提交：`ee41c3f30770be6f7a9a0e548975464268b911d2`
- 上游 post-push 独立复核报告 SHA-256：`266B9997DA74F181D033A65E75E9161A7D2D38D25FB20E5B1AA8FB7126310A73`
- 部署重试回执 SHA-256：`5D65C45588DA3BCEB2C19935F8C6FDB411580B427B9011EBE17BE1FBC3253891`
- DeployId：`066`
- BuildId：`2601797453`
- 镜像标签：`ungradu-edu-prod-066-20260818000401`
- 部署输入 OID：`47dcc89e06bda08c7006029d730cb0f67f410100`
- source package：提交归档 `394/394` 项，`Code文档` 294 项；不包含 `.git` 或真实环境值。
- 平台边界：CloudBase 原生发布记录没有 Git SHA attestation 字段；不得把 DeployId、BuildId、镜像标签或行为证据单独冒充 Git SHA。

## 3. A｜部署、平台与 provenance

### 3.1 独立只读确认

- 当前 CloudBase Run 服务 `ungradu-edu-prod` 返回 `status=normal`，更新时间 `2026-08-18 00:03:55`，服务类型为 container。
- 精确生产访问日志中的 `version` 均为 `ungradu-edu-prod-066`，证明本轮公开/匿名探针由 066 服务版本处理。
- 已校验部署回执文件哈希。回执冻结：066=`normal / 100% / HasTraffic=true / IsReleasing=false`；BuildId=`2601797453`；镜像标签=`ungradu-edu-prod-066-20260818000401`。
- 回执冻结：064=`normal / 0%`，作为保留的回滚锚点；065=`build_failed / 0%` 且无镜像。
- V3 上游 post-push 报告已证明提交 `ee41c3f3…` 的远端绑定、14 文件 manifest、patch OID `769b6a40f192ab06ecccb71b3dbb3caba80fb080` 和 package/lock 无漂移。
- 部署回执证明 source package 由该精确提交归档生成，归一化 blob `394/394`，部署输入 OID=`47dcc89e…`。本轮独立复核再次确认 V3 提交树共 394 个文件、`Code文档` 294 项。

### 3.2 provenance 结论

现有证据形成“精确 Git 提交与 patch → 精确归档清单/OID → Deploy 066 发布回执 → 生产访问日志 version=066”的可审计链。由于平台无原生 Git SHA attestation，结论是证据链一致，而不是宣称平台原生证明了 Git SHA。

066 的 BuildId、镜像和 064/065 明细来自已校验哈希的部署回执；当前只读服务列表没有版本级明细字段。该平台可见性边界已如实保留。

## 4. B｜公开边界与匿名安全门

### 4.1 公开探针

精确探针窗口：`2026-08-18 00:22:23–00:22:31 +08:00`。

- `https://ungraduedu.eu.cc/`：200。
- `https://ungraduedu.eu.cc/rules`：200。
- `https://ungraduedu.eu.cc/feedback`：200。
- 匿名 `GET /api/auth/session`：401、`application/json`，响应为规范化“需要登录”，无 `Set-Cookie`。
- `www` 的 `/feedback?deploy=066-independent&keep=1`：308 到 apex，path/query 完整保留。
- 固定 CloudBase 源站无 proof：403 `text/plain`。
- 固定 CloudBase 源站携带合成无效 proof：403 `text/plain`。
- 未知 Host：421 `Misdirected Request`，在应用前 fail-closed。
- apex 携带伪造来源/转发头仍只经正常 Worker 路径返回公开 `/rules`；未观察到源站旁路。HTTP 证据不能单独证明 Worker 内部精确清洗实现，故不作该层过度声明。

### 4.2 安全响应头

公开页面与匿名 session 响应均观察到：

- CSP 存在且保留 nonce；未出现 `unsafe-inline`、`unsafe-eval`。
- `X-Content-Type-Options: nosniff`。
- `Referrer-Policy: strict-origin-when-cross-origin`。
- `X-Frame-Options: DENY`。
- HSTS 存在。apex 为 `max-age=86400`；固定源站为 `max-age=31536000; includeSubDomains`。

### 4.3 匿名对象边界补充

精确窗口：`2026-08-18 00:26:05–00:26:08 +08:00`。仅执行 GET，不写生产数据：

- 合成缺失 conversation：401 JSON。
- 合成缺失 conversation messages：401 JSON。
- 合成缺失 contact exchange：401 JSON。

三者均在对象查询前保持未认证 401 边界；conversation 两条同时在 066 访问日志中取得对应 401。contact-exchange 的单条访问日志未在即时检索窗口出现，因此只认 HTTP 证据，不虚构日志配对。

## 5. C｜认证对象核心门

### 5.1 状态

`AUTHENTICATED_PRODUCTION_EVIDENCE_UNAVAILABLE`

未读取或输出 Cookie、token、localStorage、密码、联系方式、未成年人数据或 Secret；未执行任何认证业务写入，因此没有需要清理的合成对象。

### 5.2 本轮未能直接证明的生产矩阵

- participant 自有 conversation/message/contact 成功路径。
- nonparticipant、missing、deleted/不可见对象统一 404、规范化 body，且 Header/正文不可区分。
- stranger 对 expired/pending contact request 的 approve/reject/withdraw 均 404 且零越权写入。
- 客户端 `body.now` 不能控制 `createdAt` 或 expiry，生产只用服务端时间。
- 合法参与者生命周期的 200/403 冻结契约。
- 403 只保留于已认证非对象动作。

### 5.3 最小替代证据

- pre-push 独立安全复核已对精确候选给出 `TECH_REVIEW_PASS`；新鲜全量为 `80/80 files，579 passed / 1 skipped`，并覆盖对象 404、生命周期、stranger 零写、服务端时间与内部 status 不泄露。
- post-push 独立复核证明远端提交、parent/tree、14 文件 manifest、patch OID 与依赖无漂移。
- 部署归档与 Deploy 066 回执形成精确输入链；生产访问日志明确命中 version 066。
- 本轮生产已直接验证公开边界、匿名 401、源站隔离、安全响应头和窗口内无 5xx。

这些证据显著降低风险，但不能替代两套认证会话上的生产对象矩阵。

## 6. D｜日志、监控与回滚

### 6.1 日志窗口

`00:22:20–00:22:40 +08:00` 的精确访问日志共 10 条：4×200、2×401、4×403、0×5xx；全部 `version=ungradu-edu-prod-066`，耗时 8–51 ms。记录与 `/`、`/rules`、`/feedback`、匿名 session 和两组固定源站 403 探针对应。

未知 Host 的 421 在 CloudBase 前发生，www 的 308 在 Cloudflare 发生，二者不应出现在 CloudBase 访问日志中。

最近 30 分钟的 CloudBase 访问日志聚合未见 5xx。当前日志通道未返回可用的应用日志样本，因此不宣称应用日志已完整检查，也不虚构观察窗口或告警 owner。

### 6.2 回滚与停止条件

- 064 的回滚入口与 `normal / 0%` 状态由已校验部署回执证明；本轮未执行回滚。
- 065 为失败构建，不是回滚目标。
- 禁止恢复已暴露旧 Secret；如需恢复，应使用安全的 forward recovery 或经授权的新凭据轮换路径。
- 建议保持 066，不因认证证据通道不可用而主动回滚；当前没有观察到需要触发回滚的 P0/P1 信号。
- 停止条件：任何认证绕过、跨账号读写、联系方式/未成年人信息/Secret 泄漏、源站绕过、安全头缺失、持续 5xx、对象枚举差异或无法解释的版本/证据不一致，均应停止验收并返回原 owner。
- 回滚入口存在不等于真实反向回滚演练已完成；未执行实际回滚是本轮边界。

## 7. 两轴 findings

### Standards

- P0：none。
- P1：none。
- P2：none。

### Spec / ISSUE-0034 生产门

- P0：none。
- P1：none。
- P2：none。

`AUTHENTICATED_PRODUCTION_EVIDENCE_UNAVAILABLE` 与应用日志/告警 owner 可见性属于已命名证据限制，不是已复现的产品缺陷或代码 finding。它们阻止无保留 PASS，并进入业务残余风险接受门。

## 8. 残余风险与后续门禁

必须由产品/业务方明确接受的残余风险：

1. Deploy 066 上未直接执行两账号认证对象矩阵；生产数据库状态、云 SDK、运行时配置或数据竞争仍可能产生本地门禁未覆盖的差异。
2. 对象统一 404、stranger 零写、服务端时间、合法参与者 200/403 生命周期在生产未取得直接观测证据。
3. 当前日志通道没有返回可用应用日志样本；监控观察时长、告警 owner 与自动告警配置未独立证明。
4. 064 只证明回滚入口保留，未执行真实反向回滚；不得用恢复 exposed Secret 的方式补演练。
5. CloudBase 平台没有原生 Git SHA attestation；provenance 依赖归档、哈希、回执和运行版本日志的组合证据。

后续门禁：

- 产品/业务方须明确决定是否接受上述具名残余风险。
- 接受后，才可进入产品/业务最终验收与 ISSUE 管理员关闭复核；关闭仍由 ISSUE 管理员依据 canonical 和全部适用门禁决定。
- 若不接受，应由原获授权 owner 提供两套可复用、非敏感、无需读取凭据的认证会话或等价脱敏生产证据，补跑精确认证矩阵；独立复核角色不索取凭据、不自行造号、不越权写生产。

唯一下一步：交产品/业务方对 `AUTHENTICATED_PRODUCTION_EVIDENCE_UNAVAILABLE`、应用日志/监控可见性和未执行真实回滚三类残余风险作明确接受或拒绝决定；本角色不自行推进 ISSUE 关闭。

## 9. 权限与保护确认

- 未修改代码、部署回执、Issue、Spec、UI、平台配置、Secret 或数据库架构。
- 未执行 Git mutation、npm、构建、部署、Cloudflare/CloudBase mutation、真实凭据读取、任务或 subagent 创建。
- 生产探针仅为公开/匿名 GET/HEAD 类只读请求与合成无效 proof；未写生产业务数据。
- 主工作树写入前保护基线：branch=`V2-unified-navigation-responsive-profile-20260729`，HEAD=`33314857da0f2d72066443965454d23fc70a16d3`，staged=`23`，Code staged=`2`，cached OID=`d00aa22eb314e5c82710388d656a2250ff482ee8`。
- workflow=`WORKFLOW_ACTIVE`；ISSUE-0034 仍 `open / TECH_REVIEW_PASS`，不得把本报告当作自动关单。
