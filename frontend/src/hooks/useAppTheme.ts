import { useEffect, useState } from "react";

export type AppThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "app_theme_mode";

export function readStoredTheme(): AppThemeMode {
  if (typeof window === "undefined") return "system";
  const s = localStorage.getItem(STORAGE_KEY);
  if (s === "light" || s === "dark" || s === "system") return s;
  return "system";
}

function applyDomClass(mode: AppThemeMode) {
  const root = document.documentElement;
  const setDark = (on: boolean) => {
    if (on) root.classList.add("dark");
    else root.classList.remove("dark");
  };
  if (mode === "dark") setDark(true);
  else if (mode === "light") setDark(false);
  else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
}

export function useAppTheme() {
  const [mode, setMode] = useState<AppThemeMode>(readStoredTheme);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    applyDomClass(mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyDomClass("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  return [mode, setMode] as const;
}
