# ISSUE-0025：生产页面响应式溢出与首页入口卡列宽一致

## 基本信息

- Issue ID：`ISSUE-0025`
- 关联任务：`SITE-UX-AUTH-PROD-20260729-001`
- 状态维护任务：`SITE-UX-ISSUE-GATE-20260729-001`
- 生产门禁维护任务：`SITE-UX-ISSUE-PROD-GATE-20260729-001`
- 类型：production regression / responsive layout
- 状态：`closed`
- 工作流状态：`WORKFLOW_COMPLETE`
- 阶段口径：生产 043 直接证据、UI_PRODUCTION_PASS、PRODUCT_PRODUCTION_PASS 已完成；Issue 自身已关闭，业务方最终验收单独保留
- 优先级：P1
- 登记日期：2026-07-29
- 来源：业务方在生产版本 036 试用中提供的截图与明确要求。
- 责任角色：代码开发员（实现与开发验证已完成） / UI 设计师（独立复核已通过） / 产品经理（产品验收已通过） / 项目总负责人（部署与生产证据） / 业务方（部署与最终验收） / ISSUE 管理员（状态维护）。

## 用户可见症状与截图映射

- 截图 1：登录页存在页面溢出；导航问题由 `ISSUE-0024` 跟踪，本 Issue 仅跟踪响应式布局影响。
- 截图 2：Chrome 100% 正常缩放时，首页下方同一网格中的功能卡列宽及左右边界不一致。

## 冻结范围

- 代码诊断已确认：登录页在 1280×800、Chrome 100% 下存在 18px 横向溢出；首页固定 `443px` 首列导致第二列变窄。
- UI 桌面与移动预览已经业务方确认；后续实现必须消除上述响应式问题，并与批准预览一致。
- 分支治理冻结：未来分支格式为 `Vx-分支正名-日期`；仅大类切换新分支，提交前如需切换必须先问业务方；当前只登记，不创建或切换分支。

## 已通过门禁与证据

