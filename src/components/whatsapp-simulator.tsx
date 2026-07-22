import { useState, useEffect } from "react";
import { CheckCheck, Send, Sparkles, Smartphone, ShieldCheck, Zap } from "lucide-react";

type Scenario = {
  id: string;
  title: string;
  badge: string;
  messages: {
    sender: "customer" | "ai" | "system";
    text: string;
    time: string;
    tag?: string;
  }[];
};

const SCENARIOS: Scenario[] = [
  {
    id: "preco-estoque",
    title: "1. Consulta de Preço & Estoque",
    badge: "Alta Conversão",
    messages: [
      {
        sender: "customer",
        text: "Oi! Tem iPhone 15 Pro Max 256GB Titânio Natural? Qual o menor valor à vista no Pix?",
        time: "14:32",
      },
      {
        sender: "ai",
        text: "Olá! 👋 Temos sim em estoque lacrado com 1 ano de garantia Apple! 📲✨\n\nÀ vista no Pix sai por R$ 6.490 com película de privacidade de brinde. Ou 18x de R$ 412 no cartão.\n\nQuer garantir o seu com retirada hoje na loja ou prefere entrega por motoboy express?",
        time: "14:32",
        tag: "Resposta Instantânea (2s)",
      },
      {
        sender: "customer",
        text: "Tenho um iPhone 13 Pro 128gb, vocês pegam na troca?",
        time: "14:33",
      },
      {
        sender: "ai",
        text: "Com certeza! Pegamos seu 13 Pro na troca! 🔄\n\nSe a bateria estiver acima de 85% e sem marcas graves, avaliamos entre R$ 2.800 e R$ 3.100 para abate direto.\n\nVou transferir agora para o vendedor Lucas finalizar sua avaliação presencial/motoboy. Qual seu nome?",
        time: "14:33",
        tag: "Cliente Pronto para Comprar",
      },
      {
        sender: "system",
        text: "🟢 Atendimento transferido com sucesso para Lucas (Vendedor Responsável). Cliente pronto para fechar.",
        time: "14:33",
      },
    ],
  },
  {
    id: "madrugada",
    title: "2. Atendimento Fora do Horário (01:45h)",
    badge: "Venda Noturna",
    messages: [
      {
        sender: "customer",
        text: "Boa noite! Vocês ainda entregam amanhã cedo? Preciso urgente de um iPhone 14 128gb meia-noite.",
        time: "01:45",
      },
      {
        sender: "ai",
        text: "Boa noite! 🌙 Nossa loja física abre às 09:00, mas já consigo deixar seu pedido reservado e separado no estoque agora mesmo! 📦\n\nO iPhone 14 128GB Meia-Noite está R$ 3.890 no Pix ou R$ 4.290 em 12x.\n\nDeixa seu nome e bairro que às 08:30 nosso motoboy já sai com o seu aparelho!",
        time: "01:45",
        tag: "Atendimento 24h Ativo",
      },
      {
        sender: "customer",
        text: "Top! Sou o Marcelo de Moema. Pode reservar no Pix que amanhã cedo pago!",
        time: "01:46",
      },
      {
        sender: "system",
        text: "🎉 Venda noturna pré-fechada. Cliente reservado e dados coletados sem gastar horário de equipe.",
        time: "01:46",
      },
    ],
  },
  {
    id: "reteste-leads",
    title: "3. Reteste Automático de Clientes Antigos",
    badge: "Recuperação de Vendas",
    messages: [
      {
        sender: "ai",
        text: "Oi Matheus! Tudo bem? 🙋‍♂️\n\nSemana passada você consultou o iPhone 15 128GB aqui com a gente. Chegou um lote novo hoje com desconto exclusivo de R$ 300 para fechar até às 18h!\n\nAinda tem interesse em garantir o seu?",
        time: "10:15",
        tag: "Follow-up Automático",
      },
      {
        sender: "customer",
        text: "Caramba, que coincidencia! Tava quase comprando em outra loja. Qual o valor final com esse desconto?",
        time: "10:17",
      },
      {
        sender: "ai",
        text: "De R$ 4.790 caiu para R$ 4.490 à vista! 🚀 E mantive a capa antichoque de brinde.\n\nPosso separar para você buscar hoje?",
        time: "10:17",
        tag: "Venda para Cliente Antigo",
      },
    ],
  },
];

