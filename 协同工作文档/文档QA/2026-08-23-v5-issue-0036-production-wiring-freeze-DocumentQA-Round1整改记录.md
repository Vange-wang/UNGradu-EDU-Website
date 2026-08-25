# V5 / ISSUE-0036 生产接线冻结包｜Document QA Round 1 SERIOUS 整改记录

## 1. 批次与授权边界

- 执行角色：`DocumentQAv2.3.2 / 019fefa7-c5cf-7e62-9859-5263998dfd77 / gpt-5.6-sol / high`。
- workflow：`WORKFLOW_ACTIVE`；ISSUE-0036 保持 open。
- 输入 canonical：`2026-08-23-v5-issue-0036-production-wiring-freeze-spec.md`；SHA-256 `0BE4B113B4F39DA6A76FE1F91A555E0122B36C192D57DA3A7ABE49B873F6DCBC`；18,812 bytes / 265 lines。
- Hermes Round 1 报告：SHA-256 `B76BE1CCA24E15E9DAD26F669D493C5EC531BF7F49522C563F531819B78DDAF6`；verdict=`REWORK_REQUIRED`；SERIOUS=2。
- metadata：SHA-256 `AB8A3862830D999A647B538A57C0DD917D1AB4AC48E057DF42FE69530EB47CA5`；model=`deepseek-v4-pro`；round=1/3；`canonical_source_unchanged=true`；默认模型未改。
- 本批仅整改完整 S1/S2 及其必要回归；不运行 Hermes/Round 2，不自我批准，不处理 N1–N9。

## 2. SERIOUS 整改矩阵

### S1｜申诉终审绕过二审

- **old location**：§4.1 把 second reviewer 定义为申诉处理角色，但 §5.2 的 `needs_manual_review -> published/rejected` 只列 primary/backup，导致申诉可由 primary/backup 终审。
- **new location**：§4.1、§4.3、§5.2、§6.2、§6.3、§6.5、§8.1、§9.1、§12.1。
- **修订摘要**：
  - primary/backup 在 `appeal_pending` 或 `appealMode=true` 链中只可 claim/triage，不能执行最终 published/rejected；普通非申诉任务仍要求 `appealMode=false`。
  - 申诉最终决定只能由 second reviewer 完成，且 second reviewer 账号必须同时不同于 content owner 与该申诉的 primary/backup claimant。
  - task/audit 增加并绑定 `appealMode`、`primaryReviewerRef`、`secondReviewerRef`、`decision`、`decidedAt`；最终状态和审计原子提交。
  - 非法角色、同账号二审、content owner 自审、账号映射或审计字段缺失、stale version 均 fail-closed，状态、公开指针和内容不变。
- **定向验收**：§12.1 第 1–3 条覆盖 primary/backup 越权终审、同账号/自审/缺字段负例，以及不同账号 second reviewer 合法终审和完整审计正例。
- **冻结边界**：没有新增状态枚举；使用现有 `appealMode` 区分普通人工审核和申诉二审。

### S2｜已发布内容编辑与旧版本公开策略缺失

- **old location**：§5.2 只有 `rejected -> draft` 编辑路径；§5.3 没有定义 published 内容编辑后旧版本是否继续公开，也没有 DTO/API/UI/事务/审计/回滚的一致语义。
- **new location**：§5.2、§5.3、§6.2、§6.3、§6.5、§8.1、§8.2、§9.1、§10、§12、§12.1。
- **修订摘要**：
  - published vN 编辑创建独立 vN+1 并进入 pending_review；最后已批准 vN 保持内容不变并继续公开，新版本批准前不得进入 public DTO、列表、详情、搜索、缓存或联系方式派生。
  - task/audit 增加 approved/pending version、supersedes、公开可见性及前后 published pointer 字段；owner DTO 与 public DTO 分层。
  - vN+1 批准时，状态、审计、旧版本 superseded 标记和 active pointer 在同一事务原子切换；失败继续公开 vN。vN+1 rejected/appeal 时 vN 保持不变。
  - 用户删除时立即隐藏公开 snapshot 并阻断缓存/未决任务复活；恢复创建新 pending_review version 且保持 hidden，禁止直返 published。
  - UI 明确“新版本审核中，仍展示上一已批准版本”；删除/恢复不显示重新公开。回滚不得提升未批准版本或恢复用户已删除 snapshot 的可见性。
- **定向验收**：§12.1 第 4–8 条覆盖 pending 新版本零泄露、批准原子切换、拒绝/申诉保留旧 snapshot、删除立即隐藏、恢复完整重审、stale reviewer 与回滚负例。
- **冻结边界**：采用业务方指定的保守默认；未选择“编辑即撤下旧批准版本”，也未放宽新版本公开门。

## 3. NON_SERIOUS 与直接回归说明

- N1–N9 均不属于本 QA 批次，不宣称任何 N 项关闭。
- §4.1 对所有审核角色的 content owner 自审禁令是 S1 不同账号二审的直接必要回归；即使与 N5 邻域重合，也不代表 QA 处理或关闭 N5。
- §8.1 新增 public/owner DTO 与 published snapshot 语义是 S2 的必要 API 回归；不以此宣称关闭 N4 或其他措辞项。
- 未定义 N1 closed 集合、N2 审计链保留口径、N3 状态 token、N6 SLA/观察覆盖、N7 claim 锁、N8 幂等键组成或 N9 措辞精化。

## 4. 输出与门禁

- 修订后 canonical SHA-256：`9E5DE15240D36E67C6721F83DC006152B22D1B8A8E3539621F98194CA51BCF90`；27,453 bytes / 306 lines。
- 共享审查计数保持 `1/3`；Document QA 修订不重置计数。
- 当前状态：`QA_DOCUMENT_REWORK_COMPLETE / HERMES_ROUND_2_PENDING`；不是 `DOCUMENT_GATE_PASSED`、实现授权、部署、生产验收或 Issue 关闭。
- 未修改 Hermes report/metadata、原 V5 closing Spec、Issue canonical/总表、代码、UI、平台、中央文件或其他角色文件；未运行 npm、Git mutation、部署、Cloudflare/CloudBase 或 Hermes；未创建任务/subagent。
- 唯一下一步：项目总负责人冻结本输出 hash，并组织 focused Hermes Round 2/3 复核 S1/S2 及必要回归。
