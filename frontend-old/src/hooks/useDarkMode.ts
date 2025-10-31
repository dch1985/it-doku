import { useState, useEffect } from 'react';

interface UseDarkModeReturn {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

export const useDarkMode = (): UseDarkModeReturn => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Prüfe localStorage
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    
    // Fallback auf System-Präferenz
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [userPreference, setUserPreference] = useState<'light' | 'dark' | 'auto'>(() => {
    const saved = localStorage.getItem('themePreference');
    return (saved as 'light' | 'dark' | 'auto') || 'auto';
  });

  useEffect(() => {
    // Speichere Präferenz
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    localStorage.setItem('themePreference', userPreference);
    
    // Aktualisiere HTML data-theme attribute
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    
    // Meta theme-color für mobile Browser
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDarkMode ? '#1a1b25' : '#ffffff');
    }
  }, [isDarkMode, userPreference]);

  // Höre auf System-Änderungen
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Nur ändern wenn auf "auto" gestellt
      if (userPreference === 'auto') {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [userPreference]);

  const toggleDarkMode = (): void => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    setUserPreference(newMode ? 'dark' : 'light');
  };

  const setTheme = (theme: 'light' | 'dark' | 'auto'): void => {
    setUserPreference(theme);
    
    if (theme === 'auto') {
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemPreference);
    } else {
      setIsDarkMode(theme === 'dark');
    }
  };

  return { isDarkMode, toggleDarkMode, setTheme };
};