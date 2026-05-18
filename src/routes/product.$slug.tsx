import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Star, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { useProductViewAnalytics } from "@/components/site/ShopifyAnalytics";

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
  useProductViewAnalytics(
    product.id,
    product.title,
    product.priceRange.minVariantPrice.amount,
    product.productType,
  );

  const colourOption = product.options.find((o) => /colou?r/i.test(o.name));
  const sizeOption = product.options.find((o) => /size/i.test(o.name));
  const colourKey = colourOption?.name ?? "Colour";
  const sizeKey = sizeOption?.name ?? "Size";

  const [colour, setColour] = useState<string>(colourOption?.values[0] ?? "");
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [reviewsSummary, setReviewsSummary] = useState<ProductReviewsSummary | undefined>();
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [ctaVisible, setCtaVisible] = useState(true);

  useEffect(() => {
    getProductReviews(product.id).then(setReviewsSummary).catch(() => {});
  }, [product.id]);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setCtaVisible(true);
      } else {
        // só esconde (mostra sticky) se o botão saiu pelo topo
        setCtaVisible(entry.boundingClientRect.top > 0);
      }
    }, { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    setCarouselIndex(0);
    setLightboxIndex(null);
    mobileScrollRef.current?.scrollTo({ left: 0, behavior: "instant" });
  }, [colour]);

  const filteredImages = useMemo(() => {
    if (!colour) return product.images;
    const filtered = product.images.filter((img) => {
      const alt = (img.altText ?? "").trim();
      if (!alt) return true;
      const parts = alt.includes(",") ? alt.split(",").map((p) => p.trim()) : [alt];
      return parts.some((part) => part.toLowerCase().includes(colour.toLowerCase()));
    });
    return filtered.length > 0 ? filtered : product.images;
  }, [product.images, colour]);

  function scrollToMobileImage(index: number) {
    const el = mobileScrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * index, behavior: "smooth" });
    setCarouselIndex(index);
  }

  function handleMobileScroll() {
    const el = mobileScrollRef.current;
    if (!el) return;
    setCarouselIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

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

  function handleAddToCart() {
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
  }

  return (
    <>
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-[1480px] px-5 md:px-10 pt-6 md:pt-8 fade-in-up">
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
          <div className="fade-in-up [animation-delay:100ms]">
            {/* Mobile — CSS scroll-snap carousel */}
            <div className="md:hidden w-full overflow-hidden">
              <div className="aspect-[4/5]">
                <div
                  ref={mobileScrollRef}
                  onScroll={handleMobileScroll}
                  className="flex h-full w-full overflow-x-scroll snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {filteredImages.map((img, i) => (
                    <div key={img.url} className="flex-none w-full h-full snap-start shrink-0 bg-muted" onClick={() => setLightboxIndex(i)}>
                      <img
                        src={img.url}
                        alt={img.altText ?? product.title}
                        width={img.width}
                        height={img.height}
                        className="h-full w-full object-cover cursor-zoom-in"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {filteredImages.map((img, i) => (
                  <button
                    key={img.url}
                    type="button"
                    onClick={() => scrollToMobileImage(i)}
                    className={`flex-none w-[calc((100%-48px)/5.3)] aspect-square bg-muted overflow-hidden border transition-colors ${i === carouselIndex ? "border-ink" : "border-transparent"}`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop — stacked full-size gallery */}
            <div className="hidden md:flex flex-col gap-3">
              {filteredImages.map((img, i) => (
                <div
                  key={img.url}
                  className="aspect-[4/5] bg-muted overflow-hidden cursor-zoom-in"
                  onClick={() => setLightboxIndex(i)}
                >
                  <img
                    src={img.url}
                    alt={img.altText ?? product.title}
                    width={img.width}
                    height={img.height}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Buybox */}
          <div className="md:sticky md:top-28 self-start fade-in-up [animation-delay:220ms]">
            <p className="eyebrow mb-3">{product.productType}</p>
            <h1 className="font-serif text-4xl md:text-5xl leading-[1.05] tracking-tight text-ink">
              {product.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <p className="text-lg tabular-nums text-foreground">{formatMoney(displayPrice)}</p>
              {reviewsSummary && reviewsSummary.count > 0 && (
                <a
                  href="#reviews"
                  className="flex items-center gap-1.5 group"
                  aria-label="Go to reviews"
                >
                  <Stars rating={reviewsSummary.average} />
                  <span className="text-xs text-muted-foreground tabular-nums group-hover:text-foreground transition-colors">
                    {reviewsSummary.average.toFixed(1)} · {reviewsSummary.count} {reviewsSummary.count === 1 ? "review" : "reviews"}
                  </span>
                </a>
              )}
            </div>

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
              ref={ctaRef}
              type="button"
              onClick={handleAddToCart}
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

            {/* Collapsible sections */}
            {((product.metafields.materialProps?.length ?? 0) > 0 || (product.metafields.techNotes?.length ?? 0) > 0 || (product.metafields.careInstructions?.length ?? 0) > 0) && (
              <div className="mt-8 border-t border-border">
                <Accordion type="multiple">
                  {(product.metafields.materialProps?.length ?? 0) > 0 && (
                    <AccordionItem value="details" className="border-none border-b border-border">
                      <AccordionTrigger className="eyebrow !text-foreground py-5 hover:no-underline">
                        Product Details
                      </AccordionTrigger>
                      <AccordionContent className="pb-6">
                        <ul className="space-y-5">
                          {product.metafields.materialProps!.map((p) => (
                            <li key={p.title}>
                              <p className="font-serif text-base text-ink">{p.title}</p>
                              <p className="text-sm text-muted-foreground leading-relaxed mt-1">{p.body}</p>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  {(product.metafields.techNotes?.length ?? 0) > 0 && (
                    <AccordionItem value="tech" className="border-none border-b border-border">
                      <AccordionTrigger className="eyebrow !text-foreground py-5 hover:no-underline">
                        Technical Notes
                      </AccordionTrigger>
                      <AccordionContent className="pb-6">
                        <dl className="divide-y divide-border border-t border-border">
                          {product.metafields.techNotes!.map((s) => (
                            <div key={s.label} className="grid grid-cols-3 py-3 gap-4">
                              <dt className="eyebrow !text-foreground/60">{s.label}</dt>
                              <dd className="col-span-2 text-foreground/90 text-sm">{s.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  {(product.metafields.careInstructions?.length ?? 0) > 0 && (
                    <AccordionItem value="care" className="border-none">
                      <AccordionTrigger className="eyebrow !text-foreground py-5 hover:no-underline">
                        Care Instructions
                      </AccordionTrigger>
                      <AccordionContent className="pb-6">
                        <ul className="divide-y divide-border border-t border-border">
                          {product.metafields.careInstructions!.map((item, i) => (
                            <li key={i} className="py-3 text-sm text-foreground/90">{item}</li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CLIENT REVIEWS */}
      <ReviewsSection productId={product.id} />

      {/* RELATED PRODUCTS — sits just above the footer */}
      {related.length > 0 && (
        <section className="mx-auto max-w-[1480px] px-5 md:px-10 pb-20 md:pb-28">
          <div className="hairline mb-10" />
          <div className="flex items-end justify-between mb-8 md:mb-12 gap-6 reveal">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-8 md:gap-y-16 stagger-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={filteredImages.map((img) => ({ url: img.url, alt: img.altText ?? product.title }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Sticky CTA — only after the main button has been seen and scrolled away */}
      <div
        className={[
          "fixed bottom-0 inset-x-0 z-40 transition-transform duration-300 ease-in-out",
          !ctaVisible ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
      >
        <div className="bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
          <div className="mx-auto max-w-[1480px] px-5 md:px-10 py-3">
            {/* Desktop */}
            <div className="hidden md:flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-serif text-base text-ink truncate">{product.title}</p>
                <p className="text-xs tabular-nums text-foreground/70 mt-0.5">{formatMoney(displayPrice)}</p>
              </div>
              {sizeOption && (
                <div className="relative">
                  <select
                    aria-label="Select size"
                    value={size ?? ""}
                    onChange={(e) => setSize(e.target.value || null)}
                    className="appearance-none bg-transparent border border-border py-2.5 pl-3 pr-8 text-[11px] uppercase tracking-[0.18em] focus:outline-none focus:border-foreground cursor-pointer"
                  >
                    <option value="" disabled>Size</option>
                    {sizeOption.values.map((s) => {
                      const v = findVariant(product, { [colourKey]: colour, [sizeKey]: s });
                      return (
                        <option key={s} value={s} disabled={!!(v && !v.availableForSale)}>
                          {s}{v && !v.availableForSale ? " — Sold out" : ""}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground/60" strokeWidth={1.4} />
                </div>
              )}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={ctaDisabled}
                className={[
                  "shrink-0 px-8 py-3 text-[11px] uppercase tracking-[0.28em] transition-colors",
                  ctaDisabled ? "bg-disabled text-offwhite cursor-not-allowed" : "bg-ink text-offwhite hover:bg-ink/90",
                ].join(" ")}
              >
                {ctaLabel}
              </button>
            </div>
            {/* Mobile */}
            <div className="flex md:hidden items-center gap-2">
              {sizeOption && (
                <div className="relative flex-1 min-w-0">
                  <select
                    aria-label="Select size"
                    value={size ?? ""}
                    onChange={(e) => setSize(e.target.value || null)}
                    className="w-full appearance-none bg-transparent border border-border py-3 pl-3 pr-7 text-[11px] uppercase tracking-[0.14em] focus:outline-none focus:border-foreground cursor-pointer"
                  >
                    <option value="" disabled>Select size</option>
                    {sizeOption.values.map((s) => {
                      const v = findVariant(product, { [colourKey]: colour, [sizeKey]: s });
                      return (
                        <option key={s} value={s} disabled={!!(v && !v.availableForSale)}>
                          {s}{v && !v.availableForSale ? " — Sold out" : ""}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground/60" strokeWidth={1.4} />
                </div>
              )}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={ctaDisabled}
                className={[
                  "shrink-0 px-5 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors",
                  ctaDisabled ? "bg-disabled text-offwhite cursor-not-allowed" : "bg-ink text-offwhite hover:bg-ink/90",
                ].join(" ")}
              >
                {added ? "Added" : "Add to bag"}
              </button>
            </div>
          </div>
        </div>
      </div>
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
  const [data, setData] = useState<ProductReviewsSummary | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [reviewLightbox, setReviewLightbox] = useState<{ images: { url: string; alt: string }[]; index: number } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [author, setAuthor] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  useEffect(() => {
    let cancelled = false;
    setData(undefined);
    getProductReviews(productId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData({ average: 0, count: 0, reviews: [], distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || !body.trim() || !email.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    const result = await addProductReview(productId, { author, email, rating, title, body });
    setSubmitting(false);
    if (result.ok) {
      setSubmitted(true);
      setAuthor(""); setEmail(""); setRating(0); setHover(0); setTitle(""); setBody("");
      setShowForm(false);
    } else {
      setSubmitError(result.error ?? "Something went wrong. Please try again.");
    }
  }

  if (data === undefined) {
    return (
      <section className="mx-auto max-w-[1480px] px-5 md:px-10 py-20 md:py-32">
        <div className="h-4 w-28 bg-muted animate-pulse rounded mb-4" />
        <div className="h-3 w-20 bg-muted animate-pulse rounded" />
      </section>
    );
  }
  const visible = open ? data.reviews : data.reviews.slice(0, 2);
  const hasReviews = data.count > 0;

  return (
    <>
    <section id="reviews" className="mx-auto max-w-[1480px] px-5 md:px-10 py-20 md:py-32">
      <div className="grid md:grid-cols-12 gap-10">
        <div className="md:col-span-4 md:sticky md:top-28 md:self-start">
          <p className="eyebrow mb-4">Client Notes</p>
          {hasReviews ? (
            <>
              <h2 className="font-serif text-3xl md:text-4xl leading-tight text-ink">
                {data.average.toFixed(1)} <span className="text-foreground/55">/ 5</span>
              </h2>
              <div className="flex items-center gap-2 mt-3">
                <Stars rating={data.average} />
                <span className="text-xs text-muted-foreground">
                  {data.count} {data.count === 1 ? "review" : "reviews"}
                </span>
              </div>
              <div className="mt-6 space-y-2">
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const n = data.distribution[star];
                  const pct = data.reviews.length > 0 ? (n / data.reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs tabular-nums text-muted-foreground w-3 text-right">{star}</span>
                      <Star className="h-2.5 w-2.5 fill-ink text-ink flex-none" strokeWidth={0} />
                      <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-ink rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground w-5 text-right">{n}</span>
                    </div>
                  );
                })}
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
          {submitted ? (
            <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
              Thank you. Your review has been submitted and is awaiting approval.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm((s) => !s)}
              className="mt-6 inline-block text-[11px] uppercase tracking-[0.22em] link-underline"
            >
              {showForm ? "Close" : "Write a review"}
            </button>
          )}
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
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email — kept private, never shared"
                  className="bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
                />
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A short title (optional)"
                className="w-full bg-transparent border-b border-border focus:border-foreground outline-none py-2 text-sm"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share your impressions of the fit, fabric and finish."
                rows={4}
                required
                className="w-full bg-transparent border border-border focus:border-foreground outline-none p-3 text-sm leading-relaxed resize-none"
              />
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={!rating || !body.trim() || !email.trim() || submitting}
                  className="px-6 py-3 bg-ink text-offwhite text-[11px] uppercase tracking-[0.28em] disabled:bg-disabled disabled:cursor-not-allowed self-start"
                >
                  {submitting ? "Submitting…" : "Submit review"}
                </button>
                {submitError && (
                  <p className="text-sm text-red-600 leading-relaxed">{submitError}</p>
                )}
              </div>
            </form>
          )}

          {hasReviews && (
            <ul className="divide-y divide-border border-t border-b border-border">
              {visible.map((r) => (
                <li key={r.id} className="py-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
                    <p className="font-serif text-lg text-ink">{r.title || r.author}</p>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="text-foreground/85 leading-relaxed text-[15px]">{r.body}</p>
                  {r.photos.length > 0 && (
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {r.photos.map((src, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setReviewLightbox({
                            images: r.photos.map((s, j) => ({ url: s, alt: `Review photo ${j + 1}` })),
                            index: idx,
                          })}
                          className="block w-16 h-16 md:w-20 md:h-20 bg-muted overflow-hidden flex-none cursor-zoom-in"
                        >
                          <img
                            src={src}
                            alt={`Review photo ${idx + 1}`}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  {(r.title || r.verified) && (
                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {r.title && r.author}
                      {r.verified && <span className="ml-2 text-foreground/60">— Verified</span>}
                    </p>
                  )}
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

    {reviewLightbox && (
      <ImageLightbox
        images={reviewLightbox.images}
        initialIndex={reviewLightbox.index}
        onClose={() => setReviewLightbox(null)}
      />
    )}
  </>
  );
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span role="img" className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
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

// =====================================================================
// Image Lightbox — pinch-zoom (mobile) + click-zoom + drag (desktop)
// =====================================================================

type LightboxImage = { url: string; alt: string };

function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: LightboxImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);
  const [scale, setScaleState] = useState(1);
  const [offset, setOffsetState] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });

  function setScale(v: number) { scaleRef.current = v; setScaleState(v); }
  function setOffset(v: { x: number; y: number }) { offsetRef.current = v; setOffsetState(v); }
  function resetZoom() { setScale(1); setOffset({ x: 0, y: 0 }); }
  function go(dir: number) {
    setIdx((i) => (i + dir + images.length) % images.length);
    setScale(1); setOffset({ x: 0, y: 0 });
  }

  // keyboard
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // lock scroll + non-passive touchmove
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = containerRef.current;
    const prevent = (e: TouchEvent) => e.preventDefault();
    el?.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      document.body.style.overflow = prev;
      el?.removeEventListener("touchmove", prevent);
    };
  }, []);

  // ── touch state refs ──────────────────────────────────────────────
  const touch = useRef({ pinching: false, lastDist: 0, lastScale: 1, startOx: 0, startOy: 0, dragging: false, startX: 0, startY: 0, swipeX: 0 });

  function onTouchStart(e: React.TouchEvent) {
    const t = touch.current;
    if (e.touches.length === 2) {
      t.pinching = true; t.dragging = false;
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      t.lastDist = Math.hypot(dx, dy);
      t.lastScale = scaleRef.current;
      t.startOx = offsetRef.current.x; t.startOy = offsetRef.current.y;
    } else if (e.touches.length === 1) {
      t.pinching = false;
      t.swipeX = e.touches[0].clientX;
      if (scaleRef.current > 1) {
        t.dragging = true;
        t.startX = e.touches[0].clientX; t.startY = e.touches[0].clientY;
        t.startOx = offsetRef.current.x; t.startOy = offsetRef.current.y;
      } else { t.dragging = false; }
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    const t = touch.current;
    if (e.touches.length === 2 && t.pinching) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const newScale = Math.min(4, Math.max(1, t.lastScale * (Math.hypot(dx, dy) / t.lastDist)));
      setScale(newScale);
      if (newScale <= 1) setOffset({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && t.dragging) {
      setOffset({ x: t.startOx + e.touches[0].clientX - t.startX, y: t.startOy + e.touches[0].clientY - t.startY });
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    const t = touch.current;
    if (scaleRef.current < 1.05) resetZoom();
    if (!t.pinching && e.changedTouches.length === 1 && scaleRef.current <= 1) {
      const delta = e.changedTouches[0].clientX - t.swipeX;
      if (Math.abs(delta) > 55) go(delta < 0 ? 1 : -1);
    }
    t.pinching = false; t.dragging = false;
  }

  // ── mouse state refs ──────────────────────────────────────────────
  const mouse = useRef({ down: false, moved: false, startX: 0, startY: 0, startOx: 0, startOy: 0 });

  function onMouseDown(e: React.MouseEvent) {
    const m = mouse.current;
    m.down = true; m.moved = false;
    m.startX = e.clientX; m.startY = e.clientY;
    m.startOx = offsetRef.current.x; m.startOy = offsetRef.current.y;
  }

  function onMouseMove(e: React.MouseEvent) {
    const m = mouse.current;
    if (!m.down) return;
    if (Math.abs(e.clientX - m.startX) > 4 || Math.abs(e.clientY - m.startY) > 4) {
      m.moved = true;
      if (scaleRef.current > 1) setOffset({ x: m.startOx + e.clientX - m.startX, y: m.startOy + e.clientY - m.startY });
    }
  }

  function onMouseUp(e: React.MouseEvent) {
    const m = mouse.current;
    m.down = false;
    if (!m.moved) {
      if (scaleRef.current > 1) {
        resetZoom();
      } else {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setScale(2.5);
        setOffset({ x: -(e.clientX - rect.left - rect.width / 2), y: -(e.clientY - rect.top - rect.height / 2) });
      }
    }
  }

  const img = images[idx];
  const grabbed = mouse.current.down && mouse.current.moved;

  return (
    <div className="fixed inset-0 z-50 bg-black/92" onClick={onClose}>
      <button type="button" onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors">
        <X className="h-6 w-6" strokeWidth={1.2} />
      </button>

      {images.length > 1 && (
        <p className="absolute top-5 left-1/2 -translate-x-1/2 z-10 text-[11px] uppercase tracking-[0.22em] text-white/40 select-none pointer-events-none">
          {idx + 1} / {images.length}
        </p>
      )}

      {images.length > 1 && <>
        <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
          <ChevronLeft className="h-7 w-7" strokeWidth={1.2} />
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
          <ChevronRight className="h-7 w-7" strokeWidth={1.2} />
        </button>
      </>}

      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden select-none"
        style={{ cursor: scale > 1 ? (grabbed ? "grabbing" : "grab") : "zoom-in" }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { mouse.current.down = false; }}
      >
        <img
          key={img.url}
          src={img.url}
          alt={img.alt}
          draggable={false}
          className="max-w-full max-h-full object-contain pointer-events-none"
          style={{
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
            transition: scale === 1 ? "transform 0.25s ease" : "none",
          }}
        />
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, i) => (
            <button key={i} type="button"
              onClick={(e) => { e.stopPropagation(); setIdx(i); resetZoom(); }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/35"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Curated colour map for fashion-specific names. Keys are normalised (lowercase, trimmed).
const COLOUR_MAP: Record<string, string> = {
  // Brancos & Cremes
  "pure white": "#ffffff",
  "chalk": "#f5f3ee",
  "ivory": "#f0e9d8",
  "bone": "#e8dfc8",
  "cream": "#efe6d0",
  "vanilla": "#ecdfc4",
  "champagne": "#ddc9a4",
  "pearl": "#e6dfd0",
  "ecru": "#d6c9ad",
  "linen": "#dccfb6",
  // Beiges & Tans
  "oatmeal": "#d8c7a3",
  "wheat": "#d4be8e",
  "sand": "#cbb892",
  "biscuit": "#c9aa7d",
  "beige": "#c8b48a",
  "latte": "#b69e7c",
  "stone": "#b3a48a",
  "mushroom": "#a5947d",
  "taupe": "#9a8770",
  "putty": "#bcae93",
  // Camel & Cognac
  "camel": "#b8895c",
  "desert tan": "#a87f56",
  "sahara": "#a47148",
  "tobacco": "#8c6a3e",
  "cognac": "#8b5a2b",
  "caramel": "#a86c3a",
  "hazelnut": "#7e5836",
  "honey": "#a87832",
  // Browns
  "chestnut": "#6e4528",
  "walnut": "#5a3e29",
  "mahogany": "#5a2f1f",
  "coffee": "#4a3424",
  "chocolate": "#3e2818",
  "cocoa": "#3a2418",
  "espresso": "#2a1c14",
  // Cinzas
  "mist": "#d4d2cf",
  "pearl grey": "#bcb9b3",
  "pebble": "#a8a59f",
  "ash": "#9b9994",
  "smoke": "#888884",
  "pewter": "#74726e",
  "slate": "#5c5d5e",
  "graphite": "#3d3e40",
  "charcoal": "#2a2a2c",
  "heather grey": "#9c9a96",
  // Pretos
  "black": "#0e0e10",
  "jet": "#000000",
  "onyx": "#1a1a1c",
  // Azuis
  "powder blue": "#c7d6df",
  "sky": "#a8c5d8",
  "denim": "#5b7a99",
  "french blue": "#3f6090",
  "cobalt": "#1e3a8a",
  "petrol": "#1f4858",
  "navy": "#1c2541",
  "midnight": "#10172a",
  "indigo": "#283566",
  "slate blue": "#4e6076",
  // Verdes
  "sage": "#a3b39a",
  "sea green": "#6e8c7e",
  "olive": "#6b6a3a",
  "moss": "#5a6a3d",
  "khaki green": "#7a7a4a",
  "hunter": "#2e4a36",
  "forest": "#2a4a2e",
  "bottle green": "#1a4a3a",
  // Vermelhos & Rosas
  "blush": "#e8c8c0",
  "dusty rose": "#cfa3a0",
  "brick": "#a44a36",
  "terracotta": "#b86145",
  "cherry": "#8a1f2a",
  "wine": "#6a2030",
  "bordeaux": "#5a1a26",
  "burgundy": "#4a1a22",
  "oxblood": "#3e1820",
  // Amarelos & Laranjas
  "butter": "#f0d68a",
  "mustard": "#b8902a",
  "ochre": "#bf8a2a",
  "amber": "#c8852a",
  "rust": "#a8482a",
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