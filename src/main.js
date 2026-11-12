// Boot. Task 3: styled blank page. The router, saved data and screens arrive in tasks 5 to 11.
// Fonts are self-hosted from npm packages, so a page visit asks no third party for anything.
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import "@fontsource/roboto-condensed/latin-400.css";
import "@fontsource/roboto-condensed/latin-700.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/screens.css";
import { el } from "./ui/dom.js";

const root = document.getElementById("app");
root.replaceChildren(el("main", { id: "main" }, [el("h1", {}, "Dead Keys")]));
