"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { RequireTestSession } from "@/features/auth/require-test-session";
import {
  type ContactProfileInput,
  validateContactProfileInput
} from "@/features/profile/contact-profile";
import {
  readContactProfileFromApi,
  saveContactProfileToApi
} from "@/features/profile/contact-profile-api-client";
import { saveContactProfile } from "@/features/profile/contact-profile-storage";
import { getBrowserStorage } from "@/lib/storage";

function ContactProfileForm({ ownerPhone }: { ownerPhone: string }) {
  const [input, setInput] = useState<ContactProfileInput>({
    phone: "",
    wechat: ""
  });
  const [phoneError, setPhoneError] = useState("");
  const [saved, setSaved] = useState(false);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    let ignoreResult = false;

    readContactProfileFromApi({ currentUserPhone: ownerPhone })
      .then((result) => {
        if (ignoreResult) {
          return;
        }

        if (result.ok) {
          setInput(result.value);
          setRequestError("");
        } else {
          setRequestError(result.errors.request ?? "读取联系方式失败。");
        }
      })
      .catch(() => {
        if (!ignoreResult) {
          setRequestError("读取联系方式失败。");
        }
      });

    return () => {
      ignoreResult = true;
    };
  }, [ownerPhone]);

  function updateField(field: keyof ContactProfileInput, value: string) {
    setInput((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setRequestError("");
    if (field === "phone") {
      setPhoneError("");
    }
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateContactProfileInput(input);

    if (!result.ok) {
      setPhoneError(result.errors.phone ?? "");
      return;
    }

    const savedProfile = await saveContactProfileToApi({
      currentUserPhone: ownerPhone,
      input: result.value
    });

    if (!savedProfile.ok) {
      setPhoneError(savedProfile.errors.phone ?? "");
      setRequestError(savedProfile.errors.request ?? "");
      setSaved(false);
      return;
    }

    setInput(savedProfile.value);
    const storage = getBrowserStorage();
    if (storage) {
      saveContactProfile({ input: savedProfile.value, ownerPhone, storage });
    }
    setPhoneError("");
    setRequestError("");
    setSaved(true);
  }

  return (
    <section className="wide-panel">
      <div className="workspace-header">
        <div>
          <span className="eyebrow">个人资料管理</span>
          <h1 className="section-title">联系方式管理</h1>
          <p>存档联系方式默认不公开，只在双方授权并二次确认后展示。</p>
        </div>
        <Link className="button secondary" href="/profile">
          返回个人中心
        </Link>
      </div>

      <div className="profile-workspace">
        <aside className="profile-side-note">
          <span className="eyebrow">隐私边界</span>
          <h2>未授权前不展示</h2>
          <p>这里保存的手机号和微信号仅用于联系方式交换流程，不会直接出现在公开页面。</p>
        </aside>

        <section className="profile-panel">
          <form className="form" onSubmit={submitForm}>
            <div className="field">
              <label htmlFor="contact-phone">手机号</label>
              <input
                id="contact-phone"
                inputMode="tel"
                name="phone"
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="请输入用于交换的手机号"
                value={input.phone}
              />
              <span className="error">{phoneError}</span>
            </div>

            <div className="field">
              <label htmlFor="contact-wechat">微信号</label>
              <input
                id="contact-wechat"
                name="wechat"
                onChange={(event) => updateField("wechat", event.target.value)}
                placeholder="选填"
                value={input.wechat}
              />
            </div>

            <button className="button primary" type="submit">
              保存联系方式
            </button>
          </form>

          {requestError ? <p className="error">{requestError}</p> : null}
          {saved ? <p className="success">联系方式已保存。</p> : null}
        </section>
      </div>
    </section>
  );
}

export default function ContactProfilePage() {
  return (
    <div className="page dplus-profile-page">
      <RequireTestSession>
        {(session) => <ContactProfileForm ownerPhone={session.userId ?? session.phone ?? ""} />}
      </RequireTestSession>
    </div>
  );
}
