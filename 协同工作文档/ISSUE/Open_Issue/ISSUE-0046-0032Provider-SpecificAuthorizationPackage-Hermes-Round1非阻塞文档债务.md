# ISSUE-0046：0032 Provider-Specific Authorization Package Hermes Round 1 非阻塞文档债务

## 基本信息

- Issue ID：`ISSUE-0046`
- 类型：documentation / non-blocking review improvement
- 状态：`open`
- 工作流状态：`NON_BLOCKING_DOCUMENT_REVIEW`
- 优先级：`P3`
- 来源 canonical package：`规划文档/Spec文档/Release_version_Spec/2026-08-20-v4-issue-0032-provider-specific-authorization-package.md`；SHA-256=`9C1D6E4CC505F1B0A3B06E5F2A64618573D4D70ADA1A1CDA1C15D704160A5142`
- 来源 Hermes Round 1：`规划文档/Spec文档/Release_version_Spec/2026-08-20-v4-issue-0032-provider-specific-authorization-package-hermes-round-1.md`；SHA-256=`CE917BAB5F5B3054A0E2A308FCC1121C6AD1EBCE6589CE13110209B2F8195A72`
- Hermes metadata：同名 `.metadata.json`；SHA-256=`41287DEF24F2C8719AB1645372E21E09662E28061084BAD6A7C0375C6CB77A46`；轮次=`1/3`；模型=`deepseek-v4-pro`；`canonical_source_unchanged=true`
- owner：provider-specific authorization package owner / 项目总负责人；产品与安全 owner 对参数和证据语义负责；ISSUE 管理员仅维护本台账。
- 与 ISSUE-0032 的关系：本 Issue 只追踪 ISSUE-0032 provider-specific authorization package 的 Hermes Round 1 NON_SERIOUS 文档债务；不改变 ISSUE-0032 主状态，不授权代码、provider、Secret、平台、部署、生产或业务验收。

## 登记边界

- 本批只登记报告中的 N1–N5，均为 `open / NON_BLOCKING_DOCUMENT_REVIEW`；不阻断当前文档严重项整改，但须在未来触发条件满足后关闭。
- 报告中的 S1/S2 为 `SERIOUS`，已由项目总负责人另行处理；本 Issue 不修改、降级、关闭或替代 Document QA 的严重批次。
- 本 Issue 不修改 package、Hermes report、metadata、QA、Spec、产品记录、代码、UI、平台配置、ISSUE-0032 canonical 或 ISSUE-0042 canonical。
- ISSUE-0042 继续仅承载 0032 关闭 Spec/参数回执 Round 1/2 的既有非阻塞台账；本批 provider-specific package findings 不与其混并，也不重复改写其 N1–N9。

## Hermes Round 1 NON_SERIOUS 逐项登记

来源报告统一为：`规划文档/Spec文档/Release_version_Spec/2026-08-20-v4-issue-0032-provider-specific-authorization-package-hermes-round-1.md`；SHA-256=`CE917BAB5F5B3054A0E2A308FCC1121C6AD1EBCE6589CE13110209B2F8195A72`。

| finding | 事实与影响 | 状态 | owner | future closure trigger |
| --- | --- | --- | --- | --- |
| N1 | package 元数据仍写 `CURRENT_REVIEW_ROUND=0/3`，与本次 Hermes Round 1/3 执行状态不一致；会误导后续审查轮次与 receipt 绑定判断。来源 hash=`CE917BAB5F5B3054A0E2A308FCC1121C6AD1EBCE6589CE13110209B2F8195A72`。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | provider-specific authorization package owner / 项目总负责人 | 在获授权的 package 修订中更新当前轮次与 metadata/receipt 绑定，形成新 hash，并经 ISSUE 管理员独立回读；不得仅凭本次登记预判关闭。 |
| N2 | `POST_PUSH_COMMIT_ATTESTATION_PASS` 在 §2.1 被引用为上游输入，但未进入 §2.2 receipt index，缺少 hash/bytes/lines，追溯链不完整。来源 hash=`CE917BAB5F5B3054A0E2A308FCC1121C6AD1EBCE6589CE13110209B2F8195A72`。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | provider-specific authorization package owner / 项目总负责人；独立复核 owner 提供回执 | 将该回执以完整路径、SHA-256、字节数、行数和用途加入 §2.2，并以新 package hash/独立复读证据确认；不得把上游输入现有断言写成已完成追溯。 |
| N3 | §2.3 将参数候选与用户参数确认记录的措辞略混，容易使两个独立来源被误读为同一文档或同一确认动作。来源 hash=`CE917BAB5F5B3054A0E2A308FCC1121C6AD1EBCE6589CE13110209B2F8195A72`。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | provider-specific authorization package owner / 产品经理 | 明确参数候选与参数确认记录的独立路径、角色、SHA 和关系，经产品/项目总负责人确认后形成新 hash 并独立回读。 |
| N4 | §5 列出 7 张截图，但未逐张映射其支持事实（widget 名称、hostname、CloudBase 变量名称等），削弱 §9 “仅掩码证明”的证据粒度，且不得据此扩张为未证明的 provider/Secret 结论。来源 hash=`CE917BAB5F5B3054A0E2A308FCC1121C6AD1EBCE6589CE13110209B2F8195A72`。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | provider-specific authorization package owner / 证据 owner | 建立逐张 screenshot → supported fact 映射，并标明证据边界、脱敏限制和不可证明事项；形成新 hash/独立复读后关闭。 |
| N5 | `TURNSTILE_EXPECTED_HOSTNAMES` 已命名，但编码/分隔格式（单值或多值）未定义；若由 S1 修订直接吸收，也必须在未来触发复核后才能关闭，不能预判已关闭。来源 hash=`CE917BAB5F5B3054A0E2A308FCC1121C6AD1EBCE6589CE13110209B2F8195A72`。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | provider-specific authorization package owner / 产品与安全 owner | 在 S1 修订或独立后续修订中明确 exact allowlist 的编码、分隔与禁止 wildcard 语义，补充对应验收/证据并经独立回读；S1 的存在不自动关闭 N5。 |

