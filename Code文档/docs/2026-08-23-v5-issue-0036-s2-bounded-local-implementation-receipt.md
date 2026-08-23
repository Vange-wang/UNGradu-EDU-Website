# V5 ISSUE-0036 S2 bounded 本地实现回执

## 1. 状态与固定点

- 任务：`V5-ISSUE-0036-S2-BOUNDED-IMPLEMENTATION-20260823`
- 状态：`S2_IMPLEMENTATION_READY_FOR_REVIEW`
- workflow：`WORKFLOW_ACTIVE`
- ISSUE-0036：仍为 Open；本地 S2 不等于独立复核、提交、推送、生产或关单。
- 分支：`V5-issue-0036-contact-review-closure`
- 写前 HEAD：`d886230ee69777376b290931bd8cd2c5501854c0`
- 写前 tree：`c937033fa917f6b7d5e64870c4e38107c4ec8358`
- Spec SHA-256：`F37E6AD7BB24F3C52561413B53735FA7B09F2BFFEC1CC2F111646087FF697844`
- canonical SHA-256：`1696FFBAF33E61F68A915F7D2580A07B4D4122E3194EF9B61ABDFCF27FA62804`

## 2. 实现边界

本批只实现 local/integration/synthetic 合同：

1. 七状态纯 reducer：`draft`、`pending_review`、`needs_manual_review`、`published`、`rejected`、`appeal_pending`、`deleted`。
2. owner-neutral 内存队列：未分配入队、仅 authorized synthetic reviewer fixture 领取、不同 fixture 二审占位、超时和故障注入。
3. 内存持久化合同：owner/entity/field/version/content hash/rule version/result/operator/time/idempotency key 的最小审计；同一 review chain 内幂等；版本或内容变化使用不同 review key 形成独立链。
4. 原子 fail-closed：持久化提交故障不改变状态、不写审计、不占用幂等键；队列故障不产生部分领取或超时状态。

未接真实 parent/tutor 写路由、生产状态机、CloudBase collection/schema/TTL、真实人工 owner/备援/二审/SLA、UI、AI/OCR/provider、出域、平台、数据库、付费或部署。规则和 AI 均不能直接产生 `published` 或 `rejected`；只有获授权的 synthetic reviewer fixture 可在本地测试中模拟决定。

## 3. 状态合同

- `draft -> pending_review`：仅已授权内容 owner 提交。
- 不确定、规范化/策略/队列故障或超时：`pending_review -> needs_manual_review`。
- `pending_review` 或 `needs_manual_review` 仅可由已授权 synthetic reviewer fixture 转为 `published` 或 `rejected`。
- 未编辑申诉：`rejected -> appeal_pending -> needs_manual_review -> published/rejected`。
- 编辑后申诉：`rejected -> draft -> pending_review`。
- 删除：非 deleted 状态可进入 `deleted`；恢复只能 `deleted -> pending_review`，禁止直达 published。
- 其余跳转返回 `invalid_transition`；未授权操作者返回 `unauthorized_operator`，状态保持原值。

## 4. RED -> GREEN

所有聚焦命令均使用 Vitest 单 worker、单并发和 verbose reporter。

### 4.1 七状态 reducer

1. 初始 RED：公共模块不存在，exit 1；最小 submit/manual reducer 后 GREEN `1/1`。
2. reviewer 决定 RED：authorized synthetic reviewer 实际得到 `invalid_transition`，exit 1；最小权限分支后 GREEN `2/2`。
3. 申诉、删除、恢复 RED：`rejected -> appeal_pending` 实际为 `invalid_transition`，exit 1；补齐冻结路径后 GREEN `4/4`。
4. 不确定/故障原因矩阵在 reducer 已支持后首次为 baseline GREEN；最终 workflow `5/5`。

### 4.2 synthetic queue

1. 初始 RED：公共队列模块不存在，exit 1；入队和领取后 GREEN `1/1`。
2. 二审 RED：`requestSecondReview` 不存在，exit 1；二审保持 unassigned 且要求不同 reviewer 后 GREEN `2/2`。
3. 故障/超时 RED：`failNext` 不存在，exit 1；故障零部分写入与超时状态后 GREEN `3/3`。
4. fail-closed 返回 RED：expire 故障错误返回空数组而非明确 unavailable，exit 1；改为结构化 `queue_unavailable` 后 GREEN `3/3`。
5. S1 分类元数据进入人工队列为首次 baseline GREEN；测试证明原文和连续数字样例不进入 queue snapshot。最终 queue `4/4`。

