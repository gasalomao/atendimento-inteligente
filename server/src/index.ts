import express from "express";
import helmet from "helmet";
import { env } from "./env";
import { logger } from "./logger";
import { healthHandler } from "./routes/health";
import { leadsHandler } from "./routes/leads";
import { trackHandler, metricsHandler } from "./routes/track";
import { leadsRateLimit } from "./security/rate-limit";
import { startWorker } from "./notifications/worker";

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// JSON body parsing só para /api/*
app.use("/api", express.json({ limit: "64kb" }));

// Health check
app.get("/healthz", healthHandler);

// API
app.post("/api/leads", leadsRateLimit, (req, res, next) => {
  void Promise.resolve(leadsHandler(req, res)).catch(next);
});
app.post("/api/track", (req, res, next) => {
  void Promise.resolve(trackHandler(req, res)).catch(next);
});
app.get("/api/metrics", (req, res, next) => {
  void Promise.resolve(metricsHandler(req, res)).catch(next);
});

// Global error handler (nunca vaza stack)
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "unhandled_error");
  if (res.headersSent) return;
  res.status(500).json({ success: false, code: "INTERNAL_ERROR", message: "Erro interno." });
});

app.listen(env.PORT, "0.0.0.0", () => {
  logger.info({ port: env.PORT, node_env: env.NODE_ENV }, "express_api_listening");
  startWorker();
});
