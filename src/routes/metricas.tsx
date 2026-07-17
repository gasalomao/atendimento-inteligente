import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";

export const Route = createFileRoute("/metricas")({
  head: () => ({
    meta: [
      { title: "Métricas · Salomão AI" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MetricasPage,
});

/* ─── Types ──────────────────────────────────────────────────────────── */
type Metrics = {
  period_days: number;
  generated_at: string;
  totals: Record<string, number>;
  conversion: Record<string, number>;
  timing: {
    avg_time_per_question_ms: Record<string, number>;
    avg_total_form_ms: number;
    median_total_form_ms: number;
  };
  daily: { day: string; unique_visitors: number; page_views: number; leads: number }[];
  utm_breakdown: { key: string; unique_visitors: number; leads: number }[];
  geo_country: { key: string; unique_visitors: number }[];
  geo_city: { key: string; unique_visitors: number }[];
  device_type: Record<string, number>;
  lead_classification: Record<string, number>;
  visitors: VisitorJourney[];
};

type VisitorJourney = {
  visitor_id: string;
  first_seen: string;
  last_seen: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  device: string;
  city: string;
  country: string;
  events: Array<{ type: string; time: string; path?: string; meta?: any }>;
  lead: {
    id: string;
    nome: string;
    email?: string;
    whatsapp: string;
    lead_classification: string;
    pontuacao: number;
    created_at: string;
    form_answers: Record<string, any>;
  } | null;
};

const QUESTION_LABELS: Record<string, string> = {
  "step1_contact": "Etapa 1: Dados de Contato",
  "papel": "P1: Qual é o seu papel na loja?",
  "conversas_dia": "P2: Quantas novas conversas chegam por dia?",
  "problema_principal": "P3: Qual situação mais acontece hoje?",
  "faturamento": "P4: Faturamento mensal da loja",
  "investimento": "P5: Momento para investir R$ 1.500/mês",
};

const OPTION_LABELS: Record<string, string> = {
  // papel
  "owner_partner": "Proprietário ou sócio",
  "manager_decision_maker": "Gerente / Participa das decisões",
  "team_member_no_final_decision": "Membro da equipe (sem decisão final)",
  "other": "Outro",
  
  // conversas_dia
  "up_to_10": "Até 10 novas conversas/dia",
  "from_11_to_30": "11 a 30 novas conversas/dia",
  "from_31_to_60": "31 a 60 novas conversas/dia",
  "more_than_60": "Mais de 60 novas conversas/dia",
  "unknown": "Não sabe ao certo",
  
  // problema_principal
  "delayed_response_busy_store": "Demora ao responder com a loja cheia",
  "price_request_then_disappears": "Cliente pede preço e some",
  "messages_outside_business_hours": "Mensagens fora de hora acumulam",
  "no_customer_recontact": "Falta recontacto com quem não comprou",
  "repetitive_questions": "Vendedores repetindo mesmas respostas",
  "wants_to_scale_without_overload": "Quer escalar sem sobrecarregar equipe",

  // faturamento
  "up_to_30k": "Até R$ 30 mil",
  "from_30k_to_50k": "De R$ 30 mil a R$ 50 mil",
  "from_50k_to_100k": "De R$ 50 mil a R$ 100 mil",
  "from_100k_to_300k": "De R$ 100 mil a R$ 300 mil",
  "above_300k": "Acima de R$ 300 mil",
  "prefer_not_to_say": "Prefere não dizer",

  // investimento
  "ready_if_value_is_clear": "Posso investir se o valor/benefício for claro",
  "wants_to_see_first": "Quero ver como funciona primeiro",
  "needs_other_decision_maker": "Preciso falar com outro decisor",
  "above_current_budget": "Acima do orçamento atual",
};

function getQuestionLabel(key: string): string {
  return QUESTION_LABELS[key] || key;
}

function translateOption(val: any): string {
  if (Array.isArray(val)) {
    return val.map(v => OPTION_LABELS[v] || String(v)).join(", ");
  }
  return OPTION_LABELS[val] || String(val);
}

const PASS = "30741852";
const TOKEN_KEY = "sai_metrics_token";
const AUTH_KEY = "sai_metrics_auth";

/* ─── Main ───────────────────────────────────────────────────────────── */
function MetricasPage() {
  const [auth, setAuth] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(AUTH_KEY) === "1";
  });
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pw === PASS) {
      setAuth(true);
      setPwError(false);
      try {
        window.sessionStorage.setItem(AUTH_KEY, "1");
        window.localStorage.setItem(TOKEN_KEY, pw); // Guarda o token digitado
      } catch {}
    } else {
      setPwError(true);
    }
  }

  if (!auth) {
    return <PasswordGate pw={pw} setPw={setPw} error={pwError} onSubmit={handleLogin} />;
  }

  return <Dashboard />;
}

