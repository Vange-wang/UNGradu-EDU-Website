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
- 正式生产上线预检：`npm run release:production:preflight`

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
5. M5 后端签名会话需要配置 `AUTH_SESSION_SECRET`。本地测试可使用占位随机串，生产必须使用足够长的服务端私密随机值。
6. `M5_ENABLE_HOSTED_TEST_LOGIN` 默认保持 `false`。只有部署到隔离的 M5 测试托管环境，且 `APP_ENV=test` 时，才可临时设为 `true` 用于跑 HTTP 验收脚本。

连接检查脚本只输出脱敏后的 `SecretId` 前缀，不输出 `SecretKey`。

M5 发布前验证命令：

- `npm run m5:cloudbase:collections`：检查 `contact_profiles`、`parent_needs`、`tutor_profiles`、`conversations`、`messages`、`contact_exchange_requests` 均可由服务端读取。
- `npm run m5:flow`：跑服务端核心流程验证，覆盖登录后身份、发布、筛选、聊天、联系方式交换、二次确认和授权展示。
- `npm run m5:load`：跑同一服务端核心流程的 50 并发基础压测，用于确认不崩、不乱返回权限数据。
- `npm run m5:http:flow`：通过 HTTP 调用真实 Next API route 跑核心闭环。默认目标为 `http://127.0.0.1:3000`，可通过 `M5_BASE_URL=https://your-deploy.example.com npm run m5:http:flow` 指向部署地址，并输出请求数、成功率、错误率和 avg/p95/max 延迟。
- `npm run m5:http:load`：通过 HTTP 对真实 API route 跑 50 虚拟用户基础压测。默认目标为 `http://127.0.0.1:3000`，可通过 `M5_BASE_URL=https://your-deploy.example.com npm run m5:http:load` 指向部署地址，并输出请求数、成功率、错误率和 avg/p95/max 延迟。
- `npm run m5:hosted:verify`：只用于 CloudBase 或等价托管环境复验。必须显式提供非 localhost 的 `M5_BASE_URL`，脚本会连续执行部署地址 HTTP flow 和 50 虚拟用户 load。

正式生产上线预检命令：

- `npm run release:production:preflight`：只做仓库内无密钥预检，检查生产必填环境变量是否存在，确认 `APP_ENV=production` 主闸下 `/api/auth/test-login`、`x-ungradu-test-user-phone` 和前端测试登录入口均保持拒绝或隐藏。
- 该命令不会连接 CloudBase，不会读取真实数据，不会打印 `AUTH_SESSION_SECRET`、`TENCENTCLOUD_SECRETID` 或 `TENCENTCLOUD_SECRETKEY` 的值。
- 如果本地模拟时故意设置 `M5_ENABLE_HOSTED_TEST_LOGIN=true` 或 `NEXT_PUBLIC_ALLOW_TEST_LOGIN=true`，命令会输出警告，同时仍验证这些误配不能启用生产测试登录。真实生产配置中必须移除这两个测试开关。
- 该命令不能替代正式生产 URL 下的生产冒烟、生产禁用测试登录确认、生产登录方案确认或回滚演练。

正式手机号验证码登录新增环境变量：

- `SMS_CODE_SECRET`：服务端验证码哈希密钥。不得暴露到前端，不得写入 Git；生产建议使用独立强随机值。
- `SMS_PROVIDER`：短信发送适配器，当前预留 `tencent`。
- `TENCENT_SMS_APP_ID`：腾讯云短信应用 ID。
- `TENCENT_SMS_REGION`：腾讯云短信地域，默认可使用 `ap-guangzhou`。
- `TENCENT_SMS_SIGN_NAME`：已审核通过的短信签名。
- `TENCENT_SMS_TEMPLATE_ID`：已审核通过的短信模板 ID。

正式短信服务账号、签名、模板、额度和真实 Secret 由项目总控制人配置到部署环境。仓库内测试使用 fake 短信发送器，不发送真实短信，不记录验证码明文。

如果部署平台以 `NODE_ENV=production` 运行隔离测试环境，HTTP 验收脚本需要服务端配置：

- `APP_ENV=test`
- `M5_ENABLE_HOSTED_TEST_LOGIN=true`
- `AUTH_SESSION_SECRET=<足够长的服务端随机值>`

正式生产环境必须配置 `APP_ENV=production`，此时即使误配 `M5_ENABLE_HOSTED_TEST_LOGIN=true` 或 `NEXT_PUBLIC_ALLOW_TEST_LOGIN=true`，服务端仍拒绝临时测试登录。

正式生产预检示例：

```powershell
$env:APP_ENV='production'
$env:AUTH_SESSION_SECRET='replace-with-production-strong-random-secret'
$env:CLOUDBASE_ENV_ID='replace-with-production-cloudbase-env-id'
$env:TENCENTCLOUD_SECRETID='replace-with-production-secret-id'
$env:TENCENTCLOUD_SECRETKEY='replace-with-production-secret-key'
$env:M5_ENABLE_HOSTED_TEST_LOGIN='true'
$env:NEXT_PUBLIC_ALLOW_TEST_LOGIN='true'
npm run release:production:preflight
Remove-Item Env:\APP_ENV
Remove-Item Env:\AUTH_SESSION_SECRET
Remove-Item Env:\CLOUDBASE_ENV_ID
Remove-Item Env:\TENCENTCLOUD_SECRETID
Remove-Item Env:\TENCENTCLOUD_SECRETKEY
Remove-Item Env:\M5_ENABLE_HOSTED_TEST_LOGIN
Remove-Item Env:\NEXT_PUBLIC_ALLOW_TEST_LOGIN
```

