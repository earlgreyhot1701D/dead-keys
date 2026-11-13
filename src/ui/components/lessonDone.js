// The Lesson done card (lessons Req 7.3; mock screen E through the map): Passed, Not yet or
// Tested out; Check accuracy against 95%; speed with "any speed is fine"; the two keys missed
// most; the dip line when Req 9 says; and the buttons. Enter takes the first button, Escape goes
// to all lessons. Drawing only, with textContent; lesson.js records the lesson first.
import { cardLabel, DONE, nextLabel } from "../../lessons/copy.js";
import { keysItems } from "../../lessons/keysRound.js";
import { lessonById } from "../../lessons/ladder.js";
import { el } from "../dom.js";
import { whatsThis } from "./glossary.js";
import { createSteps, lessonFrame } from "./lessonView.js";

/** The card's title: Tested out (a test out that passed), Passed, or Not yet. */
export const doneTitle = (kind, passed) =>
  !passed ? DONE.notYet : kind === "testout" ? DONE.testedOut : DONE.passed;

/** The next built lesson after this one, or null after Lesson 13. */
export function nextBuilt(id) {
  const n = lessonById(id).n + 1;
  if (n > 13) return null;
  const next = lessonById(`L${String(n).padStart(2, "0")}`);
  return next.built ? next : null;
}

const stat = (label, value, sub) =>
  el("div", { class: "ld-stat" }, [
    el("span", { class: "ld-stat-label" }, label),
    el("strong", {}, value),
    el("small", {}, sub),
  ]);

/**
 * @param {object} o
 * @param {string} o.id
 * @param {"lesson"|"testout"} o.kind
 * @param {boolean} o.passed
 * @param {number} o.checkAccuracy 0 to 1.
 * @param {number} o.wpm
 * @param {string[]} o.missed Up to two keys, most missed first.
 * @param {boolean} o.saved
 * @param {boolean} o.dip
 * @param {{ next: (id: string) => void, again: () => void, all: () => void, menu: () => void,
 *   play?: () => void }} o.go Play: "Play these keys", shown after a pass when there are words.
 * @returns {{ node: HTMLElement, first: HTMLElement, onKey: (e: KeyboardEvent) => boolean }}
 */
export function createLessonDone({ id, kind, passed, checkAccuracy, wpm, missed, saved, dip, go }) {
  const next = passed ? nextBuilt(id) : null;
  const button = (label, onClick, primary = false) =>
    el(
      "button",
      { type: "button", class: `btn btn-term ld-btn${primary ? " is-primary" : ""}`, onClick },
      label,
    );
  const buttons = [
    next ? button(nextLabel(next.n), () => go.next(next.id), true) : null,
    passed && go.play && keysItems(id) ? button(DONE.play, go.play) : null,
    button(DONE.again, go.again, !next),
    button(DONE.all, go.all),
  ].filter(Boolean);
  const lines = [
    passed ? null : kind === "testout" ? DONE.testOutNotYetLine : DONE.notYetLine,
    passed && kind === "testout" ? DONE.testedOutLine : null,
    dip ? DONE.dip : null,
  ].filter(Boolean);
  const steps = createSteps(kind, id);
  steps.show(Infinity); // every part done
  const card = el("section", { class: "desk-card ld-card", "aria-labelledby": "ld-title" }, [
    el("p", { class: "desk-card-top" }, [
      el("span", {}, cardLabel(lessonById(id).n)),
      el("span", {}, saved ? DONE.saved : DONE.notSaving),
    ]),
    el("h2", { id: "ld-title", class: "ld-title" }, doneTitle(kind, passed)),
    el("div", { class: "ld-stats" }, [
      stat(
        [DONE.checkAcc, " ", whatsThis("accuracy")],
        `${Math.floor(checkAccuracy * 100)}%`,
        id === "L00" ? DONE.lesson0Sub : DONE.passLine,
      ),
      stat(DONE.speed, `${Math.round(wpm)} WPM`, DONE.speedSub),
      missed.length
        ? stat(DONE.keep, missed.join("  "), DONE.keepSub)
        : stat(DONE.keep, DONE.none, DONE.noneSub),
    ]),
    ...lines.map((l) => el("p", { class: "ld-line" }, l)),
    el("div", { class: "ld-buttons" }, buttons),
  ]);
  const node = lessonFrame({
    id,
    kind,
    onMenu: go.menu, // nothing is left unsaved, so no question first
    footRight: next ? DONE.footNext : DONE.footAgain,
    body: [steps.node, card],
  });
  return {
    node,
    first: buttons[0],
    onKey(e) {
      if (e.key === "Escape") {
        go.all();
        return true;
      }
      const tag = e.target?.tagName;
      if (e.key !== "Enter" || tag === "BUTTON" || tag === "A") return false;
      buttons[0].click();
      return true;
    },
  };
}
