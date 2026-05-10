import fs from "node:fs";
import path from "node:path";

const serverDir = "dist/server";
const clientDir = "dist/client";
const clientAssetsDir = path.join(clientDir, "assets");

// Merge server assets into client/assets (dynamic imports need them there)
const serverAssetsDir = path.join(serverDir, "assets");
if (fs.existsSync(serverAssetsDir)) {
  for (const file of fs.readdirSync(serverAssetsDir)) {
    const dest = path.join(clientAssetsDir, file);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(path.join(serverAssetsDir, file), dest);
    }
  }
}

let serverCode = fs.readFileSync(path.join(serverDir, "server.js"), "utf8");

// Wrap fetch with: 1) /api/reviews proxy to Judge.me, 2) static assets, 3) SSR
const wrapper = `
const _tsrFetch = server.fetch.bind(server);
const _nativeFetch = globalThis.fetch.bind(globalThis);

function _parsePathAndQuery(reqUrl) {
  let s = String(reqUrl || "");
  const protoIdx = s.indexOf("://");
  if (protoIdx !== -1) {
    const afterProto = s.slice(protoIdx + 3);
    const slashIdx = afterProto.indexOf("/");
    s = slashIdx === -1 ? "/" : afterProto.slice(slashIdx);
  }
  const qIdx = s.indexOf("?");
  const pathname = qIdx === -1 ? s : s.slice(0, qIdx);
  const queryString = qIdx === -1 ? "" : s.slice(qIdx + 1);
  const params = new URLSearchParams(queryString);
  return { pathname, params };
}

const _empty = () =>
  new Response(JSON.stringify({ reviews: [] }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

async function _judgemeProxy(request, env) {
  try {
    const { params: queryParams } = _parsePathAndQuery(request.url);
    const shopifyId = queryParams.get("product_id"); // Shopify numeric product ID
    const perPage = queryParams.get("per_page") || "100";
    if (!shopifyId) {
      return new Response(JSON.stringify({ error: "product_id required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    }

    const token = env.JUDGEME_PRIVATE_TOKEN || "";
    const domain = env.JUDGEME_SHOP_DOMAIN || "";

    // Step 1 — resolve Shopify product ID → Judge.me internal product ID.
    // external_id does NOT reliably filter the /reviews endpoint; we must use
    // Judge.me's own product_id (small integer) to get an exact match.
    const productLookupUrl =
      "https://judge.me/api/v1/products/show?" +
      new URLSearchParams({ api_token: token, shop_domain: domain, external_id: shopifyId });

    let judgemeProductId = null;
    try {
      const productRes = await _nativeFetch(productLookupUrl);
      if (productRes.ok) {
        const productData = await productRes.json();
        // Response shape: { product: { id: 123, external_id: "...", ... } }
        judgemeProductId = productData?.product?.id ?? null;
      }
    } catch { /* product lookup failed — treat as no reviews */ }

    // If the product isn't in Judge.me at all, return empty immediately.
    if (!judgemeProductId) return _empty();

    // POST — submit a new review to Judge.me (pending approval).
    if (request.method === "POST") {
      let body = {};
      try { body = await request.json(); } catch { /* ignore */ }
      const postRes = await _nativeFetch("https://judge.me/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_token: token,
          shop_domain: domain,
          platform: "shopify",
          id: judgemeProductId,
          reviewer: {
            name: body.name || "Anonymous",
            email: body.email || "",
            accepts_marketing: false,
          },
          review: {
            title: body.title || "",
            body: body.body || "",
            rating: body.rating,
            source: "web",
          },
        }),
      });
      const text = await postRes.text();
      return new Response(text, {
        status: postRes.status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    }

    // GET — fetch reviews for the exact Judge.me product ID.
    const reviewsUrl =
      "https://judge.me/api/v1/reviews?" +
      new URLSearchParams({
        api_token: token,
        shop_domain: domain,
        product_id: String(judgemeProductId),
        per_page: perPage,
      });

    const res = await _nativeFetch(reviewsUrl);
    if (!res.ok) return _empty();

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return _empty();
  }
}

const _assetAwareFetch = async (request, env, ctx) => {
  try {
    const { pathname: p } = _parsePathAndQuery(request.url);

    if (p === "/api/reviews") {
      return await _judgemeProxy(request, env);
    }

    const isStatic =
      p.startsWith("/assets/") ||
      p === "/favicon.png" ||
      /\\.(?:css|js|ico|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|otf)(\\?.*)?$/.test(p);
    if (isStatic && env?.ASSETS) {
      const res = await env.ASSETS.fetch(request);
      if (res.status !== 404) return res;
    }

    return _tsrFetch(request, env, ctx);
  } catch (err) {
    return new Response("Internal Server Error", { status: 500 });
  }
};

export { createServerEntry, _assetAwareFetch as fetch };
export default { fetch: _assetAwareFetch };
`;

serverCode = serverCode.replace(
  /export\s*\{\s*createServerEntry\s*,\s*server\s+as\s+default\s*\}\s*;?\s*$/,
  wrapper,
);

fs.writeFileSync(path.join(clientDir, "_worker.js"), serverCode, "utf8");

const generatedWrangler = path.join(clientDir, "wrangler.json");
if (fs.existsSync(generatedWrangler)) {
  fs.rmSync(generatedWrangler);
}

if (fs.existsSync(".wrangler")) {
  fs.rmSync(".wrangler", { recursive: true, force: true });
}

console.log("✓ _worker.js criado com /api/reviews + asset passthrough + SSR");
