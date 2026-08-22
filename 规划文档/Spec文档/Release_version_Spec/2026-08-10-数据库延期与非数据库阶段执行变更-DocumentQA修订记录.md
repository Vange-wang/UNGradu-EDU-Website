# 数据库延期与非数据库阶段执行变更｜Document QA 修订记录

## 1. 接管与输入

- 角色：Document QA v2.3.0；会话 `019fbd2e-5b12-7f41-88db-f30489656a5f`；统一标题 `DocumentQAv2.3.0`。
- 任务：`PHASE-CHANGE-0031-DEFER-0034-0032-0036-20260810` Round 1 SERIOUS 批次一次性修订。
- canonical Spec：`规划文档/Spec文档/Release_version_Spec/2026-08-10-数据库延期与非数据库阶段执行变更-spec.md`。
- 输入 Spec SHA-256：`25A38C5F2E465D66669BE3BBABAF5575FD24AA5C66C1BC15DBCB4E61FBF5DF6C`；输入 `25,910 bytes`，`rg -n` 末行 `339`。
- Hermes Round 1 报告：`规划文档/Spec文档/Release_version_Spec/2026-08-10-数据库延期与非数据库阶段执行变更-hermes-round-1.md`。
- 报告 SHA-256：`1CDF3090DF67C56152E378A2702195D5210E64870CAB9C3B573478B183DC0C25`。
- metadata SHA-256：`6D98E583466A3A6BD6640870666949C527C2DD03EF32B74B5695E8E5A61F676E`。
- 模型/轮次：`deepseek-v4-pro`；Round `1/3`；`canonical_source_unchanged=true`；verdict `REWORK_REQUIRED`。
- 完整 SERIOUS 批次：S001–S004；NON_SERIOUS N001–N006 不在本批，交 Issue 管理员登记，不修改。
- 冻结业务边界：0031 延期、本轮预算 0、不迁移/不采购/不双写；顺序为 `0034 非数据库 → 0032 → 0036`；两个账号仅受控验收资源；AI 仅辅助默认不出域、首期不自动拒绝、OCR off、fail-closed；未登记人工 owner 禁止生产人工闭环/自动公开。

## 2. SERIOUS 逐项映射

| Finding | 旧位置与风险 | 新位置 | 修订理由 | 验证证据 |
| --- | --- | --- | --- | --- |
| S001 | §9.1（报告标为 §9.2）把 `100% 对账、0数据丢失` 作为未来 F1 硬门，无法对在途/未确认写入作可测承诺 | §9.1 触发条件、§10.1 F1 行 | 改为 `100%` 对账覆盖且差异逐条可解释/人工追溯；已确认写入零业务记录丢失；在途/未确认写入按未来批准 RPO 与恢复演练界定；明确不恢复本轮迁移 | 回读 canonical 不再出现 `0数据丢失`；F1 验收行同步记录新口径；0031 仍 DEFERRED/open、无迁移/双写/预算 |
| S002 | §5.3、§6.3、§10.3 首次 S1/S2 部署引用“上一稳定版本”，但没有可回滚基线，形成循环依赖 | §5.3、§6.2、§6.3、§10.1、§10.3 | 首次生产部署前必须生成并验证 baseline receipt；缺失即 `no-go`；首次失败回滚部署前已验证 receipt，后续回滚上一个已验证 baseline，不假设已有版本 | 回读 receipt 的版本/配置/路由/数据源、时间、验证者、命令和证据字段；S1/S2 生产矩阵和失败传播均要求 baseline |
| S003 | §6.1 Turnstile China widget 不可用时只有“保持阻塞”，无 S2 前验证、owner、证据或升级路径 | §6.1、§6.2、§6.3、§10.1 S2 行 | S2 前由配置执行侧在中国大陆目标网络验证可达性/可用性并留截图/API probe；失败或证据缺失 `no-go`；不可用时由总负责人路由 provider-neutral 等价候选的业务确认，或人工/邮件停发 fail-closed，禁止自行采购/选新 provider | 回读目标网络、hostname/action/region、时间、owner、证据要求；矩阵列出验证；失败关闭发送、不得静默切换 world |
| S004 | §7.3 无人工 owner 时仅写 `pending/manual`，无 SLO、超时、用户提示、告警升级和生产边界 | §7.3、§7.4、§10.1 S3 行、§10.3 | 未登记 owner 时只允许本地/集成/合成 reviewer queue，真实生产不接收公开审核；批准队列绑定入队 p95≤30m、裁决 p95≤4h、99%≤1 工作日；超时保持 pending/manual、不公开、告警并升级；补用户可见提示 | 回读 SLO、超时行为、owner/备援/总负责人升级、用户提示和生产合成队列限制；S3 验收同步验证 |

## 3. 受影响验收与失败路径

- S1/S2 首次生产部署：baseline receipt 缺失/不可验证为 `no-go`；首次失败回滚部署前 receipt，后续回滚上一个已验证 baseline。
- S2 中国大陆网络：验证可达性/可用性、hostname/action/region、时间、owner、截图/API probe；不可用时验证 provider-neutral 业务路由或人工/邮件停发 fail-closed，不采购、不选新 provider、不静默切换 `world`。
- S3 人工 owner：无真实 owner 时不得进入生产人工闭环，只允许本地/集成/合成 queue；不公开、不让 AI 单独决定、不外发 OCR/原文。
- S3 golden/SLO：验证入队 p95≤30 分钟、裁决 p95≤4 小时、99%≤1 个工作日；任一超时保持 `pending/manual`、不公开、告警并升级，用户收到“审核队列暂未开放，预计在人工服务恢复后处理，请勿重复提交”。
- F1 未来迁移验收：对账覆盖 100%、差异逐条解释并可人工追溯、已确认写入零业务记录丢失；在途/未确认写入只按未来批准 RPO 与演练判断，不作为本轮数据库迁移授权。

