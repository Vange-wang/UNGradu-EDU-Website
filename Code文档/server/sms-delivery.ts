import { createHash, createHmac } from "node:crypto";

import type { SmsDelivery } from "@/server/sms-auth";

type SmsDeliveryEnv = {
  [key: string]: string | undefined;
  SMS_PROVIDER?: string;
  TENCENTCLOUD_SECRETID?: string;
  TENCENTCLOUD_SECRETKEY?: string;
  TENCENT_SMS_APP_ID?: string;
  TENCENT_SMS_REGION?: string;
  TENCENT_SMS_SIGN_NAME?: string;
  TENCENT_SMS_TEMPLATE_ID?: string;
};

type TencentSmsResponse = {
  Response?: {
    Error?: {
      Code?: string;
      Message?: string;
    };
    SendStatusSet?: Array<{
      Code?: string;
      Message?: string;
    }>;
  };
};

const TENCENT_SMS_ACTION = "SendSms";
const TENCENT_SMS_HOST = "sms.tencentcloudapi.com";
const TENCENT_SMS_SERVICE = "sms";
const TENCENT_SMS_VERSION = "2021-01-11";

function hasTencentSmsConfig(env: SmsDeliveryEnv) {
  return Boolean(
    env.TENCENTCLOUD_SECRETID?.trim() &&
      env.TENCENTCLOUD_SECRETKEY?.trim() &&
      env.TENCENT_SMS_APP_ID?.trim() &&
      env.TENCENT_SMS_SIGN_NAME?.trim() &&
      env.TENCENT_SMS_TEMPLATE_ID?.trim()
  );
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function hmacSha256(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function hmacSha256Hex(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}

function formatUtcDate(timestampSeconds: number) {
  return new Date(timestampSeconds * 1000).toISOString().slice(0, 10);
}

export function createSmsDelivery(env: SmsDeliveryEnv = process.env): SmsDelivery {
  return {
    async send({ code, phone }) {
      if (env.SMS_PROVIDER !== "tencent" || !hasTencentSmsConfig(env)) {
        return {
          ok: false,
          error: "SMS provider is not configured."
        };
      }

      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const date = formatUtcDate(timestamp);
        const payload = JSON.stringify({
          PhoneNumberSet: [`+86${phone}`],
          SignName: env.TENCENT_SMS_SIGN_NAME,
          SmsSdkAppId: env.TENCENT_SMS_APP_ID,
          TemplateId: env.TENCENT_SMS_TEMPLATE_ID,
          TemplateParamSet: [code]
        });
        const canonicalHeaders = [
          "content-type:application/json; charset=utf-8",
          `host:${TENCENT_SMS_HOST}`,
          `x-tc-action:${TENCENT_SMS_ACTION.toLowerCase()}`
        ].join("\n") + "\n";
        const signedHeaders = "content-type;host;x-tc-action";
        const canonicalRequest = [
          "POST",
          "/",
          "",
          canonicalHeaders,
          signedHeaders,
          sha256Hex(payload)
        ].join("\n");
        const credentialScope = `${date}/${TENCENT_SMS_SERVICE}/tc3_request`;
        const stringToSign = [
          "TC3-HMAC-SHA256",
          String(timestamp),
          credentialScope,
          sha256Hex(canonicalRequest)
        ].join("\n");
        const secretDate = hmacSha256(`TC3${env.TENCENTCLOUD_SECRETKEY}`, date);
        const secretService = hmacSha256(secretDate, TENCENT_SMS_SERVICE);
        const secretSigning = hmacSha256(secretService, "tc3_request");
        const signature = hmacSha256Hex(secretSigning, stringToSign);
        const authorization = [
          "TC3-HMAC-SHA256",
          `Credential=${env.TENCENTCLOUD_SECRETID}/${credentialScope}`,
          `SignedHeaders=${signedHeaders}`,
          `Signature=${signature}`
        ].join(", ");
        const response = await fetch(`https://${TENCENT_SMS_HOST}`, {
          body: payload,
          headers: {
            Authorization: authorization,
            "Content-Type": "application/json; charset=utf-8",
            Host: TENCENT_SMS_HOST,
            "X-TC-Action": TENCENT_SMS_ACTION,
            "X-TC-Region": env.TENCENT_SMS_REGION?.trim() || "ap-guangzhou",
            "X-TC-Timestamp": String(timestamp),
            "X-TC-Version": TENCENT_SMS_VERSION
          },
          method: "POST"
        });
        const body = await response.json() as TencentSmsResponse;
        const sendStatus = body.Response?.SendStatusSet?.[0];

        if (!response.ok || body.Response?.Error || sendStatus?.Code !== "Ok") {
          return {
            ok: false,
            error: body.Response?.Error?.Code ?? sendStatus?.Code ?? "SmsSendFailed"
          };
        }

        return { ok: true };
      } catch {
        return {
          ok: false,
          error: "SmsSendFailed"
        };
      }
    }
  };
}
