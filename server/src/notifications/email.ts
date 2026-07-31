import { Resend } from "resend";
import { env } from "../env";
import { logger } from "../logger";
import { supabaseAdmin } from "../db/supabase";
import { CLASSIFICATION_LABELS, labelize } from "../../../shared/leads/labels";
import { FORM_ANSWER_ORDER } from "../../../shared/leads/payload";
import { normalizeBRPhone } from "../../../shared/leads/phone";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatBRDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function subjectFor(classification: string, storeName: string, score: number): string {
  const store = storeName || "loja não informada";
  if (classification === "prioridade_alta") return `Diagnóstico — prioridade alta — ${store} (${score}/100)`;
  if (classification === "qualificado") return `Diagnóstico — lead qualificado — ${store} (${score}/100)`;
  if (classification === "em_avaliacao") return `Diagnóstico — em avaliação — ${store} (${score}/100)`;
  return `Novo diagnóstico recebido — ${store} (${score}/100)`;
}

function whatsappLink(phone: string | null, name: string, store: string): string | null {
  if (!phone) return null;
  const num = normalizeBRPhone(phone);
  if (!num) return null;
  const msg = encodeURIComponent(
    `Olá, ${name}. Vi que você solicitou o diagnóstico de atendimento da ${store || "sua loja"}.`
  );
  return `https://wa.me/${num}?text=${msg}`;
}

function instagramLink(store: string): string | null {
  const s = (store || "").trim();
  const m = s.match(/^@?([a-zA-Z0-9._]+)$/);
  if (m) return `https://instagram.com/${m[1]}`;
  return null;
}

export type LeadEmailData = {
  lead_id: string;
  event_id: string;
  created_at: string;
  name: string;
  whatsapp: string | null;
  email: string | null;
  store_name: string;
  city_state: string | null;
  score: number;
  classification: string;
  tags: string[];
  answers: Record<string, unknown>;
  consents: { email: boolean; whatsapp: boolean; sms: boolean; marketing: boolean };
  consent_timestamp: string;
  privacy_policy_version: string;
  consent_text_version: string | null;
  landing_variant: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  landing_path?: string | null;
  referrer?: string | null;
  webhook_status?: string;
};

function answerLabel(answers: Record<string, unknown>, key: string): string {
  const v = answers?.[key] as { label?: string; value?: string } | string | undefined;
  if (!v) return "—";
  if (typeof v === "string") return v;
  return v.label || v.value || "—";
}

function consentSummary(c: LeadEmailData["consents"]): string {
  const on = [
    c.email ? "e-mail" : null,
    c.whatsapp ? "WhatsApp" : null,
    c.sms ? "SMS" : null,
    c.marketing ? "marketing" : null,
  ].filter(Boolean);
  return on.length ? on.join(", ") : "nenhum canal autorizado";
}

