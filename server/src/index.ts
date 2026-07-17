import express from "express";
import helmet from "helmet";
import { env } from "./env";
import { logger } from "./logger";
import { healthHandler } from "./routes/health";
import { leadsHandler } from "./routes/leads";
import { trackHandler, metricsHandler, metricsDeleteHandler } from "./routes/track";
import { leadsRateLimit } from "./security/rate-limit";
import { startWorker } from "./notifications/worker";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, "../../dist/client");

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// JSON body parsing só para /api/* (aceita text/plain para sendBeacon)
app.use("/api", express.json({ limit: "64kb", type: ["application/json", "text/plain"] }));

// Health check
app.get("/healthz", healthHandler);

// API Routes
app.post("/api/leads", leadsRateLimit, (req, res, next) => {
  void Promise.resolve(leadsHandler(req, res)).catch(next);
});
app.post("/api/track", (req, res, next) => {
  void Promise.resolve(trackHandler(req, res)).catch(next);
});
app.get("/api/metrics", (req, res, next) => {
  void Promise.resolve(metricsHandler(req, res)).catch(next);
});
app.delete("/api/metrics", (req, res, next) => {
  void Promise.resolve(metricsDeleteHandler(req, res)).catch(next);
});

// Serve arquivos estáticos do frontend (CSS, JS, Imagens) rapidamente pelo Express
if (fs.existsSync(clientDir)) {
  app.use(
    express.static(clientDir, {
      maxAge: "1h"
    })
  );
} else {
  logger.warn({ clientDir }, "spa_dir_missing");
}

// Proxy para o servidor SSR do Nitro (porta 3001) para rotas não-API e não-estáticas
const nitroPort = 3001;
app.use((req, res) => {
  const proxyReq = http.request(
    {
      hostname: "127.0.0.1",
      port: nitroPort,
      path: req.originalUrl,
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      if (proxyRes.statusCode) {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
      }
      proxyRes.pipe(res, { end: true });
    }
  );
  
  req.pipe(proxyReq, { end: true });
  
  proxyReq.on("error", (err) => {
    logger.error({ err }, "proxy_error");
    if (!res.headersSent) {
      res.status(502).json({ success: false, code: "BAD_GATEWAY", message: "Frontend server indisponível." });
    }
  });
});

// Global error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "unhandled_error");
  if (res.headersSent) return;
  res.status(500).json({ success: false, code: "INTERNAL_ERROR", message: "Erro interno." });
});

app.listen(env.PORT, "0.0.0.0", () => {
  logger.info({ port: env.PORT, node_env: env.NODE_ENV }, "server_listening");
  startWorker();
});
