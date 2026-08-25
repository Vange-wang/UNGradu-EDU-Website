# 审查报告 — ISSUE-0036 人工审核延期与暂缓关闭范围调整附录

**metadata**
- 审查对象: `2026-08-25-issue-0036-人工审核延期与暂缓关闭范围调整-spec-addendum.md`(仅此 sanitized 副本,未读取任何被引用源文件)
- 审查角色: 独立只读评审
- 轮次: Round 1/3
- 调用模型: deepseek-v4-pro
- 文档类型: `ISSUE_SCOPE_ADJUSTMENT_ADDENDUM`
- 文档状态: `AUTHOR_DRAFT / HERMES_REVIEW_PENDING`

**round**
1/3(本附录新周期)

**verdict**
`REWORK_REQUIRED` — 存在 1 项 serious 发现。文档整体极为严谨(SHA-256 逐输入绑定、条件门禁、fail-closed、停止/回滚/重开链路齐备),但授权核心决策的取证缺口构成对"已批准范围"与"下游关单执行"的实质性风险,须先补绑定再进入后续轮次。

---

## Serious Findings

### S1 — 核心决策事实未绑定证据记录(授权链断裂)
- **severity**: SERIOUS
- **location**: 第 1 节"决策背景与绑定事实",第 14 行;绑定输入表第 16–23 行
- **evidence**:
  - 第 1 节标题自称为"绑定事实",表中四个输入(Issue 文件、旧 Spec、验收裁决、commit)均以 SHA-256/commit/tree 精确绑定。
  - 但第 14 行"业务方已明确决定'人工审核就先不做'……本附录是经业务方选择后形成的新实质版本"——这个驱动整份附录的**范围调整决策本身没有任何绑定**(无路径、无 SHA-256、无 owner、无时间戳、无记录文件)。
  - 唯一与"暂缓"相关的被绑定文件(2026-08-25 范围裁决)其结论为 `CANNOT_CLOSE / KEEP_OPEN_DEFERRED`,即"保持打开",与附录所要建立的"暂缓需求关闭"路径方向相反。
- **impact**:
  1. 授权链从"KEEP_OPEN(保持打开)"翻转为"可关闭(暂缓范围关闭)",依据的是一个未被记录的"业务方选择"。第 5 条要求的 ISSUE 管理员"独立复读"将无处可复读——管理员只能复读本附录对自身决策的断言,而非一份独立的决策记录。
  2. 属"approved scope"(范围调整的批准不可追溯)与"downstream execution"(管理员关单动作缺乏可核验依据)的实质性风险。
- **correction / closure trigger**: 在绑定输入表中新增一条**范围调整决策记录**(决策文档路径 + SHA-256 + owner + 时间戳),或补一份独立决策记录并在第 14 行显式引用;同时明确该决策如何**取代** `CANNOT_CLOSE / KEEP_OPEN_DEFERRED` 结论(见 Contradictions)。补充完成前,本附录不得进入 Round 2 验证。

---

## Non-Serious Findings

### N1 — 条件 3/4 缺少验证机制与 owner
- **severity**: NON_SERIOUS(建议优先处理)
- **location**: 第 4 节最小关单候选条件第 3、4 条,第 75–76 行
- **evidence**: 条件 3 要求"证据仍绑定上述确定提交,且无跨 Issue 携带";条件 4 要求"双 flag 保持 false,未配置 reviewer/Secret/审核入口"。二者均为可验收断言,但未指定**由谁、以何种证据、在何时验证**(如 commit-diff 跨 Issue 检查由谁执行、生产 flag 的配置读取证据是什么)。
- **impact**: 关单候选条件不可测试;若"证据索引"义务(条件 5)在未来被弱化,此缺口会升级为 serious。
- **correction**: 为条件 3、4 各指定 owner 与证据类型(如"由实现角色出具 commit 范围 diff + 生产配置只读截图/查询结果")。

### N2 — 环境术语不一致
- **severity**: NON_SERIOUS
- **location**: 第 36 行"测试/合成流程" vs 第 34、65 行"本地/集成/合成"
- **evidence**: "测试"与"集成"是否指同一环境未定义;若二者是不同环境、证据不同,则表述有歧义。
- **impact**: 局部歧义,不阻塞理解。
- **correction**: 统一为"本地/集成/合成",或显式定义"测试"与"集成"的关系。

