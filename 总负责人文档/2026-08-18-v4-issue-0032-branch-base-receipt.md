# V4 ISSUE-0032 BRANCH_BASE_RECEIPT（2026-08-18）

## 1. 正式冻结结论

- Receipt 状态：`BRANCH_BASE_RECEIPT_FROZEN`
- Base 结论：`BASE_ACCEPTED_FOR_V4_BRANCH_ROOT`
- 冻结 owner：`01a00565-5d72-7663-991d-178c5dcfd170 / 项目总负责人v2.3.3 / gpt-5.6-sol / high`
- 冻结时间：`2026-08-18T21:09:16+08:00`
- 目标分支：`V4-issue-0032-email-turnstile-closure`
- 唯一 Issue：`ISSUE-0032`
- 适用范围：仅证明未来若另获单步授权，可从本收据固定的上一已验收 V3 commit 创建 V4 的隔离干净根分支。
- 明确非结论：本收据不表示 V4 分支已创建，不授权 Git mutation、实现、npm/test/build、provider/widget/Secret/参数、部署、平台或 Issue 状态操作，也不表示 `ISSUE-0032` 已关闭或项目 workflow 完成。

本收据是对已审候选与独立技术结论的门禁冻结，不新增产品规则、Spec 范围或实现设计，因此不启动新的 Hermes 文档审查轮次。

## 2. 精确 Git 基线

| 字段 | 冻结值 |
| --- | --- |
| base commit | `ee41c3f30770be6f7a9a0e548975464268b911d2` |
| object type | `commit` |
| tree | `bc09512016e9e987f0a591096d10f6a6571eceef` |
| tree object type | `tree` |
| parent | `9988a46a03dabe5bf8e5a2331fc951ecd16d788e` |
| source branch | `V3-issue-0034-security-baseline-closure` |
| source local ref | `refs/heads/V3-issue-0034-security-baseline-closure` |
| source remote-tracking ref | `refs/remotes/origin/V3-issue-0034-security-baseline-closure` |
| subject | `fix(security): harden protected object access and server time` |
| author / committer time | `2026-08-17T22:25:43+08:00` |
| tracked tree entries | `394` |
| direct manifest | `14` files；missing/extra=`0/0` |
| direct shortstat | `495 insertions / 120 deletions` |
| parent→base binary patch Git OID | `769b6a40f192ab06ecccb71b3dbb3caba80fb080` |
| source worktree | clean；staged/unstaged/untracked=`0/0/0` |
| local / remote-tracking / upstream | 均指向 base；ahead/behind=`0/0` |

本轮明令禁止网络，未执行 fetch 或 `git ls-remote`。实时远端只由既有 exact-push 与 post-push 独立证据分层支持；本地 remote-tracking ref 不被冒充为本轮实时远端核验。

该 base 的接受依据不是“它是 HEAD”、部署编号或时间相关性，而是 V3 精确提交、推送、独立复核、Deploy 066、生产技术复核、产品/业务具名风险接受与 ISSUE-0034 canonical 关闭证据共同绑定同一 full SHA。`9988a46…` 仅是 baseline-only parent，`33314857…` 是 V3 输入；DeployId、BuildId、image tag 与主工作树 HEAD/index/dirty/untracked 均不是 Git base。

## 3. Owner 产物与独立门禁

| Owner / 结论 | 路径 | SHA-256 | bytes / lines |
| --- | --- | --- | ---: |
| 代码 owner / `CANDIDATE_READY / REWORK_R1_READY` | `Code文档/docs/2026-08-18-v4-issue-0032-branch-base-receipt-candidate.md` | `FD1BC12D1C9FECB2687D3A6CCFA35B5971BFE81ED02744787CB0FF90A2929C76` | 24100 / 223 |
| 独立代码复核首轮 / `TECH_REVIEW_REWORK_REQUIRED` | `Code文档/docs/2026-08-18-v4-issue-0032-branch-base-independent-review.md` | `DB640B30E3CDF4016AAA1B35C25745CF910BF7E3E03C086DA8EB5D5D886356C4` | 13840 / 160 |
| 独立代码复核 R1 / `TECH_REVIEW_PASS` | `Code文档/docs/2026-08-18-v4-issue-0032-branch-base-independent-r1-review.md` | `756027FDB465C65AA8ED41CE4EA536F4D629E1FE84AFA1B65DC3E7E60C143239` | 10400 / 143 |
| 用户确认与阶段边界冻结 | `规划文档/Spec文档/Release_version_Spec/2026-08-18-v4-issue-0032-用户确认与阶段边界冻结记录.md` | `AA027E3A3C78FB39DBD9689BDD8A7ACF44DEF5932270F0CD94476BAA5830E5E7` | 9611 / 111 |

