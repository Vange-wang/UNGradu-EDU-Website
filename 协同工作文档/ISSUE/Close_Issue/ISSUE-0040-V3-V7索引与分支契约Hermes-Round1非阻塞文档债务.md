# ISSUE-0040：V3-V7 索引与分支契约 Hermes Round 1 非阻塞文档债务

## 当前关闭状态（2026-08-26）

- Issue ID：ISSUE-0040
- 状态：closed
- 工作流状态：WORKFLOW_COMPLETE（仅 ISSUE-0040 自身；项目 workflow 仍为 `WORKFLOW_ACTIVE`）
- 类型/优先级：documentation / non-blocking review improvement；P3
- 关闭语义：本次仅关闭当前获授权的 V3–V7 总索引/分支契约文档债务收口，不表示 V3–V7 功能、代码、生产、数据库、部署或项目 workflow 完成。
- 用户门：用户已确认“继续”，仅覆盖本 ISSUE 的保守 doc-only 关单；不授权 ISSUE-0031、数据库、支付、代码、平台或部署动作。
- owner：项目总负责人（索引与串行门禁冻结）/对应 V3–V7 Spec owner；ISSUE 管理员仅维护台账。

## 独立关单证据与门禁

- 最终关单附录：`规划文档/Spec文档/Release_version_Spec/2026-08-26-issue-0040-v3-v7总索引非阻塞文档债务关单-spec-addendum.md`；SHA-256=`8AC485F414EF502FBC77E7B56DA867A1E4109A87C0BF5740BBFB5B90525501CF`；18341 bytes / 124 lines。
- Hermes Round 1：`规划文档/Spec文档/Release_version_Spec/2026-08-26-issue-0040-v3-v7总索引非阻塞文档债务-hermes-round-1.md`；SHA-256=`E4D50137E607DA5CABD8C79FA24556D42C41B5EF02894EB1B7504AB0A2295C57`；正文 `REWORK_REQUIRED` / SERIOUS=1。
- Hermes Round 2：`规划文档/Spec文档/Release_version_Spec/2026-08-26-issue-0040-v3-v7总索引非阻塞文档债务-hermes-round-2.md`；SHA-256=`51E45869821D20B9595A9180554C0C20ABB38A4F6BA131CAB12C5A0CD9D8F6F1`；正文 `REWORK_REQUIRED` / SERIOUS=1。
- Hermes Round 3：`规划文档/Spec文档/Release_version_Spec/2026-08-26-issue-0040-v3-v7总索引非阻塞文档债务-hermes-round-3.md`；SHA-256=`C30503EBCC7CA19A82C540B796AFE8A672CE7E32B38EBE76599650981D16A757`；正文 `PASS_WITH_NONBLOCKING_OPEN_ISSUES` / SERIOUS=0；round=3/3，model=`deepseek-v4-pro`，exit=0，`canonical_source_unchanged=true`、`default_model_changed=false`。
- Round 3 metadata：同目录 `...-hermes-round-3.md.metadata.json`；SHA-256=`081378F43C06107B183739DD91F29AFD240401E26AB43B6DD16ACEBFE7BB9B88`。
- Document QA ledger：`协同工作文档/文档QA/DocumentQA工作记录.md`；SHA-256=`B003A837868615A76ACD2551803A7B18E3F78E8EF26C76DA3FEAAD188AE14A9F`；48045 bytes / 266 lines。QA 已记录 R1 S1、R2 S-01 的一次性整改及 R3 0 SERIOUS；不启动第四轮。
- 产品经理工作记录：`规划文档/产品经理工作记录.md`；SHA-256=`C24A45A1BD9E08A9256015CFC40D7DE70FD228FA65FBBA2A5B0F23106EFD2FA5`；已记录 R3 文档门 `DOCUMENT_GATE_PASSED / USER_CONFIRMATION_PASSED` 及管理员关单路由。

## N1–N6、M1、M4、C2、C3 独立复读矩阵

以下十项均在附录 §4 形成唯一处置、证据/锚点、owner 与 future trigger；`CURRENT_CLOSURE_SUFFICIENT` 仅表示本 ISSUE 当前批准的索引文档绑定可复读，不替代任何功能、生产或数据库门。

