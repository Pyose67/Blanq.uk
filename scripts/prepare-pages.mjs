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

// Cloudflare Pages _worker.js mode: ALL requests (including /assets/*.css, images)
// go through this worker. We must proxy static assets via env.ASSETS, otherwise
// CSS/images return empty responses.
// We patch the final export to wrap the original fetch with asset-aware logic.
const assetWrapper = `
const _tsrFetch = server.fetch.bind(server);
const _assetAwareFetch = async (request, env, ctx) => {
  const p = new URL(request.url).pathname;
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

// Remove the original final export block and replace with asset-aware version
serverCode = serverCode.replace(
  /export\s*\{\s*createServerEntry\s*,\s*server\s+as\s+default\s*\}\s*;?\s*$/,
  assetWrapper,
);

fs.writeFileSync(path.join(clientDir, "_worker.js"), serverCode, "utf8");

// Remove the generated wrangler.json (Pages uses the root wrangler.toml)
const generatedWrangler = path.join(clientDir, "wrangler.json");
if (fs.existsSync(generatedWrangler)) {
  fs.rmSync(generatedWrangler);
}

// Remove the .wrangler folder that has a deploy/config.json pointing to the
// removed wrangler.json — without this, Cloudflare Pages fails reading config
if (fs.existsSync(".wrangler")) {
  fs.rmSync(".wrangler", { recursive: true, force: true });
}

console.log("✓ _worker.js criado em dist/client/ com asset passthrough");
console.log("✓ .wrangler removido");
