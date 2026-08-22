# V4 ISSUE-0032 BRANCH_BASE_RECEIPT 候选独立复核

- 任务：`V4 ISSUE-0032 Step 2B：严格只读独立核对 base receipt`
- 日期：`2026-08-18`（Asia/Shanghai）
- 执行角色：`019fefa7-d1d3-7ac3-a5ba-8b8abe299958 / 独立代码复核v2.3.2 / gpt-5.6-sol / high`
- 输入候选：`Code文档/docs/2026-08-18-v4-issue-0032-branch-base-receipt-candidate.md`
- 候选 SHA-256：`C33C8AA5A925DA3C218E81D10042C9CB08878E7B9BD0B97C0B507C6644098D6E`
- 候选大小：`18,201 bytes / 200 lines`
- 结论：`TECH_REVIEW_REWORK_REQUIRED`
- Standards P0/P1/P2：`0/1/1`
- Spec/Base-contract P0/P1/P2：`0/1/0`

## 1. 结论与边界

精确 Git base 身份已独立确认：`ee41c3f30770be6f7a9a0e548975464268b911d2` 是当前证据链中唯一合格的上一已验收 V3 输出候选；commit、parent、tree、14 文件 direct manifest、shortstat、patch OID、构建输入、V3 clean 状态与 V3 关闭证据链一致。

本轮阻断不要求更换 base。阻断点是候选回执第 124 行对完整 tree 的继承代码描述不完整：该 tree 不仅继承密码登录 Turnstile，还已继承邮箱验证码发送 route 的生产 challenge 强制校验；同时邮箱验证码客户端模式没有提交 challenge token/widget。这是与 V4/ISSUE-0032 直接相交的“服务端已有、客户端未接”部分基线，必须在正式 `BRANCH_BASE_RECEIPT` 中显式登记，不能只概括成密码登录能力。

因此当前候选不能交总负责人冻结为正式 receipt，也不能写 `BASE_ACCEPTED`。本结论不授权创建 V4 branch/worktree、参数选择、provider/widget/Secret、实现、npm、Git mutation、部署、平台或 Issue 状态操作。

## 2. Standards findings（先冻结）

### P0

none。

### P1-1｜完整 tree 的直接范围交叉被遗漏

- 候选位置：`Code文档/docs/2026-08-18-v4-issue-0032-branch-base-receipt-candidate.md:124`。
- 候选表述把继承代码概括为“此前 ISSUE-0020 密码登录链的 Turnstile 代码”，并称其为“已存在的密码登录能力”。
- commit object 反例：
  - `Code文档/app/api/auth/email/send-code/route.ts:22`：生产条件下 `requireChallenge=true`；第 28 行调用 `POST_SEND_CODE`。
  - `Code文档/server/email-auth-api.ts:188-191`：challenge 校验接受 `email_send_code | password_login`；第 244 行为 `POST_SEND_CODE`；第 260-263 行在限流和邮件发送前调用 `verifyChallengeForRequest(..., "email_send_code")`。
  - `Code文档/features/auth/login-form.tsx:98`：验证码模式发送请求体只有 email；第 363 行开始的 password 模式才在第 395 行渲染 `TurnstileWidget`。
- 五个相关 blob 在 `33314857…`、`9988a46…`、`ee41c3f…` 三个提交中完全相同，证明它们是继承基线，不是 14 文件 direct diff；但“继承”不等于可从 receipt 的完整 tree inventory 中省略。
- 影响：下游可能把 V4 当成从“仅密码登录 Turnstile、邮箱链完全空白”开始，遗漏既有 fail-closed server seam、真实 RED 基线及 provider-neutral 清点，造成范围、测试和 no-carry 误判。
- 最小修复：只改候选 receipt 的继承基线/No-carry 描述，显式登记上述 server/client 部分状态、五个稳定 blob 关系及“这不是 provider/widget/参数授权，也不证明邮箱发送前链已完成”；不改 base、不改代码、不进入 Step 3。

### P2-1｜Step 1 冻结记录的行数元数据差一行

