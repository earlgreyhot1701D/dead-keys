// The Lessons menu (lessons Req 5; mock screen D through the map): every lesson grouped by row
// with its state, the learned-keys map, and the selected lesson's paper card. Up and Down move
// the selection (it starts on the recommended lesson), Enter starts it, T tests out of it,
// Escape goes back. Desk look: no scanlines.
import { MENU } from "../../lessons/copy.js";
import { LADDER, lessonById } from "../../lessons/ladder.js";
import { GROUPS, groupCount, KEY_LABELS, lessonStates, STATE } from "../../lessons/menuModel.js";
import { backButton, hints, MAIN_MENU, termBar } from "../components/chrome.js";
import { lessonsCard, lessonsMap } from "../components/lessonsMenuParts.js";
import { el } from "../dom.js";
import { chooseLesson } from "./lesson.js";

let selected = null; // the selected lesson id; null until the menu first opens
const two = (n) => String(n).padStart(2, "0");

function open(ctx, id, kind) {
  chooseLesson(id, kind);
  selected = null; // the next visit starts on the recommended lesson again (Req 5.5)
  ctx.go("lesson");
}
const canStart = (id) => lessonById(id).built;
const canTestOut = (id) => canStart(id) && id !== "L00";

function row(ctx, l, state, rows) {
  const on = l.id === selected;
  const cls = ["lm-row", `is-${state}`, on ? "is-selected" : ""].filter(Boolean).join(" ");
  const b = el(
    "button",
    {
      type: "button",
      class: cls,
      "data-focus-id": `lm-${l.id}`,
      "aria-current": on ? "true" : null,
      onClick: () => select(ctx, l.id, rows),
    },
    [
      el("span", { class: "lm-n" }, two(l.n)),
      el("span", { class: "lm-name" }, l.name),
      el("span", { class: "lm-keys" }, KEY_LABELS[l.id]),
      el("span", { class: "lm-state" }, STATE[state]),
    ],
  );
  rows.set(l.id, b);
  return b;
}

function select(ctx, id, rows) {
  selected = id;
  ctx.refresh();
  rows.get(id)?.focus();
}

/** @type {import("../router.js").Screen} */
export const lessonsScreen = {
  id: "lessons",
  title: "Lessons",
  render(ctx) {
    const { states, recommended } = lessonStates(ctx.state.progress);
    selected ??= recommended ?? "L00";
    const rows = new Map();
    const bar = termBar(
      [
        backButton(ctx),
        el(
          "button",
          { type: "button", class: "btn btn-term", onClick: () => ctx.go("menu") },
          MAIN_MENU,
        ),
      ],
      "",
      () => ctx.go("menu"),
    );
    const [name, right] = [...bar.children];
    this.rows = rows;
    return el("div", { class: "screen-frame desk" }, [
      el("header", { class: "term-header ls-head" }, [
        el("span", { class: "ls-left" }, [name, el("span", { class: "pill" }, MENU.node)]),
        right,
      ]),
      el("main", { id: "main", class: "ls-main lm-main" }, [
        el("div", { class: "lm-title" }, [
          el("div", {}, [el("p", { class: "lm-sub" }, MENU.sub), el("h1", {}, MENU.title)]),
        ]),
        el("div", { class: "lm-desk" }, [
          el(
            "div",
            { class: "lm-list" },
            GROUPS.flatMap(([g, heading]) => [
              el("p", { class: `lm-group${g === "beyond" ? " is-later" : ""}` }, [
                el("span", {}, heading),
                el("span", { class: "lm-count" }, groupCount(g, states)),
              ]),
              ...LADDER.filter((l) => l.group === g).map((l) => row(ctx, l, states[l.id], rows)),
            ]),
          ),
          el("div", { class: "lm-side" }, [
            lessonsMap(states, recommended),
            lessonsCard({
              id: selected,
              state: states[selected],
              start: () => open(ctx, selected, "lesson"),
              testOut: () => open(ctx, selected, "testout"),
            }),
          ]),
        ]),
      ]),
      el("footer", { class: "term-footer ls-foot" }, [
        el("span", {}, `SYS.84 // SAVE: ${ctx.state.persist === false ? "OFF" : "THIS BROWSER"}`),
        hints(MENU.footer),
      ]),
    ]);
  },
  onKey(ctx, e) {
    const ids = LADDER.map((l) => l.id);
    const i = ids.indexOf(selected);
    const tag = e.target?.tagName;
    const onControl =
      tag === "BUTTON" && !e.target?.getAttribute?.("data-focus-id")?.startsWith("lm-");
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const j = Math.min(ids.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)));
      select(ctx, ids[j], this.rows ?? new Map());
      return true;
    }
    if (e.key === "Enter" && !onControl && canStart(selected)) open(ctx, selected, "lesson");
    else if ((e.key === "t" || e.key === "T") && canTestOut(selected))
      open(ctx, selected, "testout");
    else return false;
    return true;
  },
};
