# V4 ISSUE-0032 隔离分支与 worktree 创建回执

## 1. 状态与边界

- 任务 ID：`V4-ISSUE-0032-CREATE-ISOLATED-BRANCH-WORKTREE-20260818`
- 执行角色：`019fefa7-a3c3-7333-94d7-d61961c5ea99 / 代码开发员v2.3.2`
- 状态：`BRANCH_WORKTREE_CREATED_AND_BASELINE_CLEAN`
- 本状态仅证明 V4 根分支已从正式 base 创建，且初始 tree clean/no-carry；不表示实现、测试、`TECH_REVIEW_PASS`、push、部署、生产或 `ISSUE-0032` 关闭。
- 本轮未进入实现，未运行 npm/test/build，未联网，未设置 upstream，未 push。

## 2. 冻结输入

| 输入 | 新鲜核对结果 |
| --- | --- |
| formal receipt | `总负责人文档/2026-08-18-v4-issue-0032-branch-base-receipt.md`；SHA-256=`6818C2A66FFA1878D39CC1C7C03ECC4A02F2A4DC57FF2C758C15697D7B12EDF6`；9,754 bytes / 108 lines；`BRANCH_BASE_RECEIPT_FROZEN / BASE_ACCEPTED_FOR_V4_BRANCH_ROOT` |
| R1 candidate | `Code文档/docs/2026-08-18-v4-issue-0032-branch-base-receipt-candidate.md`；SHA-256=`FD1BC12D1C9FECB2687D3A6CCFA35B5971BFE81ED02744787CB0FF90A2929C76`；24,100 bytes / 223 lines |
| R1 independent review | `Code文档/docs/2026-08-18-v4-issue-0032-branch-base-independent-r1-review.md`；SHA-256=`756027FDB465C65AA8ED41CE4EA536F4D629E1FE84AFA1B65DC3E7E60C143239`；10,400 bytes / 143 lines；`TECH_REVIEW_PASS`，双轴 P0/P1/P2=`0/0/0` |
| exact base | `ee41c3f30770be6f7a9a0e548975464268b911d2` / object type=`commit` |
| base tree / parent | `bc09512016e9e987f0a591096d10f6a6571eceef` / `9988a46a03dabe5bf8e5a2331fc951ecd16d788e` |
| direct change | 14 files；`495 insertions / 120 deletions`；patch OID=`769b6a40f192ab06ecccb71b3dbb3caba80fb080` |
| target branch | `V4-issue-0032-email-turnstile-closure` |
| target worktree | `D:/codex_project/家教对接website-v4-issue-0032-email-turnstile-closure` |

本轮禁止网络，没有 fetch 或 `git ls-remote`。实时远端只引用既有 exact-push/post-push 分层证据；本地 remote-tracking ref 不冒充实时远端。

## 3. 创建前硬门

- 主目录经 `git rev-parse --git-dir/--git-common-dir/--show-superproject-working-tree` 核对为普通 checkout，不是 submodule 或 linked worktree。
- target path 不存在；local target ref 不存在；`origin/<target>` remote-tracking ref 不存在；`git worktree list --porcelain` 不含 target。
- 创建前已登记 worktree 仅主工作树与 clean V3 worktree。
- V3 branch/HEAD=`V3-issue-0034-security-baseline-closure / ee41c3f…`，tree/parent、14 manifest、495/120、patch OID 均与 formal receipt 一致；status/staged/unstaged/untracked=`0/0/0/0`。
- 创建前主工作树：branch=`V2-unified-navigation-responsive-profile-20260729`；HEAD=`33314857da0f2d72066443965454d23fc70a16d3`；staged=`23`；Code staged=`2`；unstaged tracked=`18`；untracked=`275`；cached patch OID=`d00aa22eb314e5c82710388d656a2250ff482ee8`。
- 创建前工作记录 SHA-256=`63D9AED0E0F5E446EE07D27AED6ED9C38DE32F81108078928954B46354EDDD8B`，381,065 bytes / 4,876 lines；index blob=`30371dfdafcb15d08f4eb3eb3c5268b4f7cf6eb8`。

## 4. 唯一 Git mutation

```text
git worktree add -b V4-issue-0032-email-turnstile-closure "D:/codex_project/家教对接website-v4-issue-0032-email-turnstile-closure" ee41c3f30770be6f7a9a0e548975464268b911d2
```

- exit code：`0`
- Git 输出：创建新分支 `V4-issue-0032-email-turnstile-closure`，目标 worktree HEAD=`ee41c3f3 fix(security): harden protected object access and server time`。
- 除该 `git worktree add -b` 外，未执行 checkout/switch/reset/clean/stash/add/commit/push/fetch 或其他 Git mutation。

## 5. 创建后 branch/worktree 基线

