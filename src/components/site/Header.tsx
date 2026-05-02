import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";

const desktopNav = [
  { to: "/philosophy", label: "Philosophy" },
  { to: "/collections/$series", params: { series: "merino" }, label: "Collections" },
  { to: "/collections/$series", params: { series: "new" }, label: "Atelier" },
] as const;

const mobileNav = [
  { to: "/", label: "Home" },
  { to: "/collections/$series", params: { series: "merino" }, label: "Collections" },
  { to: "/philosophy", label: "Philosophy" },
  { to: "/collections/$series", params: { series: "new" }, label: "New" },
] as const;

export function Header() {
  const { count, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-[1480px] px-5 md:px-10">
        <div className="grid grid-cols-3 items-center h-16 md:h-20">
          {/* Left — hamburger (mobile) / nav (desktop) */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="md:hidden -ml-2 p-2 text-foreground"
            >
              <span className="sr-only">Open menu</span>
              <Menu className="h-5 w-5" strokeWidth={1.25} />
            </button>
            <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.22em] text-foreground/85">
              {desktopNav.slice(0, 2).map((item) =>
                "params" in item ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    params={item.params}
                    className="link-underline"
                    activeProps={{ className: "link-underline text-foreground" }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="link-underline"
                    activeProps={{ className: "link-underline text-foreground" }}
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </nav>
          </div>

          {/* Center — wordmark */}
          <Link to="/" className="justify-self-center" aria-label="BLANQ — home">
            <span className="font-serif text-xl md:text-2xl tracking-[0.42em] text-ink">BLANQ</span>
          </Link>

          {/* Right — desktop link + bag */}
          <div className="justify-self-end flex items-center gap-5 md:gap-7">
            <Link
              to={desktopNav[2].to}
              params={desktopNav[2].params}
              className="hidden md:inline-block link-underline text-[11px] uppercase tracking-[0.22em] text-foreground/85"
              activeProps={{ className: "link-underline text-foreground" }}
            >
              {desktopNav[2].label}
            </Link>
            <button
              type="button"
              onClick={openCart}
              aria-label={`Open bag, ${count} items`}
              className="relative flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-foreground/90 hover:text-foreground transition-colors -mr-1 p-1"
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.25} />
              <span className="tabular-nums">({count})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer — full-height, slides from left */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          className="w-[88%] max-w-sm p-0 bg-background border-r border-border flex flex-col [&>button]:hidden"
        >
          <SheetHeader className="px-6 py-5 border-b border-border flex-row items-center justify-between space-y-0 text-left">
            <SheetTitle asChild>
              <span className="font-serif text-lg tracking-[0.42em] text-ink">BLANQ</span>
            </SheetTitle>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="-mr-2 p-2 text-foreground"
            >
              <X className="h-5 w-5" strokeWidth={1.25} />
            </button>
          </SheetHeader>
          <SheetDescription className="sr-only">Primary navigation</SheetDescription>
          <nav className="flex-1 px-6 py-8">
            <ul className="space-y-1">
              {mobileNav.map((item) => (
                <li key={item.label}>
                  {"params" in item ? (
                    <Link
                      to={item.to}
                      params={item.params}
                      onClick={() => setMenuOpen(false)}
                      className="block py-4 font-serif text-3xl tracking-tight text-ink"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <Link
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className="block py-4 font-serif text-3xl tracking-tight text-ink"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <div className="px-6 py-6 border-t border-border space-y-3">
            <p className="eyebrow">Client services</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Complimentary delivery within the United Kingdom. Considered returns within thirty
              days.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
