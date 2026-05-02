import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Instagram, Facebook } from "lucide-react";
import { getShopPolicies, siteConfig, type ShopPolicies } from "@/lib/shopify";
import { PaymentIcons } from "@/components/site/PaymentIcons";

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2C6.5 2 4 5.66 4 8.71c0 1.85.7 3.49 2.2 4.1.25.1.47 0 .54-.27.05-.18.16-.65.21-.85.07-.27.04-.36-.16-.6-.45-.52-.74-1.2-.74-2.16 0-2.79 2.09-5.29 5.43-5.29 2.96 0 4.59 1.81 4.59 4.23 0 3.18-1.41 5.87-3.5 5.87-1.16 0-2.02-.96-1.74-2.13.33-1.4.96-2.91.96-3.92 0-.9-.49-1.66-1.49-1.66-1.18 0-2.13 1.22-2.13 2.86 0 1.04.35 1.74.35 1.74L7.13 19.4c-.4 1.7-.06 3.78-.03 3.99.02.13.18.16.26.06.11-.14 1.5-1.86 1.97-3.57.13-.48.77-3.01.77-3.01.38.72 1.48 1.36 2.66 1.36 3.5 0 5.87-3.19 5.87-7.46C18.62 4.55 15.92 2 12.04 2z" />
    </svg>
  );
}

export function Footer() {
  const [policies, setPolicies] = useState<ShopPolicies | null>(null);

  useEffect(() => {
    getShopPolicies().then(setPolicies).catch(() => setPolicies(null));
  }, []);

  const policyLinks = [
    { policy: policies?.privacyPolicy, label: "Privacy" },
    { policy: policies?.termsOfService, label: "Terms" },
    { policy: policies?.shippingPolicy, label: "Shipping" },
    { policy: policies?.refundPolicy, label: "Returns" },
  ];

  return (
    <footer className="mt-32 border-t border-border bg-background">
      <div className="mx-auto max-w-[1480px] px-6 md:px-10 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          <div>
            <p className="eyebrow mb-6">House</p>
            <ul className="space-y-3 text-sm">
              <li><Link to="/philosophy" className="link-underline">Philosophy</Link></li>
              <li><span className="text-muted-foreground">Provenance</span></li>
              <li><span className="text-muted-foreground">Atelier</span></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-6">Catalogue</p>
            <ul className="space-y-3 text-sm">
              <li><Link to="/collections/$series" params={{ series: "merino" }} className="link-underline">The Merino Series</Link></li>
              <li><Link to="/collections/$series" params={{ series: "core" }} className="link-underline">The Core Collection</Link></li>
              <li><Link to="/collections/$series" params={{ series: "new" }} className="link-underline">New Arrivals</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-6">Policies</p>
            <ul className="space-y-3 text-sm">
              {policyLinks.filter((p) => p.policy).map((p) => (
                <li key={p.policy!.handle}>
                  <Link to="/policies/$handle" params={{ handle: p.policy!.handle }} className="link-underline">
                    {p.label}
                  </Link>
                </li>
              ))}
              {!policies && <li className="text-muted-foreground text-xs">Loading…</li>}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-6">House Notes</p>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={siteConfig.socials.instagram} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 link-underline">
                  <Instagram className="h-4 w-4" strokeWidth={1.4} /> Instagram
                </a>
              </li>
              <li>
                <a href={siteConfig.socials.pinterest} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 link-underline">
                  <PinterestIcon className="h-4 w-4" /> Pinterest
                </a>
              </li>
              <li>
                <a href={siteConfig.socials.facebook} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 link-underline">
                  <Facebook className="h-4 w-4" strokeWidth={1.4} /> Facebook
                </a>
              </li>
              <li className="text-muted-foreground pt-2 break-all">{siteConfig.contact.email}</li>
            </ul>
          </div>
        </div>

        <div className="hairline mt-16" />

        <div className="grid md:grid-cols-2 gap-6 pt-8">
          <div>
            <p className="eyebrow mb-4">Accepted</p>
            <PaymentIcons className="text-foreground/70" />
          </div>
          <div className="md:text-right">
            <p className="font-serif italic text-sm text-foreground/70">
              {siteConfig.slogan}
            </p>
            <p className="mt-2 text-xs text-muted-foreground tracking-wide">
              © {new Date().getFullYear()} {siteConfig.brand}. Registered in England &amp; Wales.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
