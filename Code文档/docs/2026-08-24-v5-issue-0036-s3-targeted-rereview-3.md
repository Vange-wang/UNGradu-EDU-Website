# V5 / ISSUE-0036 S3 第三次 targeted re-review

日期：2026-08-24
角色：独立代码复核 v2.3.2 / `019fefa7-d1d3-7ac3-a5ba-8b8abe299958`
结论：`TECH_REVIEW_PASS`

## 1. 固定点与范围

- 工作树：`D:\codex_project\家教对接website-v5-issue-0036-contact-review-closure`
- 分支：`V5-issue-0036-contact-review-closure`
- HEAD：`03da0015be0d2ee403d848f149814039759cfcd1`
- tree：`c2cdc887da9bb771038fc729dab476518b477112`
- staged=0；候选仍为精确 16 个 tracked modified + 10 个 implementation untracked，共 26 个实现文件，路径集合无漂移。
- 三份既有报告均保持只读：首轮 SHA-256=`9D8BF3F498DC04E18D5DAE217100AD4F36CAB23908D83023337F9144BE28D136`；聚焦 1 SHA-256=`696395AA63EE73B411B40AD0026629AC2E953AD3676E4E33D68673C4606C1AEE`；聚焦 2 SHA-256=`12E6A28664E842C07193A2B44E71DA461E9EFAA0F895198F956271F566455CC9`。
- `package.json` / `package-lock.json` 无差异，blob 为 `9f74f257174ad5c84d62428531c61e30e18a226d` / `012694c0c71cab4fc9b3d74f767d1e87216cf4ee`。
- 本轮只复核 P1-S1/P1-S2；P1-S3/P1-C1/P1-C2 保持 CLOSED，未重开其他范围。

## 2. Standards targeted pass

P0/P1/P2=`0/0/0`。

### P1-S1：CLOSED

- `Code文档/server/security/contact-review-production.ts:2163-2182` 的 `listPublic` 使用独立 public repository scope，逐实体调用与详情一致的 `authoritativePublishedAggregate`，只投影 approved snapshot 白名单，并按批准 `createdAt` 降序、`id` 升序稳定排序。
- `Code文档/server/security/contact-review-cloudbase.ts:110-130,172-181` 分页读取同 entity type 的实体、aggregate 和 task；分页不前进时失败关闭，不以旧主文档筛选结果作为候选集。
- `Code文档/server/parent-need-api.ts:71-87` 与 `Code文档/server/tutor-profile-api.ts:71-87` 在权威集合形成后才执行 subject、grade/stage、price、gender 筛选；详情仍直接返回相同 `readPublic` 权威投影。
- `Code文档/tests/issue-0036-production-wiring.test.ts:219-461,463-624` 使用 query page size=1 的 CloudBase 合成 repository 和真实 parent/tutor list、通用详情、management 详情路由。测试将旧主文档筛选字段及 createdAt 与批准值置反，验证 approved 值命中、漂移值不命中、跨页成员、稳定顺序、数量和白名单响应；task/aggregate/ref/digest 异常继续 hidden/404。
- 结果：公开列表成员关系、筛选、排序、计数和响应字段均由已批准快照决定；未发现旧主文档漂移旁路或联系方式泄露。

### P1-S2：CLOSED

- `Code文档/server/security/contact-review-production.ts:356-391` 的 `resultReference` 明确剔除 active/pending snapshot，只保存首次稳定业务元数据；`resultDigest` 使用 keyed digest，`replayReceipt` 校验前缀、digest、entity/type/version 后恢复首次结果，损坏或不一致固定返回 503。
- field claim/decision、appeal claim/final decision 的 scope 不含 reviewer ID；operator 不进入稳定业务 request hash。未授权账号和错误角色仍在 receipt 借用前由 `Code文档/server/contact-review-api.ts:77-82,134-137,195-230` 及 service 的 owner/role/triage 检查拒绝。
- `Code文档/server/contact-review-api.ts:47-70` 对 action HTTP 响应执行固定字段白名单，不返回 activeSnapshot、pendingSnapshot、正文或联系方式。
- `Code文档/server/security/contact-review-cloudbase.ts:226-241,264-282` 原样持久化完整 idempotency record；resultRef/resultDigest 不会在 CloudBase adapter 中被截断或另行改写。
- `Code文档/tests/issue-0036-production-wiring.test.ts:694-910` 经过真实 HTTP handler→service→repository：先以其他 key 推进 claim→decision、decision/appeal→appeal claim、appeal claim→final decision，再由另一名已授权 reviewer 重放旧 key，断言返回首次业务结果且完整 repository snapshot 不变；异 payload 为 409，未授权/错误角色为 403。
- 结果：同 key 同稳定业务 payload 能在后续状态推进后重放首次非敏感结果，revision、audit、receipt 均零新增；未发现 receipt 借用、当前状态覆盖首次结果或敏感 snapshot 泄露。

## 3. Spec targeted pass

P0/P1/P2=`0/0/0`。

- P1-S1 已满足冻结 Spec 的唯一公开权威模型、N/N 完整性、approved snapshot 白名单及错误引用/digest 漂移 fail-closed 要求。
- P1-S2 已满足同业务 scope 的同 key+同 requestHash 返回首次结果、异 requestHash 返回 409、task/appeal 只产生一个有效副作用和一条可回放审计链的要求。
- 未引入新的公开指针、业务状态、真实账号/Secret、数据库架构、平台配置、AI/OCR、付费或其他 Issue 范围。

## 4. 测试证据与边界

- 新增负例实质经过真实 route、HTTP handler、service、CloudBase/InMemory repository、分页、事务及公开投影 seam，不是只匹配源码文本的伪通过。
- 开发 owner 报告的定向 1 file / 16 tests、受影响 12 files / 134 tests、全量 88/88 files（659 passed / 1 existing skipped）、typecheck/lint/build 18/18 与实现 diff-check 通过，和当前候选工作记录一致。本轮遵守授权，npm 执行数为 0。
- 三份既有报告中的历史尾随空格未修改，也不属于 26 项实现候选。除本报告外无本轮写入；未执行 Git mutation、提交、推送、部署或平台操作。
- CloudBase 实际索引、查询计划、权限、生产 reviewer 绑定、部署与生产负载仍是后续独立门禁；本地代码复核 PASS 不替代这些证据。

## 5. 结论与唯一下一步

`TECH_REVIEW_PASS`。

P1-S1=`CLOSED`；P1-S2=`CLOSED`；P1-S3/P1-C1/P1-C2 继续 `CLOSED`。修订引入 P0/P1/P2=`0/0/0`。

唯一下一步：项目总负责人接收本地独立代码门通过证据，并按既定顺序把同一冻结 26 文件候选路由至已登记 UI 复核角色；本角色不自行提交、推送、部署、执行平台配置或关闭 ISSUE-0036。
