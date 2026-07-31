import type { LeadInput } from "./schema";
import { CONSENT_TEXT_VERSION_DEFAULT } from "./schema";
import { buildFormAnswers } from "./payload";
import { buildCrmTags, calcLeadScore, classifyLeadScore } from "./scoring";
import { normalizeBRPhone } from "./phone";

const PAPEL_FROM_DECISAO: Record<string, string> = {
  me: "owner_partner",
  me_partner: "owner_partner",
  manager: "manager_decision_maker",
  team: "team_member_no_final_decision",
};

/** Monta a linha da tabela `contatos` a partir das respostas validadas. */
export function buildLeadInsert(
  data: LeadInput,
  ctx: {
    eventId: string;
    nowIso: string;
    privacyPolicyVersion: string;
    webhookConfigured: boolean;
    userAgent?: string | null;
    ipHash?: string | null;
    geo?: unknown;
  }
) {
  const score = calcLeadScore(data);
  const classification = classifyLeadScore(score);
  const tags = buildCrmTags(data);
  const answers = {
    ...buildFormAnswers(data),
    ...(ctx.geo ? { geo: ctx.geo } : {}),
    visitor_id: data.visitor_id ?? null,
    session_id: data.session_id ?? null,
  };
  const whatsapp = data.whatsapp && data.whatsapp.trim() !== "" ? normalizeBRPhone(data.whatsapp) : null;

  return {
    row: {
      event_id: ctx.eventId,
      nome: data.nome,
      email: data.email,
      whatsapp,
      loja: data.loja,
      cidade_uf: data.cidade_uf,

      canal_venda: data.canal_venda,
      canais_oportunidade: (data.canais_oportunidade ?? []).join(","),
      problema_principal: (data.problema_principal ?? []).join(","),
      contatos_dia: data.contatos_dia,
      respondentes: data.respondentes,
      registro_contatos: data.registro_contatos,
      automatizar_primeiro: data.automatizar_primeiro,
      prazo_implantacao: data.prazo,
      decisao: data.decisao,

      // Compatibilidade com colunas legadas
      papel: PAPEL_FROM_DECISAO[data.decisao] ?? null,
      conversas_dia: data.contatos_dia,

      consentimento: true,
      consent_email: Boolean(data.consent_email),
      consent_whatsapp: Boolean(data.consent_whatsapp),
      consent_sms: Boolean(data.consent_sms),
      consent_marketing: Boolean(data.consent_marketing),
      consent_text_version: data.consent_text_version ?? CONSENT_TEXT_VERSION_DEFAULT,
      consent_timestamp: ctx.nowIso,
      privacy_policy_version: data.privacy_policy_version ?? ctx.privacyPolicyVersion,

      lead_score: score,
      pontuacao: score,
      lead_classification: classification,
      lead_tags: tags,
      form_answers: answers,

      landing_variant: data.landing_variant ?? "balanced",
      utm_source: data.utm_source ?? null,
      utm_medium: data.utm_medium ?? null,
      utm_campaign: data.utm_campaign ?? null,
      utm_content: data.utm_content ?? null,
      utm_term: data.utm_term ?? null,
      fbclid: data.fbclid ?? null,
      gclid: data.gclid ?? null,
      referrer: data.referrer ?? null,
      landing_path: data.landing_path ?? null,
      user_agent: ctx.userAgent ?? null,
      ip: ctx.ipHash ?? null,
      status: "new",
      email_status: "pending",
      webhook_status: ctx.webhookConfigured ? "pending" : "skipped",
    },
    score,
    classification,
    tags,
  };
}
