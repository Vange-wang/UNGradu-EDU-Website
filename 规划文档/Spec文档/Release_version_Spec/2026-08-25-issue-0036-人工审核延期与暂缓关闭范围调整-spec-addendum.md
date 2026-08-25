# V5 / ISSUE-0036 人工审核延期与暂缓关闭范围调整附录

文档类型：`ISSUE_SCOPE_ADJUSTMENT_ADDENDUM`
文档状态：`AUTHOR_DRAFT / QA_SERIOUS_REMEDIATED / HERMES_ROUND_2_PENDING`
审查预算：`MAX_REVIEW_ROUNDS=3`；本附录新周期 `CURRENT_REVIEW_ROUND=1/3`
目标 Issue：`ISSUE-0036`
项目 workflow：`WORKFLOW_ACTIVE`
责任角色/单一写入 owner：产品经理 Agent v2.3.2（019fefa7-9883-7af2-bdb5-acc5c8513781）

> 本附录记录业务方在人工审核延期后的实质范围调整。它不修改旧关闭 Spec、旧 Hermes/QA 结果、Issue canonical/总表、代码、UI、平台或部署状态；旧 V5 v1/v2 的审查上限和历史风险保持不变。本附录通过自身文档门禁和用户确认前，不授权实现、部署、flag-on 或 Issue 状态修改。

## 1. 决策背景与绑定事实

### 1.1 独立业务决策绑定（S1）

以下决策链是本附录“暂缓需求/范围调整后关闭”口径的唯一业务授权，不得拆开引用：

1. 业务方长期明确目标是持续推进直至 `ISSUE-0036` 关闭；该长期目标本身不允许跳过 Spec、独立复核、生产证据边界、业务确认或 ISSUE 管理员关单。
2. 2026-08-25，业务方明确决定：“那人工审核就先不做，先放着”。该决定只冻结人工审核交付，并未把当时的 `CANNOT_CLOSE / KEEP_OPEN_DEFERRED` 自动改成可关闭。
3. 项目总负责人随后向业务方明确说明：现有合同下不能直接关闭；若仍要关闭，必须形成 material scope adjustment，把本轮目标改为“人工审核延期、暂缓需求关闭”，且不得把 flag-off 冒充生产通过。业务方在获知该前提后明确指令“继续”，由此选择范围调整路径。
4. 第 1～3 项合并后的授权只允许提出“暂缓需求/范围调整后关闭”的候选，并受本附录全部门禁约束；它不授权虚构或执行生产 AI、人工审核、reviewer/Secret、flag-on、自动公开、生产观察、回滚演练、部署或 Issue 状态修改。
5. 在“人工审核延期、暂缓需求关闭”这一调整后范围内，本附录取代 2026-08-25 早先 `CANNOT_CLOSE / KEEP_OPEN_DEFERRED` 产品裁决，作为下游产品确认与 ISSUE 管理员关单复读的范围依据。该取代仅消除旧裁决中“业务方尚未选择 material scope adjustment”的前提，不追溯改写旧裁决，也不证明原生产闭环完成；旧裁决必须原样保留为范围变更前的历史证据。
6. 本附录仍是 `AUTHOR_DRAFT`：在 Hermes SERIOUS=0、文档门通过、业务方按调整后文本再次确认、ISSUE 管理员独立复读并执行 canonical 操作之前，`ISSUE-0036` 必须保持 `open / USER_CONFIRMATION_PENDING`。上述范围取代不等于本附录自我批准、Issue 关闭或生产验收。

可持久化来源与权威关系：

| 来源 | owner / 时间 | 可复核绑定 | 权威用途 |
|---|---|---|---|
| 项目总负责人当前线程 `01a00565-5d72-7663-991d-178c5dcfd170` | 业务方与项目总负责人 / 2026-08-25 | 线程内可复读业务方原话“那人工审核就先不做，先放着”；总负责人说明 `CANNOT_CLOSE` 与 material scope adjustment 前提后，业务方回复“继续” | 原始业务指令来源；证明范围调整是获知关单前提后的明确选择 |
| `总负责人文档/总负责人工作记录.md` | 项目总负责人 v2.3.3 / 2026-08-25 | Document QA 复读快照 SHA-256=`0164694F1C362BB1E3847CA32FFB82F6BA075D00884F107B15A47F4D225A607F`；“V5 ISSUE-0036 生产冻结索引完成，保持 flag-off”条目记录人工审核暂不实施、reviewer/Secret/入口延期、双 flag=false、Issue 不因延期自动关闭；同记录保留业务方持续推进直至 ISSUE-0036 关闭的长期目标 | 持久化保守边界与长期目标；不单独充当 scope-adjusted 关单授权 |
| `规划文档/产品经理工作记录.md` | 产品经理 Agent v2.3.2 / 2026-08-25 | Document QA 复读快照 SHA-256=`0B36EA399E18C2DDE77F6A2EB99D135EC24EA7930360C674B95F6E2689E51E2E`；“人工审核暂缓后的最小关单范围裁决”记录原 `CANNOT_CLOSE / KEEP_OPEN_DEFERRED`，“人工审核延期范围调整附录 Hermes Round 1”记录业务方随后选择 material scope adjustment | 持久化两阶段产品决策链，证明先保持 open、后在新授权下形成调整后关闭候选 |
| `规划文档/产品迭代/2026-08-25-v5-issue-0036-人工审核暂缓最小关单范围裁决.md` | 产品经理 Agent v2.3.2 / 2026-08-25 | SHA-256=`F422F8CF111D0E1741E9E684ECFDABBB7975A9C4E836229381910E78D67B700C`；结论=`CANNOT_CLOSE / KEEP_OPEN_DEFERRED`，并明确只有业务方改变目标后才能形成 material scope addendum | 范围变更前的历史裁决与触发条件；保留、不删除、不改写 |

