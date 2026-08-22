# V4 ISSUE-0032 BRANCH_BASE_RECEIPT 候选

## 1. 状态与授权边界

- 任务：`V4-ISSUE-0032-BRANCH-BASE-RECEIPT-CANDIDATE-20260818`
- 执行角色：`019fefa7-a3c3-7333-94d7-d61961c5ea99 / 代码开发员v2.3.2`
- 状态：`CANDIDATE_READY / REWORK_R1_READY`
- 返工依据：`Code文档/docs/2026-08-18-v4-issue-0032-branch-base-independent-review.md`，SHA-256=`DB640B30E3CDF4016AAA1B35C25745CF910BF7E3E03C086DA8EB5D5D886356C4`，13,840 bytes / 160 lines，verdict=`TECH_REVIEW_REWORK_REQUIRED`，本轮仅处理其完整 P1/P2 批次。
- 候选用途：仅供既有独立代码复核线程核对上一已验收 V3 的唯一 Git 候选，并由项目总负责人后续决定是否冻结正式 `BRANCH_BASE_RECEIPT`。
- 明确非结论：本收据不是 `BASE_ACCEPTED`，不授权创建、切换或推送 V4 分支，不授权实现、npm/test/build、provider/widget/Secret、部署、平台、数据库、付费或 Issue 状态操作。
- 当前项目 workflow：`WORKFLOW_ACTIVE`。
- `ISSUE-0034` 已为 `closed / WORKFLOW_COMPLETE`，但只代表 ISSUE-0034 自身；`ISSUE-0032` 仍为 `open / USER_CONFIRMATION_PENDING`；`ISSUE-0042` 仍为 `open / NON_BLOCKING_DOCUMENT_REVIEW`。

## 2. 唯一 Git 候选

| 字段 | 现场只读复算值 |
| --- | --- |
| candidate full SHA | `ee41c3f30770be6f7a9a0e548975464268b911d2` |
| object type | `commit` |
| branch | `V3-issue-0034-security-baseline-closure` |
| local ref | `refs/heads/V3-issue-0034-security-baseline-closure` → candidate |
| upstream ref | `refs/remotes/origin/V3-issue-0034-security-baseline-closure` → candidate |
| live remote ref | 既有 exact-push / post-push 独立证据记录为 candidate；本轮明令禁止网络，未执行 `git ls-remote` 或 fetch，不把 local remote-tracking ref 冒充实时远端 |
| ahead / behind | `0 / 0` |
| parent | `9988a46a03dabe5bf8e5a2331fc951ecd16d788e` |
| tree | `bc09512016e9e987f0a591096d10f6a6571eceef` |
| tree object type | `tree` |
| author | `Vange-wang <vangewang0919@gmail.com>` |
| author time | `2026-08-17T22:25:43+08:00` |
| committer time | `2026-08-17T22:25:43+08:00` |
| subject | `fix(security): harden protected object access and server time` |
| tracked tree entries | `394` |
| branch graph snapshot Git OID | `85729de8a68de60c3969dfe6e02f673c56746990` |
| refs snapshot Git OID | `dc65f2199518cbc3b77891adaf74228343f29d5b` |

候选不是因为它当前恰好为 HEAD、local remote-tracking ref 与其一致或存在 DeployId 066 而成立。其唯一性来自：V3 local/ref 与既有 exact-push live-remote 证据、post-push 独立复核、精确 commit archive 部署、Deploy 066 生产独立复核、产品/业务风险接受与 ISSUE-0034 Close canonical 均把该 full SHA 放在同一关闭证据链中，同时明确保留平台原生 Git SHA attestation 缺失。本轮只重新核对 local/ref、remote-tracking ref 与 ahead/behind=`0/0`，没有联网刷新实时远端状态。

## 3. 候选比较与排除

