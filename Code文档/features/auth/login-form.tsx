"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { parseApiResponse, type ApiResult } from "@/features/api/api-client";
import { notifyAuthSessionAuthenticated } from "@/features/auth/auth-session-events";
import { validateEmailAddress, validateEmailCode } from "@/features/auth/email-auth";
import { sanitizeNextPath } from "@/features/auth/test-auth";

type SendCodeApiResult = ApiResult<{
  expiresInSeconds: number;
  emailMasked: string;
  resendAfterSeconds: number;
}>;
type LoginApiResult = ApiResult<{
  createdAt: string;
  emailMasked: string;
  lastLoginAt: string;
  userId: string;
}>;
type PasswordActionResult = ApiResult<{
  passwordUpdatedAt: string;
}>;

type LoginMode = "code" | "password" | "reset";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<LoginMode>("code");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<{
    code?: string;
    email?: string;
    password?: string;
    passwordConfirm?: string;
  }>({});
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

    const emailValidation = validateEmailAddress(email);

    if (!emailValidation.ok) {
      setErrors(emailValidation.errors);
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/auth/email/send-code", {
        body: JSON.stringify({ email: emailValidation.value }),
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        method: "POST"
      });
      const result = await parseApiResponse(response) as SendCodeApiResult;

      if (!result.ok) {
        setFormMessage(result.errors.request ?? "邮件服务暂时不可用，请稍后重新获取验证码。");
        return;
      }

      setErrors({});
      setResendAvailableAt(Date.now() + result.value.resendAfterSeconds * 1000);
      setFormMessage(`验证码已发送至 ${result.value.emailMasked}，请在 5 分钟内完成登录。`);
    } finally {
      setIsSending(false);
    }
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");

    const emailValidation = validateEmailAddress(email);
    const codeValidation = validateEmailCode(code);

    if (!emailValidation.ok || !codeValidation.ok) {
      setErrors({
        code: codeValidation.ok ? undefined : codeValidation.errors.code,
        email: emailValidation.ok ? undefined : emailValidation.errors.email
      });
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/auth/email/login", {
        body: JSON.stringify({
          code: codeValidation.value,
          email: emailValidation.value
        }),
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        method: "POST"
      });
      const result = await parseApiResponse(response) as LoginApiResult;

      if (!result.ok) {
        setErrors({
          code: result.errors.code,
          email: result.errors.email,
          password: undefined,
          passwordConfirm: undefined
        });
        setFormMessage(result.errors.request ?? "登录失败，请稍后再试。");
        return;
      }

      notifyAuthSessionAuthenticated();
      router.push(sanitizeNextPath(searchParams.get("next")));
      router.refresh();
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function submitPasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");

    const emailValidation = validateEmailAddress(email);

    if (!emailValidation.ok || !password.trim()) {
      setErrors({
        email: emailValidation.ok ? undefined : emailValidation.errors.email,
        password: password.trim() ? undefined : "请填写密码"
      });
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/auth/password/login", {
        body: JSON.stringify({
          email: emailValidation.value,
          password
        }),
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        method: "POST"
      });
      const result = await parseApiResponse(response) as LoginApiResult;

      if (!result.ok) {
        setErrors({
          email: result.errors.email,
          password: result.errors.password
        });
        setFormMessage(result.errors.request ?? "邮箱或密码不正确");
        return;
      }

      notifyAuthSessionAuthenticated();
      router.push(sanitizeNextPath(searchParams.get("next")));
      router.refresh();
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function submitPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");

    const emailValidation = validateEmailAddress(email);
    const codeValidation = validateEmailCode(code);

    if (!emailValidation.ok || !codeValidation.ok || !password || !passwordConfirm) {
      setErrors({
        code: codeValidation.ok ? undefined : codeValidation.errors.code,
        email: emailValidation.ok ? undefined : emailValidation.errors.email,
        password: password ? undefined : "请填写新密码",
        passwordConfirm: passwordConfirm ? undefined : "请再次输入新密码"
      });
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/auth/password/reset", {
        body: JSON.stringify({
          code: codeValidation.value,
          email: emailValidation.value,
          password,
          passwordConfirm
        }),
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        method: "POST"
      });
      const result = await parseApiResponse(response) as PasswordActionResult;

      if (!result.ok) {
        setErrors({
          code: result.errors.code,
          email: result.errors.email,
          password: result.errors.password,
          passwordConfirm: result.errors.passwordConfirm
        });
        setFormMessage(result.errors.request ?? "重置密码失败，请稍后再试。");
        return;
      }

      setMode("password");
      setCode("");
      setPassword("");
      setPasswordConfirm("");
      setFormMessage("密码已重置，可以使用邮箱和新密码登录。");
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <div className="auth-form-shell">
      <div className="auth-form-heading">
        <h2>
          {mode === "code"
            ? "邮箱验证码登录 / 注册"
            : mode === "password"
              ? "邮箱密码登录"
              : "重置邮箱密码"}
        </h2>
      </div>

      {mode === "code" ? <form className="form" onSubmit={submitLogin}>
        <div className="field">
          <label htmlFor="email">邮箱</label>
          <div className="auth-input-shell">
            <span
              aria-hidden="true"
              className="auth-input-icon"
              style={{ backgroundImage: 'url("/assets/sitewide-ui/login-email-icon.png")' }}
            />
            <input
              id="email"
              inputMode="email"
              name="email"
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((current) => ({ ...current, email: undefined }));
              }}
              placeholder="请输入邮箱"
              value={email}
            />
          </div>
          <span className="error">{errors.email}</span>
        </div>
        <div className="auth-code-field">
          <div className="field">
            <label htmlFor="code">验证码</label>
            <div className="auth-input-shell">
              <span
                aria-hidden="true"
                className="auth-input-icon"
                style={{ backgroundImage: 'url("/assets/sitewide-ui/login-code-icon.png")' }}
              />
              <input
                id="code"
                inputMode="numeric"
                name="code"
                onChange={(event) => {
                  setCode(event.target.value);
                  setErrors((current) => ({ ...current, code: undefined }));
                }}
                placeholder="请输入验证码"
                value={code}
              />
            </div>
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
        </div>
        <button className="button primary" type="submit">
          {isLoggingIn ? "登录中..." : "登录 / 注册"}
        </button>
        <button
          className="auth-mode-link"
          onClick={() => {
            setMode("password");
            setFormMessage("");
            setErrors({});
          }}
          type="button"
        >
          设置密码后，也可以使用邮箱和密码登录
        </button>
      </form> : null}

      {mode === "password" ? (
        <form className="form" onSubmit={submitPasswordLogin}>
          <div className="field">
            <label htmlFor="password-email">邮箱</label>
            <input
              id="password-email"
              inputMode="email"
              name="email"
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((current) => ({ ...current, email: undefined }));
              }}
              placeholder="请输入邮箱地址"
              value={email}
            />
            <span className="error">{errors.email}</span>
          </div>
          <div className="field">
            <label htmlFor="password-login">密码</label>
            <input
              id="password-login"
              name="password"
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({ ...current, password: undefined }));
              }}
              placeholder="请输入密码"
              type="password"
              value={password}
            />
            <span className="error">{errors.password}</span>
          </div>
          <button className="button primary" type="submit">
            {isLoggingIn ? "登录中..." : "邮箱密码登录"}
          </button>
          <div className="auth-mode-links">
            <button
              className="auth-mode-link"
              onClick={() => {
                setMode("code");
                setFormMessage("");
                setErrors({});
              }}
              type="button"
            >
              使用邮箱验证码登录 / 注册
            </button>
            <button
              className="auth-mode-link"
              onClick={() => {
                setMode("reset");
                setFormMessage("");
                setErrors({});
              }}
              type="button"
            >
              忘记密码
            </button>
          </div>
        </form>
      ) : null}

      {mode === "reset" ? (
        <form className="form" onSubmit={submitPasswordReset}>
          <div className="field">
            <label htmlFor="reset-email">邮箱</label>
            <input
              id="reset-email"
              inputMode="email"
              name="email"
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((current) => ({ ...current, email: undefined }));
              }}
              placeholder="请输入邮箱地址"
              value={email}
            />
            <span className="error">{errors.email}</span>
          </div>
          <div className="field">
            <label htmlFor="reset-code">邮箱验证码</label>
            <input
              id="reset-code"
              inputMode="numeric"
              name="code"
              onChange={(event) => {
                setCode(event.target.value);
                setErrors((current) => ({ ...current, code: undefined }));
              }}
              placeholder="请输入邮箱验证码"
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
          <div className="field">
            <label htmlFor="reset-password">新密码</label>
            <input
              id="reset-password"
              name="password"
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({ ...current, password: undefined }));
              }}
              placeholder="至少 8 位，包含字母和数字"
              type="password"
              value={password}
            />
            <span className="field-hint">请不要使用邮箱验证码、手机号、生日或过于简单的密码。</span>
            <span className="error">{errors.password}</span>
          </div>
          <div className="field">
            <label htmlFor="reset-password-confirm">确认新密码</label>
            <input
              id="reset-password-confirm"
              name="passwordConfirm"
              onChange={(event) => {
                setPasswordConfirm(event.target.value);
                setErrors((current) => ({ ...current, passwordConfirm: undefined }));
              }}
              placeholder="请再次输入新密码"
              type="password"
              value={passwordConfirm}
            />
            <span className="error">{errors.passwordConfirm}</span>
          </div>
          <button className="button primary" type="submit">
            {isLoggingIn ? "重置中..." : "重置密码"}
          </button>
          <button
            className="auth-mode-link"
            onClick={() => {
              setMode("password");
              setFormMessage("");
              setErrors({});
            }}
            type="button"
          >
            返回邮箱密码登录
          </button>
        </form>
      ) : null}

      {formMessage ? <p className="error auth-message">{formMessage}</p> : null}
    </div>
  );
}
