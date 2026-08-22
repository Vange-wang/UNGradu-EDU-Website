# Dify 智能客服搭建与接入说明

版本：CS-KB-DEPLOY-2026-08-14
目标：部署 UNGradu EDU 家教对接网站的 v2.2 知识库客服，并接入 `/customer-service` 页面。

> 当前线上客服采用知识库驱动的本地确定性回答，不调用 GPT、Dify API 或其他模型。Dify 章节保留为后续可复制交付的历史参考，不能当作当前线上运行状态。

## 1. 当前运行方式

- 当前知识源：`docs/customer-service/ungradu-customer-service-knowledge-base-v2.md`。
- 当前知识库版本：`CS-KB-UNGRADU-V2.2-2026-08-13`。
- 运行方式：站内确定性规则回答，支持同义表达、实体提取、组合式回答和事实兜底。
- 身份优先级：涉及具体交易/纠纷个案时先询问家长/学生端或大学生家教端及事件状态；一般规则咨询不强制询问身份。
- 未命中时：不能只返回“没有找到确定答案”，必须从知识库组合相关事实并给出 `/rules`、`/feedback` 或具体页面下一步。
- 不读取真实用户聊天、联系方式、验证码、密码、数据库或生产密钥。

## 2. 知识库交付源

1. 当前唯一业务事实源：`docs/customer-service/ungradu-customer-service-knowledge-base-v2.md`。
2. 旧版 `ungradu-customer-service-knowledge-base.md` 保留作历史对照，不与 v2.2 并行回答。
3. 规则事实已固化到 `features/customer-service/tutor-customer-service-agent.ts`，发布网站时随 CloudBase Run 镜像一起更新。
4. Markdown 文档和规则代码的版本号必须一致；版本不一致时不得宣称知识库已上线。

## 3. Dify 历史参考（当前线上不启用）

如未来重新获得独立的 Dify 部署授权，可参考以下节点，但不得把它们当作当前线上能力：

1. Start：接收用户问题。
2. Knowledge Retrieval：检索 `UNGradu EDU 家教客服知识库`。
3. LLM：使用 `deepseek-v4-flash`，系统提示词使用 `ungradu-customer-service-system-prompt.md`。
4. Answer：返回中文回答。

不要让 Dify 读取真实联系方式、验证码、密码、聊天内容、后台集合或生产密钥。

## 4. 历史模型参数（不适用于当前线上客服）

- Temperature：0.2-0.4。
- Max Tokens：800-1200。
- Top P：0.8-0.9。
- 回复语言：简体中文。
- 失败策略：知识库没有答案时，回答“不确定”，并给出 `/feedback` 或规则页作为下一步。

## 5. 历史 WebApp 接入（不适用于当前线上客服）

1. 在 Dify 中发布应用。
2. 打开 WebApp 分享页面。
3. 复制公开 WebApp URL。
4. 在网站生产环境配置：

```bash
NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL=https://你的-dify-webapp-url
```

注意：`NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL` 只能放 Dify WebApp 公开地址，不要把 API Key 放进前端，不要把 Dify Secret Key、模型 Key、CloudBase Secret 或任何生产密钥写入仓库。

## 6. 当前网站接入方式

当前网站 `/customer-service` 页面直接使用站内 v2.2 知识库规则回答，不渲染 Dify iframe，也不读取 `NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL`。这不是“只显示没有找到答案”的离线占位：同义问法、初二/八年级等实体和跨流程问题会组合知识库事实；无法确认的细节会同时给出已确认边界及下一步。

本地验证：

```bash
npm test -- customer-service
npm test -- customer-service-knowledge-docs
npm run typecheck
npm run lint
npm run build
```

## 7. CloudBase 线上部署核对

部署前：

- v2.2 Markdown 与规则代码版本一致。
- 发布包不包含 `.env.local`、生产密钥或历史客服审计数据。
- CloudBase Run 服务 `ungradu-edu-prod` 的上一版本和回滚入口已记录。
- 生产环境仍不得启用测试登录、固定验证码或临时身份头。
- 生产环境不得暴露真实 API Key。

部署后：

- 访问 `/customer-service` 返回 200。
- 页面出现“智能客服”。
- 页面能直接使用站内知识库客服，不依赖模型或 Dify URL。
- 初二/八年级英语找老师、投诉/虚假信息一般咨询、线下具体纠葛和课时费付款等探针均符合 v2.2 答复协议。
- 访问 `/feedback` 返回 200。
- 风险投诉类问题会引导到 `/feedback`。

## 8. 可复制交付清单

面向其他客户复制时，替换以下内容：

- 客户品牌名。
- 客户业务角色。
- 主流程。
- 风险边界。
- 不能承诺的能力。
- 知识库 Markdown。
- Dify System Prompt。
- WebApp URL 环境变量。
- 验收问题集。

保持不变的交付逻辑：

1. 先整理客户知识库。
2. 再写系统提示词和边界规则。
3. 再搭建 Dify 应用。
4. 再接入网站入口。
5. 再用验收问题测试。
6. 最后部署并做线上冒烟。
