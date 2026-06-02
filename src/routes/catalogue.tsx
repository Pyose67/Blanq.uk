import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { getAllProducts, type ShopifyProduct } from "@/lib/shopify";

export const Route = createFileRoute("/catalogue")({
  head: () => ({
    meta: [
      { title: "All Pieces — Blanq" },
      { name: "description", content: "The complete Blanq catalogue. Every piece, every category." },
      { property: "og:title", content: "All Pieces — Blanq" },
    ],
  }),
  component: CataloguePage,
});

type Status = "loading" | "found" | "empty";

function collectOptionValues(items: ShopifyProduct[], nameLower: string): string[] {
  const set = new Set<string>();
  const re = nameLower === "colour" ? /colou?r/i : new RegExp(nameLower, "i");
  for (const p of items) {
    const opt = p.options.find((o) => re.test(o.name));
    opt?.values.forEach((v) => set.add(v));
  }
  return Array.from(set);
}

function CataloguePage() {
  const [status, setStatus] = useState<Status>("loading");
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [colour, setColour] = useState<string | null>(null);

  useEffect(() => {
    getAllProducts(250)
      .then((items) => {
        setProducts(items);
        setStatus(items.length === 0 ? "empty" : "found");
      })
      .catch(() => {
        setProducts([]);
        setStatus("empty");
      });
  }, []);

  const hasFilters = category !== null || size !== null || colour !== null;

  // Products after applying each individual filter independently
  // so available options in other filters reflect the current selection
  const afterCategory = useMemo(
    () => (category ? products.filter((p) => (p.category ?? p.productType) === category) : products),
    [products, category],
  );
  const afterSize = useMemo(
    () =>
      size
        ? products.filter((p) => {
            const opt = p.options.find((o) => /size/i.test(o.name));
            return opt?.values.includes(size);
          })
        : products,
    [products, size],
  );
  const afterColour = useMemo(
    () =>
      colour
        ? products.filter((p) => {
            const opt = p.options.find((o) => /colou?r/i.test(o.name));
            return opt?.values.includes(colour);
          })
        : products,
    [products, colour],
  );

  // Available options for each filter = intersection of the OTHER two active filters
  const availableCategories = useMemo(() => {
    const base = afterSize.filter((p) =>
      colour
        ? p.options.find((o) => /colou?r/i.test(o.name))?.values.includes(colour)
        : true,
    );
    const set = new Set<string>();
    base.forEach((p) => { const c = p.category ?? p.productType; if (c) set.add(c); });
    return Array.from(set).sort();
  }, [afterSize, afterColour, colour]);

  const availableSizes = useMemo(() => {
    const base = afterCategory.filter((p) =>
      colour
        ? p.options.find((o) => /colou?r/i.test(o.name))?.values.includes(colour)
        : true,
    );
    return collectOptionValues(base, "size");
  }, [afterCategory, colour]);

  const availableColours = useMemo(() => {
    const base = afterCategory.filter((p) =>
      size
        ? p.options.find((o) => /size/i.test(o.name))?.values.includes(size)
        : true,
    );
    return collectOptionValues(base, "colour");
  }, [afterCategory, size]);

  // Final filtered list = all three filters combined
  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (category && (p.category ?? p.productType) !== category) return false;
        if (size) {
          const opt = p.options.find((o) => /size/i.test(o.name));
          if (!opt?.values.includes(size)) return false;
        }
        if (colour) {
          const opt = p.options.find((o) => /colou?r/i.test(o.name));
          if (!opt?.values.includes(colour)) return false;
        }
        return true;
      }),
    [products, category, size, colour],
  );

  function clearAll() {
    setCategory(null);
    setSize(null);
    setColour(null);
  }

  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10 py-20 md:py-28">
          <p className="eyebrow mb-6 reveal-subtle">
            <Link to="/collections" className="hover:text-foreground transition-colors">
              Catalogue
            </Link>
            {" / All Pieces"}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight max-w-3xl reveal">
            All Pieces
          </h1>
          <p className="mt-6 text-muted-foreground max-w-xl">The complete catalogue.</p>
        </div>
      </section>

      <div className="mx-auto max-w-[1480px] px-6 md:px-10 py-12">
        <div className="grid md:grid-cols-12 gap-10">
          <aside className="md:col-span-3 lg:col-span-2">
            <div className="md:sticky md:top-28 space-y-10">
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors border-b border-current pb-0.5"
                >
                  Clear all
                </button>
              )}

              {availableCategories.length > 0 && (
                <FilterGroup
                  label="Category"
                  options={availableCategories}
                  value={category}
                  onChange={setCategory}
                />
              )}
              {availableSizes.length > 0 && (
                <FilterGroup
                  label="Size"
                  options={availableSizes}
                  value={size}
                  onChange={setSize}
                />
              )}
              {availableColours.length > 0 && (
                <FilterGroup
                  label="Colour"
                  options={availableColours}
                  value={colour}
                  onChange={setColour}
                />
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
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <p className="font-serif text-2xl text-foreground">No products found</p>
                <p className="mt-3 text-sm">
                  {hasFilters ? "Try clearing the filters." : "No products in the catalogue yet."}
                </p>
                {hasFilters && (
                  <button
                    onClick={clearAll}
                    className="mt-6 link-underline text-[11px] uppercase tracking-[0.22em]"
                  >
                    Clear filters
                  </button>
                )}
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
