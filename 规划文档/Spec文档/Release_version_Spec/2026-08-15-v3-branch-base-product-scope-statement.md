# V3 分支基线产品 / 业务范围声明

> 状态：`PRODUCT_SCOPE_STATEMENT_READY`
> 
> 任务 ID：`V3-BRANCH-BASE-PRODUCT-SCOPE-20260815`
> 
> 执行角色：产品经理 Agent v2.3.2（`019fefa7-9883-7af2-bdb5-acc5c8513781`）
> 
> 目标版本：`v2.3.2`
> 
> 项目 workflow：`WORKFLOW_ACTIVE`；本声明不构成 `WORKFLOW_COMPLETE`。

## 1. 声明范围与结论

本文件是产品经理对 V3 基线候选的产品 / 业务范围声明，不是代码验收、分支创建授权、
`BRANCH_BASE_RECEIPT`、部署授权、生产验收、Issue 状态修改或项目 workflow 收口。

对候选 commit `33314857da0f2d72066443965454d23fc70a16d3`、tree
`4ee5996aa9308aa4486f0453c5c397ebdd09a949` 的结论为：

> 可以作为“上一已验收版本”的产品 / 业务范围候选，交原登记独立代码复核线程进行只读
> 技术复核；不能写成“上一已验收版本的确定代码基线”，不能写成 `BASE_ACCEPTED`，也不能
> 写成 V3 已创建、已实现或已部署。

本候选可承接的产品 / 业务范围，仅来自 `ISSUE-0020` 自身已经形成的关闭链与业务方已接受的
七项残余风险。除该范围外，任何未来 V3–V7 规划、当前工作区内容或其他 Issue 均不因本声明
自动进入候选基线。

## 2. 用户确认与六份文档的精确绑定

当前总负责人任务中的用户回复“确认”，这里只确认下表六份最终文件的精确字节版本。下表是
本声明建立的独立确认引用，不回写、不覆盖、不改变六份文件正文中的草案 / 待确认表头，也
不把本声明扩写成用户选择了严格串行或 V7 N-006 的 A/B/C 任一选项。

| 文件 | 用户确认绑定 SHA-256 | bytes | lines | 当前正文状态 |
| --- | --- | ---: | ---: | --- |
| `2026-08-15-v3-v7-总版本索引与分支契约.md` | `516A4D05DFF64BF5B7271783138FCC6E608B9450949456177E4F383EC96EDF77` | 19,147 | 274 | `DRAFT_NON_CANONICAL / AUTHOR_DRAFT / USER_CONFIRMATION_PENDING` |
| `2026-08-15-issue-0034-安全基线关闭-spec.md` | `86B457B178B8BFB897DA42189C310C0CD1497D8D7886E7B5278B4905BD57ACF6` | 16,590 | 181 | `DRAFT_NON_CANONICAL / AUTHOR_DRAFT / USER_CONFIRMATION_PENDING` |
| `2026-08-15-issue-0032-邮箱人机验证关闭-spec.md` | `F7939E3BD8769B9BE4CB18335A71B1BC624FD32182827F099F219F8DD36B9073` | 16,889 | 191 | `DRAFT_NON_CANONICAL / AUTHOR_DRAFT / USER_CONFIRMATION_PENDING` |
| `2026-08-15-issue-0036-联系方式审核关闭-spec.md` | `CEA06C42018223C3A45E6E62FDC9047041E025A3654A678FB2E13ECEEE2F563E` | 17,488 | 198 | `DRAFT_NON_CANONICAL / AUTHOR_DRAFT / USER_CONFIRMATION_PENDING` |
| `2026-08-15-issue-0038-联系方式审核文档债务关闭-spec.md` | `7248241D9EBE78FC0E6D9491CBAE5BC87C8C3423AA1BC65E6E81DC6AE72AFD46` | 17,407 | 175 | `DRAFT_NON_CANONICAL / AUTHOR_DRAFT / UPSTREAM_GATE_BLOCKED` |
| `2026-08-15-issue-0035-联合Spec文档债务关闭-spec.md` | `B51D37004F5123660FF863E4C8A0776B13F0F044C4AFD8C7438C1638E9F66BF4` | 15,120 | 176 | `DRAFT_NON_CANONICAL / AUTHOR_DRAFT / UPSTREAM_GATE_BLOCKED` |

