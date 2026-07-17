import { z } from "zod";

export const PRIVACY_POLICY_VERSION_DEFAULT = "2026-07-01";

export const leadSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .refine(
      (v) => v.split(/\s+/).filter((p) => p.length >= 2).length >= 2,
      "Digite seu nome completo (nome e sobrenome)."
    ),
  whatsapp: z.string().trim().min(10).max(20),
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
  problema_principal: z
    .preprocess(
      (v) => (Array.isArray(v) ? v : typeof v === "string" && v.length > 0 ? v.split(",") : v),
      z
        .array(
          z.enum([
            "delayed_response_busy_store",
            "price_request_then_disappears",
            "messages_outside_business_hours",
            "no_customer_recontact",
            "repetitive_questions",
            "wants_to_scale_without_overload",
          ])
        )
        .min(1, "Escolha ao menos uma opção.")
        .max(6)
    ),
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
  utm_source: z.string().max(200).optional().nullable(),
  utm_medium: z.string().max(200).optional().nullable(),
  utm_campaign: z.string().max(200).optional().nullable(),
  utm_content: z.string().max(200).optional().nullable(),
  utm_term: z.string().max(200).optional().nullable(),
  fbclid: z.string().max(400).optional().nullable(),
  gclid: z.string().max(400).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
  landing_path: z.string().max(300).optional().nullable(),
  hp_field: z.string().max(200).optional().nullable(),
  started_at: z.number().optional(),
  event_id: z.string().uuid().optional(),
  privacy_policy_version: z.string().max(40).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
