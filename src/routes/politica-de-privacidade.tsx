import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/politica-de-privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Salomão AI" },
      {
        name: "description",
        content:
          "Como utilizamos as informações enviadas pelo formulário de contato.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <Link
        to="/"
        className="text-sm font-medium text-[#667085] hover:text-[#101828]"
      >
        ← Voltar
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-[#101828] sm:text-3xl">
        Política de Privacidade
      </h1>
      <div className="mt-6 space-y-4 text-[15px] leading-7 text-[#475467]">
        <p>
          Ao preencher o formulário desta página, você autoriza o contato pelo
          WhatsApp informado a respeito da solicitação enviada.
        </p>
        <p>
          Coletamos apenas as informações necessárias para entender o
          atendimento da sua loja e preparar um exemplo do que a IA poderia
          fazer no seu cenário. Esses dados são armazenados de forma segura e
          não são compartilhados com terceiros para fins de venda ou
          publicidade.
        </p>
        <p>
          Também coletamos automaticamente informações técnicas básicas (como
          origem da visita, agente do navegador e endereço IP) para acompanhar
          o desempenho das nossas campanhas de comunicação.
        </p>
        <p>
          Você pode solicitar a remoção dos seus dados a qualquer momento pelo
          mesmo canal de contato utilizado no formulário, ou pelo e-mail{" "}
          <a
            href="mailto:ga.pancione@gmail.com"
            className="text-[#207A50] underline"
          >
            ga.pancione@gmail.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
