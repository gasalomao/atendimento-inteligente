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
  const r = row as Record<string, any>;
  const input = {
    nome: r.nome,
    email: r.email ?? "",
    whatsapp: r.whatsapp ?? "",
    loja: r.loja || "",
    cidade_uf: r.cidade_uf ?? "",
    canal_venda: r.canal_venda,
    canais_oportunidade: typeof r.canais_oportunidade === "string" && r.canais_oportunidade
      ? r.canais_oportunidade.split(",")
      : [],
    problema_principal: typeof r.problema_principal === "string" && r.problema_principal
      ? r.problema_principal.split(",")
      : [],
    contatos_dia: r.contatos_dia ?? r.conversas_dia,
    respondentes: r.respondentes,
    registro_contatos: r.registro_contatos,
    automatizar_primeiro: r.automatizar_primeiro,
    prazo: r.prazo_implantacao,
    decisao: r.decisao,
    consent_email: Boolean(r.consent_email),
    consent_whatsapp: Boolean(r.consent_whatsapp),
    consent_sms: Boolean(r.consent_sms),
    consent_marketing: Boolean(r.consent_marketing),
    consent_text_version: r.consent_text_version ?? undefined,
    landing_variant: r.landing_variant ?? undefined,
    utm_source: r.utm_source,
    utm_medium: r.utm_medium,
    utm_campaign: r.utm_campaign,
    utm_content: r.utm_content,
    utm_term: r.utm_term,
    fbclid: r.fbclid,
    gclid: r.gclid,
    referrer: r.referrer,
    landing_path: r.landing_path,
  } as unknown as LeadInput;
  const payload = buildWebhookPayload({
    lead: {
      id: r.id,
      created_at: r.created_at,
      name: r.nome,
      whatsapp: r.whatsapp ?? null,
      email: r.email,
      store_name: r.loja || "",
      city_state: r.cidade_uf ?? null,
      score: r.lead_score ?? r.pontuacao ?? 0,
      classification: r.lead_classification || "exploratorio",
      tags: Array.isArray(r.lead_tags) ? r.lead_tags : [],
    },
    input,
    event_id: r.event_id ?? r.id,
    occurred_at: occurredAt,
    privacy_policy_version: r.privacy_policy_version ?? env.PRIVACY_POLICY_VERSION,
    consent_timestamp: r.consent_timestamp ?? r.created_at,
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
