# V3 BRANCH_BASE_RECEIPT 候选（2026-08-15）

## 1. 收据状态与边界

- 任务：`V3-BRANCH-BASE-RECEIPT-CANDIDATE-20260815`
- 代码 owner：`019fefa7-a3c3-7333-94d7-d61961c5ea99 / 代码开发员v2.3.2 / gpt-5.6-sol / high`
- 状态：`CANDIDATE_READY`
- 候选用途：仅供产品经理形成 V3 产品/业务范围声明，并由上游后续决定是否接受为分支根基线。
- 明确非结论：本收据不是 `BASE_ACCEPTED`，不授权创建或切换分支，不授权 V3 实现、Git mutation、部署、平台操作、Issue 关闭或项目 workflow 完成。
- Workflow：项目总 workflow 仍为 `WORKFLOW_ACTIVE`。`ISSUE-0020` 仅自身为 `closed / WORKFLOW_COMPLETE`；Active Open 精确为 `ISSUE-0031/0032/0034/0035/0036/0038/0040/0041/0042/0043/0044/0045`。
- 延期范围：`ISSUE-0031`、数据库及全部付费动作继续延期，不得混入 V3。

## 2. 唯一 Git 候选

| 字段 | 值 |
| --- | --- |
| candidate SHA | `33314857da0f2d72066443965454d23fc70a16d3` |
| ref | `refs/heads/V2-unified-navigation-responsive-profile-20260729`；`refs/remotes/origin/V2-unified-navigation-responsive-profile-20260729` |
| branch | `V2-unified-navigation-responsive-profile-20260729` |
| parent | `3896a1fa9ac15da23f9ba6d3ff2cb124357a05ab` |
| tree | `4ee5996aa9308aa4486f0453c5c397ebdd09a949` |
| author | `Vange-wang <vangewang0919@gmail.com>` |
| author time | `2026-08-14T12:58:30+08:00` |
| committer time | `2026-08-14T12:58:30+08:00` |
| subject | `fix(csrf): restore authenticated write requests` |
| local / tracking / remote | 三者均为候选 SHA；ahead/behind=`0/0` |
| commit/tree object | `commit` / `tree`，已由 `git cat-file` 只读核对 |

候选不是因为它恰好等于 HEAD 或已经推送而成立。它成为唯一候选的依据是：仓库关闭 canonical 将该精确提交与 `TECH_FINAL_VERDICT=PASS`、`PRODUCT_FINAL_VERDICT=PASS`、生产 064 双账号回归及业务方七项残余风险接受放在同一关闭证据链中，同时明确保留 `064→33314857` 平台 Git provenance 未精确证明。后者是已登记并接受的证据偏差，不得被改写成精确映射。

## 3. 候选比较与排除

| 对比项 | 只读事实 | 结论 |
| --- | --- | --- |
| `33314857…` | 当前 branch/local/tracking/remote 一致；关闭 canonical 明确点名；其 22 文件提交补齐认证态写请求 CSRF 公开契约；064 行为链与业务接受均已登记 | 唯一候选；仍非已接受 base |
| `3896a1fa…` | 候选直接 parent，tree=`be04c93b82472cb6254903e8e85d32c00e3c97cb`；只含 7 文件生产 session 验证修复；缺少后续 22 文件 CSRF 链 | 排除。不能覆盖 064 已验收的认证态 feedback 写路径，也无仓库关闭证据将其单独认定为最终版本 |
| `e74b39dc…` | `80f1fac8…` 的后继；tree=`270d6f8e6dc36e98e18fefde34a38de8fcf833a1`；0034 非数据库安全切片曾获技术、提交边界和 post-push 通过，但 canonical 仍记生产验收仅部分通过 | 排除。它是候选祖先，不是最新完成生产/业务闭环的版本 |
| `80f1fac8…` | ISSUE-0033 的已关闭代码锚点；也是 `e74b39dc…` 的 parent | 排除。只覆盖更早的 0033，缺少后续 0034 与 0020 登录/CSRF 安全链 |
| DeployId/版本号/Worker 短版本 | 064、053/054/055、`e72e0119` 均为平台标识或行为锚点 | 排除为 Git base。不得由平台标识、时间或行为反推 SHA |
| 当前 index/worktree/untracked | 23 staged、28 tracked dirty、249 untracked，均是受保护既有状态 | 排除。它们不属于 candidate tree，不得被带入 V3 |

