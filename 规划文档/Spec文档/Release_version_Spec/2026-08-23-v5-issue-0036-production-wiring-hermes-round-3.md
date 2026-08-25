# 独立只读复核报告

## Metadata

- 复核对象（sanitized copy）：`2026-08-23-v5-issue-0036-production-wiring-freeze-spec.md`（349 行，36,822 字节）
- 文档自述状态：`DRAFT_NON_CANONICAL / AUTHOR_FROZEN / HERMES_REVIEW_PENDING`
- 文档自述审查预算：`MAX_REVIEW_ROUNDS=3；CURRENT_REVIEW_ROUND=1/3`（第 5 行）
- 本次调用标注：`Round 3/3`；调用模型 `deepseek-v4-pro`
- 唯一 Issue：ISSUE-0036（家长需求与老师资料的联系方式快速智能审核）
- 复核方式：仅针对 sanitized copy 做只读审查；未核验 §2 所引 SHA-256 / commit / 外部路径真伪，未修改任何文件，未声称用户批准

> 元数据说明：本次调用标注为 3/3，但文档第 5 行与第 14 行仍以 `1/3` 记账、第 349 行“唯一下一步”仍指向“Round 2/3”。因未收到 Round 1/2 的既有 findings，本轮按一次性 holistic 全量复核执行（等效 Round 1），并据此给出结论；该记账不一致单独列为非严重项 F。

## Round

有效 Round 1（全量）；文档自身元数据标记为 1/3，调用标注 3/3（见 F）。

## Verdict

**REWORK_REQUIRED** — 存在 2 项 SERIOUS 缺陷（申诉双人控制的字段级强制执行合同不闭合；公开指针/版本字段的精确持久化合同缺失关键语义）。

---

## Serious Findings

### SERIOUS-1 — 申诉双人控制：backup claimant 身份未被可执行地捕获，§6.5 终审检查漏掉“second ≠ backup”

- **位置**：§4.1（第 64 行 backup 行、第 65 行 second reviewer 行）、§4.3（第 82 行）、§6.2（第 154 行）、§6.3（第 181 行）、§6.5（第 212 行）
- **证据**：
  - §4.3（82 行）要求最终决定账号“不得等于该申诉记录中的 primary/backup claimant”。
  - §6.5（212 行）事务级只校验 `secondReviewerRef != primaryReviewerRef` 和 `secondReviewerRef != ownerId`，**未**校验 `secondReviewerRef != backup claimant`。
  - §6.2/§6.3 schema 只有 `primaryReviewerRef`、`secondReviewerRef`、`operatorRole/operatorRef`，**无** `backupReviewerRef` 字段。
  - §4.1 说 backup “登记接管身份”（与 primary“登记 primary 身份”措辞不同），§6.5 又说“primary/backup claim/triage 只能登记 primaryReviewerRef”——两者对“backup 身份写进哪个字段”说法矛盾。
- **影响**：若实现者按 §4.1 字面把 backup 写进与 `primaryReviewerRef` 分离的“接管身份”（如 `operatorRef`），则 §6.5 的事务级检查会漏掉 backup==second 的越权路径，双人控制可被单账号绕过；这是安全/隐私控制缺陷，属于 §9.1 明确要“立即停止”的“双账号约束失效”类别。
- **修正/闭环触发**：统一三处口径——明确定义 backup 的 claim 身份写进哪个字段（建议单一 `primaryReviewerRef` 语义扩展为“triage reviewer ref”，或新增显式字段），并在 §6.5 终审事务显式追加 `secondReviewerRef != 该申诉 triage reviewer(primary 或 backup)` 校验；§12.1 第 2 项已覆盖该负例，需与 §6.5 文本一一对应后方可冻结。

### SERIOUS-2 — §6.2.1 版本指针字段与“权威 aggregate”选择规则未定义，公开指针正确性依赖未写明的语义

