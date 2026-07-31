import { z } from "zod";

export const PRIVACY_POLICY_VERSION_DEFAULT = "2026-07-01";
export const CONSENT_TEXT_VERSION_DEFAULT = "2026-07-31";

const optionalText = (max: number) => z.string().max(max).optional().nullable();

export const leadSchema = z.object({
  // ---- Contato (Etapa 3) ----
  nome: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .refine(
      (v) => v.split(/\s+/).filter((p) => p.length >= 2).length >= 2,
      "Digite seu nome completo (nome e sobrenome)."
    ),
  email: z.string().trim().min(5).max(160).email("Confira o e-mail informado."),
  loja: z.string().trim().min(2).max(120),
  cidade_uf: z.string().trim().min(2).max(120),
  whatsapp: z
    .string()
    .trim()
    .min(10, "Informe seu WhatsApp com DDD.")
    .max(20)
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Informe seu WhatsApp com DDD."),

  // ---- Etapa 1: contexto leve ----
  canal_venda: z.enum(["physical", "online", "both"]).optional(),
  canais_oportunidade: z
    .preprocess(
      (v) => (Array.isArray(v) ? v : typeof v === "string" && v.length > 0 ? v.split(",") : v),
      z
        .array(
          z.enum(["whatsapp", "instagram", "site", "telefone", "marketplace", "outros"])
        )
        .min(1, "Escolha ao menos um canal.")
        .max(6)
        .optional()
    ),
  problema_principal: z
    .preprocess(
      (v) => (Array.isArray(v) ? v : typeof v === "string" && v.length > 0 ? v.split(",") : v),
      z
        .array(
          z.enum([
            "demora",
            "sem_followup",
            "contatos_desorganizados",
            "leads_baixa_qualidade",
            "dificuldade_medir",
            "outro",
          ])
        )
        .min(1, "Escolha ao menos uma opção.")
        .max(6)
    ),

  // ---- Etapa 2: operação ----
  contatos_dia: z.enum([
    "up_to_10",
    "from_11_to_30",
    "from_31_to_80",
    "more_than_80",
    "nao_acompanho",
  ]),
  respondentes: z.enum(["one", "two_three", "four_eight", "more_than_eight"]).optional(),
  registro_contatos: z.enum(["none", "sheet", "crm", "own_system"]).optional(),
  automatizar_primeiro: z.enum([
    "triagem",
    "orcamento",
    "followup",
    "agendamento",
    "posvenda",
    "integracao",
  ]).optional(),

  // ---- Etapa 3: intenção ----
  faturamento: z.enum([
    "up_to_40k",
    "from_40k_to_60k",
    "from_60k_to_100k",
    "from_100k_to_300k",
    "above_300k",
  ]),
  prazo: z.enum(["now", "until_30d", "from_1_to_3m", "researching"]),
  decisao: z.enum(["me", "me_partner", "manager", "team"]),

  // ---- Consentimentos separados (não pré-marcados) ----
  consent_email: z.literal(true, {
    errorMap: () => ({
      message: "Precisamos da autorização por e-mail para enviar o diagnóstico.",
    }),
  }),
  consent_whatsapp: z.boolean().optional().default(false),
  consent_sms: z.boolean().optional().default(false),
  consent_marketing: z.boolean().optional().default(false),
  consent_text_version: z.string().max(40).optional(),

  // Compatibilidade com registros/integrações antigas.
  consentimento: z.literal(true).optional(),

  // ---- Rastreio ----
  landing_variant: optionalText(40),
  utm_source: optionalText(200),
  utm_medium: optionalText(200),
  utm_campaign: optionalText(200),
  utm_content: optionalText(200),
  utm_term: optionalText(200),
  fbclid: optionalText(400),
  gclid: optionalText(400),
  referrer: optionalText(500),
  landing_path: optionalText(300),

  // ---- Antispam / instrumentação ----
  hp_field: optionalText(200),
  started_at: z.number().optional(),
  event_id: z.string().uuid().optional(),
  privacy_policy_version: z.string().max(40).optional(),
  total_time_ms: z.number().int().nonnegative().max(3_600_000).optional(),
  step_times_ms: z.record(z.string(), z.number().int().nonnegative().max(3_600_000)).optional(),
  visitor_id: z.string().max(64).optional(),
  session_id: z.string().max(64).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
