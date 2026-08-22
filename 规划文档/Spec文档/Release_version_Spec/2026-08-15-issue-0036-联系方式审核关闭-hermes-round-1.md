REVIEW COMPLETE — Round 1/3. I read the full document (182 lines). Report follows.

---

# Hermes 文档审查报告

## Metadata

| 项 | 值 |
|---|---|
| 文档 | 2026-08-15-issue-0036-联系方式审核关闭-spec.md（作者草案，DRAFT_NON_CANONICAL） |
| 唯一 Issue | ISSUE-0036 |
| 审查轮次 | 1 / 3 |
| 审查模型 | deepseek-v4-pro (invocation-only) |
| 审查角色 | 独立只读审查（未编辑任何文件） |
| 文件大小 / 行数 | 15,134 字节 / 182 行 |
| 审查日期 | 2026-08-15 |

## Verdict

**REWORK_REQUIRED**

存在 3 项严重问题：状态机枚举前后不一致（"manual/需人工处理"这一核心 fail-closed 目标态在验收标准中缺失，"no-go"未定义）；结果分类体系在三个章节间不对齐（"确定性命中 vs 疑似命中"的区分在输出契约中被合并丢失，"规范化失败"无对应分类）；隐私/日志最小化与仅合成语料要求缺少任何可测试验收标准。文档的 fail-closed 哲学与角色/门禁设计整体严谨，但上述矛盾会让状态机与分类契约无法被可复现地验收。

---

## Serious Findings

### S1 — 状态机枚举不一致，"manual/需人工处理"态缺失、no-go 未定义
- **位置**：§2.1(L41)、§2.3.1(L60)、§2.3.2(L61)、§5.1(L97)、§5.2(L101)、§6 V5-S2(L117)、§8.1(L136)、§9.5(L156)
- **证据**：
  - L41 "draft → pending_review → published"；L156 "draft、pending_review、published、rejected、appeal_pending、deleted"
  - L117 "pending/manual/published/rejected/appeal/deleted"
  - L60 "待审核、需人工处理、已发布、被拒绝或申诉中"（待审核 ≠ 需人工处理，是两个用户可见状态）
  - L61/L97/L136 "统一进入 pending/manual"、"转 manual/pending"、"manual/pending/no-go"
- **影响**：核心 fail-closed 目标态"manual（需人工处理）"贯穿全文，却未出现在 §9.5 的规范状态列表中，无法据此写负例测试；"no-go"仅在 §8.1 出现、无定义；"appeal" vs "appeal_pending"、pending_review vs pending 混用。状态机是 §9.5 的可测对象，命名不统一直接破坏验收可测性。
- **修正**：在 §5.2 定义唯一状态枚举（如 `draft, pending_review, manual, published, rejected, appeal_pending, deleted`），明确 `manual` 与 `pending_review` 的区别；删除或定义 `no-go`；全文（§2.3/§5.1/§6/§8.1/§9.5）统一使用同一组名称。若 `manual` 与 `pending_review` 实为同一态，则删一并留一。

### S2 — 结果分类体系三处不对齐，"确定性命中"与"规范化失败"无对应输出类别
- **位置**：§2.1(L41)、§5.2(L101)、§9.2(L153)
- **证据**：
  - L41 目标：明确联系方式、疑似联系方式、无关文本、输入/策略错误、不确定
  - L101 输出契约：allow_candidate、contact_likely、ambiguous、policy_or_input_error
  - L153 验收：确定性命中、疑似命中、无关文本、规范化失败、政策错误
- **影响**：§9.2 明确要求"确定性命中"与"疑似命中"是**两个**可复现分类，但 §5.2 只给了一个 `contact_likely`，两者被合并，确定性等级信息丢失；"规范化失败"在 §5.1/§8.1 是独立失败路径，但 §5.2 输出枚举中无对应类别（`policy_or_input_error` 无法覆盖"规范化失败"）；"无关文本"命名与 `allow_candidate` 未建立等价映射。分类契约无法闭环映射到状态机与验收用例。
- **修正**：定义唯一分类枚举，显式区分确定性命中与疑似命中（如 `contact_confirmed / contact_likely`），加入 `normalization_failure`，并给出每个分类 → 状态（allow_candidate→published 候选？contact_*→manual 等）的映射规则。

### S3 — 隐私/日志最小化与"仅合成语料"要求无验收标准
- **位置**：§7(L126 "测试只使用合成或脱敏语料"、L129 "不得保存不必要的原文、模型提示、token 或 Secret")；§9(L152–159) 无对应条目
- **证据**：§9 的 8 条验收标准覆盖分类、AI 失败、跨账号、状态转移、用户可见文案、owner 阻塞、独立复核，但**没有**任何一条校验日志/审计中不落 token/Secret/原文，也没有一条强制测试语料必须是合成或脱敏（V5-S3 涉及 AI provider 的 prompt/token，此项缺失尤其危险）。
- **影响**：隐私与 Secret 保护是 §7 的明确承诺，却不可验收；一旦 V5-S3 接 AI，日志若泄漏 token/原文将无门禁拦截。属安全/隐私风险的验收缺口。
- **修正**：在 §9 新增至少两条：① 审计/日志抽样证明不含原文命中片段、模型提示、token、Secret；② 全链路测试仅使用合成/脱敏语料，真实 PII 零出现。

