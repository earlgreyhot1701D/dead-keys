// AI drills in the browser (ai-drills Req 1, 3, 4), with fetch faked: the drill start (AI off, no
// weak key, success, failure, leaving), the button's lines and its waiting state, the AI labels
// on the HUD and results, recording drillSource "ai", and Play again on the same AI words.
import assert from "node:assert/strict";
import { test } from "node:test";
import { aiItems } from "../../drills/aiWords.js";
import {
  drillButton,
  NO_WEAK_LINE,
  NUDGE_LINE,
  noteFor,
  WAITING_LINE,
} from "../components/drillButton.js";
import {
  AI_BADGE,
  DRILL_BADGE,
  DRILL_SOURCE,
  drillBadge,
  drillRow,
} from "../components/drillLabel.js";
import { el } from "../dom.js";
import { findAll, makeFakeDoc, textOf, withFakeDocument } from "../fakeDom.js";
import { AI_SAY, DRILL_SAY, kindSource, roundOptions } from "./drillRound.js";
import { startDrill } from "./drillStart.js";
import { chooseRound, nextRound, ROUND_KINDS, roundItems } from "./play.js";
import { resultsScreen } from "./results.js";
import { roundScreen } from "./round.js";

const KEYS = [{ key: "q", attempts: 40, misses: 20, lastSeen: 0 }];
const WORDS = "quiet queen quote equal square quilt quick quest aqua quiz".split(" ");
const LINES = ["quiet queen quote equal", "square quilt quick quest", "aqua quiz"];
const reply = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** A ctx and a ui for startDrill, recording what happens. */
function rig({ ai = true, keys = KEYS, here = true } = {}) {
  const log = { go: [], wait: [], fetched: 0 };
  const ctx = {
    state: { settings: { ai, speed: 1 }, progress: { keys, rounds: [{ wpm: 30 }] } },
    go: (id) => log.go.push(id),
  };
  const ui = { wait: (on) => log.wait.push(on), here: () => here };
  const fetchWith = (res) => async () => {
    log.fetched += 1;
    if (res instanceof Error) throw res;
    return res;
  };
  return { ctx, ui, log, fetchWith };
}

test("AI off, or no weak key: the built-in drill at once, no request, no waiting line", async () => {
  for (const o of [{ ai: false }, { keys: [] }]) {
    const r = rig(o);
    const got = await startDrill(r.ctx, r.ui, {
      fetch: r.fetchWith(reply({ lines: LINES, source: "ai" })),
    });
    assert.equal(got, "built-in");
    assert.equal(r.log.fetched, 0);
    assert.deepEqual(r.log.wait, []);
    assert.deepEqual(r.log.go, ["round"]);
    assert.equal(roundItems(), null);
    assert.equal(kindSource(nextRound()), "built-in");
  }
});

test("AI on with a weak key: the waiting line, one request, then a drill on the AI's words", async () => {
  const r = rig();
  const got = await startDrill(r.ctx, r.ui, {
    fetch: r.fetchWith(reply({ lines: LINES, source: "ai" })),
  });
  assert.equal(got, "ai");
  assert.equal(r.log.fetched, 1);
  assert.deepEqual(r.log.wait, [true, false]);
  assert.deepEqual(r.log.go, ["round"]);
  assert.deepEqual(
    nextRound().items.map((i) => i.text),
    WORDS,
  );
  assert.equal(kindSource(nextRound()), "ai");
});

test("a failed request: the built-in drill, labeled built-in", async () => {
  for (const res of [
    reply({ error: "cap" }),
    reply({ error: "rate" }, 429),
    new TypeError("offline"),
  ]) {
    const r = rig();
    assert.equal(await startDrill(r.ctx, r.ui, { fetch: r.fetchWith(res) }), "built-in");
    assert.equal(kindSource(nextRound()), "built-in");
    assert.deepEqual(r.log.go, ["round"]);
  }
});

test("if the player left Progress while waiting, no round starts", async () => {
  const r = rig({ here: false });
  assert.equal(
    await startDrill(r.ctx, r.ui, { fetch: r.fetchWith(reply({ lines: LINES, source: "ai" })) }),
    "left",
  );
  assert.deepEqual(r.log.go, []);
});

test("the button's line: no weak keys, the nudge with AI off, nothing with AI on", () => {
  assert.equal(noteFor(false, false), NO_WEAK_LINE);
  assert.equal(noteFor(false, true), NO_WEAK_LINE);
  assert.equal(noteFor(true, false), NUDGE_LINE);
  assert.equal(noteFor(true, true), "");
  assert.equal(NUDGE_LINE, "Want fresh words? Turn on AI drills in Settings.");
  assert.equal(WAITING_LINE, "Writing your drill...");
});

