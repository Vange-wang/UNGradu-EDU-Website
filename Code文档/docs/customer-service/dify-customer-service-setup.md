# Dify 智能客服服务端代理接入说明

版本：CS-DIFY-SETUP-MVP-2026-07-07  
目标：搭建 UNGradu EDU 家教对接网站智能客服 Agent，并通过网站服务端安全代理接入 `/customer-service` 页面。

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

MVP 不需要先接入外部工具、数据库读取或用户聊天记录。不要让 Dify 读取真实联系方式、验证码、密码、聊天内容、后台集合或生产密钥。所有真实 App API Key、Knowledge API Key 和模型密钥都只能保留在网站服务端环境变量。

## 4. 推荐参数

- Temperature：0.2-0.4。
- Max Tokens：800-1200。
- Top P：0.8-0.9。
- 回复语言：简体中文。
- 失败策略：知识库没有答案时，回答“不确定”，并给出 `/feedback` 或规则页作为下一步。

## 5. 服务端配置与备用 WebApp

1. 在 Dify 中发布应用。
2. 记录 App API Key、Knowledge API Key、`app_id`、`dataset_id`、fallback 模型和 self-review 模型。
3. 如需保留备用演示入口，再打开 WebApp 分享页面并复制公开 WebApp URL。
4. 在网站服务端环境配置：

```bash
CUSTOMER_SERVICE_RUNTIME_MODE=dify
CUSTOMER_SERVICE_PERSISTENCE_MODE=cloudbase
DIFY_BASE_URL=https://你的-dify-base-url
DIFY_APP_API_KEY=你的-server-side-app-key
DIFY_KNOWLEDGE_API_KEY=你的-server-side-knowledge-key
DIFY_APP_ID=你的-app-id
DIFY_DATASET_ID=你的-dataset-id
DIFY_FALLBACK_MODEL=你的-fallback-model
DIFY_SELF_REVIEW_MODEL=你的-self-review-model
DIFY_REQUEST_TIMEOUT_MS=15000
NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL=https://你的-dify-webapp-url
```

注意：

- `NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL` 只能放公开 WebApp 地址。
- `DIFY_*` 变量必须只存在于服务端环境。
- `APP_ENV=production` 时默认使用 CloudBase 持久化；也可显式设置 `CUSTOMER_SERVICE_PERSISTENCE_MODE=cloudbase`。
- 不要把 API Key 放进前端。
- 缺少 `DIFY_BASE_URL`、`DIFY_APP_API_KEY`、模型配置等任一关键前置时，站内客服必须 fail-closed，不得伪造线上 Dify 成功。
- `DIFY_FALLBACK_MODEL` 与 `DIFY_SELF_REVIEW_MODEL` 必须不同；相同时独立自审不成立，候选内容不会输出。

服务端通过同一已发布 Chatflow 的 `inputs.operation` 分发三类受控操作：

- `knowledge`：必须返回结构化 `status`，并在 `hit` 时同时提供非空回答及有效 `chunk_id`、`score`、`snippet`、`title`。只有非空回答但缺检索证据时按检索失败关闭。
- `fallback`：必须使用 `inputs.model` 指定的 fallback 模型，并返回严格 JSON：`answer_text`、`answer_type`、`uncertainty`。
- `self_review`：必须使用不同的 `inputs.model`，返回严格 JSON：`reason`、`recommended_action`、`review_pass`、`risk_categories`、`risk_level`、`safe_answer`。

Chatflow 必须真实执行对应节点并原样返回这些结构化结果。网站代码只建立服务端契约和失败关闭边界；在没有真实实例、模型和凭据时，不代表 Dify 联调通过。

## 6. 网站接入方式

当前网站以站内 API 作为统一客服入口：

- `/customer-service` 页面调用 `/api/customer-service`。
- `CUSTOMER_SERVICE_RUNTIME_MODE=local_mvp` 时，使用站内本地守卫链路和本地 intake/audit 文件，适合本地 MVP。
- `CUSTOMER_SERVICE_RUNTIME_MODE=dify` 时，站内服务端代理 Dify；若关键配置缺失，则返回保守模板，不伪造线上成功。
- `NEXT_PUBLIC_DIFY_CUSTOMER_SERVICE_URL` 只决定是否展示备用 WebApp 外链，不决定站内主链路。

本地文件持久化边界：

- `data/customer-service` 下的状态、审计和 intake 文件只适用于单个 Node.js 进程的本地 MVP。
- 当前实现会在单进程内串行化同一文件的写入并验证幂等去重，但不提供跨进程、跨机器事务或生产级原子 upsert。
- 生产环境必须替换为具备唯一索引/原子 upsert 的持久化实现，并单独验证并发、保留期、删除、备份和访问控制。

生产 CloudBase 持久化使用以下服务端专用集合：

- `customer_service_conversation_states`
- `customer_service_audit_records`
- `customer_service_kb_intake`
- `customer_service_critical_events`

部署前运行 `npm run customer-service:cloudbase:collections` 检查并创建缺失集合。知识缺口以版本化指纹映射为稳定文档 ID，并在服务端事务中更新出现次数；删除可按同一指纹定位文档。集合不得开放客户端直读写，人工整理后才能导出候选答案并导入 Dify Knowledge，禁止自动发布。

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
- `/api/customer-service` 返回统一 JSON 契约。
- `local_mvp` 模式下，知识库命中可回答，未知问题会保守收口并进入本地 intake。
- `dify` 模式下，缺关键配置会 fail-closed，不伪造线上 Dify 成功。
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
