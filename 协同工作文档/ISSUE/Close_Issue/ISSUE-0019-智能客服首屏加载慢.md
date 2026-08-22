# ISSUE-0019 智能客服首屏加载慢

| 字段 | 内容 |
| --- | --- |
| id | `ISSUE-0019` |
| title | 智能客服首屏加载慢，需点开即可使用站内客服 |
| type | production bug / customer service entry |
| status | closed |
| priority | P1 |
| source | 用户反馈：智能客服点进去总要加载一秒钟左右；用户需要点开马上可以使用 |
| owner_agent | 代码开发员 / UI 设计师 / 产品经理 |
| related_files | `Code文档/app/customer-service/page.tsx`；`/customer-service` 页面；智能客服入口；站内客服对话首屏；Dify iframe 配置 |

## 复现现象

用户从站内进入智能客服页面时，首屏需要等待约一秒钟左右才能开始使用，未达到“点开马上可以使用”的体验预期。

已初步核查：线上 `/customer-service` 首次响应约 828ms，后续约 230ms；HTML 命中 `<iframe>` 和 Dify 文案，未命中站内离线客服对话。

## 初步原因

代码中 `Code文档/app/customer-service/page.tsx` 使用 `export const dynamic = "force-dynamic"`。

当配置 `NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL` 时，页面直接渲染 Dify iframe，首屏可用性依赖外部 iframe 加载链路，导致用户点开后需要等待外部服务内容初始化。

当前未命中站内离线客服对话或可立即交互的站内首屏兜底。

## 期望行为

用户点击智能客服入口后，应立即看到可用的站内客服交互界面或等价的即时可用首屏，不应因外部 iframe 加载而出现明显等待。

如果仍接入 Dify，应具备站内即时首屏、预加载、骨架态快速可用、或 iframe 加载完成前的可交互兜底方案，避免用户感知为“点进去还要等”。

## 关闭条件

本 Issue 只有在以下条件全部满足后，才允许进入关闭：

- `/customer-service` 首屏达到“点开即可使用”的体验预期，用户进入后无需等待外部 iframe 完成加载才能开始咨询或提交问题。
- 若继续使用 Dify iframe，页面需提供站内即时可交互兜底或等价方案，并明确 iframe 加载不阻塞首屏核心使用。
- 首次访问和后续访问均完成线上或目标环境核对，并记录响应时间、首屏可用状态和是否命中站内客服对话。
- 桌面端和移动端均完成智能客服入口到可用状态的冒烟验证，未出现空白等待、布局异常或交互不可用。
- 产品经理或 UI 设计师确认交互符合“点开马上可以使用”的预期。
- `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 通过，或交付说明中写明无法运行原因和风险。
- 具备提交 / 推送等 Git 闭环证据后，ISSUE 管理员再执行关闭归档。

## 处理记录

- 2026-07-07：由 ISSUE 管理员 Agent 根据 `CUSTOMER-SERVICE-INSTANT-2026-07-07-001-ISSUE-1` 登记为 Open。
- 2026-07-07：根据 `CUSTOMER-SERVICE-INSTANT-2026-07-07-001-ISSUE-CLOSE-1` 关闭并归档。关闭依据：代码提交 `09ed3b937353ee3f37b04429763466d8e4e87cd5` 已推送；开发验证 `npm test -- customer-service-page-copy`、`npm test -- chat-layout-css`、`npm run typecheck`、`npm run lint`、全量 `npm test`、`npm run build` 通过；UI 验收通过；项目总控制人反馈已部署最新代码；总负责人线上核对 `/customer-service` 返回 200，HTML 不含 iframe，包含站内智能客服、输入框 `customer-service-question` 和快捷问题，Dify 仅作为可选外链文案存在，后续访问约 270ms。
