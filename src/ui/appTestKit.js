// A stand-in browser for the app tests: storage that can refuse any call, a download list, a
// reload counter and storage events. Used only by *.test.js files; main.js never imports it.

export const NOW = 1_800_000_000_000;

/**
 * @param {object} [o]
 * @param {Record<string, string>} [o.initial] What is already saved.
 * @param {string[]} [o.throwOn] Storage methods that throw.
 * @param {string[]} [o.failSet] Keys that setItem refuses (a full disk).
 * @param {boolean} [o.lookupThrows] The `localStorage` lookup itself throws.
 * @param {boolean} [o.noStorage] The lookup returns null.
 * @param {boolean} [o.downloadThrows] The download throws.
 */
export function makeEnv({
  initial = {},
  throwOn = [],
  failSet = [],
  lookupThrows = false,
  noStorage = false,
  downloadThrows = false,
} = {}) {
  const data = new Map(Object.entries(initial));
  const calls = [];
  const wrap =
    (name, fn) =>
    (...args) => {
      calls.push([name, ...args]);
      if (throwOn.includes(name)) throw new Error(`${name} is blocked`);
      return fn(...args);
    };
  const storage = {
    getItem: wrap("getItem", (k) => (data.has(k) ? data.get(k) : null)),
    setItem: wrap("setItem", (k, v) => {
      if (failSet.includes(k)) throw new Error("quota exceeded");
      data.set(k, String(v));
    }),
    removeItem: wrap("removeItem", (k) => data.delete(k)),
  };
  const listeners = new Set();
  const downloads = [];
  const counts = { reloads: 0, lookups: 0 };
  const env = {
    getStorage: () => {
      counts.lookups++;
      if (lookupThrows) throw new Error("SecurityError");
      return noStorage ? null : storage;
    },
    now: () => NOW,
    download: (name, text) => {
      if (downloadThrows) throw new Error("download blocked");
      downloads.push({ name, text });
    },
    listen: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    reload: () => {
      counts.reloads++;
    },
  };
  return {
    env,
    data,
    calls,
    downloads,
    listeners,
    counts,
    emit: (event) => {
      for (const fn of [...listeners]) fn(event);
    },
    /** setItem and removeItem calls so far. */
    writes: () => calls.filter(([n]) => n === "setItem" || n === "removeItem").length,
  };
}
