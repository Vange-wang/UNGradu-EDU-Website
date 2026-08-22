# V3 BRANCH_BASE_RECEIPT 独立技术复核（2026-08-15）

## 1. 结论与边界

- 任务：`V3-BRANCH-BASE-INDEPENDENT-REVIEW-20260815`
- 执行角色：`019fefa7-d1d3-7ac3-a5ba-8b8abe299958 / 独立代码复核v2.3.2 / gpt-5.6-sol / high`
- Verdict：`TECH_REVIEW_PASS`
- 复核对象：`Code文档/docs/2026-08-15-v3-branch-base-receipt-candidate.md`、产品范围声明、候选 Git object/ref、六份固定文档及其最终审查/Issue 证据。
- 结论范围：证据唯一且相互一致，可以交项目总负责人冻结 `BRANCH_BASE_RECEIPT`。
- 明确非结论：本结论不是 `BASE_ACCEPTED`，不授权创建/切换分支、V3 实现、Git mutation、npm、部署、平台操作、Issue 关闭或项目 workflow 完成。

## 2. Standards findings

- P0：none。
- P1：none。
- P2：none。

候选收据明确区分 commit 身份、关闭证据、生产行为与平台 provenance；从不可变 commit object 固定 build inputs；保留脏工作树隔离、失败恢复和 Secret 不读取边界。未发现把 HEAD、平台版本、当前 index/worktree 或用户确认扩大为代码基线通过的错误。

## 3. Issue gate findings

- P0：none。
- P1：none。
- P2：none。

`ISSUE-0020` 的关闭证据只用于证明其自身已关闭范围；`ISSUE-0034` 继续为 `open / TECH_REVIEW_PASS`，没有被本复核提前关闭。六份文件的用户确认只绑定精确字节版本，没有被扩大为严格串行选择、V7 N-006 A/B/C 选择、canonical 冻结或实现授权。

## 4. Git、commit、tree 与输入核对

### 4.1 不可变对象与 ref

| 项目 | 独立只读核对结果 |
| --- | --- |
| candidate commit | `33314857da0f2d72066443965454d23fc70a16d3`；object type=`commit` |
| parent | `3896a1fa9ac15da23f9ba6d3ff2cb124357a05ab` |
| tree | `4ee5996aa9308aa4486f0453c5c397ebdd09a949`；object type=`tree` |
| branch/ref | `V2-unified-navigation-responsive-profile-20260729` |
| local branch | `33314857da0f2d72066443965454d23fc70a16d3` |
| local tracking ref | `33314857da0f2d72066443965454d23fc70a16d3` |
| live remote ref | `33314857da0f2d72066443965454d23fc70a16d3`；由只读 `ls-remote` 取得，未 fetch |
| ahead/behind | `0/0` |
| author/committer time | `2026-08-14T12:58:30+08:00` / `2026-08-14T12:58:30+08:00` |
| subject | `fix(csrf): restore authenticated write requests` |

### 4.2 图关系与候选唯一性

- `3896a1fa…`、`e74b39dc…`、`80f1fac8…` 均为 `33314857…` 的祖先；`3896a1fa…` 是其直接 parent。
- `80f1fac8… → e74b39dc…` 为 1 个提交；`e74b39dc… → 3896a1fa…` 为 6 个提交；`3896a1fa… → 33314857…` 为 1 个提交。
- `33314857…` 相对直接 parent 的 manifest 为精确 22 文件，`675 insertions / 40 deletions`，与认证态写请求 CSRF 修复候选一致。
- `80f1fac8…` 是更早 ISSUE-0033 锚点；`e74b39dc…` 是 ISSUE-0034 非数据库安全切片且其 canonical 仍记录生产验收仅部分通过；`3896a1fa…` 缺少后续 22 文件 CSRF 修复；三者均没有 ISSUE-0020 最终关闭链对 `33314857…` 的完整技术、产品、生产行为和业务风险接受绑定。
- 因此 `33314857…` 是当前关闭证据链支持的唯一“上一已验收版本候选”；结论依据不是它恰好为 HEAD，也不是它已推送。唯一候选仍不等于 `BASE_ACCEPTED`。

