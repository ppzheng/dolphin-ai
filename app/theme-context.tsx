"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Theme = "dark" | "light";
interface Ctx { theme: Theme; toggle: () => void; }
const ThemeContext = createContext<Ctx>({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    try {
      const s = localStorage.getItem("dolphin_theme") as Theme | null;
      if (s === "light" || s === "dark") setTheme(s);
    } catch {}
  }, []);
  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try { localStorage.setItem("dolphin_theme", next); } catch {}
  }
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
