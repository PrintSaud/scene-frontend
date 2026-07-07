// scene-app/src/context/LanguageContext.js
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    useCallback,
  } from "react";
  import AsyncStorage from "@react-native-async-storage/async-storage";
  
  const LanguageContext = createContext({ language: "en", setLanguage: () => {} });
  
  export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState("en");
  
    // Load saved language on mount
    useEffect(() => {
      const loadLang = async () => {
        try {
          const savedLang = await AsyncStorage.getItem("lang");
          if (savedLang) {
            setLanguageState(savedLang);
          }
        } catch {
          setLanguageState("en");
        }
      };
      loadLang();
    }, []);
  
    // Setter: update state + storage
    const setLanguage = useCallback(async (lang) => {
      try {
        setLanguageState(lang);
        await AsyncStorage.setItem("lang", lang);
  
        // also update stored user if exists
        const meRaw = await AsyncStorage.getItem("user");
        if (meRaw) {
          const me = JSON.parse(meRaw);
          await AsyncStorage.setItem("user", JSON.stringify({ ...me, language: lang }));
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
  