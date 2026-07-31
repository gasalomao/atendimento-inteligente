import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { formatBRPhone, isValidBRPhone, onlyDigits } from "@/lib/phone-mask";
import {
  captureAndPersistTracking,
  getPersistedTracking,
  track,
  trackOnce,
} from "@/lib/tracking";
import { trackEvent } from "@/lib/analytics";
import { PrivacyDialog } from "./privacy-dialog";
import { CONSENT_TEXT_VERSION_DEFAULT } from "../../shared/leads/schema";

/* ------------------------------------------------------------------ */
/* Perguntas do diagnóstico (9 no total, em 3 blocos)                  */
/* ------------------------------------------------------------------ */

type QuestionField =
  | "canal_venda"
  | "canais_oportunidade"
  | "problema_principal"
  | "contatos_dia"
  | "respondentes"
  | "registro_contatos"
  | "automatizar_primeiro"
  | "prazo"
  | "decisao";

type Question = {
  field: QuestionField;
  block: 1 | 2 | 3;
  question: string;
  description?: string;
  multiple?: boolean;
  options: Array<{ v: string; t: string }>;
};

const QUESTIONS: Question[] = [
  {
    field: "canal_venda",
    block: 1,
    question: "Como sua loja vende hoje?",
    options: [
      { v: "physical", t: "Só loja física" },
      { v: "online", t: "Só online" },
      { v: "both", t: "Loja física e online" },
    ],
  },
  {
    field: "canais_oportunidade",
    block: 1,
    question: "Por onde chegam os contatos de clientes?",
    description: "Pode marcar mais de um.",
    multiple: true,
    options: [
      { v: "whatsapp", t: "WhatsApp" },
      { v: "instagram", t: "Instagram" },
      { v: "site", t: "Site" },
      { v: "telefone", t: "Telefone" },
      { v: "marketplace", t: "Marketplace" },
      { v: "outros", t: "Outros" },
    ],
  },
  {
    field: "problema_principal",
    block: 1,
    question: "O que mais atrapalha o atendimento hoje?",
    description: "Pode marcar mais de um.",
    multiple: true,
    options: [
      { v: "demora", t: "Demora para responder" },
      { v: "sem_followup", t: "Ninguém retoma quem não comprou" },
      { v: "contatos_desorganizados", t: "Contatos ficam desorganizados" },
      { v: "leads_baixa_qualidade", t: "Chegam muitos contatos sem intenção real" },
      { v: "dificuldade_medir", t: "Difícil medir o que dá resultado" },
      { v: "outro", t: "Outro ponto" },
    ],
  },
  {
    field: "contatos_dia",
    block: 2,
    question: "Quantos novos contatos chegam por dia?",
    description: "Uma estimativa já ajuda.",
    options: [
      { v: "up_to_10", t: "Até 10" },
      { v: "from_11_to_30", t: "De 11 a 30" },
      { v: "from_31_to_80", t: "De 31 a 80" },
      { v: "more_than_80", t: "Mais de 80" },
      { v: "nao_acompanho", t: "Não acompanho esse número" },
    ],
  },
  {
    field: "respondentes",
    block: 2,
    question: "Quantas pessoas respondem esses contatos?",
    options: [
      { v: "one", t: "Uma pessoa" },
      { v: "two_three", t: "Duas ou três" },
      { v: "four_eight", t: "De quatro a oito" },
      { v: "more_than_eight", t: "Mais de oito" },
    ],
  },
  {
    field: "registro_contatos",
    block: 2,
    question: "Como os contatos ficam registrados?",
    options: [
      { v: "none", t: "Não ficam registrados" },
      { v: "sheet", t: "Planilha" },
      { v: "crm", t: "Um CRM" },
      { v: "own_system", t: "Sistema próprio da loja" },
    ],
  },
  {
    field: "automatizar_primeiro",
    block: 2,
    question: "O que você gostaria de resolver primeiro?",
    options: [
      { v: "triagem", t: "Responder e organizar os primeiros contatos" },
      { v: "orcamento", t: "Passar preços e condições" },
      { v: "followup", t: "Retomar quem não respondeu" },
      { v: "agendamento", t: "Agendar visitas ou retiradas" },
      { v: "posvenda", t: "Pós-venda e recompra" },
      { v: "integracao", t: "Ligar tudo isso ao sistema da loja" },
    ],
  },
  {
    field: "prazo",
    block: 3,
    question: "Quando você gostaria de colocar isso em prática?",
    options: [
      { v: "now", t: "Agora" },
      { v: "until_30d", t: "Nos próximos 30 dias" },
      { v: "from_1_to_3m", t: "De 1 a 3 meses" },
      { v: "researching", t: "Só estou pesquisando" },
    ],
  },
  {
    field: "decisao",
    block: 3,
    question: "Quem participa dessa decisão?",
    options: [
      { v: "me", t: "Eu decido" },
      { v: "me_partner", t: "Eu e um sócio" },
      { v: "manager", t: "Um gerente responsável" },
      { v: "team", t: "A equipe avalia junto" },
    ],
  },
];

