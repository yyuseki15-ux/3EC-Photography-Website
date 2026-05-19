import { Resend } from "resend";

function getOptionalEnv(name: "RESEND_API_KEY" | "RESEND_FROM_EMAIL" | "ADMIN_NOTIFICATION_EMAIL") {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function getResendConfig() {
  const apiKey = getOptionalEnv("RESEND_API_KEY");
  const fromEmail = getOptionalEnv("RESEND_FROM_EMAIL");
  const adminNotificationEmail = getOptionalEnv("ADMIN_NOTIFICATION_EMAIL");

  if (!apiKey || !fromEmail || !adminNotificationEmail) {
    return null;
  }

  return {
    resend: new Resend(apiKey),
    fromEmail,
    adminNotificationEmail
  };
}