### N3 — 状态串引入未定义的 "deferred"
- **severity**: NON_SERIOUS
- **location**: 第 80 行"open / USER_CONFIRMATION_PENDING / deferred" vs 第 20 行当前状态"open / USER_CONFIRMATION_PENDING"
- **evidence**: "deferred"仅在范围裁决(`KEEP_OPEN_DEFERRED`)中出现,不属于 Issue 文件当前状态字段;混入斜杠分隔的状态串造成三态歧义。
- **impact**: 下游若按此状态串机械执行,可能误写 canonical 状态。
- **correction**: 明确"deferred"是裁决限定词而非 Issue 状态字段,或删去该斜杠项。

### N4 — 未解释的引用
- **severity**: NON_SERIOUS
- **location**: 第 47 行
- **evidence**: "ISSUE-0031"与"首次访问 503"在延期清单中首次且唯一出现,无标识或链接。
- **impact**: 边界声明可读性不足,读者无法核对所指对象。
- **correction**: 补充一句标识(如 ISSUE-0031 主题、503 指哪条首次访问行为)。

### N5 — SHA-256/commit 绑定无验证步骤
- **severity**: NON_SERIOUS
- **location**: 第 14、20–23 行
- **evidence**: 多个 SHA-256 与 commit/tree 被断言为"绑定",但无任何条件规定**由谁、在何时核对哈希与实际文件一致**。
- **impact**: 绑定链仅书面存在,不可验证;Round 1 只读评审亦无法核对(不在本轮范围)。
- **correction**: 在关单候选条件中增加一条"由 ISSUE 管理员在复读时对全部 SHA-256/commit/tree 做实际校验"。

---

## Contradictions

1. **`KEEP_OPEN_DEFERRED` vs "暂缓需求关闭"**:范围裁决结论为"保持打开",附录路径为"关闭(暂缓范围)"。附录以"新实质版本"自洽解释,但因缺绑定决策记录(S1),该翻转目前无法被证据支撑——这是 S1 的语义核心。
2. **"业务方已明确决定"(第 14 行) vs 条件 2 的未来确认**:二者实为两次不同决策(延期工作 vs 确认关闭口径),非真矛盾,但强化了"延期决策本身未绑定"的缺口。

---

## Missing Acceptance Criteria

1. 范围调整决策的**绑定记录**(与 S1 对应)——现完全缺失。
2. 条件 3("无跨 Issue 携带")与条件 4("flag false / 未配置 reviewer/Secret")的**验证机制与 owner**。
3. SHA-256 / commit / tree 的**实际校验步骤与责任人**(第 5 条"独立复读"未细化到哈希核对)。
4. **fail-closed 的显式验收标准**:第 2.1(4)条与第 3 节的 fail-closed 语义,在验收矩阵中仅由"负向测试证据"(第 65 行)隐式覆盖,未列具体 fail-closed 测试判定。
5. 关闭时对 `CANNOT_CLOSE / KEEP_OPEN_DEFERRED` 旧结论的**取代/引用语义**:条件 6 仅要求写明"按范围调整后关闭",未要求显式注明旧裁决已被新决策取代。

---

## Remediation Checklist(供 Round 2 验证)

1. [ ] 在绑定输入表新增范围调整决策记录(路径+SHA-256+owner+时间戳),并在第 14 行引用。
2. [ ] 明确新决策取代 `CANNOT_CLOSE / KEEP_OPEN_DEFERRED` 的语义与记录位置。
3. [ ] 为条件 3、4 指定验证 owner 与证据类型。
4. [ ] 统一环境术语(测试/集成)。
5. [ ] 定义或删除状态串中的 "deferred"。
6. [ ] 补 ISSUE-0031 与"首次访问 503"的简要标识。
7. [ ] 增加哈希/commit 实际校验步骤与责任人。
8. [ ] 为 fail-closed 补充显式验收判定(或确认由"负向测试证据"覆盖并在矩阵注明)。

---

## Open-Issue List

- OI-1: 范围调整决策记录缺失(阻塞,S1)。
- OI-2: 条件 3/4 验证 owner 与证据类型未定(N1)。
- OI-3: 环境/状态/引用术语不一致(N2/N3/N4)。
- OI-4: 哈希与 commit 绑定无校验步骤(N5)。
- OI-5: fail-closed 显式验收标准未单列(见 Missing Acceptance Criteria 4)。

---

**结论**:Round 1 判定 `REWORK_REQUIRED`,唯一阻塞项为 S1(决策事实无绑定)。N1–N5 为非阻塞项,可随 S1 修正一并补齐。修正后进入 Round 2 验证;其余已通过审查的部分(安全边界、fail-closed 语义、停止/回滚/重开、角色边界、门禁自限)未发现 serious 问题,本轮不做风格性重开。