上述示例只用于验证生产误配测试开关不会打开测试登录；正式生产环境不得保留 `M5_ENABLE_HOSTED_TEST_LOGIN=true` 或 `NEXT_PUBLIC_ALLOW_TEST_LOGIN=true`。

托管环境复验示例：

```powershell
$env:M5_BASE_URL='https://your-cloudbase-test-url.example.com'
npm run m5:hosted:verify
Remove-Item Env:\M5_BASE_URL
```

当前仓库不包含真实 CloudBase 托管访问地址；拿到实际测试托管 URL 后，必须用上面的命令复跑并记录输出，才能形成部署地址下的 M5 发布前验证证据。

## 当前服务端接口

### `/api/auth/sms/send-code`、`/api/auth/sms/login`、`/api/auth/session`、`/api/auth/logout`

用途：正式手机号验证码登录。新手机号首次验证码通过后创建账号；老手机号再次验证码通过后复用原账号；登录态继续使用 `ungradu_auth_session` HttpOnly 签名 Cookie。

- `POST /api/auth/sms/send-code`：校验手机号、频控 60 秒重复发送、生成一次性 6 位验证码、保存验证码哈希和 5 分钟过期时间，并调用服务端短信发送适配器。
- `POST /api/auth/sms/login`：校验手机号和验证码，拒绝固定测试码 `000000`，拒绝过期、已使用、错误次数过多的验证码；通过后写入服务端签名 Cookie。
- `GET /api/auth/session`：从服务端签名 Cookie 读取当前登录态，刷新页面后仍可识别当前用户。
- `POST /api/auth/logout`：清除服务端签名 Cookie。
- CloudBase 集合：`sms_login_codes`、`sms_login_users`。
- 安全边界：验证码只以哈希形式保存；接口响应不返回验证码或完整手机号；短信密钥、验证码密钥和会话密钥只从服务端环境变量读取。
- 外部依赖：真实腾讯云短信账号、签名、模板 ID、短信 Secret、额度和告警方式由项目总控制人提供。未配置真实短信发送前，仓库内代码和 fake 测试可以通过，但真实公网用户无法收到短信。

### `/api/auth/test-login`

用途：M5 发布前过渡登录态。非生产环境允许测试登录接口写入 HttpOnly 签名 Cookie，业务 API 优先从该服务端签名 Cookie 读取用户身份。

- `POST /api/auth/test-login`：仅本地开发、显式测试环境或隔离 M5 托管测试环境可用，校验本地测试手机号和验证码后写入 `ungradu_auth_session` HttpOnly Cookie。
- `GET /api/auth/session`：从服务端签名 Cookie 读取当前会话。
- `POST /api/auth/logout`：清除服务端签名 Cookie。
- 生产边界：`APP_ENV=production` 时，即使配置了 `NEXT_PUBLIC_ALLOW_TEST_LOGIN=true` 或 `M5_ENABLE_HOSTED_TEST_LOGIN=true`，也拒绝创建临时测试登录 Cookie。
- 安全边界：业务 API 不再依赖浏览器 localStorage 或前端变量传入当前用户身份；前端 API client 默认只携带同源 Cookie。
- 发布前收口：读取签名 Cookie 时会进行服务端硬过期校验；超过 Cookie 有效期、`createdAt` 非法或异常未来时间的会话会被拒绝。
- 用户入口：个人页提供可见“退出登录”按钮，调用 `/api/auth/logout` 后回到首页。

### `/api/contact-profile`

用途：M5 第一批迁移接口，将个人联系方式存档从纯浏览器本地存储迁移到 CloudBase 服务端可信读写路径。

- `GET /api/contact-profile`：读取当前登录用户自己的联系方式存档。
- `PUT /api/contact-profile`：保存当前登录用户自己的联系方式存档。
- CloudBase 集合：`contact_profiles`。
- 服务端写入字段：`ownerUserId`、`phone`、`wechat`、`updatedAt`。
- 数据归属规则：接口只读取和写入 `doc(currentUserId)`，不会按客户端传入的用户 ID 任意读取他人联系方式。
- 当前临时认证：非生产环境通过请求头 `x-ungradu-test-user-phone` 承接 M1-M4 本地测试登录态。
- 生产边界：`APP_ENV=production` 时即使配置了 `NEXT_PUBLIC_ALLOW_TEST_LOGIN=true` 或 `M5_ENABLE_HOSTED_TEST_LOGIN=true`，接口也拒绝临时测试登录身份。

该接口只完成联系方式存档迁移。聊天、联系方式交换请求、需求、家教信息和正式短信登录仍待后续 M5 继续迁移，不能视为已经具备完整生产权限模型。

