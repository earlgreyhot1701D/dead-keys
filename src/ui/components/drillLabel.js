// Where a drill's words came from (drills Req 4; the copy table): the `[ DRILL: BUILT-IN ]`
// badge for the HUD and the results header, and the results breakdown's DRILL SOURCE row.
// Split out so playHud.js, results.js and resultsPanels.js stay under the line cap.

/** The only drill source in Block 9 (Block 10 adds "ai"). */
export const BUILT_IN = "built-in";
export const DRILL_BADGE = "[ DRILL: BUILT-IN ]";
export const DRILL_SOURCE = Object.freeze({ label: "DRILL SOURCE", value: "BUILT-IN" });

/** Is this round (a RoundResult, or a round kind) a built-in drill? */
export const isDrill = (r) => r?.drillSource === BUILT_IN;

/**
 * The badge, drawn as the mock draws it (3px double rule).
 * @param {Function} el
 * @param {string} cls The screen's own class: `hud-drill` or `rs-drill`.
 */
export const drillBadge = (el, cls) => el("span", { class: `drill-badge ${cls}` }, DRILL_BADGE);

/** The breakdown's last row for a drill: DRILL SOURCE, BUILT-IN (no explanation in the copy). */
export const drillRow = (el) =>
  el("p", { class: "rs-row rs-drill-row" }, [
    el("span", { class: "rs-row-label" }, DRILL_SOURCE.label),
    el("span", { class: "rs-row-value" }, DRILL_SOURCE.value),
  ]);
