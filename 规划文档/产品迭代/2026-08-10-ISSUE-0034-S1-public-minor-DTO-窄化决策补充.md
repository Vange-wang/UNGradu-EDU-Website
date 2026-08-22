# ISSUE-0034 S1：Public/Minor DTO 窄化决策补充

> 文档状态：`PRODUCT_DECISION_READY / NON_CANONICAL`  
> 日期：2026-08-10  
> 唯一作者：产品经理 v2.3.0 / `019fad1b-0006-74f3-9b38-ae71e6464ad4`  
> 适用范围：ISSUE-0034 S1 非数据库安全切片的公开响应与本人/内部读取契约  
> 本文件只补充产品字段决策，不改写阶段 canonical Spec、0036 Spec、Issue、代码、UI 或平台。

## 1. 背景、事实与决策边界

只读核对事实：当前 `server/security/public-field-policy.ts` 已将 parent 的
`region/community/childIntro` 与 tutor 的 `school/major/abilityDescription/proofImages`
从 public projection 移除，但公开列表/详情页面仍读取这些字段，形成 DTO 与页面契约断裂。
当前字段模型和页面仅作为实现输入，不是本文件的通过证据：

| 只读输入 | SHA-256 |
| --- | --- |
| `Code文档/server/security/public-field-policy.ts` | `81DF0D2B54251887921A8AB2186E569517907821AA8C95DC360B036B7F66AD43` |
| `Code文档/server/parent-needs.ts` | `FEE18830034C9255CAB169327A7A2CFE6C4BF5E5ADDAFDC257E9D3D71F8F2302` |
| `Code文档/server/tutor-profiles.ts` | `27EACE10EE4D361BD72D608DB0B3678411827A53757FA9C35E8F125D2362EF4C` |
| ISSUE-0034 阶段变更 Spec（最终 canonical） | `规划文档/Spec文档/Release_version_Spec/2026-08-10-数据库延期与非数据库阶段执行变更-spec.md`；`DBB40E250A6847DBF8109EB5D759CD558F74155CD5FE2C2691C5BACC48D5F14A` |
| 统一硬门禁确认表 | `1C7FDE073D85E3CC2C74C27F69A4ABE4E142CA97AA5324906A948CDD606CC25B` |

产品决定：公开 DTO 必须窄化且自洽；页面不能通过读取原始对象来“补回”被移除字段。
`childIntro/abilityDescription` 是 0036 内容审核候选字段，不等于无条件公开；学校、专业、
位置、证明图片、联系方式和 `ownerId` 也不得借页面需要恢复。任何显示的用户内容必须是
经过审核、限长、脱敏的摘要；未满足条件时使用固定省略文案，不设计新布局。

本补充不替代 ISSUE-0036 内容审核、代码实现、UI 复核、独立代码复核、生产验收或业务最终接受。

## 2. Public DTO：ParentNeed

### 2.1 Public list DTO

公开列表响应只允许以下字段；服务端应返回 DTO，而不是 `ServerParentNeed` 原对象：

| 字段 | 规则 |
| --- | --- |
| `id` | 不透明记录标识，可用于公开详情路由；不得由此推导 owner。 |
| `status` | 固定为 `published`；deleted、legacy-readonly、异常记录不进入 public list。 |
| `createdAt` | 仅公开创建时间；不输出 `updatedAt/version/deletedAt/deletedByUserId`。 |
| `subjects` | 已发布科目数组，服务端白名单/长度校验。 |
| `grade` | 已发布学段/年级，服务端白名单/长度校验。 |
| `budgetMin` / `budgetMax` | 已发布课时预算数字；不携带内部成本/审计字段。 |
| `teacherGenderPreference` | 已发布的老师性别偏好。 |
| `timeSlots` | 已发布可上课时间段，数组限长。 |
| `regionLabel` | 由服务端从 region 生成的粗粒度标签，见 §4；不得返回原始 `region`。 |
| `childIntroSummary` | 可选安全摘要；仅当内容审核状态为 `approved` 时返回，最长 80 个中文字符；否则返回固定省略文案，不返回 raw `childIntro`。 |

