import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

export type Lang = "fr" | "en";

type LangContextValue = {
  lang: Lang;
  toggleLang: () => void;
};

const LangContext = createContext<LangContextValue | undefined>(undefined);

const LANG_STORAGE_KEY = "woodtech-lang";

type LangSubscriber = (lang: Lang) => void;

// Systeme de pub/sub tres simple pour permettre aux utilitaires hors React de reagir aux changements.
const subscribers = new Set<LangSubscriber>();
let currentLang: Lang = "fr";

const notifySubscribers = (lang: Lang) => {
  subscribers.forEach((callback) => callback(lang));
};

export const subscribeToLang = (callback: LangSubscriber) => {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
};

export const getCurrentLang = () => currentLang;

const readInitialLang = (): Lang => {
  if (typeof window === "undefined") return "fr";
  const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
  return stored === "en" ? "en" : "fr";
};

// Provider responsable du stockage et de la diffusion de la langue courante.
export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const initial = readInitialLang();
    currentLang = initial;
    return initial;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  }, [lang]);

  useEffect(() => {
    currentLang = lang;
    notifySubscribers(lang);
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLangState((previous) => (previous === "fr" ? "en" : "fr"));
  }, []);

  const contextValue = useMemo(
    () => ({
      lang,
      toggleLang
    }),
    [lang, toggleLang]
  );

  return <LangContext.Provider value={contextValue}>{children}</LangContext.Provider>;
}

// Hook d'acces a la langue avec verif du provider.
export function useLang() {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error("useLang must be used within a LangProvider");
  }
  return context;
}
