const REQUIRED_PRODUCTION_VARIABLES = [
  "APP_ENV",
  "AUTH_SESSION_SECRET",
  "CLOUDBASE_ENV_ID",
  "EMAIL_CODE_SECRET",
  "EMAIL_FROM",
  "EMAIL_PROVIDER",
  "SMTP_HOST",
  "SMTP_PASS",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
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

function assertProductionPreflight(env) {
  const failures = [];
  const warnings = [];

  for (const name of REQUIRED_PRODUCTION_VARIABLES) {
    requireVariable(env, name, failures);
  }

  if (String(env.EMAIL_PROVIDER ?? "").trim() !== "smtp") {
    failures.push("EMAIL_PROVIDER must be smtp in production.");
  }

  if (env.APP_ENV !== "production") {
    failures.push("APP_ENV must be production.");
  }

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
  const result = assertProductionPreflight(process.env);

  console.log("release production preflight");
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
  console.log("release production preflight passed");
}

main();
