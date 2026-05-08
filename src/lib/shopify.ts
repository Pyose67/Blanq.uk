/**
 * Shopify Storefront API data layer — BLANQ
 *
 * Live wiring against the connected Shopify store via the Storefront API
 * (2025-07). Keeps the same exported types/helpers used by the UI so the
 * existing presentation layer is unchanged.
 */

export const SHOPIFY_API_VERSION = "2025-07";
export const SHOPIFY_STORE_PERMANENT_DOMAIN = "mn510i-qb.myshopify.com";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const SHOPIFY_STOREFRONT_TOKEN = "b75a0575696cb015c78e584d83e453d4";

// =====================================================================
// Types — mirror Shopify Storefront API shape
// =====================================================================

export interface ShopifyImage {
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyMoney;
  selectedOptions: { name: string; value: string }[];
}

export interface ShopifyProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface SizeGuideRow {
  [key: string]: string;
}

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  images: ShopifyImage[];
  options: ShopifyProductOption[];
  variants: ShopifyVariant[];
  priceRange: { minVariantPrice: ShopifyMoney };
  metafields: {
    sizeGuide: SizeGuideRow[] | null;
    materialProps: { title: string; body: string }[] | null;
    techNotes: { label: string; value: string }[] | null;
    fitNotes: string | null; // pre-rendered HTML from rich_text metafield
  };
}

export interface ShopPolicy {
  id: string;
  title: string;
  handle: string;
  url: string;
}

export interface ShopPolicies {
  privacyPolicy: ShopPolicy | null;
  termsOfService: ShopPolicy | null;
  shippingPolicy: ShopPolicy | null;
  refundPolicy: ShopPolicy | null;
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  verified: boolean;
}

export interface ProductReviewsSummary {
  average: number;
  count: number;
  reviews: ProductReview[];
}

// =====================================================================
// Helpers
// =====================================================================