## 4. 输出、边界与下一步

- 输出 Spec SHA-256：`F91DBF5196224CF11122B79A0776A139EC8F2FC0A45DE613FB39E9A3DD9E77A1`；`29,256 bytes`；`rg -n` 末行 `362`。
- QA 状态：`QA_DOCUMENT_REWORK_COMPLETE`；不等于 Hermes 通过、TECH_VERIFIED、BUSINESS_ACCEPTED、生产通过或 Issue 关闭。
- Round 1 报告与 metadata 原件未修改，哈希保持第 1 节输入值；仅修改 canonical 与本 ledger；未修改 NON_SERIOUS、旧 Spec、Issue、代码、UI、平台或角色文件。
- 未运行 Hermes、npm、Git mutation、部署、Cloudflare/CloudBase 操作；未读取、写入或暴露账号/Secret。
- 审查计数仍为 `1/3`，剩余最多 2 轮且不可重置；唯一下一步：总负责人冻结新 source hash，发起 Hermes Round 2/3，仅复核 S001–S004 及受影响回归。Round 3 后仍有 SERIOUS 必须进入 `DOCUMENT_REVIEW_LIMIT_REACHED`，禁止自动第四轮。

## 5. Round 2/3｜S-201/S-202 剩余 SERIOUS 整批修订

- 角色/会话：Document QA v2.3.0 / `019fbd2e-5b12-7f41-88db-f30489656a5f`；共享计数 Round `2/3`，剩余且仅剩 Round 3/3，不重置。
- 输入 canonical SHA-256：`F91DBF5196224CF11122B79A0776A139EC8F2FC0A45DE613FB39E9A3DD9E77A1`；现有 ledger SHA-256：`DC727948AE037BBD648F735D0416A838DAF1756879388636D708E3D87E2026D8`。
- Hermes Round 2 报告 SHA-256：`EAE57992A5B7F58FC0817EAC23C4207245BF1EC36F59FEC60B5DE5930B9C80BC`；metadata SHA-256：`0D663DC81B4E0BD7BA2AB763CF32F6DBB26A5009BC54A0DFD3DF40B6806FEE01`；verdict `REWORK_REQUIRED`，2 SERIOUS / 5 NON_SERIOUS。
- 冻结边界保持不变：0031 延期、预算 0、不迁移/不采购/不双写；顺序 `0034 非数据库 → 0032 → 0036`；两个账号仅受控验收；AI/OCR/fail-closed 与未登记人工 owner 规则不变。N-201–N-205 不处理。

### 5.1 SERIOUS 映射

| Finding | 旧位置与风险 | 新位置 | 修订理由 | 验证 |
| --- | --- | --- | --- | --- |
| S-201 | §7.2 门 05 使用内容初审/普通人工审核的 0036-05 数值，却未标明对象；§7.3/§7.4 使用 0036-07 申诉数值，形成 5m/30m、30m/4h、2h/1工作日冲突 | §7.2 门 05/07、§7.3、§7.4 | 明确两套不同对象：内容初审/普通人工审核（0036-05）系统入队 p95≤5m、裁决≤30m、99%≤2h；申诉队列（0036-07）入队≤30m、裁决≤4h、99%≤1工作日；两套均超时不公开、告警升级，互不覆盖 | 回读三处均带对象标签和对应数值；§7.4 分别验收；无人工 owner 仍只走合成队列 |
| S-202 | §6.1 将 widget 可达性写成“S2 开始前 no-go”，§10.1 又将同一证据列为 S2 集成交付，阻塞 provider-neutral 本地工作 | §6.1、§6.2、§6.3、§10.1 S2 行 | 文档门通过后可启动 provider-neutral 本地代码/fixture/adapter 与 RED；中国大陆 widget 证据仅是 provider-specific 集成/预生产/生产启用前 no-go。验证失败停在本地 adapter，路由等价候选或邮件停发/人工 fail-closed；不采购、不自行换供应商 | 回读本地/集成/生产三层顺序、provider-specific 标记、失败停留和 no-go 边界；§10.1 S2 行与 §6.1/6.2 一致 |

### 5.2 输出与边界

- 输出 canonical SHA-256：`DBB40E250A6847DBF8109EB5D759CD558F74155CD5FE2C2691C5BACC48D5F14A`；`30,876 bytes`；`rg -n` 末行 `373`。
- QA 状态：`QA_DOCUMENT_REWORK_COMPLETE`；不等于 Hermes 通过、TECH_VERIFIED、BUSINESS_ACCEPTED 或 Issue 关闭。
- Round 2 报告/metadata 原件未修改，哈希保持本节输入值；仅追加本 ledger 与修改 canonical；未处理 N-201–N-205。
- 未运行 Hermes、npm、Git mutation、部署或 Cloudflare/CloudBase 操作；未修改 Issue、代码、UI、平台或其他角色文件。
- 唯一下一步：总负责人冻结新 canonical hash，发起 Hermes Round 3/3，仅复核 S-201/S-202 及受影响回归；第三轮后仍有 SERIOUS 必须进入 `DOCUMENT_REVIEW_LIMIT_REACHED`，禁止自动第四轮。
