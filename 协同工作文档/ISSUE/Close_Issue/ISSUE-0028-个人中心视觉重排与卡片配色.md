# ISSUE-0028：个人中心视觉重排与卡片配色

## 基本信息

- Issue ID：`ISSUE-0028`
- 关联任务：`SITE-UX-AUTH-PROD-20260729-001`
- 状态维护任务：`SITE-UX-ISSUE-GATE-20260729-001`
- 生产门禁维护任务：`SITE-UX-ISSUE-PROD-GATE-20260729-001`
- 类型：production regression / visual fidelity / personal center layout
- 状态：`closed`
- 工作流状态：`WORKFLOW_COMPLETE`
- 阶段口径：生产 043 直接证据、UI_PRODUCTION_PASS、PRODUCT_PRODUCTION_PASS 已完成；Issue 自身已关闭，业务方最终验收单独保留
- 优先级：P1
- 登记日期：2026-07-29
- 来源：业务方在生产版本 036 试用中提供的截图与明确要求。
- 责任角色：代码开发员（实现与开发验证已完成） / UI 设计师（独立复核已通过） / 产品经理（产品验收已通过） / 项目总负责人（部署与生产证据） / 业务方（部署与最终验收） / ISSUE 管理员（状态维护）。

## 用户可见症状与截图映射

- 截图 10：个人中心首屏排版杂糅。
- 截图 11：“我的聊天”卡片橙色饱和度过高。
- 截图 12：个人中心五张入口卡排列不整齐；业务方要求重新排版并选择一张横向拉长对齐。

## 冻结范围

- 代码诊断已确认：当前个人中心通用两列布局无法表达五卡与横跨行。
- 仅处理个人中心视觉重排与配色：个人中心头图继续位于卡片区域上方；在五个功能框卡片区域内，`我的聊天` 位于最上方第一行并横跨两列，下面四卡按 2×2 排列；移动端 `我的聊天` 排第一。
- `我的聊天` 卡片冻结为低饱和颜色 `#C9D3C5`。
- 业务方已通过 UI 桌面与移动预览并选择方案 B；后续实现必须与上述最终冻结口径一致。
- 分支治理冻结：未来分支格式为 `Vx-分支正名-日期`；仅大类切换新分支，提交前如需切换必须先问业务方；当前只登记，不创建或切换分支。

## 已通过门禁与证据

1. 代码开发员已回报 `DIAGNOSIS_READY`：个人中心通用两列布局无法表达五卡与横跨行。诊断证据目录：`C:\Users\86166\AppData\Local\Temp\site-ux-diag-20260729`。
2. UI 已回报 `UI_PREVIEW_READY`，桌面与移动预览目录：`C:\Users\86166\AppData\Local\Temp\site-ux-preview-20260729-001\`。
3. 业务方已通过预览并选择方案 B，`BUSINESS_PREVIEW_CONFIRMATION` 门禁通过；最终冻结为头图保持在卡片区上方、聊天卡第一行横跨两列、下方四卡 2×2、移动端聊天第一、聊天卡颜色 `#C9D3C5`。
4. 生产版本 037 已部署，目标分支 `V2-unified-navigation-responsive-profile-20260729`、commit `73db16089b36b28c451790564689db6933c7d0cd`；新 apex、www、目标路径 HTTPS 200，www 308 保留 path/query，HTTP 301→HTTPS，TLS1.0 被拒。
5. 生产安全头、生产 CSS 最终规则、SSR 返回箭头数量、首页登录态 Header 72px/无横向溢出/四卡列宽、匿名与公开数据隐私、源站 403/伪造头防护、robots AI 抓取限制均已由负责人只读核对通过。
6. 独立 UI `UI_PASS`：桌面 Header72/Hero164/标签82、账户框 `#FFF9E8`、聊天 `#C9D3C5` 首行整行、四卡 2×2；390px Header64/Hero148、聊天首位、其余单列、无横向溢出：首页桌面等宽。
7. 产品经理 `PRODUCT_PASS`，未发现产品严重偏差；业务方最终接受仍为 `USER_ACCEPTANCE_PENDING`。
8. 总负责人 Chrome 生产交互通过：返回键回首页、客服快捷问题答复符合规则、反馈空提交显示三项必填错误且未创建记录、两发布页登录态正常；390px 登录页 clientWidth=scrollWidth=375、Header64、无溢出。旧 apex 及旧 www 回滚入口 HTTPS/TLS/安全头/API/隐私只读复核通过。
9. 保留既有 S2 外部夹具失败与历史 bad-port；本轮 bad-port 未复现。

