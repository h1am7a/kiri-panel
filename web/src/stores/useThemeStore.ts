import { create } from 'zustand';

export type AppTheme = 'dark' | 'light' | 'cyber';

interface ThemeState {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  cycleTheme: () => void;
}

const STORAGE_KEY = 'kiri_theme';

function applyThemeToDocument(theme: AppTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('dark', 'light', 'cyber');
  root.classList.add(theme);
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme === 'light' ? 'light' : 'dark';
}

function getInitialTheme(): AppTheme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as AppTheme | null;
    if (saved && (saved === 'dark' || saved === 'light' || saved === 'cyber')) {
      return saved;
    }
    // Respect OS preference if none saved
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch (e) {
    console.warn('Failed to read theme from localStorage', e);
  }
  return 'dark';
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialTheme = getInitialTheme();
  if (typeof document !== 'undefined') {
    applyThemeToDocument(initialTheme);
  }

  return {
    theme: initialTheme,
    setTheme: (theme: AppTheme) => {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (e) {
        console.warn('Failed to save theme to localStorage', e);
      }
      applyThemeToDocument(theme);
      set({ theme });
    },
    cycleTheme: () => {
      const current = get().theme;
      const order: AppTheme[] = ['dark', 'light', 'cyber'];
      const next = order[(order.indexOf(current) + 1) % order.length];
      get().setTheme(next);
    },
  };
});