### 4.3 直接从 candidate commit object 核对 build inputs

| 输入 | candidate blob | bytes |
| --- | --- | ---: |
| `Code文档/package.json` | `9f74f257174ad5c84d62428531c61e30e18a226d` | 1485 |
| `Code文档/package-lock.json` | `012694c0c71cab4fc9b3d74f767d1e87216cf4ee` | 272449 |
| `Code文档/Dockerfile` | `1b81e0603eb9453226137327c23254ef39e11138` | 1153 |
| `Code文档/next.config.ts` | `d45b622da3152d7b9023e69d84d77dc1c5e83b8d` | 789 |
| `Code文档/tsconfig.json` | `e5ee1976f8c93c3d24fa8ed90a953542f889ba82` | 573 |
| `Code文档/vitest.config.ts` | `2c505cf3a89fae651196ff648b529c86a9da3734` | 315 |
| `Code文档/.env.example` | `c4d787d8acbb73babca021db3d58c3b917cd1939` | 4064 |
| `Code文档/cloudflare/worker.js` | `3865a03b2ff38494c02ad60ec3816cdfd8dbfb87` | 4490 |
| `Code文档/cloudflare/worker.ts` | `2139828b5ae6b6767ab9cf3de95d3a2db465f17b` | 4566 |
| `Code文档/scripts/production-readiness-check.mjs` | `937448776addc758060ed25f07959e11e6c1cd41` | 6587 |

以上 OID/bytes 均从 `33314857…:<path>` 解析并用 `git cat-file` 核对，未从当前工作树推断，未运行 npm、测试或构建。

## 5. 文件输入与审查链核对

### 5.1 冻结输入

| 文件 | SHA-256 | bytes / lines |
| --- | --- | ---: |
| `Code文档/docs/2026-08-15-v3-branch-base-receipt-candidate.md` | `0273618BE17B0762E67149D6D14930E7297EDB28442741110F3F7B00BF622596` | 15384 / 149 |
| `规划文档/Spec文档/Release_version_Spec/2026-08-15-v3-branch-base-product-scope-statement.md` | `478C9CD25ECB4C03F04EE4023BA6D59167F425B42CFC3BD8386300363A029AD4` | 9480 / 143 |
| `2026-08-15-v3-v7-总版本索引与分支契约.md` | `516A4D05DFF64BF5B7271783138FCC6E608B9450949456177E4F383EC96EDF77` | 19147 / 274 |
| `2026-08-15-issue-0034-安全基线关闭-spec.md` | `86B457B178B8BFB897DA42189C310C0CD1497D8D7886E7B5278B4905BD57ACF6` | 16590 / 181 |
| `2026-08-15-issue-0032-邮箱人机验证关闭-spec.md` | `F7939E3BD8769B9BE4CB18335A71B1BC624FD32182827F099F219F8DD36B9073` | 16889 / 191 |
| `2026-08-15-issue-0036-联系方式审核关闭-spec.md` | `CEA06C42018223C3A45E6E62FDC9047041E025A3654A678FB2E13ECEEE2F563E` | 17488 / 198 |
| `2026-08-15-issue-0038-联系方式审核文档债务关闭-spec.md` | `7248241D9EBE78FC0E6D9491CBAE5BC87C8C3423AA1BC65E6E81DC6AE72AFD46` | 17407 / 175 |
| `2026-08-15-issue-0035-联合Spec文档债务关闭-spec.md` | `B51D37004F5123660FF863E4C8A0776B13F0F044C4AFD8C7438C1638E9F66BF4` | 15120 / 176 |

六份文件的精确 hash/bytes/lines 与产品声明绑定一致。它们正文仍保留 `DRAFT_NON_CANONICAL / AUTHOR_DRAFT / USER_CONFIRMATION_PENDING` 或 `UPSTREAM_GATE_BLOCKED`；用户确认是字节绑定，不改变这些正文状态。