### 4.3 审计、幂等与内存持久化

1. 初始 RED：公共持久化模块不存在，exit 1；单次转移与重复请求幂等后 GREEN `1/1`。
2. 跨版本/内容新链、原子提交故障、删除恢复审计在公共实现已具备后首次均为 baseline GREEN，不虚构 RED。最终 persistence `4/4`。

三份 S2 聚焦合并：`3/3 files`、`13/13 tests`、exit 0。

## 5. 新鲜验证

- 受影响回归：ISSUE-0036 S1/S2、parent need、tutor profile 共 `8/8 files`、`76/76 tests`、exit 0。
- 默认 `npm test`：最终新鲜运行 `86/86 files`，`634 passed / 1 existing skipped`，exit 0；唯一 skip 为既有显式真实 CloudBase 集成测试，本批禁止运行真实集成。
- 全量稳定性证据：同一最终源码的前一次默认全量曾因既有 `ui-preview-confirmed-actual-browser.test.ts` 的 `beforeAll` 在 120 秒超时而 exit 1（`85 passed / 1 failed` files）；该文件随后单独串行 `7/7`、exit 0，诊断后默认全量再次 `86/86`、exit 0。候选未修改该 UI/browser 文件或 Vitest 调度；保留该跨套件 Next/browser 启动竞争残余风险，不把 isolated GREEN 冒充首次 full GREEN。
- `npm run typecheck`：exit 0。
- `npm run lint`：exit 0，warnings 0。
- 清除子进程项目环境变量后的 `npm run build`：exit 0，编译成功，`17/17` static pages。
- `git diff --check`：exit 0。
- 未执行 `npm install`、`npm ci` 或依赖修改。

## 6. 精确实现文件

| 路径 | SHA-256 | bytes | lines | 必要性 |
| --- | --- | ---: | ---: | --- |
| `Code文档/server/security/contact-review-workflow.ts` | `2D2F378FAA8BC18609BF886A404374DA934C23FC1842C0C36512477535059B22` | 3630 | 110 | 七状态与权限纯 reducer |
| `Code文档/server/security/contact-review-queue.ts` | `4BBFDCD1096D115843050DCD8E5ABFE6391852979FBB5BEC4672424C8856B98F` | 7157 | 227 | synthetic queue、二审、超时与故障合同 |
| `Code文档/server/security/contact-review-persistence.ts` | `F3C0A0C6F3A6A731DFCA528B083778421EF520B98BFCA7A8C0D986BE59C43FB8` | 4288 | 133 | 最小审计、幂等和原子内存 adapter |
| `Code文档/tests/issue-0036-contact-review-workflow.test.ts` | `945662662DBB84E320375AF2C5E89F9DC07D4D4126343B37F000D3A3D00E3D01` | 6357 | 198 | 状态正负矩阵、申诉、删除恢复和故障原因 |
| `Code文档/tests/issue-0036-contact-review-queue.test.ts` | `792DFACF3244B14820724AB0DF295F8D07B9E5B66F8BAC6954FF410435DB3E77` | 6158 | 182 | 入队/领取/二审/超时/故障与 S1 集成 |
| `Code文档/tests/issue-0036-contact-review-persistence.test.ts` | `DC1E5BE80E85A9867D6BB6E23B26641A9BF80C50ED3BB0B9C04B710EF63116BB` | 5701 | 168 | 幂等、隔离、原子失败和最小审计 |

另新增本回执，并仅在既有开发员工作记录末尾追加本批证据；两者不扩大业务实现。

## 7. 数据、隐私与安全

- queue 和 audit 仅持有隔离元数据与哈希；不保存原始正文、命中片段、完整联系方式、未成年人正文、prompt、Secret 或 token。
- 测试只使用明确 synthetic owner/entity/reviewer 和合成文本；真实 PII、生产数据、真实账号与凭据为 0。
- 二审仅为 synthetic fixture separation placeholder，不暗示生产 owner、权限、排班或 SLA 已确定。
- 持久化为内存 adapter；不创建、查询或修改 CloudBase collection、schema、TTL 或真实记录。
- 删除后恢复只能回 `pending_review`；旧任务不能直达 published。

## 8. 未通过门禁与唯一下一步

仍未通过：独立技术/产品复核、Git commit/push、真实 route/state 接线、生产人工 owner/备援/二审/SLA、生产 persistence/retention、申诉 UI 决策、部署、生产观察、业务验收及 ISSUE-0036 close。

