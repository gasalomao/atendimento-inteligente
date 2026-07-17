import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true } },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.RESEND_API_KEY",
      "*.SUPABASE_SERVICE_ROLE_KEY",
      "*.LEAD_WEBHOOK_SECRET",
      "*.LEAD_WEBHOOK_TOKEN",
    ],
    censor: "[redacted]",
  },
});
