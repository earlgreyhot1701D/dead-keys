// Export, import and the damaged-copy download (shell Req 5.3, 5.4), split from app.js at the line
// cap. app.js hands in the pieces these actions need; nothing here touches storage except through
// them, and every action is wrapped so a failure is a result, never a crash.
import { exportText, importText } from "../storage/exportImport.js";
import { readCorrupt } from "../storage/store.js";

/**
 * What an import would bring, in numbers the screen can show next to what the player has now.
 * @param {import("../../contract/types.js").Progress} p
 */
export function summarize(p) {
  return {
    rounds: p.rounds.length,
    keysTracked: p.keys.length,
    lessonsPassed: p.lessonsPassed.length,
    milestones: p.milestones.length,
    streakDays: p.dayStreak.count,
    createdAt: p.createdAt,
  };
}

/**
 * @param {object} io
 * @param {() => { progress: any }} io.getState
 * @param {(patch: object) => void} io.set Change the app state.
 * @param {(progress: any, patch?: object) => void} io.adopt Make this the app's progress.
 * @param {(progress: any) => boolean} io.persistNow Save if saving is allowed.
 * @param {() => any} io.getStorage The storage app.js looked up, or null.
 * @param {{ now: () => number, download: (name: string, text: string) => void }} io.env
 */
export function createBackup({ getState, set, adopt, persistNow, getStorage, env }) {
  let pending = null; // a checked import waiting for the player's yes
  return {
    /** @returns {{ ok: boolean, reason?: string }} Never throws; a failure shows the exportFailed notice. */
    exportBackup() {
      try {
        env.download("dead-keys-backup.json", exportText(getState().progress));
        return { ok: true };
      } catch {
        set({ notice: "exportFailed" });
        return { ok: false, reason: "export" };
      }
    },
    /** Check a backup. Nothing changes until `confirmImport`. */
    previewImport(text) {
      const r = importText(text, env.now());
      if (!r.ok) {
        pending = null;
        set({ notice: "importFailed" });
        return { ok: false, reason: r.reason };
      }
      pending = r.progress;
      return { ok: true, current: summarize(getState().progress), incoming: summarize(r.progress) };
    },
    cancelImport() {
      pending = null;
    },
    /** Replace the progress with the previewed backup. Saved only if saving is allowed. */
    confirmImport() {
      if (!pending) return { ok: false, saved: false };
      const progress = pending;
      pending = null;
      adopt(progress, { notice: null });
      return { ok: true, saved: persistNow(progress) };
    },
    /** Forget a preview (a clear or a reload makes it stale). */
    dropPreview() {
      pending = null;
    },
    /** The damaged copy, as a download. A download the browser refuses shows exportFailed too. */
    downloadOldData() {
      const text = readCorrupt(getStorage());
      if (text === null) return { ok: false, reason: "none" };
      try {
        env.download("dead-keys-old-data.json", text);
        return { ok: true };
      } catch {
        set({ notice: "exportFailed" });
        return { ok: false, reason: "download" };
      }
    },
  };
}
