# V4 ISSUE-0032 Provider-Specific 最小服务端接线独立代码复核 R1

## 1. 结论与边界

- 任务：`V4-ISSUE-0032-PROVIDER-SPECIFIC-WIRING-INDEPENDENT-REVIEW-R1-20260820`
- 执行角色：`019fefa7-d1d3-7ac3-a5ba-8b8abe299958 / 独立代码复核v2.3.2 / gpt-5.6-sol / high`
- 结论：`TECH_REVIEW_PASS`
- Standards findings：P0/P1/P2=`0/0/0`
- Spec findings：P0/P1/P2=`0/0/0`
- 结论范围：仅证明本报告固定的未提交 provider-specific 最小服务端接线候选通过本地独立技术复核；不等于 commit/push、真实 provider 或 Secret 匹配、平台配置、部署、生产验证、观察方案 A、产品/业务验收、ISSUE-0032 关闭或 workflow 完成。

## 2. 必读依据与证据层级

已完整回读并遵守主仓 `AGENTS.md`、`vange-workflow` 及 `thread-routing.md`/`contracts.md`、`code-review`、`workflow-development-quality-gates`、`verification-before-completion`、本角色锚点/工作记录、provider-specific authorization package、Document QA Round 1 整改记录、Hermes Round 2 报告/metadata、ISSUE-0032、ISSUE-0046 和本批实现回执。

- authorization package：SHA-256=`56D8C7060A10F996A58DC9F30CCE767F07537B9EF90AB6F69DDB59D098E30EFC`，41113 bytes / 379 lines。
- Document QA ledger：SHA-256=`F77141594E9B420E6CD8C436C0D30804B1063664EC132D91480B8BEB10A4290C`，9696 bytes / 83 lines。
- Hermes Round 2：SHA-256=`B83E042B9032498812A1A5FBB04CD735EA88B58437FEA51A4A1630685AA937A0`，verdict=`PASS_WITH_NONBLOCKING_OPEN_ISSUES`、SERIOUS=`0`；metadata SHA-256=`49396FEB08F60BBABBF4748BBC5D36FE5D80270732A6C889E60D89FA193F08A5`，round=`2/3`、model=`deepseek-v4-pro`、exit=`0`、canonical unchanged。
- ISSUE-0032：SHA-256=`714E115A73420B2183993F5B1A5C0D54AF54562BFBE125BF37E1EB287781BBC2`，仍 open；ISSUE-0046：SHA-256=`56395F724313A71D0E64B1FC82219593E529012EAE94E0954C182B3F2B3CC055`，仍 `open / NON_BLOCKING_DOCUMENT_REVIEW`。
- Hermes/Document QA 结论只证明授权文档严重项门禁，不替代本代码复核；本报告也不替代后续平台、部署、生产或业务证据。

## 3. 固定点、manifest 与保护区

- branch=`V4-issue-0032-email-turnstile-closure`
- HEAD=`23c959e0fc1e8096828fb8c855ecddb2800995bf`
- tree=`90addce1c5ca2d7cfd9acc5084156ab4e1860b97`
- index：0 staged；HEAD/tree 在审查和验证后保持不变。
- tracked diff：2 files，shortstat=`34 insertions / 2 deletions`；untracked=2；精确候选共 4 paths：
  1. `Code文档/app/api/auth/email/send-code/route.ts`（tracked modified），SHA-256=`FD34CA51035DB31FEACFB152177A5AE74E499A46FC092BF144EBC00866F20326`，1925 bytes / 46 lines。
  2. `Code文档/tests/issue-0032-provider-specific-wiring.test.ts`（untracked new），SHA-256=`E82F0882908F289D62C71BD0D5A70033F2DE9538E9E3F5B28E69B04135650759`，5382 bytes / 157 lines。
  3. `Code文档/docs/2026-08-20-v4-issue-0032-provider-specific-wiring-local-receipt.md`（untracked new），SHA-256=`97C0B87D7AAAE3E4CD5596CC5FC9DE5014966EB05EBD40B8F598C358A4F2D36B`，6772 bytes / 100 lines。
  4. `Code文档/开发员工作记录.md`（tracked modified），SHA-256=`1D74F910069D9B5500B5E310881798206217A97BB26C3E2A7A3704EEAFD1485C`，297407 bytes / 4480 lines。
- 开发记录前 295569 bytes SHA-256=`80FE1207AC32B1750819EB74DE6E3D9B38BD5F41335A90B3A0FA697DF856868E`，旧前缀逐字节保持，变更仅为末尾追加。
- `package.json`/`package-lock.json` 无 diff，SHA-256 分别为 `36CF12650567FB6B736653995072C431592F8C1F7559260F6D3E44047A2FAFFF`、`257A945825407CCDDFCAFA18F1E2C7FAD7FB8D53F39AB99DD5E191F5DD6651BF`。
- 共享 verifier、`email-auth-api.ts`、既有 provider-neutral/email-auth tests 均无 diff，哈希与固定输入一致。
- 主工作树保护基线保持：branch=`V2-unified-navigation-responsive-profile-20260729`、HEAD=`33314857da0f2d72066443965454d23fc70a16d3`、staged/Code staged=`23/2`、cached OID=`d00aa22eb314e5c82710388d656a2250ff482ee8`。

## 4. Standards 轴（先行并冻结）

Standards 结论在读取 Spec 结论前独立冻结：P0/P1/P2=`0/0/0`。

