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

// Read the TanStack Start SSR server bundle
let serverCode = fs.readFileSync(path.join(serverDir, "server.js"), "utf8");

// Wrap fetch with: 1) /api/reviews proxy to Judge.me, 2) static assets, 3) SSR
const wrapper = `
const _tsrFetch = server.fetch.bind(server);

async function _judgemeProxy(request, env) {
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
}

const _assetAwareFetch = async (request, env, ctx) => {
  const p = new URL(request.url).pathname;

  // 1. API proxy
  if (p === "/api/reviews") {
    return _judgemeProxy(request, env);
  }

  // 2. Static assets passthrough
  const isStatic =
    p.startsWith("/assets/") ||
    p === "/favicon.png" ||
    /\\.(?:css|js|ico|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|otf)(\\?.*)?$/.test(p);
  if (isStatic && env?.ASSETS) {
    const res = await env.ASSETS.fetch(request);
    if (res.status !== 404) return res;
  }

  // 3. SSR fallback
  return _tsrFetch(request, env, ctx);
};

export { createServerEntry, _assetAwareFetch as fetch };
export default { fetch: _assetAwareFetch };
`;

serverCode = serverCode.replace(
  /export\s*\{\s*createServerEntry\s*,\s*server\s+as\s+default\s*\}\s*;?\s*$/,
  wrapper,
);

fs.writeFileSync(path.join(clientDir, "_worker.js"), serverCode, "utf8");

// Remove the generated wrangler.json
const generatedWrangler = path.join(clientDir, "wrangler.json");
if (fs.existsSync(generatedWrangler)) {
  fs.rmSync(generatedWrangler);
}

if (fs.existsSync(".wrangler")) {
  fs.rmSync(".wrangler", { recursive: true, force: true });
}

console.log("✓ _worker.js criado com /api/reviews + asset passthrough + SSR");