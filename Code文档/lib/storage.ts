export type KeyValueStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export function getBrowserStorage(): KeyValueStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}
