// Geolocalização por IP — sem pedir permissão ao usuário.
// Usa ipwho.is (grátis, sem chave, HTTPS). Cache em memória por 24h.
import { logger } from "../logger";

export type GeoData = {
  country?: string | null;      // "Brazil"
  country_code?: string | null; // "BR"
  region?: string | null;       // "São Paulo"
  city?: string | null;         // "São Paulo"
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  isp?: string | null;
};

const cache = new Map<string, { at: number; data: GeoData }>();
const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE = 5000;

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === "::1" || ip === "127.0.0.1" || ip.startsWith("::ffff:127.")) return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true;
  return false;
}

export async function lookupGeo(rawIp: string | undefined | null): Promise<GeoData | null> {
  if (!rawIp) return null;
  const ip = rawIp.replace(/^::ffff:/, "");
  if (isPrivateIp(ip)) return null;

  const cached = cache.get(ip);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;

  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 1500);
    const r = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country,country_code,region,city,latitude,longitude,timezone,connection`, {
      signal: ctl.signal,
    });
    clearTimeout(timer);
    if (!r.ok) return null;
    const j: any = await r.json();
    if (!j || j.success === false) return null;
    const data: GeoData = {
      country: j.country ?? null,
      country_code: j.country_code ?? null,
      region: j.region ?? null,
      city: j.city ?? null,
      latitude: typeof j.latitude === "number" ? j.latitude : null,
      longitude: typeof j.longitude === "number" ? j.longitude : null,
      timezone: j.timezone?.id ?? null,
      isp: j.connection?.isp ?? null,
    };
    if (cache.size >= MAX_CACHE) {
      // remove o mais antigo
      const firstKey = cache.keys().next().value as string | undefined;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(ip, { at: Date.now(), data });
    return data;
  } catch (err) {
    logger.debug({ err, ip }, "geo_lookup_failed");
    return null;
  }
}
