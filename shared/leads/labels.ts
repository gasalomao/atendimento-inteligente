export const PAPEL_LABELS: Record<string, string> = {
  owner_partner: "Sou proprietário ou sócio",
  manager_decision_maker: "Sou gerente e participo das decisões",
  team_member_no_final_decision:
    "Trabalho na equipe, mas não decido sozinho",
  other: "Outro",
};

export const CONVERSAS_LABELS: Record<string, string> = {
  up_to_10: "Até 10 conversas por dia",
  from_11_to_30: "De 11 a 30 conversas por dia",
  from_31_to_60: "De 31 a 60 conversas por dia",
  more_than_60: "Mais de 60 conversas por dia",
  unknown: "Não sei ao certo",
};

export const FATURAMENTO_LABELS: Record<string, string> = {
  // Escala atual (começa em R$ 40 mil)
  from_40k_to_60k: "De R$ 40 mil a R$ 60 mil por mês",
  from_60k_to_100k: "De R$ 60 mil a R$ 100 mil por mês",
  // Escala antiga (registros já salvos)
  up_to_30k: "Até R$ 30 mil por mês",
  from_30k_to_50k: "De R$ 30 mil a R$ 50 mil por mês",
  from_50k_to_100k: "De R$ 50 mil a R$ 100 mil por mês",
  from_100k_to_300k: "De R$ 100 mil a R$ 300 mil por mês",
  above_300k: "Acima de R$ 300 mil por mês",
  prefer_not_to_say: "Prefere falar sobre isso depois",
};

export const INVESTIMENTO_LABELS: Record<string, string> = {
  ready_if_value_is_clear:
    "Consigo investir esse valor se enxergar benefício para a loja",
  wants_to_see_first: "Quero avaliar depois de ver como funciona",
  needs_other_decision_maker: "Preciso conversar com outro responsável",
  above_current_budget: "Esse valor não cabe no orçamento hoje",
};

// ---------- Diagnóstico em 3 etapas ----------

export const CANAL_VENDA_LABELS: Record<string, string> = {
  physical: "Loja física",
  online: "Online",
  both: "Loja física e online",
};

export const CANAIS_OPORTUNIDADE_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  site: "Site",
  telefone: "Telefone",
  marketplace: "Marketplace",
  outros: "Outros canais",
};

export const ATRAPALHO_LABELS: Record<string, string> = {
  demora: "Demora para responder",
  sem_followup: "Falta de follow-up",
  contatos_desorganizados: "Contatos desorganizados",
  leads_baixa_qualidade: "Leads de baixa qualidade",
  dificuldade_medir: "Dificuldade de medir os resultados",
  outro: "Outro",
};

export const CONTATOS_DIA_LABELS: Record<string, string> = {
  up_to_10: "Até 10 novos contatos por dia",
  from_11_to_30: "De 11 a 30 novos contatos por dia",
  from_31_to_80: "De 31 a 80 novos contatos por dia",
  more_than_80: "Mais de 80 novos contatos por dia",
  nao_acompanho: "Não acompanho esse número",
};

export const RESPONDENTES_LABELS: Record<string, string> = {
  one: "1 pessoa responde",
  two_three: "2 a 3 pessoas respondem",
  four_eight: "4 a 8 pessoas respondem",
  more_than_eight: "Mais de 8 pessoas respondem",
};

export const REGISTRO_LABELS: Record<string, string> = {
  none: "Não registramos",
  sheet: "Planilha",
  crm: "CRM",
  own_system: "Sistema próprio",
};

export const AUTOMATIZAR_LABELS: Record<string, string> = {
  triagem: "Triagem inicial",
  orcamento: "Orçamento",
  followup: "Follow-up",
  agendamento: "Agendamento",
  posvenda: "Pós-venda",
  integracao: "Integração completa",
};

export const PRAZO_LABELS: Record<string, string> = {
  now: "Agora",
  until_30d: "Até 30 dias",
  from_1_to_3m: "De 1 a 3 meses",
  researching: "Está pesquisando",
};

export const DECISAO_LABELS: Record<string, string> = {
  me: "Eu decido",
  me_partner: "Eu e um sócio",
  manager: "Gerente",
  team: "Equipe",
};

// Classificação antiga (registros já salvos)
export const CLASSIFICATION_LABELS: Record<string, string> = {
  contato_prioritario: "Contato prioritário",
  contato_potencial: "Contato com potencial",
  contato_acompanhamento: "Contato de acompanhamento",
  // Nova escala 0–100
  exploratorio: "Exploratório",
  em_avaliacao: "Em avaliação",
  qualificado: "Qualificado",
  prioridade_alta: "Prioridade alta",
};

export const SITUACAO_LABELS: Record<string, string> = {
  delayed_response_busy_store:
    "Demoramos para responder quando a loja está cheia",
  price_request_then_disappears:
    "Muitos clientes pedem preço e depois desaparecem",
  messages_outside_business_hours:
    "Mensagens chegam fora do horário e ficam para o dia seguinte",
  no_customer_recontact:
    "Falta alguém para voltar a falar com quem não comprou",
  repetitive_questions:
    "Os vendedores repetem as mesmas perguntas o dia todo",
  wants_to_scale_without_overload:
    "O atendimento funciona, mas queremos atender mais sem sobrecarregar a equipe",
  ...ATRAPALHO_LABELS,
};

export function labelize(map: Record<string, string>, value: unknown): string {
  const key = typeof value === "string" ? value : "";
  if (!key) return "—";
  return key
    .split(",")
    .map((part) => map[part.trim()] ?? part.trim())
    .filter(Boolean)
    .join(" · ");
}