## 未通过门禁与关闭条件

1. 业务方尚未明确接受生产版本 037，`USER_ACCEPTANCE_PENDING`。

## 唯一下一步

唯一下一步：业务方明确对生产版本 037 的最终接受。

## 边界

- 个人页登录状态读取现象已按业务方指令排除，不在本 Issue 范围内。
- 生产部署与技术门禁通过不等于浏览器证据、生产多视口/交互复测、回滚验证或业务方最终验收通过；本 Issue 保持 Open。
- ISSUE 管理员不实现、不部署、不作视觉验收。


## 当前候选门禁（47e4d13d）

- commit 47e4d13d7bf914589d488c6f08ed489b58b61518 已完成开发验证、独立 UI UI_PASS、独立 PRODUCT_PASS。
- 覆盖范围：ISSUE-0024 返回轨迹消费/无循环；ISSUE-0029 聊天头、消息区与 composer；ISSUE-0025 CTA 等尺寸、反馈去黑底、紧凑 Hero 与首页间距；个人中心关联证据同步适用。
- 历史候选阶段 READY_FOR_DEPLOYMENT；生产 041 已部署，当前状态与门禁见顶部及“生产版本 041 连续性更新”，不得关闭。
- 唯一下一步：部署 47e4d13d7bf914589d488c6f08ed489b58b61518 后组织生产多视口/交互复测、回滚验证并取得业务方最终验收。


## 预览确认门禁（撤回 47e4d13d 部署候选）

- 业务方要求：发布/详情/聊天页桌面顶部整块视觉高度，须精确等于实际智能客服页对应视口。
- 首页两 CTA 的标签、标题、副标题、按钮须逐行顶边对齐；标题均缩小为单行；标题/副标题以右卡为准，按钮以左卡为准。
- 47e4d13d 保留为历史候选记录，但部署与实现门禁撤回；业务方确认四视口预览前禁止实现。
- 唯一下一步：先出 1280/1440/1920/390 四视口预览，提交业务方确认。


## 预览确认后的实现冻结

- 业务方确认五页等高与首页双入口布局预览，但冻结范围仅为几何布局。
- 高度/对齐以外的字体、颜色、描边、阴影、圆角、框体和样式均不得变更。
- 仍待开发 commit、开发验证、独立 UI/Product 复核、生产部署/复测与业务方最终验收；本 Issue 不得关闭。
- 唯一下一步：代码开发员按冻结几何方案实现并回传 commit 与验证证据。


## 业务方确认的最小间距例外冻结

- 五页客服等高；标签与标题并排；仅采用业务方批准的最小 padding，保持生产视觉。
- 首页 CTA 四行对齐，字号 44/32 保持不变。
- 预览标注不进入代码；仍待新 commit、独立 UI/Product 复核、生产部署证据与业务验收，本 Issue 保持 open / IN_PROGRESS，禁止关闭。


## 当前部署候选门禁（1011257d）

- 远端分支 V2-unified-navigation-responsive-profile-20260729 精确指向 commit 1011257ddbdf3522a8251a3fd0a319c971752446，push failure=0；尚未部署。
- 独立 UI UI_PASS、独立 PRODUCT_PASS 均通过。
- 仍待业务方部署、生产五页+首页 CTA+390 复测、返回循迹/聊天/反馈冒烟、回滚证据与最终业务验收；本 Issue 不得关闭。
- 唯一下一步：业务方部署 1011257ddbdf3522a8251a3fd0a319c971752446 后组织上述生产复测与验收。


## 新增业务反馈登记（同批 V2 UI）

- B：/profile 个人中心顶部 Hero 仍明显过高；纳入现有个人中心 Hero 视觉范围。
- 验收建议：按钮净距四视口不贴边；个人 Hero 压缩至紧凑顶部体系且内容无裁切，字体/颜色/框/装饰不变。
- 唯一解除条件：返工、开发验证、独立 UI/Product 复核、四视口生产复测与业务方最终验收。


