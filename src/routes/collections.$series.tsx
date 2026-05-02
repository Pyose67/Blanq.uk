import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { getCollectionByHandle, getAllProducts, type ShopifyProduct } from "@/lib/shopify";

/**
 * Series → Shopify collection handle mapping.
 * If the collection does not exist in the connected store, we fall back to
 * filtering all products by a heuristic so the page still renders.
 */
const seriesMeta = {
  merino: {
    handle: "merino",
    title: "The Merino Series",
    description: "Garments engineered around a single fibre.",
    fallback: (p: ShopifyProduct) => /merino|knit|wool/i.test(`${p.title} ${p.productType}`),
  },
  core: {
    handle: "core",
    title: "The Core Collection",
    description: "The permanent foundation of the wardrobe.",
    fallback: (_p: ShopifyProduct) => true,
  },
  new: {
    handle: "new-arrivals",
    title: "New Arrivals",
    description: "Recent additions to the catalogue.",
    fallback: (_p: ShopifyProduct) => true,
  },
} as const;

type SeriesKey = keyof typeof seriesMeta;

function isSeriesKey(s: string): s is SeriesKey {
  return s in seriesMeta;
}

export const Route = createFileRoute("/collections/$series")({
  loader: ({ params }) => {
    if (!isSeriesKey(params.series)) {
      return { key: "core" as SeriesKey };
    }
    return { key: params.series };
  },
  head: ({ loaderData }) => {
    const meta = loaderData ? seriesMeta[loaderData.key] : seriesMeta.core;
    return {
      meta: [
        { title: `${meta.title} | BLANQ` },
        { name: "description", content: meta.description },
        { property: "og:title", content: `${meta.title} | BLANQ` },
        { property: "og:description", content: meta.description },
      ],
    };
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { key } = Route.useLoaderData();
  const safeKey: SeriesKey = isSeriesKey(key) ? key : "core";
  const meta = seriesMeta[safeKey];

  const [products, setProducts] = useState<ShopifyProduct[] | null>(null);
  const [headline, setHeadline] = useState<{ title: string; description: string }>({
    title: meta.title,
    description: meta.description,
  });

  useEffect(() => {
    let cancelled = false;
    setProducts(null);
    setHeadline({ title: meta.title, description: meta.description });

    (async () => {
      // 1. Try the Shopify collection by handle
      try {
        const collection = await getCollectionByHandle(meta.handle, 100);
        if (cancelled) return;
        if (collection && collection.products.length > 0) {
          setProducts(collection.products);
          setHeadline({
            title: collection.title || meta.title,
            description: collection.description || meta.description,
          });
          return;
        }
      } catch (e) {
        console.error("Collection fetch failed, falling back to products list:", e);
      }

      // 2. Fallback — load all products and filter heuristically
      try {
        const all = await getAllProducts(100);
        if (cancelled) return;
        setProducts(all.filter(meta.fallback));
      } catch (e) {
        console.error(e);
        if (!cancelled) setProducts([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [meta]);

  const items = products ?? [];

  const allSizes = useMemo(() => collectOptionValues(items, "size"), [items]);
  const allColours = useMemo(() => collectOptionValues(items, "colour"), [items]);

  const [size, setSize] = useState<string | null>(null);
  const [colour, setColour] = useState<string | null>(null);

  const filtered = items.filter((p) => {
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
          <p className="eyebrow mb-6">Catalogue / {headline.title}</p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight max-w-3xl">
            {headline.title}
          </h1>
          {headline.description && (
            <p className="mt-6 text-muted-foreground max-w-xl">{headline.description}</p>
          )}
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
                <FilterGroup
                  label="Colour"
                  options={allColours}
                  value={colour}
                  onChange={setColour}
                />
              )}
              <p className="text-xs text-muted-foreground pt-4 border-t border-border">
                {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
              </p>
            </div>
          </aside>
          <div className="md:col-span-9 lg:col-span-10">
            {products === null ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] bg-muted animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <p className="font-serif text-2xl text-foreground">No products found</p>
                <p className="mt-3 text-sm">Try clearing the filters or come back soon.</p>
                <Link
                  to="/"
                  className="mt-6 inline-block link-underline text-[11px] uppercase tracking-[0.22em]"
                >
                  Return home
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
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
        {options.map((o) => (
          <li key={o}>
            <button
              onClick={() => onChange(o === value ? null : o)}
              className={`text-sm ${value === o ? "text-foreground border-b border-foreground" : "text-muted-foreground hover:text-foreground"} transition-colors`}
            >
              {o}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
