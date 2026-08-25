# V5 / ISSUE-0036 生产接线冻结包 v2｜Document QA Round 1 SERIOUS 整改记录

## 1. 身份、输入与边界

- 执行角色：`019fefa7-c5cf-7e62-9859-5263998dfd77 / DocumentQAv2.3.2 / gpt-5.6-sol / high`；唯一 Document QA 写入 owner 已由中央注册核验。
- canonical 输入：`2026-08-23-v5-issue-0036-production-wiring-freeze-v2-spec.md`；SHA-256=`4F361440FD8D6012CA916501E7D21DEFF10150E178B04C96637908BA6CE814CF`；33,014 bytes / 340 lines。
- Hermes v2 Round 1 报告：SHA-256=`464EC1043C453810F3799E0D2F5D05AAAC872B35A5EE3E1158E2CAAF547D3D62`；正文 verdict=`REWORK_REQUIRED`；SERIOUS=4。
- metadata：SHA-256=`D8D9B93B67E7C7CD189A560235B5E12B2C723B5B33DC870CCD04349D81B0F53C`；model=`deepseek-v4-pro`；round=`1/3`；`canonical_source_unchanged=true`；`default_model_changed=false`。
- 新周期共享计数保持 `1/3`。本批只修 S-001～S-004 及其必要回归；不处理或宣称关闭 N-001～N-008、MAC-1～MAC-5。
- 写前主仓：branch=`V2-unified-navigation-responsive-profile-20260729`；HEAD=`33314857da0f2d72066443965454d23fc70a16d3`；status entries=`338`；snapshot SHA-256=`FADF8B0DF00BDE6131ACF75E1717C800566BC326190D1ACFEFDDAC797B4A6105`。

## 2. SERIOUS finding matrix

### S-001｜rejected 后申诉/编辑与当前候选资格

- **Old location/problem**：原 §5.3 L129–L133 与 §6.3 L188–L190 使用未定义候选/终态别名；一处要求当前候选 edit=409，另一处又允许 rejected 后 edit 新版本，且旧 rejected version 的 pending 清理时机不确定。
- **New location/semantic**：修订后 §5.1 L109–L115、§5.3 L129–L138、§6.1 L156–L169、§6.3 L189–L205、§7.6 L262–L282、§12.3 L351–L358。
- **Rationale**：仅使用 `activeReviewStatuses={pending_review,needs_manual_review,appeal_pending}` 与 `completedDecisionStatuses={published,rejected,deleted}`。rejected 非 active；pending 仍指 rejected 且未申诉时只允许同版本申诉或 edit 新版本二选一。
- **Frozen decision kept**：申诉成功写 `appealUsedAt/appealRequestId`；edit 原子把 pending 改指更高版本并令新 aggregate `supersedesVersion=旧 rejected version`；旧 aggregate 继续 rejected，不新增隐藏状态。published/delete 清 pending，普通 rejected 不清 pending。
- **Verification**：确定性合同覆盖 active review edit=409、rejected appeal/edit 竞争仅一方成功、申诉已用后只可 edit、旧 revision 全回滚、delete 立即 hidden/deleted。

### S-002｜版本无关操作幂等

- **Old location/problem**：原 §7.5 L232 的 task 幂等唯一键包含 `entityVersion`，无法支撑 §7.6 L244 对 create/edit/restore 重试返回原版本的承诺。
- **New location/semantic**：修订后 §5.4 L140–L152、§7.1 L211–L219、§7.3.1 L235–L241、§7.5 L247–L260、§7.6 L262–L282、§12.3 L351–L358。
- **Rationale**：新增 provider-neutral `contact_review_idempotency`，精确保存 scope/key/request/result receipt，不复制正文或联系方式；唯一键为 `(scopeKey,idempotencyKeyHash)`，不含 entityVersion。
- **Frozen decision kept**：create scope=`ownerId|entityType|create`；edit/restore/appeal/delete scope=`ownerId|entityType|entityId|operation`。同 key+同 requestHash 返回原 entityId/entityVersion/result；不同 requestHash 返回 `409 IDEMPOTENCY_KEY_REUSED`。
- **Verification**：幂等 receipt、版本分配、N 个 task、aggregate、主指针/CAS、audit 与结果同事务；失败不留处理中孤儿；并发唯一冲突不得再次分配版本。task 幂等索引明确只服务字段 claim/决定重试。

