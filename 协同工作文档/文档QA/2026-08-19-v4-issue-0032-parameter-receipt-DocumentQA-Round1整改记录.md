# V4 / ISSUE-0032 参数候选 Document QA Round 1 SERIOUS 整改记录

## 1. 任务与边界

- 任务状态：`QA_DOCUMENT_REWORK`
- 执行角色：`019fefa7-c5cf-7e62-9859-5263998dfd77 / DocumentQAv2.3.2 / gpt-5.6-sol / high`
- 总负责人：`01a00565-5d72-7663-991d-178c5dcfd170 / 项目总负责人v2.3.3`
- workflow：`WORKFLOW_ACTIVE`
- 本批范围：仅整改 Hermes Round 1 的完整 `S1/S2/S3` SERIOUS 批次及直接受影响回归。
- 本批不处理 `N1-N8` NON_SERIOUS，不运行 Hermes Round 2，不自我批准，不登记 Issue，不授权实现、测试、Git、部署或平台操作。

## 2. 冻结输入与写前冲突防护

| 输入 | 写前 SHA-256 | bytes | lines | 核对结果 |
|---|---|---:|---:|---|
| `2026-08-19-v4-issue-0032-parameter-receipt-candidate.md` | `E831907690C8886440268CEC00B9E62C86436FD595BE380B64B33F737DC312D9` | 13,717 | 214 | 与授权冻结值一致后才写入 |
| `2026-08-19-v4-issue-0032-parameter-receipt-hermes-round-1.md` | `F337BFCD501D7A8410D201D387740A939EB8DB6B254CE33F97EA76AF475C12AD` | 8,890 | 119 | `REWORK_REQUIRED`，3 SERIOUS / 8 NON_SERIOUS |
| Round 1 metadata | `C7F8FB8984DB4F7CAE8CC1E8C9CD5C865B94A2656AC3B9728B03631AD112BF73` | 912 | 16 | `round=1/3`、`deepseek-v4-pro`、source hash 一致、canonical unchanged |
| `DocumentQA工作记录.md` | `B57169C47DA1B75557E94D7CC632024DFEA6D4CE72FC27EED623E295F6F3066A` | 14,617 | 99 | 只允许前缀保持追加 |

只读实现依据：`request-guard.ts`=`76C0F655BBE29D8F2688473A2661D440A15F05A7E37E70254DE5CC2EFC13D964`；`middleware.ts`=`B999E9A6F01B8E9E3DA37748D039BFC2E0273DE50542399B9532896B17616A81`；`rate-limit.ts`=`3543AE2FC35059D3DBB0D1DE816F261CD24862D7394B338AC5B42C890F7F0ECD`；`email-auth-api.ts`=`0ABF96F60E56AC9DCF7BD60D38DA968279221FA590B33B8F50B29EBADF863CA3`。这些文件只读，未修改。

产品经理线程在本批开始时仍为 active；总负责人已冻结其候选写入并将本批 canonical 唯一写入 owner 临时转给 Document QA。写前再次核对 candidate SHA 仍为 `E831...312D9`；主仓分支、HEAD、309 项 status 快照分别为 `V2-unified-navigation-responsive-profile-20260729`、`33314857da0f2d72066443965454d23fc70a16d3`、`01411CEC391236C26ACDDB2399F51BEE0FFAC7404E54E90BDF38C6AFF66E40B6`；V4 worktree 为 clean。没有发现写前所有权冲突。

## 3. SERIOUS 整改矩阵

### S1｜action 限流不能是全站固定 5/15m 桶

