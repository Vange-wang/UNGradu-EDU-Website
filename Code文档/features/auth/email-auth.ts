const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_CODE_PATTERN = /^\d{6}$/;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function maskEmail(email: string) {
  const normalized = normalizeEmail(email);
  const [localPart, domain] = normalized.split("@");

  if (!localPart || !domain) {
    return normalized;
  }

  if (localPart.length <= 2) {
    return `${localPart[0] ?? "*"}***@${domain}`;
  }

  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
}

export function validateEmailAddress(email: string) {
  const normalized = normalizeEmail(email);

  if (!EMAIL_PATTERN.test(normalized) || normalized.length > 254) {
    return {
      ok: false as const,
      value: null,
      errors: { email: "请填写有效的邮箱地址" }
    };
  }

  return {
    ok: true as const,
    value: normalized,
    errors: {}
  };
}

export function validateEmailCode(code: string) {
  const normalized = code.trim();

  if (!EMAIL_CODE_PATTERN.test(normalized) || normalized === "000000") {
    return {
      ok: false as const,
      value: null,
      errors: { code: "请填写邮箱验证码" }
    };
  }

  return {
    ok: true as const,
    value: normalized,
    errors: {}
  };
}
