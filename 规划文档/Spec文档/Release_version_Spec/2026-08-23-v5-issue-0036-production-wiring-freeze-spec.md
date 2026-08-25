# V5 / ISSUE-0036 生产接线冻结包（作者草案）

状态：DRAFT_NON_CANONICAL / AUTHOR_FROZEN / HERMES_REVIEW_PENDING  
文档类型：生产接线冻结附件，不替代 V5 closing Spec  
审查预算：MAX_REVIEW_ROUNDS=3；CURRENT_REVIEW_ROUND=1/3  
唯一 Issue：ISSUE-0036  
当前项目 workflow：WORKFLOW_ACTIVE  
作者：产品经理 Agent v2.3.2 / 019fefa7-9883-7af2-bdb5-acc5c8513781

## 1. 目的与状态边界

业务方已确认采用保守默认方案，原话为“先这样，边做边看，有问题再改”。本附件把该确认转换为 ISSUE-0036 的生产接线候选合同，供代码、UI、平台、独立复核和产品验收分别取证。

本附件是用户解除生产约束后产生的 materially new scope，独立使用本附件的 1/3 审查计数。原 2026-08-15 V5 closing Spec 的既有 2/3 计数、字节和审查证据不被重置、不被修改。本附件任何后续修订仍消耗本附件的同一 3 轮预算。

本附件不是实现完成、平台配置完成、部署完成、生产通过、业务最终验收或 Issue 关闭证明。feature flag 默认关闭；没有完整生产输入和分层证据时，生产副作用必须保持关闭。

## 2. 事实来源与冻结上游

| 来源 | 精确绑定 | 用途 |
| --- | --- | --- |
| V5 closing Spec | 规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0036-联系方式审核关闭-spec.md；SHA-256=F37E6AD7BB24F3C52561413B53735FA7B09F2BFFEC1CC2F111646087FF697844 | 唯一 Issue、既有状态机、隐私边界和分层关单门 |
| Hermes Round 2 | 报告 SHA-256=0ACA79D9AF9EAC9E10F6DD2F223E5E40255D5D52C8D9E1BC52AD2DB8D23427CE；metadata SHA-256=A6951EE1AD8F0657D197DB9D0F8675A22388FB74467CEAC8CFD35EDDD0E526CC | 原 V5 文档门已通过，SERIOUS=0 |
| ISSUE-0036 canonical | 协同工作文档/ISSUE/Open_Issue/ISSUE-0036-家长需求与老师资料的联系方式快速智能审核.md；SHA-256=1696FFBAF33E61F68A915F7D2580A07B4D4122E3194EF9B61ABDFCF27FA62804 | Issue 仍 open，生产人工 owner 和生产关闭证据需单独补齐 |
| 上游 V5 commit | 03da0015be0d2ee403d848f149814039759cfcd1；post-push attestation=PASS | 已推送 S2 技术候选，不等于生产接线通过 |
| S2 技术证据 | S2 独立代码复核 TECH_REVIEW_PASS，P0/P1/P2=0/0/0；聚焦 15/15，受影响 78/78，全量 636 passed / 1 existing skipped；typecheck/lint/build/diff-check 通过 | 证明本地/合成边界，不替代生产证据 |

本附件继承：ISSUE-0031、支付和其他 Issue 不纳入；AI、OCR、provider、额外出域继续关闭；首次访问 503 属于 out of scope，待 ISSUE-0036 关闭后另行处理。数据库延期解除只适用于 ISSUE-0036，不授权其他 Issue 的数据库动作。

## 3. 目标、非目标与用户可见结果

### 3.1 目标

在生产启用前，形成可核对的审核状态、人工队列、审计、幂等、申诉、删除恢复和发布隔离接线合同：

1. parent_need/childIntro 与 tutor_profile/abilityDescription 按 `ownerId + entityId + entityVersion + field` 分别形成字段级 task，并由同一 entity-version aggregate 汇总到 fail-closed 公开边界。
2. 一个实体版本的全部 `requiredFields` 均有且仅有一个字段 task，且全部字段 task 终态通过后，aggregate 才可原子进入 published 并切换公开指针；任一字段 missing、重复、pending、manual、rejected 或 appeal 均不公开新版本。
3. 人工审核有 primary、backup、second-review 三类最小角色，但实际账号绑定必须在部署前硬门完成。
4. 同一实体、字段、版本和内容不会因重试或并发产生重复副作用。
5. 删除、恢复、申诉和编辑不会绕过重新审核，也不会恢复未授权的联系方式或聊天权限。
6. 审计可回放但不复制原文、命中片段、完整联系方式、未成年人正文、Secret 或 token。

### 3.2 非目标

