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

## Copy (approved rows are marked; new rows need Shara's approval)

| Where | Text |
|---|---|
| `otherTab` notice | Your progress changed in another Dead Keys tab. To keep both tabs from overwriting each other, this one has stopped saving. Reload to pick up the latest. Button: Reload |
| `exportFailed` notice | We couldn't make a backup file just now. Your progress is still saved in this browser. Try again in a moment. Button: Try again |
| Clear confirm, extra line when a newer save is present | This also deletes progress saved by a newer version of Dead Keys. |
| Phone notice (approved) | Dead Keys needs a physical keyboard to play. You can still look around the menus here. To type, open this page on a computer. |
| Notice bar, quiet button (approved, replaces "Dismiss") | Got it |
| Progress, no rounds (approved) | Play a round and your keys will show up here. |
| Progress, too little data (approved) | Not enough typing yet to say anything about your keys. Keep playing. |
| Progress, nothing flagged (approved) | Nothing stands out. Your keys look even. |
| Personal bests, none (approved) | No personal bests yet. Play a round to set one. |
| Progress headings (approved) | Your keys / What we notice / Personal bests / Heat map in words |
| Personal best names (approved) | corners: Four corners; falling: Falling words; lesson: Lessons; testout: Test outs; daily: Daily drill; specwave: Spec Wave |
| Personal best date (approved) | set Nov 11 (short month and day, local time) |
| Clear confirm title (approved) | Clear all progress? |
| Clear confirm line (approved) | This deletes your rounds, heat map, personal bests and milestones from this browser. It can't be undone, so download a backup first if you might want them back. |
| Clear confirm buttons (approved) | Clear everything (confirm) / Keep my progress (cancel) |
| Settings, AI hint (DRAFT) | When on, we send which keys you miss and your recent speed so the AI can write practice lines. Nothing you type is sent. |
| Settings, labels (DRAFT) | Settings / AI drills / Sound (Off, Typewriter, Arcade) / Speed (shown as 1×) / Finger colors / Your data / Download backup / Download old data / Clear all progress / Import a backup / Read the privacy card / Back |
| Import confirm (DRAFT) | Replace your progress? / This backup has 12 rounds and 3 lessons passed. / You have 5 rounds and 1 lesson passed now. / Importing replaces what you have in this browser. / Buttons: Replace my progress, Keep what I have |
| Announcements (DRAFT) | Backup downloaded. / Backup imported. / Progress cleared. |
| How we count and About (DRAFT) | The words live in `src/ui/screens/howWeCountText.js` (numbers read from config) and `about.js` (paragraphs and links). Shara reads them there; the plain-text list is in the Block 6 report. |
| Reason: not text | That isn't a backup file. |
| Reason: over 2 MB | That file is too big to be a Dead Keys backup. The limit is 2 MB. |
| Reason: not JSON | That file isn't a Dead Keys backup. It can't be read. |
| Reason: newer version | That backup was made by a newer version of Dead Keys. Refresh to get the latest version, then try again. |
| Reason: anything else | That file isn't a Dead Keys backup, or it's damaged. |
