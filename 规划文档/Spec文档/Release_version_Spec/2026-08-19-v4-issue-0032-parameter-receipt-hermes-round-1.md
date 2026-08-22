Review complete. Below is the Round 1/3 report.

---

# 独立只读复核报告 — V4 ISSUE-0032 参数候选收据

## 元数据

- 文档路径: `C:\Users\86166\AppData\Local\Temp\vange-hermes-review-021d1a89-5c80-4db4-8ed7-d4d227acad38\2026-08-19-v4-issue-0032-parameter-receipt-candidate.md`
- 文档类型: `PARAMETER_CANDIDATE`（`DRAFT_NON_CANONICAL`）
- 审查角色: 独立只读复核（未编辑文件、未代用户批准）
- 复核模型: `deepseek-v4-pro`（provider: deepseek）— 与要求一致
- 复核轮次: **1/3**
- 文档自述轮次: `CURRENT_REVIEW_ROUND=0/3`（第 10 行、第 212 行）— 为评审前快照，见 N5

## 结论

**REWORK_REQUIRED**（存在 3 项 serious findings）

---

## Serious Findings

### S1 — `action` 限流层 key 仅绑定固定动作字符串，实际是全局桶（5/15m），可行性存疑
- **位置**: §4.3 表，第 111 行；关联 §7 第 176 行
- **证据**: `| action | 5 / 15m | 固定动作 key=email_send_code |`。与 account/IP/device 三层不同，action 层未声明任何伪名作用域（account/IP/device 分别写了"规范化邮箱的 keyed pseudonym / 可信代理来源 keyed pseudonym / 服务端派生的 keyed pseudonym"），key 只有字面量 `email_send_code`。
- **影响**: 按字面实现，`email_send_code` 这一 action 限流桶是全系统共享的单一计数，即整个系统每 15 分钟最多发送 5 封验证码邮件。该值低于 account 层（3/15m）在 >1 个活跃账号下的实际容量，任何真实规模下都会阻断合法流量。作为"冻结候选参数"存在材料级歧义，会被下游实现为全局上限。
- **修正 / 后续关闭触发**: 在 §4.3 明确 action 层的完整 key 组合（例如"action 是与 account/IP/device 组合的子维度"，或"有意为全局安全阀并给出 5 这个值的依据"），并把最终 key 语义同步进 §7 第 176 行的 limit 验收项。未澄清前不得冻结该值。

### S2 — 冻结安全链首道门 "request origin/source guard" 全篇未定义
- **位置**: §2 第 28 行（列为第一道门）；§7 第 177 行（order 断言把 "request guard" 列为必测前置）
- **证据**: 完整链写为 `request origin/source guard -> provider-neutral verify -> ... -> send`，且 §7 要求顺序测试包含 `request guard`；但全文没有任何一节定义该 guard 检查什么输入、拒绝条件、HTTP 映射（§5 失败分类表中无对应行）、或独立验收项。第 67 行仅排除"把 Host/Origin/Referer 自动当 allowlist"，并未正面定义该 guard。
- **影响**: 安全链第一道门被冻结进顺序断言却无语义，无法实现、无法测试、无法验收；下游实现者只能猜测其含义（可能是可信代理校验、同源校验或别的），存在实现漂移风险。
- **修正 / 后续关闭触发**: 定义 "request origin/source guard" 的输入与拒绝语义，在 §5 增加对应失败行，在 §7 增加独立验收项；若它属于 provider-specific，则从冻结链中移除并列入 §9 PENDING_BY_GATE。

### S3 — 限流硬上限的原子性未要求，`L+1` 边界不可测
- **位置**: §4.3 第 121–122 行；关联 §7 第 176 行
- **证据**: 第 121 行 "当前计数为 L-1 的请求可以通过并达到 L；当前计数为 L 或 L+1 的请求拒绝"。§4.3（第 116–119 行）只要求"生产限流不可降级到进程内计数器、外部限流不可用时返回 503"，但未要求限流计数采用原子 check-and-increment（如 Redis INCR / Lua / 事务）。
- **影响**: 缺少原子性要求时 L 不是硬上限；"L+1 拒绝"只有在并发超发（非原子读改写）模型下才会出现，而文档未定义该并发模型。结果 §7 第 176 行要求的 "L-1/L/L+1" 验收无法被确定性构造/测试。
- **修正 / 后续关闭触发**: 在 §4.3 增加显式要求——生产限流器必须执行原子 check-and-increment，使 L 成为硬上限；并说明 "L+1 拒绝" 是否作为超发后的防御性兜底，给出构造 L-1/L/L+1 测试的并发模型。

---

## Non-Serious Findings

### N1 — "核心产品安全链" 省略了 cooldown 与 request guard
- **位置**: §2 第 39 行 `verify -> consume -> limit -> send`
- **影响**: "核心链"四步省略了同样是发送阻断门的 `request origin/source guard` 与 `既有 email 60s cooldown`，下游可能误当穷举。建议标注为"核心顺序（非穷举）"。

