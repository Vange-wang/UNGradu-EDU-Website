# V5 ISSUE-0036 实施准备回执

状态：`IMPLEMENTATION_PREPARATION_READY`

本回执只证明 ISSUE-0036 的隔离分支、确定性审核内核候选和本地工程基线已准备好；不等于正式实现完成、独立复核通过、提交、推送、部署、生产人工闭环、业务验收或 Issue 关闭。

## 1. 权威输入与基线回执

- 任务：`V5-ISSUE-0036-IMPLEMENTATION-PREP-20260823`
- 唯一 Issue：`ISSUE-0036`
- Spec：`规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0036-联系方式审核关闭-spec.md`
- Spec SHA-256：`F37E6AD7BB24F3C52561413B53735FA7B09F2BFFEC1CC2F111646087FF697844`
- Hermes Round 2 report SHA-256：`0ACA79D9AF9EAC9E10F6DD2F223E5E40255D5D52C8D9E1BC52AD2DB8D23427CE`
- Hermes Round 2 metadata SHA-256：`A6951EE1AD8F0657D197DB9D0F8675A22388FB74467CEAC8CFD35EDDD0E526CC`
- 文档门：`PASS_WITH_NONBLOCKING_OPEN_ISSUES`，`SERIOUS=0`
- 精确 base branch：`V4-issue-0032-email-turnstile-closure`
- 精确 base commit：`3c69840c6d1722c0438c5d9342c4d68efcecd6d0`
- base tree：`ad009f8eb7585d3bf35fdff75449825eee6a8b11`
- base parent：`bdab1d8331afd52f46fb9e71cbe43cdc8f9b8d5d`
- base subject：`Fix ISSUE-0032 CloudBase email-code atomic consume`
- base object type：`commit`
- base tracked entries：`401`

创建前只读核对确认：V4 worktree clean；local、upstream、live remote 均指向精确 base；目标分支、目标路径均不存在。基线不变量成立后执行：

```text
git worktree add -b V5-issue-0036-contact-review-closure D:\codex_project\家教对接website-v5-issue-0036-contact-review-closure 3c69840c6d1722c0438c5d9342c4d68efcecd6d0
```

命令 exit 0。目标 worktree 为 `D:\codex_project\家教对接website-v5-issue-0036-contact-review-closure`，目标分支为 `V5-issue-0036-contact-review-closure`；初始 HEAD/tree 与 base 精确一致，tracked entries `401`，status `0`，无 upstream。该隔离构造没有携入共享 V2 工作树的 staged、unstaged 或 untracked 内容。

回滚锚点固定为 base commit `3c69840c6d1722c0438c5d9342c4d68efcecd6d0`。本轮没有改写历史；后续若候选越过 Issue 范围、破坏安全契约或门禁失败，应停止交付并由总负责人决定是否放弃未提交候选，不得清理或重置共享工作树。

## 2. 范围裁决

本批只建立 ISSUE-0036 的 provider-neutral、纯本地、确定性审核准备层，不接入现有发布路由和持久状态机。原因是完整接入会同时需要持久审核状态、人工队列、申诉与审计写入、用户文案和生产人工 owner；这些门尚未获本包授权或仍受数据库延期约束。

已执行范围：

- 确定性规则优先；未知、歧义、归一化失败和策略错误全部转人工。
- AI 不参与判定；不存在 AI 单独拒绝路径。
- OCR 未启用。
- 审核结果不存在自动公开、自动发布或自动拒绝状态。
- 联系方式命中只返回信号类型和原文位置，不返回命中值。
- 审计字段只含 owner/entity/field/version/rule version、内容哈希和隔离 review key。
- 只批准 `parent_need/childIntro` 与 `tutor_profile/abilityDescription` 两个字段组合；其他字段 fail closed。

明确未执行：现有 create/update route 接线、数据库 schema/collection、人工审核队列、申诉、UI/文案、AI/provider/OCR、production key、出域、Cloudflare/CloudBase、部署、自动公开或自动发布。ISSUE-0031、支付和其他 Issue 均未带入。

