// App state and the only caller of storage (shell design: screens never touch storage). Everything
// the browser provides comes in through `env`, so each path runs under node --test:
//   env.getStorage()  the storage lookup; it may throw, which counts as blocked (Block 4 deferral)
//   env.now()         milliseconds
//   env.download(name, text)   save a file to the player's disk; may throw
//   env.listen(fn)    subscribe to `storage` events from other tabs; returns an unsubscribe
//   env.reload()      reload the page
// Rule: nothing is ever written while `persist` is false (newer save, blocked storage, other tab).
import { clear as clearSaved, save } from "../storage/saveClear.js";
import { normalizeSettings, withSetting } from "../storage/settings.js";
import { KEY, load, readCorrupt } from "../storage/store.js";
import { createBackup } from "./backup.js";
import { createRoundRecord } from "./roundRecord.js";

export { summarize } from "./backup.js";

/** @param {{ getStorage: Function, now: () => number, download: Function, listen?: Function, reload?: Function }} env */
export function createApp(env) {
  let storage = null;
  let unlisten = null;
  const listeners = new Set();
  // newerSave: a save from a newer version is sitting untouched in storage (the Clear confirm says so)
  let state = {
    progress: null,
    settings: normalizeSettings({}),
    notice: null,
    persist: false,
    oldData: false,
    newerSave: false,
    retry: null, // which action the exportFailed notice's "Try again" repeats
  };

  const set = (patch) => {
    state = { ...state, ...patch };
    for (const fn of [...listeners]) {
      try {
        fn(state);
      } catch {
        // a broken screen must not stop the state or the other screens
      }
    }
  };
  const adopt = (progress, patch = {}) =>
    set({ progress, settings: normalizeSettings(progress.settings), ...patch });
  const hasOldData = () => readCorrupt(storage) !== null;

  /** Save only when allowed; a failed save keeps the game running and shows its notice. */
  /** Save now. `failNotice` replaces saveFailed when what failed was a setting, not a round. */
  function persistNow(progress, failNotice = null) {
    if (!state.persist) return false;
    const r = save(storage, progress);
    if (r.notice) set({ notice: r.notice === "saveFailed" && failNotice ? failNotice : r.notice });
    return r.notice === null;
  }

  function onStorageEvent(e) {
    // key null means another tab cleared storage; anything but our own key is not ours to care about
    if (!e || (e.key !== KEY && e.key !== null) || !state.persist) return;
    set({ persist: false, notice: "otherTab" });
  }

  const backup = createBackup({
    getState: () => state,
    set,
    adopt,
    persistNow,
    getStorage: () => storage,
    env,
  });

  const app = {
    get state() {
      return state;
    },
    /** @param {(s: typeof state) => void} fn @returns {() => void} unsubscribe */
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    /** Look up storage (wrapped), load, and start listening for other tabs. */
    start() {
      app.stop(); // never listen twice
      try {
        storage = env.getStorage() ?? null;
      } catch {
        storage = null;
      }
      const r = load(storage, env.now());
      const newerSave = r.notice === "newer";
      adopt(r.progress, { notice: r.notice, persist: r.persist, oldData: hasOldData(), newerSave });
      try {
        unlisten = env.listen?.(onStorageEvent) ?? null;
      } catch {
        unlisten = null;
      }
      return state;
    },
    stop() {
      try {
        unlisten?.();
      } catch {
        // nothing to undo
      }
      unlisten = null;
    },
    /** Change one setting. Throws on a key or value the Settings screen never offers. */
    setSetting(key, value) {
      const progress = { ...state.progress, settings: withSetting(state.settings, key, value) };
      adopt(progress);
      persistNow(progress, "settingsFailed");
    },
    dismissPrivacy() {
      app.setSetting("privacySeen", true);
    },
    dismissNotice() {
      set({ notice: null });
    },
    ...backup,
    ...createRoundRecord({ getState: () => state, adopt, persistNow, set }),
    /** Remove the save and the old-data copy. The screen asks first. */
    clear() {
      backup.dropPreview();
      const r = clearSaved(storage, env.now());
      // the newer save is gone only if the removal worked
      adopt(r.progress, {
        notice: r.notice,
        persist: r.persist,
        oldData: hasOldData(),
        newerSave: r.persist ? false : state.newerSave,
      });
      return r.notice;
    },
    reload() {
      try {
        env.reload?.();
      } catch {
        // the notice stays; nothing else to do
      }
    },
  };
  return app;
}