### N2 — device 伪名派生输入未定义
- **位置**: §4.3 第 110 行 "服务端派生的 keyed pseudonym；不保存 raw UA/语言串"
- **影响**: 阈值 5/15m 已冻结，但 device 身份由什么派生（TLS 指纹？无 cookie 设备 ID？）未定义，后续测试作者无法落地 device 限流用例。建议明确派生输入或显式标注为实现期 PENDING。

### N3 — `unknown-proxy` 桶无阈值
- **位置**: §4.3 第 116 行
- **影响**: 仅说"进入独立 unknown-proxy bucket，不能自动放行"，但未给出该桶的数值上限，验收矩阵也无法覆盖。建议补数值或明确为 fail-closed 默认拒绝。

### N4 — 5s 新 challenge cooldown 与"保持不变"的继承值未纳入 §7 验收矩阵
- **位置**: §4.4 第 128–131 行；§7 第 170–181 行
- **影响**: 新增的 5s challenge 重取 cooldown、以及"保持不变"的 60s 冷却 / 5m code TTL / 5 次 wrong-code，均未出现在 §7 合同矩阵（第 177 行只覆盖 "existing cooldown" 顺序，未覆盖数值）。建议补测试项或声明由既有测试覆盖。

### N5 — 文档元数据轮次停留在 0/3
- **位置**: 第 10 行、第 212 行
- **影响**: 本次已是 Round 1/3，但文档仍写 `CURRENT_REVIEW_ROUND=0/3` 与"本轮未调用 Hermes"。非阻断，但冻结前必须更新为 1/3。

### N6 — §3 外部事实绑定（SHA-256 / git HEAD / 测试文件 hash）无法从本清洗副本独立核验
- **位置**: §3 第 49–54 行
- **影响**: 各 SHA-256、`ee41c3f3…`、`bc095120…` 等均为外部断言，本次只读复核无法对原仓库/文件验真。冻结前需独立重新核验这些绑定。

### N7 — "窗口年龄" 固定窗 vs 滑动窗歧义
- **位置**: §4.3 第 122 行
- **影响**: "窗口年龄 W-1 在原窗、等于 W 进新窗"未声明是固定 15m 桶还是滑动窗。建议明确，否则 §7 窗口验收项的构造方式会分歧。

### N8 — cleanup 行为（只删过 `cleanup_after`、不得改变 TTL 结论）未进 §7 验收矩阵
- **位置**: §4.2 第 95–96 行；§7 第 175 行仅覆盖"清理失败不放行"
- **影响**: 两条明确的 cleanup 约束缺独立验收项。建议在 §7 增加 cleanup 行为验收行。

---

## Contradictions

未发现文本层面的硬矛盾。最接近的是 N1（"核心链"与"完整链"不一致的表述），已在非阻断项中记录，不构成 contradiction。

---

## Missing Acceptance Criteria（需在冻结前补入 §7 的项）

1. "request origin/source guard" 的独立行为与失败映射（对应 S2）。
2. action 限流层的完整 key 组合与数值依据（对应 S1）。
3. 限流原子 check-and-increment 与 L 硬上限证明（对应 S3）。
4. 5s challenge 重取 cooldown、60s 冷却、5m code TTL、5 次 wrong-code 的数值验收（对应 N4）。
5. cleanup 行为（只删过期标记、不改变 TTL 结论）的验收项（对应 N8）。
6. `unknown-proxy` 桶的阈值或 fail-closed 语义验收（对应 N3）。

---

## Remediation Checklist（Round 2 前需完成）

- [ ] S1: 定义 action 限流 key 作用域并给出 5/15m 依据，同步 §7。
- [ ] S2: 定义或移除 "request origin/source guard"，补齐 §5 失败行与 §7 验收项。
- [ ] S3: 增加生产限流原子 check-and-increment 要求，明确 L+1 的并发模型。
- [ ] N5: 更新 `CURRENT_REVIEW_ROUND` 为 1/3。
- [ ] N2/N3/N7: 明确 device 派生输入、unknown-proxy 阈值、窗口类型。
- [ ] N4/N8: 将 5s cooldown、继承值、cleanup 行为补入 §7。
- [ ] N6: 冻结前对 §3 各 SHA-256/git 绑定做独立重新核验。

---

## Open-Issue List

- ISSUE-0032 参数冻结：待 S1/S2/S3 关闭后重新复核（Round 2）。
- 真实 provider、endpoint、site key/Secret、hostname、provider response mapping：仍 `PENDING_BY_GATE`（§9）。
- 客户端 seam（challenge token 携带 / 生命周期）：仍缺失（§7 第 181 行）。
- ISSUE-0031、数据库、付费动作：继续延期。
- 最终收据 SHA-256、用户最终确认：`PENDING_BY_GATE`（§10）。

---

**判定: REWORK_REQUIRED** — 3 项 serious findings（S1/S2/S3）须在进入实现或冻结前修复；其余为非阻断项，可随 Round 2 一并关闭。本轮未编辑任何文件，未代用户批准。