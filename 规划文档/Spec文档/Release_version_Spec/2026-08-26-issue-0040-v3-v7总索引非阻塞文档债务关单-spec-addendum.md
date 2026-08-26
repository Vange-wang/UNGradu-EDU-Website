# ISSUE-0040｜V3–V7 总索引非阻塞文档债务关单范围调整附录

> 文档状态：`DRAFT_NON_CANONICAL / AUTHOR_DRAFT / HERMES_REVIEW_PENDING`
> 审查周期：本附录为 ISSUE-0040 实质文档版本的新周期；`MAX_REVIEW_ROUNDS=3`，Round 1/3 已完成且共享计数保持 `1/3`，Round 2/3 待执行。
> 编写角色：产品经理 Agent v2.3.2（019fefa7-9883-7af2-bdb5-acc5c8513781）
> 项目 workflow：`WORKFLOW_ACTIVE`。本附录不修改旧总索引、Issue 状态、代码、分支、平台或部署。

## 1. 目标、范围与历史关系

本附录只处置 ISSUE-0040 台账中的 N1–N6、M1、M4、C2、C3，建立六份原始关闭 Spec/总索引的精确清单、V3–V7 分类交叉说明、文档-only 适用门和历史勘误关系。它是对旧总索引非阻塞债务的 material scope adjustment，不重写旧总索引，也不把旧审查历史改成新周期。

当前项目事实：

- ISSUE-0040 仍为 `open / NON_BLOCKING_DOCUMENT_REVIEW`；其旧 R1 的 N1–N6、M1、M4、C2、C3 由本附录逐项处置，Issue 管理员仍须独立复读并维护状态。
- Active Open 精确为 `ISSUE-0031/0040/0041/0042/0043/0044/0045/0046`；ISSUE-0031 仍 `open / USER_CONFIRMATION_PENDING`。
- 项目 workflow 仍为 `WORKFLOW_ACTIVE`，数据库、ISSUE-0031、支付和全部付费动作继续延期。本附录不启动迁移、建表、双写、采购或付费。
- V3→V4→V5→V6→V7 是业务方确认后的串行治理/排期契约，不是被本附录证明的技术必然依赖；各分支完成、文档门通过或 Issue 关闭均不自动完成项目 workflow。

本附录的关闭候选仅表示“ISSUE-0040 当前批准范围内的索引/契约文档债务已完成可复读处置”。它不表示 V3–V7 的功能、生产、数据库、安全无风险或部署门已被本附录重新验收。

## 2. 精确来源与六份草案清单（N3）

以下六份是旧索引所称“六份草案”的完整枚举。hash、字节数、行数是本附录写入前只读重算结果；旧总索引保持历史只读。后续 addendum/close receipt 是替代或收口链，不修改其历史字节。

| 编号 | 历史草案/最终关闭 Spec | SHA-256 | bytes / lines | 后续关系 |
| --- | --- | --- | --- | --- |
| D-01 | `规划文档/Spec文档/Release_version_Spec/2026-08-15-v3-v7-总版本索引与分支契约.md` | `516A4D05DFF64BF5B7271783138FCC6E608B9450949456177E4F383EC96EDF77` | 19147 / 274 | 本附录只补 ISSUE-0040 债务，不替换旧索引 |
| D-02 | `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0034-安全基线关闭-spec.md` | `86B457B178B8BFB897DA42189C310C0CD1497D8D7886E7B5278B4905BD57ACF6` | 16590 / 181 | 后续由 ISSUE-0034 close receipt `D5AB0E7D9C166F0E640B1130A4B4A9974624C1574CFD27BE80222C7EE5222DDE` 收口 |
| D-03 | `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0032-邮箱人机验证关闭-spec.md` | `F7939E3BD8769B9BE4CB18335A71B1BC624FD32182827F099F219F8DD36B9073` | 16889 / 191 | 后续由 ISSUE-0032 close receipt `0EEAA8419799C017C96300D74C1E8A443EB56D1C473CF694971AB832D7532AA7` 收口 |
| D-04 | `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0036-联系方式审核关闭-spec.md` | `F37E6AD7BB24F3C52561413B53735FA7B09F2BFFEC1CC2F111646087FF697844` | 21593 / 219 | 后续 V5 范围调整附录 `规划文档/Spec文档/Release_version_Spec/2026-08-25-issue-0036-人工审核延期与暂缓关闭范围调整-spec-addendum.md`，SHA-256=`CC7C520B549D2F8449119A533C455D725331957B2F4EA5AE321F2F317110DA2A`，可复读锚点为 §1.1、§2.1–§2.2、§3–§5.3；该附录与 ISSUE-0036 close receipt `4243F74233FA1BA9011FE2FEC6732614EC424933732A190C1320FDFB6CEC7531` 形成一一对应的收口链 |
| D-05 | `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0038-联系方式审核文档债务关闭-spec.md` | `7248241D9EBE78FC0E6D9491CBAE5BC87C8C3423AA1BC65E6E81DC6AE72AFD46` | 17407 / 175 | 后续 V6 范围调整附录 SHA `563219A51BE647CD72081ABBAC9E06C5CF7D46DA448D504A5E47AE9DEC46A9FE` 与 ISSUE-0038 close receipt `804CAA1A3B5C0183232D497959802A68ED80C4B8E8216DD9C9008794EC8487E9` 形成收口链 |
| D-06 | `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0035-联合Spec文档债务关闭-spec.md` | `B51D37004F5123660FF863E4C8A0776B13F0F044C4AFD8C7438C1638E9F66BF4` | 15120 / 176 | 后续 V7 范围调整附录 SHA `54A331358C55C204E8B17A6C8311014882A2D8B54C13490F04D85CB40D0E2CCB` 与 ISSUE-0035 close receipt `32567B0CBDCB89212C0A20348597054A12F42BB62FFF5C1C48A57B2C60C34968` 形成收口链 |

