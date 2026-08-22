# ISSUE-0039：数据库延期与非数据库阶段执行变更 Spec 首轮非阻塞文档审查改进台账

## 基本信息

- Issue ID：`ISSUE-0039`
- 类型：documentation / non-blocking review improvement
- 状态：`closed`
- 工作流状态：`WORKFLOW_COMPLETE`（仅 ISSUE-0039 自身文档债务工作流）
- 阶段口径：Round 1/2/3 历史审查与维护批次已保留；16 项 `NON_SERIOUS`（N001～N006、N-201～N-205、N1～N5）均已形成可追溯处置证据，N006 已由产品/业务 binding addendum 解决并经 ISSUE 管理员独立复核。本 Issue 已关闭，不代表 ISSUE-0036/0031/0034、任何实现、生产、付费或项目总 workflow 完成。
- 优先级：P3
- 来源 Spec：`规划文档/Spec文档/Release_version_Spec/2026-08-10-数据库延期与非数据库阶段执行变更-spec.md`
- source SHA-256（最终 canonical snapshot）：`DBB40E250A6847DBF8109EB5D759CD558F74155CD5FE2C2691C5BACC48D5F14A`
- Hermes Round 1 报告 SHA-256：`1CDF3090DF67C56152E378A2702195D5210E64870CAB9C3B573478B183DC0C25`
- Hermes Round 1 metadata SHA-256：`6D98E583466A3A6BD6640870666949C527C2DD03EF32B74B5695E8E5A61F676E`
- Hermes Round 1 结论：`REWORK_REQUIRED`；4 项 `SERIOUS`、6 项 `NON_SERIOUS`。
- Hermes Round 2 source SHA-256：`F91DBF5196224CF11122B79A0776A139EC8F2FC0A45DE613FB39E9A3DD9E77A1`
- Hermes Round 2 report SHA-256：`EAE57992A5B7F58FC0817EAC23C4207245BF1EC36F59FEC60B5DE5930B9C80BC`
- Hermes Round 2 metadata SHA-256：`0D663DC81B4E0BD7BA2AB763CF32F6DBB26A5009BC54A0DFD3DF40B6806FEE01`
- Hermes Round 2 结论：`REWORK_REQUIRED`；2 项 `SERIOUS`、5 项 `NON_SERIOUS`（N-201～N-205）。
- QA ledger SHA-256（最终）：`4119E877E30AED483F0287C4DD53B99055968484EB0B8E887A0E73078480CC51`
- Hermes Round 3/3 报告 SHA-256：`E62B4CBCB8E938DD744B85A0D4C80930FB758CAE6010CB8F99274C60A3FA9F5D`
- Hermes Round 3/3 metadata SHA-256：`A43D97A71CE19F2D3AC2182AE4DC0F5F54D44B22E2C9B4B7ADBA6982CA7653EB`
- Hermes Round 3/3 结论：`PASS_WITH_NONBLOCKING_OPEN_ISSUES`；0 项 `SERIOUS`、5 项 `NON_SERIOUS`（N1～N5）；`canonical_source_unchanged=true`，审查模型 `deepseek-v4-pro`，禁止第四轮。
- 当前责任：本 Issue 的历史审查与 16 项非阻塞债务已由 ISSUE 管理员完成收口；Round 1/2 的历史 `SERIOUS` 批次已由 Document QA 修订，Round 3/3 为最终轮，不启动第四轮；未分配实现、部署或平台角色。

## 独立范围与不阻塞口径

- 本 Issue 独立追踪本次阶段变更 Spec 的 Round 1 六项、Round 2 五项与 Round 3 五项 `NON_SERIOUS`，不并入 `ISSUE-0035` 或 `ISSUE-0038`，不改变其他 Issue 的状态。
- Round 1 的 4 项与 Round 2 的 2 项 `SERIOUS` 均仅保留历史审计；本 Issue 不代修、不自审，不把历史严重批次状态当作本 Issue 的关闭依据。
- 本 Issue 不修改 Spec、Hermes 报告/metadata、Document QA、产品文档、代码、UI、配置、部署或平台；不运行 npm/Git，不创建任务或 subagent。
- 16 项仅为文档清晰度、追溯性或验收责任边界改进；不构成实现授权、生产授权或后续阶段硬阻塞，后续实现仍按其自身 Spec/业务/技术门禁推进。

