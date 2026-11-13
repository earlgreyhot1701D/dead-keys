// Lesson 0's part 1 (lessons Req 6.1): "Does your keyboard look like this?" over the drawn US
// keyboard, with Yes and No. No shows the copy-table line and Go on. Drawing only, textContent
// only; split from lessonView.js at the line cap.
import { LESSON0 } from "../../lessons/copy.js";
import { el } from "../dom.js";

/**
 * Put the question in `coach` and its buttons in `slot`; Yes or Go on calls `onDone`. Each
 * button is described by the coach line, so a screen reader hears the question with it.
 * @param {{ coach: HTMLElement, slot: HTMLElement, onDone: () => void }} o
 * @returns {{ onKey: (e: KeyboardEvent) => boolean }} Enter, with focus not on a button, takes
 *   the first button.
 */
export function showAsk({ coach, slot, onDone }) {
  let first = null;
  const button = (label, onClick) =>
    el("button", { type: "button", class: "btn btn-term ld-btn", onClick }, label);
  const say = (line, buttons) => {
    coach.replaceChildren(el("span", {}, line));
    slot.replaceChildren(el("div", { class: "desk-paper ls-ask" }, buttons));
    for (const b of buttons) b.setAttribute("aria-describedby", coach.getAttribute("id"));
    first = buttons[0];
    first.setAttribute("class", "btn btn-term ld-btn is-primary");
    first.focus();
  };
  say(LESSON0.question, [
    button(LESSON0.yes, onDone),
    button(LESSON0.no, () => say(LESSON0.notUs, [button(LESSON0.goOn, onDone)])),
  ]);
  return {
    onKey(e) {
      const tag = e.target?.tagName;
      if (e.key !== "Enter" || tag === "BUTTON" || tag === "A") return false;
      first.click();
      return true;
    },
  };
}
