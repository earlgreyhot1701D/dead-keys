// Test helper only (like src/ui/appTestKit.js): type a whole generated lesson through line.js.
// Nothing outside *.test.js imports it.
import { startLine, typeKey } from "./line.js";

/**
 * Type every line of every part, 150 ms a key. `miss(lineNo)` gives a wrong key to press before
 * each line's first letter, or null.
 * @returns {{ keystrokes: object[], check: object[], activeMs: number, done: boolean }}
 *   `check` is the Check part's keystrokes only.
 */
export function playLesson(lesson, miss = () => null) {
  let carry = {};
  let at = 1000;
  let check = [];
  let lineNo = 0;
  let done = true;
  const press = (s, ch) => {
    at += 150;
    return typeKey(s, ch, at);
  };
  for (const part of lesson.parts) {
    const from = carry.keystrokes?.length ?? 0;
    for (const text of part.lines) {
      let s = startLine(text, carry);
      const wrong = miss(lineNo);
      lineNo += 1;
      if (wrong) s = press(s, wrong);
      for (const ch of text) s = press(s, ch);
      done = done && s.done;
      carry = s;
    }
    if (part.name === "check") check = (carry.keystrokes ?? []).slice(from);
  }
  return { keystrokes: carry.keystrokes ?? [], check, activeMs: carry.activeMs ?? 0, done };
}
