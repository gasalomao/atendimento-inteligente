import rateLimit from "express-rate-limit";
import crypto from "node:crypto";

export const leadsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Hash do IP: não guardamos IP completo em memória
  keyGenerator: (req) => {
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || "unknown";
    return crypto.createHash("sha256").update(String(ip)).digest("hex").slice(0, 16);
  },
  message: {
    success: false,
    code: "TOO_MANY_ATTEMPTS",
    message: "Aguarde alguns minutos antes de tentar novamente.",
  },
});
