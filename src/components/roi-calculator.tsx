import { useState } from "react";
import { DollarSign, TrendingUp, AlertTriangle, ShieldAlert } from "lucide-react";

export function RoiCalculator() {
  const [dailyMessages, setDailyMessages] = useState<number>(35);
  const [unansweredPct, setUnansweredPct] = useState<number>(30);
  const [ticketAvg, setTicketAvg] = useState<number>(3500);

  // Calculations
  const totalMonthlyMessages = dailyMessages * 30;
  const lostLeadsPerMonth = Math.round(totalMonthlyMessages * (unansweredPct / 100));
  // Estimating conservative 8% conversion rate of buyers if answered promptly
  const estimatedLostSales = Math.max(1, Math.round(lostLeadsPerMonth * 0.08));
  const lostRevenuePerMonth = estimatedLostSales * ticketAvg;
  const yearlyLostRevenue = lostRevenuePerMonth * 12;

  return (
    <div className="w-full rounded-2xl border border-[#E2DFD7] bg-white p-6 shadow-xl lg:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#EF4444]/10 px-3 py-1 text-xs font-bold text-[#DC2626]">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Calculadora de Vendas Perdidas no WhatsApp</span>
          </div>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-[#1A1A1A] sm:text-2xl">
            Quanto dinheiro sua loja está deixando de ganhar por mês?
          </h3>
          <p className="mt-1 text-sm text-[#666666]">
            Ajuste os números da sua loja abaixo e veja o impacto real no seu faturamento.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-center">
        {/* Sliders Area */}
        <div className="space-y-6 lg:col-span-7">
          {/* Slider 1 */}
          <div className="rounded-xl border border-[#EBE8E1] bg-[#FAF8F5] p-4">
            <div className="flex justify-between text-sm font-semibold text-[#1A1A1A]">
              <span>Mensagens de clientes por dia no WhatsApp:</span>
              <span className="rounded bg-[#1A1A1A] px-2 py-0.5 text-xs text-white">
                {dailyMessages} mens./dia
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={150}
              step={5}
              value={dailyMessages}
              onChange={(e) => setDailyMessages(Number(e.target.value))}
              className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#E2DFD7] accent-[#10B981]"
            />
            <div className="mt-1 flex justify-between text-[11px] text-[#777]">
              <span>10 conversas</span>
              <span>150 conversas</span>
            </div>
          </div>

          {/* Slider 2 */}
          <div className="rounded-xl border border-[#EBE8E1] bg-[#FAF8F5] p-4">
            <div className="flex justify-between text-sm font-semibold text-[#1A1A1A]">
              <span>% de mensagens com demoras ou fora do horário:</span>
              <span className="rounded bg-[#DC2626] px-2 py-0.5 text-xs text-white">
                {unansweredPct}% sem resposta na hora
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={unansweredPct}
              onChange={(e) => setUnansweredPct(Number(e.target.value))}
              className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#E2DFD7] accent-[#EF4444]"
            />
            <div className="mt-1 flex justify-between text-[11px] text-[#777]">
              <span>10% (Pouco atraso)</span>
              <span>60% (Finais de semana + loja cheia)</span>
            </div>
          </div>

          {/* Slider 3 */}
          <div className="rounded-xl border border-[#EBE8E1] bg-[#FAF8F5] p-4">
            <div className="flex justify-between text-sm font-semibold text-[#1A1A1A]">
              <span>Preço médio por venda de iPhone/Aparelho:</span>
              <span className="rounded bg-[#10B981] px-2 py-0.5 text-xs text-white">
                R$ {ticketAvg.toLocaleString("pt-BR")}
              </span>
            </div>
            <input
              type="range"
              min={1500}
              max={8000}
              step={250}
              value={ticketAvg}
              onChange={(e) => setTicketAvg(Number(e.target.value))}
              className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#E2DFD7] accent-[#10B981]"
            />
            <div className="mt-1 flex justify-between text-[11px] text-[#777]">
              <span>R$ 1.500 (Seminovos)</span>
              <span>R$ 8.000 (Linha Pro Max)</span>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex flex-col justify-between rounded-2xl bg-[#191A18] p-6 text-white lg:col-span-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#10B981]">
              <TrendingUp className="h-4 w-4" />
              <span>Diagnóstico de Faturamento da Loja</span>
            </div>

            <div className="mt-4 space-y-4">
              <div className="border-b border-white/10 pb-3">
                <span className="text-xs text-[#9CA3AF]">Clientes sem resposta na hora (por mês):</span>
                <p className="text-2xl font-extrabold text-white">
                  {lostLeadsPerMonth.toLocaleString("pt-BR")} potenciais compradores
                </p>
              </div>

              <div className="border-b border-white/10 pb-3">
                <span className="text-xs text-[#9CA3AF]">Vendas perdidas para a concorrência:</span>
                <p className="text-2xl font-extrabold text-[#F87171]">
                  ~{estimatedLostSales} iPhones / mês
                </p>
              </div>

              <div>
                <span className="text-xs text-[#9CA3AF]">Faturamento estimado deixado na mesa:</span>
                <p className="text-3xl font-black text-[#10B981] sm:text-4xl">
                  R$ {lostRevenuePerMonth.toLocaleString("pt-BR")}
                  <span className="text-xs font-normal text-white/70"> /mês</span>
                </p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  Em 1 ano: <strong className="text-white">R$ {yearlyLostRevenue.toLocaleString("pt-BR")}</strong> deixados de ganhar!
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-white/5 p-4 text-xs text-[#D1D5DB] border border-white/10">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-[#10B981]" />
              <p>
                A <strong>Salomão AI</strong> custa apenas R$ 1.500/mês. Respondendo no ato,{" "}
                <span className="text-white font-bold">1 única venda salva por mês</span> já paga 100% da mensalidade!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
