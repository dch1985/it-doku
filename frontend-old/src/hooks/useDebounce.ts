/**
 * useDebounce Hook
 * Verzögert Updates um Performance zu verbessern
 */

import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';

/**
 * Debounced Value Hook
 * @param value - Der zu debouncende Wert
 * @param delay - Verzögerung in Millisekunden (default: 300ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    logger.debug('useDebounce: Setting up timer', { value, delay });
    
    const handler = setTimeout(() => {
      logger.debug('useDebounce: Updating debounced value', { value });
      setDebouncedValue(value);
    }, delay);

    // Cleanup: Clear timeout wenn value sich ändert
    return () => {
      logger.debug('useDebounce: Clearing timer');
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced Callback Hook
 * @param callback - Funktion die debounced werden soll
 * @param delay - Verzögerung in Millisekunden (default: 300ms)
 * @returns Debounced function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup beim Unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      logger.debug('useDebouncedCallback: Executing callback');
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };
}

export default useDebounce;
