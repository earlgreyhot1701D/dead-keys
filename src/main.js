// Boot: look up storage (wrapped inside the app), load, then draw the first screen. Fonts are
// self-hosted from npm packages, so a page visit asks no third party for anything.
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import "@fontsource/roboto-condensed/latin-400.css";
import "@fontsource/roboto-condensed/latin-700.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/screens.css";
import "./styles/keyboard.css";
import { createApp } from "./ui/app.js";
import { downloadText } from "./ui/download.js";
import { mountRouter } from "./ui/router.js";
import { menuScreen } from "./ui/screens/menu.js";
import { privacyScreen } from "./ui/screens/privacy.js";
import { progressScreen } from "./ui/screens/progress.js";
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

// Screens not listed here are not built yet; the menu shows them as such.
const screens = Object.fromEntries(
  [titleScreen, menuScreen, privacyScreen, progressScreen].map((s) => [s.id, s]),
);
mountRouter({
  root: document.getElementById("app"),
  live: document.getElementById("live"),
  screens,
  app,
});
