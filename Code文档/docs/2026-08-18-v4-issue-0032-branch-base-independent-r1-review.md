# V4 ISSUE-0032 BRANCH_BASE_RECEIPT R1 独立复审

- 任务 ID：`V4-ISSUE-0032-BASE-RECEIPT-INDEPENDENT-R1-REVIEW-20260818`
- 日期：`2026-08-18`（Asia/Shanghai）
- 执行角色：`019fefa7-d1d3-7ac3-a5ba-8b8abe299958 / 独立代码复核v2.3.2 / gpt-5.6-sol / high`
- 复审性质：targeted R1 + affected regression；先 Standards，后 Spec/Base-contract
- 输入候选：`Code文档/docs/2026-08-18-v4-issue-0032-branch-base-receipt-candidate.md`
- 候选身份：SHA-256=`FD1BC12D1C9FECB2687D3A6CCFA35B5971BFE81ED02744787CB0FF90A2929C76`；24,100 bytes / 223 lines；`CANDIDATE_READY / REWORK_R1_READY`
- 前序报告：SHA-256=`DB640B30E3CDF4016AAA1B35C25745CF910BF7E3E03C086DA8EB5D5D886356C4`；13,840 bytes / 160 lines；`TECH_REVIEW_REWORK_REQUIRED`
- Step 1 freeze：SHA-256=`AA027E3A3C78FB39DBD9689BDD8A7ACF44DEF5932270F0CD94476BAA5830E5E7`；9,611 bytes / 111 lines
- 结论：`TECH_REVIEW_PASS`
- Standards P0/P1/P2：`0/0/0`
- Spec/Base-contract P0/P1/P2：`0/0/0`

## 1. 结论与权限边界

R1 候选已关闭首轮完整 P1/P2 批次，且未引入新的 actionable P0/P1/P2。精确 base、commit object、direct manifest、patch、build inputs、证据层级、no-carry、恢复契约、Issue 状态与脏工作树保护均未漂移。

`TECH_REVIEW_PASS` 只表示该 R1 candidate 可以交项目总负责人决定是否冻结为正式 `BRANCH_BASE_RECEIPT`。本角色没有作出 `BASE_ACCEPTED`，没有授权或创建 V4 branch/worktree，没有进入 Step 3，也没有处理 provider/widget/Secret/参数、实现、npm、部署、平台、数据库、付费或 Issue 状态。

## 2. Standards findings（先冻结）

### P0

none。

### P1

none。

### P2

none。

### 首轮 Standards findings 闭环

| 首轮 finding | R1 证据 | 结论 |
| --- | --- | --- |
| P1-1 完整 tree 的直接范围交叉被遗漏 | 候选第 75–87 行新增五文件 commit-object inventory；第 137–144 行明确“服务端已有、客户端未接”、非 direct 14-file diff、非 provider/widget/参数/Secret/实现授权；第 179–185、199–221 行同步 no-carry、恢复和未通过门禁 | `CLOSED` |
| P2-1 Step 1 Hermes 行数元数据差一行 | 候选第 127–135 行登记实际 `67/16`，并明确 Step 1 的 `66/15` 是非破坏性元数据差异；保持 Step 1、Hermes report/metadata 只读 | `CLOSED` |

未发现 R1 修订引入的范围混淆、重复事实源、证据层级合并、越权结论或不可执行恢复描述。

## 3. Spec / Base-contract findings

### P0

none。

### P1

none。

### P2

none。

### 首轮 Spec/Base-contract finding 闭环

| 首轮 finding | R1 证据 | 结论 |
| --- | --- | --- |
| P1-1 No-carry 未完整披露与 V4 直接相交的既有部分实现 | 候选第 75–87 行固定合法 inherited seam；第 141–144 行限制其证明范围；第 181–185 行把 no-carry 明确定义为“不携入未授权工作区/分支内容”，不否认 base 中合法继承代码；第 203–210 行要求 clean V4 tree 保留五个继承 blob，并在实现前从 commit object 建立 RED/契约清点，能区分合法继承与未授权 carry-in | `CLOSED` |

0032 关闭 Spec 第 5.2 节要求的精确 commit/ref/parent、构建输入、验收范围、工作树状态、跨 Issue 携带边界和失败恢复均可复读；总版本索引第 4.1、5.2、8 节的串行 base、provider-neutral、no-carry 与回滚边界未被弱化。

