import fs from "node:fs";
import path from "node:path";

const serverDir = "dist/server";
const clientDir = "dist/client";
const clientAssetsDir = path.join(clientDir, "assets");

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

const wrapper = `
const _tsrFetch = server.fetch.bind(server);

function _safeUrl(reqUrl) {
  try {
    return new URL(reqUrl);
  } catch {
    return new URL(reqUrl, "https://placeholder.local");
  }
}

async function _judgemeProxy(request, env) {
  const url = _safeUrl(request.url);
  const productId = url.searchParams.get("product_id");
  const perPage = url.searchParams.get("per_page") ?? "100";
  if (!productId) {
    return new Response(JSON.stringify({ error: "product_id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const params = new URLSearchParams({
    api_token: env.JUDGEME_PRIVATE_TOKEN,
    shop_domain: env.JUDGEME_SHOP_DOMAIN,
    external_id: productId,
    per_page: perPage,
  });
  const apiUrl = "https://judge.me/api/v1/reviews?" + params.toString();
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      const errorText = await res.text();
      return new Response(JSON.stringify({ debug: "judgeme_not_ok", status: res.status, body: errorText, url: apiUrl.replace(env.JUDGEME_PRIVATE_TOKEN, "REDACTED") }), {
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
  } catch (err) {
    return new Response(JSON.stringify({ debug: "exception", message: String(err), stack: err && err.stack ? String(err.stack) : null, shop: env.JUDGEME_SHOP_DOMAIN, hasToken: !!env.JUDGEME_PRIVATE_TOKEN }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

const _assetAwareFetch = async (request, env, ctx) => {
  const p = _safeUrl(request.url).pathname;

  if (p === "/api/reviews") {
    return _judgemeProxy(request, env);
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
