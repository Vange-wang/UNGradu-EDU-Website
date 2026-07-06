import { describe, expect, it } from "vitest";

import { createRiskFeedbackApiHandlers } from "@/server/risk-feedback-api";

type StoredDocument = Record<string, unknown>;

function createFakeCollection() {
  const documents = new Map<string, StoredDocument>();

  return {
    documents,
    doc(docId: string) {
      return {
        async set(data: StoredDocument) {
          documents.set(docId, data);
          return { updated: 1 };
        }
      };
    }
  };
}

describe("risk feedback API handlers", () => {
  it("saves anonymous feedback without requiring contact information", async () => {
    const collection = createFakeCollection();
    const handlers = createRiskFeedbackApiHandlers({
      collection,
      env: { NODE_ENV: "test", NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true" }
    });

    const response = await handlers.POST(
      new Request("http://localhost/api/feedback", {
        body: JSON.stringify({
          category: "联系方式滥用",
          targetType: "聊天",
          targetReference: "/chats/conversation-a",
          description: "对方要求直接发送手机号和详细地址，需要记录。",
          evidenceNote: "",
          contactMethod: "",
          sourcePage: "/feedback"
        }),
        method: "POST"
      })
    );

    const body = await response.json();
    const saved = Array.from(collection.documents.values())[0];

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      value: {
        category: "联系方式滥用",
        submittedByUserId: null,
        status: "recorded"
      }
    });
    expect(saved).toMatchObject({
      contactMethod: "",
      sourcePage: "/feedback",
      submittedByUserId: null
    });
    expect(saved.createdAt).toEqual(expect.any(String));
  });

  it("records a temporary test user when one is available outside production", async () => {
    const collection = createFakeCollection();
    const handlers = createRiskFeedbackApiHandlers({
      collection,
      env: { NODE_ENV: "test", NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true" }
    });

    const response = await handlers.POST(
      new Request("http://localhost/api/feedback", {
        body: JSON.stringify({
          category: "虚假信息",
          targetType: "家教信息",
          targetReference: "tutor-profile-a",
          description: "学校专业信息可能不准确，需要排查。",
          evidenceNote: "页面截图已自行保存。",
          contactMethod: "parent@example.com",
          sourcePage: "/tutor-profiles/tutor-profile-a"
        }),
        headers: { "x-ungradu-test-user-phone": "13800138000" },
        method: "POST"
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      value: {
        submittedByUserId: "13800138000"
      }
    });
  });

  it("rejects invalid feedback input", async () => {
    const handlers = createRiskFeedbackApiHandlers({
      collection: createFakeCollection(),
      env: { NODE_ENV: "test", NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true" }
    });

    const response = await handlers.POST(
      new Request("http://localhost/api/feedback", {
        body: JSON.stringify({
          category: "",
          targetType: "",
          targetReference: "",
          description: "",
          evidenceNote: "",
          contactMethod: "",
          sourcePage: ""
        }),
        method: "POST"
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      errors: {
        category: "请选择反馈类型",
        targetType: "请选择反馈对象",
        description: "请填写问题描述"
      }
    });
  });

  it("returns a JSON failure when the feedback collection cannot be written", async () => {
    const handlers = createRiskFeedbackApiHandlers({
      collection: {
        doc() {
          return {
            async set() {
              throw new Error("collection missing");
            }
          };
        }
      },
      env: { NODE_ENV: "test", NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true" }
    });

    const response = await handlers.POST(
      new Request("http://localhost/api/feedback", {
        body: JSON.stringify({
          category: "功能异常",
          targetType: "其他 / 不确定",
          targetReference: "",
          description: "反馈页提交失败，需要稍后重试。",
          evidenceNote: "",
          contactMethod: "",
          sourcePage: "/feedback"
        }),
        method: "POST"
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      value: null,
      errors: {
        request: "反馈提交失败，请稍后重试。"
      }
    });
  });
});