| 债务 | 当前处置与证据/锚点 | owner / future trigger |
| --- | --- | --- |
| N1 | `CURRENT_CLOSURE_SUFFICIENT`；附录 §4 N1 将旧空格笔误与修订措辞对应，旧索引字节保留。 | PM/ISSUE 管理员；如需改旧原文，由旧索引 owner 授权并复读。 |
| N2 | `CURRENT_CLOSURE_SUFFICIENT`；附录 §4 N2 区分产品目标版本与 Agent 版本。 | PM/项目总负责人；版本命名规则变化时重新冻结。 |
| N3 | `CURRENT_CLOSURE_SUFFICIENT`；附录 §2 D-01–D-06 给出六份来源的 path/hash/bytes/lines 及后续收口链。 | PM/项目总负责人；任一来源漂移时重新 receipt。 |
| N4 | `CURRENT_CLOSURE_SUFFICIENT`；附录 §4 N4 以 V6/V7 doc-only 的 `N/A_FOR_CURRENT_CLOSURE` 区分功能/生产门，不写成通过。 | PM/ISSUE 管理员；恢复功能范围时新建 Spec/证据周期。 |
| N5 | `CURRENT_CLOSURE_SUFFICIENT`；附录 §5.1/§5.2 逐项保留 V6 B/C/D、V7 A/B/C 语义及来源锚点。 | PM/ISSUE 管理员；源分类变化时更新交叉 receipt。 |
| N6 | `CURRENT_CLOSURE_SUFFICIENT`；附录 §6 索引五份关闭 Spec/后续附录的负例、阈值与 fail-closed/unknown 入口，不新造阈值。 | 对应 Spec owner；新行为/阈值冻结后补专项证据。 |
| M1 | `CURRENT_CLOSURE_SUFFICIENT`；附录 §7 checklist 覆盖六份来源、hash/bytes/lines、分类、base/receipt、关闭状态与残余转移。 | 项目总负责人；任一检查项缺失即 `REVIEW_BLOCKED`。 |
| M4 | `CURRENT_CLOSURE_SUFFICIENT`；附录 §3/§3.1 及 §4 M4 将 V3→V7 定性为业务确认的治理/排期契约，不宣称技术必然依赖。 | 项目总负责人/Issue 管理员；路线变化需新决策记录。 |
| C2 | `CURRENT_CLOSURE_SUFFICIENT`；附录 §4 C2 解释旧索引 §3/§10 的历史层级差异，当前按已确认治理契约执行。 | 项目总负责人/PM；路线再变更需新用户决策。 |
| C3 | `CURRENT_CLOSURE_SUFFICIENT`；附录 §4 C3 与 §5.2/§7.2 对齐 V7 “处理 ISSUE-0035”的历史不对称，不倒改旧字节。 | PM/ISSUE 管理员；范围扩大时新 Spec 与新 receipt。 |

## V3–V7 映射、来源与适用边界

- 附录 §2 D-01–D-06 六份来源已逐项存在、可回读并与其 path/hash/bytes/lines 绑定；D-02–D-06 的 close receipt/addendum 链保持一一对应，不把摘要 hash 当作 provenance。
- 附录 §3.1 映射保持 V3→ISSUE-0034、V4→ISSUE-0032、V5→ISSUE-0036、V6→ISSUE-0038、V7→ISSUE-0035；各 Issue 自身 close receipt 不互相替代。
- V6 分类按附录 §5.1 为 B=7/C=5/D=1；V7 按 §5.2 为 A=5/B=6/C=4/D=0。两套字母为源文档内枚举，不跨源转换。
- V7 当前 11 项仅为文档 binding；N-003、N-006、N-010、N-013 为 `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER`，其中 N-006 继续转入 `ISSUE-0031`，不写成完成。
- V6/V7 的实现、部署、生产、功能业务验收及 branch/base receipt 对本次纯文档关单为 `N/A_FOR_CURRENT_CLOSURE`；未创建、未伪造任何分支或 receipt。ISSUE-0031、数据库、支付和全部付费动作继续延期。

## Hermes Round 1–3 非阻塞残余去重登记

本节把 R1/R2/R3 报告中的 NON_SERIOUS、NS、OI 作为关闭记录中的非阻塞残余登记；不触发措辞返工、不递归新建 Issue，仅在未来发生索引实质修订时复核。R1/R2 的 SERIOUS 仍按 QA 记录处理，不降级。

