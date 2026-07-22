import { useState } from "react";
import { ChevronDown, HelpCircle, ShieldCheck } from "lucide-react";

type FAQItem = {
  q: string;
  a: string;
};

const FAQS: FAQItem[] = [
  {
    q: "A Salomão AI vai substituir os meus vendedores?",
    a: "Jamais! A IA funciona como a melhor pré-vendedora da sua loja. Ela responde em segundos os primeiros contatos do WhatsApp, tira dúvidas de modelos e trocas, qualifica a intenção de compra e passa o cliente pré-fechado com todos os dados para o seu vendedor apenas emitir o pedido e fechar a venda.",
  },
  {
    q: "Como a IA aprende os preços e o estoque da minha loja?",
    a: "Nós conectamos a IA com a sua planilha de estoque (Excel/Google Drive) ou com o seu sistema ERP/Catálogo. Sempre que um preço ou aparelho muda, a IA se atualiza na hora sem que você precise reprogramar nada.",
  },
  {
    q: "A IA sabe avaliar iPhone usado na troca (trade-in)?",
    a: "Sim! Configuramos a régua de avaliação da sua loja (modelo, capacidade em GB e saúde da bateria). A IA pergunta a saúde da bateria e conservação ao cliente, calcula a estimativa de abate e envia a proposta inicial para o seu vendedor aprovar.",
  },
  {
    q: "Existe algum risco de ter o WhatsApp da loja banido?",
    a: "Zero risco! Utilizamos conexões oficiais e seguras dentro de todas as diretrizes de compliance da Meta. O seu número principal continua 100% protegido.",
  },
  {
    q: "E se o cliente quiser falar com um ser humano?",
    a: "A qualquer momento, se o cliente solicitar um humano ou se a IA detectar uma negociação complexa fora do padrão, ela notifica o vendedor e transfere o atendimento de forma totalmente imperceptível.",
  },
  {
    q: "Quanto tempo leva a implementação?",
    a: "Após a coleta de informações da sua loja (tabela de preços e regras de troca), nossa equipe faz o setup completo em até 48 horas.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  function toggle(idx: number) {
    setOpenIndex(openIndex === idx ? null : idx);
  }

  return (
    <section className="py-12 lg:py-16 bg-white border-t border-[#E3E0D9]">
      <div className="mx-auto max-w-[920px] px-5 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#1A1A1A]/10 px-3 py-1 text-xs font-bold text-[#1A1A1A]">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Tire Suas Dúvidas</span>
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#191A18] sm:text-3xl">
            Perguntas Frequentes sobre a Salomão AI
          </h2>
          <p className="mt-2 text-base text-[#5F625E]">
            Tudo o que você precisa saber antes de transformar o atendimento da sua loja.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-xl border border-[#E5E2DC] bg-[#FAF8F5] transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center justify-between p-4 text-left font-semibold text-[#191A18] sm:p-5 hover:bg-[#F2EFF8]"
                >
                  <span className="text-sm sm:text-base">{item.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#777] transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#10B981]" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-[#E8E5DF] bg-white p-4 text-xs leading-relaxed text-[#5F625E] sm:p-5 sm:text-sm">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl bg-[#FAF8F5] border border-[#E2DFD7] p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#10B981]/15 text-[#047857]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-lg font-bold text-[#191A18]">
            Quer ver como a Salomão AI ficaria na sua loja?
          </h3>
          <p className="mt-1 text-xs text-[#5F625E] sm:text-sm">
            Preencha nosso diagnóstico rápido em 1 minuto e montaremos um demonstrativo exclusivo para seu estoque.
          </p>
          <a
            href="#formulario"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#207A50] px-6 py-3 text-sm font-bold text-white shadow hover:bg-[#17613E] transition-all"
          >
            Fazer Diagnóstico Gratuito Agora
          </a>
        </div>
      </div>
    </section>
  );
}
