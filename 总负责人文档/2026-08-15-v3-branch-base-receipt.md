# V3 BRANCH_BASE_RECEIPT（2026-08-15）

## 1. 冻结结论

- Receipt 状态：`BRANCH_BASE_RECEIPT_FROZEN`
- Base 结论：`BASE_ACCEPTED_FOR_V3_BRANCH_ROOT`
- 冻结 owner：`01a00565-5d72-7663-991d-178c5dcfd170 / 项目总负责人v2.3.3 / gpt-5.6-sol / high`
- 冻结时间：`2026-08-15T23:34:18+08:00`
- 适用范围：仅证明 `V3-issue-0034-security-baseline-closure` 可以从本收据固定的上一已验收 commit 创建根分支。
- 明确非结论：本收据不表示 V3 分支已创建，不授权 V3 实现、提交、推送、部署或平台操作，不表示 `ISSUE-0034` 已关闭，也不表示项目 workflow 完成。

## 2. 精确 Git 基线

| 字段 | 冻结值 |
| --- | --- |
| base commit | `33314857da0f2d72066443965454d23fc70a16d3` |
| tree | `4ee5996aa9308aa4486f0453c5c397ebdd09a949` |
| parent | `3896a1fa9ac15da23f9ba6d3ff2cb124357a05ab` |
| source branch | `V2-unified-navigation-responsive-profile-20260729` |
| source ref | `refs/heads/V2-unified-navigation-responsive-profile-20260729` |
| source remote ref | `refs/remotes/origin/V2-unified-navigation-responsive-profile-20260729` |
| subject | `fix(csrf): restore authenticated write requests` |
| author / committer time | `2026-08-14T12:58:30+08:00` |
| local / tracking / live remote | 三者均为 base commit；ahead/behind=`0/0` |

`33314857…` 的接受依据不是“它是 HEAD”或“它已经推送”，而是代码 owner、产品/业务范围 owner 与独立技术复核 owner 对不可变 Git 对象和 ISSUE-0020 关闭证据链的结论唯一且一致。

候选对比结论：

- `3896a1fa…` 缺少其后的 22 文件 CSRF 修复链，只是结构 parent，不能替代本 base；
- `e74b39dc…` 仅覆盖较早的 ISSUE-0034 非数据库安全切片，生产仍为部分通过；
- `80f1fac8…` 只覆盖更早的 ISSUE-0033；
- DeployId、CloudBase/Worker 版本、短版本和时间相关性均不是 Git base 证据。

## 3. 三方来源与固定身份

| Owner / 结论 | 路径 | SHA-256 | bytes / lines |
| --- | --- | --- | ---: |
| 代码 owner / `CANDIDATE_READY` | `Code文档/docs/2026-08-15-v3-branch-base-receipt-candidate.md` | `0273618BE17B0762E67149D6D14930E7297EDB28442741110F3F7B00BF622596` | 15384 / 149 |
| 产品经理 / `PRODUCT_SCOPE_STATEMENT_READY` | `规划文档/Spec文档/Release_version_Spec/2026-08-15-v3-branch-base-product-scope-statement.md` | `478C9CD25ECB4C03F04EE4023BA6D59167F425B42CFC3BD8386300363A029AD4` | 9480 / 143 |
| 独立代码复核 / `TECH_REVIEW_PASS` | `Code文档/docs/2026-08-15-v3-branch-base-independent-review.md` | `1F35F329266088DAB2C3E39AD9863F7635A0E4E77F47D05BFD1B813210A3B476` | 12475 / 130 |

独立复核结果：Standards P0/P1/P2=`0/0/0`；Issue gate P0/P1/P2=`0/0/0`。十项 build input 均直接从 base commit object 核对，不从当前工作树推断。

## 4. 用户确认与文档绑定

用户本轮“确认”仅绑定以下六份最终文件的精确字节版本：

