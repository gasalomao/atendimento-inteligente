import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, MessageCircle } from "lucide-react";
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
  | ""
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
  papel: Papel;
  conversas_dia: Conversas;
  problema_principal: Problema;
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
};

type Errors = Partial<Record<string, string>>;

const fieldBase =
  "block w-full rounded-[10px] bg-white px-4 py-3 text-[16px] leading-6 text-[#191A18] placeholder:text-[#777A75] border border-[#CFCBC3] outline-none transition-[border-color,box-shadow] duration-150 hover:border-[#A9A59D] focus:border-[#207A50] focus:ring-[3px] focus:ring-[#207A50]/[0.14] disabled:opacity-60 min-h-[52px]";
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
    <p id={id} role="alert" className="mt-2 text-[13px] text-[#B42318]">
      {msg}
    </p>
  );
}

const cardOptionBase =
  "w-full text-left rounded-[10px] border border-[#D6D2CA] bg-white px-4 py-3.5 text-[16px] leading-[1.4] text-[#2B2D29] min-h-[52px] transition-[border-color,background-color] duration-150 hover:border-[#9E9A92] hover:bg-[#FAF9F7] focus:outline-none focus-visible:border-[#207A50] focus-visible:ring-[3px] focus-visible:ring-[#207A50]/[0.14] flex items-center gap-3";
const cardOptionActive =
  "border-[#207A50] bg-[#EDF6F0] hover:border-[#207A50] hover:bg-[#EDF6F0]";

