// Job: decide whether a key press is one typed character for the engine (rounds and lessons).

/**
 * Is this key press one character for the engine (not Shift, Tab, Backspace or a shortcut)?
 * AltGr (Windows reports Ctrl+Alt) and Option (Mac reports Alt) type ñ ¿ ¡ ü on the layouts the
 * Spanish hint names, so with Alt held a key counts when AltGraph is on or the character is not
 * ASCII. Ctrl alone and Meta are always shortcuts (a11y audit, Nov 13).
 */
export const isTyping = (e) => {
  if (typeof e?.key !== "string" || [...e.key].length !== 1 || e.metaKey) return false;
  if (!e.altKey) return !e.ctrlKey;
  return e.getModifierState?.("AltGraph") === true || e.key.codePointAt(0) > 127;
};