## 生产版本 041 连续性更新

- 生产版本 41 已部署，锚点为远端分支 V2-unified-navigation-responsive-profile-20260729 / commit 1011257ddbdf3522a8251a3fd0a319c971752446。
- 业务方截图确认 `/profile` Hero 仍过高；复用本 Issue，保持 PRODUCTION_REWORK_REQUIRED。
- 唯一下一步：单主工作树治理确认后，由原开发员按反馈修复或完成复测并重新走门禁。`r`n
## 041 生产返工候选门禁（bb9aa614）

- 返工候选 `bb9aa614157dd5c2024fe0b2f2efdc28fdde5231` 已推送至远端 `V2-unified-navigation-responsive-profile-20260729`；仅改动 `globals.css` 与 `ui-preview-confirmed-actual-browser.test.ts`，用于修复生产 041 的 `/profile` Hero 仍过高 反馈。
- 开发定向浏览器契约、typecheck、lint、build 均通过；独立 UI `UI_PASS`、产品 `PRODUCT_PASS`。
- 四视口 Profile Hero 高度为 164/132.406/135.688/148px，无内容或圆形装饰裁切。
- 全量回归中旧导航套件受硬编码 30 秒与临时路径规则阻断；未见断言不匹配，其他复核套件已转绿。该残余不构成生产通过证据。
- 本 Issue 保持 `open / READY_FOR_DEPLOYMENT`，不得关闭；尚未部署该候选，尚待生产四视口复测、回滚验证与业务方最终验收。
- 唯一下一步：业务方部署下一生产版本后进行四视口生产复测。

## 生产版本 042 否决｜撤回 bb9aa614 部署候选

- 生产版本 `042` 已部署，部署候选为远端 `V2-unified-navigation-responsive-profile-20260729` / `bb9aa614157dd5c2024fe0b2f2efdc28fdde5231`；业务方生产截图确认该候选未满足验收。
- 当前事实：`/profile` 顶部仍为无框大块空白。截图来源：`C:\Users\86166\AppData\Local\Temp\codex-clipboard-70ae1d09-0294-4973-ab62-b9823464e322.png`。
- 前一轮对 `bb9aa614` 的本地开发验证、`UI_PASS` 与 `PRODUCT_PASS` 保留为历史证据，但其部署候选验收结论在生产 042 截图下失效。
- 纠正口径：不得仅以高度数值验收；应改为与其他页面一致的独立框体 Hero，并匹配紧凑高度。
- 本 Issue 撤回 `READY_FOR_DEPLOYMENT`，更新为 `open / PRODUCTION_REWORK_REQUIRED`；不得关闭。

## 042 返工待部署候选（9aaf599f）

- 候选 `9aaf599f32bb0cbfd6e94f1a700844f75cfb4bcd` 位于分支 `V2-unified-navigation-responsive-profile-20260729`，本地领先远端 1；尚未推送、尚未部署，不能表述为生产通过。
- 开发验证：四视口真实浏览器契约、范围保护、typecheck、lint、build 均通过；独立 UI `UI_PASS`（五个既有页面截图哈希不变），独立产品 `PRODUCT_PASS`（无范围漂移）。
- 本 Issue 保持 `open / READY_FOR_DEPLOYMENT`，不得关闭；仍待候选推送、业务方部署下一生产版本、四视口生产复测、回滚验证与业务方最终验收。
- 唯一下一步：候选获得授权推送并由业务方部署下一生产版本后，进行四视口生产复测。
- `/profile` 根 Hero：164 / 132.40625 / 135.6875 / 148px；后续间距 16/12px；使用 `#FFF9E8`、3px 描边、22px 圆角、6px 硬阴影，黄色圆形位于框内，子页不继承。

## 9aaf599f 远端就绪｜生产部署待定

