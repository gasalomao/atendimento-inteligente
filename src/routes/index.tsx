import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LeadForm } from "@/components/lead-form";
import { PrivacyDialog } from "@/components/privacy-dialog";
import { captureAndPersistTracking, trackOnce } from "@/lib/tracking";
import { Check, ChevronDown, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Enquanto você demora, o cliente chama outra loja — Salomão AI",
      },
      {
        name: "description",
        content:
          "Enquanto sua equipe atende no balcão, continuam chegando mensagens sobre preço, estoque, troca e parcelamento. A IA responde as primeiras perguntas e deixa a conversa pronta para o vendedor continuar.",
      },
      {
        property: "og:title",
        content:
          "Enquanto você demora, o cliente chama outra loja — Salomão AI",
      },
      {
        property: "og:description",
        content:
          "A IA responde as primeiras perguntas sobre preço, estoque, troca e parcelamento e deixa a conversa pronta para o vendedor continuar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#F7F5F1" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2>(1);

  useEffect(() => {
    captureAndPersistTracking();
    trackOnce("page_view", { page: "landing" });
  }, []);

  const scrollToForm = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const el = document.getElementById("f-nome") || document.getElementById("formulario");
    if (el) {
      const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: isReduced ? "auto" : "smooth", block: "start" });
      el.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F1] font-sans text-[#191A18] antialiased selection:bg-[#207A50]/20">
      <a
        href="#formulario"
        onClick={scrollToForm}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[#191A18] focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Ir para o formulário
      </a>

      {/* 1. Cabeçalho */}
      <Header onOpenPrivacy={() => setPrivacyOpen(true)} />

      <main>
        {/* 1. Hero + Formulário */}
        <HeroSection formStep={formStep} onStepChange={setFormStep} />

        {/* Seções seguintes (ocultas no mobile quando o formulário estiver na Etapa 2) */}
        <div className={formStep === 2 ? "hidden lg:block" : "block"}>
          {/* 2. Demonstração */}
          <DemoSection />

          {/* 3. Situações de dor */}
          <PainSection />

          {/* 4. Dúvidas */}
          <FaqSection />

          {/* 5. CTA final */}
          <FinalCtaSection onScrollToForm={scrollToForm} />
        </div>
      </main>

      {/* 6. Rodapé */}
      <div className={formStep === 2 ? "hidden lg:block" : "block"}>
        <Footer onOpenPrivacy={() => setPrivacyOpen(true)} />
      </div>

      <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />
    </div>
  );
}