const BLOCK_TITLES: Record<1 | 2 | 3, { title: string; subtitle: string }> = {
  1: {
    title: "Vamos entender sua loja",
    subtitle: "Três perguntas rápidas sobre como vocês vendem hoje.",
  },
  2: {
    title: "Como funciona o atendimento",
    subtitle: "Quatro perguntas sobre o dia a dia da equipe.",
  },
  3: {
    title: "Momento da loja",
    subtitle: "Só falta entender o momento e como te enviamos o resultado.",
  },
};

/* ------------------------------------------------------------------ */

type Answers = {
  canal_venda: string;
  canais_oportunidade: string[];
  problema_principal: string[];
  contatos_dia: string;
  respondentes: string;
  registro_contatos: string;
  automatizar_primeiro: string;
  prazo: string;
  decisao: string;
};

type Contact = {
  nome: string;
  email: string;
  loja: string;
  cidade_uf: string;
  whatsapp: string;
};

type Consents = {
  consent_email: boolean;
  consent_whatsapp: boolean;
  consent_sms: boolean;
  consent_marketing: boolean;
};

type Errors = Partial<Record<string, string>>;

const EMPTY_ANSWERS: Answers = {
  canal_venda: "",
  canais_oportunidade: [],
  problema_principal: [],
  contatos_dia: "",
  respondentes: "",
  registro_contatos: "",
  automatizar_primeiro: "",
  prazo: "",
  decisao: "",
};

const EMPTY_CONTACT: Contact = {
  nome: "",
  email: "",
  loja: "",
  cidade_uf: "",
  whatsapp: "",
};

const EMPTY_CONSENTS: Consents = {
  consent_email: false,
  consent_whatsapp: false,
  consent_sms: false,
  consent_marketing: false,
};

const fieldBase =
  "block w-full rounded-[10px] bg-white px-4 py-3 sm:py-3.5 text-[16px] leading-6 text-[#191A18] placeholder:text-[#777A75] border border-[#CFCBC3] outline-none transition-[border-color,box-shadow] duration-150 hover:border-[#A9A59D] focus:border-[#207A50] focus:ring-[3px] focus:ring-[#207A50]/[0.14] disabled:opacity-60 min-h-[48px] sm:min-h-[52px]";
const fieldError =
  "border-[#B42318] bg-[#FEF8F7] focus:border-[#B42318] focus:ring-[#B42318]/20";

const cardOptionBase =
  "w-full text-left rounded-[10px] border border-[#D6D2CA] bg-white px-4 py-3 sm:py-3.5 text-[15px] sm:text-[16px] leading-[1.3] sm:leading-[1.4] text-[#2B2D29] min-h-[48px] sm:min-h-[52px] transition-[border-color,background-color] duration-150 hover:border-[#9E9A92] hover:bg-[#FAF9F7] focus:outline-none focus-visible:border-[#207A50] focus-visible:ring-[3px] focus-visible:ring-[#207A50]/[0.14] active:bg-[#F0EEE9] flex items-center gap-3";
const cardOptionActive =
  "border-[#207A50] bg-[#EDF6F0] hover:border-[#207A50] hover:bg-[#EDF6F0] font-[600] text-[#191A18]";


