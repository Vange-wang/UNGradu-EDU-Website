# V5 / ISSUE-0036 S3 独立代码复核

日期：2026-08-23  
角色：独立代码复核 v2.3.2 / `019fefa7-d1d3-7ac3-a5ba-8b8abe299958`  
结论：`TECH_REVIEW_REWORK_REQUIRED`

## 1. 固定点与范围

- 工作树：`D:\codex_project\家教对接website-v5-issue-0036-contact-review-closure`
- 分支：`V5-issue-0036-contact-review-closure`
- HEAD：`03da0015be0d2ee403d848f149814039759cfcd1`
- tree：`c2cdc887da9bb771038fc729dab476518b477112`
- 固定候选：16 个 tracked modified + 10 个 untracked，staged=0，共 26 项；路径集合与任务包一致，开发员 manifest 标识为 `BCF34D587ED867412D0A54143CBB0A2A724889CD2D8BCDEDCB5A6CCD7837ECA3`。
- `package.json` / `package-lock.json` 无差异，blob 分别为 `9f74f257174ad5c84d62428531c61e30e18a226d` / `012694c0c71cab4fc9b3d74f767d1e87216cf4ee`。
- 权威 Spec SHA-256：`95AA1D2D6DFFE12E30C53E9D1A3C9EAA69AC5BFD33CB3DDD946F2DCCA5B5307A`，52245 bytes / 405 lines。
- 文档状态保持 `DOCUMENT_REVIEW_LIMIT_REACHED / USER_RISK_ACCEPTED_METADATA_ONLY / IMPLEMENTATION_PREPARATION_AUTHORIZED`；本报告不写成 `DOCUMENT_GATE_PASSED`。

## 2. Standards pass（先行冻结）

计数：P0/P1/P2 = `0/3/0`。

### P1-S1：生产公开 API 未经过权威 task/aggregate 完整性校验

- 证据：`Code文档/server/parent-need-api.ts:69-81` 与 `Code文档/server/tutor-profile-api.ts:69-80` 的公开列表仍直接调用旧 collection 查询；`Code文档/server/parent-needs.ts:915-947` 与 `Code文档/server/tutor-profiles.ts:903-935` 只依据主文档 `status=published` 返回 DTO。新增的 `readPublic` 仅在 `Code文档/server/security/contact-review-production.ts:1505-1540` 检查 entity/aggregate，并只重算 aggregate 内的 `fieldReviews`；`1721-1762` 不反向核对实际 task、owner/entity/version/field、contentHash、reviewKey、重复引用或 `requiredFieldsDigest`。
- 影响：task 缺失、错误引用、重复、digest 漂移或持久层局部损坏时，真实 parent-needs/tutor-profiles 列表与详情仍可从主文档公开旧 active snapshot；这是联系方式/未成年人内容公开门的 fail-open。
- 最小修复方向：让两类公开列表和详情统一经过同一权威读取 seam；在返回前从主实体 active pointer 定位唯一 aggregate，并逐项反向核对 N/N task/ref/digest/状态/白名单。任一不一致返回 hidden/404，不回退到最高版本或仅信主文档 `status`。补真实 route 负例覆盖 missing/duplicate/wrong-owner/wrong-version/wrong-field/wrong-reviewKey/digest drift。

### P1-S2：真实请求与 reviewer 动作不满足可重放幂等

- 证据：create integration 在 `Code文档/server/security/contact-review-integration.ts:87-108` 每次生成新 entityId，并把服务端 `now` 写进 candidate；service 又在 `Code文档/server/security/contact-review-production.ts:417-424` 把 candidate/entityId 纳入 requestHash，因此相同 HTTP 幂等键的网络重试会得到不同 requestHash。字段决定在 `666-676` 先检查已变化 revision/status 再查 replay；申诉创建在 `845-859` 把可变 `aggregateRevision` 纳入 requestHash；申诉终审在 `1123-1162` 同样先做 revision 检查再查 replay。`claimField`（`746-804`）和 `claimAppeal`（`931-981`）没有幂等键/receipt，重复请求会再次改 revision 和追加 audit。
- 影响：网关、浏览器或平台对已成功请求进行安全重试时可能收到 409，而不是原结果；claim 可重复产生有效副作用。并发/超时恢复时无法证明 exactly-once，且现有单元测试只对同一个预构造 service request 重放，未覆盖真实 route 每次生成 UUID/时间的行为。
- 最小修复方向：以稳定的规范化业务输入计算 requestHash，服务端生成 ID/时间不得使同一命令漂移；所有 replay 检查必须先于已被首次成功改变的 revision/status 校验，并返回首次 receipt。为 claim/字段决定/终审建立固定 scope 的幂等 receipt 或等价可回放链；补 middleware/handler→integration→repository 的真实重试、冲突及零新增版本/task/audit 测试。

### P1-S3：申诉终审对持久化 triage=owner 状态未 fail closed

