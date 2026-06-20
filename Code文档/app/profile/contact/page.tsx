"use client";

import { FormEvent, useEffect, useState } from "react";

import { RequireTestSession } from "@/features/auth/require-test-session";
import {
  type ContactProfileInput,
  validateContactProfileInput
} from "@/features/profile/contact-profile";
import {
  readContactProfile,
  saveContactProfile
} from "@/features/profile/contact-profile-storage";
import { getBrowserStorage } from "@/lib/storage";

function ContactProfileForm({ ownerPhone }: { ownerPhone: string }) {
  const [input, setInput] = useState<ContactProfileInput>({
    phone: "",
    wechat: ""
  });
  const [phoneError, setPhoneError] = useState("");
  const [saved, setSaved] = useState(false);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    const storage = getBrowserStorage();
    const storedProfile = storage
      ? readContactProfile({ ownerPhone, storage })
      : null;

    if (storedProfile) {
      setInput(storedProfile);
    }
  }, [ownerPhone]);

  function updateField(field: keyof ContactProfileInput, value: string) {
    setInput((current) => ({ ...current, [field]: value }));
    setSaved(false);
    if (field === "phone") {
      setPhoneError("");
    }
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateContactProfileInput(input);
    const storage = getBrowserStorage();

    if (!result.ok) {
      setPhoneError(result.errors.phone ?? "");
      return;
    }

    if (!storage) {
      setStorageError("当前浏览器无法保存联系方式。");
      return;
    }

    const savedProfile = saveContactProfile({
      input: result.value,
      ownerPhone,
      storage
    });

    if (!savedProfile.ok) {
      setPhoneError(savedProfile.errors.phone ?? "");
      return;
    }

    setInput(savedProfile.value);
    setPhoneError("");
    setStorageError("");
    setSaved(true);
  }

  return (
    <section className="content-panel">
      <h1 className="section-title">联系方式管理</h1>
      <p>当前测试账号：{ownerPhone}。存档联系方式默认不公开，只在双方授权并二次确认后展示。</p>

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

      {storageError ? <p className="error">{storageError}</p> : null}
      {saved ? <p className="success">联系方式已保存到当前测试账号的本地存储。</p> : null}
    </section>
  );
}

export default function ContactProfilePage() {
  return (
    <div className="page">
      <RequireTestSession>
        {(session) => <ContactProfileForm ownerPhone={session.phone} />}
      </RequireTestSession>
    </div>
  );
}