| 对比项 | 只读事实 | 排除或保留理由 |
| --- | --- | --- |
| `ee41c3f…` | V3 local/ref 与 remote-tracking ref 一致；既有 exact-push/post-push 证据记录当时 live remote 一致；V3 关闭 canonical 点名；14 文件正式安全变更、Deploy 066、生产、产品/业务与关单证据齐备 | 唯一候选；本轮未联网刷新 live remote，且仍不是已接受 base |
| `9988a46…` | candidate 直接 parent；tree=`cb6ba9a4af645002ac7005f564049532a009152c`；subject=`fix: restore deterministic V3 baseline` | 排除。它只完成 V3 baseline-only 稳定化，缺少后续 14 文件对象访问/服务端时间修复，也没有最终 Deploy 066 与业务关单链对其单独绑定 |
| `33314857…` | candidate 的祖父提交；tree=`4ee5996aa9308aa4486f0453c5c397ebdd09a949`；是 V3 创建时的已冻结起点，也是当前主工作树 HEAD | 排除。它是 V3 的输入而非已验收 V3 输出，缺少 `9988a46…` 与 `ee41c3f…` 两个后继提交 |
| DeployId / BuildId / image tag | `066` / `2601797453` / `ungradu-edu-prod-066-20260818000401` | 排除为 Git base。它们是平台对象，不是 Git commit/ref；平台未提供原生 Git SHA 字段 |
| 当前主工作树 HEAD/index/worktree | HEAD=`33314857…`，且存在受保护 staged/unstaged/untracked | 排除。主工作树不是 V3 clean tree，index/worktree/未跟踪内容不属于 candidate object |

图关系现场核对：`33314857…→9988a46…` 为 1 个提交，`9988a46…→ee41c3f…` 为 1 个提交，`33314857…→ee41c3f…` 共 2 个提交。任何省略都会丢失已验收 V3 tree 的一部分。

## 4. Candidate commit manifest

candidate 相对直接 parent 的精确 manifest 为 14 项：

1. `Code文档/server/api-utils.ts`
2. `Code文档/server/contact-exchange-api.ts`
3. `Code文档/server/contact-exchange.ts`
4. `Code文档/server/conversation-api.ts`
5. `Code文档/server/conversations.ts`
6. `Code文档/server/security/access-policy.ts`
7. `Code文档/tests/contact-exchange-api.test.ts`
8. `Code文档/tests/contact-exchange-server.test.ts`
9. `Code文档/tests/conversation-api.test.ts`
10. `Code文档/tests/conversation-server.test.ts`
11. `Code文档/tests/issue-0034-route-exports.test.ts`
12. `Code文档/tests/issue-0034-route-matrix.test.ts`
13. `Code文档/tests/issue-0034-security-rework.test.ts`
14. `Code文档/tests/m5-server-flow-and-load.test.ts`

- shortstat：`14 files changed, 495 insertions(+), 120 deletions(-)`
- parent→candidate binary patch Git OID：`769b6a40f192ab06ecccb71b3dbb3caba80fb080`
- missing/extra：`0/0`

该 14 文件是 candidate commit 的直接变化；V4 的实际 base 是完整 tree `bc095120…`，也包含 parent `9988a46…` 已验收的 baseline-only 变更。

### 4.1 完整 tree 中与 V4 相交的继承 challenge seam

完整 tree 不是“邮箱验证码人机验证完全空白”的起点。以下五个相关文件均直接从 commit object 只读核对；Git blob 在 `33314857da0f2d72066443965454d23fc70a16d3`、`9988a46a03dabe5bf8e5a2331fc951ecd16d788e`、`ee41c3f30770be6f7a9a0e548975464268b911d2` 三个提交中稳定一致，因此属于继承基线，而不是 candidate 的 14 文件 direct diff：