### 5.2 Hermes、Document QA 与 Issue 管理员边界

- 最终可用 Hermes 报告均使用 `deepseek-v4-pro`，metadata 记录 `default_model_changed=false`、`exit_code=0`、`canonical_source_unchanged=true`。
- 最终报告 hash：总索引 Round 2=`B6EDAAFA955EA2BF6B68A4E9459F036FF9BD2B518C53A47C5D2130D13FB0AA6C`；0034 Round 2=`F31EB33F6AA4A5BDB723B7EE3A66E3A8003006624E70C49D4A71DB388AD763FD`；0032 Round 2=`C56E4B980AAF26D4876AEA94A6C50CC4B77CB0F8AE1072DEC49FF00FFE517666`；0036 Round 2=`E429C6D46D1ADE039729CB86AC2AD8B444A89B434A40592509EF23428D683001`；0038 Round 3=`5721D48B8BE4E54AC4FC477737398CA825C3CA1AB38B5737579D09C22A04D6B4`；0035 Round 1=`578B2ACBD243149F02C4A99FDE464AD742538E2311A53385A6065B9EDAD4F580`。
- Document QA 整改记录 SHA-256=`9083A23C79BF4D383F1838DA672D30A2BD7E7A74CA67D6C73A870D0B594FF8D8`，状态是 `SERIOUS_BATCH_REMEDIATED`，不是用户批准、实现授权、部署、生产验收或 Issue 关闭。
- `ISSUE-0040` 至 `ISSUE-0045` 六份 canonical 均存在并保持 `open / NON_BLOCKING_DOCUMENT_REVIEW`；其 SHA-256 依次为 `FA35304B…`、`15302E7B…`、`627B445B…`、`33A82166…`、`C0C2A36D…`、`56DF9D73…`。这些报告/Issue 只证明文档审查与非阻塞债务登记，不升级六份正文状态。

## 6. 证据层级与 provenance 边界

- `ISSUE-0020` 关闭 canonical SHA-256=`F8DA9AA2930322B5391D9D62404E4FF8D09E899A3D1FD460EAA0E4E7A708874A`。其第 121–127 行把独立技术 PASS、产品 PASS、生产 064 双账号 feedback/隔离行为、commit `33314857…` 和安全回滚替代置于同一关闭链。
- 同一 canonical 第 131–145 行登记业务方七项残余风险接受；R4 明确把 `054→e81`、`064→33314857` 精确平台 Git provenance 缺口保留为 `ACCEPTED_RESIDUAL_RISK`。
- 因此证据层级为：Git object/ref 身份=`PASS`；ISSUE-0020 适用技术/产品/业务关闭范围=`PASS`；生产路径行为=`PASS_WITH_PROVENANCE_DEVIATION`；`064→33314857` 精确平台 Git 映射=`NOT_PROVEN`。
- CloudBase 064、Worker 短版本 `e72e0119`、DeployId/BuildId、时间和行为都不能反推 Git SHA。本复核没有把已接受风险升级为 provenance PASS，也没有读取任何 Secret。
- `ISSUE-0034` canonical SHA-256=`CB2C870D7BE05E3169F6750AE26FFDFB94D3D32F7F5A4526D457B8D4C7780E07`；第 465–495 行仍记录 `open / TECH_REVIEW_PASS`、post-push 通过但生产验收仅部分通过。它不因候选基线复核而关闭。
- Issue 总表 SHA-256=`447968152364B31F6597176A2B98AB516D4B10E40D75B56262D55F1E641E92E5`；Active Open 独立解析为精确 12 项：`0031/0032/0034/0035/0036/0038/0040/0041/0042/0043/0044/0045`；`ISSUE-0020` 仅自身为 `closed / WORKFLOW_COMPLETE`。

## 7. no-carry 与脏工作树隔离

