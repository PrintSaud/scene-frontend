// src/utils/translator.js
// Free, immediate stub: returns original text(s) without calling any API.
// Keeps the same shape so you can switch to a real provider later.

let warned = false;
function warnOnce() {
  if (!warned) {
    warned = true;
    // eslint-disable-next-line no-console
    console.info("🌐 translateText: running in NO-OP mode (no billing).");
  }
}

export async function translateText(input, _targetLang = "ar", _opts = {}) {
  warnOnce();
  if (!input) return input;

  // Preserve the exact API shape you already use
  if (Array.isArray(input)) return input;      // batch → return same array
  return input;                                 // single → return same string
}

// If you had a cancel function in use:
export function cancelTranslate() {
  // nothing to cancel in no-op mode
}