### 2.1 来源边界

六份清单的字节绑定只证明文件身份和历史/最终文档来源。close receipt 由 ISSUE 管理员拥有，证明对应 Issue 的状态收口，不反向证明本附录或其他 Issue 已关闭。V5/V6/V7 addendum 是实质范围调整后的后续文档，不把原 Spec 的 hash 改写为 addendum hash；任何来源路径、hash、行锚点漂移都进入 `REVIEW_BLOCKED`。

## 3. V3–V7 路线与证据层级

### 3.1 单 Issue 映射

| 顺序 | 版本 / 唯一 Issue | 分支契约 | 当前收口事实 |
| --- | --- | --- | --- |
| V3 | ISSUE-0034 | `V3-issue-0034-security-baseline-closure` | close receipt 已存在；只证明 ISSUE-0034 自身 |
| V4 | ISSUE-0032 | `V4-issue-0032-email-turnstile-closure` | close receipt 已存在；provider/生产语义以其自身记录为准 |
| V5 | ISSUE-0036 | `V5-issue-0036-contact-review-closure` | close receipt 已存在；范围调整和延期边界保留 |
| V6 | ISSUE-0038 | `V6-issue-0038-contact-review-doc-debt-closure` | document-only close receipt 已存在；不恢复 0036 功能 |
| V7 | ISSUE-0035 | `V7-issue-0035-joint-spec-doc-debt-closure` | doc-only close receipt 已存在；N-006 不转为数据库已解决 |

### 3.2 分层证据不可互替

本附录采用旧索引的证据层级：文档/索引绑定、代码实现、本地或集成测试、独立复核、部署/生产、产品/业务验收和 Issue 状态分别取证。V6/V7 的 document-only 收口不得替代功能、生产、业务或数据库证据；close receipt 不替代技术或产品验收；平台版本、DeployId 或文档 hash 不自动证明 Git provenance。

## 4. N1–N6、M1、M4、C2、C3 当前处置矩阵

