
## Plano de migração

Aviso importante: **essa migração remove o projeto do runtime Lovable/Cloudflare Workers**. Depois de aplicada, o preview do Lovable pode não refletir o comportamento do servidor Express (ele espera Workers). Você passará a rodar/testar via `docker compose` local e no EasyPanel. Vou manter a landing 100% igual visualmente.

---

### 1. Arquitetura final

```text
repo/
├── Dockerfile                     # multi-stage (build → runtime)
├── docker-compose.yml             # teste local
├── .dockerignore
├── .env.example
├── DEPLOY_EASYPANEL.md
├── README.md
├── package.json                   # scripts unificados
├── client/                        # frontend atual (Vite/React), sem TanStack Start
│   ├── vite.config.ts             # build → dist/client
│   ├── index.html
│   └── src/
│       ├── main.tsx               # React Router
│       ├── App.tsx
│       ├── pages/
│       │   ├── landing.tsx        # copia de src/routes/index.tsx (sem <head>)
│       │   ├── obrigado.tsx
│       │   └── politica-de-privacidade.tsx
│       ├── components/lead-form.tsx  # aponta para POST /api/leads
│       └── lib/tracking.ts
└── server/                        # backend Express (novo)
    ├── src/
    │   ├── index.ts               # bootstrap Express + static + SPA fallback + worker
    │   ├── env.ts                 # validação de env com zod
    │   ├── routes/
    │   │   ├── health.ts          # GET /healthz
    │   │   └── leads.ts           # POST /api/leads
    │   ├── domain/
    │   │   ├── schema.ts          # zod do payload
    │   │   ├── scoring.ts         # pontuação/classificação (portada)
    │   │   ├── labels.ts          # value↔label das perguntas (PT-BR)
    │   │   └── phone.ts           # normalização WhatsApp
    │   ├── db/
    │   │   └── supabase.ts        # client service_role, server-only
    │   ├── notifications/
    │   │   ├── queue.ts           # enqueue/claim/mark_sent/mark_failed
    │   │   ├── worker.ts          # loop de polling + backoff
    │   │   ├── email.ts           # Resend + template HTML/texto (escape)
    │   │   └── webhook.ts         # POST + HMAC-SHA256
    │   ├── security/
    │   │   ├── rate-limit.ts      # express-rate-limit (só /api/*)
    │   │   └── helmet.ts
    │   └── logger.ts              # logs estruturados sem PII completo
    └── tsconfig.json
```

Fluxo em produção: Express escuta `0.0.0.0:${PORT||3000}`, serve `/api/*`, `/healthz` e depois `dist/client` com fallback SPA para `index.html`. Frontend usa fetch same-origin `/api/leads`.

---

### 2. Banco de dados

Uma migração aditiva em `contatos` (preserva dados existentes):

```text
contatos:
  + event_id           UUID unique
  + form_answers       JSONB
  + consent_timestamp  TIMESTAMPTZ
  + privacy_policy_version TEXT
  + status             TEXT default 'new'
  + email_status       TEXT default 'pending'
  + webhook_status     TEXT default 'pending'
```

E uma nova tabela para fila persistente:

```text
lead_notification_jobs:
  id, lead_id (FK contatos), event_id,
  channel ('email'|'webhook'),
  status ('pending'|'processing'|'sent'|'failed'|'skipped'),
  attempts, next_attempt_at, locked_at,
  last_error, response_status, provider_message_id,
  created_at, sent_at, updated_at
```

RLS ativa nas duas. Nenhuma policy pública. Todo acesso via service_role no backend.

---

### 3. Endpoint `POST /api/leads`

Ordem obrigatória:
1. Valida Zod + honeypot + rate-limit (10/15min por IP hasheado).
2. Gera `lead_id` e `event_id`.
3. Insere em `contatos` (idempotente por `event_id`).
4. Cria job `email` (sempre) e job `webhook` (skipped se `LEAD_WEBHOOK_URL` vazio).
5. Retorna `201 { success, lead_id, event_id }`.
6. Worker processa em background com backoff: 0s → 1min → 5min → 15min → 1h → 6h → 24h → 48h.

Respostas: `201` sucesso, `422` validação, `429` rate limit, `500` erro genérico (sem stack).

---

### 4. E-mail (Resend)

Destinatário: `ga.pancione@gmail.com` (via `LEAD_NOTIFICATION_TO`, com fallback hardcoded).
Remetente: `LEAD_NOTIFICATION_FROM` (você configura depois de verificar o domínio).
Assunto dinâmico por classificação. HTML responsivo + versão texto. Escape de todos os valores. Idempotência via chave `lead-notification/<lead_id>`. Botão "Chamar no WhatsApp" com telefone normalizado.

Como você **ainda não tem conta Resend**, ao final envio um passo a passo (criar conta → verificar domínio → gerar API key → configurar no EasyPanel). Enquanto isso a fila continua funcionando e acumula os envios como `pending`; quando você configurar `RESEND_API_KEY`, o próximo tick do worker envia tudo que ficou pendente. Não haverá perda.

