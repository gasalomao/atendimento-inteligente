# Salomão AI — Landing Page

Landing de captura para lojas de iPhone com formulário qualificado, notificação por e-mail, webhook opcional e fila persistente de retries.

## Arquitetura

```
Frontend (Vite/React) ── POST /api/leads ──▶ Backend (Express)
                                             ├── Zod validation + honeypot + rate limit
                                             ├── Supabase (tabela `contatos`)
                                             ├── Fila `lead_notification_jobs`
                                             └── Worker em background
                                                  ├── Resend  → e-mail HTML/texto
                                                  └── Webhook  → POST assinado HMAC
```

Um único container serve tanto o SPA quanto a API, na porta `3000`.

## Scripts

```bash
npm run dev            # Vite (frontend) em modo dev
npm run dev:server     # Express em modo watch (tsx)
npm run build          # build do frontend + backend
npm start              # roda o servidor de produção (após build)
npm run test:email     # envia um e-mail de teste via Resend
npm run test:webhook   # dispara um POST assinado para LEAD_WEBHOOK_URL
```

## Endpoints

- `POST /api/leads` — cria um lead, salva, enfileira notificações. Idempotente por `event_id`.
- `GET /healthz` — status de saúde para HEALTHCHECK do Docker/EasyPanel.

## Deploy

Consulte **[DEPLOY_EASYPANEL.md](./DEPLOY_EASYPANEL.md)**.

Local com Docker:

```bash
cp .env.example .env
# preencha SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (e Resend quando tiver)
docker compose up --build
open http://localhost:3000
```

## Variáveis de ambiente

Ver `.env.example`. **Nenhum segredo tem prefixo `VITE_`** — apenas chaves públicas.

## Banco

Tabelas em Supabase:

- `contatos` — leads (com `event_id`, `form_answers` JSONB, `pontuacao`, `lead_classification`, status).
- `lead_notification_jobs` — fila persistente de envios (e-mail e webhook) com retries até 48h.

Ambas usam **RLS habilitada sem policies públicas** — apenas o backend com service_role escreve.

## Payload do webhook

```json
{
  "schema_version": "1.0",
  "event": "lead.created",
  "event_id": "<uuid>",
  "occurred_at": "<iso>",
  "source": "landing_page_agente_ia_iphone",
  "lead": {
    "id": "<uuid>", "created_at": "<iso>",
    "name": "…", "whatsapp": "55…", "email": null,
    "store_name": "…",
    "role":                 { "value": "owner_partner",              "label": "Sou proprietário ou sócio" },
    "main_situation":       { "value": "delayed_response_busy_store", "label": "Demoramos para responder …" },
    "monthly_revenue":      { "value": "from_50k_to_100k",           "label": "De R$ 50 mil a R$ 100 mil por mês" },
    "investment_readiness": { "value": "ready_if_value_is_clear",    "label": "Consigo investir …" },
    "daily_conversations":  { "value": "from_11_to_30",              "label": "De 11 a 30 conversas por dia" },
    "score": 12, "classification": "contato_prioritario"
  },
  "tracking": { "utm_source": null, "utm_medium": null, "utm_campaign": null,
                "utm_content": null, "utm_term": null, "fbclid": null,
                "landing_page": null, "referrer": null },
  "consent": { "accepted": true, "accepted_at": "<iso>", "privacy_policy_version": "2026-07-01" },
  "form_answers": { "…": "…" }
}
```

Headers:

```
Content-Type: application/json
X-Webhook-Event: lead.created
X-Webhook-Id: <event_id>
X-Webhook-Timestamp: <unix>
X-Webhook-Signature: sha256=<hmac(LEAD_WEBHOOK_SECRET, "<timestamp>.<body>")>
Authorization: Bearer <LEAD_WEBHOOK_TOKEN>   # somente se configurado
```

## Segurança

- `helmet`, `express-rate-limit` (10 req / 15 min por IP hasheado), body 64 KB.
- Trust proxy = 1 (necessário para o EasyPanel proxy).
- IP nunca é guardado por extenso — apenas um hash truncado.
- Logs estruturados via pino sem PII completa (telefone/e-mail mascarados).
- Segredos apenas no backend; nenhum aparece no bundle do frontend.