Git 祖先核对：`3896a1fa…`、`e74b39dc…`、`80f1fac8…` 均为 `33314857…` 的祖先。`3896a1fa…→33314857…` 为 22 文件、675 insertions / 40 deletions；该差异正是候选相对父提交不可省略的认证态写请求 CSRF 修复链。

## 4. 分层证据映射

| 层级 | 当前结论 | 精确仓库证据与边界 |
| --- | --- | --- |
| Git 身份 | `PASS_FOR_CANDIDACY` | 本收据第 2 节的只读 object/ref/remote 核对；branch graph snapshot Git OID=`99cc394f1e7ddc68762107d206e1f45be5809c3a`，refs snapshot Git OID=`1906c90bbb7d3907e7a0fbb9507f1690afabd758` |
| 技术实现 | `PASS_FOR_PREVIOUS_ACCEPTED_VERSION_CANDIDACY` | `协同工作文档/ISSUE/Close_Issue/ISSUE-0020-临时CloudflareWorker反代与安全基线加固.md` 第 119–127 行；SHA-256=`F8DA9AA2930322B5391D9D62404E4FF8D09E899A3D1FD460EAA0E4E7A708874A`；其中登记 `TECH_FINAL_VERDICT=PASS`、Standards/Issue gate=`0/0/0`、登录/CSRF commit=`33314857…` |
| 独立复核 | `PASS`（仅既有关闭范围） | 同一关闭 canonical 第 121 行；同一 SHA-256。该结论不替代 V3 新分支的后续独立复核 |
| 产品验收 | `PASS`（仅 ISSUE-0020 关闭范围） | 同一关闭 canonical 第 122 行；`PRODUCT_FINAL_VERDICT=PASS`；同一 SHA-256 |
| 适用生产 | `BEHAVIORAL_PASS_WITH_PROVENANCE_DEVIATION` | 同一关闭 canonical 第 123–127、142 行：`ungradu-edu-prod-064` 双账号 `CSRF 200 → POST feedback 200 → GET feedback 200`，固定源站 403、安全头在；但 `064→33314857` 未精确证明 |
| 业务验收 | `PASS_WITH_ACCEPTED_RESIDUAL_RISKS`（仅 ISSUE-0020） | 同一关闭 canonical 第 129–145 行：业务方原文接受七项残余风险并授权关闭；R4 明确接受平台 Git provenance 缺口 |
| Issue 状态 | `ISSUE-0020 CLOSED`; `ISSUE-0034 OPEN` | `协同工作文档/ISSUE/Issue_List/ISSUE总表.md` 第 11–27、54 行；SHA-256=`447968152364B31F6597176A2B98AB516D4B10E40D75B56262D55F1E641E92E5`；`ISSUE-0034` 仍为 `open / TECH_REVIEW_PASS` |
| V3 产品/业务范围声明 | `PENDING_UPSTREAM_PRODUCT_STATEMENT` | 当前委派说明业务方已确认六份关闭文档，但仓库中的总版本索引和 0034 关闭 Spec 仍带 `DRAFT_NON_CANONICAL / USER_CONFIRMATION_PENDING` 文件头，且均为 untracked；代码 owner 不得替产品经理同步或批准。唯一下一步因此仍是产品经理声明 |

## 5. Spec、Issue 与分支契约绑定

| 文件 | SHA-256 | bytes / lines | 当前 Git 状态 | 本收据使用方式 |
| --- | --- | ---: | --- | --- |
| `规划文档/Spec文档/Release_version_Spec/2026-08-15-v3-v7-总版本索引与分支契约.md` | `516A4D05DFF64BF5B7271783138FCC6E608B9450949456177E4F383EC96EDF77` | 19147 / 274 | untracked | 绑定 base receipt 字段、候选比较、回滚与 no-carry 契约；不把 draft 自行批准为 canonical |
| `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0034-安全基线关闭-spec.md` | `86B457B178B8BFB897DA42189C310C0CD1497D8D7886E7B5278B4905BD57ACF6` | 16590 / 181 | untracked | 绑定 V3 base receipt、失败恢复与关闭边界；不把 draft 自行批准为 canonical |
| `协同工作文档/ISSUE/Issue_List/ISSUE总表.md` | `447968152364B31F6597176A2B98AB516D4B10E40D75B56262D55F1E641E92E5` | 37101 / 92 | `MM` | 绑定 Active Open=12、0020 closed、0034 open |
| `协同工作文档/ISSUE/Open_Issue/ISSUE-0034-全站安全基线与加固计划.md` | `CB2C870D7BE05E3169F6750AE26FFDFB94D3D32F7F5A4526D457B8D4C7780E07` | 66433 / 495 | untracked | 绑定 0034 历史技术/post-push 与生产仅部分通过边界 |
| `协同工作文档/ISSUE/Close_Issue/ISSUE-0020-临时CloudflareWorker反代与安全基线加固.md` | `F8DA9AA2930322B5391D9D62404E4FF8D09E899A3D1FD460EAA0E4E7A708874A` | 42201 / 252 | untracked | 绑定上一版本技术、产品、生产行为和业务关闭证据 |

