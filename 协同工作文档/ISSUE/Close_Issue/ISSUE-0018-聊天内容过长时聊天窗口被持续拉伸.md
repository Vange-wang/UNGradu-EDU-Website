# ISSUE-0018 聊天内容过长时聊天窗口被持续拉伸

| 字段 | 内容 |
| --- | --- |
| id | `ISSUE-0018` |
| title | 聊天内容过长时聊天窗口被持续拉伸，应固定聊天窗口并在消息列表内滚动 |
| type | production bug / chat layout |
| status | closed |
| priority | P1 |
| source | 用户反馈：聊天内容过长时，会一直拉伸聊天框 |
| owner_agent | 代码开发员 / UI 设计师 / 产品经理 |
| related_files | 聊天详情页；聊天窗口布局；消息列表滚动区域；`/chats/[id]` 或等价聊天详情路由 |

## 复现现象

当聊天内容或消息数量过长时，聊天区域会随着内容持续向下拉伸，导致聊天框高度不断变大，页面整体被撑开。

该问题会影响用户回看历史消息和继续发送消息的体验，尤其在桌面端或移动端长对话场景中，聊天输入区和页面布局容易被长消息列表挤压。

## 期望行为

聊天窗口应保持固定或受控的可视高度，不应随着消息数量无限拉伸。

消息列表应在聊天窗口内部形成可滚动区域，用户可以在消息列表内上下滑动翻阅过往信息，同时保持聊天输入区和主要操作区域可用。

## 关闭条件

本 Issue 只有在以下条件全部满足后，才允许进入关闭：

- 聊天详情页或等价聊天窗口在长消息场景下高度固定或受控，不再随消息数量无限拉伸。
- 历史消息可在消息列表内部上下滚动查看。
- 聊天输入区和主要操作区在长消息场景下仍保持可见或可正常使用。
- 桌面端和移动端均完成长消息 / 多消息场景冒烟，未出现横向溢出、输入区被挤出或页面异常拉伸。
- 产品经理或 UI 设计师确认交互符合“固定聊天窗口 + 内部滚动”的预期。
- `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 通过，或交付说明中写明无法运行原因和风险。
- 具备提交 / 推送等 Git 闭环证据后，ISSUE 管理员再执行关闭归档。

## 处理记录

- 2026-07-07：由 ISSUE 管理员 Agent 根据 `CHAT-LAYOUT-FIX-2026-07-07-001-ISSUE-1` 登记为 Open。
- 2026-07-07：根据 `CHAT-LAYOUT-FIX-2026-07-07-001-ISSUE-CLOSE-1` 关闭。关闭依据：代码提交 `46ee468ff39cdcf5cbff6032cbccdc0bd584ec3b` 已推送；开发验证 `npm test -- chat-layout-css`、`npm run typecheck`、`npm run lint`、全量 `npm test`、`npm run build` 通过；UI 验收通过并允许进入关闭流程；项目总控制人反馈已部署最新代码；总负责人线上核对 `GET /chats/acceptance-probe` 返回 200，生产 CSS `/_next/static/css/c98f13933d2e389e.css` 包含 `overflow-y:auto`、`overscroll-behavior:contain` 和 `grid-template-rows`，确认聊天消息列表内部滚动约束已部署生效。
