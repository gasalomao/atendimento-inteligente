import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, ChevronLeft, MessageCircle } from "lucide-react";
import { submitLeadForm } from "@/lib/lead-form.functions";
import { formatBRPhone, isValidBRPhone, onlyDigits } from "@/lib/phone-mask";
import {
  captureAndPersistTracking,
  getPersistedTracking,
  track,
  trackOnce,
} from "@/lib/tracking";
import { PrivacyDialog } from "./privacy-dialog";

type Step1 = {
  nome: string;
  whatsapp: string;
  loja: string;
  email: string;
};

type Papel =
  | ""
  | "owner_partner"
  | "decision_participant"
  | "needs_other_decision_maker"
  | "no_decision_authority";
type Faturamento =
  | ""
  | "up_to_30k"
  | "from_30k_to_50k"
  | "from_50k_to_100k"
  | "from_100k_to_300k"
  | "above_300k"
  | "discuss_later";
type Problema =
  | ""
  | "slow_response"
  | "price_shoppers_disappear"
  | "no_recontact_after_no_purchase"
  | "after_hours_messages"
  | "overloaded_sellers"
  | "disorganized_service";
type Investimento =
  | ""
  | "ready_if_value_is_clear"
  | "open_to_evaluate"
  | "needs_other_decision_maker"
  | "above_current_budget";

type Step2Field = keyof Pick<
  Step2,
  "papel" | "faturamento" | "problema_principal" | "investimento"
>;

type Step2Value = Exclude<
  Papel | Faturamento | Problema | Investimento,
  ""
>;

type QuestionOption = {
  v: Step2Value;
  t: string;
};

type Step2Question = {
  field: Step2Field;
  question: string;
  description?: string;
  options: QuestionOption[];
};

type Step2 = {
  papel: Papel;
  faturamento: Faturamento;
  problema_principal: Problema;
  investimento: Investimento;
  consentimento: boolean;
};

type Errors = Partial<Record<string, string>>;

const fieldBase =
  "block w-full rounded-lg bg-white px-3.5 py-3 text-[15px] leading-6 text-[#101828] placeholder:text-[#667085] border border-[#D0D5DD] outline-none transition-shadow focus:border-[#22C55E] focus:ring-4 focus:ring-[#22C55E]/20 disabled:opacity-60 min-h-[48px]";
const fieldError =
  "border-[#B42318] bg-[#FEF3F2] focus:border-[#B42318] focus:ring-[#B42318]/20";

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
      className="mb-1.5 block text-sm font-semibold text-[#101828]"
    >
      {children}
    </label>
  );
}

