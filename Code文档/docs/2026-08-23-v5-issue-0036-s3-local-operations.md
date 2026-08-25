# V5 / ISSUE-0036 S3 本地运维门禁说明

状态：仅本地实现与合成验证；不是平台配置、部署、生产启用、回滚演练、产品验收或 Issue 关闭证明。

## 默认关闭与配置门

- `CONTACT_REVIEW_ENABLED` 默认必须为 `false`。
- 只有显式设为 `true` 时，才同时要求 `CONTACT_REVIEW_SCHEMA_READY=true`、独立 `CONTACT_REVIEW_KEY_SECRET`，以及互不重叠的 primary、backup、second-review 受控账号引用。
- 任一必填项缺失、为空或角色引用重叠，审核接线固定返回 `503 CONTACT_REVIEW_CONFIGURATION_UNAVAILABLE`；不回退到内存审核、自动公开、自动通过、AI、OCR 或外部 provider。
- `.env.example` 只列变量名和非敏感占位值；真实账号引用与 Secret 只能由平台 Secret/配置存储提供，不写入仓库、日志或响应。

## 健康与可观察性

已认证且已登记的 reviewer 可读取 `/api/contact-review?scope=health`。响应只包含启用/就绪状态、repository 可达性、待处理/人工/超时任务数量、audit 数量、aggregate 完整性失败数和公开指针失败数，不返回正文、联系方式、账号清单、Secret、token 或平台 revision。

reviewer 队列使用 `/api/contact-review?scope=queue`；owner 和未登记账号返回 403。普通字段领取使用 CAS revision，申诉 triage/resume 与 second-review 终审继续保持角色分离。

生产启用前仍必须由平台/运维 owner 另行证明 collection、唯一索引、权限、事务、人工账号绑定、监控告警接收人、上一稳定 revision 和真实回滚入口。仓库内健康结果不能替代这些证据。

## 失败关闭、停止与安全回滚

出现配置缺失、repository/audit/transaction 不可用时返回 503，并保持原 hidden 或旧 approved snapshot，不产生部分公开副作用。出现跨账号可见、owner 自审、second 与 triage/owner 重合、错误公开、双 active、审计缺失或 queue 不可用时：

1. 关闭 `CONTACT_REVIEW_ENABLED`，停止新的审核副作用。
2. 保留 audit，不删除 task、aggregate 或主实体状态。
3. 核对公共端仍为 hidden 或完整旧 approved snapshot，联系方式继续默认隐藏。
4. 仅使用部署平台记录的上一稳定 revision 执行平台回滚；不得用本地 commit、分支名或本文档猜测生产 revision。

本地未执行真实 flag 切换、平台配置、生产观察或回滚演练，因此不得声称回滚已经通过。

## 公开读取权威完整性门

- feature flag 启用后，家长需求与家教资料的公开列表、公开详情都必须先读取联系方式审核权威状态；公开主实体中的旧 `published` 标记不能单独作为放行依据。
- 每次公开读取必须重新验证唯一 active aggregate、固定 required-field 集合及其 keyed digest、准确 N/N task、task 与 field-review 双向引用、owner/entity/version/field/review key、内容 digest 和申诉双人角色向量。任一 task 缺失、重复、反向引用错误或 digest 漂移都按不存在处理，不继续公开 active snapshot。
- 健康端点的 `publicPointerFailures` 使用同一权威校验。该计数非零时必须停止启用流程并按上一节关闭 flag；不得人工改写主实体的公开指针来绕过校验。

## 写操作重放与角色门

- create、普通字段领取/决定、appeal 创建/领取/resume/终审和 retention cleanup 都必须提供非空 `Idempotency-Key`。同 actor、operation、key 与稳定 payload 的重试返回首次结果，不重复增加 entity/task/aggregate revision，也不重复写 audit；同 key 不同 payload 固定 409。
- 所有决定继续使用 task/aggregate/entity revision 的 CAS。幂等回放检查先于可变 revision 检查，确保网络超时后的合法重试可恢复原结果；未持有首次 key 的新业务动作必须使用新 key。
- appeal 领取者变化必须带受控 handoff reason；resume 必须带恢复原因和依赖恢复引用。终审前重新验证持久化 triage/second/owner 向量，发现 owner 自审、角色重叠、引用/角色不一致或 claim 缺失时转人工并失败关闭，不允许终审公开。
- `restore` 只接受 deleted 源状态；published/hidden 非 deleted 状态不得用 restore 隐藏。deleted 状态只能经 restore 进入完整新版本审核，不得用 edit 绕过。非法转移返回 409 且零 revision、零 audit、零幂等收据写入。

