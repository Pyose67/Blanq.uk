import { Link } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useCart, formatGBP } from "@/lib/cart";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal, count } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(o) => (o ? null : closeCart())}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 bg-background border-l border-border flex flex-col"
      >
        <SheetHeader className="px-6 md:px-8 py-6 border-b border-border text-left space-y-1">
          <SheetTitle className="font-serif text-2xl tracking-tight">Your bag</SheetTitle>
          <SheetDescription className="eyebrow !text-foreground/60">
            {count === 0 ? "No pieces selected" : `${count} ${count === 1 ? "piece" : "pieces"}`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <p className="font-serif text-xl mb-3">The bag is empty.</p>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Considered pieces, added with intention.
            </p>
            <Link
              to="/collections/$series"
              params={{ series: "merino" }}
              onClick={closeCart}
              className="text-[11px] uppercase tracking-[0.28em] link-underline"
            >
              Explore the catalogue
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4 px-6 md:px-8 py-6">
                    <Link
                      to="/product/$slug"
                      params={{ slug: item.slug }}
                      onClick={closeCart}
                      className="shrink-0 w-20 h-24 bg-muted overflow-hidden"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex justify-between gap-3">
                        <Link
                          to="/product/$slug"
                          params={{ slug: item.slug }}
                          onClick={closeCart}
                          className="font-serif text-base leading-snug hover:underline underline-offset-4"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="text-muted-foreground hover:text-foreground transition-colors -mt-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {item.colour} · Size {item.size}
                      </p>
                      <div className="mt-auto pt-4 flex items-end justify-between">
                        <div className="inline-flex items-center border border-border">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                            className="h-8 w-8 grid place-items-center hover:bg-muted transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="h-8 min-w-8 px-2 grid place-items-center text-xs tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                            className="h-8 w-8 grid place-items-center hover:bg-muted transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm tabular-nums">
                          {formatGBP(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border px-6 md:px-8 py-6 space-y-5 bg-background">
              <div className="flex justify-between items-baseline">
                <span className="eyebrow">Subtotal</span>
                <span className="text-lg tabular-nums">{formatGBP(subtotal)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Taxes calculated at checkout. Complimentary delivery within the United Kingdom.
              </p>
              <Link
                to="/checkout"
                onClick={closeCart}
                className="block w-full py-5 bg-foreground text-background text-center text-[11px] uppercase tracking-[0.28em] hover:bg-foreground/90 transition-colors"
              >
                Proceed to checkout
              </Link>
              <button
                onClick={closeCart}
                className="block w-full text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors"
              >
                Continue browsing
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
