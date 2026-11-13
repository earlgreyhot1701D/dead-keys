// Where a drill's words came from (drills Req 4, ai-drills Req 4.1; the copy tables): the badge for
// the HUD and the results header, and the results breakdown's DRILL SOURCE row. The AI badge looks
// like the built-in one, so only its words differ (ai-drills decision 3: never color alone).
// Split out so playHud.js, results.js and resultsPanels.js stay under the line cap.

export const BUILT_IN = "built-in";
export const AI = "ai";
export const DRILL_BADGE = "[ DRILL: BUILT-IN ]";
export const AI_BADGE = "[ DRILL: AI-GENERATED ]";
export const DRILL_SOURCE = Object.freeze({
  label: "DRILL SOURCE",
  value: "BUILT-IN",
  ai: "AI-GENERATED",
});

/** Is this round (a RoundResult, or a round kind) a drill, built-in or AI? */
export const isDrill = (r) => r?.drillSource === BUILT_IN || r?.drillSource === AI;

/**
 * The badge, drawn as the mock draws it (3px double rule).
 * @param {Function} el
 * @param {string} cls The screen's own class: `hud-drill` or `rs-drill`.
 * @param {string} [source] "built-in" or "ai".
 */
export const drillBadge = (el, cls, source = BUILT_IN) =>
  el("span", { class: `drill-badge ${cls}` }, source === AI ? AI_BADGE : DRILL_BADGE);

/** The breakdown's last row for a drill: DRILL SOURCE, then BUILT-IN or AI-GENERATED. */
export const drillRow = (el, source = BUILT_IN) =>
  el("p", { class: "rs-row rs-drill-row" }, [
    el("span", { class: "rs-row-label" }, DRILL_SOURCE.label),
    el("span", { class: "rs-row-value" }, source === AI ? DRILL_SOURCE.ai : DRILL_SOURCE.value),
  ]);
