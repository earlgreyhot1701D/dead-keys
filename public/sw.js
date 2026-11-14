// Job: let Dead Keys open and play offline (PWA block). Same-origin GETs only. The AI route
// (/api/) and Vercel's own paths (/_vercel/) are never touched, so a drill is never served stale
// and analytics are never cached. Pages: network first, the cached copy offline. Built files
// (their names change with every build): cache first. Nothing about the player is stored here;
// progress stays in localStorage, as before.
const CACHE = "deadkeys-v1";

/**
 * What to do with a request: "skip" (the browser handles it), "page" or "asset".
 * Pure, so tests can run it without a service worker.
 * @param {{ url: string, method: string, mode?: string }} req
 * @param {string} origin This site's origin.
 */
function decide(req, origin) {
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== origin) return "skip";
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_vercel/")) return "skip";
  return req.mode === "navigate" ? "page" : "asset";
}

/** The built files a page or a style sheet names: /assets/... scripts, styles and fonts. */
function builtFiles(text) {
  const found = text.matchAll(/(?:src="|href="|url\()(\/assets\/[^")]+)/g);
  return [...new Set([...found].map((m) => m[1]))];
}

if (typeof self !== "undefined" && typeof self.addEventListener === "function") {
  // Install: the page and every built file it names, so the very first visit can play offline.
  self.addEventListener("install", (e) => {
    e.waitUntil(
      (async () => {
        const c = await caches.open(CACHE);
        const res = await fetch("/");
        const html = await res.clone().text();
        await c.put("/", res);
        const files = builtFiles(html);
        await c.addAll([...files, "/favicon.svg", "/favicon-32.png", "/manifest.webmanifest"]);
        // The fonts the styles name, so offline play keeps the game's own type.
        for (const css of files.filter((f) => f.endsWith(".css"))) {
          const hit = await c.match(css);
          await c.addAll(builtFiles(await hit.text()));
        }
        await self.skipWaiting();
      })(),
    );
  });
  self.addEventListener("activate", (e) => {
    e.waitUntil(
      caches
        .keys()
        .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
        .then(() => self.clients.claim()),
    );
  });
  self.addEventListener("fetch", (e) => {
    const how = decide(e.request, self.location.origin);
    if (how === "skip") return;
    if (how === "page") {
      e.respondWith(
        fetch(e.request)
          .then((res) => {
            const copy = res.clone(); // before the page reads the body
            if (res.ok) caches.open(CACHE).then((c) => c.put("/", copy));
            return res;
          })
          .catch(() => caches.match("/").then((hit) => hit ?? Response.error())),
      );
      return;
    }
    e.respondWith(
      // ignoreVary: a module script asks with an Origin header the install-time copy didn't send
      caches.match(e.request, { ignoreVary: true }).then(
        (hit) =>
          hit ??
          fetch(e.request).then((res) => {
            const copy = res.clone();
            if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, copy));
            return res;
          }),
      ),
    );
  });
}

if (typeof module !== "undefined") module.exports = { builtFiles, decide, CACHE };