| 继承文件 | 三提交稳定 Git blob | commit-object 可证明状态 |
| --- | --- | --- |
| `Code文档/app/api/auth/email/send-code/route.ts` | `5f3f13f53f1044c0cb6c3b7584c8dc072f31842a` | 生产条件下设置 `requireChallenge=true`，`POST` 调用 `POST_SEND_CODE` |
| `Code文档/server/email-auth-api.ts` | `9868056571d85326fd508be943f7c5d9f8abb0ad` | challenge action 接受 `email_send_code \| password_login`；`POST_SEND_CODE` 在限流和邮件发送前调用 `verifyChallengeForRequest(..., "email_send_code")` |
| `Code文档/server/security/email-challenge.ts` | `b16dad7ba1deefe4c98cb5b625b81bc5a1df8cae` | 已有 action/hostname/时效及持久 replay 验证边界，包含 `email_send_code` action |
| `Code文档/features/auth/login-form.tsx` | `c84176fcab6070ec4f5a113bda5d7b92e0f5ad17` | 邮箱验证码模式的 send-code 请求当前只提交 `email`；密码模式才提交 `challengeToken` 并渲染 `TurnstileWidget` |
| `Code文档/features/auth/turnstile-widget.tsx` | `102b9bb2b63e31984e3b72c806cca8b62ef446fb` | 既有 widget 组件由密码登录模式使用；当前证据不证明邮箱验证码模式已接入 |

因此基线的准确口径是“服务端已有、客户端未接”的部分实现：send-code 服务端生产链会要求并验证 challenge，但邮箱验证码客户端尚未提供 token/widget。该事实既不能被省略，也不能被升级为 V4 provider/widget/参数/Secret 选择或实现授权，更不证明邮箱发送前完整链已经完成。V4 后续只有在另获授权后，才可先从上述 commit object 固定可复现 RED 与契约清点，再决定最小实现；不得把继承代码误当完成。

## 5. Candidate tree 的 build inputs

下表全部通过 `ee41c3f…:<path>` 直接读取 Git blob；SHA-256 是原始 blob bytes 的哈希，不是当前工作树文件哈希：

| 输入 | Git blob | bytes | raw blob SHA-256 |
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

历史部署回执中的 package/lock SHA 属于 archive/checkout 表示；本节专门固定原始 commit blob，因此二者不能混作同一种字节表示。它们通过 Git blob OID、394/394 path-filter normalization 和部署归档 receipt 形成关系。

## 6. 分层验收与证据映射

| 层级 | 当前可证明结论 | 精确证据 | 不能替代 |
| --- | --- | --- | --- |
| V4 Step 1 范围冻结 | `V4_STEP1_SPEC_SCOPE_CONFIRMED_AND_FROZEN` | `规划文档/Spec文档/Release_version_Spec/2026-08-18-v4-issue-0032-用户确认与阶段边界冻结记录.md`；SHA-256=`AA027E3A3C78FB39DBD9689BDD8A7ACF44DEF5932270F0CD94476BAA5830E5E7`；9,611 bytes / 111 lines | 不替代 base、分支创建、参数、实现或 provider 授权 |
| Git push | `PUSH_COMPLETE` | `Code文档/docs/2026-08-17-v3-issue-0034-exact-push-receipt.md`；SHA-256=`DE4F1680374DC0CDB885B29621A45FC7D0780B7E07884BD4292E2DD2B754279C`；3,888 bytes / 60 lines | 不替代独立复核、部署或生产 |
| post-push 独立技术 | `POST_PUSH_TECH_REVIEW_PASS`，P0/P1/P2=`0/0/0` | `Code文档/docs/2026-08-17-v3-issue-0034-post-push-independent-review.md`；SHA-256=`266B9997DA74F181D033A65E75E9161A7D2D38D25FB20E5B1AA8FB7126310A73`；7,786 bytes / 105 lines | 不替代部署、生产、产品或业务 |
| CloudBase Run 部署 | `DEPLOYMENT_RETRY_COMPLETE`；Deploy 066 normal/100% | `Code文档/docs/2026-08-17-v3-issue-0034-cloudbase-deployment-retry-receipt.md`；SHA-256=`5D65C45588DA3BCEB2C19935F8C6FDB411580B427B9011EBE17BE1FBC3253891`；7,817 bytes / 82 lines | 不替代认证生产矩阵或平台原生 Git attestation |
| 独立生产技术 | `PRODUCTION_TECH_REVIEW_PASS_WITH_ACCEPTED_EVIDENCE_LIMIT`，P0/P1/P2=`0/0/0` | `Code文档/docs/2026-08-18-v3-issue-0034-production-independent-review.md`；SHA-256=`B12849AD13B695E0003E99474EAAD81F5AD922AFB1271D4BB3F5EAE31B4840FF`；11,507 bytes / 171 lines | 不把 `AUTHENTICATED_PRODUCTION_EVIDENCE_UNAVAILABLE` 改写为认证矩阵通过 |
| 产品/业务 | `PRODUCT_BUSINESS_ACCEPTANCE_PASS_WITH_ACCEPTED_RESIDUAL_RISKS`；`UI_NA_NO_UI_SCOPE` | `规划文档/里程碑文档/2026-08-18-v3-issue-0034-产品业务最终验收.md`；SHA-256=`2FE504D6B7FAB4ACBE6860990BE5ED8D7005F02A85688DF07622A67F6114EBC5`；9,484 bytes / 96 lines | 接受风险不等于缺失证据已通过 |
| ISSUE-0034 canonical | `closed / WORKFLOW_COMPLETE`，仅 ISSUE-0034 自身 | `协同工作文档/ISSUE/Close_Issue/ISSUE-0034-全站安全基线与加固计划.md`；SHA-256=`D5AB0E7D9C166F0E640B1130A4B4A9974624C1574CFD27BE80222C7EE5222DDE`；70,942 bytes / 527 lines | 不替代项目 workflow 或 V4/ISSUE-0032 门禁 |

