import { Resend } from "resend";
import { env } from "../env";
import { logger } from "../logger";
import { supabaseAdmin } from "../db/supabase";
import {
  CLASSIFICATION_LABELS,
  CONVERSAS_LABELS,
  FATURAMENTO_LABELS,
  INVESTIMENTO_LABELS,
  PAPEL_LABELS,
  SITUACAO_LABELS,
  labelize,
} from "../../../shared/leads/labels";
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

function subjectFor(classification: string, storeName: string, revenueLabel: string): string {
  const store = storeName || "loja não informada";
  if (classification === "contato_prioritario") {
    return `Novo contato prioritário — ${store} — ${revenueLabel}`;
  }
  if (classification === "contato_potencial") {
    return `Novo formulário — ${store} — contato com potencial`;
  }
  return `Novo formulário recebido — ${store}`;
}

function whatsappLink(phone: string, name: string, store: string): string {
  const num = normalizeBRPhone(phone);
  const msg = encodeURIComponent(
    `Olá, ${name}. Vi que você solicitou uma análise do atendimento da ${store || "sua loja"}.`
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
  whatsapp: string;
  email: string | null;
  store_name: string;
  role: string;
  main_situation: string;
  monthly_revenue: string;
  investment_readiness: string;
  daily_conversations: string;
  score: number;
  classification: string;
  consent_timestamp: string;
  privacy_policy_version: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  landing_path?: string | null;
  referrer?: string | null;
  webhook_status?: string;
};

function buildHtml(d: LeadEmailData): string {
  const roleLabel = labelize(PAPEL_LABELS, d.role);
  const situationLabel = labelize(SITUACAO_LABELS, d.main_situation);
  const revenueLabel = labelize(FATURAMENTO_LABELS, d.monthly_revenue);
  const investmentLabel = labelize(INVESTIMENTO_LABELS, d.investment_readiness);
  const conversasLabel = labelize(CONVERSAS_LABELS, d.daily_conversations);
  const classLabel = labelize(CLASSIFICATION_LABELS, d.classification);
  const waHref = whatsappLink(d.whatsapp, d.name, d.store_name);
  const igHref = instagramLink(d.store_name);
  const fmtDate = formatBRDate(d.created_at);

  const row = (k: string, v: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #EEE;color:#555;font-size:14px;">${esc(k)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #EEE;color:#111;font-size:14px;font-weight:600;text-align:right;">${esc(v)}</td>
    </tr>`;

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subjectFor(d.classification, d.store_name, revenueLabel))}</title></head>
<body style="margin:0;padding:0;background:#F4F4F2;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;color:#111;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F4F4F2;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:28px 28px 8px 28px;">
          <p style="margin:0;color:#207A50;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;">Salomão AI</p>
          <h1 style="margin:8px 0 4px 0;font-size:22px;line-height:1.3;color:#111;">Novo formulário recebido</h1>
          <p style="margin:0;color:#555;font-size:14px;">${esc(fmtDate)} · Fuso America/Sao_Paulo</p>
        </td></tr>

        <tr><td style="padding:8px 28px 0 28px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F9F8F5;border-radius:10px;padding:16px;margin-top:12px;">
            <tr>
              <td style="font-size:13px;color:#555;">Classificação</td>
              <td style="font-size:14px;font-weight:700;color:#111;text-align:right;">${esc(classLabel)} · ${esc(d.score)} pts</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#555;padding-top:6px;">Loja</td>
              <td style="font-size:14px;font-weight:700;color:#111;text-align:right;padding-top:6px;">${esc(d.store_name || "—")}</td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:20px 28px 0 28px;">
          <h2 style="margin:0 0 8px 0;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;color:#207A50;">Contato</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${row("Nome", d.name)}
            ${row("WhatsApp", d.whatsapp)}
            ${row("Loja / Instagram", d.store_name || "—")}
            ${d.email ? row("E-mail", d.email) : ""}
          </table>
          <p style="margin:16px 0 0 0;">
            <a href="${esc(waHref)}" style="display:inline-block;background:#207A50;color:#FFFFFF;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;">Chamar no WhatsApp</a>
            ${igHref ? `&nbsp;<a href="${esc(igHref)}" style="display:inline-block;background:#111;color:#FFFFFF;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;">Abrir Instagram</a>` : ""}
          </p>
        </td></tr>

        <tr><td style="padding:24px 28px 0 28px;">
          <h2 style="margin:0 0 8px 0;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;color:#207A50;">Sobre a loja</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${row("Papel na loja", roleLabel)}
            ${row("Situação informada", situationLabel)}
            ${row("Conversas por dia", conversasLabel)}
            ${row("Faixa de faturamento", revenueLabel)}
            ${row("Momento para investir", investmentLabel)}
            ${row("Classificação", classLabel)}
            ${row("Pontuação", String(d.score))}
          </table>
        </td></tr>

        <tr><td style="padding:24px 28px 0 28px;">
          <h2 style="margin:0 0 8px 0;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;color:#207A50;">Origem</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${row("Campanha (utm_campaign)", d.utm_campaign || "—")}
            ${row("Conjunto (utm_term)", d.utm_term || "—")}
            ${row("Anúncio (utm_content)", d.utm_content || "—")}
            ${row("utm_source", d.utm_source || "—")}
            ${row("utm_medium", d.utm_medium || "—")}
            ${row("fbclid", d.fbclid || "—")}
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
            ${row("Consentimento", `${formatBRDate(d.consent_timestamp)} · v${d.privacy_policy_version}`)}
          </table>
        </td></tr>

        <tr><td style="padding:24px 28px 28px 28px;color:#777;font-size:12px;line-height:1.5;">
          Este e-mail foi enviado automaticamente após o preenchimento do formulário da landing page.<br>
          Contato responsável: ${esc(env.CONTACT_EMAIL)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildText(d: LeadEmailData): string {
  const roleLabel = labelize(PAPEL_LABELS, d.role);
  const situationLabel = labelize(SITUACAO_LABELS, d.main_situation);
  const revenueLabel = labelize(FATURAMENTO_LABELS, d.monthly_revenue);
  const investmentLabel = labelize(INVESTIMENTO_LABELS, d.investment_readiness);
  const conversasLabel = labelize(CONVERSAS_LABELS, d.daily_conversations);
  const classLabel = labelize(CLASSIFICATION_LABELS, d.classification);
  return [
    `Novo formulário recebido — ${d.store_name || "loja não informada"}`,
    `Enviado em: ${formatBRDate(d.created_at)} (America/Sao_Paulo)`,
    ``,
    `Classificação: ${classLabel} (${d.score} pts)`,
    ``,
    `-- Contato --`,
    `Nome: ${d.name}`,
    `WhatsApp: ${d.whatsapp}`,
    `Loja/Instagram: ${d.store_name || "—"}`,
    d.email ? `E-mail: ${d.email}` : "",
    `WhatsApp direto: ${whatsappLink(d.whatsapp, d.name, d.store_name)}`,
    ``,
    `-- Sobre a loja --`,
    `Papel: ${roleLabel}`,
    `Situação: ${situationLabel}`,
    `Conversas/dia: ${conversasLabel}`,
    `Faturamento: ${revenueLabel}`,
    `Investimento: ${investmentLabel}`,
    ``,
    `-- Origem --`,
    `utm_source=${d.utm_source || "—"} utm_medium=${d.utm_medium || "—"} utm_campaign=${d.utm_campaign || "—"}`,
    `utm_content=${d.utm_content || "—"} utm_term=${d.utm_term || "—"}`,
    `fbclid=${d.fbclid || "—"}`,
    `landing_path=${d.landing_path || "—"}`,
    `referrer=${d.referrer || "—"}`,
    ``,
    `-- Técnico --`,
    `lead_id=${d.lead_id} event_id=${d.event_id}`,
    `webhook_status=${d.webhook_status || "—"}`,
    `consent=${formatBRDate(d.consent_timestamp)} v${d.privacy_policy_version}`,
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
  return {
    lead_id: data.id,
    event_id: data.event_id ?? "",
    created_at: data.created_at,
    name: data.nome,
    whatsapp: data.whatsapp,
    email: data.email,
    store_name: data.loja || "",
    role: data.papel,
    main_situation: data.problema_principal,
    monthly_revenue: data.faturamento,
    investment_readiness: data.investimento,
    daily_conversations: data.conversas_dia,
    score: data.pontuacao ?? 0,
    classification: data.lead_classification || "contato_acompanhamento",
    consent_timestamp: data.consent_timestamp ?? data.created_at,
    privacy_policy_version: data.privacy_policy_version ?? env.PRIVACY_POLICY_VERSION,
    utm_source: data.utm_source,
    utm_medium: data.utm_medium,
    utm_campaign: data.utm_campaign,
    utm_content: data.utm_content,
    utm_term: data.utm_term,
    fbclid: data.fbclid,
    landing_path: data.landing_path,
    referrer: data.referrer,
    webhook_status: data.webhook_status,
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

  const revenueLabel = labelize(FATURAMENTO_LABELS, d.monthly_revenue);
  const subject = subjectFor(d.classification, d.store_name, revenueLabel);
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
