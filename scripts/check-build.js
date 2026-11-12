// Mock data never ships (tech.md, PRD G15). Search dist/ for fixture ids, fixture sample text and
// the fixtures/ and mock/ folders, and exit 1 on any hit. Run after every build:
//   npm run build && node scripts/check-build.js
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const TEXT_EXT = new Set([".js", ".css", ".html", ".json", ".txt", ".webmanifest", ".map", ".svg"]);
/** Fixture keys whose string values are ids, and keys whose values are sample text. */
const ID_KEYS = new Set(["id", "packId", "lessonId"]);
const TEXT_KEYS = new Set(["text", "name", "label", "attribution", "reason"]);
/** Folder names that must not appear in dist/ (as a path or inside a file). */
const FORBIDDEN_PATHS = ["fixtures/normal", "fixtures/ugly", "fixtures/", "mock/index.html"];

/** An id worth searching for: five or more characters with a digit or a dash (not "mini"). */
const distinctiveId = (s) => /^(?=.*[-\d])[\w-]{5,}$/.test(s);

/**
 * Collect fixture ids and sample strings from parsed fixture files.
 * @param {unknown[]} parsed
 * @returns {{ ids: Set<string>, texts: Set<string> }}
 */
export function collectNeedles(parsed) {
  const ids = new Set();
  const texts = new Set();
  const walk = (v, key) => {
    if (Array.isArray(v)) for (const x of v) walk(x, key);
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, k);
    else if (typeof v === "string") {
      if (ID_KEYS.has(key) && distinctiveId(v)) ids.add(v);
      if (TEXT_KEYS.has(key) && v.length >= 12) texts.add(v);
    }
  };
  for (const p of parsed) walk(p, "");
  return { ids, texts };
}

/**
 * @param {{ name: string, text: string }[]} files The built files (name relative to dist/).
 * @param {{ ids: Set<string>, texts: Set<string> }} needles
 * @returns {{ file: string, what: string, kind: string }[]}
 */
export function findHits(files, { ids, texts }) {
  const hits = [];
  for (const { name, text } of files) {
    const slashed = name.replaceAll("\\", "/");
    const bad = FORBIDDEN_PATHS.find((p) => slashed.includes(p) || text.includes(p));
    if (bad) hits.push({ file: name, what: bad, kind: "path" });
    for (const id of ids) if (text.includes(id)) hits.push({ file: name, what: id, kind: "id" });
    for (const t of texts) if (text.includes(t)) hits.push({ file: name, what: t, kind: "text" });
  }
  return hits;
}

function walkDir(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walkDir(join(dir, e.name)) : [join(dir, e.name)],
  );
}

function readFixtures(root) {
  const parsed = [];
  for (const f of walkDir(root).filter((p) => p.endsWith(".json"))) {
    try {
      parsed.push(JSON.parse(readFileSync(f, "utf8")));
    } catch {
      // the corrupted-JSON fixture is meant to be unreadable; it has no ids to search for
    }
  }
  return parsed;
}

function main() {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const dist = join(root, "dist");
  if (!existsSync(dist)) {
    console.error("check-build: dist/ not found. Run `npm run build` first.");
    return 1;
  }
  const needles = collectNeedles(readFixtures(join(root, "fixtures")));
  const all = walkDir(dist);
  const files = all.map((f) => ({
    name: relative(dist, f),
    text: TEXT_EXT.has(extname(f)) ? readFileSync(f, "utf8") : "",
  }));
  const hits = findHits(files, needles);
  for (const h of hits) console.error(`HIT (${h.kind}) in ${h.file}: ${h.what.slice(0, 60)}`);
  if (hits.length > 0) {
    console.error(`check-build: ${hits.length} hit(s). Mock data must not ship. Deploy blocked.`);
    return 1;
  }
  console.log(
    `check-build: clean. ${files.length} files, ${needles.ids.size} fixture ids, ${needles.texts.size} sample strings searched.`,
  );
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = main();
