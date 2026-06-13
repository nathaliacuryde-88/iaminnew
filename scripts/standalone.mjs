/**
 * Bundles dist/ into one self-contained HTML file (dist/iamin-standalone.html)
 * that can be opened directly from disk or shared as a single file.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dist = new URL("../dist/", import.meta.url).pathname;
let html = readFileSync(join(dist, "index.html"), "utf8");

const assets = readdirSync(join(dist, "assets"));
const js = assets.find((f) => f.endsWith(".js"));
const css = assets.find((f) => f.endsWith(".css"));

// IMPORTANT: pass a *function* as the replacement so `$` sequences inside the
// minified JS/CSS (e.g. `$&`, `$\``) are inserted literally and not interpreted
// as String.replace special patterns.
const inline = (re, text) => {
  html = html.replace(re, () => text);
};

if (css) {
  const cssText = readFileSync(join(dist, "assets", css), "utf8");
  inline(
    new RegExp(`<link[^>]*${css.replace(/\./g, "\\.")}[^>]*>`),
    `<style>${cssText}</style>`
  );
}
if (js) {
  const jsText = readFileSync(join(dist, "assets", js), "utf8").replace(/<\/script/gi, "<\\/script");
  inline(
    new RegExp(`<script[^>]*${js.replace(/\./g, "\\.")}[^>]*></script>`),
    `<script type="module">${jsText}</script>`
  );
}

// sanity: no asset references should survive
if (/(?:src|href)="\.\/assets\//.test(html)) {
  throw new Error("standalone: leftover ./assets reference — inlining failed");
}

writeFileSync(join(dist, "iamin-standalone.html"), html);
console.log(`✓ dist/iamin-standalone.html (${(html.length / 1024).toFixed(0)} kB)`);
