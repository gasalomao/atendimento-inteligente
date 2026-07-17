
CREATE TABLE public.contatos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  loja TEXT NOT NULL,
  email TEXT,
  papel TEXT,
  faturamento TEXT,
  conversas_dia TEXT,
  problema_principal TEXT,
  consentimento BOOLEAN NOT NULL DEFAULT false,
  pontuacao INT NOT NULL DEFAULT 0,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  fbclid TEXT,
  gclid TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip TEXT,
  landing_path TEXT
);

GRANT ALL ON public.contatos TO service_role;

ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;

-- Nenhuma policy para anon/authenticated: acesso apenas via server function com service_role.
CREATE INDEX idx_contatos_created_at ON public.contatos (created_at DESC);
