/**
 * Envia um e-mail real de teste usando as variáveis atuais.
 * Uso: npm run test:email
 */
import "dotenv/config";
import { Resend } from "resend";
import { env } from "../src/env";

async function main() {
  if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY não configurada");
  if (!env.LEAD_NOTIFICATION_FROM) throw new Error("LEAD_NOTIFICATION_FROM não configurada");
  const resend = new Resend(env.RESEND_API_KEY);
  const r = await resend.emails.send({
    from: env.LEAD_NOTIFICATION_FROM,
    to: env.LEAD_NOTIFICATION_TO,
    subject: "Teste de envio · landing page",
    html: "<p>Este é um teste de envio via Resend. Se você recebeu, a integração está funcionando.</p>",
    text: "Este é um teste de envio via Resend. Se você recebeu, a integração está funcionando.",
  });
  if (r.error) throw new Error(`Resend: ${r.error.message}`);
  console.log("OK – message id:", r.data?.id);
}

main().catch((err) => {
  console.error("FALHA:", err.message);
  process.exit(1);
});