function Header({ onOpenPrivacy }: { onOpenPrivacy: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-shadow ${
        scrolled
          ? "border-[#E3E0D9] bg-[#F7F5F1]/85 shadow-[0_8px_30px_rgba(25,26,24,0.06)] backdrop-blur"
          : "border-transparent bg-[#F7F5F1]"
      }`}
    >
      <div className="mx-auto flex h-[56px] w-full max-w-[1180px] items-center justify-between px-5 sm:h-16 sm:px-6 lg:px-8">
        <a
          href="/"
          className="flex items-center gap-2.5"
          aria-label="Salomão AI — Página inicial"
        >
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-md bg-[#191A18] text-[13px] font-semibold text-[#F7F5F1]"
          >
            S
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[#191A18]">
            Salomão AI
          </span>
        </a>

        <button
          type="button"
          onClick={onOpenPrivacy}
          className="text-[13px] text-[#5F625E] hover:text-[#191A18] transition-colors"
        >
          Política de Privacidade
        </button>
      </div>
    </header>
  );
}

function HeroSection({
  formStep,
  onStepChange,
}: {
  formStep: 1 | 2;
  onStepChange: (step: 1 | 2) => void;
}) {
  return (
    <section className="border-b border-[#E3E0D9] bg-[#F7F5F1]">
      <div className="mx-auto w-full max-w-[1180px] px-[18px] pb-8 pt-4 sm:px-6 sm:pb-14 sm:pt-8 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:px-8 lg:pb-20 lg:pt-12">
        {/* Esquerda: Copy Principal */}
        <div className={`hero-copy lg:self-center ${formStep === 2 ? "hidden lg:block" : "block"}`}>
          <p className="text-[11px] font-[600] uppercase tracking-[0.14em] text-[#207A50] sm:text-[13px]">
            ATENDIMENTO NO WHATSAPP PARA LOJAS DE IPHONE
          </p>

          <h1 className="mt-2 max-w-[620px] text-[clamp(26px,7.4vw,34px)] font-[650] leading-[1.12] tracking-[-0.028em] text-[#191A18] sm:mt-3.5 sm:text-[clamp(34px,4.2vw,48px)] sm:leading-[1.08]">
            Enquanto você demora, o cliente chama outra loja.
          </h1>

          <p className="mt-3 max-w-[560px] text-[15px] leading-[1.55] text-[#5F625E] sm:mt-4 sm:text-[17px]">
            Enquanto sua equipe atende no balcão, continuam chegando mensagens sobre preço, estoque, troca e parcelamento. A IA responde as primeiras perguntas e deixa a conversa pronta para o vendedor continuar.
          </p>

          {/* Pontos de Benefício no Desktop */}
          <div className="hidden lg:block mt-6">
            <HeroPointsAndQualify />
          </div>

          {/* Phone Visual no Desktop — abaixo dos benefícios */}
          <div className="hidden lg:block">
            <HeroPhoneVisual />
          </div>
        </div>

        {/* Direita: Formulário Imediato */}
        <div className="mt-4 lg:mt-0 lg:self-center">
          <LeadForm id="formulario" onStepChange={onStepChange} />

          {/* Pontos de Benefício no Mobile (exibidos abaixo do formulário na Etapa 1) */}
          {formStep === 1 && (
            <div className="block lg:hidden mt-6 pt-2">
              <HeroPointsAndQualify />
            </div>
          )}

          {/* Phone Visual no Mobile — abaixo do formulário, Etapa 1 apenas */}
          {formStep === 1 && (
            <div className="block lg:hidden">
              <HeroPhoneVisual loading="lazy" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function HeroPointsAndQualify() {
  return (
    <>
      <ul className="space-y-2.5 text-[15px] leading-[1.45] text-[#191A18]">
        <HeroPoint>Responde mesmo com a loja cheia</HeroPoint>
        <HeroPoint>Retoma quem pediu preço e parou de responder</HeroPoint>
        <HeroPoint>Atende fora do horário, seguindo as regras da loja</HeroPoint>
      </ul>

      <p className="mt-4 text-[13px] leading-[1.5] text-[#777A75]">
        Para lojas com operação ativa e faturamento a partir de R$ 50 mil por mês.
      </p>
    </>
  );
}

function HeroPoint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <Check className="mt-[3px] h-4 w-4 shrink-0 text-[#207A50]" strokeWidth={2.8} />
      <span>{children}</span>
    </li>
  );
}

function HeroPhoneVisual({ loading }: { loading?: "lazy" | "eager" }) {
  return (
    <div className="hero-phone-visual" aria-hidden="true">
      <picture className="phone-back">
        <source srcSet="/images/iphone-back-green.avif" type="image/avif" />
        <source srcSet="/images/iphone-back-green.webp" type="image/webp" />
        <img
          src="/images/iphone-back-green.png"
          alt=""
          width="520"
          height="680"
          decoding="async"
          loading={loading}
        />
      </picture>

      <picture className="phone-front">
        <source srcSet="/images/iphone-chat-front.avif" type="image/avif" />
        <source srcSet="/images/iphone-chat-front.webp" type="image/webp" />
        <img
          src="/images/iphone-chat-front.png"
          alt=""
          width="520"
          height="680"
          decoding="async"
          loading={loading}
        />
      </picture>
    </div>
  );
}

function DemoSection() {
  return (
    <section className="border-b border-[#E3E0D9] bg-[#F7F5F1] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[24px] font-[650] leading-[1.2] tracking-[-0.02em] text-[#191A18] sm:text-[32px]">
            A IA cuida do começo. O vendedor continua a negociação.
          </h2>
          <p className="mt-3 text-[15px] leading-[1.6] text-[#5F625E] sm:text-[17px]">
            O atendimento faz as primeiras perguntas, reúne as informações e chama o vendedor quando a conversa precisa de negociação, avaliação ou decisão humana.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Chat Mockup */}
          <div className="overflow-hidden rounded-[16px] border border-[#D6D2CA] bg-[#E5DDD5] shadow-md lg:col-span-7">
            <div className="bg-[#075E54] px-4 py-3 text-white">
              <p className="text-[13px] font-[600]">Atendimento Inteligente • Sua Loja</p>
              <p className="text-[11px] text-[#DCF8C6]">WhatsApp de Atendimento</p>
            </div>
            <div className="space-y-3 p-4 text-[14px] leading-[1.45]">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-[10px] rounded-tr-none bg-[#DCF8C6] p-3 text-[#191A18]">
                  Tem iPhone 15 Pro 256 GB?
                </div>
              </div>

              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-[10px] rounded-tl-none bg-white p-3 text-[#191A18]">
                  Você procura novo ou seminovo?
                </div>
              </div>

              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-[10px] rounded-tr-none bg-[#DCF8C6] p-3 text-[#191A18]">
                  Seminovo. Tenho um iPhone 13 para dar na troca.
                </div>
              </div>

              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-[10px] rounded-tl-none bg-white p-3 text-[#191A18]">
                  Como está o aparelho, qual é a saúde da bateria e você pretende pagar à vista ou parcelado?
                </div>
              </div>

              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-[10px] rounded-tr-none bg-[#DCF8C6] p-3 text-[#191A18]">
                  Está bem conservado, bateria em 87% e quero parcelar.
                </div>
              </div>

              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-[10px] rounded-tl-none bg-white p-3 text-[#191A18]">
                  Perfeito. Vou organizar essas informações para um vendedor continuar com você.
                </div>
              </div>
            </div>
          </div>

          {/* Resumo ao Lado */}
          <div className="rounded-[14px] border border-[#DDDAD3] bg-white p-6 shadow-sm lg:col-span-5">
            <h3 className="text-[18px] font-[650] text-[#191A18]">
              Informações para o vendedor
            </h3>

            <dl className="mt-4 space-y-2.5 text-[14px] text-[#30322E]">
              <div className="flex justify-between border-b border-[#F0EEE9] pb-1.5">
                <dt className="text-[#777A75]">Aparelho procurado:</dt>
                <dd className="font-[600]">iPhone 15 Pro</dd>
              </div>
              <div className="flex justify-between border-b border-[#F0EEE9] pb-1.5">
                <dt className="text-[#777A75]">Capacidade:</dt>
                <dd className="font-[600]">256 GB</dd>
              </div>
              <div className="flex justify-between border-b border-[#F0EEE9] pb-1.5">
                <dt className="text-[#777A75]">Condição:</dt>
                <dd className="font-[600]">seminovo</dd>
              </div>
              <div className="flex justify-between border-b border-[#F0EEE9] pb-1.5">
                <dt className="text-[#777A75]">Possui troca:</dt>
                <dd className="font-[600]">sim</dd>
              </div>
              <div className="flex justify-between border-b border-[#F0EEE9] pb-1.5">
                <dt className="text-[#777A75]">Aparelho da troca:</dt>
                <dd className="font-[600]">iPhone 13</dd>
              </div>
              <div className="flex justify-between border-b border-[#F0EEE9] pb-1.5">
                <dt className="text-[#777A75]">Saúde da bateria:</dt>
                <dd className="font-[600]">87%</dd>
              </div>
              <div className="flex justify-between pb-1.5">
                <dt className="text-[#777A75]">Forma de pagamento:</dt>
                <dd className="font-[600]">parcelado</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-center gap-2 rounded-[8px] bg-[#EDF6F0] p-3 text-[13px] font-[600] text-[#207A50]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Pronto para o vendedor continuar</span>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[13px] text-[#5F625E]">
          A IA não inventa preço, estoque ou condições. Ela trabalha com as informações e regras definidas pela loja.
        </p>
      </div>
    </section>
  );
}

function PainSection() {
  return (
    <section className="border-b border-[#E3E0D9] bg-white py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[24px] font-[650] leading-[1.2] tracking-[-0.02em] text-[#191A18] sm:text-[32px]">
            O cliente não espera a loja ficar mais tranquila.
          </h2>
          <p className="mt-3 text-[15px] leading-[1.6] text-[#5F625E] sm:text-[17px]">
            Quem procura um iPhone geralmente consulta diferentes lojas e compara preço, disponibilidade, troca e forma de pagamento. O atendimento que responde primeiro começa a conversa em vantagem.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-[12px] border border-[#E3E0D9] bg-[#FAF9F7] p-6">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-[#191A18] text-xs font-bold text-white">
              1
            </div>
            <h3 className="mt-4 text-[17px] font-[650] leading-[1.3] text-[#191A18]">
              A loja enche e as mensagens continuam chegando.
            </h3>
            <p className="mt-2 text-[14px] leading-[1.55] text-[#5F625E]">
              O vendedor precisa escolher entre atender quem está no balcão ou responder quem chamou pelo WhatsApp.
            </p>
          </div>

          <div className="rounded-[12px] border border-[#E3E0D9] bg-[#FAF9F7] p-6">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-[#191A18] text-xs font-bold text-white">
              2
            </div>
            <h3 className="mt-4 text-[17px] font-[650] leading-[1.3] text-[#191A18]">
              O cliente pede preço e para de responder.
            </h3>
            <p className="mt-2 text-[14px] leading-[1.55] text-[#5F625E]">
              Sem alguém para retomar a conversa, aquele interesse pode acabar em outra loja.
            </p>
          </div>

          <div className="rounded-[12px] border border-[#E3E0D9] bg-[#FAF9F7] p-6">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-[#191A18] text-xs font-bold text-white">
              3
            </div>
            <h3 className="mt-4 text-[17px] font-[650] leading-[1.3] text-[#191A18]">
              À noite e nos fins de semana, a procura continua.
            </h3>
            <p className="mt-2 text-[14px] leading-[1.55] text-[#5F625E]">
              Quando a resposta chega somente no day seguinte, o cliente pode já ter encontrado outra opção.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "A IA substitui meus vendedores?",
      a: "Não. Ela responde o começo da conversa, reúne informações e retoma contatos que ficaram parados. Os vendedores continuam responsáveis por negociação, avaliação de aparelhos, condições especiais e fechamento.",
    },
    {
      q: "Ela pode responder preços e estoque?",
      a: "Sim, quando essas informações estiverem configuradas ou integradas ao sistema da loja. A IA nunca deve inventar preços, disponibilidade ou condições.",
    },
    {
      q: "O atendimento funciona fora do horário?",
      a: "Sim. Ele pode responder as primeiras perguntas à noite, em fins de semana e nos períodos em que a equipe estiver ocupada, conforme as regras configuradas.",
    },
    {
      q: "O que acontece depois que eu responder?",
      a: "Vamos analisar suas respostas e entrar em contato pelo WhatsApp para mostrar como o atendimento poderia funcionar na rotina da sua loja.",
    },
  ];

  return (
    <section className="border-b border-[#E3E0D9] bg-white py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[820px] px-5 sm:px-6 lg:px-8">
        <h2 className="text-center text-[24px] font-[650] leading-[1.2] tracking-[-0.02em] text-[#191A18] sm:text-[32px]">
          Dúvidas comuns
        </h2>

        <div className="mt-8 space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-[10px] border border-[#E3E0D9] bg-[#FAF9F7]"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-4 text-left font-[600] text-[#191A18] sm:p-5"
                >
                  <span className="text-[15px] sm:text-[16px]">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#777A75] transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#207A50]" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-[#E8E5DF] bg-white p-4 text-[14px] leading-[1.6] text-[#5F625E] sm:p-5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection({ onScrollToForm }: { onScrollToForm: (e: React.MouseEvent) => void }) {
  return (
    <section className="border-b border-[#E3E0D9] bg-[#F7F5F1] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[820px] px-5 text-center sm:px-6 lg:px-8">
        <h2 className="text-[24px] font-[650] leading-[1.2] tracking-[-0.02em] text-[#191A18] sm:text-[32px]">
          Quantas conversas sua loja pode estar deixando para depois?
        </h2>
        <p className="mt-3 text-[15px] leading-[1.6] text-[#5F625E] sm:text-[17px]">
          Responda algumas perguntas rápidas e veja como a IA poderia atender o começo da conversa na sua loja.
        </p>

        <div className="mt-6 flex flex-col items-center">
          <a
            href="#formulario"
            onClick={onScrollToForm}
            className="flex min-h-[52px] items-center justify-center rounded-[10px] bg-[#207A50] px-8 text-[16px] font-[600] text-white transition-colors duration-150 hover:bg-[#17613E] active:scale-[0.99]"
          >
            Solicitar minha demonstração
          </a>
          <p className="mt-2 text-[13px] text-[#777A75]">Leva cerca de 1 minuto.</p>
        </div>
      </div>
    </section>
  );
}

function Footer({ onOpenPrivacy }: { onOpenPrivacy: () => void }) {
  return (
    <footer className="bg-[#191A18] text-[#F5F3EE]">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-6 w-6 place-items-center rounded bg-[#F5F3EE] text-[11px] font-semibold text-[#191A18]"
            >
              S
            </span>
            <span className="text-[14px] font-[600] text-[#F5F3EE]">
              Salomão AI
            </span>
            <a
              href="/metricas"
              onDoubleClick={() => {
                window.location.href = "/metricas";
              }}
              className="text-[13px] text-[#F5F3EE]/60 transition-colors hover:text-[#F5F3EE] cursor-pointer"
              title="Painel de Métricas"
            >
              · © {new Date().getFullYear()} Salomão AI. Todos os direitos reservados.
            </a>
          </div>
          <p className="mt-1 text-[13px] text-[#F5F3EE]/70">
            Atendimento com IA para lojas que vendem iPhone.
          </p>
          <p className="mt-1 text-[11px] text-[#F5F3EE]/40">
            A Salomão AI não possui vínculo oficial com a Apple.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="text-[#F5F3EE]/80 transition-colors hover:text-[#F5F3EE]"
          >
            Política de Privacidade
          </button>
          <a
            href="mailto:ga.pancione@gmail.com"
            className="text-[#F5F3EE]/80 transition-colors hover:text-[#F5F3EE]"
          >
            ga.pancione@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
