import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend"; // For loading translations from a backend
import LanguageDetector from "i18next-browser-languagedetector"; // To detect user language

i18n
  .use(HttpApi) // Load translations using http (default public/locales)
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass the i18n instance to react-i18next
  .init({
    fallbackLng: "en", // Default language
    debug: process.env.NODE_ENV === "development", // Enable debug mode in development
    ns: ["common"], // Namespaces
    defaultNS: "common",
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json", // Path to translation files
    },
    react: {
      useSuspense: true, // Recommended for Next.js with App Router
    },
  });

export default i18n;
