import { useState, useEffect } from 'react';
import { getSettings, saveSettings, type ThemePreference } from '@/shared/storage';

function resolveIsDark(preference: ThemePreference): boolean {
  return (
    preference === 'dark' ||
    (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [isDark, setIsDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSettings().then((s) => {
      setThemeState(s.theme);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const apply = (preference: ThemePreference) => {
      const dark = resolveIsDark(preference);
      setIsDark(dark);
      document.documentElement.classList.toggle('dark', dark);
    };

    apply(theme);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => apply('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme, loaded]);

  const setTheme = async (preference: ThemePreference) => {
    setThemeState(preference);
    await saveSettings({ theme: preference });
  };

  const toggleTheme = async () => {
    const next = isDark ? 'light' : 'dark';
    await setTheme(next);
  };

  return { theme, isDark, setTheme, toggleTheme, loaded };
}