const primaryBtn =
  "inline-flex min-h-[52px] flex-1 items-center justify-center rounded-[10px] bg-[#207A50] px-5 text-[15px] font-[600] text-white transition-colors duration-150 hover:bg-[#17613E] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#207A50]/25 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.99] sm:text-[16px]";
const secondaryBtn =
  "inline-flex min-h-[52px] items-center justify-center gap-1 rounded-[10px] border border-[#CFCBC3] bg-transparent px-5 text-[15px] font-[600] text-[#30322E] transition-colors duration-150 hover:bg-[#F0EEE9] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#191A18]/15 active:scale-[0.99]";

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

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-[14px] font-[600] text-[#191A18]">
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

function OptionCard({
  active,
  multiple,
  onClick,
  children,
}: {
  active: boolean;
  multiple?: boolean;
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
        className={`grid h-[18px] w-[18px] shrink-0 place-items-center border transition-colors ${
          multiple ? "rounded-[5px]" : "rounded-full"
        } ${active ? "border-[#207A50]" : "border-[#C8C4BB]"}`}
      >
        <span
          className={`h-[8px] w-[8px] transition-opacity ${multiple ? "rounded-[2px]" : "rounded-full"} ${
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
  // índice 0..8 = perguntas; 9 = tela de contato
  const CONTACT_INDEX = QUESTIONS.length;
  const [index, setIndex] = useState(0);
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

  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);
  const [consents, setConsents] = useState<Consents>(EMPTY_CONSENTS);
  const [errors, setErrors] = useState<Errors>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const isContactStep = index === CONTACT_INDEX;
  const current = isContactStep ? null : QUESTIONS[index];
  const block: 1 | 2 | 3 = isContactStep ? 3 : QUESTIONS[index].block;
  const progress = useMemo(
    () => Math.round(((index + 1) / (QUESTIONS.length + 1)) * 100),
    [index]
  );

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

  useEffect(() => {
    onStepChange?.(index === 0 ? 1 : 2);
  }, [index, onStepChange]);

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
    const headerOffset = window.innerWidth < 640 ? 56 : 76;
    const top = containerRef.current.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({
      top: Math.max(top, 0),
      behavior: isReduced ? "auto" : "smooth",
    });
  }


  function isAnswered(q: Question): boolean {
    const v = answers[q.field];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  }

  function onSelect(q: Question, value: string) {
    markStarted();
    setAnswers((prev) => {
      if (q.multiple) {
        const list = prev[q.field] as string[];
        const next = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
        return { ...prev, [q.field]: next };
      }
      return { ...prev, [q.field]: value };
    });
    setErrors((e) => ({ ...e, [q.field]: undefined }));
  }

  function recordTime(field: string) {
    const dur = questionStartRef.current ? Date.now() - questionStartRef.current : 0;
    if (dur > 0) {
      stepTimesRef.current[field] = dur;
      trackEvent("form_step_complete", { question: field, index, duration_ms: dur });
    }
    questionStartRef.current = Date.now();
  }

  function onContinue() {
    markStarted();
    if (!current) return;
    if (!isAnswered(current)) {
      setErrors({ [current.field]: "Escolha a opção que mais combina com sua realidade." });
      return;
    }
    recordTime(current.field);
    setErrors({});
    setIndex((n) => n + 1);
    setTimeout(scrollToContainer, 30);
  }

  function onBack() {
    if (index === 0) return;
    setErrors({});
    setSubmitError(null);
    questionStartRef.current = Date.now();
    setIndex((n) => n - 1);
    setTimeout(scrollToContainer, 30);
  }

  function validateContact(): boolean {
    const e: Errors = {};
    if (contact.nome.trim().split(/\s+/).filter((p) => p.length >= 2).length < 2) {
      e.nome = "Digite seu nome e sobrenome.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email.trim())) {
      e.email = "Confira o e-mail informado.";
    }
    if (contact.loja.trim().length < 2) {
      e.loja = "Digite o nome da loja.";
    }
    if (contact.cidade_uf.trim().length < 2) {
      e.cidade_uf = "Digite a cidade e o estado.";
    }
    if (contact.whatsapp.trim() && !isValidBRPhone(contact.whatsapp)) {
      e.whatsapp = "Confira o número e inclua o DDD.";
    }
    if (!consents.consent_email) {
      e.consent_email = "Precisamos dessa autorização para enviar o resultado por e-mail.";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const first = Object.keys(e)[0];
      const el = document.getElementById(`f-${first}`);
      if (el) {
        const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: isReduced ? "auto" : "smooth", block: "center" });
        el.focus({ preventScroll: true });
      }
      return false;
    }
    return true;
  }

  async function onSubmit() {
    if (loading) return;
    if (!validateContact()) return;

    recordTime("contato");
    setSubmitError(null);
    setLoading(true);
    track("form_submit_attempt");

    const utms = getPersistedTracking();
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: contact.nome.trim(),
          email: contact.email.trim(),
          loja: contact.loja.trim(),
          cidade_uf: contact.cidade_uf.trim(),
          whatsapp: contact.whatsapp.trim() ? onlyDigits(contact.whatsapp) : "",
          canal_venda: answers.canal_venda,
          canais_oportunidade: answers.canais_oportunidade,
          problema_principal: answers.problema_principal,
          contatos_dia: answers.contatos_dia,
          respondentes: answers.respondentes,
          registro_contatos: answers.registro_contatos,
          automatizar_primeiro: answers.automatizar_primeiro,
          prazo: answers.prazo,
          decisao: answers.decisao,
          consent_email: true,
          consent_whatsapp: consents.consent_whatsapp,
          consent_sms: consents.consent_sms,
          consent_marketing: consents.consent_marketing,
          consent_text_version: CONSENT_TEXT_VERSION_DEFAULT,
          consentimento: true,
          landing_variant:
            new URLSearchParams(window.location.search).get("v") || "balanced",

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
        if (body?.fields) setErrors(body.fields as Errors);
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
    setIndex(0);
    setAnswers(EMPTY_ANSWERS);
    setContact(EMPTY_CONTACT);
    setConsents(EMPTY_CONSENTS);
    setErrors({});
    setSubmitError(null);
  }

  const header = BLOCK_TITLES[block];

  return (
    <div
      id={id}
      ref={containerRef}
      className="relative mx-auto w-full max-w-full scroll-mt-[56px] overflow-hidden rounded-[14px] border border-[#DDDAD3] bg-white p-4 shadow-[0_8px_30px_rgba(25,26,24,0.06)] sm:scroll-mt-[76px] sm:p-8"
    >
      {/* Honeypot invisível para bots */}
      <div aria-hidden="true" style={HONEYPOT_STYLE}>
        <input ref={hpRef} id="hp_field" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {success ? (
        <SuccessState email={contact.email} onReset={handleResetForm} />
      ) : (
        <>
          <div className="mb-4 sm:mb-5">
            <h2 className="text-[18px] font-[650] leading-[1.2] tracking-[-0.015em] text-[#191A18] sm:text-[22px]">
              {isContactStep ? "Para onde enviamos o resultado?" : header.title}
            </h2>
            <p className="mt-1.5 text-[13px] leading-[1.4] text-[#5F625E] sm:text-[14px] sm:leading-[1.5]">
              {isContactStep
                ? "Preparamos a análise com base nas suas respostas e enviamos por e-mail."
                : header.subtitle}
            </p>
          </div>

          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between text-[12px] font-[600] uppercase tracking-[0.1em] text-[#7B7E78]">
              <span>
                {isContactStep
                  ? "Última etapa · Seus dados"
                  : `Pergunta ${index + 1} de ${QUESTIONS.length}`}
              </span>
              <span>{progress}%</span>
            </div>
            <div
              className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[#E8E5DF]"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-[#207A50] transition-[width] duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {current ? (
            <div className="space-y-4 sm:space-y-6">
              <QuestionBlock
                question={current}
                value={answers[current.field]}
                error={errors[current.field]}
                onSelect={onSelect}
              />

              <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
                {index > 0 && (
                  <button type="button" onClick={onBack} className={secondaryBtn}>
                    <ChevronLeft className="h-4 w-4" /> Voltar
                  </button>
                )}
                <button type="button" onClick={onContinue} className={primaryBtn}>
                  Continuar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 sm:space-y-5">
              <div>
                <Label htmlFor="f-nome">Nome completo</Label>
                <input
                  id="f-nome"
                  name="nome"
                  type="text"
                  autoComplete="name"
                  placeholder="Nome e sobrenome"
                  value={contact.nome}
                  onFocus={markStarted}
                  onChange={(e) => {
                    setContact((s) => ({ ...s, nome: e.target.value }));
                    if (errors.nome) setErrors((x) => ({ ...x, nome: undefined }));
                  }}
                  aria-invalid={!!errors.nome}
                  aria-describedby={errors.nome ? "err-nome" : undefined}
                  className={`${fieldBase} ${errors.nome ? fieldError : ""}`}
                />
                <ErrorText id="err-nome" msg={errors.nome} />
              </div>

              <div>
                <Label htmlFor="f-email">E-mail</Label>
                <input
                  id="f-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="nome@sualoja.com.br"
                  value={contact.email}
                  onFocus={markStarted}
                  onChange={(e) => {
                    setContact((s) => ({ ...s, email: e.target.value }));
                    if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
                  }}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "err-email" : undefined}
                  className={`${fieldBase} ${errors.email ? fieldError : ""}`}
                />
                <ErrorText id="err-email" msg={errors.email} />
              </div>

              <div>
                <Label htmlFor="f-loja">Nome da loja</Label>
                <input
                  id="f-loja"
                  name="loja"
                  type="text"
                  autoComplete="organization"
                  placeholder="Ex.: Loja Prime ou @lojaprime"
                  value={contact.loja}
                  onFocus={markStarted}
                  onChange={(e) => {
                    setContact((s) => ({ ...s, loja: e.target.value }));
                    if (errors.loja) setErrors((x) => ({ ...x, loja: undefined }));
                  }}
                  aria-invalid={!!errors.loja}
                  aria-describedby={errors.loja ? "err-loja" : undefined}
                  className={`${fieldBase} ${errors.loja ? fieldError : ""}`}
                />
                <ErrorText id="err-loja" msg={errors.loja} />
              </div>

              <div>
                <Label htmlFor="f-cidade_uf">Cidade e estado</Label>
                <input
                  id="f-cidade_uf"
                  name="cidade_uf"
                  type="text"
                  autoComplete="address-level2"
                  placeholder="Ex.: São Paulo, SP"
                  value={contact.cidade_uf}
                  onFocus={markStarted}
                  onChange={(e) => {
                    setContact((s) => ({ ...s, cidade_uf: e.target.value }));
                    if (errors.cidade_uf) setErrors((x) => ({ ...x, cidade_uf: undefined }));
                  }}
                  aria-invalid={!!errors.cidade_uf}
                  aria-describedby={errors.cidade_uf ? "err-cidade_uf" : undefined}
                  className={`${fieldBase} ${errors.cidade_uf ? fieldError : ""}`}
                />
                <ErrorText id="err-cidade_uf" msg={errors.cidade_uf} />
              </div>

              <div>
                <Label htmlFor="f-whatsapp">WhatsApp (opcional)</Label>
                <input
                  id="f-whatsapp"
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(11) 99999-9999"
                  value={contact.whatsapp}
                  onFocus={markStarted}
                  onChange={(e) => {
                    setContact((s) => ({ ...s, whatsapp: formatBRPhone(e.target.value) }));
                    if (errors.whatsapp) setErrors((x) => ({ ...x, whatsapp: undefined }));
                  }}
                  aria-invalid={!!errors.whatsapp}
                  aria-describedby={errors.whatsapp ? "err-whatsapp" : undefined}
                  className={`${fieldBase} ${errors.whatsapp ? fieldError : ""}`}
                />
                <ErrorText id="err-whatsapp" msg={errors.whatsapp} />
              </div>

              <div className="space-y-2.5 border-t border-[#E8E5DF] pt-4">
                <ConsentRow
                  id="f-consent_email"
                  checked={consents.consent_email}
                  onChange={(v) => {
                    setConsents((s) => ({ ...s, consent_email: v }));
                    if (errors.consent_email) setErrors((x) => ({ ...x, consent_email: undefined }));
                  }}
                >
                  Autorizo receber o resultado da análise por e-mail e li a{" "}
                  <button
                    type="button"
                    onClick={() => setPrivacyOpen(true)}
                    className="font-[600] text-[#207A50] underline hover:text-[#17613E]"
                  >
                    Política de Privacidade
                  </button>
                  .
                </ConsentRow>
                <ErrorText id="err-consent_email" msg={errors.consent_email} />

                <ConsentRow
                  id="f-consent_whatsapp"
                  checked={consents.consent_whatsapp}
                  onChange={(v) => setConsents((s) => ({ ...s, consent_whatsapp: v }))}
                >
                  Também podem falar comigo pelo WhatsApp.
                </ConsentRow>

                <ConsentRow
                  id="f-consent_sms"
                  checked={consents.consent_sms}
                  onChange={(v) => setConsents((s) => ({ ...s, consent_sms: v }))}
                >
                  Também podem me enviar SMS.
                </ConsentRow>

                <ConsentRow
                  id="f-consent_marketing"
                  checked={consents.consent_marketing}
                  onChange={(v) => setConsents((s) => ({ ...s, consent_marketing: v }))}
                >
                  Quero receber conteúdos e novidades sobre atendimento.
                </ConsentRow>
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="rounded-[10px] border border-[#B42318]/30 bg-[#FEF8F7] p-3 text-[14px] text-[#B42318]"
                >
                  {submitError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
                <button type="button" onClick={onBack} className={secondaryBtn}>
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </button>
                <button type="button" onClick={onSubmit} disabled={loading} className={primaryBtn}>
                  {loading ? "Enviando suas respostas…" : "Receber minha análise"}
                </button>
              </div>

              <p className="text-center text-[12px] leading-relaxed text-[#777A75]">
                Usamos suas respostas apenas para preparar a análise e falar com você sobre esta solicitação.
              </p>
            </div>
          )}
        </>
      )}

      <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />
    </div>
  );
}

function ConsentRow({
  id,
  checked,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="-mx-1 flex min-h-[40px] cursor-pointer items-start gap-3 rounded-[8px] px-1 py-1.5 text-[13.5px] leading-[1.5] text-[#30322E] active:bg-[#F5F3EF] sm:text-[13px]"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-[2px] h-5 w-5 shrink-0 rounded border-[#CFCBC3] accent-[#207A50] text-[#207A50] focus:ring-[#207A50]"
      />
      <span className="min-w-0">{children}</span>
    </label>
  );
}

function QuestionBlock({
  question,
  value,
  error,
  onSelect,
}: {
  question: Question;
  value: string | string[];
  error?: string;
  onSelect: (question: Question, value: string) => void;
}) {
  return (
    <fieldset id={`q-${question.field}`} className="border-0 p-0">
      <legend className="block text-[16px] font-[600] leading-[1.3] text-[#191A18] sm:text-[17px] sm:leading-[1.35]">
        {question.question}
      </legend>
      {question.description ? (
        <p className="mt-1 text-[12.5px] leading-[1.45] text-[#5F625E] sm:mt-1.5 sm:text-[13px] sm:leading-[1.5]">
          {question.description}
        </p>
      ) : null}
      <div
        className="mt-3 grid gap-2 sm:mt-4 sm:gap-2.5"
        role={question.multiple ? "group" : "radiogroup"}
      >
        {question.options.map((opt) => {
          const active = Array.isArray(value) ? value.includes(opt.v) : value === opt.v;
          return (
            <OptionCard
              key={opt.v}
              active={active}
              multiple={question.multiple}
              onClick={() => onSelect(question, opt.v)}
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

function SuccessState({ email, onReset }: { email: string; onReset: () => void }) {
  return (
    <div className="py-2 text-center" aria-live="polite">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF6F0] text-[#207A50]">
        <CheckCircle2 className="h-8 w-8" strokeWidth={2.25} />
      </div>
      <h3 className="mt-4 text-[22px] font-[650] leading-[1.25] tracking-[-0.02em] text-[#191A18] sm:text-[24px]">
        Recebemos suas respostas.
      </h3>
      <p className="mx-auto mt-2 max-w-[420px] text-[15px] leading-[1.6] text-[#5F625E]">
        Vamos preparar a análise da sua operação e enviar
        {email ? ` para ${email}` : " para o e-mail informado"}.
      </p>
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
