# 关键文档独立审查报告（只读）

## 元数据

- 文档：`2026-08-23-v5-issue-0036-production-wiring-freeze-v2-spec.md`（消毒副本）
- 唯一 Issue：ISSUE-0036
- 审查轮次：Round 1/3
- 调用模型：deepseek-v4-pro
- 文档状态：`DRAFT_NON_CANONICAL / AUTHOR_FROZEN / HERMES_REVIEW_PENDING`
- 审查范围：完整连贯文档整体审查（§1–§14），非差异补丁

## Verdict

**REWORK_REQUIRED** — 发现 4 项 SERIOUS（核心状态机矛盾、幂等契约不可实现、索引引用未定义字段、申诉粒度未定义）。均属正确性/可执行性/下游实现风险，须由作者修订后进入 Document QA 整改批次，不得自行修订或进入实现。

---

## SERIOUS 发现

### S-001 「actionable / terminal」状态机自相矛盾，编辑后拒绝场景无法确定行为
- **严重性**：SERIOUS（核心状态机正确性）
- **位置**：§5.3 L133 对 §6.3 L188/L189（并 §5.3 L130）
- **证据**：
  - L133：「已有 actionable candidate 时再次编辑返回 `409 REVIEW_VERSION_CONFLICT`，不静默产生 vN+2，也不覆盖 vN+1。」
  - L188（rejected/appeal 候选行）：「pending 保持当前 actionable candidate … terminal abandoned/closed 后才可原子清 pending」——把 `rejected` 候选称作「actionable」。
  - L189：「rejected vN+1 后 edit -> vN+2 … vN+1 原子标记 superseded/closed」——明确允许 rejected 后编辑生成 vN+2。
  - L130：「同一被拒版本再次变更必须 edit 生成更高新版本。」
- **影响**：若 `rejected` 候选被 L188 视为「actionable」，则 L133 要求编辑返回 409；但 L130/L189 又明确编辑合法（生成 vN+2 并 supersede vN+1）。两处互斥。`actionable`、`terminal`、`abandoned/closed` 均未定义。实现者无法确定「被拒后编辑」到底是允许（vN+2）还是拦截（409），直接影响 N/N 公开门与实体指针赋值。
- **修正/闭合触发器**：精确定义 `actionable`（建议 = {`pending_review`, `needs_manual_review`, `appeal_pending`}；`rejected` 与 `deleted` 非 actionable）；明确 `rejected`（申诉未耗尽）候选的 `pendingReviewVersion` 归属与清空时机（用状态枚举词，弃用「abandoned/closed」）。闭合前，§5.3 L133 与 §6.3 L188/L189 必须逐字一致。

### S-002 幂等去重索引绑定 entityVersion，重试无法去重，与 §7.6 契约冲突
- **严重性**：SERIOUS（失败处理/幂等正确性）
- **位置**：§7.5 L232 对 §7.6 L244（并 §12.3 L320）
- **证据**：
  - L232：`tasks_idempotency_unique：ownerId + entityId + entityVersion + idempotencyKeyHash`。
  - L119：create/edit 时「服务端生成 entity version」；§6.3 明确 currentVersion 严格递增。
  - L244：「重复幂等键只能返回原结果，不新增 task、版本、邮件、公开或审计副作用」。
  - L320：验收要求「幂等重试……只产生一个有效副作用」。
- **影响**：幂等键哈希被唯一索引绑定到 `entityVersion`，而 create/edit/restore 每次尝试会重新递增生成新 `entityVersion`。重试时 `(ownerId, entityId, entityVersion, idempotencyKeyHash)` 与首次不同，重复不会被该索引命中，也无法「返回原结果/原版本」。全文无独立于 entityVersion 的幂等键→版本映射表或 `(ownerId, entityId, idempotencyKeyHash)` 索引。§7.6 的幂等保证与 §12.3 的验收标准在 create（及生成新版本的 edit/restore）路径上不可实现。
- **修正/闭合触发器**：定义版本无关的幂等去重存储（独立幂等表，或 `ownerId+entityId+idempotencyKeyHash` 索引），并明确重试「返回原结果」所返回的版本引用与审计行为。闭合前，L232 索引与 L244 契约须能自洽支撑 create 重试去重。

### S-003 `entity_versions_owner_entity_pending_unique` 引用未定义字段「pending actionable candidate」
- **严重性**：SERIOUS（唯一不变量可实现性；文档自称「精确结构合同」）
- **位置**：§7.5 L236 对 §7.3 L219–L221
- **证据**：
  - L236：`entity_versions_owner_entity_pending_unique：ownerId + entityType + entityId + pending actionable candidate`。
  - §7.3 L219 字段列无任何「pending actionable」列；L221 明确「禁止在本 collection 增加或解释 activePublishedVersion、pendingReviewVersion、publicVisibility 为第二公开指针」。