- `规划文档/Spec文档/Release_version_Spec/2026-08-18-v4-issue-0032-用户确认与阶段边界冻结记录.md:31-32` 分别写 `66 lines` 与 `15 lines`。
- 独立复算实际为 Hermes R2 report `6,781 bytes / 67 lines`，metadata `826 bytes / 16 lines`。
- 两文件 SHA-256、bytes、模型、exit 0 与 canonical unchanged 均正确；候选 receipt 第 112-113 行也已记录为 67/16，因此不影响字节身份或 base 唯一性。
- 最小修复：在候选 receipt 中加一条非破坏性元数据差异说明，保留 Step 1 冻结文件及其用户确认 hash 不变；不得为修正行数擅自改写已冻结记录。

## 3. Spec / Base-contract findings

### P0

none。

### P1-1｜No-carry 未完整披露与 V4 直接相交的既有部分实现

- 规范依据：0032 关闭 Spec 第 5.2 节要求 base receipt 固定精确 commit/ref/parent、构建输入、验收范围、工作树状态和跨 Issue 携带边界；总版本索引第 4.1、5.2、8 节要求完整 no-carry 和 V4 provider-neutral 边界。
- 候选 direct 14 文件确实没有新增 V4 provider/widget/Secret/参数；但完整 base tree 已含邮箱发送前 server challenge seam，且客户端验证码模式未连接 token/widget。
- 这不构成 V4 provider 选择或实现授权，也不推翻 `ee41c3f…` 的唯一 base 身份；它构成必须显式披露的 pre-existing baseline。正式 receipt 若继续只写“密码登录能力”，无法为 V4 的 RED-first 范围、删除/复用判断和恢复契约提供准确输入。
- 最小修复：在 receipt 第 8、10、12、13 节中一致补充：
  1. direct manifest 没有 V4 新变更；
  2. 完整 tree 从 `33314857…` 起已继承 email send-code server challenge；
  3. 客户端验证码模式当前未提交 challenge token/widget；
  4. V4 必须先用 commit-object 基线形成可复现 RED/契约清点，不得把继承代码当作 provider、参数或完成授权；
  5. 返工只修 receipt，不修改代码或创建 V4 分支。

### P2

none。

## 4. 精确 Git base 核验

| 字段 | 独立只读结果 |
| --- | --- |
| candidate commit | `ee41c3f30770be6f7a9a0e548975464268b911d2` |
| object type | `commit` |
| branch / local HEAD / local branch ref | `V3-issue-0034-security-baseline-closure` / candidate / candidate |
| upstream | `origin/V3-issue-0034-security-baseline-closure` → candidate |
| ahead / behind | `0 / 0` |
| parent | `9988a46a03dabe5bf8e5a2331fc951ecd16d788e` |
| tree | `bc09512016e9e987f0a591096d10f6a6571eceef` |
| tree object type | `tree` |
| subject | `fix(security): harden protected object access and server time` |
| author / author time | `Vange-wang <vangewang0919@gmail.com>` / `2026-08-17T22:25:43+08:00` |
| tracked tree entries | `394` |
| V3 status | clean；staged/unstaged/untracked=`0/0/0` |

任务明确禁止网络，本轮没有执行 `git ls-remote` 或 fetch。当前 local ref 与 remote-tracking ref 均为 candidate；实时远端只作为既有冻结证据复读：exact-push receipt 与 post-push independent report 均记录 live remote=candidate，且文件 hash 精确匹配。该边界不得写成“本轮重新联网确认 live remote”。

## 5. Direct manifest、patch 与图关系

- direct manifest：精确 14 项，和候选清单逐项一致，missing/extra=`0/0`。
- shortstat：`14 files changed, 495 insertions(+), 120 deletions(-)`。
- parent→candidate binary patch Git OID：`769b6a40f192ab06ecccb71b3dbb3caba80fb080`。
- `33314857…→9988a46…`=`1` commit；`9988a46…→ee41c3f…`=`1` commit；`33314857…→ee41c3f…`=`2` commits；两者均为 candidate 祖先。
- `9988a46…` tree=`cb6ba9a4af645002ac7005f564049532a009152c`，只含 baseline-only 输出，缺最终 14 文件安全变化。
- `33314857…` tree=`4ee5996aa9308aa4486f0453c5c397ebdd09a949`，是 V3 输入而非验收输出。
- DeployId 066、BuildId 2601797453、image tag 和主工作树 HEAD/index/dirty/untracked 均不是 Git base。

