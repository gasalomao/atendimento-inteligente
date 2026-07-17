
-- Estende a tabela contatos existente com colunas para o novo fluxo
ALTER TABLE public.contatos
  ADD COLUMN IF NOT EXISTS event_id UUID,
  ADD COLUMN IF NOT EXISTS form_answers JSONB,
  ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS email_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS webhook_status TEXT NOT NULL DEFAULT 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS contatos_event_id_key
  ON public.contatos (event_id)
  WHERE event_id IS NOT NULL;

-- Fila persistente de notificações
CREATE TABLE IF NOT EXISTS public.lead_notification_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.contatos(id) ON DELETE CASCADE,
  event_id UUID NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','webhook')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','failed','skipped')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  last_error TEXT,
  response_status INTEGER,
  provider_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lead_id, channel)
);

CREATE INDEX IF NOT EXISTS lead_notification_jobs_ready_idx
  ON public.lead_notification_jobs (status, next_attempt_at)
  WHERE status IN ('pending','processing');

GRANT ALL ON public.lead_notification_jobs TO service_role;

ALTER TABLE public.lead_notification_jobs ENABLE ROW LEVEL SECURITY;

-- Sem policies públicas: apenas o backend (service_role) pode acessar.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_lead_notification_jobs_updated_at ON public.lead_notification_jobs;
CREATE TRIGGER trg_lead_notification_jobs_updated_at
BEFORE UPDATE ON public.lead_notification_jobs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Função para claim atômico de jobs (evita duplicação por concorrência de workers)
CREATE OR REPLACE FUNCTION public.claim_notification_jobs(_limit INTEGER)
RETURNS SETOF public.lead_notification_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.lead_notification_jobs j
     SET status = 'processing',
         locked_at = now(),
         attempts = j.attempts + 1,
         updated_at = now()
   WHERE j.id IN (
     SELECT id
       FROM public.lead_notification_jobs
      WHERE status = 'pending'
        AND next_attempt_at <= now()
      ORDER BY next_attempt_at ASC
      LIMIT _limit
      FOR UPDATE SKIP LOCKED
   )
   RETURNING j.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_notification_jobs(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_notification_jobs(INTEGER) TO service_role;
