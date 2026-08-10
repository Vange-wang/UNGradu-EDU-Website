import { describe, expect, it } from "vitest";

import {
  createCloudBaseServerApp,
  parseCloudBaseServerEnv,
  redactCloudBaseServerConfig
} from "@/server/cloudbase-server";

describe("CloudBase server configuration", () => {
  it("parses required server environment variables", () => {
    const config = parseCloudBaseServerEnv({
      CLOUDBASE_ENV_ID: "ungradu-edu-test-d0ed1mqeceb0ae1",
      TENCENTCLOUD_SECRETID: "AKIDexample",
      TENCENTCLOUD_SECRETKEY: "secret-example",
      APP_ENV: "test"
    });

    expect(config).toEqual({
      env: "ungradu-edu-test-d0ed1mqeceb0ae1",
      secretId: "AKIDexample",
      secretKey: "secret-example",
      appEnv: "test"
    });
  });

  it("rejects missing or placeholder credentials", () => {
    expect(() =>
      parseCloudBaseServerEnv({
        CLOUDBASE_ENV_ID: "ungradu-edu-test-d0ed1mqeceb0ae1",
        TENCENTCLOUD_SECRETID: "你的SecretId",
        TENCENTCLOUD_SECRETKEY: "你的SecretKey",
        APP_ENV: "test"
      })
    ).toThrow("TENCENTCLOUD_SECRETID 必须配置为真实 SecretId");

    expect(() =>
      parseCloudBaseServerEnv({
        CLOUDBASE_ENV_ID: "",
        TENCENTCLOUD_SECRETID: "AKIDexample",
        TENCENTCLOUD_SECRETKEY: "secret-example"
      })
    ).toThrow("CLOUDBASE_ENV_ID 必须配置");
  });

  it("redacts secrets before configuration is logged or reported", () => {
    const redacted = redactCloudBaseServerConfig({
      env: "ungradu-edu-test-d0ed1mqeceb0ae1",
      secretId: "AKIDexample",
      secretKey: "secret-example",
      appEnv: "test"
    });

    expect(redacted).toEqual({
      env: "ungradu-edu-test-d0ed1mqeceb0ae1",
      secretId: "[configured]",
      secretKey: "[configured]",
      appEnv: "test"
    });
    expect(JSON.stringify(redacted)).not.toContain("secret-example");
    expect(JSON.stringify(redacted)).not.toContain("AKID");
  });

  it("creates a CloudBase app through the SDK initializer", () => {
    const calls: unknown[] = [];
    const app = createCloudBaseServerApp(
      {
        env: "ungradu-edu-test-d0ed1mqeceb0ae1",
        secretId: "AKIDexample",
        secretKey: "secret-example",
        appEnv: "test"
      },
      (options) => {
        calls.push(options);
        return { database: () => "db" };
      }
    );

    expect(app.database()).toBe("db");
    expect(calls).toEqual([
      {
        env: "ungradu-edu-test-d0ed1mqeceb0ae1",
        secretId: "AKIDexample",
        secretKey: "secret-example"
      }
    ]);
  });
});
