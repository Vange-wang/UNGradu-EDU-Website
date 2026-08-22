# V4 ISSUE-0032 隔离依赖运行时安装回执

## 1. 状态与授权边界

- 任务 ID：`V4-ISSUE-0032-INSTALL-ISOLATED-DEPENDENCIES-20260818`
- 执行角色：`019fefa7-a3c3-7333-94d7-d61961c5ea99 / 代码开发员v2.3.2`
- 状态：`INSTALL_DEPENDENCIES_BLOCKED`
- 本轮只获准基于冻结 lockfile 执行一次 `npm ci --ignore-scripts --no-audit --no-fund`，并进行指定的安装后结构核验。
- 未重试安装，未改用 `npm install`、pnpm、yarn、`--force`、legacy-peer-deps 或其他参数；未修改 registry、npm config 或凭据。
- 本状态不表示隔离依赖运行时 ready，不表示测试、V4-S1、实现或 `TECH_REVIEW_PASS`。

## 2. 安装前冻结

| 项目 | 新鲜结果 |
| --- | --- |
| worktree | `D:/codex_project/家教对接website-v4-issue-0032-email-turnstile-closure`，linked worktree，非 submodule |
| branch | `V4-issue-0032-email-turnstile-closure` |
| HEAD | `ee41c3f30770be6f7a9a0e548975464268b911d2` |
| tree | `bc09512016e9e987f0a591096d10f6a6571eceef` |
| Git status | `0`；tracked/staged/unstaged/untracked 均无变化 |
| Node / npm | `v24.19.0 / 11.17.0` |
| `package.json` SHA-256 | `36CF12650567FB6B736653995072C431592F8C1F7559260F6D3E44047A2FAFFF` |
| `package-lock.json` SHA-256 | `257A945825407CCDDFCAFA18F1E2C7FAD7FB8D53F39AB99DD5E191F5DD6651BF` |
| `node_modules` | 不存在 |
| ignore probe | `git check-ignore -q --no-index Code文档/node_modules/.v4-runtime-probe` exit=`0`；命中 `Code文档/.gitignore:2 node_modules/` |
| 上一步阻塞回执 | SHA-256=`DDEBD437897D82197E731FFD39469CAD07D075B384B6F7970AD5255862B82191` |

V3 worktree 安装前 clean。主工作树安装前保持 branch=`V2-unified-navigation-responsive-profile-20260729`、HEAD=`33314857da0f2d72066443965454d23fc70a16d3`、staged=`23`、Code staged=`2`、unstaged=`18`、cached patch OID=`d00aa22eb314e5c82710388d656a2250ff482ee8`。

## 3. 唯一依赖安装命令

```text
npm ci --ignore-scripts --no-audit --no-fund
```

- 执行目录：`D:/codex_project/家教对接website-v4-issue-0032-email-turnstile-closure/Code文档`
- exit=`1`
- 用时约 `4.19s`
- 控制台完整摘要：`npm error A complete log of this run can be found in: C:\Users\86166\AppData\Local\npm-cache\_logs\2026-08-18T14_09_06_743Z-debug-0.log`
- 该日志只有 npm/Node 版本、配置文件加载路径、cwd 和 exit/code=1，没有附带更具体的错误栈；本回执未复制任何凭据或敏感配置内容。
- `--ignore-scripts` 已保留；未运行 lifecycle scripts。
- 按失败恢复契约，未执行第二次 `npm ci`，也未删除、修复或替换任何安装现场。

## 4. 安装后结构核验与 npm 运行时证据

- `Code文档/node_modules` 仍不存在，因此没有 partial 目录、junction、symlink 或 reparse point；也不存在 `node_modules/.bin/vitest.cmd`。
- 因本地依赖不存在，无法读取本地 `vitest` 或 `next` package version；不得把主工作树版本冒充 V4 安装结果。
- 允许的结构检查 `npm ls --depth=0 --json` 已执行，exit=`1`，摘要为 `Class extends value undefined is not a constructor or null`。
- `npm ls` 调试栈显示：命令入口使用 `C:\Program Files\nodejs\node.exe`、Node=`v24.19.0`、npm=`11.17.0`，但失败模块从 `D:\node\nvm\v20.18.0\node_modules\npm\node_modules\minipass-flush\index.js` 加载。这是本机 npm 运行时混用路径的可复读环境阻塞证据；本轮不授权修复或切换 Node/npm。
- npm 只在本机 npm cache `_logs` 下生成其自身调试日志；V4 worktree 没有 tracked/untracked 产物。

## 5. 安装后不变量

| 项目 | 安装后结果 |
| --- | --- |
| package SHA-256 | `36CF12650567FB6B736653995072C431592F8C1F7559260F6D3E44047A2FAFFF`，未变 |
| lock SHA-256 | `257A945825407CCDDFCAFA18F1E2C7FAD7FB8D53F39AB99DD5E191F5DD6651BF`，未变 |
| V4 branch / HEAD / tree | 均未变 |
| V4 status | `0`；node_modules 不存在，未进入 Git 状态 |
| V3 | clean |
| 主工作树 | branch/HEAD、23 staged、Code staged 2、18 unstaged、cached OID `d00aa22eb314e5c82710388d656a2250ff482ee8` 与受保护状态不漂移 |

## 6. 未执行项、门禁与唯一下一步

- 未运行 npm test、Vitest、typecheck、lint、build、dev server、浏览器或业务脚本，不能声称任何基线测试通过。
- 未修改 package/lock、`.npmrc`、`.gitignore`、代码、测试、配置、Spec、Issue、UI 或注册文件。
- 未执行 Git mutation/push；未处理 provider/widget/Secret/参数、平台、部署、数据库或付费；未创建任务/subagent。
- 未通过门禁：隔离依赖运行时、三文件现有定向测试、`V4_PARAMETER_RECEIPT`、TDD RED、V4-S1、实现、独立复核及所有后续门。

唯一下一步：返回项目总负责人验收本 `INSTALL_DEPENDENCIES_BLOCKED` 回执。由总负责人另获用户单步授权后，在不修改项目 lockfile 的前提下修复或选择一致、可工作的 Node/npm 运行时，再由同一代码 owner 重新执行受控依赖安装；本轮不得自行重试或进入测试。