### 1.2 绑定输入

| 来源 | 当前事实 | 本附录用途 |
|---|---|---|
| `协同工作文档/ISSUE/Open_Issue/ISSUE-0036-家长需求与老师资料的联系方式快速智能审核.md` | SHA-256=`1696FFBAF33E61F68A915F7D2580A07B4D4122E3194EF9B61ABDFCF27FA62804`；当前 `open / USER_CONFIRMATION_PENDING` | 固定唯一 Issue 和原关闭门禁 |
| `规划文档/Spec文档/Release_version_Spec/2026-08-15-issue-0036-联系方式审核关闭-spec.md` | SHA-256=`F37E6AD7BB24F3C52561413B53735FA7B09F2BFFEC1CC2F111646087FF697844` | 作为历史原合同；本附录仅调整本轮范围与关闭口径 |
| `规划文档/产品迭代/2026-08-24-v5-issue-0036-产品验收与生产接线准备裁决.md` | SHA-256=`FA56F5D140D6E053321C173CB3ECA591358F75FBC7172AA88CDEE6EC56392789`；`PRODUCT_ACCEPTANCE_PASS` 仅 bounded、`PRODUCTION_FLAG_ON_GATE=BLOCKED` | 固定既有本地/合成与 flag-off 证据边界 |
| V5 已推送确定提交 | branch=`V5-issue-0036-contact-review-closure`；commit=`f8ad5d009c5483d6791699d2c2394765a23fb2f2`；tree=`19b903a8a4e6e2ece653c2c175cbcbbdfadae352` | 绑定已有实现与复核输入，不新增实现 |

当前生产安全边界固定为：`CONTACT_REVIEW_ENABLED=false`、`CONTACT_REVIEW_SCHEMA_READY=false`。现有网站行为不改变。本附录不配置 Secret、reviewer、审核入口、collection、部署参数或任何平台对象。

## 2. 本轮调整后的目标与关闭口径

### 2.1 本轮可交付、可验收范围

本轮只确认并收口以下“暂缓需求”范围：

1. V5 联系方式审核安全骨架：有限字段、确定性扫描、状态机/API、权限隔离、审计和 fail-closed 语义。
2. 本地、集成和合成环境中的实现与验证证据，以及既有独立技术/UI复核和 bounded 产品验收证据。
3. 生产默认 flag-off 安全边界：不启用 Contact Review，不改变现有网站生产路径，不把未启用能力当作生产功能。
4. 对联系方式、未成年人内容和未知结果保持保守边界：在安全骨架适用的测试/合成流程中，未知、失败和不确定结果不得自动公开；生产 flag-off 不新增该审核流程。
5. 业务方接受“人工审核延期、生产智能审核暂不启用”的范围调整，并由 ISSUE 管理员独立复读本附录及证据后，决定是否按“暂缓需求关闭”更新 Issue canonical。

### 2.2 本轮不再作为关闭前置交付的项目

以下项目全部明确延期，不得写成已完成、已上线或已通过：

- 生产 AI provider、模型接入、AI 出域、真实 provider key、DPA、region、成本和训练/保留配置；
- 生产人工 reviewer 账号、Secret、primary/backup/second-review 权限、人工审核入口、人工队列、申诉生产闭环和 SLA；
- `CONTACT_REVIEW_ENABLED=true`、`CONTACT_REVIEW_SCHEMA_READY=true`、flag-on、自动公开、自动发布或联系方式自动放行；
- 真实生产人工处理、生产观察窗口、生产失败停止指标、真实反向回滚演练和生产 AI/人工效果验收；
- 数据库业务数据写入、生产审核任务创建、任何其他 Issue、ISSUE-0031、支付、OCR、额外出域和首次访问 503。

“延期”表示本轮明确不交付，不表示这些项目已通过或已具备生产条件。

## 3. 用户可见与安全语义

