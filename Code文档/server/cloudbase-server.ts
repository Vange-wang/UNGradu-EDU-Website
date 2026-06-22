import tcb from "@cloudbase/node-sdk";

type CloudBaseServerEnv = {
  [key: string]: string | undefined;
  CLOUDBASE_ENV_ID?: string;
  TENCENTCLOUD_SECRETID?: string;
  TENCENTCLOUD_SECRETKEY?: string;
  APP_ENV?: string;
};

export type CloudBaseServerConfig = {
  env: string;
  secretId: string;
  secretKey: string;
  appEnv: string;
};

type CloudBaseInitOptions = {
  env: string;
  secretId: string;
  secretKey: string;
};

type CloudBaseInitializer<TApp> = (options: CloudBaseInitOptions) => TApp;

function readRequiredEnvValue(
  env: CloudBaseServerEnv,
  key: keyof CloudBaseServerEnv,
  label: string
) {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(`${label} 必须配置`);
  }

  return value;
}

function isPlaceholderSecret(value: string) {
  return value.includes("你的") || value.toLowerCase().includes("secretid") ||
    value.toLowerCase().includes("secretkey");
}

export function parseCloudBaseServerEnv(
  env: CloudBaseServerEnv = process.env
): CloudBaseServerConfig {
  const cloudBaseEnvId = readRequiredEnvValue(
    env,
    "CLOUDBASE_ENV_ID",
    "CLOUDBASE_ENV_ID"
  );
  const secretId = readRequiredEnvValue(
    env,
    "TENCENTCLOUD_SECRETID",
    "TENCENTCLOUD_SECRETID"
  );
  const secretKey = readRequiredEnvValue(
    env,
    "TENCENTCLOUD_SECRETKEY",
    "TENCENTCLOUD_SECRETKEY"
  );

  if (isPlaceholderSecret(secretId)) {
    throw new Error("TENCENTCLOUD_SECRETID 必须配置为真实 SecretId");
  }

  if (isPlaceholderSecret(secretKey)) {
    throw new Error("TENCENTCLOUD_SECRETKEY 必须配置为真实 SecretKey");
  }

  return {
    env: cloudBaseEnvId,
    secretId,
    secretKey,
    appEnv: env.APP_ENV?.trim() || "local"
  };
}

export function redactCloudBaseServerConfig(config: CloudBaseServerConfig) {
  return {
    env: config.env,
    secretId: `${config.secretId.slice(0, 4)}***`,
    secretKey: "***",
    appEnv: config.appEnv
  };
}

export function createCloudBaseServerApp(
  config?: CloudBaseServerConfig
): ReturnType<typeof tcb.init>;
export function createCloudBaseServerApp<TApp>(
  config: CloudBaseServerConfig,
  initializer: CloudBaseInitializer<TApp>
): TApp;
export function createCloudBaseServerApp<TApp>(
  config = parseCloudBaseServerEnv(),
  initializer: CloudBaseInitializer<TApp> = tcb.init as CloudBaseInitializer<TApp>
) {
  return initializer({
    env: config.env,
    secretId: config.secretId,
    secretKey: config.secretKey
  });
}
