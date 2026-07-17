# Deploy no EasyPanel

Este guia leva a landing do zero ao ar em produção.

## 1. Publicar no GitHub

1. Conecte este projeto Lovable ao GitHub (menu Publish → GitHub).
2. Confirme que os arquivos abaixo estão presentes na branch **main**:
   - `Dockerfile`
   - `docker-compose.yml`
   - `.env.example`
   - `server/` e `shared/`
   - `src/`
3. `.env` **não** vai para o repositório.

## 2. Criar o serviço no EasyPanel

1. `Projects → + Create Project` (dê um nome, ex.: `salomao-landing`).
2. `+ Service → App`.
3. **Source**: GitHub → escolha o repositório → branch `main`.
4. **Build**: `Dockerfile` (padrão).
5. **Deploy**: 
   - **Proxy Port**: `3000`
   - **Host**: adicione o domínio (ex.: `salomaoai.com.br`) e habilite HTTPS.
6. **Environment**: cole as variáveis do `.env.example` e preencha os valores reais (veja seção 3).
7. Clique em **Deploy**.
8. Após o deploy, abra `https://<seu-dominio>/healthz` — deve retornar:
   ```json
   { "status": "ok", "service": "landing-page", "timestamp": "..." }
   ```

## 3. Variáveis de ambiente

### Obrigatórias

| Nome | Descrição |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `SUPABASE_URL` | URL do projeto Supabase (Lovable Cloud). |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave **service_role** do Supabase. Nunca expor no frontend. |
| `LEAD_NOTIFICATION_TO` | Destino da notificação. Padrão: `ga.pancione@gmail.com`. |
| `CONTACT_EMAIL` | E-mail público exibido no rodapé. Padrão: `ga.pancione@gmail.com`. |
| `PRIVACY_POLICY_VERSION` | Ex.: `2026-07-01`. |
| `TZ` | `America/Sao_Paulo`. |

### Necessárias para envio de e-mail

| Nome | Descrição |
|---|---|
| `RESEND_API_KEY` | Chave da API do Resend. |
| `LEAD_NOTIFICATION_FROM` | Remetente com domínio verificado. Ex.: `Novos contatos <contato@salomaoai.com.br>`. |

**Enquanto essas duas não estiverem configuradas**, os formulários continuam sendo salvos no banco e os jobs de e-mail ficam pendentes na fila. Assim que você preencher e reimplantar, o worker envia tudo que estava esperando (sem perda).

### Opcionais (webhook)

| Nome | Descrição |
|---|---|
| `LEAD_WEBHOOK_URL` | Se preenchida, cada lead novo dispara um POST assinado. |
| `LEAD_WEBHOOK_SECRET` | Segredo compartilhado usado para assinar (HMAC-SHA256). |
| `LEAD_WEBHOOK_TOKEN` | Se preenchido, vai como `Authorization: Bearer <token>`. |
| `LEAD_WEBHOOK_TIMEOUT_MS` | Timeout em ms. Padrão: `8000`. |

## 4. Configuração obrigatória do Resend

1. Crie uma conta em [resend.com](https://resend.com) (plano free basta para começar).
2. Em **Domains → Add Domain**, cadastre um domínio que você controla (ex.: `salomaoai.com.br`).
3. Adicione no DNS os registros SPF/DKIM que o Resend mostrar. Aguarde a verificação (`Verified`).
4. Em **API Keys → Create API Key**, gere uma chave com permissão de envio.
5. No EasyPanel:
   - `RESEND_API_KEY` = a chave gerada.
   - `LEAD_NOTIFICATION_FROM` = `Nome do remetente <contato@seudominiovirificado.com.br>`.
6. Faça **Redeploy**.
7. (Opcional) Rode localmente `npm run test:email` para disparar um envio de teste.

> **Importante:** enquanto o domínio não estiver verificado no Resend, e-mails só podem ser enviados a partir de `onboarding@resend.dev` e apenas para o e-mail do dono da conta Resend. Isso é limitação do provedor, não do backend.

## 5. Como ativar o webhook depois

1. Gere um segredo forte (ex.: `openssl rand -hex 32`). Guarde-o.
2. No sistema receptor (n8n, CRM próprio, etc.), configure a URL que aceitará o POST.
3. No EasyPanel, preencha:
   - `LEAD_WEBHOOK_URL` = URL do receptor.
   - `LEAD_WEBHOOK_SECRET` = o segredo gerado.
   - `LEAD_WEBHOOK_TOKEN` = (opcional) token adicional para header `Authorization`.
4. Redeploy.
5. Rode `npm run test:webhook` para conferir a entrega.
6. No lado receptor, valide a assinatura:
   ```
   expected = "sha256=" + HMAC_SHA256(LEAD_WEBHOOK_SECRET, X-Webhook-Timestamp + "." + rawBody).hex()
   compare timing-safe com X-Webhook-Signature
   ```

## 6. Teste ponta-a-ponta pós-deploy

- [ ] `GET /healthz` → 200 OK.
- [ ] Abrir a landing, preencher e enviar o formulário.
- [ ] Confirmar `success = true` no navegador.
- [ ] Conferir no banco (`contatos` recebeu a linha; `lead_notification_jobs` tem 2 jobs).
- [ ] Verificar chegada em `ga.pancione@gmail.com` (ou onde `LEAD_NOTIFICATION_TO` apontar).
- [ ] Se webhook estiver ativo, conferir o recebimento no sistema receptor.

## 7. Auto-deploy

Em EasyPanel → seu serviço → **Deployments** → habilite **Auto Deploy** para a branch `main`. Toda vez que um commit for feito, EasyPanel faz o build e sobe o novo container automaticamente.

## 8. Rollback

O EasyPanel guarda deploys anteriores. Basta clicar em **Rollback** no histórico.