- Candidate 是不可变对象对 `33314857… / 4ee5996a…`；当前 index/worktree/untracked 不会因创建 ref 自动进入该 tree。
- 当前 receipt、产品声明、六份 Spec 的精确路径均不存在于 candidate tree。当前 `ISSUE总表.md` 路径在 candidate tree 中只有旧 blob `865c66cb…`；当前 index blob=`107981a1…`、worktree SHA-256=`44796815…`，故当前 Issue 表内容同样不属于 candidate tree。当前 Issue canonical、角色连续性文件及本复核产物的核对路径也不在 candidate tree；其他已有路径的当前 staged/dirty 内容只能由当前 status/diff 表示，不能冒充 candidate 内容。
- 本轮写入前当前状态为：23 staged、Code staged=2、28 tracked dirty、18 unstaged tracked、251 untracked。相对候选收据的 249 untracked 增量来自之后获准形成的 receipt/产品声明；不能把当前快照改写为候选树。
- 本轮保护快照明确排除本报告与 `Code文档/独立代码复核工作记录.md`，其余状态为：protected status 278 records，SHA-256=`B97E2232F7E3DECCD74A4078483A69E99C6E970E9E7A377AD34BD5D53A293E4A`；staged list SHA-256=`A38B52E201B8517B96E49296784DC8BC6063981044D2070D612DF1A176BE885F`；Code staged list SHA-256=`E116906AB6D095703B8DE72369189285E2148399D8D65C840EF53A779FA6A4A2`；cached patch OID=`d00aa22eb314e5c82710388d656a2250ff482ee8`；protected worktree patch OID=`2ce023aaf792ae50d62ca455e06bdd5021f1a6f5`；protected untracked=250，manifest SHA-256=`BBF3D1F50C960003B9292A7CFF2DE6BC8290940BC9514226AEEA7314AE867AD8`。
- 若未来获得 V3 创建授权，新 ref 的起始 object/tree 必须精确为 `33314857… / 4ee5996a…`，并证明初始 manifest 相对 candidate `missing=0 / extra=0`；应在隔离干净工作树执行。当前工作树任何 staged/dirty/untracked 都不得作为分支内容来源。

## 8. 回滚与失败恢复边界

- `3896a1fa…` 只证明 Git 直接父关系；它缺少 22 文件 CSRF 修复链，不能自动称为生产已验收或可部署回滚版本。
- `SAFE_ROLLBACK_ALTERNATIVE=PASS` 由回退入口、旧公共回滚域、真实 mismatch 后 forward recovery、监控/停止条件、稳定观察和 064 回归组成；旧 Secret 已 exposed，禁止为了演练恢复旧值。
- 该安全替代是“不执行高风险真实反向回滚”的关闭证据，不等于真实反向回滚演练，也不授权平台回退。
- V3 起始 ref/tree/manifest 若不匹配，必须停止并从精确 candidate 重新出具干净证据；不得对当前受保护工作树执行 reset/clean/stash。

## 9. 未通过门禁

1. 项目总负责人尚未冻结最终 `BRANCH_BASE_RECEIPT`，`BASE_ACCEPTED` 尚未成立。
2. `ISSUE-0034` 仍 `open / TECH_REVIEW_PASS`；V3 尚未创建、实现、复核、部署、生产验收或业务验收。
3. 六份正文状态仍为 draft/pending 或 upstream blocked；严格串行与 V7 N-006 A/B/C 未由用户选择。
4. `064→33314857`、`054→e81` 精确平台 Git provenance 仍 `NOT_PROVEN`；只能按已登记残余风险处理。
5. 当前脏树隔离和后续初始 manifest `missing=0 / extra=0` 门禁尚待未来获授权创建 ref 时验证。
6. `ISSUE-0031`、数据库及全部付费动作继续延期。
7. 项目 workflow 仍为 `WORKFLOW_ACTIVE`，不是 `WORKFLOW_COMPLETE`。

## 10. 唯一下一步

将本 `TECH_REVIEW_PASS`、候选 receipt、产品范围声明和精确 `33314857… / 4ee5996a…` 证据交项目总负责人冻结 `BRANCH_BASE_RECEIPT`。本角色不自行创建分支、不进入 V3 实现、不执行 Git mutation/部署/平台操作，也不写 `BASE_ACCEPTED`。