## 3. 公共接缝与最小实现

新增公共接缝：`reviewContactContent(input)`，规则版本 `issue-0036-deterministic-v1`。

输出分类与状态：

- `allow_candidate` -> `pending_review`
- `input_error` -> `draft`
- `contact_confirmed`、`contact_likely`、`ambiguous`、`normalization_failure`、`policy_error` -> `needs_manual_review`

任何分支都不会返回 `published` 或 `rejected`。实现使用 NFKC 归一化并保存到原 UTF-16 范围的映射；无法安全映射或遇到不成对 surrogate 时 fail closed。手机号、混淆联系方式和长数字序列使用确定性规则分类。review key 使用包含 key 边界的长度前缀元组 SHA-256，隔离 owner、entity、field、version、content hash 和 rule version。

## 4. RED -> GREEN 证据

聚焦命令均为：

```text
node node_modules/vitest/vitest.mjs run tests/issue-0036-contact-review.test.ts --maxWorkers=1 --maxConcurrency=1 --reporter=verbose
```

逐片结果：

1. 干净内容与安全审计：RED exit 1，公共模块不存在；最小模块后 GREEN exit 0，`1/1`。
2. 全角手机号与原文 offset：RED exit 1，实际误判为 `allow_candidate/pending_review`；规则与映射后 GREEN `2/2`。
3. 混淆联系方式：RED exit 1，实际误判为 `allow_candidate/pending_review`；最小规则后 GREEN `3/3`。
4. 歧义长数字：RED exit 1，实际误判为 `allow_candidate/pending_review`；人工分流后 GREEN `4/4`。
5. 空输入：RED exit 1，实际误判为 `allow_candidate/pending_review`；可编辑 draft 后 GREEN `5/5`。
6. 未批准字段：RED exit 1，实际误判为允许且审计泄露调用方原字段；策略 fail closed 且字段归一为 `unsupported` 后 GREEN `6/6`。
7. Unicode 归一化失败和跨账号 review key 隔离是在相应实现已存在后补齐的行为回归，首次运行即为 baseline GREEN，不虚构 RED。

最终聚焦结果：`1 file / 8 passed / 0 failed`，exit 0。

## 5. 新鲜工程门禁

- 隔离依赖：使用锁定 npm CLI 运行一次 `ci --ignore-scripts --no-audit --no-fund`，exit 0，安装 `419` packages；没有 lifecycle scripts，package/lock 未改。
- 写前默认基线：`npm test` exit 0，`82/82` files，`600 passed / 1 existing skipped`。
- 受影响回归：ISSUE-0036、parent need、tutor profile 的 5 文件组合 exit 0，`5/5` files、`50/50` tests。
- `npm run typecheck`：exit 0。
- 修改后默认 `npm test`：exit 0，`83/83` files，`608 passed / 1 existing skipped`；唯一 skip 为既有显式真实 CloudBase 集成。
- `npm run lint`：exit 0，warnings 0。
- 清除当前子进程项目环境变量后的 `npm run build`：exit 0，编译成功，`17/17` static pages，45.52 秒。

package.json SHA-256 保持 `36CF12650567FB6B736653995072C431592F8C1F7559260F6D3E44047A2FAFFF`；package-lock.json SHA-256 保持 `257A945825407CCDDFCAFA18F1E2C7FAD7FB8D53F39AB99DD5E191F5DD6651BF`。

## 6. 停止条件、失败路径与残余门禁

停止条件：任何无法确定分类、无法安全归一化、未批准字段或策略异常都进入 `needs_manual_review`；本地候选不允许自动发布或自动拒绝。未来 route/state 接线若要求数据库、生产人工 owner、供应商/DPA、production key、AI 出域、OCR、自动公开、自动发布或新业务决策，必须停止并返回上游，不得在本模块中假装完成。

仍未通过的门禁：

