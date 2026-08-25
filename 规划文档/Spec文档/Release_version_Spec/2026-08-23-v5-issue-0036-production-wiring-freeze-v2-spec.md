# V5 / ISSUE-0036 生产接线冻结包 v2

状态：`DRAFT_NON_CANONICAL / QA_SERIOUS_REMEDIATED / HERMES_ROUND_3_PENDING`
文档类型：ISSUE-0036 生产接线冻结附件 v2；不替代 V5 closing Spec
审查预算：`MAX_REVIEW_ROUNDS=3；CURRENT_REVIEW_ROUND=1/3`
唯一 Issue：`ISSUE-0036`
当前项目 workflow：`WORKFLOW_ACTIVE`
作者：产品经理 Agent v2.3.2 / `019fefa7-9883-7af2-bdb5-acc5c8513781`

## 1. 版本来源、用户决定与状态边界

本文件是 v1 生产接线冻结包在旧周期 `DOCUMENT_REVIEW_LIMIT_REACHED` 后的 materially new v2。业务方已明确选择“按推荐方案动手”，该决定只授权以本文件重建产品合同并开启新的独立文档审查周期，不授权实现、UI、实际数据库建表、平台配置、部署、生产启用或 Issue 关单。

v1 必须永久保留，不修改、不重命名、不补跑、不伪装为 Round 4：

- v1 canonical：`规划文档/Spec文档/Release_version_Spec/2026-08-23-v5-issue-0036-production-wiring-freeze-spec.md`
- v1 SHA-256：`C2988846E38D3C4338A38C06CC96B239BD59B9504D26E950CE07838265E393CF`
- v1 状态：`DOCUMENT_REVIEW_LIMIT_REACHED`，旧周期 Round 3 仍有 2 项 SERIOUS。

v2 是一份完整 canonical，不是 v1 差异补丁。v2 后续任何修订共享本文件的新 `3/3` 预算；本轮 Round 1 必须由 Hermes 对完整连贯文档作一次整体审查，后续仅复核严重修订和受影响回归。

本文件不是实现完成、平台配置完成、部署完成、生产通过、业务最终验收或 Issue 关闭证明。生产 feature flag 默认关闭；没有完整生产输入和分层证据时，任何生产副作用都必须保持关闭。

## 2. 冻结事实、范围与依赖

| 来源/事实 | 精确绑定或边界 | 本文件用途 |
| --- | --- | --- |
| v1 生产冻结包 | SHA-256=`C2988846E38D3C4338A38C06CC96B239BD59B9504D26E950CE07838265E393CF` | 历史输入与旧周期边界，不代表 v2 已通过 |
| V5 上游代码 | commit=`03da0015be0d2ee403d848f149814039759cfcd1`；post-push attestation=PASS | 仅为本地/合成 S2 技术基线，不是生产证据 |
| ISSUE-0036 | 仍为 `open / USER_CONFIRMATION_PENDING` | 唯一 Issue 和后续关单责任边界 |
| 用户决定 | “按推荐方案动手” | 允许本 v2 新周期，仍不越过本文档/用户/生产门禁 |
| 项目边界 | workflow=`WORKFLOW_ACTIVE`；ISSUE-0031、支付、其他 Issue 排除 | 防止范围扩张 |

本 v2 只闭环 ISSUE-0036。数据库延期解除仅适用于 ISSUE-0036 的后续独立生产准备；不启动 ISSUE-0031 或其他数据库动作。AI、OCR、provider、额外出域、模型训练、采购、付费、DPA 和真实生产 Secret 继续关闭。首次访问 503 不属于本 Issue，待 ISSUE-0036 关闭后另行处理。

依赖门：原 V5 S2 commit 的本地/合成技术证据仍不能升格为生产证据；生产人工 owner、权限绑定、schema/index/transaction 实证、UI/API 接线、部署 revision、观察、回滚、独立生产复核、产品/业务验收和 Issue 管理员关单必须分别取证。

## 3. 产品目标、非目标与用户可见结果

### 3.1 目标

1. 对 `parent_need/childIntro` 与 `tutor_profile/abilityDescription` 形成字段级审核 task，并由同一 entity-version aggregate 统一实体公开门。
2. 只有服务端生成的全部 `N` 个 required field tasks 恰好存在、均通过、审计完整且同一事务成功时，实体版本才可公开。
3. 申诉 final published/rejected 使用独立账号的双人控制：实际 claim/triage 账号统一记录在 `triageReviewerRef`，最终账号统一记录在 `secondReviewerRef`。
4. 编辑、拒绝、申诉、删除和恢复均保持旧 approved snapshot 与新候选严格隔离，不因字段部分通过、并发、重试或清理而错误公开。
5. 提供可持久化、可审计、可幂等、可恢复但不复制原文/联系方式/未成年人正文的生产接线合同。
6. 联系方式默认不公开；owner 可在私有界面查看自己提交的联系方式，公共/其他账号只能看到公开 approved snapshot 中明确允许的字段。

### 3.2 非目标

- 不自动公开、自动发布或自动拒绝；规则结果只能进入待审核或人工状态。
- 不接入 AI、OCR、provider、外部网络、额外数据出域或模型训练。
- 不写入或回显真实人工账号、Secret、token、邮箱、手机号、DPA、成本、region 或 production key。
- 不修改 ISSUE-0031、支付或其他 Issue，不替其他 Issue 解除数据库延期。
- 不把本文件中的 schema、索引、事务、权限、账号绑定、revision 或回滚点表述为已经存在。
- 不处理首次访问 503，不替代独立运维 Issue。
- “边做边看”只允许原 owner 在冻结范围内根据发现的问题返工，不降低 fail-closed、隐私、独立复核、生产证据和关单门。

### 3.3 用户可见结果

| 场景 | 用户/owner 私有界面 | 公共/其他账号 |
| --- | --- | --- |
| 新建/编辑提交 | “已提交审核，审核完成前不会公开” | 看不到 pending 内容 |
| 需人工 | “需要人工审核” | 看不到未批准内容 |
| 拒绝 | “审核未通过，可申诉或编辑后重新提交” | 看不到被拒内容 |
| 申诉 | “申诉已提交，等待复核” | 看不到申诉内容 |
| 删除 | “已删除，恢复后需要重新审核” | 立即隐藏 |
| 已批准 | owner 可看到自己的已批准状态；联系方式仍按授权策略显示 | 只读 active approved snapshot，默认不显示联系方式 |

用户不可见内部命中片段、模型分数、审核员账号、其他账号资料、Secret、token 或未批准版本的任何摘要/缓存片段。

## 4. 角色、权限与生产硬门

### 4.1 最小角色

