// shared/utils/detectLang.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";

export async function detectLang() {
  try {
    if (typeof window !== "undefined") {
      // ✅ Web
      const ui = localStorage.getItem("lang") || localStorage.getItem("sceneLang");
      if (ui) return normalize(ui);

      const nav = (navigator.language || "en").toLowerCase();
      if (nav.startsWith("ar")) return "arabic";
      if (nav.startsWith("fr")) return "french";
      return "english";
    } else {
      // ✅ React Native
      const ui = (await AsyncStorage.getItem("lang")) || (await AsyncStorage.getItem("sceneLang"));
      if (ui) return normalize(ui);

      const nav = (Localization.locale || "en").toLowerCase();
      if (nav.startsWith("ar")) return "arabic";
      if (nav.startsWith("fr")) return "french";
      return "english";
    }
  } catch {
    return "english";
  }
}

function normalize(v) {
  const s = String(v).toLowerCase();
  if (s.startsWith("ar")) return "arabic";
  if (s.startsWith("fr")) return "french";
  if (s.startsWith("en")) return "english";
  if (["arabic", "english", "french"].includes(s)) return s;
  return "english";
}
