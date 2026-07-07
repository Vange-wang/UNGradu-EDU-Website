export type CustomerServiceReply = {
  intent:
    | "empty"
    | "parent_need"
    | "tutor_profile"
    | "contact_exchange"
    | "pricing"
    | "risk_handoff"
    | "login"
    | "privacy"
    | "fallback";
  answer: string;
  handoffRequired: boolean;
};

const riskWords = ["投诉", "退款", "赔偿", "合同", "仲裁", "纠纷", "骚扰", "虚假", "线下付款"];
const parentNeedWords = ["找老师", "找家教", "家长", "学生", "发布需求", "补课"];
const tutorProfileWords = ["做家教", "当家教", "大学生", "老师资料", "发布资料", "可教"];
const contactWords = ["联系方式", "手机号", "微信", "联系老师", "联系家长", "交换"];
const pricingWords = ["课时费", "多少钱", "价格", "收费", "费用", "预算"];
const loginWords = ["登录", "注册", "验证码", "密码", "账号"];
const privacyWords = ["隐私", "安全", "个人信息", "未成年人", "公开展示"];

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

export function getTutorCustomerServiceReply(message: string): CustomerServiceReply {
  const text = message.trim();

  if (!text) {
    return {
      intent: "empty",
      answer: "请先输入你想咨询的问题，例如“怎么发布找老师需求”或“什么时候能交换联系方式”。",
      handoffRequired: false
    };
  }

  if (includesAny(text, riskWords)) {
    return {
      intent: "risk_handoff",
      answer:
        "这类问题需要人工记录和排查。当前平台不做担保交易、退款裁决、合同处理或人工仲裁；你可以先到“风险与功能反馈”页面提交对象、问题描述和证据说明，平台会按试运行规则记录排查。",
      handoffRequired: true
    };
  }

  if (includesAny(text, tutorProfileWords)) {
    return {
      intent: "tutor_profile",
      answer:
        "大学生家教可以发布可教资料，填写学校、可教科目、学段、时间、课时费和个人说明。资料越清楚，家长越容易判断是否合适；不要在公开资料里直接写手机号或微信。",
      handoffRequired: false
    };
  }

  if (includesAny(text, parentNeedWords)) {
    return {
      intent: "parent_need",
      answer:
        "家长或学生可以先发布找老师需求，填写科目、学段、预算、上课方式和时间偏好。公开列表不会展示联系方式，建议先在站内聊清楚科目、地点范围和课时安排。",
      handoffRequired: false
    };
  }

  if (includesAny(text, contactWords)) {
    return {
      intent: "contact_exchange",
      answer:
        "联系方式需要双方先站内沟通并二次确认后再交换。公开列表和详情页不展示手机号、微信号等直接联系方式，这样能减少骚扰和误联系。",
      handoffRequired: false
    };
  }

  if (includesAny(text, pricingWords)) {
    return {
      intent: "pricing",
      answer:
        "平台试运行阶段不做支付、抽佣或课时费担保。课时费由家长和大学生家教自行沟通确认，建议先明确科目、学段、上课方式、频率和预算范围。",
      handoffRequired: false
    };
  }

  if (includesAny(text, loginWords)) {
    return {
      intent: "login",
      answer:
        "你可以通过登录 / 注册入口进入账号流程。当前站点支持验证码和密码相关流程；如果登录后仍无法发布或查看个人页，可以先退出后重新登录。",
      handoffRequired: false
    };
  }

  if (includesAny(text, privacyWords)) {
    return {
      intent: "privacy",
      answer:
        "平台默认保护联系方式：公开页不展示手机号、微信号等直接联系方式。涉及未成年人、住址、线下见面和付款的信息，请只在确认必要时谨慎沟通。",
      handoffRequired: false
    };
  }

  return {
    intent: "fallback",
    answer:
      "这个问题我还没有找到确定答案。你可以换一种说法，或到“规则”“风险与功能反馈”页面查看边界说明；涉及投诉、纠纷、退款、合同等问题建议走人工记录。",
    handoffRequired: true
  };
}
