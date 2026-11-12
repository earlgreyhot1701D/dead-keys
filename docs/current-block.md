# Current block

**Block 6: shell screens** (PRD G10, G11, backlog item 6, size W). Spec: `.kiro/specs/shell/`.

Blocks 1 to 4 passed Nov 11 (tags `block-1` to `block-4`). Block 5 (design and tokens) was locked Nov 11 in `docs/design-brief.md`. The contract is frozen.

## Files this block may touch

- `index.html`, `src/main.js`, `src/ui/**`, `src/styles/**`
- `public/licenses/` (the two OFL font license texts, served from our own origin; added Nov 11)
- `src/storage/settings.js` and its test; `src/storage/notices.js` and `src/storage/exportImport.js` (copy only, task 2) and their tests
- `scripts/check-build.js`, `scripts/check-build.test.js` (added Nov 12), `playwright.config.js`, `e2e/**`
- `src/styles/keyboardContrast.test.js` (added Nov 12; under `src/styles/**` already, named here for the record)
- `.kiro/agents/a11y-auditor.md`
- `package.json`, `package-lock.json` (the pinned devDependencies from task 1 and the `test:e2e`, `check:build`, deploy scripts)
- `.kiro/specs/shell/*`, `KIRO-NOTES.md`
- `docs/screens/*.png` (fix round, Nov 12: built and mock screenshots at 1440x900)
- `mock/index.html` and `docs/design-brief.md` are read-only here. **They are the spec for how every screen looks, not suggestions** (Nov 12). Nothing in `src/` imports from `mock/`.

Anything else: stop and ask Shara.

## Rigor tier

Working for layout. Full for settings, export, import, clear and anything else that touches saved data.

## PASS line

Every requirement in `.kiro/specs/shell/requirements.md` has a test or an e2e flow. `npm test`, `npm run test:e2e`, `npm run lint`, `node scripts/check-fixtures.js` and the build check all pass. axe reports no serious or critical issues. Source files under 150 lines without Shara's OK; nothing over 250. The reviewer and the a11y-auditor have run. Shara has opened the preview link and read both reports. Each screen's 1440x900 screenshot matches its mock screen, side by side, approved by Shara.

## Deploys

Preview only: `npm run deploy:preview` (runs `check:build`, then `vercel deploy --environment=preview`). Nothing goes to production without Shara's word.

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent).