- 不把“边做边看”解释为放宽 fail-closed、隐私、独立复核或关单门禁。
- 不接 AI、OCR、provider、外部网络、额外数据出域或模型训练。
- 不自动公开、自动发布或自动拒绝；规则结果只产生待审核或人工状态。
- 不把真实人工账号、SLA、DPA、预算、production key 或 Secret 写入仓库或本附件。
- 不修改 ISSUE-0031、支付或其他 Issue，不做其他数据库迁移。
- 不处理首次访问 503，不以本附件替代独立运维 Issue。
- 不在本附件中宣称任何 schema、index、transaction、部署 revision 或回滚演练已经存在。

### 3.3 用户可见结果

创建、编辑或恢复后，用户看到待审核、需人工处理、被拒绝或申诉中的安全状态；不再看到未经审核内容被“已发布”或“重新公开”的误导性提示。用户不看到内部命中片段、模型分数、人工账号、其他用户资料或完整联系方式。删除恢复必须显示重新审核语义，联系方式默认不公开。

## 4. 角色与生产硬门

### 4.1 最小角色

| 角色 | 最小权限 | 禁止事项 |
| --- | --- | --- |
| primary reviewer | 领取普通审核任务、读取必要脱敏内容、提交普通审核决定；在申诉链中只可 claim/triage 并登记 primary 身份 | 不得审核自己的 content owner 内容；不得对 `appeal_pending` 或 `appealMode=true` 任务执行最终 published/rejected；不得改权限或直接发布联系方式 |
| backup reviewer | 在 primary 超时/不可用时领取和处理普通任务；在申诉链中只可 claim/triage 并登记接管身份 | 不得审核自己的 content owner 内容；不得对 `appeal_pending` 或 `appealMode=true` 任务执行最终 published/rejected；不得绕过审计、状态版本和二审规则 |
| second reviewer | 使用独立账号处理申诉、边界案例和被标记需二审任务，并对申诉执行唯一最终 published/rejected 决定 | 不得审核自己的 content owner 内容；不得与该申诉的 primary/backup claim 账号相同；不得删除审计或跳过状态机 |
| content owner | 查看自己的安全提示、提交编辑或申诉 | 不得自审、不得把自己的内容直接改为 published |
| system/queue worker | 只执行幂等入队、超时标记、清理和告警 | 不得自动发布、自动拒绝或改变人工决定 |

实际账号绑定、最小权限、备援关系、二审权限和审计身份是部署前硬门；缺失时可继续本地和预生产实现，但不得开启生产 flag。

### 4.2 SLA 与超时

- 普通人工审核目标：24 小时。
- 申诉处理目标：48 小时。
- 超时只保持或转入 needs_manual_review，并产生可审计的 overdue 事件。
- 超时不得自动 published、rejected、恢复联系方式或改变聊天授权。
- SLA 计时起点、工作日/自然日口径、告警接收人和升级路径必须在生产输入证据中落盘。

### 4.3 申诉双人控制

- 用户提交未编辑原内容申诉后，任务进入 `appeal_pending` 且 `appealMode=true`。primary 或 backup 只能 claim、核对任务完整性并 triage 到 `needs_manual_review`，不能写最终 published/rejected。
- 最终决定必须由绑定为 second reviewer 的不同账号完成；该账号不得等于 content owner，也不得等于该申诉记录中的 primary/backup claimant。角色非法、账号相同、账号映射缺失或审计身份不可用时一律 fail-closed，状态和公开快照均不改变。
- 每个申诉最终决定的审计事件必须同时记录 `appealMode`、`primaryReviewerRef`、`secondReviewerRef`、`decision` 和 `decidedAt`，并保留任务、owner/entity/version/contentHash 与前后状态。缺任一字段不得提交最终状态。
- 普通非申诉任务必须满足 `appealMode=false`，其 primary/backup 决定不自动获得申诉终审权限；把普通任务切换为申诉模式必须来自合法申诉转移，客户端不得指定。

## 5. 状态、申诉与发布合同

### 5.1 状态枚举

唯一状态：draft、pending_review、needs_manual_review、published、rejected、appeal_pending、deleted。

上述状态首先描述单个字段 task 的审核状态；实体是否公开只由 §5.4 的 entity-version aggregate 决定。单个字段 task 进入 published 只表示该字段审核通过，绝不等于整个实体版本可公开。

### 5.2 合法转移

