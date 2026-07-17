import type { LeadInput } from "./schema";
import {
  CONVERSAS_LABELS,
  FATURAMENTO_LABELS,
  INVESTIMENTO_LABELS,
  PAPEL_LABELS,
  SITUACAO_LABELS,
  labelize,
} from "./labels";

export type LabelValue = { value: string; label: string };

export function buildFormAnswers(input: LeadInput): Record<string, unknown> {
  const base: Record<string, unknown> = {
    role: { value: input.papel, label: labelize(PAPEL_LABELS, input.papel) },
    daily_conversations: {
      value: input.conversas_dia,
      label: labelize(CONVERSAS_LABELS, input.conversas_dia),
    },
    main_situation: {
      value: (input.problema_principal ?? []).join(","),
      label: (input.problema_principal ?? [])
        .map((p) => labelize(SITUACAO_LABELS, p))
        .join(" · "),
    },
    monthly_revenue: {
      value: input.faturamento,
      label: labelize(FATURAMENTO_LABELS, input.faturamento),
    },
    investment_readiness: {
      value: input.investimento,
      label: labelize(INVESTIMENTO_LABELS, input.investimento),
    },
  };
  if (typeof input.total_time_ms === "number") base.total_time_ms = input.total_time_ms;
  if (input.step_times_ms) base.step_times_ms = input.step_times_ms;
  return base;
}

export function buildWebhookPayload(args: {
  lead: {
    id: string;
    created_at: string;
    name: string;
    whatsapp: string;
    email: string | null;
    store_name: string;
    score: number;
    classification: string;
  };
  input: LeadInput;
  event_id: string;
  occurred_at: string;
  privacy_policy_version: string;
  consent_timestamp: string;
}) {
  const answers = buildFormAnswers(args.input);
  return {
    schema_version: "1.0",
    event: "lead.created",
    event_id: args.event_id,
    occurred_at: args.occurred_at,
    source: "landing_page_agente_ia_iphone",
    lead: {
      id: args.lead.id,
      created_at: args.lead.created_at,
      name: args.lead.name,
      whatsapp: args.lead.whatsapp,
      email: args.lead.email,
      store_name: args.lead.store_name,
      role: answers.role,
      main_situation: answers.main_situation,
      monthly_revenue: answers.monthly_revenue,
      investment_readiness: answers.investment_readiness,
      daily_conversations: answers.daily_conversations,
      score: args.lead.score,
      classification: args.lead.classification,
    },
    tracking: {
      utm_source: args.input.utm_source ?? null,
      utm_medium: args.input.utm_medium ?? null,
      utm_campaign: args.input.utm_campaign ?? null,
      utm_content: args.input.utm_content ?? null,
      utm_term: args.input.utm_term ?? null,
      fbclid: args.input.fbclid ?? null,
      landing_page: args.input.landing_path ?? null,
      referrer: args.input.referrer ?? null,
    },
    consent: {
      accepted: true,
      accepted_at: args.consent_timestamp,
      privacy_policy_version: args.privacy_policy_version,
    },
    form_answers: answers,
  };
}
