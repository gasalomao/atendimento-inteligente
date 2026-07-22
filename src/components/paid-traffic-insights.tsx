import { Flame, Target, ShieldCheck, Zap, TrendingDown, DollarSign } from "lucide-react";

export function PaidTrafficInsights() {
  return (
    <section className="py-12 lg:py-16 bg-[#FAF8F5] border-y border-[#E3E0D9]">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#10B981]/15 px-3 py-1 text-xs font-bold text-[#047857]">
            <DollarSign className="h-3.5 w-3.5" />
            <span>Como Fazer Seus Anúncios Renderem Mais Vendas</span>
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#191A18] sm:text-3xl lg:text-4xl">
            Como economizar no orçamento de anúncios e vender o dobro de iPhones
          </h2>
          <p className="mt-3 text-base text-[#5F625E] sm:text-lg">
            Pagar por anúncios no Instagram sem ter quem responda o WhatsApp na hora é rasgar dinheiro.
          </p>
        </div>

        {/* 3 Main Money Leaks */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {/* Card 1 */}
          <div className="rounded-2xl border border-[#E2DFD7] bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EF4444]/10 text-[#DC2626]">
              <TrendingDown className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#191A18]">
              1. Cliente Esperando no WhatsApp
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5F625E]">
              O cliente clica no anúncio do Instagram, abre seu WhatsApp e pergunta <em>"Preço do iPhone 15?"</em>. Se a loja leva 10 minutos para responder, o comprador clica na próxima loja do feed. Você pagou o clique e perdeu a venda.
            </p>
            <div className="mt-4 rounded-lg bg-[#FEF2F2] p-3 text-xs font-medium text-[#991B1B]">
              ⚠️ A chance de fechar cai 80% após 5 minutos sem resposta.
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-[#E2DFD7] bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F59E0B]/10 text-[#D97706]">
              <Flame className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#191A18]">
              2. Mensagens Fora do Horário da Loja
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5F625E]">
              Mais de 38% das mensagens de anúncios chegam entre 19h e 02h da manhã ou aos domingos. Sem IA, esses clientes esfriam totalmente até a segunda-feira.
            </p>
            <div className="mt-4 rounded-lg bg-[#FEF3C7] p-3 text-xs font-medium text-[#92400E]">
              🌙 A Salomão AI faz reservas de madrugada enquanto sua equipe descansa.
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-[#E2DFD7] bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10B981]/10 text-[#047857]">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#191A18]">
              3. Vendedores Sobrecarregados
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5F625E]">
              Sua equipe perde horas digitando <em>"Quais as formas de pagamento?"</em> ou <em>"Onde fica a loja?"</em>. A IA resolve o básico e entrega o comprador decidido pro vendedor.
            </p>
            <div className="mt-4 rounded-lg bg-[#ECFDF5] p-3 text-xs font-medium text-[#065F46]">
              ⚡ Seus vendedores focam 100% em fechar vendas de alto valor.
            </div>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="mt-12 rounded-2xl border border-[#E2DFD7] bg-white p-6 shadow-lg sm:p-8">
          <h3 className="text-center text-xl font-extrabold text-[#191A18] sm:text-2xl">
            Atendimento Convencional vs. Salomão AI para Lojas de iPhone
          </h3>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {/* Box Red - Traditional */}
            <div className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-5">
              <span className="font-bold text-[#991B1B]">❌ Atendimento Tradicional / Chatbot Genérico</span>
              <ul className="mt-4 space-y-3 text-xs text-[#7F1D1D]">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Tempo de resposta demorado quando a loja enche.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Menu robótico frio de opções ("Digite 1 para estoque, 2 para suporte").</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Não sabe calcular nem simular trocas de aparelhos usados.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Clientes de anúncios noturnos ficam acumulados sem resposta.</span>
                </li>
              </ul>
            </div>

            {/* Box Green - Salomão AI */}
            <div className="rounded-xl border border-[#6EE7B7] bg-[#ECFDF5] p-5">
              <span className="font-bold text-[#065F46]">✅ Salomão AI Especialista em Lojas de iPhone</span>
              <ul className="mt-4 space-y-3 text-xs text-[#064E3B]">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 shrink-0 text-[#10B981]" />
                  <span>Resposta instantânea em 2 a 5 segundos 24 horas por dia.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 shrink-0 text-[#10B981]" />
                  <span>Linguagem natural e humana igual à de um vendedor de balcão.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 shrink-0 text-[#10B981]" />
                  <span>Calcula e avalia seminovos de troca na hora com a tabela da loja.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 shrink-0 text-[#10B981]" />
                  <span>Encaminha o cliente interessado direto para o vendedor fechar.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
