I have read the full 435-line document. Now conducting holistic analysis across all dimensions: correctness, completeness, consistency, testability, security/privacy, and downstream executability.

---

## Round 1/3 — Independent Hermes Review

**Metadata**

| Field | Value |
|---|---|
| Document | ISSUE-0036 联系方式快速智能审核 Spec |
| Version | DRAFT_NON_CANONICAL / HERMES_REVIEW_PENDING |
| Date reviewed | 2026-08-10 |
| Round | 1 of 3 |
| Reviewer model | deepseek-v4-pro |
| Artifact hash (reviewed copy) | As provided in sanitized path |

**Verdict: REWORK_REQUIRED**

Seven serious findings and seven non-serious findings identified. The document has a strong architectural skeleton (方案B choice, fail-closed philosophy, layered detection, clear role separation) but contains one outright mathematical impossibility in SLOs, several undefined terms that block testability, and a structural ambiguity in the normalization pipeline that could undermine the detection it intends to enable.

---

### Serious Findings

**F-001 — SLO硬超时与p95目标数学矛盾**
- **Severity**: SERIOUS
- **Location**: §9 SLO表, "自动审核路径"行
- **Evidence**: `p95 ≤10 秒，硬超时 5 秒`
- **Impact**: 硬超时5秒意味着没有任何请求能超过5秒，p95不可能为10秒。该指标物理上不可实现，会导致验收不可测试，且实施方无法确定以哪个值为准。
- **Correction**: 硬超时必须 ≥ p95 目标。建议将硬超时调整为 ≥10秒（如12-15秒），或将p95收紧至 ≤硬超时。需业务方确认实际可接受的延迟上限。

**F-002 — NFKC标准化与Unicode同形检测的执行顺序冲突**
- **Severity**: SERIOUS
- **Location**: §4.2 标准化流水线，步骤2与步骤4
- **Evidence**: 步骤2先执行 `Unicode NFKC` (包含全角→半角转换、连字分解等)，步骤4再 `识别 Unicode 同形/混淆字符`。NFKC会不可逆地消除部分同形字符的视觉差异（如全角Ａ→半角A、连字ﬁ→fi），导致步骤4失去可检测的原始混淆形态。
- **Impact**: 攻击者使用NFKC可归一的同形字符时，检测层可能漏检。隐私保护的正确做法是先检测混淆、再标准化用于规则匹配，而非先标准化后检测。
- **Correction**: 明确步骤顺序：先执行混淆检测（基于原文），再执行NFKC标准化（用于规则匹配）。或改为NFKC在保留原始偏移映射的前提下执行，步骤4使用原始文本而非标准化副本。

**F-003 — "高置信确定性命中"未定义，验收标准不可测试**
- **Severity**: SERIOUS
- **Location**: §5.1 ¶2, §9 SLO表"高置信确定性命中"行, §10.1 ¶2
- **Evidence**: §5.1仅给出举例（"例如完整邮箱、明确电话号码或明确带账号标签的QQ/微信"），§9要求"公开漏放 0"，§10.1要求"高置信命中不漏放"——但精确定义被推迟到§2.3第3项业务确认，至今空缺。
- **Impact**: 验收矩阵的核心指标（零漏放）的判定边界不存在。实施方无法设计测试用例；审核方无法判定通过/失败。即使业务方后续确认，本轮审查也无法评估该指标的合理性。
- **Correction**: 至少给出可操作的判定框架（如：邮箱=含@且有有效域名部分；手机=11位1开头连续数字且不在已知日期/价格模式中），标注"待业务方收紧"。零定义就无法零验收。

**F-004 — 软删除恢复重审：推荐默认 vs 验收强制的不一致**
- **Severity**: SERIOUS
- **Location**: §6.1 ¶5 vs §10.2 ¶4
- **Evidence**: §6.1写明"上述恢复重审是推荐默认，具体是否对所有规则版本强制重审需业务确认"；但§10.2集成验收直接写"0033 软删除 48h、聊天只读、联系方式禁用/恢复重校验不回退"，将推荐默认当作已批准的强制要求。
- **Impact**: 验收矩阵引用了一个尚未确认的语义。若业务方最终否决该默认，集成验收条目需回退；若业务方沉默，实施方不知道该实现推荐版本还是等待确认。
- **Correction**: §10.2恢复重校验条目增加前置条件标注`[待业务方确认恢复重审最终语义]`，或将§6.1的"推荐默认"升级为"本Spec规定"（需产品经理决策）。