- 原位置/问题：原 §4.3 action key 只有固定 `email_send_code`，按字面会把所有主体压入同一个全站 `5 / 15m` 桶。
- 新位置/文本语义：候选 §4.3 action 表行及紧随其后的“action 层规范化输入”段；固定为 `environment_ref + email_send_code + ip_pseudonym` 经无歧义分隔、带 `key_version` HMAC 生成的 `action_pseudonym`。持久化与日志不得包含 raw email/IP/token/UA。
- 选择理由：account 只有 `3 / 15m`，再按 account 复合会被更低阈值支配；device 与 action 同为 `5 / 15m`，按 device 复合不能形成额外动作收敛。可信网络伪名复合使 action `5 / 15m` 在 IP `10 / 15m` 内形成验证码动作专属上限，又不新增客户端身份或隐私输入，因此是冻结事实内最小、非全局且具有独立安全作用的复合范围。
- 不全局/不绕过证明：不同 `ip_pseudonym` 分桶；同一网络的不同 account/device 共享动作桶。account/IP/device/action 仍全部作为 active layers 在同一事务中检查，action key 不替代、不跳过其他层。
- 冻结决策保持：action 数值仍为 `5 / 15m`；未改变 account `3 / 15m`、IP `10 / 15m`、device `5 / 15m`、session `N/A`，未选择 `unknown-proxy` 新阈值。
- 定向验证：候选 §7 `action scope` 行要求网络 A 以不同 account/device 填满 5 次、第 6 次 429，而网络 B 首次仍通过；另断言两个网络伪名计数互不占用。§7 `limit` 行同时覆盖所有 active layers。
- 受影响回归：§4.3 key 表、隐私最小化、计数/事务边界、§7 limit/action scope/privacy；没有处理 N2、N3 或 N7。

### S2｜request origin/source guard 必须定义

- 原位置/问题：§2/§7 把 request guard 列为首门，但没有 production 输入、通过/拒绝、失败映射和独立证据合同。
- 新位置/文本语义：候选 §4.1.1 定义 production enforce 的输入与通过条件；显式配置 allowlist 精确匹配 Origin，匿名预认证写入 media type 必须为 `application/json`。缺失/不允许 Origin 或匿名非 JSON 返回 403；guard/allowlist 配置不可用返回 503；全部 send count=`0`。Host/Origin/Referer 不得自举 allowlist，challenge hostname 保持独立后续门。
- 选择理由：与只读实现中 `evaluateWriteRequest` 的精确 Origin allowlist、缺失 Origin 拒绝、匿名 JSON 要求和 middleware 首门顺序一致；同时按冻结整改要求把无效请求 403 与配置/守卫不可用 503 分开。现有 middleware 的统一 403 只作为待后续实现证明的差异，不被误报为 PASS。
- 冻结决策保持：不写真实域名、Secret、endpoint 或 provider；production 只保留 `PRODUCTION_ORIGIN_ALLOWLIST_REF`，local/integration 只允许 synthetic Origin/allowlist fixture。
- 定向验证：候选 §5 新增三类失败映射；§6 分离 synthetic 与 production 配置证据；§7 `request guard`、`order`、`failure` 行分别断言独立行为、首门短路和 403/503 映射。
- 受影响回归：§4.1.1、§5、§6、§7；未改写报告 N1 所指“核心产品安全链”措辞，N1 仍未关闭。

### S3｜生产限流必须原子 check-and-increment

- 原位置/问题：原 §4.3/§7 只有串行 `L-1/L/L+1` 文义，不能证明并发硬上限，也未禁止 active layers 部分落账。
- 新位置/文本语义：候选 §4.3 明确 production 所有 active layers 在一次原子事务中整体 check-and-increment；全部通过并各增 1，或任一层饱和/事务失败时全部零增量。预存 `L-1` 时并发只能一个成功到 `L`，其余 429，存储不得出现 `L+1`；“L+1”仅指饱和后额外尝试或并发输家。事务/存储不可用为 503、send count=`0`。
- 选择理由：与只读 `rate-limit.ts` 的 production `database.runTransaction` 和“先检查所有 active layers、再写入全部增量”结构一致，并把硬上限与失败原子性提升为可验收合同。
- 冻结决策保持：所有阈值、15m 窗口数值和 session `N/A` 均未漂移；没有选择 fixed/sliding window 类型。
- 定向验证：候选 §7 `limit` 行要求预置目标层 `L-1`、同步屏障并发至少 2 个同 key 请求、恰好一个成功、最终计数精确 `L`；强制事务失败时 503 且所有 active layers 零增量。§5 新增 rate-limit transaction/store unavailable 行。
- 受影响回归：§4.3 原子性与硬上限、§5 503 映射、§7 limit/order/failure；未处理 N7。