| 债务 | 当前处置 | 精确证据/规则 | owner / future trigger |
| --- | --- | --- | --- |
| N1 | `CURRENT_CLOSURE_SUFFICIENT`（历史勘误） | 旧索引第 4.1 节的“配置 receipt和已发布旧快照”缺空格仅作为历史原文保留；本附录采用“配置 receipt 和已发布旧快照”。旧 canonical 不改，勘误不改变门禁语义。 | PM/Issue 管理员；若需改旧原文，由旧索引 owner 另行授权 |
| N2 | `CURRENT_CLOSURE_SUFFICIENT`（版本语义澄清） | 旧索引页头的 `目标版本=v2.3.2` 是产品/项目目标版本；编写角色中的 `Agent v2.3.2` 是角色/协调版本。两者不互相替代，不把 Agent 版本写成产品发布版本。 | PM/项目总负责人；命名规则变化时重新冻结 |
| N3 | `CURRENT_CLOSURE_SUFFICIENT`（六份清单） | §2 D-01～D-06 逐条给出完整路径、当前 hash、bytes、lines，并给出 D-02～D-06 的 close receipt 或 material addendum 链；历史草案不被覆盖。 | PM/项目总负责人；任一来源漂移时管理员重新 receipt |
| N4 | `CURRENT_CLOSURE_SUFFICIENT`（适用性限定） | V6/V7 为 doc-only；实现、部署、生产、功能业务验收对本轮均为 `N/A_FOR_CURRENT_CLOSURE`，不写成通过。V3–V5 的适用功能/生产/业务门仍由各自 close chain 单独证明。 | PM/Issue 管理员；若 V6/V7 恢复功能则新 Spec/新证据周期 |
| N5 | `CURRENT_CLOSURE_SUFFICIENT`（保留源分类） | §5.1 逐项列出 V6 的 B/C/D；§5.2 逐项列出 V7 的 A/B/C/D，并绑定 V7 来源附录的精确 path、完整 SHA 与 §3 行锚点。字母只在各源文档内部有效；不把 B 与 A、C 与 D 强行合并成同义状态。 | PM/Issue 管理员；源分类变化时更新交叉 receipt |
| N6 | `CURRENT_CLOSURE_SUFFICIENT`（可复读索引） | §6 按五份关闭 Spec/后续 addendum 索引负例、阈值、fail-closed/unknown；无适用阈值明确写 `N/A` 或转移，不虚构量化值。 | 对应 Spec owner；新行为/阈值冻结后补专项证据 |
| M1 | `CURRENT_CLOSURE_SUFFICIENT`（索引 checklist） | §7 要求六份来源、hash/bytes/lines、状态措辞、分类、base/receipt、关闭状态和残余转移逐项核对，并以 ISSUE-0040 管理员 receipt 收口。 | PM/项目总负责人；任一检查项缺失则 `REVIEW_BLOCKED` |
| M4 | `CURRENT_CLOSURE_SUFFICIENT`（治理策略） | §3 明确串行是业务方确认的治理/排期契约；§8 记录实际 V3→V7 依序收口结果，不把路线说成技术必然依赖。 | 项目总负责人/Issue 管理员；路线调整需新决策记录 |
| C2 | `CURRENT_CLOSURE_SUFFICIENT`（历史歧义统一） | 旧 §3 的确定式串行表述与 §10 的 USER_CONFIRMATION_PENDING 是不同时间/治理层级的历史歧义；本附录保留旧字节，说明在用户确认前为拟议策略，确认后按当前串行治理契约执行。 | 项目总负责人/PM；如路线再变更需新用户决策 |
| C3 | `CURRENT_CLOSURE_SUFFICIENT`（历史不对称解释） | 旧 V7 使用“处理 ISSUE-0035”而非“通过并关闭”，源于 N-006/数据库延期和文档债务门未决；V7 后续 close receipt 只证明其自身在调整后范围收口，不倒改旧表述。 | PM/Issue 管理员；未来扩大范围需新 Spec 与新 receipt |

上述十项的 `CURRENT_CLOSURE_SUFFICIENT` 仅表示本附录已完成当前文档债务的可复读绑定，不等于代码、生产、数据库或项目完成。

## 5. 分类交叉映射（N5）

### 5.1 V6 源分类：B=7、C=5、D=1

V6 原 Spec 的分类语义保持原样：B 是纯文档证据边界，允许绑定冻结文档事实；C 需要 V5 功能/独立复核及适用业务或运行证据；D 需要观察或业务决定。原 V6 的 B 项为 N-001、N-005、N-007、NS-001、NS-002、NS-004、NS-005；C 项为 N-002、N-003、N-004、N-006、NS-006；D 项为 NS-003。V6 后续 addendum 对延期项使用 `N/A_FOR_CURRENT_CLOSURE + TRANSFER_EXISTING_TRACKER`，不将 N/A 写成完成。

### 5.2 V7 源分类：A=5、B=6、C=4、D=0

V7 来源附录为 `规划文档/Spec文档/Release_version_Spec/2026-08-26-issue-0035-现有证据与数据库延期后的文档债务关单范围调整-spec-addendum.md`，SHA-256=`54A331358C55C204E8B17A6C8311014882A2D8B54C13490F04D85CB40D0E2CCB`，精确锚点为 §3 第 55–73 行的 15 项矩阵及计数。按该冻结来源逐项复读：A=5，为 N-001、N-007、N-008、N-009、N-014；B=6，为 N-002、N-004、N-005、N-011、N-012、N-015；C=4，为 N-003、N-006、N-010、N-013；D=0。A/B 共 11 项仍是当前 doc-only 文档绑定候选，C 四项仍是实现/安全/数据库/业务依赖并保持转移/延期，其中 N-006 继续指向 `ISSUE-0031`；任何一项不得被本节的“当前文档债务可复读”改写为已解决。

