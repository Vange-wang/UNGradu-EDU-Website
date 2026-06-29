export const AUTH_SESSION_CHANGED_EVENT = "auth-session-changed";

export type AuthSessionStatus = "anonymous" | "authenticated" | "unknown";

export type AuthSessionChangedEvent = Event & {
  detail: {
    status: AuthSessionStatus;
  };
};

type AuthSessionEventTarget = Pick<
  EventTarget,
  "addEventListener" | "dispatchEvent" | "removeEventListener"
>;

function readDefaultTarget() {
  return typeof window === "undefined" ? null : window;
}

export function notifyAuthSessionChanged(
  status: AuthSessionStatus = "unknown",
  target: AuthSessionEventTarget | null = readDefaultTarget()
) {
  if (!target) {
    return;
  }

  const event = new Event(AUTH_SESSION_CHANGED_EVENT) as AuthSessionChangedEvent;
  Object.defineProperty(event, "detail", {
    value: { status }
  });

  target.dispatchEvent(event);
}

export function notifyAuthSessionAuthenticated(
  target: AuthSessionEventTarget | null = readDefaultTarget()
) {
  notifyAuthSessionChanged("authenticated", target);
}

export function notifyAuthSessionAnonymous(
  target: AuthSessionEventTarget | null = readDefaultTarget()
) {
  notifyAuthSessionChanged("anonymous", target);
}

export function subscribeAuthSessionChanged(
  listener: (event: AuthSessionChangedEvent) => void,
  target: AuthSessionEventTarget | null = readDefaultTarget()
) {
  if (!target) {
    return () => {};
  }

  const eventListener: EventListener = (event) => {
    listener(event as AuthSessionChangedEvent);
  };

  target.addEventListener(AUTH_SESSION_CHANGED_EVENT, eventListener);

  return () => {
    target.removeEventListener(AUTH_SESSION_CHANGED_EVENT, eventListener);
  };
}