| 关闭记录残余 | 来源映射（去重） | 状态、owner 与未来触发 |
| --- | --- | --- |
| NS-0040-01 锚点/路径粒度清晰度 | R1 N1；R2 NS-01；R3 NS-1；R3 NS-5 | non-blocking residual；项目总负责人/PM；索引实质修订时统一章节、路径与 addendum 入口并复读。 |
| NS-0040-02 V6/V7 分类与 issue-local ID 可读性 | R1 N3；R2 NS-02、NS-06；R3 NS-3 | non-blocking residual；PM/ISSUE 管理员；分类或来源交叉表实质修订时补 source path/hash/anchor 与命名空间说明并复读。 |
| NS-0040-03 独立用户确认门说明 | R1 N4 | non-blocking residual；项目总负责人/PM；确认流程实质修订时补独立 owner、触发及与 ISSUE-0031 的隔离说明。 |
| NS-0040-04 V7 C 项 owner/trigger 复读粒度 | R2 NS-03 | non-blocking residual；V7/相关 Issue owner；V7 transfer 矩阵实质修订时补内联 owner/trigger 或稳定来源锚点。 |
| NS-0040-05 审查门状态/标签/历史章节说明 | R2 NS-04、NS-05；R3 NS-2、NS-4 | non-blocking residual；PM/项目总负责人；新审查周期或状态更新时统一 `Round`、finding 前缀及旧章节限定，并复读。 |
| NS-0040-06 V6/V7 close receipt 与外部绑定可定位性 | R3 NS-6；R2 OI-03 | non-blocking residual；ISSUE 管理员；索引来源表实质修订时补 doc-only receipt 的完整路径/说明并重新 receipt。 |
| NS-0040-07 R1–R3 审查过程的外部可复读说明 | R2 OI-01、OI-02、OI-04；R3 OI-01、OI-02、OI-03、OI-04 | non-blocking residual；项目总负责人/ISSUE 管理员；未来重新冻结索引或新增审查周期时附完整原始报告、metadata、来源 receipt 与 Active Open 快照。 |
| NS-0040-08 R3 报告中对附录自述状态的同步 | R3 C-2；R3 OI-2 | non-blocking residual；PM；如附录再次实质修订，刷新审查轮次/下一步字段后重新绑定。 |

以上残余不构成当前关单阻塞，亦不表示其文字问题已经修订或已关闭；仅明确 owner 与未来触发，避免把 Round 3 的 NON_SERIOUS/OI 递归成新 Issue。

## 关闭边界、历史原文与未来恢复

- 本关闭记录只证明 ISSUE-0040 自身的当前 doc-only 台账收口；不证明 V3–V7 功能、生产、数据库、部署、Git provenance 或项目 workflow 已完成。
- ISSUE-0031 保持 `open / USER_CONFIRMATION_PENDING`；ISSUE-0041、0042、0043、0044、0045、0046 及其他 Open Issue 不因本次关闭改变状态或内容。
- 当前项目 Active Open 精确为 `ISSUE-0031/0041/0042/0043/0044/0045/0046` 共 7 项；项目 workflow 保持 `WORKFLOW_ACTIVE`。
- 若未来要修改总索引的实质分类、来源、路线或功能范围，应新建/授权新的文档周期，重新进行适用 Hermes/QA/用户门；若恢复 V6/V7 功能，应由对应 Issue 或继任 Issue 重新建立实现、独立复核、部署/生产和业务验收证据。

## 历史 Open canonical 原文（完整保留）

# ISSUE-0040：V3-V7 索引与分支契约 Hermes Round 1 非阻塞文档债务

## 基本信息

- Issue ID：ISSUE-0040
- 类型：documentation / non-blocking review improvement
- 状态：open
- 工作流状态：NON_BLOCKING_DOCUMENT_REVIEW
- 优先级：P3
- 来源报告：规划文档/Spec文档/Release_version_Spec/2026-08-15-v3-v7-总版本索引与分支契约-hermes-round-1.md
- 来源报告 SHA-256：FC01EAA2480D85A167F18970047F7D63E48CD937F138A2CA84E464C0F41FF766
- owner：项目总负责人（索引与串行门禁冻结）/ 对应 V3-V7 Spec owner；ISSUE 管理员仅维护本台账
- 关系：仅追踪 V3-V7 总索引报告的 NON_SERIOUS 与非严重缺失验收项；不修改或关闭 ISSUE-0031/0032/0034/0035/0036/0038，不改变项目总 workflow。

## 登记边界

- 本 Issue 不修改 Spec、Hermes 报告、Document QA、代码、UI、平台或部署，不启动实现。
- 以下每一项均保持为文档改进候选；不阻断当前 Document QA 对 SERIOUS 的整改，但须在未来授权的文档冻结窗口满足触发条件后关闭。
- 报告 S1、S2 及直接属于 S2 的 M2、M3 不在本 Issue 登记，继续由 Document QA 处理；不得以本 Issue 降级、替代或关闭 SERIOUS。

## NON_SERIOUS 与缺失验收项逐条映射

