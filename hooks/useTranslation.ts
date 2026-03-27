import { useLanguage } from "@/context/language-provider";
import { TranslationKeys } from "@/locales";

/**
 * Custom hook for accessing translations throughout the app
 *
 * Usage:
 * const { t, language, setLanguage } = useTranslation();
 *
 * Example:
 * <Text>{t.common.loading}</Text>
 * <Text>{t.auth.welcomeBack}</Text>
 * <Text>{interpolate(t.home.welcomeBack, { username: "John" })}</Text>
 */
export const useTranslation = () => {
  const { language, setLanguage, t, isLoading } = useLanguage();

  console.log('🎣 useTranslation hook called, language:', language);
  console.log('🎣 setLanguage function exists?', !!setLanguage);
  console.log('🎣 setLanguage function:', setLanguage.toString().substring(0, 200));

  /**
   * Interpolates variables in translation strings
   * Example: interpolate("Hello {{name}}", { name: "John" }) => "Hello John"
   */
  const interpolate = (text: string, params?: Record<string, string | number>): string => {
    if (!params) return text;

    return Object.keys(params).reduce((result, key) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      return result.replace(regex, String(params[key]));
    }, text);
  };

  /**
   * Gets a translated string with optional interpolation
   * Example: translate("home.welcomeBack", { username: "John" })
   */
  const translate = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split(".");
    let value: any = t;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof value !== "string") {
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    }

    return interpolate(value, params);
  };

  return {
    t,
    language,
    setLanguage,
    isLoading,
    interpolate,
    translate,
  };
};

/**
 * Type-safe helper to get nested translation keys
 * Usage: const key = getTranslationKey(t => t.auth.welcomeBack);
 */
export type TranslationPath = (t: TranslationKeys) => string;

export const getTranslationKey = (path: TranslationPath): string => {
  const proxy = new Proxy({} as any, {
    get: (target, prop) => {
      return prop;
    },
  });
  return path(proxy);
};
