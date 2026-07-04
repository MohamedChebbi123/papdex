import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "./locales/en.json"
import fr from "./locales/fr.json"
import ar from "./locales/ar.json"

export const RTL_LANGUAGES = new Set(["ar"])

export function applyDocumentDirection(language: string) {
  document.documentElement.lang = language
  document.documentElement.dir = RTL_LANGUAGES.has(language) ? "rtl" : "ltr"
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    ar: { translation: ar },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})

applyDocumentDirection(i18n.language)

export default i18n
