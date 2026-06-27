import net from "node:net";
import tls from "node:tls";

import type { EmailDelivery } from "@/server/email-auth";

type EmailDeliveryEnv = {
  [key: string]: string | undefined;
  APP_ENV?: string;
  EMAIL_FROM?: string;
  EMAIL_PROVIDER?: string;
  SMTP_HOST?: string;
  SMTP_PASS?: string;
  SMTP_PORT?: string;
  SMTP_SECURE?: string;
  SMTP_USER?: string;
};

function hasSmtpConfig(env: EmailDeliveryEnv) {
  return Boolean(
    env.SMTP_HOST?.trim() &&
      env.SMTP_PORT?.trim() &&
      env.SMTP_USER?.trim() &&
      env.SMTP_PASS?.trim() &&
      env.EMAIL_FROM?.trim()
  );
}

function readLine(socket: net.Socket | tls.TLSSocket) {
  return new Promise<string>((resolve, reject) => {
    const onData = (data: Buffer) => {
      cleanup();
      resolve(data.toString("utf8"));
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
    };

    socket.once("data", onData);
    socket.once("error", onError);
  });
}

async function expectSmtp(
  socket: net.Socket | tls.TLSSocket,
  command: string | null,
  expectedPrefix: string
) {
  if (command) {
    socket.write(`${command}\r\n`);
  }

  const response = await readLine(socket);

  if (!response.startsWith(expectedPrefix)) {
    throw new Error("SMTP command failed");
  }
}

async function sendSmtpMail({
  code,
  email,
  env
}: {
  code: string;
  email: string;
  env: EmailDeliveryEnv;
}) {
  const port = Number(env.SMTP_PORT);

  if (!Number.isFinite(port)) {
    throw new Error("Invalid SMTP port");
  }

  const secure = env.SMTP_SECURE !== "false";
  const socket = secure
    ? tls.connect({ host: env.SMTP_HOST, port, servername: env.SMTP_HOST })
    : net.connect({ host: env.SMTP_HOST, port });
  const message = [
    `From: ${env.EMAIL_FROM}`,
    `To: ${email}`,
    "Subject: Ungradu EDU 登录验证码",
    "Content-Type: text/plain; charset=utf-8",
    "",
    `你的登录验证码是 ${code}，5 分钟内有效。请勿转发给他人。`
  ].join("\r\n");

  try {
    await expectSmtp(socket, null, "220");
    await expectSmtp(socket, `EHLO ${env.SMTP_HOST}`, "250");
    await expectSmtp(socket, "AUTH LOGIN", "334");
    await expectSmtp(
      socket,
      Buffer.from(env.SMTP_USER ?? "", "utf8").toString("base64"),
      "334"
    );
    await expectSmtp(
      socket,
      Buffer.from(env.SMTP_PASS ?? "", "utf8").toString("base64"),
      "235"
    );
    await expectSmtp(socket, `MAIL FROM:<${env.EMAIL_FROM}>`, "250");
    await expectSmtp(socket, `RCPT TO:<${email}>`, "250");
    await expectSmtp(socket, "DATA", "354");
    await expectSmtp(socket, `${message}\r\n.`, "250");
    socket.write("QUIT\r\n");
  } finally {
    socket.end();
  }
}

export function createEmailDelivery(env: EmailDeliveryEnv = process.env): EmailDelivery {
  return {
    async send({ code, email }) {
      if (env.EMAIL_PROVIDER === "console" && env.APP_ENV !== "production") {
        return { ok: true };
      }

      if (env.EMAIL_PROVIDER !== "smtp" || !hasSmtpConfig(env)) {
        return {
          ok: false,
          error: "Email provider is not configured."
        };
      }

      try {
        await sendSmtpMail({ code, email, env });
        return { ok: true };
      } catch {
        return {
          ok: false,
          error: "EmailSendFailed"
        };
      }
    }
  };
}
