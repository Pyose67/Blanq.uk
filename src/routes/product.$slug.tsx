import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getProductByHandle,
  getProductReviews,
  addProductReview,
  getAllProducts,
  formatMoney,
  findVariant,
  type ShopifyProduct,
  type ProductReviewsSummary,
} from "@/lib/shopify";
import { ProductCard } from "@/components/site/ProductCard";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const [product, all] = await Promise.all([
      getProductByHandle(params.slug),
      getAllProducts(20).catch(() => []),
    ]);
    if (!product) throw notFound();
    const related = all
      .filter((p) => p.handle !== product.handle)
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
    return { product, related };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return { meta: [{ title: "BLANQ" }] };
    const desc = p.descriptionHtml.replace(/<[^>]+>/g, "").slice(0, 160);
    const img = p.images[0]?.url;
    return {
      meta: [
        { title: `${p.title} | BLANQ` },
        { name: "description", content: desc },
        { property: "og:title", content: `${p.title} | BLANQ` },
        { property: "og:description", content: desc },
        ...(img ? [{ property: "og:image", content: img }] : []),
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="py-40 text-center">
      <p className="eyebrow mb-4">Not found</p>
      <h1 className="font-serif text-3xl">This piece is no longer in the catalogue</h1>
      <Link
        to="/"
        className="mt-6 inline-block link-underline text-[11px] uppercase tracking-[0.22em]"
      >
        Return home
      </Link>
    </div>
  ),
});

function ProductPage() {
  const { product, related } = Route.useLoaderData();
  return <ProductView product={product} related={related} />;
}

