"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileRenderOptions = {
  action: "email_send_code" | "password_login";
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
  action = "password_login",
  onTokenChange,
  retryCooldownMs = 0,
  resetSignal = 0,
  siteKey
}: {
  action?: "email_send_code" | "password_login";
  onTokenChange: (token: string) => void;
  retryCooldownMs?: number;
  resetSignal?: number;
  siteKey: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resetSignalRef = useRef(resetSignal);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptAttempt, setScriptAttempt] = useState(0);
  const [scriptReady, setScriptReady] = useState(false);
  const [retryBlocked, setRetryBlocked] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "verified" | "error">(
    siteKey ? "loading" : "error"
  );

  useEffect(() => {
    if (window.turnstile) setScriptReady(true);
  }, []);

  const beginRetryCooldown = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (retryCooldownMs <= 0) {
      setRetryBlocked(false);
      return;
    }
    setRetryBlocked(true);
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      setRetryBlocked(false);
    }, retryCooldownMs);
  }, [retryCooldownMs]);
  const clearToken = useCallback(() => {
    onTokenChange("");
    setStatus("error");
    beginRetryCooldown();
  }, [beginRetryCooldown, onTokenChange]);
  const retry = useCallback(() => {
    if (retryBlocked) return;
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
  }, [onTokenChange, retryBlocked]);

  useEffect(() => () => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }, []);

  useEffect(() => {
    if (resetSignalRef.current === resetSignal) return;
    resetSignalRef.current = resetSignal;
    onTokenChange("");
    const widgetId = widgetIdRef.current;
    if (widgetId && window.turnstile?.reset) {
      window.turnstile.reset(widgetId);
      setStatus("ready");
      return;
    }
    retry();
  }, [onTokenChange, resetSignal, retry]);

  useEffect(() => {
    const container = containerRef.current;
    const turnstile = window.turnstile;
    if (!siteKey || !scriptReady || !container || !turnstile || widgetIdRef.current) {
      return;
    }

    setStatus("ready");
    widgetIdRef.current = turnstile.render(container, {
      action,
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
  }, [action, clearToken, onTokenChange, scriptReady, siteKey]);

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
          <button disabled={retryBlocked} onClick={retry} type="button">
            重新进行人机验证
          </button>
        </span>
      ) : null}
    </div>
  );
}
