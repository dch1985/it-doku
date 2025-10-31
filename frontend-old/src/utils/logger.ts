/**
 * Logger Utility
 * Zentrales Logging-System mit Environment-basierter Konfiguration
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LoggerConfig {
  enabledInProduction: boolean;
  enabledLevels: LogLevel[];
}

const config: LoggerConfig = {
  enabledInProduction: false, // In Production nur Errors
  enabledLevels: ['log', 'info', 'warn', 'error', 'debug'],
};

const isDevelopment = import.meta.env.MODE === 'development';

/**
 * Prüft ob ein Log-Level aktiv ist
 */
const isLevelEnabled = (level: LogLevel): boolean => {
  if (level === 'error') return true; // Errors immer loggen
  if (isDevelopment) return config.enabledLevels.includes(level);
  return config.enabledInProduction;
};

/**
 * Formatiert Timestamp für Logs
 */
const getTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Formatiert Log-Nachricht mit Kontext
 */
const formatMessage = (level: LogLevel, message: string, ...args: any[]): any[] => {
  if (isDevelopment) {
    return [`[${getTimestamp()}] [${level.toUpperCase()}]`, message, ...args];
  }
  return [message, ...args];
};

export const logger = {
  /**
   * Standard Log (Development only)
   */
  log: (message: string, ...args: any[]): void => {
    if (isLevelEnabled('log')) {
      console.log(...formatMessage('log', message, ...args));
    }
  },

  /**
   * Info Log (Development only)
   */
  info: (message: string, ...args: any[]): void => {
    if (isLevelEnabled('info')) {
      console.info(...formatMessage('info', message, ...args));
    }
  },

  /**
   * Warning Log (Immer aktiv)
   */
  warn: (message: string, ...args: any[]): void => {
    if (isLevelEnabled('warn')) {
      console.warn(...formatMessage('warn', message, ...args));
    }
  },

  /**
   * Error Log (Immer aktiv)
   */
  error: (message: string, error?: unknown, ...args: any[]): void => {
    if (isLevelEnabled('error')) {
      const errorDetails = error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : error;
      
      console.error(...formatMessage('error', message, errorDetails, ...args));
      
      // Hier könnte Integration mit Error-Tracking-Service (z.B. Sentry)
      // if (window.Sentry) {
      //   window.Sentry.captureException(error);
      // }
    }
  },

  /**
   * Debug Log (Development only, detailliert)
   */
  debug: (message: string, data?: any): void => {
    if (isLevelEnabled('debug')) {
      console.debug(...formatMessage('debug', message));
      if (data !== undefined) {
        console.debug('Debug Data:', data);
      }
    }
  },

  /**
   * Gruppierte Logs (Development only)
   */
  group: (label: string, callback: () => void): void => {
    if (isDevelopment) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  },

  /**
   * Table Log für Arrays/Objects (Development only)
   */
  table: (data: any): void => {
    if (isDevelopment) {
      console.table(data);
    }
  },

  /**
   * Performance Messung
   */
  time: (label: string): void => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  timeEnd: (label: string): void => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  },
};

export default logger;