**F-005 — AI供应商侧日志/数据处理未覆盖**
- **Severity**: SERIOUS
- **Location**: §8.3 隐私段落
- **Evidence**: §8.3详细规定了平台侧"普通日志"不记录敏感内容，要求禁止供应商训练、确认DPA。但未提及AI供应商自身的请求/响应日志——大多数AI API提供商会在服务端保留日志（用于滥用监控等），这些日志可能包含用户原文。
- **Impact**: 即使平台侧日志脱敏，若供应商保留含原文的请求日志，未成年人数据仍可能出域且不受平台审计控制。这是§1.1明确表达的隐私关切（"不能把存档联系方式、聊天正文或未成年人资料发送给不必要的外部服务"）但§8.3未闭环。
- **Correction**: §8.3增加一项："确认AI供应商的请求/响应日志策略（保留期、用途、是否可禁用），并纳入§2.3决策门第5项（供应商确认）范围"。

**F-006 — 合法数字上下文规则未指定**
- **Severity**: SERIOUS
- **Location**: §4.2 步骤3
- **Evidence**: `避免把正常地址、年份、成绩、价格误判为联系方式`——但未给出任何区分规则。例如：什么模式是"正常地址"？年份范围是什么？成绩的数字范围？价格的前缀/后缀模式？
- **Impact**: 检测层的高召回必然伴随高误杀。若反误杀规则不存在，§9 SLO的"清洁样本误杀≤2%"目标几乎不可能达成，且验收测试的黄金集无法构造。
- **Correction**: 至少定义排除规则框架（如：4位数字+年=年份、数字+元/块/¥=价格、数字+分/级=成绩），标注为初始规则待业务方补充。该框架是阶段A（字段盘点与黄金集）的前提输入。

**F-007 — 状态机"非法转换"未穷举**
- **Severity**: SERIOUS
- **Location**: §10.1 ¶4
- **Evidence**: `状态机所有合法/非法转换...有覆盖`——但§6.1仅描述了合法转换路径，未列出任何一条显式禁止的转换（如：rejected→published跳过pending_review、deleted→published直接恢复、stale result导致的状态跳跃）。
- **Impact**: 验收声称覆盖"非法转换"但非法转换集合不存在。测试设计者无法判断哪些路径该被阻止，也无法验证阻止机制是否有效。
- **Correction**: §6.2状态不变量后增加"禁止转换"清单，至少覆盖：rejected↛published、deleted↛published（跳过重审）、任意状态↛published（绕过pending_review）、stale审核结果↛published。

---

### Non-Serious Findings

**N-001 — "高风险自动拒绝"术语未定义**
- **Location**: §5.3 "高风险自动拒绝可由业务方批准的规则触发"
- **Note**: 与F-003不同，此处是安全兜底机制，明确需要业务方批准才触发。但什么是"高风险"缺少哪怕是举例级的说明。
- **Suggested fix**: 增加一个括号举例（如：含完整银行卡号+姓名、含明确线下地址+电话组合），标注待业务确认。

**N-002 — 相同内容合并审核的跨用户边界未澄清**
- **Location**: §7 "用户连续提交相同内容可合并审核"
- **Note**: 合并是否跨用户？若不同用户的childIntro相同，合并审核可能导致审核结果误共享。从上下文(entityId/ownerId)推断应为同entity内合并，但表述可被误读。
- **Suggested fix**: 改为"同一entityId下相同内容版本的连续提交可合并审核"。

**N-003 — 队列重试"有限次数"未指定数值**
- **Location**: §7 "队列重试采用有限次数和退避；超限转人工"
- **Note**: "有限"是对重试的基本约束，具体数字由实现决定。但SLO计算依赖退避时间，建议至少给一个推荐范围（如3-5次）。
- **Suggested fix**: 改为"有限次数（建议3-5次，待业务确认）"。

**N-004 — AI解析失败仅重试一次，无退避策略**
- **Location**: §5.2 "解析失败重试一次，仍失败进入人工"
- **Note**: 单次重试在瞬时故障下合理，但无退避可能在供应商短暂限流时立即失败。影响有限（最终转人工），但延迟可优化。
- **Suggested fix**: 增加"重试间隔建议200-500ms"。