R1 独立复审两轴结果：Standards P0/P1/P2=`0/0/0`；Spec/Base-contract P0/P1/P2=`0/0/0`。首轮 Standards P1、Standards P2 与 Spec/Base-contract P1 均为 `CLOSED`，未发现修订引入或受影响回归的新 finding。

十项 build inputs 已由代码 owner 和独立复核员直接从 `ee41c3f…:<path>` 的不可变 Git blob 复算，Git blob、bytes 与 SHA-256 一致；具体清单以候选和 R1 独立复审的上述精确字节版本为本收据附件关系，不从当前主工作树文件推断。

## 4. V3 关闭与 V4 规范绑定

| 证据 | SHA-256 | 结论 |
| --- | --- | --- |
| `规划文档/Spec文档/Release_version_Spec/2026-08-15-v3-v7-总版本索引与分支契约.md` | `516A4D05DFF64BF5B7271783138FCC6E608B9450949456177E4F383EC96EDF77` | V3→V4 串行、单 Issue 单分支、base/no-carry/回滚与分层取证契约 |
| `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0032-邮箱人机验证关闭-spec.md` | `F7939E3BD8769B9BE4CB18335A71B1BC624FD32182827F099F219F8DD36B9073` | V4 唯一 ISSUE-0032 provider-neutral 关闭契约 |
| `协同工作文档/ISSUE/Close_Issue/ISSUE-0034-全站安全基线与加固计划.md` | `D5AB0E7D9C166F0E640B1130A4B4A9974624C1574CFD27BE80222C7EE5222DDE` | `ISSUE-0034 closed / WORKFLOW_COMPLETE`，仅自身 |
| V3 exact-push receipt | `DE4F1680374DC0CDB885B29621A45FC7D0780B7E07884BD4292E2DD2B754279C` | 精确推送证据 |
| V3 post-push independent review | `266B9997DA74F181D033A65E75E9161A7D2D38D25FB20E5B1AA8FB7126310A73` | `POST_PUSH_TECH_REVIEW_PASS` |
| Deploy 066 receipt | `5D65C45588DA3BCEB2C19935F8C6FDB411580B427B9011EBE17BE1FBC3253891` | `normal / 100%` 的组合部署证据 |
| V3 production independent review | `B12849AD13B695E0003E99474EAAD81F5AD922AFB1271D4BB3F5EAE31B4840FF` | `PRODUCTION_TECH_REVIEW_PASS_WITH_ACCEPTED_EVIDENCE_LIMIT` |
| V3 product/business acceptance | `2FE504D6B7FAB4ACBE6860990BE5ED8D7005F02A85688DF07622A67F6114EBC5` | `PRODUCT_BUSINESS_ACCEPTANCE_PASS_WITH_ACCEPTED_RESIDUAL_RISKS` |

Step 1 冻结记录中的 Hermes R2 report/metadata 行数写为 `66/15`，独立复算实际为 `67/16`；对应 SHA-256、bytes、`deepseek-v4-pro`、exit 0 和 `canonical_source_unchanged=true` 均正确。该差异只作为非破坏性元数据勘误保留，不改写 Step 1、Hermes report 或 metadata。

## 5. 合法继承 seam 与 no-carry

base 完整 tree 合法继承以下五个在 `33314857… / 9988a46… / ee41c3f…` 三提交间稳定的 blob：

