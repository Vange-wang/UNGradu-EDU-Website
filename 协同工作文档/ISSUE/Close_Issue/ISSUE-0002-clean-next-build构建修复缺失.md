# ISSUE-0002 `clean-next-build.mjs` 构建修复缺失

| 字段 | 内容 |
| --- | --- |
| id | `ISSUE-0002` |
| title | `clean-next-build.mjs` 与构建脚本调整在远端分支缺失，无法复核 Windows/中文路径构建修复 |
| type | bug / 验收材料不一致 |
| status | closed |
| priority | P0 |
| source | 正式生产上线阶段第一次 Claude 复核报告 |
| source_report | `规划文档/里程碑文档/正式生产上线阶段验收报告/2026-06-25-mvp正式生产上线第一次Claude复核报告.md` |
| owner_agent | 代码开发员 |
| related_files | `Code文档/scripts/clean-next-build.mjs`（缺失）; `Code文档/package.json`; `Code文档/next.config.ts` |
| resolution | 已关闭：代码开发员已推送远端 commit `ba24ccabc4c38303e4806979aef6f453ee7cf963`，产品经理第二次审查通过，Claude Code 第二次复核确认关闭。 |

## 描述

Claude 复核指出，验收材料声称 P0 构建阻塞已通过新增 `Code文档/scripts/clean-next-build.mjs` 并改写 `npm run build` 得到修复。但远端复核分支中 `clean-next-build.mjs` 不存在，`Code文档/package.json` 的 `build` 脚本仍为原始 `next build`，无法复核 Windows/中文路径构建修复。

## 严重级别

P0。

## 责任归因

实现或提交偏差导致验收材料不一致。构建阻塞修复方案在报告中出现，但远端复核分支未体现对应脚本和 npm script 调整。

## 修复动作

- 代码开发员确认 `clean-next-build.mjs` 和 `npm run build` 调整是否已提交到正确分支。
- 若未提交，补推构建修复脚本和 `package.json` 脚本调整。
- 重新运行 `npm run build` 并提供可复现的通过日志。
- 补推后交由产品经理审查，并等待 Claude 复核确认。

## 关闭条件

只有代码开发员补推构建修复、产品经理审查确认、Claude 复核确认远端分支可见且构建证据一致后，才允许关闭。

## 处理记录

- 2026-06-25：由 ISSUE 管理员 Agent 根据正式生产上线阶段第一次 Claude 复核报告登记为 Open。

## 关闭记录

- 关闭时间：2026-06-25
- 关闭依据：代码开发员已推送远端 commit `ba24ccabc4c38303e4806979aef6f453ee7cf963`。
- 产品经理第二次审查：`规划文档/里程碑文档/正式生产上线阶段验收报告/2026-06-25-mvp正式生产上线第二次验收报告.md`，结论通过。
- Claude Code 第二次复核：`规划文档/里程碑文档/正式生产上线阶段验收报告/2026-06-25-mvp正式生产上线第二次Claude复核报告.md`，确认本 Issue 关闭。
- 最终状态：closed。