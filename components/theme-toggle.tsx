"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem("theme");

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      aria-label={`Switch to ${nextTheme} mode`}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-900 transition hover:border-neutral-400 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:border-neutral-600 dark:hover:bg-neutral-900"
      onClick={() => setTheme(nextTheme)}
      suppressHydrationWarning
      title={`Switch to ${nextTheme} mode`}
      type="button"
    >
      {theme === "dark" ? <Sun aria-hidden size={18} /> : <Moon aria-hidden size={18} />}
    </button>
  );
}
