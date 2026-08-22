# ISSUE-0030：冻结版站内聊天工作区与统一 Header 视觉应用

## 基本信息

- Issue ID：`ISSUE-0030`
- 类型：improvement / frozen UI iteration / chat workspace and Header visual application
- 状态：`closed`
- 工作流状态：`WORKFLOW_COMPLETE`
- 阶段口径：生产版本 044 的认证态四视口、聊天层级、真实返回轨迹、两项生产写入及业务方最终验收均已完成；Issue 自身已关闭
- 优先级：P1
- 登记日期：2026-08-01
- 来源：业务方原话：“确认，然后把上面冻结的版本开始开发”。
- 责任角色：代码开发员（实现与开发验证） / UI 设计师（独立 UI 复核） / 产品经理（独立产品复核） / 项目总负责人（部署与生产证据） / 业务方（最终验收） / ISSUE 管理员（编号与状态维护）。

## 冻结输入基线

- 目录：`C:\Users\86166\.codex\visualizations\2026\07\29\019fad1d-872b-7271-8c8b-6d4b87e3dd4f\ui-preview-0024-0029-20260801`，UI owner 标记：`UI_PREVIEW_FROZEN / IMPLEMENTATION_SEQUENCE_USER_DECISION_PENDING`；业务方现已将实施顺序决定为开始开发。
- `preview.html` SHA-256：`671A33D4DA512A4DE3028441C77387DE94B638A42F4ED62D1587F953E08ECD37`
- `measurements.md` SHA-256：`9E811101CD350B8A6BE3B722842C56FA96E05FCD09EA3F93DB6EF7FA27930BEA`
- `1280x800.png` SHA-256：`92DA9BB42CE6D976BDAC2C57AD853C3F0B3BB1B65C7BB5C6BFEF2DF20B61B844`
- `1440x900.png` SHA-256：`A60648139990623227127D4443F16485C736568FC9BD6FD06B7AD918C902756F`
- `1920x1080.png` SHA-256：`5BAA8A4D50192D094F520FA897575B27D3A952775807147F7120F06D594E57CA`
- `390x844.png` SHA-256：`16E0234413B474950B834E192370B1E0968409300CA715B19BE4BCACFA16809E`

## 范围与不可变边界

- 仅应用冻结预览所示的站内聊天工作区与统一 Header 视觉；不得以本 Issue 重开 ISSUE-0024 或 ISSUE-0029。
- 必须保留统一 Header 的返回箭头与 ISSUE-0024 已关闭的真实访问轨迹返回逻辑；本 Issue 不得改变该行为。
- 删除内容区重复“返回我的聊天”。
- 标签、Hero 与工作区不得相互重叠；聊天工作区、浅色状态区、消息区、composer 与发送按钮须与冻结的 1280×800、1440×900、1920×1080、390×844 基线一致。
- `PREVIEW ONLY` 仅为预览标注，不得进入生产页面。
- 不在本 Issue 中扩展字体、颜色、描边、阴影、圆角、框体或其他未冻结的产品/UI 范围。

## 原始关闭门禁（登记时）

1. 原代码开发员按冻结基线完成实现，并回传可追溯 commit 与开发验证证据。
2. 完成相关测试、类型检查、lint、构建及冻结四视口的实际布局验证；不得把预览标注带入页面。
3. 独立 UI 复核与独立产品复核均通过，且确认未改变真实访问轨迹返回行为。
4. 业务方部署后完成生产四视口与关键聊天/导航交互复测，留存回滚验证证据，并取得本 Issue 范围的业务方最终验收。

## 当前结论与唯一下一步

- 当前为 `closed / WORKFLOW_COMPLETE`，仅表示 ISSUE-0030 自身已完成；不代表其他 Open Issue 或整个项目完成。
- 唯一下一步：保持 ISSUE-0031/0032/0034 为 `open / DEFERRED`；只有业务方未来明确下令才启动统筹 Spec，Spec 门禁通过后先实现并彻底关闭 ISSUE-0033，再允许开发 ISSUE-0031/0032/0034。

## 部署候选与当前剩余门禁（2026-08-01）

- 分支：`V2-unified-navigation-responsive-profile-20260729`。
- 最终候选：`a9c66360efc59c3810812607203cd89d76cd8612`，已推送；回滚点：`6ce54ab4c19cf1366a53213f39ea2ff3e8dc9941`。候选尚未部署。
- 已通过的开发与独立门禁：聊天布局 7/7、UI 返工几何 5/5、实际 Next 四视口 1/1、导航 2/2，typecheck、lint、build 通过；独立 UI v2.3.0 第二轮 `UI_PASS`，产品经理 `PRODUCT_PASS`。
- 全量回归：首次为 298/299，唯一残余为既有本地 Next 前向导航时序；一次有界 retry 后为 69 files / 299 tests 通过。该环境型首次风险保留为历史证据，不等同于生产通过。
- 未通过的关闭门禁：业务方部署；生产四视口截图；聊天发送、联系方式交换、Header 真实访问轨迹返回核心操作复测；回滚验证；本 Issue 范围的业务方最终验收。
- 因上述生产与业务方门禁尚未发生，本 Issue 必须保持 `open / READY_FOR_DEPLOYMENT`，不得关闭或标记 `WORKFLOW_COMPLETE`。

## 生产版本 044｜认证态证据阻塞（2026-08-01，当前有效）

