# Code文档

用途：记录本项目业务代码产生后的代码结构、模块职责、本地开发、部署、测试、接口约定和版本管理说明。

当前状态：已在本目录初始化 Next.js + TypeScript 代码项目。正式开发必须先读取并遵守 `规划文档/Spec文档` 中已确认的 Spec。

## 开发边界

- 只实现 Spec 已确认的功能。
- 不提前开发支付、人工审核、复杂排课、评价、举报后台、自动推荐等未进入 MVP 的能力。
- 涉及登录、权限、联系方式、聊天、未成年人信息和证明图片的功能，必须以后端校验和安全验收为准。
- 每次代码或代码文档更新后，同步更新 `Code文档/开发员工作记录.md`。

## 代码类别规划

业务代码创建后，建议按以下类别归档。实际目录以初始化技术栈后的项目结构为准，但命名应保持清晰、简洁、可验证。

### app

负责页面路由和页面入口。

包括：首页、登录页、个人页、家长发布需求页、大学生发布家教信息页、需求广场、家教信息广场、详情页、聊天页、反馈入口等。

### features

负责按业务功能拆分的前端模块。

建议模块：

- `auth`：手机号注册登录、登录态处理。
- `profile`：个人页、联系方式管理。
- `parent-needs`：家长需求发布、编辑、详情。
- `tutor-profiles`：大学生家教信息发布、编辑、详情、证明图片入口。
- `marketplace`：需求广场、家教信息广场、筛选。
- `chat`：文字聊天、会话、消息展示。
- `contact-exchange`：联系方式交换请求、二次确认、状态处理。
- `feedback`：反馈或联系客服入口。

### components

负责可复用 UI 组件。

例如按钮、输入框、选择器、表单区块、列表项、详情信息块、弹窗、空状态和错误提示。组件应保持轻量，不直接写复杂业务规则。

### lib

负责通用工具和基础能力封装。

例如表单校验、日期处理、价格区间校验、敏感联系方式检测、CloudBase 客户端初始化、请求封装和错误标准化。

### server

负责后端 API、CloudBase 云函数或云托管服务代码。

核心职责：

- 登录态校验。
- 数据归属校验。
- 发布内容校验。
- 聊天权限校验。
- 联系方式默认隐藏。
- 联系方式交换授权校验。
- 文件上传授权和访问控制。

### data

负责基础数据和数据模型说明。

例如科目选项、学段选项、本地地址选项、数据集合字段说明、种子数据和迁移说明。

### tests

负责测试代码。

建议覆盖：

- 表单校验。
- 发布与筛选。
- 聊天读写权限。
- 联系方式交换状态。
- 防越权访问。
- 核心闭环端到端流程。

### scripts

负责开发、初始化、数据维护和验证脚本。

例如种子数据导入、基础数据更新、CloudBase 环境检查、压测脚本和部署辅助脚本。

### docs

负责代码层面的补充说明。

例如接口约定、本地启动说明、部署说明、测试说明、环境变量说明和故障处理。

## Git 与 GitHub 职责

- 每个明确任务使用独立分支。
- 提交前查看工作区变化，避免误提交规划区无关文件。
- 提交信息说明用户可见变化或代码文档变化。
- 推送 GitHub 前确认远程仓库地址、可见性、默认分支和权限。
- 当前 GitHub remote：`https://github.com/Vange-wang/UNGradu-EDU-Website.git`。

## 本地开发命令

在 `Code文档` 目录下运行：

- 安装依赖：`npm install`
- 本地启动：`npm run dev`
- 生产构建：`npm run build`
- CloudBase 连接检查：`npm run cloudbase:check`
- 代码检查：`npm run lint`
- 类型检查：`npm run typecheck`
- 测试：`npm test`

当前技术栈：

- Next.js 15.5.19
- React 19
- TypeScript
- Vitest
- ESLint

当前已知环境说明：

- 本机 Node.js 为 `20.18.0`。
- npm audit 当前报告 Next.js 内部 `postcss` 相关 moderate advisory；npm 自动修复方案会降级到旧 Next，不可直接采用。后续应持续关注 Next.js 补丁版本。

## CloudBase 本地连接

M5 阶段已开始接入 CloudBase 服务端 SDK。真实密钥只放在本地 `.env.local`，不要提交到 Git。

本地配置步骤：

1. 复制 `.env.example` 为 `.env.local`。
2. 将 `TENCENTCLOUD_SECRETID` 和 `TENCENTCLOUD_SECRETKEY` 替换为腾讯云真实访问密钥。
3. 保留 `CLOUDBASE_ENV_ID=ungradu-edu-test-d0ed1mqeceb0ae1` 和 `APP_ENV=test`，除非后续技术验证明确调整。
4. 运行 `npm run cloudbase:check`，默认读取 `users` 集合 1 条数据验证服务端连接。

连接检查脚本只输出脱敏后的 `SecretId` 前缀，不输出 `SecretKey`。

## 当前服务端接口

### `/api/contact-profile`

用途：M5 第一批迁移接口，将个人联系方式存档从纯浏览器本地存储迁移到 CloudBase 服务端可信读写路径。

- `GET /api/contact-profile`：读取当前登录用户自己的联系方式存档。
- `PUT /api/contact-profile`：保存当前登录用户自己的联系方式存档。
- CloudBase 集合：`contact_profiles`。
- 服务端写入字段：`ownerUserId`、`phone`、`wechat`、`updatedAt`。
- 数据归属规则：接口只读取和写入 `doc(currentUserId)`，不会按客户端传入的用户 ID 任意读取他人联系方式。
- 当前临时认证：非生产环境通过请求头 `x-ungradu-test-user-phone` 承接 M1-M4 本地测试登录态。
- 生产边界：`NODE_ENV=production` 时即使配置了 `NEXT_PUBLIC_ALLOW_TEST_LOGIN=true`，接口也拒绝临时测试登录身份。