## 7. Spec、Issue 与串行分支契约

| 文件 | SHA-256 | bytes / lines | 绑定范围 |
| --- | --- | ---: | --- |
| `规划文档/Spec文档/Release_version_Spec/2026-08-15-v3-v7-总版本索引与分支契约.md` | `516A4D05DFF64BF5B7271783138FCC6E608B9450949456177E4F383EC96EDF77` | 19,147 / 274 | V3→V4 串行、base receipt、no-carry、回滚与分层证据契约 |
| `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0034-安全基线关闭-spec.md` | `86B457B178B8BFB897DA42189C310C0CD1497D8D7886E7B5278B4905BD57ACF6` | 16,590 / 181 | V3 唯一范围与关闭门 |
| `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0032-邮箱人机验证关闭-spec.md` | `F7939E3BD8769B9BE4CB18335A71B1BC624FD32182827F099F219F8DD36B9073` | 16,889 / 191 | V4 唯一 ISSUE-0032 provider-neutral 契约 |
| 0032 Hermes Round 2 report | `C56E4B980AAF26D4876AEA94A6C50CC4B77CB0F8AE1072DEC49FF00FFE517666` | 6,781 / 67 | `PASS_WITH_NONBLOCKING_OPEN_ISSUES`；S1/S2 closed；0 unresolved SERIOUS |
| 0032 Hermes Round 2 metadata | `31CAEDFF6299901A967D7A1814E9F51C44AF6E80BA19DFEE4BCF72482353A5AC` | 826 / 16 | `deepseek-v4-pro`、exit 0、canonical unchanged |
| `协同工作文档/ISSUE/Open_Issue/ISSUE-0032-邮箱验证码发送前人机验证服务端强制校验.md` | `801416E5AAA1B592B94BBD88217F745CED7FCECE7812256CDB962F7AF329E130` | 8,753 / 75 | `open / USER_CONFIRMATION_PENDING` |
| `协同工作文档/ISSUE/Open_Issue/ISSUE-0042-0032邮箱人机验证关闭Spec-Hermes-Round1非阻塞文档债务.md` | `627B445B2E6E873DD5A18E2978D953DE41472E202A689A9262A2FAE683D173F9` | 5,475 / 50 | `open / NON_BLOCKING_DOCUMENT_REVIEW` |
| `协同工作文档/ISSUE/Issue_List/ISSUE总表.md` | `94EA86752DE853508F82852786A14B1E013CE55503A46ACECC4170A0C6E6ACC7` | 38,276 / 98 | Active Open=11；0034 closed；0032/0042 open |

