// Analytics próprio — visitor_id persistente por device (localStorage) e
// session_id por aba (sessionStorage). Envia via sendBeacon para /api/track.
import { getPersistedTracking } from "./tracking";

const VID_KEY = "sai_vid";
const SID_KEY = "sai_sid";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let v = window.localStorage.getItem(VID_KEY);
    if (!v) {
      v = uuid();
      window.localStorage.setItem(VID_KEY, v);
    }
    return v;
  } catch {
    return "no-storage";
  }
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let s = window.sessionStorage.getItem(SID_KEY);
    if (!s) {
      s = uuid();
      window.sessionStorage.setItem(SID_KEY, s);
    }
    return s;
  } catch {
    return "no-session";
  }
}

export type AnalyticsEventType =
  | "page_view"
  | "form_view"
  | "form_start"
  | "form_step_complete"
  | "form_submit_attempt"
  | "form_submit_success"
  | "form_submit_error"
  | "whatsapp_click";

function detectDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return "mobile";
  return "desktop";
}

function detectBrowser(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari";
  return "Other";
}

function detectOS(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Mac OS X/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Other";
}

let cachedContext: Record<string, unknown> | null = null;
function getClientContext(): Record<string, unknown> {
  if (cachedContext) return cachedContext;
  if (typeof window === "undefined") return {};
  try {
    cachedContext = {
      device: {
        type: detectDeviceType(),
        browser: detectBrowser(),
        os: detectOS(),
      },
      screen: {
        w: window.screen?.width ?? null,
        h: window.screen?.height ?? null,
        dpr: window.devicePixelRatio ?? 1,
      },
      viewport: {
        w: window.innerWidth,
        h: window.innerHeight,
      },
      language: navigator.language ?? null,
      languages: (navigator.languages ?? []).slice(0, 5),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
      tz_offset_min: -new Date().getTimezoneOffset(),
    };
  } catch {
    cachedContext = {};
  }
  return cachedContext;
}

export function trackEvent(
  event_type: AnalyticsEventType,
  meta: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;
  const utms = getPersistedTracking();
  const mergedMeta = { ...getClientContext(), ...meta };
  const body = JSON.stringify({
    visitor_id: getVisitorId(),
    session_id: getSessionId(),
    event_type,
    path: window.location.pathname + window.location.search,
    referrer: document.referrer || null,
    utm_source: utms.utm_source,
    utm_medium: utms.utm_medium,
    utm_campaign: utms.utm_campaign,
    utm_content: utms.utm_content,
    utm_term: utms.utm_term,
    fbclid: utms.fbclid,
    gclid: utms.gclid,
    meta: mergedMeta,
  });
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/track", blob);
      return;
    }
  } catch {}
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

const onceMap: Record<string, boolean> = {};
export function trackEventOnce(event_type: AnalyticsEventType, meta: Record<string, unknown> = {}) {
  if (onceMap[event_type]) return;
  onceMap[event_type] = true;
  trackEvent(event_type, meta);
}
