// Build DOM nodes the safe way (PRD G15: textContent only, no innerHTML, no eval). Text always
// goes in as a text node, never as markup. The checks are pure so they run under node --test;
// `createEl` takes the document so a test can pass a small fake.

/** Every tag a screen may use. Anything else (script, style, iframe, link, svg...) is refused. */
const TAGS = new Set(
  (
    "a article aside br button caption code details dialog div dd dl dt em fieldset footer form " +
    "h1 h2 h3 h4 header hr input kbd label legend li main nav ol option output p pre section " +
    "select small span strong summary table tbody td textarea th thead tr ul"
  ).split(" "),
);
/** Attributes that turn text into markup or code. */
const BANNED = new Set(["innerhtml", "outerhtml", "srcdoc", "style"]);
const URL_ATTRS = new Set(["href", "src", "action", "formaction"]);
/** Added to every link that opens a new tab, for a screen reader. */
export const NEW_TAB = " (opens in a new tab)";
/** Set as properties so a value stays live; everything else is an attribute. */
const PROPS = new Set(["value", "checked", "selected", "disabled"]);

/**
 * @param {string} tag
 * @throws {TypeError} If the tag is not on the list.
 */
export function checkTag(tag) {
  if (!TAGS.has(tag)) throw new TypeError(`tag "${tag}" is not allowed`);
}

/**
 * Refuse an attribute that could run code or inject markup.
 * @param {string} name
 * @param {unknown} value
 * @throws {TypeError} For innerHTML-like names, `style`, a string event handler, or a
 *   `javascript:`, `data:` or `vbscript:` URL.
 */
export function checkAttr(name, value) {
  const n = name.toLowerCase();
  if (BANNED.has(n)) throw new TypeError(`attribute "${name}" is not allowed`);
  if (n.startsWith("on") && typeof value !== "function") {
    throw new TypeError(`"${name}" must be a function, never a string`);
  }
  if (URL_ATTRS.has(n) && typeof value === "string") {
    // Browsers ignore control characters and spaces inside a scheme, so strip them first.
    // biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are the point
    const bare = value.replace(/[\u0000-\u0020]/g, "").toLowerCase();
    if (/^(javascript|data|vbscript):/.test(bare))
      throw new TypeError(`"${name}" has a blocked URL`);
  }
}

/**
 * Make an `el` function for a document.
 * @param {Document} doc
 */
export function createEl(doc) {
  /**
   * @param {string} tag
   * @param {Record<string, unknown>} [attrs] `on*` values must be functions. `true` sets a
   *   bare attribute; `false`, null and undefined skip it.
   * @param {unknown} [children] Strings and numbers become text; nodes are appended; arrays are
   *   flattened; null, undefined and booleans are skipped.
   * @returns {HTMLElement}
   * @throws {TypeError} On a blocked tag, attribute or child.
   */
  return function el(tag, attrs = {}, children = []) {
    checkTag(tag);
    const node = doc.createElement(tag);
    for (const [name, value] of Object.entries(attrs ?? {})) {
      if (value === null || value === undefined || value === false) continue;
      checkAttr(name, value);
      if (name.toLowerCase().startsWith("on")) {
        node.addEventListener(name.slice(2).toLowerCase(), value);
      } else if (PROPS.has(name)) {
        node[name] = value;
      } else {
        node.setAttribute(name, value === true ? "" : String(value));
      }
    }
    // A link that opens a new tab must not hand that tab our window or our address.
    const newTab = tag === "a" && attrs?.target === "_blank";
    if (newTab) node.setAttribute("rel", "noopener noreferrer");
    const add = (child) => {
      if (Array.isArray(child)) return child.forEach(add);
      if (child === null || child === undefined || typeof child === "boolean") return;
      if (typeof child === "string" || typeof child === "number") {
        node.appendChild(doc.createTextNode(String(child)));
      } else if (typeof child === "object" && typeof child.nodeType === "number") {
        node.appendChild(child);
      } else {
        throw new TypeError("a child must be text, a number or a node");
      }
    };
    add(children);
    // ...and says so: a visible arrow, and the words for a screen reader (WCAG 3.2.5 advice).
    if (newTab) {
      add(el("span", { class: "new-tab", "aria-hidden": "true" }, " ↗"));
      add(el("span", { class: "sr-only" }, NEW_TAB));
    }
    return node;
  };
}

/** `el` for the page's own document. Call it only in the browser. */
export const el = (tag, attrs, children) => createEl(document)(tag, attrs, children);
