import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { getRecentProducts, type ShopifyProduct } from "@/lib/shopify";

export const Route = createFileRoute("/new-arrivals")({
  head: () => ({
    meta: [
      { title: "New Arrivals — Blanq" },
      { name: "description", content: "The latest pieces added to the Blanq catalogue." },
      { property: "og:title", content: "New Arrivals — Blanq" },
    ],
  }),
  component: NewArrivalsPage,
});

type Status = "loading" | "found" | "empty";

function NewArrivalsPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [products, setProducts] = useState<ShopifyProduct[]>([]);

  useEffect(() => {
    getRecentProducts(50)
      .then((items) => {
        setProducts(items);
        setStatus(items.length === 0 ? "empty" : "found");
      })
      .catch(() => {
        setProducts([]);
        setStatus("empty");
      });
  }, []);

  const allSizes = useMemo(() => collectOptionValues(products, "size"), [products]);
  const allColours = useMemo(() => collectOptionValues(products, "colour"), [products]);

  const [size, setSize] = useState<string | null>(null);
  const [colour, setColour] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    if (size) {
      const opt = p.options.find((o) => /size/i.test(o.name));
      if (!opt || !opt.values.includes(size)) return false;
    }
    if (colour) {
      const opt = p.options.find((o) => /colou?r/i.test(o.name));
      if (!opt || !opt.values.includes(colour)) return false;
    }
    return true;
  });

  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10 py-20 md:py-28">
          <p className="eyebrow mb-6 reveal-subtle">
            <Link to="/collections" className="hover:text-foreground transition-colors">
              Catalogue
            </Link>
            {" / New Arrivals"}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight max-w-3xl reveal">
            New Arrivals
          </h1>
          <p className="mt-6 text-muted-foreground max-w-xl">
            Pieces added to the catalogue in the last 90 days.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1480px] px-6 md:px-10 py-12">
        <div className="grid md:grid-cols-12 gap-10">
          <aside className="md:col-span-3 lg:col-span-2">
            <div className="md:sticky md:top-28 space-y-10">
              {allSizes.length > 0 && (
                <FilterGroup label="Size" options={allSizes} value={size} onChange={setSize} />
              )}
              {allColours.length > 0 && (
                <FilterGroup label="Colour" options={allColours} value={colour} onChange={setColour} />
              )}
              {status === "found" && (
                <p className="text-xs text-muted-foreground pt-4 border-t border-border">
                  {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
                </p>
              )}
            </div>
          </aside>

          <div className="md:col-span-9 lg:col-span-10">
            {status === "loading" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] bg-muted animate-pulse" />
                ))}
              </div>
            ) : status === "empty" || filtered.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <p className="font-serif text-2xl text-foreground">No new arrivals</p>
                <p className="mt-3 text-sm">
                  {size || colour
                    ? "Try clearing the filters."
                    : "No pieces have been added in the last 90 days."}
                </p>
                <Link
                  to="/collections"
                  className="mt-6 inline-block link-underline text-[11px] uppercase tracking-[0.22em]"
                >
                  View all collections
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16 stagger-grid">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function collectOptionValues(items: ShopifyProduct[], nameLower: string): string[] {
  const set = new Set<string>();
  const re = nameLower === "colour" ? /colou?r/i : new RegExp(nameLower, "i");
  for (const p of items) {
    const opt = p.options.find((o) => re.test(o.name));
    opt?.values.forEach((v) => set.add(v));
  }
  return Array.from(set);
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <p className="eyebrow mb-4">{label}</p>
      <ul className="space-y-2">
        <li>
          <button
            onClick={() => onChange(null)}
            className={`text-sm ${value === null ? "text-foreground" : "text-muted-foreground hover:text-foreground"} transition-colors`}
          >
            All
          </button>
        </li>
        {options.map((opt) => (
          <li key={opt}>
            <button
              onClick={() => onChange(opt === value ? null : opt)}
              className={`text-sm ${value === opt ? "text-foreground" : "text-muted-foreground hover:text-foreground"} transition-colors`}
            >
              {opt}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
