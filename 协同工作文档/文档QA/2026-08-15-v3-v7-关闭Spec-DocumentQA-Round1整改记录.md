# V3–V7 关闭 Spec｜Document QA Round 1 SERIOUS 整改记录

> 任务 ID：V3-V7-CLOSURE-SPECS-DOCQA-R1-20260815  
> 执行角色：Document QA v2.3.2（019fefa7-c5cf-7e62-9859-5263998dfd77 / DocumentQAv2.3.2）  
> 模型配置：gpt-5.6-sol / high  
> 共享审查轮次：Hermes Round 1/3；本次整改不重置轮次  
> 状态：SERIOUS_BATCH_REMEDIATED；不是审查通过、用户批准、实现授权、分支完成、部署、生产验收或 Issue 关闭

## 1. 输入完整性

下列 5 份源文件与 5 份 Hermes Round 1 报告均在写入前完整读取，SHA-256 与任务包一致：

| 文件 | 输入 SHA-256 |
| --- | --- |
| 2026-08-15-v3-v7-总版本索引与分支契约.md | 65C86972E72916FF432A7ABC27A30A061DC07422C91693DD5E7EA023CA6F87F0 |
| 2026-08-15-v3-v7-总版本索引与分支契约-hermes-round-1.md | FC01EAA2480D85A167F18970047F7D63E48CD937F138A2CA84E464C0F41FF766 |
| 2026-08-15-issue-0034-安全基线关闭-spec.md | 981817C7855CFE60F2F7FC08962BF39F63FD59688B781CFFB689A50C0BAA60A6 |
| 2026-08-15-issue-0034-安全基线关闭-hermes-round-1.md | F90F690E52C149918A8CBABEDE1888AAA456EDF87D9A2C24E6A1F0ECC6748EB1 |
| 2026-08-15-issue-0032-邮箱人机验证关闭-spec.md | B8143F159E9C03FA4525F7EF295454AD9EF166262345080DF1782C3427136397 |
| 2026-08-15-issue-0032-邮箱人机验证关闭-hermes-round-1.md | B0EAF7A5B89A7FBF1478698FB35601F8F4087DEDC41F9143F9E67501C7218499 |
| 2026-08-15-issue-0036-联系方式审核关闭-spec.md | 94A60700F056294E7C1DA98787F21686EDEB28E5971BBB9ADA8F02AB0801F2EA |
| 2026-08-15-issue-0036-联系方式审核关闭-hermes-round-1.md | 26DB77C8D9EBEB7B5BE0DFDE62F8950184E7EA7566E7BBF82493633CDD82C536 |
| 2026-08-15-issue-0038-联系方式审核文档债务关闭-spec.md | EACF6606C2FDD9D8E478FF488A39323CF578DF4652684627C38C88797CC38672 |
| 2026-08-15-issue-0038-联系方式审核文档债务关闭-hermes-round-1.md | 2151DC34C2E6757DF65266E1568CC1DFD9CB438D1DCBEA540877B95D51371C1E |

V7/ISSUE-0035 源文件只读基线为 SHA-256 `B51D37004F5123660FF863E4C8A0776B13F0F044C4AFD8C7438C1638E9F66BF4`、15,120 bytes、176 行；该文件无 SERIOUS，本轮未修改。

## 2. 11 项 SERIOUS 修订矩阵

