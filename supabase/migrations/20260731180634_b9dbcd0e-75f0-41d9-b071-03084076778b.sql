ALTER TABLE public.contatos
  ADD COLUMN IF NOT EXISTS lead_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cidade_uf text,
  ADD COLUMN IF NOT EXISTS canal_venda text,
  ADD COLUMN IF NOT EXISTS canais_oportunidade text,
  ADD COLUMN IF NOT EXISTS contatos_dia text,
  ADD COLUMN IF NOT EXISTS respondentes text,
  ADD COLUMN IF NOT EXISTS registro_contatos text,
  ADD COLUMN IF NOT EXISTS automatizar_primeiro text,
  ADD COLUMN IF NOT EXISTS prazo_implantacao text,
  ADD COLUMN IF NOT EXISTS decisao text,
  ADD COLUMN IF NOT EXISTS consent_email boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_whatsapp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_sms boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_marketing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_text_version text,
  ADD COLUMN IF NOT EXISTS landing_variant text;

ALTER TABLE public.contatos ALTER COLUMN papel DROP NOT NULL;
ALTER TABLE public.contatos ALTER COLUMN whatsapp DROP NOT NULL;

CREATE INDEX IF NOT EXISTS contatos_lead_score_idx ON public.contatos (lead_score DESC);