### S-003｜单一 pending 指针与 CAS

- **Old location/problem**：原 §7.5 L236 引用 schema 中不存在的 pending candidate 字段，可能迫使 aggregate 增加第二指针或不可建索引。
- **New location/semantic**：修订后 §6.1 L156–L169、§7.3 L227–L233、§7.5 L247–L260、§7.6 L262–L282、§12.3 L351–L358。
- **Rationale**：删除不可建的 pending unique index；aggregate 只保留 `(ownerId,entityType,entityId,entityVersion)` 唯一键。
- **Frozen decision kept**：唯一当前候选只由主实体单一 `pendingReviewVersion` 和 `entityRevision/currentVersion` 锁定/CAS 保证；aggregate 不增加 pending 标记、partial index 或第二公开/待审指针。
- **Verification**：事务前置矩阵覆盖 pending 指向 active review→409、指向 rejected→只允许 appeal/edit、null→按合法源状态 create/edit/restore；两个 edit 以及 rejected 上 appeal/edit 并发只能一个成功，CAS 失败整体回滚。

### S-004｜版本级申诉请求与逐字段终审

- **Old location/problem**：原 §5.3 L129 为版本级申诉，§4.2/§4.3 与 §6.2 又按单字段 task/单数决定描述，未定义进入申诉的字段集合、已批准字段处理和终审粒度。
- **New location/semantic**：修订后 §4.2 L84–L95、§5.3 L129–L138、§5.4 L140–L152、§6.2 L171–L187、§7.3/§7.4 L227–L245、§7.6 L262–L282、§9 L302–L306、§12.2 L343–L349。
- **Rationale**：每个 rejected entityVersion 最多一个版本级 appeal request；必须覆盖该版本全部当前 rejected requiredFields，已 published fields 保持 published。原 rejected task 优先同 task 转为 `appeal_pending/appealMode=true`。
- **Frozen decision kept**：second reviewer 终审为逐字段决定向量；每字段独立校验 triage/second/owner/角色/reason。任一校验失败整个向量 fail-closed 到 needs_manual_review，不产生部分终审。
- **Verification**：验收覆盖多 rejected fields 全部进入、published field 不重开、子集/额外/重复申诉拒绝、逐字段 mixed decision、重复申诉拒绝、任一账号校验失败整体不落部分结果；全 N published 才切 active，否则 aggregate rejected 且只允许 edit。

## 3. 输出、保护与未通过门

- 修订后 canonical：SHA-256=`C8613135340AA00F4F1C6C58C2EB53864BF0256F4BA8C3FCC4D815F6CB4D7A05`；43,573 bytes / 376 lines。
- 状态仍为 `DRAFT_NON_CANONICAL / HERMES_ROUND_2_PENDING`；不是自我批准、`DOCUMENT_GATE_PASSED`、实现/数据库/平台/部署授权、生产验收或 Issue 关闭。
- S-001 冻结裁决要求删除未定义状态别名，因此与 N-003 所在状态术语邻域发生直接必要重合；本批只按 S-001 建立精确集合与 `deleted` 转移，不宣称独立处理或关闭 N-003。N-005 的“邮件”遗留措辞仍保留；其余 NON_SERIOUS/MAC 亦未展开。
- R1 report/metadata、v1 canonical 及其 reports/QA、ISSUE-0036、ISSUE 总表、ISSUE-0043、产品经理工作记录、代码/UI/平台、中央/角色文件均不在写入范围。
- 未运行 Hermes、npm、测试、build；未执行 Git mutation、部署或平台操作；未创建任务/subagent。
- 唯一下一步：项目总负责人冻结修订后精确 hash，并组织 focused Hermes Round 2/3 只复核 S-001～S-004 与必要回归；本线程不得执行。