上述文件是当前工作区证据快照，不等于它们已经属于 candidate tree。任何文件 hash、状态或表头变化，都必须重新出具/复核 receipt；不得把当前 untracked/dirty 文档自动带入 V3 代码分支。

## 6. Candidate tree 的 build inputs

以下均从 `33314857…:<path>` 直接读取 Git blob，而不是从当前脏工作树推断：

| 输入 | candidate Git blob | bytes |
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

本任务未运行 npm、测试或构建；这里只固定 build input 身份。运行时配置仅登记变量名与安全边界，不读取或记录任何值。Secret、Turnstile、CloudBase、Cloudflare 与生产配置不能从 candidate Git tree 或 064 行为反推。

## 7. 平台 deployment provenance 边界

- CloudBase 生产证据：`ungradu-edu-prod-064` 的行为链已通过，适用范围见关闭 canonical 第 123–126 行。
- Git 证据：branch/local/tracking/remote 均为 `33314857…`，关闭 canonical 明确将该 commit 记为登录/CSRF 修复提交。
- 精确映射：`064→33314857` 为 `UNKNOWN / NOT_PROVEN`，不是 `PASS`。行为一致只能证明相关路径生效，不能证明平台镜像精确由该 SHA 构建。
- Worker：短版本 `e72e0119` 仅证明同一 Worker 的 Secret 更新事件；不是 Git SHA，也不证明 candidate tree 中 Worker blob 与平台 deployment 的精确映射。
- 既有 `054→e81` 同样未精确证明。该偏差已作为 ISSUE-0020 R4 由业务方接受，但若 V3 或后续审计要求精确归因，必须重新取得 BuildId/commit mapping；不得沿用行为推断。
- 因此本收据只把 064 作为“适用生产行为证据”，不把它写成 Git provenance receipt。

## 8. 只读 Git / 工作树快照（写入前）

| 项目 | 快照 |
| --- | --- |
| HEAD / branch | `33314857…` / `V2-unified-navigation-responsive-profile-20260729` |
| tracking / remote | 均为 `33314857…`；ahead/behind=`0/0` |
| status records | 277 |
| tracked dirty unique | 28 |
| staged | 23；Code staged=2 |
| unstaged tracked | 18 |
| untracked | 249 |
| staged list SHA-256 | `A38B52E201B8517B96E49296784DC8BC6063981044D2070D612DF1A176BE885F` |
| Code staged list SHA-256 | `E116906AB6D095703B8DE72369189285E2148399D8D65C840EF53A779FA6A4A2` |
| cached patch Git OID | `d00aa22eb314e5c82710388d656a2250ff482ee8` |
| protected status SHA-256 | `C87CB5ABBEF72ACF68FADFE9811141517BC99448F6E20E51EACE02F21CF3815D` |
| protected worktree patch Git OID | `627ec2f249c6a0e677821fe47058e7124e8319fa` |
| protected cached patch Git OID | `8c09811f633f41ca66140bbfe80cf599ba10fd5b` |
| protected untracked manifest | 249 files；SHA-256=`07F49F95BCCFD846CD61379EC82156324A511EA9800B228B5A64EDAB31A1B39A` |

“protected” 明确排除本任务两条白名单路径；其余 staged/unstaged/untracked（包括客服/Dify、其他 Issue、角色、Spec、Issue、UI 与平台文档）全部纳入保护快照。

