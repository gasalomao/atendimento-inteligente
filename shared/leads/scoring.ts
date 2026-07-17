import type { LeadInput } from "./schema";

export function calcScore(input: LeadInput): number {
  const papel: Record<string, number> = {
    owner_partner: 3,
    manager_decision_maker: 2,
    team_member_no_final_decision: 0,
    other: 0,
  };
  const conversas: Record<string, number> = {
    up_to_10: 0,
    from_11_to_30: 1,
    from_31_to_60: 2,
    more_than_60: 3,
    unknown: 0,
  };
  const problema: Record<string, number> = {
    delayed_response_busy_store: 2,
    price_request_then_disappears: 2,
    messages_outside_business_hours: 2,
    no_customer_recontact: 3,
    repetitive_questions: 2,
    wants_to_scale_without_overload: 2,
  };
  const faturamento: Record<string, number> = {
    up_to_30k: 0,
    from_30k_to_50k: 1,
    from_50k_to_100k: 3,
    from_100k_to_300k: 4,
    above_300k: 5,
    prefer_not_to_say: 1,
  };
  const investimento: Record<string, number> = {
    ready_if_value_is_clear: 4,
    wants_to_see_first: 3,
    needs_other_decision_maker: 1,
    above_current_budget: 0,
  };
  return (
    (papel[input.papel] ?? 0) +
    (conversas[input.conversas_dia] ?? 0) +
    (problema[input.problema_principal] ?? 0) +
    (faturamento[input.faturamento] ?? 0) +
    (investimento[input.investimento] ?? 0)
  );
}

export function classify(score: number): string {
  if (score >= 12) return "contato_prioritario";
  if (score >= 7) return "contato_potencial";
  return "contato_acompanhamento";
}