该接口只完成联系方式存档迁移。聊天、联系方式交换请求、需求、家教信息和正式短信登录仍待后续 M5 继续迁移，不能视为已经具备完整生产权限模型。

### `/api/contact-exchange`

用途：M5 第二批迁移接口，将联系方式交换请求和授权后读取对方联系方式迁移到服务端可信判断。

- `GET /api/contact-exchange?conversationId=...`：读取当前用户在会话中的联系方式交换请求视图。
- `GET /api/contact-exchange?conversationId=...&view=authorized-profiles`：仅在已同意且完成二次确认后返回双方联系方式。
- `POST /api/contact-exchange`：通过 `action` 执行 `create`、`approve`、`reject`、`withdraw`。
- CloudBase 集合：`contact_exchange_requests`。
- 依赖集合：`conversations`、`contact_profiles`。
- 服务端权限规则：只有会话参与者可以发起和查看交换请求；只有接收方可以同意或拒绝；只有发起方可以撤回；非参与者读取授权联系方式返回 `null`。
- 授权读取规则：未发起、待处理、拒绝、撤回、过期、未二次确认或任一方未填写联系方式时，均不返回对方联系方式。
- 当前临时认证：非生产环境通过请求头 `x-ungradu-test-user-phone` 承接 M1-M4 本地测试登录态。
- 生产边界：`NODE_ENV=production` 时即使配置了 `NEXT_PUBLIC_ALLOW_TEST_LOGIN=true`，接口也拒绝临时测试登录身份。

### `/api/conversations`

用途：M5 第三批迁移接口，将会话创建、会话读取和文字消息读写迁移到服务端参与者校验。

- `GET /api/conversations`：读取当前用户参与的会话列表。
- `POST /api/conversations`：按来源对象创建或复用会话，参数为 `sourceId` 和 `sourceType`。
- `GET /api/conversations/[id]`：读取当前用户参与的单个会话。
- `GET /api/conversations/[id]/messages`：读取当前用户参与会话的消息列表。
- `POST /api/conversations/[id]/messages`：向当前用户参与的会话发送文字消息。
- CloudBase 集合：`conversations`、`conversation_messages`。
- 依赖集合：`parent_needs`、`tutor_profiles`。
- 服务端权限规则：不能和自己发布的信息创建会话；非参与者不能读取会话、不能读取消息、不能发送消息。
- 隐私规则：接口返回会话和消息 View Model，不返回参与者用户 ID 或联系方式。
- 当前临时认证：非生产环境通过请求头 `x-ungradu-test-user-phone` 承接 M1-M4 本地测试登录态。
- 生产边界：`NODE_ENV=production` 时即使配置了 `NEXT_PUBLIC_ALLOW_TEST_LOGIN=true`，接口也拒绝临时测试登录身份。

### `/api/parent-needs`

用途：M5 第四批迁移接口，将家长需求发布、我的需求、公开列表和公开详情迁移到服务端数据归属与公开白名单。

- `GET /api/parent-needs`：读取公开家长需求列表，支持 `subject`、`grade`、`budgetMin`、`budgetMax`、`teacherGenderPreference` 筛选。
- `GET /api/parent-needs?scope=mine`：读取当前用户自己的家长需求列表。
- `POST /api/parent-needs`：当前用户发布家长需求。
- `GET /api/parent-needs/[id]`：读取公开家长需求详情。
- CloudBase 集合：`parent_needs`。
- 服务端写入字段：发布内容、`ownerUserId`、`status`、`createdAt`。
- 数据归属规则：我的列表只按当前用户 `ownerUserId` 查询；客户端不能指定 owner。
- 公开读取规则：公开列表和详情使用白名单 View Model，不返回 `ownerUserId` 或联系方式。
- 当前临时认证：私有读写在非生产环境通过请求头 `x-ungradu-test-user-phone` 承接 M1-M4 本地测试登录态。
- 生产边界：私有读写在 `NODE_ENV=production` 时拒绝临时测试登录身份。

### `/api/tutor-profiles`

用途：M5 第五批迁移接口，将大学生家教信息发布、我的信息、公开列表和公开详情迁移到服务端数据归属与公开白名单。

- `GET /api/tutor-profiles`：读取公开家教信息列表，支持 `subject`、`grade`、`feeMin`、`feeMax`、`gender` 筛选。
- `GET /api/tutor-profiles?scope=mine`：读取当前用户自己的家教信息列表。
- `POST /api/tutor-profiles`：当前用户发布家教信息。
- `GET /api/tutor-profiles/[id]`：读取公开家教信息详情。
- CloudBase 集合：`tutor_profiles`。
- 服务端写入字段：发布内容、证明图片元数据、`ownerUserId`、`status`、`createdAt`。
- 数据归属规则：我的列表只按当前用户 `ownerUserId` 查询；客户端不能指定 owner。
- 公开读取规则：公开列表和详情使用白名单 View Model，不返回 `ownerUserId` 或联系方式。
- 当前临时认证：私有读写在非生产环境通过请求头 `x-ungradu-test-user-phone` 承接 M1-M4 本地测试登录态。
- 生产边界：私有读写在 `NODE_ENV=production` 时拒绝临时测试登录身份。

## 开发前检查清单

每次正式开发前：

1. 读取最新 Spec。
2. 确认本次任务属于 Spec 范围。
3. 确认里程碑和验收标准。
4. 确认是否已有技术验证结论。
5. 新建或切换到对应 Git 分支。
6. 开发完成后运行可用的检查命令。
7. 更新 `Code文档/开发员工作记录.md`。
