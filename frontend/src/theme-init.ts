/** Aplica classe `dark` antes do React hidratar (evita flash). */
const STORAGE_KEY = "app_theme_mode";

export function initThemeFromStorage() {
  if (typeof document === "undefined") return;
  const mode = localStorage.getItem(STORAGE_KEY);
  const root = document.documentElement;
  const setDark = (on: boolean) => {
    if (on) root.classList.add("dark");
    else root.classList.remove("dark");
  };
  if (mode === "dark") setDark(true);
  else if (mode === "light") setDark(false);
  else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
}
