import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import heroImg from "@/assets/hero-blanq.jpg";
import fabricImg from "@/assets/fabric-merino.jpg";
import lifestyleImg from "@/assets/lifestyle-london.jpg";
import { ProductCard } from "@/components/site/ProductCard";
import { getAllProducts, getBestSellers, type ShopifyProduct } from "@/lib/shopify";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BLANQ — Quiet luxury, commanding presence." },
      {
        name: "description",
        content:
          "BLANQ. Considered essentials in the world's finest natural fibres. Quiet luxury, commanding presence.",
      },
      { property: "og:title", content: "BLANQ — Quiet luxury, commanding presence." },
      {
        property: "og:description",
        content: "Timeless essentials, engineered around the world's finest natural fibres.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [products, setProducts] = useState<ShopifyProduct[] | null>(null);
  const [bestSellers, setBestSellers] = useState<ShopifyProduct[] | null>(null);

  useEffect(() => {
    getAllProducts(50)
      .then(setProducts)
      .catch((e) => {
        console.error(e);
        setProducts([]);
      });
    getBestSellers(3)
      .then(setBestSellers)
      .catch(() => setBestSellers([]));
  }, []);

  const recent = (products ?? []).slice(0, 4);

  return (
    <>
      {/* HERO */}
      <section className="relative h-[92vh] min-h-[640px] w-full overflow-hidden bg-charcoal">
        <img
          src={heroImg}
          alt="A figure in charcoal merino against a quiet wall"
          width={1920}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/55 via-charcoal/10 to-transparent" />
        <div className="relative h-full mx-auto max-w-[1480px] px-6 md:px-10 flex flex-col justify-end pb-20 md:pb-28">
          <div className="max-w-2xl fade-in-up">
            <p className="text-offwhite/80 text-[11px] uppercase tracking-[0.32em] mb-6">
              Autumn / Winter — Vol. I
            </p>
            <h1 className="font-serif text-offwhite text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.05] tracking-[-0.015em]">
              Engineering
              <br />
              <em className="font-normal italic">silence.</em>
            </h1>
            <p className="mt-8 text-offwhite/85 text-base md:text-lg max-w-md leading-relaxed font-light">
              A new standard of essentials, drawn from the world's finest natural fibres and
              resolved into garments without ornament.
            </p>
            <div className="mt-10 flex items-center gap-8">
              <Link
                to="/collections"
                className="text-offwhite text-[11px] uppercase tracking-[0.22em] border-b border-offwhite/60 pb-1 hover:border-offwhite transition-colors"
              >
                Explore the Collection
              </Link>
              <Link
                to="/philosophy"
                className="text-offwhite/80 text-[11px] uppercase tracking-[0.22em] link-underline"
              >
                Read the philosophy
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO STATEMENT */}
      <section className="mx-auto max-w-[1480px] px-6 md:px-10 py-32 md:py-40">
        <div className="grid md:grid-cols-12 gap-10">
          <p className="md:col-span-3 eyebrow reveal-subtle">A House Note</p>
          <div className="md:col-span-8 md:col-start-5 reveal">
            <p className="font-serif text-2xl md:text-4xl leading-[1.35] text-foreground">
              We do not produce trends. We produce a small number of garments, considered slowly, in
              materials that justify the time given to them.
            </p>
          </div>
        </div>
      </section>


      {/* CRAFT / ATELIER */}
      <section className="bg-secondary/40 py-28 md:py-36">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="aspect-[4/5] overflow-hidden reveal">
              <img
                src={fabricImg}
                alt="Merino weave detail"
                loading="lazy"
                width={1280}
                height={1600}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center reveal">
              <Link to="/atelier" className="eyebrow mb-6 block hover:text-foreground transition-colors">The Atelier</Link>
              <h3 className="font-serif text-3xl md:text-4xl leading-tight mb-6">
                Made where it is best understood.
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-5">
                Every piece begins as a decision about material. We do not design and then source —
                we source and then design around what the fibre allows. The result is a garment that
                performs as the material intended, not as the brief demanded.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Production is kept small, intentionally. We work with the same workshops across
                seasons — not for convenience, but because the knowledge they carry cannot be
                transferred to a spreadsheet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOUSE FAVOURITES */}
      <section className="py-28 md:py-36">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 reveal">
            <div>
              <p className="eyebrow mb-4">Most Coveted</p>
              <h2 className="font-serif text-4xl md:text-5xl">House Favourites</h2>
              <p className="mt-4 text-muted-foreground max-w-md">
                The pieces our clients return for.
              </p>
            </div>
            <Link
              to="/collections"
              className="link-underline text-[11px] uppercase tracking-[0.22em]"
            >
              View all
            </Link>
          </div>
        </div>

        {/* Mobile carousel */}
        {bestSellers === null ? (
          <div className="md:hidden mx-auto max-w-[1480px] px-6">
            <ProductGridSkeleton />
          </div>
        ) : bestSellers.length === 0 ? (
          <div className="md:hidden mx-auto max-w-[1480px] px-6">
            <EmptyState />
          </div>
        ) : (
          <div className="md:hidden flex gap-5 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-6 pb-2">
            {bestSellers.map((p) => (
              <div key={p.id} className="snap-start shrink-0 w-[78vw]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}

        {/* Desktop grid */}
        <div className="hidden md:block mx-auto max-w-[1480px] px-10">
          {bestSellers === null ? (
            <ProductGridSkeleton />
          ) : bestSellers.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-3 gap-x-12 stagger-grid">
              {bestSellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PHILOSOPHY EDITORIAL */}
      <section className="relative bg-charcoal text-offwhite py-32 md:py-44 overflow-hidden">
        <img
          src={lifestyleImg}
          alt=""
          loading="lazy"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="relative mx-auto max-w-[1480px] px-6 md:px-10">
          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-3">
              <p className="eyebrow text-offwhite/60">The Philosophy</p>
            </div>
            <div className="md:col-span-8 md:col-start-5 reveal">
              <h2 className="font-serif text-3xl md:text-5xl leading-[1.2] text-offwhite">
                The clothes recede. The presence remains.
              </h2>
              <p className="mt-10 text-offwhite/75 leading-relaxed max-w-2xl font-light">
                Quiet luxury is not restraint for its own sake — it is the confidence to let the
                wearer speak. We make for the woman who has already decided who she is.
              </p>
              <div className="mt-12">
                <Link
                  to="/philosophy"
                  className="text-offwhite text-[11px] uppercase tracking-[0.22em] border-b border-offwhite/60 pb-1 hover:border-offwhite"
                >
                  Read in full
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="mx-auto max-w-[1480px] px-6 md:px-10 py-28 md:py-36">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 reveal">
          <div>
            <p className="eyebrow mb-4">Recent</p>
            <h2 className="font-serif text-4xl md:text-5xl">New Arrivals</h2>
          </div>
          <Link
            to="/collections"
            className="link-underline text-[11px] uppercase tracking-[0.22em]"
          >
            View all
          </Link>
        </div>
        {products === null ? (
          <ProductGridSkeleton />
        ) : recent.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 stagger-grid">
            {recent.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* PRIVATE LIST */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-[1480px] px-6 md:px-10 py-28 md:py-36">
          <div className="grid md:grid-cols-12 gap-10 items-end">
            <div className="md:col-span-7 reveal">
              <p className="eyebrow mb-6">The Private List</p>
              <h2 className="font-serif text-3xl md:text-5xl leading-tight max-w-xl">
                A quiet correspondence. Notes on new pieces, materials, and provenance — sent
                infrequently.
              </h2>
            </div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="md:col-span-5 flex items-end gap-4 border-b border-foreground pb-3 reveal"
            >
              <input
                type="email"
                placeholder="your@address.co.uk"
                className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground/70"
                aria-label="Email"
              />
              <button
                type="submit"
                className="text-[11px] uppercase tracking-[0.22em] text-foreground hover:opacity-70 transition-opacity"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 md:gap-x-12 gap-y-16">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="aspect-[4/5] bg-muted animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center text-muted-foreground">
      <p className="font-serif text-2xl text-foreground">No products found</p>
      <p className="mt-3 text-sm">
        Tell us in chat what piece to add to the catalogue and we'll create it directly in Shopify.
      </p>
    </div>
  );
}
