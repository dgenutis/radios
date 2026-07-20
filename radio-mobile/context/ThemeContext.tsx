import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { loadThemeMode, saveThemeMode } from "../lib/storage";

export type ThemeMode = "system" | "light" | "dark";

type ThemeColors = {
  background: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentText: string;
  danger: string;
};

type ThemeContextType = {
  themeMode: ThemeMode;
  activeTheme: "light" | "dark";
  colors: ThemeColors;
  setTheme: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const initTheme = async () => {
      const storedTheme = await loadThemeMode();
      setThemeMode(storedTheme);
    };

    initTheme();
  }, []);

  const activeTheme: "light" | "dark" =
    themeMode === "system"
      ? systemColorScheme === "light"
        ? "light"
        : "dark"
      : themeMode;

  const colors: ThemeColors =
    activeTheme === "dark"
      ? {
          background: "#0f172a",
          surface: "#1e293b",
          card: "#111827",
          border: "#1f2937",
          text: "#ffffff",
          textMuted: "#cbd5e1",
          textFaint: "#94a3b8",
          accent: "#38bdf8",
          accentText: "#082f49",
          danger: "#f87171",
        }
      : {
          background: "#f8fafc",
          surface: "#e2e8f0",
          card: "#ffffff",
          border: "#cbd5e1",
          text: "#0f172a",
          textMuted: "#334155",
          textFaint: "#64748b",
          accent: "#0ea5e9",
          accentText: "#ffffff",
          danger: "#dc2626",
        };

  const setTheme = async (mode: ThemeMode) => {
    setThemeMode(mode);
    await saveThemeMode(mode);
  };

  const value = useMemo(
    () => ({
      themeMode,
      activeTheme,
      colors,
      setTheme,
    }),
    [themeMode, activeTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used inside ThemeProvider");
  }

  return context;
}
