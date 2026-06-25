# ISSUE-0001 `release:production:preflight` 脚本缺失

| 字段 | 内容 |
| --- | --- |
| id | `ISSUE-0001` |
| title | `release:production:preflight` 脚本在远端分支缺失，但被作为通过证据引用 |
| type | bug / 验收材料不一致 |
| status | closed |
| priority | P0 |
| source | 正式生产上线阶段第一次 Claude 复核报告 |
| source_report | `规划文档/里程碑文档/正式生产上线阶段验收报告/2026-06-25-mvp正式生产上线第一次Claude复核报告.md` |
| owner_agent | 代码开发员 / 产品经理 |
| related_files | `Code文档/package.json`; `Code文档/scripts/production-readiness-check.mjs`（缺失） |
| resolution | 已关闭：代码开发员已推送远端 commit `ba24ccabc4c38303e4806979aef6f453ee7cf963`，产品经理第二次审查通过，Claude Code 第二次复核确认关闭。 |

## 描述

Claude 复核指出，正式生产上线第一次验收材料将 `npm run release:production:preflight` 的执行结果作为核心通过证据，但远端复核分支中的 `Code文档/package.json` 不存在该 npm script，`Code文档/scripts/production-readiness-check.mjs` 也不可见。

## 严重级别

P0。

## 责任归因

验收材料不一致。代码侧脚本或 package 配置未在远端分支可见，同时产品经理验收材料引用了不可复核的执行证据。

## 修复动作

- 代码开发员确认 `release:production:preflight` 和 `production-readiness-check.mjs` 是否应存在于当前正式生产上线复核分支。
- 若已本地实现但未推送，补推到远端复核分支。
- 若该脚本不属于本轮范围，产品经理更正验收报告，移除或替换不可复核证据。
- 补齐后重新提供可复核的命令、脚本路径和执行结果。

## 关闭条件

只有代码开发员补推或产品经理更正证据后，且产品经理审查、Claude 复核均确认该问题消除，才允许关闭。

## 处理记录

- 2026-06-25：由 ISSUE 管理员 Agent 根据正式生产上线阶段第一次 Claude 复核报告登记为 Open。

## 关闭记录

- 关闭时间：2026-06-25
- 关闭依据：代码开发员已推送远端 commit `ba24ccabc4c38303e4806979aef6f453ee7cf963`。
- 产品经理第二次审查：`规划文档/里程碑文档/正式生产上线阶段验收报告/2026-06-25-mvp正式生产上线第二次验收报告.md`，结论通过。
- Claude Code 第二次复核：`规划文档/里程碑文档/正式生产上线阶段验收报告/2026-06-25-mvp正式生产上线第二次Claude复核报告.md`，确认本 Issue 关闭。
- 最终状态：closed。