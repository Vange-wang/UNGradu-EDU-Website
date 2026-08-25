# 独立只读审查报告 — Round 3/3

## Metadata

| 项 | 值 |
|---|---|
| 文档 | `2026-08-23-v5-issue-0036-production-wiring-freeze-v2-spec.md`（sanitized copy） |
| 审查轮次 | 3 / 3（MAX_REVIEW_ROUNDS=3） |
| 调用模型 | deepseek-v4-pro（符合要求） |
| 审查方式 | 只读；未编辑任何文件；未声称用户批准 |
| 范围 | 仅本 sanitized copy；不含 v1 canonical、Round 2 报告或其他外部工件 |

## Verdict

**REWORK_REQUIRED**

一句话理由：第 5 行的审查轮次计数器（`CURRENT_REVIEW_ROUND=1/3`）与文档自身状态（`HERMES_ROUND_3_PENDING`）及 §14 的下一步指令（"focused Round 3/3"）直接矛盾。对一份以"精确状态冻结 + 精确字节确认"为核心交付物的治理文档而言，这是对本文件唯一功能点的实质性缺陷，影响下游执行与验收。

技术合同主体（§3–§13 状态机、双人控制、事务/幂等、fail-closed、清理/回滚）经通读内部一致、无新的 SERIOUS 技术缺陷。唯一 SERIOUS 集中在治理元数据层。

---

## Serious findings

### S-1 — 审查轮次状态自相矛盾（SERIOUS）

- **位置**：第 5 行 `CURRENT_REVIEW_ROUND=1/3`；佐证第 20 行"本轮 Round 1 必须由 Hermes 对完整连贯文档作一次整体审查"。
- **证据**：同一文件内，第 3 行与第 401 行均为 `HERMES_ROUND_3_PENDING`，第 405 行明确"组织 focused Hermes Round 3/3 仅复核 Round 2 S-1/S-2 严重修订"。第 5 行"1/3"与这三处直接冲突。
- **影响**：
  - 下游执行者无法判定当前应执行"整体 Round 1"还是"聚焦 Round 3/3"——两种解读会触发完全不同的审查动作（§14 已把唯一下一步锁定为 Round 3/3）。
  - 第 403 行要求"用户对 v2 修订后精确字节确认"，若冻结哈希前不修此计数器，等于把一份自相矛盾的治理记录定为 canonical。
  - 与第 3 行 `QA_SERIOUS_REMEDIATED` 并存时，无论按哪种解读（"仍在 Round 1"或"Round 3 pending"），都必有一处状态为错。
- **纠正**：将第 5 行改为正确值（`CURRENT_REVIEW_ROUND=3/3`）；同步改写第 20 行措辞，明确 Round 1（整体）与 Round 2（整改）已完成、当前为聚焦 Round 3。改后按第 403 行重新冻结哈希。

---

## Non-serious findings

### N-1 — 缺少"联系方式访问控制"的显式验收用例（NON_SERIOUS）
- **位置**：§12 可测试验收标准（§12.1–§12.3 均未覆盖）；需求见 §3.1 目标 6、§3.3 表、§8。
- **证据**：§12 覆盖聚合公开门、N-1/N、双人申诉、生命周期/事务/清理，但无一条显式验证 (a) owner 私有 API 能取回**自己的**联系方式，(b) 公共/其他账号在 pending/manual/rejected/appeal/deleted/unknown 及 N-1/N 任何变体下**永不**拿到联系方式。
- **影响**：核心隐私承诺（§3.1 目标 6）缺可测验收项，回归风险难被发现。
- **纠正/触发**：在 §12 增补联系方式授权用例（owner-见-自己、public-永不见-任何人），含 deleted/restored 与 N-1/N 变体。

### N-2 — 缺少"SLA 超时转移 + overdue audit/告警"的显式验收用例（NON_SERIOUS）
- **位置**：§12.3；行为定义见 §4.4、§5.2 第 125/128 行。
- **证据**：§12.3.6 覆盖 30d/180d 清理与 legal hold，但无"普通审核超时→needs_manual_review"、"申诉 SLA 超时→appealMode=true/needs_manual_review + overdue audit + 告警"的测试项。
- **影响**：超时失败路径有规范却无验收，属失败处理可测性缺口。
- **纠正/触发**：在 §12.3 增补超时转移 + overdue audit + 告警的可判定测试。