## 严重项与既有门禁路由

- S1（minimum binding relationship 未枚举）与 S2（观察窗口/停止阈值未量化）保持 `SERIOUS`，由项目总负责人另行处理；本 Issue 不把它们降级为 NON_SERIOUS，也不声称 Document QA 或 Hermes Round 2 已完成。
- `ISSUE-0032` 仍保持 `open / IMPLEMENTATION_AUTHORIZATION_PENDING`；本 Issue 的登记不等于参数确认、实现授权、provider/Secret 授权、平台/生产验证或 Issue 关闭。
- 项目 workflow 保持 `WORKFLOW_ACTIVE`；ISSUE-0031、数据库及全部付费动作继续延期。
- 新 Issue 加入后 Active Open 应为 12 项：`ISSUE-0031/0032/0035/0036/0038/0040/0041/0042/0043/0044/0045/0046`。

## 关闭条件与唯一下一步

- 关闭触发：N1–N5 各自 future closure trigger 均满足；package/metadata/receipt/证据映射形成可复读的新 hash；适用的独立复核完成；且不得以本 Issue 关闭替代 S1/S2 严重整改或 ISSUE-0032 的实现/生产/业务门禁。
- 当前明确口径：本 Issue 不阻断当前文档严重项整改，但须在未来触发条件满足后关闭；不等于 package 已获实现授权，不等于 provider/Secret/平台/生产已通过。
- 唯一下一步 / 下一责任人：等待项目总负责人完成 S2 用户决策与 Document QA 严重批次整改。

## 2026-08-20 Hermes Round 2 NON_SERIOUS 追加登记

- 最终 canonical package：`规划文档/Spec文档/Release_version_Spec/2026-08-20-v4-issue-0032-provider-specific-authorization-package.md`；SHA-256=`56D8C7060A10F996A58DC9F30CCE767F07537B9EF90AB6F69DDB59D098E30EFC`，41113 bytes / 379 lines。
- Document QA ledger：`协同工作文档/文档QA/2026-08-20-v4-issue-0032-provider-specific-authorization-package-DocumentQA-Round1整改记录.md`；SHA-256=`F77141594E9B420E6CD8C436C0D30804B1063664EC132D91480B8BEB10A4290C`，9696 bytes / 83 lines。该账本确认共享文档审查门 0 SERIOUS，R1 N1–N5 仍由 ISSUE-0046 追踪；不因本次登记关闭任何 N 项。
- Hermes Round 2 报告：`规划文档/Spec文档/Release_version_Spec/2026-08-20-v4-issue-0032-provider-specific-authorization-package-hermes-round-2.md`；SHA-256=`B83E042B9032498812A1A5FBB04CD735EA88B58437FEA51A4A1630685AA937A0`；结论=`PASS_WITH_NONBLOCKING_OPEN_ISSUES`、`SERIOUS=0`。
- Hermes Round 2 metadata：同名 `.metadata.json`；SHA-256=`49396FEB08F60BBABBF4748BBC5D36FE5D80270732A6C889E60D89FA193F08A5`；轮次=`2/3`；模型=`deepseek-v4-pro`；`canonical_source_unchanged=true`；`default_model_changed=false`。共享审查门满足 0 SERIOUS，不自动执行 Round 3；后续状态由项目总负责人另行设置为 `DOCUMENT_GATE_PASSED / USER_CONFIRMATION_PENDING`。
- 本批仅追加 R2-N1–R2-N5，均保持 `open / NON_BLOCKING_DOCUMENT_REVIEW`；R2-N1 与既有 N1 合并追踪，不新建重复条目；不修改 R1 N1–N5 的原事实、状态或关闭触发。

