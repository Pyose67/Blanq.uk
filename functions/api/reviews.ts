// Cloudflare Pages Function — proxy seguro para Judge.me
// Esconde o token privado e expõe apenas leitura de reviews.

interface Env {
  JUDGEME_PRIVATE_TOKEN: string;
  JUDGEME_SHOP_DOMAIN: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const productId = url.searchParams.get("product_id");
  const perPage = url.searchParams.get("per_page") ?? "100";

  if (!productId) {
    return new Response(JSON.stringify({ error: "product_id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiUrl = new URL("https://judge.me/api/v1/reviews");
  apiUrl.searchParams.set("api_token", env.JUDGEME_PRIVATE_TOKEN);
  apiUrl.searchParams.set("shop_domain", env.JUDGEME_SHOP_DOMAIN);
  apiUrl.searchParams.set("product_id", productId);
  apiUrl.searchParams.set("per_page", perPage);

  try {
    const res = await fetch(apiUrl.toString());
    if (!res.ok) {
      return new Response(JSON.stringify({ reviews: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch {
    return new Response(JSON.stringify({ reviews: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
