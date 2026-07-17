import { useState } from "react";
import { X } from "lucide-react";

export function PrivacyDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-medium text-[#101828] underline underline-offset-2 hover:text-[#16A34A]"
      >
        Política de Privacidade
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
            <div className="mb-4 flex items-start justify-between">
              <h3
                id="privacy-title"
                className="text-lg font-semibold text-[#101828]"
              >
                Política de Privacidade
              </h3>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-[#667085] hover:bg-[#F6F7F9] hover:text-[#101828]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm leading-6 text-[#475467]">
              <p>
                Ao preencher este formulário, você autoriza o contato pelo
                WhatsApp informado a respeito desta solicitação.
              </p>
              <p>
                Coletamos apenas as informações necessárias para entender o
                atendimento da sua loja e preparar um exemplo do que a IA
                poderia fazer no seu cenário. Esses dados são armazenados de
                forma segura e não são compartilhados com terceiros para fins de
                venda ou publicidade.
              </p>
              <p>
                Também coletamos automaticamente informações técnicas básicas
                (como origem da visita, agente do navegador e endereço IP) para
                acompanhar o desempenho da nossa comunicação em anúncios.
              </p>
              <p>
                Você pode solicitar a remoção dos seus dados a qualquer momento
                pelo mesmo canal de contato. Se preferir, também pode acessar
                esta política em uma página separada:{" "}
                <a
                  href="/politica-de-privacidade"
                  className="font-medium text-[#101828] underline"
                >
                  /politica-de-privacidade
                </a>
                .
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-[#101828] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0B0D12]"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