唯一下一步：返回项目总负责人冻结 S2 候选，并路由既有独立代码复核线程；不得自行提交、推送、部署或进入生产。

## 9. 独立复核 targeted rework R1

独立复核结论为 `TECH_REVIEW_REWORK_REQUIRED`，双轴合计 P0/P1/P2=`0/2/0`。本节只修复该完整 P1 批次，原 S2 证据保留不覆盖。

### 9.1 P1-1：幂等键跨 review chain 泄漏

- 旧行为：`contact-review-queue.ts` 原 enqueue 分支只以全局 idempotency key 查到旧 review key，随后不比较新请求的 review key 或 immutable payload，直接重放旧任务。
- RED：新增 public queue seam 负例后，跨同 chain 内容变化以及跨 owner/entity/version/content/review chain 复用同一命令键均实际返回 `ok=true/replayed=true`；聚焦 exit 1。
- GREEN：当前 `contact-review-queue.ts:63-75,95-111` 先要求 idempotency binding 的 review key 一致，再逐项比较 owner/entity/type/field/version/content hash/rule version/workflow state。仅同 chain 同 payload 可 replay；任何边界冲突返回 `idempotency_conflict`。
- 零副作用：每个负例均断言 queue 仍精确只有原始 unassigned task；原请求仍可 replay，冲突未污染既有 binding。

### 9.2 P1-2：owner 授权未在持久化边界绑定

- 旧行为：`contact-review-persistence.ts` 原 applyTransition 在读取 chain 后直接调用 reducer；`authorized=true` 的 owner B 可删除、申诉或恢复 owner A 的 chain。
- RED：跨 owner 的 delete 实际返回成功并把 owner A 状态推进到 deleted；聚焦 exit 1。
- GREEN：当前 `contact-review-persistence.ts:80-90` 在读取 chain 后、幂等 replay 与 reducer 前校验 content_owner 的 operator id 必须等于 current owner id；不匹配返回 `owner_mismatch`。synthetic reviewer、deterministic rule 和 workflow system 仍沿既有受控职责运行，不被伪装成 owner。
- 零副作用：delete、未编辑申诉、deleted restore 三条负例均断言状态不变、audit 为空；随后合法 owner 使用同一 idempotency key 成功，证明拒绝未占用幂等键。

### 9.3 R1 新鲜验证

- 两份修复测试 RED：`2 files`、`2 failed / 8 passed`，exit 1，失败值分别是错误 replay 与跨 owner 成功删除。
- queue GREEN：`1 file / 5 passed`，exit 0。
- persistence GREEN：`1 file / 5 passed`，exit 0。
- S2 聚焦：`3/3 files`、`15/15 tests`，exit 0。
- 受影响回归：`8/8 files`、`78/78 tests`，exit 0。
- 默认 `npm test`：`86/86 files`、`636 passed / 1 existing skipped`，exit 0。
- `npm run typecheck`、`npm run lint`：exit 0。
- 清除子进程项目环境变量后的 `npm run build`：exit 0，`17/17` static pages。
- 既有 UI browser `beforeAll` 120 秒调度风险继续保留；本 R1 新鲜默认全量未复现该 timeout，候选未修改 UI/browser 套件或调度。

### 9.4 R1 改动文件身份

| 路径 | SHA-256 | bytes | lines |
| --- | --- | ---: | ---: |
| `Code文档/server/security/contact-review-queue.ts` | `C40488D7B18180AE5548F162508CB758C8FFB553E5CFE74A0FA93468D3CF8A93` | 7925 | 249 |
| `Code文档/server/security/contact-review-persistence.ts` | `61505898934582EB423CD34B0D299D205E83E9C40523A806167A8F7933E63327` | 4515 | 144 |
| `Code文档/tests/issue-0036-contact-review-queue.test.ts` | `53893609E5C22F653ACF00C019B958321AC3048F772EC733113A1A5CFA223BE4` | 7640 | 221 |
| `Code文档/tests/issue-0036-contact-review-persistence.test.ts` | `9995291741A11B73204B86E4DEC3FFE6AE733AB17B02F126A5526E4AFD51C6EE` | 7607 | 226 |

R1 未修改 workflow reducer、S1 分类器、真实 route、UI、Spec、Issue、package/lock、平台或生产。当前状态更新为 `S2_REWORK_READY_FOR_REVIEW`；唯一下一步仍为同一独立复核线程 targeted re-review，不得自行提交或推送。
