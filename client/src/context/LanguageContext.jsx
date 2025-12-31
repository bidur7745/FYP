import React, { createContext, useContext, useState, useEffect } from "react";
import en from "../locales/en.json";
import ne from "../locales/ne.json";

// 1. Map available languages
const translations = {
    en,
    ne
};

const LanguageContext = createContext();

// 2. Provider
export const LanguageProvider = ({ children }) => {
    const [locale, setLocale] = useState("en");
    const [content, setContent] = useState(en);

    // Load from localStorage on first load
    useEffect(() => {
        const saved = localStorage.getItem("km_lang");
        if (saved && translations[saved]) {
            setLocale(saved);
            setContent(translations[saved]);
        }
    }, []);

    // Change Language
    const changeLanguage = (langCode) => {
        if (!translations[langCode]) return;
        setLocale(langCode);
        setContent(translations[langCode]);
        localStorage.setItem("km_lang", langCode);
    };

    // Translation function for nested keys: t("home.hero.title")
    const t = (path) => {
        const keys = path.split(".");
        let value = content;

        for (let key of keys) {
            value = value?.[key];
            if (value === undefined) {
                console.warn(`Missing translation for: ${path}`);
                return path; // fallback
            }
        }
        return value;
    };

    return (
        <LanguageContext.Provider value={{ locale, changeLanguage, content, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

// 3. Hook for importing easily
export const useLanguage = () => useContext(LanguageContext);