---

## Non-Serious Findings

- **N1**：§1.1 与 §6 V5-S0 反复引用"14 项推荐方向"作为用户确认门禁，但全文未枚举这 14 项（§10 只列了 6 项未决）。确认清单不自包含，读者无法核对。建议附上 14 项清单或明确指向源文档具体小节。
- **N2**：§4.1 的 V3→V4→V5 串行门禁未说明 V3、V4 各指什么、其关闭证据由谁/何物承载。属外部依赖未在本文档展开，§4.2 的 base receipt 已部分覆盖，但 V3/V4 的语义应一句话点明或指向出处。
- **N3**：§2.1 断言"至少覆盖 childIntro 与 abilityDescription"（看似已定最小范围），而 §10 又把"最终审核字段与业务分类"列为用户确认前未决。最小范围 vs 最终范围可共存，但措辞易误读，建议写明"最小范围"与"最终范围"的区别。
- **N4**：§6 V5-S2 的状态列表（pending/manual/published/rejected/appeal/deleted）缺少 `draft`，与 §9.5 含 draft 不一致（draft 作为起始态属隐性，但仍建议补全）。
- **N5**：§1.2 来源表最后一行将 CONTEXT.md、AGENTS.md、钦定产品经理.md 三个来源并为一格、三枚 SHA 挤在一格，可读性差，建议拆行。

---

## Contradictions

1. **状态名矛盾**（对应 S1）：`pending_review`(L41/L156) vs `pending`(L61/L117) vs `manual`(L60/L97/L117) vs `manual/pending`(L61/L97/L136) vs `no-go`(L136)，以及 `appeal`(L117) vs `appeal_pending`(L156)。同一概念多种命名，且 `manual`/`no-go` 未进入 §9.5 规范列表。
2. **分类枚举矛盾**（对应 S2）：§2.1/§5.2/§9.2 三处分类数量与粒度不一致，`确定性命中` 与 `疑似命中` 的区分在 §5.2 被合并为 `contact_likely`，`规范化失败` 在 §5.2 无对应项。
3. **范围断言张力**（对应 N3）：§2.1"至少覆盖 childIntro 与 abilityDescription" vs §10"最终审核字段…用户确认前未决" vs §5.1"只处理被业务确认的窄字段"。若字段未确认，则"已确认的窄字段"为空集。

---

## Missing Acceptance Criteria

下列规范条款在 §9 无对应可测试条目，建议补齐：

| 条款 | 缺失的验收标准 |
|---|---|
| §8.3 回滚（"不得将'开关存在'写成已演练"） | 无回滚演练/回滚点验证的验收条目 |
| §4.1/§4.2 上游 V3/V4 串行门禁与精确 base receipt | 无"base receipt 缺失即 UPSTREAM_GATE_BLOCKED"的可测检查 |
| §7 日志不落原文/token/Secret | 无（对应 S3） |
| §7 仅合成/脱敏语料 | 无（对应 S3） |
| §6 V5-S0 "14 项方向确认" | 无（14 项未枚举，对应 N1） |

---

## Remediation Checklist

- [ ] 在 §5.2 定义唯一状态枚举并全文统一（含 `manual`、删/定义 `no-go`、统一 appeal/pending 命名）——S1
- [ ] 在 §5.2 定义唯一分类枚举，补确定性命中与规范化失败，并给出分类→状态映射——S2
- [ ] §9 新增日志/Secret 最小化 + 仅合成语料 2 条验收标准——S3
- [ ] 补 14 项推荐方向清单或明确指向源文档——N1
- [ ] 点明 V3/V4 语义或出处；补 §6 V5-S2 的 `draft`——N2/N4
- [ ] 措辞区分"最小范围"与"最终范围"——N3
- [ ] 拆分 §1.2 末行多来源单元格——N5
- [ ] §9 补回滚演练与 base-receipt 门禁的验收条目

---

## Open-Issue List

1. S1 状态机枚举统一（阻塞：§9.5 可测性）
2. S2 分类枚举与状态映射统一（阻塞：§9.2 可测性）
3. S3 隐私/日志/合成语料验收标准补全（阻塞：隐私安全验收）
4. N1 14 项方向清单落地
5. N2 V3/V4 串行门禁语义澄清
6. N3 最小/最终字段范围措辞
7. 回滚演练与 base-receipt 门禁的验收标准

以上 3 项严重问题（S1–S3）修复后进入第 2 轮复核；本轮按约定一次性报告全部可发现项，不重开文档做风格润色。未编辑任何文件，也未代表用户作任何批准。