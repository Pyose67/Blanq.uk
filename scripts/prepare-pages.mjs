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

    // POST — submit review. Resolve internal Judge.me product ID first so the
    // review is attached to the product (flat JSON + id = product review).
    if (request.method === "POST") {
      let payload = {};
      try { payload = await request.json(); } catch { /* ignore */ }
      if (!payload.email) {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        });
      }
      const hostedUrls = [];
      const imgbbKey = env.IMGBB_API_KEY || "";
      if (imgbbKey && Array.isArray(payload.picture_urls) && payload.picture_urls.length > 0) {
        for (const dataUrl of payload.picture_urls) {
          try {
            const base64 = String(dataUrl).includes(",") ? String(dataUrl).split(",")[1] : String(dataUrl);
            const imgForm = new FormData();
            imgForm.append("key", imgbbKey);
            imgForm.append("image", base64);
            const imgRes = await _nativeFetch("https://api.imgbb.com/1/upload", { method: "POST", body: imgForm });
            if (imgRes.ok) {
              const imgData = await imgRes.json();
              if (imgData && imgData.data && imgData.data.url) hostedUrls.push(imgData.data.url);
            }
          } catch { /* skip failed photo */ }
        }
      }
      const postRes = await _nativeFetch("https://judge.me/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(Object.assign({
          api_token: token,
          shop_domain: domain,
          platform: "shopify",
          id: shopifyId,
          name: payload.name || "Anonymous",
          email: payload.email,
          rating: payload.rating,
          title: payload.title || "",
          body: payload.body || "",
        }, hostedUrls.length > 0 ? { picture_urls: hostedUrls } : {})),
      });
      const responseText = await postRes.text();
      let errorMsg = "Something went wrong. Please try again.";
      if (!postRes.ok) {
        try {
          const errJson = JSON.parse(responseText);
          errorMsg = errJson.message || errJson.error || responseText;
        } catch { errorMsg = responseText; }
      }
      return new Response(
        postRes.ok ? JSON.stringify({ ok: true }) : JSON.stringify({ error: errorMsg }),
        {
          status: postRes.ok ? 200 : postRes.status,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        }
      );
    }

    // GET — resolve Shopify product ID → Judge.me internal product ID.
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
        judgemeProductId = productData?.product?.id ?? null;
      }
    } catch { /* product lookup failed — treat as no reviews */ }

    // If the product isn't in Judge.me at all, return empty for GET.
    if (!judgemeProductId) return _empty();

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
