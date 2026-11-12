// A tiny fake document for the UI tests that run under node: elements with attributes, children,
// listeners, focus, click and the dialog methods. Used only by *.test.js files; the build never
// imports it. It supports just what the components under test touch.

export function makeFakeDoc() {
  const doc = { activeElement: null };

  const text = (t) => ({ nodeType: 3, text: String(t) });
  function element(tag) {
    const node = {
      nodeType: 1,
      tag,
      attrs: {},
      children: [],
      listeners: {},
      parent: null,
      setAttribute(k, v) {
        this.attrs[k] = v;
      },
      getAttribute(k) {
        return this.attrs[k] ?? null;
      },
      appendChild(c) {
        c.parent = this;
        this.children.push(c);
        return c;
      },
      append(...cs) {
        for (const c of cs) this.appendChild(c);
      },
      replaceChildren(...cs) {
        this.children = [];
        this.append(...cs);
      },
      remove() {
        if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this);
        this.parent = null;
      },
      addEventListener(type, fn) {
        this.listeners[type] = fn;
      },
      focus() {
        doc.activeElement = this;
      },
      click() {
        this.clicks = (this.clicks ?? 0) + 1;
        this.listeners.click?.({ type: "click" });
      },
      showModal() {
        this.attrs.open = "";
        this.modal = true;
      },
      close() {
        delete this.attrs.open;
      },
    };
    return node;
  }

  doc.createElement = element;
  doc.createElementNS = (ns, tag) => Object.assign(element(tag), { ns, namespaceURI: ns });
  doc.createTextNode = text;
  doc.body = element("body");
  doc.querySelector = (selector) => {
    if (selector !== "dialog[open]")
      throw new Error(`the fake doc only knows "dialog[open]", not "${selector}"`);
    return findAll(doc.body, (n) => n.tag === "dialog" && "open" in n.attrs)[0] ?? null;
  };
  return doc;
}

/**
 * Make the fake the page's `document` while `fn` runs, so a screen's `el()` works under node.
 * The real global (there is none under node) is put back afterwards, even if `fn` throws.
 */
export function withFakeDocument(fn) {
  const had = Object.hasOwn(globalThis, "document");
  const before = globalThis.document;
  const doc = makeFakeDoc();
  globalThis.document = doc;
  try {
    return fn(doc);
  } finally {
    if (had) globalThis.document = before;
    else delete globalThis.document;
  }
}

/** Every element under `node` (and `node` itself) that matches. */
export function findAll(node, test) {
  const out = test(node) ? [node] : [];
  for (const c of node.children ?? []) out.push(...findAll(c, test));
  return out;
}

/** All the text under a node, in order. */
export const textOf = (node) =>
  node.nodeType === 3 ? node.text : (node.children ?? []).map(textOf).join("");