### 5.3 交叉阅读规则

V6 的 B/C/D 与 V7 的 A/B/C 不是公共枚举。交叉表只说明“各源如何约束证据”，不执行分类转换：V6 B 不自动等于 V7 B，V6 C 不自动等于 V7 C，V6 D 也不自动等于 V7 D。跨 Issue 只允许引用精确 path/hash/anchor/owner/验收层级，禁止以“同一字母”代替证据。

## 6. 负例、阈值与 fail-closed/unknown 索引（N6）

| 来源 | 可复读主题 | 当前适用结论 |
| --- | --- | --- |
| V3 / ISSUE-0034 Close | `协同工作文档/ISSUE/Close_Issue/ISSUE-0034-全站安全基线与加固计划.md`；`D5AB0E7D9C166F0E640B1130A4B4A9974624C1574CFD27BE80222C7EE5222DDE` | 认证、跨账号、源站/伪造头、安全头、失败路径与生产边界 | 只按该 close receipt 的实际范围引用；认证生产证据、回滚/provenance 限制不得抹除 |
| V4 / ISSUE-0032 Close | `协同工作文档/ISSUE/Close_Issue/ISSUE-0032-邮箱验证码发送前人机验证服务端强制校验.md`；`0EEAA8419799C017C96300D74C1E8A443EB56D1C473CF694971AB832D7532AA7` | token verify、action/hostname、replay、send-not-called、provider-neutral 与 provider-specific 分离 | 有效/过期/重放/错 action/错 host/超时/配置失败等按自身 Spec/close receipt 取证；未授权 provider/Secret/生产配置仍不推断 |
| V5 / ISSUE-0036 Close/addendum | close receipt `协同工作文档/ISSUE/Close_Issue/ISSUE-0036-家长需求与老师资料的联系方式快速智能审核.md`；`4243F74233FA1BA9011FE2FEC6732614EC424933732A190C1320FDFB6CEC7531`；addendum `规划文档/Spec文档/Release_version_Spec/2026-08-25-issue-0036-人工审核延期与暂缓关闭范围调整-spec-addendum.md`；`CC7C520B549D2F8449119A533C455D725331957B2F4EA5AE321F2F317110DA2A` | 确定性扫描优先、unknown 转人工、联系方式默认隐藏、AI/OCR/出域及 flag-off 边界 | V5 原 Spec/addendum/close chain 的实际证据分层引用；人工/AI/生产证据不由 ISSUE-0040 补写 |
| V6 / ISSUE-0038 Spec/addendum | 原 Spec `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0038-联系方式审核文档债务关闭-spec.md`；`7248241D9EBE78FC0E6D9491CBAE5BC87C8C3423AA1BC65E6E81DC6AE72AFD46`；addendum `规划文档/Spec文档/Release_version_Spec/2026-08-25-issue-0038-0036延期关闭后的文档债务关单范围调整-spec-addendum.md`；`563219A51BE647CD72081ABBAC9E06C5CF7D46DA448D504A5E47AE9DEC46A9FE` | B/C/D 的文档采纳、V5 bounded evidence、生产 AI/人工审核/flag-on 不适用路径 | C/D 缺证据写 N/A/转移；文档-only 不产生部署/生产通过 |
| V7 / ISSUE-0035 Spec/addendum | 原 Spec `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0035-联合Spec文档债务关闭-spec.md`；`B51D37004F5123660FF863E4C8A0776B13F0F044C4AFD8C7438C1638E9F66BF4`；addendum `规划文档/Spec文档/Release_version_Spec/2026-08-26-issue-0035-现有证据与数据库延期后的文档债务关单范围调整-spec-addendum.md`；`54A331358C55C204E8B17A6C8311014882A2D8B54C13490F04D85CB40D0E2CCB` | N-003 越权/枚举/跨账号负例、N-006 数据库迁移依赖、N-010 补偿事务、N-013 反馈数据边界 | N-003/N-010/N-013 无专项证据不关闭；N-006 明确转 ISSUE-0031，不启动数据库 |