- 部署事实：业务方确认生产版本 `044` 已部署。
- 公网只读证据：apex `/`、`/profile`、`/profile/chats`、`/customer-service`、`/feedback` 均返回 HTTP 200；`www` 最终跳转 apex，响应经 Cloudflare。
- 已登录基础证据：用户 Chrome 已登录；生产 `/` 与 `/profile` 均实际加载，主页结构读取到已登录导航“个人页 / 智能客服 / 退出登录 / 规则”。
- 阻塞事实：Chrome 插件接管生产标签后继续结构化读取连续超时并重置，故生产四视口视觉、真实面包屑交互、聊天页面最终叠层及登录态页面全量生产证据尚未完成。该工具超时不是产品失败证据。
- 最小解除条件：恢复 Chrome 结构读取，补齐生产四视口视觉与聊天发送、联系方式交换、Header 真实访问轨迹返回等核心交互证据，并取得业务方对 ISSUE-0030 的最终生产验收确认。
- 当前状态：`open / AUTHENTICATED_PRODUCTION_EVIDENCE_BLOCKED`；不得关闭或标记 `WORKFLOW_COMPLETE`。

## 生产版本 044｜补证完成与用户验收待定（2026-08-01，当前有效）

- 已登录聊天证据：`/profile/chats` 可读，当前账号显示 2 个会话；进入真实会话 `/chats/conversation-d43e1f63-3096-4723-a8a7-35342dd36f37` 成功。
- 四视口生产实测：1280×800 的 document client/scroll width 为 1265/1265、Header 72px；1440×900 为 1425/1425、Header 72px；1920×1080 为 1905/1905、Header 72px；390×844 为 375/375、Header 64px。四档均无横向溢出、无重复“返回我的聊天”；移动端无大黑底，textarea、发送按钮及请求交换联系方式按钮均未越界。
- 视觉与层级：桌面/移动截图确认 Hero、标签与三栏工作区不重叠；内容区已删除重复“返回我的聊天”；输入区、发送按钮及联系方式交换区层级正常。
- 真实访问轨迹：主页→个人页→我的聊天→聊天详情，返回为详情→聊天列表→个人页→主页；主页→“我要找家教”发布页后返回直接回主页，无循环。
- 公网路由/HTTPS/Cloudflare 证据沿用前次登记。只读回滚锚点核对：当前分支/HEAD 为 `V2-unified-navigation-responsive-profile-20260729` / `a9c66360efc59c3810812607203cd89d76cd8612`；`a9c66360`、生产 043 锚点 `9aaf599f` 与较早候选 `6ce54ab4` 均可解析，回滚对象仍存在。
- Chrome 的 Statsig/`ab.chatgpt.com` 遥测请求超时未影响页面动作和上述证据，不是产品故障。
- 剩余门禁仅为会产生生产数据的真实发送聊天消息、真实请求交换联系方式，以及本 Issue 范围的业务方最终验收。未获业务方明确授权前不得执行前两项。
- 当前状态：`open / USER_ACCEPTANCE_PENDING`；不得关闭或标记 `WORKFLOW_COMPLETE`。

## 生产版本 044｜生产写入证据补齐（2026-08-01）

- 业务方提交生产截图：`C:\Users\86166\AppData\Local\Temp\codex-clipboard-06df71b8-73ac-4836-b203-d55cca06e656.png`；已由 ISSUE 管理员只读核对截图可见内容。
- 真实聊天发送：消息“你好”已显示，时间为 `2026/8/1 18:50:14`，作为真实聊天发送成功的生产写入证据。
- 真实联系方式交换请求：交换区显示“待处理 / 我发起的请求 / 2026/8/1”及“撤回”操作，作为真实请求交换联系方式成功写入的生产证据。
- 截图范围内消息区与联系方式交换区未重叠，状态清晰。
- 两项会产生生产数据的操作门禁已通过；业务方尚未明确表示“044 / ISSUE-0030 最终验收通过”，故当前仍为 `open / USER_ACCEPTANCE_PENDING`，不得关闭或标记 `WORKFLOW_COMPLETE`。
- 唯一下一步：等待业务方明确给出 ISSUE-0030 的最终验收确认。

## 正式关闭复核｜生产版本 044（2026-08-01）

- 业务方最终验收：业务方明确回复“验收通过”。
- 部署与候选：生产版本 `044`；候选/HEAD `a9c66360efc59c3810812607203cd89d76cd8612`，分支 `V2-unified-navigation-responsive-profile-20260729`。
- 闭环证据：生产四视口无横向溢出与正确 Header 高度、Hero/标签/工作区无重叠、内容区无重复“返回我的聊天”；真实访问轨迹返回通过；真实聊天发送与真实联系方式交换请求均已写入并留存截图；回滚锚点 `a9c66360`、`9aaf599f`、`6ce54ab4` 可解析且仍存在。
- 说明：Chrome Statsig/`ab.chatgpt.com` 遥测请求超时未影响页面动作或验收证据，不是产品故障。
- 状态迁移：`open / USER_ACCEPTANCE_PENDING` → `closed / WORKFLOW_COMPLETE`。canonical 迁移至 `Close_Issue`；该关闭仅覆盖 ISSUE-0030，不改变 ISSUE-0020，亦不启动 ISSUE-0031/0032/0033/0034。

## 关闭后的唯一下一步

- 等待业务方未来明确下令；届时方可启动 ISSUE-0031/0032/0034 的统筹 Spec。Spec 门禁通过并获业务方确认后，先实施并彻底关闭 ISSUE-0033，再允许开发 ISSUE-0031/0032/0034。
