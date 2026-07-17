import { createFileRoute, Link } from "@tanstack/react-router";

// Rota mantida por compatibilidade. A landing usa estado de sucesso in-page
// e NÃO redireciona automaticamente para cá.
export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "Recebemos suas respostas" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ObrigadoPage,
});

function ObrigadoPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center sm:py-24">
      <h1 className="text-2xl font-semibold text-[#101828] sm:text-3xl">
        Recebemos suas respostas.
      </h1>
      <p className="mt-3 text-[15px] leading-7 text-[#475467]">
        Nossa equipe entrará em contato pelo WhatsApp informado.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-lg bg-[#101828] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0B0D12]"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