## Round 1 NON_SERIOUS 逐项台账

| 台账项 | 发现与当前登记 | 未来关闭触发 | 边界 |
| --- | --- | --- | --- |
| `N001` | S3 数值 SLO 需明确区分建议目标值与架构验证后冻结值，避免把未冻结建议当成承诺。 | 在适用文档维护窗口补目标值/冻结条件的可追溯说明，并经适用文档门禁复核。 | 不提前冻结数值，不改变 S3 实现或生产门禁。 |
| `N002` | 统一硬门确认表缺少路径/hash 可追溯字段，读者无法稳定回到原始证据。 | 补齐确认表对应文件路径、版本/hash 与责任 owner 的交叉引用，并经适用复核。 | 不修改原 Spec/Hermes/QA 原件，不把台账登记当作硬门已通过。 |
| `N003` | 两个验收账号的验证责任未明确，缺少账号用途、执行者与证据归属的清晰分工。 | 由业务/产品/验收 owner 在文档维护窗口补账号角色、执行责任和证据归属。 | 不记录账号凭据或个人敏感信息，不授权生产登录/写入。 |
| `N004` | 延期或缺配置时环境变量默认值的空值/禁用语义未明确，可能造成不同执行者解释不一致。 | 明确缺配置时为空/禁用、fail-closed 与恢复触发的文档口径，并经适用复核。 | 不填真实 Secret，不改平台配置，不将默认值写成生产启用。 |
| `N005` | G0 验收标准存在自引用，需改为外部报告、hash 或 ledger 条件，确保 provenance 可独立核验。 | 形成外部原件路径、hash、ledger 条件及责任 owner 的非循环引用，并经适用文档门禁复核。 | 不重跑既有审查轮次，不以本 Issue 代替 provenance freeze。 |
| `N006` | 本变更 Spec 与既有 ISSUE-0036 Spec 的优先级/冲突裁决未明确，可能导致范围或门禁解释冲突。 | 记录两份 Spec 的优先级、冲突裁决与适用范围；由产品/业务确认后经适用复核。 | 不并入 0036，不改变 0036 当前业务门或授权范围。 |

## Round 2 NON_SERIOUS 追加台账

Round 2 结论为 `REWORK_REQUIRED`，2 项 `SERIOUS` 继续交 Document QA；以下 5 项仅作追加追踪，不阻塞 Round 3 或后续实现。

| 台账项 | 发现与当前登记 | 未来关闭触发 | 边界 |
| --- | --- | --- | --- |
| `N-201` | D4 引用定义不够明确，读者难以确认引用的决策来源与适用边界。 | 补齐 D4 定义、来源路径/hash 与适用阶段的交叉引用，并经适用文档复核。 | 不改变 D4 仍待最终选型/量化的业务门。 |
| `N-202` | SLO 行使用“建议”但缺少与目标值、验证后冻结值之间的绑定语义。 | 明确建议值、架构验证值和最终冻结值的关系、owner 与更新条件。 | 不把建议值写成已冻结承诺，不授权实现或生产。 |
| `N-203` | baseline receipt 缺少稳定的机器可读格式约束，难以自动校验字段和版本。 | 补机器可读 schema、必填字段、版本/hash 与校验失败语义，并经适用复核。 | 不修改既有 receipt 原件，不将格式登记当作 baseline 通过。 |
| `N-204` | P-OPS A1-A4 证据格式未统一，证据类型、路径/hash 和责任归属不够可重放。 | 补 A1-A4 的统一证据结构、路径/hash、owner 与缺失/失败语义。 | 不代表运维证据已产生，不授权平台或生产操作。 |
| `N-205` | Hermes 临时审查目录未携带 Round 1/ledger，存在工具/证据装配层面的程序性可追溯缺口。 | 改进临时目录装配，使 Round 1/ledger 关系可由工具或 manifest 复核。 | 仅登记工具/证据装配改进；不得把临时目录缺报告误写成 canonical 报告不存在。 |

