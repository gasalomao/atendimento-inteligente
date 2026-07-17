import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LeadForm } from "@/components/lead-form";
import { captureAndPersistTracking, trackOnce } from "@/lib/tracking";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Quando a loja enche, o WhatsApp para — atendimento com IA para lojas de iPhone",
      },
      {
        name: "description",
        content:
          "O atendimento com IA responde as primeiras perguntas, entende o aparelho procurado e deixa a conversa organizada para o vendedor continuar.",
      },
      {
        property: "og:title",
        content:
          "Quando a loja enche, o WhatsApp para — atendimento com IA para lojas de iPhone",
      },
      {
        property: "og:description",
        content:
          "Enquanto os vendedores atendem no balcão, a IA responde as primeiras mensagens e organiza tudo para o vendedor continuar.",
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
      <div className="mx-auto w-full max-w-[1180px] px-[18px] pb-10 pt-4 sm:px-6 sm:pb-16 sm:pt-8 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:px-8 lg:pb-20 lg:pt-14">
        <div className="lg:self-center">
          <p className="text-[11px] font-[600] uppercase tracking-[0.14em] text-[#207A50] sm:text-[13px]">
            Atendimento 24h para lojas de iPhone
          </p>
          <h1 className="mt-2 max-w-[620px] text-[clamp(26px,7.4vw,32px)] font-[650] leading-[1.1] tracking-[-0.028em] text-[#191A18] sm:mt-4 sm:text-[clamp(34px,4.2vw,52px)] sm:leading-[1.08]">
            Seu WhatsApp respondendo 24 horas. Sem perder cliente para outra loja.
          </h1>
          <p className="mt-3 max-w-[560px] text-[15px] leading-[1.5] text-[#5F625E] sm:mt-5 sm:text-[17px] sm:leading-[1.55]">
            A IA responde na hora, de dia, de noite e nos fins de semana. O vendedor entra na conversa já sabendo o que o cliente quer.
          </p>
          <ul className="mt-4 hidden space-y-2.5 text-[15px] leading-[1.45] text-[#191A18] sm:mt-6 sm:block sm:text-[16px]">
            <HeroPoint>Responde na hora, mesmo com a loja cheia</HeroPoint>
            <HeroPoint>Atende de madrugada e nos fins de semana</HeroPoint>
            <HeroPoint>Retoma conversas que ficaram paradas</HeroPoint>
          </ul>
        </div>

        <div className="mt-5 lg:mt-0 lg:self-center">
          <LeadForm />
        </div>
      </div>
    </section>
  );
}

function HeroPoint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="mt-[3px] h-4 w-4 shrink-0 text-[#207A50]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 10.5l4 4 8-9" />
      </svg>
      <span>{children}</span>
    </li>
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
          <a
            href="/metricas"
            className="text-[13px] text-[#F5F3EE]/60 transition-colors hover:text-[#F5F3EE]/80"
            title=""
            aria-label="Informações"
          >
            · © {new Date().getFullYear()}
          </a>
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
    </footer>
  );
}
