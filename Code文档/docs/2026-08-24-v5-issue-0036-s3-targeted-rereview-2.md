# V5 / ISSUE-0036 S3 P1-S1/P1-S2 第二次聚焦复审

日期：2026-08-24
角色：独立代码复核 v2.3.2 / `019fefa7-d1d3-7ac3-a5ba-8b8abe299958`
结论：`TECH_REVIEW_REWORK_REQUIRED`

## 1. 固定点与候选一致性

- 工作树：`D:\codex_project\家教对接website-v5-issue-0036-contact-review-closure`
- 分支：`V5-issue-0036-contact-review-closure`
- HEAD：`03da0015be0d2ee403d848f149814039759cfcd1`
- tree：`c2cdc887da9bb771038fc729dab476518b477112`
- 候选实现仍为 16 个 tracked modified + 10 个 implementation untracked，staged=0；路径集合无漂移。
- 冻结 manifest 标识：`FDDD82BCABFDB3542B1D195B2AAB5B6757742D5B4C8F57A438B92D5359A1685F`。
- 首轮报告 SHA-256=`9D8BF3F498DC04E18D5DAE217100AD4F36CAB23908D83023337F9144BE28D136`；上轮聚焦报告 SHA-256=`696395AA63EE73B411B40AD0026629AC2E953AD3676E4E33D68673C4606C1AEE`，均保持只读。
- `package.json` / `package-lock.json` 无差异，blob 为 `9f74f257174ad5c84d62428531c61e30e18a226d` / `012694c0c71cab4fc9b3d74f767d1e87216cf4ee`。
- 本轮只复核 P1-S1/P1-S2；P1-S3/P1-C1/P1-C2 保持 CLOSED，未重开。

## 2. P1-S1：OPEN

已关闭部分：

- `Code文档/server/parent-need-api.ts:85-91,142-144` 与 `Code文档/server/tutor-profile-api.ts:84-90,139-141` 已直接返回 `readPublic` 的 approved snapshot 白名单投影。
- 实际 management 详情在 `Code文档/app/api/parent-needs/management-handlers.ts:150-156`、`Code文档/app/api/tutor-profiles/management-handlers.ts:141-147` 也返回相同权威投影。
- `Code文档/tests/issue-0036-production-wiring.test.ts:194-350,405-450` 经过真实 list、通用详情、management 详情、CloudBase 合成持久层，证明顶层响应漂移和联系方式字段不能覆盖权威投影，完整性异常继续 fail closed。

仍未闭环的 P1：

- 公开列表仍先在 `Code文档/server/parent-need-api.ts:69-79`、`Code文档/server/tutor-profile-api.ts:69-78` 使用旧主文档字段执行 grade/subject/gender/budget/fee 等筛选，之后才对命中的 ID 调用权威 `readPublic`。返回值虽来自 approved snapshot，但候选集合仍由未经批准、可漂移的顶层字段决定。
- 可复现反例：approved snapshot 的 grade 为“初一”、旧主文档顶层漂移为“高一”时，`?grade=初一` 会错误漏项；`?grade=高一` 会命中并返回 grade=“初一”的 approved projection。由此可从列表成员关系探测未批准漂移值，并破坏公开筛选语义。
- 当前新增测试只在无筛选 URL 下验证返回投影，没有覆盖上述双向筛选反例。
- 最小返工方向：feature flag 开启时，筛选与分页必须基于通过权威完整性校验后的 approved projection 执行，或由等价权威查询 seam 完成；补 parent/tutor 每类至少一个“approved 值命中、漂移值不命中”的真实 route 负例，并保持完整性异常 fail closed。

## 3. P1-S2：OPEN

已关闭部分：

- `Code文档/server/security/contact-review-production.ts:920,1063,1305,1540` 已从 field claim/decision、appeal claim/final decision 的 scope 中移除 reviewer ID。
- request hash 不再包含 operator；handler 在进入 service 前按 reviewer allowlist/role 拒绝未授权账号，service 对 owner、second/triage 冲突继续 fail closed。
- `Code文档/tests/issue-0036-production-wiring.test.ts:519-705` 经过真实 HTTP handler→service→repository，覆盖跨已授权 reviewer 的立即重放、异 payload 409、未授权 403、零重复 revision/audit；首次非法申诉终审仍由既有持久化污染负例验证转人工并写失败审计。

仍未闭环的 P1：

- receipt 命中后，field decision、field claim、appeal claim、appeal final decision 分别在 `Code文档/server/security/contact-review-production.ts:932-935,1085-1088,1317-1320,1552-1558` 调用 `withAggregate`，而 `withAggregate` 在 `336-342` 从当前 entity/aggregate 组装响应，不从首次 receipt 重建首次结果。
- 可复现反例：primary 以 key K 成功 claim，随后另一 key 完成字段决定使 aggregate 进入 rejected；此后另一名已授权 reviewer 用 K 和原 claim payload 重放。receipt 会命中且零写入，但响应的 `aggregateStatus` 是当前 rejected，不是首次 claim 返回的 pending 状态，因此不满足“同 key 同业务 payload 重放首次结果”。appeal claim 在终审完成后重放同样会返回终审后的当前状态。
- 当前测试在每次首次成功后立即重放，尚未先推进后续合法状态再重放旧 key，也未断言首次与延迟重放响应的业务结果一致。
- 最小返工方向：从 receipt 保存的 resultCode/resultRef/resultDigest 加必要的无敏感稳定结果，或以等价方式重建首次响应；补跨 reviewer 的延迟重放负例，先用另一 key 推进状态，再重放旧 key，断言首次结果语义一致且 revision/audit/receipt 零新增。异 payload 仍须 409，错误角色仍须在 receipt 前拒绝。

## 4. 计数、测试证据与边界

- 当前未闭环：P0/P1/P2=`0/2/0`，即 P1-S1 与 P1-S2 各一项。
- 本次修订新引入的独立 P0/P1/P2=`0/0/0`；上述两项均是原 finding 的不完整闭环，不是扩域新 finding。
- 测试 seam 为真实 route/HTTP/repository/CloudBase 合成持久化，不是纯文本伪通过；但新增 16 个定向测试未覆盖公开筛选候选集与状态推进后的延迟幂等重放。
- 开发 owner 报告的定向 1 file / 16 tests、受影响 12 files / 91 tests、全量 88/88 files（659 passed / 1 existing skipped）、typecheck/lint/build 18/18/diff-check 均通过，与当前工作记录归属一致。本轮按授权未运行 npm，不能用通过数字替代两个缺失反例。
- 未发现 26 项候选实现之外的无关实现 diff；本报告是唯一新增写入。未执行 Git mutation、提交、推送、部署或平台操作。

## 5. 结论与唯一下一步

`TECH_REVIEW_REWORK_REQUIRED`。

P1-S1=`OPEN`；P1-S2=`OPEN`；P1-S3/P1-C1/P1-C2 继续 `CLOSED`。

唯一下一步：项目总负责人把本报告两项最小返工一次性退回原代码 owner；仅将公开筛选/分页迁移到权威 approved projection，并让 task/appeal 延迟重放返回首次结果语义，补对应真实 route/HTTP 负例后，再回到同一独立复核线程做第三次 targeted re-review。不得据此提交、推送、部署、启动 UI 复核或关闭 ISSUE-0036。
