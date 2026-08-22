# 独立只读复核报告 — V4 ISSUE-0032 参数候选收据（Round 2/3）

## 元数据

- 文档路径: `C:\Users\86166\AppData\Local\Temp\vange-hermes-review-d8dd0251-4b0b-4ae2-9a61-0a92680e1343\round2-sanitized-packet.md`
- 文档类型: `PARAMETER_CANDIDATE`（`DRAFT_NON_CANONICAL`）
- 审查角色: 独立只读复核（未编辑文件、未代用户批准）
- 复核模型: `deepseek-v4-pro`（provider: deepseek）— 与要求一致
- 复核轮次: **2/3**（上一轮已用 1/3，QA 整改不重置计数）
- 本包内容: 修订后 canonical candidate（正文 14–273 行）+ Round 1 报告 + Document QA ledger（均为参考证据）

## 结论

**PASS_WITH_NONBLOCKING_OPEN_ISSUES**

三项 serious（S1/S2/S3）均已按整改要求修复并通过验证；未发现整改引入的新 serious 或未在 Round 1 合理发现的新 serious。N1–N8 维持 NON_SERIOUS，未因本次修订产生材料缺陷。

---

## Serious Findings

**无。** S1/S2/S3 逐项验证如下：

- **S1（action 限流全局桶）— 已关闭。** §4.3 第 145 行 action key 已改为 `environment_ref + email_send_code + ip_pseudonym` 经无歧义分隔、带 `key_version` HMAC 生成 `action_pseudonym`，并明确「绝不是全站固定动作单桶」（第 155–162 行补全规范化输入与分桶/共享语义）。§7 新增 `action scope` 行（第 234 行）定向证明非全局：网络 A 填满 5 次后第 6 次 429、网络 B 首次仍通过、两网络伪名计数互不占用。原 S1 的「全局 5/15m」缺陷已消除。
- **S2（request origin/source guard 未定义）— 已关闭。** §4.1.1（第 91–110 行）给出输入（请求方法、显式 Origin、allowlist 配置引用、匿名预认证写入判定、media type）、三条通过条件、403/503 拒绝映射、fail-closed 与禁止自举 allowlist。§5 新增三行（Origin 缺失/不允许→403、media type 非 JSON→403、guard/allowlist 配置不可用→503，第 186–188 行）。§7 新增 `request guard` 独立行（第 228 行）并在 `order`/`failure` 行覆盖首门短路与映射。
- **S3（限流无原子性、L+1 不可测）— 已关闭。** §4.3 第 164–170 行明确「所有 active layers 一次原子事务式 check-and-increment」「禁止部分落账」、L 硬上限语义与「L+1 = 饱和后额外尝试/并发输家，非持久化超发」、事务/存储不可用→503 零增量。§5 新增 `rate-limit transaction/store unavailable` 行（第 198 行）。§7 `limit` 行（第 233 行）给出可确定性构造的并发验收（预置 L-1 + 同步屏障并发 ≥2 同 key，恰 1 个到 L，其余 429，最终精确 L）。

---

## Non-Serious Findings

以下 N1–N8 维持 NON_SERIOUS（QA ledger 第 459–466 行明确未关闭，本次修订未产生材料缺陷）：

- **N1** — §2 第 49–53 行「核心产品安全链」仍为 `verify -> consume -> limit -> send`，省略 request guard 与既有 60s cooldown。未改措辞。
- **N2** — §4.3 第 144 行 device 伪名仍仅写「服务端派生的 keyed pseudonym」，派生输入未定义。
- **N3** — 第 150、161–162 行 `unknown-proxy` 桶仍无阈值/策略；与 S1 整改后 action key 复用 `ip_pseudonym` 交互（未知来源共享同桶→动作层对该类请求近似收敛），但方向为保守 fail-closed，不构成安全或可行性缺陷。
- **N4** — 5s challenge 重取 cooldown、60s 冷却、5m code TTL、5 次 wrong-code 的数值验收仍未进 §7（第 226–239 行无对应行）。
- **N5** — 文档元数据 `CURRENT_REVIEW_ROUND=0/3`（第 23 行）与 §10「Hermes 当前轮次为 0/3」（第 270 行）未更新。
- **N6** — §3 各 SHA-256 / git HEAD / 测试文件 hash 为外部断言，本只读清洗副本无法独立验真（第 60–67 行）。
- **N7** — 第 170 行窗口语义仍为「W-1 在原窗、W 进新窗」，未声明固定窗/滑动窗。
- **N8** — §4.2 第 130 行「只删过 `cleanup_after` 标记」「清理不可改变 TTL 结论」两条约束仍未进 §7（第 232 行 consume 行仅覆盖「清理失败不放行」）。

新增非阻断观察（修订引入的局部清晰度问题，非 serious）：

- **N9** — §4.1.1 第 93–96 行把「请求方法」列为 guard 输入，但第 98–100 行三条通过条件均未引用方法（未冻结方法约束）。安全效果由 Origin allowlist + JSON media type + 配置可用性承担，方法约束由下游 HTTP 端点承担，属局部清晰度缺口，不产生材料歧义。

---

## Contradictions

未发现文本层面的硬矛盾。§4.1 第 81 行（hostname 属于 provider success 条件）与第 106 行（challenge hostname 为 verify 的独立后续门）存在轻微表述张力，但两者可同真（hostname 是 verify 成功判据中的一个独立子检查，且独立于 request guard），不构成 contradiction。

---

## Missing Acceptance Criteria（非阻断，冻结前建议补入 §7）

1. 5s challenge 重取 cooldown、60s 冷却、5m code TTL、5 次 wrong-code 的数值验收（N4）。
2. cleanup 行为（只删过 `cleanup_after`、清理不可改变 TTL 结论）的独立验收行（N8）。
3. `unknown-proxy` 桶阈值或明确 fail-closed 语义验收（N3）。
4. device 伪名派生输入或显式标为 PENDING（N2）。

---

## Remediation Checklist

- [x] S1 — action 限流 key 改为复合 key 并同步 §7（已关闭）。
- [x] S2 — 定义 request guard 输入/拒绝语义，补齐 §5 与 §7（已关闭）。
- [x] S3 — 增加原子 check-and-increment 与 L+1 并发模型（已关闭）。
- [ ] N5 — 更新 `CURRENT_REVIEW_ROUND` 为 2/3 并同步 §10。
- [ ] N2/N3/N7 — 明确 device 派生输入、unknown-proxy 阈值、窗口类型。
- [ ] N4/N8 — 将继承数值与 cleanup 行为补入 §7。
- [ ] N6 — 冻结前对 §3 各 SHA-256/git/测试绑定做独立重新核验。
- [ ] N9 — 明确「请求方法」在 guard 中的约束（或标注为仅信息输入）。

---

## Open-Issue List

- ISSUE-0032 参数冻结：serious 已清零，可进入用户最终确认与冻结流程（本轮为审查结论，非用户批准、非门禁通过）。
- 真实 provider、endpoint、site key/Secret、实际 hostname、provider response mapping：仍 `PENDING_BY_GATE`（§9）。
- 客户端 seam（challenge token 携带 / action / 生命周期）：仍缺失（§7 第 239 行）。
- ISSUE-0031、数据库、付费动作：继续延期（§9）。
- 最终收据 SHA-256、用户最终确认：`PENDING_BY_GATE`（§10）。

---

**判定: PASS_WITH_NONBLOCKING_OPEN_ISSUES** — S1/S2/S3 已关闭，无新 serious；N1–N9 均为非阻断项，可随用户最终确认或冻结前一次性关闭。本轮未编辑任何文件，未代用户批准。