/* ─── Password Gate ──────────────────────────────────────────────────── */
function PasswordGate({
  pw, setPw, error, onSubmit,
}: {
  pw: string;
  setPw: (v: string) => void;
  error: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0D12] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-[360px] rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl"
      >
        <div className="mx-auto mb-6 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-500/20">
          S
        </div>
        <h1 className="text-center text-lg font-semibold text-white">Acesso restrito</h1>
        <p className="mt-1 text-center text-sm text-white/50">
          Digite a senha para ver as métricas
        </p>
        <div className="mt-6">
          <input
            type="password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); }}
            placeholder="Senha"
            autoFocus
            className={`w-full rounded-lg border bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all focus:ring-2 ${
              error
                ? "border-red-500/60 focus:ring-red-500/30"
                : "border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20"
            }`}
          />
          {error && (
            <p className="mt-2 text-xs text-red-400">Senha incorreta. Tente novamente.</p>
          )}
        </div>
        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 active:scale-[0.98]"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────────── */
function Dashboard() {
  const [token] = useState(() => {
    if (typeof window === "undefined") return PASS;
    const p = new URLSearchParams(window.location.search).get("token");
    return p || window.localStorage.getItem(TOKEN_KEY) || PASS;
  });
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"geral" | "visitantes">("geral");
  const [selectedVisitors, setSelectedVisitors] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/metrics?token=${encodeURIComponent(token)}&days=${days}`);
      if (!res.ok) throw new Error(res.status === 401 ? "Senha incorreta" : `Erro ${res.status}`);
      const j = (await res.json()) as Metrics;
      setData(j);
      setSelectedVisitors(new Set()); // Reset selection on load
      try { window.localStorage.setItem(TOKEN_KEY, token); } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [token, days]);

  useEffect(() => {
    if (token) void load();
  }, [days, load]);

  const handleDelete = async () => {
    const isSelective = selectedVisitors.size > 0;
    const msg = isSelective 
      ? `ATENÇÃO: Você está prestes a apagar ${selectedVisitors.size} visitante(s) selecionado(s) e seus leads.\n\nPara confirmar, digite a senha das métricas:`
      : `ATENÇÃO: Isso apagará TODOS os eventos e LEADS do banco de dados.\n\nPara confirmar, digite a senha das métricas:`;
      
    const pw = prompt(msg);
    if (pw !== PASS) {
      if (pw !== null) alert("Senha incorreta");
      return;
    }
    try {
      const body = isSelective ? JSON.stringify({ visitor_ids: Array.from(selectedVisitors) }) : undefined;
      const res = await fetch(`/api/metrics?token=${encodeURIComponent(pw)}`, { 
        method: "DELETE",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body,
      });
      if (!res.ok) throw new Error("Erro ao apagar");
      alert(isSelective ? "Visitantes selecionados apagados com sucesso!" : "Todos os dados foram apagados com sucesso!");
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D12] font-sans text-white">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0B0D12]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-xs font-bold text-white">
                S
              </div>
              <h1 className="text-base font-semibold tracking-tight">Métricas</h1>
            </div>
            
            <nav className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setActiveTab("geral")}
                className={`rounded-md px-3 py-1.5 text-sm transition-all ${activeTab === "geral" ? "bg-white/10 font-medium text-white" : "text-white/50 hover:text-white/80"}`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => setActiveTab("visitantes")}
                className={`rounded-md px-3 py-1.5 text-sm transition-all ${activeTab === "visitantes" ? "bg-white/10 font-medium text-white" : "text-white/50 hover:text-white/80"}`}
              >
                Visitantes e Jornadas
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
            >
              <option value={1}>Hoje</option>
              <option value={7}>7 dias</option>
              <option value={14}>14 dias</option>
              <option value={30}>30 dias</option>
              <option value={90}>90 dias</option>
              <option value={365}>365 dias</option>
            </select>
            <button
              onClick={load}
              disabled={loading}
              className="rounded-lg bg-emerald-500/90 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-emerald-500 active:scale-[0.97] disabled:opacity-50"
            >
              {loading ? "Carregando…" : "Atualizar"}
            </button>
            
            <button
              onClick={handleDelete}
              title="Zerar Dados"
              className="ml-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300 active:scale-[0.97]"
            >
              🗑️
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-5 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex sm:hidden gap-2 border-b border-white/10 pb-4">
            <button
              onClick={() => setActiveTab("geral")}
              className={`rounded-md px-3 py-1.5 text-sm transition-all flex-1 ${activeTab === "geral" ? "bg-white/10 font-medium text-white" : "text-white/50 bg-white/[0.02]"}`}
            >
              Geral
            </button>
            <button
              onClick={() => setActiveTab("visitantes")}
              className={`rounded-md px-3 py-1.5 text-sm transition-all flex-1 ${activeTab === "visitantes" ? "bg-white/10 font-medium text-white" : "text-white/50 bg-white/[0.02]"}`}
            >
              Visitantes
            </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {!data && !error && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/[0.04] text-2xl animate-pulse">📊</div>
            <p className="mt-4 text-sm text-white/40">
              Carregando métricas...
            </p>
          </div>
        )}

        {data && activeTab === "geral" && <MetricsDashboard data={data} />}
        {data && activeTab === "visitantes" && (
          <VisitorsDashboard 
            data={data} 
            selectedVisitors={selectedVisitors} 
            setSelectedVisitors={setSelectedVisitors} 
          />
        )}
      </main>
    </div>
  );
}

/* ─── Visitors Dashboard ─────────────────────────────────────────────── */
function VisitorsDashboard({ 
  data, 
  selectedVisitors, 
  setSelectedVisitors 
}: { 
  data: Metrics;
  selectedVisitors: Set<string>;
  setSelectedVisitors: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const [expandedVisitor, setExpandedVisitor] = useState<string | null>(null);
  
  if (!data.visitors || data.visitors.length === 0) {
    return <p className="py-20 text-center text-white/40">Nenhum visitante registrado nesse período.</p>;
  }

  const allSelected = data.visitors.length > 0 && selectedVisitors.size === data.visitors.length;
  const toggleAll = () => {
    if (allSelected) {
      setSelectedVisitors(new Set());
    } else {
      setSelectedVisitors(new Set(data.visitors.map(v => v.visitor_id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedVisitors);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedVisitors(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white/90">Pessoa por Pessoa (Últimos {data.visitors.length})</h2>
        {selectedVisitors.size > 0 && (
          <span className="text-xs text-white/50">{selectedVisitors.size} selecionados (use a lixeira no topo para apagar)</span>
        )}
      </div>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40 items-center">
          <div>
            <input 
              type="checkbox" 
              checked={allSelected} 
              onChange={toggleAll}
              className="rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/30"
            />
          </div>
          <div>Pessoa / Lead</div>
          <div>Último Acesso</div>
          <div>Origem (UTM)</div>
          <div>Local/Disp.</div>
          <div className="text-right">Ações</div>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {data.visitors.map((v) => (
            <div key={v.visitor_id} className="flex flex-col">
              <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] items-center gap-4 px-4 py-3 text-sm transition-colors hover:bg-white/[0.02]">
                <div>
                  <input 
                    type="checkbox" 
                    checked={selectedVisitors.has(v.visitor_id)}
                    onChange={() => toggleOne(v.visitor_id)}
                    className="rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/30"
                  />
                </div>
                <div className="flex items-center gap-3 truncate">
                  {v.lead ? (
                    <>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                        ⭐
                      </div>
                      <div className="truncate">
                        <p className="font-medium text-emerald-400 truncate">{v.lead.nome}</p>
                        <p className="text-xs text-white/40 truncate">{v.lead.whatsapp}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/30">
                        👤
                      </div>
                      <div className="truncate">
                        <p className="text-white/70">Visitante Anônimo</p>
                        <p className="text-xs text-white/30 font-mono truncate" title={v.visitor_id}>
                          {v.visitor_id.slice(0, 8)}...
                        </p>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="text-xs text-white/60">
                  {formatDay(v.last_seen)} às {new Date(v.last_seen).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div className="truncate text-xs text-white/50">
                  {v.utm_source ? (
                    <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-blue-400 border border-blue-500/20">
                      {v.utm_source} {v.utm_campaign ? `/ ${v.utm_campaign}` : ""}
                    </span>
                  ) : v.referrer ? (
                    <span className="truncate" title={v.referrer}>{v.referrer.replace(/^https?:\/\//, '')}</span>
                  ) : (
                    <span className="text-white/20">Direto / Sem origem</span>
                  )}
                </div>

                <div className="text-xs text-white/50 truncate">
                  {v.city}, {v.country} <br/> {v.device}
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={() => setExpandedVisitor(expandedVisitor === v.visitor_id ? null : v.visitor_id)}
                    className="rounded bg-white/[0.06] px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    {expandedVisitor === v.visitor_id ? "Fechar" : "Ver Jornada"}
                  </button>
                </div>
              </div>

              {/* Expansion Panel */}
              {expandedVisitor === v.visitor_id && (
                <div className="border-t border-white/[0.04] bg-[#080A0E] p-6 text-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Timeline */}
                    <div>
                      <h3 className="mb-4 font-semibold text-white/80">Linha do Tempo (Eventos)</h3>
                      <div className="space-y-4 border-l-2 border-white/10 ml-2 pl-4">
                        {v.events.map((evt, idx) => {
                          let label = evt.type;
                          let detail = "";
                          let color = "bg-white/20";
                          let dotColor = "bg-white/30";
                          
                          if (evt.type === "page_view") { label = "Acessou a página"; color = "bg-blue-500/20 text-blue-300"; dotColor = "bg-blue-400"; }
                          if (evt.type === "form_view") { label = "Viu o formulário"; color = "bg-purple-500/20 text-purple-300"; dotColor = "bg-purple-400"; }
                          if (evt.type === "form_start") { label = "Começou o formulário"; color = "bg-amber-500/20 text-amber-300"; dotColor = "bg-amber-400"; }
                          if (evt.type === "form_step_complete") { 
                            label = "Preencheu etapa"; 
                            color = "bg-slate-500/20 text-slate-300";
                            dotColor = "bg-slate-400";
                            if (evt.meta?.question) detail = `(${getQuestionLabel(evt.meta.question)} · Tempo: ${formatMs(evt.meta.duration_ms)})`;
                          }
                          if (evt.type === "form_submit_success") { label = "Enviou formulário com Sucesso!"; color = "bg-emerald-500/20 text-emerald-300 font-bold"; dotColor = "bg-emerald-400"; }
                          
                          return (
                            <div key={idx} className="relative">
                              <div className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${dotColor} ring-4 ring-[#080A0E]`} />
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] font-mono text-white/40">
                                  {new Date(evt.time).toLocaleTimeString('pt-BR')}
                                </span>
                                <div>
                                  <span className={`rounded px-1.5 py-0.5 text-xs ${color}`}>{label}</span>
                                </div>
                                {detail && <span className="text-xs text-white/50 mt-1">{detail}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Respostas do Lead (se houver) */}
                    <div>
                      {v.lead ? (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                          <h3 className="mb-4 font-semibold text-emerald-400 flex items-center gap-2">
                            <span>✅ Respostas Preenchidas</span>
                            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs">Score: {v.lead.pontuacao}</span>
                          </h3>
                          
                          <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-3 gap-2 border-b border-white/5 pb-2">
                              <span className="text-white/40">Nome</span>
                              <span className="col-span-2 text-white/90">{v.lead.nome}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b border-white/5 pb-2">
                              <span className="text-white/40">WhatsApp</span>
                              <span className="col-span-2 text-white/90">{v.lead.whatsapp}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b border-white/5 pb-2">
                              <span className="text-white/40">E-mail</span>
                              <span className="col-span-2 text-white/90">{v.lead.email || "-"}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b border-white/5 pb-2">
                              <span className="text-white/40">Cargo/Papel</span>
                              <span className="col-span-2 text-white/90">{translateOption(v.lead.form_answers?.papel)}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b border-white/5 pb-2">
                              <span className="text-white/40">Faturamento</span>
                              <span className="col-span-2 text-white/90">{translateOption(v.lead.form_answers?.faturamento)}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b border-white/5 pb-2">
                              <span className="text-white/40">Conversas/dia</span>
                              <span className="col-span-2 text-white/90">{translateOption(v.lead.form_answers?.conversas_dia)}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b border-white/5 pb-2">
                              <span className="text-white/40">Investimento</span>
                              <span className="col-span-2 text-white/90">{translateOption(v.lead.form_answers?.investimento)}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <span className="text-white/40">Problemas</span>
                              <span className="col-span-2 text-white/90">
                                {v.lead.form_answers?.problema_principal
                                  ? translateOption(v.lead.form_answers.problema_principal)
                                  : "-"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
                          <p className="text-sm text-white/40">Este visitante não completou o formulário ou não virou lead.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard Content ──────────────────────────────────────────────── */
function MetricsDashboard({ data }: { data: Metrics }) {
  const maxDailyVisitors = useMemo(
    () => Math.max(...data.daily.map((d) => d.unique_visitors), 1),
    [data.daily]
  );

  const totalDevices = useMemo(
    () => Object.values(data.device_type).reduce((s, n) => s + n, 0) || 1,
    [data.device_type]
  );

  return (
    <div className="space-y-6">
      {/* ── KPIs Principais ──────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi icon="👁" label="Visitantes únicos" value={data.totals.unique_visitors} color="emerald" />
        <Kpi icon="📄" label="Visualizações" value={data.totals.page_views} color="blue" />
        <Kpi icon="📝" label="Formulários iniciados" value={data.totals.form_starts} color="amber" />
        <Kpi icon="✅" label="Leads salvos" value={data.totals.leads_saved} color="purple" />
      </section>

      {/* ── Funil de Conversão ────────────────────────────── */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Kpi icon="👀" label="Visualiz. formulário" value={data.totals.form_views} color="slate" small />
        <FunnelKpi label="View → Início" value={data.conversion.view_to_start} />
        <FunnelKpi label="Início → Envio" value={data.conversion.start_to_submit} />
        <FunnelKpi label="Visitante → Lead" value={data.conversion.visitor_to_lead} highlight />
      </section>

      {/* ── Evolução Diária (bar chart via CSS) ─────────── */}
      <Card title="📈 Evolução diária" subtitle={`Últimos ${data.period_days} dias`}>
        {data.daily.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/30">Nenhum dado no período</p>
        ) : (
          <div className="space-y-1">
            <div className="mb-3 flex gap-4 text-[10px] uppercase tracking-wider text-white/30">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" /> Visitantes</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-blue-500" /> Page Views</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-purple-500" /> Leads</span>
            </div>
            {data.daily.map((r) => (
              <div key={r.day} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.03]">
                <span className="w-[72px] shrink-0 text-xs text-white/40 tabular-nums">
                  {formatDay(r.day)}
                </span>
                <div className="flex flex-1 gap-1">
                  <div
                    className="h-5 rounded-sm bg-emerald-500/80 transition-all"
                    style={{ width: `${(r.unique_visitors / maxDailyVisitors) * 100}%`, minWidth: r.unique_visitors ? "4px" : 0 }}
                  />
                </div>
                <span className="w-[50px] text-right text-xs tabular-nums text-white/60">{r.unique_visitors}</span>
                <span className="w-[50px] text-right text-xs tabular-nums text-blue-400/70">{r.page_views}</span>
                <span className="w-[40px] text-right text-xs tabular-nums text-purple-400/70">{r.leads}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* ── Origens UTM ──────────────────────────────────── */}
        <Card title="🔗 Origem de tráfego" subtitle="utm_source / medium / campaign">
          {data.utm_breakdown.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/30">Nenhuma origem rastreada</p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              <div className="grid grid-cols-[1fr_80px_50px_60px] gap-2 pb-2 text-[10px] uppercase tracking-wider text-white/30">
                <span>Origem</span>
                <span className="text-right">Visitantes</span>
                <span className="text-right">Leads</span>
                <span className="text-right">Taxa (Conv.)</span>
              </div>
              {data.utm_breakdown.map((r) => {
                const conv = r.unique_visitors > 0 ? Math.round((r.leads / r.unique_visitors) * 100) : 0;
                return (
                <div key={r.key} className="grid grid-cols-[1fr_80px_50px_60px] gap-2 py-2.5 text-xs">
                  <span className="truncate text-white/70" title={r.key}>{r.key}</span>
                  <span className="text-right tabular-nums text-white/50">{r.unique_visitors}</span>
                  <span className="text-right tabular-nums font-medium text-emerald-400">{r.leads}</span>
                  <span className="text-right tabular-nums text-amber-400">{conv}%</span>
                </div>
              )})}
            </div>
          )}
        </Card>

        {/* ── Dispositivos ─────────────────────────────────── */}
        <Card title="📱 Dispositivos">
          {Object.keys(data.device_type).length === 0 ? (
            <p className="py-6 text-center text-sm text-white/30">Sem dados</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.device_type)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const pct = Math.round((count / totalDevices) * 100);
                  return (
                    <div key={type}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 capitalize text-white/70">
                          {type === "mobile" ? "📱" : type === "desktop" ? "💻" : type === "tablet" ? "📟" : "❓"} {type}
                        </span>
                        <span className="tabular-nums text-white/50">{count} <span className="text-white/30">({pct}%)</span></span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* ── Geolocalização ───────────────────────────────── */}
        <Card title="🌍 Geolocalização — Países">
          {(!data.geo_country || data.geo_country.length === 0) ? (
            <p className="py-6 text-center text-sm text-white/30">Sem dados geográficos</p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {data.geo_country.map((r) => (
                <div key={r.key} className="flex items-center justify-between py-2.5 text-xs">
                  <span className="text-white/70">{r.key}</span>
                  <span className="tabular-nums text-white/50">{r.unique_visitors}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="📍 Geolocalização — Cidades">
          {(!data.geo_city || data.geo_city.length === 0) ? (
            <p className="py-6 text-center text-sm text-white/30">Sem dados de cidades</p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {data.geo_city.slice(0, 15).map((r) => (
                <div key={r.key} className="flex items-center justify-between py-2.5 text-xs">
                  <span className="truncate text-white/70">{r.key}</span>
                  <span className="ml-4 tabular-nums text-white/50">{r.unique_visitors}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* ── Tempo médio por pergunta ─────────────────────── */}
        <Card title="⏱ Tempo médio por pergunta">
          {(!data.timing?.avg_time_per_question_ms || Object.keys(data.timing.avg_time_per_question_ms).length === 0) ? (
            <p className="py-6 text-center text-sm text-white/30">Sem dados de tempo</p>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {Object.entries(data.timing.avg_time_per_question_ms).map(([q, ms]) => (
                <div key={q} className="flex items-center justify-between py-2.5 text-xs">
                  <span className="truncate text-white/70" title={getQuestionLabel(q)}>{getQuestionLabel(q)}</span>
                  <span className="ml-4 tabular-nums text-amber-400">{formatMs(ms)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 text-xs font-medium">
                <span className="text-white/50">Total médio</span>
                <span className="tabular-nums text-emerald-400">{formatMs(data.timing.avg_total_form_ms)}</span>
              </div>
              <div className="flex items-center justify-between py-2 text-xs">
                <span className="text-white/50">Mediana total</span>
                <span className="tabular-nums text-emerald-400/70">{formatMs(data.timing.median_total_form_ms)}</span>
              </div>
            </div>
          )}
        </Card>

        {/* ── Classificação dos leads ──────────────────────── */}
        <Card title="🏷 Classificação dos leads">
          {Object.keys(data.lead_classification).length === 0 ? (
            <p className="py-6 text-center text-sm text-white/30">Nenhum lead classificado</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.lead_classification)
                .sort(([, a], [, b]) => b - a)
                .map(([k, v]) => {
                  const total = Object.values(data.lead_classification).reduce((s, n) => s + n, 0) || 1;
                  const pct = Math.round((v / total) * 100);
                  const colorClass =
                    k === "hot" ? "from-red-500 to-orange-500" :
                    k === "warm" ? "from-amber-500 to-yellow-500" :
                    k === "cold" ? "from-blue-400 to-cyan-400" :
                    "from-slate-400 to-slate-500";
                  return (
                    <div key={k}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="capitalize text-white/70">{k}</span>
                        <span className="tabular-nums text-white/50">{v} <span className="text-white/30">({pct}%)</span></span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Resumo Geral ──────────────────────────────────── */}
      <Card title="📋 Resumo do funil completo">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs sm:grid-cols-4">
          <SummaryItem label="Total de eventos" value={data.totals.total_events} />
          <SummaryItem label="Visualiz. formulário" value={data.totals.form_views} />
          <SummaryItem label="Formulários iniciados" value={data.totals.form_starts} />
          <SummaryItem label="Submissões com sucesso" value={data.totals.form_submit_success} />
        </div>
      </Card>

      {/* ── Footer ────────────────────────────────────────── */}
      <p className="pb-8 text-center text-[11px] text-white/20">
        Atualizado em {new Date(data.generated_at).toLocaleString("pt-BR")} · Período: {data.period_days} dias
      </p>
    </div>
  );
}

/* ─── Components ─────────────────────────────────────────────────────── */
function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white/90">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[11px] text-white/30">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Kpi({ icon, label, value, color, small }: { icon: string; label: string; value: number; color: string; small?: boolean }) {
  const bg = {
    emerald: "from-emerald-500/10 to-emerald-500/[0.03] border-emerald-500/20",
    blue: "from-blue-500/10 to-blue-500/[0.03] border-blue-500/20",
    amber: "from-amber-500/10 to-amber-500/[0.03] border-amber-500/20",
    purple: "from-purple-500/10 to-purple-500/[0.03] border-purple-500/20",
    slate: "from-slate-500/10 to-slate-500/[0.03] border-slate-500/20",
  }[color] ?? "from-white/5 to-white/[0.02] border-white/10";

  return (
    <div className={`rounded-xl border bg-gradient-to-br ${bg} p-4`}>
      <div className="text-lg">{icon}</div>
      <p className="mt-2 text-[10px] uppercase tracking-wider text-white/40">{label}</p>
      <p className={`mt-1 font-semibold tabular-nums ${small ? "text-xl" : "text-2xl"}`}>{value.toLocaleString("pt-BR")}</p>
    </div>
  );
}

function FunnelKpi({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${
      highlight
        ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/[0.03]"
        : "border-white/[0.06] bg-white/[0.02]"
    }`}>
      <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${highlight ? "text-emerald-400" : "text-white/80"}`}>
        {value}%
      </p>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-white/40">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value.toLocaleString("pt-BR")}</p>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
function formatDay(iso: string): string {
  try {
    const d = new Date(iso + (iso.includes("T") ? "" : "T12:00:00"));
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}

function formatMs(ms: number): string {
  if (!ms || ms <= 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rest = Math.round(s % 60);
  return `${m}m ${rest}s`;
}
