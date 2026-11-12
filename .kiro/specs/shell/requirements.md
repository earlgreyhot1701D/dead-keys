# Requirements: Block 6, shell screens

**Spec:** `shell` (PRD G11 screens, G10 accessibility, G9 privacy card; backlog item 6). **Rigor:** Working for layout, Full for anything that touches saved data (settings, export, import, clear).
**Status:** Approved by Shara Nov 11.
**Sources:** `docs/design-brief.md` (locked look, band labels, copy rule), `mock/index.html` (the locked screens; reference only, never imported), `docs/prd.md` G2, G5, G9, G10, G11, G12, `.kiro/steering/a11y.md`. `KIRO-NOTES.md` rows "Deferred to Block 6".

## Introduction

This is where the locked design becomes the real app. The player can open Dead Keys in a browser and move through every screen that isn't gameplay: title, menu, privacy card, settings, progress with their heat map, "How we count" and About, all reading and writing real saved data through Blocks 3 and 4. Gameplay arrives in Block 7. A private Vercel preview link lets Shara check each gate in her own browser.

## Scope

**In:** `index.html`, the Vite app shell, design tokens as CSS, self-hosted fonts, a screen switcher, the notice bar, the on-screen keyboard component, and these screens: title (still frame), main menu, privacy card, settings, progress with heat map and diagnosis, How we count, About. The `a11y-auditor` agent and an axe-core check. A build check that no fixture data ships. A private Vercel preview deploy.
**Out (STUB with a note, never half-built):** gameplay and results (Block 7), lessons and the Why page (Block 8), live attract mode (Block 13), the `kiro` easter egg and sound (Block 14), daily drill (Block 12), share card (Block 11).

---

## Requirement 1: App shell

1. `npm run dev` SHALL open the title screen. `npm run build` SHALL produce a static site in `dist/`.
2. Every screen SHALL be reachable by keyboard alone, with visible focus, and Escape SHALL go back one screen outside gameplay.
3. Screens SHALL render with `textContent` and DOM methods only. No `innerHTML`, no `eval`.
4. Menu items for screens not built yet SHALL show as unavailable with the words "Not built yet" (preview only; every item is real by Block 16).
5. IF the viewport is narrower than the game needs or no keyboard is likely (touch-only), THE SYSTEM SHALL show the phone notice and still offer the menus.

## Requirement 2: The locked look

1. Colors, fonts, rules, scanlines and band treatments SHALL match the locked design brief, as CSS custom properties in one tokens file.
2. Fonts SHALL be self-hosted from the repo, not loaded from Google Fonts, so a page visit sends nothing to a third party (the privacy card promises only two things leave the browser).
3. `prefers-reduced-motion` SHALL turn off scanlines and motion.
4. Every token pair used for text SHALL meet WCAG 2.2 AA contrast, checked by a test.

## Requirement 3: Saved data on screen

1. On start, THE SYSTEM SHALL wrap the `window.localStorage` lookup in try/catch and pass `null` to `load` if it throws (Block 4 deferral).
2. THE SYSTEM SHALL never call `save` when `persist` is false, with a test (Block 4 deferral).
3. Notices from storage SHALL show in a notice bar using the approved wording and button, announced politely to screen readers.
4. WHEN another tab saves progress, THE SYSTEM SHALL tell the player in one line and offer to reload, instead of silently overwriting (Block 4 deferral).

## Requirement 4: Privacy card

1. On first launch, THE SYSTEM SHALL show the PRD G9 privacy card text before the menu, and again from Settings.
2. Dismissing it SHALL be remembered in settings.

## Requirement 5: Settings

1. Settings SHALL hold: AI drills on or off (stored now, used in Block 10), sound set (Off by default), speed (0.5× to 2×), finger colors on or off.
2. Settings SHALL have defaults, be checked on load, and be saved through Block 4.
3. Export SHALL download the backup file. Import SHALL show what will change and ask before replacing. Clear SHALL ask on the page before clearing. Every one SHALL be wrapped so a failure shows the approved notice and never crashes (Block 4 deferral).
4. "Download old data" SHALL work when a corrupt copy exists.

## Requirement 6: Progress and heat map

1. The progress screen SHALL draw the on-screen QWERTY keyboard with each key's band glyph, pattern and player label, never color alone.
2. It SHALL show up to three diagnosis sentences, weak keys, and personal bests, from Block 3.
3. It SHALL handle zero rounds, a few rounds and 200 rounds, and "Not enough yet" keys, using the normal and ugly fixtures in tests only.
4. A text summary of the heat map SHALL be readable by a screen reader.

## Requirement 7: How we count and About

1. "How we count" SHALL state every PRD G5 rule in plain words, with every number read from the config files, so the page and the code can never disagree.
2. About SHALL carry the PRD G2 About list. Links open safely (`rel="noopener"`).

## Requirement 8: Checks and preview

1. THE `a11y-auditor` agent SHALL exist (`.kiro/agents/a11y-auditor.md`, PRD G12) and an axe-core check via Playwright SHALL pass on every built screen with no serious or critical issues.
2. A build check SHALL search `dist/` for fixture ids and fail the gate on any hit (mock data never ships).
3. Kiro SHALL deploy a private Vercel preview from the IDE. Shara signs in to Vercel herself. No secrets are needed for this block. Production deploys stay off until Block 16.
4. `npm test`, `npm run lint` and `node scripts/check-fixtures.js` SHALL pass.
