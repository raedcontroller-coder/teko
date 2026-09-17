import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next, useTranslation as useReactI18next } from 'react-i18next';
import { pt, TranslationKeys } from './pt';
import { en } from './en';

export type Language = 'pt' | 'en';
export const STORAGE_KEY = '@teko_app_language';

// Inicialização do i18next
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v4',
      resources: {
        pt: { translation: pt },
        en: { translation: en },
      },
      lng: 'pt',
      fallbackLng: 'pt',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
} else {
  i18n.addResourceBundle('pt', 'translation', pt, true, true);
  i18n.addResourceBundle('en', 'translation', en, true, true);
}

// Helper para criar Proxy sobre a função t que permite acesso tanto t('key', params) quanto t.section.key
function createProxyT(tFunc: any, resourceObj: any): any {
  const handler: ProxyHandler<any> = {
    get(target, prop: string) {
      if (typeof prop === 'symbol' || prop === 'bind' || prop === 'apply' || prop === 'call' || prop === 'then') {
        return Reflect.get(target, prop);
      }
      const val = resourceObj ? resourceObj[prop] : undefined;
      if (typeof val === 'object' && val !== null) {
        return createProxyT((key: string, options?: any) => tFunc(`${prop}.${key}`, options), val);
      }
      if (typeof val === 'string') {
        const res = tFunc(prop);
        if (typeof res === 'string' && (res.includes('.') || res === prop)) {
          return val;
        }
        return res || val;
      }
      return createProxyT((key: string, options?: any) => tFunc(`${prop}.${key}`, options), {});
    }
  };
  return new Proxy(tFunc, handler);
}

export interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: 'pt',
  setLanguage: () => {},
  t: pt,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t: i18nT, i18n: i18nInstance } = useReactI18next();
  const [language, setLanguageState] = useState<Language>((i18nInstance.language as Language) || 'pt');

  useEffect(() => {
    const loadStoredLanguage = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'pt' || stored === 'en') {
          setLanguageState(stored);
          await i18nInstance.changeLanguage(stored);
        }
      } catch (e) {
        console.error('Failed to load language preference', e);
      }
    };
    loadStoredLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      await i18nInstance.changeLanguage(lang);
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.error('Failed to save language preference', e);
    }
  };

  const currentResources = language === 'en' ? en : pt;
  const proxiedT = createProxyT(i18nT, currentResources);

  return React.createElement(
    LanguageContext.Provider,
    { value: { language, setLanguage, t: proxiedT } },
    children
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context && context.language) {
    return context;
  }
  const { t: i18nT, i18n: i18nInstance } = useReactI18next();
  const currentLanguage = (i18nInstance.language as Language) || 'pt';
  const currentResources = currentLanguage === 'en' ? en : pt;
  const proxiedT = createProxyT(i18nT, currentResources);

  const setLanguage = async (lang: Language) => {
    await i18nInstance.changeLanguage(lang);
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  };

  return {
    language: currentLanguage,
    setLanguage,
    t: proxiedT,
  };
};

export default i18n;