export function WhatsappSimulator() {
  const [activeScenarioId, setActiveScenarioId] = useState<string>("preco-estoque");
  const [visibleMessagesCount, setVisibleMessagesCount] = useState<number>(1);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const scenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];

  useEffect(() => {
    setVisibleMessagesCount(1);
    setIsTyping(true);

    const timer1 = setTimeout(() => {
      setIsTyping(false);
      setVisibleMessagesCount(2);
    }, 800);

    const timer2 = setTimeout(() => {
      setVisibleMessagesCount(3);
    }, 1800);

    const timer3 = setTimeout(() => {
      setIsTyping(true);
    }, 2400);

    const timer4 = setTimeout(() => {
      setIsTyping(false);
      setVisibleMessagesCount(scenario.messages.length);
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [activeScenarioId, scenario.messages.length]);

  return (
    <div className="w-full rounded-2xl border border-[#E2DFD7] bg-[#FAF8F5] p-4 shadow-xl sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#10B981]/10 px-3 py-1 text-xs font-semibold text-[#047857]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Simulador em Tempo Real</span>
          </div>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-[#1A1A1A] sm:text-2xl">
            Veja como a Salomão AI atende seus clientes no WhatsApp
          </h3>
          <p className="mt-1 text-sm text-[#666666]">
            Clique nas situações reais abaixo para ver a IA negociando modelos, trocas e parcelamentos de forma humana.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-[#4B5563]">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#10B981] animate-pulse" />
          <span>Atendimento 100% Humano e Rápido</span>
        </div>
      </div>

      {/* Tabs / Scenarios */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible scrollbar-none">
        {SCENARIOS.map((s) => {
          const active = s.id === activeScenarioId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveScenarioId(s.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                active
                  ? "bg-[#1A1A1A] text-white shadow-md"
                  : "bg-white text-[#4A4D4A] border border-[#E5E2DC] hover:border-[#1A1A1A] hover:bg-[#F2EFF8]"
              }`}
            >
              <span>{s.title}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  active ? "bg-[#10B981] text-white" : "bg-[#EFECE6] text-[#555]"
                }`}
              >
                {s.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mockup iPhone Container */}
      <div className="mx-auto max-w-md overflow-hidden rounded-[32px] border-[6px] border-[#1A1A1A] bg-[#E5DDD5] shadow-2xl">
        {/* WhatsApp Header */}
        <div className="flex items-center justify-between bg-[#075E54] px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] font-bold text-white shadow">
                S
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#075E54] bg-[#25D366]" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Salomão AI • Atendimento da Loja</p>
              <p className="text-[11px] text-[#DCF8C6]">online • responde na hora</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[10px] uppercase font-semibold tracking-wider">Verificado Meta</span>
          </div>
        </div>

        {/* WhatsApp Chat Area */}
        <div className="min-h-[380px] space-y-3 bg-[#E5DDD5] p-4 text-xs">
          {scenario.messages.slice(0, visibleMessagesCount).map((m, i) => {
            if (m.sender === "system") {
              return (
                <div
                  key={i}
                  className="mx-auto my-2 max-w-[90%] rounded-lg bg-[#FFF9C4] px-3 py-2 text-center text-[11px] font-medium text-[#5D4037] shadow-sm animate-fade-in"
                >
                  {m.text}
                </div>
              );
            }

            const isAi = m.sender === "ai";
            return (
              <div
                key={i}
                className={`flex flex-col ${isAi ? "items-start" : "items-end"} animate-fade-in`}
              >
                <div
                  className={`relative max-w-[85%] rounded-xl px-3.5 py-2.5 shadow-sm ${
                    isAi
                      ? "rounded-tl-none bg-white text-[#111827]"
                      : "rounded-tr-none bg-[#DCF8C6] text-[#050505]"
                  }`}
                >
                  {m.tag && (
                    <span className="mb-1.5 inline-block rounded bg-[#10B981]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#047857]">
                      {m.tag}
                    </span>
                  )}
                  <p className="whitespace-pre-line text-xs leading-relaxed">{m.text}</p>
                  <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-[#888]">
                    <span>{m.time}</span>
                    {!isAi && <CheckCheck className="h-3 w-3 text-[#34B7F1]" />}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-1.5 rounded-xl rounded-tl-none bg-white px-3 py-2 text-[11px] text-[#666] shadow-sm w-fit">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#10B981]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#10B981] [animation-delay:0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#10B981] [animation-delay:0.4s]" />
              <span className="ml-1 text-[10px] text-[#888]">Salomão AI digitando...</span>
            </div>
          )}
        </div>

        {/* Input Bar Mock */}
        <div className="flex items-center gap-2 bg-[#F0F0F0] px-3 py-2.5 border-t border-[#DDD]">
          <input
            type="text"
            readOnly
            value="Digite uma mensagem..."
            className="flex-1 rounded-full bg-white px-3 py-1.5 text-xs text-gray-400 outline-none border border-gray-300"
          />
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#075E54] text-white">
            <Send className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-center text-xs font-medium text-[#555]">
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-[#10B981]" />
          <span>Responde em 2 a 5 segundos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Smartphone className="h-4 w-4 text-[#10B981]" />
          <span>Avalia aparelho usado na troca</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-[#10B981]" />
          <span>Entrega o cliente pronto pro seu vendedor</span>
        </div>
      </div>
    </div>
  );
}
