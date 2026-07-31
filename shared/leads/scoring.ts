import type { LeadInput } from "./schema";

/** Pontuação de 0 a 100 conforme regras comerciais do diagnóstico. */
export function calcLeadScore(input: LeadInput): number {
  let score = 0;

  if (input.contatos_dia === "more_than_80") score += 20;
  else if (input.contatos_dia === "from_31_to_80") score += 15;
  else if (input.contatos_dia === "from_11_to_30") score += 8;

  if (input.faturamento === "above_300k") score += 10;
  else if (input.faturamento === "from_100k_to_300k") score += 8;
  else if (input.faturamento === "from_60k_to_100k") score += 5;
  else if (input.faturamento === "from_40k_to_60k") score += 3;

  if (input.prazo === "now") score += 15;
  else if (input.prazo === "until_30d") score += 10;
  else if (input.prazo === "from_1_to_3m") score += 5;


  if (input.respondentes && input.respondentes !== "one") score += 10;
  if (input.registro_contatos === "crm" || input.registro_contatos === "own_system") score += 10;
  if (input.canal_venda === "both") score += 10;
  if (input.automatizar_primeiro === "integracao") score += 10;
  if (input.decisao === "me" || input.decisao === "me_partner") score += 5;
  if (hasPaidMedia(input)) score += 5;

  return Math.max(0, Math.min(100, score));
}

export function hasPaidMedia(input: LeadInput): boolean {
  const medium = (input.utm_medium ?? "").toLowerCase();
  const paidMedium = /cpc|paid|ppc|ads|display|video/.test(medium);
  return Boolean(paidMedium || input.fbclid || input.gclid);
}

export function classifyLeadScore(score: number): string {
  if (score >= 80) return "prioridade_alta";
  if (score >= 60) return "qualificado";
  if (score >= 30) return "em_avaliacao";
  return "exploratorio";
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

/** Tags de CRM derivadas das respostas — sem dados sensíveis. */
export function buildCrmTags(input: LeadInput): string[] {
  const tags = new Set<string>();

  const canal = input.canais_oportunidade ?? [];
  for (const c of canal) tags.add(`source_${c}`);
  if (input.utm_source) tags.add(`source_${slug(input.utm_source)}`);
  if (input.utm_campaign) tags.add(`campaign_${slug(input.utm_campaign)}`);
  if (input.utm_content) tags.add(`content_${slug(input.utm_content)}`);
  tags.add(`landing_${slug(input.landing_variant || "balanced")}`);

  if (input.canal_venda === "physical") tags.add("operation_physical");
  if (input.canal_venda === "online") tags.add("operation_ecommerce");
  if (input.canal_venda === "both") tags.add("operation_hybrid");

  if (input.contatos_dia === "more_than_80" || input.contatos_dia === "from_31_to_80") {
    tags.add("volume_high");
  } else if (input.contatos_dia === "from_11_to_30") {
    tags.add("volume_medium");
  } else if (input.contatos_dia === "up_to_10") {
    tags.add("volume_low");
  }

  if (input.faturamento) tags.add(`revenue_${input.faturamento}`);


  if (input.registro_contatos === "none") tags.add("crm_none");
  if (input.registro_contatos === "sheet") tags.add("crm_sheet");
  if (input.registro_contatos === "crm" || input.registro_contatos === "own_system") {
    tags.add("crm_active");
  }

  if (input.prazo === "now") tags.add("timeline_now");
  if (input.prazo === "until_30d") tags.add("timeline_30d");
  if (input.prazo === "from_1_to_3m") tags.add("timeline_90d");

  if (input.decisao === "me") tags.add("decision_owner");
  if (input.decisao === "me_partner") tags.add("decision_partner");

  if (input.automatizar_primeiro === "triagem") tags.add("interest_triage");
  if (input.automatizar_primeiro === "followup") tags.add("interest_followup");
  if (input.automatizar_primeiro === "integracao") {
    tags.add("interest_full");
    tags.add("interest_crm");
  }

  if (input.consent_email) tags.add("consent_email");
  if (input.consent_whatsapp) tags.add("consent_whatsapp");
  if (input.consent_sms) tags.add("consent_sms");
  if (input.consent_marketing) tags.add("consent_marketing");

  const score = calcLeadScore(input);
  tags.add(score >= 60 ? "status_sales" : "status_nurture");
  tags.add("status_new");

  return Array.from(tags);
}

// ---- Compatibilidade com a versão anterior do formulário ----
export function calcScore(input: LeadInput): number {
  return calcLeadScore(input);
}

export function classify(score: number): string {
  return classifyLeadScore(score);
}
