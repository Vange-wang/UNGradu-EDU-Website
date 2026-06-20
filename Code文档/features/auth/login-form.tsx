"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  createTestSession,
  isTestLoginAllowed,
  validateTestLoginInput
} from "@/features/auth/test-auth";
import { getBrowserStorage } from "@/lib/storage";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<{ code?: string; phone?: string }>({});
  const [formMessage, setFormMessage] = useState("");
  const allowTestLogin = useMemo(
    () =>
      isTestLoginAllowed({
        allowTestLogin: process.env.NEXT_PUBLIC_ALLOW_TEST_LOGIN,
        nodeEnv: process.env.NODE_ENV
      }),
    []
  );

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");

    if (!allowTestLogin) {
      setFormMessage("当前环境未开启临时测试登录，请接入正式短信登录。");
      return;
    }

    const result = validateTestLoginInput({ phone, code });

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    const storage = getBrowserStorage();

    if (!storage) {
      setFormMessage("当前浏览器无法写入测试登录态。");
      return;
    }

    createTestSession({ phone: result.value.phone }, storage);
    router.push(searchParams.get("next") ?? "/");
  }

  return (
    <>
      <form className="form" onSubmit={submitLogin}>
        <div className="field">
          <label htmlFor="phone">手机号</label>
          <input
            id="phone"
            inputMode="tel"
            name="phone"
            onChange={(event) => {
              setPhone(event.target.value);
              setErrors((current) => ({ ...current, phone: undefined }));
            }}
            placeholder="请输入手机号"
            value={phone}
          />
          <span className="error">{errors.phone}</span>
        </div>
        <div className="field">
          <label htmlFor="code">验证码</label>
          <input
            id="code"
            inputMode="numeric"
            name="code"
            onChange={(event) => {
              setCode(event.target.value);
              setErrors((current) => ({ ...current, code: undefined }));
            }}
            placeholder={allowTestLogin ? "本地测试验证码 000000" : "请输入验证码"}
            value={code}
          />
          <span className="error">{errors.code}</span>
        </div>
        <button className="button primary" type="submit">
          登录并进入主页面
        </button>
      </form>

      {formMessage ? <p className="error">{formMessage}</p> : null}
    </>
  );
}
