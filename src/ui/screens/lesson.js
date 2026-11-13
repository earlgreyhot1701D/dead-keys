// The Lesson screen (lessons Req 3, 4, 7): a lesson or test out, line by line (line.js). Escape and
// Main menu pause: Resume, or Leave (nothing recorded). The Check's last line records it (Req 4).
import { PAUSE, SAY } from "../../lessons/copy.js";
import { showDip } from "../../lessons/dip.js";
import { generateLesson, generateTestOut } from "../../lessons/generate.js";
import { keysItems } from "../../lessons/keysRound.js";
import { lessonById } from "../../lessons/ladder.js";
import { backspace, pauseLine, startLine, typeKey, waitingKey } from "../../lessons/line.js";
import { accuracyOf, mostMissed, passes, passFor, toLessonResult } from "../../lessons/result.js";
import { openConfirm } from "../components/confirmDialog.js";
import { createLessonDone } from "../components/lessonDone.js";
import { createLessonView } from "../components/lessonView.js";
import { el } from "../dom.js";
import { localDay } from "../roundRecord.js";
import { chooseRound } from "./play.js";
import { isTyping } from "./round.js";

let chosen = { id: "L01", kind: "lesson" };
/** Say which lesson starts next (the router has no parameters). @throws {RangeError} */
export function chooseLesson(id, kind = "lesson") {
  const ok = lessonById(id).built && (kind === "lesson" || (kind === "testout" && id !== "L00"));
  if (!ok) throw new RangeError(`no ${kind} for ${id}`);
  chosen = { id, kind };
}
export const nextLesson = () => chosen;

const now = () => globalThis.performance?.now?.() ?? Date.now();
let live = null; // the running lesson; only one at a time

function begin(ctx) {
  const { id, kind } = chosen;
  const plan = (kind === "testout" ? generateTestOut : generateLesson)(id, Date.now());
  const doc = ctx.root?.ownerDocument ?? globalThis.document;
  const where = (to) => (to === "menu" || !ctx.has?.("lessons") ? "menu" : "lessons");
  const run = { plan, part: 0, lineNo: 0, line: null, checkFrom: 0, done: null, doc, view: null };
  const part = () => plan.parts[run.part];
  run.ask = (to) => {
    if (run.line) run.line = pauseLine(run.line); // no line yet during Lesson 0's question
    openConfirm(doc, el, {
      ...{ id: "lesson-pause", title: PAUSE.title, lines: [PAUSE.body] },
      ...{ cancelLabel: PAUSE.resume, confirmLabel: PAUSE.leave },
      onCancel: () => {},
      onConfirm: () => ctx.go(where(to)),
    });
  };
  const colors = ctx.state?.settings?.fingerColors !== false; // lessons-8b Req 7
  const view = createLessonView({ id, kind, colors, onMenu: () => run.ask("menu") });
  run.view = view;
  run.draw = () => {
    const p = part();
    const ks = run.line.keystrokes;
    view.show({
      ...{ part: run.part, partName: p.name, lineNo: run.lineNo + 1, lines: p.lines.length },
      line: run.line,
      accuracy: ks.length ? accuracyOf(ks) : null,
      keysDone: p.lines.slice(0, run.lineNo).join("").length + run.line.typed,
      keysAll: p.lines.join("").length,
    });
  };
  const startAt = () => {
    run.line = startLine(part().lines[run.lineNo], run.line ?? {});
    if (part().name === "check" && run.lineNo === 0) run.checkFrom = run.line.keystrokes.length;
    view.say(ctx.announce, run.part, part().name, run.lineNo + 1, part().lines);
    run.draw();
  };
  run.advance = () => {
    if (run.lineNo + 1 < part().lines.length) run.lineNo += 1;
    else {
      do run.part += 1;
      while (part() && part().lines.length === 0);
      if (!part()) return finish(ctx, run, id, kind);
      run.lineNo = 0;
    }
    startAt();
  };
  if (part().lines.length) startAt();
  else view.ask(run.advance); // Lesson 0's keyboard question comes first (Req 6.1)
  live = run;
  return run;
}

function finish(ctx, run, id, kind) {
  const t = Date.now();
  const { keystrokes, activeMs } = run.line;
  const check = keystrokes.slice(run.checkFrom);
  const meta = { id: `lesson-${t}`, date: t, lessonId: id, kind };
  const result = toLessonResult({ ...meta, keystrokes, activeMs });
  const passed = passes(id, check);
  const dip = showDip(ctx.app.state.progress.rounds, result);
  const outcome = ctx.app.finishRound(result, localDay(t), passFor(id, kind, passed));
  const checkAccuracy = check.length ? accuracyOf(check) : 1;
  const again = (lid, k) => {
    chooseLesson(lid, k);
    ctx.replace("lesson");
  };
  run.done = createLessonDone({
    ...{ id, kind, passed, checkAccuracy, wpm: result.wpm, missed: mostMissed(keystrokes) },
    ...{ saved: outcome.saved, dip },
    go: {
      next: (next) => again(next, "lesson"),
      again: () => again(id, kind),
      all: () => ctx.go(ctx.has?.("lessons") ? "lessons" : "menu"),
      menu: () => ctx.go("menu"),
      play: () => {
        chooseRound("practice", keysItems(id)); // Play these keys: a calm round, these words
        ctx.replace("round");
      },
    },
  });
  const { n } = lessonById(id);
  const a = Math.floor(checkAccuracy * 100);
  ctx.announce(!passed ? SAY.notYet(a) : kind === "testout" ? SAY.testedOut(n) : SAY.passed(n, a));
  run.showDone = true;
  ctx.refresh(); // render() hands the router the card in place of the lesson
  run.done.first.focus();
}

/** @type {import("../router.js").Screen} */
export const lessonScreen = {
  id: "lesson",
  title: "Lesson",
  redrawOn: [], // the lesson draws itself; a redraw would start it again
  render(ctx) {
    if (live?.showDone) {
      live.showDone = false;
      return live.done.node;
    }
    return begin(ctx).view.node;
  },
  onKey(ctx, e) {
    if (!live || live.doc.querySelector?.("dialog[open]")) return false;
    if (live.done) return live.done.onKey(e);
    if (!live.line && e.key !== "Escape") return live.view.askKey(e); // Lesson 0's question
    if (e.key === "Escape") live.ask("lessons");
    else if (e.key === "Backspace") live.line = backspace(live.line);
    else if (!isTyping(e)) return false;
    else {
      const was = live.line.wrong;
      live.line = typeKey(live.line, e.key, now());
      if (was === null && live.line.wrong !== null) ctx.announce(SAY.wrong(waitingKey(live.line)));
      if (live.line.done) {
        live.advance();
        return true;
      }
    }
    if (live.line && !live.done) live.draw();
    return true;
  },
};
