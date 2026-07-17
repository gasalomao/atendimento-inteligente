/**
 * Dispara um POST assinado para LEAD_WEBHOOK_URL com um payload de exemplo.
 * Uso: npm run test:webhook
 */
import "dotenv/config";
import crypto from "node:crypto";
import { env } from "../src/env";

async function main() {
  if (!env.LEAD_WEBHOOK_URL) throw new Error("LEAD_WEBHOOK_URL não configurada");
  const payload = {
    schema_version: "1.0",
    event: "lead.created",
    event_id: crypto.randomUUID(),
    occurred_at: new Date().toISOString(),
    source: "landing_page_agente_ia_iphone",
    lead: { id: "test", name: "Teste" },
    tracking: {},
    consent: { accepted: true, accepted_at: new Date().toISOString(), privacy_policy_version: env.PRIVACY_POLICY_VERSION },
    form_answers: {},
  };
  const body = JSON.stringify(payload);
  const ts = Math.floor(Date.now() / 1000).toString();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Webhook-Event": "lead.created",
    "X-Webhook-Id": payload.event_id,
    "X-Webhook-Timestamp": ts,
  };
  if (env.LEAD_WEBHOOK_SECRET) {
    const sig = crypto.createHmac("sha256", env.LEAD_WEBHOOK_SECRET).update(`${ts}.${body}`).digest("hex");
    headers["X-Webhook-Signature"] = `sha256=${sig}`;
  }
  if (env.LEAD_WEBHOOK_TOKEN) headers["Authorization"] = `Bearer ${env.LEAD_WEBHOOK_TOKEN}`;
  const res = await fetch(env.LEAD_WEBHOOK_URL, { method: "POST", headers, body });
  console.log("HTTP", res.status, await res.text());
}

main().catch((err) => {
  console.error("FALHA:", err.message);
  process.exit(1);
});
