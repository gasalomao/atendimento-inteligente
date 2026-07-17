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
    .select("visitor_id, event_type, utm_source, utm_medium, utm_campaign, created_at, meta, user_agent")
    .gte("created_at", since)
    .limit(50000);
  if (error) return res.status(500).json({ error: error.message });

  const { data: leads } = await supabaseAdmin
    .from("contatos")
    .select("id, lead_classification, pontuacao, utm_source, utm_medium, utm_campaign, created_at, form_answers")
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

  // Geolocalização (dos eventos)
  const geoCountry: Record<string, Set<string>> = {};
  const geoCity: Record<string, Set<string>> = {};
  for (const r of rows) {
    const g = (r.meta as any)?.geo;
    if (!g) continue;
    if (g.country) {
      geoCountry[g.country] ??= new Set();
      geoCountry[g.country].add(r.visitor_id);
    }
    const cityKey = g.city ? `${g.city}${g.region ? " / " + g.region : ""}${g.country_code ? " (" + g.country_code + ")" : ""}` : null;
    if (cityKey) {
      geoCity[cityKey] ??= new Set();
      geoCity[cityKey].add(r.visitor_id);
    }
  }

  // Dispositivo
  const deviceType: Record<string, Set<string>> = {};
  for (const r of rows) {
    const dt = (r.meta as any)?.device?.type ?? "desconhecido";
    deviceType[dt] ??= new Set();
    deviceType[dt].add(r.visitor_id);
  }

  // Tempo por pergunta (form_step_complete com meta.question e meta.duration_ms)
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

  // Tempo total de preenchimento (dos leads)
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
      .slice(0, 20),
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
  });
}

function safeRate(num: number | undefined, den: number | undefined): number {
  if (!num || !den) return 0;
  return Math.round((num / den) * 10000) / 100;
}
