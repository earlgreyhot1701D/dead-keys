# Current block

**Block 17: PWA, install and offline** (PRD G3, G13 row 16). Spec: `.kiro/specs/pwa/`. Built by Claude, Nov 13. Blocks 1 to 16 and 8b passed and are in production (8d0eab9).

## Files this block may touch

- `public/manifest.webmanifest`, `public/sw.js`, `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png` (new)
- `src/pwa/register.js` and its test (new); `src/main.js` (one call); `index.html` (manifest link, theme color)
- `e2e/pwa.spec.js` (new); `README.md` (one sentence)
- `.kiro/specs/pwa/*`, `docs/current-block.md`, `KIRO-NOTES.md`

Anything else: stop and ask Shara.

## Secrets

None.

## Testing rule

Touched tests while building. Lint and the full unit suite before each commit. e2e before each deploy.

## Rigor tier

Full.

## PASS line

`npm test`, `npm run test:e2e`, `npm run lint` and `npm run check:build` pass. On the preview: the browser offers to install, and after one visit the game opens with the network off. Then production.

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent), `pack-check`.
