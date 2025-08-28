// src/context/LanguageContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

function readUserLanguage() {
  try {
    const me = JSON.parse(localStorage.getItem("user"));
    if (me?.language) return me.language;
    const fallback = localStorage.getItem("lang");
    return fallback || "en";
  } catch {
    return "en";
  }
}

// 🔒 Lock layout to LTR but update <html lang>
function applyDocumentLang(lang) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
    document.documentElement.dir = "ltr"; // always LTR, no flipping
  }
}

function removeLegacyGlobalKey() {
  try {
    localStorage.removeItem("language"); // cleanup old key
  } catch {}
}

const LanguageContext = createContext({ language: "en", setLanguage: () => {} });

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(readUserLanguage);

  // Apply language before paint
  useLayoutEffect(() => {
    applyDocumentLang(language);
  }, [language]);

  // One-time cleanup of legacy storage key
  useEffect(() => {
    removeLegacyGlobalKey();
  }, []);

  // Setter: update state + storage
  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    try {
      // save standalone key
      localStorage.setItem("lang", lang);

      // also update stored user if exists
      const me = JSON.parse(localStorage.getItem("user"));
      if (me) {
        localStorage.setItem("user", JSON.stringify({ ...me, language: lang }));
      }
    } catch {}
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
