import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    // Sync with whatever the DOM currently says (ThemeToggle may have already applied it)
    setIsDark(document.documentElement.classList.contains('dark'));

    // Watch for class changes so all consumers re-render when the toggle fires
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    // No setIsDark needed — MutationObserver fires and updates all consumers
  };

  return { isDark, toggle };
}
