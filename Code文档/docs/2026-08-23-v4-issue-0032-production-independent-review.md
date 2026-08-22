# V4 ISSUE-0032｜Deploy 069 生产技术独立复核持久化记录

## 1. 任务、角色与结论

- 任务 ID：`ISSUE-0032-V4-DEPLOY-069-PRODUCTION-TECH-ACCEPTANCE-PERSISTENCE`
- 执行角色：`独立代码复核v2.3.2 / 019fefa7-d1d3-7ac3-a5ba-8b8abe299958`
- 来源总负责人：`01a00565-5d72-7663-991d-178c5dcfd170 / 项目总负责人v2.3.3`
- 记录日期：`2026-08-23`
- 技术 verdict：`PRODUCTION_TECH_ACCEPTANCE_BLOCKED_WITH_ACCEPTED_BUSINESS_RISK`
- 原独立技术结论保持：`PRODUCTION_TECH_ACCEPTANCE_BLOCKED`
- 主链 / Session / 顺序重放子门：`PASS`
- P0/P1/P2：`0/2/0`
- 产品/业务结论：`PRODUCT_BUSINESS_ACCEPTANCE_PASS`，仅表示用户明确接受已具名证据缺口，不把技术 verdict 改写为 PASS。

本记录持久化既有独立技术复核及随后累计的生产观察事实。它不是新的代码复核、部署回执、平台来源证明、完整 Scheme A 观察通过或 ISSUE-0032 关单决定。

## 2. 固定提交、部署目标与前置门禁

| 项目 | 固定事实 |
| --- | --- |
| branch | `V4-issue-0032-email-turnstile-closure` |
| commit | `3c69840c6d1722c0438c5d9342c4d68efcecd6d0` |
| parent | `bdab1d8331afd52f46fb9e71cbe43cdc8f9b8d5d` |
| tree | `ad009f8eb7585d3bf35fdff75449825eee6a8b11` |
| production target | `Deploy 069` |

前置独立门禁保持连续：CloudBase `_id` 原子消费候选 `TECH_REVIEW_PASS`，Standards/Spec P0/P1/P2 均为 `0/0/0`；精确推送提交为 `POST_PUSH_COMMIT_ATTESTATION_PASS`。开发 owner 对同一候选记录的提交前门禁为：`email-auth 29/29`、ISSUE-0032 四文件 `56/56`、受影响 ISSUE-0034 三文件 `65/65`、默认全量 `600 passed / 1 skipped`，typecheck、lint、build（17/17）与 diff-check 均通过。上述本地和提交证据不替代部署、生产观察、产品/业务或 Issue 关单证据。

## 3. 已通过的生产技术子门

Deploy 069 的用户逐步生产证据覆盖：

1. 生产登录页可进入，Turnstile 挑战通过；
2. 邮件验证码成功送达；
3. 使用新验证码登录成功；
4. Ctrl+F5 刷新后 Session 仍保持；
5. 用户主动退出成功；
6. 未获取新验证码时，刚消费的旧验证码被拒绝，页面明确提示“验证码已使用，请重新获取”；
7. 随后取得新验证码并再次登录成功。

因此，`Turnstile → 邮件发送 → 正确验证码登录 → Session 刷新保持 → 退出 → 旧码顺序重放拒绝 → fresh-code 恢复登录` 主链、Session 和顺序防重放子门为 `PASS`。该结论不覆盖并发重放、完整限流矩阵、连续观察窗口或部署来源证明。

## 4. 后续累计生产观察

后续由总负责人、产品经理和业务方提供并冻结的生产观察事实为：

- 第一批共 18 次，A/B 各 9 次，双向隔离 `6/6`；
- 第二批共 10 次，A/B 各 5 次，A→B `3/3`、B→A `2/3`；
- 两批合计至少 28 次；验证码均在数秒内收到；未观察到串收、语义误拒或已报告的系统错误；
- 两批之间及批内适用中断均超过 15 分钟。

这些证据增强了主链重复可用、双账号发送隔离和未观察到语义误拒的可信度，但不能把彼此中断的批次拼接为 canonical Scheme A 的单一连续 24 小时窗口。样本总数超过 24 也不替代连续窗口、完整方向矩阵、时间段分布、停止条件和可追溯分母要求。

## 5. 技术阻塞项

### P0

`0`。当前证据没有确认 Secret/隐私泄漏、错误 action/hostname 放行、重放再次消费、Origin/CSRF 绕过、双账号串扰或 verify/consume 前发送等 P0 事实。