- **位置**：§6.2.1（第 168–171 行）、§6.5（第 208–216 行）
- **证据**：
  - 第 168 行把 `basePublishedVersion`、`supersedesVersion`、`activePublishedVersion`、`pendingReviewVersion` 列为必需字段，但全文**从未定义** `basePublishedVersion`；`supersedesVersion` 仅在第 168 行与第 214 行“旧版本 superseded 标记”出现，无明确写入规则。
  - 第 171 行称“当前主实体 version 对应的 aggregate 是公开门唯一权威控制记录”，但**未定义**“当前主实体 version”如何确定（highest entityVersion？某指针引用？），也未说明编辑 vN→vN+1 后旧 vN aggregate 自身 `activePublishedVersion/publicVisibility` 是否保持不变、还是被改/被标记，仅在第 214 行笼统写“不得改写现有 approved snapshot”。
  - §8.1（240 行）要求“先读取当前权威 aggregate”，但未说明如何定位该权威 aggregate（查询键/索引路径）。
- **影响**：§6 自称“精确结构合同”，但公开可见性的核心（active pointer 唯一性、新旧 snapshot 隔离、base/supersede/active/pending 四指针在 create/edit/delete/restore 四场景的赋值）存在多处未定义，实现者必然各写各的，直接风险是公开指针错切、双 active snapshot 或旧 snapshot 失效，属 §9.1 停止条件覆盖的核心正确性区域。
- **修正/闭环触发**：为 §6.2.1 补一张“版本生命周期 × 四指针字段”的赋值矩阵（新建/编辑/删除/恢复各填什么），明确定义“当前权威 aggregate”的判定规则与定位索引；删去或定义 `basePublishedVersion`；新增对应验收（见 Missing Acceptance-1）。

---

## Non-Serious Findings

### NS-3 — §4.1 “边界案例和被标记需二审任务”无状态/标志/转移支撑
第 65 行 second reviewer 职责含“处理申诉、边界案例和被标记需二审任务”，但状态机（§5.1/§5.2）只有 `appealMode=true` 走 second reviewer；schema 无“需二审”标志，非申诉的“需二审任务”无路由。要么确认其为 out-of-scope 并从 §4.1 删除，要么补标志+转移。

### NS-4 — aggregate 初始状态与“draft”缺失
§5.1 七态含 `draft`，但 §6.2.1 聚合计算规则（173 行）永不会产生 `draft`；§6.5 创建事务（208 行）未显式写初始 `aggregateStatus`。建议补一句“新建 aggregate 初始 `aggregateStatus=pending_review`”。

### NS-5 — “SLA 不写入本附件”与 §4.2 SLA 目标措辞张力
§3.2（48 行）称“不把…SLA…写入…本附件”，§4.2（73–74 行）又写了 24h/48h 目标。可辨为“目标≠SLA 承诺”，但对“精确措辞”敏感的项目建议显式标注“仅内部目标，非 SLA 承诺”。

### NS-6 — 审查轮次记账不一致
第 5/14 行 `1/3`、第 349 行“唯一下一步=Round 2/3”与本次 3/3 调用不一致。属过程记账，非系统正确性问题，但冻结前应统一。

### NS-7 — `pending_review -> published/rejected` 直通路径语义不明
§5.2（100 行）规定“确定性候选或审核失败→needs_manual_review”，即规则结果总进人工；但（101 行）又允许 primary/backup 从 `pending_review` 直接 `published/rejected`，两条路径对 `pending_review` 是否为“人类可决态”表述冲突，需澄清哪个生效。

### NS-8 — §6.2 “必需字段”易被误读为 NOT NULL
第 149–156 行把 `assignedAt/dueAt/decision/decidedAt/secondReviewerRef` 等列为“必需字段”，但 pending 任务下这些应为空。建议标注“schema 列存在”而非“恒非空”。

### NS-9 — “任意可删除状态”未定义
第 108 行删除转移触发条件“任意可删除状态”未枚举哪些状态可删（published 是否可删？）。建议显式列为“除 deleted 外的全部状态”。

