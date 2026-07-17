import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/metricas")({
  head: () => ({
    meta: [
      { title: "Métricas · Salomão AI" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MetricasPage,
});

type Metrics = {
  period_days: number;
  generated_at: string;
  totals: Record<string, number>;
  conversion: Record<string, number>;
  daily: { day: string; unique_visitors: number; page_views: number; leads: number }[];
  utm_breakdown: { key: string; unique_visitors: number; leads: number }[];
  lead_classification: Record<string, number>;
};

function MetricasPage() {
  const [token, setToken] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const p = new URLSearchParams(window.location.search).get("token");
    return p || window.localStorage.getItem("metrics_token") || "";
  });
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/metrics?token=${encodeURIComponent(token)}&days=${days}`);
      if (!res.ok) throw new Error(res.status === 401 ? "Token inválido" : `Erro ${res.status}`);
      const j = (await res.json()) as Metrics;
      setData(j);
      try {
        window.localStorage.setItem("metrics_token", token);
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  return (
    <div className="min-h-screen bg-[#F7F5F1] p-6 font-sans text-[#191A18]">
      <div className="mx-auto max-w-[1100px]">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-[650] tracking-tight">Métricas do site</h1>
            <p className="mt-1 text-sm text-[#5F625E]">
              Visitantes únicos por aparelho, funil e origens de tráfego.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Token de acesso"
              className="rounded-md border border-[#DDDAD3] bg-white px-3 py-2 text-sm"
            />
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-md border border-[#DDDAD3] bg-white px-3 py-2 text-sm"
            >
              <option value={7}>7 dias</option>
              <option value={14}>14 dias</option>
              <option value={30}>30 dias</option>
              <option value={90}>90 dias</option>
            </select>
            <button
              onClick={load}
              className="rounded-md bg-[#191A18] px-4 py-2 text-sm font-medium text-white"
            >
              {loading ? "..." : "Atualizar"}
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-8">
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi label="Visitantes únicos" value={data.totals.unique_visitors} />
              <Kpi label="Page views" value={data.totals.page_views} />
              <Kpi label="Formulários iniciados" value={data.totals.form_starts} />
              <Kpi label="Leads salvos" value={data.totals.leads_saved} />
            </section>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Kpi label="View → Início" value={`${data.conversion.view_to_start}%`} muted />
              <Kpi label="Início → Envio" value={`${data.conversion.start_to_submit}%`} muted />
              <Kpi label="Visitante → Lead" value={`${data.conversion.visitor_to_lead}%`} muted />
            </section>

            <section className="rounded-lg border border-[#DDDAD3] bg-white p-5">
              <h2 className="mb-4 text-lg font-[600]">Evolução diária</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead className="text-left text-[#7B7E78]">
                    <tr>
                      <th className="py-2">Data</th>
                      <th>Visitantes</th>
                      <th>Page views</th>
                      <th>Leads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.daily.map((r) => (
                      <tr key={r.day} className="border-t border-[#F0EEE9]">
                        <td className="py-2">{r.day}</td>
                        <td>{r.unique_visitors}</td>
                        <td>{r.page_views}</td>
                        <td>{r.leads}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-lg border border-[#DDDAD3] bg-white p-5">
              <h2 className="mb-4 text-lg font-[600]">Origem (utm_source / medium / campaign)</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead className="text-left text-[#7B7E78]">
                    <tr>
                      <th className="py-2">Origem</th>
                      <th>Visitantes únicos</th>
                      <th>Leads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.utm_breakdown.map((r) => (
                      <tr key={r.key} className="border-t border-[#F0EEE9]">
                        <td className="py-2">{r.key}</td>
                        <td>{r.unique_visitors}</td>
                        <td>{r.leads}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-lg border border-[#DDDAD3] bg-white p-5">
              <h2 className="mb-4 text-lg font-[600]">Classificação dos leads</h2>
              <ul className="text-sm">
                {Object.entries(data.lead_classification).map(([k, v]) => (
                  <li key={k} className="flex justify-between border-t border-[#F0EEE9] py-2 first:border-0">
                    <span className="capitalize">{k}</span>
                    <span className="font-[600]">{v}</span>
                  </li>
                ))}
              </ul>
            </section>

            <p className="text-xs text-[#7B7E78]">
              Atualizado em {new Date(data.generated_at).toLocaleString("pt-BR")} · Período: {data.period_days} dias
            </p>
          </div>
        )}

        {!data && !error && (
          <p className="text-sm text-[#7B7E78]">
            Cole seu token de acesso e clique em "Atualizar". Você também pode acessar direto por{" "}
            <code className="rounded bg-white px-1 py-0.5">/metricas?token=SEU_TOKEN</code>.
          </p>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, muted }: { label: string; value: number | string; muted?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-4 ${muted ? "border-[#E3E0D9] bg-[#F0EEE9]" : "border-[#DDDAD3] bg-white"}`}
    >
      <p className="text-xs uppercase tracking-wider text-[#7B7E78]">{label}</p>
      <p className="mt-1 text-2xl font-[650]">{value}</p>
    </div>
  );
}
