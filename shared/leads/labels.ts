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
};

export const FATURAMENTO_LABELS: Record<string, string> = {
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

export const GESTAO_ESTOQUE_LABELS: Record<string, string> = {
  excel_drive: "Planilha Excel / Google Drive",
  erp_system: "Sistema ERP ou Gestão de Loja",
  pdf_catalog: "Tabela em PDF / Foto no WhatsApp",
  whatsapp_head: "Pergunto no balcão / Na memória",
};

export const CLASSIFICATION_LABELS: Record<string, string> = {
  contato_prioritario: "Contato prioritário",
  contato_potencial: "Contato com potencial",
  contato_acompanhamento: "Contato de acompanhamento",
};

export function labelize(map: Record<string, string>, value: string): string {
  return map[value] ?? value;
}
