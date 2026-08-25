# V5 / ISSUE-0036 生产冻结包｜Document QA Round 2 SERIOUS 整改记录

## 1. 输入、轮次与边界

- 执行角色：`DocumentQAv2.3.2 / 019fefa7-c5cf-7e62-9859-5263998dfd77 / gpt-5.6-sol / high`。
- 输入 canonical：SHA-256 `9E5DE15240D36E67C6721F83DC006152B22D1B8A8E3539621F98194CA51BCF90`；27,453 bytes / 306 lines。
- Hermes Round 2 正文报告：SHA-256 `2AD553A815E42D55A3F6A0A9D32F6F493FD7B06922044E5E595DF0AAACC366F2`；正文 verdict=`REWORK_REQUIRED`；SERIOUS=1。脚本包装的 `HERMES_REVIEW_PASS` 不覆盖正文 verdict。
- metadata：SHA-256 `49B6A4FC30E5186626CAEC8E28ACA69D65A4B42D8112F05EEB43DC786DB65FA4`；model=`deepseek-v4-pro`；round=2/3；`canonical_source_unchanged=true`。
- 共享计数保持 `2/3`；本次只整改 revision-affected S1，不处理 Round 2 N1–N10，不运行 Hermes/Round 3，不自我批准。

## 2. S1 old/new location 与整改

### 2.1 Old

- §3.1、§6.2、§6.3、§6.4、§6.5、§8.1 将单数 `field` 的 per-field task 与 `activePublishedVersion / pendingReviewVersion / publicVisibility` 等实体级公开状态混在同一 `contact_review_tasks` 记录。
- 文档没有 entity-version aggregate，也没有“全部 required fields 通过才可公开”的聚合不变量，存在单字段通过即误公开整个实体的实现歧义。

### 2.2 New

- **冻结选择**：采用 per-field task + entity-version aggregate，不改回 per-entity task。
- §3.1、§5.1、§5.2、§5.4 明确字段状态与实体公开分层：单个字段 task published 只表示该字段通过；entity version 只有 requiredFields N/N 终态通过才能公开。
- §6.1、§6.2：`contact_review_tasks` 只承载 owner/entity/version/field/hash/rule/status/operator/idempotency 等字段级信息，明确禁止混入 aggregate/public pointer 字段。
- §6.2.1：新增 `contact_review_entity_versions` 合同，固定 requiredFields、fieldReviews 的 taskId/reviewKey、aggregateStatus/revision、active/pending version、publicVisibility 与 owner/entity/version；fieldReviews 键集合必须与 requiredFields 完全一致。
- §6.3：audit 同步记录 aggregateId、reviewKey、requiredFieldsDigest/revision、字段与聚合前后状态、公开指针和可见性变化。
- §6.4：字段 task 唯一索引固定为 owner/entity/version/field；新增 entity-version 唯一、公开和 pending 聚合索引。
- §6.5：任一字段决定必须在同一事务内完成字段状态、requiredFields 完整性/唯一性复核、aggregate 重算、适用的公开指针更新和 audit；missing、duplicate、ref 不一致、并发冲突、超时或 audit 失败整体回滚，不得部分公开。
- §8：owner DTO 返回 aggregate + fieldReviews，字段 API 不驱动 public DTO；公开 API 沿当前 aggregate 的 active pointer 解析并复核目标 approved aggregate N/N。UI 不得把 1 个字段通过展示为实体 published。
- §9、§10、§12：停止、回滚和证据矩阵同步字段/aggregate 边界；§12.2 增加 1/N、N-1/N、N/N 原子公开、任一 rejected 保留旧 snapshot、missing/duplicate/ref mismatch fail-closed、并发不提前公开及删除恢复全字段重审负例。

### 2.3 聚合不变量

1. 新建无旧 snapshot：active pointer 为空且 hidden；N/N 之前始终不公开。
2. 编辑有旧 approved vN：vN 原样继续公开；只有 vN+1 N/N 通过才原子替换。任一字段 rejected/appeal/manual/pending/missing/duplicate 均保持 vN。
3. 删除：实体 aggregate 立即 hidden，未决字段 tasks stale；恢复创建新 aggregate 与全部 N 个新 tasks，禁止直返 published。
4. 当前 aggregate 即使因新版本 rejected/appeal 而非 published，public API 仍可沿其 active pointer 返回经 N/N 复核的旧 approved vN；新失败版本本身绝不公开。

## 3. 非范围与已登记漂移

- Round 2 N1–N10 未处理、不宣称关闭，继续由 ISSUE 管理员维护。
- 文档头 `CURRENT_REVIEW_ROUND=1/3` 与内嵌上一轮 next-step 文本属于已知元数据漂移，本批只登记，不修改，不据此扩大 revision-affected SERIOUS 整改。
- 未修改 Hermes report/metadata、原 V5 closing Spec、Issue canonical/总表、代码、UI、平台、中央文件或其他角色文件；未运行 npm、Git mutation、部署、Cloudflare/CloudBase 或 Hermes；未创建任务/subagent。

## 4. 输出与下一门禁

- 修订后 canonical SHA-256：`C2988846E38D3C4338A38C06CC96B239BD59B9504D26E950CE07838265E393CF`；36,822 bytes / 349 lines。
- 当前状态：`QA_DOCUMENT_REWORK_COMPLETE / HERMES_ROUND_3_PENDING`；不是 `DOCUMENT_GATE_PASSED`、实现授权、部署、生产验收或 Issue 关闭。
- 唯一下一步：项目总负责人冻结本输出 hash，并组织 focused Hermes Round 3/3 只复核本 S1 与必要回归；本线程不得执行。
