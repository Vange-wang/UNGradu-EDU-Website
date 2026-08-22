/**
 * UNGradu EDU customer-service knowledge-only responder.
 *
 * This module intentionally does not call a model or an external provider.
 * The answer facts and guard order mirror
 * docs/customer-service/ungradu-customer-service-knowledge-base-v2.md.
 */

export const CUSTOMER_SERVICE_KNOWLEDGE_BASE_VERSION =
  "CS-KB-UNGRADU-V2.2-2026-08-13";

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
    | "browse"
    | "delete_restore"
    | "feedback"
    | "verification_boundary"
    | "safety_guidance"
    | "fallback";
  answer: string;
  handoffRequired: boolean;
};

type StudyDetails = {
  subject?: string;
  grade?: string;
  area?: string;
};

const subjects = ["语文", "数学", "英语", "物理", "化学", "生物"];
const areas = ["松山湖", "大岭山", "寮步", "东城"];

const parentNeedWords = [
  "找老师",
  "找家教",
  "请老师",
  "请个老师",
  "招老师",
  "发布需求",
  "家教需求",
  "找辅导",
  "给孩子",
  "孩子辅导",
  "家长端",
  "发布家教需求"
];
const tutorProfileWords = [
  "做家教",
  "当家教",
  "接家教",
  "接单",
  "想教",
  "教学生",
  "找学生",
  "大学生家教",
  "家教信息",
  "发布家教资料",
  "发布家教信息",
  "发布资料",
  "可教科目"
];
const contactWords = [
  "联系方式",
  "手机号",
  "手机号码",
  "微信",
  "加微",
  "电话",
  "号码",
  "联系老师",
  "联系家长",
  "互留",
  "交换"
];
const pricingWords = [
  "课时费",
  "每小时",
  "一小时",
  "多少钱",
  "价格",
  "收费",
  "费用",
  "预算",
  "怎么付",
  "付款方式"
];
const loginWords = ["登录", "注册", "验证码", "密码", "账号", "登不上", "登录失败"];
const privacyWords = [
  "隐私",
  "安全",
  "个人信息",
  "未成年人",
  "公开展示",
  "公开资料",
  "门牌号",
  "详细地址"
];
const browseWords = [
  "怎么筛选",
  "如何筛选",
  "筛选",
  "搜索老师",
  "浏览老师",
  "广场",
  "怎么找合适"
];
const deleteWords = ["删除", "删掉", "下架", "撤回发布", "撤回", "恢复", "找回发布"];
const feedbackWords = ["反馈入口", "功能异常", "功能失败", "提交反馈", "举报", "记录问题"];
const verificationWords = [
  "实名认证",
  "认证",
  "审核",
  "真实老师",
  "真实性",
  "自动匹配",
  "智能匹配",
  "保证匹配",
  "推荐老师"
];

const riskWords = [
  "投诉",
  "退款",
  "赔偿",
  "合同",
  "仲裁",
  "纠纷",
  "骚扰",
  "虚假",
  "诈骗",
  "冒充",
  "联系方式滥用",
  "付款风险",
  "转账",
  "付款",
  "付钱",
  "支付",
  "收款",
  "线下见面",
  "线下交易",
  "线下发生",
  "发生纠葛"
];

