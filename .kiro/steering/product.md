---
inclusion: always
---

# Dead Keys: product

Source of truth: #[[file:docs/prd.md]]. If this file and the PRD disagree, the PRD wins. Closed PRD gates are not reopened.

## What it is

The 1980s typing games (MasterType, 1981; Type Attack, 1982) rebuilt as a keyboard trainer that notices which keys you miss and drills them. Kiroween 2026 entry, category Resurrection.

- Tagline: "a typing game, back from the dead."
- For anyone starting or rebuilding keyboard skills. Never describe players by age.
- Say "typing on phone screens," never "glass."

## The loop

Land → attract mode is playing → press a key → 60-second calibration → heat map and up to three plain diagnosis sentences → pick a style (four corners or falling) → play → come back for the daily drill and the ghost race → watch red keys cool on the progress screen.

## MUST (summary; full list in PRD G2)

- Two mechanics on one engine. Practice mode (untimed). Pause, speed slider, settings, onboarding.
- Lesson 0 and a 14-lesson ladder, passed on accuracy (95%), with Test out on every lesson.
- Heat map, deterministic diagnosis, two-layer adaptive drills. Every drill labeled "built-in" or "AI-generated."
- "How we count" page, "Why these lessons" page, glossary taps.
- Local progress (localStorage only), export, import, clear, first-launch privacy card.
- Milestones that never punish the early speed dip. Share card, ghost race, daily drill, attract mode.
- General pack, Spanish dead-keys pack, community pack format and validator.
- Sound sets (Off default, Typewriter, Arcade), synthesized in code. `kiro` easter egg ("Spec Wave").
- PWA. About page with credits and links. Vercel Web Analytics (page views only).
- WCAG 2.2 AA from the first UI file.

## NEVER (v1)

- Music. Accounts, server-side user data, cookies, third-party trackers.
- Typing data or progress sent to analytics. Payment inside the app.
- `innerHTML`, `eval`, API keys in the browser. Player text sent to the model.
- Kiro's logo or brand art. Code copied from Office Keys, README Clew 2 or the Oct 17 feel test.
- Secrets read, typed or committed by the agent.
- Claims that typing games alone are proven, that phones are faster, or a MasterType lesson count.

## STUB, never half-built

Court pack, Graveyard Shift mode, other keyboard layouts, Spanish-language UI, research data warehouse, shared rate-limit counter. A stub is a comment with implementation notes.