| # | 文件 / finding | 修订位置 | 严重项修订 | 受影响回归同步 |
| --- | --- | --- | --- | --- |
| 1 | 总索引 S1 | §3、§4.1、§5.2–§5.5、§10 | 区分分支创建所需 `BRANCH_BASE_RECEIPT` 与 Issue canonical 关闭 `ISSUE_CLOSURE_RECEIPT`，明确二者不可等同或替代；严格 Issue 关闭串行保持 USER_CONFIRMATION_PENDING | 五版本入口表、V4–V7 入口条目和用户确认门统一到同一强度 |
| 2 | 总索引 S2 | §4.2–§4.4、§10–§11 | 增加 V3 provenance 建立程序、代码/验收/独立复核/总负责人 owner、可核验证据判据和失败回退；known HEAD 不得预填为已验收 base | 将“V3 精确 SHA 由用户选择”改为技术 provenance 阻塞；只有无法恢复时才提出重新基线/具名风险接受并由用户确认 |
| 3 | V3 SF-1 | §2.3、§5 V3-S1、§8 | 冻结 401/403/404 语义：未认证=401；对象不存在/删除/非 owner/不可见=统一 404；403 仅限冻结契约允许的非对象动作权限 | 增加规范化响应体、同一可接受时延类别和批量枚举不可区分的负例 |
| 4 | V3 SF-2 | §5 V3-S2、§8 | 为公开域名→Worker→CloudBase/源站边界补完整验收矩阵 | 同步覆盖 TLS/canonical 路由、apex/www path/query、未知 Host、直连源站、伪造 Host/证明/Header 与替代入口绕过 |
| 5 | V4 S1 | §6 参数 receipt、V4-S0/S1、§8.1、§9 | 定义 `V4_PARAMETER_RECEIPT` 的 TTL、超时、host/action、消费标记、组合限流、provider 映射、环境、owner/批准人/hash；参数未冻结不得执行验收或给 PASS | 本地边界值、provider-specific 阶段、停止条件和验收骨架统一引用精确 receipt |
| 6 | V4 S2 | §2.1、§3.2、§6、V4-S0/S1、§7–§10 | 无障碍替代路径改为未定义/未批准候选；产品经理提出、业务批准、实现 owner 执行、独立产品/UI/安全复核 | 失败路径、服务端同门禁、常规挑战基础无障碍、停止条件和验收结果统一为 receipt 前 N/A/PENDING |
| 7 | V5 S1 | §2、§3.1、§5.1–§5.2、V5-S2、§8.1、§9 | 唯一状态枚举冻结为 draft/pending_review/needs_manual_review/published/rejected/appeal_pending/deleted | 同步规范化失败、人工队列、申诉编辑、deleted 恢复和全部状态负例；清除 pending/manual/appeal/no-go 别名 |
| 8 | V5 S2 | §2.1、§5.2、V5-S2、§9 | 冻结 7 类结果及“分类→状态”映射；分类本身不得直接发布/拒绝 | 同步 owner/entity/version/hash 与审计前置、两条申诉路径及 deleted→pending_review |
| 9 | V5 S3 | V5-S1/V5-S3、§7、§9 | 增加仅合成/去标识语料 manifest、自动扫描+人工抽检零真实 PII 门；增加结构化日志/审计 allowlist 与样本扫描 | fixture、prompt、截图、日志和 AI 测试环境统一纳入；任一真实 PII 或越界日志字段即阻塞 |
| 10 | V6 S-01 | §1.1、§5 `B_HANDLING_MATRIX`、§8 | 冻结 B=7/C=5/D=1 的证据边界：B 仅文档事实，C 必须 V5 accepted evidence，D 仅观察/业务；N-001/N-007 绑定既有 0036 Spec 的完整路径/hash/行段 | 删除 N-001 对 V5 功能段落的依赖和 N-007 对新业务确认的依赖；验收标准同步分层 |
| 11 | V6 S-02 | §2.4、§5 标题、§8 | 定义 B 项唯一落盘为本文件 `B_HANDLING_MATRIX`；最终精确路径/hash 经 Hermes/Document QA、必要业务确认和 Issue 管理员采纳后才具权威 | 未采纳前保持 Open/DRAFT_NON_CANONICAL；需要改源文档或运行规则时停止并回到原 owner/新授权 |

## 3. 修订后源文件指纹

| 源文件 | SHA-256 | 字节数 | 行数 |
| --- | --- | ---: | ---: |
| 2026-08-15-v3-v7-总版本索引与分支契约.md | 516A4D05DFF64BF5B7271783138FCC6E608B9450949456177E4F383EC96EDF77 | 19,147 | 274 |
| 2026-08-15-issue-0034-安全基线关闭-spec.md | 86B457B178B8BFB897DA42189C310C0CD1497D8D7886E7B5278B4905BD57ACF6 | 16,590 | 181 |
| 2026-08-15-issue-0032-邮箱人机验证关闭-spec.md | F7939E3BD8769B9BE4CB18335A71B1BC624FD32182827F099F219F8DD36B9073 | 16,889 | 191 |
| 2026-08-15-issue-0036-联系方式审核关闭-spec.md | CEA06C42018223C3A45E6E62FDC9047041E025A3654A678FB2E13ECEEE2F563E | 17,488 | 198 |
| 2026-08-15-issue-0038-联系方式审核文档债务关闭-spec.md | 8E837657F525176844F7E3E62C43F97864A719D3077FB76DE448E5AF4BC5294D | 14,770 | 170 |

## 4. 保留门禁与越权核对

- 路线保持 V3→0034、V4→0032、V5→0036、V6→0038、V7→0035；0031 不进入本轮；数据库和全部付费动作继续延期。
- 总索引、V3、V4、V5 仍为 DRAFT_NON_CANONICAL / USER_CONFIRMATION_PENDING；V6 仍为 DRAFT_NON_CANONICAL / UPSTREAM_GATE_BLOCKED。
- V6 的 V5_ACCEPTED_EVIDENCE_REF 阻塞未消失；V7 的 ISSUE-0031/N-006 冲突未消失。
- 本轮仅处理上述 11 项 SERIOUS 及直接受影响回归；未处理任何 Hermes 报告中的 NON_SERIOUS、Missing Acceptance Criteria、措辞或可选增强。
- 未运行 Hermes，未自我批准；未运行 npm，未执行 Git mutation，未部署，未操作 Cloudflare/CloudBase，未创建任务/subagent。
- 未修改 V7/0035 源文档、Hermes 报告、Issue canonical/state/总表、CONTEXT、中央总览/注册、产品经理记录、代码、UI、平台配置或其他角色文件。
- 最终回读时检测到外部并发更新：`ISSUE总表.md` 已由冻结输入 SHA-256 `0C404DE8612EA69956E5EC588AEF7225C49F7D29B9E2ACD4559C40E025A2F316` 变为 `8ABD40D9F286B7C5DCE4F79C7C32345BA9665CFED714EEC4CD2C1AA7FA0F7252`，新增 ISSUE-0040～0045 的 NON_SERIOUS 台账并登记 ISSUE-0020 关闭；原 0031/0032/0034/0035/0036/0038 状态未因该批登记改变。本角色未写该禁改文件，也未把并发 NON_SERIOUS 内容并入本冻结批次；总负责人发起 Round 2 时须复读并冻结当前 canonical relation。