| 触发 | 允许转移 | 保护 |
| --- | --- | --- |
| 新建或编辑提交 | draft -> pending_review | 写入新版本并生成幂等键；未完成审核不得公开 |
| 输入错误 | 任一编辑草稿 -> draft | 只返回可修正提示，不泄露规则命中 |
| 确定性候选或审核失败 | pending_review -> needs_manual_review | 服务、策略、队列和审计异常均 fail-closed |
| primary/backup 普通字段决定 | `appealMode=false` 的 field task：pending_review 或 needs_manual_review -> published 或 rejected | 必须有合法角色、版本条件、审计事件；字段 published 后仍须聚合 N/N，不得单独公开实体；不得处理申诉终审 |
| 未编辑原内容字段申诉与初审 | field task：rejected -> appeal_pending -> needs_manual_review | 申诉不改变字段 content hash；primary/backup 只可 claim/triage，登记 primary 身份，不得写最终决定 |
| second reviewer 字段申诉终审 | `appealMode=true` 的 field task：needs_manual_review -> published 或 rejected | second reviewer 必须与 content owner、primary/backup claimant 均为不同账号；写完整双人审计并重算 aggregate；任一校验失败则字段/aggregate/公开快照不变 |
| 编辑后申诉 | rejected -> draft -> pending_review | 生成新版本，必须完整重审；不得沿用旧结果 |
| 编辑已发布内容 | entity aggregate：published(vN) -> pending_review(vN+1)，并创建 vN+1 的全部 required field tasks | 新 aggregate 与旧批准快照并存但严格隔离；vN+1 未完成 N/N 前不可进入公开 DTO、列表、详情、搜索或缓存 |
| 新版本聚合批准 | 最后一个 required field task published，且 aggregate 从非 published -> published(vN+1) | 字段决定、N/N 重算、审计和 active pointer 切换在同一事务完成；读者只能看到完整 vN 或完整 vN+1 |
| 新版本字段拒绝或申诉 | 任一 field task -> rejected/appeal_pending，aggregate 保持非 published | 当前 aggregate 的 activePublishedVersion 继续指向旧 approved vN；申诉遵守独立 second reviewer 门，其他字段通过不得触发替换 |
| 删除 | 任意可删除状态 -> deleted | 旧任务不能重新发布，保留必要审计 |
| 恢复 | deleted -> pending_review(new version) | 公开快照保持隐藏，重新计算规则、权限和版本；禁止 deleted -> published 或恢复旧公开指针 |

任何规则、AI（当前关闭）或客户端都不得直接产生 published/rejected。published 只代表具备合格人工决定和完整审计的状态，不代表内容可绕过既有双方授权公开联系方式。

### 5.3 申诉与编辑默认语义

本附件冻结两条安全路径，但不替业务方选择未来按钮命名：

- 未编辑原内容路径：用户提交原内容申诉，原 content hash 保持不变，进入 appeal_pending，再由 second reviewer 处理。
- 编辑后新版本路径：用户先形成 draft，生成新 version 和新 content hash，再进入 pending_review。
- 已发布内容编辑路径：以最后已批准 snapshot vN 为只读公开基线，创建独立新版本 vN+1 并进入 pending_review。公开端在 vN+1 获批前继续返回内容完全不变的 vN；不得把 vN+1 的字段、摘要、命中、状态或缓存片段暴露给非 owner。
- vN+1 的 requiredFields N/N 获批时，在同一事务内写最后字段决定、聚合审计并把 active published pointer 从 vN 原子切换到 vN+1；vN+1 任一字段被拒绝或进入申诉时，当前 aggregate 保持非 published，但 `activePublishedVersion=vN` 与 visible 不变，公开端继续解析并返回 vN。
- 用户删除时，必须在同一事务中立即把公开可见性置为 hidden、撤销 active published pointer 的公开读取并使未决新版本失效；恢复创建新的 pending_review 版本，公开仍保持 hidden，直至该新版本重新批准。
- 删除恢复：提示“恢复后需要重新审核”，不得显示“已重新公开”。
- 所有状态的联系方式默认不公开；公开列表只读取 published 且通过既有授权策略的内容。

### 5.4 字段任务到实体版本的聚合不变量

- 审核粒度冻结为 per-field task；不改回 per-entity task。每个字段 task 的唯一逻辑键为 `ownerId + entityId + entityVersion + field`，并通过服务端生成的 `reviewKey` 绑定到同一 entity-version aggregate。
- `requiredFields` 必须由服务端按实体类型的冻结字段 allowlist 生成并在该 entity version 建立时固化；客户端不得增删。每个 required field 必须恰有一个 task/ref。字段缺失、额外字段、重复 task/reviewKey、ref 指向其他 owner/entity/version 或 aggregate 与 task 的 requiredFields 不一致，均使 aggregate fail-closed，不得公开。
- 新建实体没有旧 approved snapshot 时，`activePublishedVersion=null`、`publicVisibility=hidden`。只有全部 N 个 required field tasks 均终态 published，且无 pending_review、needs_manual_review、rejected、appeal_pending、deleted、missing 或 duplicate，aggregate 才可在同一事务内进入 published、设置 `activePublishedVersion=entityVersion` 并切换 visible。
- 编辑已有 approved snapshot vN 时，为 vN+1 创建新的 aggregate 与全部 required field tasks；旧 vN 保持内容和公开指针不变。只有 vN+1 的 N/N 字段全部终态 published，才原子替换 active pointer；1/N、N-1/N、任一 rejected/appeal/manual/pending/missing/duplicate 或事务失败都继续公开 vN。
- 删除在实体 aggregate 层立即设置 hidden，并使该实体版本及其未决字段任务 stale/不可决定；恢复创建新 entity version aggregate 和全部 required field tasks，保持 hidden + pending_review，禁止复用旧字段 task 或直返 published。

