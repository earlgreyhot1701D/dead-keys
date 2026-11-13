// The Progress screen's Drill these keys button (drills Req 5), split from progressPanels.js at
// the line cap. It always starts a drill; with no weak keys yet, the copy-table line sits under it
// and describes it (a drill with no stats is weighted by word length only).

export const DRILL_BUTTON = "Drill these keys";
export const NO_WEAK_LINE = "Play a few rounds first. Drills aim at the keys you miss.";

/**
 * @param {Function} el
 * @param {boolean} hasWeak Are there weak keys to aim at?
 * @param {() => void} onDrill Starts a drill.
 */
export function drillButton(el, hasWeak, onDrill) {
  return el("div", { class: "drill-act" }, [
    el(
      "button",
      {
        type: "button",
        class: "btn btn-term",
        "aria-describedby": hasWeak ? null : "drill-note",
        onClick: onDrill,
      },
      DRILL_BUTTON,
    ),
    hasWeak ? null : el("span", { id: "drill-note", class: "drill-note" }, NO_WEAK_LINE),
  ]);
}
