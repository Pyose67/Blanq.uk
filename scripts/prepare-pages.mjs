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

// Cloudflare Pages: _worker.js in the output dir is used as the SSR handler
fs.copyFileSync(path.join(serverDir, "server.js"), path.join(clientDir, "_worker.js"));

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

console.log("✓ _worker.js criado em dist/client/");
console.log("✓ .wrangler removido");