function ErrorText({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-[#B42318]">
      {msg}
    </p>
  );
}

const cardOptionBase =
  "w-full text-left rounded-lg border border-[#D0D5DD] bg-white px-4 py-3 text-[15px] text-[#101828] min-h-[48px] transition-colors hover:border-[#22C55E] focus:outline-none focus:border-[#22C55E] focus:ring-4 focus:ring-[#22C55E]/20";
const cardOptionActive =
  "border-[#22C55E] bg-[#F0FDF4] ring-2 ring-[#22C55E]";

const STEP2_QUESTIONS: Step2Question[] = [
  {
    field: "papel",
    question:
      "Você participa da decisão sobre novas ferramentas para a loja?",
    options: [
      { v: "owner_partner", t: "Sim, sou proprietário ou sócio" },
      { v: "decision_participant", t: "Sim, participo da decisão" },
      {
        v: "needs_other_decision_maker",
        t: "Preciso conversar com outro responsável",
      },
      { v: "no_decision_authority", t: "Não participo da decisão" },
    ],
  },
  {
    field: "faturamento",
    question: "Qual faixa representa melhor o faturamento mensal da loja?",
    description: "Não precisa informar o valor exato.",
    options: [
      { v: "up_to_30k", t: "Até R$ 30 mil" },
      { v: "from_30k_to_50k", t: "De R$ 30 mil a R$ 50 mil" },
      { v: "from_50k_to_100k", t: "De R$ 50 mil a R$ 100 mil" },
      { v: "from_100k_to_300k", t: "De R$ 100 mil a R$ 300 mil" },
      { v: "above_300k", t: "Acima de R$ 300 mil" },
      { v: "discuss_later", t: "Prefiro conversar sobre isso depois" },
    ],
  },
  {
    field: "problema_principal",
    question: "O que mais atrapalha suas vendas pelo WhatsApp hoje?",
    options: [
      { v: "slow_response", t: "Demoramos para responder" },
      {
        v: "price_shoppers_disappear",
        t: "Muitos clientes pedem preço e desaparecem",
      },
      {
        v: "no_recontact_after_no_purchase",
        t: "Ninguém volta a falar com quem não comprou",
      },
      { v: "after_hours_messages", t: "Chegam mensagens fora do horário" },
      {
        v: "overloaded_sellers",
        t: "Os vendedores ficam sobrecarregados",
      },
      { v: "disorganized_service", t: "Falta organização no atendimento" },
    ],
  },
  {
    field: "investimento",
    question:
      "Se a ferramenta fizer sentido para sua loja, como você avalia um investimento de R$ 1.500 por mês?",
    options: [
      {
        v: "ready_if_value_is_clear",
        t: "Consigo investir esse valor se enxergar resultado",
      },
      {
        v: "open_to_evaluate",
        t: "Posso avaliar esse valor depois de entender como funciona",
      },
      {
        v: "needs_other_decision_maker",
        t: "Preciso conversar com outro responsável",
      },
      {
        v: "above_current_budget",
        t: "Hoje esse valor está acima do meu orçamento",
      },
    ],
  },
];

function OptionCard({
  active,
  onClick,
  children,
  id,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${cardOptionBase} ${active ? cardOptionActive : ""}`}
    >
      {children}
    </button>
  );
}

// Estilo inline garante que o honeypot fique realmente fora do fluxo visual,
// independente de purge/reset de Tailwind — evita o bug do texto "Não preencha"
// aparecendo na tela.
const HONEYPOT_STYLE: React.CSSProperties = {
  position: "absolute",
  left: "-10000px",
  top: "auto",
  width: "1px",
  height: "1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
  padding: 0,
  margin: -1,
};

export function LeadForm({ id = "formulario" }: { id?: string }) {
  const submit = useServerFn(submitLeadForm);
  const [step, setStep] = useState<1 | 2>(1);
  const [step2Question, setStep2Question] = useState(0);
  const [started, setStarted] = useState(false);
  const startedAtRef = useRef<number>(0);
  const hpRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const successFiredRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [step1, setStep1] = useState<Step1>({
    nome: "",
    whatsapp: "",
    loja: "",
    email: "",
  });
  const [step2, setStep2] = useState<Step2>({
    papel: "",
    faturamento: "",
    problema_principal: "",
    investimento: "",
    consentimento: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // form_view (uma vez por sessão)
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
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function markStarted() {
    if (!started) {
      setStarted(true);
      startedAtRef.current = Date.now();
      track("form_start");
    }
  }

  function validateStep1(): boolean {
    const e: Errors = {};
    if (step1.nome.trim().length < 2) e.nome = "Digite seu nome.";
    if (!step1.whatsapp.trim()) e.whatsapp = "Digite seu número de WhatsApp.";
    else if (!isValidBRPhone(step1.whatsapp))
      e.whatsapp = "Confira o número e inclua o DDD.";
    if (step1.loja.trim().length < 2)
      e.loja = "Digite o nome ou Instagram da loja.";
    if (step1.email.trim() !== "") {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(step1.email.trim())) e.email = "Confira o e-mail.";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const first = Object.keys(e)[0];
      const el = document.getElementById(`f-${first}`);
      el?.focus();
      return false;
    }
    return true;
  }

  function firstMissingStep2Field(): Step2Field | "consentimento" | null {
    if (!step2.papel) return "papel";
    if (!step2.faturamento) return "faturamento";
    if (!step2.problema_principal) return "problema_principal";
    if (!step2.investimento) return "investimento";
    if (!step2.consentimento) return "consentimento";
    return null;
  }

  function validateStep2(): boolean {
    const missing = firstMissingStep2Field();
    const e: Errors = {};
    if (missing && missing !== "consentimento") {
      e[missing] = "Escolha uma opção para continuar.";
    }
    if (missing === "consentimento") {
      e.consentimento = "É necessário autorizar o contato.";
    }
    setErrors(e);
    if (missing) {
      const questionIndex = STEP2_QUESTIONS.findIndex((q) => q.field === missing);
      if (questionIndex >= 0) setStep2Question(questionIndex);
      setTimeout(() => {
        const el = document.getElementById(`q-${missing}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
      }, 50);
      return false;
    }
    return true;
  }

  function handleStep2Select(field: Step2Field, value: Step2Value) {
    setStep2((s) => ({ ...s, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    if (step2Question < STEP2_QUESTIONS.length - 1) {
      window.setTimeout(() => {
        setStep2Question((q) => Math.min(q + 1, STEP2_QUESTIONS.length - 1));
      }, 180);
    }
  }

  function handleStep2Back() {
    setErrors({});
    if (step2Question > 0) {
      setStep2Question((q) => q - 1);
      return;
    }
    setStep(1);
  }

  function onContinue() {
    markStarted();
    if (!validateStep1()) return;
    track("form_step_1_complete");
    setStep(2);
    setStep2Question(0);
    setTimeout(() => {
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  async function onFinalSubmit() {
    if (loading) return;
    if (!validateStep2()) return;
    setSubmitError(null);
    setLoading(true);
    track("form_submit_attempt");

    const utms = getPersistedTracking();
    try {
      const res = await submit({
        data: {
          nome: step1.nome.trim(),
          whatsapp: onlyDigits(step1.whatsapp),
          loja: step1.loja.trim(),
          email: step1.email.trim(),
          papel: step2.papel as Exclude<Papel, "">,
          faturamento: step2.faturamento as Exclude<Faturamento, "">,
          problema_principal: step2.problema_principal as Exclude<
            Problema,
            ""
          >,
          investimento: step2.investimento as Exclude<Investimento, "">,
          consentimento: true as const,
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
        },
      });
      if (res?.ok) {
        // Proteção contra double-fire do evento de conversão.
        if (!successFiredRef.current) {
          successFiredRef.current = true;
          track("generate_lead");
        }
        setSuccess(true);
        setTimeout(() => {
          containerRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 50);
      } else {
        throw new Error("erro");
      }
    } catch (err) {
      console.error(err);
      track("form_submit_error");
      setSubmitError(
        "Não foi possível enviar agora. Suas respostas foram mantidas. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    captureAndPersistTracking();
  }, []);

  function onWhatsappClick() {
    track("whatsapp_click");
  }

  const stepIndicator = success ? null : (
    <div className="mb-4 flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
        {step === 1 ? "1 de 2" : "2 de 2"}
      </p>
      <div className="flex gap-1.5" aria-hidden>
        <span
          className={`h-1.5 w-8 rounded-full ${step === 1 ? "bg-[#22C55E]" : "bg-[#E5E7EB]"}`}
        />
        <span
          className={`h-1.5 w-8 rounded-full ${step === 2 ? "bg-[#22C55E]" : "bg-[#E5E7EB]"}`}
        />
      </div>
    </div>
  );

  return (
    <div
      id={id}
      ref={containerRef}
      className="relative rounded-2xl bg-white p-5 shadow-[0_10px_40px_-15px_rgba(16,24,40,0.25)] ring-1 ring-black/5 sm:p-7"
    >
      {/* Honeypot invisível para bots — fora do fluxo visual e da navegação. */}
      <div aria-hidden="true" style={HONEYPOT_STYLE}>
        <input
          ref={hpRef}
          id="hp_field"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
      </div>

      {success ? (
        <SuccessState
          whatsapp={step1.whatsapp}
          onWhatsappClick={onWhatsappClick}
        />
      ) : (
        <>
          {stepIndicator}
          <div>
            <h2 className="text-xl font-semibold text-[#101828] sm:text-2xl">
              Veja como isso funcionaria na sua loja
            </h2>
            <p className="mt-1.5 text-sm text-[#667085]">
              Responda algumas perguntas rápidas. Leva cerca de um minuto.
            </p>
          </div>

          {step === 1 ? (
            <div className="mt-5 space-y-4">
              <p className="text-[15px] font-medium text-[#101828]">
                Primeiro, fale um pouco sobre você
              </p>

              <div>
                <Label htmlFor="f-nome">Seu nome</Label>
                <input
                  id="f-nome"
                  name="nome"
                  type="text"
                  autoComplete="name"
                  placeholder="Como podemos chamar você?"
                  value={step1.nome}
                  onFocus={markStarted}
                  onChange={(e) => {
                    setStep1((s) => ({ ...s, nome: e.target.value }));
                    if (errors.nome)
                      setErrors((x) => ({ ...x, nome: undefined }));
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
                    if (errors.whatsapp)
                      setErrors((x) => ({ ...x, whatsapp: undefined }));
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
                    if (errors.loja)
                      setErrors((x) => ({ ...x, loja: undefined }));
                  }}
                  aria-invalid={!!errors.loja}
                  aria-describedby={errors.loja ? "err-loja" : undefined}
                  className={`${fieldBase} ${errors.loja ? fieldError : ""}`}
                />
                <ErrorText id="err-loja" msg={errors.loja} />
              </div>

              <div>
                <Label htmlFor="f-email">Seu e-mail — opcional</Label>
                <input
                  id="f-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@empresa.com.br"
                  value={step1.email}
                  onFocus={markStarted}
                  onChange={(e) => {
                    setStep1((s) => ({ ...s, email: e.target.value }));
                    if (errors.email)
                      setErrors((x) => ({ ...x, email: undefined }));
                  }}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "err-email" : undefined}
                  className={`${fieldBase} ${errors.email ? fieldError : ""}`}
                />
                <ErrorText id="err-email" msg={errors.email} />
              </div>

              <button
                type="button"
                onClick={onContinue}
                className="mt-1 flex min-h-[52px] w-full items-center justify-center rounded-lg bg-[#22C55E] px-5 text-base font-semibold text-white transition-colors hover:bg-[#16A34A] focus:outline-none focus:ring-4 focus:ring-[#22C55E]/30"
              >
                Continuar
              </button>
              <p className="text-xs text-[#667085]">
                Na próxima etapa, faremos quatro perguntas sobre sua loja.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-[15px] font-medium text-[#101828]">
                  Agora, sobre sua loja
                </p>
                <p className="mt-1 text-sm text-[#667085]">
                  Escolha as opções que mais combinam com sua realidade.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs text-[#667085]">
                <span className="font-semibold">
                  Pergunta {step2Question + 1} de {STEP2_QUESTIONS.length}
                </span>
                <div className="flex gap-1.5" aria-hidden>
                  {STEP2_QUESTIONS.map((q, i) => (
                    <span
                      key={q.field}
                      className={`h-1.5 w-6 rounded-full ${i <= step2Question ? "bg-[#22C55E]" : "bg-[#E5E7EB]"}`}
                    />
                  ))}
                </div>
              </div>

              <Step2QuestionCard
                question={STEP2_QUESTIONS[step2Question]}
                value={step2[STEP2_QUESTIONS[step2Question].field]}
                error={errors[STEP2_QUESTIONS[step2Question].field]}
                onSelect={handleStep2Select}
              />

              <div
                id="q-consentimento"
                tabIndex={-1}
                className="rounded-lg bg-[#F6F7F9] p-4"
              >
                <label className="flex items-start gap-3 text-sm font-normal text-[#101828]">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-5 w-5 shrink-0 rounded border-[#D0D5DD] text-[#22C55E] focus:ring-[#22C55E]"
                    checked={step2.consentimento}
                    onChange={(e) =>
                      setStep2((s) => ({
                        ...s,
                        consentimento: e.target.checked,
                      }))
                    }
                  />
                  <span>
                    Autorizo o contato pelo WhatsApp sobre esta solicitação e
                    li a <PrivacyDialog />.
                  </span>
                </label>
                <ErrorText id="err-consentimento" msg={errors.consentimento} />
              </div>

              <p className="text-xs text-[#667085]">
                Usaremos suas respostas somente para entender sua loja e entrar
                em contato.
              </p>

              {submitError ? (
                <div className="rounded-lg border border-[#B42318]/30 bg-[#FEF3F2] p-3 text-sm text-[#B42318]">
                  {submitError}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleStep2Back}
                  className="inline-flex min-h-[52px] items-center justify-center gap-1 rounded-lg border border-[#D0D5DD] bg-white px-5 text-base font-semibold text-[#101828] hover:bg-[#F6F7F9] focus:outline-none focus:ring-4 focus:ring-black/10"
                >
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </button>
                <button
                  type="button"
                  onClick={onFinalSubmit}
                  disabled={loading}
                  className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-lg bg-[#22C55E] px-5 text-base font-semibold text-white transition-colors hover:bg-[#16A34A] focus:outline-none focus:ring-4 focus:ring-[#22C55E]/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Enviando..." : "Receber minha análise"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SuccessState({
  whatsapp,
  onWhatsappClick,
}: {
  whatsapp: string;
  onWhatsappClick: () => void;
}) {
  const digits = onlyDigits(whatsapp);
  const waHref = digits ? `https://wa.me/55${digits}` : "https://wa.me/";
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F0FDF4] text-[#16A34A]">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-[#101828] sm:text-2xl">
        Recebemos suas respostas.
      </h2>
      <p className="mt-2 text-[15px] leading-6 text-[#475467]">
        Vamos analisar as informações da sua loja e entrar em contato pelo
        WhatsApp informado.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onWhatsappClick}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-lg bg-[#22C55E] px-5 text-base font-semibold text-white hover:bg-[#16A34A]"
        >
          <MessageCircle className="h-5 w-5" /> Falar pelo WhatsApp agora
        </a>
      </div>
    </div>
  );
}