1. 代码开发员已回报 `DIAGNOSIS_READY`：登录页 1280×800 / 100% 横向溢出 18px；首页固定 443px 首列导致第二列变窄。诊断证据目录：`C:\Users\86166\AppData\Local\Temp\site-ux-diag-20260729`。
2. UI 已回报 `UI_PREVIEW_READY`，桌面与移动预览目录：`C:\Users\86166\AppData\Local\Temp\site-ux-preview-20260729-001\`。
3. 业务方已通过预览，`BUSINESS_PREVIEW_CONFIRMATION` 门禁通过。
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

- `ISSUE-0022` 已关闭；本 Issue 是生产版本 036 的新截图范围，不重开或覆盖其关闭事实。
- 生产部署与技术门禁通过不等于浏览器证据、生产多视口/交互复测、回滚验证或业务方最终验收通过；本 Issue 保持 Open。
- ISSUE 管理员不实现、不部署、不作视觉验收。


## 生产验收追加反馈（撤回 fd581cfe）

- 首页两个 CTA 尺寸必须一致；反馈页左侧大面积纯黑块必须移除，纳入响应式/视觉回归返工。`r`n- 唯一解除条件：对应返工、开发验证、独立 UI、产品复核、生产多视口/交互复测、回滚验证与业务方最终验收全部通过。`r`n

## 生产 038 追加问题 5–6

- 问题 5：发布需求、发布家教信息、需求详情、家教详情、站内聊天顶部介绍区高度过高；要求统一压缩至智能客服顶部介绍区相近的紧凑高度。
- 问题 6：首页主标题/卖点区到下方发布 CTA 卡的垂直间距过大。
- 两项纳入 ISSUE-0025 的响应式与页面几何范围，不重复创建 Issue；当前候选仍撤回，状态保持 open / REWORK_REQUIRED。
- 唯一解除条件：1280/1440/1920/390 实际几何核对通过，并完成 UI 与产品独立复核，随后再进行生产复测与业务验收。


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

- A：首页左侧我要找家教按钮下缘贴近卡片底边，100% 缩放缺少稳定呼吸区；纳入现有 CTA/几何间距范围。
- 验收建议：按钮净距四视口不贴边；个人 Hero 压缩至紧凑顶部体系且内容无裁切，字体/颜色/框/装饰不变。
- 唯一解除条件：返工、开发验证、独立 UI/Product 复核、四视口生产复测与业务方最终验收。


## 生产版本 041 连续性更新

- 生产版本 41 已部署，锚点为远端分支 V2-unified-navigation-responsive-profile-20260729 / commit 1011257ddbdf3522a8251a3fd0a319c971752446。
- 业务方截图确认首页左 CTA 按钮下方贴边；复用本 Issue，保持 PRODUCTION_REWORK_REQUIRED。
- 唯一下一步：单主工作树治理确认后，由原开发员按反馈修复或完成复测并重新走门禁。`r`n
## 041 生产返工候选门禁（bb9aa614）

- 返工候选 `bb9aa614157dd5c2024fe0b2f2efdc28fdde5231` 已推送至远端 `V2-unified-navigation-responsive-profile-20260729`；仅改动 `globals.css` 与 `ui-preview-confirmed-actual-browser.test.ts`，用于修复生产 041 的 首页左 CTA 按钮下方贴边 反馈。
- 开发定向浏览器契约、typecheck、lint、build 均通过；独立 UI `UI_PASS`、产品 `PRODUCT_PASS`。
- 四视口 CTA 底部净距为 22/22/22/20px，左右差 0。
- 全量回归中旧导航套件受硬编码 30 秒与临时路径规则阻断；未见断言不匹配，其他复核套件已转绿。该残余不构成生产通过证据。
- 本 Issue 保持 `open / READY_FOR_DEPLOYMENT`，不得关闭；尚未部署该候选，尚待生产四视口复测、回滚验证与业务方最终验收。
- 唯一下一步：业务方部署下一生产版本后进行四视口生产复测。

## 生产版本 042 否决｜撤回 bb9aa614 部署候选

- 生产版本 `042` 已部署，部署候选为远端 `V2-unified-navigation-responsive-profile-20260729` / `bb9aa614157dd5c2024fe0b2f2efdc28fdde5231`；业务方生产截图确认该候选未满足验收。
- 当前事实：首页“我要找家教”按钮横向尤其右侧过近、左右内距不均。截图来源：`C:\Users\86166\AppData\Local\Temp\codex-clipboard-b10da656-ee83-4976-92d4-4d97a605bdc7.png`。
- 前一轮对 `bb9aa614` 的本地开发验证、`UI_PASS` 与 `PRODUCT_PASS` 保留为历史证据，但其部署候选验收结论在生产 042 截图下失效。
- 纠正口径：不得再以 CTA 底部净距作为该反馈的验收结论；应验证 CTA 左右内距均衡且不贴边。
- 本 Issue 撤回 `READY_FOR_DEPLOYMENT`，更新为 `open / PRODUCTION_REWORK_REQUIRED`；不得关闭。

## 042 返工待部署候选（9aaf599f）

- 候选 `9aaf599f32bb0cbfd6e94f1a700844f75cfb4bcd` 位于分支 `V2-unified-navigation-responsive-profile-20260729`，本地领先远端 1；尚未推送、尚未部署，不能表述为生产通过。
- 开发验证：四视口真实浏览器契约、范围保护、typecheck、lint、build 均通过；独立 UI `UI_PASS`（五个既有页面截图哈希不变），独立产品 `PRODUCT_PASS`（无范围漂移）。
- 本 Issue 保持 `open / READY_FOR_DEPLOYMENT`，不得关闭；仍待候选推送、业务方部署下一生产版本、四视口生产复测、回滚验证与业务方最终验收。
- 唯一下一步：候选获得授权推送并由业务方部署下一生产版本后，进行四视口生产复测。
- CTA 几何：1280/1440/1920 两卡左右内距均为 32px；390 均为 20px；逐行对齐差 0，无横向溢出。

## 9aaf599f 远端就绪｜生产部署待定

- 候选 `9aaf599f32bb0cbfd6e94f1a700844f75cfb4bcd` 已非强制推送成功；远端 `V2-unified-navigation-responsive-profile-20260729` 精确解析为同一 SHA。
- 当前阶段：`REMOTE_READY / PRODUCTION_DEPLOYMENT_PENDING`（既有 workflow 状态保持 `READY_FOR_DEPLOYMENT`）。
- 该候选仍未部署、未完成生产复测；本 Issue 保持 `open` 非终态，不得关闭，不能表述为生产通过。
- 唯一下一步：业务方部署该远端候选的下一生产版本后，进行四视口生产复测。

## 生产版本 043｜公开布局通过，认证 CTA 复测待定

- CloudBase `deployId=043` 可见，生产入口 `https://ungraduedu.eu.cc` 可达。公开首页四视口证据目录：`C:\Users\86166\AppData\Local\Temp\site-ux-production-043-readonly`。
- 公开布局生产通过：1280/1440/1920 两卡 CTA 左右均为 32/32px；390 为 20/20px；标题/副标题/按钮行对齐差 0；无页面横向溢出。负责人已独立查看 1440 与 390 截图，未见贴边或溢出。
- 未通过：无痕生产会话为未登录态，两个 CTA 均 disabled，无法安全验证已认证用户的 CTA 点击。
- 本 Issue 更新为 `open / ACCEPTANCE_PENDING`，不得关闭；公开布局通过不等于认证交互或业务最终验收通过。
- 最小解除条件：在受控已认证生产会话中实际点击两个 CTA 并取得可复核结果，且不引入横向溢出。
- 唯一下一步：项目总负责人组织受控已认证生产会话，复测两个 CTA 点击。

