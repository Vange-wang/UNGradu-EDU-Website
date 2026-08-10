const REQUIRED_PRODUCTION_VARIABLES = [
  "APP_ENV",
  "ALLOWED_ORIGINS",
  "AUTH_SESSION_SECRET",
  "AUTH_SESSION_KEY_VERSION",
  "AUTH_SESSION_REVOCATION_REQUIRED",
  "CLOUDBASE_ENV_ID",
  "CSRF_SECRET",
  "EMAIL_CODE_SECRET",
  "EMAIL_FROM",
  "EMAIL_PROVIDER",
  "SMTP_HOST",
  "SMTP_PASS",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "ORIGIN_OLD_SECRET_EXPOSURE",
  "ORIGIN_ROTATION_STRATEGY",
  "ORIGIN_VERIFY_MODE",
  "ORIGIN_VERIFY_SECRET",
  "TENCENTCLOUD_SECRETID",
  "TENCENTCLOUD_SECRETKEY"
];

const FORBIDDEN_TEST_SWITCHES = [
  "M5_ENABLE_HOSTED_TEST_LOGIN",
  "NEXT_PUBLIC_ALLOW_TEST_LOGIN"
];

function isTruthy(value) {
  return String(value ?? "").trim().toLowerCase() === "true";
}

function isTestLoginAllowed({
  allowHostedTestLogin,
  allowTestLogin,
  appEnv,
  nodeEnv
}) {
  if (appEnv === "production") {
    return false;
  }

  if (nodeEnv === "production") {
    return appEnv === "test" && allowHostedTestLogin === "true";
  }

  return nodeEnv === "development" || allowTestLogin === "true";
}

function requireVariable(env, name, failures) {
  const value = String(env[name] ?? "").trim();

  if (!value) {
    failures.push(`${name} is required.`);
  }
}

function parseRotationPhase(args = process.argv.slice(2)) {
  const phaseIndex = args.indexOf("--phase");
  if (phaseIndex === -1) return "final";

  const phase = String(args[phaseIndex + 1] ?? "").trim().toLowerCase();
  return phase === "transition" || phase === "final" ? phase : null;
}

function validateOriginRotationContract(env, failures, phase = "final") {
  const exposure = String(env.ORIGIN_OLD_SECRET_EXPOSURE ?? "").trim().toLowerCase();
  const strategy = String(env.ORIGIN_ROTATION_STRATEGY ?? "").trim().toLowerCase();
  const previousSecret = String(env.ORIGIN_VERIFY_SECRET_PREVIOUS ?? "").trim();

  if (exposure !== "exposed" && exposure !== "not-exposed") {
    failures.push("ORIGIN_OLD_SECRET_EXPOSURE must be exposed or not-exposed.");
  }

  if (strategy !== "hard-cut" && strategy !== "overlap") {
    failures.push("ORIGIN_ROTATION_STRATEGY must be hard-cut or overlap.");
  }

  if (exposure === "exposed" && strategy !== "hard-cut") {
    failures.push("An exposed old origin secret requires the hard-cut rotation strategy.");
  }

  if (exposure === "not-exposed" && strategy !== "overlap") {
    failures.push("A not-exposed old origin secret requires the overlap rotation strategy.");
  }

  if (phase === "transition") {
    if (exposure === "exposed" && previousSecret) {
      failures.push("Exposed origin rotation must not configure ORIGIN_VERIFY_SECRET_PREVIOUS.");
    }
    if (exposure === "not-exposed" && !previousSecret) {
      failures.push("Not-exposed overlap transition requires a temporary previous origin secret.");
    }
  }

  if (phase === "final" && previousSecret) {
    failures.push("ORIGIN_VERIFY_SECRET_PREVIOUS must be removed before final production readiness.");
  }
}

function validateProductionSecuritySettings(env, failures, phase = "final") {
  if (String(env.ORIGIN_VERIFY_MODE ?? "").trim().toLowerCase() !== "enforce") {
    failures.push("ORIGIN_VERIFY_MODE must be enforce in final production readiness.");
  }

  if (String(env.AUTH_SESSION_REVOCATION_REQUIRED ?? "").trim().toLowerCase() !== "true") {
    failures.push("AUTH_SESSION_REVOCATION_REQUIRED must be true in production.");
  }

  validateOriginRotationContract(env, failures, phase);

  const revokedAt = String(env.AUTH_SESSION_REVOKED_AT ?? "").trim();
  if (revokedAt) {
    const parsed = new Date(revokedAt);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== revokedAt || parsed.getTime() > Date.now()) {
      failures.push("AUTH_SESSION_REVOKED_AT must be a canonical ISO timestamp when supplied.");
    }
  }
}

function assertProductionPreflight(env, { phase = "final" } = {}) {
  const failures = [];
  const warnings = [];

  if (phase !== "final" && phase !== "transition") {
    failures.push("origin rotation phase must be final or transition.");
  }

  for (const name of REQUIRED_PRODUCTION_VARIABLES) {
    requireVariable(env, name, failures);
  }

  if (String(env.EMAIL_PROVIDER ?? "").trim() !== "smtp") {
    failures.push("EMAIL_PROVIDER must be smtp in production.");
  }

  if (env.APP_ENV !== "production") {
    failures.push("APP_ENV must be production.");
  }

  validateProductionSecuritySettings(env, failures, phase);

  for (const name of FORBIDDEN_TEST_SWITCHES) {
    if (isTruthy(env[name])) {
      warnings.push(`${name}=true must be removed from real production configuration.`);
    }
  }

  const serverTestLoginAllowed = isTestLoginAllowed({
    allowHostedTestLogin: env.M5_ENABLE_HOSTED_TEST_LOGIN,
    allowTestLogin: env.NEXT_PUBLIC_ALLOW_TEST_LOGIN,
    appEnv: env.APP_ENV,
    nodeEnv: "production"
  });

  if (serverTestLoginAllowed) {
    failures.push("/api/auth/test-login would be allowed in production.");
  }

  const temporaryHeaderAllowed = isTestLoginAllowed({
    allowHostedTestLogin: env.M5_ENABLE_HOSTED_TEST_LOGIN,
    allowTestLogin: env.NEXT_PUBLIC_ALLOW_TEST_LOGIN,
    appEnv: env.APP_ENV,
    nodeEnv: "production"
  });

  if (temporaryHeaderAllowed) {
    failures.push("x-ungradu-test-user-phone would be accepted in production.");
  }

  const frontendTestEntryAllowed = isTestLoginAllowed({
    allowTestLogin: env.NEXT_PUBLIC_ALLOW_TEST_LOGIN,
    nodeEnv: "production"
  });

  if (frontendTestEntryAllowed) {
    failures.push("front-end test login entry would be visible in production.");
  }

  return {
    failures,
    warnings
  };
}

function main() {
  const phase = parseRotationPhase();
  const result = assertProductionPreflight(process.env, { phase });

  console.log(phase === "transition" ? "origin rotation transition preflight" : "release production preflight");
  console.log("- required production variables checked without printing values");

  if (result.warnings.length > 0) {
    for (const warning of result.warnings) {
      console.log(`- warning: ${warning}`);
    }
  }

  if (result.failures.length > 0) {
    for (const failure of result.failures) {
      console.error(`- failed: ${failure}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log("- temporary test login rejected in production");
  console.log("- x-ungradu-test-user-phone rejected in production");
  console.log("- front-end test login entry hidden in production");
  if (phase === "transition") {
    console.log("origin rotation transition preflight passed");
  } else {
    console.log("release production preflight passed");
  }
}

main();