| 角色 | 允许动作 | 明确禁止 |
| --- | --- | --- |
| `primary reviewer` | 领取普通 task、读取必要脱敏内容、提交普通字段决定；申诉可 claim/triage，并可在原因已解除后执行 `resumeAppealReview` | 不得审核自己 owner 的内容；不得作申诉最终决定；不得改权限、公开联系方式或跳过审计 |
| `backup reviewer` | primary 超时/不可用时 claim/triage 或处理普通 task；申诉可 claim/triage，并可审计化接管 `resumeAppealReview` | 不得审核自己 owner 的内容；不得作申诉最终决定；不得把接管身份写成未定义字段 |
| `second reviewer` | 使用独立账号处理申诉最终决定及被明确标记的二审任务 | 不得等于 owner 或 triage 账号；不得处理无合法 `appealMode` 的申诉终审；不得删改审计 |
| `content owner` | 私有查看自己的提示、提交编辑、提交一次未编辑申诉、删除或恢复 | 不得自审、不得把自己的内容直接变为 published |
| `system/queue worker` | 幂等入队、dueAt 检查、超时标记、清理和告警 | 不得自动 published、rejected 或改变联系方式/聊天授权 |

### 4.2 唯一申诉账号语义

申诉记录只使用以下 reviewer 字段，不再使用 `primaryReviewerRef` 或 `backupReviewerRef` 表示申诉 claim：

- `triageReviewerRef`：实际执行 claim/triage 的账号；必须非空时配套 `triageReviewerRole`。
- `triageReviewerRole`：只能为 `primary` 或 `backup`。
- `secondReviewerRef`：最终申诉决定账号；只有在合法终审提交时填写。
- `secondReviewerRole`：最终申诉决定时必须为 `second-review`。

申诉 claim/triage 是独立原子步骤：primary/backup 只写 `triageReviewerRef`、`triageReviewerRole`、`claimAt` 和 claim audit，字段 task 与 aggregate 均保持 `appeal_pending`。申诉终审按 appealed field 逐项决定；完整决定向量必须在同一原子事务读取并验证现有 triage/claim 字段，再为每个 appealed field 写入 `secondReviewerRef`、`secondReviewerRole`、`decision`、`reasonCode`、`decidedAt`、`idempotencyKeyHash`，并写版本级 `appealRequestId` 与完整 audit。每项均须满足 `secondReviewerRef != 当前 triageReviewerRef`、二者均不等于 `ownerId`，账号有效且具备对应权限；终审不得重写 claim 身份或时间。

若 second-review 决定向量的账号、角色、reasonCode、字段集合或 revision 校验失败，且事务与 audit 可用，全部 appealed fields 与 aggregate 必须在同一事务转为 `needs_manual_review` 并记录失败原因，不得部分发布或拒绝。若事务、存储或 audit 不可用，返回 `503 REVIEW_UNAVAILABLE`，字段、aggregate、claim、指针与审计均零变化。

primary/backup 的接管只改变 `triageReviewerRef/triageReviewerRole`，不得另写一个未定义的 backup claimant 字段。并发 claim 使用 expected task revision；旧 revision 的 claim/decision 返回冲突，不得覆盖新账号。

### 4.3 普通审核与二审范围

`appealMode=false` 的普通 task 可由有效 primary 或 backup 按普通权限处理；`appealMode=true` 的申诉 task 中，primary/backup 的 claim/triage 不改变 `appeal_pending`，最终 published/rejected 只能由不同账号的 second reviewer 完成。若申诉因终审校验失败或人工 SLA 超时进入 `needs_manual_review`，唯一恢复出口为 primary/backup 执行 `resumeAppealReview`；该动作只恢复到原 `appeal_pending`，不创建第二次 appeal，也不赋予 primary/backup 终审权。若未来启用非申诉“边界案例二审”，必须另有字段、转移、权限和用户确认；本 v2 不把未定义的普通二审当成已授权范围。

实际账号绑定、权限清单、备援关系、二审账号、工作时段和告警责任是部署前硬门。缺失时可进行本地/集成/预生产验证，但 feature flag 不得开启。

### 4.4 业务目标与超时

普通人工处理目标为 24 小时，申诉处理目标为 48 小时；这里是产品观察目标，不等于已向用户承诺的生产 SLA。普通审核超时保持或转入 `needs_manual_review`；申诉人工 SLA 超时可原子转入 `appealMode=true/needs_manual_review`，产生 overdue audit 和告警，之后只走 `resumeAppealReview`。任何超时都不自动 published、rejected、恢复联系方式或改变聊天授权。实际工作日/自然日、owner、备援和升级路径须由业务/运营另行形成证据。

## 5. 状态、版本与 API 合同

### 5.1 字段 task 状态

字段 task 唯一状态枚举：`draft`、`pending_review`、`needs_manual_review`、`published`、`rejected`、`appeal_pending`、`deleted`。

`published` 只表示该字段 task 已通过人工审核；它绝不单独表示实体版本可公开。实体是否公开只由主实体公开指针和 entity-version aggregate 共同决定。

涉及当前候选资格和指针校验时只使用两组精确集合：`activeReviewStatuses={pending_review, needs_manual_review, appeal_pending}`；`completedDecisionStatuses={published, rejected, deleted}`。`rejected` 属于已完成决定而非 active review；除此之外不引入任何未定义的状态别名或隐含子状态。

### 5.2 普通状态转移

| 触发 | 合法转移 | 必要保护 |
| --- | --- | --- |
| 新建/编辑提交 | `draft -> pending_review` | 服务端生成 entity version、requiredFields、task 和幂等键 |
| 用户修正草稿 | 编辑草稿 -> `draft` | 只返回可修正提示，不泄露命中细节 |
| 预检不确定/系统故障 | `pending_review -> needs_manual_review` | fail-closed，写原因类别和 audit |
| 普通字段决定 | `appealMode=false` 的 `pending_review/needs_manual_review -> published/rejected` | primary/backup、expected revision、content owner 禁止自审、审计完整；其余字段未完成时 aggregate 仍为 pending_review |
| 申诉 claim/triage | `appealMode=true` 的 `appeal_pending -> appeal_pending` | 只写 triage ref/role、claimAt 与 audit，不写 second 决定 |
| 申诉校验失败/超时 | `appealMode=true` 的 `appeal_pending -> needs_manual_review` | 仅在事务/audit 可用时整体原子转移；存储不可用 503 且零变化 |
| 恢复申诉复核 | `appealMode=true` 的 `needs_manual_review -> appeal_pending` | 仅 primary/backup 的 `resumeAppealReview`；沿用原 appealRequestId，原因已解除，幂等且审计完整 |
| 普通非法决定 | 任意不满足角色/版本/状态的请求 -> 原状态不变 | 返回拒绝或冲突，不产生公开副作用 |
| 删除 | 除 `deleted` 外的可删除状态 -> `deleted` | 主实体立即 hidden；当前候选的未决字段 task 原子转为 `deleted` |
| 恢复 | `deleted -> pending_review` 新版本 | 不复用旧 task，不直接 published |

