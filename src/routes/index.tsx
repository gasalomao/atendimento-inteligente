import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Clock, MessageSquare, RotateCcw, Sparkles } from "lucide-react";
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
          "A IA responde na hora, entende qual iPhone o cliente procura, pergunta sobre pagamento e troca e deixa a conversa pronta para o vendedor continuar.",
      },
      {
        property: "og:title",
        content:
          "IA que responde e organiza o WhatsApp da sua loja de iPhone",
      },
      {
        property: "og:description",
        content:
          "Responde novos contatos, entende o aparelho, pergunta sobre pagamento e troca, e entrega a conversa pronta para o vendedor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function scrollToForm() {
  if (typeof window === "undefined") return;
  const el = document.getElementById("formulario");
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function LandingPage() {
  useEffect(() => {
    captureAndPersistTracking();
    trackOnce("page_view", { page: "landing" });
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#101828]">
      <Header />
      <Hero />
      <SituationsSection />
      <DemoSection />
      <FaqSection />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-md bg-[#0B0D12] text-white"
          >
            <Sparkles className="h-4 w-4 text-[#22C55E]" />
          </span>
          <span className="text-sm font-semibold text-[#101828] sm:text-base">
            Salomão AI
          </span>
        </div>
        <button
          type="button"
          onClick={scrollToForm}
          className="inline-flex items-center justify-center rounded-lg bg-[#22C55E] px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#16A34A] sm:px-4"
        >
          Quero analisar meu atendimento
        </button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="bg-[#0B0D12] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-12 lg:py-20">
        <div className="lg:pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#22C55E]">
            IA para atendimento de lojas de iPhone
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-[1.15] tracking-tight sm:text-4xl lg:text-[44px] lg:leading-[1.1]">
            Quem quer comprar um iPhone não espera.
            <br className="hidden sm:block" /> Se você demora, ele chama outra
            loja.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
            A IA responde na hora, entende qual aparelho a pessoa procura,
            pergunta sobre pagamento e troca e deixa a conversa pronta para o
            vendedor continuar.
          </p>
          <p className="mt-5 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
            Para lojas que faturam a partir de R$ 50 mil por mês.
          </p>
          <ul className="mt-6 grid gap-2.5 text-[15px] text-white/85">
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#22C55E]" />
              <span>Responde mesmo quando o vendedor está ocupado.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-[#22C55E]" />
              <span>Volta a falar com quem pediu preço e sumiu.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-[#22C55E]" />
              <span>
                Organiza as informações antes de chamar o vendedor.
              </span>
            </li>
          </ul>
        </div>

        <div>
          <LeadForm />
        </div>
      </div>
    </section>
  );
}

function SituationsSection() {
  const items = [
    {
      icon: MessageSquare,
      text: "Novas mensagens chegam enquanto o vendedor está atendendo no balcão.",
    },
    {
      icon: RotateCcw,
      text: "O cliente pede preço, para de responder e ninguém volta a falar com ele.",
    },
    {
      icon: Clock,
      text: "À noite ou no fim de semana, ele procura uma loja que responda primeiro.",
    },
  ];
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <h2 className="max-w-2xl text-2xl font-semibold leading-tight text-[#101828] sm:text-3xl">
          Isso acontece na sua loja?
        </h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {items.map(({ icon: Icon, text }, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#E5E7EB] bg-white p-5"
            >
              <Icon className="h-6 w-6 text-[#22C55E]" />
              <p className="mt-3 text-[15px] leading-6 text-[#101828]">
                {text}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-[15px] leading-7 text-[#475467]">
          A IA cuida do começo da conversa para que seus vendedores possam se
          concentrar na negociação.
        </p>
      </div>
    </section>
  );
}

function DemoSection() {
  return (
    <section className="bg-[#F6F7F9]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <h2 className="max-w-3xl text-2xl font-semibold leading-tight text-[#101828] sm:text-3xl">
          A IA resolve o começo da conversa. O vendedor continua a
          negociação.
        </h2>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_1fr]">
          <ChatDemo />
          <SummaryCard />
        </div>

        <p className="mt-8 max-w-3xl text-sm leading-6 text-[#475467]">
          A IA não deve inventar preço, estoque ou condições. Ela utiliza as
          informações e regras definidas pela loja.
        </p>
      </div>
    </section>
  );
}

function ChatDemo() {
  const messages: { from: "cliente" | "ia"; text: string }[] = [
    { from: "cliente", text: "Tem iPhone 15 Pro 256 GB?" },
    { from: "ia", text: "Você procura novo ou seminovo?" },
    { from: "cliente", text: "Seminovo. Tenho um iPhone 13 para dar na troca." },
    {
      from: "ia",
      text: "Perfeito. Como está a bateria e o aparelho? Você pretende pagar à vista ou parcelado?",
    },
    { from: "cliente", text: "Está bem conservado e quero parcelar." },
    {
      from: "ia",
      text: "Entendi. Vou organizar essas informações para um vendedor continuar com você.",
    },
  ];
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0B0D12] text-white">
          <MessageSquare className="h-4 w-4 text-[#22C55E]" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#101828]">
            Atendimento pelo WhatsApp
          </p>
          <p className="text-xs text-[#667085]">Exemplo de conversa</p>
        </div>
      </div>
      <ul className="space-y-2.5">
        {messages.map((m, i) => (
          <li
            key={i}
            className={
              m.from === "cliente"
                ? "flex justify-start"
                : "flex justify-end"
            }
          >
            <div
              className={
                m.from === "cliente"
                  ? "max-w-[85%] rounded-2xl rounded-tl-sm bg-[#F6F7F9] px-3.5 py-2.5 text-[14px] leading-5 text-[#101828]"
                  : "max-w-[85%] rounded-2xl rounded-tr-sm bg-[#E7F9EE] px-3.5 py-2.5 text-[14px] leading-5 text-[#0B4B2C]"
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
  const rows = [
    ["Aparelho procurado", "iPhone 15 Pro"],
    ["Capacidade", "256 GB"],
    ["Condição", "Seminovo"],
    ["Possui aparelho para troca", "Sim"],
    ["Aparelho da troca", "iPhone 13"],
    ["Forma de pagamento", "Parcelado"],
    ["Momento da compra", "Não informado"],
  ];
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
      <p className="text-sm font-semibold text-[#101828]">
        Informações para o vendedor
      </p>
      <dl className="mt-4 divide-y divide-[#E5E7EB] text-sm">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <dt className="text-[#667085]">{k}</dt>
            <dd className="text-right font-medium text-[#101828]">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#E7F9EE] px-3 py-1 text-xs font-semibold text-[#0B4B2C]">
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-[#22C55E]"
        />
        Pronto para o vendedor continuar
      </div>
    </div>
  );
}

function FaqSection() {
  const items = [
    {
      q: "A IA substitui meus vendedores?",
      a: "Não. Ela responde as primeiras perguntas, reúne informações e volta a falar com clientes que pararam de responder. O vendedor continua responsável pela negociação e pelo fechamento.",
    },
    {
      q: "Ela pode informar preços e estoque?",
      a: "Sim, quando essas informações estiverem configuradas ou integradas ao sistema da loja. A IA não deve inventar valores ou disponibilidade.",
    },
    {
      q: "O que acontece depois que eu responder ao formulário?",
      a: "Vamos analisar as respostas e entrar em contato pelo WhatsApp para mostrar como o atendimento poderia funcionar na sua loja.",
    },
  ];
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <h2 className="text-2xl font-semibold text-[#101828] sm:text-3xl">
          Perguntas frequentes
        </h2>
        <div className="mt-6 divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
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
    <details className="group py-4 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-[15px] font-semibold text-[#101828]">
        <span>{q}</span>
        <span
          aria-hidden
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#E5E7EB] text-[#667085] transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <p className="mt-3 text-[15px] leading-7 text-[#475467]">{a}</p>
    </details>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-[#667085] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid h-6 w-6 place-items-center rounded bg-[#0B0D12] text-white"
          >
            <Sparkles className="h-3 w-3 text-[#22C55E]" />
          </span>
          <span className="font-medium text-[#101828]">Salomão AI</span>
          <span>· © {new Date().getFullYear()}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a
            href="/politica-de-privacidade"
            className="hover:text-[#101828]"
          >
            Política de Privacidade
          </a>
          <a
            href="mailto:contato@salomaoai.com"
            className="hover:text-[#101828]"
          >
            contato@salomaoai.com
          </a>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-6 text-xs text-[#98A2B3] sm:px-6">
        Esta empresa não possui vínculo oficial com a Apple.
      </div>
    </footer>
  );
}
