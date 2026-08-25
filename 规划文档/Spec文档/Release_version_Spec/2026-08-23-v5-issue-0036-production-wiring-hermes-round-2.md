# 独立复核报告 — V5 / ISSUE-0036 生产接线冻结包

## Metadata

- 复核对象（sanitized copy）: `2026-08-23-v5-issue-0036-production-wiring-freeze-spec.md`
- 文件大小 / 行数: 27,453 bytes / 306 行
- 文档自述状态: `DRAFT_NON_CANONICAL / AUTHOR_FROZEN / HERMES_REVIEW_PENDING`
- 文档自述审查预算: `MAX_REVIEW_ROUNDS=3; CURRENT_REVIEW_ROUND=1/3`
- 作者: 产品经理 Agent v2.3.2 / 019fefa7-9883-7af2-bdb5-acc5c8513781
- 唯一 Issue: ISSUE-0036
- 调用模型: deepseek-v4-pro（已按指令指定）

## Round

本轮为复核第 **2/3** 轮（按本复核流程指令）。

⚠ 元数据矛盾：文档头（第 5 行）与第 14 行均自述 `CURRENT_REVIEW_ROUND=1/3`，且第 306 行仍将“组织 focused Hermes Round 2/3”列为“唯一下一步”。文档以 **首轮待审** 状态自居，而本复核以第 2/3 轮执行。二者必须在文档元数据中 reconciliation，否则破坏本文档自身最看重的审查计数/审计链完整性（第 14–15 行明确强调“不重置计数”）。

## Verdict

**REWORK_REQUIRED**（存在 1 项 serious 结构性歧义，触及本系统最核心的公开门安全不变式）。

---

## Serious Findings

### S1 — 审核粒度（per-field）与公开状态（per-entity）在同一 task 记录内未统一，缺聚合规则
- 严重度: **SERIOUS**
- 位置: 第 36、140、144、156、166、178、208 行（贯穿 §3.1 / §6.2 / §6.3 / §6.4 / §6.5 / §8.1）
- 证据:
  - 第 36 行（目标 1）把 `parent_need / childIntro / tutor_profile / abilityDescription` 四个字段划入“同一 fail-closed 审核边界”。
  - 第 140 行 schema 把 `field`（单数）列为 contact_review_tasks 必需字段，与 `entityId`/`entityVersion` 并列 → 语义上“一个 task = 一个 (entity, field, version) 的审核”。
  - 第 144 行同一 task 又携带**实体级**公开字段 `activePublishedVersion / pendingReviewVersion / publicVisibility`。
  - 第 178 行事务合同只“读取当前 owner/entity/version”（无 field）并“写入 task（单数）”→ 实体-版本粒度。
  - 第 208 行 owner DTO 返回实体级 `reviewStatus / activePublishedVersion`，无 per-field 分解。
- 影响: 冻结包的核心不变式是“未完成审核的内容不进入公开列表”（第 37、279 行）。但审核是否 per-field、实体版本“已批准/可公开”需满足“全部四个字段均通过”还是任一字段通过，全文未定义。schema 在单条 task 内同时混入 field 粒度与实体级公开字段，且 §6.1 只声明两个 collection，无实体级聚合记录。下游代码/UI/平台实现方必须自行猜测聚合规则，存在“仅单字段获批即公开整个实体”的误发布风险——直接动摇公开门。
- 修正/未来关闭触发: 冻结包必须显式钉死审核粒度二选一：(a) per-field（每字段一个 task），并补实体级聚合记录/不变量“全部字段通过才置 activePublishedVersion=该版本”；或 (b) per-entity-version（一个 task 覆盖整版本，`field` 降级为审计溯源字段）。并同步修正第 178 行事务粒度、第 208 行 DTO 与 §6.4 索引列表，使三处一致。关闭触发：文档中显式出现“字段级→实体级聚合规则”或“per-entity 审核粒度”陈述。

---

## Non-Serious Findings