## 6. CloudBase 持久化与事务合同

本节是待实现、待平台验证的精确结构合同，不是已部署证明。数据库延期已由业务方解除，但本合同仍需 schema、权限、transaction 和清理实证后才能进入生产。

### 6.1 Collection

生产候选 collection：

1. contact_review_tasks：每条只承载一个 `owner/entity/version/field` 的字段级审核任务、状态、operator 和幂等元数据。
2. contact_review_entity_versions：每条承载一个 entity version 的 requiredFields 聚合、字段 task/reviewKey 引用、aggregate 状态和实体级公开指针。
3. contact_review_audit_events：不可替代的最小字段决定、聚合重算和公开指针审计事件。

不复制原文、命中片段、完整联系方式、prompt、Secret、token 或未成年人正文到上述 collection。

### 6.2 contact_review_tasks schema

必需字段：

- _id、schemaVersion、ownerId、entityId、field、entityVersion；
- contentHash、ruleVersion、classification、status；
- queueRole、assignedAt、dueAt、appealMode；
- primaryReviewerRef、secondReviewerRef、decision、decidedAt；
- idempotencyKeyHash、createdAt、updatedAt、deletedAt、restoredAt；
- lastAuditEventId。

`contact_review_tasks` 不得保存 `requiredFields`、`aggregateStatus`、`activePublishedVersion`、`pendingReviewVersion` 或 `publicVisibility`，也不得单独驱动 public DTO。contentHash 与 idempotencyKeyHash 只保存服务端 keyed digest 或等价不可逆摘要；不得保存原始输入。ownerId/entityId 只使用应用内部授权标识，不写展示姓名、邮箱、手机号或聊天正文。

### 6.2.1 contact_review_entity_versions schema

必需字段：

- `_id`、`schemaVersion`、`ownerId`、`entityId`、`entityVersion`、`entityType`；
- `requiredFields`：按冻结 allowlist 排序并固化的完整字段集合；
- `fieldReviews`：以 field 为键，每项只含 `taskId`、`reviewKey`、`fieldStatus` 和必要的 field decision receipt；
- `aggregateStatus`、`aggregateRevision`、`requiredFieldsDigest`；
- `basePublishedVersion`、`supersedesVersion`、`activePublishedVersion`、`pendingReviewVersion`、`publicVisibility`；
- `lastAuditEventId`、`createdAt`、`updatedAt`、`deletedAt`、`restoredAt`。

`fieldReviews` 的键集合必须与 `requiredFields` 完全相等；每个 taskId/reviewKey 必须唯一并反向匹配同一 owner/entity/entityVersion/field。当前主实体 version 对应的 aggregate 是公开门唯一权威控制记录；公开读取只能沿其 `activePublishedVersion` 解析到目标旧/当前 aggregate，并再次验证目标 aggregate 的 requiredFields N/N 与 published 状态。旧 aggregate 只作不可变 approved snapshot/版本审计，不能自行恢复或改写公开指针。

`aggregateStatus` 的计算规则固定为：全部 required field tasks 终态 published 才可为 published；任一 rejected 为 rejected；任一 appeal_pending 为 appeal_pending；否则只要存在 needs_manual_review 为 needs_manual_review；任何 pending、missing、duplicate、未知或无法一致重算均为 pending_review/fail-closed。deleted 由实体删除事务单独置入，且优先于字段聚合结果。任何客户端传入 aggregateStatus 或公开指针均无效。

### 6.3 contact_review_audit_events schema

必需字段：

- _id、schemaVersion、taskId、eventType；
- fromStatus、toStatus、ownerId、entityId、field、entityVersion；
- contentHash、ruleVersion、operatorRole、operatorRef；
- idempotencyKeyHash、occurredAt、reasonCode；
- appealMode、primaryReviewerRef、secondReviewerRef、decision、decidedAt；
- aggregateId、reviewKey、requiredFieldsDigest、aggregateRevision；
- aggregateStatusBefore、aggregateStatusAfter、fieldStatusBefore、fieldStatusAfter；
- previousPublishedVersion、nextPublishedVersion、previousPublicVisibility、nextPublicVisibility；
- previousEventDigest、eventDigest。