### 5.3 申诉和编辑转移

- `pending_review` 和 `needs_manual_review` 的普通审核含义不同：前者等待正常审核，后者表示不确定、故障或失败路径，需要人工接管；二者与 `appeal_pending` 均属于 `activeReviewStatuses`，都不能被公共查询读取。
- 若主实体 `pendingReviewVersion` 指向的 aggregate 处于 `activeReviewStatuses`，再次编辑必须返回 `409 REVIEW_VERSION_CONFLICT`；不得静默产生更高版本或覆盖当前候选。
- 普通字段逐项决定期间，只要任一 required field 仍为 `pending_review/draft/missing/duplicate/unknown`，aggregate 必须保持 `pending_review/fail-closed`；即使已有字段 rejected，也继续完成其余普通审核，owner 不得申诉，旧 active snapshot 保持不变。
- `rejected` 不属于 `activeReviewStatuses`。只有全部 N 个 required fields 都已完成普通决定、状态仅属于 `{published,rejected}` 且至少一个 rejected 时，aggregate 才可为 rejected。若主实体 `pendingReviewVersion` 仍指向该 fully-decided rejected version 且 `aggregate.appealUsedAt=null`，owner 只能原子选择一次以下路径之一：
  1. **未编辑申诉**：保持同一 `entityVersion/contentHash`，将该版本所有当前 rejected requiredFields 的原 task 一次性转为 `appeal_pending/appealMode=true`，同时在 aggregate 设置 `appealUsedAt` 与唯一 `appealRequestId`；已 published requiredFields 保持 published，不重开。
  2. **编辑**：创建严格更高的新版本及全量 required field tasks，主实体 `pendingReviewVersion` 在同一事务改指新版本，新 aggregate 的 `supersedesVersion=旧 rejected version`。旧 aggregate 继续保持 `rejected`，仅作为历史证据；不新增任何隐藏状态，且因不再被 `pendingReviewVersion` 指向而不可申诉。
- `appeal_pending` 或 `appealMode=true/needs_manual_review` 期间 owner 均不得 edit 绕过终审。`resumeAppealReview` 只能由有效 primary/backup 在失败原因已修正或依赖恢复后执行：复用原 `appealRequestId`，不清 `appealUsedAt`；可保留原 triage，或以审计化 handoff 更新 triage ref/role/claimAt 并记录 previous/new claimant、reason 和 time；重复 resume 返回原幂等结果。非法角色、原因未解除或并发冲突保持 needs_manual_review，不产生部分决定。恢复后 second reviewer 仍必须不同于当前 triage 与 owner。
- 申诉终审后任一 required field 仍 rejected 时，aggregate 保持 `rejected`、`appealUsedAt/appealRequestId` 保留且 `pendingReviewVersion` 仍指向该版本；只有此 final rejected 状态才允许 owner edit 新版本，且不得再次申诉。
- 任一申诉或编辑路径成功后，旧 rejected version 立即失去另一条当前候选操作资格；重复、并发或旧 revision 请求返回冲突，不产生第二版本、第二申诉或部分副作用。
- aggregate `published` 后原子清空 `pendingReviewVersion` 并切换适用的 active pointer；delete 后原子清空 pending、将当前候选字段 task/aggregate 置为 `deleted` 并立即 `hidden/deleted`。普通审核得到 `rejected` 时不清 pending，以保留上述一次“申诉或编辑”选择。

### 5.4 API 返回与用户文案

服务端必须从主实体和权威 aggregate 计算公开结果，忽略客户端传入的状态、版本、visibility、aggregateStatus 和 reviewer 字段。至少固定以下错误分类：

- `403 REVIEW_ROLE_FORBIDDEN`：账号无相应角色、owner 自审、second 与 triage/owner 相同或申诉终审角色不符。
- `409 REVIEW_VERSION_CONFLICT`：expected entity/task/aggregate revision 过期、并发编辑或并发决定冲突。
- `409 IDEMPOTENCY_KEY_REUSED`：同一 scope 的幂等键已绑定不同 `requestHash`。
- `409 APPEAL_ALREADY_USED`：该 rejected entityVersion 已使用申诉，或已不再由主实体 pending pointer 指向。
- `409 APPEAL_NOT_READY`：aggregate 尚未达到 fully-decided rejected；存在普通 pending/draft/missing/duplicate/unknown field。
- `409 APPEAL_RESUME_CONFLICT`：resume 的 expected task/aggregate revision 过期或发生并发 claim/handoff。
- `422 REVIEW_INPUT_INVALID`：字段、版本、申诉条件、幂等参数或状态转移非法。
- `422 APPEAL_FIELD_SET_INVALID`：申诉请求未精确覆盖该版本当前全部 rejected requiredFields、包含已 published field，或字段集合与 aggregate 不一致。
- `422 APPEAL_RESUME_NOT_READY`：`resumeAppealReview` 的失败原因尚未解除或依赖恢复证据不可验证。
- `503 REVIEW_UNAVAILABLE`：collection、事务、审计、权限或清理依赖不可用；保持原公开状态，不产生部分副作用。

创建/编辑 API 只能返回 `pending_review` 或 `needs_manual_review` 等安全状态，不得返回“已发布/重新公开”。申诉创建 API 只接受 fully-decided rejected aggregate 且为版本级操作：客户端不得选择字段子集；服务端返回 `appealRequestId` 的脱敏引用和完整 appealed field 列表摘要，状态为 `appeal_pending`。claim API 保持 appeal_pending；`resumeAppealReview` API 只接受 primary/backup、原 appealRequestId、失败原因解除证明和 expected revisions。second reviewer 终审 API 可在一次调用中提交覆盖全部 appealed fields 的逐字段决定向量。删除返回 hidden/deleted，恢复返回 pending_review。公共 API 只返回 `publicVisibility=published` 且 active approved snapshot 的字段；owner 私有 API 才可返回自己的联系方式。

## 6. 唯一公开权威模型与生命周期

### 6.1 主实体是唯一公开指针 holder

`parent_needs` 与 `tutor_profiles` 是唯一保存公开指针的主实体。每个主实体必须有：

- `ownerId`、`entityId`、`entityType`；
- `currentVersion`：严格单调递增的当前版本号；
- `activePublishedVersion`：nullable；当前批准且可作为公开快照的版本；
- `pendingReviewVersion`：nullable；当前唯一候选版本。它可指向 `activeReviewStatuses` 中的 aggregate，也可暂时指向等待 owner 在“申诉或编辑”之间选择的 `rejected` aggregate；其唯一性由主实体单一字段和 CAS 事务保证；
- `publicVisibility`：`hidden | published | deleted`；
- `entityRevision`、`updatedAt` 和最小 audit reference。

