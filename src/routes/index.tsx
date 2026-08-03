import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LeadForm } from "@/components/lead-form";
import { PrivacyDialog } from "@/components/privacy-dialog";
import { captureAndPersistTracking, trackOnce } from "@/lib/tracking";
import { ChevronDown } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Enquanto você demora, o cliente chama outra loja — Salomão",
      },
      {
        name: "description",
        content:
          "Enquanto sua equipe atende no balcão, continuam chegando mensagens sobre preço, estoque, troca e parcelamento. Nosso atendimento responde as primeiras perguntas e entrega a conversa pronta para o vendedor.",
      },
      {
        property: "og:title",
        content: "Enquanto você demora, o cliente chama outra loja — Salomão",
      },
      {
        property: "og:description",
        content:
          "Atendimento no WhatsApp para lojas que vendem iPhone: responde preço, estoque, troca e parcelamento e entrega a conversa pronta para o vendedor.",
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

      <Header onOpenPrivacy={() => setPrivacyOpen(true)} />

      <main>
        <HeroSection formStep={formStep} onStepChange={setFormStep} />

        <div className={formStep === 2 ? "hidden lg:block" : "block"}>
          <HowSection />
          <PainSection />
          <FaqSection />
          <FinalCtaSection onScrollToForm={scrollToForm} />
        </div>
      </main>

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
      className={`sticky top-0 z-40 border-b transition-colors ${
        scrolled
          ? "border-[#DCD8D0] bg-[#F7F5F1]/92 backdrop-blur"
          : "border-[#E3E0D9] bg-[#F7F5F1]"
      }`}
    >
      <div className="mx-auto flex h-[54px] w-full max-w-[1140px] items-center justify-between gap-4 px-5 sm:h-[68px] sm:px-6 lg:px-8">
        <a href="/" className="flex min-w-0 items-baseline gap-3" aria-label="Salomão — Página inicial">
          <span className="truncate text-[15px] font-[650] uppercase tracking-[0.2em] text-[#191A18] sm:text-[16px]">
            Salomão
          </span>
          <span className="hidden border-l border-[#D8D4CC] pl-3 text-[12px] leading-none text-[#6B6E69] sm:block">
            Atendimento no WhatsApp para lojas de iPhone
          </span>
        </a>

        <button
          type="button"
          onClick={onOpenPrivacy}
          className="-mr-2 flex min-h-[40px] shrink-0 items-center px-2 text-[12.5px] text-[#6B6E69] underline-offset-4 transition-colors hover:text-[#191A18] hover:underline sm:text-[13px]"
        >
          Privacidade
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
      <div className="hero-shell mx-auto w-full max-w-[1140px] px-5 pb-8 pt-5 sm:px-6 sm:pb-16 sm:pt-12 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:gap-16 lg:px-8 lg:pb-24 lg:pt-16">
        {/* Coluna editorial */}
        <div className={`lg:self-start ${formStep === 2 ? "hidden lg:block" : "block"}`}>
          <p className="text-[11px] font-[600] uppercase tracking-[0.18em] text-[#6B6E69]">
            Diagnóstico de atendimento
          </p>

          <h1 className="mt-3 max-w-[620px] text-[clamp(28px,7.6vw,36px)] font-[650] leading-[1.1] tracking-[-0.03em] text-[#191A18] sm:mt-4 sm:text-[clamp(36px,4.4vw,52px)] sm:leading-[1.06]">
            Enquanto você demora, o cliente chama outra loja.
          </h1>

          <p className="mt-4 max-w-[540px] text-[15.5px] leading-[1.6] text-[#4F524D] sm:mt-5 sm:text-[17.5px]">
            Sua equipe atende no balcão e as mensagens continuam chegando: preço, estoque,
            troca, parcelamento. Nós respondemos as primeiras perguntas no WhatsApp da própria
            loja e entregamos a conversa organizada para o vendedor fechar.
          </p>

          <div className="mt-8 hidden max-w-[560px] lg:block">
            <HeroFacts />
          </div>
        </div>

        {/* Coluna formulário */}
        <div className="mt-6 lg:mt-0">
          <LeadForm id="formulario" onStepChange={onStepChange} />

          {formStep === 1 && (
            <div className="mt-7 block lg:hidden">
              <HeroFacts />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const FACTS: { k: string; v: string }[] = [
  { k: "Tempo de resposta", v: "Segundos, inclusive com a loja cheia" },
  { k: "Retomada de contatos", v: "Quem pediu preço e parou de responder" },
  { k: "Fora do horário", v: "Noites e fins de semana, com regras da loja" },
  { k: "Ferramenta", v: "WhatsApp da própria loja, sem aplicativo novo" },
];

function HeroFacts() {
  return (
    <div>
      <dl className="border-t border-[#DCD8D0]">
        {FACTS.map((f) => (
          <div
            key={f.k}
            className="flex flex-col gap-0.5 border-b border-[#E6E3DC] py-3 sm:flex-row sm:items-baseline sm:gap-6 sm:py-3.5"
          >
            <dt className="shrink-0 text-[11.5px] font-[600] uppercase tracking-[0.1em] text-[#8A8D87] sm:w-[168px]">
              {f.k}
            </dt>
            <dd className="min-w-0 text-[14.5px] leading-[1.45] text-[#262824] sm:text-[15px]">
              {f.v}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[13px] leading-[1.5] text-[#8A8D87]">
        Trabalhamos com lojas em operação e faturamento a partir de R$ 40 mil por mês.
      </p>
    </div>
  );
}

function HowSection() {
  const steps = [
    {
      n: "01",
      t: "Mapeamos as perguntas que a loja mais recebe",
      d: "Preço, disponibilidade, condição do aparelho, troca, formas de pagamento e prazo de entrega.",
    },
    {
      n: "02",
      t: "Definimos as regras de resposta com você",
      d: "Nada de informação inventada: as respostas seguem a tabela, o estoque e as políticas que a loja aprova.",
    },
    {
      n: "03",
      t: "A conversa chega pronta para o vendedor",
      d: "Aparelho procurado, capacidade, condição, troca, saúde da bateria e forma de pagamento em um resumo curto.",
    },
  ];

  return (
    <section className="border-b border-[#E3E0D9] bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-[1140px] px-5 sm:px-6 lg:px-8">
        <div className="max-w-[620px]">
          <p className="text-[11px] font-[600] uppercase tracking-[0.18em] text-[#6B6E69]">
            Como funciona
          </p>
          <h2 className="mt-3 text-[24px] font-[650] leading-[1.16] tracking-[-0.025em] text-[#191A18] sm:text-[34px]">
            O começo da conversa deixa de ser gargalo. A negociação continua sendo humana.
          </h2>
        </div>

        <ol className="mt-10 grid gap-px overflow-hidden border-y border-[#E3E0D9] md:grid-cols-3 md:border md:bg-[#E3E0D9]">
          {steps.map((s) => (
            <li key={s.n} className="border-b border-[#E3E0D9] bg-white p-6 last:border-b-0 md:border-0 md:p-7">
              <span className="text-[12px] font-[650] tracking-[0.14em] text-[#207A50]">{s.n}</span>
              <h3 className="mt-4 text-[16.5px] font-[650] leading-[1.3] text-[#191A18]">{s.t}</h3>
              <p className="mt-2 text-[14px] leading-[1.6] text-[#5F625E]">{s.d}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-10 border-t border-[#E3E0D9] pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-16">
          <div>
            <h3 className="text-[12px] font-[600] uppercase tracking-[0.14em] text-[#8A8D87]">
              Trecho de uma conversa real de loja
            </h3>
            <div className="mt-5 space-y-4 border-l-2 border-[#E3E0D9] pl-5 text-[14.5px] leading-[1.6]">
              <p>
                <span className="mr-2 text-[11.5px] font-[650] uppercase tracking-[0.1em] text-[#8A8D87]">
                  Cliente
                </span>
                <span className="text-[#262824]">Tem iPhone 15 Pro 256 GB?</span>
              </p>
              <p>
                <span className="mr-2 text-[11.5px] font-[650] uppercase tracking-[0.1em] text-[#207A50]">
                  Loja
                </span>
                <span className="text-[#262824]">Você procura novo ou seminovo?</span>
              </p>
              <p>
                <span className="mr-2 text-[11.5px] font-[650] uppercase tracking-[0.1em] text-[#8A8D87]">
                  Cliente
                </span>
                <span className="text-[#262824]">
                  Seminovo. Tenho um iPhone 13 para dar na troca.
                </span>
              </p>
              <p>
                <span className="mr-2 text-[11.5px] font-[650] uppercase tracking-[0.1em] text-[#207A50]">
                  Loja
                </span>
                <span className="text-[#262824]">
                  Como está o aparelho, qual é a saúde da bateria e o pagamento seria à vista ou
                  parcelado?
                </span>
              </p>
              <p>
                <span className="mr-2 text-[11.5px] font-[650] uppercase tracking-[0.1em] text-[#8A8D87]">
                  Cliente
                </span>
                <span className="text-[#262824]">
                  Bem conservado, bateria em 87% e quero parcelar.
                </span>
              </p>
            </div>
          </div>

          <div className="border-t border-[#E3E0D9] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <h3 className="text-[12px] font-[600] uppercase tracking-[0.14em] text-[#8A8D87]">
              O que o vendedor recebe
            </h3>
            <dl className="mt-5 text-[14px]">
              {[
                ["Aparelho procurado", "iPhone 15 Pro"],
                ["Capacidade", "256 GB"],
                ["Condição", "Seminovo"],
                ["Troca", "iPhone 13"],
                ["Saúde da bateria", "87%"],
                ["Pagamento", "Parcelado"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between gap-4 border-b border-[#EDEAE4] py-2.5"
                >
                  <dt className="min-w-0 text-[#8A8D87]">{k}</dt>
                  <dd className="text-right font-[600] text-[#262824]">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[13px] leading-[1.55] text-[#6B6E69]">
              O resumo chega antes do vendedor abrir a conversa. Preço, estoque e condições
              seguem apenas o que a loja definiu.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PainSection() {
  const items = [
    {
      t: "A loja enche e as mensagens continuam chegando",
      d: "O vendedor escolhe entre quem está no balcão e quem chamou no WhatsApp. Alguém sempre espera.",
    },
    {
      t: "O cliente pede preço e desaparece",
      d: "Sem ninguém para retomar, aquele interesse volta a circular entre as outras lojas.",
    },
    {
      t: "À noite e no fim de semana a procura não para",
      d: "Quando a resposta sai no dia seguinte, a decisão de compra já pode ter sido tomada.",
    },
  ];

  return (
    <section className="border-b border-[#E3E0D9] bg-[#F7F5F1] py-14 sm:py-20">
      <div className="mx-auto max-w-[1140px] px-5 sm:px-6 lg:px-8">
        <div className="max-w-[620px]">
          <p className="text-[11px] font-[600] uppercase tracking-[0.18em] text-[#6B6E69]">
            O contexto
          </p>
          <h2 className="mt-3 text-[24px] font-[650] leading-[1.16] tracking-[-0.025em] text-[#191A18] sm:text-[34px]">
            O cliente não espera a loja ficar mais tranquila.
          </h2>
          <p className="mt-4 text-[15.5px] leading-[1.6] text-[#5F625E] sm:text-[17px]">
            Quem procura um iPhone consulta várias lojas no mesmo dia e compara preço,
            disponibilidade, troca e parcelamento. Quem responde primeiro conduz a conversa.
          </p>
        </div>

        <div className="mt-10 divide-y divide-[#E3E0D9] border-t border-[#DCD8D0]">
          {items.map((it) => (
            <div key={it.t} className="grid gap-2 py-6 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:gap-10">
              <h3 className="text-[16.5px] font-[650] leading-[1.3] text-[#191A18]">{it.t}</h3>
              <p className="text-[14.5px] leading-[1.6] text-[#5F625E]">{it.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Isso substitui meus vendedores?",
      a: "Não. O atendimento cobre o começo da conversa, reúne informações e retoma contatos parados. Negociação, avaliação de aparelho, condições especiais e fechamento continuam com a sua equipe.",
    },
    {
      q: "Pode responder preço e estoque?",
      a: "Sim, quando essas informações estiverem configuradas ou integradas ao sistema da loja. Nada é respondido fora do que a loja definiu.",
    },
    {
      q: "Funciona fora do horário comercial?",
      a: "Sim. Responde as primeiras perguntas à noite, em fins de semana e nos horários em que a equipe está ocupada, seguindo as regras configuradas.",
    },
    {
      q: "O que acontece depois que eu responder o formulário?",
      a: "Analisamos suas respostas e falamos com você pelo WhatsApp para mostrar como o atendimento funcionaria na rotina da sua loja.",
    },
  ];

  return (
    <section className="border-b border-[#E3E0D9] bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-[880px] px-5 sm:px-6 lg:px-8">
        <p className="text-[11px] font-[600] uppercase tracking-[0.18em] text-[#6B6E69]">
          Perguntas frequentes
        </p>

        <div className="mt-7 border-t border-[#DCD8D0]">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="border-b border-[#E6E3DC]">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex min-h-[56px] w-full items-center justify-between gap-4 py-4 text-left"
                >
                  <span className="min-w-0 text-[15.5px] font-[600] leading-[1.35] text-[#191A18] sm:text-[16.5px]">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-4.5 w-4.5 shrink-0 text-[#8A8D87] transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="max-w-[680px] pb-5 text-[14.5px] leading-[1.65] text-[#5F625E]">
                    {faq.a}
                  </p>
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
    <section className="border-b border-[#E3E0D9] bg-[#F7F5F1] py-14 sm:py-20">
      <div className="mx-auto flex max-w-[880px] flex-col gap-6 px-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="max-w-[520px]">
          <h2 className="text-[24px] font-[650] leading-[1.16] tracking-[-0.025em] text-[#191A18] sm:text-[32px]">
            Quantas conversas sua loja está deixando para depois?
          </h2>
          <p className="mt-3 text-[15px] leading-[1.6] text-[#5F625E] sm:text-[16.5px]">
            Responda cinco perguntas e recebemos um retrato do seu atendimento atual.
          </p>
        </div>

        <div className="shrink-0">
          <a
            href="#formulario"
            onClick={onScrollToForm}
            className="flex min-h-[52px] items-center justify-center rounded-[6px] bg-[#191A18] px-8 text-[15.5px] font-[600] text-white transition-colors duration-150 hover:bg-[#0F100E]"
          >
            Começar o diagnóstico
          </a>
          <p className="mt-2 text-[12.5px] text-[#8A8D87] lg:text-right">Cerca de 1 minuto.</p>
        </div>
      </div>
    </section>
  );
}

function Footer({ onOpenPrivacy }: { onOpenPrivacy: () => void }) {
  return (
    <footer className="bg-[#191A18] text-[#F5F3EE]">
      <div className="mx-auto flex w-full max-w-[1140px] flex-col gap-8 px-5 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
        <div>
          <span className="text-[14px] font-[650] uppercase tracking-[0.2em] text-[#F5F3EE]">
            Salomão
          </span>
          <p className="mt-3 max-w-[420px] text-[13.5px] leading-[1.6] text-[#F5F3EE]/70">
            Atendimento no WhatsApp para lojas que vendem iPhone. Sem vínculo oficial com a Apple.
          </p>
          <a
            href="/metricas"
            className="mt-4 block text-[12px] text-[#F5F3EE]/40 transition-colors hover:text-[#F5F3EE]/70"
            title="Painel interno"
          >
            © {new Date().getFullYear()} Salomão. Todos os direitos reservados.
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="text-[#F5F3EE]/80 underline-offset-4 transition-colors hover:text-[#F5F3EE] hover:underline"
          >
            Política de Privacidade
          </button>
          <a
            href="mailto:ga.pancione@gmail.com"
            className="text-[#F5F3EE]/80 underline-offset-4 transition-colors hover:text-[#F5F3EE] hover:underline"
          >
            ga.pancione@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
