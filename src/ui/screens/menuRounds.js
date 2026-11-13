// Job: the menu's one-step rounds. Practice (play Req 2.2) and Daily drill (daily Req 1) open
// their round at once. The daily clock is `clockFor` in src/drills/limits.js, run by round.js.
import { chooseRound } from "./play.js";
import { roundScreen } from "./round.js";

/** Practice: a practice round on the falling layout. Moved here from round.js (Block 12). */
export const practiceScreen = {
  ...roundScreen,
  id: "practice",
  title: "Practice",
  render(ctx) {
    chooseRound("practice");
    return roundScreen.render(ctx);
  },
};

/** Daily drill: today's seeded round, 2 minutes. */
export const dailyScreen = {
  ...roundScreen,
  id: "daily",
  title: "Daily drill",
  render(ctx) {
    chooseRound("daily");
    return roundScreen.render(ctx);
  },
};
