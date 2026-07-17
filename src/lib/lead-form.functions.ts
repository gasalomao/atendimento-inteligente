import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

// Schema alinhado com os cards da etapa 2. Valores estáveis para não quebrar
// integrações/pontuação futuras.
const submitSchema = z.object({
  nome: z.string().trim().min(2, "Digite seu nome.").max(120),
  whatsapp: z
    .string()
    .trim()
    .min(10, "Confira o número e inclua o DDD.")
    .max(20),
  loja: z.string().trim().min(2, "Digite o nome ou Instagram da loja.").max(120),
  email: z
    .string()
    .trim()
    .max(160)
    .email("E-mail inválido.")
    .optional()
    .or(z.literal("")),
  papel: z.enum([
    "proprietario_socio",
    "participa_decisao",
    "precisa_conversar",
    "nao_decisor",
  ]),
  faturamento: z.enum([
    "ate_30k",
    "30k_50k",
    "50k_100k",
    "100k_300k",
    "acima_300k",
    "prefere_nao_dizer",
  ]),
  problema_principal: z.enum([
    "demora",
    "orcamento_sem_retorno",
    "sem_retomar_conversa",
    "fora_do_horario",
    "vendedores_sobrecarregados",
    "falta_organizacao",
  ]),
  investimento: z.enum([
    "consegue_investir",
    "avaliar_depois",
    "precisa_conversar",
    "acima_orcamento",
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
  hp_field: z.string().max(200).optional().nullable(), // honeypot: precisa ficar vazio
  started_at: z.number().optional(), // timestamp ms de quando o form_start foi disparado
});

type SubmitInput = z.infer<typeof submitSchema>;

// Regras conforme especificação do produto.
function calcularPontuacao(input: SubmitInput): number {
  let s = 0;

  const papelScore: Record<SubmitInput["papel"], number> = {
    proprietario_socio: 3,
    participa_decisao: 2,
    precisa_conversar: 1,
    nao_decisor: 0,
  };
  s += papelScore[input.papel];

  const faturamentoScore: Record<SubmitInput["faturamento"], number> = {
    ate_30k: 0,
    "30k_50k": 1,
    "50k_100k": 3,
    "100k_300k": 4,
    acima_300k: 5,
    prefere_nao_dizer: 1,
  };
  s += faturamentoScore[input.faturamento];

  // Todas as dificuldades pontuam igual: +2.
  s += 2;

  const investimentoScore: Record<SubmitInput["investimento"], number> = {
    consegue_investir: 4,
    avaliar_depois: 3,
    precisa_conversar: 1,
    acima_orcamento: 0,
  };
  s += investimentoScore[input.investimento];

  return s;
}

function classificar(score: number): string {
  if (score >= 10) return "contato_prioritario";
  if (score >= 6) return "contato_potencial";
  return "contato_acompanhamento";
}

export const submitLeadForm = createServerFn({ method: "POST" })
  .inputValidator((data) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    // Honeypot: se o campo escondido foi preenchido, é bot.
    if (data.hp_field && data.hp_field.trim() !== "") {
      return { ok: true as const, id: "hp" };
    }
    // Tempo mínimo entre abrir o form e enviar (bots respondem instantâneo).
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
        loja: data.loja,
        email: data.email && data.email !== "" ? data.email : null,
        papel: data.papel,
        faturamento: data.faturamento,
        problema_principal: data.problema_principal,
        // Nova coluna adicionada por migração; campo texto livre com slug estável.
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

    // Webhook opcional para n8n / CRM. Configurar variável WEBHOOK_URL como
    // secret para ativar. Falha silenciosa: não bloqueia o retorno ao usuário
    // — o contato já está salvo no banco.
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
            // Aliases em inglês (slugs estáveis para o CRM/n8n).
            decision_authority: data.papel,
            monthly_revenue_range: data.faturamento,
            main_service_problem: data.problema_principal,
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