精确 base 仍唯一为 `ee41c3f30770be6f7a9a0e548975464268b911d2`；本次 rework 只阻断 receipt 冻结。

## 6. Commit-object build inputs

以下全部直接从 `ee41c3f…:<path>` 读取原始 blob bytes 复算，与候选一致：

| 路径 | Git blob | bytes | SHA-256 |
| --- | --- | ---: | --- |
| `Code文档/package.json` | `9f74f257174ad5c84d62428531c61e30e18a226d` | 1,485 | `C35DC319612D0D51E5277AE71BBFD19FDC8194FB934F3282EF97A5F959E98DC2` |
| `Code文档/package-lock.json` | `012694c0c71cab4fc9b3d74f767d1e87216cf4ee` | 272,449 | `2129045E5318EF99891B8561E49409D468B7950411B9C938EB7922C5E15A1334` |
| `Code文档/Dockerfile` | `1b81e0603eb9453226137327c23254ef39e11138` | 1,153 | `B8C85B9874A353B170DA07C653FE4C673B3C5527F7D90DB699B279C19CBE143D` |
| `Code文档/next.config.ts` | `d45b622da3152d7b9023e69d84d77dc1c5e83b8d` | 789 | `3FA753423635001805E6DDEBD7E606F8D0987A546DE2CBF7AAEAB993DFDC45C2` |
| `Code文档/tsconfig.json` | `e5ee1976f8c93c3d24fa8ed90a953542f889ba82` | 573 | `2BFBD9460855B15DFBE28E7DCD5E4AEF4572496D71BEF3C253741D0F30B34FA7` |
| `Code文档/vitest.config.ts` | `733ff595753a6b4dc5a39719d91d97557c2d5d76` | 343 | `7A5D78E1C3BA31B580207D1F71771327458AB324FE2F03D921BBEF4D070C9497` |
| `Code文档/.env.example` | `c4d787d8acbb73babca021db3d58c3b917cd1939` | 4,064 | `0EA924E5EE45D855D3F76306C1C07D2F47BBE1159C44B4E16C33EE303D60511B` |
| `Code文档/cloudflare/worker.js` | `3865a03b2ff38494c02ad60ec3816cdfd8dbfb87` | 4,490 | `D9749F2F27492BD87BAE58F9ECC231639CD7ED9730878F08A15B27C7C8CDABC9` |
| `Code文档/cloudflare/worker.ts` | `2139828b5ae6b6767ab9cf3de95d3a2db465f17b` | 4,566 | `63A77C78F63D8DE4F989B2CAC11A4DBD9D994CDC084CEA4F7F8EFA2E70F51EF2` |
| `Code文档/scripts/production-readiness-check.mjs` | `937448776addc758060ed25f07959e11e6c1cd41` | 6,587 | `2DB0C1CBF0FABA4C43C9565B78F13ABD8B5B2C42AB0A5A777CA11E6093666D2C` |

## 7. 证据链与 provenance 边界

- V4 Step 1 freeze：SHA-256=`AA027E3A3C78FB39DBD9689BDD8A7ACF44DEF5932270F0CD94476BAA5830E5E7`，9,611 bytes / 111 lines。
- ISSUE-0032 Spec：SHA-256=`F7939E3BD8769B9BE4CB18335A71B1BC624FD32182827F099F219F8DD36B9073`，16,889 bytes / 191 lines。
- Hermes R2 report：SHA-256=`C56E4B980AAF26D4876AEA94A6C50CC4B77CB0F8AE1072DEC49FF00FFE517666`，6,781 bytes / 67 lines；verdict=`PASS_WITH_NONBLOCKING_OPEN_ISSUES`，S1/S2 closed，0 unresolved SERIOUS。
- Hermes R2 metadata：SHA-256=`31CAEDFF6299901A967D7A1814E9F51C44AF6E80BA19DFEE4BCF72482353A5AC`，826 bytes / 16 lines；`deepseek-v4-pro`、exit 0、canonical unchanged。
- 总版本索引：SHA-256=`516A4D05DFF64BF5B7271783138FCC6E608B9450949456177E4F383EC96EDF77`，19,147 bytes / 274 lines。
- ISSUE-0034 Close canonical：SHA-256=`D5AB0E7D9C166F0E640B1130A4B4A9974624C1574CFD27BE80222C7EE5222DDE`，70,942 bytes / 527 lines；状态仅自身 `closed / WORKFLOW_COMPLETE`。
- V3 push/post-push/deploy/production/product-business 的 SHA、bytes、lines 均与候选第 6 节一致；关闭链把 full SHA `ee41c3f…` 放在同一证据关系中。
- Deploy 066 ↔ `ee41c3f…` 仍是组合证据链，不是平台原生 Git SHA attestation；R1-R4 仍为 ISSUE-0034 已接受残余风险，不得降低 V4 的参数、provider、独立复核、部署或生产证据要求。

