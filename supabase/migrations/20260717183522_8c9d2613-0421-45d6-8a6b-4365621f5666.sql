ALTER TABLE public.contatos
  ADD COLUMN IF NOT EXISTS investimento text,
  ADD COLUMN IF NOT EXISTS lead_classification text;