`contact_review_tasks` 不持有实体公开指针。`contact_review_entity_versions` 保存实体版本聚合与版本关系，但不成为第二个公开指针 holder。当前权威待审 aggregate 只能由主实体 `pendingReviewVersion` 指向；当前公开快照只能由主实体 `activePublishedVersion` 指向。主实体按 `(ownerId, entityId)` 定位，版本 aggregate 按 `(ownerId, entityId, entityVersion)` 唯一定位；不得用“最高 version”猜测权威记录。

公共查询必须同时验证：主实体 `publicVisibility=published`、`activePublishedVersion` 非空、该版本 aggregate 状态为 published、requiredFields 与 task 引用完整、N/N 字段均为 published、没有 pending/manual/rejected/appeal/missing/duplicate/unknown，并且公开授权策略允许该字段。任一检查失败都返回 hidden，不自动回退到其他 version。

### 6.2 entity-version aggregate

`contact_review_entity_versions` 唯一键为 `(ownerId, entityType, entityId, entityVersion)`，保存：

- `schemaVersion`、`ownerId`、`entityType`、`entityId`、`entityVersion`；
- `requiredFields`：按实体类型服务端 allowlist 排序后固化；
- `fieldReviews`：以 field 为键，每项仅含 `taskId`、`reviewKey`、`fieldStatus`、必要 decision receipt；
- `aggregateStatus`、`aggregateRevision`、`requiredFieldsDigest`；
- `appealUsedAt`、`appealRequestId`：均 nullable；第一次版本级申诉创建时在同一事务一起写入，此后不可清空、替换或重复使用；
- `basePublishedVersion`、`supersedesVersion`；
- `createdAt`、`updatedAt`、`deletedAt`、`restoredAt`、`lastAuditEventId`。

`basePublishedVersion` 是创建候选时主实体当时的 `activePublishedVersion`；create 时为 null。它表示候选基于哪个公开快照，不是当前公开指针。`supersedesVersion` 仅表示本候选原子替换的前一个 rejected candidate；没有被替换的候选时为 null；它绝不表示当前公开快照。被引用的旧 aggregate 仍保持 `rejected`，不增加新状态，只因主实体 pending pointer 已改指新版本而失去当前候选资格。

`fieldReviews` 的键集合必须与 `requiredFields` 完全相等；每个 taskId/reviewKey 必须反向匹配相同 owner/entity/version/field。缺少 required field、额外 field、重复 task/reviewKey、错误 ref、digest 不一致、未知状态或 aggregate 无法重算时，aggregate 只能 fail-closed，不能公开。

deleted 由删除事务优先设置，不能被字段结果覆盖。对非 deleted aggregate，`aggregateStatus` 必须按以下确定性优先级重算，客户端不能传入或覆盖：

1. 全部 N 个 required field tasks 均为 `published` -> `published`。
2. 任一 required field 为 `appeal_pending` -> `appeal_pending`。
3. 任一 required field 为 `needs_manual_review` -> `needs_manual_review`。
4. 只有全部 N 个 required fields 都已完成普通决定、状态集合是 `{published,rejected}` 的非空子集，且至少一个为 `rejected` -> `rejected`。
5. 其他任何包含 `pending_review`、`draft`、missing、duplicate、unknown、错误 ref/digest 或事务不完整的组合 -> `pending_review/fail-closed`。

因此 `rejected + pending_review`、`rejected + draft` 或 rejected 与任何不完整字段并存时，aggregate 必须是 `pending_review`，普通审核继续完成其余字段；在达到第 4 条前不得创建申诉、不得切换 active pointer，也不得改变旧 approved snapshot。

### 6.3 四场景生命周期赋值矩阵

下表中的 `N` 为当前版本号，`N+1` 为服务端严格递增的新版本。主实体是唯一公开指针 holder；aggregate 的 base/supersedes 只记录候选关系。

| 场景 | 主实体指针 | aggregate 与公开行为 |
| --- | --- | --- |
| create v1 | `currentVersion=1`；`activePublishedVersion=null`；`pendingReviewVersion=1`；`publicVisibility=hidden` | v1：`base=null`、`supersedes=null`、`aggregateStatus=pending_review`；N/N 通过后同一事务设 active=1、pending=null、visibility=published |
| edit 已发布 vN -> vN+1 | `currentVersion=N+1`；active=N；pending=N+1；visibility=published | vN+1：`base=N`；无待替换旧候选时 supersedes=null；vN 内容和公开指针保持不变；vN+1 未 N/N 时公共端只返回完整 vN |
| active review 候选 | active=N；pending 指向 aggregateStatus 属于 `activeReviewStatuses` 的当前版本；visibility=published（若 vN 仍公开） | `field A=rejected + field B=pending_review` 按 §6.2 仍为 pending_review，继续普通审核且不可申诉；旧 vN 原样公开；该候选再次编辑固定返回 409 |
| fully-decided rejected 候选未选路径 | active=N；pending 仍指向 rejected vN+1；visibility=published；rejected 非 active | 全 N 仅含 published/rejected 且至少一个 rejected；`appealUsedAt=null` 时才允许同版本申诉或 edit 新版本；普通 rejected 不清 pending |
| rejected vN+1 申诉 | active=N；pending 仍为 N+1；visibility=published | 同版本所有 rejected requiredFields 原 task 进入 appeal_pending 并一次写 `appealUsedAt/appealRequestId`；终审后按 §6.2 完整重算：只有 N/N published 才 active=N+1、pending=null；若仍有 rejected 则 aggregate=rejected；若防御性发现其他 manual/pending/incomplete，则回到 needs_manual_review 或 pending_review，active/pending 不切换 |
| rejected vN+1 后 edit -> vN+2 | active=N；pending=N+2；visibility=published | vN+2：`base=N`、`supersedes=N+1`；vN+1 保持 rejected 历史状态并失去当前候选资格；vN 继续公开 |
| delete | active 可保留为审计/恢复基线；pending=null；visibility=deleted | 当前候选及其未决字段 task 原子转为 `deleted`；公共查询忽略 active；不得因保留 active 而公开 |
| restore | currentVersion 严格递增；active 保留旧基线但被 hidden 屏蔽；pending=N+1；visibility=hidden | 新 aggregate：`base=旧 active`、`supersedes=null`；完整重新审核；N/N 通过后才将 active 切到新版本、pending=null、visibility=published |

所有字段决定、aggregate 重算、主实体指针、状态与 audit 必须同一事务完成。事务失败全部回滚或保持原安全快照；任何时点不得出现双 active snapshot、部分新版本公开、aggregate published 但缺字段，或公开指针指向未批准版本。

## 7. CloudBase 持久化、索引、事务和幂等合同

本节是待实现、待平台验证的精确结构合同，不是已部署证明。数据库延期解除仅适用于 ISSUE-0036，实际 collection、权限、事务、清理和观察仍是后续门禁。