## 8. No-carry 与恢复契约

已确认：

- candidate commit object 不包含当前 V4 candidate receipt、Step 1 freeze、0032 Spec/current Issue、V3 production review 等后写工作区文档。
- 当前没有本地/remote-tracking `V4-*` ref；worktree 仅主工作树与 clean V3 worktree。本轮未创建任何 ref/worktree。
- direct 14 文件不含 V4 provider/widget/Secret/参数变化。
- 主工作树 HEAD/index/dirty/staged/untracked 与当前未跟踪文档都不是 candidate tree；future V4 必须从 full SHA 的隔离 clean worktree 创建，missing/extra=`0/0`。
- 候选第 12 节的目标 ref/path 冲突、partial failure、冻结现场、禁止自动 reset/clean/stash 和 parent 非自动部署回滚等恢复条款完整。

未通过点：完整 tree 已继承 V4 直接相交的 email send-code server challenge seam，receipt 未准确披露。No-carry 在这里应表达“没有未授权工作区/分支内容携入”，不能表达“base 中没有与 V4 相交的既有代码”。

## 9. Issue、权限与未通过门禁

- `ISSUE-0032`：`open / USER_CONFIRMATION_PENDING`。
- `ISSUE-0042`：`open / NON_BLOCKING_DOCUMENT_REVIEW`。
- `ISSUE-0034`：仅自身 `closed / WORKFLOW_COMPLETE`；项目 workflow 仍 `WORKFLOW_ACTIVE`。
- 未授权 `V4_PARAMETER_RECEIPT`、provider、widget、Secret、目标网络/DPA/成本、branch/worktree、实现、npm、测试/build、Git mutation、部署、生产或 Issue 状态操作。
- 本轮没有处理任何真实 Secret、provider 参数值或生产配置，没有联网/fetch，没有进入 Step 3。

## 10. 最小返工清单与唯一下一步

1. 原 candidate receipt owner 仅修订 receipt 的完整 tree inventory、no-carry、恢复/未通过门禁段，披露继承的 email send-code server challenge 与客户端缺口；保持 exact base、14 direct manifest、build input 和 V3 关闭链不变。
2. 在 receipt 中增加 Step 1 freeze 的 Hermes R2 行数差异说明；不改已冻结 Step 1 文件及其 hash。
3. 形成新 candidate path/hash/bytes/lines，仍只交本登记独立复核线程复审；复审前不得创建 V4 branch/worktree 或进入 Step 3。

唯一下一步：项目总负责人把本次完整 P1/P2 批次返回原 candidate receipt owner 做最小文档返工；本角色不自行修改候选、不批准 base、不创建分支。

## 11. 写入与保护声明

- 本轮唯一写入为本报告和 `Code文档/独立代码复核工作记录.md` 的末尾追加。
- 写入前主工作树：branch=`V2-unified-navigation-responsive-profile-20260729`；HEAD=`33314857da0f2d72066443965454d23fc70a16d3`；staged=`23`；Code staged=`2`；unstaged tracked=`18`；untracked=`272`；cached OID=`d00aa22eb314e5c82710388d656a2250ff482ee8`。
- 写入前独立复核工作记录 SHA-256=`6271F01310351E002E8725A3DB3E0F6AE0080BC8451DABCD3EB7B79272B52F96`，18,710 bytes / 157 lines。
- 未修改 candidate receipt、Spec、Hermes/metadata、Issue canonical/state/总表、代码、UI、角色文件、平台或生产；未运行 npm、测试/build；未执行 Git mutation；未创建任务/subagent。
