// The back-stack and the Escape rule (shell Req 1.2). Pure, so they are tested under node. Split
// from router.js at the line cap; router.js draws, this decides.

const MAX_STACK = 12;

/**
 * The screens the player has passed through, oldest first. Going to a screen already in the stack
 * returns to it (menu, settings, menu does not grow the stack), so Escape always steps back one.
 * @param {string} start
 */
export function createNav(start) {
  let stack = [start];
  const push = (id) => {
    const at = stack.indexOf(id);
    stack = at >= 0 ? stack.slice(0, at + 1) : [...stack, id].slice(-MAX_STACK);
  };
  return {
    get stack() {
      return [...stack];
    },
    current: () => stack.at(-1),
    go: push,
    /** Swap the current screen for another, so Escape skips it (the first-run privacy card). */
    replace(id) {
      if (stack.length > 1) stack = stack.slice(0, -1);
      push(id);
    },
    /** @returns {boolean} False at the first screen, where there is nothing to go back to. */
    back() {
      if (stack.length < 2) return false;
      stack = stack.slice(0, -1);
      return true;
    },
  };
}

/**
 * What the router does with a key press. Escape goes back one screen, unless something else
 * already used the key (a screen, or an open dialog, whose own Escape closes it).
 * @param {{ key: string, defaultPrevented: boolean }} event
 * @param {{ dialogOpen: boolean }} state
 * @returns {"back" | "ignore"}
 */
export function escapeAction(event, { dialogOpen }) {
  if (event.key !== "Escape" || event.defaultPrevented || dialogOpen) return "ignore";
  return "back";
}
