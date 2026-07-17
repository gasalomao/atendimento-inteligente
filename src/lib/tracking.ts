// Utilidades de rastreio no cliente. Todas as chamadas são seguras se o
// respectivo script (GTM, Meta Pixel) ainda não estiver instalado — usamos
// stubs / dataLayer que preservam os eventos até o script carregar.

type EventName =
  | "page_view"
  | "form_view"
  | "form_start"
  | "form_step_1_complete"
  | "form_submit_attempt"
  | "generate_lead"
  | "form_submit_error"
  | "whatsapp_click";

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    _lovableTrackedOnce?: Record<string, boolean>;
  }
}

export function track(event: EventName, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
  } catch {}
  try {
    if (typeof window.fbq === "function") {
      // Mapeia generate_lead para o evento padrão do Pixel.
      if (event === "generate_lead") {
        window.fbq("track", "Lead", params);
      } else {
        window.fbq("trackCustom", event, params);
      }
    }
  } catch {}
}

export function trackOnce(event: EventName, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window._lovableTrackedOnce = window._lovableTrackedOnce || {};
  if (window._lovableTrackedOnce[event]) return;
  window._lovableTrackedOnce[event] = true;
  track(event, params);
}

export type UTMs = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  gclid: string | null;
  referrer: string | null;
  landing_path: string | null;
};

const STORAGE_KEY = "lp_tracking_v1";

export function captureAndPersistTracking(): UTMs {
  const empty: UTMs = {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    fbclid: null,
    gclid: null,
    referrer: null,
    landing_path: null,
  };
  if (typeof window === "undefined") return empty;

  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const fromUrl: UTMs = {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_content: params.get("utm_content"),
      utm_term: params.get("utm_term"),
      fbclid: params.get("fbclid"),
      gclid: params.get("gclid"),
      referrer: document.referrer || null,
      landing_path: url.pathname + url.search,
    };
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    const previous: Partial<UTMs> = stored ? JSON.parse(stored) : {};
    // Preserva o primeiro toque; substitui só quando a nova URL trouxer valor.
    const merged: UTMs = { ...empty, ...previous };
    (Object.keys(fromUrl) as (keyof UTMs)[]).forEach((k) => {
      const v = fromUrl[k];
      if (v && v.length > 0) merged[k] = v;
    });
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return empty;
  }
}

export function getPersistedTracking(): UTMs {
  const empty: UTMs = {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    fbclid: null,
    gclid: null,
    referrer: null,
    landing_path: null,
  };
  if (typeof window === "undefined") return empty;
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    return stored ? { ...empty, ...JSON.parse(stored) } : empty;
  } catch {
    return empty;
  }
}