operatorRef 只指向受控账号标识，不能把 Secret、token 或原文放进事件。审计事件追加后不得由业务流程修改；更正通过新事件完成。

### 6.4 Index

候选索引名称及用途固定为：

- tasks_owner_entity_version_field：ownerId + entityId + entityVersion + field，唯一，保证每个 required field 恰有一个 task；
- tasks_status_dueAt：status + dueAt；
- tasks_content_rule_version_field：contentHash + ruleVersion + field；
- entity_versions_owner_entity_version：ownerId + entityId + entityVersion，唯一；
- entity_versions_owner_entity_visibility：ownerId + entityId + publicVisibility + activePublishedVersion；
- entity_versions_owner_entity_pending：ownerId + entityId + pendingReviewVersion + aggregateStatus；
- audit_task_occurredAt：taskId + occurredAt；
- audit_owner_entity_version_time：ownerId + entityId + entityVersion + occurredAt。

部署前必须提供索引存在性、查询计划或等价平台证据；索引缺失、权限错误或查询结果无法限定到 owner/entity/version 时停止生产启用。

### 6.5 Transaction 与幂等

创建/编辑/恢复事务必须按 entity version 执行：读取当前主实体和权威 aggregate；校验 expected version；固化 requiredFields；为每个 required field 创建且只创建一个 task/reviewKey；写入 entity-version aggregate；写入对应 audit event；写入或确认各字段 idempotencyKeyHash。任一 required field 缺失、重复、ref 不一致或任一步失败则事务整体回滚，不产生 published、公开副作用、部分 aggregate 或孤立审核事件。

普通人工字段决定事务必须完成：读取指定 field task、当前 field status/version 与 `appealMode=false`；验证 primary/backup 角色与 content owner 不相同；校验幂等键和预期状态；在同一事务中写入该字段决定、重新读取并验证 aggregate 的完整 requiredFields/task refs、重算 aggregateStatus、按条件更新实体公开指针并写 audit。并发冲突返回可重试的人工处理结果，不覆盖后来版本，也不得在重算前公开。

申诉事务分两段门控：primary/backup claim/triage 只能登记 `primaryReviewerRef` 并把合法 `appeal_pending` 字段 task 送到 `needs_manual_review`；最终事务必须读取 `appealMode=true`、当前字段任务、entity-version aggregate 和 primary 身份，验证 operator 是 second reviewer，且 `secondReviewerRef != primaryReviewerRef`、`secondReviewerRef != ownerId`，再在同一事务中写字段 published/rejected、重算全部 requiredFields、按聚合不变量决定是否更新公开指针，并写包含 appeal mode、两名审核者、字段与聚合前后状态、决定、时间的审计事件。非法角色、同账号二审、content owner 自审、字段缺失或 stale version 均 fail-closed，不改变字段状态、aggregate、公开指针或内容。

编辑已发布内容的事务不得改写现有 approved snapshot：读取 `activePublishedVersion=vN` 与 expected version，为 vN+1 创建 entity-version aggregate 和全部 required field tasks，设置 `pendingReviewVersion=vN+1`、`aggregateStatus=pending_review` 并写编辑审计；`activePublishedVersion` 与 `publicVisibility=visible` 保持指向内容不变的 vN。只有 vN+1 的 requiredFields N/N 均终态 published 时，最后一个字段决定、聚合 published、批准审计、旧版本 superseded 标记与 active pointer 切换才可在同一事务提交；失败则全部回滚并继续公开 vN。任一 vN+1 字段 rejected、appeal、manual、pending、missing 或 duplicate 均不得改变 vN 指针。

删除事务必须在 entity-version aggregate 原子设置 `publicVisibility=hidden`、阻止 active snapshot 被公开读取、使该实体所有未决字段 tasks stale/不可决定并写删除审计；缓存失效属于同一发布边界，失效不能证明时 fail-closed 为不公开。恢复事务创建新的 version aggregate 与全部 required field tasks，保持 hidden + pending_review，禁止恢复旧 active pointer、复用旧 task 或直接 published。

任一字段决定事务的提交单元固定为：字段 task 决定 + requiredFields 完整性/唯一性复核 + aggregate 重算 + 适用的实体公开指针更新 + audit event。禁止先提交字段 published 再异步聚合；缺字段、重复 task/reviewKey、并发 aggregateRevision 冲突、事务超时或 audit 失败均整体回滚，不得形成部分公开。

