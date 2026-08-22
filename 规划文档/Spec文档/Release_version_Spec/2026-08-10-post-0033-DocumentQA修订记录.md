# POST-0033 Document QA 修订记录

## Round 1/3｜POST0033-DOCQA-R1-SERIOUS-BATCH-20260810

| 字段 | 值 |
| --- | --- |
| 执行角色 | Document QA v2.3.0 / `019fbd2e-5b12-7f41-88db-f30489656a5f` |
| Canonical 草案 | `2026-08-09-post-0033-分阶段执行草案.md` |
| 输入 source SHA-256 | `D2C9C03E6ED74B20B0F92BD9966D32644586A4066C402693311AFB2B32482CFA` |
| Hermes Round 1 报告 | `2026-08-10-post-0033-hermes-round-1.md` |
| 报告 SHA-256 | `AB4CAA3C470917E0F367175A663653A35351AB0A91EAB923C8956C45570FD14D` |
| Round 1 metadata | `2026-08-10-post-0033-hermes-round-1.md.metadata.json` |
| metadata SHA-256 | `339FC33A3AB36684EFF85FD003984FD210E8E864609CC30953E09692C8CB75E1` |
| 审查模型 / 计数 | `deepseek-v4-pro` / `1 / 3`；本次不重置计数 |
| 输出 source SHA-256 | `427216758E4F9E9F434E48FE8F5609825037558ACF760C175366AF83724ED259` |
| 输出 source 大小 | `36,349 bytes` |
| 输出 source 行数 | `438`（`rg -n` 最后一行号；文件以 LF 结尾） |
| QA 状态 | `QA_DOCUMENT_REWORK_COMPLETE`；不是 `DOCUMENT_GATE_PASSED` |

## SERIOUS 批次映射

| Finding | 原位置与风险 | 新位置 | 修订与理由 | 验证 |
| --- | --- | --- | --- | --- |
| S-001 | §7–§9 多处依赖未定义的 D4/D6/D7，缺 owner、变量、值域、冻结证据和无法冻结时的降级路径，导致所有阶段前置条件不可判定 | §4.5 D4/D6/D7 决策表；§7.1、§8、§9 对应阶段门；§13.1–§13.2 | 为每个门补责任角色/证据 owner、待冻结变量、建议安全骨架、确认材料、最迟点和延期/终止/fail-closed；明确建议值不是业务批准值且只能收紧 | `rg` 核对 D4/D6/D7 三行、各阶段引用、`TECH_REWORK_REQUIRED` 和冻结前停止规则；未写入任何真实供应商、预算或 secret |
| S-002 | §1.3、§11 仅写 `EXTERNAL_BLOCKED` 与“外部 owner 可并行”，未说明 UNKNOWN owner、联系窗口、升级路径或超时处置，阻塞不可解 | §11 ISSUE-0020 独立外部阻塞 | 明确外部执行 owner/联系窗口/替代账号均 `UNKNOWN`；总负责人只路由，ISSUE 管理员维护状态；T+1/T+3/T+5 或三次请求升级，无法路由则暂停，持续 `EXTERNAL_BLOCKED` | `rg` 核对 `UNKNOWN`、升级节奏、`EXTERNAL_BLOCKED` 和“不虚构替代人”；未改变 Issue canonical |
| S-003 | §1.1、§5 将 Round 3 报告正文与 sidecar 的 pending/SHA 差异作为待修正项，未定义不可改原件时的权威来源和责任，G0 provenance 可能断裂 | §1.1 证据关系；§5 G0 目标、依赖、验收和失败；§13.1 G0 | 固定 binding 为 sidecar + 总负责人/联合 Spec owner append-only freeze；原报告和 sidecar 只读不可回写；勘误必须引用 source/report/metadata hash、时间、角色、权威取值和不重跑声明；缺失则 `PROVENANCE_PENDING` | 原报告 SHA `AB4C…FD14D`、sidecar SHA `339F…CB75E1` 在修订前后复核不变；草案明确不重跑、不覆盖原件 |
| S-004 | S1–S4 完成条件把观察期、错误率、恢复和误拒阈值全部委托给未冻结的 D4/D6/D7，缺独立可测试的 pass/fail | §7 S1 最小骨架；§8 S2 最小骨架；§9 S3 最小骨架；§10 明确 0036 不属于 S 序列 | 增加建议安全默认：S1 对账/备份/RPO/RTO/冻结/72h；S2 P0/P1、负向、告警、恢复/72h；S3 零绕过/单次发送/verify/限流/72h。明确零容忍失败、技术返工和 D 门只能收紧 | `rg` 核对三组“最小定量技术骨架”、72 小时、零容忍和 `TECH_REWORK_REQUIRED`；未把建议值宣称业务确认 |
| S-005 | §3.1–§3.3 与 §6 将 0035 标为非阻塞却放进 R0/推荐路径，无法判断是否阻塞 D4/D6/D7 | §3.1–§3.3 推荐顺序/推荐图；§6 独立非阻塞文档维护；§13.2 失败传播 | 将 0035 移出 G0/R0 和硬依赖图；保留独立只读维护，可选引用 G0，但不阻塞决策门、S1/S2/S3、验收或收口；实质冲突须另行授权，不自动重开旧周期 | `rg` 核对推荐图不含 `0035`、§6 的关键路径声明和 `0035 非阻塞不传播`；未修改 ISSUE-0037 的 N 项 |
| S-006 | §5–§11 各阶段完成定义混合技术证据与业务验收，业务不响应时无独立完成状态或失败传播规则 | §7–§9 阶段尾部；§10 独立未来门禁；§13.1 双层收口；§13.2 跨阶段失败传播 | 拆分 `TECH_VERIFIED` / `BUSINESS_ACCEPTED`，分别指定证据与责任；T+1/T+3/T+5 或三次请求后固定 `ACCEPTANCE_PENDING`，不自动通过；补 G0/S1/S2/S3/0020 的状态表及 S1/S2/S3 失败传播 | `rg` 核对双层表、超时规则、S1/S2/S3/0020 失败传播和 0036 非 S4；业务沉默未被写成接受 |

## Provenance 与范围声明

- Hermes 原报告和 `.md.metadata.json` 均为只读 provenance；本次未修改、未重命名、未重算其内容或 hash。
- 未处理 ISSUE-0037 的 N-001～N-004；其 owner、状态和 ledger 仍由 ISSUE 管理员维护。
- 未修改旧联合 Spec、旧 QA ledger、Issue canonical、代码、UI、平台配置或 Git；未运行 Hermes、npm、部署。
- 本轮唯一下一步：总负责人核对输出 source hash，登记/确认 append-only provenance freeze 后，发起独立 Hermes Round 2/3。