- **影响**：「一次只有一个 actionable pending version」的核心不变量（对应 §5.3 L133、§6.1 L155）其唯一索引引用了一个不存在的字段/谓词。若无部分唯一索引谓词（如 `WHERE aggregateStatus IN (...)`）或专用可空列，该索引无法照字面建成；实现者若自行补字段，可能违反 §7.3 L221 的「禁止第二指针」禁令，破坏单一权威指针模型。
- **修正/闭合触发器**：将该索引改写为具体可执行形式：明确「actionable」判定的精确谓词（基于 aggregateStatus 枚举），或定义一个专用可空标记列并说明其与 §7.3 L221 禁令的边界。闭合前，L236 必须落在已定义字段/谓词上。

### S-004 申诉粒度与范围未定义：哪些字段进入 appeal task、终审是版本级还是字段级
- **严重性**：SERIOUS（双人控制合同与 N/N 门可执行性）
- **位置**：§5.3 L129 对 §4.2 L93 / §4.3 L99 / §6.2 L178
- **证据**：
  - L129：版本级表述「每个 rejected entity version 最多一次未编辑原内容申诉：rejected -> appeal_pending -> needs_manual_review … 最终由 second reviewer 决定 published 或 rejected」。
  - L99：字段级表述「appealMode=true 的申诉 task 中 … 最终 published/rejected 只能由不同账号的 second reviewer 完成」。
  - L93：申诉终审字段列出单数 `decision`、`reasonCode`。
  - L178：aggregate 仅当 N/N 字段 task 全 published 才 published。
- **影响**：一个版本因「任一字段 rejected」即 aggregate rejected（§6.2），但申诉时哪些字段转为 `appealMode=true`（仅被拒字段，还是全部 required 字段）、已 published 字段在申诉期间是保留还是被重新打开、second reviewer 是作一次版本级决定还是逐字段决定，均未定义。这直接决定双人控制复核范围、重复申诉约束（§5.3 L129「最多一次」）如何落到字段任务上，以及 N/N 门是否可能因申诉重开已批准字段而被重新否决。
- **修正/闭合触发器**：明确申诉的字段范围（建议仅被拒字段进入 appeal task；已 published 字段保持不变）、终审决定粒度（逐字段 vs 版本级）及「每版本一次申诉」在字段任务上的落地方式。闭合前，§4.2 单数 `decision` 与 §6.2 N/N 逐字段门的映射必须一致。

---

## NON-SERIOUS 发现

- **N-001** §6.3 标题「四场景生命周期赋值矩阵」，但表格实为 6 行（create/edit/rejected-appeal/rejected-edit/delete/restore）。数字不一致（用户对编号严格）。
- **N-002** §7.5 标题「Unique indexes」，但含非唯一组合索引 `tasks_status_dueAt`、`tasks_content_rule_version_field`；后者（contentHash+ruleVersion+field）不含 ownerId/entityId，用途/是否唯一不明确。标题与内容错配。
- **N-003** 术语漂移：`cancel/close/stale`（§5.2 L124、§6.3 L190）、`abandoned/closed`（§6.3 L188）、`closed task`（§8.1 L264）均不在 §5.1 状态枚举内（应统一为 `deleted` 或定义明确子状态）。实现者可能误认为存在隐藏状态。
- **N-004** §3.3 L70 仍列「模型分数」，但 §3.2 明确「不接入 AI/OCR/provider/模型训练」，属 v1 遗留死文本。
- **N-005** §7.6 L244 幂等去重「不新增…邮件」——全文未定义任何邮件通知机制，属遗留措辞。
- **N-006** `draft` 字段 task 状态生命周期未定义：§5.1 枚举含 `draft`，§5.2 L119「draft -> pending_review」，但 §6.3/§7.6 提交即生成 task，§6.2 聚合计算规则（L178）未枚举 `draft`。虽 fail-safe（未列状态→fail-closed），但 entry/exit 不清晰，易误实现。
- **N-007** 全文用 `pending`/`manual`/`appeal` 作 `pending_review`/`needs_manual_review`/`appeal_pending` 简写（§6.1 L161、§6.2 L178、§7.2 L209、§8 L258），存在被误读为独立状态的风险。
- **N-008** 审核员「读取必要脱敏内容」（§4.1 L78）无脱敏机制/读取 API 定义（§5.4 仅定义公开与 owner 联系方式可见性）。属范围外澄清，但作为「精确合同」可补一句来源说明。

