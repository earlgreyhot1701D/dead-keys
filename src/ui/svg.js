// A small, safe SVG builder for the mock's icons and the speed line. Four tags only (svg, path,
// rect, circle), a fixed list of attributes per tag, and every value checked: numbers, path data,
// and colors. No text, no links, no scripts, no style. `createSvg` takes the document so a test
// can pass a fake; `svg` is the page's own.
const NS = "http://www.w3.org/2000/svg";

const NUM = /^-?\d+(\.\d+)?$/;
const COLOR = /^(none|currentColor|#[0-9a-fA-F]{3,8}|rgba?\(\s*[\d.]+(\s*,\s*[\d.]+){2,3}\s*\))$/;
const CHECKS = {
  num: (v) => NUM.test(String(v)),
  color: (v) => COLOR.test(String(v)),
  path: (v) => /^[MLHVCSQTAZmlhvcsqtaz0-9.,\s-]+$/.test(String(v)),
  box: (v) => /^-?[\d.]+(\s+-?[\d.]+){3}$/.test(String(v)),
  dash: (v) => /^[\d.]+(\s+[\d.]+)*$/.test(String(v)),
  role: (v) => v === "img" || v === "presentation",
  yes: (v) => v === "true",
  name: (v) => typeof v === "string" && v.length < 200,
  cls: (v) => /^[\w\s-]+$/.test(String(v)),
  fit: (v) => v === "none",
};
const COMMON = { fill: "color", stroke: "color", "stroke-width": "num", class: "cls" };
/** Every allowed attribute for each tag, and the check for its value. */
const TAGS = {
  svg: {
    viewBox: "box",
    width: "num",
    height: "num",
    role: "role",
    "aria-hidden": "yes",
    "aria-label": "name",
    focusable: "fit",
    preserveAspectRatio: "fit",
    class: "cls",
  },
  path: { d: "path", "stroke-dasharray": "dash", ...COMMON },
  rect: { x: "num", y: "num", width: "num", height: "num", ...COMMON },
  circle: { cx: "num", cy: "num", r: "num", ...COMMON },
};

/**
 * @param {Document} doc
 * @returns {(tag: string, attrs?: Record<string, string|number>, children?: Node[]) => Element}
 */
export function createSvg(doc) {
  return function s(tag, attrs = {}, children = []) {
    if (!Object.hasOwn(TAGS, tag)) throw new TypeError(`svg tag "${tag}" is not allowed`);
    const node = doc.createElementNS(NS, tag);
    for (const [name, value] of Object.entries(attrs)) {
      if (value === null || value === undefined) continue;
      const kind = Object.hasOwn(TAGS[tag], name) ? TAGS[tag][name] : null;
      if (!kind) throw new TypeError(`svg attribute "${name}" is not allowed on ${tag}`);
      if (!CHECKS[kind](value)) throw new TypeError(`svg ${tag} ${name}="${value}" is refused`);
      node.setAttribute(name, String(value));
    }
    for (const child of children) {
      if (child?.namespaceURI !== NS && child?.ns !== NS)
        throw new TypeError("svg child must be svg");
      node.appendChild(child);
    }
    return node;
  };
}

/** The builder for the page's own document. Call it only in the browser. */
export const svg = (tag, attrs, children) => createSvg(document)(tag, attrs, children);
