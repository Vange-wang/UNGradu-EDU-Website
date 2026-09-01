# 独立只读审查报告

## Metadata
- 文档：`2026-08-31-issue-0042-0045保守决策冻结与transfer合同-spec-addendum.md`
- 状态声明：`DRAFT_NON_CANONICAL / AUTHOR_DRAFT / HERMES_REVIEW_PENDING`
- 作者/写入 owner：产品经理 Agent v2.3.2（`019fefa7-…`）
- 审查角色：独立只读 reviewer（未编辑任何文件，未代用户批准）
- 调用模型：deepseek-v4-pro

## Round
1 / 3（新冻结范围，首次整批报告）

## Verdict
**PASS_WITH_NONBLOCKING_OPEN_ISSUES**

未发现 SERIOUS 级缺陷。文档自洽、边界声明克制（多处显式"不等于已证明/不改变 Issue 状态/不写 resolved runtime"），三项已识别的实现差距（TTL `>` 边界、匿名 device keyed pseudonym、`cleanup_after` 缺失）均被正确路由到实现/独立复核包而非静默写成已通过。剩余均为非阻塞的完整性/措辞/术语一致性问题。

---

## Serious Findings
无。

## Non-Serious Findings

**N1 — 八项任务包缺少 owner 字段（与文档自身"每项须有 owner"矛盾）**
- 位置：第 82 行声明"每项须有 owner、路径、符号、测试、receipt 和停止条件"；第 84–93 行表格列仅为「项目/精确执行面/最小测试与预期证据/停止条件」，无 owner 列。
- 证据：表格 8 行（R1-N3、R1-MAC-1/3/5、R2-N4/N6/N8/N9）均无 owner 归属。
- 影响：第 135 行关单条件要求"明确 owner"，但本附录未给出 owner 及其赋值触发点；影响下游执行与验收可归因性。因实现授权已显式后置（"只授权在后续独立实现授权中执行"），属前瞻性缺口而非当前阻断。
- 修正/闭合触发：在表格增加 owner 列（可写"待独立实现授权时指定"），或明示 owner 赋值的前置触发事件；否则第 135 行"明确 owner"在本附录通过时无法被回读验证。

**N2 — R2-N2 边界输入的预期结果未写死（截断 vs 拒绝）**
- 位置：第 66 行验收边界列 UA 255/256/257、语言 127/128/129，但未声明超限（257/129）的期望行为。
- 影响：实现者无法确定超限输入是"截断后接受"还是"拒绝"，验收断言歧义。
- 修正：明确每个边界输入的 pass/fail 期望（如 >max 截断、空值拒绝、Unicode 规范化按 NFD/NFC 固定其一）。

**N3 — R2-N6 "精确执行面"不含具体路径/符号**
- 位置：第 91 行。范围是"base receipt 与提交/树/package/测试证据绑定"，无 `server/…` 路径或符号，与第 82 行"路径、符号"要求不符（其余 7 项均有）。
- 影响：接收件绑定任务为元任务，执行面含糊，复核难以定位。
- 修正：补 `Code文档/` 下对应 receipt 生成脚本/目录，或显式标注"无代码面，纯证据绑定"。

**N4 — "三项差距"少计 cf-connecting-ip 信任差距**
- 位置：第 44 行声明"特别记录三项差距"，但第 42 行已确认"email-auth-api.ts 将 cf-connecting-ip 送入 proxy key 路径"，与第 70 行 R2-N3"不得凭字段名自动视为可信"构成第四项当前行为与目标合同的差距。
- 影响：差距计数不一致（该差距虽经 R2-N3+停止条件追踪，未计入汇总）。
- 修正：将第 44 行改为"四项差距"或补一句说明 proxy-header 信任差距经 R2-N3 单列。

**N5 — R1-MAC-3 与 R2-N8 在 cleanup 语义上重叠，定义归属拆分**
- 位置：第 88 行（R1-MAC-3 含 `cleanup_after` 约定）与第 92 行（R2-N8 定义 `cleanup_after=expires_at+1h` 公式）。
- 影响：`cleanup_after` 的权威定义在 R2-N8，R1-MAC-3 却引用"约定"，两包职责边界可能让实现者不确定谁冻结公式。
- 修正：R1-MAC-3 显式引用"以 R2-N8 冻结的公式为准"。

