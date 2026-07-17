
REVOKE EXECUTE ON FUNCTION public.claim_notification_jobs(INTEGER) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
