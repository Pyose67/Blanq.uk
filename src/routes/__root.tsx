import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CartProvider, useCartSync } from "@/lib/cart";
import { CartDrawer } from "@/components/site/CartDrawer";
import { ShopifyAnalytics } from "@/components/site/ShopifyAnalytics";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow mb-6">Error 404</p>
        <h1 className="font-serif text-5xl text-foreground">Not found</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          The page you are looking for is no longer part of the catalogue.
        </p>
        <div className="mt-8">
          <Link to="/" className="link-underline text-[11px] uppercase tracking-[0.22em]">
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Blanq" },
      {
        name: "description",
        content:
          "BLANQ. Considered essentials in the world's finest natural fibres. Quiet luxury, commanding presence.",
      },
      { name: "author", content: "BLANQ" },
      { property: "og:title", content: "Blanq" },
      { name: "twitter:title", content: "Blanq" },
      {
        property: "og:description",
        content:
          "BLANQ. Considered essentials in the world's finest natural fibres. Quiet luxury, commanding presence.",
      },
      {
        name: "twitter:description",
        content:
          "BLANQ. Considered essentials in the world's finest natural fibres. Quiet luxury, commanding presence.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4278a082-40fb-4962-ba51-80186ae41180/id-preview-693baf06--443fc15a-9865-4fae-8f67-d53f02f994ea.lovable.app-1777249020839.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4278a082-40fb-4962-ba51-80186ae41180/id-preview-693baf06--443fc15a-9865-4fae-8f67-d53f02f994ea.lovable.app-1777249020839.png",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function useScrollReveal() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );

    function observeEl(el: Element) {
      if (el.classList.contains("is-visible")) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add("is-visible");
      } else {
        io.observe(el);
      }
    }

    function scan() {
      document.querySelectorAll(".reveal, .reveal-subtle, .stagger-grid > *").forEach(observeEl);
    }

    // MutationObserver catches elements added after async data loads
    // (product grids in collections/home that render after useEffect fetches complete)
    const mo = new MutationObserver((mutations) => {
      for (const mut of mutations) {
        mut.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (
            node.matches(".reveal, .reveal-subtle") ||
            node.parentElement?.classList.contains("stagger-grid")
          ) {
            observeEl(node);
          }
          node.querySelectorAll(".reveal, .reveal-subtle, .stagger-grid > *").forEach(observeEl);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    const raf = requestAnimationFrame(scan);
    const t = setTimeout(scan, 150);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);
}

function RootComponent() {
  useCartSync();
  useScrollReveal();
  return (
    <CartProvider>
      <ShopifyAnalytics />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
