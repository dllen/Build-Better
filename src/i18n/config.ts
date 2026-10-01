import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslation from "../locales/en/translation.json";
import zhCNTranslation from "../locales/zh-CN/translation.json";
import zhTWTranslation from "../locales/zh-TW/translation.json";
import jaTranslation from "../locales/ja/translation.json";
import koTranslation from "../locales/ko/translation.json";
import deTranslation from "../locales/de/translation.json";
import frTranslation from "../locales/fr/translation.json";
import esTranslation from "../locales/es/translation.json";
import ptTranslation from "../locales/pt/translation.json";
import ruTranslation from "../locales/ru/translation.json";
import arTranslation from "../locales/ar/translation.json";

const resources = {
  en: { translation: enTranslation },
  "zh-CN": { translation: zhCNTranslation },
  "zh-TW": { translation: zhTWTranslation },
  ja: { translation: jaTranslation },
  ko: { translation: koTranslation },
  de: { translation: deTranslation },
  fr: { translation: frTranslation },
  es: { translation: esTranslation },
  pt: { translation: ptTranslation },
  ru: { translation: ruTranslation },
  ar: { translation: arTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag", "path", "subdomain"],
      lookupQuerystring: "lang",
      lookupCookie: "i18next",
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage", "cookie"],
    },
  });

// Sync i18n language with <html dir> for RTL support
i18n.on("languageChanged", (lng) => {
  const isRTL = lng === "ar";
  document.documentElement.dir = isRTL ? "rtl" : "ltr";
  document.documentElement.lang = lng;
});

// Apply initial RTL state (handles page refresh when lang is already cached)
const isRTL = i18n.language === "ar";
document.documentElement.dir = isRTL ? "rtl" : "ltr";
document.documentElement.lang = i18n.language || "en";

export default i18n;