## Retention cleanup 本地合同

- cleanup 输入包括受控 operator、时间、legal-hold entity refs 和 idempotency key。已完成 task 自完成时间起保存满 30 天才可删除；audit 保存满 180 天才可删除，边界前 1 ms 必须保留，恰到边界方可清理。
- legal hold 同时阻止 task 与 audit 删除；每次 hold 创建、延长、释放，以及实际删除 task/audit 的范围、数量、cutoff、hold digest、operation、key 和时间都写入不含正文/联系方式的审计元数据。释放 hold 不恢复旧 task；后续 restore 必须创建新的 version/review key/task。
- cleanup 在单一 repository transaction 内计算并提交。主事务失败时 task、公开指针、业务 revision 和幂等状态完全不变；服务在主事务回滚后以独立事务尽力追加 `retention_cleanup_failed` 结构化审计（删除数固定 0，并记录 cutoff、hold digest、operator、operation、key、时间和失败原因），随后仍返回 503。若同一审计存储持续不可用，调用方必须基于 503、correlation id 与健康告警写入仓库外运维事件；恢复后使用原 key 重试，不能伪造仓库内成功审计。
- 本地合成测试只证明代码的精确 30/180 天边界、hold、重放冲突和失败原子性；真实定时器、平台告警、数据库索引/权限和生产 retention 证据仍未执行。

## 聚焦复审后的公开同源与幂等 scope 门

- feature flag 启用时，parent/tutor 公开列表与公开详情的响应对象必须直接来自同一次 `readPublic` 权威 approved snapshot 白名单投影；旧主文档只可用于兼容关闭态或候选 ID 发现，不得用其顶层字段覆盖已批准投影。运维抽查应故意对比主文档顶层字段与 active snapshot，确认响应仍等于 approved snapshot 且不含联系方式。
- field claim/decision 与 appeal claim/final decision 的幂等 scope 由 owner、entity、operation、task/appeal 等稳定业务维度组成，不包含 reviewer ID。已登记的另一 reviewer 使用同 key、同业务 payload 只读回放首次结果且零新增 revision/audit/receipt；同 key 改 revision、决定或其他业务 payload 固定 409。
- reviewer 身份不是业务 payload，也不能成为绕过首次 receipt 的新 scope；但 HTTP reviewer 注册、owner 分离、triage/second 分离必须在动作或 receipt 回放前执行。未登记账号、owner、错误角色或 triage 冒充 second 均不得借已有 key 获取结果或触发新动作；首次非法终审继续按冻结合同转人工并写失败审计。

## 第三次定向返工后的列表权威性与延迟重放门

- feature flag 启用后的 parent/tutor 公开列表不再以旧主文档发现候选成员。repository 以分页方式读取该实体类型的审核实体、aggregate 和 task；每个实体先通过与详情相同的 approved snapshot 完整性门，随后才在批准投影集合上执行筛选、按批准 `createdAt` 降序及 `id` 稳定排序，并据此形成列表成员、顺序和数量。旧主文档中的 subject、stage/grade、price、gender、createdAt 即使漂移，也不得影响命中、漏项、顺序或数量。
- 每次分页必须持续到短页，并用 `_id` 稳定排序和重复页检测防止漏读或死循环；分页能力缺失时只能按 provider 的单次完整结果处理。repository 读取、分页或完整性校验异常继续 503/隐藏，不允许退回旧主文档筛选。
- 业务动作 receipt 的既有 `resultRef` 保存不含正文、联系方式和 snapshot 的首次稳定业务结果，`resultDigest` 对该结果做 keyed 完整性校验。合法同 key/同 payload 延迟重放时，即使 entity/task/aggregate 已被后续 claim、decide 或 appeal 推进，仍只回放首次结果；receipt 缺失、旧格式、解析失败或 digest 不一致均 503 fail closed，不读取当前 aggregate 冒充首次结果。
- `/api/contact-review` 成功响应只返回审核状态、版本、公开指针、删除状态和更新时间等稳定业务元数据；不返回 active/pending 原始 snapshot。reviewer 注册、owner/triage/second 分离仍在 receipt 回放前执行；重放必须保持 entity/task/aggregate revision、audit 和 receipt 数量全部不变，同 key 异 payload仍为 409。
