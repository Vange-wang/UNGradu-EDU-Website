type RuntimeEnvironment = Readonly<Record<string, string | undefined>>;

const TURNSTILE_SITE_KEY_ENV_NAME = "NEXT_PUBLIC_TURNSTILE_SITE_KEY";

export function readRuntimeTurnstileSiteKey(
  env: RuntimeEnvironment = process.env
) {
  return env[TURNSTILE_SITE_KEY_ENV_NAME]?.trim() ?? "";
}