| Round 2 finding | 与既有台账关系 | 事实与影响 | 状态 | owner | future closure trigger |
| --- | --- | --- | --- | --- | --- |
| R2-N1 | 合并追踪既有 N1 | `CURRENT_REVIEW_ROUND=0/3` 与已完成 Round 1/当前 Round 2 状态不一致，可能误导审查历史与 rework provenance。来源 report SHA=`B83E042B9032498812A1A5FBB04CD735EA88B58437FEA51A4A1630685AA937A0`。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | provider-specific authorization package owner / 项目总负责人 | 统一 package、metadata 与既有 N1 的状态元数据，形成新 hash，并经 ISSUE 管理员独立回读；在此之前不关闭既有 N1 或 R2-N1。 |
| R2-N2 | Round 2 新增，独立登记 | 文档未自包含 S1/S2 与 ISSUE-0046 N5 的定义或最小来源指针，读者需要跨文件重建严重项与关联非阻塞项边界。来源 report SHA=`B83E042B9032498812A1A5FBB04CD735EA88B58437FEA51A4A1630685AA937A0`。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | provider-specific authorization package owner / 项目总负责人 | 补充最小定义与来源指针，明确 S1/S2 仍为 SERIOUS、N5 仍为非阻塞，并经独立回读形成新 hash；不在本台账中处理为 SERIOUS。 |
| R2-N3 | Round 2 新增，独立登记 | “参数方案 B”与“观察方案 A”共用“方案”命名空间，可能造成参数决策与生产观察计划的交叉误引；无当前技术效果。来源 report SHA=`B83E042B9032498812A1A5FBB04CD735EA88B58437FEA51A4A1630685AA937A0`。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | provider-specific authorization package owner / 产品经理 | 使用明确前缀（如“参数方案 B”“观察方案 A”）并经产品/项目总负责人独立回读，形成新 hash 后关闭。 |
| R2-N4 | Round 2 新增，独立登记 | 24h 样本的时间分布及是否允许聚类未固定，使“1h 5% 且 n>=10”条款的可达性不清；仍可按连续 2 次及累计 3/24 条款执行，因此保持 NON_SERIOUS。来源 report SHA=`B83E042B9032498812A1A5FBB04CD735EA88B58437FEA51A4A1630685AA937A0`。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | 观察方案 owner / 项目总负责人 / 产品与安全 owner | 明确 24h 采样时间分布或聚类规则，并由独立复核确认 1h、连续 2 次及累计 3/24 条款仍可执行；形成新 hash 后关闭。 |
| R2-N5 | Round 2 新增；与 R1 N5 的 hostname 格式项不同 | `TECH_REVIEW R1` 与 Hermes Round 1 的裸 `R1` 容易混淆，可能造成两条独立审查链 provenance 误引。来源 report SHA=`B83E042B9032498812A1A5FBB04CD735EA88B58437FEA51A4A1630685AA937A0`。 | `open / NON_BLOCKING_DOCUMENT_REVIEW` | provider-specific authorization package owner / 技术复核 owner | 将裸 `R1` 限定为 `TECH_REVIEW R1` 或等价明确命名，并经独立回读形成新 hash 后关闭。 |

### Round 2 边界与当前状态

- R2-N1–R2-N5 均为非阻塞追加，不触发 Document QA，不修改或降级任何 SERIOUS；R1 的 S1/S2 已由 QA 整改并经 Round 2 复核为 0 SERIOUS，但不等于 provider-specific 实现、平台、部署、生产或业务通过。
- `ISSUE-0032` 继续保持 `open / IMPLEMENTATION_AUTHORIZATION_PENDING`；`ISSUE-0046` 继续 `open / NON_BLOCKING_DOCUMENT_REVIEW`；Active Open 继续精确为 12 项；项目 workflow 保持 `WORKFLOW_ACTIVE`。
- 本次 Round 2 追加不授权代码、provider/Secret、平台、部署、生产、业务验收或 ISSUE-0032/0046 关闭；ISSUE-0031、数据库及全部付费动作继续延期。
- 唯一下一步 / 下一责任人：项目总负责人向用户请求 provider-specific 最小代码接线与测试的大动作确认。