## 4. 五文件 inherited seam 独立复算

以下 blob 均从三个 commit object 直接复算；三列一致：

| 路径 | `33314857…` | `9988a46…` | `ee41c3f…` |
| --- | --- | --- | --- |
| `Code文档/app/api/auth/email/send-code/route.ts` | `5f3f13f53f1044c0cb6c3b7584c8dc072f31842a` | 同 | 同 |
| `Code文档/server/email-auth-api.ts` | `9868056571d85326fd508be943f7c5d9f8abb0ad` | 同 | 同 |
| `Code文档/server/security/email-challenge.ts` | `b16dad7ba1deefe4c98cb5b625b81bc5a1df8cae` | 同 | 同 |
| `Code文档/features/auth/login-form.tsx` | `c84176fcab6070ec4f5a113bda5d7b92e0f5ad17` | 同 | 同 |
| `Code文档/features/auth/turnstile-widget.tsx` | `102b9bb2b63e31984e3b72c806cca8b62ef446fb` | 同 | 同 |

commit-object 行为证据：

- `app/api/auth/email/send-code/route.ts:22,28`：生产条件设置 `requireChallenge=true`，POST 调用 `POST_SEND_CODE`。
- `server/email-auth-api.ts:188-191,244-274`：校验 action 接受 `email_send_code | password_login`；send-code 在限流和邮件发送前执行 `verifyChallengeForRequest(..., "email_send_code")`。
- `server/security/email-challenge.ts:15,47-67,205-230,267-295`：包含 action/hostname/时效和持久 replay/fail-closed 边界。
- `features/auth/login-form.tsx:97-102`：邮箱验证码客户端请求只发送 email；第 363–399 行仅 password 模式渲染 `TurnstileWidget`。

因此 R1 的“服务端已有、客户端未接”描述准确。这是 inherited partial baseline，不是 candidate direct 14-file diff；不证明邮箱发送前链已完成，也不构成任何 provider/widget/参数/Secret 或实现授权。

## 5. P2 非破坏性勘误核验

- Step 1 freeze 保持 SHA-256=`AA027E3A3C78FB39DBD9689BDD8A7ACF44DEF5932270F0CD94476BAA5830E5E7`，9,611 bytes / 111 lines，未修改。
- Hermes R2 report 实际 SHA-256=`C56E4B980AAF26D4876AEA94A6C50CC4B77CB0F8AE1072DEC49FF00FFE517666`，6,781 bytes / 67 lines；`PASS_WITH_NONBLOCKING_OPEN_ISSUES`，S1/S2 closed，0 unresolved SERIOUS。
- Hermes R2 metadata 实际 SHA-256=`31CAEDFF6299901A967D7A1814E9F51C44AF6E80BA19DFEE4BCF72482353A5AC`，826 bytes / 16 lines；`deepseek-v4-pro`、exit 0、`canonical_source_unchanged=true`。
- Step 1 第 31–32 行的 `66/15` 未被改写；R1 receipt 第 135 行已准确记录差异及非破坏性边界。

## 6. 精确 base 与受影响回归

| 字段 | 独立只读结果 |
| --- | --- |
| commit / object type | `ee41c3f30770be6f7a9a0e548975464268b911d2` / `commit` |
| branch / local HEAD / local ref | `V3-issue-0034-security-baseline-closure` / candidate / candidate |
| remote-tracking / upstream | candidate / candidate |
| ahead / behind | `0 / 0` |
| parent | `9988a46a03dabe5bf8e5a2331fc951ecd16d788e` |
| tree / object type | `bc09512016e9e987f0a591096d10f6a6571eceef` / `tree` |
| tree entries | `394` |
| V3 worktree | clean；staged/unstaged/untracked=`0/0/0` |

- parent→candidate direct manifest 精确 14 项，missing/extra=`0/0`。
- shortstat=`14 files changed, 495 insertions(+), 120 deletions(-)`。
- `git diff --binary parent candidate` 的 patch OID=`769b6a40f192ab06ecccb71b3dbb3caba80fb080`。
- `33314857…→9988a46…` 为 1 commit，`9988a46…→ee41c3f…` 为 1 commit，`33314857…→ee41c3f…` 为 2 commits。
- 十个 build inputs 均直接从 `ee41c3f…:<path>` 原始 blob bytes 复算；Git blob、bytes、SHA-256 与 R1 receipt 第 89–106 行逐项一致。
- `9988a46…`、`33314857…`、DeployId/BuildId/image 与主工作树 HEAD/index/dirty/untracked 继续被正确排除，唯一合格 base 未漂移。

