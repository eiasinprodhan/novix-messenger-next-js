'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

type Theme = 'light' | 'dark';

interface AdminThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const AdminThemeContext = createContext<AdminThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useAdminTheme = () => useContext(AdminThemeContext);

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = (localStorage.getItem('novix_theme') || localStorage.getItem('novix_admin_theme')) as Theme | null;
      if (stored === 'light' || stored === 'dark') {
        setThemeState(stored);
        applyTheme(stored);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initial = prefersDark ? 'dark' : 'light';
        setThemeState(initial);
        applyTheme(initial);
      }
    } catch {
      applyTheme('dark');
    }
    setMounted(true);
  }, []);

  const applyTheme = (t: Theme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    if (t === 'dark') {
      root.classList.add('dark');
      body?.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      body?.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      localStorage.setItem('novix_theme', newTheme);
      localStorage.setItem('novix_admin_theme', newTheme);
    } catch (_) {}
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <div className={mounted ? (theme === 'dark' ? 'dark' : '') : 'dark'} style={{ minHeight: '100%' }}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function ThemeToggleButton({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useAdminTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      className={`relative p-2 rounded-xl border transition-all duration-200 flex items-center justify-center ${
        theme === 'dark'
          ? 'bg-slate-800/80 border-slate-700/60 text-amber-400 hover:bg-slate-700 hover:text-amber-300 shadow-xs'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-blue-600 shadow-xs'
      } ${className}`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun size={18} className="transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon size={18} className="transition-transform duration-300 -rotate-12 hover:rotate-0 text-slate-700" />
      )}
    </button>
  );
}
