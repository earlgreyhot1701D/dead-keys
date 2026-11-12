// One four-corners word card (mock screen 4), split from corners.js at the line cap: the small
// card with [·] or [!], the word and D:nn, and the locked look with TARGET_LOCKED, DIST, the
// double box with its ticks, the typed and remaining parts, and VECTOR. corners.js fills it in.

/**
 * @param {Function} el
 * @param {{ text: string }} target
 * @returns {{ node: HTMLElement, p: Record<string, HTMLElement>, cls: null, near: null }}
 */
export function makeCard(el, target) {
  const p = {
    tag: el("span", { class: "cw-tag" }),
    dist: el("span", { class: "cw-dist" }),
    lockDist: el("span", { class: "cw-lock-dist" }),
    typed: el("span", { class: "cw-typed" }),
    wrong: el("span", { class: "cw-wrong" }),
    rest: el("span", { class: "cw-rest" }),
    vector: el("span", { class: "cw-vector" }),
  };
  const tick = (cls, ch) => el("span", { class: `cw-tick ${cls}` }, ch);
  const node = el("div", { class: "cw" }, [
    el("div", { class: "cw-inner" }, [
      el("div", { class: "cw-card" }, [
        p.tag,
        el("span", { class: "cw-word" }, target.text),
        p.dist,
      ]),
      el("div", { class: "cw-lock" }, [
        el("div", { class: "cw-lock-bar" }, [el("span", {}, "TARGET_LOCKED"), p.lockDist]),
        el("div", { class: "cw-lock-box" }, [
          tick("t-top", "┴"),
          tick("t-bottom", "┬"),
          tick("t-left", "┤"),
          tick("t-right", "├"),
          el("span", { class: "cw-lock-word" }, [
            el("span", {}, "["),
            p.typed,
            el("span", { class: "cw-caret" }, "|"),
            p.wrong,
            p.rest,
            el("span", {}, "]"),
          ]),
        ]),
        p.vector,
      ]),
      el("span", { class: "m-check" }, "✓"),
    ]),
  ]);
  return { node, p, cls: null, near: null };
}
