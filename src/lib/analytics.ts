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

export function trackEvent(
  event_type: AnalyticsEventType,
  meta: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;
  const utms = getPersistedTracking();
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
    meta,
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