- 最小性：生产改动仅在 `app/api/auth/email/send-code/route.ts:9-34`，把固定 fail-closed verifier 替换为仓库已有 Turnstile verifier；未修改共享模块、前端、密码登录、依赖、环境变量名称或业务 API 契约。
- 一致性：`route.ts:28-34` 的 parser 与既有密码登录 route 使用同一 split/trim/lower/filter 形式，没有引入第二套 provider 协议或不必要抽象。
- 测试真实性：`tests/issue-0032-provider-specific-wiring.test.ts:118-120,142-144` 动态导入并调用真实 `POST /api/auth/email/send-code` route export；只替换 CloudBase 数据库与 Siteverify 网络边界。断言直接观察 endpoint、FormData、公开 JSON status/body 与邮箱验证码集合零写入，不依赖私有 helper 返回值伪造通过。
- 安全与隐私：生产 route 无新增日志、响应字段或 snapshot；测试与回执仅使用显式 synthetic 值，未发现真实 Secret、token、邮箱、Cookie 或 SMTP 凭据进入仓库输出。
- 格式：四候选文件均 UTF-8 无 BOM、trailing whitespace=`0`；`git diff --check HEAD` exit `0`。当前 Windows 工作区因 `core.autocrlf=true` 显示 LF→CRLF 提示，但 clean-filter 内容、diff 与候选哈希稳定，不形成可提交内容漂移或行动项。

## 5. Spec 轴

Spec 结论：P0/P1/P2=`0/0/0`。

- Provider 接线：`route.ts:9-12,28-34` 已从 `createFailClosedEmailChallengeVerifier` 切换到既有 `createTurnstileEmailChallengeVerifier`，并从 runtime env 消费 `TURNSTILE_SECRET_KEY` 与 `TURNSTILE_EXPECTED_HOSTNAMES`。
- Exact allowlist：route 先做 ASCII 逗号 split、trim、lowercase、filter；共享 `email-challenge.ts:88-102,209-218` 继续拒绝空集合、wildcard、非法 label 与超长 hostname，并去重；provider 返回 hostname 仅在 exact set 中通过。
- Fail closed：缺 Secret 或空/非法 allowlist 在 `email-challenge.ts:217-219` 的 provider 调用前拒绝；新测试 `134-155` 新鲜证明 provider call=`0`、JSON 503、`email_login_codes` 写入=`0`。
- Provider 语义：共享 verifier `email-challenge.ts:230-283` 保留固定 Siteverify endpoint、POST、5 秒超时/Abort、非 2xx/网络/解析失败分类、duplicate、wrong action、wrong hostname fail closed；`verifyEmailChallenge` 继续执行 strict 300 秒 TTL。
- 顺序与副作用：`email-auth-api.ts:294-375` 未修改，仍为 Origin/CSRF guard→读取 body→verify→persistent consume→layered rate limit→既有 60 秒 cooldown/send；既有受影响回归断言顺序为 `verify, consume, limit, cooldown, send`，所有前置失败不发送。
- 范围：未新增真实 provider、SMTP、CloudBase/数据库调用、collection、依赖、实际 hostname/Origin、site key 或 Secret；数据库、ISSUE-0031 与付费动作边界未扩大。
- 证据限制：本地 synthetic/mock 只证明接线与错误契约，不证明真实 site key/Secret 配对、CloudBase 环境读取、SMTP 连通、中国大陆网络、平台部署或生产行为。

## 6. 独立新鲜验证

- 聚焦公开 route：`tests/issue-0032-provider-specific-wiring.test.ts`，exit `0`，1 file / 3 tests passed。
- 受影响回归：provider-specific、provider-neutral、email-auth、security baseline、login visual contract、route exports 共 6 files / 84 tests passed，exit `0`。
- `npm run typecheck`：exit `0`。
- `npm run lint`：exit `0`，0 warning/error。
- `git diff --check HEAD`：exit `0`；候选 manifest、逐文件 SHA、HEAD/tree/index 与保护区在验证后无漂移。
- 未重复运行默认全量或 build。开发回执在上述完全匹配的候选哈希下记录默认全量 82/82 files、597 passed / 1 skipped，以及无额外环境 build 17/17 exit 0；这两项明确归属开发 owner evidence，不冒充本轮新鲜运行。唯一 skipped 是需显式真实 CloudBase 集成的套件，本批禁止运行，不阻塞本地接线候选。

## 7. 当前门禁与唯一下一步

- CURRENT_GATE=`LOCAL_INDEPENDENT_TECH_REVIEW_PASS / EXACT_COMMIT_PUSH_PENDING`
- workflow=`WORKFLOW_ACTIVE`；ISSUE-0032 仍 open；ISSUE-0046 仍为非阻塞文档债务。
- 未通过门禁：exact commit/push 与 post-push attestation、真实 provider/Secret/hostname/Origin 配置匹配、平台配置、部署、生产验证、观察方案 A、产品/业务验收、ISSUE-0032 关闭及 workflow 完成。
- 唯一下一步：将本报告与固定候选证据交项目总负责人；由其在另行授权后把同一 4 路径候选返回原代码 owner 执行精确 commit/push 门禁。本角色不自行提交、推送、配置平台、部署或推进 Issue。

## 8. 执行确认

除新增本报告与向主仓 `Code文档/独立代码复核工作记录.md` 做 prefix-preserving append 外，本轮无其他写入；未修改四候选、代码/测试/回执/开发记录、Spec、Issue、中央状态、UI 或其他角色文件；未执行 Git mutation、npm install、网络/provider/Secret、Cloudflare/CloudBase/SMTP/数据库真实操作、付费、部署、生产或任务/subagent。