同一幂等键重复请求必须返回原操作结果且不新增副作用；不同 entity、version、contentHash 或 ruleVersion 必须形成不同隔离链。事务、唯一性、冲突和重试结果均需在集成测试与生产预检中证明。

## 7. Retention、删除与清理

- closed queue/task 元数据保留 30 天。
- audit metadata 保留 180 天。
- legal/complaint hold 可暂缓到期清理，必须记录 hold owner、原因、开始时间和解除事件。
- 到期清理只删除允许删除的最小元数据，不删除仍在 hold 或未关闭任务。
- 清理 job 必须幂等：重复运行不会造成错误状态；部分失败必须记录失败计数、任务范围和告警。
- 清理失败不重新启用 token、任务或公开状态，也不删除审计链来掩盖失败。
- 清理权限、执行身份、观察指标和恢复/重试证据必须在生产预检中单独取证。

## 8. API/UI 接线要求

### 8.1 API

创建、编辑、恢复接口不得继续直接写 published。服务端必须先完成字段白名单、规则审核、task/审计事务和状态返回；客户端传入的 status、operator、owner 或公开标记不得成为信任来源。

API 必须能区分 draft、pending_review、needs_manual_review、rejected、appeal_pending、deleted，并返回不泄露命中值的安全文案。服务不可用、审计失败、事务冲突、队列不可用和未知策略均 fail-closed。

DTO 必须区分字段级任务与实体级 aggregate。owner DTO 至少返回 entity-version 的 `aggregateStatus`、`requiredFields`、`fieldReviews[{field, reviewKey, fieldStatus}]`、`pendingReviewVersion`、`activePublishedVersion`、`publicVisibility` 和安全提示；字段 task API 只返回获授权字段任务，不得单独生成 public DTO。public DTO 只能先读取当前权威 aggregate，确认 `publicVisibility=visible` 且 `activePublishedVersion` 非空，再沿 pointer 解析目标 aggregate，并确认目标 aggregate 为 published、requiredFields N/N 终态通过，最后只返回该 approved snapshot；当前 aggregate 因新版本 rejected/appeal/manual/pending 而非 published 时，不得阻止合法旧 active snapshot 继续公开。任何 pending/rejected/appeal/manual/missing/duplicate 字段或版本本身不得进入 public DTO、列表、详情、搜索索引、缓存或联系方式派生。申诉终审 API 不接受客户端角色或 reviewer 标识作为授权来源，服务端必须从受控账号映射验证 second reviewer 与双账号约束。

### 8.2 UI

UI 接线候选包括：待审核、需人工处理、拒绝、申诉中、删除后重新审核的状态提示；未编辑申诉与编辑后新版本分流；联系方式默认不公开。公开列表只显示 published。

owner UI 必须以 entity aggregate 为主状态，并可在授权详情中显示 requiredFields 的字段级审核进度；不得把“1 个字段已通过”展示为“实体已发布”。owner 编辑已发布内容后，UI 显示“新版本审核中，当前仍展示上一已批准版本”或等价安全语义；编辑表单可以显示 owner 自己的新版本，但公开页面只显示内容不变的旧 approved snapshot。新版本 N/N 字段获批后才切换公开内容；任一字段拒绝、人工或申诉期间旧 snapshot 继续展示。删除成功后公开列表、详情、搜索与缓存立即不可见；恢复只显示“待重新审核”，不得在重新批准前显示“已恢复公开”。

现有“已发布”“重新公开”等创建、编辑、恢复提示必须在生产接线前完成审查；若 UI/路由不改，必须由 UI owner 证明现有文案与新状态机一致。UI 证据与代码、生产证据分别取证。

## 9. Feature flag、部署和观察

feature flag 固定为 CONTACT_REVIEW_PRODUCTION_ENABLED，默认 false。没有 schema/index/preflight、账号绑定、权限、UI/API 回归和回滚点证据，不得开启。

上线序列：

1. schema/index/权限/preflight；
2. 预生产合成数据与 transaction integration；
3. UI/API 状态与申诉回归；
4. 小范围灰度；
5. 至少连续 24 小时观察；
6. 产品/技术/业务分层验收后，才由授权责任人决定扩大范围。

观察至少记录：队列进入/完成/超时数、状态分布、事务冲突/失败、审计写入失败、清理失败、误放/误拒样本、跨账号负例、公开列表状态、5xx 和告警响应。具体生产样本与指标 owner 必须写入部署回执。

### 9.1 立即停止条件

任一条件成立立即关闭 flag、停止新审核副作用并保留审计：

