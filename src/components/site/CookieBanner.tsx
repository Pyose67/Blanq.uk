import { useEffect, useState } from "react";

// ─── Consent storage ─────────────────────────────────────────────────────────

export interface ConsentChoices {
  analytics: boolean;
  marketing: boolean;
}

function saveCookie(choices: ConsentChoices) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `consent_state=${encodeURIComponent(JSON.stringify(choices))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  // Mirror to localStorage for fast reads in other modules
  localStorage.setItem("blanq_consent", choices.analytics || choices.marketing ? "granted" : "denied");
  // Compliance log
  localStorage.setItem(
    "blanq_consent_log",
    JSON.stringify({ timestamp: new Date().toISOString(), banner_version: "1.0", choices }),
  );
}

export function readConsent(): ConsentChoices | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/consent_state=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

function applyConsent(choices: ConsentChoices) {
  saveCookie(choices);

  // Google Consent Mode v2
  window.gtag?.("consent", "update", {
    analytics_storage: choices.analytics ? "granted" : "denied",
    ad_storage: choices.marketing ? "granted" : "denied",
    ad_user_data: choices.marketing ? "granted" : "denied",
    ad_personalization: choices.marketing ? "granted" : "denied",
  });

  // GTM dataLayer triggers
  window.dataLayer = window.dataLayer || [];
  if (choices.analytics) window.dataLayer.push({ event: "consent_analytics_granted" });
  if (choices.marketing) window.dataLayer.push({ event: "consent_marketing_granted" });

  // Meta Pixel
  (window as { fbq?: (...a: unknown[]) => void }).fbq?.(
    "consent",
    choices.marketing ? "grant" : "revoke",
  );

  // Shopify Customer Privacy API (headless — may not be present)
  const shopify = (window as { Shopify?: { customerPrivacy?: { setTrackingConsent: (o: object, cb: () => void) => void } } }).Shopify;
  shopify?.customerPrivacy?.setTrackingConsent(
    { analytics: choices.analytics, marketing: choices.marketing, preferences: true, sale_of_data: false },
    () => {},
  );

  // Notify Clarity
  document.dispatchEvent(new CustomEvent("blanq:consent-update", { detail: choices }));
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? "bg-ink" : "bg-border"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── Manage modal ─────────────────────────────────────────────────────────────

function ManageModal({
  onSave,
  onBack,
}: {
  onSave: (choices: ConsentChoices) => void;
  onBack: () => void;
}) {
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  return (
    <div className="relative w-full md:max-w-lg mx-auto md:mx-6 bg-[#F4F1ED] border-t md:border border-[#D6D1C8]">
      <div className="px-8 py-10 md:py-12">
        <p className="eyebrow mb-8">Cookie Preferences</p>

        <div className="space-y-7">
          {/* Essential */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-ink">Essential</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Keeps your cart, session and checkout working.
              </p>
            </div>
            <Toggle checked disabled />
          </div>

          <div className="h-px bg-border" />

          {/* Analytics */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-ink">Analytics</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Helps us understand which pieces resonate and how the site is used.
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground/70 uppercase tracking-[0.14em]">
                Google Analytics · Microsoft Clarity
              </p>
            </div>
            <Toggle checked={analytics} onChange={setAnalytics} />
          </div>

          <div className="h-px bg-border" />

          {/* Marketing */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-ink">Marketing</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Allows us to share Blanq with people who might appreciate it.
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground/70 uppercase tracking-[0.14em]">
                Meta · TikTok · Pinterest · Google Ads
              </p>
            </div>
            <Toggle checked={marketing} onChange={setMarketing} />
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onSave({ analytics, marketing })}
            className="flex-1 bg-ink text-offwhite text-[11px] uppercase tracking-[0.28em] py-4 hover:bg-ink/90 transition-colors"
          >
            Save preferences
          </button>
          <button
            onClick={onBack}
            className="flex-1 border border-[#1A1A1A] text-[11px] uppercase tracking-[0.28em] py-4 text-ink hover:bg-ink hover:text-offwhite transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main banner ─────────────────────────────────────────────────────────────

type View = "banner" | "manage" | "hidden";

export function CookieBanner() {
  const [view, setView] = useState<View>("hidden");

  useEffect(() => {
    if (readConsent() === null) {
      setView("banner");
      document.body.style.overflow = "hidden";
    }

    // Footer "Cookie preferences" link opens manage modal
    function onOpenPreferences() {
      setView("manage");
      document.body.style.overflow = "hidden";
    }
    document.addEventListener("blanq:open-cookie-preferences", onOpenPreferences);
    return () => document.removeEventListener("blanq:open-cookie-preferences", onOpenPreferences);
  }, []);

  function close() {
    document.body.style.overflow = "";
    setView("hidden");
  }

  function accept() {
    applyConsent({ analytics: true, marketing: true });
    close();
  }

  function decline() {
    applyConsent({ analytics: false, marketing: false });
    close();
  }

  function save(choices: ConsentChoices) {
    applyConsent(choices);
    close();
  }

  if (view === "hidden") return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />

      {view === "manage" ? (
        <ManageModal onSave={save} onBack={() => setView("banner")} />
      ) : (
        <div className="relative w-full md:max-w-lg md:mx-6 bg-[#F4F1ED] border-t md:border border-[#D6D1C8]">
          <div className="px-8 py-10 md:py-12">
            <p className="eyebrow mb-5">Cookies</p>
            <p className="text-sm text-[#1A1A1A] leading-relaxed mb-8">
              We use cookies to understand how Blanq is browsed and to reach people who might love
              our pieces. Accept all, manage your preferences, or decline. Your choice is
              remembered.{" "}
              <a
                href="/policies/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Privacy policy
              </a>
              .
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={accept}
                style={{ background: "#1A1A1A", color: "#FFFFFF" }}
                className="flex-1 text-[11px] uppercase tracking-[0.28em] py-4 hover:opacity-90 transition-opacity"
              >
                Accept all
              </button>
              <button
                onClick={() => setView("manage")}
                style={{ background: "#4A4A4A", color: "#FFFFFF" }}
                className="flex-1 text-[11px] uppercase tracking-[0.28em] py-4 hover:opacity-90 transition-opacity"
              >
                Manage
              </button>
              <button
                onClick={decline}
                style={{ background: "transparent", color: "#1A1A1A", border: "1px solid #1A1A1A" }}
                className="flex-1 text-[11px] uppercase tracking-[0.28em] py-4 hover:bg-[#1A1A1A] hover:text-white transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