## 生产版本 043 状态同步｜认证 CTA 仍待复测

- 部署 commit `9aaf599f32bb0cbfd6e94f1a700844f75cfb4bcd`；生产 `/profile/chats` 直测证据已补充并通过 UI/产品条件接受，但本 Issue 的公开 CTA 布局通过不等于已认证 CTA 点击通过。
- 仍缺：登录态主页“我要找家教/我要做家教”真实点击跳转；无痕会话两个 CTA disabled，不能替代认证态点击证据。
- UI=`UI_CONDITIONAL_PASS`、产品=`PRODUCT_CONDITIONAL_PASS`；本 Issue 保持 `open / ACCEPTANCE_PENDING`，不得关闭。
- 唯一下一步：在稳定已认证生产会话中实际点击两个主页 CTA，记录跳转结果并复核无横向溢出。

## 关闭复核｜生产 043 Issue 自身工作流

- 状态迁移：`open / ACCEPTANCE_PENDING` → `closed / WORKFLOW_COMPLETE`（仅 Issue 自身工作流）。
- 部署锚点：生产版本 `043`，commit `9aaf599f32bb0cbfd6e94f1a700844f75cfb4bcd`，分支 `V2-unified-navigation-responsive-profile-20260729`。
- 生产证据：公开首页四视口 CTA 左右内距 32/32px（1280/1440/1920）、20/20px（390），行对齐差 0，无横向溢出；登录态主页“我要找家教”跳转 `/parent-needs/new`，“我要做家教”跳转 `/tutor-profiles/new`。
- 独立生产验收：UI `UI_PRODUCTION_PASS`、产品 `PRODUCT_PRODUCTION_PASS`；均允许本 Issue 进入关闭复核。
- 业务方最终验收：仍未由本 Issue 管理员代为宣称通过，保留为上游业务门禁。
- 关闭结论：本 Issue 的实现、开发验证、独立 UI/Product 复核与生产直接证据已闭环，canonical 迁移至 `Close_Issue`。

- 业务方验收补记：总负责人线程明确原话“基本验收通过”；本证据仅覆盖生产 043 本批 ISSUE-0025/0028，不代表整个项目或其他 Open Issue 完成。

## 关闭后的唯一下一步

- 项目总负责人继续取得业务方最终验收；ISSUE 管理员不代替业务方验收。
