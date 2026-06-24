"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { parseApiResponse, type ApiResult } from "@/features/api/api-client";
import {
  isTestLoginAllowed,
  sanitizeNextPath,
  validateTestLoginInput
} from "@/features/auth/test-auth";

type LoginApiResult = ApiResult<{ phone: string; createdAt: string }>;

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

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");

    if (!allowTestLogin) {
      setFormMessage("Temporary test login is disabled in this environment.");
      return;
    }

    const validation = validateTestLoginInput({ phone, code });

    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }

    const response = await fetch("/api/auth/test-login", {
      body: JSON.stringify(validation.value),
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
      setFormMessage(result.errors.request ?? "Login failed.");
      return;
    }

    router.push(sanitizeNextPath(searchParams.get("next")));
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
            placeholder="Enter phone number"
            value={phone}
          />
          <span className="error">{errors.phone}</span>
        </div>
        <div className="field">
          <label htmlFor="code">Code</label>
          <input
            id="code"
            inputMode="numeric"
            name="code"
            onChange={(event) => {
              setCode(event.target.value);
              setErrors((current) => ({ ...current, code: undefined }));
            }}
            placeholder={allowTestLogin ? "Local test code: 000000" : "Enter code"}
            value={code}
          />
          <span className="error">{errors.code}</span>
        </div>
        <button className="button primary" type="submit">
          Login
        </button>
      </form>

      {formMessage ? <p className="error">{formMessage}</p> : null}
    </>
  );
}