## 依赖、恢复与关闭门禁

- 历史关闭前状态：`open / NON_BLOCKING_DOCUMENT_REVIEW`；4 项 `SERIOUS` 的 Document QA 修订、以及后续实现/验证/生产工作均按各自门禁独立推进，不被本 Issue 阻塞。
- 历史关闭条件：获得非关键文档维护窗口后，N001～N006、N-201～N-205 与 N1～N5 逐项形成可核验处置记录、owner 与来源/hash 追溯，并通过适用文档复核。
- 关闭复核结论：上述 16 项 `NON_SERIOUS` 已全部完成处置且无循环引用；关闭仅因 Issue 自身文档债务达标，不由后续实现启动或阶段变更推断任何其他门禁。
- 历史唯一下一步：在不阻塞后续实现的前提下，等待非关键文档维护窗口并逐项复核；不启动第四轮 Hermes，不进入代码、部署或生产写入。

## Round 3 NON_SERIOUS 追加台账

Round 3/3 结论为 `PASS_WITH_NONBLOCKING_OPEN_ISSUES`，0 项 `SERIOUS`、5 项 `NON_SERIOUS`；以下条目仅进入后续文档维护窗口，不改变实施门禁。

| 台账项 | 发现与当前登记 | 未来关闭触发 | 边界 |
| --- | --- | --- | --- |
| `N1` | 文档/章节状态元数据仍有陈旧表述，需与最终 Round 3、R0 及当前阶段口径一致。 | 在下一次实质文档维护窗口统一头部与章节状态并经适用复核。 | 不改最终 Spec 业务门，不把台账更新当作实施或生产通过。 |
| `N2` | §6.1 provider 参数可读性不足，读者难以从参数名判断用途、敏感级别与环境边界。 | 补充参数语义、敏感级别、来源与环境约束的可追溯说明。 | 不记录真实 Secret，不预选供应商，不授权平台配置。 |
| `N3` | §9.2 仍引用 Round 1 陈旧状态，需改为最终报告/ledger 的可追溯引用。 | 更新为最终报告、QA ledger 与 hash 的外部交叉引用并经适用复核。 | 不重启 Round 1/2/3，不把陈旧引用误写成当前门禁失败。 |
| `N4` | §13“唯一下一步”仍为陈旧阶段指令，与数据库延期及非数据库实施授权不一致。 | 在维护窗口更新为当前责任、依赖与恢复触发，保留数据库延期边界。 | 不自行扩大实现范围，不替代业务方新授权。 |
| `N5` | 文档头部仍显示“待 Round 2”状态，需与 Round 3/3 完成及禁止第四轮一致。 | 更新头部状态、轮次与 provenance 交叉引用并经适用复核。 | 不把元数据修订写成 SERIOUS 修订或新增审查轮。 |

## 2026-08-10 补充授权边界

- 本 Issue 的非金钱文档维护、Issue 登记、测试性证据整理与受控验收可持续推进；付费采购/付费服务不在授权内，且不启动第四轮 Hermes。
- 广泛授权不等于密钥明文泄露、绕过 CAPTCHA、虚构 owner 或跳过独立复核；该段为关闭前历史边界，不改变当前 `closed / WORKFLOW_COMPLETE`。

## 2026-08-10 ISSUE-0039 N006 binding addendum 独立复核