const STEP2_QUESTIONS: Step2Question[] = [
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
  },
  {
    field: "conversas_dia",
    question:
      "Em média, quantas novas conversas chegam por dia no WhatsApp da loja?",
    options: [
      { v: "up_to_10", t: "Até 10" },
      { v: "from_11_to_30", t: "De 11 a 30" },
      { v: "from_31_to_60", t: "De 31 a 60" },
      { v: "more_than_60", t: "Mais de 60" },
      { v: "unknown", t: "Não sei ao certo" },
    ],
  },
  {
    field: "problema_principal",
    question: "Qual dessas situações mais acontece hoje na sua loja?",
    options: [
      {
        v: "delayed_response_busy_store",
        t: "Demoramos para responder quando a loja está cheia",
      },
      {
        v: "price_request_then_disappears",
        t: "Muitos clientes pedem preço e depois desaparecem",
      },
      {
        v: "messages_outside_business_hours",
        t: "Mensagens chegam fora do horário e ficam para o dia seguinte",
      },
      {
        v: "no_customer_recontact",
        t: "Falta alguém para voltar a falar com quem não comprou",
      },
      {
        v: "repetitive_questions",
        t: "Os vendedores repetem as mesmas perguntas o dia todo",
      },
      {
        v: "wants_to_scale_without_overload",
        t: "O atendimento funciona, mas queremos atender mais sem sobrecarregar a equipe",
      },
    ],
  },
  {
    field: "faturamento",
    question: "Qual faixa mais se aproxima do faturamento mensal da loja?",
    description:
      "Não precisa informar o valor exato. Essa resposta ajuda a entender o tamanho do atendimento.",
    options: [
      { v: "up_to_30k", t: "Até R$ 30 mil" },
      { v: "from_30k_to_50k", t: "De R$ 30 mil a R$ 50 mil" },
      { v: "from_50k_to_100k", t: "De R$ 50 mil a R$ 100 mil" },
      { v: "from_100k_to_300k", t: "De R$ 100 mil a R$ 300 mil" },
      { v: "above_300k", t: "Acima de R$ 300 mil" },
      { v: "prefer_not_to_say", t: "Prefiro falar sobre isso depois" },
    ],
  },
  {
    field: "investimento",
    question:
      "Se isso fizer sentido para sua loja, qual opção melhor descreve seu momento para investir R$ 1.500 por mês?",
    options: [
      {
        v: "ready_if_value_is_clear",
        t: "Posso investir esse valor se enxergar benefício para a loja",
      },
      {
        v: "wants_to_see_first",
        t: "Posso avaliar depois de ver como funciona",
      },
      {
        v: "needs_other_decision_maker",
        t: "Preciso conversar com outro responsável",
      },
      {
        v: "above_current_budget",
        t: "Esse valor não cabe no orçamento hoje",
      },
    ],
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
  clipPath: "inset(50%)",
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

export function LeadForm({ id = "formulario" }: { id?: string }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [q, setQ] = useState(0);
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
    conversas_dia: "",
    problema_principal: "",
    faturamento: "",
    investimento: "",
    consentimento: false,
  });
  const [errors, setErrors] = useState<Errors>({});
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    captureAndPersistTracking();
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
    {
      const parts = step1.nome.trim().split(/\s+/).filter((p) => p.length >= 2);
      if (parts.length < 2) e.nome = "Digite seu nome completo (nome e sobrenome).";
    }
    if (!step1.whatsapp.trim()) e.whatsapp = "Digite seu número de WhatsApp.";
    else if (!isValidBRPhone(step1.whatsapp))
      e.whatsapp = "Confira o número e inclua o DDD.";
    if (step1.loja.trim().length > 0 && step1.loja.trim().length < 2)
      e.loja = "Digite o nome ou Instagram da loja.";
    if (step1.email.trim() !== "") {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(step1.email.trim())) e.email = "Confira o e-mail.";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const first = Object.keys(e)[0];
      document.getElementById(`f-${first}`)?.focus();
      return false;
    }
    return true;
  }

  function onStep1Continue() {
    markStarted();
    if (!validateStep1()) return;
    track("form_step_1_complete");
    setStep(2);
    setQ(0);
    setTimeout(() => {
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
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

  function onQuestionContinue() {
    const field = currentField();
    if (!step2[field]) {
      setErrors({ [field]: "Escolha uma opção para continuar." });
      return;
    }
    if (q < STEP2_QUESTIONS.length - 1) {
      setQ((n) => n + 1);
      setErrors({});
      setTimeout(() => {
        containerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 30);
    } else {
      // última pergunta respondida → mostra bloco de consentimento/envio
      setErrors({});
      setTimeout(() => {
        document
          .getElementById("consent-block")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 30);
    }
  }

  function onQuestionBack() {
    setErrors({});
    if (q > 0) {
      setQ((n) => n - 1);
      return;
    }
    setStep(1);
  }

  async function onFinalSubmit() {
    if (loading) return;
    // Verifica todas as respostas antes de enviar.
    const order: Step2Field[] = [
      "papel",
      "conversas_dia",
      "problema_principal",
      "faturamento",
      "investimento",
    ];
    for (let i = 0; i < order.length; i++) {
      if (!step2[order[i]]) {
        setQ(i);
        setErrors({ [order[i]]: "Escolha uma opção para continuar." });
        return;
      }
    }
    if (!step2.consentimento) {
      setErrors({ consentimento: "É necessário autorizar o contato." });
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
          email: step1.email.trim(),
          papel: step2.papel,
          conversas_dia: step2.conversas_dia,
          problema_principal: step2.problema_principal,
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
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body?.success) {
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
      } else if (res.status === 429) {
        setSubmitError(
          body?.message ?? "Aguarde alguns minutos antes de tentar novamente.",
        );
      } else if (res.status === 422) {
        setSubmitError(
          body?.message ?? "Confira as informações preenchidas.",
        );
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

  function onWhatsappClick() {
    track("whatsapp_click");
  }

  const isLastQuestion = q === STEP2_QUESTIONS.length - 1;
  const showConsent = isLastQuestion && !!step2[currentField()];

  const totalSteps = 1 + STEP2_QUESTIONS.length;
  const currentStepIndex = step === 0 ? 0 : step === 1 ? 1 : q + 2;
  const progressPct = step === 0 ? 0 : Math.round((currentStepIndex / totalSteps) * 100);
  const stepLabel =
    step === 0 ? "Introdução" : step === 1 ? "Seus dados" : "Sobre sua loja";
  const stepCounter =
    step === 0
      ? "Comece aqui"
      : step === 1
        ? "Etapa 1 de 2"
        : `Etapa 2 de 2 · Pergunta ${q + 1} de ${STEP2_QUESTIONS.length}`;

  return (
    <div
      id={id}
      ref={containerRef}
      className="relative w-full rounded-[14px] border border-[#DDDAD3] bg-white p-6 shadow-[0_8px_30px_rgba(25,26,24,0.06)] sm:p-8 lg:max-w-[500px] lg:ml-auto"
    >
      {/* Honeypot invisível para bots. */}
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
          <div className="mb-6">
            <h2 className="text-[22px] font-[650] leading-[1.2] tracking-[-0.02em] text-[#191A18] sm:text-[26px]">
              {step === 0
                ? "Enquanto você demora, o cliente chama outra loja."
                : "Veja como isso funcionaria na sua loja"}
            </h2>
            <p className="mt-3 text-[15px] leading-[1.6] text-[#5F625E]">
              {step === 0
                ? "Quando sua equipe está ocupada, o atendimento responde as primeiras perguntas, entende qual aparelho a pessoa procura e deixa a conversa organizada para o vendedor continuar."
                : "Responda algumas perguntas rápidas. Leva cerca de um minuto."}
            </p>
          </div>

          {step !== 0 ? (
            <div className="mb-6">
              <div className="flex items-center justify-between text-[12px] font-[600] uppercase tracking-[0.1em] text-[#7B7E78]">
                <span>{stepCounter}</span>
                <span>{stepLabel}</span>
              </div>
              <div
                className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[#E8E5DF]"
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-[#207A50] transition-[width] duration-200 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          ) : null}

          {step === 0 ? (
            <div className="space-y-6">
              <ul className="space-y-3 border-t border-[#E3E0D9] pt-5 text-[15px] leading-[1.55] text-[#191A18] sm:text-[16px]">
                <IntroPoint>Responde quando o vendedor está ocupado</IntroPoint>
                <IntroPoint>Volta a falar com quem parou de responder</IntroPoint>
                <IntroPoint>Organiza as informações para o vendedor</IntroPoint>
              </ul>
              <button
                type="button"
                onClick={() => {
                  markStarted();
                  track("form_step_intro_complete");
                  setStep(1);
                  setTimeout(() => {
                    containerRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }, 30);
                }}
                className="flex min-h-[52px] w-full items-center justify-center rounded-[10px] bg-[#207A50] px-5 text-[15px] font-[600] text-white transition-colors duration-150 hover:bg-[#17613E] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#207A50]/25 active:scale-[0.99]"
              >
                Continuar
              </button>
              <p className="text-[13px] text-[#7B7E78]">
                Leva cerca de um minuto. Indicado para lojas que faturam a partir de R$ 50 mil por mês.
              </p>
            </div>
          ) : step === 1 ? (
            <div className="space-y-5">
              <div>
                <Label htmlFor="f-nome">Seu nome completo</Label>
                <input
                  id="f-nome"
                  name="nome"
                  type="text"
                  autoComplete="name"
                  placeholder="Nome e sobrenome"
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
                  aria-describedby={
                    errors.whatsapp ? "err-whatsapp" : undefined
                  }
                  className={`${fieldBase} ${errors.whatsapp ? fieldError : ""}`}
                />
                <ErrorText id="err-whatsapp" msg={errors.whatsapp} />
              </div>

              <div>
                <Label htmlFor="f-loja">Nome ou Instagram da loja — opcional</Label>
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
                onClick={onStep1Continue}
                className="mt-2 flex min-h-[52px] w-full items-center justify-center rounded-[10px] bg-[#207A50] px-5 text-[15px] font-[600] text-white transition-colors duration-150 hover:bg-[#17613E] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#207A50]/25 active:scale-[0.99]"
              >
                Continuar
              </button>
              <p className="text-[13px] text-[#7B7E78]">
                Depois, cinco perguntas curtas sobre sua loja.
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

              {showConsent ? (
                <div
                  id="consent-block"
                  className="rounded-[10px] border border-[#E3E0D9] bg-[#F7F5F1] p-4"
                >
                  <label className="flex items-start gap-3 text-[14px] leading-[1.55] text-[#191A18]">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded border-[#C8C4BB] text-[#207A50] accent-[#207A50] focus:ring-[#207A50]/30"
                      checked={step2.consentimento}
                      onChange={(e) => {
                        setStep2((s) => ({
                          ...s,
                          consentimento: e.target.checked,
                        }));
                        if (errors.consentimento)
                          setErrors((x) => ({
                            ...x,
                            consentimento: undefined,
                          }));
                      }}
                    />
                    <span>
                      Autorizo o contato pelo WhatsApp sobre esta solicitação
                      e li a <PrivacyDialog />.
                    </span>
                  </label>
                  <ErrorText
                    id="err-consentimento"
                    msg={errors.consentimento}
                  />
                  <p className="mt-3 text-[12px] leading-[1.5] text-[#7B7E78]">
                    Suas respostas serão usadas apenas para entender sua loja
                    e retornar pelo WhatsApp.
                  </p>
                </div>
              ) : null}

              {submitError ? (
                <div
                  role="alert"
                  aria-live="polite"
                  className="rounded-[10px] border border-[#B42318]/30 bg-[#FEF8F7] p-3 text-[14px] text-[#B42318]"
                >
                  {submitError}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={onQuestionBack}
                  className="inline-flex min-h-[52px] items-center justify-center gap-1 rounded-[10px] border border-[#CFCBC3] bg-transparent px-5 text-[15px] font-[600] text-[#30322E] transition-colors duration-150 hover:bg-[#F0EEE9] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#191A18]/15 active:scale-[0.99]"
                >
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </button>
                {isLastQuestion && showConsent ? (
                  <button
                    type="button"
                    onClick={onFinalSubmit}
                    disabled={loading}
                    className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-[10px] bg-[#207A50] px-5 text-[15px] font-[600] text-white transition-colors duration-150 hover:bg-[#17613E] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#207A50]/25 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.99]"
                  >
                    {loading
                      ? "Enviando..."
                      : "Ver como funcionaria na minha loja"}
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
        <p className="mt-2 text-[14px] leading-[1.55] text-[#5F625E]">
          {question.description}
        </p>
      ) : null}
      <div className="mt-4 grid gap-2.5" role="radiogroup">
        {question.options.map((opt) => (
          <OptionCard
            key={opt.v}
            active={value === opt.v}
            onClick={() => onSelect(question.field, opt.v)}
          >
            {opt.t}
          </OptionCard>
        ))}
      </div>
      <ErrorText id={`err-${question.field}`} msg={error} />
    </fieldset>
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
    <div className="text-center" aria-live="polite">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F3EC] text-[#207A50]">
        <CheckCircle2 className="h-6 w-6" strokeWidth={2.25} />
      </div>
      <h2 className="mt-5 text-[22px] font-[650] leading-[1.25] tracking-[-0.02em] text-[#191A18] sm:text-[24px]">
        Recebemos suas respostas.
      </h2>
      <p className="mx-auto mt-3 max-w-[380px] text-[15px] leading-[1.6] text-[#5F625E]">
        Agora vamos entender como esse atendimento poderia funcionar na sua
        loja. Entraremos em contato pelo WhatsApp informado.
      </p>
      <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onWhatsappClick}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[10px] bg-[#207A50] px-6 text-[15px] font-[600] text-white transition-colors duration-150 hover:bg-[#17613E] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#207A50]/25 active:scale-[0.99]"
        >
          <MessageCircle className="h-5 w-5" /> Continuar pelo WhatsApp
        </a>
      </div>
    </div>
  );
}

