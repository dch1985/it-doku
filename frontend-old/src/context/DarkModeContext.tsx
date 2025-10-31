/**
 * DarkMode Context
 * Global Dark Mode State Management (FIXED)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

interface DarkModeProviderProps {
  children: ReactNode;
}

/**
 * Safe localStorage access with fallback
 */
const getStoredDarkMode = (): boolean => {
  try {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('LocalStorage not available or corrupted:', error);
  }
  
  // Fallback: Check system preference
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (error) {
    console.warn('matchMedia not available:', error);
    return false; // Default to light mode
  }
};

/**
 * Safe localStorage write with error handling
 */
const setStoredDarkMode = (value: boolean): void => {
  try {
    localStorage.setItem('darkMode', JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save dark mode preference:', error);
    // Continue without saving - not critical
  }
};

export const DarkModeProvider: React.FC<DarkModeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getStoredDarkMode);

  useEffect(() => {
    // Save to localStorage
    setStoredDarkMode(isDarkMode);
    
    // Update document class
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.warn('Failed to update dark mode class:', error);
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const setDarkMode = (value: boolean) => {
    setIsDarkMode(value);
  };

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = (): DarkModeContextType => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};