以上工作区文档通过路径/hash形成 evidence relation；它们不是 candidate tree 的隐式组成部分，不得因创建 V4 分支而被携带或提交。

非破坏性元数据勘误：Step 1 freeze 记录将 Hermes R2 report / metadata 分别写为 `66 / 15 lines`；独立复算与本 receipt 的实际结果为 `67 / 16 lines`。两文件 SHA-256、bytes、`deepseek-v4-pro`、exit 0、`canonical_source_unchanged=true` 均正确，字节身份和用户确认关系不受影响。本勘误只在 candidate receipt 披露，不修改已冻结 Step 1 文件，也不修改 Hermes report/metadata。

## 8. Provider、Turnstile、Secret、数据库与单 Issue 边界

- V4 当前唯一 Issue 是 `ISSUE-0032`；不带入 `ISSUE-0031`、数据库迁移、备份/RPO/RTO、付费采购或其他 Issue 的实现/配置。
- candidate 的 14 文件直接变化没有新增 V4 邮箱验证码 provider、widget、Secret 或平台配置。
- candidate 完整 tree 不仅继承了此前 ISSUE-0020 密码登录链的 Turnstile 代码、公开 site-key 变量名和 Secret 占位名，也继承了邮箱 send-code route 的生产 `requireChallenge`、`email_send_code` 服务端校验与持久 replay seam；与此同时，邮箱验证码客户端模式仍只提交 `email`，没有连接 challenge token/widget。它们共同构成“服务端已有、客户端未接”的继承部分基线，不是 14 文件 direct diff。
- 上述继承状态不构成 V4 provider/widget/参数/Secret 选择或实现授权，也不证明邮箱发送前链已完成；后续若获授权，必须先基于 commit object 建立可复现 RED/契约清点，再判断复用、补接或最小修复范围。
- `.env.example` 只固定变量名和占位说明；本任务没有读取或记录任何实际值。
- V4 仍须按已确认 Spec 单独冻结 `V4_PARAMETER_RECEIPT`，并对 provider-specific、widget、Secret、网络/DPA/成本、部署与生产分别取得后续单步授权。当前 candidate receipt 不打开这些门。

## 9. V3 clean worktree 快照

- worktree：`D:/codex_project/家教对接website-v3-issue-0034-security-baseline-closure`
- branch/HEAD/local/remote-tracking ref：均精确指向 candidate；ahead/behind=`0/0`。实时远端仅由既有 exact-push/post-push 证据分层支持，本轮禁止网络且未重新确认。
- status records：`0`；staged=`0`；unstaged=`0`；untracked=`0`。
- index 与 worktree 在 Git 语义下均与 tree `bc095120…` 一致。
- tracked tree entries：`394`；candidate commit manifest=`14`。
- branch graph snapshot Git OID=`85729de8a68de60c3969dfe6e02f673c56746990`；refs snapshot Git OID=`dc65f2199518cbc3b77891adaf74228343f29d5b`。

## 10. 主工作树受保护快照与 no-carry

原候选写入前现场只读快照：

