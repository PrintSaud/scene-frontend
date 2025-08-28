// src/utils/detectLang.js
// Returns one of: "english" | "arabic" | "french"
export function detectLang() {
    // Prefer your app’s stored language (use the same key you use for UI)
    const ui = localStorage.getItem("lang") || localStorage.getItem("sceneLang");
    if (ui) return normalize(ui);
  
    // Fallback: browser language
    const nav = (navigator.language || "en").toLowerCase();
    if (nav.startsWith("ar")) return "arabic";
    if (nav.startsWith("fr")) return "french";
    return "english";
  }
  
  function normalize(v) {
    const s = String(v).toLowerCase();
    if (s.startsWith("ar")) return "arabic";
    if (s.startsWith("fr")) return "french";
    if (s.startsWith("en")) return "english";
    // support exact keys you use elsewhere
    if (["arabic", "english", "french"].includes(s)) return s;
    return "english";
  }
  