确认绑定不改变以下未决事实：

- 总索引仍把严格串行策略保留为 `USER_CONFIRMATION_PENDING`；本声明没有替用户选择该策略。
- V7 仍按文档既有 fail-closed 行为处理 ISSUE-0031 / N-006 冲突；本声明没有把它写成用户
  选择 N-006 的 A、B 或 C。
- V6 的 `V5_ACCEPTED_EVIDENCE_REF` 仍缺失，V7 的 ISSUE-0031 延期冲突仍需保持其既有门禁。

## 3. 候选收据与当前产品范围根源

候选收据为：

| 项 | 值 |
| --- | --- |
| receipt | `Code文档/docs/2026-08-15-v3-branch-base-receipt-candidate.md` |
| receipt SHA-256 | `0273618BE17B0762E67149D6D14930E7297EDB28442741110F3F7B00BF622596` |
| receipt 状态 | `CANDIDATE_READY`，不是 `BASE_ACCEPTED` |
| candidate commit | `33314857da0f2d72066443965454d23fc70a16d3` |
| tree | `4ee5996aa9308aa4486f0453c5c397ebdd09a949` |
| parent | `3896a1fa9ac15da23f9ba6d3ff2cb124357a05ab` |
| branch / ref | `V2-unified-navigation-responsive-profile-20260729` |

候选收据、ISSUE-0020 关闭 canonical 与当前 Issue 总表共同支持的产品 / 业务范围如下：

1. 生产用户可见入口及安全边界：新 apex 的 `/`、`/rules`、`/feedback` 为 `200`，匿名
   session 为 `401`；旧 apex 可达；`www` 以 `308` 精确保留 path/query 跳转；固定源站对
   无头 / 伪造头访问为 `403`，安全响应头在。
2. 反馈最小闭环：生产 `ungradu-edu-prod-064` 中，两个专用账号各自完成登录态
   `CSRF 200 → feedback POST 200 → feedback GET 200`；用户可见反馈已记录，编号为
   `risk-feedback-7ace2863-eb26-438b-ae96-85be692c4ce8` 与
   `risk-feedback-4289043a-0df9-4956-9097-412dfff6f2d4`；两个账号互相不可见对方反馈。
3. 安全与回滚告知：Contract B 的终态为
   `HARD_CUT_FUNCTIONAL_PASS_WITH_EXECUTION_DEVIATION`；
   `SAFE_ROLLBACK_ALTERNATIVE=PASS` 仅表示采用安全替代证据，不表示真实反向回滚已演练。
4. 业务风险接受：ISSUE-0020 关闭链登记并由业务方接受七项残余风险；该接受只覆盖
   ISSUE-0020 自身，不替代 V3 的独立技术复核或其他 Issue 的业务门禁。

因此，本候选承接的是 ISSUE-0020 关闭链所证明的既有用户可见反馈、安全告知、账号隔离和
风险接受范围，而不是 V3–V7 Spec 中尚未实现的未来能力。

## 4. 明确排除范围

下列内容明确不属于本候选的产品 / 业务范围，也没有被本声明授权：

- `ISSUE-0031`、数据库选型 / 迁移 / 双写 / 备份恢复 / RPO / RTO，以及全部数据库动作；
- 全部付费服务、采购、计费、真实 provider、生产凭据、Secret、DPA 或生产接入；
- `ISSUE-0032` 的真实 provider/widget/Secret/生产集成；`ISSUE-0036` 的生产人工审核、AI
  出域、OCR、自动公开、人工 owner、生产 key；`ISSUE-0038`、`ISSUE-0035` 的文档债务关闭；
- 当前 Active Open 的其他 Issue，包括 `ISSUE-0040/0041/0042/0043/0044/0045`；当前精确
  Active Open 为 `0031/0032/0034/0035/0036/0038/0040/0041/0042/0043/0044/0045`；
