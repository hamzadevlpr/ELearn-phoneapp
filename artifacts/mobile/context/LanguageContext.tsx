import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { I18nManager } from "react-native";
import ar from "@/i18n/ar";
import en from "@/i18n/en";

type Language = "ar" | "en";

interface LanguageContextValue {
  language: Language;
  isRTL: boolean;
  t: typeof ar;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>("ar");

  useEffect(() => {
    AsyncStorage.getItem("app_language").then((val) => {
      if (val === "ar" || val === "en") {
        setLangState(val);
        const rtl = val === "ar";
        I18nManager.allowRTL(rtl);
        I18nManager.forceRTL(rtl);
      } else {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
      }
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLangState(lang);
    AsyncStorage.setItem("app_language", lang);
    const rtl = lang === "ar";
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
  }, []);

  const t = language === "ar" ? ar : en;
  const isRTL = language === "ar";

  return (
    <LanguageContext.Provider value={{ language, isRTL, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
