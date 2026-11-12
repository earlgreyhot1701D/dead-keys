// Req 1.3: screens build DOM with text nodes only. Runs under node with a small fake document.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { checkAttr, checkTag, createEl, NEW_TAB } from "./dom.js";

/** Just enough of a document for `el`: elements, text nodes, attributes, listeners. */
const doc = {
  createElement: (tag) => ({
    nodeType: 1,
    tag,
    attrs: {},
    children: [],
    listeners: {},
    setAttribute(k, v) {
      this.attrs[k] = v;
    },
    appendChild(c) {
      this.children.push(c);
    },
    addEventListener(type, fn) {
      this.listeners[type] = fn;
    },
  }),
  createTextNode: (text) => ({ nodeType: 3, text }),
};
const el = createEl(doc);

test("text always goes in as a text node, never as markup", () => {
  const hostile = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
  const node = el("p", {}, hostile);
  assert.deepEqual(node.children, [{ nodeType: 3, text: hostile }]);
  assert.equal(node.children.length, 1);
});

test("random strings stay text, in children and in attribute values", () => {
  fc.assert(
    fc.property(fc.string(), (s) => {
      const node = el("span", { title: s }, s);
      assert.equal(node.attrs.title, s);
      assert.deepEqual(node.children, [{ nodeType: 3, text: s }]);
    }),
  );
});

test("children: strings, numbers, nodes and nested arrays go in; empty values are skipped", () => {
  const inner = el("em", {}, "x");
  const node = el("div", {}, ["a", 2, [inner, [null, undefined, false, true]], "b"]);
  assert.deepEqual(
    node.children.map((c) => c.text ?? c.tag),
    ["a", "2", "em", "b"],
  );
});

test("a child that is not text or a node is refused", () => {
  for (const bad of [{}, { nodeType: "1" }, () => 1, Symbol("x")]) {
    assert.throws(() => el("div", {}, [bad]), TypeError);
  }
});

test("only listed tags are allowed; script, style, iframe, link and svg are refused", () => {
  for (const ok of ["div", "button", "h1", "a", "input", "dialog", "table"]) {
    assert.doesNotThrow(() => checkTag(ok), ok);
  }
  for (const bad of [
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "link",
    "meta",
    "base",
    "svg",
    "img",
    "",
    "DIV",
  ]) {
    assert.throws(() => el(bad), TypeError, bad);
  }
});

test("innerHTML-like attributes and style are refused, whatever the case", () => {
  for (const name of ["innerHTML", "outerHTML", "INNERHTML", "srcdoc", "style", "Style"]) {
    assert.throws(() => el("div", { [name]: "<b>x</b>" }), TypeError, name);
  }
});

test("an event handler must be a function; a string handler is refused", () => {
  for (const name of ["onclick", "onerror", "onload", "OnMouseOver"]) {
    assert.throws(() => el("button", { [name]: "alert(1)" }), TypeError, name);
  }
  const fn = () => {};
  const node = el("button", { onClick: fn });
  assert.equal(node.listeners.click, fn);
  assert.equal("onClick" in node.attrs, false);
});

test("javascript:, data: and vbscript: URLs are refused, even disguised", () => {
  const bad = [
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "  javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "\u0001javascript:alert(1)",
    "data:text/html,<script>1</script>",
    "vbscript:msgbox",
  ];
  for (const url of bad) {
    assert.throws(() => el("a", { href: url }), TypeError, JSON.stringify(url));
    assert.throws(() => el("form", { action: url }), TypeError, JSON.stringify(url));
  }
  for (const ok of [
    "https://clewlabs.org",
    "/about",
    "#main",
    "mailto:a@b.co",
    "https://x.co/javascript:",
  ]) {
    assert.doesNotThrow(() => el("a", { href: ok }), ok);
  }
});

test("a link that opens a new tab gets rel noopener noreferrer", () => {
  const a = el("a", { href: "https://clewlabs.org", target: "_blank", rel: "author" }, "Clew Labs");
  assert.equal(a.attrs.rel, "noopener noreferrer");
  assert.equal(el("a", { href: "/x" }, "x").attrs.rel, undefined);
});

test("a new-tab link says so: a visible arrow, and words for a screen reader", () => {
  const a = el("a", { href: "https://clewlabs.org", target: "_blank" }, "Clew Labs");
  const [label, arrow, words] = a.children;
  assert.equal(label.text, "Clew Labs");
  assert.equal(arrow.attrs["aria-hidden"], "true");
  assert.equal(arrow.children[0].text, " ↗");
  assert.equal(words.attrs.class, "sr-only");
  assert.equal(words.children[0].text, NEW_TAB);
  assert.equal(NEW_TAB, " (opens in a new tab)");
  assert.equal(el("a", { href: "/x" }, "x").children.length, 1); // same-tab links are unchanged
});

test("attributes: true is a bare attribute; false, null and undefined are skipped; others are text", () => {
  const node = el("button", {
    type: "button",
    hidden: true,
    "aria-pressed": false,
    id: null,
    tabindex: 0,
    class: "a b",
  });
  assert.deepEqual(node.attrs, { type: "button", hidden: "", tabindex: "0", class: "a b" });
});

test("value, checked, selected and disabled are set as properties", () => {
  const node = el("input", { type: "checkbox", checked: true, disabled: true, value: "x" });
  assert.equal(node.checked, true);
  assert.equal(node.disabled, true);
  assert.equal(node.value, "x");
  assert.equal("checked" in node.attrs, false);
});

test("checkAttr and checkTag are pure and accept ordinary input", () => {
  assert.doesNotThrow(() => checkAttr("aria-label", "Close"));
  assert.doesNotThrow(() => checkAttr("data-id", "<b>"));
  assert.doesNotThrow(() => checkAttr("href", 5));
});
