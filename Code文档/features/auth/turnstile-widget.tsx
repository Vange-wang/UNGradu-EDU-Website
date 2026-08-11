"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileRenderOptions = {
  action: "password_login";
  callback: (token: string) => void;
  "error-callback": () => boolean;
  "expired-callback": () => void;
  sitekey: string;
};

declare global {
  interface Window {
    turnstile?: {
      remove?: (widgetId: string) => void;
      reset?: (widgetId: string) => void;
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
    };
  }
}

export function TurnstileWidget({
  onTokenChange,
  siteKey
}: {
  onTokenChange: (token: string) => void;
  siteKey: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptAttempt, setScriptAttempt] = useState(0);
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "verified" | "error">(
    siteKey ? "loading" : "error"
  );

  const clearToken = useCallback(() => {
    onTokenChange("");
    setStatus("error");
  }, [onTokenChange]);
  const retry = useCallback(() => {
    onTokenChange("");
    const widgetId = widgetIdRef.current;
    if (widgetId && window.turnstile?.reset) {
      window.turnstile.reset(widgetId);
      setStatus("ready");
      return;
    }

    if (widgetId) {
      window.turnstile?.remove?.(widgetId);
      widgetIdRef.current = null;
    }
    setScriptReady(false);
    setStatus("loading");
    setScriptAttempt((current) => current + 1);
  }, [onTokenChange]);

  useEffect(() => {
    const container = containerRef.current;
    const turnstile = window.turnstile;
    if (!siteKey || !scriptReady || !container || !turnstile || widgetIdRef.current) {
      return;
    }

    setStatus("ready");
    widgetIdRef.current = turnstile.render(container, {
      action: "password_login",
      callback(token) {
        const normalizedToken = token.trim();
        if (!normalizedToken) {
          clearToken();
          return;
        }
        onTokenChange(normalizedToken);
        setStatus("verified");
      },
      "error-callback"() {
        clearToken();
        return true;
      },
      "expired-callback"() {
        clearToken();
      },
      sitekey: siteKey
    });
    return () => {
      onTokenChange("");
      const widgetId = widgetIdRef.current;
      if (widgetId) {
        window.turnstile?.remove?.(widgetId);
        widgetIdRef.current = null;
      }
    };
  }, [clearToken, onTokenChange, scriptReady, siteKey]);

  if (!siteKey) {
    return <p className="error" role="alert">人机验证服务暂不可用，请稍后重试。</p>;
  }

  return (
    <div className="field" data-turnstile-state={status}>
      <Script
        key={scriptAttempt}
        onError={(event) => {
          event.currentTarget.remove();
          setScriptReady(false);
          clearToken();
        }}
        onReady={() => setScriptReady(true)}
        src={scriptAttempt === 0
          ? TURNSTILE_SCRIPT_SRC
          : `${TURNSTILE_SCRIPT_SRC}&retry=${scriptAttempt}`}
        strategy="afterInteractive"
      />
      <div aria-label="人机验证" ref={containerRef} />
      {status === "loading" ? <span className="field-hint">正在加载人机验证…</span> : null}
      {status === "error" ? (
        <span aria-live="assertive" className="error" role="alert">
          人机验证已失效，请重试。
          <button onClick={retry} type="button">重新进行人机验证</button>
        </span>
      ) : null}
    </div>
  );
}
