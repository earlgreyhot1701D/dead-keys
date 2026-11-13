// The Progress screen's Drill these keys button (drills Req 5, ai-drills Req 3.4, 4.3), split from
// progressPanels.js at the line cap. It always starts a drill. One line sits under it and
// describes it: with no weak keys, the Block 9 line; with weak keys and AI drills off, the nudge;
// while an AI drill is being written, the waiting line (the button then ignores presses).

export const DRILL_BUTTON = "Drill these keys";
export const NO_WEAK_LINE = "Play a few rounds first. Drills aim at the keys you miss.";
export const NUDGE_LINE = "Want fresh words? Turn on AI drills in Settings.";
export const WAITING_LINE = "Writing your drill...";

/** The line under the button, or "" for none. */
export const noteFor = (hasWeak, aiOn) => (!hasWeak ? NO_WEAK_LINE : aiOn ? "" : NUDGE_LINE);

/**
 * @param {Function} el
 * @param {boolean} hasWeak Are there weak keys to aim at?
 * @param {(ui: { wait: (on: boolean) => void, here: () => boolean }) => void} onDrill Starts a drill.
 *   `wait` shows the waiting line and blocks a second press; `here` says the button is still shown.
 * @param {boolean} [aiOn] Are AI drills on in Settings?
 */
export function drillButton(el, hasWeak, onDrill, aiOn = false) {
  let busy = false;
  const line = noteFor(hasWeak, aiOn);
  const note = el(
    "span",
    { id: "drill-note", class: "drill-note", "aria-live": "polite" },
    line || null,
  );
  const button = el(
    "button",
    {
      type: "button",
      class: "btn btn-term",
      "aria-describedby": "drill-note",
      onClick: () => {
        if (busy) return;
        onDrill({ wait, here: () => button.isConnected !== false });
      },
    },
    DRILL_BUTTON,
  );
  function wait(on) {
    busy = on;
    note.textContent = on ? WAITING_LINE : line;
    if (on) button.setAttribute("aria-disabled", "true");
    else button.removeAttribute?.("aria-disabled");
  }
  return el("div", { class: "drill-act" }, [button, note]);
}