## 5. 唯一下一步

项目总负责人回读本批次修订文件并以修订后精确 hash 发起 Hermes Round 2。该动作不构成用户批准、实现授权、分支完成、部署、生产验收或 Issue 关闭。

## 6. 2026-08-15｜V6 Round 2 S-03 严重回归整改

> 任务 ID：V6-ISSUE-0038-DOCQA-R2-S03-20260815  
> 共享审查轮次：Hermes Round 2/3；本次整改不重置轮次，下一轮为最终 Round 3/3  
> 状态：S03_REMEDIATED；不是文档通过、用户批准、实现授权、部署、生产验收或 Issue 关闭

### 6.1 输入与冻结选择

- 输入 V6 Spec SHA-256：`8E837657F525176844F7E3E62C43F97864A719D3077FB76DE448E5AF4BC5294D`。
- Round 1 报告 SHA-256：`2151DC34C2E6757DF65266E1568CC1DFD9CB438D1DCBEA540877B95D51371C1E`。
- Round 2 报告 SHA-256：`72A02E04B29DCB2724231E4DD29915F7C706F9408B1333DF9244CA5340F6862A`；唯一 SERIOUS 为 S-03。
- 采用 Round 2 Correction 1：保持 B=7/C=5/D=1，不重新分类。B 项只走冻结 0036 Spec/已批准交叉引用文档复读、绑定最终 V6 hash 的 Hermes/Document QA、ISSUE 管理员采纳 receipt；业务确认、业务证据、新业务确认仅适用于 C/D 已定义门禁。
- 本节替代本记录 §2 第 11 行中“B 项必要业务确认”的旧 Round 1 记述；旧行保留为历史，不再作为当前 B 项采纳契约。

### 6.2 S-03 修订映射

| 位置 | 修订 | 受影响回归 |
| --- | --- | --- |
| V6 §1.1、§2.1 | 明确 B 为纯文档证据边界，并把 B 与 C/D 的引用链分开 | B=7/C=5/D=1 保持；C/D 功能、观察、业务门未删除 |
| V6 §2.4 | 删除“涉及业务语义时取得业务确认”；定义 B 三层采纳链及业务证据/业务确认/新业务确认三者只属于 C/D | 产品语义不会侧向触发 B 业务签字；若须改变冻结源规则则停止并回原 owner/新授权 |
| V6 §3.2、§6、§7、§10 | ISSUE 管理员负责 B 路径/hash receipt；业务方仅处理 C/D；关闭链分别表述 | 保留 0038 整体 C/D 业务门和 Issue 管理员关单门，不把 B 文档采纳写成功能/业务通过 |
| V6 §5 七个 B 行 | N-001/N-005/N-007/NS-001/NS-002/NS-004/NS-005 均显式排除业务确认、业务证据、新业务确认 | N-007 不再要求或伪造任何业务前置；其他产品语义 B 行无隐含触发 |
| V6 §8 第2/7/9/10条 | 第 2/9 条与 Correction 1 对齐；新增逐项可测判据：7 个 B 的业务前置项计数必须为 0 | B 只验冻结路径/hash/段落、最终 V6 hash 的 Hermes/Document QA、ISSUE 管理员采纳 receipt；缺一保持 Open |

### 6.3 输出与保留门禁

- 修订后 V6 Spec SHA-256：`7248241D9EBE78FC0E6D9491CBAE5BC87C8C3423AA1BC65E6E81DC6AE72AFD46`；17,407 bytes；175 行。
- 未处理 Round 2 N-08，也未处理 Round 1 NON_SERIOUS/Missing Acceptance Criteria；N-08 仍由 ISSUE 管理员登记。
- `DRAFT_NON_CANONICAL / AUTHOR_DRAFT / UPSTREAM_GATE_BLOCKED`、`V5_ACCEPTED_EVIDENCE_REF`、用户确认门和 V3→V4→V5→V6→V7 路线均未改变。
- 未运行 Hermes/npm，未执行 Git mutation，未部署，未操作平台，未创建任务/subagent，未修改任何报告、Issue/总表、CONTEXT、中央文件、代码/UI、平台/角色文件或其他草案；不自我批准。

### 6.4 唯一下一步

项目总负责人完整回读本轮 V6 新 hash，并执行 V6 Hermes Round 3/3（最终轮）。若 Round 3 仍有 SERIOUS，必须进入 DOCUMENT_REVIEW_LIMIT_REACHED，不得自动开启 Round 4。
