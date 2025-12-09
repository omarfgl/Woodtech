import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

export type ThemeName = "noyer" | "frene";

type ThemeContextValue = {
  theme: ThemeName;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "woodtech-theme";

const readInitialTheme = (): ThemeName => {
  if (typeof window === "undefined") {
    return "noyer";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "frene" ? "frene" : "noyer";
};

const syncDocumentTheme = (theme: ThemeName) => {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
};

// Provider qui pilote la palette (noyer/frene) et la persiste dans localStorage.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const initial = readInitialTheme();
    if (typeof document !== "undefined") {
      syncDocumentTheme(initial);
    }
    return initial;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    syncDocumentTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === "noyer" ? "frene" : "noyer"));
  }, []);

  const contextValue = useMemo(
    () => ({
      theme,
      toggleTheme
    }),
    [theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
  );
}

// Hook securise pour acceder au contexte theme.
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
