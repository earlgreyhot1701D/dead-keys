# Dead Keys: Start Here

**For:** a fresh conversation picking up the Dead Keys build. Updated Wed Nov 11 2026, 8:30 AM PT.
**Repo on Shara's computer:** `C:\Users\corde\projects\dead-keys`
**Read first, in this order:** `docs/current-block.md`, `docs/prd.md` (v1.5, the source of truth), `docs/research.md`, `KIRO-NOTES.md`. The same PRD lives in the Hackathons project as `claude/dead-keys-prd.md`. The seed (`claude/kiroween-typing-game-seed.md`) is history; where it differs from the PRD, the PRD wins.

AI assisted. Human approved. Powered by NLP.

---

## Where things stand

**Planning: done.** PRD v1.5, all 15 gates closed, decisions D1 to D7 made. Research verified. Builder Center and dev.to warm-up posts drafted, covers made.

**Repo setup (Block 0): done by Claude on Nov 11.** In the folder now:

| File | Job |
|---|---|
| `.kiroignore` | Agent can't read `.env`, keys, secrets |
| `.gitignore`, `LICENSE` (MIT), `README.md` (stub), `package.json` (pinned, not installed) | Repo basics |
| `.kiro/steering/product.md`, `tech.md`, `structure.md` | Always-on rules, written from the PRD |
| `.kiro/steering/a11y.md` | Loads only for UI files |
| `.kiro/steering/ponytail.md` | Ponytail's own Kiro file, MIT, attributed |
| `.kiro/settings/mcp.json` | Vercel MCP, disabled (Kiro isn't on Vercel's client list; use the Vercel CLI) |
| `.kiro/agents/reviewer.md` | Read-only reviewer for block gates |
| `.kiro/hooks/line-cap.json`, `block-scope.json` + `scripts/` | The two permanent hooks |
| `docs/prd.md`, `research.md`, `prior-work.md`, `current-block.md`, `start-here.md` | Planning docs |
| `KIRO-NOTES.md` | Write-up log, first entry done |

## Still to do before Block 1 (Shara)

1. ~~Register on Devpost for Kiroween.~~ Done Nov 11.
2. ~~Request Kiro credits.~~ Not needed: Shara is on Kiro Enterprise.
3. Empty public repo created Nov 11: github.com/earlgreyhot1701D/dead-keys. Still to do: connect the folder and push. Kiro can run the git commands.
4. Open the folder in Kiro. Run `npm install`. Approve the two hooks if Kiro asks.
5. Check that GitHub's About panel shows MIT.

## Then: Block 1, the data contract (PRD G4)

Scope, file allowlist and PASS line are in `docs/current-block.md`. Spec goes in `.kiro/specs/contract/`, requirements first.

## Working rules

- Kiro builds. Claude writes specs and prompts and reviews. Shara directs and decides.
- One spec per block, requirements-first, EARS criteria. One file per task. Never "Run all tasks."
- Every Kiro prompt names the files it may touch and says DO NOT refactor other code.
- Contract first: fixtures before engine or UI.
- Verify against the repo files, not memory.
- Shara enters every secret herself. The agent never sees one.
- Replies to Shara: short answer first, one step or question at a time, plain words, numbers in tables.

## Models

| Job | Model |
|---|---|
| Building in Kiro (well-scoped, one file per task) | A Sonnet-class model, or Kiro's Auto. Saves credits. |
| Writing specs and reviewing in Claude chat | Opus-class |
| Hard reviews: AI route (Block 7), storage and migration, security pass | The strongest model available, used only for those |
| Reviewer agent at ordinary block gates | Sonnet-class is enough |
