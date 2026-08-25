# V5 / ISSUE-0036 S3 五项 P1 聚焦复审

日期：2026-08-24
角色：独立代码复核 v2.3.2 / `019fefa7-d1d3-7ac3-a5ba-8b8abe299958`
结论：`TECH_REVIEW_REWORK_REQUIRED`

## 1. 固定点与范围

- 工作树：`D:\codex_project\家教对接website-v5-issue-0036-contact-review-closure`
- 分支：`V5-issue-0036-contact-review-closure`
- HEAD：`03da0015be0d2ee403d848f149814039759cfcd1`
- tree：`c2cdc887da9bb771038fc729dab476518b477112`
- 候选实现仍为 16 个 tracked modified + 10 个 implementation untracked，staged=0，共 26 项；另有只读保持的首轮独立报告，不计入实现 manifest。
- 开发 owner 提供的修订 manifest 标识：`DDEB123E50127547B2AC97AAAED9690BCF0786BF96DB29A092B64886D440C360`。本轮独立核对精确路径数、状态及受影响文件 SHA，未发现范围漂移。
- 首轮报告保持不变：`Code文档/docs/2026-08-23-v5-issue-0036-s3-independent-review.md`，SHA-256=`9D8BF3F498DC04E18D5DAE217100AD4F36CAB23908D83023337F9144BE28D136`，9597 bytes / 73 lines。
- `package.json` / `package-lock.json` 无差异，blob 分别为 `9f74f257174ad5c84d62428531c61e30e18a226d` / `012694c0c71cab4fc9b3d74f767d1e87216cf4ee`。
- 本轮只复核首轮五项 P1 及受影响回归；未重跑 npm，未扩展无关审查。

## 2. Standards targeted pass（先行冻结）

五项原 finding 的当前阻断计数：P0/P1/P2=`0/2/0`。

修订自身新引入 finding：P0/P1/P2=`0/0/0`。

### P1-S1：OPEN——权威读取仍只作为布尔门，实际响应继续返回旧主文档投影

- 证据：`Code文档/server/security/contact-review-production.ts:355-446` 已补齐唯一 aggregate、required-fields digest、N/N task、双向引用、owner/entity/version/field/content/review key 与 reviewer 向量校验；`2141-2164` 也能返回由 active snapshot 生成的权威公开投影。
- 未闭环点：真实公开列表在 `Code文档/server/parent-need-api.ts:85-91` 与 `Code文档/server/tutor-profile-api.ts:84-90` 只用 `authority.value` 判断是否可见，随后仍把旧 collection 查询得到的 `need/profile` 放入响应。真实详情同样在 `Code文档/server/parent-need-api.ts:137-145`、`Code文档/server/tutor-profile-api.ts:134-142` 以及 `Code文档/app/api/parent-needs/management-handlers.ts:150-161`、`Code文档/app/api/tutor-profiles/management-handlers.ts:141-152` 将权威结果仅作为存在性门，最终返回旧主文档 DTO。
- 可复现影响：主文档顶层公开字段若与 `activeSnapshot` 漂移，而 aggregate/task 仍完整，权威校验会通过，但 HTTP 响应返回漂移后的顶层字段，不是已批准快照。联系方式审核门因此仍存在“校验 A、返回 B”的 fail-open 面。
- 测试缺口：`Code文档/tests/issue-0036-production-wiring.test.ts:192-323` 覆盖 task/aggregate 缺失、重复、错 owner/version/field/reviewKey/back-reference/digest，却未修改主文档顶层字段并断言响应必须精确等于 `authority.value`。
- 最小返工方向：真实列表和详情必须直接返回权威 `readPublic` 的白名单投影，或先证明旧 DTO 与权威投影逐字段完全相等；新增 parent/tutor 列表和两类详情的顶层字段漂移负例。

### P1-S2：OPEN——task/appeal 幂等 scope 仍按操作者分裂