function buildHtml(d: LeadEmailData): string {
  const classLabel = labelize(CLASSIFICATION_LABELS, d.classification);
  const waHref = whatsappLink(d.whatsapp, d.name, d.store_name);
  const igHref = instagramLink(d.store_name);
  const fmtDate = formatBRDate(d.created_at);

  const row = (k: string, v: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #EEE;color:#555;font-size:14px;">${esc(k)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #EEE;color:#111;font-size:14px;font-weight:600;text-align:right;">${esc(v)}</td>
    </tr>`;

  const answerRows = FORM_ANSWER_ORDER.map((f) => row(f.label, answerLabel(d.answers, f.key))).join("");

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subjectFor(d.classification, d.store_name, d.score))}</title></head>
<body style="margin:0;padding:0;background:#F4F4F2;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;color:#111;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F4F4F2;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:28px 28px 8px 28px;">
          <p style="margin:0;color:#207A50;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;">Salomão AI</p>
          <h1 style="margin:8px 0 4px 0;font-size:22px;line-height:1.3;color:#111;">Novo diagnóstico recebido</h1>
          <p style="margin:0;color:#555;font-size:14px;">${esc(fmtDate)} · Fuso America/Sao_Paulo</p>
        </td></tr>

        <tr><td style="padding:8px 28px 0 28px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F9F8F5;border-radius:10px;padding:16px;margin-top:12px;">
            <tr>
              <td style="font-size:13px;color:#555;">Classificação</td>
              <td style="font-size:14px;font-weight:700;color:#111;text-align:right;">${esc(classLabel)} · ${esc(d.score)}/100</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#555;padding-top:6px;">Loja</td>
              <td style="font-size:14px;font-weight:700;color:#111;text-align:right;padding-top:6px;">${esc(d.store_name || "—")}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#555;padding-top:6px;">Cidade/UF</td>
              <td style="font-size:14px;font-weight:700;color:#111;text-align:right;padding-top:6px;">${esc(d.city_state || "—")}</td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:20px 28px 0 28px;">
          <h2 style="margin:0 0 8px 0;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;color:#207A50;">Contato</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${row("Nome", d.name)}
            ${row("E-mail", d.email || "—")}
            ${row("WhatsApp", d.whatsapp || "não informado")}
            ${row("Loja / Instagram", d.store_name || "—")}
            ${row("Canais autorizados", consentSummary(d.consents))}
          </table>
          <p style="margin:16px 0 0 0;">
            ${waHref ? `<a href="${esc(waHref)}" style="display:inline-block;background:#207A50;color:#FFFFFF;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;">Chamar no WhatsApp</a>&nbsp;` : ""}
            <a href="mailto:${esc(d.email ?? "")}" style="display:inline-block;background:#111;color:#FFFFFF;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;">Responder por e-mail</a>
            ${igHref ? `&nbsp;<a href="${esc(igHref)}" style="display:inline-block;background:#444;color:#FFFFFF;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;">Abrir Instagram</a>` : ""}
          </p>
        </td></tr>

        <tr><td style="padding:24px 28px 0 28px;">
          <h2 style="margin:0 0 8px 0;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;color:#207A50;">Respostas do diagnóstico</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${answerRows}
            ${row("Pontuação", `${d.score}/100`)}
            ${row("Classificação", classLabel)}
          </table>
        </td></tr>

        <tr><td style="padding:24px 28px 0 28px;">
          <h2 style="margin:0 0 8px 0;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;color:#207A50;">Tags de CRM</h2>
          <p style="margin:0;color:#333;font-size:13px;line-height:1.6;">${esc(d.tags.join(" · ") || "—")}</p>
        </td></tr>

        <tr><td style="padding:24px 28px 0 28px;">
          <h2 style="margin:0 0 8px 0;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;color:#207A50;">Origem</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${row("Variação da página", d.landing_variant || "—")}
            ${row("Campanha (utm_campaign)", d.utm_campaign || "—")}
            ${row("Conjunto (utm_term)", d.utm_term || "—")}
            ${row("Anúncio (utm_content)", d.utm_content || "—")}
            ${row("utm_source", d.utm_source || "—")}
            ${row("utm_medium", d.utm_medium || "—")}
            ${row("fbclid", d.fbclid || "—")}
            ${row("gclid", d.gclid || "—")}
            ${row("Página de entrada", d.landing_path || "—")}
            ${row("Referrer", d.referrer || "—")}
          </table>
        </td></tr>

        <tr><td style="padding:24px 28px 0 28px;">
          <h2 style="margin:0 0 8px 0;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;color:#207A50;">Técnico</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${row("lead_id", d.lead_id)}
            ${row("event_id", d.event_id)}
            ${row("Enviado em", fmtDate)}
            ${row("Status do webhook", d.webhook_status || "—")}
            ${row(
              "Consentimento",
              `${formatBRDate(d.consent_timestamp)} · política v${d.privacy_policy_version} · texto v${d.consent_text_version ?? "—"}`
            )}
          </table>
        </td></tr>

        <tr><td style="padding:24px 28px 28px 28px;color:#777;font-size:12px;line-height:1.5;">
          Este e-mail foi enviado automaticamente após o preenchimento do diagnóstico na landing page.<br>
          Contato responsável: ${esc(env.CONTACT_EMAIL)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildText(d: LeadEmailData): string {
  const classLabel = labelize(CLASSIFICATION_LABELS, d.classification);
  return [
    `Novo diagnóstico recebido — ${d.store_name || "loja não informada"}`,
    `Enviado em: ${formatBRDate(d.created_at)} (America/Sao_Paulo)`,
    ``,
    `Classificação: ${classLabel} (${d.score}/100)`,
    ``,
    `-- Contato --`,
    `Nome: ${d.name}`,
    `E-mail: ${d.email || "—"}`,
    `WhatsApp: ${d.whatsapp || "não informado"}`,
    `Loja/Instagram: ${d.store_name || "—"}`,
    `Cidade/UF: ${d.city_state || "—"}`,
    `Canais autorizados: ${consentSummary(d.consents)}`,
    ``,
    `-- Respostas --`,
    ...FORM_ANSWER_ORDER.map((f) => `${f.label}: ${answerLabel(d.answers, f.key)}`),
    ``,
    `-- Tags --`,
    d.tags.join(", ") || "—",
    ``,
    `-- Origem --`,
    `variacao=${d.landing_variant || "—"}`,
    `utm_source=${d.utm_source || "—"} utm_medium=${d.utm_medium || "—"} utm_campaign=${d.utm_campaign || "—"}`,
    `utm_content=${d.utm_content || "—"} utm_term=${d.utm_term || "—"}`,
    `fbclid=${d.fbclid || "—"} gclid=${d.gclid || "—"}`,
    `landing_path=${d.landing_path || "—"}`,
    `referrer=${d.referrer || "—"}`,
    ``,
    `-- Técnico --`,
    `lead_id=${d.lead_id} event_id=${d.event_id}`,
    `webhook_status=${d.webhook_status || "—"}`,
    `consent=${formatBRDate(d.consent_timestamp)} politica_v${d.privacy_policy_version} texto_v${d.consent_text_version ?? "—"}`,
    ``,
    `Contato responsável: ${env.CONTACT_EMAIL}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function loadLeadEmailData(leadId: string): Promise<LeadEmailData | null> {
  const { data, error } = await supabaseAdmin
    .from("contatos")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();
  if (error || !data) {
    logger.error({ err: error, leadId }, "load_lead_email_data_failed");
    return null;
  }
  const d = data as Record<string, any>;
  return {
    lead_id: d.id,
    event_id: d.event_id ?? "",
    created_at: d.created_at,
    name: d.nome,
    whatsapp: d.whatsapp ?? null,
    email: d.email,
    store_name: d.loja || "",
    city_state: d.cidade_uf ?? null,
    score: d.lead_score ?? d.pontuacao ?? 0,
    classification: d.lead_classification || "exploratorio",
    tags: Array.isArray(d.lead_tags) ? d.lead_tags : [],
    answers: (d.form_answers ?? {}) as Record<string, unknown>,
    consents: {
      email: Boolean(d.consent_email),
      whatsapp: Boolean(d.consent_whatsapp),
      sms: Boolean(d.consent_sms),
      marketing: Boolean(d.consent_marketing),
    },
    consent_timestamp: d.consent_timestamp ?? d.created_at,
    privacy_policy_version: d.privacy_policy_version ?? env.PRIVACY_POLICY_VERSION,
    consent_text_version: d.consent_text_version ?? null,
    landing_variant: d.landing_variant ?? null,
    utm_source: d.utm_source,
    utm_medium: d.utm_medium,
    utm_campaign: d.utm_campaign,
    utm_content: d.utm_content,
    utm_term: d.utm_term,
    fbclid: d.fbclid,
    gclid: d.gclid,
    landing_path: d.landing_path,
    referrer: d.referrer,
    webhook_status: d.webhook_status,
  };
}

export async function sendLeadNotificationEmail(leadId: string): Promise<{ id: string | null; skipped?: string }> {
  if (!env.RESEND_API_KEY) {
    return { id: null, skipped: "RESEND_API_KEY não configurada" };
  }
  if (!env.LEAD_NOTIFICATION_FROM) {
    return { id: null, skipped: "LEAD_NOTIFICATION_FROM não configurada" };
  }
  const d = await loadLeadEmailData(leadId);
  if (!d) throw new Error("Lead não encontrado para enviar e-mail");

  const subject = subjectFor(d.classification, d.store_name, d.score);
  const resend = new Resend(env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: env.LEAD_NOTIFICATION_FROM,
    to: env.LEAD_NOTIFICATION_TO,
    subject,
    html: buildHtml(d),
    text: buildText(d),
    headers: { "X-Entity-Ref-ID": `lead-notification/${d.lead_id}` },
  });
  if (result.error) {
    throw new Error(`Resend: ${result.error.message}`);
  }
  return { id: result.data?.id ?? null };
}