| 项目 | 值 |
| --- | --- |
| worktree | `D:/codex_project/家教对接website` |
| branch / HEAD | `V2-unified-navigation-responsive-profile-20260729` / `33314857da0f2d72066443965454d23fc70a16d3` |
| status records | `299` |
| tracked dirty unique | `28` |
| staged | `23`；其中 Code staged=`2` |
| unstaged tracked | `18` |
| untracked | `271` |
| cached patch Git OID | `d00aa22eb314e5c82710388d656a2250ff482ee8` |
| staged list SHA-256 | `58B2BC555F6F839C3A1BD5D9FE8C5718F1970EEF0387FA3C5A4670D0CBADD3E7` |
| Code staged list SHA-256 | `38ECDB0D6EB91F94497291500ECB81CC1D819D5D1BEA99D3C79307FA15A26710` |
| protected status | 298 records；SHA-256=`CE2AC1CE698E04BD3C1F387A58F5075324A9F655B92B7C207CFDA9F09D6888EC`；Git OID=`3b4e67879d410cb7207746d09ed0fa619b7a8168` |
| protected unstaged patch Git OID | `8aed34512baa41c05fd7e2aa5fa501ab1b249db1` |
| protected untracked manifest | 271 files；SHA-256=`4E8B0611A1178CB8D42C54168B1B2DF85D0E8AA2286DC99268683FDB45C0B91E` |

“protected” 只排除本任务候选 receipt 与开发员工作记录；其余 staged/unstaged/untracked 均受保护。写入前工作记录 index blob=`30371dfdafcb15d08f4eb3eb3c5268b4f7cf6eb8`，worktree SHA-256=`2105B18F89C5F0E63B4198D8DC1EA1D721F04711E057ADA7495555F536133B1F`，376,775 bytes / 4,852 lines；本任务只在末尾追加，不改变 index。

R1 返工写入前补充快照：branch/HEAD 仍为上述值；staged=`23`、Code staged=`2`、unstaged tracked=`18`、untracked=`273`、cached patch OID=`d00aa22eb314e5c82710388d656a2250ff482ee8`。排除 candidate receipt 与开发员工作记录后的 protected status=`299` records，SHA-256=`5C4B588D21D81DD51AEC1452A1D3130D5BB6DEDF168E7BA3A72EE9C844893B2C`；protected unstaged patch OID=`8aed34512baa41c05fd7e2aa5fa501ab1b249db1`；protected untracked=`272`，SHA-256=`A05677B7A8EE22E078440182483F1890200B2ED15DD4C0A1380CE8B78FB935BC`。工作记录写前 SHA-256=`28F0551B42A152BC41AD7033AA267C0663C7AA8F96AC484C0B00D5C7E04D59BB`，378,948 bytes / 4,864 lines；index blob 仍为 `30371dfdafcb15d08f4eb3eb3c5268b4f7cf6eb8`。这些 R1 基线用于写后逐项比对，不改写原候选首次快照的历史事实。

No-carry 规则：

1. future V4 ref 必须直接指向 candidate commit，而不是主工作树 HEAD、index、worktree、当前未跟踪文档或部署包。
2. 初始 V4 worktree 必须 clean，相对 candidate missing/extra=`0/0`。
3. 当前 receipt、工作记录追加、工作区中的 Spec/Issue/验收文档、客服/Dify、其他 Issue 的工作区变化、测试产物、平台配置及全部既有 dirty/staged/untracked 不得进入 V4 初始 tree。
4. 当前主工作树不得通过 reset/clean/stash/checkout 或普通暂存来“准备”V4。
5. `no-carry` 的准确含义是“不携入未授权工作区/分支内容”，不是“base 中不存在与 V4 相交的既有代码”。第 4.1 节五个稳定 blob 本来就是 candidate 完整 tree 的合法继承内容，创建 clean V4 worktree 时应原样存在，但不得因此宣称邮箱验证链已完成或已获实现授权。

## 11. 平台 provenance 与已接受残余风险

