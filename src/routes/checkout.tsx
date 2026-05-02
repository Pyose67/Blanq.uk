import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useCart, formatGBP } from "@/lib/cart";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | BLANQ" },
      { name: "description", content: "Redirecting to secure Shopify-hosted checkout." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, count, checkoutUrl } = useCart();

  useEffect(() => {
    if (count === 0 || !checkoutUrl) return;
    if (typeof window !== "undefined") {
      window.open(checkoutUrl, "_blank");
    }
  }, [count, checkoutUrl]);

  if (count === 0) {
    return (
      <div className="mx-auto max-w-[720px] px-6 md:px-10 py-32 text-center">
        <p className="eyebrow mb-4">Checkout</p>
        <h1 className="font-serif text-4xl mb-6 text-ink">The bag is empty.</h1>
        <p className="text-muted-foreground mb-10">Add a piece to begin checkout.</p>
        <Link to="/" className="link-underline text-[11px] uppercase tracking-[0.28em]">
          Return home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[820px] px-6 md:px-10 py-20 md:py-28">
      <p className="eyebrow mb-4">Secure checkout</p>
      <h1 className="font-serif text-3xl md:text-4xl text-ink mb-3">Opening Shopify checkout…</h1>
      <p className="text-muted-foreground leading-relaxed">
        Your secure Shopify checkout has opened in a new tab. If it did not, use the button below.
      </p>

      <div className="hairline my-10" />

      <ul className="divide-y divide-border border-y border-border">
        {items.map((i) => (
          <li key={i.id} className="flex gap-4 py-5">
            <div className="w-16 h-20 bg-muted overflow-hidden shrink-0">
              <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-ink">{i.name}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
                {i.colour} · Size {i.size} · ×{i.quantity}
              </p>
            </div>
            <p className="tabular-nums text-sm">{formatGBP(i.price * i.quantity)}</p>
          </li>
        ))}
      </ul>

      <div className="flex justify-between items-baseline mt-6">
        <span className="eyebrow">Subtotal</span>
        <span className="text-lg tabular-nums text-ink">{formatGBP(subtotal)}</span>
      </div>

      {checkoutUrl && (
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-10 inline-block bg-ink text-offwhite px-10 py-5 text-[11px] uppercase tracking-[0.28em] hover:bg-ink/90 transition-colors"
        >
          Open Shopify checkout
        </a>
      )}

      <Link
        to="/"
        className="mt-8 ml-6 inline-block link-underline text-[11px] uppercase tracking-[0.28em]"
      >
        Continue browsing
      </Link>
    </div>
  );
}
