export type ContactProfileInput = {
  phone: string;
  wechat: string;
};

type ContactProfileSuccess = {
  ok: true;
  value: ContactProfileInput;
  errors: Record<string, never>;
};

type ContactProfileFailure = {
  ok: false;
  value: null;
  errors: {
    phone?: string;
    wechat?: string;
  };
};

export type ContactProfileValidation =
  | ContactProfileSuccess
  | ContactProfileFailure;

const MAINLAND_PHONE_PATTERN = /^1[3-9]\d{9}$/;

export function validateContactProfileInput(
  input: ContactProfileInput
): ContactProfileValidation {
  const phone = input.phone.trim();
  const wechat = input.wechat.trim();

  if (!phone) {
    return {
      ok: false,
      value: null,
      errors: { phone: "请填写用于交换的手机号" }
    };
  }

  if (!MAINLAND_PHONE_PATTERN.test(phone)) {
    return {
      ok: false,
      value: null,
      errors: { phone: "请填写有效的 11 位手机号" }
    };
  }

  return {
    ok: true,
    value: { phone, wechat },
    errors: {}
  };
}