---

### 5. Webhook

Opcional. Se `LEAD_WEBHOOK_URL` estiver definido:

- POST JSON com payload versionado (`schema_version: "1.0"`, `event: "lead.created"`, incluindo `role/main_situation/monthly_revenue/investment_readiness` com `value`+`label`, `tracking`, `consent`, `form_answers`).
- Headers: `X-Webhook-Event`, `X-Webhook-Id`, `X-Webhook-Timestamp`, `X-Webhook-Signature: sha256=<hmac>`, opcional `Authorization: Bearer <token>`.
- Assinatura: `HMAC-SHA256(secret, "<timestamp>.<body>")`.
- Timeout: `LEAD_WEBHOOK_TIMEOUT_MS` (padrão 8000).

---

### 6. Preservação (não muda)

- Design/copies/perguntas/valores internos/labels.
- UTMs, fbclid, referrer, landing_path, honeypot, `started_at`.
- Meta Pixel `generate_lead` (dispara 1x, apenas após 201).
- Máscara WhatsApp, validação nome completo, loja opcional, e-mail opcional.
- Rodapé + Política de Privacidade passam a exibir `ga.pancione@gmail.com`.
- Modal de privacidade mantido.

---

### 7. Variáveis de ambiente (`.env.example`)

Obrigatórias em produção:
```
NODE_ENV=production
PORT=3000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
LEAD_NOTIFICATION_TO=ga.pancione@gmail.com
CONTACT_EMAIL=ga.pancione@gmail.com
PRIVACY_POLICY_VERSION=2026-07-01
TZ=America/Sao_Paulo
```
Necessárias para e-mail funcionar (você configura depois):
```
RESEND_API_KEY=
LEAD_NOTIFICATION_FROM=Novos contatos <contato@seudominio.com.br>
```
Opcionais:
```
APP_URL=
LEAD_WEBHOOK_URL=
LEAD_WEBHOOK_SECRET=
LEAD_WEBHOOK_TOKEN=
LEAD_WEBHOOK_TIMEOUT_MS=8000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Nenhum segredo com prefixo `VITE_`. `.env` fora da imagem Docker.

---

### 8. Docker / EasyPanel

- Dockerfile multi-stage: `deps` → `build` (client+server) → `runtime` (alpine, usuário não-root, `dumb-init`, `HEALTHCHECK curl /healthz`, `EXPOSE 3000`, `CMD ["node","server/dist/index.js"]`).
- `docker-compose.yml` para teste local com `.env`.
- `DEPLOY_EASYPANEL.md` com passo a passo (conectar GitHub → App → porta 3000 → domínio → variáveis → deploy → validar `/healthz` → teste do form → conferir e-mail → auto-deploy).
- Seção "Configuração do Resend" e "Como ativar webhook depois".

---

### 9. Scripts

```
npm run dev           # concurrent: client + server em watch
npm run build         # build client + server
npm start             # node server/dist/index.js
npm run lint
npm run typecheck
npm test              # vitest, com mocks Resend/webhook/Supabase
npm run test:email    # CLI: envia e-mail real de teste (usa RESEND_API_KEY)
npm run test:webhook  # CLI: dispara POST assinado para LEAD_WEBHOOK_URL
```

---

### 10. Testes automatizados (vitest, com mocks)

Cobertura: validação Zod, honeypot, normalização telefone, scoring/classificação, insert idempotente, resposta da API, montagem/escape do HTML do e-mail, montagem do webhook + assinatura HMAC, retry/backoff, job duplicado, envio duplo do formulário, ausência de webhook URL, ausência de e-mail opcional.

---

### 11. O que preciso de você depois do build

1. **Resend**: criar conta em resend.com (grátis), verificar um domínio de envio, gerar API key → configurar `RESEND_API_KEY` e `LEAD_NOTIFICATION_FROM` no EasyPanel. Passo a passo detalhado em `DEPLOY_EASYPANEL.md`.
2. **Domínio final** no EasyPanel para servir a landing.
3. **(Opcional) Webhook**: se quiser integrar CRM/n8n, me passa a URL e eu deixo pré-configurado; caso contrário, basta preencher `LEAD_WEBHOOK_URL` no painel.

Ponto de restauração completo do estado atual será salvo em `/mnt/documents/restore-pre-express-migration/` antes de qualquer alteração.

---

### 12. Riscos assumidos

- Preview Lovable pode não funcionar após a migração (o preview espera Workers/TanStack). Sua validação passa a ser via Docker local + EasyPanel.
- `.env` do projeto atual (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`) permanecerão úteis para o frontend; segredos (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `LEAD_WEBHOOK_*`) só existirão no EasyPanel/localmente, nunca no repo nem no build do cliente.
- A tabela `contatos` continua sendo a fonte da verdade; nenhum dado é perdido.

Aprova o plano para eu começar a implementar?