任务禁止网络，本轮未执行 fetch、`git ls-remote` 或任何网络操作。local remote-tracking ref 只证明本地快照；live remote=candidate 仅分层引用哈希未变的 exact-push receipt 与 post-push independent report，不冒充本轮实时远端核验。

## 7. No-carry、恢复与 provenance 边界

- candidate object 不含当前 R1 receipt、Step 1 freeze、当前 0032 Issue 或后写的 V3 production review 等工作区文件。
- 当前不存在本地或 remote-tracking `V4-*` ref；已登记 worktree 仅主工作树与 clean V3 worktree。
- direct 14-file manifest 不含 V4 provider/widget/Secret/参数变化；五个继承 blob 是 candidate 完整 tree 的合法历史内容。
- future V4 仍须从 candidate full SHA 创建隔离 clean tree；当前主工作树 staged/dirty/untracked 不得作为分支内容来源。
- 目标 ref/path 冲突、partial failure、非法 carry-in、继承 seam 被误记为完成或 provenance 冲突均有停止条件；禁止自动 reset/clean/stash。parent 只是结构父提交，不是自动可部署回滚版本。
- Deploy 066 ↔ `ee41c3f…` 仍为组合证据链，不是平台原生 Git-SHA attestation。V3 已接受 R1–R4 继续保留：认证生产矩阵不可用、日志/监控/告警 owner 限制、未执行真实反向回滚、平台无原生 Git-SHA attestation；这些均不降低 V4 证据要求。

## 8. Issue、workflow 与未通过门禁

- 项目 workflow=`WORKFLOW_ACTIVE`。
- `ISSUE-0032`=`open / USER_CONFIRMATION_PENDING`。
- `ISSUE-0042`=`open / NON_BLOCKING_DOCUMENT_REVIEW`。
- `ISSUE-0034` 仅自身 `closed / WORKFLOW_COMPLETE`。
- 未通过：formal `BRANCH_BASE_RECEIPT` 冻结决策、`BASE_ACCEPTED`、V4 branch/worktree、`V4_PARAMETER_RECEIPT`、实现、本地/独立/部署/生产/产品/业务/Issue 关闭等后续门禁。

## 9. 写入与保护声明

- 本轮唯一写入：本报告；仅追加 `Code文档/独立代码复核工作记录.md`。
- 写入前主工作树：branch=`V2-unified-navigation-responsive-profile-20260729`；HEAD=`33314857da0f2d72066443965454d23fc70a16d3`；staged=`23`；Code staged=`2`；unstaged tracked=`18`；untracked=`273`；cached patch OID=`d00aa22eb314e5c82710388d656a2250ff482ee8`。
- 写入前独立复核工作记录：SHA-256=`1080C86E5150DFFB4B2438689D4050B50330951B996532404A0E359BB5BDC3AD`，21,615 bytes / 174 lines。
- 写入后保护核验：除本报告与工作记录外的 protected status 仍为 `300` records，SHA-256=`CF3743444181D7A13B9E1DBAB685729245BCCEA2C8DF4E2AB24A901B6E87B3E4`；staged=`23`、Code staged=`2`、unstaged tracked=`18`、cached patch OID=`d00aa22eb314e5c82710388d656a2250ff482ee8` 均保持；V3 HEAD 仍为 candidate 且 status=`0`；V4 ref=`0`。工作记录原 21,615-byte 前缀 SHA-256 仍为写前完整 SHA，证明仅追加。
- 未修改 R1 candidate、首轮报告、Step 1、Spec、Hermes/metadata、Issue canonical/state/总表、代码、UI、注册文件或其他角色文件；未运行 npm/test/build；未执行 Git mutation；未联网；未创建任务/subagent。

## 10. 唯一下一步

将本 `TECH_REVIEW_PASS` 与 R1 candidate 交项目总负责人，由其在另获用户单步授权后决定是否冻结 formal `BRANCH_BASE_RECEIPT`。本角色在此停止，不自行作出 `BASE_ACCEPTED`，不创建 V4 branch/worktree，不进入 Step 3。