### 7.1 Collections

1. `contact_review_tasks`：一条记录只承载一个 owner/entity/version/field 的字段 task、状态、triage/second reviewer 与字段决定重试幂等元数据。
2. `contact_review_entity_versions`：一条记录承载一个 entity version 的 requiredFields、field task/reviewKey 引用、aggregate 状态和 base/supersedes 关系；不持有主实体公开指针。
3. `contact_review_idempotency`：版本分配前的 provider-neutral 操作幂等 receipt；不复制正文或联系方式。
4. `contact_review_audit_events`：追加式最小状态、账号、版本、聚合和公开切换审计。

四者均不得保存原文、命中片段、完整联系方式、未成年人正文、prompt、Secret 或 token。只保存内部授权标识、contentHash、ruleVersion、keyed digest 和必要状态元数据。

### 7.2 tasks schema

字段列必须存在，但 pending 状态下的决定字段、second 字段和时间字段允许为 null；“required field”不等于每个时刻 NOT NULL：

`_id`、`schemaVersion`、`ownerId`、`entityId`、`entityType`、`field`、`entityVersion`、`contentHash`、`ruleVersion`、`classification`、`status`、`appealMode`、`idempotencyKeyHash`、`createdAt`、`updatedAt`；这里的 `idempotencyKeyHash` 只服务字段 claim/决定重试，不承担 create/edit/restore/delete/appeal 的操作级去重。

可空或按状态必填：`queueRole`、`assignedAt`、`dueAt`、`triageReviewerRef`、`triageReviewerRole`、`claimAt`、`secondReviewerRef`、`secondReviewerRole`、`decision`、`reasonCode`、`decidedAt`、`deletedAt`、`restoredAt`、`lastAuditEventId`。

`classification` 只能来自服务端固定分类集合并与 `ruleVersion` 一起记录来源；客户端不得传入未知 classification。普通 task 的 triage reviewer 可为 null；申诉 claim 后必须为有效 primary/backup，申诉终审后 second 字段必须满足 §4.2。

### 7.3 entity_versions schema

字段列：`_id`、`schemaVersion`、`ownerId`、`entityType`、`entityId`、`entityVersion`、`requiredFields`、`fieldReviews`、`aggregateStatus`、`aggregateRevision`、`requiredFieldsDigest`、`basePublishedVersion`、`supersedesVersion`、`appealUsedAt`、`appealRequestId`、`createdAt`、`updatedAt`、`deletedAt`、`restoredAt`、`lastAuditEventId`。

唯一非空规则：owner/entity/type/version、requiredFields、fieldReviews、aggregateStatus、aggregateRevision、digest 和创建时间必须存在；base/supersedes 可为 null；`appealUsedAt/appealRequestId` 必须同时为 null 或同时非空；删除/恢复时间按场景可为 null。禁止在本 collection 增加或解释 `activePublishedVersion`、`pendingReviewVersion`、`publicVisibility` 为第二公开/待审指针。当前候选唯一性只来自主实体的单一 `pendingReviewVersion` 和受 CAS 保护的 `entityRevision/currentVersion`。

### 7.3.1 idempotency schema

`contact_review_idempotency` 的精确字段为：`_id`、`scopeKey`、`idempotencyKeyHash`、`requestHash`、`operation`、`ownerId`、`entityType`、`entityId`（create 分配并提交前可为 null）、`entityVersion`（版本分配并提交前可为 null）、`resultCode`、`resultRef`、`resultDigest`、`createdAt`、`completedAt`。`requestHash/resultDigest` 只对规范化请求和脱敏结果做 keyed digest，不保存正文、联系方式、token 或可逆输入。

`scopeKey` 固定为：create=`ownerId|entityType|create`；edit/restore/appeal/delete=`ownerId|entityType|entityId|operation`；resumeAppealReview=`ownerId|entityType|entityId|resumeAppealReview|appealRequestId`。同一 `(scopeKey,idempotencyKeyHash)` 与相同 `requestHash` 只返回首次提交的 `entityId/entityVersion/resultCode/resultRef/resultDigest`，不得新增版本、appeal、task、aggregate、audit、邮件或其他副作用；同 key 但不同 `requestHash` 返回 `409 IDEMPOTENCY_KEY_REUSED`。

### 7.4 audit schema

`contact_review_audit_events` 至少保存 `_id`、`schemaVersion`、`taskId`、`aggregateId`、`eventType`、`fromStatus`、`toStatus`、`ownerId`、`entityId`、`field`、`entityVersion`、`contentHash`、`ruleVersion`、`operatorRole`、`operatorRef`、`triageReviewerRef`、`triageReviewerRole`、`previousTriageReviewerRef`、`previousTriageReviewerRole`、`secondReviewerRef`、`secondReviewerRole`、`appealMode`、`appealRequestId`、`appealedFieldSetDigest`、`fieldDecisionMap`、`decision`、`reasonCode`、`resumeReasonCode`、`dependencyRecoveryRef`、`idempotencyKeyHash`、`occurredAt`、`claimAt`、`resumedAt`、`decidedAt`、`requiredFieldsDigest`、`aggregateRevision`、`aggregateStatusBefore`、`aggregateStatusAfter`、`previousPublishedVersion`、`nextPublishedVersion`、`previousPublicVisibility`、`nextPublicVisibility`、`previousEventDigest`、`eventDigest`。`fieldDecisionMap` 仅记录每个 appealed field 的 taskId、triage/second 受控引用、published/rejected 决定与 reasonCode，不记录字段正文；resume/handoff audit 必须记录 previous/new claimant、原因、恢复证据引用与时间。

审计追加后不可由业务流程修改；更正通过新事件完成。审计身份只引用受控账号标识，不写 Secret、token、联系方式或原文。

### 7.5 Unique indexes

- `tasks_owner_entity_version_field_unique`：ownerId + entityId + entityVersion + field，唯一。
- `tasks_field_decision_idempotency_unique`：ownerId + entityId + entityVersion + field + idempotencyKeyHash，唯一；只用于字段 claim/决定重试，不支持 create/edit/restore/delete/appeal/resumeAppealReview。
- `tasks_status_dueAt`：status + dueAt。
- `tasks_content_rule_version_field`：contentHash + ruleVersion + field。
- `entity_versions_owner_entity_version_unique`：ownerId + entityType + entityId + entityVersion，唯一。
- `idempotency_scope_key_unique`：scopeKey + idempotencyKeyHash，唯一；不含 entityVersion。
- `audit_task_occurredAt`：taskId + occurredAt。
- `audit_owner_entity_version_time`：ownerId + entityId + entityVersion + occurredAt。