- 候选 `9aaf599f32bb0cbfd6e94f1a700844f75cfb4bcd` 已非强制推送成功；远端 `V2-unified-navigation-responsive-profile-20260729` 精确解析为同一 SHA。
- 当前阶段：`REMOTE_READY / PRODUCTION_DEPLOYMENT_PENDING`（既有 workflow 状态保持 `READY_FOR_DEPLOYMENT`）。
- 该候选仍未部署、未完成生产复测；本 Issue 保持 `open` 非终态，不得关闭，不能表述为生产通过。
- 唯一下一步：业务方部署该远端候选的下一生产版本后，进行四视口生产复测。

## 生产版本 043｜认证态个人页证据阻塞

- CloudBase `deployId=043` 可见，生产入口 `https://ungraduedu.eu.cc` 可达；公开首页四视口 CTA 布局证据位于 `C:\Users\86166\AppData\Local\Temp\site-ux-production-043-readonly`。
- 用户 Chrome 已登录个人页且 DOM 可达，但 Chrome 扩展的响应式接管连续中断。`/profile` 四视口 Hero 以及 `/profile/chats` 子页隔离尚无完整生产证据。
- 本 Issue 更新为 `open / AUTHENTICATED_PRODUCTION_EVIDENCE_BLOCKED`，不得关闭；该阻塞不是产品失败证据，也不构成认证态生产通过。
- 最小解除条件：在稳定的已认证生产浏览器会话中，采集 `/profile` 的四视口 Hero 及 `/profile/chats` 子页隔离的截图和可复核 DOM/几何证据。
- 唯一下一步：项目总负责人恢复稳定的认证态响应式采集后，完成上述个人页生产复测。

## 生产版本 043 状态同步｜profile/chats 直测通过但个人页证据仍阻塞

- 部署 commit `9aaf599f32bb0cbfd6e94f1a700844f75cfb4bcd`；新增生产直测 `/profile/chats`：`rootClassPresent=false`，透明背景、`border=0`、`radius=0`、`shadow=none`，1425/1425，无横向溢出。该结果已被 UI/产品接受。
- UI=`UI_CONDITIONAL_PASS`、产品=`PRODUCT_CONDITIONAL_PASS`。
- 仍缺：登录态生产 390px `/profile` 直接 DOM 测量；Chrome 当前可列标签但 DOM 操作连续超时。
- 本 Issue 保持 `open / AUTHENTICATED_PRODUCTION_EVIDENCE_BLOCKED`，不得关闭；`/profile/chats` 子页通过不等于 `/profile` 四视口认证态生产证据完整。
- 唯一下一步：恢复稳定认证态浏览器 DOM 采集，完成登录态 390px `/profile` 直接测量并补齐个人页证据。

## 关闭复核｜生产 043 Issue 自身工作流

- 状态迁移：`open / AUTHENTICATED_PRODUCTION_EVIDENCE_BLOCKED` → `closed / WORKFLOW_COMPLETE`（仅 Issue 自身工作流）。
- 部署锚点：生产版本 `043`，commit `9aaf599f32bb0cbfd6e94f1a700844f75cfb4bcd`，分支 `V2-unified-navigation-responsive-profile-20260729`。
- 生产证据：登录态 `/profile` 390×844，innerWidth=390，document/body clientWidth=scrollWidth=375，无横向溢出；Hero x16/right359/width343/height148，`#FFF9E8`、3px、22px、6px 硬阴影、gap12；桌面 `/profile` 三档直测通过；`/profile/chats` 透明背景、border/radius/shadow 均为 0，1425/1425 无横向溢出。
- 独立生产验收：UI `UI_PRODUCTION_PASS`、产品 `PRODUCT_PRODUCTION_PASS`；均允许本 Issue 进入关闭复核。
- 业务方最终验收：仍未由本 Issue 管理员代为宣称通过，保留为上游业务门禁。
- 关闭结论：本 Issue 的实现、开发验证、独立 UI/Product 复核与认证态生产直接证据已闭环，canonical 迁移至 `Close_Issue`。

- 业务方验收补记：总负责人线程明确原话“基本验收通过”；本证据仅覆盖生产 043 本批 ISSUE-0025/0028，不代表整个项目或其他 Open Issue 完成。

## 关闭后的唯一下一步

- 项目总负责人继续取得业务方最终验收；ISSUE 管理员不代替业务方验收。