- 证据：create、普通决定、普通领取、appeal 创建/领取/终审的 receipt 检查顺序和稳定 request hash 已补齐；同一操作者的真实 HTTP 重试由 `Code文档/tests/issue-0036-production-wiring.test.ts:392-562` 覆盖。
- 未闭环点：`Code文档/server/security/contact-review-production.ts:920-936`、`1064-1090`、`1307-1323`、`1540-1556` 把 `operator.id` 写进 `scopeKey`。同一 task/appeal 与同一 Idempotency-Key 由另一合法 reviewer 重试时会落到不同 scope，因而看不到首次 receipt。
- 可复现影响：普通字段首次由 primary 以 key K claim 后，backup 使用同一 K 和最新 revisions 调用 claim；代码会绕过首次 receipt，在 `1099-1135` 再次改 triage、递增 task/aggregate revision、追加 audit 和第二条 receipt，而不是按 frozen contract 对同 key+不同 requestHash 返回 409。appeal handoff 也有同类跨操作者分裂。
- 合同证据：冻结 Spec §7.3.1、§7.5、§12.3.2（lines 255-268、383-385）要求同一业务 scope 的同 key 相同请求只返回首次结果，同 key 不同 requestHash 返回 `409 IDEMPOTENCY_KEY_REUSED`；字段 task 唯一维度是 owner/entity/version/field/idempotencyKeyHash，不含 reviewer。
- 测试缺口：现有 HTTP 测试只用同一 actor 重放，没有覆盖 primary→backup 或 backup→primary 使用同 key 的冲突、零 revision、零 audit、零 receipt 副作用。
- 最小返工方向：从 task/appeal 幂等 scope 移除操作者维度，把 actor 保留在 requestHash；补跨 reviewer 同 key 的真实 HTTP/repository 负例，并证明冲突时状态、revision、audit、receipt 均不变。

### P1-S3：CLOSED

- `Code文档/server/security/contact-review-production.ts:1562-1572` 在终审事务中重新校验 task owner、triage 非 owner/second、claimAt 与角色；失败分支 `1582-1621` 将完整向量转人工、清终审字段并写失败审计。
- `Code文档/tests/issue-0036-production-wiring.test.ts:564-648` 通过持久化 seam 注入 `triageReviewerRef=ownerId`，确认 403、拒绝公开和失败审计。未发现绕过或部分发布。

## 3. Spec / contract targeted pass

计数：P0/P1/P2=`0/0/0`；本轴两项首轮 P1 均关闭。Standards 轴仍有两项 P1，故总体不能通过。

### P1-C1：CLOSED

- `Code文档/server/security/contact-review-production.ts:697-703` 在业务写入前固定源状态矩阵：restore 仅接受 deleted，deleted 禁止 edit。
- `Code文档/tests/issue-0036-production-wiring.test.ts:913-983` 覆盖 published→restore 与 deleted→edit，并比较完整 repository snapshot，确认 entity/task/aggregate/audit/idempotency 零变化。

### P1-C2：CLOSED

- audit schema 与写入路径已补 previous/new triage、second、决定向量、reason、恢复引用、claim/resume/decision 时间、公开指针前后值及 cleanup 结构化结果；申诉 claim/handoff/resume/终审调用链均写入相应字段。
- `Code文档/server/security/contact-review-production.ts:1968-2138` 实现 task 30 天、audit 180 天、legal hold 和 cleanup 失败回滚后的独立失败审计。
- `Code文档/tests/issue-0036-production-wiring.test.ts:1223-1451` 覆盖 T-1/T 边界、重放/冲突、hold 创建/延长/释放、主事务失败零业务变化与失败审计。未发现本项修订引入的新阻断。

## 4. 测试 seam 与证据判断

- 五类新增测试不是纯文本断言：公开门覆盖真实 parent-needs handler、management detail、CloudBase 合成持久层与 service；幂等门覆盖真实 HTTP handler→integration→repository；owner 污染覆盖持久化读取；生命周期与 cleanup 覆盖事务 snapshot、审计和失败路径。
- 开发 owner 报告的定向 15/15、受影响 12 files / 90 tests、全量 88/88 files（658 passed / 1 existing skipped）、typecheck/lint/build 18/18/diff-check exit 0 与当前候选工作记录相符。本轮依授权聚焦静态复核，npm 执行数为 0；这些数字不抵消上面两个缺失反例。
- 未发现候选 26 项之外的新实现 diff；首轮报告保持只读。文档门仍为 `DOCUMENT_REVIEW_LIMIT_REACHED / USER_RISK_ACCEPTED_METADATA_ONLY / IMPLEMENTATION_PREPARATION_AUTHORIZED`，不是 `DOCUMENT_GATE_PASSED`。

## 5. 结论与唯一下一步

`TECH_REVIEW_REWORK_REQUIRED`。

五项 closure：P1-S1=`OPEN`、P1-S2=`OPEN`、P1-S3=`CLOSED`、P1-C1=`CLOSED`、P1-C2=`CLOSED`。修订引入的新 P0/P1/P2=`0/0/0`；当前阻断仍是两个未闭环的原 P1。

唯一下一步：项目总负责人将 P1-S1/P1-S2 的完整反例批次退回原代码 owner；原 owner 只修正真实公开响应的数据来源与跨 reviewer 幂等 scope，并补对应真实 route/事务负例，之后回到同一独立复核线程再次 targeted re-review。不得在此结论下提交、推送、部署、启动 UI 复核或关闭 ISSUE-0036。
