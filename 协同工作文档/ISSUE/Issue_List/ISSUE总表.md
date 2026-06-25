# ISSUE 总表

更新日期：2026-06-25

维护负责人：ISSUE 管理员 Agent

来源说明：本表记录项目 Issue 编号、状态、优先级、责任 Agent、处理记录和关闭依据。所有 Issue 编号稳定，不随状态变化复用或改号。

## Open Issue

| id | title | type | status | priority | source | owner_agent | related_files | 当前处理记录 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ISSUE-0005` | 历次审查报告未纳入远端仓库版本控制导致远端追溯链条不完整 | process / documentation | open | P1 | Claude Code 第二次复核报告 | 项目总负责人 / 产品经理 | `规划文档/里程碑文档/正式生产上线阶段验收报告/`; `协同工作文档/阶段任务闭环工作流.md` | 已登记；等待建立审查报告归档/提交规则或补齐远端版本控制记录 |

## Closed Issue

| id | title | type | status | priority | source | owner_agent | related_files | 关闭依据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ISSUE-0001` | `release:production:preflight` 脚本在远端分支缺失，但被作为通过证据引用 | bug / 验收材料不一致 | closed | P0 | 正式生产上线阶段第一次 Claude 复核报告 | 代码开发员 / 产品经理 | `Code文档/package.json`; `Code文档/scripts/production-readiness-check.mjs` | 代码开发员已推送 `ba24ccabc4c38303e4806979aef6f453ee7cf963`；产品经理第二次审查通过；Claude Code 第二次复核确认关闭 |
| `ISSUE-0002` | `clean-next-build.mjs` 与构建脚本调整在远端分支缺失，无法复核 Windows/中文路径构建修复 | bug / 验收材料不一致 | closed | P0 | 正式生产上线阶段第一次 Claude 复核报告 | 代码开发员 | `Code文档/scripts/clean-next-build.mjs`; `Code文档/package.json`; `Code文档/next.config.ts` | 代码开发员已推送 `ba24ccabc4c38303e4806979aef6f453ee7cf963`；产品经理第二次审查通过；Claude Code 第二次复核确认关闭 |
| `ISSUE-0003` | `production-readiness-script.test.ts` 在远端分支缺失，测试数量与验收报告不一致 | bug / 验收材料不一致 | closed | P1 | 正式生产上线阶段第一次 Claude 复核报告 | 代码开发员 / 产品经理 | `Code文档/tests/production-readiness-script.test.ts` | 代码开发员已推送 `ba24ccabc4c38303e4806979aef6f453ee7cf963`；产品经理第二次审查通过；Claude Code 第二次复核确认关闭 |
| `ISSUE-0004` | 代码侧可发行版本准备说明与 Release Spec 相关目录在远端分支缺失或不可见，导致文档交付证据不完整 | 验收材料不一致 / 文档缺失 | closed | P1 | 正式生产上线阶段第一次 Claude 复核报告 | 产品经理 / 项目总控制人 | `规划文档/里程碑文档/正式生产上线准备/代码侧可发行版本准备说明.md`; `规划文档/Spec文档/Release_version_Spec/2026-06-25-mvp-正式生产上线-spec.md` | 代码开发员已推送 `ba24ccabc4c38303e4806979aef6f453ee7cf963`；产品经理第二次审查通过；Claude Code 第二次复核确认关闭 |

## 关闭统一条件

本批 Issue 只有在以下三项均满足后，才允许关闭：

- 代码开发员已补推或明确修复对应仓库内容。
- 产品经理已重新审查并确认验收材料与仓库内容一致。
- Claude 复核已确认对应问题消除或给出允许关闭结论。