### 2.2 Public detail DTO

公开详情 DTO 包含列表 DTO 全部字段，可增加：

| 字段 | 规则 |
| --- | --- |
| `childIntroSummary` | 仅审核通过的安全摘要，最长 80 个中文字符；服务端再次截断并以省略号表示，不展示原文。 |
| `publicSafetyNote` | 固定产品文案“联系方式未公开，先通过站内沟通”；不得拼接联系方式、ownerId 或会话标识。 |

详情同样不得返回 `community`。如果业务希望表达更细位置，只能由审核后的粗粒度
`regionLabel` 处理，不能把小区/村/门牌回填到详情。

### 2.3 Owner/internal DTO

本人管理读取（已登录且 `currentUserId === ownerUserId`）和受控内部读取可得到完整业务字段，
但必须通过独立的 owner/internal API，不得复用 public DTO 或把完整对象传到普通客户端：

| DTO | 允许字段 |
| --- | --- |
| `ParentNeedOwnerDTO` | `id`、`ownerUserId`、`status`、`createdAt`、`updatedAt`、`version`、`managementState`、`deletedAt`、`deletedByUserId`、完整 `teacherGenderPreference`、`subjects`、`grade`、`budgetMin`、`budgetMax`、`timeSlots`、完整 `region`（province/city/district）、`community`、raw `childIntro`。 |
| `ParentNeedInternalDTO` | OwnerDTO 全部字段，另可按最小必要职责读取关联审计/生命周期引用；不得包含无关用户数据或联系方式正文。 |

owner 读取 deleted 记录只用于既有恢复/管理语义；legacy-readonly 可完整读取但不得绕过
既有只读/重新发布规则。匿名请求返回 401；非 owner、记录不存在、deleted 对非 owner、
legacy 对非 owner 或版本/所有权不可信时统一返回 404，不泄露枚举信息。内部读取必须有
实名角色、最小权限、理由、actor、target、时间、结果审计；禁止批量导出或直接转发 public。

## 3. Public DTO：TutorProfile

### 3.1 Public list DTO

| 字段 | 规则 |
| --- | --- |
| `id` | 不透明公开详情标识。 |
| `status` | 固定为 `published`；deleted、legacy-readonly、异常记录不进入 public list。 |
| `createdAt` | 公开创建时间；不输出 lifecycle/version/owner 字段。 |
| `gender` | 已发布性别值。 |
| `subjects` / `grades` | 已发布可教科目与学段数组，服务端白名单/长度校验。 |
| `timeSlots` | 已发布可上课时间段，数组限长。 |
| `feeRanges` | 已发布课时费区间；只保留 grade/subject/min/max，限条数和数值范围。 |
| `schoolSummary` | 可选安全摘要；仅审核通过时显示，最长 40 个中文字符；否则固定省略文案，不返回 raw `school`。 |
| `majorSummary` | 可选安全摘要；仅审核通过时显示，最长 40 个中文字符；否则固定省略文案，不返回 raw `major`。 |
| `abilityDescriptionSummary` | 可选安全摘要；仅审核通过时显示，最长 120 个中文字符；否则固定省略文案，不返回 raw `abilityDescription`。 |

### 3.2 Public detail DTO

详情包含列表 DTO 全部字段，可增加固定 `publicSafetyNote`，内容为“联系方式未公开，先通过
站内沟通”。详情不得返回 `proofImages`、图片 name/type/size、图片数量或任何原始证明资料。
即使证明图片已上传、已审核或存在元数据，首期 public DTO 仍不提供该字段。

### 3.3 Owner/internal DTO

| DTO | 允许字段 |
| --- | --- |
| `TutorProfileOwnerDTO` | `id`、`ownerUserId`、`status`、`createdAt`、`updatedAt`、`version`、`managementState`、`deletedAt`、`deletedByUserId`、`gender`、完整 `school`、`major`、`subjects`、`grades`、`timeSlots`、完整 `feeRanges`、raw `abilityDescription`、`proofImages` 内部元数据。 |
| `TutorProfileInternalDTO` | OwnerDTO 全部字段，另可按最小必要职责读取关联审核/生命周期引用；不得加入无关联系方式正文。 |

