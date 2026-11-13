// The Lesson screen's drawing (lessons Req 7.1; mock screen C through the map): the steps, the
// coach line, the paper typing line, the wrong-key hint, live accuracy and keys typed, the
// finger-colored keyboard and its legend. lesson.js runs the lesson; this only draws it, with
// textContent only. The frame (header and footer) is shared with the Lesson done card.
import {
  ACCURACY,
  coachFor,
  coachParts,
  FOOTER_LEFT,
  FOOTER_RIGHT,
  fixHint,
  KEYS,
  lineCount,
  pillText,
  STEP_NAMES,
  stepText,
} from "../../lessons/copy.js";
import { learnedKeys } from "../../lessons/ladder.js";
import { el } from "../dom.js";
import { hints, MAIN_MENU, termBar } from "./chrome.js";
import { createLessonKeyboard, legend } from "./lessonKeyboard.js";

/**
 * The desk frame: the shared header with the lesson pill as the h1 and a Main menu button (both
 * ask first, through `onMenu`), the body, and a footer.
 * @param {{ id: string, kind: string, onMenu: () => void, body: Node[], footRight: string[] }} o
 */
export function lessonFrame({ id, kind, onMenu, body, footRight }) {
  const bar = termBar(
    [el("button", { type: "button", class: "btn btn-term", onClick: onMenu }, MAIN_MENU)],
    "",
    onMenu,
  );
  const [name, right] = [...bar.children];
  return el("div", { class: "screen-frame desk" }, [
    el("header", { class: "term-header ls-head" }, [
      el("span", { class: "ls-left" }, [
        name,
        el("h1", { class: "pill ls-pill" }, pillText(id, kind)),
      ]),
      right,
    ]),
    el("main", { id: "main", class: "ls-main" }, body),
    el("footer", { class: "term-footer ls-foot" }, [el("span", {}, FOOTER_LEFT), hints(footRight)]),
  ]);
}

/** The steps row: done parts `[✓]`, the current one `[▶]`. Test out shows one step. */
export function createSteps(kind, id) {
  const names = STEP_NAMES[kind === "testout" ? "testout" : id === "L00" ? "lesson0" : "lesson"];
  const items = names.map(() => el("li", { class: "ls-step" }));
  return {
    node: el("ol", { class: "ls-steps" }, items),
    show(current) {
      items.forEach((li, i) => {
        const state = i < current ? "done" : i === current ? "now" : "todo";
        li.setAttribute("class", `ls-step is-${state}`);
        li.textContent = stepText(names[i], state);
      });
    },
  };
}

/**
 * @param {{ id: string, kind: "lesson"|"testout", onMenu: () => void }} o
 * @returns {{ node: HTMLElement, show: (v: object) => void }}
 */
export function createLessonView({ id, kind, onMenu }) {
  const steps = createSteps(kind, id);
  const coach = el("span", { class: "ls-coach-text" });
  const count = el("span", { class: "ls-count" });
  const paper = el("p", { class: "desk-paper", "aria-hidden": "true" });
  const hint = el("span", { class: "ls-hint" });
  const acc = el("strong", {});
  const keys = el("strong", {});
  const kb = createLessonKeyboard(learnedKeys(id));
  const node = lessonFrame({
    id,
    kind,
    onMenu,
    footRight: FOOTER_RIGHT,
    body: [
      steps.node,
      el("p", { class: "ls-coach" }, [coach, count]),
      paper,
      el("p", { class: "ls-under" }, [
        hint,
        el("span", { class: "ls-meta" }, [
          el("span", {}, [`${ACCURACY} `, acc]),
          el("span", {}, [`${KEYS} `, keys]),
        ]),
      ]),
      kb.node,
      legend(),
    ],
  });
  let partShown = null;
  /**
   * @param {{ part: number, partName: string, lineNo: number, lines: number,
   *   line: import("../../lessons/line.js").LineState, accuracy: number|null,
   *   keysDone: number, keysAll: number }} v
   */
  function show(v) {
    if (v.part !== partShown) {
      steps.show(v.part);
      coach.replaceChildren(
        ...coachParts(coachFor(id, v.partName)).map(([s, key]) =>
          key ? el("strong", { class: "ls-key" }, s) : el("span", {}, s),
        ),
      );
      partShown = v.part;
    }
    count.textContent = lineCount(v.lineNo, v.lines);
    const { text, typed, wrong } = v.line;
    const parts = [
      el("span", { class: "ch-done" }, text.slice(0, typed)),
      wrong === null ? null : el("span", { class: "ch-wrong" }, wrong),
      el("span", { class: "ch-wait" }, text.slice(typed, typed + 1)),
      el("span", { class: "ch-todo" }, text.slice(typed + 1)),
    ];
    paper.replaceChildren(...parts.filter(Boolean));
    hint.textContent = wrong === null ? "" : fixHint(text[typed]);
    acc.textContent = v.accuracy === null ? "--" : `${Math.round(v.accuracy * 100)}%`;
    keys.textContent = `${v.keysDone} / ${v.keysAll}`;
    kb.show(text[typed] ?? null);
  }
  return { node, show };
}
