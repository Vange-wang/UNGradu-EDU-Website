# Hermes 文档审查报告 — Round 2/3

## Metadata

| 项 | 值 |
|---|---|
| 文档 | 2026-08-15-issue-0036-联系方式审核关闭-spec.md（V5 作者草案，DRAFT_NON_CANONICAL） |
| 审查对象 | 本 bundle 内「CURRENT CANONICAL CANDIDATE」L5–L202（198 行，与整改记录 CEA06C42…F563E / 198 行一致） |
| 审查轮次 | 2 / 3 |
| 审查模型 | deepseek-v4-pro（invocation-only） |
| 审查角色 | 独立只读审查（未编辑任何文件，未代表用户批准） |
| 本轮范围 | 仅复核 Round 1 严重项 S1/S2/S3 及修复直接引发的回归；不重开 N1–N5、风格或措辞 |

## Verdict

**PASS_WITH_NONBLOCKING_OPEN_ISSUES**

S1、S2、S3 三项严重问题均已核实修复，未发现修复引入的严重回归。非严重项与缺失验收项继续单独跟踪，不在本报告阻塞范围。

## Serious Findings

无。三项原始严重项逐条核验如下：

**S1 — 状态机枚举不一致 → 已修复。**
- L105 冻结唯一枚举 `draft、pending_review、needs_manual_review、published、rejected、appeal_pending、deleted`，并明确定义 `pending_review`（服务端已接收、等待确定性/自动审核）与 `needs_manual_review`（联系方式信号/歧义/规范化/服务/策略失败/需人工决定）的区别，二者均不得公开。
- L174（§9.5）验收标准现含全部七态，核心 fail-closed 目标态 `needs_manual_review` 已进入可测对象。
- 全文扫描：`no-go`、裸 `manual`、裸 `pending`、裸 `appeal` 别名均已清除；L61/L65/L119/L135/L154 统一使用规范名称。无残留矛盾。

**S2 — 结果分类体系不对齐 → 已修复。**
- L45（§2.1）与 L109–L117（§5.2）与 L171（§9.2）三处分类枚举对齐为七类：`allow_candidate、contact_confirmed、contact_likely、ambiguous、normalization_failure、input_error、policy_error`。
- 确定性命中（`contact_confirmed`）与疑似命中（`contact_likely`）已显式区分，不再合并丢失；`normalization_failure` 已加入分类枚举并有映射。
- L109–L117 给出完整「分类→状态」映射与约束；L119 明确「分类本身不得直接产生 published 或 rejected」。契约闭环可验收。

**S3 — 隐私/日志/仅合成语料无验收标准 → 已修复。**
- L177（§9.8）：新增「仅合成/去标识语料 manifest + 自动扫描与独立人工抽检零真实 PII」门禁，任一真实 PII 命中即阻塞。
- L178（§9.9）：新增「结构化日志/审计 allowlist，不保存原始正文、语义命中片段、模型 prompt、token、Secret 或完整联系方式」门禁，任一越界字段即阻塞。
- 覆盖 Round 1 建议的两条缺失验收标准，且明确纳入 V5-S3 AI provider 场景。

## Non-Serious Findings（本轮新增，非阻塞，非 S1–S3 回归）

- **N-R2-1**：`allow_candidate → pending_review`（L111）的约束「后续经授权审核决定才可 published」未显式写清该发布过渡的执行角色、以及 clean 内容是否需要经过 `needs_manual_review` 再发布。属局部清晰度；fail-closed 语义已显式（分类不直接 publish、需获授权决定），§9.2 可测，不构成 material ambiguity，非阻塞。

## Contradictions

无。Round 1 对应的两类矛盾（状态名混用、分类枚举三处不对齐）均已消除。Round 1 的范围措辞张力（N3，最小范围 vs 最终范围）属非严重，不在本轮范围，不重开。

## Missing Acceptance Criteria

S3 对应的两条（日志/Secret 最小化、仅合成语料）已由 §9.8、§9.9 补齐。Round 1 曾列出的「回滚演练验收条目」「base-receipt 门禁可测检查」未获 S1–S3 严重编号，属单独跟踪项，本轮不重开、不阻塞。

## Remediation Checklist

- [x] S1：§5.2 唯一状态枚举冻结 + 全文统一，no-go/别名清除 —— 核实通过
- [x] S2：唯一分类枚举 + 确定性命中/疑似命中区分 + normalization_failure + 分类→状态映射 —— 核实通过
- [x] S3：§9 新增日志/Secret 最小化 + 仅合成/去标识语料两条验收 —— 核实通过
- [ ] （非阻塞，另行跟踪）N-R2-1 allow_candidate 发布过渡路径的局部澄清
- [ ] （非阻塞，另行跟踪）Round 1 N1–N5 及回滚演练 / base-receipt 门禁验收条目

## Open-Issue List

1. ~~S1 状态机枚举统一~~ —— 本轮核实关闭
2. ~~S2 分类枚举与映射统一~~ —— 本轮核实关闭
3. ~~S3 隐私/日志/合成语料验收补全~~ —— 本轮核实关闭
4. N-R2-1 allow_candidate 发布过渡路径（非阻塞，单独跟踪）
5. Round 1 N1–N5 非严重项（单独跟踪）
6. 回滚演练与 base-receipt 门禁的验收条目（单独跟踪）

以上结论仅代表本 bundle 内 sanitized 候选文本的独立只读审查结果；不构成用户批准、实现授权、分支完成、部署、生产验收或 Issue 关闭。下一轮（3/3）仅在 S1–S3 或 N-R2-1 出现严重回归时重开。