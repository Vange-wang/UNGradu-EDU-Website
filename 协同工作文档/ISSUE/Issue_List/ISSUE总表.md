# ISSUE 总表

更新日期：2026-07-18

维护负责人：ISSUE 管理员 Agent

来源说明：本表记录项目 Issue 编号、状态、优先级、责任 Agent、处理记录和关闭依据。所有 Issue 编号稳定，不随状态变化复用或改号。

## Open Issue

| id | title | type | status | priority | source | owner_agent | related_files | 关闭条件摘要 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ISSUE-0020` | 临时 Cloudflare Worker 反代与安全基线加固 | ops / security hardening / deployment workaround | open / EXTERNAL_BLOCKED | P1 | `ungradeedu.eu.cc` 已进入生产；zone 技术配置证据已通过，等待业务风险接受闭环 | 业务方（唯一剩余门禁） / 项目总负责人（确认路由与恢复） / ISSUE 管理员（状态维护） | Cloudflare Worker `ungradu-edu-proxy`；生产版本 `d8eff139`；`ungradeedu.eu.cc` 根域与 `www`；workers.dev 回退入口；提交 `23620c99a8e0c322c913af9f4f4f5bd0d494eda3`、`f2cadb573236b51e06a4ac70430eef728b0e93e9`；安全响应头、TLS 与去指纹验证记录；`协同工作文档/ISSUE/Open_Issue/ISSUE-0020-临时CloudflareWorker反代与安全基线加固.md` | 技术、部署、Git、生产行为、产品验收及 zone 配置证据门禁已通过；保持 Open。唯一剩余门禁：业务方逐项接受 workers.dev 可直访、CloudBase 源站绕过、单一上游、无持续监控、SSL Full 非 strict、Managed/Custom/Rate-limit/Bot/AI bot/Leaked credentials 等未启用或不覆盖风险。唯一下一步：项目总负责人取得业务方明确接受原文并路由 ISSUE 管理员最终复核 |

## Closed Issue

| id | title | type | status | priority | source | owner_agent | related_files | 关闭依据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ISSUE-0001` | `release:production:preflight` 脚本在远端分支缺失，但被作为通过证据引用 | bug / 验收材料不一致 | closed | P0 | 正式生产上线阶段第一次 Claude 复核报告 | 代码开发员 / 产品经理 | `Code文档/package.json`; `Code文档/scripts/production-readiness-check.mjs` | 代码开发员已推送 `ba24ccabc4c38303e4806979aef6f453ee7cf963`；产品经理第二次审查通过；Claude Code 第二次复核确认关闭 |
| `ISSUE-0002` | `clean-next-build.mjs` 与构建脚本调整在远端分支缺失，无法复核 Windows/中文路径构建修复 | bug / 验收材料不一致 | closed | P0 | 正式生产上线阶段第一次 Claude 复核报告 | 代码开发员 | `Code文档/scripts/clean-next-build.mjs`; `Code文档/package.json`; `Code文档/next.config.ts` | 代码开发员已推送 `ba24ccabc4c38303e4806979aef6f453ee7cf963`；产品经理第二次审查通过；Claude Code 第二次复核确认关闭 |
| `ISSUE-0003` | `production-readiness-script.test.ts` 在远端分支缺失，测试数量与验收报告不一致 | bug / 验收材料不一致 | closed | P1 | 正式生产上线阶段第一次 Claude 复核报告 | 代码开发员 / 产品经理 | `Code文档/tests/production-readiness-script.test.ts` | 代码开发员已推送 `ba24ccabc4c38303e4806979aef6f453ee7cf963`；产品经理第二次审查通过；Claude Code 第二次复核确认关闭 |
| `ISSUE-0004` | 代码侧可发行版本准备说明与 Release Spec 相关目录在远端分支缺失或不可见，导致文档交付证据不完整 | 验收材料不一致 / 文档缺失 | closed | P1 | 正式生产上线阶段第一次 Claude 复核报告 | 产品经理 / 项目总控制人 | `规划文档/里程碑文档/正式生产上线准备/代码侧可发行版本准备说明.md`; `规划文档/Spec文档/Release_version_Spec/2026-06-25-mvp-正式生产上线-spec.md` | 代码开发员已推送 `ba24ccabc4c38303e4806979aef6f453ee7cf963`；产品经理第二次审查通过；Claude Code 第二次复核确认关闭 |
| `ISSUE-0005` | 发布阶段 S1 审查报告远端追溯链条规范化 | process / documentation | closed | P1 | Claude Code 第二次复核报告 / 发布阶段 S1 收口 | 项目总负责人 / 产品经理 / ISSUE 管理员 | `规划文档/Spec文档/Release_version_Spec/2026-06-29-release-s1-发布阶段-spec.md`; `协同工作文档/阶段任务闭环工作流.md` | 2026-06-30 关闭；已将该问题纳入发布阶段 S1 追溯归档规范，明确 S1 已完成、后续从 S2+ 继续规划；阶段任务闭环工作流已补充远端追溯口径 |
| `ISSUE-0006` | 发布家教信息时课时费/学段只能填写一组，需要支持多组“学段 + 课时费” | feature / improvement | closed | P1 | 正式环境试用反馈 | 产品经理 / 代码开发员 | 家教信息发布表单；老师资料展示页；`规划文档/里程碑文档/登录与发布体验优化阶段验收报告/2026-06-28-登录与发布体验优化第一次最终审查报告.md` | 2026-06-28 关闭；目标 commit `987d59aad58ca50e2194232692dfd43835abced7`；产品经理第一次审查确认通过；ZCode 第一次复核确认已修复并允许验收；最终审查报告建议交由 ISSUE 管理员关闭 |
| `ISSUE-0007` | 已登录后仍可点击登录按钮并看到空白登录/注册表单，容易误操作 | bug / improvement | closed | P1 | 正式环境试用反馈 | 产品经理 / 代码开发员 | 登录入口；登录/注册页；已登录态导航；`规划文档/里程碑文档/登录与发布体验优化阶段验收报告/2026-06-28-登录与发布体验优化第一次最终审查报告.md` | 2026-06-28 关闭；目标 commit `987d59aad58ca50e2194232692dfd43835abced7`；产品经理第一次审查确认通过；ZCode 第一次复核确认已修复并允许验收；最终审查报告建议交由 ISSUE 管理员关闭 |
| `ISSUE-0008` | UI 缺少返回按钮，表单页/详情页返回不方便 | production regression / improvement | closed | P2 | 正式环境继续试用反馈 | 产品经理 / 代码开发员 | 表单页；详情页；导航组件；生产环境页面验收记录；`规划文档/里程碑文档/生产试运行体验修复阶段验收报告/2026-06-29-生产试运行登录与基础体验修复第一次产品审查报告.md` | 2026-06-29 关闭；产品审查报告允许进入 ISSUE 管理员关闭 / 流转；分支 `codex/prod-ux-auth-fixes-20260628` 当前 head `3b52d09e`；主修复提交 `b6ff351e`；总负责人 `typecheck`、`test`（33 files / 137 tests）、`lint`、`build` 四项验证通过 |
| `ISSUE-0009` | UI 出现过多杂乱无序的字母数字字段，内部 ID/技术字段不应裸露给普通用户 | bug / improvement | closed | P1 | 正式环境试用反馈 | 产品经理 / 代码开发员 | 列表页；详情页；用户可见信息展示区域；`规划文档/里程碑文档/登录与发布体验优化阶段验收报告/2026-06-28-登录与发布体验优化第一次最终审查报告.md` | 2026-06-28 关闭；目标 commit `987d59aad58ca50e2194232692dfd43835abced7`；产品经理第一次审查确认通过；ZCode 第一次复核确认已修复并允许验收；最终审查报告建议交由 ISSUE 管理员关闭 |
| `ISSUE-0010` | 聊天窗暂无法验证：当前只有一个账号，需要至少两个邮箱账号分别模拟家长和老师 | question / validation | closed | P2 | 正式环境试用反馈 | 项目总控制人 / 产品经理 | 聊天窗；聊天流程验收记录 | 2026-06-29 关闭；项目总控制人正式环境验收反馈“聊天功能正常”，并确认交换联系方式正常、保存密码正常、密码登录正常；本 Issue 原关闭条件为补充双账号聊天窗验收，现已满足 |
| `ISSUE-0011` | 未登录状态导航显示退出登录但缺少登录入口 | production regression / bug | closed | P1 | 正式环境继续试用反馈 | 产品经理 / 代码开发员 | 顶部导航；登录入口；个人页面入口；会话状态判断；`规划文档/里程碑文档/生产试运行体验修复阶段验收报告/2026-06-29-生产试运行登录与基础体验修复第一次产品审查报告.md` | 2026-06-29 关闭；产品审查报告允许进入 ISSUE 管理员关闭 / 流转；分支 `codex/prod-ux-auth-fixes-20260628` 当前 head `3b52d09e`；主修复提交 `b6ff351e`；总负责人 `typecheck`、`test`（33 files / 137 tests）、`lint`、`build` 四项验证通过 |
| `ISSUE-0012` | 退出登录缺少二次确认 | improvement / security confirmation | closed | P2 | 正式环境继续试用反馈 | 产品经理 / 代码开发员 | 退出登录按钮；会话退出流程；确认弹窗或等价确认交互；`规划文档/里程碑文档/生产试运行体验修复阶段验收报告/2026-06-29-生产试运行登录与基础体验修复第一次产品审查报告.md` | 2026-06-29 关闭；产品审查报告允许进入 ISSUE 管理员关闭 / 流转；分支 `codex/prod-ux-auth-fixes-20260628` 当前 head `3b52d09e`；主修复提交 `b6ff351e`；总负责人 `typecheck`、`test`（33 files / 137 tests）、`lint`、`build` 四项验证通过 |
| `ISSUE-0013` | 验证码登录服务不可用后验证码仍被标记已使用 | production bug / auth main flow | closed | P0 | 正式环境继续试用反馈 | 代码开发员 / 产品经理 | 邮箱验证码登录；验证码校验与消费逻辑；登录错误提示；生产环境认证配置；`规划文档/里程碑文档/生产试运行体验修复阶段验收报告/2026-06-29-生产试运行登录与基础体验修复第一次产品审查报告.md` | 2026-06-29 关闭；产品审查报告允许进入 ISSUE 管理员关闭 / 流转；分支 `codex/prod-ux-auth-fixes-20260628` 当前 head `3b52d09e`；主修复提交 `b6ff351e`；总负责人 `typecheck`、`test`（33 files / 137 tests）、`lint`、`build` 四项验证通过 |
| `ISSUE-0014` | 首次注册后支持设置密码并使用密码登录 | feature / product requirement | closed | P2 | 正式环境继续试用反馈 | 产品经理 / 代码开发员 | 注册流程；账号体系；密码设置；密码登录入口；安全策略；`规划文档/里程碑文档/生产试运行体验修复阶段验收报告/2026-06-29-生产试运行登录与基础体验修复第一次产品审查报告.md` | 2026-06-29 关闭为本轮 MVP 已完成；产品审查报告允许进入 ISSUE 管理员关闭 / 流转；分支 `codex/prod-ux-auth-fixes-20260628` 当前 head `3b52d09e`；主修复提交 `b6ff351e`；总负责人 `typecheck`、`test`（33 files / 137 tests）、`lint`、`build` 四项验证通过 |
| `ISSUE-0015` | 登录退出后右上角导航登录状态UI不及时同步 | production regression / auth ui state | closed | P1 | 正式环境继续试用反馈 / 总负责人初步分析 | 代码开发员 / 产品经理 | `Code文档/features/auth/session-nav.tsx`; `Code文档/features/auth/use-test-session.ts`; `Code文档/features/auth/login-form.tsx`; `Code文档/features/auth/logout-button.tsx`; `Code文档/app/api/auth/session/route.ts` | 2026-06-29 关闭；修复提交 `2d409faf820d76a497a33a77e11045bc0e2d6b07` 已推送至 `codex/prod-ux-auth-fixes-20260628`；总负责人验证 `auth-session-events`、`typecheck`、全量测试（34 files / 143 tests）、`lint`、`build` 通过；项目总控制人正式环境验收确认登录状态和 UI 不匹配问题已解决 |
| `ISSUE-0016` | UI 界面多余说明文字需要删除或压缩，避免内部术语和重复说明干扰核心操作 | improvement / ui copy | closed | P2 | `VNEXT-UI-COPY-RISK-2026-07-07-001` 任务分发 / 业务方要求删除 UI 多余说明文字 | 代码开发员 / UI 设计师 / 产品经理 | 首页、登录页、规则页、反馈页、发布需求页、发布家教信息页、个人中心 / 联系方式页、聊天页；UI 文案精简清单；`协同工作文档/交流记录/2026-07-07-vNext-UI文案精简与风险反馈最小闭环任务分发.md` | 2026-07-07 关闭；代码提交 `26af84fa21af52e1b77185e4cfd72124a832d158` 已推送；代码开发员验证 `typecheck`、`lint`、`test`、`build` 通过，并完成相关页面 / 反馈页桌面端与移动端冒烟；产品经理验收通过；UI 设计师验收有条件通过并允许关闭前流程 |
| `ISSUE-0017` | 风险反馈 / 举报投诉缺少最小记录能力，用户无法完成风险反馈最小闭环 | feature / risk feedback | closed | P1 | `VNEXT-UI-COPY-RISK-2026-07-07-001` 任务分发 / S5 vNext 风险反馈最小闭环候选 | 代码开发员 / 产品经理 | `/feedback` 或等价入口；风险反馈 / 举报投诉最小记录能力；风险提示文案；`协同工作文档/交流记录/2026-07-07-vNext-UI文案精简与风险反馈最小闭环任务分发.md` | 2026-07-07 关闭；代码提交 `26af84fa21af52e1b77185e4cfd72124a832d158` 已推送；代码开发员验证 `typecheck`、`lint`、`test`、`build` 通过；产品经理验收和 UI 设计师验收均为有条件通过；CloudBase 集合 `risk_feedback_records` 已配置；目标环境 `/api/feedback` POST 写入核对通过并返回 200，记录 ID：`risk-feedback-bfd1edb4-a489-4243-b44d-0cc76cf4b961` |
| `ISSUE-0018` | 聊天内容过长时聊天窗口被持续拉伸，应固定聊天窗口并在消息列表内滚动 | production bug / chat layout | closed | P1 | 用户反馈：聊天内容过长时，会一直拉伸聊天框 | 代码开发员 / UI 设计师 / 产品经理 | 聊天详情页；聊天窗口布局；消息列表滚动区域；`/chats/[id]` 或等价聊天详情路由 | 2026-07-07 关闭；代码提交 `46ee468ff39cdcf5cbff6032cbccdc0bd584ec3b` 已推送；开发验证 `npm test -- chat-layout-css`、`npm run typecheck`、`npm run lint`、全量 `npm test`、`npm run build` 通过；UI 验收通过并允许进入关闭流程；项目总控制人反馈已部署最新代码；总负责人线上核对 `GET /chats/acceptance-probe` 返回 200，生产 CSS `/_next/static/css/c98f13933d2e389e.css` 包含 `overflow-y:auto`、`overscroll-behavior:contain` 和 `grid-template-rows`，确认聊天消息列表内部滚动约束已部署生效 |
| `ISSUE-0019` | 智能客服首屏加载慢，需点开即可使用站内客服 | production bug / customer service entry | closed | P1 | 用户反馈：智能客服点进去总要加载一秒钟左右；用户需要点开马上可以使用 | 代码开发员 / UI 设计师 / 产品经理 | `Code文档/app/customer-service/page.tsx`; `/customer-service` 页面；智能客服入口；站内客服对话首屏；Dify iframe 配置 | 2026-07-07 关闭；代码提交 `09ed3b937353ee3f37b04429763466d8e4e87cd5` 已推送；开发验证 `npm test -- customer-service-page-copy`、`npm test -- chat-layout-css`、`npm run typecheck`、`npm run lint`、全量 `npm test`、`npm run build` 通过；UI 验收通过并允许进入关闭流程；项目总控制人反馈已部署最新代码；总负责人线上核对 `GET /customer-service` 返回 200，HTML 不含 iframe，包含站内智能客服、输入框 `customer-service-question` 和快捷问题，Dify 仅作为可选外链相关文案存在，后续访问约 270ms |

## 关闭统一条件

本批 Issue 只有在以下三项均满足后，才允许关闭：

- 代码开发员已补推或明确修复对应仓库内容。
- 产品经理已重新审查并确认验收材料与仓库内容一致。
- Claude 复核已确认对应问题消除或给出允许关闭结论。
