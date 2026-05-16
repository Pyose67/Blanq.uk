import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listCollections, type ShopifyCollectionSummary } from "@/lib/shopify";

export const Route = createFileRoute("/collections/")({
  head: () => ({
    meta: [
      { title: "Collections — Blanq" },
      { name: "description", content: "Explore the complete Blanq catalogue. Considered essentials in the world's finest natural fibres." },
      { property: "og:title", content: "Collections — Blanq" },
    ],
  }),
  component: CollectionsIndexPage,
});

function CollectionsIndexPage() {
  const [collections, setCollections] = useState<ShopifyCollectionSummary[] | null>(null);

  useEffect(() => {
    listCollections(50)
      .then(setCollections)
      .catch(() => setCollections([]));
  }, []);

  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10 py-20 md:py-28">
          <p className="eyebrow mb-6 reveal-subtle">Catalogue</p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight max-w-3xl reveal">
            Collections
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-[1480px] px-6 md:px-10 py-20">
        {collections === null ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 gap-y-16">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[3/4] bg-muted animate-pulse" />
                <div className="h-5 w-2/3 bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="font-serif text-2xl text-foreground">No collections yet</p>
            <p className="mt-3 text-sm">Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 gap-y-16 stagger-grid">
            {collections.map((c) => (
              <CollectionCard key={c.id} collection={c} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function CollectionCard({ collection }: { collection: ShopifyCollectionSummary }) {
  return (
    <Link
      to="/collections/$series"
      params={{ series: collection.handle }}
      className="group block"
    >
      <div className="relative overflow-hidden bg-muted aspect-[3/4]">
        {collection.image ? (
          <img
            src={collection.image.url}
            alt={collection.image.altText ?? collection.title}
            loading="lazy"
            width={collection.image.width ?? 800}
            height={collection.image.height ?? 1067}
            className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>
      <div className="mt-5">
        <h2 className="font-serif text-xl text-foreground">{collection.title}</h2>
        {collection.description && (
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {collection.description}
          </p>
        )}
        <span className="mt-4 inline-block text-[11px] uppercase tracking-[0.22em] border-b border-foreground pb-0.5">
          View collection
        </span>
      </div>
    </Link>
  );
}
