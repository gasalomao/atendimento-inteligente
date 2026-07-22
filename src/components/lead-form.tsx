import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, MessageCircle } from "lucide-react";
import { formatBRPhone, isValidBRPhone, onlyDigits } from "@/lib/phone-mask";
import {
  captureAndPersistTracking,
  getPersistedTracking,
  track,
  trackOnce,
} from "@/lib/tracking";
import { trackEvent } from "@/lib/analytics";
import { PrivacyDialog } from "./privacy-dialog";

type Step1 = {
  nome: string;
  whatsapp: string;
  loja: string;
};

type Papel =
  | ""
  | "owner_partner"
  | "manager_decision_maker"
  | "team_member_no_final_decision"
  | "other";
type Conversas =
  | ""
  | "up_to_10"
  | "from_11_to_30"
  | "from_31_to_60"
  | "more_than_60"
  | "unknown";
type Problema =
  | "delayed_response_busy_store"
  | "price_request_then_disappears"
  | "messages_outside_business_hours"
  | "no_customer_recontact"
  | "repetitive_questions"
  | "wants_to_scale_without_overload";
type Faturamento =
  | ""
  | "up_to_30k"
  | "from_30k_to_50k"
  | "from_50k_to_100k"
  | "from_100k_to_300k"
  | "above_300k"
  | "prefer_not_to_say";
type Investimento =
  | ""
  | "ready_if_value_is_clear"
  | "wants_to_see_first"
  | "needs_other_decision_maker"
  | "above_current_budget";

type Step2 = {
  problema_principal: Problema | "";
  conversas_dia: Conversas;
  papel: Papel;
  faturamento: Faturamento;
  investimento: Investimento;
  consentimento: boolean;
};

type Step2Field = keyof Omit<Step2, "consentimento">;
type Step2Value = Exclude<
  Papel | Conversas | Problema | Faturamento | Investimento,
  ""
>;

type QuestionOption = { v: Step2Value; t: string };
type Step2Question = {
  field: Step2Field;
  question: string;
  description?: string;
  options: QuestionOption[];
  errorMessage: string;
};

type Errors = Partial<Record<string, string>>;

const fieldBase =
  "block w-full rounded-[10px] bg-white px-4 py-3.5 text-[16px] leading-6 text-[#191A18] placeholder:text-[#777A75] border border-[#CFCBC3] outline-none transition-[border-color,box-shadow] duration-150 hover:border-[#A9A59D] focus:border-[#207A50] focus:ring-[3px] focus:ring-[#207A50]/[0.14] disabled:opacity-60 min-h-[52px]";
const fieldError =
  "border-[#B42318] bg-[#FEF8F7] focus:border-[#B42318] focus:ring-[#B42318]/20";

function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[14px] font-[600] text-[#191A18]"
    >
      {children}
    </label>
  );
}

