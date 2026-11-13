# Word pack format

A word pack is one JSON file in `packs/`. Dead Keys ships two: `general.json` (English) and `spanish.json` (Español). This page is for anyone writing a new one, such as the court pack planned for v2.

Check a pack before you open a pull request:

```
node scripts/check-pack.js packs/your-pack.json
```

It prints `OK` and the item count, or `FAIL` and every problem with where it is. Exit code 0 means it passed.

## The shape

The shape is the frozen contract in `contract/schemas/pack.json` and `item.json`.

| Field | What it holds |
| --- | --- |
| `id` | A short id, lowercase, such as `court` |
| `name` | The name players see, in the pack's language |
| `lang` | A language code: `en`, `es`, `pt-BR` |
| `version` | The pack's own version, such as `1.0.0` |
| `license` | The license the pack's words are under, such as `CC BY-SA 4.0`, or `original` |
| `attribution` | The credit line. Required whenever any word comes from someone else's list |
| `charset` | Every character a word may use, each once. Include `?` or `¿` if a word uses them |
| `pools.words` | The words the games spawn from. At least 20 |
| `lessons` | Leave it `[]`. Pack lessons come later |

Each item in `pools.words`:

| Field | What it holds |
| --- | --- |
| `id` | Unique in the whole pack |
| `text` | What the player types: 14 characters at most, no spaces, only `charset` characters |
| `kind` | `word` |
| `source` | Where it came from, with its license, or `original` |

## What the validator checks

1. The contract: every field, every type, every character in `charset`.
2. `lang` is a language code, and `charset` has no character twice.
3. `pools.words` exists and has at least 20 items.
4. No id is used twice; no word is in a pool twice.
5. No word is longer than 14 characters, starts or ends with a space, or has a space in it.
6. `attribution` is filled in whenever any item's source is not `original`.

## Before you add words

- Only use a word list whose license lets you share it, and say which in `license` and `attribution`.
- Keep it encouraging for every player: no profanity, slurs, sexual terms, or words about violence, death, illness or drugs. The shipped packs' blocklists (`packs/blocklist.txt`, `packs/blocklist-es.txt`) show the rule.
- Accented letters need a keyboard or layout that types them (for example US-International). Say so wherever players pick the pack.
