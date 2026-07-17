import { createFileRoute } from "@tanstack/react-router";
import crypto from "node:crypto";
import { leadSchema } from "../../../shared/leads/schema";
import { calcScore, classify } from "../../../shared/leads/scoring";
import { buildFormAnswers } from "../../../shared/leads/payload";
import { normalizeBRPhone } from "../../../shared/leads/phone";

/**
 * Espelho do endpoint POST /api/leads que roda no Express de produção.
 * Aqui existe apenas para que o preview Lovable (TanStack/Workers) receba o mesmo shape.
 * A fila de notificações NÃO roda neste ambiente — apenas persiste o lead + jobs pendentes.
 */
export const Route = createFileRoute("/api/leads")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ success: false, code: "VALIDATION_ERROR", message: "JSON inválido." }, 422);
        }
        const parsed = leadSchema.safeParse(raw);
        if (!parsed.success) {
          const fields: Record<string, string> = {};
          for (const iss of parsed.error.issues) {
            const key = iss.path.join(".") || "_";
            if (!fields[key]) fields[key] = iss.message;
          }
          return json(
            { success: false, code: "VALIDATION_ERROR", message: "Confira as informações preenchidas.", fields },
            422
          );
        }
        const data = parsed.data;
        if (data.hp_field && data.hp_field.trim() !== "") {
          return json({ success: true, lead_id: "hp", event_id: "hp", message: "Recebemos suas respostas." }, 201);
        }
        if (data.started_at && Date.now() - data.started_at < 1500) {
          return json({ success: true, lead_id: "fast", event_id: "fast", message: "Recebemos suas respostas." }, 201);
        }

        const eventId = data.event_id ?? crypto.randomUUID();
        const nowIso = new Date().toISOString();
        const score = calcScore(data);
        const classification = classify(score);
        const answers = buildFormAnswers(data);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: existing } = await supabaseAdmin
          .from("contatos")
          .select("id")
          .eq("event_id", eventId)
          .maybeSingle();
        if (existing) {
          return json({ success: true, lead_id: existing.id, event_id: eventId, message: "Recebemos suas respostas." }, 201);
        }

        const privacyVersion = data.privacy_policy_version ?? "2026-07-01";
        const webhookConfigured = Boolean(process.env.LEAD_WEBHOOK_URL);

        const { data: inserted, error } = await supabaseAdmin
          .from("contatos")
          .insert({
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
            privacy_policy_version: privacyVersion,
            pontuacao: score,
            lead_classification: classification,
            form_answers: answers as any,
            utm_source: data.utm_source ?? null,
            utm_medium: data.utm_medium ?? null,
            utm_campaign: data.utm_campaign ?? null,
            utm_content: data.utm_content ?? null,
            utm_term: data.utm_term ?? null,
            fbclid: data.fbclid ?? null,
            gclid: data.gclid ?? null,
            referrer: data.referrer ?? null,
            landing_path: data.landing_path ?? null,
            user_agent: request.headers.get("user-agent") ?? null,
            status: "new",
            email_status: "pending",
            webhook_status: webhookConfigured ? "pending" : "skipped",
          })
          .select("id")
          .single();

        if (error || !inserted) {
          console.error("[/api/leads] insert error", error);
          return json({ success: false, code: "INTERNAL_ERROR", message: "Erro interno." }, 500);
        }

        // Enfileira jobs (upsert por lead_id+channel)
        await supabaseAdmin
          .from("lead_notification_jobs")
          .upsert(
            [
              { lead_id: inserted.id, event_id: eventId, channel: "email", status: "pending", next_attempt_at: nowIso },
              {
                lead_id: inserted.id,
                event_id: eventId,
                channel: "webhook",
                status: webhookConfigured ? "pending" : "skipped",
                next_attempt_at: nowIso,
              },
            ],
            { onConflict: "lead_id,channel", ignoreDuplicates: true }
          );

        return json({ success: true, lead_id: inserted.id, event_id: eventId, message: "Recebemos suas respostas." }, 201);
      },
    },
  },
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
