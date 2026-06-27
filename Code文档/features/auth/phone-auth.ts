const MAINLAND_PHONE_PATTERN = /^1[3-9]\d{9}$/;
const SMS_CODE_PATTERN = /^\d{6}$/;

export function normalizePhone(phone: string) {
  return phone.trim();
}

export function maskPhone(phone: string) {
  const normalized = normalizePhone(phone);

  if (normalized.length !== 11) {
    return normalized;
  }

  return `${normalized.slice(0, 3)}****${normalized.slice(7)}`;
}

export function validateMainlandPhone(phone: string) {
  const normalized = normalizePhone(phone);

  if (!MAINLAND_PHONE_PATTERN.test(normalized)) {
    return {
      ok: false as const,
      value: null,
      errors: { phone: "请填写有效的 11 位手机号" }
    };
  }

  return {
    ok: true as const,
    value: normalized,
    errors: {}
  };
}

export function validateSmsCode(code: string) {
  const normalized = code.trim();

  if (!SMS_CODE_PATTERN.test(normalized) || normalized === "000000") {
    return {
      ok: false as const,
      value: null,
      errors: { code: "请填写短信验证码" }
    };
  }

  return {
    ok: true as const,
    value: normalized,
    errors: {}
  };
}
