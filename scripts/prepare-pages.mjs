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

async function _judgemeProxy(request, env) {
  try {
    const { params: queryParams } = _parsePathAndQuery(request.url);
    const productId = queryParams.get("product_id");
    const perPage = queryParams.get("per_page") || "100";
    if (!productId) {
      return new Response(JSON.stringify({ error: "product_id required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const params = new URLSearchParams({
      api_token: env.JUDGEME_PRIVATE_TOKEN || "",
      shop_domain: env.JUDGEME_SHOP_DOMAIN || "",
      external_id: productId,
      per_page: perPage,
    });
    const apiUrl = "https://judge.me/api/v1/reviews?" + params.toString();

    const res = await _nativeFetch(apiUrl);
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