owner/internal 读取必须登录、核对所有权/内部角色并写审计；non-owner、deleted/legacy 非 owner、
异常版本统一 404，匿名 401。任何 owner/internal DTO 都不得由 public API、SSR props、列表缓存、
公开日志或前端共享状态间接泄露。

## 4. 位置与摘要的安全粒度

### 4.1 region/community

- Public 只允许 `regionLabel`，推荐为“城市 · 区/县”或统一模糊区域；最多 24 个中文字符。
- 若只有城市可靠，返回城市；若城市/区均不可靠，返回“区域信息暂未公开”。
- `community`、村、小区、楼栋、单元、门牌、经纬度、地址片段和可反推住址的组合均不进入 public。
- Owner/internal 才可按既有授权读取完整 province/city/district/community；不因此获得查看他人
  记录或联系方式的权限。

### 4.2 内容摘要

- `childIntroSummary`：只有 0036/等价审核状态 `approved` 才允许生成；原文中的邮箱、电话、微信、
  QQ、URL、长数字、中文数字、地址和可识别未成年人敏感信息必须被移除或转为省略态。
- `abilityDescriptionSummary`：只有 0036/等价审核状态 `approved` 的安全摘要才可见；不得用前端
  截断代替服务端检测和摘要生成。
- `schoolSummary`、`majorSummary`：当前 0036 只覆盖 `childIntro/abilityDescription`，不覆盖
  学校/专业；除非另有独立的 public-field 审核信号和安全摘要证据，否则首期固定省略，不得把
  0036 的通过状态借给学校/专业。
- 摘要生成失败、状态缺失、policyVersion/contentVersion 不匹配、超长或无法解释时，统一使用
  省略文案，不返回 raw 字段。

## 5. 禁止组合与固定中文省略文案

### 5.1 Public 禁止组合（任一即 RED）

1. `childIntroSummary`、`schoolSummary`、`majorSummary` 或 `abilityDescriptionSummary` 不得与
   raw 内容、`ownerUserId`、联系方式、会话/交换请求标识或 `proofImages` 同时出现在 public DTO。
2. `regionLabel` 不得与 `community`、精确地址、经纬度、`ownerUserId` 或联系方式组合返回。
3. `proofImages` 首期完全禁止 public；不得以图片数量、文件名、类型、大小或 URL 变相返回。
4. `ownerUserId`、`deletedByUserId`、手机号、邮箱、微信、QQ、contactProfileId、conversationId、
   contact exchange 字段和 raw `region/community/childIntro/school/major/abilityDescription` 均禁止 public。
5. 认证态不改变 public DTO；登录不能让普通页面获取 owner/internal 字段。只有 owner/internal
   专用接口在授权与审计通过后可组合完整字段。

### 5.2 固定省略文案

页面不增加新布局，只在现有字段位置显示固定中文：

| 缺失/未批准字段 | 固定文案 |
| --- | --- |
| 粗粒度区域不可用 | `区域信息暂未公开` |
| childIntro 未审核/摘要失败 | `孩子情况暂未公开` |
| school 未审核/摘要失败 | `学校信息暂未公开` |
| major 未审核/摘要失败 | `专业信息暂未公开` |
| abilityDescription 未审核/摘要失败 | `能力说明暂未公开` |
| proofImages（首期 public 永不提供） | `证明材料暂不公开` |
| 联系方式/owner 信息 | `联系方式未公开` |

这些文案不携带记录是否存在、是否被删除、是否有图片或是否命中审核的额外信息，避免对象
枚举和隐私推断。

## 6. Owner/internal 授权、审计与生命周期门控

1. 未登录读取 owner/internal：401。
2. 非 owner、对象不存在、已删除对象的非 owner 读取、legacy-readonly 的非 owner 读取、
   owner/version/状态不可信：统一 404；不得通过错误文案区分原因。
