import { en, TranslationKeys } from "./en";
import { hi } from "./hi";
import { mr } from "./mr";

export type LanguageCode = "en" | "hi" | "mr";

export const translations: Record<LanguageCode, TranslationKeys> = {
  en,
  hi,
  mr,
};

export type { TranslationKeys };
