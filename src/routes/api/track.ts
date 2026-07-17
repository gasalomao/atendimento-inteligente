import { createFileRoute } from "@tanstack/react-router";
import { trackEventSchema } from "../../../shared/analytics/schema";

export const Route = createFileRoute("/api/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return new Response(null, { status: 204 });
        }
        const parsed = trackEventSchema.safeParse(raw);
        if (!parsed.success) return new Response(null, { status: 204 });
        const d = parsed.data;
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("site_events").insert({
            visitor_id: d.visitor_id,
            session_id: d.session_id,
            event_type: d.event_type,
            path: d.path ?? null,
            referrer: d.referrer ?? null,
            utm_source: d.utm_source ?? null,
            utm_medium: d.utm_medium ?? null,
            utm_campaign: d.utm_campaign ?? null,
            utm_content: d.utm_content ?? null,
            utm_term: d.utm_term ?? null,
            fbclid: d.fbclid ?? null,
            gclid: d.gclid ?? null,
            user_agent: request.headers.get("user-agent") ?? null,
            meta: d.meta ?? null,
          });
        } catch (err) {
          console.warn("[/api/track] insert error", err);
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
