function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  return document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))?.[1] ?? "";
}

function getMarketingConsent(): boolean {
  try {
    const match = document.cookie.match(/consent_state=([^;]+)/);
    if (!match) return false;
    return JSON.parse(decodeURIComponent(match[1]))?.marketing === true;
  } catch {
    return false;
  }
}

type MetaCustomData = Record<string, unknown>;

export function trackMeta(eventName: string, customData: MetaCustomData = {}) {
  if (typeof window === "undefined") return;
  if (!getMarketingConsent()) return;

  const eventId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const fbp = getCookie("_fbp");
  const fbc = getCookie("_fbc");

  // Browser pixel — passes eventID so Meta deduplicates against CAPI
  (window as { fbq?: (...args: unknown[]) => void }).fbq?.(
    "track",
    eventName,
    customData,
    { eventID: eventId },
  );

  // Server-side CAPI — enriched with real IP + UA by the Worker
  const userData: Record<string, string> = {};
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  fetch("/api/meta-capi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      events: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          event_source_url: window.location.href,
          action_source: "website",
          user_data: userData,
          ...(Object.keys(customData).length > 0 && { custom_data: customData }),
        },
      ],
    }),
  }).catch(() => {});
}