| 报告项 | 事实与影响 | 状态与 owner | 未来关闭触发 |
| --- | --- | --- | --- |
| N1 | “配置 receipt和已发布旧快照”缺空格，属于可读性笔误；可能影响文档复读但不改变门禁语义。 | open / non-blocking；项目总负责人 | 冻结前完成文字修订并由适用独立复读确认。 |
| N2 | v2.3.2 未明确是项目目标版本还是 Agent 版本；版本语义可能造成归档/路由歧义。 | open / non-blocking；项目总负责人 | 冻结前明确“目标产品版本”与 Agent 版本字段。 |
| N3 | “六份新草案”未逐条枚举，需从五份 Spec 加总索引推断；可能造成漏读。 | open / non-blocking；项目总负责人 | 冻结前逐条列出六份草案及其路径、完整 hash、字节数和行数。 |
| N4 | 统一关闭顺序使用产品/业务门，但 V6/V7 文档-only 路径未明确适用性；可能把 N/A 门误当必经门。 | open / non-blocking；项目总负责人/产品 owner | 冻结前补“适用”限定或明确文档-only 版本的 N/A 判定，并经适用复核。 |
| N5 | V6 使用 B/C/D、V7 使用 A/B/C，分类字母口径不一致；可能造成跨 Issue 交叉引用误读。 | open / non-blocking；项目总负责人/ISSUE 管理员 | 冻结前对照源 Issue 逐项核对分类并形成可追溯矩阵。 |
| N6 | “零容忍负例”“不确定”等抽象门依赖五份 Spec 的负例清单和阈值；索引自身不可独立判定。 | open / non-blocking；对应五份 Spec owner | 五份 Spec 冻结时逐项枚举负例与判定阈值，并由索引复读确认。 |
| M1 | 索引缺少自身完成定义与一致性检查清单，未明确六份草案齐全、hash 冻结、门禁措辞、分类和 base 规程的逐项核对。 | open / non-blocking；项目总负责人 | 冻结前形成索引级可复读 checklist，并以完整来源证据通过适用文档复核。 |
| M4 | V3→V4→V5 的技术依赖理由未说明，可能把重大排期决策误读为已证明的技术必然依赖。 | open / non-blocking；项目总负责人/产品 owner | 冻结前补技术/业务依据，或明确其为待确认的排期策略并同步依赖口径。 |
| C2（报告标注为非严重） | §3 把串行依赖写成确定事实，§10 又列为用户确认前未决；同一文档口径分裂。 | open / non-blocking；项目总负责人 | 冻结前统一为“拟议依赖，待确认”或完成授权确认，并由 Round 2 回归核对。 |
| C3（有意不对称，需澄清） | L50 对 V7 写“处理 ISSUE-0035”而非“通过并关闭”；虽与 N-006 阻塞逻辑一致，仍可能被读成笔误。 | open / non-blocking；项目总负责人 | 冻结前补充 V7 使用“处理”的理由并与 §5.5/§7.2 对齐。 |

## 报告 Open-Issue 路由及不重复登记

| 报告 Open-Issue | 处置 |
| --- | --- |
| V3 精确 base commit、门禁强度统一及 base 兜底 | S2/S1 及其相关 SERIOUS 继续交 Document QA；不在本 Issue 重登记。 |
| 五份 Spec 冻结 hash | 分别由 ISSUE-0032、0034、0035、0036、0038 的既有来源/冻结门禁承载；本 Issue 只追踪索引的枚举与一致性缺口。 |
| 用户是否严格串行 | 作为 ISSUE-0035 及 0034/0032/0036 既有业务/顺序确认门禁路由；不新建重复业务 Issue。 |
| V4 provider-specific | 由 ISSUE-0032 既有 provider/network/platform/production 门禁承载。 |
| V5 人工、AI、出域、申诉门 | 由 ISSUE-0036 既有业务确认与生产人工/供应商/DPA/key 门禁承载。 |
| V6 的 V5 accepted evidence relation | 由 ISSUE-0038 与 ISSUE-0036 既有证据门禁承载。 |
| V7 的 N-006 A/B/C | 由 ISSUE-0035、ISSUE-0038 及延期中的 ISSUE-0031 既有台账承载。 |
| 外部事实与摘要 hash 非 provenance | 由对应原 Issue/项目总负责人冻结核对承载；不把摘要 hash 当作完整 provenance。 |

## 关闭条件与持续边界

- 关闭触发：本报告 N1–N6、M1、M4、C2、C3 均在获授权的 Spec 冻结窗口完成适用修订或明确保守决策；完整来源证据可复读；Document QA 已完成其 SERIOUS 批次；项目总负责人确认不再有未处理回归；ISSUE 管理员独立回读后才能关闭 ISSUE-0040。
- 本 Issue 当前保持 open / NON_BLOCKING_DOCUMENT_REVIEW；不因 Round 1 报告存在、Round 2 启动或任一原 Issue 关闭而自动关闭。
- 明确口径：本 Issue 不阻断当前文档 SERIOUS 项整改，但须在未来触发条件满足后关闭；不得把本登记写成 Spec 冻结、实现授权或项目 WORKFLOW_COMPLETE。
- 唯一下一步：项目总负责人等待 Document QA 完成 SERIOUS 整改后，统一决定 Hermes Round 2 的回归范围。