- 现有网站生产行为保持不变；两个 Contact Review flag 必须继续为 false。
- 本附录不承诺“智能审核已上线”“人工审核已交付”“生产门通过”“未知内容已在生产安全处理”或“自动公开已启用”。
- 当前代码是确定性扫描/状态转移能力，不是生产 AI provider 接入；不得把确定性扫描写成 AI 已上线。
- 在本地/集成/合成安全骨架中，联系方式默认不公开，未知、故障、解析失败和不确定结果 fail-closed，不自动产生 `published`；生产 flag-off 时不新增 Contact Review 公开路径。
- 不记录或回显真实联系方式、未成年人原文、Secret、token、provider 响应或 reviewer 账号；不向未获批准的 AI/provider 出域。
- 所有跨账号访问、owner 越权、审计缺失、状态绕过、错误公开和配置不一致均属于停止条件，不得用“暂缓”豁免。

## 4. 验收与证据矩阵

| 层级 | 本轮要求 | 可证明结论 | 不可声称 |
|---|---|---|---|
| 范围/业务 | 用户确认本附录的暂缓范围；联系方式默认不公开；AI/OCR/provider/额外出域关闭 | 范围调整可进入独立关单审查 | 不代表生产人工或 AI 已交付 |
| 本地/集成/合成 | 复用 V5 已有确定性扫描、状态/API、权限、审计和负向测试证据 | 安全骨架在受限环境可验收 | 不代表真实生产行为 |
| 独立技术/UI | 复用已有 `TECH_REVIEW_PASS`、`UI_REVIEW_PASS` 及其精确提交证据 | bounded 交付的独立复核已存在 | 不替代本附录门禁或生产证据 |
| 部署/生产 | 仅保持双 flag false、现有网站行为不变；本附录不新增部署 | 可保持安全的未启用状态 | 不代表 flag-on、生产观察、回滚演练或生产审核通过 |
| 产品/业务 | 业务方接受“人工审核延期、暂缓需求关闭”语义 | 可提出范围调整后的 Issue 关单候选 | 不代表原始生产闭环目标完成 |
| Issue 关闭 | ISSUE 管理员独立读取本附录、用户确认与各层证据后执行 canonical 操作 | 仅 ISSUE 管理员可决定是否按新范围关闭 | 本附录本身不关闭 Issue，不修改状态 |

范围调整后的最小关单候选条件必须全部满足：

1. 本附录完成 Hermes 文档门禁，SERIOUS=0；非阻塞项有明确 owner/触发条件；
2. 业务方在文档门通过后明确确认本附录的实质范围和“暂缓需求关闭”口径；
3. V5 bounded 本地/集成/合成与独立技术/UI证据仍绑定上述确定提交，且无跨 Issue 携带；
4. 生产双 flag 保持 false，未配置 reviewer/Secret/审核入口，没有新增生产副作用；
5. 产品经理提供本附录、确认记录和证据索引，ISSUE 管理员独立复读后自行决定 canonical 状态；
6. 关闭记录必须写明“按人工审核延期的范围调整后关闭”，不得写成原始人工/AI 生产闭环完成。

缺少任一条件时，只能保持 `open / USER_CONFIRMATION_PENDING / deferred`，不得关闭。

## 5. 失败、停止、回滚与重开

### 5.1 停止条件

若任何实施或平台动作尝试打开 flag、创建生产审核任务、启用 provider/AI/OCR、自动公开联系方式、绕过人工责任、写入真实 PII、改变现有网站路径、掩盖未通过的生产证据或把本附录写成原始目标完成，应立即停止并保持 flag-off；该行为不得被本附录授权。

### 5.2 回滚边界

本轮不部署、不改变平台，不产生新的生产 revision。若既有 flag-off 候选需要撤回，保持当前生产配置和现有网站路径即可；任何未来部署回滚必须使用平台记录的上一稳定 revision，不得用本地 commit 猜测或声称已演练。

### 5.3 未来恢复触发条件

当业务方重新决定启用联系方式审核时，必须重开 ISSUE-0036 或建立明确继任 Issue，并重新形成 provider/人工范围 Spec、用户确认、实现、测试、独立技术/UI复核、适用部署/生产证据、产品/业务验收和 Issue 管理员关单证据。未完成新链路前，两个 flag 继续为 false；不得因本附录曾按延期范围关闭而自动启用。

## 6. 角色边界与下一步

- 产品经理：维护本附录、证据索引和用户确认边界，不修改 Issue 状态，不配置平台，不代替人工审核。
- 项目总负责人：冻结本附录、检查审查结果并路由后续用户确认/Issue 管理员复读，不代替 Issue 管理员关单。
- ISSUE 管理员：在用户确认和证据完整后独立决定是否按范围调整后的口径更新 canonical；未获完整输入时保持 open/deferred。
- 实现/平台/运维角色：本附录通过且用户确认前不得开始新实现、部署、Secret、reviewer 或 flag-on 动作。

本附录当前唯一下一步：由项目总负责人路由产品经理执行 focused Hermes Round 2/3，仅复核 S1 与受影响回归；本线程不得运行 Hermes，不得修改旧 Spec、旧报告或开启旧周期第四轮。
