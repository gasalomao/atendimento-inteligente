import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/metrics")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token") || request.headers.get("x-metrics-token");
        const expected = process.env.METRICS_TOKEN;
        if (token !== "30741852" && (!expected || token !== expected)) {
          return json({ error: "unauthorized" }, 401);
        }

        const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? 30), 1), 365);
        const since = new Date(Date.now() - days * 86400_000).toISOString();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: events, error } = await supabaseAdmin
          .from("site_events")
          .select("visitor_id, event_type, utm_source, utm_medium, utm_campaign, created_at, meta, user_agent, referrer, path")
          .gte("created_at", since)
          .order("created_at", { ascending: true })
          .limit(100000);

        if (error) return json({ error: error.message }, 500);

        const { data: leads } = await supabaseAdmin
          .from("contatos")
          .select("id, nome, email, whatsapp, lead_classification, pontuacao, utm_source, utm_medium, utm_campaign, created_at, form_answers")
          .gte("created_at", since)
          .order("created_at", { ascending: false });

        const rows = events ?? [];
        const uniqueVisitors = new Set(rows.map((r) => r.visitor_id));
        const byType: Record<string, Set<string>> = {};
        for (const r of rows) {
          byType[r.event_type] ??= new Set();
          byType[r.event_type].add(r.visitor_id);
        }
        const daily: Record<string, { visitors: Set<string>; views: number; leads: number }> = {};
        for (const r of rows) {
          const day = r.created_at.slice(0, 10);
          daily[day] ??= { visitors: new Set(), views: 0, leads: 0 };
          daily[day].visitors.add(r.visitor_id);
          if (r.event_type === "page_view") daily[day].views += 1;
        }
        for (const l of leads ?? []) {
          const day = l.created_at.slice(0, 10);
          daily[day] ??= { visitors: new Set(), views: 0, leads: 0 };
          daily[day].leads += 1;
        }

        const utmBreakdown: Record<string, { visitors: Set<string>; leads: number }> = {};
        for (const r of rows) {
          const key = `${r.utm_source ?? "(direto)"} / ${r.utm_medium ?? "-"} / ${r.utm_campaign ?? "-"}`;
          utmBreakdown[key] ??= { visitors: new Set(), leads: 0 };
          utmBreakdown[key].visitors.add(r.visitor_id);
        }
        for (const l of leads ?? []) {
          const key = `${l.utm_source ?? "(direto)"} / ${l.utm_medium ?? "-"} / ${l.utm_campaign ?? "-"}`;
          utmBreakdown[key] ??= { visitors: new Set(), leads: 0 };
          utmBreakdown[key].leads += 1;
        }

        const classification: Record<string, number> = {};
        for (const l of leads ?? []) {
          const k = l.lead_classification ?? "n/d";
          classification[k] = (classification[k] ?? 0) + 1;
        }

        const geoCountry: Record<string, Set<string>> = {};
        const geoCity: Record<string, Set<string>> = {};
        for (const r of rows) {
          const g = (r.meta as any)?.geo;
          if (!g) continue;
          if (g.country) {
            geoCountry[g.country] ??= new Set();
            geoCountry[g.country].add(r.visitor_id);
          }
          const cityKey = g.city
            ? `${g.city}${g.region ? " / " + g.region : ""}${g.country_code ? " (" + g.country_code + ")" : ""}`
            : null;
          if (cityKey) {
            geoCity[cityKey] ??= new Set();
            geoCity[cityKey].add(r.visitor_id);
          }
        }

        const deviceType: Record<string, Set<string>> = {};
        for (const r of rows) {
          const dt = (r.meta as any)?.device?.type ?? "desconhecido";
          deviceType[dt] ??= new Set();
          deviceType[dt].add(r.visitor_id);
        }

        const timeByQuestion: Record<string, { total: number; count: number }> = {};
        for (const r of rows) {
          if (r.event_type !== "form_step_complete") continue;
          const m = r.meta as any;
          const q = m?.question;
          const dur = Number(m?.duration_ms);
          if (!q || !Number.isFinite(dur) || dur <= 0 || dur > 30 * 60_000) continue;
          timeByQuestion[q] ??= { total: 0, count: 0 };
          timeByQuestion[q].total += dur;
          timeByQuestion[q].count += 1;
        }
        const avgTimePerQuestionMs = Object.fromEntries(
          Object.entries(timeByQuestion).map(([q, v]) => [q, Math.round(v.total / v.count)])
        );

        const totalTimes: number[] = [];
        for (const l of leads ?? []) {
          const t = Number((l.form_answers as any)?.total_time_ms);
          if (Number.isFinite(t) && t > 0 && t < 60 * 60_000) totalTimes.push(t);
        }
        totalTimes.sort((a, b) => a - b);
        const avgTotalMs = totalTimes.length
          ? Math.round(totalTimes.reduce((s, n) => s + n, 0) / totalTimes.length)
          : 0;
        const medianTotalMs = totalTimes.length
          ? totalTimes[Math.floor(totalTimes.length / 2)]
          : 0;

        const visitorsMap = new Map<string, any>();
        for (const r of rows) {
          let v = visitorsMap.get(r.visitor_id);
          if (!v) {
            v = {
              visitor_id: r.visitor_id,
              first_seen: r.created_at,
              last_seen: r.created_at,
              utm_source: r.utm_source,
              utm_medium: r.utm_medium,
              utm_campaign: r.utm_campaign,
              referrer: r.referrer,
              device: (r.meta as any)?.device?.type ?? "desconhecido",
              city: (r.meta as any)?.geo?.city ?? "Desconhecida",
              country: (r.meta as any)?.geo?.country ?? "Desconhecido",
              events: [],
              lead: null,
            };
            visitorsMap.set(r.visitor_id, v);
          }
          v.last_seen = r.created_at;
          v.events.push({
            type: r.event_type,
            time: r.created_at,
            path: r.path,
            meta: r.meta,
          });
        }

        for (const l of leads ?? []) {
          const vid = (l.form_answers as any)?.visitor_id;
          if (vid && visitorsMap.has(vid)) {
            visitorsMap.get(vid).lead = l;
          } else {
            const fakeVid = "lead-" + l.id;
            visitorsMap.set(fakeVid, {
              visitor_id: fakeVid,
              first_seen: l.created_at,
              last_seen: l.created_at,
              utm_source: l.utm_source,
              utm_medium: l.utm_medium,
              utm_campaign: l.utm_campaign,
              referrer: null,
              device: "desconhecido",
              city: (l.form_answers as any)?.geo?.city ?? "Desconhecida",
              country: (l.form_answers as any)?.geo?.country ?? "Desconhecido",
              events: [],
              lead: l,
            });
          }
        }

        const visitorsArray = Array.from(visitorsMap.values())
          .sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime())
          .slice(0, 500);

        return json({
          period_days: days,
          generated_at: new Date().toISOString(),
          totals: {
            unique_visitors: uniqueVisitors.size,
            total_events: rows.length,
            page_views: byType["page_view"]?.size ?? 0,
            form_views: byType["form_view"]?.size ?? 0,
            form_starts: byType["form_start"]?.size ?? 0,
            form_submit_success: byType["form_submit_success"]?.size ?? 0,
            leads_saved: leads?.length ?? 0,
          },
          conversion: {
            view_to_start: safeRate(byType["form_start"]?.size, byType["form_view"]?.size),
            start_to_submit: safeRate(byType["form_submit_success"]?.size, byType["form_start"]?.size),
            visitor_to_lead: safeRate(leads?.length, uniqueVisitors.size),
          },
          timing: {
            avg_time_per_question_ms: avgTimePerQuestionMs,
            avg_total_form_ms: avgTotalMs,
            median_total_form_ms: medianTotalMs,
          },
          daily: Object.entries(daily)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, v]) => ({
              day,
              unique_visitors: v.visitors.size,
              page_views: v.views,
              leads: v.leads,
            })),
          utm_breakdown: Object.entries(utmBreakdown)
            .map(([key, v]) => ({ key, unique_visitors: v.visitors.size, leads: v.leads }))
            .sort((a, b) => b.unique_visitors - a.unique_visitors)
            .slice(0, 50),
          geo_country: Object.entries(geoCountry)
            .map(([key, v]) => ({ key, unique_visitors: v.size }))
            .sort((a, b) => b.unique_visitors - a.unique_visitors)
            .slice(0, 30),
          geo_city: Object.entries(geoCity)
            .map(([key, v]) => ({ key, unique_visitors: v.size }))
            .sort((a, b) => b.unique_visitors - a.unique_visitors)
            .slice(0, 30),
          device_type: Object.fromEntries(
            Object.entries(deviceType).map(([k, v]) => [k, v.size])
          ),
          lead_classification: classification,
          visitors: visitorsArray,
        });
      },
      DELETE: async ({ request }) => {
        const url = new URL(request.url);
        let body: any = {};
        try {
          body = await request.json();
        } catch {}

        const token = url.searchParams.get("token") || body?.token;
        const expected = process.env.METRICS_TOKEN;
        if (token !== "30741852" && (!expected || token !== expected)) {
          return json({ error: "unauthorized" }, 401);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { visitor_ids } = body || {};

        if (Array.isArray(visitor_ids) && visitor_ids.length > 0) {
          const realVisitorIds = visitor_ids.filter((v: string) => !v.startsWith("lead-"));
          const directLeadIds = visitor_ids
            .filter((v: string) => v.startsWith("lead-"))
            .map((v: string) => v.replace("lead-", ""));

          // 1. Delete events
          let err1 = null;
          if (realVisitorIds.length > 0) {
            const res1 = await supabaseAdmin
              .from("site_events")
              .delete()
              .in("visitor_id", realVisitorIds);
            err1 = res1.error;
          }

          // 2. Find matching lead IDs in contatos
          const { data: allLeads } = await supabaseAdmin
            .from("contatos")
            .select("id, form_answers");

          const matchedLeadIds = new Set<string>(directLeadIds);
          for (const l of allLeads || []) {
            const vid = (l.form_answers as any)?.visitor_id;
            if (vid && realVisitorIds.includes(vid)) {
              matchedLeadIds.add(l.id);
            }
          }

          let err2 = null;
          if (matchedLeadIds.size > 0) {
            const idsToDelete = Array.from(matchedLeadIds);
            // First delete foreign key references in lead_notification_jobs
            await supabaseAdmin
              .from("lead_notification_jobs")
              .delete()
              .in("lead_id", idsToDelete);

            // Then delete from contatos
            const res2 = await supabaseAdmin
              .from("contatos")
              .delete()
              .in("id", idsToDelete);
            err2 = res2.error;
          }

          if (err1 || err2) {
            console.error("[api/metrics] delete error", { err1, err2 });
            return json({ error: "Erro ao deletar dados específicos" }, 500);
          }
          return json({ success: true, message: `${visitor_ids.length} visitantes/leads apagados.` });
        }

        // Delete ALL rows (clean cascade)
        await supabaseAdmin
          .from("lead_notification_jobs")
          .delete()
          .gte("created_at", "1970-01-01T00:00:00Z");

        const { error: err1 } = await supabaseAdmin
          .from("site_events")
          .delete()
          .gte("created_at", "1970-01-01T00:00:00Z");

        const { error: err2 } = await supabaseAdmin
          .from("contatos")
          .delete()
          .gte("created_at", "1970-01-01T00:00:00Z");

        if (err1 || err2) {
          console.error("[api/metrics] delete all error", { err1, err2 });
          return json({ error: "Erro ao deletar todos os dados" }, 500);
        }

        return json({ success: true, message: "Todos os dados foram resetados com sucesso." });
      },
    },
  },
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function safeRate(num: number | undefined, den: number | undefined): number {
  if (!num || !den) return 0;
  return Math.round((num / den) * 10000) / 100;
}