function ProductView({ product, related }: { product: ShopifyProduct; related: ShopifyProduct[] }) {
  const { addItem } = useCart();

  const colourOption = product.options.find((o) => /colou?r/i.test(o.name));
  const sizeOption = product.options.find((o) => /size/i.test(o.name));
  const colourKey = colourOption?.name ?? "Colour";
  const sizeKey = sizeOption?.name ?? "Size";

  const [colour, setColour] = useState<string>(colourOption?.values[0] ?? "");
  const [size, setSize] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  const variant = useMemo(
    () => (size ? findVariant(product, { [colourKey]: colour, [sizeKey]: size }) : undefined),
    [product, colour, size, colourKey, sizeKey],
  );

  const displayPrice = variant?.price ?? product.variants[0].price;
  const sizeSelected = Boolean(size);
  const variantUnavailable = sizeSelected && variant && !variant.availableForSale;
  const ctaDisabled = !sizeSelected || variantUnavailable;

  const ctaLabel = added
    ? "Added to bag"
    : !sizeSelected
      ? "Select a size"
      : variantUnavailable
        ? "Sold out"
        : "Add to bag";

  return (
    <>
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-[1480px] px-5 md:px-10 pt-6 md:pt-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <Link to="/" className="link-underline">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span>{product.productType}</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.title}</span>
        </p>
      </div>

      {/* HERO — product gallery + buybox */}
      <section className="mx-auto max-w-[1480px] px-5 md:px-10 py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/5] bg-muted overflow-hidden">
              <img
                src={product.images[activeImage].url}
                alt={product.images[activeImage].altText ?? product.title}
                width={product.images[activeImage].width}
                height={product.images[activeImage].height}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square bg-muted overflow-hidden border ${i === activeImage ? "border-ink" : "border-transparent"}`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Buybox */}
          <div className="md:sticky md:top-28 self-start">
            <p className="eyebrow mb-3">{product.productType}</p>
            <h1 className="font-serif text-4xl md:text-5xl leading-[1.05] tracking-tight text-ink">
              {product.title}
            </h1>
            <p className="mt-4 text-lg tabular-nums text-foreground">{formatMoney(displayPrice)}</p>

            <div className="hairline my-8" />

            <div
              className="text-foreground/85 leading-relaxed text-[15px]"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />

            {/* Colour swatches */}
            {colourOption && (
              <div className="mt-8">
                <p className="eyebrow mb-4">
                  Colour —{" "}
                  <span className="text-foreground/70 normal-case tracking-normal">{colour}</span>
                </p>
                <div className="flex gap-3 flex-wrap">
                  {colourOption.values.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColour(c)}
                      aria-label={c}
                      title={c}
                      aria-pressed={colour === c}
                      className={`h-8 w-8 border-2 transition-all ${
                        colour === c
                          ? "border-ink ring-1 ring-offset-2 ring-offset-background ring-ink/40"
                          : "border-disabled/40 hover:border-foreground"
                      }`}
                      style={{ backgroundColor: swatch(c) }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size selector — minimal native select with Fit Notes / Size Guide row */}
            {sizeOption && (
              <div className="mt-8">
                <p className="eyebrow mb-4">Size</p>
                <div className="border-t border-b border-border">
                  <div className="grid grid-cols-2 items-stretch">
                    <div className="relative border-r border-border">
                      <select
                        value={size ?? ""}
                        onChange={(e) => setSize(e.target.value || null)}
                        aria-label="Select size"
                        className="w-full appearance-none bg-transparent py-5 pl-1 pr-10 text-sm text-foreground focus:outline-none cursor-pointer"
                      >
                        <option value="" disabled>
                          Select
                        </option>
                        {sizeOption.values.map((s) => {
                          const v = findVariant(product, { [colourKey]: colour, [sizeKey]: s });
                          const oos = v && !v.availableForSale;
                          return (
                            <option key={s} value={s} disabled={oos}>
                              {s}
                              {oos ? " — Sold out" : ""}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/60"
                        strokeWidth={1.4}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-6 py-5">
                      {product.metafields.fitNotes && (
                        <FitNotesDialog html={product.metafields.fitNotes} />
                      )}
                      <SizeGuideDialog product={product} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CTA — disabled grey by default, ink black once a size is chosen */}
            <button
              type="button"
              onClick={() => {
                if (!variant || ctaDisabled) return;
                addItem({
                  slug: product.handle,
                  variantId: variant.id,
                  name: product.title,
                  image: product.images[0].url,
                  size: size!,
                  colour,
                  price: Number(variant.price.amount),
                });
                setAdded(true);
                setTimeout(() => setAdded(false), 2400);
              }}
              disabled={ctaDisabled}
              className={[
                "mt-8 w-full py-5 text-[11px] uppercase tracking-[0.32em] transition-colors",
                ctaDisabled
                  ? "bg-disabled text-offwhite cursor-not-allowed"
                  : "bg-ink text-offwhite hover:bg-ink/90",
              ].join(" ")}
            >
              {ctaLabel}
            </button>

            {/* Trust assurance */}
            <p className="mt-6 text-xs text-muted-foreground leading-relaxed">
              An investment piece, made to be worn for years. Complimentary delivery within the
              United Kingdom. Considered returns within thirty days.
            </p>

            {/* Material Properties — always visible */}
            {(product.metafields.materialProps?.length ?? 0) > 0 && (
              <div className="mt-12 pt-8 border-t border-border">
                <p className="eyebrow mb-5">Material Properties</p>
                <ul className="space-y-5">
                  {product.metafields.materialProps!.map((p) => (
                    <li key={p.title}>
                      <p className="font-serif text-base text-ink">{p.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1">{p.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technical Notes — always visible */}
            {(product.metafields.techNotes?.length ?? 0) > 0 && (
              <div className="mt-10 pt-8 border-t border-border">
                <p className="eyebrow mb-5">Technical Notes</p>
                <dl className="divide-y divide-border border-t border-border">
                  {product.metafields.techNotes!.map((s) => (
                    <div key={s.label} className="grid grid-cols-3 py-3 gap-4">
                      <dt className="eyebrow !text-foreground/60">{s.label}</dt>
                      <dd className="col-span-2 text-foreground/90 text-sm">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PHILOSOPHY — The Blanq Standard */}
      <section className="bg-sand/40 py-24 md:py-32 mt-16">
        <div className="mx-auto max-w-[1480px] px-5 md:px-10">
          <div className="grid md:grid-cols-12 gap-10 mb-12">
            <p className="md:col-span-3 eyebrow">The BLANQ Standard</p>
            <h2 className="md:col-span-8 md:col-start-5 font-serif text-3xl md:text-5xl leading-[1.15] text-ink">
              An obsession with the material itself.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 max-w-5xl md:ml-[calc(25%_-_2.5rem)]">
            <div>
              <p className="text-foreground/85 leading-[1.8] text-[15px]">
                We do not use synthetic blends. The garments are drawn from a small set of natural
                fibres — Australian Merino at 17.9 microns, long-staple Pima cotton, Italian
                cashmere — selected on a single criterion: that the raw material itself can carry
                the design.
              </p>
            </div>
            <div>
              <p className="text-foreground/85 leading-[1.8] text-[15px]">
                Each material is traced from origin: a wool station in New South Wales, a spinning
                mill in Biella, a tailoring house in Naples. We work directly with the people who
                make. Global to global. No intermediaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CLIENT REVIEWS */}
      <ReviewsSection productId={product.id} />

      {/* RELATED PRODUCTS — sits just above the footer */}
      {related.length > 0 && (
        <section className="mx-auto max-w-[1480px] px-5 md:px-10 pb-20 md:pb-28">
          <div className="hairline mb-10" />
          <div className="flex items-end justify-between mb-8 md:mb-12 gap-6">
            <div>
              <p className="eyebrow mb-2">You may also consider</p>
              <h2 className="font-serif text-2xl md:text-3xl text-ink">Related pieces</h2>
            </div>
            <Link
              to="/"
              className="hidden md:inline-block link-underline text-[11px] uppercase tracking-[0.22em]"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-8 md:gap-y-16">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

// =====================================================================
// Fit Notes — rich text metafield rendered in a dialog
// =====================================================================

function FitNotesDialog({ html }: { html: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-[11px] uppercase tracking-[0.22em] text-foreground/70 link-underline"
        >
          Fit Notes
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-background border-border">
        <DialogHeader className="text-left">
          <DialogTitle className="font-serif text-2xl text-ink">Fit Notes</DialogTitle>
          <DialogDescription className="eyebrow !text-foreground/60">
            How this piece is intended to wear
          </DialogDescription>
        </DialogHeader>
        <div
          className="mt-4 text-foreground/85 leading-[1.8] text-[15px] [&_p]:mb-4 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_li]:mb-1 [&_a]:underline [&_a]:underline-offset-4"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </DialogContent>
    </Dialog>
  );
}

// =====================================================================
// Size Guide modal — fetched (in mock) from product.metafields.blanq.size_guide
// =====================================================================

function SizeGuideDialog({ product }: { product: ShopifyProduct }) {
  const rows = product.metafields.sizeGuide ?? [];
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-[11px] uppercase tracking-[0.22em] text-foreground/70 link-underline"
        >
          Size Guide
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl bg-background border-border">
        <DialogHeader className="text-left">
          <DialogTitle className="font-serif text-2xl text-ink">Size Guide</DialogTitle>
          <DialogDescription className="eyebrow !text-foreground/60">
            {product.title} — measurements taken flat, in centimetres
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 overflow-x-auto">
{rows && rows.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {Object.keys(rows[0]).map((col, index) => (
                    <th key={index} className="eyebrow !text-foreground/60 py-3 text-left uppercase">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.keys(rows[0]).map((col, colIndex) => (
                      <td 
                        key={colIndex} 
                        className={`py-3 ${colIndex === 0 ? "font-serif text-ink" : "tabular-nums"}`}
                      >
                        {/* O 'as any' abaixo é o que resolve o chilique do TypeScript */}
                        {(r as any)[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
          Garment measurements. For body measurements, allow 4–6 cm of ease across the chest.
        </p>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================================
// Reviews — UI only, prepared to fetch from Judge.me / Yotpo / Stamped
// =====================================================================

function ReviewsSection({ productId }: { productId: string }) {
  const [data, setData] = useState<ProductReviewsSummary | null>(null);
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    getProductReviews(productId)
      .then(setData)
      .catch(() => setData(null));
  }, [productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || !body.trim()) return;
    const updated = await addProductReview(productId, { author, rating, title, body });
    setData(updated);
    setAuthor("");
    setRating(0);
    setHover(0);
    setTitle("");
    setBody("");
    setShowForm(false);
  }

  if (!data) return null;
  const visible = open ? data.reviews : data.reviews.slice(0, 2);
  const hasReviews = data.count > 0;

  return (
    <section className="mx-auto max-w-[1480px] px-5 md:px-10 py-20 md:py-32">
      <div className="grid md:grid-cols-12 gap-10">
        <div className="md:col-span-4">
          <p className="eyebrow mb-4">Client Notes</p>
          {hasReviews ? (
            <>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight text-ink">
                {data.average.toFixed(1)} <span className="text-foreground/40">/ 5</span>
              </h2>
              <div className="flex items-center gap-2 mt-3">
                <Stars rating={data.average} />
                <span className="text-xs text-muted-foreground">
                  {data.count} {data.count === 1 ? "review" : "reviews"}
                </span>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-serif text-2xl md:text-3xl leading-tight text-ink">
                No reviews yet
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Be the first to share your impression of this piece.
              </p>
            </>
          )}
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="mt-6 inline-block text-[11px] uppercase tracking-[0.22em] link-underline"
          >
            {showForm ? "Close" : "Write a review"}
          </button>
        </div>

        <div className="md:col-span-7 md:col-start-6 space-y-8">
          {showForm && (
            <form onSubmit={submit} className="border border-border p-6 md:p-8 space-y-5">
              <div>
                <label className="eyebrow !text-foreground/60 mb-2 block">Your rating</label>
                <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                  {Array.from({ length: 5 }).map((_, i) => {
                    const v = i + 1;
                    const active = (hover || rating) >= v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setRating(v)}
                        onMouseEnter={() => setHover(v)}
                        aria-label={`${v} star${v > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${active ? "fill-ink text-ink" : "text-disabled"}`}
                          strokeWidth={1}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your name"
                  className="bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
                />
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="A short title"
                  className="bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
                />
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share your impressions of the fit, fabric and finish."
                rows={4}
                required
                className="w-full bg-transparent border border-border focus:border-foreground outline-none p-3 text-sm leading-relaxed resize-none"
              />
              <button
                type="submit"
                disabled={!rating || !body.trim()}
                className="px-6 py-3 bg-ink text-offwhite text-[11px] uppercase tracking-[0.28em] disabled:bg-disabled disabled:cursor-not-allowed"
              >
                Submit review
              </button>
            </form>
          )}

          {hasReviews && (
            <ul className="divide-y divide-border border-t border-b border-border">
              {visible.map((r) => (
                <li key={r.id} className="py-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
                    <p className="font-serif text-lg text-ink">{r.title || "Untitled"}</p>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="text-foreground/85 leading-relaxed text-[15px]">{r.body}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {r.author}
                    {r.verified && <span className="ml-2 text-foreground/60">— Verified</span>}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {data.reviews.length > 2 && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-foreground link-underline"
            >
              {open ? "Show less" : `Read all ${data.count} notes`}
              <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < full ? "fill-ink text-ink" : "text-disabled"}`}
          strokeWidth={1}
        />
      ))}
    </span>
  );
}

