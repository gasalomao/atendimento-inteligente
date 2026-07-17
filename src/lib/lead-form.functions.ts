import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

// Schema atualizado: 5 perguntas na etapa 2 (papel, conversas_dia, situação,
// faturamento, investimento). Valores estáveis em inglês para CRM/n8n.
const submitSchema = z.object({
  nome: z.string().trim().min(2, "Digite seu nome.").max(120),
  whatsapp: z
    .string()
    .trim()
    .min(10, "Confira o número e inclua o DDD.")
    .max(20),
  loja: z.string().trim().max(120).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .max(160)
    .email("E-mail inválido.")
    .optional()
    .or(z.literal("")),
  papel: z.enum([
    "owner_partner",
    "manager_decision_maker",
    "team_member_no_final_decision",
    "other",
  ]),
  conversas_dia: z.enum([
    "up_to_10",
    "from_11_to_30",
    "from_31_to_60",
    "more_than_60",
    "unknown",
  ]),
  problema_principal: z.enum([
    "delayed_response_busy_store",
    "price_request_then_disappears",
    "messages_outside_business_hours",
    "no_customer_recontact",
    "repetitive_questions",
    "wants_to_scale_without_overload",
  ]),
  faturamento: z.enum([
    "up_to_30k",
    "from_30k_to_50k",
    "from_50k_to_100k",
    "from_100k_to_300k",
    "above_300k",
    "prefer_not_to_say",
  ]),
  investimento: z.enum([
    "ready_if_value_is_clear",
    "wants_to_see_first",
    "needs_other_decision_maker",
    "above_current_budget",
  ]),
  consentimento: z.literal(true, {
    errorMap: () => ({ message: "É necessário autorizar o contato." }),
  }),
  // Contexto de rastreio (opcional)
  utm_source: z.string().max(200).optional().nullable(),
  utm_medium: z.string().max(200).optional().nullable(),
  utm_campaign: z.string().max(200).optional().nullable(),
  utm_content: z.string().max(200).optional().nullable(),
  utm_term: z.string().max(200).optional().nullable(),
  fbclid: z.string().max(400).optional().nullable(),
  gclid: z.string().max(400).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
  landing_path: z.string().max(300).optional().nullable(),
  // Anti-spam
  hp_field: z.string().max(200).optional().nullable(),
  started_at: z.number().optional(),
});

type SubmitInput = z.infer<typeof submitSchema>;

function calcularPontuacao(input: SubmitInput): number {
  let s = 0;

  const papelScore: Record<SubmitInput["papel"], number> = {
    owner_partner: 3,
    manager_decision_maker: 2,
    team_member_no_final_decision: 0,
    other: 0,
  };
  s += papelScore[input.papel];

  const conversasScore: Record<SubmitInput["conversas_dia"], number> = {
    up_to_10: 0,
    from_11_to_30: 1,
    from_31_to_60: 2,
    more_than_60: 3,
    unknown: 0,
  };
  s += conversasScore[input.conversas_dia];

  const problemaScore: Record<SubmitInput["problema_principal"], number> = {
    delayed_response_busy_store: 2,
    price_request_then_disappears: 2,
    messages_outside_business_hours: 2,
    no_customer_recontact: 3,
    repetitive_questions: 2,
    wants_to_scale_without_overload: 2,
  };
  s += problemaScore[input.problema_principal];

  const faturamentoScore: Record<SubmitInput["faturamento"], number> = {
    up_to_30k: 0,
    from_30k_to_50k: 1,
    from_50k_to_100k: 3,
    from_100k_to_300k: 4,
    above_300k: 5,
    prefer_not_to_say: 1,
  };
  s += faturamentoScore[input.faturamento];

  const investimentoScore: Record<SubmitInput["investimento"], number> = {
    ready_if_value_is_clear: 4,
    wants_to_see_first: 3,
    needs_other_decision_maker: 1,
    above_current_budget: 0,
  };
  s += investimentoScore[input.investimento];

  return s;
}

function classificar(score: number): string {
  if (score >= 12) return "contato_prioritario";
  if (score >= 7) return "contato_potencial";
  return "contato_acompanhamento";
}

export const submitLeadForm = createServerFn({ method: "POST" })
  .inputValidator((data) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    if (data.hp_field && data.hp_field.trim() !== "") {
      return { ok: true as const, id: "hp" };
    }
    if (data.started_at && Date.now() - data.started_at < 1500) {
      return { ok: true as const, id: "fast" };
    }

    const ip =
      getRequestHeader("cf-connecting-ip") ??
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
      null;
    const userAgent = getRequestHeader("user-agent") ?? null;

    const pontuacao = calcularPontuacao(data);
    const classificacao = classificar(pontuacao);

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: inserted, error } = await supabaseAdmin
      .from("contatos")
      .insert({
        nome: data.nome,
        whatsapp: data.whatsapp,
        loja: data.loja && data.loja !== "" ? data.loja : null,
        email: data.email && data.email !== "" ? data.email : null,
        papel: data.papel,
        conversas_dia: data.conversas_dia,
        faturamento: data.faturamento,
        problema_principal: data.problema_principal,
        investimento: data.investimento,
        consentimento: data.consentimento,
        pontuacao,
        lead_classification: classificacao,
        utm_source: data.utm_source ?? null,
        utm_medium: data.utm_medium ?? null,
        utm_campaign: data.utm_campaign ?? null,
        utm_content: data.utm_content ?? null,
        utm_term: data.utm_term ?? null,
        fbclid: data.fbclid ?? null,
        gclid: data.gclid ?? null,
        referrer: data.referrer ?? null,
        user_agent: userAgent,
        ip,
        landing_path: data.landing_path ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[submitLeadForm] insert error", error);
      throw new Error("Não foi possível salvar. Tente novamente.");
    }

    const webhookUrl = process.env.WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: inserted?.id,
            pontuacao,
            lead_score: pontuacao,
            lead_classification: classificacao,
            decision_authority: data.papel,
            daily_conversations_range: data.conversas_dia,
            current_situation: data.problema_principal,
            monthly_revenue_range: data.faturamento,
            investment_readiness: data.investimento,
            ...data,
            ip,
            user_agent: userAgent,
          }),
        });
      } catch (e) {
        console.error("[submitLeadForm] webhook error", e);
      }
    }

    return { ok: true as const, id: inserted?.id ?? null };
  });