- N1 (第 166/174/188 行) — 幂等唯一性机制未钉入“固定”索引表：§6.4 把候选索引名“固定”为 5 条，均无 `idempotencyKeyHash` 唯一索引/约束；而第 188 行要求“同一幂等键重复请求…不新增副作用”。唯一性仅在集成测试兜底（第 188 行），冻结的 schema 本身未钉机制，实现方照抄索引表会漏掉并发去重保证。
- N2 (第 98 行 vs 第 47 行) — `pending_review` 与 `needs_manual_review` 在普通（非申诉）流程的进入判据未定义。“确定性候选或审核失败”措辞含糊：何为“确定性候选”？两个状态都落人工、都 fail-closed，但语义边界（哪类规则结果进哪个态）未钉，全交给当前关闭的规则层。
- N3 (第 65 行 vs §5.2) — 角色合同里 second reviewer 处理“边界案例和被标记需二审任务”，但 §5.2 状态机只为申诉终审接入了 second reviewer，普通任务无“需二审”转移或标记字段，角色与状态机不一致。
- N4 (第 208 行) — DTO 字段名与 schema 漂移：`reviewStatus`(schema 为 `status`)、`pendingVersion`(schema 为 `pendingReviewVersion`)。
- N5 (第 106 行) — “任意可删除状态”未枚举：哪些状态可删、`appeal_pending`/`needs_manual_review` 进行中可否删除未钉。
- N6 (第 115/101 行) — 申诉再申诉无上界：second reviewer 驳回后是否可再次申诉未定义，存在 reject→appeal 无限环风险。
- N7 (第 178/144 行) — 待审版本存在时并发再次编辑（vN+1 pending 时 owner 再改出 vN+2）未定义；schema 仅单一 `pendingReviewVersion`。
- N8 (第 192 行 vs 第 107 行) — 保留 30 天清理 task 元数据后，删除内容再恢复的行为未定义（内容本体在主线库，但版本链/审核元数据已清，恢复依据不清）。
- N9 (第 55 行) — “用户不看到…完整联系方式”措辞有歧义：易被读成连 owner 也看不到自己提交的联系方式；结合第 208 行语境应为“不看到他人联系方式”。
- N10 (第 262 行) — 未成年人字段的法律保留、家长授权、申诉合规语义继续交业务/合规确认，未冻结。文档已如实标注为待办，属 open-issue 而非遗漏。

---

## Contradictions

1. 审查轮次元数据：第 5/14 行 `CURRENT_REVIEW_ROUND=1/3` vs 本轮实际以 2/3 执行（见 Round 节）。文档内部不自相矛盾，但与复核事实冲突。
2. 粒度冲突：第 140/156 行（per-field 单数 `field`）↔ 第 144 行（实体级公开字段同 task）↔ 第 178 行（owner/entity/version，无 field）——即 S1 的结构性矛盾。
3. 角色↔状态机：第 65 行（second reviewer 处理普通“需二审”）↔ §5.2（second reviewer 仅申诉终审）——即 N3。

---

## Missing Acceptance Criteria

证据矩阵（§12）与 S1/S2（§12.1）覆盖充分，但缺少以下验收判据：

1. 实体版本“可公开”的字段聚合门（全部字段批准才算 approved）——S1 直接后果。
2. 幂等去重的唯一索引/约束存在性证据（不只“结果无重复”，要钉机制）——N1。
3. 申诉驳回后的再申诉边界/上限——N6。
4. pending 期间并发二次编辑的处置（拒绝或排队）——N7。
5. backup 接管超时任务时的接管身份与 dueAt 重算审计——N3 关联。
6. “可删除状态”白名单与删除对申诉/人工中任务的处置——N5。
7. 保留清理（30/180 天）后删除恢复的可操作性——N8。

---

## Remediation Checklist

- [ ] 钉死审核粒度（per-field 或 per-entity-version），补聚合规则，统一第 140/144/156/178/208 行与 §6.4（S1，阻塞项）。
- [ ] 在 §6.4 固定索引表中补 `idempotencyKeyHash` 唯一索引/约束（N1）。
- [ ] 定义 `pending_review` vs `needs_manual_review` 进入判据（N2）。
- [ ] 把 second reviewer 的“边界案例/需二审”纳入状态机或从角色表删除（N3）。
- [ ] 统一 DTO 字段名（reviewStatus/pendingVersion vs status/pendingReviewVersion）（N4）。
- [ ] 枚举可删除状态、申诉再申诉上界、并发二次编辑、保留清理后恢复四类边界（N5/N6/N7/N8）。
- [ ] 修订第 55 行“完整联系方式”措辞消除歧义（N9）。
- [ ] reconciliation 审查轮次元数据（第 5/14 行 1/3 → 2/3，与第 306 行“唯一下一步”同步）（Round 节）。

---

## Open-Issue List

- ISSUE-0036 本身仍 open；生产人工 owner、生产关闭证据、实际账号绑定、schema/index/transaction/权限实证、24h 观察、回滚演练、独立生产复核、产品/业务最终验收、Issue 管理员关单——均未完成（文档 §14 已如实声明）。
- 未成年人字段的法律保留/家长授权/申诉合规语义未冻结（第 262 行），待业务/合规确认。
- AI/OCR/provider/额外出域保持关闭（第 28、46、264 行），未来开启需独立 provider/DPA/region/预算/隐私门——文档已冻结为关闭态。
- 首次访问 503 属于 out of scope，待 ISSUE-0036 关闭后另行处理（第 28 行）。
- S1（审核粒度）在修复前为本冻结包唯一阻塞项，修复后需进入 focused Round 3 复核回归。