// These signals mean the user is describing a particular event, not asking
// for the general feedback policy. “遇到骚扰怎么办？” intentionally does
// not match this list and therefore receives the general /feedback guidance.
const concreteEventSignals = [
  "我已经",
  "我已",
  "我刚刚",
  "我现在",
  "我遇到",
  "我碰到",
  "我们已经",
  "对方",
  "他让我",
  "她让我",
  "被对方",
  "已经发生",
  "正在发生",
  "刚发生",
  "这笔",
  "这次",
  "今天",
  "昨天",
  "收到",
  "付了",
  "付过",
  "转了",
  "汇了",
  "给过",
  "线下发生",
  "发生纠葛",
  "准备付款",
  "准备转账",
  "打算付款",
  "打算转账",
  "即将付款",
  "具体争议"
];
const roleWords = [
  "家长端",
  "学生端",
  "大学生家教端",
  "我是家长",
  "我是学生",
  "我是大学生家教",
  "家教端"
];
const eventStateWords = [
  "已经",
  "已发生",
  "发生了",
  "正在",
  "准备",
  "打算",
  "即将",
  "还没发生",
  "尚未发生",
  "已经发生"
];

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function normalizeText(input: string) {
  return input
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[“”‘’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractStudyDetails(text: string): StudyDetails {
  const subject = subjects.find((item) => text.includes(item));
  const gradeRules: Array<[string, string[]]> = [
    ["初一", ["初一", "七年级", "初中一年级"]],
    ["初二", ["初二", "八年级", "初中二年级"]],
    ["初三", ["初三", "九年级", "初中三年级"]],
    ["高中", ["高中", "高一", "高二", "高三"]],
    ["小学一至三年级", ["小学一至三", "小学低年级"]],
    ["小学四至六年级", ["小学四至六", "小学高年级"]],
    ["小学", ["小学"]]
  ];
  const grade = gradeRules.find(([, aliases]) => includesAny(text, aliases))?.[0];
  const area = areas.find((item) => text.includes(item));

  return { area, grade, subject };
}

function renderStudyDetails(details: StudyDetails) {
  const parts: string[] = [];

  if (details.subject) {
    parts.push(`科目选择“${details.subject}”`);
  }
  if (details.grade) {
    parts.push(`学段/年级选择“${details.grade}”`);
  }
  if (details.area) {
    parts.push(`区域选择东莞的“${details.area}”`);
  }

  return parts.join("，");
}

function hasExplicitRole(text: string) {
  return includesAny(text, roleWords);
}

function hasEventState(text: string) {
  return includesAny(text, eventStateWords) || includesAny(text, concreteEventSignals);
}

function isGeneralRiskQuestion(text: string) {
  if (!includesAny(text, riskWords) || includesAny(text, concreteEventSignals)) {
    return false;
  }

  return includesAny(text, [
    "平台",
    "规则",
    "入口",
    "渠道",
    "怎么处理",
    "如何处理",
    "怎么办",
    "在哪里",
    "能不能投诉",
    "一般",
    "通常",
    "反馈"
  ]);
}

function requiresIdentityClarification(text: string) {
  return includesAny(text, riskWords) && !isGeneralRiskQuestion(text) &&
    (!hasExplicitRole(text) || !hasEventState(text));
}

function answerRiskQuestion(text: string): CustomerServiceReply {
  if (requiresIdentityClarification(text)) {
    return {
      intent: "risk_handoff",
      answer:
        "为了按对应规则说明，请问你是家长/学生端，还是大学生家教端？事情已经发生了吗，主要涉及付款、联系方式、线下见面，还是其他争议？在身份和事件状态明确前，[已确认]平台不提供在线支付、担保交易、退款处理、合同处理或人工仲裁，也不做担保交易、退款裁决、合同处理或人工仲裁；可以到 /feedback 记录和排查。请不要提交密码、验证码、身份证、银行卡、支付凭证、完整联系方式或详细住址。",
      handoffRequired: true
    };
  }

  if (includesAny(text, ["投诉", "虚假", "骚扰", "联系方式滥用", "举报"])) {
    return {
      intent: "feedback",
      answer:
        "[已确认]可以进入 /feedback，选择对应反馈类型和对象（需求、家教信息、聊天、联系方式或其他/不确定），填写问题描述和可用于排查的证据说明。反馈是记录和排查入口，不等同于即时客服、人工仲裁、退款、赔偿或自动封禁承诺；不要提交密码、验证码、身份证、银行卡、完整手机号/微信号或详细住址。",
      handoffRequired: false
    };
  }

  return {
    intent: "risk_handoff",
    answer:
      "[已确认]平台当前不提供在线支付、担保交易、资金托管、退款、赔偿、合同处理或人工仲裁，也不做担保交易、退款裁决、合同处理或人工仲裁，不对线下交易、线下见面或付款结果负责。请到 /feedback 记录问题和可用于排查的最小必要线索；反馈不代表平台已经接受退款、赔偿或裁决请求。客服不会替双方判断应停止或继续付款。",
    handoffRequired: true
  };
}

function answerParentNeed(text: string): CustomerServiceReply {
  const details = extractStudyDetails(text);
  const detailText = renderStudyDetails(details);
  const tailored = detailText
    ? `你提到的${detailText}都属于当前支持的发布/筛选信息。`
    : "科目可选语文、数学、英语、物理、化学、生物，学段/年级可选小学一至三年级、小学四至六年级、初一、初二、初三或高中。";

  return {
    intent: "parent_need",
    answer:
      `[已确认]家长/学生先登录，进入 /parent-needs/new（发布家教需求），填写希望老师性别、至少一个科目、学段/年级、预算最低值和最高值、至少一个时间段、广东省/东莞市下的区域、小区或村，以及最多 100 字的孩子简介。${tailored}预算必须是正数且最低值不能高于最高值；具体位置不要写楼栋、单元、楼层或门牌号，也不要在公开说明中写手机号、微信号。公开列表不会展示联系方式。发布后也可以到 /tutor-profiles 浏览家教信息，按科目、学段、课时费和性别筛选；进入详情后先站内沟通，再按双方同意和二次确认流程交换联系方式。`,
    handoffRequired: false
  };
}

function answerTutorProfile(): CustomerServiceReply {
  return {
    intent: "tutor_profile",
    answer:
      "[已确认]大学生家教先登录，进入 /tutor-profiles/new（发布家教信息），填写性别、学校、专业、可教科目、可教学段、至少一个时间段、一个或多个完整课时费区间和能力说明；可附 JPG、PNG 或 WebP 证明图片，单张最大 5MB，但当前证明图片不会公开展示，也不能据此承诺平台已完成认证或审核。公开资料不要写手机号、微信号或精确住址；不要在公开资料里直接写手机号或微信。发布后可到 /parent-needs 浏览需求，筛选后进入详情发起站内聊天。",
    handoffRequired: false
  };
}

function answerContactExchange(): CustomerServiceReply {
  return {
    intent: "contact_exchange",
    answer:
      "[已确认]公开列表和详情页默认不展示手机号、微信号或邮箱。正确流程是：先进入详情发起站内聊天，双方先站内沟通并二次确认，确认科目/学段、学习目标、时间、地点范围和预算；再由任一方发起联系方式交换请求，对方可以同意或拒绝，发起方可以撤回。接收方同意前要完成页面二次确认，且双方都要先保存手机号；同意后才会在当前会话看到双方已保存的联系方式。待处理请求创建 7 天后会过期，发布被删除、变成旧记录或版本不匹配时不能继续查看或交换。",
    handoffRequired: false
  };
}

function answerPricing(): CustomerServiceReply {
  return {
    intent: "pricing",
    answer:
      "[已确认]当前是小范围免费试运行，不提供在线支付、不抽佣、不做成交追踪、不托管课时费，也不提供担保交易；不做支付、抽佣或课时费担保。预算和课时费单位为元/小时，具体数额、频率、试课安排、教学方式、最终地点和是否开始合作由家长/学生与大学生家教自行协商；平台不提供退款或赔偿承诺。涉及已经发生的付款、转账或争议时，请先说明你属于哪一端以及事件是否已经发生，再按对应规则说明。",
    handoffRequired: false
  };
}

function answerLogin(): CustomerServiceReply {
  return {
    intent: "login",
    answer:
      "[已确认]发布、站内聊天、保存联系方式和联系方式交换需要登录；公开浏览和查看规则一般不需要登录。邮箱验证码有效期为 5 分钟，过期或发送过于频繁时可稍后重新获取。设置密码后也可用邮箱+密码登录，密码至少 8 位且同时包含字母和数字。若仍无法发布或页面功能异常，可到 /feedback 选择功能失败并说明页面、操作和现象；不要提交密码或验证码。",
    handoffRequired: false
  };
}

function answerPrivacy(): CustomerServiceReply {
  return {
    intent: "privacy",
    answer:
      "[已确认]公开列表、公开详情和未授权聊天不会直接展示手机号、微信号、邮箱或内部账号标识。不要把手机号、微信号、精确住址、密码、验证码、身份证、银行卡或未成年人不必要的敏感资料写进公开资料、聊天或反馈；联系方式应先保存到 /profile/contact，经过双方同意和二次确认后再按交换流程展示。",
    handoffRequired: false
  };
}

function answerBrowse(): CustomerServiceReply {
  return {
    intent: "browse",
    answer:
      "[已确认]可以先浏览 /parent-needs 或 /tutor-profiles。需求广场支持按科目、学段/年级、预算上下限和老师性别偏好筛选；家教信息广场支持按可教科目、可教学段、课时费上下限和性别筛选。公开列表只用于初步判断，不展示直接联系方式；进入详情后先登录并发起站内聊天。",
    handoffRequired: false
  };
}

function answerDeleteRestore(): CustomerServiceReply {
  return {
    intent: "delete_restore",
    answer:
      "[已确认]在个人中心管理自己的需求或家教信息。删除会立即从公开页面下架，48 小时内可以恢复并重新公开；超过窗口后不能按该窗口恢复。删除期间历史聊天可以保留查看，但不能发送新消息，也不能继续查看或交换联系方式。旧记录如果显示“旧记录·暂不可管理”，需要重新发布才能使用当前管理能力。",
    handoffRequired: false
  };
}

function answerFeedback(): CustomerServiceReply {
  return {
    intent: "feedback",
    answer:
      "[已确认]功能异常、暂不能确定的问题或风险线索可以进入 /feedback。反馈类型和对象必选，对象标识/页面线索最多 200 字，问题描述最多 1000 字，证据说明最多 500 字；可以匿名提交，登录后可在“我的反馈”查看状态。状态可能为已记录、排查中、已归档或暂无法处理；反馈是记录和排查入口，不承诺即时处理、固定时限、退款、赔偿、人工仲裁或自动封禁。",
    handoffRequired: false
  };
}

function answerVerificationBoundary(): CustomerServiceReply {
  return {
    intent: "verification_boundary",
    answer:
      "[已确认]当前没有足够依据承诺老师实名认证、学历或资料真实性审核，也没有自动推荐最合适老师或保证匹配的能力。公开资料只能用于初步判断；建议先在站内确认科目/学段、时间、地点范围和预算，再决定是否发起联系方式交换。",
    handoffRequired: false
  };
}

function answerSafetyGuidance(): CustomerServiceReply {
  return {
    intent: "safety_guidance",
    answer:
      "[已确认]如果只是咨询未成年人或线下见面前的通用边界，可以先确认科目/学段、时间、地点范围和预算，谨慎决定是否交换联系方式；平台不提供线下安全担保或人工陪同。不要在公开资料、聊天或反馈中提交详细住址、身份证、银行卡、密码、验证码或未成年人不必要的敏感资料。",
    handoffRequired: false
  };
}

function isGeneralPricingQuestion(text: string) {
  const paymentOnly = includesAny(text, ["付款", "支付", "转账", "收款", "付钱"]);
  const hasFeeContext = includesAny(text, ["课时费", "费用", "预算", "收费", "价格", "多少钱", "怎么付"]);
  const hasDisputeContext = includesAny(text, [
    "退款",
    "赔偿",
    "合同",
    "仲裁",
    "纠纷",
    "投诉",
    "诈骗",
    "骚扰",
    "虚假",
    "对方",
    "已经",
    "发生"
  ]);

  return paymentOnly && hasFeeContext && !hasDisputeContext;
}

function answerFallback(text: string): CustomerServiceReply {
  const details = extractStudyDetails(text);
  const facts: string[] = [];

  if (details.subject || details.grade || details.area) {
    facts.push(
      `你提到的${renderStudyDetails(details)}可以作为需求或家教信息中的筛选/发布条件。`
    );
  }
  if (includesAny(text, contactWords)) {
    facts.push("联系方式要先站内沟通，双方同意并完成二次确认后才按交换请求展示");
  }
  if (includesAny(text, pricingWords)) {
    facts.push("平台当前免费试运行，不在线支付、不抽佣、不托管课时费，具体课时费由双方协商");
  }
  if (includesAny(text, loginWords)) {
    facts.push("发布和沟通需要登录，验证码有效期为 5 分钟");
  }
  if (includesAny(text, deleteWords)) {
    facts.push("删除会立即下架，48 小时内可以恢复");
  }
  if (includesAny(text, privacyWords)) {
    facts.push("公开页面不展示手机号、微信号、邮箱或内部账号标识");
  }

  const factText = facts.length
    ? `与之相关的已确认事实是：${facts.join("；")}。`
    : "已确认的通用流程是：登录（需要时）→ 发布或浏览 → 筛选 → 查看详情 → 站内文字沟通 → 确认科目/学段、时间、地点范围和预算 → 再按双方同意和二次确认流程交换联系方式。";

  const unsupported = includesAny(text, ["编程", "线上课", "线下课", "混合上课"])
    ? "其中你提到的具体课程方式或科目目前未被当前页面单独确认，不能直接当作平台已有选项。"
    : "具体细节当前未单独确认，不能据此猜测平台没有记录的能力。";

  return {
    intent: "fallback",
    answer:
      `[当前未确认]${unsupported}${factText}如果你要继续定位，请补充是发布需求、发布家教信息、浏览筛选、站内聊天、联系方式、登录还是风险反馈；涉及功能异常或风险线索可直接进入 /feedback，普通规则可查看 /rules。`,
    handoffRequired: true
  };
}

function detectIntent(text: string): CustomerServiceReply["intent"] {
  const scores: Array<[CustomerServiceReply["intent"], number]> = [
    ["tutor_profile", 0],
    ["parent_need", 0],
    ["contact_exchange", 0],
    ["pricing", 0],
    ["login", 0],
    ["privacy", 0],
    ["browse", 0],
    ["delete_restore", 0],
    ["feedback", 0],
    ["verification_boundary", 0],
    ["safety_guidance", 0]
  ];

  const add = (intent: CustomerServiceReply["intent"], amount: number) => {
    const item = scores.find(([name]) => name === intent);
    if (item) item[1] += amount;
  };

  if (includesAny(text, tutorProfileWords)) add("tutor_profile", 3);
  if (text.includes("大学生")) add("tutor_profile", 2);
  if (includesAny(text, parentNeedWords)) add("parent_need", 3);
  if ((text.includes("找") && text.includes("家教")) || (text.includes("找") && text.includes("孩子"))) {
    add("parent_need", 3);
  }
  if (text.includes("家长")) add("parent_need", 1);
  if (includesAny(text, contactWords)) add("contact_exchange", 3);
  if (includesAny(text, pricingWords)) add("pricing", 3);
  if (includesAny(text, loginWords)) add("login", 3);
  if (includesAny(text, privacyWords)) add("privacy", 2);
  if (includesAny(text, browseWords)) add("browse", 2);
  if (includesAny(text, deleteWords)) add("delete_restore", 3);
  if (includesAny(text, feedbackWords)) add("feedback", 3);
  if (includesAny(text, verificationWords)) add("verification_boundary", 3);
  if (text.includes("未成年人") || text.includes("线下见面前")) {
    add("safety_guidance", 4);
  }

  const best = scores.sort((left, right) => right[1] - left[1])[0];
  return best[1] > 0 ? best[0] : "fallback";
}

export function getTutorCustomerServiceReply(message: string): CustomerServiceReply {
  const text = normalizeText(message);

  if (!text) {
    return {
      intent: "empty",
      answer: "请先输入想咨询的问题，例如“初二英语怎么找老师”“怎么发布家教信息”或“什么时候能交换联系方式”。",
      handoffRequired: false
    };
  }

  // Transaction/dispute safety takes precedence over every ordinary intent.
  if (isGeneralPricingQuestion(text)) {
    return answerPricing();
  }

  if (includesAny(text, riskWords)) {
    if (text.includes("线下见面前") || (text.includes("未成年人") && !hasEventState(text))) {
      return answerSafetyGuidance();
    }
    return answerRiskQuestion(text);
  }

  switch (detectIntent(text)) {
    case "tutor_profile":
      return answerTutorProfile();
    case "parent_need":
      return answerParentNeed(text);
    case "contact_exchange":
      return answerContactExchange();
    case "pricing":
      return answerPricing();
    case "login":
      return answerLogin();
    case "privacy":
      return answerPrivacy();
    case "browse":
      return answerBrowse();
    case "delete_restore":
      return answerDeleteRestore();
    case "feedback":
      return answerFeedback();
    case "verification_boundary":
      return answerVerificationBoundary();
    case "safety_guidance":
      return answerSafetyGuidance();
    default:
      return answerFallback(text);
  }
}
