# Design: Block 6, shell screens

**Spec:** `shell`. **Requirements:** `requirements.md` (approved Nov 11). **Rigor:** Working for layout, Full for saved data.
**Status:** Approved by Shara Nov 11.

## Shape

One page, one `#app` root. `src/main.js` boots: wrap the storage lookup, `load`, show the privacy card or the title, start the router. Each screen is one file exporting `render(ctx)` that returns a DOM node built with `el()` and `textContent`, and an optional `onKey(ctx, event)`. `ctx` holds `progress`, `persist`, `notice`, `settings`, and `go(screenId)`. Screens never touch storage directly; they call `app.js` actions.

```
main.js -> app.js (state + storage actions + tab sync)
        -> router.js (screen switch, focus, Escape back, live region)
        -> screens/*.js (one per screen)  -> components/*.js
```

## Files

| File | Job |
|---|---|
| `index.html` | Root page, `#app`, `#live` (polite live region), `lang="en"` |
| `src/main.js` | Boot |
| `src/ui/app.js` | App state and the only caller of storage: load, save (never when `persist` is false), export, import, clear, corrupt download, tab sync |
| `src/ui/router.js` | Show a screen, move focus to its heading, Escape goes back outside gameplay |
| `src/ui/dom.js` | `el(tag, attrs, children)` with `textContent` only; refuses `innerHTML`-like attrs |
| `src/ui/download.js` | Save a text file to the player's disk (Blob + link), wrapped in try/catch |
| `src/ui/components/noticeBar.js` | One notice line and its button, announced politely |
| `src/ui/components/confirmDialog.js` | On-page confirm with focus trap, Escape cancels |
| `src/ui/components/keyboard.js` + `keyboardLayout.js` | QWERTY keycaps with band glyph, pattern, label |
| `src/ui/screens/title.js` | Wordmark, tagline, still frame of the demo scene, "Press any key". STUB note: live attract in Block 13, `kiro` egg in Block 14 |
| `src/ui/screens/menu.js` | The eight PRD items; unbuilt ones show "Not built yet" |
| `src/ui/screens/privacy.js` | G9 card text, first launch and from Settings |
| `src/ui/screens/settings.js` | AI drills, sound set, speed, finger colors, export, import, clear, privacy card, old data |
| `src/ui/screens/progress.js` | Keyboard heat map, diagnosis, weak keys, bests, text summary |
| `src/ui/screens/howWeCount.js` + `howWeCountText.js` | Page, and its text built from config values (pure, unit-tested) |
| `src/ui/screens/about.js` | G2 About list |
| `src/storage/settings.js` | Settings defaults and check (the contract leaves `settings` loose) |
| `src/styles/tokens.css`, `base.css`, `screens.css` | Locked look |
| `scripts/check-build.js` | Fail if any fixture id appears in `dist/` |
| `.kiro/agents/a11y-auditor.md` | Read-only plus the axe run, audits UI blocks against G10 |
| `e2e/*.spec.js`, `playwright.config.js` | Screen flows and axe on the built site |

## Decisions

1. **Fonts.** `@fontsource/jetbrains-mono` and `@fontsource/roboto-condensed` (OFL), imported in CSS so Vite copies the font files into `dist/` and serves them from our own origin. Their license files ship with them. Longevity-check both before pinning.
2. **Tests.** Pure helpers (layout, How we count text, settings check, `el`) run under `node --test`. Screens run under Playwright against `vite preview`, Chromium only, plus axe. New script `npm run test:e2e`. Longevity-check and pin `@playwright/test` and `@axe-core/playwright`.
3. **Speed setting** is stored now and passed to `createRound` in Block 7. One source of truth: the slider's range comes from `SPEED_MIN` and `SPEED_MAX`.
4. **Tab sync.** Listen for the `storage` event on `deadkeys:v1`. When another tab writes, set `persist` false and show the `otherTab` notice with a Reload button. New notice; wording below for Shara.
5. **Phone notice.** Shown when `(pointer: coarse)` matches and no hardware keyboard has been used, or the viewport is under 900 px wide. Menus still work.
6. **Title still frame** is a static drawing of the locked title scene, the same frame reduced motion will use in Block 13.
7. **Preview deploys.** Vercel CLI pinned in devDependencies and run through npm scripts. Shara runs `vercel login` herself. Kiro links the project and deploys previews only. Every deploy is logged in `KIRO-NOTES.md`.
8. **Build check** runs after every build at the gate: `npm run build && node scripts/check-build.js`.

## Copy for Shara to approve

| Where | Text |
|---|---|
| `otherTab` notice | Your progress changed in another Dead Keys tab. To keep both tabs from overwriting each other, this one has stopped saving. Reload to pick up the latest. Button: Reload |
| `exportFailed` notice | We couldn't make a backup file just now. Your progress is still saved in this browser. Try again in a moment. Button: Try again |
| Clear confirm, extra line when a newer save is present | This also deletes progress saved by a newer version of Dead Keys. |
| Phone notice (draft, Shara to approve) | Dead Keys needs a physical keyboard to play. You can still look around the menus here. To type, open this page on a computer. |
| Reason: not text | That isn't a backup file. |
| Reason: over 2 MB | That file is too big to be a Dead Keys backup. The limit is 2 MB. |
| Reason: not JSON | That file isn't a Dead Keys backup. It can't be read. |
| Reason: newer version | That backup was made by a newer version of Dead Keys. Refresh to get the latest version, then try again. |
| Reason: anything else | That file isn't a Dead Keys backup, or it's damaged. |