1. `app/api/auth/email/send-code/route.ts`；
2. `server/email-auth-api.ts`；
3. `server/security/email-challenge.ts`；
4. `features/auth/login-form.tsx`；
5. `features/auth/turnstile-widget.tsx`。

它们形成“服务端已有、客户端未接”的 inherited partial baseline：邮箱 send-code 服务端生产链已有 challenge/`email_send_code` 校验，邮箱验证码客户端仍未提交 token 或连接 widget；既有 widget 当前由密码模式使用。该状态不是 base 的 14 文件 direct diff，不构成 V4 provider/widget/参数/Secret 或实现授权，也不证明邮箱发送前链已完成。

`no-carry` 的准确含义是 future V4 初始 tree 不携入当前主工作树、其他分支或其他 Issue 的未授权 staged/dirty/untracked 内容；它不否认上述五个 blob 是 base 完整 tree 的合法继承内容。后续实现若另获授权，必须先从 commit object 固定可复现 RED/契约清点，不得把继承 seam 冒充完成。

## 6. 工作树保护、provenance 与失败恢复

- 正式冻结前主工作树：branch=`V2-unified-navigation-responsive-profile-20260729`；HEAD=`33314857da0f2d72066443965454d23fc70a16d3`；staged=`23`；Code staged=`2`；unstaged tracked=`18`；untracked=`274`；cached patch Git OID=`d00aa22eb314e5c82710388d656a2250ff482ee8`。
- 正式冻结前不存在任何 local/remote-tracking `V4-*` ref；已登记 worktree 仅主工作树与 clean V3 worktree。
- future V4 必须在另获授权后，从 full SHA `ee41c3f…` 创建隔离 clean worktree/ref，初始 tree 必须为 `bc095120…`，相对 base missing/extra=`0/0`，且不得在主工作树 switch、reset、clean、stash 或普通暂存来制造根分支。
- 目标 ref/path 冲突、tree/manifest/hash 漂移、非法 carry-in、继承 seam 被误记为完成或 provenance 冲突时必须停止，冻结 partial state 并报告最小恢复动作。
- `Deploy 066 ↔ ee41c3f…` 仍是组合证据链，不是平台原生 Git SHA attestation。V3 已接受的 R1 认证生产矩阵不可用、R2 日志/监控/告警 owner 限制、R3 未执行真实反向回滚、R4 平台无原生 Git SHA attestation继续保留，不降低 V4 的独立证据要求。
- `9988a46…` 仅是结构 parent，不是自动可部署回滚版本；平台 064 只是历史 normal/0% 回滚锚点，本收据不授权真实回滚。

## 7. 当前 workflow 与未通过门禁

- 项目 workflow=`WORKFLOW_ACTIVE`。
- `ISSUE-0032` 仍为 `open / USER_CONFIRMATION_PENDING`。
- `ISSUE-0042` 仍为 `open / NON_BLOCKING_DOCUMENT_REVIEW`。
- Active Open 为 `ISSUE-0031/0032/0035/0036/0038/0040/0041/0042/0043/0044/0045`。
- `ISSUE-0031`、数据库和全部付费动作继续延期。
- `BRANCH_BASE_RECEIPT` 已冻结；V4 branch/worktree 尚未创建。
- 未通过：V4 分支创建、`V4_PARAMETER_RECEIPT`、可复现 RED/契约清点、实现、本地验证、独立技术复核、适用 provider/部署/生产证据、产品/业务验收与 Issue 管理员 canonical 关单。
- 分支完成不自动等于 `ISSUE-0032` 关闭；本收据也不替代任何后续门禁。

## 8. 唯一下一步

由业务方另行单步授权现有代码 owner 在隔离干净工作树中，从本收据固定的 `ee41c3f30770be6f7a9a0e548975464268b911d2` 创建唯一分支 `V4-issue-0032-email-turnstile-closure`，只核对 ref/HEAD/tree/clean/missing-extra 与主工作树保护，不进入实现。

在该授权前，不执行任何 Git mutation，不创建 V4 branch/worktree，不运行 npm，不处理 provider/widget/Secret/参数，不进入实现或部署。