### NS-10 — `classification` 字段语义未定义
第 152 行 tasks schema 含 `classification`，全文未说明其取值/来源/与 `ruleVersion`、状态的关系。

### NS-11 — §12.2 第 2 项负例枚举不完整
第 328 行只列 `pending_review/needs_manual_review/appeal_pending/missing` 四变体，漏 §6.2.1（173 行）规则中的 `rejected/deleted/duplicate`，建议补齐或引用规则原文。

---

## Contradictions

1. **§4.1（64 行“登记接管身份”）↔ §6.5（212 行“只能登记 primaryReviewerRef”）**：backup 身份写入字段矛盾 → 直接导致 SERIOUS-1。
2. **§3.2（48 行“不把 SLA 写入”）↔ §4.2（73–74 行写 24h/48h 目标）**：目标/SLA 边界措辞冲突 → NS-5。
3. **§5.2（100 行“规则结果总入 needs_manual_review”）↔（101 行“可从 pending_review 直决 published/rejected”）**：`pending_review` 的决策态语义冲突 → NS-7。

---

## Missing Acceptance Criteria

1. **MISSING-ACC-1（对应 SERIOUS-2）**：无验收证明四指针字段（base/supersede/active/pending）在 create/edit/delete/restore 全生命周期赋值正确，亦无“任意时点唯一权威 aggregate / 无双 active snapshot 且旧 snapshot 指针不被误改”的定点测试。
2. **MISSING-ACC-2（对应 §3.1 目标 5）**：无显式负例验证“恢复后不得恢复未授权的联系方式可见性/聊天权限”，§12.1 第 7 项只覆盖“保持 hidden 至重新批准”，未覆盖“联系方式/聊天授权不被恢复”。
3. **MISSING-ACC-3（对应 §7）**：Retention/清理无专属验收——30/180 天到期、legal hold 暂缓、清理幂等、部分失败告警、“清理失败不重新启用 token/公开状态”均只在 §12 集成行泛提“清理合成证据”，缺可判定用例。

---

## Remediation Checklist

- [ ] SERIOUS-1：统一 primary/backup claim 身份字段口径，§6.5 终审显式校验 second ≠ triage(primary 或 backup)，与 §12.1 第 2 项一一对应。
- [ ] SERIOUS-2：补版本生命周期 × 四指针字段赋值矩阵，定义“当前权威 aggregate”判定与定位索引，定义/删除 `basePublishedVersion`。
- [ ] MISSING-ACC-1/2/3：补齐三项验收。
- [ ] NS-3/4/7：澄清“需二审任务”范围、aggregate 初始状态、`pending_review` 决策态语义（三者同属状态机一致性）。
- [ ] NS-5/6/8/9/10/11：措辞与记账统一（可选，不阻塞核心，但冻结前建议闭环）。
- [ ] 关闭后重投 focused Round 2/3，仅复核 SERIOUS-1/2 修订及受影响回归（§12.1/§12.2/§6.2.1/§6.5），不重开风格。

---

## Open-Issue List

| ID | 严重度 | 状态 | 摘要 |
| --- | --- | --- | --- |
| SERIOUS-1 | 严重 | 开放 | 申诉双人控制 backup 身份捕获与 §6.5 终审检查不闭合 |
| SERIOUS-2 | 严重 | 开放 | 版本指针字段与权威 aggregate 选择规则未定义 |
| MISSING-ACC-1 | 严重（依附 S-2） | 开放 | 四指针字段生命周期赋值无验收 |
| MISSING-ACC-2 | 中 | 开放 | 恢复不恢复联系方式/聊天权限无负例验收 |
| MISSING-ACC-3 | 中 | 开放 | Retention/清理无专属验收 |
| NS-3/4/5/6/7/8/9/10/11 | 非严重 | 开放 | 状态机/措辞/记账一致性共 9 项 |