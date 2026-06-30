import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'light'
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return {
    isDark: theme === 'dark',
    toggle: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')),
  };
}
