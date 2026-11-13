# Share card: design (Block 11)

## Files

| File | Job |
| --- | --- |
| `src/share/cardData.js` | Pure: the round, its milestones and saved progress in; the card's words and numbers, the share line and the text alternative out |
| `src/share/drawCard.js` | Draws the card on any 2D context, at the mock's coordinates |
| `src/share/shareActions.js` | Download PNG, Copy text, Share, with the browser API passed in |
| `src/ui/components/shareDialog.js` | The window: `buildShare` (tested under node), `openShare` (browser) |
| `src/ui/screens/results.js` | The Share card button opens the window (was a "not built yet" button) |
| `src/styles/share.css` | The window's size and the scaled card |

The canvas is made with `document.createElement`, not `el`, because the safe tag list has no canvas. Nothing goes in as markup. The PNG is a Blob URL, never a `data:` URL on the page.

## Mock-to-build map (binding)

| Mock | Build |
| --- | --- |
| Double border, `--rule` | Two 2px lines, 2px apart |
| "DEAD KEYS // TERMINAL 84", "ROUND REPORT" | Roboto Condensed 700, 26px, letter-spaced, `--accent` |
| Big WPM, "WPM" label | 200px `--text`; label 34px `--accent` |
| Accuracy, "ACCURACY" label | 120px `--bright`, placed after the WPM's measured width so 3 digits never overlap |
| Right panel: BEST SPEED, ROUNDS, STREAK | `--card` fill, double rule; labels mono `--muted`, values mono 700 `--bright` |
| Meta line | Mono 26px `--muted`. The mode uses the app's own name (FALLING WORDS, not the mock's FALLING TARGETS) |
| Milestone box | `--shaky` double border; only when earned; top WPM band only |
| Footer | Rule, tagline left, site right, mono 24px `--accent` |

## Copy table (binding)

| Where | Words |
| --- | --- |
| Results button | Share card |
| Window title | SHARE CARD |
| Note | Made in your browser. Nothing is uploaded. |
| Buttons | Download PNG · Copy text · Share · Close |
| Saved | Saved. |
| Save failed | Couldn't make the image here. |
| Copied | Copied. |
| Copy failed | Couldn't copy here. Try Download PNG. |
| Share failed | Couldn't open sharing here. Try Download PNG. |
| Share line | I typed {wpm} WPM at {acc}% accuracy in Dead Keys, a typing game, back from the dead. dead-keys.vercel.app |
| Text alternative | Dead Keys round card: {wpm} WPM, {acc}% accuracy, {meta, lowercase}. {milestone, lowercase, when earned} |
| No best yet | — |
| Streak | 1 DAY, {n} DAYS |
| File name | dead-keys-{wpm}wpm.png |

## Decisions

1. Built by Claude to save Kiro credits; Kiro commits and deploys (Shara, Nov 13).
2. The live line sits inside the window, since the page behind a modal is inert.
3. No server, no upload, no Open Graph image endpoint. A link preview of the site is a later idea, not this block.
