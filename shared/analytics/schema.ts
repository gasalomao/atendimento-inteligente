import { z } from "zod";

export const EVENT_TYPES = [
  "page_view",
  "form_view",
  "form_start",
  "form_step_complete",
  "form_submit_attempt",
  "form_submit_success",
  "form_submit_error",
  "whatsapp_click",
] as const;

export const trackEventSchema = z.object({
  visitor_id: z.string().min(8).max(64),
  session_id: z.string().min(8).max(64),
  event_type: z.enum(EVENT_TYPES),
  path: z.string().max(500).optional().nullable(),
  referrer: z.string().max(1000).optional().nullable(),
  utm_source: z.string().max(200).optional().nullable(),
  utm_medium: z.string().max(200).optional().nullable(),
  utm_campaign: z.string().max(200).optional().nullable(),
  utm_content: z.string().max(200).optional().nullable(),
  utm_term: z.string().max(200).optional().nullable(),
  fbclid: z.string().max(500).optional().nullable(),
  gclid: z.string().max(500).optional().nullable(),
  meta: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type TrackEvent = z.infer<typeof trackEventSchema>;