- 非 canonical 产品裁决补充：`规划文档/产品迭代/2026-08-10-ISSUE-0039-N006-0036阶段Spec优先级裁决补充.md`；SHA-256=`12773A218F1447503C8439968034EE6B2FB0B5B9A78850733E40F5144EF89E5E`；11158 bytes / 148 lines / UTF-8 无 BOM、无 NUL。产品经理工作记录 SHA-256=`559FFB97F1CF1E45FBC9A93E954ED6A0917EAFEF2FDEF2F257CC2EE665949A91`。
- 独立回读确认 N006 从 `C` 更新为 `B / BINDING_ADDENDUM / RESOLVED_FOR_DOCUMENT_REVIEW`：阶段变更 Spec 专属管辖数据库延期、0034→0032→0036 顺序、付费/平台/生产边界与恢复门；进入 0036 前先满足阶段门，进入后由 0036 专属 Spec 完整管辖审核语义、字段规则、人工/申诉、供应商/DPA/数据出域与自身验收；无新的明确业务指令发生直接冲突时 fail-closed 并提交最窄裁决。
- 该 binding 仅消除文档优先级/冲突歧义，不代表 ISSUE-0036、ISSUE-0031、ISSUE-0034 或任何实现、生产、付费、人工 owner、AI 出域、自动公开门禁通过；不启动第四轮 Hermes。
- 结合此前维护批次的独立逐项复核，N001～N006、N-201～N-205、N1～N5 共 16 项现为 `B=16 / C=0 / D=0`，无循环引用，满足本 Issue 自身关闭条件。

## 关闭记录

- 关闭日期：2026-08-10。
- 关闭结论：`closed / WORKFLOW_COMPLETE`（仅代表 ISSUE-0039 自身文档债务工作流）。
- 关闭依据：Round 1/2/3 历史 provenance、非关键维护批次及其矩阵/补充文件已独立复核；N006 binding addendum 已按上文完成独立确认；16 项 NON_SERIOUS 台账项均有 owner、来源/hash 与适用处置证据。
- 后续边界：项目总 workflow 仍 `WORKFLOW_ACTIVE`；ISSUE-0031/0032/0034/0036/0020/0035/0038 的状态与各自实现、生产、业务及付费门禁不因本 Issue 关闭而改变。若未来出现新的实质文档范围，应另开新审查周期，不重开本已关闭台账或启动第四轮。

## 2026-08-10 非关键文档维护批次独立复核登记

- 只读维护批次：`规划文档/产品迭代/2026-08-10-0035-0038-0039-非关键文档维护批次.md`，SHA-256=`2ADD34D2E2E659253F23419E484D9F29A9D7FA94F55B6E9AD97CB4904FF6E74D`；产品经理工作记录 SHA-256=`0B169780758A5B82B4D033106C3F74F0AC110846D0E14105657D523D40BC977A`。
- ISSUE 管理员完整复读维护批次、处置矩阵 SHA=`85FFBA55B8F269745F0E577CB86347D59669225AF512633803D4330398E45D94`、勘误补充 SHA=`F9172407A41182C2C84920DA9638D2ACCC8EAA9C7D69F3176865BDE27CCF43C3`，并逐项对照 DB 延期 Spec、硬门表和 Round 3 provenance；未接受产品经理自证替代来源核对。
- 逐项映射：B=15（`N001/N002/N003/N004/N005/N-201/N-202/N-203/N-204/N-205/N1/N2/N3/N4/N5`）具文档 binding 处置证据；C=1（`N006`）因与 `ISSUE-0036` 的优先级/冲突裁决仍需业务确认；D=0。
- 15 项 B 不等于实施、生产、A1–A4 运维证据或业务通过；`N006` 保持 Open。最小解除条件：业务方/产品确认与 0036 的优先级、冲突裁决及适用范围，并经适用文档复核；不得启动第四轮或改写 Spec。唯一下一步：保持 `open / NON_BLOCKING_DOCUMENT_REVIEW`，继续追踪 N006 业务裁决与 15 项后续文档维护窗口。
