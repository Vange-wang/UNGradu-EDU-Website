# V5 / ISSUE-0036 生产接线冻结包 v2｜Document QA Round 2 SERIOUS 整改记录

## 1. 身份、输入与边界

- 执行角色：`019fefa7-c5cf-7e62-9859-5263998dfd77 / DocumentQAv2.3.2 / gpt-5.6-sol / high`；中央注册核验为当前唯一 Document QA 写入 owner。
- canonical 输入：SHA-256=`C8613135340AA00F4F1C6C58C2EB53864BF0256F4BA8C3FCC4D815F6CB4D7A05`；43,573 bytes / 376 lines。
- Hermes focused Round 2 报告：SHA-256=`DBEF9912BEA98B906D5FC79E099A58D9FAA749B2AFEAD0C5D7F191A0F28779FB`；正文 verdict=`REWORK_REQUIRED`；SERIOUS=2。
- metadata：SHA-256=`D88CE3703D9B4B44705857AC540FA9792DDF5BB4CD1A9EE7CAB574351BC29D4F`；model=`deepseek-v4-pro`；round=`2/3`；`canonical_source_unchanged=true`；`default_model_changed=false`。
- 共享计数保持 `2/3`；本批只修 QA Round 1 组合路径暴露的 S-1/S-2 及必要回归，不处理或宣称关闭 R2 N-1/N-2、C-1/C-2、AC-3。
- 写前主仓：branch=`V2-unified-navigation-responsive-profile-20260729`；HEAD=`33314857da0f2d72066443965454d23fc70a16d3`；status entries=`341`；snapshot SHA-256=`D1401B2F72B366C3F657E025957A2DEA5D2CADC3E616D4682CCC556172FC81D1`。

## 2. SERIOUS finding matrix

### S-1｜mixed rejected+pending aggregate

- **Old location/problem**：输入 §6.2 L187 以“任一 rejected”为 aggregate rejected 的高优先级；结合 §5.2 L124 的逐字段普通决定、§5.3 L133–L134 的申诉门、§6.3 L199 与 §7.6 L279，`field A=rejected + field B=pending_review` 会过早开放申诉，申诉后重算存在无定义分支。
- **New location/semantic**：修订后 §5.2 L119–L132、§5.3 L134–L145、§5.4 L147–L163、§6.2 L181–L205、§6.3 L207–L222、§7.6 L280–L319、§9 L324–L330、§12.1 L359–L366。
- **Rationale**：对非 deleted aggregate 固定唯一优先级：N/N published；任一 appeal_pending；任一 needs_manual_review；全 N 普通决定已完成且仅含 published/rejected 并至少一 rejected；其余 pending/draft/missing/duplicate/unknown/incomplete 全部 pending_review/fail-closed。
- **Frozen decision kept**：rejected+pending_review 必须保持 pending_review、继续其余普通审核、不可申诉且旧 active 不变。只有 fully-decided rejected 才允许一次版本级 appeal，全部 rejected fields 进入 appeal，published fields 不重开。
- **Verification**：新增确定性测试合同：A rejected+B pending → aggregate pending_review、`409 APPEAL_NOT_READY`、旧 active 不变；完成 B 后才可能 rejected。申诉终审防御性重算覆盖其他 manual/pending/incomplete，不满足 N/N 时绝不切 active/pending。

### S-2｜appeal fail-closed 恢复出口

- **Old location/problem**：输入 §4.3 L99 将 claim/triage 描述为进入 needs_manual_review，而 §7.6 L277 又只在终审向量校验失败时进入该状态；§5.3 L132/L136 同时阻止 edit 和二次 appeal，却没有 appealMode=true needs_manual_review 的合法恢复出口。
- **New location/semantic**：修订后 §4.1–§4.4 L75–L108、§5.2 L119–L132、§5.3 L134–L145、§5.4 L147–L163、§7.3.1/§7.4 L253–L263、§7.6 L280–L319、§9 L324–L330、§12.2 L368–L378、§12.3 L380–L387。
- **Rationale**：claim/triage 是独立原子步骤，只写 triage ref/role、claimAt 和 audit，字段/aggregate 保持 appeal_pending。appealMode=true needs_manual_review 仅由事务可用时的 second-review 校验失败或人工 SLA 超时进入；存储不可用返回 503 且零变化。
- **Frozen decision kept**：唯一恢复出口是 primary/backup 的 `resumeAppealReview`：复用原 appealRequestId，不创建第二 appeal、不清 appealUsedAt；原因解除后原子恢复 appeal_pending，可保留 triage 或审计化 handoff。second 必须不同于当前 triage 与 owner，primary/backup 永远不能终审。
- **Verification**：测试覆盖错误 second/reason → needs_manual_review；合法 resume → 原 appeal_pending；无新 appeal；handoff previous/new claimant/reason/time 审计；不同账号 second 完成；重复 resume 幂等；非法角色、原因未解除、并发冲突保持 manual；存储不可用 503 且零状态/副作用。owner 在 appeal_pending/manual 期间 edit=409，final rejected 后才可 edit。

## 3. 输出、保护与未通过门

- 修订后 canonical：SHA-256=`95AA1D2D6DFFE12E30C53E9D1A3C9EAA69AC5BFD33CB3DDD946F2DCCA5B5307A`；52,245 bytes / 405 lines。
- 状态：`DRAFT_NON_CANONICAL / HERMES_ROUND_3_PENDING`；不是自我批准、`DOCUMENT_GATE_PASSED`、实现/数据库/平台/部署授权、生产验收或 Issue 关闭。
- N-2 的 claim 持久化时机与 S-2 冻结整改直接重合，本批只为消除 S-2 状态矛盾而同步，不宣称独立关闭 N-2。N-1、C-1/C-2、AC-3 保持非范围；`CURRENT_REVIEW_ROUND=1/3` 与“完整 canonical”措辞均未修订。
- 未修改 R1/R2 report/metadata、v1、Round 1 QA ledger、Issue/总表/ISSUE-0043、产品经理工作记录、代码/UI/平台、中央/角色文件；未运行 Hermes、npm、测试、build；未执行 Git mutation、部署或平台操作；未创建任务/subagent。
- 保护复核发现外部并发：`ISSUE-0043` 在本轮写前 SHA-256=`436B7D08AEDA4CF89D8056C0D7D9F8205583E0DF5CFD8D64BD1BBCCA6454DEEA`，回读时变为 `A573DE010626FD4CCFBA95E1C328D927F455ADB1EA72D72A0FABA5440CF55C0D`，内容为 ISSUE 管理员登记本轮 R2 非阻塞项；该文件不在本 QA 写入调用中，且未与三份白名单 owner 文件重叠。其余已冻结保护文件哈希保持。
- 唯一下一步：项目总负责人冻结修订后精确 hash，并组织 focused Hermes Round 3/3 只复核 S-1/S-2 与必要回归；本线程不得执行。