function ErrorText({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-[13px] font-[500] text-[#B42318]">
      {msg}
    </p>
  );
}

const cardOptionBase =
  "w-full text-left rounded-[10px] border border-[#D6D2CA] bg-white px-4 py-3.5 text-[16px] leading-[1.4] text-[#2B2D29] min-h-[52px] transition-[border-color,background-color] duration-150 hover:border-[#9E9A92] hover:bg-[#FAF9F7] focus:outline-none focus-visible:border-[#207A50] focus-visible:ring-[3px] focus-visible:ring-[#207A50]/[0.14] flex items-center gap-3";
const cardOptionActive =
  "border-[#207A50] bg-[#EDF6F0] hover:border-[#207A50] hover:bg-[#EDF6F0] font-[600] text-[#191A18]";

const STEP2_QUESTIONS: Step2Question[] = [
  {
    field: "problema_principal",
    question: "Qual situação mais atrapalha seu atendimento hoje?",
    options: [
      {
        v: "delayed_response_busy_store",
        t: "Demoramos a responder quando a loja está cheia",
      },
      {
        v: "price_request_then_disappears",
        t: "Clientes pedem preço e depois somem",
      },
      {
        v: "messages_outside_business_hours",
        t: "Mensagens ficam para o dia seguinte",
      },
      {
        v: "no_customer_recontact",
        t: "Ninguém retoma quem não comprou",
      },
      {
        v: "repetitive_questions",
        t: "Os vendedores repetem as mesmas perguntas",
      },
      {
        v: "wants_to_scale_without_overload",
        t: "Queremos atender mais sem sobrecarregar a equipe",
      },
    ],
    errorMessage: "Escolha a opção que mais combina com sua realidade.",
  },
  {
    field: "conversas_dia",
    question: "Quantas novas conversas chegam por dia no WhatsApp?",
    description: "Pode ser uma estimativa.",
    options: [
      { v: "up_to_10", t: "Até 10" },
      { v: "from_11_to_30", t: "De 11 a 30" },
      { v: "from_31_to_60", t: "De 31 a 60" },
      { v: "more_than_60", t: "Mais de 60" },
      { v: "unknown", t: "Não sei ao certo" },
    ],
    errorMessage: "Escolha a opção que mais combina com sua realidade.",
  },
  {
    field: "papel",
    question: "Qual é o seu papel na loja?",
    options: [
      { v: "owner_partner", t: "Sou proprietário ou sócio" },
      {
        v: "manager_decision_maker",
        t: "Sou gerente e participo das decisões",
      },
      {
        v: "team_member_no_final_decision",
        t: "Trabalho na equipe, mas não decido sozinho",
      },
      { v: "other", t: "Outro" },
    ],
    errorMessage: "Escolha a opção que mais combina com sua realidade.",
  },
  {
    field: "faturamento",
    question: "Qual faixa mais se aproxima do faturamento mensal da loja?",
    description:
      "Não precisa informar o valor exato. Isso nos ajuda a preparar uma demonstração adequada à realidade da loja.",
    options: [
      { v: "up_to_30k", t: "Até R$ 30 mil" },
      { v: "from_30k_to_50k", t: "De R$ 30 mil a R$ 50 mil" },
      { v: "from_50k_to_100k", t: "De R$ 50 mil a R$ 100 mil" },
      { v: "from_100k_to_300k", t: "De R$ 100 mil a R$ 300 mil" },
      { v: "above_300k", t: "Acima de R$ 300 mil" },
      { v: "prefer_not_to_say", t: "Prefiro falar sobre isso depois" },
    ],
    errorMessage: "Escolha a opção que mais combina com sua realidade.",
  },
  {
    field: "investimento",
    question:
      "Se a demonstração fizer sentido, como você vê um investimento de R$ 1.500 por mês?",
    description:
      "Essa resposta ajuda a conduzir a conversa de acordo com o momento da loja.",
    options: [
      {
        v: "ready_if_value_is_clear",
        t: "Consigo investir se enxergar benefício",
      },
      {
        v: "wants_to_see_first",
        t: "Quero entender melhor antes de avaliar",
      },
      {
        v: "needs_other_decision_maker",
        t: "Preciso conversar com outro responsável",
      },
      {
        v: "above_current_budget",
        t: "Hoje não cabe no orçamento",
      },
    ],
    errorMessage: "Escolha a opção que mais combina com sua realidade.",
  },
];

const HONEYPOT_STYLE: React.CSSProperties = {
  position: "absolute",
  left: "-10000px",
  top: "auto",
  width: "1px",
  height: "1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
  padding: 0,
  margin: -1,
};

function OptionCard({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${cardOptionBase} ${active ? cardOptionActive : ""}`}
    >
      <span
        aria-hidden
        className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border transition-colors ${
          active ? "border-[#207A50]" : "border-[#C8C4BB]"
        }`}
      >
        <span
          className={`h-[8px] w-[8px] rounded-full transition-opacity ${
            active ? "bg-[#207A50] opacity-100" : "opacity-0"
          }`}
        />
      </span>
      <span className="flex-1">{children}</span>
    </button>
  );
}

