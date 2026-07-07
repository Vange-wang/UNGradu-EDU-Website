# Dify 智能客服搭建与接入说明

版本：CS-DIFY-SETUP-MVP-2026-07-07  
目标：搭建 UNGradu EDU 家教对接网站智能客服 Agent，并接入 `/customer-service` 页面。

## 1. 平台与模型

- 主平台：Dify。
- 应用类型：Chatflow 优先；若只做最小版本，也可先用 Chat App。
- 主模型：`deepseek-v4-flash`，用于低成本、快速响应的客服问答。
- 备用模型：`deepseek-v4-pro`，用于后续复杂工作流或更强推理场景。
- 当前不建议把多模态作为 MVP 必需项；客服首版以文本问答、规则边界和知识库检索为主。

## 2. 创建 Knowledge

1. 在 Dify 后台创建 Knowledge，名称建议：`UNGradu EDU 家教客服知识库`。
2. 导入文件：`docs/customer-service/ungradu-customer-service-knowledge-base.md`。
3. 分段方式：按 Markdown 标题分段。
4. 检索方式：优先使用混合检索或向量检索；Top K 可先设为 3-5。
5. 命中不足时：不要编造答案，引导用户查看规则页或 `/feedback`。

## 3. 创建 Chatflow / Chat App

推荐 Chatflow 节点：

1. Start：接收用户问题。
2. Knowledge Retrieval：检索 `UNGradu EDU 家教客服知识库`。
3. LLM：使用 `deepseek-v4-flash`，系统提示词使用 `ungradu-customer-service-system-prompt.md`。
4. Answer：返回中文回答。

MVP 不需要先接入外部工具、数据库读取或用户聊天记录。不要让 Dify 读取真实联系方式、验证码、密码、聊天内容、后台集合或生产密钥。

## 4. 推荐参数

- Temperature：0.2-0.4。
- Max Tokens：800-1200。
- Top P：0.8-0.9。
- 回复语言：简体中文。
- 失败策略：知识库没有答案时，回答“不确定”，并给出 `/feedback` 或规则页作为下一步。

## 5. 发布 WebApp

1. 在 Dify 中发布应用。
2. 打开 WebApp 分享页面。
3. 复制公开 WebApp URL。
4. 在网站生产环境配置：

```bash
NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL=https://你的-dify-webapp-url
```

注意：`NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL` 只能放 Dify WebApp 公开地址，不要把 API Key 放进前端，不要把 Dify Secret Key、模型 Key、CloudBase Secret 或任何生产密钥写入仓库。

## 6. 网站接入方式

当前网站已经提供 `/customer-service` 页面：

- 如果生产环境配置了 `NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL`，页面会显示 Dify WebApp iframe。
- 如果没有配置该变量，页面会使用站内离线兜底客服，仍可回答找老师、发布资料、联系方式、费用边界和风险反馈等高频问题。

本地验证：

```bash
npm test -- customer-service
npm test -- customer-service-knowledge-docs
npm run typecheck
npm run lint
npm run build
```

## 7. 线上部署核对

部署前：

- 代码已提交并推送。
- Dify WebApp 已发布。
- 生产环境变量 `NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL` 已配置为 WebApp 地址。
- 生产环境仍不得启用测试登录、固定验证码或临时身份头。
- 生产环境不得暴露真实 API Key。

部署后：

- 访问 `/customer-service` 返回 200。
- 页面出现“智能客服”。
- 配置了 Dify URL 时能看到 Dify WebApp。
- 未配置 Dify URL 时能看到离线兜底客服。
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