不建立 aggregate 层的 pending 唯一索引、专用 pending 标记、第二公开指针或虚构 partial index。唯一当前候选由主实体单一 `pendingReviewVersion` 配合 `entityRevision/currentVersion` 的锁定与 CAS 事务前置条件保证；aggregate 只保留 `(ownerId, entityType, entityId, entityVersion)` 唯一键，这不构成第二指针。

部署前必须提供索引存在性、唯一约束、查询计划或等价平台证据。索引缺失、权限错误、唯一性无法证明或查询无法限定 owner/entity/version 时停止生产启用。

### 7.6 Transaction 与幂等

所有 create/edit/restore/appeal/delete/resumeAppealReview 操作先按 §7.3.1 计算 scopeKey、`idempotencyKeyHash/requestHash`，再在同一事务内锁定或读取主实体并校验 expected `entityRevision/currentVersion`。事务前置矩阵固定为：

1. create 在主实体尚不存在时合法；若已由相同幂等 receipt 完成则只返回原结果。
2. create/edit/restore 准备分配版本前，若 `pendingReviewVersion` 指向 `activeReviewStatuses`，返回 `409 REVIEW_VERSION_CONFLICT`；其中 `appealMode=true/needs_manual_review` 只允许授权 reviewer 执行 resumeAppealReview，不允许 owner edit。若 pending 指向 fully-decided rejected，只允许 §5.3 的 appeal 或 edit；若为 null，则按主实体合法源状态执行 create/edit/restore。
3. edit fully-decided rejected candidate 时，在同一事务创建更高版本、全量 N 个 task 与 aggregate，并把 pending 改指新版本；旧 aggregate 保持 rejected。appeal rejected candidate 时必须再次验证全部 N 仅含 published/rejected 且至少一个 rejected；不分配新版本，只在同一版本创建一次版本级 appeal receipt 并转移全部 rejected fields。混合 rejected+pending/draft/incomplete 固定返回 `409 APPEAL_NOT_READY`。
4. delete 是 owner 的独立合法操作：无论 pending 指向 active review 或 rejected，都在同一事务清 pending、将当前候选 aggregate/未决字段 task 置 `deleted`、设置 visibility=deleted 并写 audit。

操作幂等保留记录、版本分配、恰好 N 个 task/reviewKey、aggregate、主实体指针/CAS、audit 与最终 result receipt 必须同一事务提交。失败全部回滚，不留下“处理中”孤儿 receipt。并发唯一冲突方不得再次分配版本：只能在首次事务完成后只读相同 `requestHash` 的既有完成结果，或在结果尚不可见时明确重试/返回 `503 REVIEW_UNAVAILABLE`；不同 requestHash 固定返回 409。CAS 失败使 idempotency/task/aggregate/pointer/audit 全部回滚。

普通字段决定事务：读取 task、主实体和 aggregate，校验 expected revisions、owner 自审、role、appealMode、状态、contentHash 与 requiredFields 引用；写字段状态、audit，并严格按 §6.2 优先级重算 aggregate 和必要主实体指针。`field A=rejected + field B=pending_review` 必须得到 aggregate=pending_review，继续 B 的普通审核且不可申诉；只有 B 也完成后，若全 N 仅含 published/rejected 且至少一个 rejected，aggregate 才转为 rejected。任一步都不改变旧 active snapshot。

版本级申诉创建事务必须验证：主实体 pending 正指该 rejected entityVersion、`appealUsedAt/appealRequestId` 均为空、客户端没有选择字段子集，并从 aggregate 锁定读取当前全部 rejected requiredFields。每个 rejected field 优先复用原 task，原子 `rejected -> appeal_pending` 并设置 `appealMode=true`；已 published requiredFields 保持 published。字段集合缺失、多余、重复或包含非 rejected field 时整体拒绝，不写部分 task。

申诉 claim/triage 事务只允许 primary/backup：校验 pending、appealRequestId、appealMode、expected revisions 与账号权限后，原子写 triageReviewerRef/role、claimAt 和 claim audit；所有 appealed fields 与 aggregate 均保持 appeal_pending。handoff 使用 CAS 并记录 previous/new claimant，不得写 second/decision 字段。

`resumeAppealReview` 事务只允许 primary/backup 对 `appealMode=true/needs_manual_review` 执行：复用原 appealRequestId 与操作幂等 receipt，不创建 appeal、不清 appealUsedAt；锁定核验失败原因已修正或 dependencyRecoveryRef 有效后，将全部 appealed fields 与 aggregate 原子 `needs_manual_review -> appeal_pending`。可保留原 triage，或审计化更新 triageReviewerRef/role/claimAt；audit 写 previous/new claimant、resumeReasonCode、dependencyRecoveryRef、resumedAt。重复 resume 返回原结果；非法角色、原因未解除、字段集合不一致或 CAS 冲突保持 needs_manual_review，零部分决定。事务/存储/audit 不可用返回 503 并保持全部状态不变。

申诉终审粒度为逐字段；second reviewer 可在一次 API 调用提交覆盖全部 appealed fields 的决定向量，每项只能为 `published` 或 `rejected` 且必须有 reasonCode。对每个 appealed field 均读取并校验现有 `triageReviewerRef`、`triageReviewerRole`、`claimAt`，再校验 `secondReviewerRef` 非空、`second!=当前 triage`、二者均不等于 owner、triage 角色有效且 second 具备 second-review 权限。任一字段、账号、角色、reason、revision、字段集合或审计校验失败，整个决定向量不得部分落账；事务可用时全部 appealed fields 与 aggregate 一致转为 `needs_manual_review` 并记录失败审计，事务/存储/audit 不可用时返回 503、全部回滚并保持原 `appeal_pending`。

全部申诉字段决定在同一事务写入后必须按 §6.2 对全部 N requiredFields 防御性重算：全部 N 均 published 时 aggregate=published，并原子切 active、清 pending；若全 N 仅含 published/rejected 且至少一个 rejected，则 aggregate=rejected，保留 `appealUsedAt/appealRequestId` 和当前 pending，后续只允许 edit 新版本；若发现任一其他 field 为 needs_manual_review，则 aggregate=needs_manual_review；若发现 pending_review/draft/missing/duplicate/unknown/incomplete，则 aggregate=pending_review/fail-closed。后两种防御分支均不切 active/pending，旧 approved snapshot 保持不变。审计必须同时记录版本级 appealRequestId、appealed field 集合摘要及每字段 triage/second/decision/reason 映射。

最后一个 required field 通过时，必须在同一事务验证 N/N、无缺失/重复/pending/manual/rejected/appeal、aggregateRevision 未变化，再将主实体 active 指针切换到候选版本、清空 pending、设置 visibility=published。任一步失败则保持旧快照或 hidden，不允许部分提交。

edit/delete/restore 与 aggregate、task、audit、主实体指针的写入必须原子；删除后保留的 active 只能作为审计/恢复基线，公共查询永远因 visibility=deleted 返回 hidden。