- 现有 parent need / tutor profile 写路由与审核状态机接线。
- 持久审计、幂等、人工队列、申诉、限流和故障恢复的数据库/集成证据。
- UI 文案与用户可见流程验收。
- 独立代码复核。
- Git commit/push。
- provider/platform、部署、生产技术验证和业务验收。
- ISSUE 管理员关闭 ISSUE-0036；项目 workflow 仍为 `WORKFLOW_ACTIVE`。

## 7. 候选清单

- `Code文档/server/security/contact-content-review.ts`：确定性、无外部依赖的联系方式内容审核内核。
- `Code文档/tests/issue-0036-contact-review.test.ts`：公共接缝行为测试。
- `Code文档/docs/2026-08-23-v5-issue-0036-implementation-preparation-receipt.md`：本回执。
- `Code文档/开发员工作记录.md`：仅末尾追加本批连续性记录。

本轮除创建精确 V5 branch/worktree 外，没有 git add、commit、push、fetch、merge、rebase、reset、restore、checkout 或 clean；没有部署、平台、数据库、支付、真实 Secret/隐私数据、AI/provider/OCR 操作。

唯一下一步：返回项目总负责人冻结本准备候选并路由独立代码复核；通过后再由总负责人裁决下一批 route/state 纵向接线范围，不自行提交、推送、部署或扩展实现。

## 8. 独立复核 R1 两项 P1 返工

独立复核固定结论为 `TECH_REVIEW_REWORK_REQUIRED`；Standards P0/P1/P2=`0/0/0`，Spec P0/P1/P2=`0/2/0`。本节保留第 1–7 节原始准备证据并追加一次性 R1 返工结果，不把旧计数改写为新鲜结果。

### P1-1：长数字 fail closed

- RED：新增 10、11、12、20 位连续数字和更长分隔数字公共接缝边界。旧实现中 11、12、20 位连续数字实际返回 `allow_candidate/pending_review/signals=[]`；聚焦命令 exit 1，`3 failed / 10 passed`。
- GREEN：数字序列规则取消 10 位上界，任何至少 7 位的连续或空格/连字符分隔数字均分类为 `ambiguous/needs_manual_review`，且输出不含命中值。聚焦命令 exit 0，`13/13`。

### P1-2：输入元数据运行时 fail closed

- RED：空白 owner、空白 entity、负数/零/小数/非有限 version 共 8 个案例仍返回 `allow_candidate/pending_review` 并生成普通 review key；聚焦命令 exit 1，`8 failed / 13 passed`。
- GREEN：ownerId/entityId 必须是非空且无首尾空白的字符串，version 必须是正的 safe integer。无效输入统一为既有 `policy_error/needs_manual_review`，无效审计维度为 `null` 且 `reviewKey=null`，不会伪造可信隔离键。有效 owner、entity、version 单独变化分别生成不同 review key。聚焦命令 exit 0，`21/21`。

### R1 新鲜验证与候选清单

- 最终聚焦：`1 file / 21 tests`，exit 0。
- 受影响回归：`5/5 files / 63/63 tests`，exit 0。
- `npm run typecheck`：exit 0。
- `npm run lint`：exit 0，warnings 0。
- 无项目环境注入 `npm run build`：exit 0，`17/17` static pages。
- 默认 `npm test`：exit 0，`83/83` files，`621 passed / 1 existing skipped`。
- `git diff --check HEAD`：最终审计见本回执交付清单；package/lock 保持无差异。

R1 后候选仍精确为原四文件：审核内核、公共接缝测试、本回执和仅末尾追加的开发员工作记录。仍未接 route、数据库、人工队列、申诉、UI、AI/OCR、provider、平台或生产；不自动 published/rejected，联系方式继续默认不公开。

当前门变更为 `TARGETED_RE_REVIEW_PENDING`。唯一下一步：返回总负责人冻结 R1 四文件候选并交同一独立复核线程做 targeted re-review；复核通过前不提交、推送、部署、生产验收或关闭 ISSUE-0036。