## 4. 冻结数值复核

本批输出仍为：token TTL `300s`；verify timeout `5000ms`；account `3 / 15m`；IP `10 / 15m`；device `5 / 15m`；action `5 / 15m`；session `N/A`；cleanup `+1h`；新 challenge cooldown `5s`；既有 email cooldown `60s`。`USER_PROFILE_SELECTION=B`、ISSUE-0031 延期、数据库延期和全部付费动作延期均未改变。

## 5. 明确保留且未关闭的 NON_SERIOUS

- N1：“核心产品安全链”省略 cooldown 与 request guard；未改该措辞。
- N2：device 伪名派生输入未定义；未选择派生输入。
- N3：`unknown-proxy` bucket 无阈值；未选择阈值或新策略。
- N4：5s、60s、5m、5 次继承值未补完整数值验收矩阵。
- N5：`CURRENT_REVIEW_ROUND=0/3` 未修订；QA 整改不借机处理该元数据项。
- N6：§3 外部 SHA/git/test 绑定未执行新的独立验真。
- N7：固定窗/滑动窗类型仍未选择。
- N8：cleanup 独立验收矩阵未扩展。

S1/S2/S3 所必需的 §7 定向合同不宣称关闭上述 N 项，也未登记新的 Issue。

## 6. 输出、审查预算与保留门禁

| 输出 | SHA-256 | bytes | lines |
|---|---|---:|---:|
| 修订后 candidate | `52358D5F7BC7BE75819CA6CBBFDA9D8AAD64C98CF8863D91A4A197E75F557ECF` | 18,543 | 259 |

- canonical 输入→输出：`E8319076...312D9 / 13,717 bytes / 214 lines` → `52358D5F...57ECF / 18,543 bytes / 259 lines`。
- Hermes 共享预算仍为 `MAX_REVIEW_ROUNDS=3`；有效 Round 1/3 已用，本次 QA 整改不重置计数，下一轮仍为 Round 2/3。
- 当前状态仅为 `SERIOUS_BATCH_REMEDIATED`；不是 `DOCUMENT_GATE_PASSED`，不是 Document QA 自我批准，不是用户最终确认、实现/测试授权、分支完成、部署、生产验收或 Issue 关闭。
- 真实 provider、endpoint、site key/Secret、实际 hostname、平台变量、生产配置与执行证据继续 `PENDING_BY_GATE`。
- 唯一下一步：等待用户单步授权项目总负责人执行 Hermes Round 2；本批不启动 Round 2。

## 7. 现场与无关文件保护证明

- 精确写入仅为 candidate、本 ledger 与 `DocumentQA工作记录.md` 的前缀保持追加；没有修改 Hermes report/metadata、0032 Spec、freeze record、Issue/总表、CONTEXT、中央注册/总览、产品经理日志、代码、测试、UI、平台配置或其他角色文件。
- 禁写基线：产品经理工作记录 `26AAE8F70C0FDBFF39111B7E4D25C2A24746D832D816951B27BC84F8BFF87489`；Hermes report `F337...12AD`；metadata `C7F8...BF73`；0032 Spec `F793...073`；freeze record `AA02...5E7`；CONTEXT `F996...BB8`；中央注册 `2E4B...B291`；中央总览 `A24E...6809`；Issue 总表 `94EA...ACC7`。批后复核均须保持相同。
- `DocumentQA工作记录.md` 追加后以前 14,617 bytes 的 SHA-256 仍须为 `B57169C47DA1B75557E94D7CC632024DFEA6D4CE72FC27EED623E295F6F3066A`，作为 prefix-preserving 证明。
- 主仓既有 dirty/untracked 不清理、不恢复、不暂存、不提交；批后剔除本 ledger 新增 status entry 后，309 项 status 文本 SHA-256 仍须为 `01411CEC391236C26ACDDB2399F51BEE0FFAC7404E54E90BDF38C6AFF66E40B6`。V4 worktree 仍须为 clean。