export function LeadForm({
  id = "formulario",
  onStepChange,
}: {
  id?: string;
  onStepChange?: (step: 1 | 2) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [q, setQ] = useState(0);
  const [started, setStarted] = useState(false);
  const startedAtRef = useRef<number>(0);
  const questionStartRef = useRef<number>(0);
  const stepTimesRef = useRef<Record<string, number>>({});
  const hpRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const successFiredRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const [step1, setStep1] = useState<Step1>({
    nome: "",
    whatsapp: "",
    loja: "",
  });
  const [step2, setStep2] = useState<Step2>({
    problema_principal: "",
    conversas_dia: "",
    papel: "",
    faturamento: "",
    investimento: "",
    consentimento: true,
  });
  const [errors, setErrors] = useState<Errors>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const nomeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            trackOnce("form_view");
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    captureAndPersistTracking();
  }, []);

  function markStarted() {
    if (!started) {
      setStarted(true);
      startedAtRef.current = Date.now();
      questionStartRef.current = Date.now();
      track("form_start");
    }
  }

  function scrollToContainer() {
    if (!containerRef.current) return;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    containerRef.current.scrollIntoView({
      behavior: isReduced ? "auto" : "smooth",
      block: "start",
    });
  }

  function validateContact(): boolean {
    const e: Errors = {};
    if (!step1.nome.trim()) {
      e.nome = "Digite seu nome.";
    }
    if (!step1.whatsapp.trim()) {
      e.whatsapp = "Digite seu WhatsApp.";
    } else if (!isValidBRPhone(step1.whatsapp)) {
      e.whatsapp = "Confira o número e inclua o DDD.";
    }
    if (!step1.loja.trim()) {
      e.loja = "Digite o nome ou Instagram da loja.";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const first = Object.keys(e)[0];
      document.getElementById(`f-${first}`)?.focus();
      return false;
    }
    return true;
  }

  function currentField(): Step2Field {
    return STEP2_QUESTIONS[q].field;
  }

  function currentValue(): Step2[Step2Field] {
    return step2[currentField()];
  }

  function onSelect(field: Step2Field, value: Step2Value) {
    setStep2((s) => ({ ...s, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function isAnswered(field: Step2Field): boolean {
    return Boolean(step2[field]);
  }

  function onStep1Continue() {
    markStarted();
    if (!validateContact()) return;
    setStep(2);
    onStepChange?.(2);
    setQ(0);
    questionStartRef.current = Date.now();
    setTimeout(scrollToContainer, 30);
  }

  function onQuestionContinue() {
    const questionObj = STEP2_QUESTIONS[q];
    const field = questionObj.field;

    if (!isAnswered(field)) {
      setErrors({
        [field]: questionObj.errorMessage,
      });
      return;
    }

    const dur = questionStartRef.current ? Date.now() - questionStartRef.current : 0;
    if (dur > 0) {
      stepTimesRef.current[field] = dur;
      trackEvent("form_step_complete", { question: field, index: q, duration_ms: dur });
    }

    if (q < STEP2_QUESTIONS.length - 1) {
      setQ((n) => n + 1);
      setErrors({});
      questionStartRef.current = Date.now();
      setTimeout(scrollToContainer, 30);
    }
  }

  function onQuestionBack() {
    setErrors({});
    if (q > 0) {
      setQ((n) => n - 1);
      questionStartRef.current = Date.now();
      setTimeout(scrollToContainer, 30);
      return;
    }
    setStep(1);
    onStepChange?.(1);
    questionStartRef.current = Date.now();
    setTimeout(scrollToContainer, 30);
  }

  async function onFinalSubmit() {
    if (loading) return;

    const questionObj = STEP2_QUESTIONS[q];
    const field = questionObj.field;
    if (!isAnswered(field)) {
      setErrors({
        [field]: questionObj.errorMessage,
      });
      return;
    }

    if (!step2.consentimento) {
      setErrors({
        consentimento: "Confirme a autorização para receber o contato sobre sua solicitação.",
      });
      return;
    }

    setSubmitError(null);
    setLoading(true);
    track("form_submit_attempt");

    const utms = getPersistedTracking();
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: step1.nome.trim(),
          whatsapp: onlyDigits(step1.whatsapp),
          loja: step1.loja.trim(),
          email: "",
          papel: step2.papel,
          conversas_dia: step2.conversas_dia,
          problema_principal: step2.problema_principal ? [step2.problema_principal] : [],
          faturamento: step2.faturamento,
          investimento: step2.investimento,
          consentimento: true,
          utm_source: utms.utm_source,
          utm_medium: utms.utm_medium,
          utm_campaign: utms.utm_campaign,
          utm_content: utms.utm_content,
          utm_term: utms.utm_term,
          fbclid: utms.fbclid,
          gclid: utms.gclid,
          referrer: utms.referrer,
          landing_path: utms.landing_path,
          hp_field: hpRef.current?.value ?? "",
          started_at: startedAtRef.current || Date.now(),
          total_time_ms: startedAtRef.current ? Date.now() - startedAtRef.current : undefined,
          step_times_ms: { ...stepTimesRef.current },
          visitor_id: window.localStorage.getItem("sai_vid") || undefined,
          session_id: window.sessionStorage.getItem("sai_sid") || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body?.success) {
        if (!successFiredRef.current) {
          successFiredRef.current = true;
          track("generate_lead");
        }
        setSuccess(true);
        setTimeout(scrollToContainer, 30);
      } else if (res.status === 429) {
        setSubmitError(body?.message ?? "Aguarde alguns minutos antes de tentar novamente.");
      } else if (res.status === 422) {
        setSubmitError(body?.message ?? "Confira as informações preenchidas.");
      } else {
        throw new Error("erro");
      }
    } catch (err) {
      console.error(err);
      track("form_submit_error");
      setSubmitError(
        "Não foi possível enviar agora. Suas respostas foram mantidas. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleResetForm() {
    setSuccess(false);
    setStep(1);
    onStepChange?.(1);
    setQ(0);
    setStep1({ nome: "", whatsapp: "", loja: "" });
    setStep2({
      problema_principal: "",
      conversas_dia: "",
      papel: "",
      faturamento: "",
      investimento: "",
      consentimento: true,
    });
    setErrors({});
  }

  const isLastQuestion = q === STEP2_QUESTIONS.length - 1;

  return (
    <div
      id={id}
      ref={containerRef}
      className="relative mx-auto w-full scroll-mt-[76px] rounded-[14px] border border-[#DDDAD3] bg-white p-5 shadow-[0_8px_30px_rgba(25,26,24,0.06)] sm:p-8"
    >
      {/* Honeypot invisível para bots */}
      <div aria-hidden="true" style={HONEYPOT_STYLE}>
        <input ref={hpRef} id="hp_field" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {success ? (
        <SuccessState whatsapp={step1.whatsapp} onReset={handleResetForm} />
      ) : (
        <>
          {/* Form Header */}
          <div className="mb-5">
            <h2 className="text-[20px] font-[650] leading-[1.2] tracking-[-0.015em] text-[#191A18] sm:text-[22px]">
              {step === 1 ? "Veja como funcionaria na sua loja" : "Agora, sobre sua loja"}
            </h2>
            <p className="mt-1.5 text-[14px] leading-[1.5] text-[#5F625E]">
              {step === 1
                ? "Leva cerca de 1 minuto. Depois, mostramos pelo WhatsApp como esse atendimento poderia funcionar na sua loja."
                : "Escolha a opção que mais combina com sua realidade."}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-[12px] font-[600] uppercase tracking-[0.1em] text-[#7B7E78]">
              <span>
                {step === 1
                  ? "Etapa 1 de 2 · Seus dados"
                  : `Etapa 2 de 2 · Pergunta ${q + 1} de ${STEP2_QUESTIONS.length}`}
              </span>
            </div>
            <div
              className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[#E8E5DF]"
              role="progressbar"
              aria-valuenow={step === 1 ? 20 : Math.round(20 + ((q + 1) / STEP2_QUESTIONS.length) * 80)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-[#207A50] transition-[width] duration-200 ease-out"
                style={{
                  width: `${step === 1 ? 20 : Math.round(20 + ((q + 1) / STEP2_QUESTIONS.length) * 80)}%`,
                }}
              />
            </div>
          </div>

          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <Label htmlFor="f-nome">Seu nome</Label>
                <input
                  ref={nomeRef}
                  id="f-nome"
                  name="nome"
                  type="text"
                  autoComplete="name"
                  placeholder="Como podemos chamar você?"
                  value={step1.nome}
                  onFocus={markStarted}
                  onChange={(e) => {
                    setStep1((s) => ({ ...s, nome: e.target.value }));
                    if (errors.nome) setErrors((x) => ({ ...x, nome: undefined }));
                  }}
                  aria-invalid={!!errors.nome}
                  aria-describedby={errors.nome ? "err-nome" : undefined}
                  className={`${fieldBase} ${errors.nome ? fieldError : ""}`}
                />
                <ErrorText id="err-nome" msg={errors.nome} />
              </div>

              <div>
                <Label htmlFor="f-whatsapp">Seu WhatsApp</Label>
                <input
                  id="f-whatsapp"
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(11) 99999-9999"
                  value={step1.whatsapp}
                  onFocus={markStarted}
                  onChange={(e) => {
                    const formatted = formatBRPhone(e.target.value);
                    setStep1((s) => ({ ...s, whatsapp: formatted }));
                    if (errors.whatsapp) setErrors((x) => ({ ...x, whatsapp: undefined }));
                  }}
                  aria-invalid={!!errors.whatsapp}
                  aria-describedby={errors.whatsapp ? "err-whatsapp" : undefined}
                  className={`${fieldBase} ${errors.whatsapp ? fieldError : ""}`}
                />
                <ErrorText id="err-whatsapp" msg={errors.whatsapp} />
              </div>

              <div>
                <Label htmlFor="f-loja">Nome ou Instagram da loja</Label>
                <input
                  id="f-loja"
                  name="loja"
                  type="text"
                  autoComplete="organization"
                  placeholder="Ex.: Loja Prime ou @lojaprime"
                  value={step1.loja}
                  onFocus={markStarted}
                  onChange={(e) => {
                    setStep1((s) => ({ ...s, loja: e.target.value }));
                    if (errors.loja) setErrors((x) => ({ ...x, loja: undefined }));
                  }}
                  aria-invalid={!!errors.loja}
                  aria-describedby={errors.loja ? "err-loja" : undefined}
                  className={`${fieldBase} ${errors.loja ? fieldError : ""}`}
                />
                <ErrorText id="err-loja" msg={errors.loja} />
              </div>

              <button
                type="button"
                onClick={onStep1Continue}
                className="flex min-h-[52px] w-full items-center justify-center rounded-[10px] bg-[#207A50] px-5 text-[15px] font-[600] text-white transition-colors duration-150 hover:bg-[#17613E] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#207A50]/30 sm:text-[16px] active:scale-[0.99]"
              >
                Continuar
              </button>

              <p className="text-center text-[13px] text-[#5F625E]">
                Depois, são apenas 5 escolhas rápidas.
              </p>

              <p className="text-center text-[12px] text-[#777A75] leading-relaxed">
                Usaremos suas respostas somente para preparar a demonstração e falar com você sobre esta solicitação.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <QuestionBlock
                question={STEP2_QUESTIONS[q]}
                value={currentValue()}
                error={errors[currentField()]}
                onSelect={onSelect}
              />

              {isLastQuestion && (
                <div className="mt-4 pt-2 border-t border-[#E8E5DF]">
                  <label className="flex items-start gap-2.5 cursor-pointer text-[13px] leading-[1.5] text-[#30322E]">
                    <input
                      type="checkbox"
                      checked={step2.consentimento}
                      onChange={(e) => {
                        setStep2((s) => ({ ...s, consentimento: e.target.checked }));
                        if (errors.consentimento) setErrors((x) => ({ ...x, consentimento: undefined }));
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-[#CFCBC3] text-[#207A50] focus:ring-[#207A50]"
                    />
                    <span>
                      Autorizo o contato da Salomão AI pelo WhatsApp sobre esta demonstração e li a{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setPrivacyOpen(true);
                        }}
                        className="font-[600] text-[#207A50] underline hover:text-[#17613E]"
                      >
                        Política de Privacidade
                      </button>
                      .
                    </span>
                  </label>
                  <ErrorText id="err-consentimento" msg={errors.consentimento} />
                </div>
              )}

              {submitError && (
                <div
                  role="alert"
                  className="rounded-[10px] border border-[#B42318]/30 bg-[#FEF8F7] p-3 text-[14px] text-[#B42318]"
                >
                  {submitError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={onQuestionBack}
                  className="inline-flex min-h-[52px] items-center justify-center gap-1 rounded-[10px] border border-[#CFCBC3] bg-transparent px-5 text-[15px] font-[600] text-[#30322E] transition-colors duration-150 hover:bg-[#F0EEE9] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#191A18]/15 active:scale-[0.99]"
                >
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </button>
                {isLastQuestion ? (
                  <button
                    type="button"
                    onClick={onFinalSubmit}
                    disabled={loading}
                    className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-[10px] bg-[#207A50] px-5 text-[15px] font-[600] text-white transition-colors duration-150 hover:bg-[#17613E] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#207A50]/25 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.99]"
                  >
                    {loading ? "Enviando suas respostas…" : "Solicitar minha demonstração"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onQuestionContinue}
                    className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-[10px] bg-[#207A50] px-5 text-[15px] font-[600] text-white transition-colors duration-150 hover:bg-[#17613E] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#207A50]/25 active:scale-[0.99]"
                  >
                    Continuar
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />
    </div>
  );
}

function QuestionBlock({
  question,
  value,
  error,
  onSelect,
}: {
  question: Step2Question;
  value: Step2[Step2Field];
  error?: string;
  onSelect: (field: Step2Field, value: Step2Value) => void;
}) {
  return (
    <fieldset id={`q-${question.field}`} className="border-0 p-0">
      <legend className="block text-[17px] font-[600] leading-[1.35] text-[#191A18]">
        {question.question}
      </legend>
      {question.description ? (
        <p className="mt-1.5 text-[13px] leading-[1.5] text-[#5F625E]">
          {question.description}
        </p>
      ) : null}
      <div className="mt-4 grid gap-2.5" role="radiogroup">
        {question.options.map((opt) => {
          const active = value === opt.v;
          return (
            <OptionCard
              key={opt.v}
              active={active}
              onClick={() => onSelect(question.field, opt.v)}
            >
              {opt.t}
            </OptionCard>
          );
        })}
      </div>
      <ErrorText id={`err-${question.field}`} msg={error} />
    </fieldset>
  );
}

function SuccessState({
  whatsapp,
  onReset,
}: {
  whatsapp: string;
  onReset: () => void;
}) {
  const digits = onlyDigits(whatsapp);
  const defaultText = encodeURIComponent(
    "Olá! Acabei de solicitar uma demonstração do atendimento com IA para minha loja de iPhone."
  );
  const waHref = digits ? `https://wa.me/55${digits}?text=${defaultText}` : `https://wa.me/?text=${defaultText}`;

  function onWhatsappClick() {
    track("whatsapp_click");
  }

  return (
    <div className="py-2 text-center" aria-live="polite">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF6F0] text-[#207A50]">
        <CheckCircle2 className="h-8 w-8" strokeWidth={2.25} />
      </div>
      <h3 className="mt-4 text-[22px] font-[650] leading-[1.25] tracking-[-0.02em] text-[#191A18] sm:text-[24px]">
        Recebemos suas respostas.
      </h3>
      <p className="mx-auto mt-2 max-w-[420px] text-[15px] leading-[1.6] text-[#5F625E]">
        Vamos preparar um exemplo com base na rotina da sua loja e falar com você pelo WhatsApp informado.
      </p>

      <div className="mt-6 pt-4 border-t border-[#E8E5DF] max-w-[420px] mx-auto">
        <p className="text-[14px] font-[600] text-[#191A18]">Quer adiantar a conversa?</p>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onWhatsappClick}
          className="mt-3 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#25D366] px-5 text-[15px] font-[600] text-white transition-colors duration-150 hover:bg-[#1EBE5A] active:scale-[0.99]"
        >
          <MessageCircle className="h-5 w-5" />
          Falar com a Salomão AI agora
        </a>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={onReset}
          className="text-[13px] text-[#5F625E] underline hover:text-[#191A18]"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
}