- 跨账号读取或联系方式泄露；
- 未审核内容公开、删除后复活或审核绕过；
- content owner 自审或权限越界；
- primary/backup 对申诉写最终决定、second reviewer 与 primary/backup 或 content owner 为同一账号，或申诉双人审计缺字段；
- 新编辑版本在批准前进入公开 DTO/列表/详情/搜索/缓存，批准切换非原子，拒绝/申诉错误替换旧 snapshot，或删除后旧 snapshot 仍可见；
- 单个或 N-1 个字段通过即公开、required field 缺失/重复仍聚合通过、字段 task 与 aggregate owner/entity/version 不一致、或字段决定先提交而聚合/audit/公开指针部分失败；
- 事务/幂等失败造成重复发布或孤立审计；
- audit event 丢失、被覆盖或包含原文/Secret；
- 队列不可用、超时无法转人工或告警无人负责；
- UI/API 与状态机不一致；
- 未经单独确认启用 AI/OCR/provider/额外出域；
- 观察指标、回滚点或停止责任人缺失。

## 10. 回滚合同

唯一生产回滚点是部署平台记录中上一稳定 revision。不得使用本地 commit、分支名、版本号或猜测的 revision 冒充生产回滚点。

回滚顺序：关闭 CONTACT_REVIEW_PRODUCTION_ENABLED；停止新审核和公开副作用；保留并核对字段 task、entity-version aggregate 与审计事件；按平台记录回滚到上一稳定 revision；验证公开列表只显示回滚点认可且 requiredFields N/N 通过的最后 approved snapshot；验证 pending/rejected/appeal/manual/missing/duplicate 新版本未被公开、aggregate 与 active pointer 没有混合版本、owner/entity/version/field 隔离、删除恢复阻断和联系方式授权；记录回滚时间、操作者、revision、结果和残余任务。回滚不得自动恢复用户已删除内容的公开可见性，也不得把未批准或未完整聚合的新版本提升为 active snapshot。

回滚演练必须在预生产或获授权窗口完成并由独立复核确认。没有真实演练证据时只能称为回滚方案，不能称为已演练或生产可回滚通过。

## 11. 安全、隐私与未成年人边界

- 测试与预生产只使用合成或脱敏数据；不得把真实联系方式、孩子姓名、学校、地址、申诉正文或聊天内容送出本系统。
- CloudBase collection、日志、截图和审计只保留最小元数据；任何原文/命中片段进入 queue/audit 即停止。
- 客户端不能指定审核状态、人工角色、公开标记或 owner/entity 隔离键。
- 未成年人字段按最小访问和默认不公开处理；未明确的法律保留、家长授权和申诉合规语义继续交业务/合规确认。
- Secret、production key、凭据和真实账号只允许在平台加密配置界面处理，不进入仓库、Hermes 副本、日志或聊天。
- AI/OCR/provider/额外出域关闭；任何未来开启均需单独 provider、DPA、region、预算、隐私和安全门。

## 12. 证据矩阵与验收

| 层级 | 必须证据 | 不能替代 |
| --- | --- | --- |
| 本地 | targeted/regression、状态负例、幂等、删除恢复、PII 扫描、typecheck/lint/build、限定 diff | 生产通过 |
| 集成 | 字段 task + entity-version aggregate schema/index、requiredFields 完整性/唯一性、同事务聚合与指针更新、权限、冲突重试、审计和清理合成证据 | 真实生产观察 |
| UI/API | 字段 task DTO 与 entity aggregate DTO 分层、创建/编辑/恢复不直达 published、N/N 聚合公开门、旧 approved snapshot 与新 pending version 隔离、状态文案、申诉分流、公开列表/详情/搜索/缓存过滤 | 业务最终验收 |
| 预生产 | 合成跨账号、队列超时、故障注入、回滚演练和 flag 默认关闭 | 生产 revision |
| 生产 | 部署 revision、smoke、观察窗口、停止条件、告警 owner、回滚演练和真实负例 | Issue 自动关闭 |
| 独立复核 | 技术、安全、UI/产品和生产证据各自复读 | 业务方风险接受 |
| 产品/业务 | 用户可见状态、申诉文案、联系方式默认不公开、残余风险接受 | Issue canonical 操作 |
| Issue 关闭 | ISSUE 管理员复读完整证据并修改 canonical/state | 项目 workflow 完成 |

最低验收必须证明：任何未完成审核内容不可公开；任何不确定/失败/超时保持人工状态；重复请求无重复副作用；删除恢复完整重审；queue/audit 无原文和 Secret；真实人工账号权限有效；数据库 schema/index/transaction/清理证据完整；UI/API 与状态机一致；部署、观察和回滚证据属于同一生产 revision。

### 12.1 S1/S2 定向正负验收

