export type RateLimitWindow = {
  limit: number;
  windowMs: number;
};

export type LayeredRateLimitConfig = {
  account: RateLimitWindow;
  action: RateLimitWindow;
  device: RateLimitWindow;
  ip: RateLimitWindow;
  session?: RateLimitWindow;
};

export type ExternalRateLimiter = {
  check: (input: RateLimitInput) => { ok: true } | { ok: false; reason: string };
};

const DEFAULT_CONFIG: LayeredRateLimitConfig = {
  account: { limit: 3, windowMs: 15 * 60_000 },
  action: { limit: 5, windowMs: 15 * 60_000 },
  device: { limit: 5, windowMs: 15 * 60_000 },
  ip: { limit: 10, windowMs: 15 * 60_000 },
  session: { limit: 5, windowMs: 15 * 60_000 }
};

type RateLimitInput = {
  accountKey: string;
  actionKey: string;
  deviceKey: string;
  ipKey: string;
  sessionKey?: string;
};

export function createLayeredRateLimiter({
  config = DEFAULT_CONFIG,
  now = () => Date.now(),
  mode = "local",
  external
}: {
  config?: Partial<LayeredRateLimitConfig>;
  external?: ExternalRateLimiter;
  mode?: "local" | "production";
  now?: () => number;
} = {}) {
  if (mode === "production" && !external) {
    throw new Error("RATE_LIMITER_UNAVAILABLE");
  }
  const resolved: LayeredRateLimitConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };
  const counters = new Map<string, number[]>();

  function checkLayer(layer: keyof LayeredRateLimitConfig, key: string) {
    if (!key && layer === "session") return { ok: true as const };
    if (!key) return { ok: false as const, reason: layer };
    const rule = resolved[layer];
    if (!rule) return { ok: true as const };

    const current = now();
    const counterKey = `${layer}:${key}`;
    const retained = (counters.get(counterKey) ?? []).filter(
      (timestamp) => current - timestamp < rule.windowMs
    );

    if (retained.length >= rule.limit) {
      counters.set(counterKey, retained);
      return { ok: false as const, reason: layer };
    }

    retained.push(current);
    counters.set(counterKey, retained);
    return { ok: true as const };
  }

  return {
    mode,
    external: Boolean(external),
    check(input: RateLimitInput) {
      if (external) return external.check(input);
      const layers: Array<[keyof LayeredRateLimitConfig, string | undefined]> = [
        ["account", input.accountKey],
        ["ip", input.ipKey],
        ["device", input.deviceKey],
        ["action", input.actionKey],
        ["session", input.sessionKey]
      ];

      for (const [layer, key] of layers) {
        const result = checkLayer(layer, key ?? "");
        if (!result.ok) return result;
      }

      return { ok: true as const };
    },
    reset() {
      counters.clear();
    }
  };
}

/**
 * Route-level production seam used until a durable limiter is configured.
 * It is intentionally unavailable rather than falling back to the in-process
 * counter implementation.
 */
export function createFailClosedProductionRateLimiter() {
  return createLayeredRateLimiter({
    mode: "production",
    external: {
      check() {
        return { ok: false as const, reason: "unavailable" };
      }
    }
  });
}

export function createRouteRateLimiter(env: { APP_ENV?: string; NODE_ENV?: string }) {
  return env.APP_ENV === "production" || env.NODE_ENV === "production"
    ? createFailClosedProductionRateLimiter()
    : createLayeredRateLimiter({ mode: "local" });
}
