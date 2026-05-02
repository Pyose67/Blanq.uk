import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Palette, Tag, Star } from "lucide-react";
import { formatMoney, getProductReviews, type ShopifyProduct } from "@/lib/shopify";

export function ProductCard({ product }: { product: ShopifyProduct }) {
  const image = product.images?.[0];
  const colourOption = product.options?.find((o) => /colou?r/i.test(o.name));
  const [avg, setAvg] = useState<{ average: number; count: number } | null>(null);

  useEffect(() => {
    getProductReviews(product.id).then(({ average, count }) => setAvg({ average, count }));
  }, [product.id]);

  return (
    <Link to="/product/$slug" params={{ slug: product.handle }} className="group block">
      <div className="relative overflow-hidden bg-muted aspect-[4/5]">
        {image && (
          <img
            src={image.url}
            alt={image.altText ?? product.title}
            loading="lazy"
            width={image.width}
            height={image.height}
            className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-700 bg-background/90 backdrop-blur-sm py-3 px-4 text-[11px] uppercase tracking-[0.18em] text-foreground/80 flex justify-between items-center">
          <span className="inline-flex items-center gap-1.5">
            <Tag className="h-3 w-3" strokeWidth={1.4} />
            {product.productType || product.vendor}
          </span>
          {colourOption && (
            <span className="inline-flex items-center gap-1.5">
              <Palette className="h-3 w-3" strokeWidth={1.4} />
              {colourOption.values.length} {colourOption.values.length === 1 ? "colour" : "colours"}
            </span>
          )}
        </div>
      </div>
      <div className="mt-5 flex justify-between items-start gap-4">
        <div className="min-w-0">
          <p className="eyebrow mb-1 inline-flex items-center gap-1.5">
            <Tag className="h-3 w-3" strokeWidth={1.4} />
            {product.productType}
          </p>
          <h3 className="font-serif text-lg text-foreground truncate">{product.title}</h3>
          {avg && avg.count > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < Math.round(avg.average) ? "fill-foreground text-foreground" : "text-muted-foreground/40"}`}
                    strokeWidth={1}
                  />
                ))}
              </span>
              <span className="tabular-nums">({avg.count})</span>
            </div>
          )}
        </div>
        <p className="text-sm text-foreground/80 tabular-nums shrink-0">
          {formatMoney(product.priceRange.minVariantPrice)}
        </p>
      </div>
    </Link>
  );
}