// Curated colour map for fashion-specific names. Keys are normalised (lowercase, trimmed).
const COLOUR_MAP: Record<string, string> = {
  // Neutrals / whites
  white: "#ffffff",
  "off-white": "#f3efe6",
  offwhite: "#f3efe6",
  ivory: "#f5f0e1",
  cream: "#f1e9d2",
  bone: "#e8e0d0",
  ecru: "#dcd3bc",
  natural: "#e8dfc8",
  chalk: "#f2eee5",
  // Tans / beiges
  sand: "#cdbfa5",
  beige: "#d4c2a3",
  stone: "#bfb3a0",
  taupe: "#a89a86",
  camel: "#c19a6b",
  tan: "#c39c70",
  "desert tan": "#c8a888",
  khaki: "#b6a474",
  mocha: "#7a5a44",
  latte: "#b69f86",
  caramel: "#a87445",
  cognac: "#8b4f2a",
  // Browns
  brown: "#5a3d24",
  chocolate: "#3d2616",
  espresso: "#3a2a22",
  walnut: "#5b4636",
  rust: "#a8482a",
  terracotta: "#b86145",
  // Greys
  grey: "#8a8a8a",
  gray: "#8a8a8a",
  "light grey": "#bfbfbf",
  "dark grey": "#4a4a4a",
  slate: "#5e6770",
  graphite: "#383b3f",
  charcoal: "#3a3a3c",
  ash: "#9a9a98",
  // Blacks
  black: "#0e0e10",
  ink: "#0e0e10",
  jet: "#0a0a0a",
  // Blues
  navy: "#1c2541",
  "deep navy": "#1f2740",
  midnight: "#10172a",
  blue: "#2b4a8b",
  sky: "#9ec3e0",
  denim: "#4a6a91",
  cobalt: "#1e3a8a",
  // Greens
  green: "#3a6b3f",
  olive: "#6b6a3a",
  forest: "#2a4a2e",
  sage: "#a3b39a",
  moss: "#5a6a3d",
  "khaki green": "#7a7a4a",
  // Reds / pinks
  red: "#a02a2a",
  burgundy: "#5a1a26",
  wine: "#5e1f2a",
  pink: "#e7b6b6",
  blush: "#e8c8c0",
  rose: "#c97a7a",
  // Yellows / oranges
  yellow: "#e3c34a",
  mustard: "#b8902a",
  ochre: "#bf8a2a",
  orange: "#d96a2c",
  // Purples
  purple: "#5a3a7a",
  lavender: "#bda8c9",
  plum: "#5a2a4a",
};

function swatch(name: string): string {
  const key = name.trim().toLowerCase();
  if (COLOUR_MAP[key]) return COLOUR_MAP[key];
  // Try CSS named-color resolution in the browser (e.g. "khaki", "navy", "salmon").
  if (typeof document !== "undefined") {
    const el = document.createElement("div");
    el.style.color = "";
    el.style.color = key;
    if (el.style.color !== "") return key;
  }
  // Heuristic: match a known token contained within the name (e.g. "Heather Grey" → grey).
  for (const token of Object.keys(COLOUR_MAP)) {
    if (key.includes(token)) return COLOUR_MAP[token];
  }
  return "#cccccc";
}
