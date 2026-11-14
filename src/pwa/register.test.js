// The service worker (PWA block): registered on the live site, not on this machine unless asked,
// never a crash; and sw.js never touches the AI route or Vercel's paths.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { registerSw, SW_URL } from "./register.js";

const fakeNav = () => {
  const calls = [];
  return { calls, serviceWorker: { register: (u) => calls.push(u) && Promise.resolve() } };
};

test("registers on the live site and previews; not locally unless forced", () => {
  const nav = fakeNav();
  assert.equal(registerSw(nav, "dead-keys.vercel.app"), true);
  assert.deepEqual(nav.calls, [SW_URL]);
  assert.equal(registerSw(fakeNav(), "localhost"), false);
  assert.equal(registerSw(fakeNav(), "localhost", true), true);
});

test("a browser without service workers, or one that throws, still plays", () => {
  assert.equal(registerSw({}, "dead-keys.vercel.app"), false);
  const broken = {
    serviceWorker: {
      register: () => {
        throw new Error("no");
      },
    },
  };
  assert.equal(registerSw(broken, "dead-keys.vercel.app"), false);
});

const sw = (() => {
  const module = { exports: {} };
  runInNewContext(readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8"), {
    module,
    URL,
  });
  return module.exports;
})();
const O = "https://dead-keys.vercel.app";

test("sw.js: the AI route, Vercel's paths, other sites and non-GETs are never touched", () => {
  for (const [url, method] of [
    [`${O}/api/drill`, "POST"],
    [`${O}/api/drill`, "GET"],
    [`${O}/_vercel/insights/script.js`, "GET"],
    ["https://example.com/x.js", "GET"],
    [`${O}/`, "POST"],
  ]) {
    assert.equal(sw.decide({ url, method }, O), "skip", `${method} ${url}`);
  }
});

test("sw.js: pages network first, built files cache first", () => {
  assert.equal(sw.decide({ url: `${O}/`, method: "GET", mode: "navigate" }, O), "page");
  assert.equal(sw.decide({ url: `${O}/assets/index-abc.js`, method: "GET" }, O), "asset");
  assert.equal(sw.decide({ url: `${O}/og.png`, method: "GET" }, O), "asset");
  assert.match(sw.CACHE, /^deadkeys-v\d+$/);
});

test("the manifest: name, standalone, start at /, three icons including a maskable one", () => {
  const m = JSON.parse(
    readFileSync(new URL("../../public/manifest.webmanifest", import.meta.url), "utf8"),
  );
  assert.equal(m.name, "Dead Keys");
  assert.equal(m.display, "standalone");
  assert.equal(m.start_url, "/");
  assert.deepEqual(
    m.icons.map((i) => i.sizes),
    ["192x192", "512x512", "512x512"],
  );
  assert.equal(m.icons[2].purpose, "maskable");
});

test("sw.js: install caches the built files the page names, once each", () => {
  const html =
    '<script type="module" crossorigin src="/assets/index-a1.js"></script>' +
    '<link rel="stylesheet" crossorigin href="/assets/index-b2.css">' +
    '<link rel="modulepreload" href="/assets/index-a1.js"><link rel="icon" href="/favicon.svg">';
  assert.deepEqual([...sw.builtFiles(html)], ["/assets/index-a1.js", "/assets/index-b2.css"]);
  const css = "@font-face{src:url(/assets/mono-latin-400.woff2) format('woff2')}";
  assert.deepEqual([...sw.builtFiles(css)], ["/assets/mono-latin-400.woff2"]);
});
