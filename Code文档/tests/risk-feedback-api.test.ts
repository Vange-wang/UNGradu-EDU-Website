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
    },
    where(query: Record<string, unknown>) {
      return {
        orderBy() {
          return this;
        },
        async get() {
          return {
            data: Array.from(documents.values()).filter((document) =>
              Object.entries(query).every(([key, value]) => document[key] === value)
            )
          };
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
        },
        where() {
          return {
            async get() {
              return { data: [] };
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

  it("lists only the current user's feedback records", async () => {
    const collection = createFakeCollection();
    collection.documents.set("risk-feedback-a", {
      category: "骚扰",
      contactMethod: "private@example.com",
      createdAt: "2026-07-17T08:00:00.000Z",
      description: "对方持续要求绕开站内沟通。",
      evidenceNote: "已保存截图",
      id: "risk-feedback-a",
      sourcePage: "/feedback",
      status: "recorded",
      submittedByUserId: "13800138000",
      targetReference: "/chats/a",
      targetType: "聊天",
      updatedAt: "2026-07-17T08:00:00.000Z"
    });
    collection.documents.set("risk-feedback-b", {
      category: "虚假信息",
      contactMethod: "other@example.com",
      createdAt: "2026-07-17T08:10:00.000Z",
      description: "另一位用户的反馈。",
      evidenceNote: "",
      id: "risk-feedback-b",
      sourcePage: "/feedback",
      status: "reviewing",
      submittedByUserId: "13900139000",
      targetReference: "tutor-profile-b",
      targetType: "家教信息",
      updatedAt: "2026-07-17T08:10:00.000Z"
    });

    const handlers = createRiskFeedbackApiHandlers({
      collection,
      env: { NODE_ENV: "test", NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true" }
    });

    const response = await handlers.GET(
      new Request("http://localhost/api/feedback", {
        headers: { "x-ungradu-test-user-phone": "13800138000" }
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      value: [
        {
          category: "骚扰",
          id: "risk-feedback-a",
          status: "recorded",
          targetType: "聊天"
        }
      ]
    });
  });

  it("does not enumerate anonymous feedback records through GET", async () => {
    const collection = createFakeCollection();
    collection.documents.set("risk-feedback-anonymous", {
      category: "功能异常",
      createdAt: "2026-07-17T08:00:00.000Z",
      description: "匿名反馈。",
      id: "risk-feedback-anonymous",
      sourcePage: "/feedback",
      status: "recorded",
      submittedByUserId: null,
      targetType: "其他 / 不确定"
    });

    const handlers = createRiskFeedbackApiHandlers({
      collection,
      env: { NODE_ENV: "test", NEXT_PUBLIC_ALLOW_TEST_LOGIN: "true" }
    });

    const response = await handlers.GET(
      new Request("http://localhost/api/feedback")
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      errors: {
        request: "登录后才能查看自己的反馈记录。"
      }
    });
  });
});
