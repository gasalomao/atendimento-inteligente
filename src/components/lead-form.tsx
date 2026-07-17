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
  | "proprietario_socio"
  | "participa_decisao"
  | "precisa_conversar"
  | "nao_decisor";
type Faturamento =
  | ""
  | "ate_30k"
  | "30k_50k"
  | "50k_100k"
  | "100k_300k"
  | "acima_300k"
  | "prefere_nao_dizer";
type Problema =
  | ""
  | "demora"
  | "orcamento_sem_retorno"
  | "sem_retomar_conversa"
  | "fora_do_horario"
  | "vendedores_sobrecarregados"
  | "falta_organizacao";
type Investimento =
  | ""
  | "consegue_investir"
  | "avaliar_depois"
  | "precisa_conversar"
  | "acima_orcamento";

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

  function validateStep2(): boolean {
    const e: Errors = {};
    if (!step2.papel) e.papel = "Escolha uma opção para continuar.";
    if (!step2.faturamento) e.faturamento = "Escolha uma opção para continuar.";
    if (!step2.problema_principal)
      e.problema_principal = "Escolha uma opção para continuar.";
    if (!step2.investimento)
      e.investimento = "Escolha uma opção para continuar.";
    if (!step2.consentimento)
      e.consentimento = "É necessário autorizar o contato.";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const first = Object.keys(e)[0];
      const el = document.getElementById(`q-${first}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }

  function onContinue() {
    markStarted();
    if (!validateStep1()) return;
    track("form_step_1_complete");
    setStep(2);
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
                  onChange={(e) =>
                    setStep1((s) => ({ ...s, nome: e.target.value }))
                  }
                  onBlur={() => {
                    if (step1.nome.trim().length < 2)
                      setErrors((x) => ({ ...x, nome: "Digite seu nome." }));
                    else setErrors((x) => ({ ...x, nome: undefined }));
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
                  }}
                  onBlur={() => {
                    if (!step1.whatsapp.trim())
                      setErrors((x) => ({
                        ...x,
                        whatsapp: "Digite seu número de WhatsApp.",
                      }));
                    else if (!isValidBRPhone(step1.whatsapp))
                      setErrors((x) => ({
                        ...x,
                        whatsapp: "Confira o número e inclua o DDD.",
                      }));
                    else setErrors((x) => ({ ...x, whatsapp: undefined }));
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
                  onChange={(e) =>
                    setStep1((s) => ({ ...s, loja: e.target.value }))
                  }
                  onBlur={() => {
                    if (step1.loja.trim().length < 2)
                      setErrors((x) => ({
                        ...x,
                        loja: "Digite o nome ou Instagram da loja.",
                      }));
                    else setErrors((x) => ({ ...x, loja: undefined }));
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
                  onChange={(e) =>
                    setStep1((s) => ({ ...s, email: e.target.value }))
                  }
                  onBlur={() => {
                    if (step1.email.trim() === "")
                      setErrors((x) => ({ ...x, email: undefined }));
                    else {
                      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                        step1.email.trim(),
                      );
                      setErrors((x) => ({
                        ...x,
                        email: ok ? undefined : "Confira o e-mail.",
                      }));
                    }
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
            <div className="mt-5 space-y-6">
              <div>
                <p className="text-[15px] font-medium text-[#101828]">
                  Agora, sobre sua loja
                </p>
                <p className="mt-1 text-sm text-[#667085]">
                  Escolha as opções que mais combinam com sua realidade.
                </p>
              </div>

              <fieldset id="q-papel">
                <legend className="mb-2 block text-sm font-semibold text-[#101828]">
                  Você participa da decisão sobre novas ferramentas para a
                  loja?
                </legend>
                <div className="grid gap-2">
                  {[
                    {
                      v: "proprietario_socio",
                      t: "Sim, sou proprietário ou sócio",
                    },
                    { v: "participa_decisao", t: "Sim, participo da decisão" },
                    {
                      v: "precisa_conversar",
                      t: "Preciso conversar com outro responsável",
                    },
                    { v: "nao_decisor", t: "Não participo da decisão" },
                  ].map((opt) => (
                    <OptionCard
                      key={opt.v}
                      active={step2.papel === opt.v}
                      onClick={() =>
                        setStep2((s) => ({
                          ...s,
                          papel: opt.v as Papel,
                        }))
                      }
                    >
                      {opt.t}
                    </OptionCard>
                  ))}
                </div>
                <ErrorText id="err-papel" msg={errors.papel} />
              </fieldset>

              <fieldset id="q-faturamento">
                <legend className="mb-1 block text-sm font-semibold text-[#101828]">
                  Qual faixa representa melhor o faturamento mensal da loja?
                </legend>
                <p className="mb-2 text-xs text-[#667085]">
                  Não precisa informar o valor exato.
                </p>
                <div className="grid gap-2">
                  {[
                    { v: "ate_30k", t: "Até R$ 30 mil" },
                    { v: "30k_50k", t: "De R$ 30 mil a R$ 50 mil" },
                    { v: "50k_100k", t: "De R$ 50 mil a R$ 100 mil" },
                    { v: "100k_300k", t: "De R$ 100 mil a R$ 300 mil" },
                    { v: "acima_300k", t: "Acima de R$ 300 mil" },
                    {
                      v: "prefere_nao_dizer",
                      t: "Prefiro conversar sobre isso depois",
                    },
                  ].map((opt) => (
                    <OptionCard
                      key={opt.v}
                      active={step2.faturamento === opt.v}
                      onClick={() =>
                        setStep2((s) => ({
                          ...s,
                          faturamento: opt.v as Faturamento,
                        }))
                      }
                    >
                      {opt.t}
                    </OptionCard>
                  ))}
                </div>
                <ErrorText id="err-faturamento" msg={errors.faturamento} />
              </fieldset>

              <fieldset id="q-problema_principal">
                <legend className="mb-2 block text-sm font-semibold text-[#101828]">
                  O que mais atrapalha suas vendas pelo WhatsApp hoje?
                </legend>
                <div className="grid gap-2">
                  {[
                    { v: "demora", t: "Demoramos para responder" },
                    {
                      v: "orcamento_sem_retorno",
                      t: "Muitos clientes pedem preço e desaparecem",
                    },
                    {
                      v: "sem_retomar_conversa",
                      t: "Ninguém volta a falar com quem não comprou",
                    },
                    {
                      v: "fora_do_horario",
                      t: "Chegam mensagens fora do horário",
                    },
                    {
                      v: "vendedores_sobrecarregados",
                      t: "Os vendedores ficam sobrecarregados",
                    },
                    {
                      v: "falta_organizacao",
                      t: "Falta organização no atendimento",
                    },
                  ].map((opt) => (
                    <OptionCard
                      key={opt.v}
                      active={step2.problema_principal === opt.v}
                      onClick={() =>
                        setStep2((s) => ({
                          ...s,
                          problema_principal: opt.v as Problema,
                        }))
                      }
                    >
                      {opt.t}
                    </OptionCard>
                  ))}
                </div>
                <ErrorText
                  id="err-problema_principal"
                  msg={errors.problema_principal}
                />
              </fieldset>

              <fieldset id="q-investimento">
                <legend className="mb-2 block text-sm font-semibold text-[#101828]">
                  Se a ferramenta fizer sentido para sua loja, como você
                  avalia um investimento de R$ 1.500 por mês?
                </legend>
                <div className="grid gap-2">
                  {[
                    {
                      v: "consegue_investir",
                      t: "Consigo investir esse valor se enxergar resultado",
                    },
                    {
                      v: "avaliar_depois",
                      t: "Posso avaliar esse valor depois de entender como funciona",
                    },
                    {
                      v: "precisa_conversar",
                      t: "Preciso conversar com outro responsável",
                    },
                    {
                      v: "acima_orcamento",
                      t: "Hoje esse valor está acima do meu orçamento",
                    },
                  ].map((opt) => (
                    <OptionCard
                      key={opt.v}
                      active={step2.investimento === opt.v}
                      onClick={() =>
                        setStep2((s) => ({
                          ...s,
                          investimento: opt.v as Investimento,
                        }))
                      }
                    >
                      {opt.t}
                    </OptionCard>
                  ))}
                </div>
                <ErrorText id="err-investimento" msg={errors.investimento} />
              </fieldset>

              <div id="q-consentimento" className="rounded-lg bg-[#F6F7F9] p-4">
                <label className="flex items-start gap-3 text-sm text-[#101828]">
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
                  onClick={() => setStep(1)}
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
