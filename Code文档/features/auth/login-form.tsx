"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { parseApiResponse, type ApiResult } from "@/features/api/api-client";
import { validateMainlandPhone, validateSmsCode } from "@/features/auth/phone-auth";
import { sanitizeNextPath } from "@/features/auth/test-auth";

type SendCodeApiResult = ApiResult<{
  expiresInSeconds: number;
  phoneMasked: string;
  resendAfterSeconds: number;
}>;
type LoginApiResult = ApiResult<{
  createdAt: string;
  lastLoginAt: string;
  phoneMasked: string;
  userId: string;
}>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<{ code?: string; phone?: string }>({});
  const [formMessage, setFormMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const now = Date.now();
  const secondsUntilResend = useMemo(
    () => Math.max(0, Math.ceil((resendAvailableAt - now) / 1000)),
    [now, resendAvailableAt]
  );

  async function sendCode() {
    setFormMessage("");

    const phoneValidation = validateMainlandPhone(phone);

    if (!phoneValidation.ok) {
      setErrors(phoneValidation.errors);
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/auth/sms/send-code", {
        body: JSON.stringify({ phone: phoneValidation.value }),
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        method: "POST"
      });
      const result = await parseApiResponse(response) as SendCodeApiResult;

      if (!result.ok) {
        setFormMessage(result.errors.request ?? "验证码发送失败，请稍后再试。");
        return;
      }

      setErrors({});
      setResendAvailableAt(Date.now() + result.value.resendAfterSeconds * 1000);
      setFormMessage(`验证码已发送至 ${result.value.phoneMasked}，请在 5 分钟内完成登录。`);
    } finally {
      setIsSending(false);
    }
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");

    const phoneValidation = validateMainlandPhone(phone);
    const codeValidation = validateSmsCode(code);

    if (!phoneValidation.ok || !codeValidation.ok) {
      setErrors({
        code: codeValidation.ok ? undefined : codeValidation.errors.code,
        phone: phoneValidation.ok ? undefined : phoneValidation.errors.phone
      });
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/auth/sms/login", {
        body: JSON.stringify({
          code: codeValidation.value,
          phone: phoneValidation.value
        }),
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        method: "POST"
      });
      const result = await parseApiResponse(response) as LoginApiResult;

      if (!result.ok) {
        setErrors({
          code: result.errors.code,
          phone: result.errors.phone
        });
        setFormMessage(result.errors.request ?? "登录失败，请稍后再试。");
        return;
      }

      router.push(sanitizeNextPath(searchParams.get("next")));
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <>
      <form className="form" onSubmit={submitLogin}>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            inputMode="tel"
            name="phone"
            onChange={(event) => {
              setPhone(event.target.value);
              setErrors((current) => ({ ...current, phone: undefined }));
            }}
            placeholder="请输入 11 位手机号"
            value={phone}
          />
          <span className="error">{errors.phone}</span>
        </div>
        <div className="field">
          <label htmlFor="code">短信验证码</label>
          <input
            id="code"
            inputMode="numeric"
            name="code"
            onChange={(event) => {
              setCode(event.target.value);
              setErrors((current) => ({ ...current, code: undefined }));
            }}
            placeholder="请输入短信验证码"
            value={code}
          />
          <span className="error">{errors.code}</span>
        </div>
        <button
          className="button secondary"
          disabled={isSending || secondsUntilResend > 0}
          onClick={sendCode}
          type="button"
        >
          {secondsUntilResend > 0
            ? `${secondsUntilResend} 秒后可重发`
            : isSending
              ? "发送中..."
              : "获取验证码"}
        </button>
        <button className="button primary" type="submit">
          {isLoggingIn ? "登录中..." : "登录 / 注册"}
        </button>
      </form>

      {formMessage ? <p className="error">{formMessage}</p> : null}
    </>
  );
}
