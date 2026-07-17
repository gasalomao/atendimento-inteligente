import type { Request, Response } from "express";
import crypto from "node:crypto";
import { trackEventSchema } from "../../../shared/analytics/schema";
import { supabaseAdmin } from "../db/supabase";
import { logger } from "../logger";
import { lookupGeo } from "../lib/geo";

export async function trackHandler(req: Request, res: Response) {
  const parsed = trackEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(204).end();
  }
  const d = parsed.data;
  const rawIp = req.ip ?? null;
  const ipHash = rawIp
    ? crypto.createHash("sha256").update(String(rawIp)).digest("hex").slice(0, 16)
    : null;

  const geo = await lookupGeo(rawIp);
  const meta = {
    ...(d.meta ?? {}),
    ...(geo ? { geo } : {}),
  };

  const { error } = await supabaseAdmin.from("site_events").insert({
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
    user_agent: (req.headers["user-agent"] as string) ?? null,
    ip_hash: ipHash,
    meta,
  });
  if (error) logger.warn({ err: error }, "track_insert_failed");
  return res.status(204).end();
}

export async function metricsHandler(req: Request, res: Response) {
  const token = (req.query.token as string) || req.headers["x-metrics-token"];
  const expected = process.env.METRICS_TOKEN;
  if (!expected || token !== expected) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const days = Math.min(Math.max(Number(req.query.days ?? 30), 1), 365);
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const { data: events, error } = await supabaseAdmin
    .from("site_events")
    .select("visitor_id, event_type, utm_source, utm_medium, utm_campaign, created_at")
    .gte("created_at", since)
    .limit(50000);
  if (error) return res.status(500).json({ error: error.message });

  const { data: leads } = await supabaseAdmin
    .from("contatos")
    .select("id, lead_classification, pontuacao, utm_source, utm_medium, utm_campaign, created_at")
    .gte("created_at", since);

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

  return res.json({
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
      .slice(0, 20),
    lead_classification: classification,
  });
}

function safeRate(num: number | undefined, den: number | undefined): number {
  if (!num || !den) return 0;
  return Math.round((num / den) * 10000) / 100;
}
