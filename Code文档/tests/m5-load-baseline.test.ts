import { describe, expect, it } from "vitest";

import {
  approveContactExchangeRequest,
  createContactExchangeRequest,
  createOrReadConversationFromSource,
  listConversationMessages,
  readAuthorizedContactProfiles,
  sendConversationMessage
} from "@/features/chat/chat-storage";
import { saveContactProfile } from "@/features/profile/contact-profile-storage";
import { saveTutorProfile } from "@/features/tutor-profiles/tutor-profile-storage";
import { createMemoryStorage } from "@/lib/memory-storage";

function createTutorProfileInput(index: number) {
  return {
    gender: index % 2 === 0 ? "女" : "男",
    school: "东莞理工学院",
    major: `数学与应用数学 ${index}`,
    subjects: ["数学"],
    grades: ["初中"],
    timeSlots: ["周六下午"],
    feeRanges: [
      {
        grade: "初中",
        subject: "数学",
        min: "90",
        max: "130"
      }
    ],
    abilityDescription: `第 ${index} 位大学生擅长拆题和基础巩固。`,
    proofImages: []
  };
}

function createPhone(prefix: "138" | "139", index: number) {
  return `${prefix}${String(index).padStart(8, "0")}`;
}

describe("M5 local load baseline", () => {
  it("runs the core chat and contact exchange flow for 50 local test users", () => {
    const storage = createMemoryStorage();
    const startedAt = performance.now();
    const pairCount = 25;

    for (let index = 0; index < pairCount; index += 1) {
      const parentPhone = createPhone("138", index);
      const tutorPhone = createPhone("139", index);

      saveContactProfile({
        input: { phone: parentPhone, wechat: `parent_${index}` },
        ownerPhone: parentPhone,
        storage
      });
      saveContactProfile({
        input: { phone: tutorPhone, wechat: `tutor_${index}` },
        ownerPhone: tutorPhone,
        storage
      });

      const profile = saveTutorProfile({
        input: createTutorProfileInput(index),
        ownerPhone: tutorPhone,
        storage
      });

      expect(profile.ok).toBe(true);

      if (!profile.ok) {
        continue;
      }

      const conversation = createOrReadConversationFromSource({
        currentUserPhone: parentPhone,
        sourceId: profile.value.id,
        sourceType: "tutor-profile",
        storage
      });

      expect(conversation.ok).toBe(true);

      if (!conversation.ok) {
        continue;
      }

      expect(
        sendConversationMessage({
          conversationId: conversation.value.id,
          senderPhone: parentPhone,
          storage,
          text: "你好，想了解一下周末时间"
        }).ok
      ).toBe(true);
      expect(
        sendConversationMessage({
          conversationId: conversation.value.id,
          senderPhone: tutorPhone,
          storage,
          text: "可以，周六下午方便"
        }).ok
      ).toBe(true);

      const request = createContactExchangeRequest({
        conversationId: conversation.value.id,
        requesterPhone: parentPhone,
        storage
      });

      expect(request.ok).toBe(true);

      if (!request.ok) {
        continue;
      }

      expect(
        approveContactExchangeRequest({
          confirmerPhone: tutorPhone,
          requestId: request.value.id,
          secondConfirmation: true,
          storage
        }).ok
      ).toBe(true);

      expect(
        listConversationMessages({
          conversationId: conversation.value.id,
          currentUserPhone: parentPhone,
          storage
        })
      ).toHaveLength(2);
      expect(
        readAuthorizedContactProfiles({
          conversationId: conversation.value.id,
          currentUserPhone: parentPhone,
          storage
        })
      ).toMatchObject({
        currentUser: { phone: parentPhone },
        otherUser: { phone: tutorPhone }
      });
    }

    expect(performance.now() - startedAt).toBeLessThan(5000);
  });
});
