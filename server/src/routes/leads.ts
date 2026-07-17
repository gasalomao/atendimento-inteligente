import type { Request, Response } from "express";
import crypto from "node:crypto";
import { leadSchema } from "../../../shared/leads/schema";
import { buildFormAnswers } from "../../../shared/leads/payload";
import { calcScore, classify } from "../../../shared/leads/scoring";
import { normalizeBRPhone } from "../../../shared/leads/phone";
import { supabaseAdmin } from "../db/supabase";
import { enqueue } from "../notifications/queue";
import { env } from "../env";
import { logger } from "../logger";
import { lookupGeo } from "../lib/geo";

export async function leadsHandler(req: Request, res: Response) {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const iss of parsed.error.issues) {
      const key = iss.path.join(".") || "_";
      if (!fields[key]) fields[key] = iss.message;
    }
    return res.status(422).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Confira as informações preenchidas.",
      fields,
    });
  }
  const data = parsed.data;

  // Honeypot + tempo mínimo
  if (data.hp_field && data.hp_field.trim() !== "") {
    return res.status(201).json({ success: true, lead_id: "hp", event_id: "hp", message: "Recebemos suas respostas." });
  }
  if (data.started_at && Date.now() - data.started_at < 1500) {
    return res.status(201).json({ success: true, lead_id: "fast", event_id: "fast", message: "Recebemos suas respostas." });
  }

  const eventId = data.event_id ?? crypto.randomUUID();
  const nowIso = new Date().toISOString();

  // Idempotência via event_id
  const { data: existing } = await supabaseAdmin
    .from("contatos")
    .select("id, event_id")
    .eq("event_id", eventId)
    .maybeSingle();
  if (existing) {
    return res.status(201).json({
      success: true,
      lead_id: existing.id,
      event_id: eventId,
      message: "Recebemos suas respostas.",
    });
  }

  const score = calcScore(data);
  const classification = classify(score);
  const formAnswers = buildFormAnswers(data);
  const ipHash = req.ip
    ? crypto.createHash("sha256").update(String(req.ip)).digest("hex").slice(0, 16)
    : null;

  const insert = {
    event_id: eventId,
    nome: data.nome,
    whatsapp: normalizeBRPhone(data.whatsapp),
    loja: data.loja || "",
    email: data.email && data.email !== "" ? data.email : null,
    papel: data.papel,
    conversas_dia: data.conversas_dia,
    problema_principal: (data.problema_principal ?? []).join(","),
    faturamento: data.faturamento,
    investimento: data.investimento,
    consentimento: true,
    consent_timestamp: nowIso,
    privacy_policy_version: data.privacy_policy_version ?? env.PRIVACY_POLICY_VERSION,
    pontuacao: score,
    lead_classification: classification,
    form_answers: formAnswers,
    utm_source: data.utm_source ?? null,
    utm_medium: data.utm_medium ?? null,
    utm_campaign: data.utm_campaign ?? null,
    utm_content: data.utm_content ?? null,
    utm_term: data.utm_term ?? null,
    fbclid: data.fbclid ?? null,
    gclid: data.gclid ?? null,
    referrer: data.referrer ?? null,
    landing_path: data.landing_path ?? null,
    user_agent: (req.headers["user-agent"] as string) ?? null,
    ip: ipHash,
    status: "new",
    email_status: "pending",
    webhook_status: env.LEAD_WEBHOOK_URL ? "pending" : "skipped",
  };

  const { data: inserted, error } = await supabaseAdmin
    .from("contatos")
    .insert(insert)
    .select("id")
    .single();

  if (error || !inserted) {
    logger.error({ err: error }, "insert_lead_failed");
    return res.status(500).json({ success: false, code: "INTERNAL_ERROR", message: "Erro interno." });
  }

  try {
    await enqueue({ lead_id: inserted.id, event_id: eventId, channel: "email" });
    await enqueue({
      lead_id: inserted.id,
      event_id: eventId,
      channel: "webhook",
      status: env.LEAD_WEBHOOK_URL ? "pending" : "skipped",
    });
  } catch (err) {
    logger.error({ err, lead_id: inserted.id }, "enqueue_after_insert_failed");
    // Contato já foi salvo; jobs falharam mas retornamos sucesso; admin pode reenfileirar manualmente.
  }

  logger.info(
    { event: "lead_created", lead_id: inserted.id, event_id: eventId, classification, score },
    "lead_created"
  );

  return res.status(201).json({
    success: true,
    lead_id: inserted.id,
    event_id: eventId,
    message: "Recebemos suas respostas.",
  });
}
