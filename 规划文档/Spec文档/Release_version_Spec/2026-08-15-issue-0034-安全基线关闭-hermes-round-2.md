# 审查报告 — ISSUE-0034 安全基线关闭 Spec（Round 2/3）

## Metadata

| 项 | 值 |
| --- | --- |
| 文档 | `tmpgcnhz0.tmp`（sanitized copy，Round 2 审查包） |
| 路径 | `C:\Users\86166\AppData\Local\Temp\vange-hermes-review-9fef0503-d766-484d-9ee3-5d4b9a3d1a8f\tmpgcnhz0.tmp` |
| 被审候选稿 | `V3｜ISSUE-0034 安全基线关闭 Spec（作者草案）`（本文件第 4–185 行） |
| 文档状态 | DRAFT_NON_CANONICAL / AUTHOR_DRAFT / USER_CONFIRMATION_PENDING |
| 审查轮次 | 2 / 3 |
| 调用模型 | deepseek-v4-pro（invocation-only） |
| 审查者角色 | 独立只读审查（不编辑文件、不代表用户批准、不推断实现/部署/生产验收/Issue 关闭） |
| 审查范围 | 仅 SF-1、SF-2 及其修复直接引发的回归；不重开 NF-1..NF-7 与风格项 |

## Round & Verdict

- Round: 2 / 3
- Verdict: **PASS_WITH_NONBLOCKING_OPEN_ISSUES**

SF-1 与 SF-2 均已修复，未发现由修复引入的 serious 回归。非阻断项（NF-1..NF-7）在 Round 1 已单独跟踪，本轮按指令不重开。

---

## Serious Findings

无新增 serious findings。原两项 serious 逐项核验如下：

### SF-1（已关闭）— 状态码防枚举语义矛盾

- **Severity:** 原 serious，现已消除
- **Location:** §2.3（第 63 行）、§5 V3-S1（第 117 行）、§8 第 2 条（第 155 行）
- **Evidence:** 第 63 行现明确冻结映射——未认证=401；对按对象标识寻址的资源，不存在/已删除/非 owner/不可见统一=404，并加"同一规范化响应体 + 同一可接受时延类别"；403 仅限"已认证、非对象存在性敏感的动作权限拒绝"，且必须由冻结接口契约明确允许。第 117 行证据矩阵同步为"未认证=401；对象不存在/已删除/非 owner/不可见=统一 404；仅冻结契约允许的非对象动作拒绝=403；响应体/时延类与枚举负测"。第 155 行 §8 第 2 条落为可测试判据，并新增负例"批量枚举不能据状态码、正文、Header 或时延区分对象存在性"。
- **Impact:** 原"存在但无权→403、不存在→404"的泄露风险已由统一 404 + 规范化响应体/时延类别消除；三处（§2.3/§5/§8）语义一致，不再自相矛盾。
- **Correction / Closure:** 已按要求将笼统"401/403/404"替换为显式防枚举映射规则并写入 §8 可测试验收标准 + 负例。SF-1 关闭。

### SF-2（已关闭）— CloudBase/Worker/域名入口边界缺验收标准

- **Severity:** 原 serious，现已消除
- **Location:** §5 V3-S2（第 118 行）、§8 第 3 条（第 156 行）
- **Evidence:** 第 118 行 V3-S2 产物列新增"CloudBase/Worker/公开域名入口边界证据"，本地证据列新增负例"未知 Host、直连源站和伪造 Worker/源站证明负例"，集成证据列新增"批准域名→Worker→CloudBase 路由、TLS/重定向、源站隔离"。第 156 行 §8 第 3 条落为逐项 pass/fail 判据：批准域名经正确 Worker/TLS/canonical 路由；apex/www 重定向保留 path/query；未知/未绑定 Host fail-closed 且不返回应用内容；绕过 Worker 直连 CloudBase/源站、伪造 Host/源站证明/Worker Header 均被拒绝；不存在绕过 Worker/CloudBase/源站隔离的替代公开入口。
- **Impact:** 原"目标 5 四类信任边界仅有源站可溯源"的缺口已闭合，CloudBase 边界、Worker 认证边界（伪造 Header）、域名入口错路由与直连源站绕过均获对应负例与独立复核门。
- **Correction / Closure:** 已按要求补齐验收矩阵并映射到 V3-S2 证据阶段。SF-2 关闭。

---

## Non-Serious Findings

本轮无新增。Round 1 的 NF-1..NF-7 仍为开放非阻断项，按 Round 2 范围指令不重开、不重新打磨。

## Contradictions

- C-1（原对应 SF-1）：已随 SF-1 修复消除，§2.3/§5 V3-S1/§8 第 2 条三处状态码语义现已一致。
- C-2（原对应 NF-7，"只读降级" vs "fail-closed"）：仍为非阻断张力，属 NF-7，本轮不重开。

## Missing Acceptance Criteria

- SF-1 缺口（防枚举状态码规范映射 + 负例）：已闭合（§8 第 2 条）。
- SF-2 缺口（CloudBase/Worker/域名入口 pass/fail 判据 + 负例）：已闭合（§8 第 3 条）。
- NF 类缺口（模板/命令边界、依赖/滥用阈值、删除/恢复、D7 定义等）：仍开放，单独跟踪，不影响本轮 verdict。

## Remediation Checklist

1. [x] SF-1：定义防枚举状态码映射，替换笼统表述，写入 §8 + 负例。（第 63/117/155 行）
2. [x] SF-2：补 CloudBase/Worker/域名入口边界验收标准与证据阶段映射。（第 118/156 行）
3. [ ] NF-1..NF-7：非阻断，另行跟踪，不在本轮范围内。
4. [ ] 最终 base receipt 使用完整 SHA-256/字节数/行数——执行时落实，非文档缺陷。

## Open-Issue List（遗留待定，不在本轮判死）

1. "上一已验收版本"是否真实存在、其验收层级为何（需总负责人 + ISSUE 管理员确认）——对应 NF-4。
2. 生产观察窗口 / D7 / 告警阈值 / 保留 / 频率 / 降级语义 / 误拒容忍——§9 待业务方确认。
3. 公开字段、联系方式、未成年人最小化的最终产品文案——§9 待业务方确认。
4. 源 Issue 及引用文件完整 SHA-256/字节数/行数的重算与登记——§1.2 声明由总负责人执行，本审查未验证。
5. 并发更新提示：Document QA 整改记录（本文件第 347 行）指出 `ISSUE总表.md` 冻结输入 hash 已变（`0C404DE8…` → `8ABD40D9…`），新增 ISSUE-0040~0045 台账并登记 ISSUE-0020 关闭，原 0031/0032/0034/0035/0036/0038 状态未变。总负责人发起下一轮前须复读并冻结当前 canonical relation（不影响本轮 SF-1/SF-2 核验结论）。

---

**Round 2 结论**：PASS_WITH_NONBLOCKING_OPEN_ISSUES。SF-1（防枚举状态码语义）与 SF-2（CloudBase/Worker/域名入口验收标准）均已按要求修复且三处引用一致，未引入 serious 回归。本 verdict 仅代表"两项 serious 已闭合"；不构成用户批准、实现授权、分支完成、部署、生产验收或 Issue 关闭。