1. `appealMode=true` 时，primary/backup 只能 claim/triage；其尝试 published/rejected 必须 fail-closed，状态、active pointer 和公开内容不变。
2. second reviewer 与 primary/backup claimant 为同一账号、与 content owner 为同一账号、角色未绑定或任一审计字段缺失时，申诉终审必须 fail-closed；不得只改状态后补审计。
3. 合法申诉终审必须由不同账号的 second reviewer 完成，审计可确定复核 appeal mode、primary、second reviewer、decision、decidedAt、前后状态和版本；published/rejected 与审计原子提交。
4. 给定 approved v1，owner 编辑产生 pending v2 后，public list/detail/search/cache 与 public DTO 仍只返回字节语义不变的 v1，owner DTO 显示 v2 审核中；任何 v2 字段对非 owner 可见均失败。
5. v2 批准时并发读取只能观察完整 v1 或完整 v2；不得出现字段混合、空 pointer、双 active snapshot 或先公开后审计。事务失败继续公开 v1。
6. v2 rejected 或 appeal_pending 时，v1 继续公开且内容、active pointer 不变；申诉最终决定仍执行 S1 双人门。
7. 用户删除时，公开列表、详情、搜索、缓存与联系方式派生立即看不到旧 snapshot；stale reviewer 不得复活它。恢复创建 pending 新版本且保持 hidden，直到重新批准；`deleted -> published` 必须拒绝。
8. 回滚只能回到获批准 snapshot/pointer 组合，不得公开 pending/rejected/appeal 新版本，也不得恢复用户已删除 snapshot 的可见性。

### 12.2 字段级到实体级聚合验收

1. 对 requiredFields 共 N 项的新建 entity version，仅 1/N 字段 task published 时，aggregate 必须保持非 published、activePublishedVersion 为空且 publicVisibility=hidden；public DTO/list/detail/search/cache 均无该实体。
2. N-1/N 字段通过时仍不得公开；最后一项为 pending_review、needs_manual_review、appeal_pending 或 missing 的每个变体均必须 fail-closed。
3. 全部 N 个字段 task 终态 published 时，最后一个字段决定、aggregateStatus=published、requiredFieldsDigest/fieldReviews、audit 和 activePublishedVersion/publicVisibility 必须在同一事务原子提交；并发读取只能看到完整未公开态或完整 approved snapshot。
4. 编辑已有 approved vN 时，vN+1 任一字段 rejected/appeal/manual/pending 均保持 vN 内容和 active pointer 不变；不得因其他字段通过而替换或部分混入 vN+1。
5. required field task 缺失、额外、重复 task/reviewKey、ref 指向错误 owner/entity/version/field 或 requiredFieldsDigest 不一致时，aggregate 重算必须失败并保持原公开状态；不得自动补猜字段或忽略重复。
6. 两个 reviewer 并发决定不同字段、重复提交同一字段或最后两个字段同时完成时，只允许一个 aggregateRevision 成功提交；冲突方重读后重算。任何时点不得提前公开、双 active、字段决定已提交但 aggregate/audit 未提交，或 aggregate published 但仍缺字段。
7. 删除立即隐藏 entity aggregate 并使全部未决字段 task stale；恢复创建新 entity version 与 N 个新 task，N/N 重新通过前保持 hidden。

## 13. 停止、重开和不能声称的结论

发现越权公开、联系方式或未成年人泄露、审核绕过、审计缺失、owner 自审、删除后复活、错误回滚、未经授权出域或业务撤回关键默认时，停止生产准备并保持 ISSUE-0036 open；由原 owner 修复，独立复核重新判断。

在完整证据前不得声称：生产人工闭环已启用、AI/OCR 已上线、provider 已接入、schema/index 已部署、真实生产观察已完成、回滚已演练、业务验收已通过或 ISSUE-0036 已关闭。

“边做边看”只授权原 owner 在上述冻结范围内根据发现问题返工；不授权降低 fail-closed、隐私、独立复核、用户确认或 Issue 关闭门禁。

## 14. 当前未通过门与唯一下一步

当前状态：HERMES_REVIEW_PENDING / USER_CONFIRMATION_PASSED / PRODUCTION_INPUTS_PENDING。

未通过或未证明：实际生产账号绑定、schema/index/transaction/权限实证、UI/API 接线、预生产与生产 revision、24 小时观察、停止/告警 owner、真实回滚演练、独立生产复核、产品/业务最终验收和 Issue 管理员关单。

唯一下一步：项目总负责人冻结本次 Document QA 输出的精确 hash，并组织 focused Hermes Round 2/3 只复核 S1/S2 严重修订及必要回归。Document QA 不自行运行 Hermes、不自我批准，也不进入代码、UI、数据库、平台、部署或生产操作。