### P1-1｜Scheme A 连续生产观察未通过

canonical Scheme A 要求单一连续 24 小时有效窗口；超过 15 分钟的中断触发窗口、计数和分母从零重启。现有两批观察均发生超过 15 分钟的中断，因此不能合并为该门禁通过。技术 verdict 继续保持 `BLOCKED`。

最小解除条件：在同一 Deploy 069 或后续精确绑定 revision 上重新取得符合 canonical Scheme A 的完整连续窗口、双账号矩阵、合法样本分母、停止条件和脱敏时间线，再由本角色独立复读。

### P1-2｜Deploy 069 source-binding 与安全回滚回执缺失

现有证据尚未提供 Deploy 069 对 exact commit/source package/tree/manifest 的可复读绑定，也没有可执行且安全的 rollback receipt。Deploy 067、068 均有已知生产故障，不能仅凭历史版本号作为 069 的功能回滚证明；DeployId 本身也不能替代 Git/source 绑定。

最小解除条件：由授权平台 owner 提供不含 Secret 的 source package/tree/manifest、Build/Image 或等价部署绑定证据，并提供明确回滚目标、触发条件、恢复检查和不得恢复已暴露 Secret 的安全回滚回执。

### P2

`0`。除上述两个 P1 证据门外，本记录不新增或虚构 P2 缺陷。

## 6. 522 事件的证据分类

- 用户提供的 522 截图对应 `2026-08-22 17:15:42 UTC`，页面显示 Browser 与 Cloudflare Working、Host Error；
- 总负责人于 `2026-08-23` 只读直连复测：正式域名返回 200，约 2.2 秒；默认 CloudBase 域名返回 403，约 0.17 秒；
- 当前证据只支持“发生过间歇性源站可用性/运维风险，随后直连恢复”的分类。

没有足够证据把该事件归因到 ISSUE-0032 代码、Deploy 069 source package、Turnstile、邮箱发送或原子消费修复；也没有根因、修复动作或观察窗口证据，因此不得宣称已根治。该事实作为具名运维残余风险保留；若后续取得同范围可复现根因，再由总负责人路由现有 Issue 或决定是否需要新的运维 Issue。

## 7. 技术 verdict 与业务风险接受的分层

- 技术层：`PRODUCTION_TECH_ACCEPTANCE_BLOCKED`，P0/P1/P2=`0/2/0`；主链、Session、顺序重放子门 PASS，但 24 小时连续观察与 source-binding/rollback 仍未通过。
- 业务层：用户已明确接受上述残余证据缺口，产品经理给出 `PRODUCT_BUSINESS_ACCEPTANCE_PASS`。
- 约束：业务风险接受可以成为 ISSUE 管理员独立关单复核的输入，但不能倒推或改写技术门为 PASS，也不能把缺失的观察、来源绑定或回滚证据记为已完成。

本报告允许总负责人将“技术仍阻塞 + 用户/业务具名接受风险”的完整双层事实交 ISSUE 管理员独立判断是否关单。是否关闭由 ISSUE 管理员依据 canonical 规则决定；本角色不修改 Issue、总表或 workflow 状态。

## 8. 未通过门禁、恢复触发与唯一下一步

未通过门禁：Scheme A 单一连续 24 小时窗口、Deploy 069 精确 source-binding、安全 rollback receipt，以及由 ISSUE 管理员执行的 canonical 关单复核。技术门恢复触发是上述两项 P1 取得新证据并返回本角色复读。

唯一下一步：项目总负责人将本报告、产品经理 `PRODUCT_BUSINESS_ACCEPTANCE_PASS` 和用户具名风险接受一并交 ISSUE 管理员；由 ISSUE 管理员独立决定是否在明确保留 `PRODUCTION_TECH_ACCEPTANCE_BLOCKED_WITH_ACCEPTED_BUSINESS_RISK` 的前提下关闭 ISSUE-0032，不得登记为生产技术 PASS。

## 9. 权限与写入确认

本轮唯一允许写入为新增本报告，并向 `Code文档/独立代码复核工作记录.md` 做 prefix-preserving 末尾追加。未修改代码、Issue/总表、Spec、产品记录、Hermes/QA、平台配置或其他角色文件；未运行 npm，未执行 Git mutation、部署、平台、数据库、Secret、任务或 subagent 操作。
