// The SVG builder refuses anything outside its four tags and fixed attributes.
import assert from "node:assert/strict";
import { test } from "node:test";
import { makeFakeDoc } from "./fakeDom.js";
import { createSvg } from "./svg.js";

const s = createSvg(makeFakeDoc());

test("the mock's ghost and terminal icons build", () => {
  const ghost = s("svg", { viewBox: "0 0 24 24", width: 28, height: 31, "aria-hidden": "true" }, [
    s("path", {
      d: "M4 20V10a8 8 0 0 1 16 0v10l-3-2-2.5 2-2.5-2-2.5 2-2.5-2-3 2z",
      fill: "none",
      stroke: "#4FE3D1",
      "stroke-width": 1.6,
    }),
    s("rect", { x: 8.4, y: 9, width: 2, height: 2.6, fill: "#4FE3D1" }),
    s("circle", { cx: 4, cy: 4, r: 3, fill: "rgba(79,227,209,0.08)" }),
  ]);
  assert.equal(ghost.tag, "svg");
  assert.equal(ghost.ns, "http://www.w3.org/2000/svg");
  assert.equal(ghost.children.length, 3);
  assert.equal(ghost.attrs.viewBox, "0 0 24 24");
});

test("tags outside the four are refused", () => {
  for (const tag of ["script", "text", "a", "foreignObject", "image", "use", "style", "g"]) {
    assert.throws(() => s(tag), TypeError, tag);
  }
});

test("attributes outside each tag's list are refused, events and links included", () => {
  for (const [tag, name, value] of [
    ["svg", "onload", "x()"],
    ["path", "href", "#x"],
    ["rect", "style", "fill:red"],
    ["circle", "onclick", "x"],
    ["path", "xlink:href", "javascript:x"],
    ["svg", "innerHTML", "<script>"],
  ]) {
    assert.throws(() => s(tag, { [name]: value }), TypeError, `${tag} ${name}`);
  }
});

test("values are checked: numbers, path data and colors only", () => {
  for (const [tag, name, value] of [
    ["rect", "x", "1;alert(1)"],
    ["path", "d", "M0 0 url(x)"],
    ["path", "fill", "url(#x)"],
    ["path", "stroke", "javascript:x"],
    ["svg", "viewBox", "0 0 a b"],
    ["svg", "role", "button"],
    ["svg", "aria-hidden", "false"],
    ["rect", "class", 'a"b'],
  ]) {
    assert.throws(() => s(tag, { [name]: value }), TypeError, `${tag} ${name}=${value}`);
  }
});

test("only svg children go inside, never HTML or text", () => {
  const doc = makeFakeDoc();
  const s2 = createSvg(doc);
  assert.throws(() => s2("svg", {}, [doc.createElement("div")]), TypeError);
  assert.throws(() => s2("svg", {}, [doc.createTextNode("x")]), TypeError);
});
