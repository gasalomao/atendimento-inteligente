import type { LeadInput } from "./schema";
import {
  ATRAPALHO_LABELS,
  AUTOMATIZAR_LABELS,
  CANAIS_OPORTUNIDADE_LABELS,
  CANAL_VENDA_LABELS,
  CONTATOS_DIA_LABELS,
  DECISAO_LABELS,
  PRAZO_LABELS,
  REGISTRO_LABELS,
  RESPONDENTES_LABELS,
  labelize,
} from "./labels";
import { buildCrmTags, calcLeadScore, classifyLeadScore } from "./scoring";

export type LabelValue = { value: string; label: string };

function lv(map: Record<string, string>, value: unknown): LabelValue {
  const raw = Array.isArray(value) ? value.join(",") : typeof value === "string" ? value : "";
  return { value: raw, label: labelize(map, raw) };
}

export function buildFormAnswers(input: LeadInput): Record<string, unknown> {
  const base: Record<string, unknown> = {
    sales_channel: lv(CANAL_VENDA_LABELS, input.canal_venda),
    opportunity_channels: lv(CANAIS_OPORTUNIDADE_LABELS, input.canais_oportunidade),
    main_blocker: lv(ATRAPALHO_LABELS, input.problema_principal),
    daily_contacts: lv(CONTATOS_DIA_LABELS, input.contatos_dia),
    responders: lv(RESPONDENTES_LABELS, input.respondentes),
    contact_registry: lv(REGISTRO_LABELS, input.registro_contatos),
    first_automation: lv(AUTOMATIZAR_LABELS, input.automatizar_primeiro),
    timeline: lv(PRAZO_LABELS, input.prazo),
    decision_makers: lv(DECISAO_LABELS, input.decisao),
    city_state: input.cidade_uf ?? null,
  };
  if (typeof input.total_time_ms === "number") base.total_time_ms = input.total_time_ms;
  if (input.step_times_ms) base.step_times_ms = input.step_times_ms;
  return base;
}

/** Rótulos legíveis, na ordem do formulário — usado no e-mail interno. */
export const FORM_ANSWER_ORDER: Array<{ key: string; label: string }> = [
  { key: "sales_channel", label: "Como a loja vende" },
  { key: "opportunity_channels", label: "Canais de oportunidade" },
  { key: "main_blocker", label: "O que mais atrapalha" },
  { key: "daily_contacts", label: "Novos contatos por dia" },
  { key: "responders", label: "Quem responde" },
  { key: "contact_registry", label: "Registro dos contatos" },
  { key: "first_automation", label: "Automatizar primeiro" },
  { key: "timeline", label: "Prazo para implantar" },
  { key: "decision_makers", label: "Participa da decisão" },
];

export function buildWebhookPayload(args: {
  lead: {
    id: string;
    created_at: string;
    name: string;
    whatsapp: string | null;
    email: string | null;
    store_name: string;
    city_state?: string | null;
    score: number;
    classification: string;
    tags?: string[];
  };
  input: LeadInput;
  event_id: string;
  occurred_at: string;
  privacy_policy_version: string;
  consent_timestamp: string;
}) {
  const answers = buildFormAnswers(args.input);
  const score = args.lead.score || calcLeadScore(args.input);
  return {
    schema_version: "2.0",
    event: "lead.created",
    event_id: args.event_id,
    occurred_at: args.occurred_at,
    source: "landing_page_diagnostico_lojas_iphone",
    lead: {
      id: args.lead.id,
      created_at: args.lead.created_at,
      name: args.lead.name,
      whatsapp: args.lead.whatsapp,
      email: args.lead.email,
      store_name: args.lead.store_name,
      city_state: args.lead.city_state ?? args.input.cidade_uf ?? null,
      lead_score: score,
      classification: args.lead.classification || classifyLeadScore(score),
      tags: args.lead.tags?.length ? args.lead.tags : buildCrmTags(args.input),
    },
    tracking: {
      utm_source: args.input.utm_source ?? null,
      utm_medium: args.input.utm_medium ?? null,
      utm_campaign: args.input.utm_campaign ?? null,
      utm_content: args.input.utm_content ?? null,
      utm_term: args.input.utm_term ?? null,
      fbclid: args.input.fbclid ?? null,
      gclid: args.input.gclid ?? null,
      landing_page: args.input.landing_path ?? null,
      landing_variant: args.input.landing_variant ?? null,
      referrer: args.input.referrer ?? null,
    },
    consent: {
      email: Boolean(args.input.consent_email),
      whatsapp: Boolean(args.input.consent_whatsapp),
      sms: Boolean(args.input.consent_sms),
      marketing: Boolean(args.input.consent_marketing),
      accepted_at: args.consent_timestamp,
      privacy_policy_version: args.privacy_policy_version,
      consent_text_version: args.input.consent_text_version ?? null,
    },
    form_answers: answers,
  };
}
