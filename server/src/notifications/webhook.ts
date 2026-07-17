import crypto from "node:crypto";
import { env } from "../env";
import { supabaseAdmin } from "../db/supabase";
import { buildWebhookPayload } from "../../../shared/leads/payload";
import type { LeadInput } from "../../../shared/leads/schema";

export async function sendLeadWebhook(leadId: string): Promise<{ status: number; skipped?: string }> {
  if (!env.LEAD_WEBHOOK_URL) {
    return { status: 0, skipped: "LEAD_WEBHOOK_URL não configurada" };
  }
  const { data: row, error } = await supabaseAdmin
    .from("contatos")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();
  if (error || !row) throw new Error("Lead não encontrado para webhook");

  const occurredAt = new Date().toISOString();
  const input: LeadInput = {
    nome: row.nome,
    whatsapp: row.whatsapp,
    loja: row.loja || "",
    email: row.email ?? "",
    papel: row.papel,
    conversas_dia: row.conversas_dia,
    problema_principal: row.problema_principal,
    faturamento: row.faturamento,
    investimento: row.investimento,
    consentimento: true,
    utm_source: row.utm_source,
    utm_medium: row.utm_medium,
    utm_campaign: row.utm_campaign,
    utm_content: row.utm_content,
    utm_term: row.utm_term,
    fbclid: row.fbclid,
    gclid: row.gclid,
    referrer: row.referrer,
    landing_path: row.landing_path,
  };
  const payload = buildWebhookPayload({
    lead: {
      id: row.id,
      created_at: row.created_at,
      name: row.nome,
      whatsapp: row.whatsapp,
      email: row.email,
      store_name: row.loja || "",
      score: row.pontuacao ?? 0,
      classification: row.lead_classification || "contato_acompanhamento",
    },
    input,
    event_id: row.event_id ?? row.id,
    occurred_at: occurredAt,
    privacy_policy_version: row.privacy_policy_version ?? env.PRIVACY_POLICY_VERSION,
    consent_timestamp: row.consent_timestamp ?? row.created_at,
  });

  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Webhook-Event": "lead.created",
    "X-Webhook-Id": payload.event_id,
    "X-Webhook-Timestamp": timestamp,
  };
  if (env.LEAD_WEBHOOK_SECRET) {
    const sig = crypto
      .createHmac("sha256", env.LEAD_WEBHOOK_SECRET)
      .update(`${timestamp}.${body}`)
      .digest("hex");
    headers["X-Webhook-Signature"] = `sha256=${sig}`;
  }
  if (env.LEAD_WEBHOOK_TOKEN) {
    headers["Authorization"] = `Bearer ${env.LEAD_WEBHOOK_TOKEN}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.LEAD_WEBHOOK_TIMEOUT_MS);
  try {
    const res = await fetch(env.LEAD_WEBHOOK_URL, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Webhook HTTP ${res.status}: ${text.slice(0, 500)}`);
    }
    return { status: res.status };
  } finally {
    clearTimeout(timeout);
  }
}