`Code文档/开发员工作记录.md` 的写入前分层身份：HEAD blob=`ff4b4016a3798c7ad5f3aeab0b821a372b2b00fd`；index blob=`30371dfdafcb15d08f4eb3eb3c5268b4f7cf6eb8`；cached patch OID=`b1eed3210802e7cd533fa0c634badddda795e137`；worktree SHA-256=`574661F286C4EE8BC85B801EF558BCA2CDC470652A43ED3AABA272897856DC12`，350393 bytes / 4707 lines。本任务只允许在现有 worktree 末尾追加，不改变其 index。

## 9. 脏工作树隔离与 no-carry 证明

1. candidate 是不可变 commit/tree 对：`33314857… / 4ee5996a…`。当前 23 staged、28 tracked dirty、249 untracked 均不属于该 tree。
2. 当前 index 明确不同于 HEAD；因此不得把“当前 index/worktree”称为候选，也不得在本工作树中通过普通暂存/提交方式创建 V3 根提交。
3. 后续若获分支创建授权，必须让新 ref 的起始 object 精确指向 candidate SHA，并立即核对 branch parent/tree；推荐在隔离且干净的工作树执行。不得从当前 index、worktree、untracked 打包、快照或提交。
4. V3 初始 manifest 必须证明相对 candidate `missing=0 / extra=0`，并单独证明本 receipt、Spec、Issue、角色、客服/Dify、其他 Issue、测试产物、平台配置和既有 dirty/staged 没有被带入。
5. 当前白名单写入本身也不属于 candidate tree；未经后续精确授权不得提交。

## 10. 回滚锚点、配置边界与失败恢复

- Git 结构锚点：candidate parent=`3896a1fa…`。它只证明直接父关系，不是生产已验收替代版本；不得把 parent 自动当作可部署回滚版本。
- 分支准备失败恢复：在 V3 首个实现提交前，若 ref/tree/manifest 不匹配，应放弃该分支候选并从 `33314857… / 4ee5996a…` 重新出具干净 receipt；不得 reset/clean/stash 当前受保护工作树。
- 平台安全替代：ISSUE-0020 关闭证据记录 053 回退入口、旧公共回滚域、forward recovery、监控/停止条件和 064 双账号回归构成 `SAFE_ROLLBACK_ALTERNATIVE=PASS`。旧 Secret 已 classified=`exposed`，053 不得作为常规恢复；本收据不授权任何平台回退。
- 配置边界：只绑定 candidate `.env.example` blob 和 readiness script blob；所有运行时值均为 `UNKNOWN / NOT_READ`。不得把 Secret、账号、Token、Cookie、环境变量值写入 receipt。
- 触发 `UPSTREAM_GATE_BLOCKED` 的条件：candidate SHA/ref/parent/tree 漂移；local/tracking/remote 不一致；证据文件 hash 或确认状态变化；候选不再唯一；平台 BuildId/commit 映射与现有行为证据冲突；受保护 status/index hash 漂移；V3 初始 tree 携带任一非授权路径；产品经理未给出 V3 产品/业务范围声明。
- 触发后唯一动作：停止分支创建/实现，把差异与所需最小上游证据退回项目总负责人/产品经理；不得由代码 owner 自行批准。

## 11. 未通过门禁与唯一下一步

未通过门禁：

1. 本候选尚未由产品经理声明为“上一已验收版本”的产品/业务范围根基线，状态不是 `BASE_ACCEPTED`。
2. 总版本索引与 0034 关闭 Spec 当前工作区文件头仍为 draft/pending，且不在 candidate tree；业务方确认事实尚待产品经理形成精确仓库范围声明。
3. `064→33314857`、`054→e81` 的平台 Git SHA 精确映射仍未证明；仅有行为和关闭证据，R4 风险接受不等于 provenance pass。
4. `ISSUE-0034` 仍 `open / TECH_REVIEW_PASS`；V3 尚未创建、实现、独立复核、部署、生产或业务验收。
5. 当前 23 staged、28 tracked dirty、249 untracked 的隔离门禁必须持续保持；本任务两份产物也不得自动进入后续提交。
6. `ISSUE-0031`、数据库及全部付费动作继续延期。

唯一下一步：将本 `CANDIDATE_READY` 收据交产品经理，由产品经理对 `33314857… / 4ee5996a…` 作 V3 产品/业务范围声明并同步“六份关闭文档已确认”与仓库当前 draft/pending 表头的证据关系；在该声明完成前，不进入独立复核或分支创建。

