'use client';

import React, { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY, type ThemePreference, resolveTheme, isThemePreference } from '@/src/lib/theme';

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const THEME_CHANGE_EVENT = 'wellsync-theme-change';

function getThemeSnapshot() {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(stored) ? stored : 'system';
}

function getThemeServerSnapshot() {
  return 'system' as ThemePreference;
}

function subscribeToThemeChange(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(THEME_CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, listener);
  };
}

function getSystemPrefersDarkSnapshot() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getSystemPrefersDarkServerSnapshot() {
  return false;
}

function subscribeToSystemPreferenceChange(listener: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => listener();
  media.addEventListener('change', handler);
  return () => media.removeEventListener('change', handler);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeToThemeChange, getThemeSnapshot, getThemeServerSnapshot);
  const systemPrefersDark = useSyncExternalStore(
    subscribeToSystemPreferenceChange,
    getSystemPrefersDarkSnapshot,
    getSystemPrefersDarkServerSnapshot,
  );
  const resolvedTheme = resolveTheme(theme, systemPrefersDark);

  const setTheme = (nextTheme: ThemePreference) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  React.useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