**N-005 — 用户可见文案仅中文**
- **Location**: §6.3
- **Note**: §2.3第2项提到"其他语言/国家号码"，但用户提示文案未规划多语言。对于平台定位，初期中文可接受，但应在§2.3决策门中标注多语言为未来项。
- **Suggested fix**: 在§2.3增加"用户可见文案的语言范围（首期仅中文）"。

**N-006 — 文本字段中嵌入URL/图片内容的风险未涉及**
- **Location**: 全文
- **Note**: §5.1规定"不发起网络请求"检测URL，§4.1排除图片OCR。但用户在childIntro/abilityDescription中粘贴的可达URL或base64图片数据未被明确讨论（仅说不抓取URL，未说如何处理含URL的文本被外部查看）。
- **Suggested fix**: §4.1或§5.1增加一句："审核通过后公开展示的文本中的URL由前端渲染策略控制（如nofollow/noopener），不属本审核流程范围但需安全复核确认"。

**N-007 — 分阶段计划缺少时间估算**
- **Location**: §12
- **Note**: 作为未授权草案，不给时间估算是合理的。但如果要进入实施授权，各阶段需要工作量估算作为排期输入。
- **Suggested fix**: 加注"时间估算待0036 owner登记后由各阶段负责人提供"。

---

### Contradictions Identified

| ID | Contradiction | Locations |
|---|---|---|
| C-001 | 硬超时5秒 < p95≤10秒，数学上不可共存 | §9 SLO表 |
| C-002 | 恢复重审被标记为"推荐默认"(§6.1)但验收矩阵要求其"不回退"(§10.2) | §6.1 vs §10.2 |

---

### Missing Acceptance Criteria

以下关键场景在§10验收矩阵中缺少显式验收条目：

1. **标准化流水线自身正确性**: §10.1未单独验收NFKC/全半角/零宽/偏移映射的正确性和不可逆性。
2. **URL/社交ID检测专项**: §10.1列举了邮箱、手机、座机、微信、QQ，但未列URL和社交ID变体的专项验收。
3. **Fail-closed行为矩阵**: §8.1列出12种不得公开的场景，但§10验收矩阵未逐条对应验证（仅集成验收笼统提及）。
4. **提示注入防护有效性**: §10.2集成验收末尾仅提一句，缺少具体的注入样本与预期行为。
5. **成本熔断端到端**: §8.2描述预算上限停止外部调用，但§10验收矩阵未覆盖成本熔断的触发与恢复。
6. **移动端可访问性**: §6.3要求键盘/屏幕阅读器/移动端换行支持，但§10未验收可访问性。

---

### Remediation Checklist (for next round)

| # | Item | Priority | Owner (Role) |
|---|---|---|---|
| 1 | Fix F-001: align hard timeout ≥ p95 target | Blocker | 产品经理 |
| 2 | Fix F-002: reorder homoglyph detection before NFKC | Blocker | 产品经理 |
| 3 | Fix F-003: define "高置信确定性命中" operational framework | Blocker | 产品经理 |
| 4 | Fix F-004: resolve recovery re-check default vs acceptance inconsistency | Blocker | 产品经理 |
| 5 | Fix F-005: add AI provider-side logging to privacy scope | Blocker | 产品经理 |
| 6 | Fix F-006: specify legal-number exclusion rules framework | High | 产品经理 |
| 7 | Fix F-007: enumerate prohibited state transitions | High | 产品经理 |
| 8 | Address N-001 through N-007 at author discretion | Low | 产品经理 |
| 9 | Add missing acceptance criteria (6 items above) | High | 产品经理 |
| 10 | Resolve C-001 and C-002 contradictions | Blocker | 产品经理 |

---

### Open Issues (carry-forward to Round 2)

These are intrinsic to the draft nature and do not block Round 1 pass, but must be tracked:

- OI-001: §2.3 全部7项决策门均待业务方确认——这些是文档声明的外部依赖，不是文档缺陷。
- OI-002: §2.2 所有角色尚未登记具体人员——不阻塞Spec审查。
- OI-003: §14 未决业务门禁清单中的供应商/预算/OCR/保留期等——第二轮不重新打开这些，除非F级修复引入了新依赖。
- OI-004: SHA-256引用的三个外部工件无法验证——文档自我声明为只读引用，审查范围不包括外部工件一致性。

---

**Round 2 entry condition**: All 7 serious findings (F-001 through F-007) must have documented resolution (fix applied or explicit rejection with rationale from product manager). Round 2 will verify serious fixes and affected regressions only; it will not reopen non-serious findings or stylistic points.