export function formatMoney(money: ShopifyMoney): string {
  const amount = Number(money.amount);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: money.currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function findVariant(
  product: ShopifyProduct,
  selected: Record<string, string>,
): ShopifyVariant | undefined {
  return product.variants.find((v) => v.selectedOptions.every((o) => selected[o.name] === o.value));
}

// =====================================================================
// Storefront API request helper
// =====================================================================

export async function storefrontApiRequest<T = any>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<{ data?: T; errors?: { message: string }[] } | null> {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 402) {
    if (typeof console !== "undefined") {
      console.error("[BLANQ] Shopify 402 — store needs an active billing plan.");
    }
    return null;
  }

  if (!response.ok) {
    throw new Error(`Shopify HTTP ${response.status}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(`Shopify GraphQL: ${json.errors.map((e: any) => e.message).join(", ")}`);
  }
  return json;
}

// =====================================================================
// GraphQL
// =====================================================================

const PRODUCT_FIELDS = `
  id
  handle
  title
  descriptionHtml
  vendor
  productType
  priceRange { minVariantPrice { amount currencyCode } }
  images(first: 10) { edges { node { url altText width height } } }
  options { id name values }
  variants(first: 100) {
    edges {
      node {
        id
        title
        availableForSale
        price { amount currencyCode }
        selectedOptions { name value }
      }
    }
  }
sizeGuide: metafield(namespace: "custom", key: "size_guide") { value type }
  materialProps: metafield(namespace: "custom", key: "propriedades_do_material") { value type }
  techNotes: metafield(namespace: "custom", key: "tech_notes") { value type }
  fitNotes: metafield(namespace: "custom", key: "fit_notes") { value type }
`;

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges { node { ${PRODUCT_FIELDS} } }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) { ${PRODUCT_FIELDS} }
  }
`;

const POLICIES_QUERY = `
  query Policies {
    shop {
      privacyPolicy  { id title handle url }
      termsOfService { id title handle url }
      shippingPolicy { id title handle url }
      refundPolicy   { id title handle url }
    }
  }
`;

// =====================================================================
// Normalisers
// =====================================================================

function parseJsonMetafield<T>(mf: { value: string } | null | undefined): T | null {
  if (!mf?.value) return null;
  try {
    return JSON.parse(mf.value) as T;
  } catch {
    return null;
  }
}

function normalizeProduct(node: any): ShopifyProduct {
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    descriptionHtml: node.descriptionHtml ?? "",
    vendor: node.vendor ?? "",
    productType: node.productType ?? "",
    priceRange: node.priceRange,
    images: (node.images?.edges ?? []).map((e: any) => ({
      url: e.node.url,
      altText: e.node.altText,
      width: e.node.width ?? 1280,
      height: e.node.height ?? 1600,
    })),
    options: (node.options ?? []).map((o: any) => ({
      id: o.id,
      name: o.name,
      values: o.values,
    })),
    variants: (node.variants?.edges ?? []).map((e: any) => ({
      id: e.node.id,
      title: e.node.title,
      availableForSale: e.node.availableForSale,
      price: e.node.price,
      selectedOptions: e.node.selectedOptions ?? [],
    })),
    metafields: {
      sizeGuide: parseJsonMetafield<SizeGuideRow[]>(node.sizeGuide),
      materialProps: parseJsonMetafield<{ title: string; body: string }[]>(node.materialProps),
      techNotes: parseJsonMetafield<{ label: string; value: string }[]>(node.techNotes),
      fitNotes: parseRichTextMetafield(node.fitNotes),
    },
  };
}

// Shopify's `rich_text_field` returns a JSON document. Convert to safe HTML.
function parseRichTextMetafield(
  mf: { value: string; type?: string } | null | undefined,
): string | null {
  if (!mf?.value) return null;
  const raw = mf.value.trim();
  // Already HTML (some editors store HTML in multi_line_text_field used as rich text)
  if (raw.startsWith("<")) return raw;
  try {
    const doc = JSON.parse(raw);
    return richTextNodeToHtml(doc);
  } catch {
    // Plain text fallback
    return `<p>${escapeHtml(raw)}</p>`;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function richTextNodeToHtml(node: any): string {
  if (!node) return "";
  if (Array.isArray(node)) return node.map(richTextNodeToHtml).join("");
  const children = Array.isArray(node.children)
    ? node.children.map(richTextNodeToHtml).join("")
    : "";
  switch (node.type) {
    case "root":
      return children;
    case "paragraph":
      return `<p>${children}</p>`;
    case "heading": {
      const lvl = Math.min(Math.max(Number(node.level) || 2, 1), 6);
      return `<h${lvl}>${children}</h${lvl}>`;
    }
    case "list": {
      const tag = node.listType === "ordered" ? "ol" : "ul";
      return `<${tag}>${children}</${tag}>`;
    }
    case "list-item":
      return `<li>${children}</li>`;
    case "link":
      return `<a href="${escapeHtml(node.url ?? "#")}" target="_blank" rel="noopener noreferrer">${children}</a>`;
    case "text": {
      let html = escapeHtml(node.value ?? "");
      if (node.bold) html = `<strong>${html}</strong>`;
      if (node.italic) html = `<em>${html}</em>`;
      return html;
    }
    default:
      return children;
  }
}

// =====================================================================
// Public API
// =====================================================================

export async function getAllProducts(first = 50, query?: string): Promise<ShopifyProduct[]> {
  const json = await storefrontApiRequest<{ products: { edges: { node: any }[] } }>(
    PRODUCTS_QUERY,
    { first, query: query ?? null },
  );
  const edges = json?.data?.products?.edges ?? [];
  return edges.map((e) => normalizeProduct(e.node));
}

export async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const json = await storefrontApiRequest<{ product: any | null }>(PRODUCT_BY_HANDLE_QUERY, {
    handle,
  });
  const node = json?.data?.product;
  return node ? normalizeProduct(node) : null;
}

export async function getShopPolicies(): Promise<ShopPolicies> {
  const json = await storefrontApiRequest<{ shop: ShopPolicies }>(POLICIES_QUERY);
  return (
    json?.data?.shop ?? {
      privacyPolicy: null,
      termsOfService: null,
      shippingPolicy: null,
      refundPolicy: null,
    }
  );
}

// =====================================================================
// Reviews — Judge.me Reviews API (public, GET-only)
// Docs: https://judge.me/api/docs
// =====================================================================

// Public Judge.me token — safe to expose in client code (read-only).
// Override with VITE_JUDGEME_PUBLIC_TOKEN at build time if needed.
export const JUDGEME_PUBLIC_TOKEN: string = 
  (import.meta as any).env?.VITE_JUDGEME_PUBLIC_TOKEN ?? "WIJ613R7E9nEF_-Rr8nGHA6LBRQ";
export const JUDGEME_SHOP_DOMAIN: string = SHOPIFY_STORE_PERMANENT_DOMAIN;

// Convert Shopify GraphQL gid (e.g. gid://shopify/Product/12345) to numeric ID.
function gidToNumericId(gid: string): string {
  const m = gid.match(/(\d+)(?:\?|$)/);
  return m ? m[1] : gid;
}

interface JudgemeReview {
  id: number;
  title: string | null;
  body: string | null;
  rating: number;
  reviewer: { name?: string | null; email?: string | null } | null;
  created_at: string;
  verified?: string | null; // "buyer" when verified
}

export async function getProductReviews(productId: string): Promise<ProductReviewsSummary> {
  const numericId = gidToNumericId(productId);
  try {
    // Chama o proxy interno (Cloudflare Pages Function) que usa o token privado.
    // Em dev, o Vite não tem este endpoint — retorna vazio silenciosamente.
    const url = `/api/reviews?product_id=${encodeURIComponent(numericId)}&per_page=100`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { average: 0, count: 0, reviews: [] };
    const json: { reviews?: JudgemeReview[] } = await res.json();

    const reviews: ProductReview[] = (json.reviews ?? []).map((r) => ({
      id: String(r.id),
      author: r.reviewer?.name?.trim() || "Anonymous",
      rating: Math.max(1, Math.min(5, Math.round(r.rating))),
      title: (r.title ?? "").trim(),
      body: (r.body ?? "").trim(),
      createdAt: r.created_at,
      verified: r.verified === "buyer",
    }));
    const count = reviews.length;
    const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    return { average, count, reviews };
  } catch {
    return { average: 0, count: 0, reviews: [] };
  }
}

// Submit-review (POST) is intentionally not implemented yet — GET only for now.
export async function addProductReview(
  _productId: string,
  _input: { author: string; rating: number; title: string; body: string },
): Promise<ProductReviewsSummary> {
  // Placeholder so existing UI compiles; wire to Judge.me POST when ready.
  return getProductReviews(_productId);
}

// =====================================================================
// Collections
// =====================================================================

const COLLECTION_QUERY = `
  query CollectionByHandle($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      id
      title
      description
      handle
      products(first: $first) {
        edges { node { ${PRODUCT_FIELDS} } }
      }
    }
  }
`;

const COLLECTIONS_LIST_QUERY = `
  query Collections($first: Int!) {
    collections(first: $first) { edges { node { id title handle } } }
  }
`;

export interface ShopifyCollectionSummary {
  id: string;
  handle: string;
  title: string;
}

export async function getCollectionByHandle(
  handle: string,
  first = 50,
): Promise<{ title: string; description: string; products: ShopifyProduct[] } | null> {
  const json = await storefrontApiRequest<{ collection: any | null }>(COLLECTION_QUERY, {
    handle,
    first,
  });
  const c = json?.data?.collection;
  if (!c) return null;
  return {
    title: c.title,
    description: c.description ?? "",
    products: (c.products?.edges ?? []).map((e: any) => normalizeProduct(e.node)),
  };
}

export async function listCollections(first = 25): Promise<ShopifyCollectionSummary[]> {
  const json = await storefrontApiRequest<{ collections: { edges: { node: any }[] } }>(
    COLLECTIONS_LIST_QUERY,
    { first },
  );
  return (json?.data?.collections?.edges ?? []).map((e) => ({
    id: e.node.id,
    handle: e.node.handle,
    title: e.node.title,
  }));
}

// =====================================================================
// Policies — fetch full body so we can render in-site
// =====================================================================

const POLICY_BY_HANDLE = `
  query PolicyByHandle {
    shop {
      privacyPolicy  { id title handle body }
      termsOfService { id title handle body }
      shippingPolicy { id title handle body }
      refundPolicy   { id title handle body }
    }
  }
`;

export interface ShopPolicyFull {
  id: string;
  title: string;
  handle: string;
  body: string;
}

export async function getPolicyByHandle(handle: string): Promise<ShopPolicyFull | null> {
  const json = await storefrontApiRequest<{ shop: Record<string, ShopPolicyFull | null> }>(
    POLICY_BY_HANDLE,
  );
  const all = json?.data?.shop;
  if (!all) return null;
  const match = Object.values(all).find((p) => p && p.handle === handle);
  return match ?? null;
}

// =====================================================================
// Helpers — case-insensitive option matching
// =====================================================================

export function findOption(
  product: ShopifyProduct,
  name: string,
): ShopifyProductOption | undefined {
  const n = name.toLowerCase();
  return product.options.find((o) => o.name.toLowerCase() === n);
}

// =====================================================================
// Site config
// =====================================================================

export const siteConfig = {
  brand: "BLANQ",
  slogan: "Quiet luxury, commanding presence.",
  socials: {
    instagram: "https://www.instagram.com/blanq.uk",
    pinterest: "https://pin.it/6oVKNnUoG",
    facebook: "https://www.facebook.com/profile.php?id=61588233546543",
  },
  contact: {
    address: "14 Marylebone Lane, London, W1U 2NE",
    email: "support@blanq.uk",
  },
} as const;