**N6 — 新状态/处置词未确认在 canonical 状态枚举中合法**
- 位置：第 12/52/58/103 行引入 `RESOLVED_BY_DOC`、`RESOLVED_BY_DOC_TRANSFER_CONTRACT`、`DECISION_FROZEN`、`PENDING_BY_GATE`。
- 影响：这些是否为 Issue 台账既有合法枚举值未确认；第 103 行虽给兜底（否则保持 `EXTERNAL_OR_USER_BLOCKED`），但术语需管理员登记。
- 修正：由 ISSUE 管理员确认/登记新状态词，或统一改用既有枚举并保留映射说明。

**N7 — 固定窗表达式歧义**
- 位置：第 76 行 `current-windowStartedAtMs < W`（应为 `current - windowStartedAtMs < W`，缺减号/空格渲染）。
- 影响：可被误读为连字符标识符；上下文（"窗口起点=首次接受计数时间"）已能消歧，但合同措辞应精确。
- 修正：改为 `(currentTimeMs - windowStartedAtMs) < W`。

**N8 — "未成年人字段"等隐私排除为模板套用，语境不贴**
- 位置：第 62/87/108/117 行，涉及 device pseudonym、脱敏扫描、补偿事务、risk_feedback，均在无年龄字段场景中声明排除"未成年人字段"。
- 影响：无害（过度排除是安全侧），但暴露模板复制痕迹，降低专业可信度。
- 修正：仅在确有年龄字段面（如 risk_feedback）保留，其余场景删或改通用表述。

**N9 — R2-N4 未对 code TTL 做 T-1/T/T+1 边界断言**
- 位置：第 90 行。challenge TTL 明确要求 `T-1/T/T+1` 与 `T=300s` 边界，但 "5m code TTL" 只写"边界 receipt"，未要求同等三值断言。
- 影响：login code TTL 与 challenge TTL 同为 300s 却被区分对待，测试覆盖不对称。
- 修正：为 code TTL 补 `T-1/T/T+1` 断言，或说明为何仅 challenge TTL 需严格边界。

## Contradictions
- 第 82 行"每项须有 owner" ↔ 第 84–93 行表格无 owner 列（见 N1）。
- 第 44 行"三项差距" ↔ 实际存在第四项 proxy-header 信任差距（见 N4）。
- 第 16 行"不选择…Secret" ↔ 第 64 行指定派生密钥 `AUTH_RATE_LIMIT_KEY_SECRET`（倾向解读为引用 rate-limit.ts 既有标识符，非新选 Secret 值，建议一行澄清以排除实现者误读）。
- 第 19 行"本附录通过不改变任何 Issue 状态" ↔ 第 103 行允许管理员将 `O-003` 改判 `RESOLVED_BY_DOC_TRANSFER_CONTRACT`（不矛盾，为"附录不越权、管理员可改判"的授权分离，已妥善限定，仅提示读者区分）。

## Missing Acceptance Criteria
1. 八项任务包 owner 归属及赋值触发点（N1）。
2. R2-N2 边界输入（UA 257 / lang 129）的期望结果（N2）。
3. code TTL 的 `T-1/T/T+1` 边界断言（N9）。
4. 新状态词在 canonical 枚举中的合法性确认（N6）。

## Remediation Checklist
- [ ] 表 4 补 owner 列或明示赋值触发（N1）
- [ ] 第 66 行写死边界输入期望（N2）
- [ ] R2-N6 补执行面或标注"纯证据绑定"（N3）
- [ ] 第 44 行差距计数改为四项（N4）
- [ ] R1-MAC-3 引用 R2-N8 为 `cleanup_after` 权威来源（N5）
- [ ] 状态词交 ISSUE 管理员登记（N6）
- [ ] 第 76 行补减号使表达式精确（N7）
- [ ] 清理语境不贴的"未成年人字段"（N8）
- [ ] R2-N4 补 code TTL 边界断言（N9）
- [ ] 第 64 行加一行澄清 Secret 命名与"不选 Secret"边界（Contradictions）

## Open-Issue List
- O-1：owner 字段补全与赋值触发（阻塞项：N1，交 ISSUE 管理员/实现授权时闭合）
- O-2：`RESOLVED_BY_DOC*` 等状态词 canonical 登记（N6）
- O-3：cf-connecting-ip 信任差距是否补入"差距"汇总（N4）
- O-4：R2-N2 超限输入语义冻结（N2）
- O-5：code TTL 边界测试规格（N9）

---

备注（元观察，非文档缺陷）：本报告仅依据脱敏副本；第 24–40 行 SHA-256/bytes/lines 无法在只读副本内独立验算，文档已正确将其核对责任指派给项目总负责人（第 141 行"核对本附录 hash"），与本审查职责不冲突。