- Git 侧：candidate full SHA、parent/tree、14 manifest、patch OID、local/ref 与 remote-tracking ref 已由本轮只读命令精确证明；live remote=candidate 由既有 exact-push/post-push 精确哈希证据支持，本轮未联网刷新。
- 部署侧：Deploy 066 / Build 2601797453 / image tag 与 commit archive 394/394、Code 部署输入 OID `47dcc89e06bda08c7006029d730cb0f67f410100` 的回执链一致；生产访问日志命中 version 066。
- 平台原生映射：`Deploy 066 ↔ ee41c3f… = NOT_NATIVE_ATTESTED / NOT_PROVEN_BY_PLATFORM_FIELD`。不得写成 provenance PASS。
- 已接受残余风险继续完整保留：
  - R1：`AUTHENTICATED_PRODUCTION_EVIDENCE_UNAVAILABLE`；
  - R2：应用日志样本、持续监控窗口和告警 owner 未独立证明；
  - R3：064 只是 normal/0% 回滚锚点，未执行真实反向回滚，且不得恢复 exposed Secret；
  - R4：平台无原生 Git SHA attestation。
- 产品/业务接受上述风险只允许 ISSUE-0034 自身关闭；不自动降低 V4/ISSUE-0032 的独立证据要求，也不把缺失证据改写为通过。

## 12. 未来分支创建、失败恢复与停止条件

如果未来另获分支创建授权：

1. 只能从 candidate full SHA 创建 `V4-issue-0032-email-turnstile-closure` 的隔离 worktree/ref。
2. 创建前必须再次核对 candidate local/upstream/live remote、parent/tree、manifest、证据 hash、目标 ref/path 不存在及主工作树保护快照。
3. 创建后必须核对 target ref/HEAD/tree、clean、0 staged/unstaged/untracked、相对 candidate missing/extra=`0/0`、无 upstream/未 push。
4. clean 初始 tree 应保留第 4.1 节五个继承 blob；它们的存在不是 no-carry 失败。进入任何 V4 实现前，必须另获授权并从 commit object 对 send-code 服务端 challenge 与客户端缺 token/widget 建立可复现 RED/契约清点，不得把继承 seam 当作完成。
5. 任一 ref/tree/manifest/hash 漂移、目标 ref/path 冲突、隔离树带入非授权工作区/分支内容、继承 seam 被误记为完成或平台 provenance 出现冲突时，立即返回 `UPSTREAM_GATE_BLOCKED`；不得换 base、换路径或在主工作树 switch。
6. 若创建发生部分失败，冻结现场并向总负责人报告精确 partial state 与最小解除动作；不得自动 reset/clean/stash、删除主工作树内容或改写历史。

Git rollback anchor 是 candidate 本身及直接 parent `9988a46…` 的结构关系；parent 不是自动可部署回滚版本。平台回滚锚点仍为 064 的历史 normal/0% 记录，但本收据不授权平台回滚，也不声明真实回滚已演练。

## 13. 未通过门禁与唯一下一步

未通过门禁：

1. 本候选经首轮独立复核为 `TECH_REVIEW_REWORK_REQUIRED`；本 `REWORK_R1_READY` 修订尚未由同一登记独立复核线程复审，不能写成 `BASE_ACCEPTED`。
2. 未创建 V4 branch/worktree，未验证 V4 运行基线，未冻结 `V4_PARAMETER_RECEIPT`，未授权实现。
3. `ISSUE-0032` 仍为 `open / USER_CONFIRMATION_PENDING`；provider-specific、widget、Secret、网络/DPA/成本、部署、生产、产品、业务和 Issue 管理员门均未通过。
4. `ISSUE-0042` 仍为 open/non-blocking；`ISSUE-0031`、数据库及全部付费动作继续延期。
5. Deploy 066 与 candidate 的平台原生 Git SHA attestation 仍缺失；既有 R1–R4 只被接受为 ISSUE-0034 残余风险，不是 provenance PASS。
6. 邮箱 send-code 服务端已有 challenge seam、客户端尚未接 token/widget 的继承差距只完成了 base 披露，尚未形成 V4 可复现 RED、参数 receipt、实现或任何阶段 PASS。

唯一下一步：由项目总负责人另获用户单步授权后，将本 `CANDIDATE_READY / REWORK_R1_READY` receipt 交同一登记独立代码复核线程复审；本线程不得自行派发复审、批准 base、创建 V4 分支或进入 Step 3/实现。