| 字段 | 核对结果 |
| --- | --- |
| absolute top/path | `D:/codex_project/家教对接website-v4-issue-0032-email-turnstile-closure`，与授权路径精确一致 |
| branch | `V4-issue-0032-email-turnstile-closure` |
| local ref / HEAD | 均为 `ee41c3f30770be6f7a9a0e548975464268b911d2` |
| tree | `bc09512016e9e987f0a591096d10f6a6571eceef` |
| parent | `9988a46a03dabe5bf8e5a2331fc951ecd16d788e` |
| status / staged / unstaged / untracked | `0 / 0 / 0 / 0` |
| tracked / base tree entries | `394 / 394` |
| relative to base | missing/extra=`0/0`；diff count=`0` |
| upstream | 未配置；branch merge/remote config 均不存在 |
| target remote-tracking ref | 不存在；未 push |

`git worktree list --porcelain` 现在精确登记主工作树、V3 worktree 与该 V4 worktree；V4 branch/ref 只存在于本地 common repository。

## 6. No-carry 与合法 inherited seam

- 新 worktree 的 tracked manifest 与 base tree 一一对应，missing/extra=`0/0`；status/staged/unstaged/untracked 均为 0。
- 当前 candidate/R1 review/branch-creation receipt、formal receipt、Step 1 freeze 及主工作树其他 dirty/staged/untracked 文档均未进入 V4 初始 tree。
- no-carry 表示没有未授权工作区/分支内容携入，不表示 base 中没有与 V4 相交的既有代码。
- 以下五个 inherited seam blob 原样保留，是合法 base 内容，不等于实现完成：
  - send-code route：`5f3f13f53f1044c0cb6c3b7584c8dc072f31842a`
  - email-auth API：`9868056571d85326fd508be943f7c5d9f8abb0ad`
  - email challenge verifier：`b16dad7ba1deefe4c98cb5b625b81bc5a1df8cae`
  - login form：`c84176fcab6070ec4f5a113bda5d7b92e0f5ad17`
  - Turnstile widget：`102b9bb2b63e31984e3b72c806cca8b62ef446fb`
- 当前仍是“服务端已有、客户端未接”的 inherited partial baseline；未建立 V4 RED/契约清点，也未获得 provider/widget/参数/Secret 或实现授权。

## 7. 原工作树保护

- V3 worktree 创建后仍为 branch/HEAD=`V3-issue-0034-security-baseline-closure / ee41c3f…`，tree=`bc095120…`，status/staged/unstaged/untracked=`0/0/0/0`。
- 主工作树在 worktree mutation 后仍为 branch/HEAD=`V2-unified-navigation-responsive-profile-20260729 / 33314857…`；staged=`23`、Code staged=`2`、unstaged=`18`、untracked=`275`、cached OID=`d00aa22eb314e5c82710388d656a2250ff482ee8`。
- staged list SHA-256=`58B2BC555F6F839C3A1BD5D9FE8C5718F1970EEF0387FA3C5A4670D0CBADD3E7`；Code staged list SHA-256=`38ECDB0D6EB91F94497291500ECB81CC1D819D5D1BEA99D3C79307FA15A26710`。
- 排除本任务新回执与开发员工作记录后的 protected status=`302` records，SHA-256=`0DCA18E466BDC93363CBB3B30765BDF730E339C887B3EC9081B20F7BB3CDEC4D`；protected unstaged patch OID=`a6fb5036bc97ab0631343649bf303b0de67dfce5`；protected untracked=`275`，SHA-256=`36FB35907A528F52473365C0DB9DD9BF5ED899B1B66877BE3ADC70233118A606`。
- 工作记录 index blob 保持 `30371dfdafcb15d08f4eb3eb3c5268b4f7cf6eb8`；本任务只在其写前 381,065-byte 内容后追加。

## 8. 未执行项、workflow 与唯一下一步

- 未运行 npm、测试、typecheck、lint 或 build；本轮仅验证结构性 clean baseline，因此不能写测试通过。
- 未修改代码、Spec、Issue canonical/state/总表、UI、中央或角色注册文件。
- 未处理 provider/widget/Secret/参数值、平台、部署、数据库或付费；未创建任务/subagent，未派发独立复核。
- 项目 workflow=`WORKFLOW_ACTIVE`；`ISSUE-0032=open / USER_CONFIRMATION_PENDING`；`ISSUE-0042=open / NON_BLOCKING_DOCUMENT_REVIEW`。
- 未通过门禁：运行基线、`V4_PARAMETER_RECEIPT`、可复现 RED/契约清点、实现、本地/独立技术复核、push、适用 provider/部署/生产、产品/业务和 Issue 管理员 canonical 关闭。

唯一下一步：停止并返回项目总负责人验收本创建回执；后续任何运行基线或实现动作必须等待新的用户单步授权，本线程不自行进入实现或派发独立复核。
