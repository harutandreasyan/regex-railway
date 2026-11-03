import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "railway-theme";
const CHANGE_EVENT = "railway-themechange";
const lightQuery = "(prefers-color-scheme: light)";

const isTheme = (value: unknown): value is Theme => value === "light" || value === "dark";

const systemTheme = (): Theme => (window.matchMedia(lightQuery).matches ? "light" : "dark");

const readTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : systemTheme();
  } catch {
    return systemTheme();
  }
};

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(lightQuery);
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  query.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
    query.removeEventListener("change", onChange);
  };
};

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "dark" as const);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, readTheme() === "dark" ? "light" : "dark");
    } finally {
      window.dispatchEvent(new Event(CHANGE_EVENT));
    }
  }, []);

  return { theme, toggle };
}