- 证据：`Code文档/server/security/contact-review-production.ts:1115-1121` 只检查 second reviewer 不等于 owner、triage 非空且不等于 second、triage role 有效；没有验证每个 task 的 `triageReviewerRef !== ownerId`。正常 claim 会拒绝 owner，但生产读取边界仍需防御历史/人工/局部数据污染。
- 影响：若 CloudBase 中出现 owner 被写成 triage 的申诉 task，独立 second reviewer 可以通过当前校验并使版本 published，双人控制退化为“owner 初审 + second 终审”。
- 最小修复方向：终审事务逐字段验证 triage 与 second 均非 owner、claimAt/角色/权限均有效；任一失败按合同整向量进入 `needs_manual_review` 并写失败审计，存储/audit 不可用则 503 且零变化。补直接构造持久化污染状态的负例。

## 3. Spec pass（Standards 冻结后）

计数：P0/P1/P2 = `0/2/0`。

### P1-C1：edit/restore 未执行生命周期源状态矩阵

- 证据：`Code文档/server/security/contact-review-production.ts:447-468` 只验证实体存在/owner/revision及 active pending 冲突，未按 operation 验证源 `publicVisibility` 与 pending 状态。`Code文档/server/security/contact-review-integration.ts:190-217` 的 restore 直接读取任意 owner snapshot 后提交 `operation=restore`。
- 违反合同：Spec §6.3（lines 211-220）、§7.6（lines 282-287）、§12.3.1（line 382）。restore 只应从 deleted 进入更高版本 hidden 待审；deleted 不应绕过 restore 走 edit；published 不应被 restore 隐藏。
- 影响：owner 可直接调用 API 对 published 实体执行 restore，造成正常公开内容被隐藏；也可对 deleted 实体走 edit，绕过明确恢复语义和恢复证据。
- 最小修复方向：事务内按 operation 固定 source-state matrix；非法状态返回 422/409 且 entity/task/aggregate/audit/receipt 零变化。补 published→restore、deleted→edit、active-review→edit/restore、rejected→edit/appeal 竞争负例。

### P1-C2：申诉/handoff/cleanup 的审计与保留合同未落地

- 证据：`Code文档/server/security/contact-review-production.ts:118-146` 的 audit record 缺少合同要求的 previous/new triage、second、decision/reason、fieldDecisionMap、appealedFieldSetDigest、resumeReasonCode、dependencyRecoveryRef、claim/resume/decide 时间及 previous/next pointer/visibility；通用 `appendAudit`（`327-374`）也无法写这些字段。`claimAppeal` 在 `962-978` 可覆盖 claimant，却没有 handoff 原因和 previous/new claimant；`resumeAppealReview` 虽接收恢复引用/原因，但 `1055-1064` 的 audit 未保存；`decideAppeal` 的 `1198-1207` 未保存完整逐字段决定向量。`cleanupRetention`（`1469-1502`）只清有 `decidedAt` 的 task，deleted 等完成状态可永久滞留；同时直接删除 audit，未记录 hold/cleanup 结果或失败审计。
- 违反合同：Spec §7.4（lines 259-263）、§7.6（lines 295-301）、§8.1（lines 317-322）、§12.2.8-9 与 §12.3.6。
- 影响：无法从仓库证据证明 reviewer handoff、恢复原因、双人终审逐字段决定及公开指针切换；清理/hold 也不可审计，已删除 task 的 30 天保留策略不能执行。
- 最小修复方向：补全最小、无原文的结构化 audit schema，并在 claim/handoff/resume/decision/pointer switch/cleanup 同事务写全；handoff 要求理由与 previous/new claimant；cleanup 按 completedDecisionStatuses/时间处理并保留可审计结果，失败不改变任务或公开指针。补 retention 边界、hold 创建/延长/解除、部分失败/重试及清理后不得恢复测试。

## 4. 测试与证据判断

- 开发员证据归属当前候选：定向 2 files / 16 tests、受影响 12 files / 85 tests、浏览器修复组 3/3、全量 88/88 files（653 passed / 1 existing skipped）、typecheck/lint/build 18/18/diff-check exit 0。
- 本轮按固定候选只读静态核对，没有重复运行 npm；上述结果是开发员门禁证据，不是本线程新鲜执行结果。
- 测试代码确实覆盖 feature flag 默认关闭、配置缺失 503、CloudBase 合成事务、owner/reviewer 基本角色、公开 DTO 白名单、SLA 与基本 retention；但未覆盖本报告五项反例。全量数字不能抵消缺失的安全/事务契约测试。
- 曾出现的既有浏览器 hook 调度超时在最终全量中未复现，本轮仅保留为 NON_BLOCKING 调度残余风险，不作为本候选阻断。

## 5. 边界与门禁

- 26 项候选之外未发现 ISSUE-0036 范围外业务 diff；`.env.example` 仅新增占位配置且默认关闭，未发现真实 Secret、联系方式、token、prompt 或外部 provider 值。
- 文档 Round 3 元数据滞后按用户已接受的 metadata-only 风险记录，不新增措辞返工。
- 本结论不授权 UI 复核、提交、推送、部署、平台 schema/index/权限、feature flag 开启、生产人工 owner、生产验收、业务验收或 ISSUE-0036 关闭。

## 6. 唯一下一步

项目总负责人将本报告完整 P1 批次退回原代码 owner：一次性修复公开权威读取、真实请求幂等、申诉 owner 隔离、生命周期矩阵及 audit/retention，并补对应受影响回归；修订后回到同一独立复核线程做 targeted re-review。UI 复核在代码门通过前不启动。