## 8. 隐私、安全、未成年人和失败路径

- 联系方式默认 hidden；owner 私有查看与公共/其他账号查询严格分离。
- 未成年人正文、联系方式、命中片段不复制到 queue/audit，不出域，不进入 AI/OCR/provider。
- owner 自审、second=triage、second=owner、缺少角色/权限、audit 不可写、collection/transaction 不可用、状态或版本冲突均 fail-closed。
- 失败路径不得自动发布、自动拒绝、恢复旧 deleted 公开指针或改变聊天授权；安全快照保持原状，必要时转 `needs_manual_review` 并告警。
- 公共查询必须防止 N-1/N、missing、duplicate、pending、manual、rejected、appeal、deleted、unknown 任何变体泄露。
- 客户端不可指定 `publicVisibility`、active/pending pointer、aggregateStatus、reviewer 身份或已批准版本；服务端只接受授权范围内的操作。
- 发现跨账号泄露、审核绕过、联系方式泄露、审计丢失、错误公开、删除后复活、未经授权出域或双人控制失效，立即关闭 feature flag 并停止生产准备。

### 8.1 清理、恢复和保留

- `completedDecisionStatuses` 中的 task 元数据保留 30 天，到期由幂等 cleanup job 清理；清理失败告警并留 audit，不得因失败重新启用 task 或公开状态。
- audit metadata 保留 180 天；legal/complaint hold 可跳过清理，hold 创建、延长、解除和清理结果均可审计。
- 已清理 task 不允许凭空恢复。主实体仍存在时，恢复只能创建严格更高的新 entity version 和全量新 task；不得复用旧 reviewKey、旧决定或旧公开指针。
- 清理 job 无权改变主实体 active/pending/public pointer；任何 pointer 变更只能由受控事务完成。

## 9. UI、API、审核队列与申诉分流

UI/API 必须显示安全状态，不把 pending/manual/rejected/appeal/deleted 显示为已发布或重新公开。owner 可在私有界面查看自己的联系方式，公共页面和其他账号不得看到。字段已 rejected 但 aggregate 仍因其他字段未完成而为 pending_review 时，owner 只看到“审核仍在进行”，不得出现申诉入口。申诉按钮仅在主实体 pending 指向 fully-decided rejected entityVersion 且 `appealUsedAt=null` 时显示；owner 只提交版本级申诉，不可勾选字段。审核 UI 将该版本全部 rejected requiredFields 作为不可删减集合展示，已 published fields 只读且不重开；second reviewer 必须一次提交完整逐字段决定向量。编辑按钮在 final rejected 候选时创建新版本并原子转移 pending；appeal_pending 或 appealMode=true/needs_manual_review 时 owner edit 返回 409。

`resumeAppealReview` 只出现在 primary/backup 队列：界面显示原 appealRequestId、脱敏失败原因、依赖恢复状态和当前 triage，不允许创建新 appeal 或填写最终决定。合法 resume 可保留 claimant 或发起审计化 handoff；成功后恢复为 appeal_pending，非法/并发 resume 保持 needs_manual_review。

队列 owner：普通 task 由 primary/backup 负责 claim/处理，backup 只在超时或不可用条件下接管；申诉 task 的 triage/resume 仍由 primary/backup 完成，最终由 second reviewer 完成。claim 使用原子 compare-and-set，只写 claim/triage 信息与 audit 并保持 appeal_pending；SLA 超时进入 needs_manual_review 后，由 primary/backup 在原因解除后 resume，必要时审计化 handoff。dueAt、previous/new claimant、接管角色、原因和 dueAt 重算均写 audit。没有生产人工 owner/备援/二审账号时只可本地或预生产验证，不能启用生产 flag。

## 10. 部署、观察、停止与回滚

- feature flag 默认关闭；schema/index/preflight 和权限验证通过后，先预生产，再小范围灰度，连续观察窗口目标为 24 小时。
- 观察指标至少包括：公共错误公开数、跨账号可见性、N/N 聚合完整性、事务冲突、审核队列可用性、audit 写入、cleanup、申诉双人约束、联系方式隐藏和系统 5xx。实际阈值、owner 和告警接收人须另有可核验证据。
- 任意跨账号泄露、owner 自审、second/triage 同账号、错误公开、双 active、审计丢失、事务部分提交、queue 不可用或回滚错误，立即停止灰度并关闭 flag。
- 唯一生产回滚点是平台部署记录中的上一稳定 revision；不得用本地 commit 猜测生产 revision。回滚顺序为关闭 flag、停止副作用、保留 audit、确认公开端 hidden/旧 approved snapshot 安全，再回到平台记录的上一稳定 revision。
- 未执行真实回滚演练不得声称回滚已通过；预生产/灰度/生产证据必须区分。

## 11. 分层证据矩阵

| 阶段 | 必须证明 | 责任角色/证据 |
| --- | --- | --- |
| 作者/文档 | v2 完整合同、hash、无 secret、范围不扩张 | 产品经理；本文件与 Hermes report |
| Document QA | 全部 SERIOUS 批次整改、old/new 位置、无关 diff | 已登记 Document QA；整改 ledger |
| 用户确认 | v2 精确字节与生产边界确认 | 业务方；独立确认记录 |
| 实现 | 仅 ISSUE-0036；字段 task/aggregate、四指针矩阵、双人控制、API/UI、清理/回滚接线 | 原注册开发/UI owner；分支、diff、commit |
| 本地/集成 | 单元、事务、幂等、跨账号、N/N、N-1/N、并发、删除恢复、清理和失败路径 | 开发 owner；测试/构建/typecheck/lint 收据 |
| 独立技术复核 | standards/spec/security P0/P1/P2 与 commit attestation | 独立复核 owner；独立报告 |
| 平台/预生产 | collection/schema/index/permission/transaction、人工账号映射、feature flag、preflight | 平台/运维 owner；平台记录，不能用截图名称存在代替值/权限 |
| 生产 | smoke、跨账号、公开快照、双人申诉、观察窗口、停止条件、回滚演练 | 生产验证 owner；可复核生产证据 |
| 产品/业务 | 用户可见文案、联系方式默认隐藏、人工 SLA/申诉路径、残余风险接受 | 产品经理/业务方；产品验收记录 |
| Issue 关闭 | 独立关单审查、所有 blocking Open Issue 关闭 | Issue 管理员；canonical state 记录 |

任一层证据不能替代其他层。分支完成不等于生产通过，生产通过不等于业务验收，业务验收不等于 Issue 已关闭。

## 12. 可测试验收标准

### 12.1 聚合与公开门