3. 当前 owner 可读取本人 published/deleted/legacy-readonly 的完整管理字段，但删除恢复、编辑、
   联系方式/聊天恢复仍遵守 ISSUE-0033 的 48 小时、版本、所有权、会话参与者和状态校验。
4. 内部角色读取必须使用独立受控 API，校验角色、目的、最小字段和审计写入；审计至少记录
   actor、role、targetType、targetId、purpose、occurredAt、result、policyVersion，不记录 raw
   联系方式或 Secret。
5. Public list/detail 只接受 `status=published` 且 DTO 摘要状态有效的记录；deleted、legacy、
   stale、审计失败或摘要 policy 失配均不公开并使用固定省略/404 语义。
6. 本补充不改变删除期间历史聊天只读、禁止新消息/联系方式交换及恢复后重新校验的既有规则。

## 7. RED-first 验收矩阵

| 场景 | 期望结果 | 证据类型/责任 |
| --- | --- | --- |
| Public parent list/detail | 只含 Parent public DTO；无 raw region/community/childIntro、ownerId、联系方式、deleted/lifecycle 字段；regionLabel 粗粒度。 | API JSON 快照 + 页面 DOM；代码开发员，独立代码复核复验。 |
| Public tutor list/detail | 只含 Tutor public DTO；无 raw school/major/abilityDescription、proofImages、ownerId、联系方式；摘要仅 approved。 | API JSON 快照 + 页面 DOM；代码开发员，独立代码复核复验。 |
| 审核未通过/状态缺失/摘要失败 | 固定省略文案；不得返回原文、图片元数据或“有/无敏感内容”差异。 | 确定性/0036 stub 负测；本地与集成。 |
| Owner detail/list | 已登录本人可读完整 DTO；跨账号不可读；审计可回读。 | 双账号合成测试；独立权限复核。 |
| Internal detail | 仅实名最小权限角色可读，目的/actor/时间/结果审计；无批量导出。 | 受控集成/预生产审计证据。 |
| 匿名/非 owner | 匿名 401；非 owner、不存在、deleted/legacy 非 owner 统一 404。 | API status/body 快照；独立复核。 |
| deleted/legacy/stale | Public 不出现；owner/internal 按既有生命周期规则；legacy 只读，不旁路编辑/公开。 | 生命周期合成数据、版本/状态负测。 |
| 禁止组合 | 任何 public response、SSR props、缓存、日志出现禁止组合即 P0/P1 RED，停止发布。 | 原始响应扫描、日志脱敏扫描、生产只读探针。 |
| UI 缺字段 | 只显示 §5.2 固定文案，不设计新布局或恢复敏感字段。 | 1280/390 页面截图与 DOM；UI 角色复核。 |

最低通过条件：public 敏感字段泄露为 0；owner/internal 授权读取与审计通过；non-owner/legacy/
deleted 门控无旁路；摘要状态、长度、脱敏和固定文案可复现。任何一个 RED 未清零，不得进入
生产或业务验收。

## 8. 实施边界与后续门禁

- 本文件只提供可实现字段契约；代码开发员须由总负责人授权后修改 DTO、API、客户端类型和
  页面读取，不能恢复被移除的 raw 字段。
- 0036 内容审核负责规则、状态、摘要/人工/AI 边界；本补充不替代其 Spec、业务门、独立复核、
  生产观察或申诉语义。若 0036 尚未提供 approved 摘要，全部可疑内容保持省略/pending。
- UI 只按现有布局替换字段和固定文案，不新增视觉方案；UI 复核需确认无裁切、无字段回流。
- 独立代码复核需按 RED-first 矩阵检查 API、DOM、缓存、日志和跨账号；本地通过不等于生产通过。
- 生产部署必须另有版本、窗口、合成数据、清理 receipt、监控、停止条件、回滚和业务方接受；
  本文件不授权生产写入或 Issue 关闭。

## 9. 唯一下一步

交原开发 owner 按本字段契约修复 DTO/API/页面读取，随后由 UI 与独立代码复核按 §7 的 RED-first
矩阵验收；在复核与生产/业务门禁完成前，不恢复任何敏感 public 字段。