### N-3 — §6.1 aggregate 定位键漏写 entityType（NON_SERIOUS）
- **位置**：第 177 行"版本 aggregate 按 `(ownerId, entityId, entityVersion)` 唯一定位"。
- **证据**：与 §6.2 第 183 行及 §7.5 第 271 行（唯一键 = `ownerId + entityType + entityId + entityVersion`）不一致。
- **影响**：若被字面执行，可能漏建 entityType 导致跨实体类型版本冲突；§7 权威且正确，故为文档级不一致而非设计缺陷。
- **纠正/触发**：第 177 行 aggregate 键补 `entityType`。

### N-4 — 删除可见性措辞 "hidden" 与权威值 "deleted" 混用（NON_SERIOUS）
- **位置**：第 131 行（§5.2"主实体立即 hidden"）、§12.3.5"删除立即 hidden"；对照第 219 行（§6.3 `visibility=deleted`）、第 287 行（§7.6 `设置 visibility=deleted`）、§6.1 第 174 行枚举 `hidden|published|deleted`。
- **证据**：权威定义为 `deleted`，但 §5.2/§12.3.5 写"hidden"；且 §5.2 第 132 行恢复前置是 `deleted -> pending_review`，字面"hidden"会使恢复前置不成立。
- **影响**：可观察效果相同，但枚举值歧义可能影响删除态查询与恢复判定。
- **纠正/触发**：第 131 行与 §12.3.5 改为"deleted"（或"不再公开可见"）。

### N-5 — §6.3 标题"四场景"与 8 行矩阵不符（NON_SERIOUS）
- **位置**：第 207 行标题"四场景生命周期赋值矩阵"；表体第 213–220 行为 8 行（create / edit / active-review / rejected-candidate / appeal / edit-after-reject / delete / restore）。
- **影响**：标签与内容计数不符，轻微误导。
- **纠正/触发**：改标题（如"生命周期赋值矩阵"）或说明"四场景"所指范围。

---

## Contradictions

| ID | 位置 | 冲突内容 | 关联 |
|---|---|---|---|
| C-1 | L5 / L20 ↔ L3 / L401 / L405 | 轮次 `1/3` 与 `HERMES_ROUND_3_PENDING`、"focused Round 3/3" | = S-1（SERIOUS） |
| C-2 | L131 / §12.3.5 ↔ L219 / L287 / L174 | 删除态 `hidden` vs `deleted` | = N-4 |
| C-3 | L177 ↔ L183 / L271 | aggregate 键漏/含 `entityType` | = N-3 |

---

## Missing acceptance criteria

- **M-1**（= N-1）：联系方式访问控制——owner 私有可见自己、公共/其他账号任何状态永不可见（含 N-1/N、deleted/restored）。
- **M-2**（= N-2）：SLA 超时转移（普通→needs_manual_review；申诉→appealMode=true/needs_manual_review）+ overdue audit + 告警。

---

## Remediation checklist（按优先级）

1. [SERIOUS] 第 5 行改 `CURRENT_REVIEW_ROUND=3/3`，并同步第 20 行"本轮 Round 1"措辞。
2. [SERIOUS] 修正后按 §14/第 403 行重新冻结哈希并重新走用户精确字节确认。
3. 增补 M-1（联系方式访问控制）验收用例。
4. 增补 M-2（SLA 超时转移 + overdue audit/告警）验收用例。
5. 第 177 行 aggregate 定位键补 `entityType`（对齐 §7.5）。
6. 删除态措辞统一为 `deleted`（第 131 行、§12.3.5）。
7. 澄清 §6.3"四场景"标题与 8 行矩阵的关系。

---

## Open-Issue list

- **O-1**：文档引用"Round 2 S-1/S-2 严重修订"（L3 `QA_SERIOUS_REMEDIATED`、L405）但未在本文件内定义 S-1/S-2 的具体内容。本 Round 3 的"聚焦复核"范围依赖外部 Round 2 报告，该工件不在本 sanitized copy 范围内，故无法在本轮对 S-1/S-2 逐项追溯闭合——需项目方在冻结哈希时附上 Round 2 报告以完成闭环。
- **O-2**：M-1、M-2 两项验收用例补齐前，§12 的"可测试验收标准"对隐私与超时失败路径仍不完整（非阻塞，随 N-1/N-2 整改闭合）。