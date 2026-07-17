import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LeadForm } from "@/components/lead-form";
import { captureAndPersistTracking, trackOnce } from "@/lib/tracking";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "IA que responde e organiza o WhatsApp da sua loja de iPhone",
      },
      {
        name: "description",
        content:
          "A inteligência artificial responde as primeiras perguntas, entende qual aparelho a pessoa procura e deixa a conversa organizada para o vendedor continuar.",
      },
      {
        property: "og:title",
        content:
          "IA que responde e organiza o WhatsApp da sua loja de iPhone",
      },
      {
        property: "og:description",
        content:
          "Atendimento automático para lojas de iPhone: responde na hora, retoma conversas paradas e organiza informações para o vendedor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#F7F5F1" },
    ],
  }),
  component: LandingPage,
});


function LandingPage() {
  useEffect(() => {
    captureAndPersistTracking();
    trackOnce("page_view", { page: "landing" });
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F5F1] font-sans text-[#191A18] antialiased selection:bg-[#207A50]/20">
      <a
        href="#formulario"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[#191A18] focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Ir para o formulário
      </a>
      <Header />
      <main>
        <Hero />
        <PainSection />
        <DemoSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
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
      <div className="mx-auto flex h-[56px] w-full max-w-[1180px] items-center px-5 sm:h-16 sm:px-6 lg:px-8">
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
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-[#E3E0D9] bg-[#F7F5F1]">
      <div className="mx-auto w-full max-w-[720px] px-5 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:pb-24 lg:pt-16">
        <p className="mb-6 text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-[#207A50]">
          Atendimento para lojas de iPhone
        </p>
        <LeadForm />
      </div>
    </section>
  );
}

function HeroPoint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span aria-hidden className="mt-[10px] h-px w-6 shrink-0 bg-[#207A50]" />
      <span>{children}</span>
    </li>
  );
}

function PainSection() {
  const items = [
    {
      n: "01",
      title: "Mensagens chegam enquanto o vendedor está ocupado.",
      text: "Quem está no balcão precisa escolher entre atender a pessoa presente ou responder quem chamou pelo WhatsApp.",
    },
    {
      n: "02",
      title: "O cliente pede preço e depois desaparece.",
      text: "Sem alguém para retomar a conversa, aquele interesse pode acabar em outra loja.",
    },
    {
      n: "03",
      title: "À noite e nos fins de semana, a procura continua.",
      text: "Quando a resposta chega somente no dia seguinte, o cliente pode já ter encontrado outra opção.",
    },
  ];
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-6 sm:py-24 lg:px-8">
        <h2 className="max-w-[720px] text-[clamp(30px,3vw,44px)] font-[650] leading-[1.1] tracking-[-0.025em] text-[#191A18]">
          Isso acontece na sua loja?
        </h2>

        <div className="mt-12 border-t border-[#E3E0D9]">
          {items.map((it) => (
            <article
              key={it.n}
              className="grid gap-2 border-b border-[#E3E0D9] py-8 sm:grid-cols-[80px_1fr] sm:gap-10 sm:py-10"
            >
              <span className="text-[13px] font-semibold tracking-[0.14em] text-[#207A50]">
                {it.n}
              </span>
              <div className="max-w-[720px]">
                <h3 className="text-[20px] font-[600] leading-[1.3] text-[#191A18] sm:text-[22px]">
                  {it.title}
                </h3>
                <p className="mt-3 text-[16px] leading-[1.6] text-[#5F625E] sm:text-[17px]">
                  {it.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoSection() {
  return (
    <section className="bg-[#F0EEE9]">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-6 sm:py-24 lg:px-8">
        <h2 className="max-w-[820px] text-[clamp(30px,3vw,44px)] font-[650] leading-[1.1] tracking-[-0.025em] text-[#191A18]">
          O atendimento começa organizado. O vendedor continua com mais
          informações.
        </h2>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          <ChatDemo />
          <SummaryCard />
        </div>
      </div>
    </section>
  );
}

function ChatDemo() {
  const messages: { from: "cliente" | "loja"; text: string }[] = [
    { from: "cliente", text: "Tem iPhone 15 Pro 256 GB?" },
    { from: "loja", text: "Você procura novo ou seminovo?" },
    {
      from: "cliente",
      text: "Seminovo. Tenho um iPhone 13 para dar na troca.",
    },
    {
      from: "loja",
      text: "Como está o aparelho e você pretende pagar à vista ou parcelado?",
    },
    { from: "cliente", text: "Está bem conservado e quero parcelar." },
  ];
  return (
    <div className="rounded-[14px] border border-[#DDDAD3] bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-[#E3E0D9] pb-4">
        <div className="min-w-0">
          <p className="text-[14px] font-[600] text-[#191A18]">
            Conversa pelo WhatsApp
          </p>
          <p className="mt-0.5 text-[12px] text-[#7B7E78]">
            Exemplo ilustrativo
          </p>
        </div>
        <span
          className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#7B7E78]"
          aria-hidden
        >
          Hoje
        </span>
      </div>
      <ul className="space-y-2.5">
        {messages.map((m, i) => (
          <li
            key={i}
            className={m.from === "cliente" ? "flex justify-start" : "flex justify-end"}
          >
            <div
              className={
                m.from === "cliente"
                  ? "max-w-[85%] rounded-[12px] rounded-tl-[4px] bg-[#F0EEE9] px-3.5 py-2.5 text-[15px] leading-[1.5] text-[#191A18]"
                  : "max-w-[85%] rounded-[12px] rounded-tr-[4px] bg-[#E8F3EC] px-3.5 py-2.5 text-[15px] leading-[1.5] text-[#0F3A26]"
              }
            >
              {m.text}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SummaryCard() {
  const rows: [string, string][] = [
    ["Aparelho procurado", "iPhone 15 Pro"],
    ["Capacidade", "256 GB"],
    ["Condição", "Seminovo"],
    ["Possui aparelho para troca", "Sim"],
    ["Forma de pagamento", "Parcelado"],
  ];
  return (
    <div className="rounded-[14px] border border-[#DDDAD3] bg-white p-5 sm:p-6">
      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#7B7E78]">
        Informações para o vendedor
      </p>
      <dl className="mt-5 divide-y divide-[#E3E0D9]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-[15px] text-[#5F625E]">{k}</dt>
            <dd className="text-right text-[15px] font-[600] text-[#191A18]">
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex items-center gap-2 border-t border-[#E3E0D9] pt-4 text-[13px] text-[#207A50]">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#207A50]" />
        <span className="font-[600]">Pronto para o vendedor continuar</span>
      </div>
    </div>
  );
}

function FaqSection() {
  const items = [
    {
      q: "A inteligência artificial substitui os vendedores?",
      a: "Não. Ela responde as primeiras perguntas, reúne informações e retoma conversas que ficaram paradas. A negociação e o fechamento seguem com o vendedor.",
    },
    {
      q: "Ela pode informar preços e estoque?",
      a: "Sim, quando essas informações estiverem configuradas ou integradas ao sistema da loja. Ela não inventa valores nem disponibilidade.",
    },
    {
      q: "O que acontece depois que eu responder?",
      a: "Analisamos suas respostas e entramos em contato pelo WhatsApp para mostrar como esse atendimento poderia funcionar na sua loja.",
    },
  ];
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-[760px] px-5 py-16 sm:px-6 sm:py-24 lg:px-8">
        <h2 className="text-[clamp(30px,3vw,44px)] font-[650] leading-[1.1] tracking-[-0.025em] text-[#191A18]">
          Dúvidas comuns
        </h2>
        <div className="mt-10 border-t border-[#E3E0D9]">
          {items.map((it, i) => (
            <FaqItem key={i} q={it.q} a={it.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-[#E3E0D9] py-5 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left text-[17px] font-[600] leading-[1.4] text-[#191A18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#207A50]/40 focus-visible:ring-offset-4 focus-visible:ring-offset-white">
        <span>{q}</span>
        <span
          aria-hidden
          className="relative grid h-6 w-6 shrink-0 place-items-center text-[#5F625E] transition-transform duration-[180ms] group-open:rotate-45"
        >
          <span className="absolute h-px w-3 bg-[#5F625E]" />
          <span className="absolute h-3 w-px bg-[#5F625E]" />
        </span>
      </summary>
      <p className="mt-3 max-w-[620px] text-[16px] leading-[1.65] text-[#5F625E]">
        {a}
      </p>
    </details>
  );
}

function Footer() {
  return (
    <footer className="bg-[#191A18] text-[#F5F3EE]">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
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
          <span className="text-[13px] text-[#F5F3EE]/60">
            · © {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
          <a
            href="/politica-de-privacidade"
            className="text-[#F5F3EE]/80 transition-colors hover:text-[#F5F3EE]"
          >
            Política de Privacidade
          </a>
          <a
            href="mailto:ga.pancione@gmail.com"
            className="text-[#F5F3EE]/80 transition-colors hover:text-[#F5F3EE]"
          >
            ga.pancione@gmail.com
          </a>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1180px] px-5 pb-8 text-[12px] text-[#F5F3EE]/45 sm:px-6 lg:px-8">
        Esta empresa não possui vínculo oficial com a Apple.
      </div>
    </footer>
  );
}
