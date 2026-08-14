"use client";

import { FormEvent, useState } from "react";

import { fetchWithCsrf, parseApiResponse, type ApiResult } from "@/features/api/api-client";

type PasswordSettingsFormProps = {
  emailMasked?: string;
};

type PasswordActionResult = ApiResult<{
  passwordUpdatedAt: string;
}>;

export function PasswordSettingsForm({ emailMasked }: PasswordSettingsFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    passwordConfirm?: string;
    request?: string;
  }>({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setMessage("");

    if (!email.trim() || !password || !passwordConfirm) {
      setErrors({
        email: email.trim() ? undefined : "请填写当前登录邮箱",
        password: password ? undefined : "请填写密码",
        passwordConfirm: passwordConfirm ? undefined : "请再次输入密码"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetchWithCsrf(fetch, "/api/auth/password/set", {
        body: JSON.stringify({ email, password, passwordConfirm }),
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        method: "POST"
      });
      const result = await parseApiResponse(response) as PasswordActionResult;

      if (!result.ok) {
        setErrors({
          email: result.errors.email,
          password: result.errors.password,
          passwordConfirm: result.errors.passwordConfirm,
          request: result.errors.request
        });
        return;
      }

      setPassword("");
      setPasswordConfirm("");
      setMessage("密码已设置。下次可使用邮箱和密码登录。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form embedded-form" onSubmit={submitPassword}>
      <h2>设置登录密码</h2>
      <p>
        当前账号{emailMasked ? `（${emailMasked}）` : ""}可设置密码。为保护账号，请不要使用邮箱验证码、手机号、生日或过于简单的密码。
      </p>
      <div className="field">
        <label htmlFor="settings-email">当前登录邮箱</label>
        <input
          id="settings-email"
          inputMode="email"
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((current) => ({ ...current, email: undefined }));
          }}
          placeholder="请输入当前登录邮箱"
          value={email}
        />
        <span className="error">{errors.email}</span>
      </div>
      <div className="field">
        <label htmlFor="settings-password">密码</label>
        <input
          id="settings-password"
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: undefined }));
          }}
          placeholder="至少 8 位，包含字母和数字"
          type="password"
          value={password}
        />
        <span className="error">{errors.password}</span>
      </div>
      <div className="field">
        <label htmlFor="settings-password-confirm">确认密码</label>
        <input
          id="settings-password-confirm"
          onChange={(event) => {
            setPasswordConfirm(event.target.value);
            setErrors((current) => ({ ...current, passwordConfirm: undefined }));
          }}
          placeholder="请再次输入密码"
          type="password"
          value={passwordConfirm}
        />
        <span className="error">{errors.passwordConfirm}</span>
      </div>
      {errors.request ? <p className="error">{errors.request}</p> : null}
      {message ? <p className="success">{message}</p> : null}
      <button className="button primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? "保存中..." : "保存密码"}
      </button>
    </form>
  );
}