页面接入状态：联系方式管理页已调用该接口；保存成功后仍临时同步本地镜像，以兼容尚未完全移除的旧测试数据。

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
- 生产边界：`APP_ENV=production` 时即使配置了 `NEXT_PUBLIC_ALLOW_TEST_LOGIN=true` 或 `M5_ENABLE_HOSTED_TEST_LOGIN=true`，接口也拒绝临时测试登录身份。

页面接入状态：聊天详情页已调用该接口读取交换请求、处理同意/拒绝/撤回，并读取授权后联系方式。

### `/api/conversations`

用途：M5 第三批迁移接口，将会话创建、会话读取和文字消息读写迁移到服务端参与者校验。

- `GET /api/conversations`：读取当前用户参与的会话列表。
- `POST /api/conversations`：按来源对象创建或复用会话，参数为 `sourceId` 和 `sourceType`。
- `GET /api/conversations/[id]`：读取当前用户参与的单个会话。
- `GET /api/conversations/[id]/messages`：读取当前用户参与会话的消息列表。
- `POST /api/conversations/[id]/messages`：向当前用户参与的会话发送文字消息。
- CloudBase 集合：`conversations`、`messages`。
- 依赖集合：`parent_needs`、`tutor_profiles`。
- 服务端权限规则：不能和自己发布的信息创建会话；非参与者不能读取会话、不能读取消息、不能发送消息。
- 隐私规则：接口返回会话和消息 View Model，不返回参与者用户 ID 或联系方式。
- 当前临时认证：非生产环境通过请求头 `x-ungradu-test-user-phone` 承接 M1-M4 本地测试登录态。
- 生产边界：`APP_ENV=production` 时即使配置了 `NEXT_PUBLIC_ALLOW_TEST_LOGIN=true` 或 `M5_ENABLE_HOSTED_TEST_LOGIN=true`，接口也拒绝临时测试登录身份。

页面接入状态：我的聊天页、聊天详情页、需求详情页和家教信息详情页的会话入口已调用该接口。

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
- 生产边界：私有读写在 `APP_ENV=production` 时拒绝临时测试登录身份。

页面接入状态：需求广场、需求详情、发布需求和我发布的需求均已调用该接口。

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
- 生产边界：私有读写在 `APP_ENV=production` 时拒绝临时测试登录身份。

页面接入状态：家教信息广场、家教信息详情、发布家教信息和我的家教信息均已调用该接口。

### M5 API 统一硬化

- 已迁移写接口统一通过 `server/api-utils.ts` 读取临时身份和 JSON 请求体。
- 缺少临时身份返回 401；生产环境始终拒绝 `x-ungradu-test-user-phone` 临时测试登录身份。
- 写接口收到 malformed JSON 时统一返回 400 和 `Invalid JSON body.`，避免坏请求在运行时抛出 500。
- 服务端状态码不再依赖中文错误文案判断，联系方式交换和会话越权保持 403，表单校验类错误保持 400。
- 前端 API client 统一通过 `features/api/api-client.ts` 解析响应；非 JSON 响应、HTML 错误页、网络失败或非 2xx JSON 错误会转换为可读 `request` 错误，避免页面因 `response.json()` 解析异常直接崩溃。

### MVP 发布前收口

本阶段新增发布前准备文档：

- `规划文档/里程碑文档/发布前准备/MVP产品说明.md`
- `规划文档/里程碑文档/发布前准备/生产环境变量清单.md`
- `规划文档/里程碑文档/发布前准备/测试账号管理说明.md`
- `规划文档/里程碑文档/发布前准备/上线回滚预案.md`
- `规划文档/里程碑文档/发布前准备/正式生产禁用测试登录确认.md`
- `规划文档/里程碑文档/发布前准备/架构收口问题修复对照表.md`
- `规划文档/里程碑文档/发布前准备/发布前浏览器冒烟验收清单.md`
- `规划文档/产品迭代/2026-06-24-vnext-性能优化与技术债清单.md`

生产发布前仍必须补齐真实生产环境验证证据。M5 测试托管通过不等同于生产已发布。

会话索引收口：

- 新写入会话会保存 `conversationUniqKey`、`participantKeys` 和 `sourceKey`，列表读取按当前用户 `participantKeys` 查询。
- 重复发起聊天时，如果旧会话缺少新索引字段，服务端会按 `sourceId`、`sourceType` 和双方 `participantUserIds` 兼容复用旧会话，并补写索引字段。
- 已存在的 CloudBase `conversations` 旧数据可在发布前执行 `npm run m5:backfill:conversations` 进行一次性索引补齐。脚本只输出环境 ID、脱敏 SecretId 和扫描/更新数量，不输出会话内容或真实密钥。

## 开发前检查清单

每次正式开发前：

1. 读取最新 Spec。
2. 确认本次任务属于 Spec 范围。
3. 确认里程碑和验收标准。
4. 确认是否已有技术验证结论。
5. 新建或切换到对应 Git 分支。
6. 开发完成后运行可用的检查命令。
7. 更新 `Code文档/开发员工作记录.md`。