| 文档 | SHA-256 |
| --- | --- |
| V3-V7 总版本索引与分支契约 | `516A4D05DFF64BF5B7271783138FCC6E608B9450949456177E4F383EC96EDF77` |
| ISSUE-0034 关闭 Spec | `86B457B178B8BFB897DA42189C310C0CD1497D8D7886E7B5278B4905BD57ACF6` |
| ISSUE-0032 关闭 Spec | `F7939E3BD8769B9BE4CB18335A71B1BC624FD32182827F099F219F8DD36B9073` |
| ISSUE-0036 关闭 Spec | `CEA06C42018223C3A45E6E62FDC9047041E025A3654A678FB2E13ECEEE2F563E` |
| ISSUE-0038 关闭 Spec | `7248241D9EBE78FC0E6D9491CBAE5BC87C8C3423AA1BC65E6E81DC6AE72AFD46` |
| ISSUE-0035 关闭 Spec | `B51D37004F5123660FF863E4C8A0776B13F0F044C4AFD8C7438C1638E9F66BF4` |

该确认未选择 V4–V7 的严格 Issue 关闭串行策略，也未选择 V7 N-006 的 A/B/C。六份原文件未被改写，原 Hermes/Document QA 哈希保持有效；其正文 draft/pending 或 blocked 表头由独立产品范围声明建立确认引用，不在本收据中静默改写。

## 5. 验收层级与 provenance 边界

- Git object/ref 身份：`PASS`。
- ISSUE-0020 适用技术、独立复核、产品与业务关闭范围：`PASS`，仅覆盖 ISSUE-0020 自身。
- 生产 064 双账号 feedback/隔离行为：`PASS_WITH_PROVENANCE_DEVIATION`。
- `064→33314857`、`054→e81` 的精确平台 Git 映射：`NOT_PROVEN`；这是 ISSUE-0020 已登记并由业务方接受的残余风险，不得升级为 provenance PASS。
- Worker 短版本 `e72e0119` 不是 Git SHA。
- `ISSUE-0034` 仍为 `open / TECH_REVIEW_PASS`；本 base receipt 不提供其关闭证据。

## 6. No-carry 与分支创建约束

1. Base 是不可变 commit/tree 对 `33314857… / 4ee5996a…`，不是当前 index、worktree 或 untracked 快照。
2. 当前工作树的 23 staged、28 tracked dirty 及全部 untracked 均不得进入 V3 起始 tree；receipt、产品声明、六份 Spec、Issue/角色/UI/客服 Dify/其他 Issue/平台配置同样不得自动携带。
3. 若后续获得分支创建授权，必须在隔离且干净的工作树创建 `V3-issue-0034-security-baseline-closure`，起始 ref 精确指向 base commit，并立即核对 tree=`4ee5996a…`、manifest `missing=0 / extra=0`。
4. 禁止从当前脏工作树普通暂存或提交来“制造”V3 根提交；禁止为此 reset、clean 或 stash 当前受保护内容。
5. 分支创建后仍须分别取得 Spec、实现、测试、独立复核、适用部署/生产证据、业务验收和 ISSUE 管理员关单证据；分支完成不自动等于 Issue 关闭。

## 7. 回滚与失败恢复

- `3896a1fa…` 仅是结构 parent，不是自动可部署回滚版本。
- `SAFE_ROLLBACK_ALTERNATIVE=PASS` 不等于真实反向回滚演练；旧 Secret 已暴露，禁止恢复旧值。
- 若未来 V3 起始 ref/tree/manifest 与本收据不一致，立即停止创建或实现，从本 base commit 重新建立干净证据；不得改变当前受保护工作树来掩盖差异。
- 平台回滚、部署与配置变更均不在本收据授权范围内。

## 8. 当前门禁与唯一下一步

- 项目 workflow=`WORKFLOW_ACTIVE`。
- Active Open 精确为 `ISSUE-0031/0032/0034/0035/0036/0038/0040/0041/0042/0043/0044/0045`。
- `ISSUE-0031`、数据库及全部付费动作继续延期。
- `BRANCH_BASE_RECEIPT` 已冻结；V3 分支尚未创建，V3 实现尚未授权。
- V4–V7 严格串行选择与 V7 N-006 A/B/C 仍未由用户选择；这些未决不被本收据冒充已解决。

唯一下一步：由业务方决定是否授权现有代码 owner 在隔离干净工作树中，从本收据固定的 `33314857…` 创建唯一分支 `V3-issue-0034-security-baseline-closure`。在该授权前，不执行 Git mutation，不进入实现。

