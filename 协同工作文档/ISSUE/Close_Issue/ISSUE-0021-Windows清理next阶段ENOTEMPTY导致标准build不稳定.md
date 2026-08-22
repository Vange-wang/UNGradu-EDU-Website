# ISSUE-0021 Windows 清理 `.next` 阶段触发 `ENOTEMPTY` 导致标准 build 不稳定

| 字段 | 内容 |
| --- | --- |
| id | `ISSUE-0021` |
| title | Windows 清理 `.next` 阶段触发 `ENOTEMPTY`，标准构建命令在本地偶发失败 |
| type | build / local environment regression |
| status | closed |
| priority | P2 |
| source | 代码开发复核 / 本地实现阶段；`D:\codex_project\家教对接website\Code文档\开发员工作记录.md` 记录了 `npm run build` 在 Windows 清理 `.next` 时触发 `ENOTEMPTY`，但直接调用项目内 Next 入口可成功构建 |
| owner_agent | 代码开发员 |
| related_files | `D:\codex_project\家教对接website\Code文档\开发员工作记录.md`; `Code文档/scripts/clean-next-build.mjs`; `Code文档/package.json`; `Code文档/next.config.ts`; `npm run build` 过程日志 |

## 背景

该问题发生在 Windows 本地构建路径中：标准 `npm run build` 在清理 `.next` 阶段偶发触发 `ENOTEMPTY`，而项目内 Next 入口的直接构建路径可以成功完成。本 Issue 只登记标准构建命令稳定性问题，不将其误写为 Dify 配置或生产持久化已完成。

## 影响

- 不阻塞当前 local MVP 的直接运行结果。
- 影响标准 `npm run build` 的稳定性。
- 影响后续 CI / 生产门禁对“标准构建命令稳定通过”的判定。

## 最小关闭条件

1. Windows 清理 `.next` 阶段稳定处理占用文件，不再触发 `ENOTEMPTY`。
2. 标准 `npm run build` 在相同本地条件下稳定通过。
3. 对后续 CI / 生产门禁无回归。
4. 技术复核通过。
5. 产品复核通过。

## 不做范围

- 不修改业务代码以外的 Dify 生产配置证明。
- 不把“真实 Dify 配置 / 生产持久化未具备”登记成已关闭事项。
- 不运行 Git mutation，不部署，不修改 Spec 或 QA 文件。

## 处理记录

- 2026-07-27：由 ISSUE 管理员按代码开发复核新增为 `open`。
- 2026-07-27：技术验证员第四轮独立 PASS，产品经理完成范围复核并允许关闭；ISSUE 管理员核对后将状态更新为 `closed`。

## 关闭依据

- 仅限 Windows 本地标准构建稳定性门禁，不外扩到客服业务、真实 Dify / CloudBase、生产部署或整体 workflow 完成。
- 技术独立证据：定向构建脚本测试 3 files / 18 tests 通过；客服回归 6 files / 32 tests 通过；干净及构建后 typecheck 通过；直接 `node .\node_modules\next\dist\bin\next build` 退出 0；连续两次标准 `npm run build` 均退出 0，且第二次未清理 `.next`；`.next\export`、`.next-build.lock` 不存在；`framework.json`、`500.html`、`BUILD_ID` 存在且非空；scoped diff check 通过。
- 产品经理复核：已完成范围复核并允许关闭。
- 结论：`ISSUE-0021` 已满足最小关闭条件，可关闭；其他 11 个 Spec NON_SERIOUS Open Issues 保持不变。