- `ISSUE-0034` 的关闭、V3 分支创建、V3 实现、部署、生产复验、业务最终验收或
  `ISSUE_CLOSURE_RECEIPT`；当前 `ISSUE-0034` 仍为 `open / TECH_REVIEW_PASS`；
- 六份 Spec / 总索引的 canonical 冻结、Hermes/Document QA/Issue 管理员报告的状态升级，
  以及任何用户未确认的严格串行或 N-006 A/B/C 决策；
- 当前工作区的 staged、tracked dirty、untracked 内容。候选收据记录当前快照含 23 项 staged、
  28 项 tracked dirty、249 项 untracked；这些内容不得随候选树或未来 V3 分支携带；
- 任何角色文件、中央注册 / 总览、CONTEXT、Issue canonical/state、代码、UI、平台配置和
  生产环境状态的修改。

## 5. Provenance 边界

本声明只确认以下层次，不混淆不同证据：

- `33314857…`、tree、parent、branch/ref 和 receipt SHA 是候选收据的 Git / 文件身份事实，
  可供独立代码复核核对；它们不自动构成上一已验收版本的 `BASE_ACCEPTED`。
- ISSUE-0020 关闭链把 `33314857…` 与 064 行为、技术 PASS、产品 PASS 及七项风险接受关联，
  但平台 Git provenance 仍明确为偏差边界：`064 → 33314857` 未精确证明。
- Worker 短版本 `e72e0119` 不是 Git SHA；`054 → e81` 的平台 Git provenance 也未精确证明。
- 六份文档的固定哈希是用户确认的字节绑定，不代表它们已经从 draft/pending 变成 canonical，
  不代表 Hermes/Document QA/Issue 管理员所有门禁均已关闭，也不属于候选 commit tree 的自动
  新增内容。
- Document QA 当前记录为 `SERIOUS_BATCH_REMEDIATED`，不是用户批准、实现授权、分支完成、
  部署、生产验收或 Issue 关闭；可用 Hermes 报告均为
  `PASS_WITH_NONBLOCKING_OPEN_ISSUES`，且 `ISSUE-0040` 至 `ISSUE-0045` 仍为
  `open / NON_BLOCKING_DOCUMENT_REVIEW`。0035 当前可用报告为 Round 1/3，不能扩写成已完成
  后续轮次。

## 6. 当前未通过门禁

截至本声明，以下门禁仍未通过：

1. `BRANCH_BASE_RECEIPT` 尚未由独立代码复核确认；候选收据仍为 `CANDIDATE_READY`，不是
   `BASE_ACCEPTED`。
2. 独立代码复核尚未针对候选 commit/tree、收据、限定范围和 no-carry 快照给出
   `TECH_REVIEW_PASS` 或 `TECH_REVIEW_REWORK_REQUIRED`。
3. `ISSUE-0034` 仍 open；六份文档虽然已由用户确认绑定固定哈希，正文状态仍是 draft/pending，
   不能由本声明替代 canonical 冻结或 Issue 关闭。
4. 总索引严格串行选择、V7 N-006 选择、V6 的 V5 accepted evidence，以及各 Issue 的实现、
   生产、业务和管理员关闭门禁仍按原文保持未决或阻塞。
5. 项目 workflow 仍为 `WORKFLOW_ACTIVE`；没有 V3 分支、V3 实现、部署或生产验收授权。

## 7. 唯一下一步

将本声明、候选 receipt 及其精确 commit/tree 交给原登记独立代码复核线程：

`019fefa7-d1d3-7ac3-a5ba-8b8abe299958 / 独立代码复核v2.3.2 / gpt-5.6-sol / high`。

该线程只读核对候选产品 / 业务范围与代码树、收据和限定 diff，输出其独立技术结论；本角色
不自行派发任务、不创建 subagent、不创建分支、不执行实现或 Git mutation，并继续保持
`BASE_ACCEPTED` 未成立。

