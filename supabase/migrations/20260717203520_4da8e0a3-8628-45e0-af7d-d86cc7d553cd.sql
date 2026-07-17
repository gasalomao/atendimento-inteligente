
CREATE TABLE public.site_events (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  path TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  fbclid TEXT,
  gclid TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.site_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.site_events_id_seq TO service_role;
ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX site_events_visitor_idx ON public.site_events (visitor_id);
CREATE INDEX site_events_created_idx ON public.site_events (created_at DESC);
CREATE INDEX site_events_type_idx ON public.site_events (event_type, created_at DESC);