test("while waiting, the line says so and a second press does nothing", () => {
  withFakeDocument(() => {
    const starts = [];
    let ui = null;
    const node = drillButton(
      el,
      true,
      (u) => {
        ui = u;
        starts.push(1);
        u.wait(true);
      },
      true,
    );
    const [button] = findAll(node, (n) => n.tag === "button");
    const note = findAll(node, (n) => n.attrs?.id === "drill-note")[0];
    assert.equal(button.attrs["aria-describedby"], "drill-note");
    button.click();
    assert.equal(note.textContent, WAITING_LINE);
    assert.equal(button.attrs["aria-disabled"], "true");
    button.click();
    assert.equal(starts.length, 1, "pressed twice, started once");
    ui.wait(false);
    assert.equal(note.textContent, "");
  });
});

test("the AI badge and row are the copy table's; the built-in ones stay", () => {
  withFakeDocument(() => {
    assert.equal(textOf(drillBadge(el, "x", "ai")), "[ DRILL: AI-GENERATED ]");
    assert.equal(textOf(drillBadge(el, "x")), DRILL_BADGE);
    assert.equal(textOf(drillRow(el, "ai")), "DRILL SOURCEAI-GENERATED");
    assert.equal(textOf(drillRow(el)), `${DRILL_SOURCE.label}${DRILL_SOURCE.value}`);
  });
  assert.equal(AI_SAY, "Drill: AI-generated.");
});

test("roundOptions on AI words: the AI live line, those words, weighted", () => {
  const said = [];
  chooseRound("drill", aiItems(WORDS));
  const o = roundOptions(nextRound(), {
    state: { settings: { speed: 1 }, progress: { keys: KEYS } },
    announce: (t) => said.push(t),
  });
  assert.deepEqual(said, [AI_SAY]);
  assert.ok(o.items.every((i) => WORDS.includes(i.text)));
  assert.equal(o.weights.length, o.items.length);
  chooseRound("drill");
  roundOptions(nextRound(), { state: { settings: { speed: 1 } }, announce: (t) => said.push(t) });
  assert.equal(said.at(-1), DRILL_SAY);
  assert.equal(kindSource(ROUND_KINDS.practice), null);
});

/** An AI drill on a fake page, ended from the pause dialog. */
function playAiDrill() {
  globalThis.window = {
    requestAnimationFrame: () => {},
    cancelAnimationFrame: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  const doc = makeFakeDoc();
  doc.addEventListener = () => {};
  doc.removeEventListener = () => {};
  globalThis.document = doc;
  const log = { go: [], said: [], finished: [] };
  chooseRound("drill", aiItems(WORDS));
  const ctx = {
    state: { settings: { speed: 1 }, persist: true, progress: { keys: KEYS } },
    go: (id) => log.go.push(id),
    replace: (id) => log.go.push(id),
    announce: (t) => log.said.push(t),
    app: {
      finishRound: (result) => {
        log.finished.push(result);
        return { recorded: true, saved: true, newBest: null, milestones: [], previous: null };
      },
    },
  };
  const node = roundScreen.render(ctx);
  doc.body.append(node);
  const hud = textOf(findAll(node, (n) => n.tag === "header")[0]);
  const first = textOf(findAll(node, (n) => n.attrs?.class === "fw-word")[0] ?? { children: [] });
  roundScreen.onKey({}, { key: "Escape" });
  findAll(doc.body, (n) => n.tag === "button" && textOf(n) === "End round")[0].click();
  return { hud, first, log, ctx };
}

test("an AI drill: the AI badge, the AI live line once, its words, drillSource ai", () => {
  try {
    const { hud, first, log } = playAiDrill();
    assert.ok(hud.includes(AI_BADGE) && !hud.includes(DRILL_BADGE));
    assert.equal(log.said.filter((l) => l === AI_SAY).length, 1);
    assert.ok(WORDS.includes(first), `the first word "${first}" is one of the AI's`);
    assert.equal(log.finished[0].drillSource, "ai");
    assert.equal(log.finished[0].mode, "practice");
  } finally {
    delete globalThis.window;
    delete globalThis.document;
  }
});

test("an AI drill's results: the AI badge and row; Play again replays the same AI words", () => {
  try {
    const { ctx, log } = playAiDrill();
    const text = textOf(resultsScreen.render(ctx));
    assert.ok(text.includes(`MODE: PRACTICE // PACK: AI WORDS${AI_BADGE}`), "copy table");
    assert.ok(!text.includes("PACK: GENERAL") && !text.includes("PACK: YOUR KEYS"));
    assert.ok(text.includes("DRILL SOURCEAI-GENERATED"));
    const before = roundItems();
    resultsScreen.onKey(ctx, { key: "Enter", target: { tagName: "BODY" } });
    assert.equal(log.go.at(-1), "round");
    assert.equal(nextRound().items, before, "the same AI words, no new request");
    assert.equal(kindSource(nextRound()), "ai");
  } finally {
    delete globalThis.window;
    delete globalThis.document;
  }
});

test("AI words with too few weak-key words give the built-in drill (Nov 13)", async () => {
  const r = rig();
  const lines = ["tree house dog cat sun sky map road", "quiet queen"]; // only 2 q-words
  const got = await startDrill(r.ctx, r.ui, { fetch: r.fetchWith(reply({ lines, source: "ai" })) });
  assert.equal(got, "built-in");
});
