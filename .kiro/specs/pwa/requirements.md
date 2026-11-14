# Requirements: Block 17, PWA (install and offline)

**Spec:** `pwa` (PRD G3: "service worker (never caches /api)"; G13 row 16 lists the PWA). **Rigor:** Full: it runs on every visit and can serve stale code if wrong.
**Status:** Approved by Shara, Nov 13 ("it deserves its own short block"). Built by Claude the same day.

## Requirement 1: Installable

1. `public/manifest.webmanifest` SHALL name the game, start at `/`, open standalone, use the game's colors, and list a 192 and a 512 icon plus a 512 maskable icon (the favicon's ghost, on the game's background).
2. `index.html` SHALL link the manifest and set the theme color.

## Requirement 2: Offline

1. `public/sw.js` SHALL handle same-origin GET requests only. It SHALL never handle `/api/` (the AI route) or `/_vercel/` (analytics), so a drill is never stale and page views are never cached.
2. On install it SHALL cache the page, every built file the page names, the fonts its style sheets name, the favicons and the manifest, so the first visit is enough to play offline.
3. Pages: network first, the cached page when offline. Built files: cache first (their names change with every build). Old caches are deleted when a new worker takes over.
4. Offline, an AI drill falls back to the built-in one, as it already does when the route fails.
5. Nothing about the player is stored by the worker. Progress stays in localStorage.

## Requirement 3: Registration

1. `src/pwa/register.js` SHALL register `/sw.js` on Vercel hosts only, never locally unless the page has `?sw` (for the e2e), and never throw.

## Requirement 4: Checks

1. Unit: registration rules; the worker's request rules (`decide`), its built-file finder, the manifest.
2. e2e: the manifest and its icons load; after one visit, the game opens offline, its own code runs, and a key starts it.
