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
  papel: z.enum(["proprietario_socio", "participa_decisao", "nao_decisor"]),
  faturamento: z.enum([
    "ate_30k",
    "30k_50k",
    "50k_100k",
    "100k_300k",
    "acima_300k",
    "prefere_nao_dizer",
  ]),
  conversas_dia: z.enum([
    "ate_10",
    "11_30",
    "31_60",
    "mais_60",
    "nao_sabe",
  ]),
  problema_principal: z.enum([
    "demora",
    "orcamento_sem_retorno",
    "sem_retomar_conversa",
    "fora_do_horario",
    "vendedores_sobrecarregados",
    "falta_organizacao",
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

function calcularPontuacao(input: z.infer<typeof submitSchema>): number {
  let s = 0;
  if (input.papel === "proprietario_socio") s += 30;
  else if (input.papel === "participa_decisao") s += 15;

  const fat: Record<string, number> = {
    ate_30k: 0,
    "30k_50k": 10,
    "50k_100k": 25,
    "100k_300k": 35,
    acima_300k: 40,
    prefere_nao_dizer: 5,
  };
  s += fat[input.faturamento] ?? 0;

  const conv: Record<string, number> = {
    ate_10: 5,
    "11_30": 12,
    "31_60": 20,
    mais_60: 25,
    nao_sabe: 5,
  };
  s += conv[input.conversas_dia] ?? 0;

  // Problema não altera score, mas fica salvo.
  return s;
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
        conversas_dia: data.conversas_dia,
        problema_principal: data.problema_principal,
        consentimento: data.consentimento,
        pontuacao,
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
    // secret para ativar. Falha silenciosa: não bloqueia o retorno ao usuário.
    const webhookUrl = process.env.WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: inserted?.id,
            pontuacao,
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
