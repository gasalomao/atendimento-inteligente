import "dotenv/config";

function readOptional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function readRequired(name: string): string {
  const v = readOptional(name);
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 3000),
  SUPABASE_URL: readRequired("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: readRequired("SUPABASE_SERVICE_ROLE_KEY"),
  LEAD_NOTIFICATION_TO:
    readOptional("LEAD_NOTIFICATION_TO") ?? "ga.pancione@gmail.com",
  LEAD_NOTIFICATION_FROM: readOptional("LEAD_NOTIFICATION_FROM"),
  RESEND_API_KEY: readOptional("RESEND_API_KEY"),
  LEAD_WEBHOOK_URL: readOptional("LEAD_WEBHOOK_URL"),
  LEAD_WEBHOOK_SECRET: readOptional("LEAD_WEBHOOK_SECRET"),
  LEAD_WEBHOOK_TOKEN: readOptional("LEAD_WEBHOOK_TOKEN"),
  LEAD_WEBHOOK_TIMEOUT_MS: Number(
    process.env.LEAD_WEBHOOK_TIMEOUT_MS ?? 8000
  ),
  PRIVACY_POLICY_VERSION:
    readOptional("PRIVACY_POLICY_VERSION") ?? "2026-07-01",
  APP_URL: readOptional("APP_URL") ?? "",
  CONTACT_EMAIL: readOptional("CONTACT_EMAIL") ?? "ga.pancione@gmail.com",
  TZ: process.env.TZ ?? "America/Sao_Paulo",
};