阈值规则：某源 Spec 已明确的数字、状态枚举、次数或窗口只能在该源的适用证据中复读；本附录不新造阈值。源文档没有适用阈值时写 `N/A`、`PENDING` 或 `TRANSFER_EXISTING_TRACKER`，同时保留 owner 和 future trigger。任何 unknown、缺来源、错 hash、不能回读、跨账号/权限不明、审计缺失、失败产生部分副作用的路径均按源 Spec 的 fail-closed 规则处理，不得用 ISSUE-0040 文档状态放行。

## 7. 索引级完成 checklist（M1）

ISSUE 管理员独立 receipt 至少逐项确认：

1. D-01～D-06 六份来源均存在、可回读，path/hash/bytes/lines 与 §2 一致。
2. D-02～D-06 的 close receipt/addendum 链与其 Issue 一一对应，没有把 addendum hash 改写成原 Spec hash。
3. V3→V7 唯一 Issue、分支名、治理串行语义和“非技术必然依赖”措辞一致。
4. V6/V7 doc-only 的实现、部署、生产、功能业务验收门均有适用 `N/A`，没有功能/生产过度声明。
5. V6 B/C/D 按 §5.1 复读；V7 按 §5.2 的冻结 path/SHA/§3 第 55–73 行逐项核验 A={N-001,N-007,N-008,N-009,N-014}、B={N-002,N-004,N-005,N-011,N-012,N-015}、C={N-003,N-006,N-010,N-013}、D=0，并确认 11 current/4 transfer、N-006→ISSUE-0031、N-003/N-010/N-013 的 owner/trigger 均未漂移。
6. 五份关闭 Spec/后续 addendum 的负例、阈值、fail-closed/unknown 主题均有来源入口；没有无来源的阈值结论。
7. base receipt、Issue closure receipt、技术/产品/业务/生产证据没有互相替代；dirty/staged/untracked 不被文档索引默认为已携带或已清理。
8. ISSUE-0040 的十项债务均有唯一当前处置、证据、owner 和 future trigger；任何循环引用、hash 漂移或状态夸大均 `REVIEW_BLOCKED`。

## 8. 安全、隐私、失败、回滚与禁止结论

- 本附录不复制 Secret、token、Cookie、账号凭据、未成年人原文或生产业务数据；只保存公开的路径、摘要 hash、状态和证据边界。
- 引用失效、来源 hash 不符、close receipt 与实际状态冲突、循环引用、把转移项写成 resolved，均停止文档采纳并标记 `REVIEW_BLOCKED`。
- 本附录的文档回滚点是旧总索引及本附录新增字节；不得删除旧 Hermes/QA/Issue 记录。任何代码/生产回滚由对应版本的实际 receipt owner 负责，不能由本索引猜测平台 revision。
- 不得声称 ISSUE-0031 已解决、数据库迁移已完成、V3–V7 功能/生产全部通过、V6/V7 已产生功能部署证据、任何分支完成自动关闭 Issue，或项目 workflow 已完成。
- 本附录不修改任何 Issue canonical/state/总表；`ISSUE-0040` 是否关闭只能由 ISSUE 管理员在独立复读后决定。

## 9. 审查、用户确认与唯一下一步

本附录是用户“继续”授权下的 ISSUE-0040 保守 doc-only 产物。Hermes CLI `deepseek-v4-pro` 新周期 Round 1/3 已完成，`canonical_source_unchanged=true`、`default_model_changed=false`，正文 verdict=`REWORK_REQUIRED` 且 SERIOUS=1；该完整 SERIOUS 批次已交登记的 Document QA owner 整改，共享计数不重置。Round 1 NON_SERIOUS N1–N4 仍由 Issue 管理员登记，本次 QA 不做措辞返工。

若 Round 1 SERIOUS=0，文档门可记为 `DOCUMENT_GATE_PASSED / USER_CONFIRMATION_PASSED`（用户确认仅覆盖本附录的 ISSUE-0040 保守 doc-only 范围），随后由 ISSUE 管理员独立登记非阻塞债务、复读十项矩阵和关闭条件。Hermes、用户确认或本附录均不自动关闭 Issue。

唯一下一步：项目总负责人路由原产品经理执行 focused Hermes `deepseek-v4-pro` Round 2/3，仅复核 S1 与受影响回归；本 Document QA 线程不运行 Hermes，不进入代码、分支、npm、Git mutation、部署、平台、数据库、支付或 Issue 状态修改。
