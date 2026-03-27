// context/language-provider.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations, LanguageCode, TranslationKeys } from "@/locales";

const LANGUAGE_STORAGE_KEY = "@mandigo_language";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  t: TranslationKeys;
  isLoading: boolean;
}

const fallbackContext: LanguageContextType = {
  language: "en",
  setLanguage: async (lang: LanguageCode) => {
    console.warn("Fallback setLanguage called before LanguageProvider mounted. Ignoring.", lang);
    return Promise.resolve();
  },
  t: translations["en"],
  isLoading: true,
};

const LanguageContext = createContext<LanguageContextType>(fallbackContext);

interface LanguageProviderProps { children: ReactNode; }

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadLanguagePreference(); }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage === "en" || savedLanguage === "hi" || savedLanguage === "mr") {
        setLanguageState(savedLanguage as LanguageCode);
      }
    } catch (error) {
      console.error("Error loading language preference:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = useCallback(async (lang: LanguageCode) => {
    try {
      // Update state first so consumers re-render immediately
      setLanguageState(lang);
      // Persist; don't block state update
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang).catch((e) => {
        console.error("Failed to persist language:", e);
      });
    } catch (error) {
      console.error("Error in setLanguage:", error);
      throw error;
    }
  }, []);

  const value: LanguageContextType = useMemo(() => ({
    language,
    setLanguage,
    t: translations[language],
    isLoading,
  }), [language, isLoading, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) return fallbackContext;
  return context;
};