1. create v1：1/N、N-1/N、缺失、重复、pending、manual、rejected、appeal、deleted、unknown 均不公开；只有 N/N 全部 published 才原子公开。
2. edit 已发布 vN：vN+1 任一失败时，公开端继续返回内容完全不变的 vN；不得混入 vN+1 字段、摘要、命中或缓存。
3. vN+1 N/N 通过时，active pointer、aggregate、field decision、audit 和 visibility 同事务切换；并发读取只能看到完整 vN 或完整 vN+1。
4. ref 错 owner/entity/version/field、requiredFieldsDigest 漂移、额外/重复 task/reviewKey、aggregateRevision 冲突必须 fail-closed。
5. 任意时点只能有一个 active public pointer；公共查询不能按最高 version 猜测或绕过主实体指针。
6. field A 普通决定 rejected、field B 仍 pending_review 时，aggregate 必须保持 pending_review、申诉 API 返回 `409 APPEAL_NOT_READY`、旧 active snapshot 不变；只有 B 也完成普通决定且全 N 仅含 published/rejected 时，aggregate 才可成为 rejected。

### 12.2 双人申诉与权限

1. 一个版本有多个 rejected requiredFields 时，首次申诉必须将它们全部原子转入 appeal_pending；已 published requiredFields 保持 published 且 task/revision 不变。客户端提交子集、额外字段、重复字段或已 published field 必须返回 `422 APPEAL_FIELD_SET_INVALID`，不得生成 appeal receipt 或部分转移。
2. 每个 rejected entityVersion 只能创建一个版本级 `appealRequestId`；重复或并发申诉只有一个成功，其余返回原幂等结果或 `409 APPEAL_ALREADY_USED`。编辑成功改指新版本后，旧 rejected version 即使 `appealUsedAt=null` 也不可再申诉。
3. primary/backup 可逐字段 claim/triage；second reviewer 一次提交覆盖全部 appealed fields 的决定向量。逐字段 mixed decision 可被接收：若全部 requiredFields 最终 published 才原子公开；任一仍 rejected 则 aggregate rejected、旧 active snapshot 不变且后续只允许 edit。
4. 对决定向量中的每个 field 验证 triage/second 非空、`second!=triage`、二者均不等于 owner、角色/权限有效、reasonCode 存在。任一 field 失败时全部 appealed fields 均不得部分 published/rejected，并按 §7.6 fail-closed 到 needs_manual_review；账号、决定、时间、版本级 appealRequestId 与每字段映射写入同一审计事务。
5. 普通 `appealMode=false` task 的 primary/backup 不能获得申诉终审权限；非法模式切换、遗漏决定、重复终审或客户端伪造 reviewer 字段均被拒绝。
6. primary/backup 合法 claim 只写 triage ref/role、claimAt 与 audit，task/aggregate 仍为 appeal_pending；claim 本身不得转 needs_manual_review。
7. 错误 second、缺 reason、wrong role 或字段向量错误在事务可用时使全部 appealed fields 与 aggregate 原子进入 needs_manual_review；事务/存储不可用返回 503，字段、aggregate、claim、指针与 audit 零变化。
8. primary/backup 在失败原因解除后以原 appealRequestId 执行 `resumeAppealReview`，全部 appealed fields 与 aggregate 原子恢复 appeal_pending；不创建新 appeal、不清 appealUsedAt。重复 resume 返回原结果；非法角色、原因未解除、字段不一致或并发冲突保持 needs_manual_review。
9. resume 保留原 triage 或 handoff 给另一 primary/backup 时，audit 必须记录 previous/new claimant、reason、dependency recovery reference 与 time；纠正后 final second reviewer 必须不同于当前 triage 与 owner，并可完成完整决定向量。primary/backup 仍不得最终 published/rejected。

### 12.3 生命周期、事务和清理

1. create/edit/appeal/delete/restore 逐项验证第 6.3 指针矩阵，包含 base/supersedes、active/pending、currentVersion、visibility、appealUsedAt/appealRequestId 和旧快照行为。pending 指向普通 active review 时 edit=409；appeal_pending/appealMode=true needs_manual_review 期间 owner edit=409；fully-decided rejected 时只允许一次申诉或 edit；published/delete 清 pending，普通 rejected 不清 pending。
2. create/edit/restore/appeal/delete 对同 scope 同 key+同 requestHash 重试，必须返回原 entityId/entityVersion/result 且版本、task、aggregate、audit 数量不增加；同 key+不同 requestHash 返回 `409 IDEMPOTENCY_KEY_REUSED`。并发唯一冲突不得再次分配版本，也不得留下处理中 receipt。
3. 主实体 CAS 并发测试覆盖：两个 edit 只能一个创建新版本；rejected 上 appeal 与 edit 竞争只能一个成功；失败方全回滚。aggregate 中不存在 pending 唯一索引/第二指针，唯一候选始终等于主实体 `pendingReviewVersion` 指向版本。
4. 同一字段重复提交、最后两个字段并发完成、claim 接管和字段决定幂等重试均只产生一个有效副作用和一条可回放审计链；task 级幂等索引不得去重 create/edit/restore。
5. 删除立即 hidden；restore 生成更高新版本并保持 hidden，N/N 前不能公开联系方式或聊天授权。
6. 30 天 task 清理、180 天 audit 清理、legal hold、部分失败、重试和清理后恢复均有可判定合成测试；已清理 task 不可凭空恢复。

### 12.4 生产证据

需分别取得 UI review、跨账号权限验证、CloudBase transaction integration、预生产 smoke、生产观察和真实回滚演练证据。没有实际账号绑定、平台 revision 和持续观察证据，不得写 PRODUCT_ACCEPTANCE 或 ISSUE_CLOSED。

## 13. 停止、重开和不能声称

发现越权公开、联系方式/未成年人泄露、双人控制失效、审计缺失、owner 自审、删除后复活、双 active、事务部分提交、未经授权出域、平台回滚点不明或业务撤回关键默认时，保持 ISSUE-0036 open，关闭生产 flag，回到原 owner 修复并重新取证。

本阶段不得声称：生产人工闭环已启用、AI/OCR/provider 已上线、schema/index/transaction 已部署、真实观察已完成、回滚已演练、生产或业务验收已通过、ISSUE-0036 已关闭或项目 workflow 已完成。

## 14. 当前门禁与唯一下一步

当前状态：`HERMES_ROUND_3_PENDING / USER_CONFIRMATION_PENDING`。

未通过或未证明：v2 focused Hermes Round 3、用户对 v2 修订后精确字节确认、实际 reviewer 账号与权限绑定、schema/index/transaction/清理实证、UI/API 接线、预生产与生产 revision、24 小时观察、停止/告警 owner、真实回滚演练、独立生产复核、产品/业务最终验收和 Issue 管理员关单。

唯一下一步：项目总负责人冻结本次 Document QA 输出的精确 hash，并组织 focused Hermes Round 3/3 仅复核 Round 2 S-1/S-2 严重修订及必要回归；Document QA 不自行运行 Hermes、不自我批准，也不进入实现、数据库、平台或部署。