---

## 矛盾清单

1. **S-001 核心矛盾**：§5.3 L133（actionable 候选→编辑 409）vs §6.3 L188（rejected 候选仍「actionable pending」）/ L189（rejected 后编辑→vN+2）＋ §5.3 L130（被拒后必须 edit）。
2. **S-002 契约矛盾**：§7.6 L244（重复幂等键返回原结果、不新增版本）vs §7.5 L232 唯一索引绑定 entityVersion（重试重新生成版本号，无法命中去重）。
3. **S-003 结构矛盾**：§7.5 L236 索引引用「pending actionable candidate」字段 vs §7.3 L219/L221 该字段不存在且禁止第二指针。
4. **S-004 粒度矛盾**：§5.3 L129 版本级申诉/单数决定 vs §4.3 L99 字段级 appeal task vs §6.2 L178 N/N 逐字段门。
5. （次要）§6.3「四场景」标题 vs 6 行表格（并入 N-001）。

---

## 缺失验收标准

- **MAC-1** §4.4 的 24h/48h 处理目标、超时 overdue audit＋告警＋不自动 publish/reject 无对应可判定测试（§12.3 仅覆盖 30/180 天清理）。
- **MAC-2** §5.4 错误分类 403/409/422/503 无逐码测试；尤其 `503 REVIEW_UNAVAILABLE`「保持原公开状态、不产生部分副作用」未被 §12 显式覆盖。
- **MAC-3** §3.1 目标 6 / §3.3 联系方式默认不公开无专项验收：公共/其他账号查询永不返回联系方式、owner 私有 API 仅返回本人联系方式。
- **MAC-4** 审核员脱敏内容读取（§4.1）无测试：审核员只看到必要脱敏字段，看不到联系方式/未成年人正文。
- **MAC-5** §4.1/§9 backup「仅超时或不可用时接管」的触发条件与接管角色/审计写入无专项测试（§12.3 L320 仅泛提「claim 接管」）。

---

## Remediation Checklist（作者修订，勿由审查方代改）

1. 定义 `actionable` 与 `terminal` 精确状态集合，统一 §5.3 L133 与 §6.3 L188/L189，明确 rejected 后编辑与申诉两条路径及 `pendingReviewVersion` 清空时机（S-001）。
2. 定义版本无关幂等去重存储与「返回原结果」语义，使 create/edit/restore 重试可去重（S-002）。
3. 将 §7.5 L236 改写为落在已定义字段/谓词上的可建索引，并说明与 §7.3 L221 禁令的边界（S-003）。
4. 明确申诉字段范围、终审决定粒度、每版本一次申诉在字段任务上的落地（S-004）。
5. 统一状态术语：将 cancel/close/stale/abandoned/closed 归入 §5.1 枚举或删除；澄清 `draft` 任务状态；修正「四场景」标题与「Unique indexes」标题（N-001/N-002/N-003/N-006）。
6. 清理 v1 遗留死文本（模型分数、邮件）（N-004/N-005）。
7. 补齐 MAC-1 至 MAC-5 验收标准（§12 增补）。
8. 修订后交 Document QA 整改批次，旧 SHA-256（C2988846…）保持不动，不补跑、不伪装为 Round 4。

---

## Open-Issue 列表

- **OI-1**（S-001）「actionable/terminal」精确定义待作者定稿；被拒后编辑 vs 409 冲突待逐字对齐。
- **OI-2**（S-002）版本无关幂等去重机制待设计；与 entityVersion 生成顺序的关系待明确。
- **OI-3**（S-003）`entity_versions_owner_entity_pending_unique` 的具体谓词/专用列待定。
- **OI-4**（S-004）申诉字段范围与 second reviewer 决定粒度待定。
- **OI-5**（N-008）审核员脱敏内容读取路径/来源待补（可列为范围外澄清，交 Issue 管理员登记）。
- **OI-6**（MAC-2）`503 REVIEW_UNAVAILABLE` 无部分副作用的专项验收待补。

---

结论：本 v2 作为完整 canonical 合同在核心状态机（S-001）、幂等（S-002）、索引可实现性（S-003）、申诉机制（S-004）四处存在影响正确性与下游实现的结构性缺口，判 **REWORK_REQUIRED**。SERIOUS 批次应完整交已登记 Document QA 整改；本审查不修订文件、不声称用户批准、不进入实现。