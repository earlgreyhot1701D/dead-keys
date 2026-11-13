// Boot: look up storage (wrapped inside the app), load, then draw the first screen. Fonts are
// self-hosted from npm packages, so a page visit asks no third party for anything. Analytics is
// Vercel's own same-origin script, page views only, and only on Vercel.
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import "@fontsource/roboto-condensed/latin-400.css";
import "@fontsource/roboto-condensed/latin-700.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/screens.css";
import "./styles/chrome.css";
import "./styles/panels.css";
import "./styles/title.css";
import "./styles/titleScene.css";
import "./styles/titlePanel.css";
import "./styles/titlePress.css";
import "./styles/attract.css";
import "./styles/menu.css";
import "./styles/menuList.css";
import "./styles/menuSide.css";
import "./styles/menuDaily.css";
import "./styles/keyboard.css";
import "./styles/heatBands.css";
import "./styles/progress.css";
import "./styles/progressRight.css";
import "./styles/progressWeak.css";
import "./styles/pages.css";
import "./styles/playPicker.css";
import "./styles/playHud.css";
import "./styles/playStation.css";
import "./styles/playFalling.css";
import "./styles/playLock.css";
import "./styles/playCorners.css";
import "./styles/playCornersCards.css";
import "./styles/playCornersLock.css";
import "./styles/playCornersHud.css";
import "./styles/playMoments.css";
import "./styles/results.css";
import "./styles/resultsPanels.css";
import "./styles/resultsLog.css";
import "./styles/share.css";
import "./styles/desk.css";
import "./styles/deskLesson.css";
import "./styles/deskDone.css";
import "./styles/deskMenu.css";
import "./styles/deskMenuSide.css";
import { loadAnalytics } from "./analytics/analytics.js";
import { createApp } from "./ui/app.js";
import { downloadText } from "./ui/download.js";
import { mountFit } from "./ui/fit.js";
import { mountRouter } from "./ui/router.js";
import { aboutScreen } from "./ui/screens/about.js";
import { howWeCountScreen } from "./ui/screens/howWeCount.js";
import { lessonScreen } from "./ui/screens/lesson.js";
import { lessonsScreen } from "./ui/screens/lessons.js";
import { menuScreen } from "./ui/screens/menu.js";
import { dailyScreen, practiceScreen } from "./ui/screens/menuRounds.js";
import { playScreen } from "./ui/screens/play.js";
import { privacyScreen } from "./ui/screens/privacy.js";
import { progressScreen } from "./ui/screens/progress.js";
import { resultsScreen } from "./ui/screens/results.js";
import { roundScreen } from "./ui/screens/round.js";
import { settingsScreen } from "./ui/screens/settings.js";
import { titleScreen } from "./ui/screens/title.js";

const app = createApp({
  getStorage: () => window.localStorage, // may throw when the browser blocks storage; app.js catches it
  now: () => Date.now(),
  download: (name, text) => downloadText(name, text),
  listen: (fn) => {
    window.addEventListener("storage", fn);
    return () => window.removeEventListener("storage", fn);
  },
  reload: () => window.location.reload(),
});
app.start();
mountFit();
loadAnalytics(document, window.location.hostname); // page views only (PRD G9)

// Screens not listed here are not built yet; the menu shows them as such.
const screens = Object.fromEntries(
  [
    titleScreen,
    menuScreen,
    privacyScreen,
    progressScreen,
    settingsScreen,
    howWeCountScreen,
    aboutScreen,
    playScreen,
    roundScreen,
    practiceScreen,
    dailyScreen,
    resultsScreen,
    lessonScreen,
    lessonsScreen,
  ].map((s) => [s.id, s]),
);
mountRouter({
  root: document.getElementById("app"),
  live: document.getElementById("live"),
  screens,
  app,
});
